'use client';

import { useEffect } from 'react';
import { Button } from '@hive/ui';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Application error boundary triggered', {
      digest: error.digest,
      component: 'RootErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Something went wrong
        </h2>

        <p className="mb-6 text-muted-foreground">
          We encountered an unexpected error. Our team has been notified and
          is working to fix it.
        </p>

        {error.digest && (
          <p className="mb-6 text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} size="lg">
            Try again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => (window.location.href = '/')}
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
