'use client';

// UploadForm — Client Component
// Auth-gated photo upload to Supabase gallery-pending bucket.
// Size cap: MAX_UPLOAD_BYTES in lib/uploads.ts.

import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { createClient } from '@bayou/supabase';
import { ACCEPTED_IMAGE_ACCEPT, MAX_UPLOAD_LABEL, validateUploadFile } from '@/lib/uploads';
import { GALLERY_PENDING_BUCKET } from '@/lib/gallery';

interface UploadFormProps {
  userId: string;
}

export default function UploadForm({ userId }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(false);
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    // Shared validator (lib/uploads.ts) — this form previously accepted any
    // image/* which let HEIC into the review queue; now it enforces the same
    // list as the members-area upload surfaces.
    const validationError = validateUploadFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from(GALLERY_PENDING_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (storageError) throw new Error(storageError.message);

      const { error: dbError } = await supabase
        .from('gallery_submissions')
        .insert({
          member_id: userId,
          storage_path: path,
          caption: caption.trim() || null,
          status: 'pending',
        });

      if (dbError) throw new Error(dbError.message);

      setSuccess(true);
      setFile(null);
      setCaption('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-cream dark:bg-green-water rounded-2xl p-6 space-y-4
                 shadow-md border border-cream/50 dark:border-green-water/50"
    >
      <h3 className="font-display text-xl text-green-deep dark:text-cream">
        Upload a Photo
      </h3>
      <p className="font-serif text-sm text-text-mid dark:text-cream/70">
        Share your memories with the BFF community. Max {MAX_UPLOAD_LABEL}. Photos go to
        an admin review queue before publishing.
      </p>

      {/* File input */}
      <div>
        <label
          htmlFor="gallery-file"
          className="block font-serif text-sm text-text-dark dark:text-cream mb-1"
        >
          Photo <span className="text-amber">*</span>
        </label>
        <input
          ref={inputRef}
          id="gallery-file"
          type="file"
          accept={ACCEPTED_IMAGE_ACCEPT}
          onChange={handleFileChange}
          required
          className="block w-full font-serif text-sm text-text-dark dark:text-cream
                     file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                     file:font-serif file:text-sm
                     file:bg-amber file:text-white
                     hover:file:bg-amber/90
                     dark:file:bg-gold dark:file:text-green-deep
                     dark:hover:file:bg-gold/90
                     cursor-pointer focus:outline-none
                     focus-visible:ring-2 focus-visible:ring-amber rounded"
        />
        {file && (
          <p className="mt-1 text-xs text-text-mid dark:text-cream/60 font-serif">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Caption */}
      <div>
        <label
          htmlFor="gallery-caption"
          className="block font-serif text-sm text-text-dark dark:text-cream mb-1"
        >
          Caption <span className="text-text-mid dark:text-cream/50">(optional)</span>
        </label>
        <input
          id="gallery-caption"
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={200}
          placeholder="Tell us about this moment..."
          className="w-full rounded-lg border border-text-mid/30 dark:border-cream/20
                     bg-white dark:bg-green-deep
                     text-text-dark dark:text-cream
                     font-serif text-sm px-4 py-2
                     placeholder:text-text-mid/60 dark:placeholder:text-cream/40
                     focus:outline-none focus:ring-2 focus:ring-amber
                     dark:focus:ring-gold"
        />
      </div>

      {/* Error / Success */}
      {error && (
        <p role="alert" className="font-serif text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="font-serif text-sm text-amber dark:text-gold">
          Photo submitted! It&apos;ll appear after admin review.
        </p>
      )}

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full md:w-auto px-8 py-3 rounded-full
                   bg-amber hover:bg-amber/90 dark:bg-gold dark:hover:bg-gold/90
                   text-white dark:text-green-deep
                   font-serif text-sm font-medium
                   transition-all duration-200 hover:scale-[1.02]
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-amber"
      >
        {uploading ? 'Uploading…' : '↑ Upload Photo'}
      </button>
    </form>
  );
}
