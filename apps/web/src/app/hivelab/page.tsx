'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * HiveLab Hub - Redirects to Context Selection
 *
 * Users must select where they're building (space or profile) before accessing HiveLab.
 * This ensures all tools have proper context from creation.
 */
export default function HiveLabPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to standalone HiveLab app context selection
    const hiveLabUrl = process.env.NEXT_PUBLIC_HIVELAB_URL || 'http://localhost:3002';
    window.location.href = `${hiveLabUrl}/select-context`;
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--hive-text-secondary)]">Redirecting to HiveLab...</p>
    </div>
  );
}
