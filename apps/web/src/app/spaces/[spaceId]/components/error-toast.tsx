/**
 * Error Toast Component
 *
 * Simple error notification with retry button.
 */

import * as React from 'react';

interface ErrorToastProps {
  error: string;
  onRetry: () => void;
}

export function ErrorToast({ error, onRetry }: ErrorToastProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96">
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 backdrop-blur-sm">
        {error}
        <button onClick={onRetry} className="ml-3 underline">
          Retry
        </button>
      </div>
    </div>
  );
}
