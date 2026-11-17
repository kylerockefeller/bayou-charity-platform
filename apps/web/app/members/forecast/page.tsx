'use client';

// /members/forecast — Auth enforced by middleware
import FishingForecast from '@/components/members/FishingForecast';
import { MemberLoadError, useMemberSession } from '@/lib/member-session';

export default function ForecastPage() {
  const { session, error, retry } = useMemberSession();

  if (error) return <MemberLoadError message={error} onRetry={retry} />;
  if (!session) {
    return <p className="text-center py-12 font-serif text-text-mid dark:text-cream/60">Loading forecast…</p>;
  }
  return <FishingForecast />;
}
