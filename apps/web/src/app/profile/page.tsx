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
      router.replace('/enter?redirect=/profile');
    }
  }, [user?.id, isLoading, router]);

  // Lightweight fallback while redirecting
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className=" rounded-full h-8 w-8 border-b-2 border-[var(--hive-gold)] mx-auto mb-4" />
        <p className="text-white text-sm">Loading profile…</p>
      </div>
    </div>
  );
}

