'use client';

/**
 * /spaces/[spaceId]/tools — Legacy redirect
 *
 * Redirects to the new /s/[handle] space page.
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
    router.replace(`/s/${encodeURIComponent(spaceId)}`);
  }, [spaceId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <p className="text-sm text-white/50">Redirecting…</p>
    </div>
  );
}
