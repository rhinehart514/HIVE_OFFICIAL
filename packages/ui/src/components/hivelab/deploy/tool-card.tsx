'use client';

/**
 * ToolCard — Floating tool preview during deployment
 */

import { motion } from 'framer-motion';
import { CubeIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

// Colors - tokens are wired in globals.css
const COLORS = {
  panel: 'var(--hivelab-panel)',
  surface: 'var(--hivelab-surface)',
  border: 'var(--hivelab-border)',
  textPrimary: 'var(--hivelab-text-primary)',
  textSecondary: 'var(--hivelab-text-secondary)',
  textTertiary: 'var(--hivelab-text-tertiary)',
  gold: 'var(--life-gold)',
};

interface ToolCardProps {
  name: string;
  description?: string;
  elementCount: number;
  /** Compact mode for flight animation */
  compact?: boolean;
}

export function ToolCard({ name, description, elementCount, compact }: ToolCardProps) {
  return (
    <motion.div
      className={`relative rounded-2xl border overflow-hidden ${compact ? 'w-24' : 'w-full'}`}
      style={{
        backgroundColor: COLORS.panel,
        borderColor: COLORS.border,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${COLORS.gold}10`,
      }}
    >
      {/* Gold accent top border */}
      <div
        className={`${compact ? 'h-0.5' : 'h-1'}`}
        style={{ backgroundColor: COLORS.gold }}
      />

      <div className={compact ? 'p-2' : 'p-5'}>
        {/* Tool Icon */}
        <div
          className={`${compact ? 'w-8 h-8 mb-2' : 'w-12 h-12 mb-4'} rounded-xl flex items-center justify-center`}
          style={{
            backgroundColor: `${COLORS.gold}15`,
            border: `1px solid ${COLORS.gold}30`,
          }}
        >
          <CubeIcon
            className={compact ? 'h-4 w-4' : 'h-6 w-6'}
            style={{ color: COLORS.gold }}
          />
        </div>

        {/* Tool Name */}
        <h3
          className={`font-semibold ${compact ? 'text-xs' : 'text-lg'} mb-1`}
          style={{ color: COLORS.textPrimary }}
        >
          {compact ? name.slice(0, 12) : name}
        </h3>

        {/* Description (not in compact mode) */}
        {!compact && description && (
          <p className="text-sm mb-4 line-clamp-2" style={{ color: COLORS.textSecondary }}>
            {description}
          </p>
        )}

        {/* Element count (not in compact mode) */}
        {!compact && (
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: COLORS.textTertiary }}
          >
            <Squares2X2Icon className="h-3.5 w-3.5" />
            <span>{elementCount} element{elementCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
