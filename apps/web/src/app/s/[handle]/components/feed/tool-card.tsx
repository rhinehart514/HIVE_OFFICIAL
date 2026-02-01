'use client';

/**
 * ToolCard - Inline tool card in feed
 *
 * Shows:
 * - Tool name and description
 * - Quick run button
 * - Usage count
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Play, ExternalLink, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui';
import { SPACE_COMPONENTS } from '@hive/tokens';

export interface ToolCardTool {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  usageCount?: number;
  placementId?: string;
}

interface ToolCardProps {
  tool: ToolCardTool;
  onRun?: () => void;
  onViewFull?: () => void;
  className?: string;
}

export function ToolCard({
  tool,
  onRun,
  onViewFull,
  className,
}: ToolCardProps) {
  const { toolCard } = SPACE_COMPONENTS;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'rounded-xl',
        'bg-white/[0.02] hover:bg-white/[0.04]',
        'border border-white/[0.06] hover:border-white/[0.10]',
        'transition-all duration-150',
        className
      )}
      style={{
        maxWidth: `${toolCard.maxWidth}px`,
        padding: `${toolCard.padding}px`,
        borderRadius: `${toolCard.borderRadius}px`,
      }}
    >
      {/* Header: Icon + Name */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
          {tool.icon ? (
            <span className="text-lg">{tool.icon}</span>
          ) : (
            <Wrench className="w-4 h-4 text-white/60" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {tool.name}
          </h3>
          {tool.description && (
            <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
              {tool.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer: Usage + Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
        {/* Usage count */}
        {tool.usageCount !== undefined && tool.usageCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/50">
              {tool.usageCount} {tool.usageCount === 1 ? 'use' : 'uses'}
            </span>
          </div>
        )}
        {(!tool.usageCount || tool.usageCount === 0) && (
          <div />
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {onViewFull && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white/70"
              onClick={onViewFull}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
          {onRun && (
            <Button
              variant="cta"
              size="sm"
              onClick={onRun}
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              Run
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

ToolCard.displayName = 'ToolCard';

export default ToolCard;
