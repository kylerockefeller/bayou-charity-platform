import { isMissingCropColumn, sanitizeCrop, type PinCrop } from '@/lib/pin-crop';

export const dynamic = 'force-dynamic';

const PIN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server actions on this Worker throw inside next/headers cookies(), so the
// crop save reads the session from the request and writes with fetch.

export async function POST(request: Request) {
  let body: { pinId?: unknown; crop?: PinCrop };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Could not read the crop.' });
  }
  if (typeof body.pinId !== 'string' || !PIN_ID.test(body.pinId) || !body.crop) {
    return Response.json({ ok: false, error: 'Missing pin.' });
  }
  const safe = sanitizeCrop(body.crop);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return Response.json({ ok: false, error: 'Crop saving is not configured on the server.' });
  }

  try {
    const accessToken = accessTokenFromCookie(request.headers.get('cookie'));
    if (!accessToken) return Response.json({ ok: false, error: 'You must be signed in.' });

    const userResponse = await globalThis.fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    });
    const user = await userResponse.json().catch(() => null);
    const userId = user && typeof user === 'object' && 'id' in user ? String(user.id) : '';
    if (!userResponse.ok || !userId) return Response.json({ ok: false, error: 'You must be signed in.' });

    const profileResponse = await globalThis.fetch(
      `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` } },
    );
    const profiles = await profileResponse.json().catch(() => null);
    const role = Array.isArray(profiles) ? profiles[0]?.role : null;
    if (role !== 'admin') {
      return Response.json({ ok: false, error: 'Only an admin can adjust a pin photo crop.' });
    }

    const updateResponse = await globalThis.fetch(
      `${url}/rest/v1/pins?id=eq.${encodeURIComponent(body.pinId)}&select=id`,
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
    const updated = await updateResponse.json().catch(() => null);
    if (!updateResponse.ok) {
      const message = updated && typeof updated === 'object' && 'message' in updated
        ? String((updated as { message?: unknown }).message ?? '')
        : '';
      const code = updated && typeof updated === 'object' && 'code' in updated
        ? String((updated as { code?: unknown }).code ?? '')
        : '';
      if (isMissingCropColumn({ message, code })) {
        return Response.json({ ok: false, error: 'Crop columns are not in the database yet. Apply the pin photo crop migration first.' });
      }
      return Response.json({ ok: false, error: message || 'Could not save the crop.' });
    }
    if (!Array.isArray(updated) || updated.length === 0) {
      return Response.json({ ok: false, error: 'The photo was not updated.' });
    }
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save the crop.';
    return Response.json({ ok: false, error: message || 'Could not save the crop.' });
  }
}

function accessTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';').flatMap((part) => {
    const index = part.indexOf('=');
    if (index < 1) return [];
    const name = part.slice(0, index).trim();
    const value = decodeURIComponent(part.slice(index + 1).trim());
    return name ? [{ name, value }] : [];
  });
  const named = pairs.find((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'));
  if (!named) return null;
  const key = named.name.replace(/\.\d+$/, '');
  const direct = pairs.find((cookie) => cookie.name === key)?.value;
  let raw = direct ?? '';
  if (!raw) {
    const chunks: string[] = [];
    for (let i = 0; ; i += 1) {
      const chunk = pairs.find((cookie) => cookie.name === `${key}.${i}`);
      if (!chunk) break;
      chunks.push(chunk.value);
    }
    raw = chunks.join('');
  }
  if (raw.startsWith('base64-')) raw = decodeBase64Url(raw.slice('base64-'.length));
  try {
    const session = JSON.parse(raw) as { access_token?: unknown };
    return typeof session.access_token === 'string' ? session.access_token : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
