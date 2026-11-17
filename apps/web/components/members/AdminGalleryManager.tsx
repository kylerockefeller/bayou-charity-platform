'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@bayou/supabase';
import { GalleryThumb } from '@/components/gallery/GalleryThumb';
import type { Database } from '@bayou/supabase/types';
import { deleteGalleryPhoto } from '@/app/actions/gallery';
import { copyPendingToPublic, removePublicCopy } from '@/lib/gallery';

type GalleryEvent = Database['public']['Tables']['gallery_events']['Row'];
type GallerySubmission = {
  id: string;
  storage_path: string;
  caption: string | null;
  status: string;
  submitted_at: string;
  event_id: string | null;
  gallery_events: { name: string } | null;
};

const PAGE_SIZE = 24;

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function AdminGalleryManager() {
  const supabase = useMemo(() => createClient(), []);

  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [photos, setPhotos] = useState<GallerySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    const { data } = await supabase.from('gallery_events').select('*').order('sort_order');
    setEvents(data ?? []);
  }, [supabase]);

  const loadPhotos = useCallback(async (
    eventId: string | 'all',
    status: StatusFilter,
    pg: number,
  ) => {
    setLoading(true);
    let query = supabase
      .from('gallery_submissions')
      .select('id, storage_path, caption, status, submitted_at, event_id, gallery_events(name)')
      .order('submitted_at', { ascending: false })
      .range(pg * PAGE_SIZE, pg * PAGE_SIZE + PAGE_SIZE - 1);

    if (eventId !== 'all') query = query.eq('event_id', eventId);
    if (status !== 'all') query = query.eq('status', status);

    const { data } = await query;
    setPhotos((data as GallerySubmission[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    void loadPhotos(activeEvent, statusFilter, page);
  }, [loadPhotos, activeEvent, statusFilter, page]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleApprove(photo: GallerySubmission) {
    // Copy pending→public FIRST, flip status SECOND — see the contract note in
    // lib/gallery.ts. The URL builder derives the bucket from status, so a row
    // marked approved whose object never reached gallery-public renders broken
    // on /gallery. If the copy fails, do NOT flip: a still-pending row is
    // harmless, a broken public photo is not.
    const copyError = await copyPendingToPublic(supabase, photo.storage_path);
    if (copyError) {
      showToast('Approve failed — photo could not be copied to the public gallery');
      return;
    }
    const { error: dbError } = await supabase
      .from('gallery_submissions')
      .update({ status: 'approved' })
      .eq('id', photo.id);
    if (dbError) {
      showToast('Approve failed — status not updated');
      return;
    }
    showToast('Photo approved');
    void loadPhotos(activeEvent, statusFilter, page);
  }

  async function handleReject(photo: GallerySubmission) {
    // Reject-after-approve: remove the public copy first so the public gallery
    // cannot keep serving an orphaned object. The pending original still exists
    // (approve copies, never moves), so nothing is lost. Same order rule as
    // approve: fix storage first, only then flip status.
    if (photo.status === 'approved') {
      const removeError = await removePublicCopy(supabase, photo.storage_path);
      if (removeError) {
        showToast('Reject failed — public copy could not be removed');
        return;
      }
    }
    const { error: dbError } = await supabase
      .from('gallery_submissions')
      .update({ status: 'rejected' })
      .eq('id', photo.id);
    if (dbError) {
      showToast('Reject failed — status not updated');
      return;
    }
    showToast('Photo rejected');
    void loadPhotos(activeEvent, statusFilter, page);
  }

  async function handleDelete(id: string, storagePath: string) {
    if (!confirm('Permanently delete this photo? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteGalleryPhoto(id, storagePath);
      showToast('Photo deleted');
      void loadPhotos(activeEvent, statusFilter, page);
    } catch {
      showToast('Delete failed — try again');
    } finally {
      setDeleting(null);
    }
  }

  async function handleReassign(id: string, newEventId: string | null) {
    await supabase.from('gallery_submissions').update({ event_id: newEventId }).eq('id', id);
    showToast('Photo reassigned');
    void loadPhotos(activeEvent, statusFilter, page);
  }

  const statusChips: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Event filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => { setActiveEvent('all'); setPage(0); }}
          className={[
            'px-4 py-2 rounded-full text-sm font-serif whitespace-nowrap transition-colors',
            activeEvent === 'all'
              ? 'bg-gold text-green-deep font-semibold'
              : 'bg-cream dark:bg-green-water/30 text-text-mid dark:text-cream/70 hover:text-amber',
          ].join(' ')}
        >
          All Events
        </button>
        {events.map((ev) => (
          <button
            key={ev.id}
            onClick={() => { setActiveEvent(ev.id); setPage(0); }}
            className={[
              'px-4 py-2 rounded-full text-sm font-serif whitespace-nowrap transition-colors',
              activeEvent === ev.id
                ? 'bg-gold text-green-deep font-semibold'
                : 'bg-cream dark:bg-green-water/30 text-text-mid dark:text-cream/70 hover:text-amber',
            ].join(' ')}
          >
            {ev.name}
          </button>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        {statusChips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => { setStatusFilter(chip.value); setPage(0); }}
            className={[
              'px-3 py-1 rounded-full text-xs font-serif transition-colors',
              statusFilter === chip.value
                ? 'bg-amber text-white'
                : 'bg-cream dark:bg-green-water/30 text-text-mid dark:text-cream/70 hover:text-amber border border-gold/20',
            ].join(' ')}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {loading ? (
        <p className="font-serif text-sm text-text-mid dark:text-cream/60 py-8 text-center">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="font-serif text-sm text-text-mid dark:text-cream/60 py-8 text-center">No photos found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="rounded-xl overflow-hidden border border-gold/10 bg-cream dark:bg-green-deep/40"
            >
              {/* Thumbnail with hover overlay */}
              <div className="aspect-square relative overflow-hidden group">
                <GalleryThumb
                  storagePath={photo.storage_path}
                  status={photo.status}
                  alt={photo.caption ?? 'Gallery photo'}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {/* Status badge */}
                {photo.status !== 'approved' && (
                  <span className={[
                    'absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-serif rounded text-white',
                    photo.status === 'pending' ? 'bg-amber/90' : 'bg-red-500/80',
                  ].join(' ')}>
                    {photo.status}
                  </span>
                )}
                {/* Hover action overlay */}
                <div className="absolute inset-0 bg-green-deep/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {photo.status !== 'approved' && (
                    <button
                      onClick={() => { void handleApprove(photo); }}
                      className="px-2 py-1 bg-green-water text-white font-serif text-[11px] rounded-lg hover:bg-green-water/80 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {photo.status !== 'rejected' && (
                    <button
                      onClick={() => { void handleReject(photo); }}
                      className="px-2 py-1 bg-amber text-white font-serif text-[11px] rounded-lg hover:bg-amber/80 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => { void handleDelete(photo.id, photo.storage_path); }}
                    disabled={deleting === photo.id}
                    className="px-2 py-1 bg-red-500 text-white font-serif text-[11px] rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting === photo.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Reassign dropdown — always visible */}
              <div className="p-2">
                <select
                  value={photo.event_id ?? ''}
                  onChange={(e) => { void handleReassign(photo.id, e.target.value || null); }}
                  aria-label="Reassign to event"
                  className="w-full bg-cream dark:bg-green-deep/60 rounded-lg px-2 py-1 font-serif text-[11px] text-text-dark dark:text-cream focus:outline-none focus:ring-1 focus:ring-amber/40"
                >
                  <option value="">Unassigned</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && (photos.length === PAGE_SIZE || page > 0) && (
        <div className="flex gap-2 justify-center pt-2">
          {page > 0 && (
            <button
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-cream dark:bg-green-deep border border-gold/30 text-text-mid dark:text-cream/70 font-serif text-sm rounded-full hover:border-amber hover:text-amber transition-colors"
            >
              ← Prev
            </button>
          )}
          {photos.length === PAGE_SIZE && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-cream dark:bg-green-deep border border-gold/30 text-text-mid dark:text-cream/70 font-serif text-sm rounded-full hover:border-amber hover:text-amber transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-green-deep text-cream text-xs px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
