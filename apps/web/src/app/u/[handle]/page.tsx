import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * /u/[handle] — Public Profile View
 *
 * Archetype: Orientation
 * Purpose: View any user's profile by handle (shareable URL)
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - Handle-based URLs for shareable profiles
 * - Resolves handle → user ID, then redirects to canonical profile route
 *
 * Note: This is the PUBLIC URL format. Internally, we use /profile/[id]
 * for the actual rendering to maintain consistency with the profile system.
 */

async function resolveHandleToId(handle: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/profile?handle=${encodeURIComponent(handle)}`,
      {
        headers: sessionCookie ? { Cookie: `session=${sessionCookie.value}` } : {},
        cache: 'no-store',
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.success && data.data?.id ? data.data.id : null;
  } catch {
    return null;
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  if (!handle) {
    notFound();
  }

  const userId = await resolveHandleToId(handle);

  if (!userId) {
    notFound();
  }

  // Redirect to canonical profile route
  // The profile page renders the full Orientation archetype experience
  redirect(`/profile/${userId}`);
}
