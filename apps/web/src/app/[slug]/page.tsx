'use client';

/**
 * /[slug] → Space Detail
 * Phase 7: Short URL for space access
 *
 * This catch-all route handles short space URLs like:
 * - /chess-club → resolves to space with slug "chess-club"
 * - /acm → resolves to space with slug "acm"
 *
 * Reserved routes are handled by their own folders (browse, build, me, etc.)
 * so this only catches non-reserved slugs.
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { UnifiedSpaceInterface } from '@/components/spaces/unified-space-interface';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';
import { isReservedRoute } from '@/lib/reserved-routes';

export default function SlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveSlug() {
      if (!slug) return;

      // Safety check: redirect reserved routes (shouldn't happen, but just in case)
      if (isReservedRoute(slug)) {
        router.replace(`/${slug}`);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try to resolve slug to space ID via API
        const response = await secureApiFetch(`/api/spaces/resolve-slug/${slug}`, { method: 'GET' });

        if (response.status === 404) {
          notFound();
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to resolve space');
        }

        const data = await response.json();
        setSpaceId(data.spaceId);

      } catch (err) {
        logger.error('Error resolving space slug', { component: 'SlugPage' }, err instanceof Error ? err : undefined);
        setError(err instanceof Error ? err.message : 'Failed to load space');
      } finally {
        setIsLoading(false);
      }
    }

    resolveSlug();
  }, [slug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--hive-brand-primary)] mx-auto mb-4" />
          <p className="text-white/70">Loading /{slug}...</p>
        </div>
      </div>
    );
  }

  if (error || !spaceId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Space Not Found</h2>
          <p className="text-gray-400 mb-6">
            The space /{slug} could not be found or is no longer available.
          </p>
          <button
            onClick={() => router.push('/browse')}
            className="px-6 py-2 bg-[var(--hive-brand-primary)] text-black rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Browse Spaces
          </button>
        </div>
      </div>
    );
  }

  return <UnifiedSpaceInterface spaceId={spaceId} />;
}
