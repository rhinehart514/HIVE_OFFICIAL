'use client';

/**
 * MainContent - Content area shell for space tabs
 *
 * No redundant scroll — children (MessageFeed, SpaceEventsTab, etc.)
 * own their own scroll behavior. This is just a flex container.
 *
 * @version 3.0.0 - Fixed double scroll (Feb 2026)
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface MainContentProps {
  /** Current board/tab name */
  boardName: string;
  /** Board header actions */
  headerActions?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Key for animation */
  contentKey?: string;
  className?: string;
}

export function MainContent({
  children,
  isLoading = false,
  className,
}: MainContentProps) {
  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {isLoading ? (
        <ContentSkeleton />
      ) : (
        <div className="flex-1 min-h-0 h-full">
          {children}
        </div>
      )}
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
            <div className="h-4 rounded bg-white/[0.06]" style={{ width: `${50 + i * 10}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

MainContent.displayName = 'MainContent';

export default MainContent;
