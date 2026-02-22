'use client';

/**
 * /me — Redirect to canonical profile URL (/u/[handle]).
 *
 * If the user has a handle, redirect to /u/[handle].
 * If the user exists but has no handle (pre-onboarding), show inline profile.
 * If no user, redirect to auth.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

// Bento-shaped skeleton — matches the profile grid layout exactly
function ProfilePageSkeleton() {
  return (
    <div className="w-full px-6 py-6 pb-24 md:pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Portrait — tall left card */}
        <div className="md:row-span-2 h-[320px] md:h-full rounded-2xl bg-white/[0.04] animate-pulse" />
        {/* Stats */}
        <div className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
        {/* Interests */}
        <div className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
        {/* Spaces */}
        <div className="h-28 rounded-2xl bg-white/[0.04] animate-pulse md:col-span-2" />
        {/* Tools row */}
        <div className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />
        <div className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />
        <div className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />
        {/* Event */}
        <div className="h-32 rounded-2xl bg-white/[0.04] animate-pulse md:col-span-3" />
      </div>
    </div>
  );
}

function ProfileShell({ user }: { user: { id: string; email?: string | null; displayName?: string | null; fullName?: string | null } }) {
  const displayName = user.displayName || user.fullName || user.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="mx-auto max-w-2xl px-4 pt-16">
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center mb-4">
            <span className="text-2xl font-medium text-white/40">{initial}</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">{displayName}</h1>
          {user.email && (
            <p className="text-sm text-white/30 font-sans">{user.email}</p>
          )}
          <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] max-w-sm w-full">
            <p className="text-sm text-white/50 mb-4">
              Complete your profile to get a shareable link and start building.
            </p>
            <Link
              href="/me/edit"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-white/90 transition-colors"
            >
              Set up profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Fetch full profile to check handle status
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-me', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || json;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/enter?redirect=/me');
      return;
    }
    // If we have a confirmed handle, redirect to canonical URL
    const handle = user.handle || profile?.handle;
    if (handle) {
      router.replace(`/u/${handle}`);
    }
  }, [user, user?.handle, profile?.handle, isLoading, router]);

  if (isLoading || profileLoading) {
    return <ProfilePageSkeleton />;
  }

  // User exists but no handle — show inline profile shell
  if (user && !user.handle && !profile?.handle) {
    return <ProfileShell user={user} />;
  }

  // Redirect in progress — show skeleton instead of black flash
  return <ProfilePageSkeleton />;
}
