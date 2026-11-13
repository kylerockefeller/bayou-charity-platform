'use client';

// /members/profile — Auth enforced by middleware
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@bayou/supabase';
import { ProfileEditor } from '@/components/members/ProfileEditor';
import { MemberLoadError } from '@/lib/member-session';
import type { Database } from '@bayou/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      setError(null);
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionErr || !session) {
        window.location.href = '/sign-in';
        return;
      }
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profileErr) {
        setError('Could not load your profile. Nothing was signed out.');
        return;
      }
      if (!data) {
        await supabase.auth.signOut();
        window.location.href = '/sign-in';
        return;
      }
      setProfile(data);
    }

    void load();
    return () => { cancelled = true; };
  }, [attempt]);

  if (error) return <MemberLoadError message={error} onRetry={retry} />;
  if (!profile) {
    return <p className="text-center py-12 font-serif text-text-mid dark:text-cream/60">Loading profile…</p>;
  }
  return <ProfileEditor profile={profile} />;
}
