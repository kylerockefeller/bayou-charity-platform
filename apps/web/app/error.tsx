'use client';

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-green-deep flex items-center justify-center px-4">
      <div className="bg-cream dark:bg-green-water rounded-2xl p-8 max-w-md text-center space-y-4">
        <h1 className="font-display text-2xl text-green-deep dark:text-cream">Something went wrong</h1>
        <p className="font-serif text-sm text-text-mid dark:text-cream/70">
          This page hit an error. You are still signed in.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-full bg-amber text-white font-serif text-sm"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
