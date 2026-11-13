'use client';

// /members/gallery — Auth enforced by middleware
import { MemberGallery } from '@/components/members/MemberGallery';
import { MemberLoadError, useMemberSession } from '@/lib/member-session';

export default function GalleryPage() {
  const { session, error, retry } = useMemberSession();

  if (error) return <MemberLoadError message={error} onRetry={retry} />;
  if (!session) {
    return <p className="text-center py-12 font-serif text-text-mid dark:text-cream/60">Loading gallery…</p>;
  }
  return <MemberGallery userId={session.userId} role={session.role} />;
}
