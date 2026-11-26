import { Image } from 'imagescript';
import { pinImageBox, sanitizeCrop, type PinCrop } from '@/lib/pin-crop';
import { readBundledAsset } from './assets';
import { STRIP_NAME, CLUB_URL } from './copy';
import {
  ACTIVE_SHARE_FRAME,
  BRAND,
  LOCKUP_HEIGHT,
  LOCKUP_WIDTH,
  LOGO_CROP,
  type ShareFrame,
} from './style';

export type ShareVariant = 'square' | 'og';
export type ForecastVariant = 'story' | 'og';

const LOCKUP_RATIO = LOCKUP_HEIGHT / LOCKUP_WIDTH;

const SHARE_SIZE: Record<ShareVariant, { width: number; height: number; strip: number; logoW: number; logoH: number }> = {
  square: { width: 1080, height: 1080, strip: 130, logoW: 860, logoH: 280 },
  og: { width: 1200, height: 630, strip: 90, logoW: 700, logoH: 190 },
};

let fontBuffers: Uint8Array[] | null = null;
let lockupImage: Image | null = null;

async function fonts(): Promise<Uint8Array[]> {
  if (fontBuffers) return fontBuffers;
  const regular = await readBundledAsset('regular');
  const bold = await readBundledAsset('bold');
  fontBuffers = [regular, bold];
  return fontBuffers;
}

// The PNG wordmark is white. Tint those letters to cream without touching the file.
function tintWordmark(logo: Image): Image {
  const copy = logo.clone();
  const cream = 0xf7f1e3;
  for (let y = 0; y < copy.height; y++) {
    for (let x = LOGO_CROP.width; x < copy.width; x++) {
      const pixel = copy.getPixelAt(x, y);
      const alpha = pixel & 0xff;
      if (alpha < 16) continue;
      const red = (pixel >>> 24) & 0xff;
      const green = (pixel >>> 16) & 0xff;
      const blue = (pixel >>> 8) & 0xff;
      if (red > 220 && green > 220 && blue > 220) {
        copy.setPixelAt(x, y, (cream << 8) | alpha);
      }
    }
  }
  return copy;
}

export async function loadLockup(): Promise<Image> {
  if (lockupImage) return lockupImage.clone();
  const bytes = await readBundledAsset('logo');
  lockupImage = tintWordmark(await Image.decode(bytes));
  return lockupImage.clone();
}

export async function loadMarshBackground(): Promise<Uint8Array> {
  return readBundledAsset('marsh');
}

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function framePhoto(source: Image, frameW: number, frameH: number, crop: PinCrop): Image {
  const box = pinImageBox(crop, { width: frameW, height: frameH }, { width: source.width, height: source.height });
  const width = Math.max(1, Math.round(box.width));
  const height = Math.max(1, Math.round(box.height));
  const resized = source.clone().resize(width, height, { mode: width < source.width ? 'area' : 'bicubic' });
  const canvas = new Image(frameW, frameH);
  canvas.fill(BRAND.brownFill);
  const srcX = Math.max(0, Math.round(-box.left));
  const srcY = Math.max(0, Math.round(-box.top));
  const destX = Math.max(0, Math.round(box.left));
  const destY = Math.max(0, Math.round(box.top));
  const cropW = Math.min(resized.width - srcX, frameW - destX);
  const cropH = Math.min(resized.height - srcY, frameH - destY);
  if (cropW > 0 && cropH > 0) {
    canvas.composite(resized.extract(srcX, srcY, cropW, cropH), { x: destX, y: destY });
  }
  return canvas;
}

type Box = { x: number; y: number; width: number; height: number };

function fitLockup(maxW: number, maxH: number): { width: number; height: number } {
  let width = maxW;
  let height = Math.round(width * LOCKUP_RATIO);
  if (height > maxH) {
    height = maxH;
    width = Math.round(height / LOCKUP_RATIO);
  }
  return { width, height };
}

function brandStrip(width: number, height: number, strip: number): string {
  const y = height - strip;
  const short = strip < 110;
  const titleSize = short ? 18 : 28;
  const urlSize = short ? 15 : 20;
  const titleY = short ? y + 30 : y + Math.round(strip * 0.42);
  const urlY = short ? y + 54 : y + Math.round(strip * 0.74);
  return `
    <rect x="0" y="${y}" width="${width}" height="${strip}" fill="${BRAND.brown}"/>
    <rect x="0" y="${y}" width="${width}" height="3" fill="${BRAND.gold}"/>
    <text x="${width / 2}" y="${titleY}" text-anchor="middle" fill="${BRAND.cream}" font-family="Liberation Sans" font-size="${titleSize}" font-weight="700">${xml(STRIP_NAME)}</text>
    <text x="${width / 2}" y="${urlY}" text-anchor="middle" fill="${BRAND.cream}" font-family="Liberation Sans" font-size="${urlSize}" font-weight="700">${xml(CLUB_URL)}</text>
  `;
}

