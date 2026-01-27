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
    <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" aria-hidden="true" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-white">
          Unable to Load Editor
        </h2>

        <p className="mb-2 text-sm text-white/50">
          We had trouble loading the profile editor.
        </p>
        <p className="mb-6 text-xs text-white/40">
          Don't worry - any changes you made before this error have been saved.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            aria-label="Retry loading the editor"
            className="gap-2 bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold)]/90"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/profile'}
            aria-label="Return to your profile"
            className="gap-2 border-white/[0.08] text-white/70 hover:bg-[var(--bg-ground)]"
          >
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            My Profile
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/settings'}
            aria-label="Go to settings"
            className="gap-2 border-white/[0.08] text-white/70 hover:bg-[var(--bg-ground)]"
          >
            <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
            Cog6ToothIcon
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-[var(--bg-void)] border border-white/[0.06] p-3 text-left">
            <p className="text-xs text-white/40 mb-1">Error details:</p>
            <p className="text-xs font-mono text-white/50 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
