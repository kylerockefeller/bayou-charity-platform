import type { CSSProperties } from 'react';

// Focal point is a percentage of the photo. Zoom is a multiplier on the
// cover fit: 1 fills the frame, below 1 shrinks toward the whole image,
// above 1 zooms in. Null means the centered cover crop.
export type PinCrop = {
  x: number;
  y: number;
  zoom: number;
};

export const DEFAULT_PIN_CROP: PinCrop = { x: 50, y: 50, zoom: 1 };
export const MIN_PIN_ZOOM = 0.02;
export const MAX_PIN_ZOOM = 4;
/** Map popup and the crop editor share this width/height ratio. */
export const PIN_PHOTO_ASPECT = '2 / 1';

export type PinSize = { width: number; height: number };

/** Zoom that fits the whole image inside the frame (contain), relative to cover. */
export function containZoomFor(frame: PinSize, image: PinSize): number {
  if (frame.width <= 0 || frame.height <= 0 || image.width <= 0 || image.height <= 0) return 1;
  const cover = Math.max(frame.width / image.width, frame.height / image.height);
  const contain = Math.min(frame.width / image.width, frame.height / image.height);
  if (cover <= 0) return 1;
  return contain / cover;
}

/**
 * Place the photo in the frame. Zoom 1 matches object-fit: cover plus the
 * focal point. Smaller zoom reveals more of the image, down to contain.
 */
export function pinImageBox(crop: PinCrop, frame: PinSize, image: PinSize): {
  width: number;
  height: number;
  left: number;
  top: number;
} {
  const cover = Math.max(frame.width / image.width, frame.height / image.height);
  const width = image.width * cover * crop.zoom;
  const height = image.height * cover * crop.zoom;
  return {
    width,
    height,
    left: (crop.x / 100) * (frame.width - width),
    top: (crop.y / 100) * (frame.height - height),
  };
}

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
    zoom: clamp(crop.zoom, MIN_PIN_ZOOM, MAX_PIN_ZOOM, DEFAULT_PIN_CROP.zoom),
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

/** Size an img element to pinImageBox. The frame must be position: relative. */
export function placePinImage(img: HTMLImageElement, frame: HTMLElement, crop: PinCrop): void {
  const rect = frame.getBoundingClientRect();
  if (!img.naturalWidth || rect.width < 1 || rect.height < 1) return;
  const box = pinImageBox(
    crop,
    { width: rect.width, height: rect.height },
    { width: img.naturalWidth, height: img.naturalHeight },
  );
  img.style.position = 'absolute';
  img.style.maxWidth = 'none';
  img.style.objectFit = 'fill';
  img.style.width = `${box.width}px`;
  img.style.height = `${box.height}px`;
  img.style.left = `${box.left}px`;
  img.style.top = `${box.top}px`;
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
