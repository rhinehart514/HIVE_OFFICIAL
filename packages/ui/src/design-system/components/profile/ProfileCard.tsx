'use client';

/**
 * ProfileBentoCard - Card wrapper for profile bento grid
 *
 * @version 6.0.0 - Stripped glass/shadows per design rules
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';

export interface ProfileBentoCardProps {
  /** Optional icon to display in header (emoji or icon element) */
  icon?: React.ReactNode;
  /** Card title */
  title?: string;
  /** Optional action button in header */
  action?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  className?: string;
  /** Card size variant for bento grid */
  size?: 'small' | 'medium' | 'large' | 'hero';
  /** Adds gold border for featured/active cards */
  featured?: boolean;
  /** Click handler for entire card */
  onClick?: () => void;
}

export function ProfileBentoCard({
  icon,
  title,
  action,
  children,
  className,
  size = 'medium',
  featured = false,
  onClick,
}: ProfileBentoCardProps) {
  const sizeStyles: Record<typeof size, string> = {
    small: 'p-4',
    medium: 'p-5',
    large: 'p-6',
    hero: 'p-6',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl transition-opacity duration-100',
        sizeStyles[size],
        featured ? 'border border-[rgba(255,215,0,0.3)]' : 'border border-[var(--border-default)]',
        onClick && 'cursor-pointer hover:opacity-90',
        className
      )}
      style={{ backgroundColor: 'var(--bg-surface)' }}
      onClick={onClick}
    >
      {/* Header */}
      {(icon || title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              >
                {icon}
              </div>
            )}
            {title && (
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                {title}
              </h3>
            )}
          </div>

          {action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors duration-100 hover:bg-white/[0.08]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}

      {/* Children */}
      {children}
    </div>
  );
}

export default ProfileBentoCard;

/**
 * @deprecated Use ProfileBentoCard instead
 */
export const ProfileCard = ProfileBentoCard;
export type ProfileCardProps = ProfileBentoCardProps;
