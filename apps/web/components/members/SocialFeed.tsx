'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@bayou/supabase';
import Image from 'next/image';
import { ACCEPTED_IMAGE_ACCEPT, prepareUploadFile } from '@/lib/uploads';
import { backfillArchived } from '@/lib/backfill';

const WeatherWidget = React.lazy(() => import('./community/WeatherWidget'));

type Pin = {
  id: string;
  user_id: string;
  photo_url: string | null;
  lat: number;
  lng: number;
  location_name: string | null;
  caption: string | null;
  species: string | null;
  created_at: string;
  catch_date: string | null;
  archived_at: string | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

type Reaction = {
  target_id: string;
  emoji: string;
  member_id: string;
};

type ReactionCounts = Record<string, { likes: number; same_spot: number }>;

export default function SocialFeed({ userId, role }: { userId: string; role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [pins, setPins] = useState<Pin[]>([]);
  const [reactions, setReactions] = useState<ReactionCounts>({});
  const [loading, setLoading] = useState(true);

  // Post form state
  const [caption, setCaption] = useState('');
  const [species, setSpecies] = useState('');
  const [locationName, setLocationName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    // No `.is('archived_at', null)` here — the never-empty rule (lib/backfill.ts)
    // needs archived rows so a quiet season still renders a feed.
    const { data: pinsData } = await supabase
      .from('pins')
      .select('id, user_id, photo_url, lat, lng, location_name, caption, species, created_at, catch_date, archived_at, profiles(display_name, avatar_url)')
      .eq('flagged', false)
      .order('created_at', { ascending: false })
      .limit(50);

    const pinList = backfillArchived((pinsData ?? []) as Pin[]);
    setPins(pinList);

    if (pinList.length > 0) {
      const { data: rxData } = await supabase
        .from('reactions')
        .select('target_id, emoji, member_id')
        .eq('target_type', 'pin')
        .in('target_id', pinList.map(p => p.id));

      const counts: ReactionCounts = {};
      for (const r of (rxData ?? []) as Reaction[]) {
        if (!counts[r.target_id]) counts[r.target_id] = { likes: 0, same_spot: 0 };
        if (r.emoji === '👍') counts[r.target_id].likes++;
        if (r.emoji === '🎣') counts[r.target_id].same_spot++;
      }
      setReactions(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleReact = useCallback(async (pinId: string, emoji: string) => {
    await supabase.from('reactions').upsert(
      { target_id: pinId, emoji, member_id: userId, target_type: 'pin' },
      { onConflict: 'member_id,target_type,target_id,emoji' }
    );
    await loadFeed();
  }, [userId, loadFeed]);

  const handlePost = useCallback(async () => {
    if (!caption.trim()) return;
    // Shared validator — this path previously checked type but not size, so an
    // oversized photo only failed after the pin row was already inserted.
    const preparedPhoto = photoFile ? await prepareUploadFile(photoFile) : null;
    if (preparedPhoto?.error) {
      alert(preparedPhoto.error);
      return;
    }
    setPosting(true);

    const { data: insertData, error: insertError } = await supabase.from('pins').insert({
      user_id: userId,
      caption: caption.trim(),
      species: species.trim() || null,
      location_name: locationName.trim() || null,
      photo_url: null,
      lat: 0,
      lng: 0,
      flagged: false,
    }).select();

    if (!insertError && insertData && insertData[0] && preparedPhoto) {
      const pinId = insertData[0].id;
      const photo = preparedPhoto.file;
      const ext = photo.type === 'image/jpeg' ? 'jpg' : (photo.name.split('.').pop() ?? 'jpg');
      const path = `${userId}/${pinId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('pin-photos')
        .upload(path, photo, { upsert: false });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('pin-photos').getPublicUrl(path);
        await supabase.from('pins').update({ photo_url: publicUrl }).eq('id', pinId);
      }
    }

    setCaption(''); setSpecies(''); setLocationName(''); setPhotoFile(null);
    setPosting(false);
    await loadFeed();
    setToastMsg('Catch posted!');
    setTimeout(() => setToastMsg(null), 3000);
  }, [userId, caption, species, locationName, photoFile, loadFeed]);

  // Sidebar data
  const [leaderboard, setLeaderboard] = useState<{ display_name: string; count: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ display_name: string; species: string | null; created_at: string }[]>([]);

  const loadSidebarData = useCallback(async () => {
    // Top Anglers — count pins per user
    const { data: lb } = await supabase
      .from('pins')
      .select('user_id, profiles(display_name)')
      .eq('flagged', false)
      .is('archived_at', null);

    if (lb) {
      const counts: Record<string, { display_name: string; count: number }> = {};
      for (const row of lb as { user_id: string; profiles: { display_name: string | null } | null }[]) {
        const uid = row.user_id;
        if (!counts[uid]) counts[uid] = { display_name: row.profiles?.display_name ?? 'Member', count: 0 };
        counts[uid].count++;
      }
      setLeaderboard(Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5));
    }

    // Recent activity — backfills with archived pins like the main feed (the
    // leaderboard above stays active-only: it's an aggregate, not a content list).
    const { data: recent } = await supabase
      .from('pins')
      .select('profiles(display_name), species, created_at, archived_at')
      .eq('flagged', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recent) {
      setRecentActivity(backfillArchived(recent as { profiles: { display_name: string | null } | null; species: string | null; created_at: string; archived_at: string | null }[]).map(r => ({
        display_name: r.profiles?.display_name ?? 'Member',
        species: r.species,
        created_at: r.created_at,
      })));
    }
  }, []);

  useEffect(() => { loadSidebarData(); }, [loadSidebarData]);

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'yesterday';
    return `${days}d ago`;
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white dark:bg-green-deep/30 rounded-2xl border border-green-water/20 shadow-sm overflow-hidden animate-pulse">
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full bg-green-water/20" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded bg-green-water/20" />
                <div className="h-2.5 w-24 rounded bg-green-water/10" />
              </div>
            </div>
            <div className="h-36 bg-green-water/10 mx-4 mb-4 rounded-xl" />
            <div className="h-3 w-3/4 bg-green-water/10 rounded mx-4 mb-4" />
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-green-deep/30 rounded-2xl p-4 border border-green-water/20 animate-pulse">
              <div className="h-3 w-24 bg-green-water/20 rounded mb-3" />
              {[1,2,3].map(j => <div key={j} className="h-2.5 bg-green-water/10 rounded mb-2" />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
      {/* Feed — Left */}
      <div className="space-y-6 min-w-0">
        {pins.length === 0 && (
          <p className="text-text-mid text-center py-12">No posts yet. Be the first to share a catch!</p>
        )}
        {pins.map(pin => (
          <article key={pin.id} className="bg-white dark:bg-green-deep/30 rounded-2xl border border-green-water/20 dark:border-green-water/25 shadow-[0_1px_6px_rgba(13,43,62,0.06)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
              {pin.profiles?.avatar_url ? (
                <Image src={pin.profiles.avatar_url} alt="avatar" width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber/20 border border-amber/30 flex items-center justify-center text-sm font-bold text-amber select-none">
                  {(pin.profiles?.display_name ?? 'M').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text-dark dark:text-white truncate">
                  {pin.profiles?.display_name ?? 'Member'}
                </p>
                <p className="text-xs text-text-mid">
                  {pin.location_name ?? ''}{pin.location_name && pin.created_at ? ' · ' : ''}{pin.created_at ? new Date(pin.created_at).toLocaleDateString() : ''}
                </p>
              </div>
              {(userId === pin.user_id || role === 'admin') && (
                <button className="text-xs text-text-mid hover:text-amber">Edit</button>
              )}
            </div>

            {/* Caption */}
            {pin.caption && (
              <p className="px-4 pb-3 text-sm text-text-dark dark:text-cream">{pin.caption}</p>
            )}

            {/* Photo */}
            {pin.photo_url && (
              <div
                className="relative w-full cursor-pointer overflow-hidden"
                style={{ height: '280px' }}
                onClick={() => setExpandedPhoto(pin.photo_url!)}
              >
                <Image src={pin.photo_url} alt={pin.caption ?? 'catch photo'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
              </div>
            )}

            {/* Species tag */}
            {pin.species && (
              <div className="px-4 pt-3">
                <span className="inline-block bg-green-water/10 text-green-water dark:text-gold text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {pin.species}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-green-water/10 mt-1">
              <button
                onClick={() => handleReact(pin.id, '👍')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-mid hover:text-amber hover:bg-amber/10 transition-colors min-h-[44px]"
                aria-label={`Like — ${reactions[pin.id]?.likes ?? 0} likes`}
              >
                <span aria-hidden="true">👍</span>
                <span className="font-medium">{reactions[pin.id]?.likes ?? 0}</span>
              </button>
              <button
                onClick={() => handleReact(pin.id, '🎣')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-mid hover:text-amber hover:bg-amber/10 transition-colors min-h-[44px]"
                aria-label={`Fished this spot — ${reactions[pin.id]?.same_spot ?? 0}`}
              >
                <span aria-hidden="true">🎣</span>
                <span className="font-medium">{reactions[pin.id]?.same_spot ?? 0}</span>
              </button>
              {/* Static comment icon — thread deferred Phase 3 */}
              <span
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-mid/50 cursor-default"
                aria-label="Comments coming soon"
              >
                <span aria-hidden="true">💬</span>
              </span>
            </div>

            {/* Share */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-t border-green-water/10">
              <span className="text-xs text-text-mid mr-1">Share</span>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/members/feed#' + pin.id)}`, '_blank', 'width=600,height=400')}
                className="text-xs text-text-mid hover:text-amber px-1.5 py-1 rounded transition-colors"
                aria-label="Share on Facebook"
              >FB</button>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + '/members/feed#' + pin.id)}&text=${encodeURIComponent((pin.profiles?.display_name ?? 'A member') + ' caught ' + (pin.species ?? 'a fish') + ' at Bayou Family Fishing!')}`, '_blank', 'width=600,height=400')}
                className="text-xs text-text-mid hover:text-amber px-1.5 py-1 rounded transition-colors"
                aria-label="Share on X"
              >X</button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.origin + '/members/feed#' + pin.id); }}
                className="text-xs text-text-mid hover:text-amber px-1.5 py-1 rounded transition-colors"
                aria-label="Copy link"
              >Link</button>
            </div>
          </article>
        ))}
      </div>

      {/* Right Sidebar */}
      <aside className="hidden md:block">
        <div className="sticky top-28 space-y-4">

          {/* Weather */}
          <div className="bg-white dark:bg-green-water/15 rounded-xl border border-green-water/20 dark:border-green-water/30 p-4 shadow-[0_1px_6px_rgba(13,43,62,0.06)]">
            <React.Suspense fallback={<div className="h-20" />}>
              <WeatherWidget />
            </React.Suspense>
          </div>

          {/* Top Anglers Leaderboard */}
          <div className="bg-white dark:bg-green-water/15 rounded-xl border border-green-water/20 dark:border-green-water/30 p-4 shadow-[0_1px_6px_rgba(13,43,62,0.06)]">
            <h3 className="font-playfair text-[0.85rem] text-gold mb-3 pb-[0.4rem] border-b border-green-water/20 dark:border-green-water/30 flex items-center gap-[0.4rem]">Top Anglers</h3>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-text-mid">No catches yet</p>
            ) : (
              <ol className="divide-y divide-green-water/15 dark:divide-green-water/15">
                {leaderboard.map((entry, i) => (
                  <li key={entry.display_name} className="flex items-center gap-[0.6rem] py-[0.35rem] first:pt-0 last:border-b-0">
                    <span className="font-playfair text-[0.85rem] text-gold w-[18px] text-center">{i === 0 ? '🏆' : `${i + 1}`}</span>
                    <span className="text-[0.75rem] text-text-dark dark:text-cream flex-1 font-serif truncate">{entry.display_name}</span>
                    <span className="text-[0.68rem] text-text-mid">{entry.count} {entry.count === 1 ? 'pin' : 'pins'}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* What's New */}
          <div className="bg-white dark:bg-green-water/15 rounded-xl border border-green-water/20 dark:border-green-water/30 p-4 shadow-[0_1px_6px_rgba(13,43,62,0.06)]">
            <h3 className="font-playfair text-[0.85rem] text-gold mb-3 pb-[0.4rem] border-b border-green-water/20 dark:border-green-water/30 flex items-center gap-[0.4rem]">What&apos;s New</h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-text-mid">No recent activity</p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((item, i) => (
                  <li key={i} className="text-xs text-text-dark dark:text-cream/80">
                    <span className="font-semibold">{item.display_name}</span>{' '}
                    {item.species ? `caught ${item.species}` : 'posted a catch'}{' '}
                    <span className="text-text-mid">{relativeTime(item.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Post */}
          <div className="bg-white dark:bg-green-water/15 rounded-xl border border-green-water/20 dark:border-green-water/30 p-4 shadow-[0_1px_6px_rgba(13,43,62,0.06)] overflow-hidden">
            <h3 className="font-playfair text-[0.85rem] text-gold mb-3 pb-[0.4rem] border-b border-green-water/20 dark:border-green-water/30 flex items-center gap-[0.4rem]">Quick Post</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-text-mid dark:text-cream/60 mb-1" htmlFor="qp-caption">What&apos;d you catch today?</label>
                <textarea
                  id="qp-caption"
                  className="w-full rounded-lg border border-green-water/20 dark:border-green-water/30 dark:bg-green-deep p-2 font-serif text-[0.8rem] text-text-dark dark:text-cream resize-vertical min-h-[60px] mb-2 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 placeholder:text-text-mid dark:placeholder:text-cream/40"
                  rows={2}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  maxLength={280}
                  placeholder="What'd you catch today?"
                />
              </div>
              <div className="flex gap-2 items-center">
                <input
                  id="qp-species"
                  className="flex-1 min-w-0 rounded-lg border border-green-water/20 dark:border-green-water/30 dark:bg-green-deep p-2 font-serif text-[0.78rem] text-text-dark dark:text-cream focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 placeholder:text-text-mid dark:placeholder:text-cream/40"
                  value={species}
                  onChange={e => setSpecies(e.target.value)}
                  placeholder="Species"
                />
                <input
                  id="qp-location"
                  className="flex-1 min-w-0 rounded-lg border border-green-water/20 dark:border-green-water/30 dark:bg-green-deep p-2 font-serif text-[0.78rem] text-text-dark dark:text-cream focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 placeholder:text-text-mid dark:placeholder:text-cream/40"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="Location"
                />
              </div>
              <div className="flex gap-2 items-center" style={{ marginTop: '0.5rem' }}>
                <label className="inline-flex items-center gap-1 px-2 py-1 rounded border border-green-water/20 dark:border-green-water/30 text-[0.75rem] font-semibold text-text-mid hover:text-amber cursor-pointer transition-colors">
                  📷 Photo
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_ACCEPT}
                    className="hidden"
                    onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {photoFile && <span className="text-[0.7rem] text-text-mid flex-1 truncate">{photoFile.name}</span>}
                <button
                  onClick={handlePost}
                  disabled={posting || !caption.trim()}
                  className="ml-auto px-3 py-1 rounded-lg bg-amber text-white font-semibold text-[0.75rem] disabled:opacity-40 hover:bg-amber/90 transition-colors"
                >
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </div>

    {toastMsg && (
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-green-deep text-cream rounded-xl shadow-xl text-sm font-semibold border border-amber/30"
        role="status"
        aria-live="polite"
      >
        ✓ {toastMsg}
      </div>
    )}

    {expandedPhoto && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer p-4"
        onClick={() => setExpandedPhoto(null)}
      >
        <div
          className="relative w-full max-w-3xl h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          <Image
            src={expandedPhoto}
            alt="Expanded catch photo"
            fill
            className="object-contain rounded-xl"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
        <button
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full w-9 h-9 flex items-center justify-center text-lg font-bold leading-none"
          onClick={() => setExpandedPhoto(null)}
          aria-label="Close photo"
        >
          ×
        </button>
      </div>
    )}
    </>
  );
}
