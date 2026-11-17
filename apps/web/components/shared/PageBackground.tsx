'use client'

/**
 * PageBackground — Glassmorphic skyline backdrop system.
 *
 * Home: 6-photo CSS crossfade slideshow (48s cycle).
 * All others: single fixed photo.
 *
 * Uses next/image for automatic WebP/AVIF, responsive srcset, and CDN caching.
 * Deferred loading: only photo 0 loads immediately (priority); photos 1-5 load
 * ~2s before their crossfade window starts.
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'

// ─── Photo assignments ────────────────────────────────────────────────────────

const PHOTOS: Record<string, string[]> = {
  home: [
    '/Photos/Skyline golden hue.jpg',
    '/Photos/Skyline home page second option.jpg',
    '/Photos/Skyline Marsh golden hue.jpg',
    '/Photos/Skyline astetic 1.jpg',
    '/Photos/Skyline golden 2.jpg',
    '/Photos/skyline.jpg',
  ],
  about:     ['/Photos/Skyline golden hue.jpg'],
  innisfree: ['/Photos/Skyline Marsh golden hue.jpg'],
  boats:     ['/Photos/Skyline home page second option.jpg'],
  gallery:   ['/Photos/Skyline astetic 1.jpg'],
  volunteer: ['/Photos/Skyline golden 2.jpg'],
  donate:    ['/Photos/skyline.jpg'],
}

export type PageKey = keyof typeof PHOTOS

interface Props {
  page: PageKey
}

const CYCLE_DURATION = 48 // seconds
const PRELOAD_LEAD = 2    // seconds before visibility

// ─── Component ────────────────────────────────────────────────────────────────

export default function PageBackground({ page }: Props) {
  const photos = PHOTOS[page] ?? PHOTOS.home
  const isCrossfade = photos.length > 1
  const [reducedMotion, setReducedMotion] = useState(false)
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]))

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Schedule deferred image loading for crossfade photos
  useEffect(() => {
    if (!isCrossfade || reducedMotion) return

    const interval = CYCLE_DURATION / photos.length // ~8s per photo
    const timers: ReturnType<typeof setTimeout>[] = []

    photos.forEach((_, i) => {
      if (i === 0) return
      const loadTime = Math.max(0, (i * interval - PRELOAD_LEAD) * 1000)
      const timer = setTimeout(() => {
        setLoaded(prev => new Set([...prev, i]))
      }, loadTime)
      timers.push(timer)
    })

    return () => timers.forEach(t => clearTimeout(t))
  }, [isCrossfade, reducedMotion, photos])

  return (
    <>
      {/* Photo layer(s) */}
      {photos.map((src, i) => (
        <div
          key={src}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            animation:
              isCrossfade && !reducedMotion
                ? `crossfade-${i} ${CYCLE_DURATION}s ease-in-out infinite`
                : 'none',
            opacity: isCrossfade
              ? reducedMotion
                ? i === 0 ? 1 : 0
                : undefined
              : 1,
          }}
        >
          {loaded.has(i) && (
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 1920px) 1920px, 100vw"
              style={{ objectFit: 'cover' }}
              priority={i === 0}
              quality={80}
            />
          )}
        </div>
      ))}

      {/* Dark overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 6,
          background: 'rgba(13, 43, 62, 0.40)',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
