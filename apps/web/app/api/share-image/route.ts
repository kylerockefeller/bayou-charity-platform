import { composeShareImage, type ShareVariant } from '@/lib/share/compose';
import { loadShareRecord, type ShareKind } from '@/lib/share/load';

export const dynamic = 'force-dynamic';

const KINDS = new Set<ShareKind>(['pin', 'gallery', 'avatar']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind');
  const id = url.searchParams.get('id') ?? '';
  const variant = url.searchParams.get('variant') === 'og' ? 'og' : 'square';
  if (!kind || !KINDS.has(kind as ShareKind)) {
    return new Response('Unknown photo.', { status: 404 });
  }

  try {
    const record = await loadShareRecord(kind as ShareKind, id);
    if (!record) return new Response('Photo not available.', { status: 404 });
    const jpeg = await composeShareImage({
      photo: record.bytes,
      variant: variant as ShareVariant,
      crop: record.crop,
    });
    const download = url.searchParams.get('download') === '1';
    return new Response(Buffer.from(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="bayou-charity-catch.jpg"`,
      },
    });
  } catch {
    return new Response('Could not prepare the photo.', { status: 500 });
  }
}
