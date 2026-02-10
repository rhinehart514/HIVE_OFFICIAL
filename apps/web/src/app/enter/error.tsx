'use client';

/**
 * Entry Error Boundary
 *
 * Critical protection for the entry flow. If auth fails catastrophically,
 * users need a clear path to retry.
 */

import { useEffect } from 'react';
import { Button } from '@hive/ui/design-system/primitives';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function EntryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Entry error boundary triggered', {
      digest: error.digest,
      component: 'EntryErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Ambient glow (matches EntryShell error state) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-500/10 p-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-white">
            Something went wrong
          </h2>

          <p className="mb-6 text-sm text-white/50">
            We couldn&apos;t complete the sign-in process. This might be a temporary issue.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => reset()} className="gap-2">
              <ArrowPathIcon className="h-4 w-4" />
              Try again
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/'}
            >
              Go home
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-6 rounded-md border border-white/[0.06] bg-white/[0.06] p-3 text-left">
              <p className="text-xs font-mono text-white/50 break-all">
                {error.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
