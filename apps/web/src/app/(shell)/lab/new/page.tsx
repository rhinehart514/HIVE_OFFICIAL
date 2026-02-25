'use client';

/**
 * /lab/new — Redirects to /lab with query params preserved.
 *
 * The conversational creation experience now lives directly on /lab.
 * This redirect preserves backwards compatibility for any deep links.
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandSpinner } from '@hive/ui';

function RedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    const prompt = searchParams.get('prompt');
    const spaceId = searchParams.get('spaceId');

    if (prompt) params.set('prompt', prompt);
    if (spaceId) params.set('spaceId', spaceId);

    const query = params.toString();
    router.replace(`/lab${query ? `?${query}` : ''}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <BrandSpinner size="md" variant="gold" />
    </div>
  );
}

export default function NewToolRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <BrandSpinner size="md" variant="gold" />
        </div>
      }
    >
      <RedirectInner />
    </Suspense>
  );
}
