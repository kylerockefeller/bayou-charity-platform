'use client';

// Lightbox — full-screen image viewer with keyboard navigation

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CroppedPinPhoto } from '@/components/members/PinCropEditor';
import { PhotoShare } from '@/components/share/PhotoShare';
import type { GalleryImage } from './GalleryGrid';

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAdjustCrop?: (image: GalleryImage) => void;
}

export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext, onAdjustCrop }: LightboxProps) {
  const isOpen = currentIndex !== null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    },
    [isOpen, onClose, onPrev, onNext],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const image = currentIndex !== null ? images[currentIndex] : null;

  return (
    <AnimatePresence>
      {isOpen && image && (
        <motion.div
          key="lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center
                     bg-green-deep/90 dark:bg-black/95"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${(currentIndex ?? 0) + 1} of ${images.length}: ${image.alt}`}
        >
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {image.crop && image.frame ? (
              <div className="relative w-[min(92vw,56rem)] overflow-hidden rounded-lg shadow-2xl bg-green-deep/40" style={{ aspectRatio: image.frame }}>
                <CroppedPinPhoto src={image.src} alt={image.alt} crop={image.crop} />
              </div>
            ) : (
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl"
                priority
              />
            )}
            {onAdjustCrop && image.id && (
              <button
                type="button"
                onClick={() => onAdjustCrop(image)}
                className="mt-3 mx-auto block px-4 py-2 rounded-full bg-amber text-white font-serif text-sm"
              >
                Adjust crop
              </button>
            )}
            {image.share && (
              <div className="mt-3 text-center">
                <PhotoShare kind={image.share.kind} id={image.share.id} />
              </div>
            )}
            {/* Show DB caption if present, otherwise alt text */}
            <p className="mt-2 text-center text-cream/80 font-serif text-sm dark:text-cream/70">
              {image.caption ?? image.alt}
            </p>
          </motion.div>

          {/* Close */}
          <button onClick={onClose} aria-label="Close lightbox"
            className="absolute top-4 right-4 text-cream/70 hover:text-cream
                       transition-colors duration-150 focus:outline-none
                       focus-visible:ring-2 focus-visible:ring-amber rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Prev */}
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/70 hover:text-cream
                       transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Next */}
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next photo"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/70 hover:text-cream
                       transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cream/60 font-serif text-sm">
            {(currentIndex ?? 0) + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
