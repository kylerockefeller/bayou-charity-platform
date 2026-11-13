import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'pin-photos';

export async function uploadPinPhoto(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const ext = file.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() ?? 'jpg');
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function removeUploadedPinPhoto(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function removePinPhotoByUrl(
  supabase: SupabaseClient,
  photoUrl: string | null,
): Promise<string | null> {
  if (!photoUrl) return null;
  const path = pathFromPublicUrl(photoUrl);
  if (!path) return null;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error && !/not found|does not exist/i.test(error.message)) return error.message;
  return null;
}

function pathFromPublicUrl(photoUrl: string): string | null {
  try {
    const url = new URL(photoUrl);
    const marker = `/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}
