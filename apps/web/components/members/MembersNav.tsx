'use client';

// MembersNav — sticky tab strip for the /members/* area.
//
// Owns the list of member surfaces and appends the Admin tab only after
// confirming profiles.role === 'admin' client-side. That check is COSMETIC —
// real route protection is middleware.ts; do not treat hiding a tab here as
// securing anything. A missing profiles row (query succeeded, zero rows)
// signs the member out. A failed read does not — that was signing people
// out on a blip. Middleware already called getUser(), so this uses
// getSession() and does not refresh the token a second time.
// Active-tab matching is by path prefix so nested routes
// (/members/admin/gallery) keep their tab lit.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@bayou/supabase';

const baseTabs = [
  { href: '/members/feed',      label: '📸 Feed' },
  { href: '/members/community', label: '💬 Community' },
  { href: '/members/map',       label: '🗺️ Map' },
  { href: '/members/gallery',   label: '🌊 Gallery' },
  { href: '/members/profile',   label: '🎣 Profile' },
];

const adminTab = { href: '/members/admin', label: '⚙️ Admin' };

export function MembersNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<'member' | 'guide' | 'admin'>('member');
  const [profileError, setProfileError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setProfileError(true);
        return;
      }
      setProfileError(false);
      if (!data) {
        await supabase.auth.signOut();
        window.location.href = '/sign-in';
        return;
      }
      if (data.role === 'admin' || data.role === 'guide' || data.role === 'member') {
        setRole(data.role);
      }
    });
    return () => { cancelled = true; };
  }, [attempt]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const tabs = role === 'admin' ? [...baseTabs, adminTab] : baseTabs;

  return (
    <nav className="sticky top-20 z-30 bg-cream/90 dark:bg-green-deep/90 backdrop-blur-md border-b border-gold/20 dark:border-gold/10">
      <div className="container mx-auto px-4 flex items-center gap-2">
        <ul className="flex gap-1 overflow-x-auto scrollbar-hide py-2 flex-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={[
                    'relative px-4 py-2 rounded-full text-sm font-serif whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-gold text-green-deep font-semibold'
                      : 'text-text-mid dark:text-cream/70 hover:text-amber dark:hover:text-amber',
                  ].join(' ')}
                >
                  {isActive && (
                    <motion.span
                      layoutId="members-nav-pill"
                      className="absolute inset-0 rounded-full bg-gold"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {profileError && (
          <button
            type="button"
            onClick={() => { setProfileError(false); setAttempt((n) => n + 1); }}
            className="shrink-0 px-3 py-1.5 font-serif text-sm text-amber hover:text-amber/80 transition-colors whitespace-nowrap"
          >
            Retry
          </button>
        )}
        <button
          onClick={() => { void handleSignOut(); }}
          className="shrink-0 px-3 py-1.5 font-serif text-sm text-amber hover:text-amber/80 transition-colors whitespace-nowrap"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
