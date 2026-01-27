'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Application error boundary triggered', {
      digest: error.digest,
      component: 'RootErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-[#0A0A0A]">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[var(--status-warning-subtle)] p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-[var(--status-warning)]" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-white">
          Something broke.
        </h2>

        <p className="mb-6 text-sm text-white/50">
          Fixing it. Try again in a sec.
        </p>

        {error.digest && (
          <p className="mb-6 text-xs text-white/40">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
            className="gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            Go home
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-[var(--bg-void)] border border-white/[0.06] p-3 text-left">
            <p className="text-xs font-mono text-white/50 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
