'use client';

// /members/feed — Auth enforced by middleware
import SocialFeed from '@/components/members/SocialFeed';
import { MemberLoadError, useMemberSession } from '@/lib/member-session';

export default function FeedPage() {
  const { session, error, retry } = useMemberSession();

  if (error) return <MemberLoadError message={error} onRetry={retry} />;
  if (!session) {
    return <p className="text-center py-12 font-serif text-text-mid dark:text-cream/60">Loading your feed…</p>;
  }
  return <SocialFeed userId={session.userId} role={session.role} />;
}
