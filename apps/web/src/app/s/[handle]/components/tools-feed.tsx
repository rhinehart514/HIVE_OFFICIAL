'use client';

/**
 * ToolsFeed - Gallery/feed of tools posted to a space
 *
 * Shows tools in a gallery layout similar to explore page.
 * Tools-first: this is the default view when landing on a space.
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wrench, Plus, TrendingUp, FlaskConical } from 'lucide-react';
import {
  GlassSurface,
  Button,
  Badge,
  Tilt,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { staggerContainerVariants, revealVariants, cardHoverVariants } from '@hive/tokens';
import { cn } from '@/lib/utils';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';

interface ToolsFeedProps {
  tools: PlacedToolDTO[];
  isLoading: boolean;
  isLeader: boolean;
  spaceHandle: string;
  onAddTool: () => void;
}

export function ToolsFeed({
  tools,
  isLoading,
  isLeader,
  spaceHandle,
  onAddTool,
}: ToolsFeedProps) {
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
      >
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6">
          <Wrench className="w-8 h-8 text-white/30" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No tools yet
        </h3>
        <p className="text-white/50 mb-6 max-w-md text-center">
          {isLeader
            ? 'Build or post tools to make them available for this space'
            : 'Space leaders haven\'t posted any tools yet'}
        </p>
        {isLeader && (
          <div className="flex gap-3">
            <Button variant="cta" size="default" onClick={onAddTool}>
              <Plus className="w-4 h-4 mr-2" />
              Post a Tool
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {tools.map((tool) => (
          <ToolCard
            key={tool.placementId || tool.toolId}
            tool={tool}
            spaceHandle={spaceHandle}
          />
        ))}
      </motion.div>

      {/* Add tool FAB for leaders */}
      {isLeader && (
        <motion.div
          className="fixed bottom-6 right-6 z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: MOTION.duration.fast,
            ease: MOTION.ease.bounce,
            delay: 0.2,
          }}
        >
          <Button
            variant="cta"
            size="lg"
            onClick={onAddTool}
            className="rounded-full shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post Tool
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// TOOL CARD
// ============================================

interface ToolCardProps {
  tool: PlacedToolDTO;
  spaceHandle: string;
}

function ToolCard({ tool, spaceHandle }: ToolCardProps) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams();
    if (tool.placementId) params.set('placementId', tool.placementId);
    router.push(`/s/${spaceHandle}/tools/${tool.toolId}?${params.toString()}`);
  };

  return (
    <motion.div
      variants={revealVariants}
      whileHover="hover"
      initial="initial"
    >
      <Tilt intensity={4}>
        <motion.div variants={cardHoverVariants} onClick={handleClick}>
          <GlassSurface
            intensity="subtle"
            className={cn(
              'p-5 rounded-xl cursor-pointer transition-colors duration-200',
              'border border-white/[0.06] hover:border-white/10'
            )}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white/40" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-medium text-white truncate">
                    {tool.name}
                  </h3>
                  {tool.category && (
                    <p className="text-label text-white/40">{tool.category}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {tool.description && (
                <p className="text-body-sm text-white/50 line-clamp-2">
                  {tool.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end pt-1">
                <div className="flex items-center gap-1.5 text-label font-medium text-white/50">
                  <FlaskConical className="w-3 h-3" />
                  <span>Open</span>
                </div>
              </div>
            </div>
          </GlassSurface>
        </motion.div>
      </Tilt>
    </motion.div>
  );
}

// ============================================
// SKELETON
// ============================================

function ToolCardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/[0.06]" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-24 bg-white/[0.06] rounded" />
            <div className="h-3 w-16 bg-white/[0.04] rounded" />
          </div>
        </div>
        <div className="h-3 w-full bg-white/[0.04] rounded" />
        <div className="h-3 w-2/3 bg-white/[0.04] rounded" />
      </div>
    </div>
  );
}
