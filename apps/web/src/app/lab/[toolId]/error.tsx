'use client';

import { useEffect } from 'react';
import { ArrowPathIcon, ArrowLeftIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function ToolDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Tool detail error boundary triggered', {
      digest: error.digest,
      component: 'ToolDetailErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="workshop min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[var(--status-error)]/10 p-4">
            <WrenchScrewdriverIcon className="h-8 w-8 text-[var(--status-error)]" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-[var(--hivelab-text-primary)]">
          Unable to load app
        </h2>

        <p className="mb-6 text-sm text-[var(--hivelab-text-tertiary)]">
          We had trouble loading this app. It may have been moved or deleted.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="workshop-btn workshop-btn-primary gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.href = '/lab'}
            className="workshop-btn gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Browse apps
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-[var(--hivelab-surface)] border border-[var(--hivelab-border)] p-3 text-left">
            <p className="text-xs font-sans text-[var(--hivelab-text-tertiary)] break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
