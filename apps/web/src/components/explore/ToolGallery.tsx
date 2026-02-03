'use client';

/**
 * ToolGallery - Gallery of HiveLab tools
 *
 * Shows tools available to deploy to spaces.
 * Uses stagger container for orchestrated reveals.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Wrench, Search, Sparkles } from 'lucide-react';
import { Tilt, GlassSurface, Badge, Button } from '@hive/ui/design-system/primitives';
import { MOTION, revealVariants, staggerContainerVariants, cardHoverVariants } from '@hive/tokens';
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

  // Empty state with helpful guidance
  if (tools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.standard, ease: MOTION.ease.premium }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <GlassSurface
          intensity="subtle"
          className="p-8 rounded-xl max-w-md w-full text-center"
        >
          {/* Icon */}
          <motion.div
            className="w-14 h-14 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {searchQuery ? (
              <Search className="w-6 h-6 text-white/30" />
            ) : (
              <Sparkles className="w-6 h-6 text-white/30" />
            )}
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-body-lg font-medium text-white/80 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            {searchQuery
              ? `No tools match "${searchQuery}"`
              : 'The lab is empty'}
          </motion.h3>

          {/* Subtitle */}
          <motion.p
            className="text-body-sm text-white/40 mb-6 max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            {searchQuery
              ? 'Try a different search or browse all available tools'
              : 'Be the first to build something useful for your campus. Create polls, forms, or custom tools for your spaces.'}
          </motion.p>

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
          >
            <Button variant="cta" size="sm" asChild>
              <Link href="/lab/new">
                <Wrench className="w-4 h-4 mr-1.5" />
                Create a Tool
              </Link>
            </Button>
            {searchQuery && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/explore?tab=tools">Browse All</Link>
              </Button>
            )}
          </motion.div>

          {/* Helpful hint */}
          {!searchQuery && (
            <motion.p
              className="text-label text-white/25 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              Tools you build can be deployed to any space
            </motion.p>
          )}
        </GlassSurface>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </motion.div>
  );
}

// ============================================
// TOOL CARD
// ============================================

interface ToolCardProps {
  tool: ToolData;
}

function ToolCard({ tool }: ToolCardProps) {
  return (
    <motion.div
      variants={revealVariants}
      whileHover="hover"
      initial="initial"
    >
      <Tilt intensity={4}>
        <Link href={`/lab/${tool.id}`}>
          <motion.div variants={cardHoverVariants}>
            <GlassSurface
              intensity="subtle"
              className={cn(
                'p-5 rounded-xl transition-colors duration-200',
                'border border-white/[0.06] hover:border-white/10'
              )}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    {tool.icon && !tool.icon.startsWith('http') ? (
                      <span className="text-xl">{tool.icon}</span>
                    ) : (
                      <Wrench className="w-5 h-5 text-white/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-body font-medium text-white truncate">
                        {tool.name}
                      </h3>
                      {tool.isOfficial && (
                        <Badge variant="gold" size="sm">
                          Official
                        </Badge>
                      )}
                    </div>

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
                <div className="flex items-center justify-between pt-1">
                  <span className="text-label text-white/30">
                    {tool.deployCount} deployments
                  </span>
                </div>
              </div>
            </GlassSurface>
          </motion.div>
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
