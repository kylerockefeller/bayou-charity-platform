import { ID_PATTERN, ogTitle, publicSpecies } from './copy';
import { sanitizeCrop, type PinCrop } from '@/lib/pin-crop';

export type ShareKind = 'pin' | 'gallery' | 'avatar';

export type ShareMeta = {
  title: string;
  species: string | null;
};

export type ShareRecord = ShareMeta & {
  crop: PinCrop | null;
  bytes: Uint8Array;
};

type SupabaseEnv = { url: string; serviceKey: string };

function env(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

function headers(serviceKey: string): HeadersInit {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
}

async function rest(env: SupabaseEnv, path: string): Promise<unknown> {
  const response = await fetch(`${env.url}/rest/v1/${path}`, { headers: headers(env.serviceKey) });
  if (!response.ok) return null;
  return response.json();
}

function firstRow(data: unknown): Record<string, unknown> | null {
  if (!Array.isArray(data) || !data[0] || typeof data[0] !== 'object') return null;
  return data[0] as Record<string, unknown>;
}

function displayName(row: Record<string, unknown>): string | null {
  const profiles = row.profiles;
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  if (!profile || typeof profile !== 'object' || !('display_name' in profile)) return null;
  const name = (profile as { display_name?: unknown }).display_name;
  return typeof name === 'string' ? name : null;
}

function cropFrom(row: Record<string, unknown>): PinCrop | null {
  const x = row.photo_crop_x;
  const y = row.photo_crop_y;
  const zoom = row.photo_crop_zoom;
  if (typeof x !== 'number' && typeof y !== 'number' && typeof zoom !== 'number') return null;
  return sanitizeCrop({
    x: typeof x === 'number' ? x : 50,
    y: typeof y === 'number' ? y : 50,
    zoom: typeof zoom === 'number' ? zoom : 1,
  });
}

async function download(env: SupabaseEnv, target: string): Promise<Uint8Array | null> {
  const supabaseHost = target.startsWith(env.url);
  let response: Response;
  try {
    response = await fetch(target, supabaseHost ? { headers: headers(env.serviceKey) } : undefined);
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const type = response.headers.get('content-type') ?? '';
  if (type && !type.startsWith('image/')) return null;
  return new Uint8Array(await response.arrayBuffer());
}

function storageUrl(env: SupabaseEnv, bucket: string, storagePath: string): string {
  const encoded = storagePath.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `${env.url}/storage/v1/object/${bucket}/${encoded}`;
}

async function pinRow(env: SupabaseEnv, id: string): Promise<Record<string, unknown> | null> {
  const withCrop = await rest(
    env,
    `pins?id=eq.${id}&select=species,photo_url,photo_crop_x,photo_crop_y,photo_crop_zoom,profiles(display_name)`,
  );
  const cropped = firstRow(withCrop);
  if (cropped) return cropped;
  const plain = await rest(env, `pins?id=eq.${id}&select=species,photo_url,profiles(display_name)`);
  return firstRow(plain);
}

async function galleryRow(env: SupabaseEnv, id: string): Promise<Record<string, unknown> | null> {
  const withCrop = await rest(
    env,
    `gallery_submissions?id=eq.${id}&select=status,storage_path,photo_crop_x,photo_crop_y,photo_crop_zoom,profiles!member_id(display_name)`,
  );
  const cropped = firstRow(withCrop);
  if (cropped) return cropped;
  const plain = await rest(
    env,
    `gallery_submissions?id=eq.${id}&select=status,storage_path,profiles!member_id(display_name)`,
  );
  return firstRow(plain);
}

type Located = {
  title: string;
  species: string | null;
  crop: PinCrop | null;
  fetchBytes: () => Promise<Uint8Array | null>;
};

async function locate(kind: ShareKind, id: string): Promise<Located | null> {
  if (!ID_PATTERN.test(id)) return null;
  const supabase = env();
  if (!supabase) return null;

  if (kind === 'pin') {
    const row = await pinRow(supabase, id);
    const photoUrl = row && typeof row.photo_url === 'string' ? row.photo_url : '';
    if (!row || !photoUrl.startsWith('https://')) return null;
    return {
      title: ogTitle(displayName(row)),
      species: publicSpecies(typeof row.species === 'string' ? row.species : null),
      crop: cropFrom(row),
      fetchBytes: () => download(supabase, photoUrl),
    };
  }

  if (kind === 'gallery') {
    const row = await galleryRow(supabase, id);
    const storagePath = row && typeof row.storage_path === 'string' ? row.storage_path : '';
    if (!row || !storagePath || storagePath.includes('..')) return null;
    const bucket = row.status === 'approved' ? 'gallery-public' : 'gallery-pending';
    const target = storageUrl(supabase, bucket, storagePath);
    return {
      title: ogTitle(displayName(row)),
      species: null,
      crop: cropFrom(row),
      fetchBytes: () => download(supabase, target),
    };
  }

  const profile = firstRow(await rest(supabase, `profiles?id=eq.${id}&select=avatar_url,display_name`));
  const avatarUrl = profile && typeof profile.avatar_url === 'string' ? profile.avatar_url : '';
  if (!profile || !avatarUrl.startsWith('https://')) return null;
  return {
    title: ogTitle(typeof profile.display_name === 'string' ? profile.display_name : null),
    species: null,
    crop: null,
    fetchBytes: () => download(supabase, avatarUrl),
  };
}

export async function loadShareMeta(kind: ShareKind, id: string): Promise<ShareMeta | null> {
  const located = await locate(kind, id);
  if (!located) return null;
  return { title: located.title, species: located.species };
}

export async function loadShareRecord(kind: ShareKind, id: string): Promise<ShareRecord | null> {
  const located = await locate(kind, id);
  if (!located) return null;
  const bytes = await located.fetchBytes();
  if (!bytes) return null;
  return { title: located.title, species: located.species, crop: located.crop, bytes };
}
