import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Legacy handle-based profile route
 *
 * @deprecated Use /profile/[id] directly. This route will be removed post-launch.
 *
 * Redirects to the canonical ID-based profile URL.
 */

async function getProfileIdByHandle(handle: string): Promise<{ id: string; isOwnProfile: boolean } | null> {
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
    return data.success ? { id: data.data.id, isOwnProfile: false } : null;
  } catch {
    return null;
  }
}

export default async function UserHandleRedirect({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  if (!handle) notFound();

  const result = await getProfileIdByHandle(handle);

  if (!result?.id) notFound();

  redirect(`/profile/${result.id}`);
}
