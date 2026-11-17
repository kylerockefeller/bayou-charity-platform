'use client'

/**
 * Nav — Floating Glass Pill Navigation (Variant C)
 *
 * Design decisions:
 *  - Fixed pill floats 16px from top on ALL pages
 *  - backdrop-filter: blur(16px) — glass effect over hero content
 *  - Pill becomes more opaque on scroll (scrollY > 20)
 *  - Active route highlighted with gold filled pill
 *  - Amber "Donate" CTA with glow shadow
 *  - Mobile: hamburger → full-height overlay menu
 *  - prefers-reduced-motion: transitions disabled
 *
 * Token dependency: Requires Phase 0 tailwind.config.ts tokens
 *  (bg-green-deep, text-amber, text-gold, bg-gold, etc.)
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

// ─── Route definitions ──────────────────────────────────────────────────────

interface NavLink {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/',          label: 'Home'      },
  { href: '/about',     label: 'About'     },
  { href: '/boats',     label: 'Boats'     },
  { href: '/gallery',   label: 'Gallery'   },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/innisfree', label: 'INNISFREE' },
  { href: '/members',   label: 'Members'   },
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function Nav() {
  const pathname    = usePathname()
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  // Scroll listener — tighten pill opacity past 20px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Prevent body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  // ── Pill background classes based on scroll state
  const pillClasses = scrolled
    ? 'bg-[rgba(13,43,62,0.94)] border-[rgba(201,168,76,0.38)] shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
    : 'bg-[rgba(13,43,62,0.62)] border-[rgba(201,168,76,0.18)] shadow-[0_8px_32px_rgba(0,0,0,0.28)]'

  return (
    <>
      {/* ── Fixed floating pill ────────────────────────────────────────────── */}
      <header
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
        aria-label="Primary navigation"
      >
        <nav
          className={[
            'flex items-center justify-between',
            'pl-4 pr-3 py-2',
            'rounded-full border',
            'transition-all duration-300 motion-reduce:transition-none',
            pillClasses,
          ].join(' ')}
          style={{
            backdropFilter:         'blur(16px)',
            WebkitBackdropFilter:   'blur(16px)',
          }}
        >
          {/* Logo ──────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center shrink-0"
            aria-label="Bayou Charity — home"
          >
            <Image
              src="/brand/bayou-charity-logo-light-text.png"
              alt="Bayou Charity"
              width={1600}
              height={448}
              priority
              sizes="(max-width: 1024px) 128px, 160px"
              className="h-8 w-auto lg:h-10"
            />
          </Link>

          {/* Desktop links ─────────────────────────────────────────── */}
          <ul
            className="hidden md:flex items-center gap-1 list-none"
            role="list"
          >
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'text-[0.82rem] font-medium px-2 lg:px-3 py-1.5 rounded-full',
                      'transition-all duration-200 motion-reduce:transition-none',
                      active
                        ? 'text-green-deep font-semibold bg-gold shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10',
                    ].join(' ')}
                    style={{ fontFamily: "'Lora', serif", color: active ? '#0d2b3e' : undefined }}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* CTA + hamburger ───────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <Link
              href="/donate"
              className={[
                'text-[0.84rem] font-semibold rounded-full px-5 py-2',
                'transition-all duration-200 motion-reduce:transition-none',
                'hover:-translate-y-px',
              ].join(' ')}
              style={{
                fontFamily:   "'Lora', serif",
                color:        '#0d2b3e',
                background:   '#e8923a',
                boxShadow:    '0 2px 12px rgba(232,146,58,0.45)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#d4802e')}
              onMouseLeave={e => (e.currentTarget.style.background = '#e8923a')}
            >
              Donate
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileOpen
                ? <X    className="w-5 h-5" aria-hidden="true" />
                : <Menu className="w-5 h-5" aria-hidden="true" />
              }
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-green-deep/90"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(13,43,62,0.92)' }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <nav
            className="absolute top-20 left-4 right-4 rounded-2xl p-6 shadow-2xl border"
            style={{
              background:   'rgba(13,43,62,0.97)',
              borderColor:  'rgba(201,168,76,0.2)',
            }}
          >
            <ul className="list-none space-y-1" role="list">
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'flex items-center text-[1rem] font-medium px-4 py-3 rounded-xl',
                        'transition-all duration-200 motion-reduce:transition-none',
                        active
                          ? 'font-semibold border'
                          : 'text-white/80 hover:text-white hover:bg-white/8',
                      ].join(' ')}
                      style={{
                        fontFamily:   "'Lora', serif",
                        ...(active ? {
                          background:   'rgba(201,168,76,0.15)',
                          color:        '#c9a84c',
                          borderColor:  'rgba(201,168,76,0.3)',
                        } : {}),
                      }}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Mobile Donate CTA */}
            <div
              className="mt-4 pt-4"
              style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}
            >
              <Link
                href="/donate"
                className="flex items-center justify-center text-[1rem] font-semibold rounded-xl px-5 py-3 w-full transition-all duration-200"
                style={{
                  fontFamily:   "'Lora', serif",
                  color:        '#0d2b3e',
                  background:   '#e8923a',
                  boxShadow:    '0 2px 12px rgba(232,146,58,0.4)',
                }}
              >
                Donate Now
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
