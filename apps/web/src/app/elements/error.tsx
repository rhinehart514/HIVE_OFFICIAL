'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function ElementsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Elements error boundary triggered', {
      digest: error.digest,
      component: 'ElementsErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[var(--hive-gold)]/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-[var(--hive-gold)]" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Elements Error
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          We encountered an error loading the HiveLab elements showcase.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/tools'}
            className="gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            Back to Tools
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-muted p-3 text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
