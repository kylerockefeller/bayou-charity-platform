'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@bayou/supabase';
import { PinCropEditor } from '@/components/members/PinCropEditor';
import { isMissingCropColumn, normalizePinCrop, PIN_PHOTO_ASPECT, pinCropStyle, type PinCrop } from '@/lib/pin-crop';
import { MemberLoadError } from '@/lib/member-session';

type CropRow = {
  id: string;
  photo_url: string | null;
  caption: string | null;
  species: string | null;
  photo_crop_x?: number | null;
  photo_crop_y?: number | null;
  photo_crop_zoom?: number | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

export function PinCropAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<CropRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cropPin, setCropPin] = useState<CropRow | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const base = 'id, photo_url, caption, species, profiles(display_name)';
    const withCrop = await supabase
      .from('pins')
      .select(`${base}, photo_crop_x, photo_crop_y, photo_crop_zoom`)
      .eq('flagged', false)
      .not('photo_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(40);
    const result = withCrop.error && isMissingCropColumn(withCrop.error)
      ? await supabase
        .from('pins')
        .select(base)
        .eq('flagged', false)
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(40)
      : withCrop;
    if (result.error) {
      setError('Could not load pin photos.');
      setLoading(false);
      return;
    }
    setRows((result.data ?? []) as CropRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load, attempt]);

  function applySaved(id: string, crop: PinCrop) {
    setRows((current) => current.map((row) => row.id === id
      ? { ...row, photo_crop_x: crop.x, photo_crop_y: crop.y, photo_crop_zoom: crop.zoom }
      : row));
    setCropPin(null);
  }

  if (loading) return <p className="font-serif text-sm text-text-mid dark:text-cream/70">Loading pin photos…</p>;
  if (error) return <MemberLoadError message={error} onRetry={() => setAttempt((n) => n + 1)} />;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl text-green-deep dark:text-cream">Pin photo crops</h1>
        <p className="font-serif text-sm text-text-mid dark:text-cream/70">
          Framing is saved per photo. Members see it on the map and in the feed.
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="font-serif text-sm text-text-mid dark:text-cream/70">No pin photos yet.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((row) => (
            <li key={row.id} className="space-y-2">
              <div className="relative overflow-hidden rounded-xl border border-gold/20" style={{ aspectRatio: PIN_PHOTO_ASPECT }}>
                {row.photo_url && (
                  <Image src={row.photo_url} alt={row.caption ?? 'Pin photo'} fill className="object-cover" style={pinCropStyle(normalizePinCrop(row))} sizes="(max-width: 768px) 100vw, 360px" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="font-serif text-xs text-text-mid dark:text-cream/70 truncate">
                  {displayName(row)}{row.species ? ` · ${row.species}` : ''}
                </p>
                <button type="button" onClick={() => setCropPin(row)} className="shrink-0 font-serif text-sm text-amber">
                  Adjust crop
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {cropPin?.photo_url && (
        <PinCropEditor
          pin={{
            id: cropPin.id,
            photo_url: cropPin.photo_url,
            caption: cropPin.caption,
            photo_crop_x: cropPin.photo_crop_x,
            photo_crop_y: cropPin.photo_crop_y,
            photo_crop_zoom: cropPin.photo_crop_zoom,
          }}
          onClose={() => setCropPin(null)}
          onSaved={(crop) => applySaved(cropPin.id, crop)}
        />
      )}
    </div>
  );
}

function displayName(row: CropRow): string {
  const profile = row.profiles;
  if (Array.isArray(profile)) return profile[0]?.display_name ?? 'Member';
  return profile?.display_name ?? 'Member';
}
