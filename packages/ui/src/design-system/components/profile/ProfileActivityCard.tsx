'use client';

/**
 * ProfileActivityCard - Zone 2: Tool with impact metrics
 *
 * Design Philosophy:
 * - Shows what they've BUILT — tools with usage metrics
 * - Gold bottom border when runs >= 100 (EARNED)
 * - Emoji icon, tool name, runs (prominent), context
 *
 * @version 1.0.0 - 3-Zone Profile Layout
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { SimpleTooltip } from '../../primitives/Tooltip';

// ============================================================================
// Types
// ============================================================================

export interface ProfileActivityTool {
  id: string;
  name: string;
  emoji?: string;
  runs: number;
  spaceName?: string;
}

export interface ProfileActivityCardProps {
  tool: ProfileActivityTool;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

// ============================================================================
// Component
// ============================================================================

export function ProfileActivityCard({
  tool,
  onClick,
  className,
}: ProfileActivityCardProps) {
  const isHighPerformer = tool.runs >= 100;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-5 text-left overflow-hidden w-full',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        // Gold bottom border for high performers
        borderBottom: isHighPerformer ? '2px solid var(--life-gold)' : undefined,
        boxShadow: isHighPerformer
          ? '0 4px 24px rgba(0,0,0,0.25), 0 2px 12px rgba(255,215,0,0.1)'
          : '0 4px 24px rgba(0,0,0,0.25)',
      }}
      whileHover={{
        y: -2,
        boxShadow: isHighPerformer
          ? '0 8px 32px rgba(0,0,0,0.3), 0 4px 16px rgba(255,215,0,0.15)'
          : '0 8px 32px rgba(0,0,0,0.3)',
      }}
      whileTap={{ opacity: 0.9 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Subtle glass overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
          borderRadius: '16px',
        }}
      />

      {/* High performer glow */}
      {isHighPerformer && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255,215,0,0.06) 0%, transparent 70%)',
            borderRadius: '16px',
          }}
        />
      )}

      <div className="relative">
        {/* Emoji Icon */}
        <span className="text-2xl block mb-3">
          {tool.emoji || '📊'}
        </span>

        {/* Tool Name with tooltip for truncated text */}
        <SimpleTooltip content={tool.name}>
          <h4
            className="text-lg font-semibold truncate mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {tool.name}
          </h4>
        </SimpleTooltip>

        {/* Divider */}
        <div
          className="w-full h-px mb-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        />

        {/* Runs - Large and prominent */}
        <p
          className="text-base font-medium"
          style={{
            color: isHighPerformer ? 'var(--life-gold)' : 'var(--text-primary)',
          }}
        >
          {formatNumber(tool.runs)} runs
        </p>

        {/* Context - Space name */}
        {tool.spaceName && (
          <p
            className="text-[13px] font-normal mt-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Built for {tool.spaceName}
          </p>
        )}
      </div>
    </motion.button>
  );
}

// ============================================================================
// Skeleton Component
// ============================================================================

export function ProfileActivityCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative p-5 text-left overflow-hidden w-full animate-pulse', className)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      <div className="relative space-y-3">
        {/* Emoji skeleton */}
        <div
          className="w-8 h-8 rounded"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        />
        {/* Tool name skeleton */}
        <div
          className="h-5 w-3/4 rounded"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        />
        {/* Divider skeleton */}
        <div
          className="w-full h-px"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        />
        {/* Runs skeleton */}
        <div
          className="h-4 w-20 rounded"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        />
        {/* Context skeleton */}
        <div
          className="h-3 w-28 rounded"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
      </div>
    </div>
  );
}

export default ProfileActivityCard;
