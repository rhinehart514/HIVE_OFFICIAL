'use client';

/**
 * ProfileBentoCard - Apple-style widget card for bento grid
 *
 * NOTE: Renamed from ProfileCard to avoid conflict with user display ProfileCard
 *
 * Design Philosophy:
 * - Apple: 24px corners like iOS widgets, depth layers, SF-style typography
 * - Visual hierarchy: Icon → Title → Content
 * - Subtle glass morphism with warm dark palette
 * - Premium hover states with gentle lift
 *
 * @version 5.0.0 - Apple widget aesthetic
 */

import * as React from 'react';
import { motion } from 'framer-motion';
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
  /** Adds gold edge glow for featured/active cards */
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
  const [isHovered, setIsHovered] = React.useState(false);

  // Size-based padding
  const sizeStyles: Record<typeof size, string> = {
    small: 'p-4',
    medium: 'p-5',
    large: 'p-6',
    hero: 'p-8',
  };

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        sizeStyles[size],
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '24px',
        border: '1px solid',
        borderColor: isHovered
          ? 'rgba(255, 255, 255, 0.15)'
          : 'var(--border-default)',
        boxShadow: featured
          ? `
            inset 0 0 0 1px rgba(255, 215, 0, 0.12),
            0 0 30px rgba(255, 215, 0, 0.08),
            0 4px 24px rgba(0, 0, 0, 0.25)
          `
          : isHovered
            ? `
              0 12px 40px rgba(0, 0, 0, 0.35),
              0 0 0 1px rgba(255, 255, 255, 0.1)
            `
            : `
              0 4px 20px rgba(0, 0, 0, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.05)
            `,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ opacity: 0.9 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.03) 0%,
              transparent 40%
            )
          `,
          borderRadius: '24px',
        }}
      />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        {(icon || title || action) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              {/* Icon */}
              {icon && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {icon}
                </div>
              )}
              {/* Title */}
              {title && (
                <h3
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {title}
                </h3>
              )}
            </div>

            {/* Action */}
            {action && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={{
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                }}
                whileHover={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {action.label}
              </motion.button>
            )}
          </div>
        )}

        {/* Children */}
        {children}
      </div>

      {/* Featured glow effect */}
      {featured && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 215, 0, 0.08) 0%, transparent 70%)',
            borderRadius: '24px',
          }}
        />
      )}
    </motion.div>
  );
}

export default ProfileBentoCard;

/**
 * @deprecated Use ProfileBentoCard instead
 */
export const ProfileCard = ProfileBentoCard;
export type ProfileCardProps = ProfileBentoCardProps;
