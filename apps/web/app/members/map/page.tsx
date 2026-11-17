'use client';

// /members/map — Auth enforced by middleware
import dynamic from 'next/dynamic';
import { MemberLoadError, useMemberSession } from '@/lib/member-session';

const PinsMap = dynamic(
  () => import('@/components/members/PinsMap').then((m) => ({ default: m.PinsMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse rounded-xl bg-green-deep/20" />
    ),
  }
);

export default function MapPage() {
  const { session, error, retry } = useMemberSession();

  if (error) return <MemberLoadError message={error} onRetry={retry} />;
  if (!session) {
    return <p className="text-center py-12 font-serif text-text-mid dark:text-cream/60">Loading map…</p>;
  }
  return <PinsMap userId={session.userId} role={session.role} />;
}
