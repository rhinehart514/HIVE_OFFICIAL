'use client';

/**
 * Tag Cloud Element - Refactored with Core Abstractions
 *
 * Weighted tag display with:
 * - Variable font sizes based on weight
 * - Animated entrance
 * - Optional count display
 */

import * as React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Badge } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface TagItem {
  label: string;
  weight: number;
}

interface TagCloudConfig {
  maxTags?: number;
  showCounts?: boolean;
}

interface TagCloudElementProps extends ElementProps {
  config: TagCloudConfig;
  mode?: ElementMode;
}

// ============================================================
// Main Tag Cloud Element
// ============================================================

export function TagCloudElement({
  config,
  data,
  mode = 'runtime',
}: TagCloudElementProps) {
  const tags = data?.tags || [];
  const sortedTags = [...tags].sort((a: TagItem, b: TagItem) => b.weight - a.weight).slice(0, config.maxTags || 30);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tag Cloud</span>
      </div>

      <motion.div className="flex flex-wrap gap-2" layout>
        {sortedTags.length > 0 ? (
          sortedTags.map((tag: TagItem, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, ...springPresets.snappy }}
              whileHover={{ opacity: 0.9 }}
            >
              <Badge
                variant="outline"
                className="text-sm font-medium px-3 py-1 cursor-default transition-colors hover:border-primary/50"
                style={{
                  fontSize: `${Math.max(12, Math.min(22, tag.weight + 12))}px`,
                }}
              >
                {tag.label}
                {config.showCounts && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {tag.weight}
                  </span>
                )}
              </Badge>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springPresets.gentle}
            className="w-full py-10 text-center"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-3"
            >
              <TagIcon className="h-7 w-7 text-primary/40" />
            </motion.div>
            <p className="font-medium text-foreground mb-1">No tags yet</p>
            <p className="text-sm text-muted-foreground">Tags will appear when data is connected</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default TagCloudElement;
