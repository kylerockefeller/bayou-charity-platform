'use client';

import { useEffect, useRef, useState } from 'react';
import { updatePinPhotoCrop } from '@/app/actions/pin-crop';
import { optimizedImageSrc } from '@/lib/images';
import {
  DEFAULT_PIN_CROP,
  PIN_PHOTO_ASPECT,
  normalizePinCrop,
  pinCropStyle,
  type PinCrop,
} from '@/lib/pin-crop';

type CropPin = {
  id: string;
  photo_url: string;
  caption?: string | null;
  photo_crop_x?: number | null;
  photo_crop_y?: number | null;
  photo_crop_zoom?: number | null;
};

export function PinCropEditor({
  pin,
  onClose,
  onSaved,
}: {
  pin: CropPin;
  onClose: () => void;
  onSaved: (crop: PinCrop) => void;
}) {
  const [crop, setCrop] = useState<PinCrop>(() => normalizePinCrop(pin));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ id: number; x: number; y: number; cropX: number; cropY: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 0.08 : -0.08;
      setCrop((current) => ({ ...current, zoom: clampZoom(current.zoom + delta) }));
    };
    frame.addEventListener('wheel', onWheel, { passive: false });
    return () => frame.removeEventListener('wheel', onWheel);
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, cropX: crop.x, cropY: crop.y };
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
      const nextZoom = clampZoom(pinch.current.zoom * (distance / pinch.current.distance));
      setCrop((current) => ({ ...current, zoom: nextZoom }));
      return;
    }

    if (!drag.current || drag.current.id !== event.pointerId) return;
    const rect = frame.getBoundingClientRect();
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    const zoom = crop.zoom || 1;
    const start = drag.current;
    setCrop((current) => ({
      ...current,
      x: clampPercent(start.cropX - (dx / rect.width) * 100 / zoom),
      y: clampPercent(start.cropY - (dy / rect.height) * 100 / zoom),
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
    const result = await updatePinPhotoCrop(pin.id, crop);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(crop);
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
          Drag to move. Pinch or scroll to zoom. This frame matches the map photo.
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
          {/* The optimizer URL is the same one members see. Crop is CSS only. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={optimizedImageSrc(pin.photo_url, 1200)}
            alt={pin.caption ?? 'Pin photo'}
            draggable={false}
            className="w-full h-full pointer-events-none select-none"
            style={pinCropStyle(crop)}
          />
        </div>
        <label className="block font-serif text-sm text-text-dark dark:text-cream">
          Zoom {crop.zoom.toFixed(2)}
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={crop.zoom}
            onChange={(event) => setCrop((current) => ({ ...current, zoom: clampZoom(Number(event.target.value)) }))}
            className="w-full mt-1"
          />
        </label>
        {error && <p className="font-serif text-sm text-amber">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCrop(DEFAULT_PIN_CROP)}
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

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function clampZoom(value: number): number {
  return Math.min(4, Math.max(1, value));
}
