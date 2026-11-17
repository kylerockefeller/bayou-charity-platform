'use client';

// /members/admin — Admin role enforced by middleware + client check
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@bayou/supabase';

// AdminPanel uses framer-motion — isolate to /members/admin chunk only
const AdminPanel = dynamic(
  () => import('@/components/members/AdminPanel').then((m) => ({ default: m.AdminPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen animate-pulse bg-green-deep/10" />
    ),
  }
);

export default function AdminPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionErr || !session) { setError(true); return; }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (cancelled) return;
      if (data?.role !== 'admin') { window.location.href = '/members/feed'; return; }
      setAdminId(session.user.id);
    }

    load();
    return () => { cancelled = true; };
  }, [supabase]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="font-serif text-text-mid dark:text-cream/60">
          Unable to load your session.{' '}
          <a href="/sign-in" className="text-amber hover:text-amber/80 underline">Sign in again</a>
        </p>
      </div>
    );
  }

  if (!adminId) {
    return (
      <div className="text-center py-12">
        <p className="font-serif text-text-mid dark:text-cream/60">Loading admin panel…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-serif text-sm">
        <a href="/members/admin/pin-crops" className="text-amber hover:underline">Adjust pin photo crops</a>
      </p>
      <AdminPanel adminId={adminId} />
    </div>
  );
}
