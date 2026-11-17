// Single source of truth for client-side photo upload size limits.
//
// This limit was previously duplicated as a hardcoded literal across four upload
// components (gallery UploadForm, MemberGallery, PinsMap, ProfileEditor). Raising
// it in one place left the others at 5 MB — which is why the cap "kept coming
// back." Import from here so there is one value to change.
//
// The browser uploads straight to Supabase Storage. This cap does not pass
// through the Cloudflare Worker or a Next.js server action.
//
// 25 MB covers full-resolution smartphone JPEGs that exceed 10 MB, and it
// stays under Supabase's 50 MB Free-plan global maximum. pin-photos and
// avatars were set to 10 MB in the Supabase dashboard (not in this repo).
// Those bucket limits still have to be raised there, or Storage rejects the
// file after this check passes. Gallery buckets inherit the project global
// limit.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_UPLOAD_LABEL = '25 MB';

// Stored photos are resized before upload so a phone original never lands in
// the bucket. Avatars are smaller. GIFs are left alone so animation survives.
export const UPLOAD_LONG_EDGE = 1600;
export const AVATAR_LONG_EDGE = 512;
export const UPLOAD_JPEG_QUALITY = 0.8;

// Accepted image types — the same list everywhere a photo can be picked.
// This was previously five hand-copied `accept="image/jpeg,..."` literals (and
// one bare `image/*` on the public gallery form that silently let HEIC into the
// review queue). GIF is deliberately included; HEIC/HEIF is deliberately NOT —
// browsers can't render it, so it must be rejected before upload, not after an
// admin approves a photo nobody can see.
export const ACCEPTED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

// Value for <input accept=...> — keep it derived so the picker filter and the
// validator can never disagree.
export const ACCEPTED_IMAGE_ACCEPT = ACCEPTED_IMAGE_MIME.join(',');

// Returns a user-facing error message, or null if the file is uploadable.
// Callers surface the message however they surface errors (setError, alert).
// The size message must keep matching /or smaller/i — e2e/upload.spec.ts
// asserts on that phrase for the size gate.
export function validateUploadFile(file: File): string | null {
  const typeError = acceptedTypeError(file);
  if (typeError) return typeError;
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File must be ${MAX_UPLOAD_LABEL} or smaller.`;
  }
  return null;
}

// Resize a photo, bake in EXIF orientation, and drop the rest of the EXIF
// (including GPS). Canvas JPEGs carry no EXIF. Non-images and GIFs are
// returned unchanged. Any failure returns the original file so the caller
// can still apply the size cap.
export async function prepareUploadFile(
  file: File,
  options?: { maxEdge?: number },
): Promise<{ file: File; error: string | null }> {
  const typeError = acceptedTypeError(file);
  if (typeError) return { file, error: typeError };

  let prepared = file;
  if (file.type !== 'image/gif') {
    try {
      prepared = await downscaleToJpeg(file, options?.maxEdge ?? UPLOAD_LONG_EDGE);
    } catch {
      prepared = file;
    }
  }

  if (prepared.size > MAX_UPLOAD_BYTES) {
    return { file: prepared, error: `File must be ${MAX_UPLOAD_LABEL} or smaller.` };
  }
  return { file: prepared, error: null };
}

function acceptedTypeError(file: File): string | null {
  if (!(ACCEPTED_IMAGE_MIME as readonly string[]).includes(file.type)) {
    return 'Please upload a JPEG, PNG, or WebP image. HEIC/HEIF files are not supported by web browsers.';
  }
  return null;
}

async function downscaleToJpeg(file: File, maxEdge: number): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file;
  // 'from-image' applies EXIF orientation to the pixels. The JPEG we encode
  // afterward has no EXIF, so GPS is not uploaded.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', UPLOAD_JPEG_QUALITY);
    });
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
