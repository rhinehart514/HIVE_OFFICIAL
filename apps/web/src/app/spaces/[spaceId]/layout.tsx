import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SpaceLayoutWithNav } from './SpaceLayoutWrapper.client';

interface Props {
  children: React.ReactNode;
  params: Promise<{ spaceId: string }>;
}

// Fetch space data server-side for metadata
async function fetchSpaceForMetadata(spaceId: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/spaces/${spaceId}`, {
      headers: sessionCookie ? { Cookie: `session=${sessionCookie}` } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.space || data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { spaceId } = await params;
  const space = await fetchSpaceForMetadata(spaceId);

  if (!space) {
    return {
      title: 'Space Not Found - HIVE',
      description: 'This space could not be found.',
    };
  }

  const name = space.name || 'HIVE Space';
  const description = space.description || `Join ${name} on HIVE - the student autonomy platform.`;
  const memberCount = space.memberCount || 0;
  const bannerUrl = space.bannerUrl || space.iconUrl;

  return {
    title: `${name} - HIVE`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${name} - HIVE`,
      description: `${description.slice(0, 120)} • ${memberCount} members`,
      type: 'website',
      ...(bannerUrl && { images: [{ url: bannerUrl, width: 1200, height: 630, alt: name }] }),
    },
    twitter: {
      card: bannerUrl ? 'summary_large_image' : 'summary',
      title: `${name} - HIVE`,
      description: `${description.slice(0, 120)} • ${memberCount} members`,
      ...(bannerUrl && { images: [bannerUrl] }),
    },
  };
}

export default async function SpaceLayout({ children, params }: Props) {
  const { spaceId } = await params;
  return (
    <SpaceLayoutWithNav spaceId={spaceId}>
      {children}
    </SpaceLayoutWithNav>
  );
}

