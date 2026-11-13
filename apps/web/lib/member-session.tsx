'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@bayou/supabase';

export type MemberRole = 'member' | 'guide' | 'admin';

export function useMemberSession() {
  const [session, setSession] = useState<{ userId: string; role: MemberRole } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      setError(null);
      const { data: { session: auth }, error: sessionErr } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionErr || !auth) {
        window.location.href = '/sign-in';
        return;
      }

      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', auth.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profileErr) {
        setError('Could not load your account. Nothing was signed out.');
        return;
      }
      if (!data) {
        await supabase.auth.signOut();
        window.location.href = '/sign-in';
        return;
      }
      const role: MemberRole = data.role === 'admin' || data.role === 'guide' ? data.role : 'member';
      setSession({ userId: auth.user.id, role });
    }

    void load();
    return () => { cancelled = true; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { session, error, retry };
}

export function MemberLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12 space-y-3">
      <p className="font-serif text-text-mid dark:text-cream/70">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 rounded-full bg-amber text-white font-serif text-sm hover:bg-amber/90"
      >
        Try again
      </button>
    </div>
  );
}
