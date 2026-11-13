import type { CSSProperties } from 'react';

// Focal point is a percentage of the photo. Zoom is a scale of at least 1.
// Null or a missing column means the current centered cover crop.
export type PinCrop = {
  x: number;
  y: number;
  zoom: number;
};

export const DEFAULT_PIN_CROP: PinCrop = { x: 50, y: 50, zoom: 1 };
/** Map popup and the crop editor share this width/height ratio. */
export const PIN_PHOTO_ASPECT = '2 / 1';

export function normalizePinCrop(row: {
  photo_crop_x?: number | null;
  photo_crop_y?: number | null;
  photo_crop_zoom?: number | null;
} | null | undefined): PinCrop {
  return sanitizeCrop({
    x: typeof row?.photo_crop_x === 'number' ? row.photo_crop_x : DEFAULT_PIN_CROP.x,
    y: typeof row?.photo_crop_y === 'number' ? row.photo_crop_y : DEFAULT_PIN_CROP.y,
    zoom: typeof row?.photo_crop_zoom === 'number' ? row.photo_crop_zoom : DEFAULT_PIN_CROP.zoom,
  });
}

export function sanitizeCrop(crop: PinCrop): PinCrop {
  return {
    x: clamp(crop.x, 0, 100, DEFAULT_PIN_CROP.x),
    y: clamp(crop.y, 0, 100, DEFAULT_PIN_CROP.y),
    zoom: clamp(crop.zoom, 1, 4, DEFAULT_PIN_CROP.zoom),
  };
}

export function pinCropStyle(crop: PinCrop): CSSProperties {
  return {
    objectFit: 'cover',
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: `scale(${crop.zoom})`,
    transformOrigin: `${crop.x}% ${crop.y}%`,
  };
}

export function isMissingCropColumn(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? '').toLowerCase();
  return error.code === '42703'
    || error.code === 'PGRST204'
    || message.includes('photo_crop');
}

function clamp(value: number | null | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
