'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Search redirects to browse page which has full search functionality
 */
export default function SpacesSearchPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to browse page with search param to auto-focus search
    router.replace('/spaces/browse?focus=search');
  }, [router]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--hive-text-tertiary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--hive-text-secondary)]">Redirecting to search...</p>
      </div>
    </div>
  );
}