'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function SpaceClaimError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Space claim error boundary triggered', {
      digest: error.digest,
      component: 'SpaceClaimErrorBoundary',
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
          Unable to load claim form
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          We had trouble loading the space claim form. Please try again.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/spaces'}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Spaces
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
