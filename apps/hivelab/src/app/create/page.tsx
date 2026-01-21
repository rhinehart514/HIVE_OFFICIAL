'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@hive/ui';

/**
 * HiveLab Create Page - Context-Aware Tool Creation
 *
 * Requires context parameters (space or profile) to proceed.
 * Redirects to context selection if no context is provided.
 */

export default function CreateToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const context = searchParams.get('context'); // 'space' or 'profile'
    const spaceId = searchParams.get('spaceId');
    const spaceName = searchParams.get('spaceName');

    // Enforce context requirement - redirect to selection if missing
    if (!context || (context === 'space' && !spaceId)) {
      router.replace('/select-context');
      return;
    }

    // Generate a unique tool ID for the new tool
    const newToolId = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Build URL with context preserved
    const params = new URLSearchParams({
      new: 'true',
      context,
    });

    if (context === 'space' && spaceId) {
      params.set('spaceId', spaceId);
      if (spaceName) params.set('spaceName', spaceName);
    }

    // Redirect to IDE with blank canvas and context
    router.replace(`/${newToolId}?${params.toString()}`);
  }, [router, searchParams]);

  // Show loading skeleton while redirecting
  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col">
      {/* Toolbar skeleton */}
      <div className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-2 text-[#888] text-sm">
          <span className="animate-pulse">Opening canvas...</span>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex">
        {/* Left panel */}
        <div className="w-72 bg-[#0f0f0f] border-r border-[#333] p-4 space-y-4">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#666] text-sm">Starting blank canvas...</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 bg-[#0f0f0f] border-l border-[#333] p-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
