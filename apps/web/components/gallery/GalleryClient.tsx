'use client';

// GalleryClient — Client Component
// Receives pre-fetched events + submissions from the Gallery index component.
// Manages event tab state, filters submissions by active tab, handles Fish Pics.

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, type Variants } from 'framer-motion';
import type { Database } from '@bayou/supabase/types';
import GalleryGrid from './GalleryGrid';
import type { GalleryImage } from './GalleryGrid';
import GalleryFilter, { type GalleryTab } from './GalleryFilter';
import { createClient } from '@bayou/supabase';
import type { User } from '@supabase/supabase-js';
import { GALLERY_PHOTO_ASPECT, galleryPhotoUrl, withOptionalCropColumns } from '@/lib/gallery';
import { PinCropEditor } from '@/components/members/PinCropEditor';
import { PIN_PHOTO_ASPECT, normalizePinCrop, type PinCrop } from '@/lib/pin-crop';
import { saveGalleryCrop } from '@/lib/save-gallery-crop';

// Lightbox only loads when a photo is clicked — defer its framer-motion AnimatePresence
const Lightbox = dynamic(() => import('./Lightbox'), { ssr: false });

// UploadForm only renders for authenticated members — defer it
const UploadForm = dynamic(() => import('./UploadForm'), { ssr: false });

type GalleryEvent = Database['public']['Tables']['gallery_events']['Row'];
type GallerySubmission = Database['public']['Tables']['gallery_submissions']['Row'];

// Fish Pics tab uses a special sentinel value (not a real event UUID)
const FISH_PICS_TAB = 'fish';

function savedCrop(row: {
  photo_crop_x?: number | null;
  photo_crop_y?: number | null;
  photo_crop_zoom?: number | null;
}): PinCrop | null {
  if (
    typeof row.photo_crop_x !== 'number'
    && typeof row.photo_crop_y !== 'number'
    && typeof row.photo_crop_zoom !== 'number'
  ) return null;
  return normalizePinCrop(row);
}

function submissionToImage(sub: GallerySubmission, index: number, override?: PinCrop): GalleryImage {
  const crop = override ?? savedCrop(sub);
  return {
    // Bucket derived from status via lib/gallery.ts — submissions reaching this
    // page are approved, so this resolves to the public bucket.
    src: galleryPhotoUrl(sub.storage_path, sub.status ?? 'approved'),
    alt: sub.caption || 'BFF club photo',
    caption: sub.caption || undefined,
    width: 1200,
    height: 900,
    index,
    id: sub.id,
    crop,
    frame: GALLERY_PHOTO_ASPECT,
    kind: 'gallery',
  };
}

