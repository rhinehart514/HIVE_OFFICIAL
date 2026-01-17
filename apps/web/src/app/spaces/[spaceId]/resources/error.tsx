'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { DocumentTextIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function SpaceResourcesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Space resources error boundary triggered', {
      digest: error.digest,
      component: 'SpaceResourcesErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <DocumentTextIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Unable to load resources
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          We had trouble loading the resources. This might be a temporary issue.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go back
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
