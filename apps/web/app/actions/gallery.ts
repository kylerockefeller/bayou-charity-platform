'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@bayou/supabase/server';
import { GALLERY_PENDING_BUCKET, GALLERY_PUBLIC_BUCKET } from '@/lib/gallery';

// Deletes a gallery photo with the service role, but only after the caller's
// own session is confirmed as profiles.role = admin. Middleware is not enough:
// a server action can be invoked without going through that page.

export async function deleteGalleryPhoto(id: string, storagePath: string) {
  const cookieStore = await cookies();
  const userClient = createServerSupabaseClient({
    getAll() {
      return cookieStore.getAll();
    },
    // The session was just refreshed by middleware. Ignore cookie writes here.
    set() {},
  });

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    throw new Error('You must be signed in to delete a gallery photo.');
  }

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Only an admin can delete a gallery photo.');
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: pubErr } = await adminClient.storage.from(GALLERY_PUBLIC_BUCKET).remove([storagePath]);
  const { error: pendingErr } = await adminClient.storage.from(GALLERY_PENDING_BUCKET).remove([storagePath]);
  if (pubErr && pendingErr) {
    console.error('[deleteGalleryPhoto] storage delete failed both buckets:', pubErr.message, pendingErr.message);
  }

  const { error } = await adminClient.from('gallery_submissions').delete().eq('id', id);
  if (error) {
    console.error('[deleteGalleryPhoto] DB delete error:', error.message);
    throw new Error(error.message);
  }
}
