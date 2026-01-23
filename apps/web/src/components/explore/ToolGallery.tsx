'use client';

/**
 * ToolGallery - Gallery of HiveLab tools
 *
 * Shows tools available to deploy to spaces.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Tilt, GlassSurface, Badge, MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export interface ToolData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  deployCount: number;
  isOfficial?: boolean;
}

export interface ToolGalleryProps {
  tools: ToolData[];
  loading?: boolean;
  searchQuery?: string;
}

export function ToolGallery({ tools, loading, searchQuery }: ToolGalleryProps) {
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ToolCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (tools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center py-16"
      >
        <p className="text-white/40 text-[15px] mb-2">
          {searchQuery
            ? `No tools match "${searchQuery}"`
            : 'No tools available'}
        </p>
        <p className="text-white/25 text-[13px]">
          Build one in HiveLab
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool, i) => (
        <ToolCard key={tool.id} tool={tool} index={i} />
      ))}
    </div>
  );
}

// ============================================
// TOOL CARD
// ============================================

interface ToolCardProps {
  tool: ToolData;
  index: number;
}

function ToolCard({ tool, index }: ToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: index * 0.03,
        ease: MOTION.ease.premium,
      }}
    >
      <Tilt intensity={4}>
        <Link href={`/lab/${tool.id}`}>
          <GlassSurface
            intensity="subtle"
            className={cn(
              'p-5 rounded-xl transition-all duration-200',
              'border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
            )}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-xl">
                  {tool.icon || '🔧'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-medium text-white truncate">
                      {tool.name}
                    </h3>
                    {tool.isOfficial && (
                      <Badge variant="gold" size="sm">
                        Official
                      </Badge>
                    )}
                  </div>

                  {tool.category && (
                    <p className="text-[12px] text-white/40">{tool.category}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {tool.description && (
                <p className="text-[13px] text-white/50 line-clamp-2">
                  {tool.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[12px] text-white/30">
                  {tool.deployCount} deployments
                </span>
              </div>
            </div>
          </GlassSurface>
        </Link>
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