interface GalleryClientProps {
  events: GalleryEvent[];
  submissions: GallerySubmission[];
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function GalleryClient({ events, submissions }: GalleryClientProps) {
  const [activeEventId, setActiveEventId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<GalleryTab>('photos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [fishPins, setFishPins] = useState<GalleryImage[]>([]);
  const [fishLoading, setFishLoading] = useState(false);
  // Guard on "has the fetch completed" rather than fishPins.length: a length
  // guard refetches forever when the query legitimately returns zero rows
  // (observed as a permanent "Loading fish pics" spinner pre-2026-07-28).
  const [fishLoaded, setFishLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cropImage, setCropImage] = useState<GalleryImage | null>(null);
  const [cropOverrides, setCropOverrides] = useState<Record<string, PinCrop>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Auth check
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      if (!data.user) return;
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (mounted) setIsAdmin(profile?.role === 'admin');
    });
    return () => { mounted = false; };
  }, []);

  // Lazy-load Fish Pics when that tab is selected.
  //
  // Pins power the members MAP, where a daily 03:00 cron (auto-archive edge
  // function) sets archived_at after ~90 days to keep the map seasonal. The
  // gallery is a highlight reel, so archived pins STAY visible here — do not
  // re-add an archived_at filter: it silently drained this tab to empty once
  // every pin aged out (found 2026-07-28). RLS note: anon can only read pins
  // with photo_url set (public_read_pins_with_photos), which this query matches.
  useEffect(() => {
    if (activeEventId !== FISH_PICS_TAB) return;
    if (fishLoaded || fishLoading) return;

    setFishLoading(true);
    const supabase = createClient();
    withOptionalCropColumns(
      (columns) => supabase
        .from('pins')
        .select(columns)
        .eq('flagged', false)
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100),
      'id, photo_url, caption, species, location_name',
    ).then(({ data, error }) => {
        if (error) {
          // Swallowing this rendered an empty tab indistinguishable from "no
          // catches yet" — keep the grid empty but leave evidence.
          console.error('[FishPics] pins query failed:', error.message);
        }
        const imgs: GalleryImage[] = ((data ?? []) as unknown as Array<{
          id: string;
          photo_url: string | null;
          caption: string | null;
          species: string | null;
          location_name: string | null;
          photo_crop_x?: number | null;
          photo_crop_y?: number | null;
          photo_crop_zoom?: number | null;
        }>).map((pin, i) => ({
          src: pin.photo_url!,
          alt: pin.species
            ? `${pin.species} caught ${pin.location_name ? 'at ' + pin.location_name : 'on the bayou'}`
            : pin.caption || 'BFF member catch',
          caption: pin.caption || undefined,
          width: 1200,
          height: 900,
          index: i,
          id: pin.id,
          crop: savedCrop(pin),
          frame: PIN_PHOTO_ASPECT,
          kind: 'pin',
        }));
        setFishPins(imgs);
        setFishLoaded(true);
        setFishLoading(false);
      }, () => {
        // Postgrest errors RESOLVE and are handled above; this second callback
        // catches network-level rejections, which would otherwise strand the
        // loading spinner forever. (Two-arg .then because the query builder is
        // typed PromiseLike — no .catch on the type.)
        setFishLoaded(true);
        setFishLoading(false);
      });
  }, [activeEventId, fishLoaded, fishLoading]);

  // Derive the displayed images from active tab + active event
  const displayImages = useMemo<GalleryImage[]>(() => {
    if (activeEventId === FISH_PICS_TAB) return fishPins;
    const filtered =
      activeEventId === 'all'
        ? submissions
        : submissions.filter((s) => s.event_id === activeEventId);
    return filtered.map((s, i) => submissionToImage(s, i, cropOverrides[s.id]));
  }, [activeEventId, submissions, fishPins, cropOverrides]);

  // IntersectionObserver for lazy video autoplay
  useEffect(() => {
    if (activeTab !== 'videos') return;
    const videos = document.querySelectorAll<HTMLVideoElement>('video[data-lazy]');
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            void video.play().catch(() => { /* autoplay blocked */ });
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.3 },
    );
    videos.forEach((v) => observerRef.current?.observe(v));
    return () => observerRef.current?.disconnect();
  }, [activeTab]);

  function handlePrev() {
    setLightboxIndex((i) =>
      i !== null && displayImages.length > 0
        ? (i - 1 + displayImages.length) % displayImages.length
        : null,
    );
  }

  function handleNext() {
    setLightboxIndex((i) =>
      i !== null && displayImages.length > 0
        ? (i + 1) % displayImages.length
        : null,
    );
  }

  // Videos — for now always show all static videos regardless of tab
  const GALLERY_VIDEOS = [
    { src: '/Photos/club member casting video (gallery).mp4', label: 'Club member casting on the bayou' },
    { src: '/Photos/fishing knots class video (gallery).mp4', label: 'Fishing knots class' },
    { src: '/Photos/BFF club page header video.mp4',          label: 'BFF club overview' },
    { src: '/Photos/check-twice-video-boat.mp4',              label: 'The Check Twice on the Bayou' },
  ];

  return (
    <section id="gallery" className="py-16 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="glass-card p-10 md:p-14">

          {/* Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="mb-10 text-center md:text-left"
          >
            <p className="font-handwritten text-amber dark:text-gold text-lg mb-1">
              BFF Memories
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-green-deep dark:text-cream mb-3">
              Life on the Bayou
            </h1>
            {/* text-text-dark for AA contrast on glass-card over variable skyline bg */}
            <p className="font-serif text-text-dark dark:text-cream/70 max-w-2xl mx-auto md:mx-0">
              Thank you for making memories with Bayou Charity. Select tabs below and upload
              pictures and videos. Click any photo to view full size.
            </p>
          </motion.div>

          {/* Event tab strip */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="mb-4"
          >
            <div role="tablist" aria-label="Gallery event tabs" className="flex flex-wrap gap-2">
              {/* All pill */}
              <button
                role="tab"
                aria-selected={activeEventId === 'all'}
                onClick={() => setActiveEventId('all')}
                className={[
                  'relative px-4 py-2 rounded-full text-sm font-serif whitespace-nowrap transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber',
                  activeEventId === 'all'
                    ? 'bg-gold text-green-deep font-semibold'
                    : 'text-text-dark dark:text-cream/70 hover:text-amber dark:hover:text-amber',
                ].join(' ')}
              >
                {activeEventId === 'all' && (
                  <motion.span
                    layoutId="gallery-event-pill"
                    className="absolute inset-0 rounded-full bg-gold"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">All</span>
              </button>

              {/* Event pills from DB */}
              {events.map((event) => {
                const isActive = activeEventId === event.id;
                return (
                  <button
                    key={event.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveEventId(event.id)}
                    className={[
                      'relative px-4 py-2 rounded-full text-sm font-serif whitespace-nowrap transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber',
                      isActive
                        ? 'bg-gold text-green-deep font-semibold'
                        : 'text-text-dark dark:text-cream/70 hover:text-amber dark:hover:text-amber',
                    ].join(' ')}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="gallery-event-pill"
                        className="absolute inset-0 rounded-full bg-gold"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative">{event.name}</span>
                  </button>
                );
              })}

              {/* Fish Pics — hardcoded last */}
              <button
                role="tab"
                aria-selected={activeEventId === FISH_PICS_TAB}
                onClick={() => setActiveEventId(FISH_PICS_TAB)}
                className={[
                  'relative px-4 py-2 rounded-full text-sm font-serif whitespace-nowrap transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber',
                  activeEventId === FISH_PICS_TAB
                    ? 'bg-gold text-green-deep font-semibold'
                    : 'text-text-dark dark:text-cream/70 hover:text-amber dark:hover:text-amber',
                ].join(' ')}
              >
                {activeEventId === FISH_PICS_TAB && (
                  <motion.span
                    layoutId="gallery-event-pill"
                    className="absolute inset-0 rounded-full bg-gold"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">Fish Pics</span>
              </button>
            </div>
          </motion.div>

          {/* Photos/Videos filter */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
          >
            <GalleryFilter activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.div>

          {/* Photos grid */}
          {activeTab === 'photos' && (
            <motion.div key="photos" initial="hidden" animate="visible" variants={fadeUp}>
              {activeEventId === FISH_PICS_TAB && fishLoading ? (
                <p className="font-serif text-sm text-text-mid dark:text-cream/60 py-8 text-center">
                  Loading fish pics…
                </p>
              ) : displayImages.length === 0 ? (
                <p className="font-serif text-sm text-text-mid dark:text-cream/60 py-8 text-center">
                  No photos yet for this event.
                </p>
              ) : (
                <GalleryGrid
                  images={displayImages}
                  onImageClick={setLightboxIndex}
                  onAdjustCrop={isAdmin ? setCropImage : undefined}
                />
              )}
            </motion.div>
          )}

          {/* Videos grid */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {GALLERY_VIDEOS.map((video) => (
                <div key={video.src} className="rounded-xl overflow-hidden bg-green-water dark:bg-green-deep/80 shadow-md">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video controls preload="metadata" className="w-full rounded-lg">
                    <source src={video.src} type="video/mp4" />
                  </video>
                  <p className="px-4 py-3 font-serif text-sm text-cream/80 dark:text-cream/70">
                    {video.label}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Upload form — auth gated */}
          {user && (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              className="mt-16 max-w-lg"
            >
              <UploadForm userId={user.id} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={displayImages}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        onAdjustCrop={isAdmin ? setCropImage : undefined}
      />
      {cropImage?.id && (
        <PinCropEditor
          pin={{
            id: cropImage.id,
            photo_url: cropImage.src,
            caption: cropImage.caption,
            photo_crop_x: cropImage.crop?.x,
            photo_crop_y: cropImage.crop?.y,
            photo_crop_zoom: cropImage.crop?.zoom,
          }}
          aspect={cropImage.frame}
          saveCrop={cropImage.kind === 'pin'
            ? (crop) => savePinCrop(cropImage.id!, crop)
            : (crop) => saveGalleryCrop(cropImage.id!, crop)}
          onClose={() => setCropImage(null)}
          onSaved={(crop) => {
            if (cropImage.kind === 'pin') {
              setFishPins((current) => current.map((item) => item.id === cropImage.id ? { ...item, crop } : item));
            } else {
              setCropOverrides((current) => ({ ...current, [cropImage.id!]: crop }));
            }
            setCropImage(null);
          }}
        />
      )}
    </section>
  );
}

async function savePinCrop(pinId: string, crop: PinCrop): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch('/api/pin-crop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinId, crop }),
  });
  const result = await response.json().catch(() => null);
  if (!result || typeof result !== 'object' || !('ok' in result)) {
    return { ok: false, error: 'Could not save the crop.' };
  }
  return result as { ok: true } | { ok: false; error: string };
}
