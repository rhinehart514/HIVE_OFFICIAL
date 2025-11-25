'use client';

import { Button } from '@hive/ui';
import { SearchX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <SearchX className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Page not found
        </h2>

        <p className="mb-6 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">Go home</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
