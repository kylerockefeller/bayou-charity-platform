'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@bayou/supabase/server';
import { isMissingCropColumn, sanitizeCrop, type PinCrop } from '@/lib/pin-crop';

// Saves a pin photo crop with the service role, only after the caller's
// session is confirmed as profiles.role = admin.

export async function updatePinPhotoCrop(
  pinId: string,
  crop: PinCrop,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!pinId) return { ok: false, error: 'Missing pin.' };
  const safe = sanitizeCrop(crop);

  try {
    const cookieStore = await cookies();
    const userClient = createServerSupabaseClient({
      getAll() {
        return cookieStore.getAll();
      },
      set() {},
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return { ok: false, error: 'You must be signed in.' };

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      return { ok: false, error: 'Only an admin can adjust a pin photo crop.' };
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return { ok: false, error: 'Crop saving is not configured on the server.' };
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await admin.from('pins').update({
      photo_crop_x: safe.x,
      photo_crop_y: safe.y,
      photo_crop_zoom: safe.zoom,
    }).eq('id', pinId).select('id').maybeSingle();

    if (error) {
      if (isMissingCropColumn(error)) {
        return { ok: false, error: 'Crop columns are not in the database yet. Apply the pin photo crop migration first.' };
      }
      return { ok: false, error: error.message || 'Could not save the crop.' };
    }
    if (!data) {
      return { ok: false, error: 'The photo was not updated.' };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save the crop.';
    return { ok: false, error: message || 'Could not save the crop.' };
  }
}
