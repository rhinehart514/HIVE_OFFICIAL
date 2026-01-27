'use client';

import Link from 'next/link';
import { Button } from '@hive/ui';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-ground">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <span className="text-6xl">404</span>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-white">
          Did Jacob forget another page?
        </h2>

        <p className="mb-6 text-sm text-white/50">
          Classic. The page you're looking for doesn't exist yet. We'll yell at him.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link href="/">
              <HomeIcon className="h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
