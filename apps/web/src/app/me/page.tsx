'use client';

/**
 * /me — Redirect to canonical profile URL (/u/[handle]).
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';

export default function MePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user?.handle) {
      router.replace(`/u/${user.handle}`);
    } else if (user?.id) {
      router.replace(`/u/${user.id}`);
    } else {
      router.replace('/enter?redirect=/me');
    }
  }, [user?.handle, user?.id, isLoading, router]);

  // Minimal loading — no spinner, just black screen to avoid flash
  return <div className="min-h-screen bg-black" />;
}
