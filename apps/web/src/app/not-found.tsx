'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <h2 className="mb-2 text-2xl font-bold">
          Page not found
        </h2>

        <p className="mb-6 text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
