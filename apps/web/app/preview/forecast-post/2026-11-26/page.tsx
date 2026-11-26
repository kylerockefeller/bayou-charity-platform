import type { Metadata } from 'next';
import { THANKSGIVING_CAPTION } from '@/lib/share/copy';

export const metadata: Metadata = {
  title: 'Draft preview — Thanksgiving forecast',
  robots: { index: false, follow: false, nocache: true },
};

export default function ThanksgivingForecastPreview() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-28">
      <p className="inline-block rounded-full bg-amber px-4 py-2 font-serif text-sm font-semibold tracking-wide text-white">
        DRAFT PREVIEW — not posted
      </p>
      <h1 className="mt-5 font-display text-3xl text-green-deep dark:text-cream">
        Thanksgiving fishing forecast
      </h1>
      <p className="mt-2 font-serif text-sm text-text-mid dark:text-cream/70">
        November 26, 2026 · Lower Plaquemines · staging review
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-lg text-green-deep dark:text-cream">1080×1350</h2>
        <img
          src="/api/preview/forecast-card?size=story"
          width={1080}
          height={1350}
          alt="Thanksgiving fishing forecast card, 1080 by 1350"
          className="h-auto w-full rounded-xl border border-gold/30"
        />
        <a
          href="/api/preview/forecast-card?size=story&download=1"
          download="thanksgiving-forecast-1080x1350.jpg"
          className="inline-block rounded-full bg-green-deep px-4 py-2 font-serif text-sm text-cream"
        >
          Download 1080×1350
        </a>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-lg text-green-deep dark:text-cream">1200×630</h2>
        <img
          src="/api/preview/forecast-card?size=og"
          width={1200}
          height={630}
          alt="Thanksgiving fishing forecast card, 1200 by 630"
          className="h-auto w-full rounded-xl border border-gold/30"
        />
        <a
          href="/api/preview/forecast-card?size=og&download=1"
          download="thanksgiving-forecast-1200x630.jpg"
          className="inline-block rounded-full bg-green-deep px-4 py-2 font-serif text-sm text-cream"
        >
          Download 1200×630
        </a>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg text-green-deep dark:text-cream">Caption</h2>
        <p className="mt-3 whitespace-pre-wrap font-serif text-base leading-relaxed text-text-dark dark:text-cream">
          {THANKSGIVING_CAPTION}
        </p>
      </section>
    </main>
  );
}
