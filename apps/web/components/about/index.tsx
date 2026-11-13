// About — Server Component
// Migrated from v1 HTML section #about
// No 'use client' — static content only
// Animations handled via AboutMotion (thin client wrapper)

import Image from 'next/image';
import Link from 'next/link';
import AboutMotion from './AboutMotion';

// ─── Team member data ────────────────────────────────────────────────────────

const teamMembers = [
  {
    name: 'Doug Rockefeller',
    title: 'Big Papa',
    bio: 'Resident philosopher and groundskeeper — Apprentice and Chief Counsel to Jack-of-all-Trades son Kyle — Head tool shed organizer — Co-Founder of Innisfree.',
    src: '/Photos/Doug%20Rockefeller%2C%20Big%20Papa.jpg',
    alt: 'Doug Rockefeller',
    width: 1118,
    height: 1677,
  },
  {
    name: 'Max Juge',
    title: 'Vice President',
    bio: "A full-time commercial real estate professional with a deep-rooted passion for the outdoors and the unique culture of South Louisiana. Having grown up fishing and hunting the salt marshes of Plaquemines Parish, Max brings a local's perspective and appreciation for the region to his work and life.",
    src: '/Photos/Max%20Juge%2C%20Vice%20President.jpg',
    alt: 'Max Juge',
    width: 1920,
    height: 2560,
  },
  {
    name: 'Ashley Toshimitsu Oiterong',
    title: 'Treasurer',
    bio: 'Born and raised in the Republic Island of Palau, a small country in the Pacific Ocean just west of Guam. Active in the US Army for 15 years as a Fatality Management Specialist. Loves to spend time with family fishing, hiking and exploring outdoors. Very competitive in backyard sports — baseball, table tennis, and Tag!',
    src: '/Photos/Ashley%20Toshimitsu%20Oiterong%2C%20Treasurer.jpg',
    alt: 'Ashley Toshimitsu Oiterong',
    width: 2500,
    height: 1667,
  },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function About() {
  return (
    <div className="text-text-dark dark:text-cream">

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <section className="relative w-full h-64 md:h-80 overflow-hidden">
        <Image
          src="/Photos/who we are.jpg"
          alt="Who We Are — Bayou Family Fishing community"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-green-deep/50 flex flex-col items-center justify-center text-center px-4">
          <p className="font-handwritten text-gold text-xl md:text-2xl mb-2 tracking-wide">
            the people behind it
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-white">
            About Us
          </h1>
        </div>
      </section>

      {/* ── Founder section ─────────────────────────────────────────────────── */}
      <AboutMotion>
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-10 md:p-14">
          <p className="font-handwritten text-amber text-xl text-center mb-10 tracking-wide">
            our founder
          </p>

          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Photo */}
            <div className="w-full md:w-72 shrink-0">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/Photos/Kyle%20Rockefeller%2C%20President%20and%20Secretary.jpg"
                  alt="Kyle Rockefeller"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 288px"
                />
              </div>
              <div className="mt-4 text-center md:text-left">
                <h2 className="font-display text-2xl text-green-deep dark:text-gold">
                  Kyle Rockefeller
                </h2>
                <p className="text-text-dark dark:text-cream/90 font-serif text-sm mt-1">
                  President &amp; Secretary
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1 space-y-4 font-serif text-base leading-relaxed text-text-dark dark:text-cream/90">
              <p>
                I love being around boats and airplanes! I spent a little time in uniform with the
                Louisiana Air National Guard, but it was over the many years as a contractor at
                Belle Chasse Naval Air Station where I feel like I really served.
              </p>
              <p>
                I finally became a good mechanic and did some work I was really proud of. However,
                the most important work was making friends and building relationships.
              </p>

              {/* Contact chips */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="mailto:kyle.rockefeller@bayoucharity.org"
                  className="inline-flex items-center gap-2 bg-amber/10 dark:bg-amber/20 text-amber-800 dark:text-amber font-sans text-sm px-4 py-2 rounded-full hover:bg-amber/20 dark:hover:bg-amber/30 transition-colors"
                >
                  ✉ kyle.rockefeller@bayoucharity.org
                </Link>
                <Link
                  href="tel:+15044745178"
                  className="inline-flex items-center gap-2 bg-green-water/10 dark:bg-green-water/30 text-green-water dark:text-cream font-sans text-sm px-4 py-2 rounded-full hover:bg-green-water/20 dark:hover:bg-green-water/40 transition-colors"
                >
                  📞 504-474-5178
                </Link>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>
      </AboutMotion>

      {/* ── Team section ────────────────────────────────────────────────────── */}
      <AboutMotion>
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="font-handwritten text-amber text-xl text-center mb-2 tracking-wide">
            the crew
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-green-deep dark:text-gold text-center mb-12">
            The Bayou Charity Team
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="glass-card overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <Image
                    src={member.src}
                    alt={member.alt}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl text-green-deep dark:text-gold">
                    {member.name}
                  </h3>
                  <p className="text-amber font-sans text-sm font-semibold mb-3">
                    {member.title}
                  </p>
                  <p className="font-serif text-sm text-text-mid dark:text-cream/80 leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Connect section ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-green-deep dark:text-gold text-center mb-12">
            Get In Touch
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Direct contact */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <h3 className="font-display text-xl text-green-deep dark:text-gold">
                📬 Get in Touch
              </h3>
              <Link
                href="mailto:kyle.rockefeller@bayoucharity.org"
                className="mt-auto inline-block text-center bg-amber text-white font-sans text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-amber/90 transition-colors shadow-[0_0_12px_rgba(232,146,58,0.35)]"
              >
                Send an Email
              </Link>
            </div>

            {/* Partner */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <h3 className="font-display text-xl text-green-deep dark:text-gold">
                Partner With Us
              </h3>
              <p className="font-serif text-sm text-text-mid dark:text-cream/80 leading-relaxed">
                Captains, businesses, and organizations — reach out and explore partnership and fishing opportunities.
              </p>
              <Link
                href="mailto:kyle.rockefeller@bayoucharity.org?subject=Partnership%20Inquiry"
                className="mt-auto inline-block text-center border border-green-water dark:border-gold text-green-water dark:text-gold font-sans text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-green-water/10 dark:hover:bg-gold/10 transition-colors"
              >
                Explore Partnership
              </Link>
            </div>

            {/* Press */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <h3 className="font-display text-xl text-green-deep dark:text-gold">
                Press &amp; Media
              </h3>
              <p className="font-serif text-sm text-text-mid dark:text-cream/80 leading-relaxed">
                Covering Louisiana nonprofits or outdoor culture? We&apos;d love to share the Bayou Family Fishing story.
              </p>
              <Link
                href="mailto:kyle.rockefeller@bayoucharity.org?subject=Press%20Inquiry"
                className="mt-auto inline-block text-center border border-green-water dark:border-gold text-green-water dark:text-gold font-sans text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-green-water/10 dark:hover:bg-gold/10 transition-colors"
              >
                Media Inquiry
              </Link>
            </div>
          </div>
        </div>
      </section>

      </AboutMotion>

    </div>
  );
}
