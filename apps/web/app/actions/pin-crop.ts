'use server';

import { cookies } from 'next/headers';
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

  let step = 'cookies';
  try {
    const cookieStore = await cookies();
    step = 'session-client';
    const userClient = createServerSupabaseClient({
      getAll() {
        return cookieStore.getAll();
      },
      set() {},
    });

    step = 'getUser';
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return { ok: false, error: 'You must be signed in.' };

    step = 'profile';
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      return { ok: false, error: 'Only an admin can adjust a pin photo crop.' };
    }

    step = 'config';
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return { ok: false, error: 'Crop saving is not configured on the server.' };
    }

    step = 'update';
    // Workers' bundled supabase-js fetch is not a function. Call PostgREST directly.
    const response = await globalThis.fetch(
      `${url}/rest/v1/pins?id=eq.${encodeURIComponent(pinId)}&select=id`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          photo_crop_x: safe.x,
          photo_crop_y: safe.y,
          photo_crop_zoom: safe.zoom,
        }),
      },
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: unknown }).message ?? '')
        : '';
      if (message && isMissingCropColumn({ message })) {
        return { ok: false, error: 'Crop columns are not in the database yet. Apply the pin photo crop migration first.' };
      }
      return { ok: false, error: message || 'Could not save the crop.' };
    }
    if (!Array.isArray(body) || body.length === 0) {
      return { ok: false, error: 'The photo was not updated.' };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save the crop.';
    const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : '';
    return { ok: false, error: `${step}: ${message || 'Could not save the crop.'} ${stack}`.slice(0, 500) };
  }
}
