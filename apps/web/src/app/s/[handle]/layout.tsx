import type { Metadata } from 'next';
import { dbAdmin } from '@/lib/firebase-admin';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}

async function fetchSpaceForMetadata(handle: string) {
  try {
    // Query by slug (handle = slug in URL)
    const snapshot = await dbAdmin
      .collection('spaces')
      .where('slug', '==', handle)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      name: (data.name as string) ?? handle,
      description: (data.description as string) ?? null,
      memberCount: (data.memberCount as number) ?? 0,
      avatarUrl: (data.avatarUrl as string) ?? null,
      category: (data.category as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { handle } = await params;
  const space = await fetchSpaceForMetadata(handle);

  if (!space) {
    return {
      title: 'Space | HIVE',
      description: 'A community on HIVE',
    };
  }

  const memberText = space.memberCount > 0
    ? `${space.memberCount} member${space.memberCount === 1 ? '' : 's'}`
    : null;
  const description = space.description
    || (memberText ? `${memberText} on HIVE` : `${space.name} on HIVE`);

  return {
    title: `${space.name} | HIVE`,
    description,
    openGraph: {
      title: space.name,
      description,
      siteName: 'HIVE',
      type: 'website',
      ...(space.avatarUrl ? { images: [{ url: space.avatarUrl }] } : {}),
    },
    twitter: {
      card: 'summary',
      title: space.name,
      description,
      ...(space.avatarUrl ? { images: [space.avatarUrl] } : {}),
    },
  };
}

export default function SpaceLayout({ children }: LayoutProps) {
  return children;
}
