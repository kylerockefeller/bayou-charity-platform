'use client';

import { useState } from 'react';
import { CATCH_SHARE_TEXT } from '@/lib/share/copy';

type ShareKind = 'pin' | 'gallery' | 'avatar';

export function PhotoShare({ kind, id }: { kind: ShareKind; id: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function pageUrl(): string {
    if (kind === 'avatar') return 'https://bayoucharity.org';
    const path = kind === 'pin' ? `/share/catch/${id}` : `/share/gallery/${id}`;
    return `${window.location.origin}${path}`;
  }

  async function cleanedFile(): Promise<File> {
    const response = await fetch(`/api/share-image?kind=${kind}&id=${encodeURIComponent(id)}&variant=square`);
    if (!response.ok) throw new Error('unavailable');
    const blob = await response.blob();
    return new File([blob], 'bayou-charity-catch.jpg', { type: 'image/jpeg' });
  }

  async function onShare() {
    setNote(null);
    if (typeof navigator.share === 'function') {
      try {
        const file = await cleanedFile();
        const url = pageUrl();
        const withFile = { files: [file], text: CATCH_SHARE_TEXT, title: 'Bayou Charity Fishing Club', url };
        if (navigator.canShare?.(withFile)) {
          await navigator.share(withFile);
          return;
        }
        await navigator.share({ text: CATCH_SHARE_TEXT, title: 'Bayou Charity Fishing Club', url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    setOpen((value) => !value);
  }

  function openHref(href: string) {
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=400');
    setOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${CATCH_SHARE_TEXT} ${pageUrl()}`);
      setNote('Link copied');
    } catch {
      setNote('Could not copy the link');
    }
    setOpen(false);
  }

  async function download() {
    try {
      const file = await cleanedFile();
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bayou-charity-catch.jpg';
      link.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      setNote('Could not download the photo');
    }
  }

  const url = typeof window === 'undefined' ? '' : pageUrl();
  const text = encodeURIComponent(CATCH_SHARE_TEXT);
  const encodedUrl = encodeURIComponent(url);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => { void onShare(); }}
        className="font-serif text-sm text-amber"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Share
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-30 mt-1 w-44 rounded-xl border border-gold/30 bg-white p-1 shadow-lg dark:bg-green-deep"
        >
          <MenuButton label="Facebook" onClick={() => openHref(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)} />
          <MenuButton label="X" onClick={() => openHref(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`)} />
          <MenuButton label="WhatsApp" onClick={() => openHref(`https://wa.me/?text=${encodeURIComponent(`${CATCH_SHARE_TEXT} ${url}`)}`)} />
          <MenuButton label="Email" onClick={() => openHref(`mailto:?subject=${encodeURIComponent('Bayou Charity Fishing Club')}&body=${encodeURIComponent(`${CATCH_SHARE_TEXT}\n\n${url}`)}`)} />
          <MenuButton label="Copy link" onClick={() => { void copyLink(); }} />
          <MenuButton label="Download" onClick={() => { void download(); }} />
        </div>
      )}
      {note && <span className="ml-2 font-serif text-xs text-text-mid">{note}</span>}
    </div>
  );
}

function MenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="block w-full rounded-lg px-3 py-2 text-left font-serif text-sm text-green-deep hover:bg-amber/10 dark:text-cream"
    >
      {label}
    </button>
  );
}
