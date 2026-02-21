'use client';

/**
 * /spaces/[spaceId]/tools — Legacy redirect
 *
 * Resolves spaceId to its handle via the public resolve-slug endpoint,
 * then redirects to /s/[handle].
 *
 * @deprecated Use /s/[handle] instead.
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LegacySpaceToolsPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;

  useEffect(() => {
    fetch(`/api/spaces/resolve-slug/${encodeURIComponent(spaceId)}`)
      .then((r) => r.json())
      .then((data) => {
        const slug = data?.data?.slug || data?.slug;
        if (slug) {
          router.replace(`/s/${slug}`);
        } else {
          router.replace('/spaces');
        }
      })
      .catch(() => router.replace('/spaces'));
  }, [spaceId, router]);

  return <div className="min-h-screen bg-black" />;
}
