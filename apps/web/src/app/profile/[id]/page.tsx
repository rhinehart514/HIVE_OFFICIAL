import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * /profile/[id] — Legacy Profile URL Redirect
 *
 * This route now redirects to the canonical /u/[handle] URL.
 * Existing bookmarks and links will automatically redirect.
 *
 * @deprecated Use /u/[handle] for profile URLs
 * @version 2.0.0 - IA Unification (Jan 2026)
 */

interface Props {
  params: Promise<{ id: string }>;
}

// Fetch profile to get handle for redirect
async function fetchProfileHandle(userId: string): Promise<string | null> {
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
    const profile = data.profile || data.data?.profile || data;
    return profile?.handle || null;
  } catch {
    return null;
  }
}

export default async function LegacyProfilePage({ params }: Props) {
  const { id } = await params;

  // Look up handle from ID
  const handle = await fetchProfileHandle(id);

  if (handle) {
    // Redirect to canonical URL
    redirect(`/u/${handle}`);
  }

  // If no handle found, redirect to home with error
  // The user might not exist or the API might be down
  redirect('/home');
}
