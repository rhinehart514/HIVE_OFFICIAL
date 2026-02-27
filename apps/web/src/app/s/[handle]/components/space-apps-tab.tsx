'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';
import { CreationCard } from './creation-card';

export interface SpaceAppsTabProps {
  tools: PlacedToolDTO[];
  isLoading: boolean;
  spaceId: string;
  spaceHandle: string;
  isLeader: boolean;
  onToolRun: (tool: PlacedToolDTO) => void;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden"
        >
          <div className="h-10 animate-pulse bg-white/[0.04]" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.04]" />
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-white/[0.04] mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SpaceAppsTab({
  tools,
  isLoading,
  spaceId,
  spaceHandle,
  isLeader,
  onToolRun,
}: SpaceAppsTabProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (tools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <div className="mb-4 rounded-full bg-white/[0.06] p-4">
          <Sparkles className="h-8 w-8 text-white/50" />
        </div>
        <h3 className="mb-1 text-xl font-semibold text-white">No apps in this space yet</h3>
        <p className="mb-6 text-sm text-white/50">Be the first to build one</p>
        {isLeader && (
          <Link href={`/lab?spaceId=${spaceId}`}>
            <Button variant="primary" size="sm">
              Build an app
            </Button>
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <div className="overflow-y-auto p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {tools.map((tool) => (
          <motion.div
            key={tool.placementId}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <CreationCard
              tool={tool}
              spaceHandle={spaceHandle}
              onTryIt={onToolRun}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
