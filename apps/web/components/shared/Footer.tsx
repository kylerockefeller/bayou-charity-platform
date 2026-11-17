'use client'

/**
 * Footer — Bayou Charity
 *
 * Design: Matches Nav glass pill aesthetic — dark green base, amber→gold
 * gradient accent line at top, three-column layout, social icons.
 *
 * Token dependency: Requires Phase 0 tailwind.config.ts tokens.
 */

import Image from 'next/image'
import Link from 'next/link'
import { Facebook, Twitter, Instagram } from 'lucide-react'
import { PAYMENT_METHODS } from '@/lib/payments'

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/',          label: 'Home'       },
  { href: '/about',     label: 'About'      },
  { href: '/boats',     label: 'Our Boats'  },
  { href: '/gallery',   label: 'Gallery'    },
  { href: '/innisfree', label: 'INNISFREE'  },
  { href: '/volunteer', label: 'Volunteer'  },
  { href: '/donate',    label: 'Donate'     },
  { href: '/members',   label: 'Members'    },
] as const

const LEGAL_LINKS = [
  { href: '/privacy',       label: 'Privacy Policy'  },
  { href: '/terms',         label: 'Terms of Service' },
  { href: '/data-deletion', label: 'Data Deletion'   },
] as const

// ─── TikTok icon (Lucide doesn't include it) ─────────────────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 100 12.67 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.06-.1z" />
    </svg>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer aria-label="Site footer">
      <div className="glass-card--dark mx-4 md:mx-8 mb-4 overflow-hidden" style={{ color: '#eef6fb' }}>
      {/* Amber → gold top accent line — mirrors nav pill border */}
      <div
        aria-hidden="true"
        style={{
          height:     '3px',
          background: 'linear-gradient(90deg, #e8923a 0%, #c9a84c 45%, transparent 100%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* ── Column 1: Brand ──────────────────────────────────────── */}
          <div>
            <h2 className="mb-4">
              <Image
                src="/brand/bayou-charity-logo-light-text.png"
                alt="Bayou Charity"
                width={1600}
                height={448}
                sizes="180px"
                className="h-11 w-auto"
              />
            </h2>

            <p
              className="text-sm leading-relaxed mb-6"
              style={{ fontFamily: "'Lora', serif", color: 'rgba(238,246,251,0.65)' }}
            >
              Keepin&apos; the bayou alive — one family, one boat, one cast at a
              time. We are a Registered Louisiana Non-Profit Corporation and 501c3 applicant.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3" aria-label="Social media links">
              {[
                {
                  href:  'https://www.facebook.com/profile.php?id=61586546376080',
                  label: 'Bayou Charity on Facebook',
                  icon:  <Facebook className="w-4 h-4" aria-hidden="true" />,
                },
                {
                  href:  'https://x.com/CharityBayou',
                  label: 'Bayou Charity on X (Twitter)',
                  icon:  <Twitter className="w-4 h-4" aria-hidden="true" />,
                },
                {
                  href:  'https://instagram.com/kyle.rockefeller',
                  label: 'Bayou Charity on Instagram',
                  icon:  <Instagram className="w-4 h-4" aria-hidden="true" />,
                },
                {
                  href:  'https://tiktok.com/@bayoucharity',
                  label: 'Bayou Charity on TikTok',
                  icon:  <TikTokIcon className="w-4 h-4" />,
                },
              ].map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    border:     '1px solid rgba(201,168,76,0.2)',
                    color:      'rgba(238,246,251,0.55)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color       = '#c9a84c'
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.65)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color       = 'rgba(238,246,251,0.55)'
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Column 2: Navigation ─────────────────────────────────── */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{
                fontFamily: "'Playfair Display', serif",
                color:      '#c9a84c',
                letterSpacing: '2.5px',
              }}
            >
              Navigate
            </h3>
            <ul className="list-none space-y-2.5" role="list">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors duration-200"
                    style={{
                      fontFamily: "'Lora', serif",
                      color:      'rgba(238,246,251,0.7)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e8923a')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,246,251,0.7)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Support ────────────────────────────────────── */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{
                fontFamily: "'Playfair Display', serif",
                color:      '#c9a84c',
                letterSpacing: '2.5px',
              }}
            >
              Support the Mission
            </h3>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ fontFamily: "'Lora', serif", color: 'rgba(238,246,251,0.7)' }}
            >
              Every dollar keeps a family on the water. Donate securely via
              Zeffy — 100% of your gift goes straight to the mission.
            </p>

            <Link
              href="/donate"
              className="inline-flex items-center justify-center text-sm font-semibold rounded-lg px-5 py-2.5 transition-all duration-200 hover:-translate-y-px"
              style={{
                fontFamily: "'Lora', serif",
                color:      '#0d2b3e',
                background: '#e8923a',
                boxShadow:  '0 2px 12px rgba(232,146,58,0.3)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#d4802e')}
              onMouseLeave={e => (e.currentTarget.style.background = '#e8923a')}
            >
              Donate Now
            </Link>

            {/* Same list as the donate page chips — data lives in lib/payments.ts
                (this footer once linked a different PayPal URL than /donate).
                Apple Cash has no web link, so it falls back to a mailto. */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              {PAYMENT_METHODS.map(({ label, handle, href }) => (
                <a
                  key={label}
                  href={href ?? `mailto:${handle}`}
                  target={href ? '_blank' : undefined}
                  rel={href ? 'noopener noreferrer' : undefined}
                  className="text-xs transition-colors duration-200"
                  style={{ fontFamily: "'Lora', serif", color: 'rgba(238,246,251,0.6)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(238,246,251,0.85)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,246,251,0.6)')}
                >
                  {label} · {handle}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────────────── */}
        <div
          className="mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p
            className="text-xs"
            style={{ fontFamily: "'Lora', serif", color: 'rgba(238,246,251,0.6)' }}
          >
            © {year} Bayou Family Fishing · Bayou Charity · Registered Louisiana Non-Profit Corporation
          </p>

          <nav aria-label="Legal links">
            <ul className="flex items-center gap-5 list-none" role="list">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs transition-colors duration-200"
                    style={{ fontFamily: "'Lora', serif", color: 'rgba(238,246,251,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(238,246,251,0.85)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,246,251,0.6)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      </div>
    </footer>
  )
}
