// GalleryGrid — renders a masonry photo grid
// Images are passed dynamically from GalleryClient (DB-sourced after migration)

import Image from 'next/image';
import { CroppedPinPhoto } from '@/components/members/PinCropEditor';
import type { PinCrop } from '@/lib/pin-crop';

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  index: number;
  id?: string;
  crop?: PinCrop | null;
  /** CSS aspect-ratio for a saved crop. Gallery photos use 4 / 3; pin photos use 2 / 1. */
  frame?: string;
  kind?: 'gallery' | 'pin';
}

export interface GalleryVideo {
  src: string;
  label: string;
  controls?: boolean;
}

interface GalleryGridProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
  onAdjustCrop?: (image: GalleryImage) => void;
}

export default function GalleryGrid({ images, onImageClick, onAdjustCrop }: GalleryGridProps) {
  if (images.length === 0) return null;

  return (
    <div className="columns-1 gap-3 sm:columns-2 md:columns-3 lg:columns-4 space-y-3">
      {images.map((img, i) => (
        <div key={img.src + i} className="break-inside-avoid">
          <button
            onClick={() => onImageClick(img.index)}
            className="block w-full overflow-hidden rounded-lg
                       ring-0 hover:ring-2 hover:ring-amber focus-visible:ring-2
                       focus-visible:ring-amber transition-all duration-200
                       focus:outline-none group"
            aria-label={`View full size: ${img.alt}`}
          >
            <div className="relative overflow-hidden rounded-lg">
              {img.crop && img.frame ? (
                <div className="relative w-full" style={{ aspectRatio: img.frame }}>
                  <CroppedPinPhoto src={img.src} alt={img.alt} crop={img.crop} />
                </div>
              ) : (
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  className="w-full h-auto object-cover transition-transform duration-300
                             group-hover:scale-105"
                  priority={i < 4}
                  loading={i < 4 ? undefined : 'lazy'}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </div>
          </button>
          {onAdjustCrop && img.id && (
            <button
              type="button"
              onClick={() => onAdjustCrop(img)}
              className="mt-1 font-serif text-sm text-amber"
            >
              Adjust crop
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
