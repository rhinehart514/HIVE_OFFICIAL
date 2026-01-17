'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui/design-system/primitives';
import { ExclamationTriangleIcon, ArrowPathIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function LeadersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Leaders error boundary triggered', {
      digest: error.digest,
      component: 'LeadersErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-white">
          Unable to load leaders
        </h2>

        <p className="mb-6 text-sm text-white/50">
          We had trouble loading the leaders directory. This might be a temporary issue.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/spaces'}
            className="gap-2"
          >
            <UserGroupIcon className="h-4 w-4" />
            Browse spaces
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-white/5 p-3 text-left border border-white/10">
            <p className="text-xs font-mono text-white/40 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
