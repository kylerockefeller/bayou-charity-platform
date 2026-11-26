import Image from 'next/image';
import { ZeffyEmbed } from '@/components/shared/ZeffyEmbed';

const ZEFFY_STORE_URL = 'https://www.zeffy.com/en-US/ticketing/bayou-charity-shop';
const ZEFFY_EMBED_URL = 'https://www.zeffy.com/en-US/embed/ticketing/bayou-charity-shop';

type ShopProduct = {
  name: string;
  price: string;
  details?: string;
  sizes?: string[];
  image: string;
  imageAlt: string;
};

// Manual catalog. Zeffy has no public product feed, so add the next shirt here.
const PRODUCTS: ShopProduct[] = [
  {
    name: "Remember Everyone Deployed - Bayou Charity's RED Friday T-Shirt",
    price: 'US$25',
    details: 'Wear Your Red on Friday! Support Military Families.',
    image: '/shop/red-friday-tshirt.jpg',
    imageAlt:
      'Red t-shirt showing a redfish over an American flag, with R.E.D. FISH, Remember Everyone Deployed, and Support Military Families',
  },
];

export default function Shop() {
  return (
    <section id="shop" className="py-0 min-h-screen">
      <div className="py-20 px-4 text-center">
        <h1
          className="font-display text-5xl md:text-6xl text-white mb-4"
          style={{ textShadow: '0 2px 12px rgba(13,43,62,0.7)' }}
        >
          Bayou Charity Shop
        </h1>
        <div className="w-16 h-0.5 bg-gold mx-auto mb-6" />
        <p
          className="font-serif text-cream/90 max-w-2xl mx-auto leading-relaxed text-lg"
          style={{ textShadow: '0 1px 6px rgba(13,43,62,0.6)' }}
        >
          T-shirts and hats supporting Bayou Charity&apos;s coastal restoration and fishing trips for military families.
        </p>
        <p className="font-serif text-sm text-cream/70 max-w-2xl mx-auto mt-4 leading-relaxed">
          Merch purchases support Bayou Charity. The cost of the item is not tax-deductible.
        </p>
      </div>

      <div className="container mx-auto px-4 max-w-6xl pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PRODUCTS.map((product) => (
            <article key={product.name} className="glass-card p-6 sm:p-8">
              <div className="relative aspect-square rounded-xl overflow-hidden mb-6 bg-cream">
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-contain"
                />
              </div>
              <h2 className="font-display text-2xl text-green-deep dark:text-gold mb-2 leading-snug">
                {product.name}
              </h2>
              <p className="font-display text-xl text-amber-700 dark:text-amber mb-2">{product.price}</p>
              {product.details ? (
                <p className="font-serif text-sm text-text-mid dark:text-cream/80 leading-relaxed mb-3">
                  {product.details}
                </p>
              ) : null}
              {product.sizes && product.sizes.length > 0 ? (
                <p className="font-serif text-sm text-text-mid dark:text-cream/70 mb-6">
                  Sizes: {product.sizes.join(', ')}
                </p>
              ) : null}
              <a
                href={ZEFFY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 rounded-full font-semibold text-white font-serif transition-all duration-200 hover:scale-105 bg-amber"
              >
                Buy on Zeffy
              </a>
            </article>
          ))}
        </div>

        <p className="font-serif text-sm text-cream/80 text-center mt-8">
          <a
            href={ZEFFY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:underline"
          >
            Open the Bayou Charity store on Zeffy
          </a>
        </p>

        <div className="glass-card p-6 sm:p-8 mt-10">
          <h2 className="font-display text-2xl text-green-deep dark:text-gold mb-2">Buy on this page</h2>
          <p className="font-serif text-sm text-text-mid dark:text-cream/70 mb-4 leading-relaxed">
            The form below is Zeffy&apos;s live store embed, so the price and availability stay in sync with the shop.
          </p>
          <ZeffyEmbed
            src={ZEFFY_EMBED_URL}
            title="Bayou Charity Shop on Zeffy"
            height="900px"
          />
        </div>
      </div>
    </section>
  );
}