function wordmarkScrim(place: Box): string {
  const square = Math.round(place.width * (LOGO_CROP.width / LOCKUP_WIDTH));
  if (place.width < square + 40) return '';
  const x = place.x + square - 4;
  const width = place.x + place.width - x;
  return `<rect x="${x}" y="${place.y + 6}" width="${width}" height="${Math.max(1, place.height - 12)}" rx="10" fill="${BRAND.brown}" fill-opacity="0.82"/>`;
}

function skyText(x: number, y: number, size: number, value: string): string {
  const escaped = xml(value);
  const shadows = [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2], [-2, 2], [0, 3]]
    .map(([dx, dy]) => `<text x="${x + dx}" y="${y + dy}" text-anchor="middle" fill="${BRAND.brown}" font-family="Liberation Sans" font-size="${size}" font-weight="700">${escaped}</text>`)
    .join('');
  return `${shadows}<text x="${x}" y="${y}" text-anchor="middle" fill="${BRAND.cream}" font-family="Liberation Sans" font-size="${size}" font-weight="700">${escaped}</text>`;
}

function fishRow(centerX: number, y: number, scale: number): string {
  const icon = 58 * scale;
  const gap = 16 * scale;
  const total = 5 * icon + 4 * gap;
  let x = centerX - total / 2;
  const icons = [0, 1, 2, 3, 4].map((index) => {
    const fill = index < 2 ? BRAND.gold : BRAND.fishOff;
    const node = `<g transform="translate(${Math.round(x)} ${y}) scale(${scale})" fill="${fill}">
      <path d="M2 14c8-10 28-10 40 0-12 10-32 10-40 0z"/>
      <path d="M42 14l16-10-4 10 4 10z"/>
      <circle cx="14" cy="12" r="2.2" fill="${BRAND.brown}"/>
    </g>`;
    x += icon + gap;
    return node;
  }).join('');
  const pad = 16 * scale;
  const pill = `<rect x="${Math.round(centerX - total / 2 - pad)}" y="${Math.round(y - 8 * scale)}" width="${Math.round(total + pad * 2)}" height="${Math.round(40 * scale)}" rx="${Math.round(18 * scale)}" fill="${BRAND.brown}" fill-opacity="0.72"/>`;
  return pill + icons;
}

const PANEL_LINES = [
  'THANKSGIVING FISHING FORECAST',
  'Rating: 2/5 • Fair, better in the afternoon',
  'Wind: about 16 mph and gusty this morning, easing this afternoon',
  'Air temp: 45°F at sunrise, high near 56°F',
  'Sky: clear, 0% rain',
  'Tide: —',
  'Water temp: —',
  'Tip: Let it warm up. Fish the protected lee shorelines after lunch.',
] as const;

function panelText(x: number, startY: number, titleSize: number, bodySize: number, gap: number): string {
  return PANEL_LINES.map((line, index) => {
    const size = index === 0 ? titleSize : bodySize;
    const weight = index === 0 ? 700 : 400;
    const y = startY + index * gap;
    return `<text x="${x}" y="${y}" fill="${BRAND.cream}" font-family="Liberation Sans" font-size="${size}" font-weight="${weight}">${xml(line)}</text>`;
  }).join('\n');
}

function forecastLayout(variant: ForecastVariant): { width: number; height: number; body: string } {
  if (variant === 'story') {
    const width = 1080;
    const height = 1350;
    const strip = 130;
    const lockup = fitLockup(880, 260);
    const place: Box = {
      x: Math.round((width - lockup.width) / 2),
      y: 250,
      width: lockup.width,
      height: lockup.height,
    };
    const fishY = place.y + place.height + 28;
    return {
      width,
      height,
      body: `
        ${wordmarkScrim(place)}
        <image href="logo" x="${place.x}" y="${place.y}" width="${place.width}" height="${place.height}"/>
        ${fishRow(width / 2, fishY, 0.92)}
        ${skyText(width / 2, fishY + 78, 28, 'Lower Plaquemines')}
        <rect x="48" y="760" width="${width - 96}" height="430" rx="18" fill="${BRAND.brown}" fill-opacity="0.88"/>
        ${panelText(80, 808, 26, 22, 44)}
        ${brandStrip(width, height, strip)}
      `,
    };
  }

  const width = 1200;
  const height = 630;
  const strip = 90;
  const lockup = fitLockup(520, 150);
  const place: Box = {
    x: Math.round((width - lockup.width) / 2),
    y: 28,
    width: lockup.width,
    height: lockup.height,
  };
  const fishY = place.y + place.height + 12;
  return {
    width,
    height,
    body: `
      ${wordmarkScrim(place)}
      <image href="logo" x="${place.x}" y="${place.y}" width="${place.width}" height="${place.height}"/>
      ${fishRow(width / 2, fishY, 0.55)}
      ${skyText(width / 2, fishY + 52, 18, 'Lower Plaquemines')}
      <rect x="48" y="300" width="${width - 96}" height="224" rx="14" fill="${BRAND.brown}" fill-opacity="0.9"/>
      ${panelText(68, 326, 16, 14, 24)}
      ${brandStrip(width, height, strip)}
    `,
  };
}

