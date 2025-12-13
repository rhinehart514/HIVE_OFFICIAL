"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';

export default function ProfileIndexPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Wait for session check to complete before redirecting
    if (isLoading) return;

    if (user?.id) {
      router.replace(`/profile/${user.id}`);
    } else {
      router.replace('/auth/login?from=/profile');
    }
  }, [user?.id, isLoading, router]);

  // Lightweight fallback while redirecting
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--hive-brand-primary)] mx-auto mb-4" />
        <p className="text-white/80 text-sm">Loading profile…</p>
      </div>
    </div>
  );
}

