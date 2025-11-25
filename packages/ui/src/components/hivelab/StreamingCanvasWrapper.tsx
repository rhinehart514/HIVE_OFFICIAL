'use client';

/**
 * Streaming Canvas Wrapper - Client-Only
 *
 * Wraps StreamingCanvasView with dynamic import to prevent SSR issues
 * and provide error boundary for hooks violations during dynamic streaming.
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '../../atomic/00-Global/atoms/skeleton';

// Dynamic import with no SSR to prevent hooks order violations
const StreamingCanvasView = dynamic(
  () => import('./StreamingCanvasView').then(mod => ({ default: mod.StreamingCanvasView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-border/50 min-h-[600px]">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
        </div>
      </div>
    )
  }
);

export { StreamingCanvasView as StreamingCanvasViewWrapper };
export type { StreamingCanvasViewProps } from './StreamingCanvasView';
