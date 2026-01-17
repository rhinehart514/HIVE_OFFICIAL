'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui/design-system/primitives';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

export default function SpaceModerationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Space moderation error', { digest: error.digest }, error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">Moderation unavailable</h2>
        <p className="mb-6 text-sm text-white/50">Could not load moderation tools.</p>
        <Button onClick={() => reset()} className="gap-2">
          <ArrowPathIcon className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
