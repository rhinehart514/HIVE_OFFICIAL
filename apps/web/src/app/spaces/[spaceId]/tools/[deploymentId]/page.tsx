'use client';

/**
 * Legacy redirect → /s/[handle]
 * @deprecated
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LegacySpaceToolDetailPage() {
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
