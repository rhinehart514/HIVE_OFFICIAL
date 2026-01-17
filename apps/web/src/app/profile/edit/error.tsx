'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { ExclamationTriangleIcon, ArrowPathIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function ProfileEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Profile edit error boundary triggered', {
      digest: error.digest,
      component: 'ProfileEditErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" aria-hidden="true" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-white">
          Unable to Load Editor
        </h2>

        <p className="mb-2 text-sm text-neutral-400">
          We had trouble loading the profile editor.
        </p>
        <p className="mb-6 text-xs text-neutral-500">
          Don't worry - any changes you made before this error have been saved.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            aria-label="Retry loading the editor"
            className="gap-2 bg-amber-500 text-neutral-950 hover:bg-amber-400"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/profile'}
            aria-label="Return to your profile"
            className="gap-2 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            My Profile
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/settings'}
            aria-label="Go to settings"
            className="gap-2 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
            Cog6ToothIcon
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-neutral-900 border border-neutral-800 p-3 text-left">
            <p className="text-xs text-neutral-500 mb-1">Error details:</p>
            <p className="text-xs font-mono text-neutral-400 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
