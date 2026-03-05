'use client';

/**
 * ProfileFeaturedToolCard - Pinnable featured tool showcase
 *
 * @version 2.0.0 - Stripped glass/shadows, no scale hover
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';

export interface FeaturedTool {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  runs: number;
  deployedSpaces: number;
  createdAt?: Date;
  shellFormat?: string;
}

function interactionUnit(count: number, shellFormat?: string): string {
  switch (shellFormat) {
    case 'poll': return count === 1 ? 'vote' : 'votes';
    case 'rsvp': return count === 1 ? 'RSVP' : 'RSVPs';
    case 'bracket': return count === 1 ? 'completion' : 'completions';
    default: return count === 1 ? 'use' : 'uses';
  }
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
  if (!tool) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border border-[var(--border-default)]',
          className
        )}
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="relative p-6 flex flex-col items-center justify-center min-h-[160px]">
          <span className="text-3xl mb-3">⭐</span>
          <p className="text-sm text-center mb-1" style={{ color: 'var(--text-secondary)' }}>
            Spotlight your best
          </p>
          <p className="text-xs text-center mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Feature a creation you&apos;re proud of
          </p>
          {isOwnProfile && (
            <button
              onClick={onSelectTool}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100"
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                color: 'var(--life-gold)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
              }}
            >
              Pick a creation
            </button>
          )}
        </div>
      </div>
    );
  }

  const isHighPerformer = tool.runs >= 100;

  return (
    <div
      className={cn(
        'relative overflow-hidden cursor-pointer rounded-3xl transition-opacity duration-100 hover:opacity-90',
        isHighPerformer
          ? 'border border-[rgba(255,215,0,0.3)]'
          : 'border border-[var(--border-default)]',
        className
      )}
      style={{ backgroundColor: 'var(--bg-surface)' }}
      onClick={() => onToolClick?.(tool.id)}
    >
      {/* Featured badge */}
      {(tool.runs > 0 || tool.deployedSpaces > 0) && (
        <div
          className="absolute top-4 right-4 px-2.5 py-1 rounded-full flex items-center gap-1.5"
          style={{
            backgroundColor: 'rgba(255, 215, 0, 0.15)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
          }}
        >
          <span className="text-xs">⭐</span>
          <span className="text-xs font-medium" style={{ color: 'var(--life-gold)' }}>
            Featured
          </span>
        </div>
      )}

      <div className="relative p-6">
        {/* Tool icon and name — no scale hover */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {tool.emoji || '🔧'}
          </div>

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
        {(tool.runs > 0 || tool.deployedSpaces > 0) && (
          <div className="flex items-center gap-4">
            {tool.runs > 0 && (
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
                  {interactionUnit(tool.runs, tool.shellFormat)}
                </span>
              </div>
            )}

            {tool.runs > 0 && tool.deployedSpaces > 0 && (
              <div className="w-px h-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            )}

            {tool.deployedSpaces > 0 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileFeaturedToolCard;
