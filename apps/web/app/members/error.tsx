'use client';

export default function MembersError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="font-display text-2xl text-green-deep dark:text-cream">The members area hit an error</h1>
      <p className="font-serif text-sm text-text-mid dark:text-cream/70">
        This was not a sign-out. Try the page again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 rounded-full bg-amber text-white font-serif text-sm"
      >
        Try again
      </button>
    </div>
  );
}
