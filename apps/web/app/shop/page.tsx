// Shop page — App Router Server Component
// Nav padding rule: interior page → pt-24

import Shop from '@/components/shop';
import PageBackground from '@/components/shared/PageBackground';

export default function ShopPage() {
  return (
    <>
      <PageBackground page="donate" />
      <main className="relative z-10 pt-24">
        <Shop />
      </main>
    </>
  );
}
