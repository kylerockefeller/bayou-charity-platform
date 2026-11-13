'use client';

import { ZeffyEmbed } from '@/components/shared/ZeffyEmbed';
import { PAYMENT_METHODS } from '@/lib/payments';

// ─── Payment Chips ────────────────────────────────────────────────────────────

// Handles + hrefs come from lib/payments.ts — the footer renders the same list,
// and the two used to disagree on the PayPal URL. Do not inline handles here.
function PaymentChips() {
  const chips = PAYMENT_METHODS;

  return (
    <div className="mt-6">
      <p className="font-serif text-sm text-text-dark dark:text-cream/90 mb-3">
        Or send directly — zero fees:
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map(({ emoji, label, handle, href }) => {
          const inner = (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream dark:bg-green-water border border-green-water/20 dark:border-cream/10 font-serif text-sm text-text-dark dark:text-cream hover:border-amber dark:hover:border-amber transition-colors">
              <span>{emoji}</span>
              <span className="font-semibold">{label}</span>
              <span className="text-amber-700 dark:text-amber">{handle}</span>
            </span>
          );
          return href ? (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <span key={label}>{inner}</span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Impact Tiers ─────────────────────────────────────────────────────────────

function ImpactTiers() {
  const tiers = [
    { amount: '$50', description: 'Covers fuel for member-supported fishing trips' },
    { amount: '$100', description: 'Covers a beginner\'s class and a day of dock fishing for a BFF family' },
    { amount: '$250', description: 'Covers a parent and child fishing trip with a licensed guide' },
    { amount: '$500', description: 'Covers a family of 4 fishing trip with a licensed guide' },
  ];

  return (
    <div className="glass-card p-6">
      <h2 className="font-display text-2xl text-green-deep dark:text-gold mb-1">Your Impact</h2>
      <p className="font-serif text-xs text-text-mid dark:text-cream/60 mb-4 uppercase tracking-widest">Where your donation goes</p>
      <div className="divide-y divide-green-water/15 dark:divide-cream/10">
        {tiers.map(({ amount, description }) => (
          <div key={amount} className="flex gap-5 items-center py-4">
            {/* text-amber-700 for AA contrast on light glass-card bg; dark mode restores amber */}
            <span className="font-display text-amber-700 dark:text-amber text-2xl font-bold w-16 shrink-0">{amount}</span>
            {/* text-text-dark for AA contrast on glass-card; dark mode cream/80 */}
            <span className="font-serif text-sm text-text-dark dark:text-cream/80 leading-relaxed">{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Local Biz ────────────────────────────────────────────────────────────────

function SupportMomAndPops() {
  const partners = [
    {
      emoji: '🎣',
      title: 'Operation Healing Waters / Reel O-Fishal Charters',
      lines: [
        { text: 'operationhealingwaters.org', href: 'https://operationhealingwaters.org' },
        { text: 'TikTok: @reelofishal', href: 'https://tiktok.com/@reelofishal' },
        { text: 'Capt. Derrious Austin · 850-319-8909', href: 'tel:8503198909' },
        { text: 'Donate via Zeffy (OHW)', href: 'https://www.zeffy.com/en-US/donation-form/operated-healing-waters' },
      ],
    },
    {
      emoji: '🦐',
      title: "Sam's Bait by You & Alligator Hunts",
      lines: [
        { text: 'Capt. Sam Ronquille · 504-906-5812', href: 'tel:5049065812' },
      ],
    },
    {
      emoji: '🛖',
      title: 'Slow Down Park: Fishing Camp & RV Park',
      lines: [
        { text: 'Book on Airbnb', href: 'https://www.airbnb.com/rooms/1207497072384874993?unique_share_id=d4ca4ef1-3aad-420e-91e4-b819b5f49ec8&viralityEntryPoint=1&s=76' },
        { text: 'Book on VRBO', href: 'https://www.vrbo.com/5132148?dateless=true' },
        { text: 'Kyle Rockefeller · 504-541-1838', href: 'tel:5045411838' },
      ],
    },
  ];

  return (
    <div>
      <h3 className="font-display text-xl text-gold mb-2">Support Mom &amp; Pops</h3>
      <p className="font-serif text-sm text-cream/95 leading-relaxed mb-4">
        We channel a portion of all donations to support local Louisiana businesses that share our values. You can also support one of our partners directly:
      </p>
      <div className="space-y-4">
        {partners.map(({ emoji, title, lines }) => (
          <div key={title} className="bg-cream dark:bg-green-deep/60 border border-green-water/20 dark:border-gold/20 rounded-xl flex gap-4 items-center p-4">
            <span className="text-3xl shrink-0">{emoji}</span>
            <div className="min-w-0">
              <h4 className="font-display text-base text-green-deep dark:text-gold font-semibold mb-1 leading-snug">{title}</h4>
              {lines.map(({ text, href }) => (
                <a key={text} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="font-serif text-sm text-amber hover:underline flex items-center min-h-[36px]">
                  {text}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── In-Kind Donations ────────────────────────────────────────────────────────

function InKindSection() {
  const items = [
    { emoji: '🚤', label: 'Boats & outboard motors' },
    { emoji: '🎣', label: 'Rods, reels, tackle & fishing gear' },
    { emoji: '🪵', label: 'Lumber & dock hardware' },
    { emoji: '🔧', label: 'Tools & construction materials' },
  ];

  return (
    <div>
      <h3 className="font-display text-xl text-green-deep dark:text-gold mb-2">
        Got old gear? Put it to work.
      </h3>
      <p className="font-serif text-sm text-text-mid dark:text-cream/80 leading-relaxed mb-4">
        If you&apos;ve got a boat sitting in the yard, leftover tackle, or construction stuff collecting dust — bring it our way. Bayou Charity takes it all. Every donation goes toward keeping the fleet running and the INNISFREE camp moving. You&apos;ll get a tax write-off letter from us; we get what we need to stay on the water.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
        {items.map(({ emoji, label }) => (
          <div key={label} className="flex items-center gap-2 font-serif text-sm text-text-dark dark:text-cream/90 bg-cream dark:bg-green-deep/40 rounded-lg px-3 py-2 border-l-[3px] border-amber">
            <span>{emoji}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="bg-amber/10 border border-amber/30 rounded-xl p-4">
        <p className="font-serif text-sm text-text-mid dark:text-cream/70 mb-1">
          📬 <strong className="text-text-dark dark:text-cream">Reach Kyle to set something up:</strong>
        </p>
        <p className="font-serif text-sm">
          <a href="mailto:kyle.rockefeller@bayoucharity.org" className="text-amber hover:underline">
            kyle.rockefeller@bayoucharity.org
          </a>
          {' '}·{' '}
          <a href="tel:+15044745178" className="text-amber hover:underline">
            504-474-5178
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Licensed Guides ──────────────────────────────────────────────────────────

function LicensedGuides() {
  const guides = [
    {
      title: 'Reel O-Fishal Charters',
      captain: 'Capt. Derrious Austin',
      lines: [
        { text: 'TikTok: @reelofishal', href: 'https://tiktok.com/@reelofishal' },
        { text: '850-319-8909', href: 'tel:8503198909' },
      ],
    },
    {
      title: 'Marsh Assassins BowFishing',
      captain: 'Capt. Kenny Bergman',
      lines: [
        { text: 'marshassassinsbowfishing.com', href: 'https://www.marshassassinsbowfishing.com/' },
      ],
    },
  ];

  return (
    <div>
      <h3 className="font-display text-xl text-gold mb-2">Licensed Fishing Guides</h3>
      <p className="font-serif text-sm text-cream/95 leading-relaxed mb-4">
        These trusted guides support BFF&apos;s mission and offer exceptional Louisiana fishing experiences.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map(({ title, captain, lines }) => (
          <div
            key={title}
            className="glass-card--dark p-4 hover:border-amber transition-colors"
          >
            <h4 className="font-display text-base text-cream font-semibold mb-0.5">{title}</h4>
            <p className="font-serif text-xs text-cream/80 mb-2">{captain}</p>
            {lines.map(({ text, href }) => (
              <p key={text} className="font-serif text-sm">
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="text-amber hover:underline"
                >
                  {text}
                </a>
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Donate Component ────────────────────────────────────────────────────

export default function Donate() {
  return (
    <section id="donate" className="py-0 min-h-screen">

      {/* 1 — Hero: full-width, no card, sits directly on PageBackground */}
      <div className="py-20 px-4 text-center">
        <p className="font-accent text-amber text-lg mb-1">Give Back</p>
        <h1
          className="font-display text-5xl md:text-6xl text-white mb-4"
          style={{ textShadow: '0 2px 12px rgba(13,43,62,0.7)' }}
        >
          Support the <em>Mission</em>
        </h1>
        <div className="w-16 h-0.5 bg-gold mx-auto mb-6" />
        <p
          className="font-serif text-cream/90 max-w-2xl mx-auto leading-relaxed text-lg"
          style={{ textShadow: '0 1px 6px rgba(13,43,62,0.6)' }}
        >
          Your donation directly funds our fishing programs for military and other community service
          families. Your generosity also helps us build the charity&apos;s offshore hub, Innisfree,
          where members have access to the full Louisiana experience.
        </p>
      </div>

      {/* 3 — Main content: sticky form left, scrollable content right */}
      <div className="container mx-auto px-4 max-w-6xl pb-20">

        <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-12 mt-8" style={{ alignItems: 'start' }}>

          {/* ── LEFT: Sticky donation form ── */}
          <div className="md:sticky md:top-28 self-start glass-card p-8">
            <h3 className="font-display text-2xl text-gold mb-1">Make a Donation</h3>
            <p className="font-serif text-sm text-text-mid dark:text-cream/70 mb-4 leading-relaxed">
              100% of every dollar goes directly to our programs — Zeffy charges us zero platform fees.
            </p>
            <div className="rounded-xl overflow-hidden border border-green-water/20 dark:border-cream/10">
              <ZeffyEmbed
                src="https://www.zeffy.com/embed/donation-form/bayou-family-fishing"
                title="Donation form powered by Zeffy"
                height="450px"
              />
            </div>
            <p className="font-serif text-xs text-text-mid dark:text-cream/70 mt-2 text-center">
              We are a Registered Louisiana Non-Profit Corporation and 501c3 applicant.
            </p>
            <PaymentChips />
          </div>

          {/* ── RIGHT: Scrollable content ── */}
          <div className="space-y-8">

            {/* Impact Tiers */}
            <ImpactTiers />

            {/* Support Mom & Pops */}
            <div className="glass-card--dark p-8 rounded-xl">
              <SupportMomAndPops />
            </div>

            {/* In-Kind */}
            <div className="glass-card p-8 rounded-xl">
              <InKindSection />
            </div>

            {/* Licensed Guides */}
            <div className="glass-card--dark p-8 rounded-xl">
              <LicensedGuides />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
