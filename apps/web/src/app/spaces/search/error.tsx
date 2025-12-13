'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function SpaceSearchError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Space search error boundary triggered', {
      digest: error.digest,
      component: 'SpaceSearchErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Search unavailable
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          We couldn&apos;t redirect you to the search page.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/spaces/browse'}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Browse
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go home
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-md bg-muted p-3 text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground/60 mt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
