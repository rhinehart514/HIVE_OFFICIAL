import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ProfileContextProvider } from '@/components/profile/ProfileContextProvider';
import ProfilePageContent from './ProfilePageContent';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * SPEC-COMPLIANT PUBLIC PROFILE VIEW WITH PRESENCE
 *
 * Per SPEC.md:
 * - NO HANDLE DISPLAY: Use ID in URLs, not handle
 * - CAMPUS ISOLATION: All profiles filtered by campusId
 * - PRIVACY WIDGETS: Respect widget-level privacy settings
 * - TWO-LAYER SOCIAL: Show connections and friends appropriately
 * - PRESENCE SYSTEM: Real-time online/offline status with ghost mode
 */

interface Props {
  params: Promise<{ id: string }>;
}

// Fetch profile data server-side for metadata
async function fetchProfileForMetadata(userId: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/profile/${userId}`, {
      headers: sessionCookie ? { Cookie: `session=${sessionCookie}` } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.profile || data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchProfileForMetadata(id);

  if (!profile) {
    return {
      title: 'Profile Not Found - HIVE',
      description: 'This profile could not be found.',
    };
  }

  const name = profile.fullName || profile.displayName || 'HIVE Member';
  const bio = profile.bio || `${name} on HIVE - the student autonomy platform.`;
  const avatarUrl = profile.photoURL || profile.avatarUrl;

  return {
    title: `${name} - HIVE`,
    description: bio.slice(0, 160),
    openGraph: {
      title: `${name} - HIVE`,
      description: bio.slice(0, 160),
      type: 'profile',
      ...(avatarUrl && { images: [{ url: avatarUrl, width: 400, height: 400, alt: name }] }),
    },
    twitter: {
      card: 'summary',
      title: `${name} - HIVE`,
      description: bio.slice(0, 160),
      ...(avatarUrl && { images: [avatarUrl] }),
    },
  };
}

export default function PublicProfilePage() {
  return (
    <ProfileContextProvider>
      <ProfilePageContent />
    </ProfileContextProvider>
  );
}