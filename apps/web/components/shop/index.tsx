// TODO: replace with the Bayou Charity Zeffy store URL.
const ZEFFY_STORE_URL = 'https://www.zeffy.com/';

const PRODUCTS = [
  { name: 'Bayou Charity T-Shirt' },
  { name: 'Bayou Charity Hat' },
] as const;

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
          {PRODUCTS.map(({ name }) => (
            <article key={name} className="glass-card p-8">
              <div
                role="img"
                aria-label="Photo coming soon"
                className="aspect-[4/3] rounded-xl mb-6 flex items-center justify-center border border-dashed border-green-water/30 dark:border-cream/20 bg-cream/70 dark:bg-green-deep/50"
              >
                <span className="font-serif text-sm text-text-mid dark:text-cream/70">
                  Photo coming soon
                </span>
              </div>
              <h2 className="font-display text-2xl text-green-deep dark:text-gold mb-2">{name}</h2>
              <p className="font-serif text-sm text-text-mid dark:text-cream/70 mb-6">
                Price and sizes coming soon
              </p>
              <a
                href={ZEFFY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 rounded-full font-semibold text-white font-serif transition-all duration-200 hover:scale-105 bg-amber"
              >
                Shop on Zeffy
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
