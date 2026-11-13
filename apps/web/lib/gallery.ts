// Single source of truth for the gallery storage-bucket contract.
//
// THE CONTRACT: a photo's `gallery_submissions.status` decides which bucket its
// URL points at — 'approved' → gallery-public, anything else → gallery-pending.
// That only works if approving a photo ALSO copies the object from
// gallery-pending into gallery-public BEFORE the status flips. The 2026-07
// broken-gallery bug happened because approval flipped the status but never
// moved the file: every approved photo's URL pointed at gallery-public while
// the object still lived in gallery-pending. If you touch the approve flow
// (AdminGalleryManager.handleApprove), keep the order: copy first, flip second,
// and never flip if the copy failed.
//
// Approval COPIES, it does not move: the pending object stays behind so
// reject-after-approve can fall back to it after the public copy is removed.
// Delete cleans both buckets (app/actions/gallery.ts).
//
// Trap: gallery-pending is a PRIVATE bucket (verified in prod storage.buckets).
// Public-style URLs for pending/rejected photos therefore 400 — pending
// thumbnails need a signed URL or an authenticated fetch to actually render.
// gallery-public IS public, so approved URLs serve anonymously.

import type { SupabaseClient } from '@supabase/supabase-js';

export const GALLERY_PENDING_BUCKET = 'gallery-pending';
export const GALLERY_PUBLIC_BUCKET = 'gallery-public';

// NEXT_PUBLIC_* env vars are inlined at build time, so this is safe to read in
// client components (no runtime env lookup in the browser).
const STORAGE_PUBLIC_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

export function galleryBucketForStatus(status: string): string {
  return status === 'approved' ? GALLERY_PUBLIC_BUCKET : GALLERY_PENDING_BUCKET;
}

export function galleryPhotoUrl(storagePath: string, status: string): string {
  return `${STORAGE_PUBLIC_BASE}/${galleryBucketForStatus(status)}/${storagePath}`;
}

// gallery-pending is private. Public URLs 400. Callers that render a
// pending or rejected thumbnail must use a signed URL instead.
export async function gallerySignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(GALLERY_PENDING_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// Copies a photo's object into gallery-public ahead of the status flip to
// 'approved'. EVERY approve path must call this before updating the row —
// there are two admin approve surfaces (AdminGalleryManager and the
// AdminGalleryPanel inside MemberGallery), and the original bug shipped
// because one flipped status without any copy at all.
//
// Idempotent: a duplicate/"already exists" response means the object is
// already in gallery-public (re-approve, or one of the objects hand-copied
// during the 2026-07 incident) — that is the desired end state, so it counts
// as success. Runs in the admin's own session: storage RLS grants admins
// SELECT on gallery-pending and INSERT on gallery-public.
//
// Returns null on success, or an error message the caller must surface —
// and on error the caller must NOT flip the status.
export async function copyPendingToPublic(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string | null> {
  const { error } = await supabase.storage
    .from(GALLERY_PENDING_BUCKET)
    .copy(storagePath, storagePath, { destinationBucket: GALLERY_PUBLIC_BUCKET });
  if (error && !/already exists|duplicate/i.test(error.message)) return error.message;
  return null;
}

// Removes the gallery-public copy (reject-after-approve) so the public bucket
// cannot serve an orphaned object. The pending original is untouched — approve
// copies, never moves. Returns null on success, or an error message; on error
// the caller must NOT flip the status to 'rejected'.
export async function removePublicCopy(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string | null> {
  const { error } = await supabase.storage
    .from(GALLERY_PUBLIC_BUCKET)
    .remove([storagePath]);
  return error ? error.message : null;
}
