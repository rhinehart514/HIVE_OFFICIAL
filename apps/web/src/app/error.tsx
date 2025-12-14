'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error boundary triggered', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <h2 className="mb-2 text-2xl font-bold">
          Something went wrong
        </h2>

        <p className="mb-6 text-gray-500">
          We encountered an unexpected error.
        </p>

        {error.digest && (
          <p className="mb-6 text-sm text-gray-400">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