async function renderOverlay(photo: Image, logo: Image, svgBody: string, width: number, height: number): Promise<Uint8Array> {
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <image href="photo" x="0" y="0" width="${width}" height="${height}"/>
    ${svgBody}
  </svg>`;
  const rendered = await Image.renderSVG(svg, {
    font: await fonts(),
    images: { photo, logo },
  });
  return withoutExif(await rendered.encodeJPEG({ quality: 86, background: BRAND.brownFill }));
}

function withoutExif(jpeg: Uint8Array): Uint8Array {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg;
  const chunks: Uint8Array[] = [jpeg.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 < jpeg.length) {
    if (jpeg[offset] !== 0xff) {
      chunks.push(jpeg.subarray(offset));
      break;
    }
    const marker = jpeg[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(jpeg.subarray(offset));
      break;
    }
    const size = (jpeg[offset + 2] << 8) | jpeg[offset + 3];
    const next = offset + 2 + size;
    const label = String.fromCharCode(jpeg[offset + 4] ?? 0, jpeg[offset + 5] ?? 0, jpeg[offset + 6] ?? 0, jpeg[offset + 7] ?? 0);
    if (!(marker === 0xe1 && label === 'Exif')) chunks.push(jpeg.subarray(offset, next));
    offset = next;
  }
  const out = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}

function lockupBox(style: ShareFrame, width: number, height: number, strip: number, maxW: number, maxH: number): Box {
  if (style === 'corner-badge') {
    const size = Math.round(Math.min(width, height) * 0.18);
    return { x: width - size - 36, y: 36, width: size, height: size };
  }
  const fitted = fitLockup(style === 'sunset-frame' ? Math.round(maxW * 0.72) : maxW, maxH);
  const stripY = height - strip;
  const y = Math.max(28, Math.round((stripY - fitted.height) * 0.28));
  return {
    x: Math.round((width - fitted.width) / 2),
    y,
    width: fitted.width,
    height: fitted.height,
  };
}

export async function composeShareImage(input: {
  photo: Uint8Array;
  variant: ShareVariant;
  crop?: PinCrop | null;
  style?: ShareFrame;
}): Promise<Uint8Array> {
  const style = input.style ?? ACTIVE_SHARE_FRAME;
  const size = SHARE_SIZE[input.variant];
  const decoded = await Image.decode(input.photo);
  const photo = framePhoto(decoded, size.width, size.height, sanitizeCrop(input.crop ?? { x: 50, y: 50, zoom: 1 }));
  const lockup = await loadLockup();
  const place = lockupBox(style, size.width, size.height, size.strip, size.logoW, size.logoH);
  const logo = style === 'corner-badge'
    ? lockup.extract(0, 0, Math.min(LOGO_CROP.width, lockup.width), Math.min(LOGO_CROP.height, lockup.height))
    : lockup;
  const frame = style === 'sunset-frame'
    ? `<rect x="12" y="12" width="${size.width - 24}" height="${size.height - 24}" fill="none" stroke="${BRAND.gold}" stroke-width="8"/>`
    : '';
  const body = `
    ${frame}
    ${style === 'corner-badge' ? '' : wordmarkScrim(place)}
    <image href="logo" x="${place.x}" y="${place.y}" width="${place.width}" height="${place.height}"/>
    ${brandStrip(size.width, size.height, size.strip)}
  `;
  return renderOverlay(photo, logo, body, size.width, size.height);
}

export async function composeForecastCard(input: {
  background: Uint8Array;
  variant: ForecastVariant;
}): Promise<Uint8Array> {
  const layout = forecastLayout(input.variant);
  const decoded = await Image.decode(input.background);
  const photo = framePhoto(decoded, layout.width, layout.height, { x: 50, y: 38, zoom: 1 });
  const logo = await loadLockup();
  return renderOverlay(photo, logo, layout.body, layout.width, layout.height);
}
