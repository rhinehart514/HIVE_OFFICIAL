'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProfileOverviewPage, ProfileViewLoadingSkeleton } from '@hive/ui';

interface ProfileData {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  pronouns?: string;
  major?: string;
  graduationYear?: number;
  campusId: string;
  isVerified: boolean;
  badges: string[];
  interests: string[];
  stats: {
    spacesCount: number;
    connectionsCount: number;
    toolsCreated: number;
  };
  createdAt?: string;
  isPrivate?: boolean;
}

interface ProfileResponse {
  profile: ProfileData;
  isOwnProfile: boolean;
  viewerType: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!handle) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/profile/handle/${encodeURIComponent(handle)}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Profile not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }

        const data: ProfileResponse = await response.json();
        setProfile(data.profile);
        setIsOwnProfile(data.isOwnProfile);

        // Redirect to own profile page if viewing own profile
        if (data.isOwnProfile) {
          router.replace('/profile');
          return;
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [handle, router]);

  if (isLoading) {
    return <ProfileViewLoadingSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--hive-background-page)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--hive-text-primary)]">
            {error === 'Profile not found' ? 'Profile Not Found' : 'Error'}
          </h1>
          <p className="text-[var(--hive-text-secondary)]">
            {error === 'Profile not found'
              ? `We couldn't find a user with the handle @${handle}`
              : 'Something went wrong loading this profile'}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[var(--hive-accent-primary)] text-white rounded-lg hover:opacity-90 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Handle private profiles
  if (profile.isPrivate) {
    return (
      <div className="min-h-screen bg-[var(--hive-background-page)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-[var(--hive-background-secondary)] rounded-full flex items-center justify-center">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--hive-text-primary)]">
            @{profile.handle}
          </h1>
          <p className="text-[var(--hive-text-secondary)]">
            This profile is private
          </p>
        </div>
      </div>
    );
  }

  // Map profile data to ProfileOverviewPage props
  return (
    <ProfileOverviewPage
      campusName="UB"
      userName={profile.displayName}
      handle={profile.handle}
      avatarUrl={profile.avatarUrl}
      avatarFallback={profile.displayName?.slice(0, 2).toUpperCase() || '??'}
      pronouns={profile.pronouns}
      program={profile.major || 'Student'}
      badges={profile.badges || []}
      stats={[
        { label: 'Spaces', value: String(profile.stats.spacesCount || 0) },
        { label: 'Connections', value: String(profile.stats.connectionsCount || 0) },
        { label: 'Tools', value: String(profile.stats.toolsCreated || 0) },
      ]}
      highlights={[]}
      experiences={[]}
      spaces={[]}
    />
  );
}
