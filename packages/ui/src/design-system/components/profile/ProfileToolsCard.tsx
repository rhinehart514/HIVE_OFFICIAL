'use client';

/**
 * ProfileToolsCard - Premium display of user-built tools
 *
 * Design Philosophy:
 * - Apple: Card grid with hover animations
 * - HIVE: Gold accent for high-performing tools
 *
 * @version 5.0.0 - Apple widget aesthetic
 */

import * as React from 'react';
import { motion } from 'framer-motion';
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
      <ProfileCard icon="🛠️" title="Creations" className={className}>
        <div className="py-8 text-center">
          <p
            className="text-sm mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Start building
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Create something for your campus
          </p>
        </div>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard
      icon="🛠️"
      title="Creations"
      action={{ label: 'See all', onClick: onViewAll || (() => {}) }}
      className={className}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tools.slice(0, 4).map((tool, index) => {
          const isHighPerformer = tool.runs >= 100;
          const deployedCount = Array.isArray(tool.deployedSpaces)
            ? tool.deployedSpaces.length
            : tool.deployedSpaces;

          return (
            <motion.button
              key={tool.id}
              onClick={() => onToolClick?.(tool.id)}
              className="relative p-4 text-left overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: '16px',
                border: isHighPerformer
                  ? '1px solid rgba(255, 215, 0, 0.3)'
                  : '1px solid var(--border-default)',
                boxShadow: isHighPerformer
                  ? '0 0 20px rgba(255, 215, 0, 0.1)'
                  : undefined,
              }}
              whileHover={{
                opacity: 0.9,
              }}
              whileTap={{ opacity: 0.8 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {/* High performer glow */}
              {isHighPerformer && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 215, 0, 0.08) 0%, transparent 70%)',
                    borderRadius: '16px',
                  }}
                />
              )}

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
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <span
                    style={{
                      color: isHighPerformer ? 'var(--life-gold)' : 'var(--text-secondary)',
                    }}
                  >
                    {formatNumber(tool.runs)} runs
                  </span>
                  {' · '}
                  {deployedCount} space{deployedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </motion.button>
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
