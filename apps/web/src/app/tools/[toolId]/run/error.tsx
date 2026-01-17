'use client';

import { useEffect } from 'react';
import { ArrowPathIcon, ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function ToolRunError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Tool run error boundary triggered', {
      digest: error.digest,
      component: 'ToolRunErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="workshop min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[var(--status-error)]/10 p-4">
            <PlayIcon className="h-8 w-8 text-[var(--status-error)]" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-[var(--hivelab-text-primary)]">
          Tool runtime error
        </h2>

        <p className="mb-6 text-sm text-[var(--hivelab-text-tertiary)]">
          Something went wrong while running this tool. Try reloading or check the tool configuration.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="workshop-btn workshop-btn-primary gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Restart tool
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="workshop-btn gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go back
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-[var(--hivelab-surface)] border border-[var(--hivelab-border)] p-3 text-left">
            <p className="text-xs font-mono text-[var(--hivelab-text-tertiary)] break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
