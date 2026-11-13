'use client';

// ProfileEditor — the member's own profile card on /members/profile.
//
// Owns three editable fields (display name, bio, avatar) written straight to
// `profiles`. The avatar uploads to the public `avatars` bucket at a FIXED
// path (`{uid}/avatar.{ext}`, upsert) — one avatar per member, so a re-upload
// with the same extension overwrites in place, while a different extension
// strands the old file (harmless orphan). Trap: the new avatar URL only lands
// on the profile row when the member hits Save — upload alone changes nothing
// in the DB. Upload limits/validation come from lib/uploads.ts; never inline
// them here.

import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { createClient } from '@bayou/supabase';
import type { Database } from '@bayou/supabase/types';
import { ACCEPTED_IMAGE_ACCEPT, AVATAR_LONG_EDGE, MAX_UPLOAD_LABEL, prepareUploadFile } from '@/lib/uploads';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileEditorProps {
  profile: Profile;
  onSave?: (updated: Profile) => void;
}

export function ProfileEditor({ profile, onSave }: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(), []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const prepared = await prepareUploadFile(file, { maxEdge: AVATAR_LONG_EDGE });
    if (prepared.error) {
      setError(prepared.error);
      return;
    }
    setError(null);
    setUploading(true);

    const avatar = prepared.file;
    const ext = avatar.type === 'image/jpeg' ? 'jpg' : (avatar.name.split('.').pop() ?? 'jpg');
    const path = `${profile.id}/avatar.${ext}`;

    const { error: storageError } = await supabase.storage
      .from('avatars')
      .upload(path, avatar, { upsert: true });

    if (storageError) {
      setError(storageError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
    } else if (data) {
      setSuccess(true);
      onSave?.(data);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto bg-white dark:bg-green-water rounded-2xl p-6 border border-gold/10 shadow-sm space-y-6"
    >
      <h2 className="font-display text-2xl text-green-deep dark:text-cream">Your Profile</h2>

      {/* Avatar */}
      <div className="flex flex-col md:flex-row items-center gap-5">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-green-deep/10 flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Your avatar"
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-green-water text-gold font-display text-2xl">
              {(displayName || (profile.email ?? '?')).charAt(0).toUpperCase()}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-green-deep/60 flex items-center justify-center">
              <span className="text-white text-xs font-serif">…</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_IMAGE_ACCEPT}
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-cream dark:bg-green-deep border border-gold/30 text-text-mid dark:text-cream/70 font-serif text-sm rounded-full hover:border-amber hover:text-amber transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Change Avatar'}
          </button>
          <p className="text-xs text-text-mid dark:text-cream/50 font-serif">JPG, PNG — max {MAX_UPLOAD_LABEL}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-serif text-text-mid dark:text-cream/60 mb-1.5">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-cream dark:bg-green-deep/60 rounded-xl px-4 py-2.5 font-serif text-text-dark dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
          />
        </div>
        <div>
          <label className="block text-xs font-serif text-text-mid dark:text-cream/60 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the crew a little about yourself…"
            rows={3}
            className="w-full bg-cream dark:bg-green-deep/60 rounded-xl px-4 py-2.5 font-serif text-text-dark dark:text-cream text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber/40"
          />
        </div>
        <div>
          <label className="block text-xs font-serif text-text-mid dark:text-cream/60 mb-1.5">Email</label>
          <p className="px-4 py-2.5 font-serif text-text-mid dark:text-cream/50 text-sm bg-cream dark:bg-green-deep/40 rounded-xl">
            {profile.email}
          </p>
        </div>
        <div>
          <label className="block text-xs font-serif text-text-mid dark:text-cream/60 mb-1.5">Role</label>
          <p className="px-4 py-2.5 font-serif text-text-mid dark:text-cream/50 text-sm bg-cream dark:bg-green-deep/40 rounded-xl capitalize">
            {profile.role}
          </p>
        </div>
      </div>

      {error && <p className="text-amber text-xs font-serif">{error}</p>}
      {success && (
        <p className="text-green-water dark:text-cream/80 text-xs font-serif">Profile saved!</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-amber hover:bg-amber/90 text-white font-serif text-sm rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}
