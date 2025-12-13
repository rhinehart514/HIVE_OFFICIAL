'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function SpaceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Space detail error boundary triggered', {
      digest: error.digest,
      component: 'SpaceDetailErrorBoundary',
    }, error);
  }, [error]);

  // Try to extract useful info from the error message
  const isNotFound = error.message?.toLowerCase().includes('not found');
  const isPermission = error.message?.toLowerCase().includes('permission') ||
    error.message?.toLowerCase().includes('forbidden') ||
    error.message?.toLowerCase().includes('access denied');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">
          {isNotFound
            ? 'Space not found'
            : isPermission
            ? 'Access denied'
            : 'Unable to load space'}
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          {isNotFound
            ? "This space doesn't exist or may have been removed."
            : isPermission
            ? "You don't have permission to view this space."
            : 'We had trouble loading this space. This might be a temporary issue.'}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!isNotFound && (
            <Button onClick={() => reset()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.location.href = '/spaces'}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse spaces
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
