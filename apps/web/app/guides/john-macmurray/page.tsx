// Guide profile — same shell as Donate (skyline background, pt-24, glass cards).
// Nav padding rule: interior page → pt-24

import type { Metadata } from 'next';
import JohnMacMurrayGuide from '@/components/guides/john-macmurray';
import PageBackground from '@/components/shared/PageBackground';

export const metadata: Metadata = {
  title: 'Capt. John MacMurray — Approach Angling Co.',
  description:
    'Bayou Charity’s resident fly fishing guide. Licensed guide and FFI certified casting instructor. Louisiana coastal marsh in fall and winter; Greater Yellowstone from April through September.',
  openGraph: {
    title: 'Capt. John MacMurray — Approach Angling Co.',
    description:
      'Bayou Charity’s resident fly fishing guide. Licensed guide and FFI certified casting instructor.',
    url: 'https://bayoucharity.org/guides/john-macmurray',
    images: [
      {
        url: 'https://bayoucharity.org/Photos/skyline-og.jpg',
        width: 1920,
        height: 887,
        alt: 'Golden hour over the Louisiana bayou — Bayou Family Fishing',
      },
    ],
    type: 'website',
  },
};

export default function JohnMacMurrayPage() {
  return (
    <>
      <PageBackground page="donate" />
      <main className="relative z-10 pt-24">
        <JohnMacMurrayGuide />
      </main>
    </>
  );
}
