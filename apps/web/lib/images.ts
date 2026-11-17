// Widths Next.js will actually serve. Keep this aligned with next.config
// deviceSizes/imageSizes so a popup request is not rejected.
const OPTIMIZED_WIDTHS = [256, 384, 640, 750, 828, 1080, 1200, 1920, 2048];

// Leaflet popups cannot use next/image. This hits the same optimizer so the
// browser does not download the original file.
export function optimizedImageSrc(src: string, width: number): string {
  const w = OPTIMIZED_WIDTHS.find((n) => n >= width) ?? OPTIMIZED_WIDTHS[OPTIMIZED_WIDTHS.length - 1];
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}
