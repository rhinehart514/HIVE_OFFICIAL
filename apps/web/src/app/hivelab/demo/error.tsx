'use client';

import { Button } from '@hive/ui/design-system/primitives';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function HiveLabDemoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">Demo unavailable</h2>
        <p className="mb-6 text-sm text-white/50">Could not load the demo.</p>
        <Button onClick={() => reset()} className="gap-2">
          <ArrowPathIcon className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
