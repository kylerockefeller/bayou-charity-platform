'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryThumb } from '@/components/gallery/GalleryThumb';
import { createClient } from '@bayou/supabase';
import type { Database } from '@bayou/supabase/types';
import { ACCEPTED_IMAGE_ACCEPT, prepareUploadFile } from '@/lib/uploads';
import {
  GALLERY_PENDING_BUCKET,
  copyPendingToPublic,
} from '@/lib/gallery';

type GallerySubmission = Database['public']['Tables']['gallery_submissions']['Row'] & {
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};
type GalleryEvent = Database['public']['Tables']['gallery_events']['Row'];

interface MemberGalleryProps {
  userId: string;
  role: 'member' | 'guide' | 'admin';
}

export function MemberGallery({ userId, role }: MemberGalleryProps) {
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(), []);

  // Use a ref to track whether the initial event selection has been set.
  // This avoids including selectedEventId in loadData's deps, which would
  // cause an infinite re-render loop (setSelectedEventId → dep change → loadData → repeat).
  const initializedRef = useRef(false);

  const loadData = useCallback(async () => {
    let mounted = true;
    setLoading(true);
    const [{ data: subs }, { data: evts }] = await Promise.all([
      supabase
        .from('gallery_submissions')
        .select('id, member_id, event_id, storage_path, caption, status, submitted_at, profiles!member_id(display_name, avatar_url)')
        .eq('member_id', userId)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('gallery_events')
        .select('*')
        .order('event_date', { ascending: false }),
    ]);
    if (!mounted) return;
    if (subs) setSubmissions(subs as GallerySubmission[]);
    if (evts) {
      setEvents(evts);
      // Set default event only on first load — never again — to prevent infinite loop.
      if (evts.length > 0 && !initializedRef.current) {
        initializedRef.current = true;
        setSelectedEventId(evts[0].id);
      }
    }
    setLoading(false);
    return () => { mounted = false; };
  }, [userId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const prepared = await prepareUploadFile(f);
    if (prepared.error) {
      setError(prepared.error);
      setFile(null);
      return;
    }
    setError(null);
    setFile(prepared.file);
  }

  async function handleUpload() {
    if (!file || !selectedEventId) return;
    setUploading(true);
    setError(null);

    const ext = file.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() ?? 'jpg');
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from(GALLERY_PENDING_BUCKET)
      .upload(path, file, { upsert: false });

    if (storageError) {
      setError(storageError.message);
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('gallery_submissions').insert({
      member_id: userId,
      event_id: selectedEventId,
      storage_path: path,
      caption: caption.trim() || null,
      status: 'pending',
    });

    if (dbError) {
      await supabase.storage.from(GALLERY_PENDING_BUCKET).remove([path]);
      setError(dbError.message);
    } else {
      setFile(null);
      setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      await loadData();
    }
    setUploading(false);
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-gold/20 text-gold',
    approved: 'bg-green-water/20 text-green-water dark:text-cream/80',
    rejected: 'bg-amber/20 text-amber',
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Upload form */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 space-y-4"
      >
        <h2 className="font-display text-xl text-green-deep dark:text-cream">Submit a Photo</h2>

        {events.length > 0 ? (
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-cream dark:bg-green-deep/60 rounded-xl px-4 py-2.5 font-serif text-text-dark dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 border border-gold/20"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        ) : (
          <p className="text-text-mid dark:text-cream/60 font-serif text-sm">No active gallery events.</p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_ACCEPT}
          onChange={handleFileChange}
          className="w-full text-sm font-serif text-text-mid dark:text-cream/70 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-amber file:text-white file:font-serif file:text-sm hover:file:bg-amber/90 file:cursor-pointer"
        />
        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-cream dark:bg-green-deep/60 rounded-xl px-4 py-2.5 font-serif text-text-dark dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
        />

        {error && <p className="text-amber text-xs font-serif">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={uploading || !file || !selectedEventId}
          className="px-5 py-2 bg-amber hover:bg-amber/90 text-white font-serif text-sm rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading…' : 'Submit Photo'}
        </button>
      </motion.div>

      {/* Submissions list */}
      <div>
        <h3 className="font-display text-lg text-green-deep dark:text-cream mb-4">Your Submissions</h3>
        {loading ? (
          <p className="text-text-mid dark:text-cream/60 font-serif text-sm">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-text-mid dark:text-cream/60 font-serif text-sm">No submissions yet.</p>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card overflow-hidden"
                >
                  <div className="relative aspect-video bg-green-deep/10">
                    <GalleryThumb
                      storagePath={sub.storage_path}
                      status={sub.status ?? 'pending'}
                      alt={sub.caption ?? 'Gallery submission'}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    {sub.caption && (
                      <p className="font-serif text-sm text-text-dark dark:text-cream">{sub.caption}</p>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-serif ${statusColor[sub.status ?? 'pending'] ?? ''}`}>
                      {(sub.status ?? 'pending').charAt(0).toUpperCase() + (sub.status ?? 'pending').slice(1)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Admin: all pending submissions */}
      {role === 'admin' && <AdminGalleryPanel supabase={supabase} adminId={userId} onUpdate={loadData} />}
    </div>
  );
}

// Admin sub-component — only rendered for admins
function AdminGalleryPanel({
  supabase,
  adminId,
  onUpdate,
}: {
  supabase: ReturnType<typeof createClient>;
  adminId: string;
  onUpdate: () => void;
}) {
  const [pending, setPending] = useState<GallerySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gallery_submissions')
      .select('id, member_id, event_id, storage_path, caption, status, submitted_at, profiles!member_id(display_name, avatar_url)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });
    if (data) setPending(data as GallerySubmission[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function updateStatus(sub: GallerySubmission, status: 'approved' | 'rejected') {
    // Approve must copy pending→public BEFORE flipping status — same contract
    // as AdminGalleryManager, see lib/gallery.ts. This panel used to flip
    // status only, which published broken photo URLs (the object stayed in
    // gallery-pending). Reject needs no storage work here: this list only
    // shows status='pending' rows, so there is never a public copy to remove.
    if (status === 'approved') {
      const copyError = await copyPendingToPublic(supabase, sub.storage_path);
      if (copyError) {
        alert(`Approve failed — photo could not be copied to the public gallery: ${copyError}`);
        return;
      }
    }
    await supabase.from('gallery_submissions').update({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', sub.id);
    await loadPending();
    onUpdate();
  }

  if (loading) return null;
  if (pending.length === 0) return (
    <div className="glass-card p-5">
      <h3 className="font-display text-lg text-green-deep dark:text-cream mb-2">Pending Submissions</h3>
      <p className="font-serif text-sm text-text-mid dark:text-cream/60">All clear — no pending submissions.</p>
    </div>
  );

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="font-display text-lg text-green-deep dark:text-cream">Pending Submissions ({pending.length})</h3>
      {pending.map((sub) => (
        <div key={sub.id} className="flex gap-3 items-start border-t border-gold/10 pt-3">
          <div className="relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-green-deep/10">
            <GalleryThumb
              storagePath={sub.storage_path}
              status={sub.status ?? 'pending'}
              alt={sub.caption ?? ''}
              sizes="80px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-xs text-text-mid dark:text-cream/60">
              {sub.profiles?.display_name ?? 'Member'} · {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : ''}
            </p>
            {sub.caption && <p className="font-serif text-sm text-text-dark dark:text-cream truncate">{sub.caption}</p>}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => updateStatus(sub, 'approved')}
                className="px-3 py-1 bg-green-water/20 hover:bg-green-water/40 text-green-water dark:text-cream font-serif text-xs rounded-full transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(sub, 'rejected')}
                className="px-3 py-1 bg-amber/10 hover:bg-amber/20 text-amber font-serif text-xs rounded-full transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
