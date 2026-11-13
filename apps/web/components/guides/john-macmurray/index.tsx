import Link from 'next/link';

// Draft page for Kyle to review. Media slots stay empty until he supplies files.
// Do not pull photos or video from approachangling.com.

const CONTACT_LINKS = [
  { text: 'approachangling.com', href: 'https://approachangling.com' },
  { text: 'approachangling.com/louisiana', href: 'https://approachangling.com/louisiana' },
  { text: '307-453-1189', href: 'tel:+13074531189' },
  { text: 'info@approachangling.com', href: 'mailto:info@approachangling.com' },
  {
    text: 'Instagram: @approachanglingcompany',
    href: 'https://www.instagram.com/approachanglingcompany',
  },
];

export default function JohnMacMurrayGuide() {
  return (
    <section id="john-macmurray" className="py-0 min-h-screen">

      {/* Hero matches Donate: eyebrow, display title, gold rule, serif lede on the skyline */}
      <div className="py-20 px-4 text-center">
        <p className="font-accent text-amber text-lg mb-1">Resident Guide</p>
        <h1
          className="font-display text-5xl md:text-6xl text-white mb-4"
          style={{ textShadow: '0 2px 12px rgba(13,43,62,0.7)' }}
        >
          Capt. John <em>MacMurray</em>
        </h1>
        <div className="w-16 h-0.5 bg-gold mx-auto mb-6" />
        <p
          className="font-serif text-cream/90 max-w-2xl mx-auto leading-relaxed text-lg"
          style={{ textShadow: '0 1px 6px rgba(13,43,62,0.6)' }}
        >
          Capt. John MacMurray of Approach Angling Co. is Bayou Charity&apos;s resident fly
          fishing guide. He is a licensed guide and an FFI certified casting instructor. In fall
          and winter he guides the Louisiana coastal marsh for redfish. From April through
          September he guides the Greater Yellowstone, out of Jackson Hole, Wyoming.
        </p>
      </div>

      {/* Same two-column shell as Donate: sticky card left, stacked cards right */}
      <div className="container mx-auto px-4 max-w-6xl pb-20">
        <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-12 mt-8" style={{ alignItems: 'start' }}>

          <div className="md:sticky md:top-28 self-start glass-card p-8">
            <h2 className="font-display text-2xl text-gold mb-1">Approach Angling Co.</h2>
            <p className="font-serif text-sm text-text-mid dark:text-cream/70 mb-4 leading-relaxed">
              Capt. John MacMurray. Licensed guide. FFI certified casting instructor. 5.0 Google rating.
            </p>

            <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 mb-4">
              <p className="font-serif text-sm text-text-dark dark:text-cream leading-relaxed">
                Trips are booked directly with each guide. Bayou Charity does not take a commission or receive any payment from bookings.
              </p>
            </div>

            {/* TODO: Kyle will provide a hero photo of Capt. John MacMurray. */}
            <div className="rounded-xl overflow-hidden border border-green-water/20 dark:border-cream/10">
              <div
                className="min-h-[280px] flex flex-col items-center justify-center text-center px-6 py-10 bg-green-deep/5"
                role="img"
                aria-label="Hero photo of Capt. John MacMurray coming soon"
              >
                <p className="font-display text-xl text-green-deep dark:text-gold mb-2">Photo coming soon</p>
                <p className="font-serif text-sm text-text-mid dark:text-cream/70">
                  Hero photo of Capt. John MacMurray. Kyle will add this.
                </p>
              </div>
            </div>
            <p className="font-serif text-xs text-text-mid dark:text-cream/70 mt-2 text-center">
              Placeholder only. No photo has been added yet.
            </p>

            <div className="mt-4">
              {CONTACT_LINKS.map(({ text, href }) => (
                <a
                  key={text}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="font-serif text-sm text-amber hover:underline flex items-center min-h-[36px]"
                >
                  {text}
                </a>
              ))}
              <Link
                href="/donate"
                className="font-serif text-sm text-amber hover:underline flex items-center min-h-[36px]"
              >
                Back to Donate
              </Link>
            </div>
          </div>

          <div className="space-y-8">

            <div className="glass-card p-6">
              <h2 className="font-display text-2xl text-green-deep dark:text-gold mb-1">Take care of the water</h2>
              <p className="font-serif text-xs text-text-mid dark:text-cream/60 mb-4 uppercase tracking-widest">
                Fly fishing conservation
              </p>
              <p className="font-serif text-sm text-text-dark dark:text-cream/80 leading-relaxed mb-4">
                His approach, in his own words: &ldquo;put people on fish, take care of the water, and let the experience speak for itself.&rdquo;
              </p>
              <p className="font-serif text-sm text-text-dark dark:text-cream/80 leading-relaxed">
                That is the conservation at the heart of a day with him. The marsh is not scenery behind the cast. Taking care of the water is part of the fishing.
              </p>
            </div>

            <div className="glass-card--dark p-8 rounded-xl">
              <h3 className="font-display text-xl text-gold mb-2">Redfish on the flats</h3>
              <p className="font-serif text-xs text-cream/60 mb-4 uppercase tracking-widest">
                Coastal marsh
              </p>
              <p className="font-serif text-sm text-cream/95 leading-relaxed mb-4">
                In fall and winter he guides the Louisiana coastal marsh for redfish. The fish are in the 6–12 pound class, and they show on an incoming tide. This is shallow water: redfish on tailing flats, a skiff, and a push-pole so the boat can move in quietly.
              </p>
              <p className="font-serif text-sm text-cream/95 leading-relaxed">
                The marsh is worth learning, not only fishing. Louisiana&apos;s coast is losing land. What remains still raises fish and softens storms. A slow day on the flats is one way to see why that water matters.
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl">
              <h3 className="font-display text-xl text-green-deep dark:text-gold mb-2">Learn the cast</h3>
              <p className="font-serif text-xs text-text-mid dark:text-cream/60 mb-4 uppercase tracking-widest">
                Fly fishing instruction
              </p>
              <p className="font-serif text-sm text-text-dark dark:text-cream/80 leading-relaxed">
                Capt. MacMurray is an FFI certified casting instructor with Fly Fishers International. He guides with a fly rod on the Louisiana marsh in the cool months, and on the Greater Yellowstone from April through September.
              </p>
            </div>

            <div className="glass-card--dark p-8 rounded-xl">
              <h3 className="font-display text-xl text-gold mb-2">Our resident fly fishing guide</h3>
              <p className="font-serif text-sm text-cream/95 leading-relaxed mb-4">
                When Bayou Charity talks about a fly rod, this is the guide we mean. Capt. John MacMurray of Approach Angling Co. is our resident expert: a licensed guide and an FFI certified casting instructor, on the water in both seasons of his year.
              </p>
              <p className="font-serif text-sm text-cream/95 leading-relaxed">
                Fall and winter: Louisiana coastal marsh, redfish. April through September: Greater Yellowstone and Jackson Hole, Wyoming.
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl">
              <h3 className="font-display text-xl text-green-deep dark:text-gold mb-2">Photos</h3>
              <p className="font-serif text-sm text-text-mid dark:text-cream/80 leading-relaxed mb-4">
                Photos of Capt. John MacMurray will go here once Kyle sends them.
              </p>
              {/* TODO: Kyle will provide gallery photos of Capt. John MacMurray. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {['Gallery photo 1', 'Gallery photo 2', 'Gallery photo 3'].map((label) => (
                  <div
                    key={label}
                    className="min-h-[140px] rounded-lg border border-dashed border-green-water/30 bg-cream dark:bg-green-deep/40 flex items-center justify-center text-center px-4"
                    role="img"
                    aria-label={`${label} coming soon`}
                  >
                    <span className="font-serif text-sm text-text-mid dark:text-cream/70">{label} — coming soon</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card--dark p-8 rounded-xl">
              <h3 className="font-display text-xl text-gold mb-2">Video</h3>
              <p className="font-serif text-sm text-cream/95 leading-relaxed mb-4">
                A video of Capt. John MacMurray will go here once Kyle sends it.
              </p>
              {/* TODO: Kyle will provide a video of Capt. John MacMurray for this embed slot. */}
              <div
                className="aspect-video rounded-xl overflow-hidden border border-cream/20 flex flex-col items-center justify-center text-center px-6"
                role="img"
                aria-label="Video of Capt. John MacMurray coming soon"
              >
                <p className="font-display text-xl text-gold mb-2">Video coming soon</p>
                <p className="font-serif text-sm text-cream/70">
                  Embed slot. Kyle will provide the video.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
