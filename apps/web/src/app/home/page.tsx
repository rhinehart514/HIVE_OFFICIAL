'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCampusMode } from '@/hooks/use-campus-mode';

export default function HomePage() {
  const router = useRouter();
  const { hasCampus, isLoading } = useCampusMode();

  useEffect(() => {
    if (isLoading) return;
    router.replace(hasCampus ? '/discover' : '/spaces');
  }, [hasCampus, isLoading, router]);

  return (
    <div className="h-screen bg-foundation-gray-1000 flex items-center justify-center">
      <div className="animate-pulse text-white/30 text-body">Redirecting...</div>
    </div>
  );
}
