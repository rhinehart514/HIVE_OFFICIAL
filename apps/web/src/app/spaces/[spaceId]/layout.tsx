import type { Metadata } from 'next';
import { SpaceSubnav } from './SpaceSubnav.client';

export const metadata: Metadata = {
  title: 'Space · HIVE',
};

export default async function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  return (
    <div className="min-h-screen bg-black">
      <SpaceSubnav spaceId={spaceId} />
      {children}
    </div>
  );
}

