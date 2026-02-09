'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { ExclamationTriangleIcon, ArrowPathIcon, UserIcon, HomeIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Settings error boundary triggered', {
      digest: error.digest,
      component: 'SettingsErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[var(--hive-brand-primary)]/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-[var(--hive-brand-primary)]" aria-hidden="true" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-white">
          Settings Unavailable
        </h2>

        <p className="mb-2 text-sm text-white/60">
          We couldn't load your settings right now.
        </p>
        <p className="mb-6 text-xs text-white/40">
          Your account preferences are safely stored. This is a temporary display issue.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            aria-label="Retry loading settings"
            className="gap-2 bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-primary)]/90"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/me'}
            aria-label="Go to your profile"
            className="gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            My Profile
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/discover'}
            aria-label="Go to discover"
            className="gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            Discover
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-white/5 border border-white/10 p-3 text-left">
            <p className="text-xs text-white/40 mb-1">Error details:</p>
            <p className="text-xs font-mono text-white/60 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
