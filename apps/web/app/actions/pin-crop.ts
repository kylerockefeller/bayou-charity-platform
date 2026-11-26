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

    const { data: { user }, error: userError } = await withTimeout(
      userClient.auth.getUser(),
      12000,
      'Checking your sign-in took too long. Please try again.',
    );
    if (userError || !user) return { ok: false, error: 'You must be signed in.' };

    const { data: profile, error: profileError } = await withTimeout(
      userClient.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      12000,
      'Checking your account took too long. Please try again.',
    );

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
      global: { fetch: fetchWithTimeout },
    });

    const { data, error } = await withTimeout(
      admin.from('pins').update({
        photo_crop_x: safe.x,
        photo_crop_y: safe.y,
        photo_crop_zoom: safe.zoom,
      }).eq('id', pinId).select('id').maybeSingle(),
      12000,
      'Saving the crop took too long. Please try again.',
    );

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

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(12000);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
