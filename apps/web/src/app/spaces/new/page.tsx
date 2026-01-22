'use client';

/**
 * /spaces/new — Redirect to Modal
 *
 * Space creation now uses the SpaceCreationModal on /spaces.
 * This redirect maintains backwards compatibility with old links.
 *
 * @version 9.0.0 - Modal-based creation (Jan 2026)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpaceNewRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/spaces?create=true');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/40">Redirecting...</p>
    </div>
  );
}
