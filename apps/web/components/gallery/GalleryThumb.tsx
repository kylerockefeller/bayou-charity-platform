'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@bayou/supabase';
import { galleryPhotoUrl, gallerySignedUrl } from '@/lib/gallery';

export function GalleryThumb({
  storagePath,
  status,
  alt,
  sizes,
}: {
  storagePath: string;
  status: string;
  alt: string;
  sizes: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const approved = status === 'approved';
  const [src, setSrc] = useState<string | null>(approved ? galleryPhotoUrl(storagePath, status) : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (approved) {
      setSrc(galleryPhotoUrl(storagePath, status));
      setFailed(false);
      return;
    }
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    void gallerySignedUrl(supabase, storagePath).then((url) => {
      if (cancelled) return;
      if (!url) setFailed(true);
      else setSrc(url);
    });
    return () => { cancelled = true; };
  }, [approved, storagePath, status, supabase]);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-2 text-center">
        <span className="font-serif text-xs text-text-mid dark:text-cream/60">Photo unavailable</span>
      </div>
    );
  }
  if (!src) {
    return <div className="absolute inset-0 animate-pulse bg-green-deep/10" />;
  }
  return <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />;
}
