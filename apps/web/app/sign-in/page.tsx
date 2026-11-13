'use client';

import { createClient } from '@bayou/supabase';

export default function SignInPage() {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signInWithFacebook() {
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // Hidden until Apple is turned on in Supabase and Apple Developer.
  // Set NEXT_PUBLIC_APPLE_SIGN_IN=true to show the button again.
  const appleSignInEnabled = process.env.NEXT_PUBLIC_APPLE_SIGN_IN === 'true';

  async function signInWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="min-h-screen bg-green-deep flex items-center justify-center px-4">
      <div className="bg-cream dark:bg-green-water rounded-2xl p-8 w-full max-w-md space-y-4 shadow-xl">
        <h1 className="font-display text-3xl text-green-deep dark:text-cream text-center leading-tight">
          Members Sign In
        </h1>
        <p className="font-serif text-text-mid dark:text-cream/70 text-center text-sm">
          Use the same provider you signed up with
        </p>

        <div className="space-y-3 pt-2">
          <button
            onClick={signInWithGoogle}
            className="w-full bg-amber hover:bg-amber/90 text-white font-serif py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue with Google
          </button>
          <button
            onClick={signInWithFacebook}
            className="w-full bg-facebook hover:bg-facebook/90 text-white font-serif py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue with Facebook
          </button>
          {appleSignInEnabled && (
            <button
              onClick={signInWithApple}
              className="w-full bg-green-deep hover:bg-green-deep/90 dark:bg-white dark:text-green-deep text-white font-serif py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] border border-green-water dark:border-transparent"
            >
              Continue with Apple
            </button>
          )}
        </div>

        <div className="pt-2 text-center">
          <p className="text-text-mid dark:text-cream/50 text-sm">
            Not a member yet?{' '}
            <a
              href="https://www.zeffy.com/embed/ticketing/bayou-family-fishing-memberships"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:text-amber/80 underline transition-colors"
            >
              Join Bayou Family Fishing →
            </a>
          </p>
        </div>

        <p className="text-text-mid dark:text-cream/50 text-xs text-center pt-2">
          Sign in with the same provider you used when you joined BFF.
        </p>
      </div>
    </main>
  );
}
