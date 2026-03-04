'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function BuildError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Build error boundary triggered', {
      digest: error.digest,
      component: 'BuildErrorBoundary',
    }, error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 bg-black">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-white">
          Something went wrong
        </h2>

        <p className="mb-6 text-sm text-white/50">
          We hit a snag loading the build page. This is usually temporary.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-2xl
              bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/build'}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-2xl
              text-sm text-white/60 bg-white/[0.04] border border-white/[0.08]
              hover:bg-white/[0.08] hover:text-white/80 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Start fresh
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-left">
            <p className="text-xs font-mono text-white/40 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
