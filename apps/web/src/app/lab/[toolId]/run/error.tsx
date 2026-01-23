'use client';

/**
 * Error boundary for /run redirect page
 * Minimal since this page immediately redirects to the unified tool page
 */
export default function ToolRunError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--hivelab-bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--hivelab-text-primary)] mb-2">
          Redirect failed
        </h2>
        <p className="text-[var(--hivelab-text-secondary)] mb-6">
          Unable to redirect to the tool page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[var(--life-gold)] text-black rounded-lg font-medium hover:bg-[var(--life-gold)]/90 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)] rounded-lg font-medium hover:bg-[var(--hivelab-surface-hover)] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
