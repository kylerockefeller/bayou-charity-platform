import { readBundledAsset } from '@/lib/share/assets';

export const dynamic = 'force-dynamic';

// The cards are rendered ahead of time. Drawing the 1080×1350 card on the
// worker exceeds the CPU limit, so this route only hands back those files.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const og = url.searchParams.get('size') === 'og';
  const download = url.searchParams.get('download') === '1';
  const filename = og
    ? 'thanksgiving-forecast-1200x630.jpg'
    : 'thanksgiving-forecast-1080x1350.jpg';

  try {
    const jpeg = await readBundledAsset(og ? 'forecastOg' : 'forecastStory');
    return new Response(Buffer.from(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'render failed';
    return new Response(`Could not render the preview card. ${detail.slice(0, 180)}`, { status: 500 });
  }
}
