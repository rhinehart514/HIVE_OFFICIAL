import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ProfileContextProvider } from '@/components/profile/ProfileContextProvider';
import ProfilePageContent from './ProfilePageContent';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * /u/[handle] — Canonical Profile URL
 *
 * This is the shareable, SEO-friendly profile URL.
 * - hive.co/u/johnsmith
 * - hive.co/u/jane_doe
 *
 * Handle-based URLs are canonical. ID-based URLs (/profile/[id]) redirect here.
 *
 * @version 2.0.0 - IA Unification (Jan 2026)
 */

interface Props {
  params: Promise<{ handle: string }>;
}

// Fetch profile data server-side for metadata
async function fetchProfileForMetadata(handle: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.college';

  try {
    const response = await fetch(`${baseUrl}/api/profile/handle/${encodeURIComponent(handle)}`, {
      headers: sessionCookie ? { Cookie: `session=${sessionCookie}` } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.profile || data.profile || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await fetchProfileForMetadata(handle);

  if (!profile) {
    return {
      title: 'Profile Not Found',
      description: 'This profile could not be found.',
    };
  }

  const name = profile.displayName || profile.fullName || handle;
  const bio = profile.bio || `${name} on HIVE - the student autonomy platform.`;
  const avatarUrl = profile.avatarUrl || profile.photoURL;

  return {
    title: `${name} (@${handle})`,
    description: bio.slice(0, 160),
    openGraph: {
      title: `${name} (@${handle}) | HIVE`,
      description: bio.slice(0, 160),
      type: 'profile',
      ...(avatarUrl && { images: [{ url: avatarUrl, width: 400, height: 400, alt: name }] }),
    },
    twitter: {
      card: 'summary',
      title: `${name} (@${handle}) | HIVE`,
      description: bio.slice(0, 160),
      ...(avatarUrl && { images: [avatarUrl] }),
    },
    alternates: {
      canonical: `/u/${handle}`,
    },
  };
}

export default function HandleProfilePage() {
  return (
    <ProfileContextProvider>
      <ProfilePageContent />
    </ProfileContextProvider>
  );
}
