'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function NewSetupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('New setup error', {
      digest: error.digest,
      component: 'NewSetupErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Unable to create setup
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          We had trouble loading the setup creator. This might be a temporary issue.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/lab/setups'}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Browse setups
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
