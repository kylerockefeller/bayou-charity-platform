'use client';

import { useEffect, useRef, useState } from 'react';
import { optimizedImageSrc } from '@/lib/images';
import {
  MAX_PIN_ZOOM,
  PIN_PHOTO_ASPECT,
  containZoomFor,
  normalizePinCrop,
  pinImageBox,
  type PinCrop,
  type PinSize,
} from '@/lib/pin-crop';

type CropPin = {
  id: string;
  photo_url: string;
  caption?: string | null;
  photo_crop_x?: number | null;
  photo_crop_y?: number | null;
  photo_crop_zoom?: number | null;
};

function hasSavedCrop(pin: CropPin): boolean {
  return typeof pin.photo_crop_zoom === 'number'
    || typeof pin.photo_crop_x === 'number'
    || typeof pin.photo_crop_y === 'number';
}

export function CroppedPinPhoto({
  src,
  alt,
  crop,
  onNaturalSize,
  concealed = false,
}: {
  src: string;
  alt: string;
  crop: PinCrop;
  onNaturalSize?: (size: PinSize) => void;
  concealed?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const naturalRef = useRef<PinSize | null>(null);
  const [box, setBox] = useState<ReturnType<typeof pinImageBox> | null>(null);

  const rememberSize = (img: HTMLImageElement) => {
    if (!img.naturalWidth) return;
    const size = { width: img.naturalWidth, height: img.naturalHeight };
    naturalRef.current = size;
    onNaturalSize?.(size);
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    setBox(pinImageBox(crop, { width: rect.width, height: rect.height }, size));
  };

  useEffect(() => {
    const frame = frameRef.current;
    const natural = naturalRef.current;
    if (frame && natural) {
      const rect = frame.getBoundingClientRect();
      if (rect.width >= 1 && rect.height >= 1) {
        setBox(pinImageBox(crop, { width: rect.width, height: rect.height }, natural));
      }
    }
    if (!frame) return;
    const observer = new ResizeObserver(() => {
      const size = naturalRef.current;
      const rect = frame.getBoundingClientRect();
      if (!size || rect.width < 1 || rect.height < 1) return;
      setBox(pinImageBox(crop, { width: rect.width, height: rect.height }, size));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [crop]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) rememberSize(img);
    // A cached image can finish loading before React binds onLoad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="absolute max-w-none pointer-events-none select-none"
        style={box && !concealed
          ? { width: box.width, height: box.height, left: box.left, top: box.top }
          : { visibility: 'hidden' }}
        onLoad={(event) => rememberSize(event.currentTarget)}
      />
    </div>
  );
}

export function PinCropEditor({
  pin,
  onClose,
  onSaved,
}: {
  pin: CropPin;
  onClose: () => void;
  onSaved: (crop: PinCrop) => void;
}) {
  const saved = hasSavedCrop(pin);
  const [crop, setCrop] = useState<PinCrop>(() => saved ? normalizePinCrop(pin) : { x: 50, y: 50, zoom: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [natural, setNatural] = useState<PinSize | null>(null);
  const [frameSize, setFrameSize] = useState<PinSize | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ id: number; x: number; y: number; cropX: number; cropY: number; zoom: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const fitted = useRef(saved);
  const [showPhoto, setShowPhoto] = useState(saved);
  const minZoomRef = useRef(MIN_FIT_ZOOM);

  const containZoom = natural && frameSize ? containZoomFor(frameSize, natural) : 1;
  const minZoom = Math.max(MIN_FIT_ZOOM, containZoom * 0.85);
  minZoomRef.current = minZoom;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      setFrameSize({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
            if (fitted.current || !natural || !frameSize) return;
    fitted.current = true;
    setCrop({ x: 50, y: 50, zoom: containZoomFor(frameSize, natural) });
    setShowPhoto(true);
  }, [natural, frameSize]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 0.06 : -0.06;
      setCrop((current) => ({ ...current, zoom: clampZoom(current.zoom + delta, minZoomRef.current) }));
    };
    frame.addEventListener('wheel', onWheel, { passive: false });
    return () => frame.removeEventListener('wheel', onWheel);
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, cropX: crop.x, cropY: crop.y, zoom: crop.zoom };
      pinch.current = null;
    } else if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: crop.zoom };
      drag.current = null;
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const frame = frameRef.current;
    if (!frame) return;

    if (pointers.current.size >= 2 && pinch.current && pinch.current.distance > 0) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const nextZoom = clampZoom(pinch.current.zoom * (distance / pinch.current.distance), minZoomRef.current);
      setCrop((current) => ({ ...current, zoom: nextZoom }));
      return;
    }

    if (!drag.current || drag.current.id !== event.pointerId) return;
    const rect = frame.getBoundingClientRect();
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    const start = drag.current;
    let spanX = rect.width;
    let spanY = rect.height;
    if (natural && natural.width > 0 && natural.height > 0 && rect.width > 0 && rect.height > 0) {
      const cover = Math.max(rect.width / natural.width, rect.height / natural.height);
      spanX = rect.width - natural.width * cover * start.zoom;
      spanY = rect.height - natural.height * cover * start.zoom;
    }
    setCrop((current) => ({
      ...current,
      x: clampPercent(Math.abs(spanX) < 1 ? start.cropX : start.cropX + (dx * 100) / spanX),
      y: clampPercent(Math.abs(spanY) < 1 ? start.cropY : start.cropY + (dy * 100) / spanY),
    }));
  }

  function onPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (drag.current?.id === event.pointerId) drag.current = null;
    if (pointers.current.size < 2) pinch.current = null;
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const result = await withClientTimeout(
        savePinPhotoCrop(pin.id, crop),
        20000,
        'Saving took too long. Please try again.',
      );
      if (!result?.ok) {
        setError(result?.error || 'Could not save the crop.');
        return;
      }
      onSaved(crop);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the crop.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-green-deep/60 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adjust photo crop"
        className="w-full max-w-md rounded-2xl bg-cream dark:bg-green-deep border border-gold/20 p-4 space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-green-deep dark:text-cream">Adjust crop</h2>
          <button type="button" onClick={onClose} className="font-serif text-sm text-amber">Cancel</button>
        </div>
        <p className="font-serif text-xs text-text-mid dark:text-cream/60">
          Drag to move. Pinch or scroll to zoom in or out. The photo starts fitted in the frame. 1 fills it.
        </p>
        <div
          ref={frameRef}
          className="relative w-full overflow-hidden rounded-xl bg-green-deep/20 touch-none"
          style={{ aspectRatio: PIN_PHOTO_ASPECT }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <CroppedPinPhoto
            src={optimizedImageSrc(pin.photo_url, 1200)}
            alt={pin.caption ?? 'Pin photo'}
            crop={crop}
            onNaturalSize={setNatural}
            concealed={!showPhoto}
          />
        </div>
        <label className="block font-serif text-sm text-text-dark dark:text-cream">
          Zoom {crop.zoom.toFixed(2)}
          <input
            type="range"
            min={minZoom}
            max={MAX_PIN_ZOOM}
            step={0.01}
            value={Math.min(MAX_PIN_ZOOM, Math.max(minZoom, crop.zoom))}
            onChange={(event) => setCrop((current) => ({ ...current, zoom: clampZoom(Number(event.target.value), minZoom) }))}
            className="w-full mt-1"
          />
        </label>
        {error && <p className="font-serif text-sm text-amber">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCrop({ x: 50, y: 50, zoom: containZoom })}
            className="px-4 py-2 rounded-full border border-gold/30 font-serif text-sm text-text-dark dark:text-cream"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => { void save(); }}
            disabled={saving}
            className="ml-auto px-4 py-2 rounded-full bg-amber text-white font-serif text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const MIN_FIT_ZOOM = 0.02;

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function clampZoom(value: number, min: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(MAX_PIN_ZOOM, Math.max(min, value));
}

async function savePinPhotoCrop(
  pinId: string,
  crop: PinCrop,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch('/api/pin-crop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinId, crop }),
  });
  const result = await response.json().catch(() => null);
  if (!result || typeof result !== 'object' || !('ok' in result)) {
    return { ok: false, error: 'Could not save the crop.' };
  }
  return result as { ok: true } | { ok: false; error: string };
}

function withClientTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(message));
      },
    );
  });
}
