import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { ID_PATTERN, OG_DESCRIPTION } from '@/lib/share/copy';
import { loadShareMeta, type ShareKind } from '@/lib/share/load';

async function origin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'bayou-charity-web-staging.bayoucharity.workers.dev';
  const proto = headerList.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

export async function shareMetadata(kind: ShareKind, id: string): Promise<Metadata> {
  const record = ID_PATTERN.test(id) ? await loadShareMeta(kind, id) : null;
  const title = record?.title ?? 'Fish Pics | Bayou Charity Fishing Club';
  const base = await origin();
  const image = `${base}/api/share-image?kind=${kind}&id=${id}&variant=og`;
  return {
    title,
    description: OG_DESCRIPTION,
    openGraph: {
      title,
      description: OG_DESCRIPTION,
      images: [{ url: image, width: 1200, height: 630 }],
    },
  };
}

export async function ShareLanding({ kind, id }: { kind: ShareKind; id: string }) {
  if (!ID_PATTERN.test(id)) notFound();
  const record = await loadShareMeta(kind, id);
  if (!record) notFound();
  const alt = record.species
    ? `${record.species} from the Bayou Charity Fishing Club`
    : 'Fish Pics from the Bayou Charity Fishing Club';
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-28">
      <img
        src={`/api/share-image?kind=${kind}&id=${id}&variant=square`}
        width={1080}
        height={1080}
        alt={alt}
        className="h-auto w-full rounded-xl"
      />
      {record.species && (
        <p className="mt-4 font-display text-2xl text-green-deep dark:text-cream">{record.species}</p>
      )}
      <p className="mt-3 font-serif text-sm leading-relaxed text-text-mid dark:text-cream/70">
        {OG_DESCRIPTION}
      </p>
    </main>
  );
}

export function sharePage(kind: ShareKind) {
  return async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ShareLanding kind={kind} id={id} />;
  };
}

export function shareMeta(kind: ShareKind) {
  return async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    return shareMetadata(kind, id);
  };
}
