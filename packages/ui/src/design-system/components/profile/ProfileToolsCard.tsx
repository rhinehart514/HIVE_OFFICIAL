'use client';

/**
 * ProfileToolsCard - Grid display of user-built tools
 *
 * @version 6.0.0 - Stripped glass/shadows/entrance animations
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';
import { ProfileCard } from './ProfileCard';

export interface ProfileTool {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  runs: number;
  deployedSpaces: number | string[];
  usageCount?: number;
  deployedToSpaces?: number | string[];
  shellFormat?: string;
}

function interactionLabel(count: number, shellFormat?: string, formatted?: string): string {
  const display = formatted ?? String(count);
  switch (shellFormat) {
    case 'poll': return `${display} vote${count !== 1 ? 's' : ''}`;
    case 'rsvp': return `${display} RSVP${count !== 1 ? 's' : ''}`;
    case 'bracket': return `${display} completion${count !== 1 ? 's' : ''}`;
    default: return `${display} interaction${count !== 1 ? 's' : ''}`;
  }
}

export interface ProfileToolsCardProps {
  tools: ProfileTool[];
  onToolClick?: (id: string) => void;
  onViewAll?: () => void;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export function ProfileToolsCard({
  tools,
  onToolClick,
  onViewAll,
  className,
}: ProfileToolsCardProps) {
  if (tools.length === 0) {
    return (
      <ProfileCard icon="⚡" title="Creations" className={className}>
        <div className="py-8 text-center">
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            Start building
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Create something for your campus
          </p>
        </div>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard
      icon="⚡"
      title="Creations"
      action={{ label: 'See all', onClick: onViewAll || (() => {}) }}
      className={className}
    >
      <div className="grid grid-cols-2 gap-3">
        {tools.slice(0, 4).map((tool) => {
          const isHighPerformer = tool.runs >= 100;
          const deployedCount = Array.isArray(tool.deployedSpaces)
            ? tool.deployedSpaces.length
            : tool.deployedSpaces;

          return (
            <button
              key={tool.id}
              onClick={() => onToolClick?.(tool.id)}
              className={cn(
                'relative p-4 text-left overflow-hidden rounded-2xl',
                'transition-opacity duration-100 hover:opacity-90',
                isHighPerformer
                  ? 'border border-[rgba(255,215,0,0.3)]'
                  : 'border border-[var(--border-default)]'
              )}
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <div className="relative">
                <span className="text-2xl block mb-3">
                  {tool.emoji || '🔧'}
                </span>
                <h4
                  className="text-sm font-semibold truncate mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {tool.name}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span
                    style={{
                      color: isHighPerformer ? 'var(--life-gold)' : 'var(--text-secondary)',
                    }}
                  >
                    {interactionLabel(tool.runs, tool.shellFormat, formatNumber(tool.runs))}
                  </span>
                  {' · '}
                  {deployedCount} space{deployedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {tools.length > 4 && (
        <p
          className="text-xs text-center mt-3"
          style={{ color: 'var(--text-tertiary)' }}
        >
          +{tools.length - 4} more
        </p>
      )}
    </ProfileCard>
  );
}

export default ProfileToolsCard;
