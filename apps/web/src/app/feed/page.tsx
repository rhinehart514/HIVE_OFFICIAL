'use client';

/**
 * /feed - DEPRECATED
 *
 * Redirects to /home (unified dashboard)
 * Feed and Spaces have been merged into /home as part of IA simplification.
 *
 * @deprecated Use /home instead
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="h-screen bg-foundation-gray-1000 flex items-center justify-center">
      <div className="animate-pulse text-white/30 text-body">Redirecting...</div>
    </div>
  );
}
