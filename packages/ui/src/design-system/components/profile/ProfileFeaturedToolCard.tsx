'use client';

/**
 * ProfileFeaturedToolCard - Pinnable featured tool showcase
 *
 * Design Philosophy:
 * - Apple: Premium card with depth and polish
 * - Spotify: Featured/hero content treatment
 * - HIVE: Gold accent for tool performance, warm dark palette
 *
 * @version 1.0.0 - Apple bento widget
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { easingArrays } from '@hive/tokens';

export interface FeaturedTool {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  runs: number;
  deployedSpaces: number;
  createdAt?: Date;
}

export interface ProfileFeaturedToolCardProps {
  tool?: FeaturedTool | null;
  isOwnProfile?: boolean;
  onToolClick?: (id: string) => void;
  onSelectTool?: () => void;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export function ProfileFeaturedToolCard({
  tool,
  isOwnProfile = false,
  onToolClick,
  onSelectTool,
  className,
}: ProfileFeaturedToolCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Empty state
  if (!tool) {
    return (
      <motion.div
        className={cn('relative overflow-hidden', className)}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-default)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%)',
            borderRadius: '24px',
          }}
        />

        <div className="relative p-6 flex flex-col items-center justify-center min-h-[160px]">
          <span className="text-3xl mb-3">⭐</span>
          <p
            className="text-sm text-center mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Spotlight your best
          </p>
          <p
            className="text-xs text-center mb-4"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Feature a tool you&apos;re proud of
          </p>
          {isOwnProfile && (
            <motion.button
              onClick={onSelectTool}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                color: 'var(--life-gold)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
              }}
              whileHover={{
                backgroundColor: 'rgba(255, 215, 0, 0.15)',
              }}
              whileTap={{ opacity: 0.8 }}
            >
              Pick a tool
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  const isHighPerformer = tool.runs >= 100;

  return (
    <motion.div
      className={cn('relative overflow-hidden cursor-pointer', className)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '24px',
        border: isHighPerformer
          ? '1px solid rgba(255, 215, 0, 0.3)'
          : '1px solid var(--border-default)',
        boxShadow: isHighPerformer
          ? '0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 215, 0, 0.08)'
          : '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onToolClick?.(tool.id)}
      whileHover={{ opacity: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%)',
          borderRadius: '24px',
        }}
      />

      {/* Featured badge */}
      <motion.div
        className="absolute top-4 right-4 px-2.5 py-1 rounded-full flex items-center gap-1.5"
        style={{
          backgroundColor: 'rgba(255, 215, 0, 0.15)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-xs">⭐</span>
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--life-gold)' }}
        >
          Featured
        </span>
      </motion.div>

      {/* High performer glow */}
      {isHighPerformer && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
            borderRadius: '24px',
          }}
        />
      )}

      <div className="relative p-6">
        {/* Tool icon and name */}
        <div className="flex items-start gap-4 mb-4">
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3, ease: easingArrays.default }}
          >
            {tool.emoji || '🔧'}
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {tool.name}
            </h3>
            {tool.description && (
              <p
                className="text-sm mt-0.5 line-clamp-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {tool.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{
                color: isHighPerformer ? 'var(--life-gold)' : 'var(--text-primary)',
              }}
            >
              {formatNumber(tool.runs)}
            </span>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              runs
            </span>
          </div>

          <div
            className="w-px h-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          />

          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {tool.deployedSpaces}
            </span>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              space{tool.deployedSpaces !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileFeaturedToolCard;
