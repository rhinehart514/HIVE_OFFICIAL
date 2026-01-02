'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Spaces Index - Redirects to Browse
 *
 * The search-first browse page is now the canonical discovery experience.
 * This redirect ensures a consistent user experience.
 */
export default function SpacesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/spaces/browse');
  }, [router]);

  // Minimal loading state during redirect
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );
}
