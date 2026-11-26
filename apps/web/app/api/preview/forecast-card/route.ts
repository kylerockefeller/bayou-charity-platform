import { composeForecastCard, loadMarshBackground, type ForecastVariant } from '@/lib/share/compose';

export const dynamic = 'force-dynamic';

const cache = new Map<ForecastVariant, Uint8Array>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const size = url.searchParams.get('size') === 'og' ? 'og' : 'story';
  const download = url.searchParams.get('download') === '1';
  const filename = size === 'og'
    ? 'thanksgiving-forecast-1200x630.jpg'
    : 'thanksgiving-forecast-1080x1350.jpg';

  try {
    let jpeg = cache.get(size);
    if (!jpeg) {
      jpeg = await composeForecastCard({
        background: await loadMarshBackground(),
        variant: size,
      });
      cache.set(size, jpeg);
    }
    return new Response(Buffer.from(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
      },
    });
  } catch {
    return new Response('Could not render the preview card.', { status: 500 });
  }
}
