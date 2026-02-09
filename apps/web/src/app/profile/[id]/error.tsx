'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';

export default function ProfileViewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logger.error('Profile view error boundary triggered', {
      digest: error.digest,
      component: 'ProfileViewErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[var(--life-gold)]/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-[var(--life-gold)]" aria-hidden="true" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-white">
          Unable to Load Profile
        </h2>

        <p className="mb-6 text-sm text-white/50">
          We had trouble loading this profile. This might be a temporary issue.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            aria-label="Retry loading the profile"
            className="gap-2 bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold)]/90"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.back()}
            aria-label="Go back to previous page"
            className="gap-2 border-white/[0.08] text-white/70 hover:bg-white/[0.04]"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Go back
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/discover'}
            aria-label="Go to discover page"
            className="gap-2 border-white/[0.08] text-white/70 hover:bg-white/[0.04]"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            Discover
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-white/[0.02] border border-white/[0.08] p-3 text-left">
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
