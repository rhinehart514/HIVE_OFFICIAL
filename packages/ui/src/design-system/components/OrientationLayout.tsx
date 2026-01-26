"use client";

/**
 * OrientationLayout - Locked Layout Archetype
 *
 * For identity/navigation/decision surfaces: Profile, Space Hub, Settings
 *
 * Structure (exactly 3 blocks):
 * - Block 1: Identity/Context (who/what this is)
 * - Block 2: Navigation (where you can go)
 * - Block 3: Action (what you can do)
 *
 * Spatial Rules (LOCKED):
 * - max-w-3xl centered
 * - py-16 md:py-20 vertical breathing
 * - Block 1 → Block 2: mb-20
 * - Block 2 → Block 3: mb-16
 * - Navigation container: subtle surface (0.015 opacity)
 *
 * Typography Rules (LOCKED):
 * - Primary heading: text-heading-sm md:text-heading, -0.02em tracking
 * - Secondary: text-base, white/40
 * - Section labels: text-label-sm, uppercase, tracking-wider, white/40
 *
 * Motion Rules (LOCKED):
 * - Entrance only (fadeIn)
 * - No idle animation
 * - Staggered delays: 0, 0.08, 0.12, 0.16
 *
 * @version 1.0.0 - Extracted from Profile v22
 */

import * as React from 'react';
import { motion, type Variants, type Transition } from 'framer-motion';
import { EASE_PREMIUM as EASE } from '../layout-tokens';

// LOCKED: Stagger delays
const DELAYS = {
  identity: 0,
  action: 0.08,
  navigation: 0.12,
  extra: 0.16,
} as const;

// Entrance motion helper
export const fadeIn = (delay: number = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE } as Transition,
});

// ============================================================
// Layout Container
// ============================================================

interface OrientationLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function OrientationLayout({ children, className = '' }: OrientationLayoutProps) {
  return (
    <div className={`min-h-screen w-full overflow-y-auto ${className}`}>
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Identity Block (Block 1)
// ============================================================

interface IdentityBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function IdentityBlock({ children, className = '' }: IdentityBlockProps) {
  return (
    <motion.section
      className={`mb-20 ${className}`}
      {...fadeIn(DELAYS.identity)}
    >
      {children}
    </motion.section>
  );
}

// ============================================================
// Action Block (Block 2 - comes before Navigation visually)
// ============================================================

interface ActionBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionBlock({ children, className = '' }: ActionBlockProps) {
  return (
    <motion.section
      className={`mb-16 ${className}`}
      {...fadeIn(DELAYS.action)}
    >
      {children}
    </motion.section>
  );
}

// ============================================================
// Navigation Block (Block 3)
// ============================================================

interface NavigationBlockProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function NavigationBlock({ children, columns = 3, className = '' }: NavigationBlockProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[columns];

  return (
    <motion.section {...fadeIn(DELAYS.navigation)}>
      <div
        className={`grid gap-3 ${gridCols} p-4 -mx-4 rounded-2xl ${className}`}
        style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
      >
        {children}
      </div>
    </motion.section>
  );
}

// ============================================================
// Extra Section (optional, below Navigation)
// ============================================================

interface ExtraSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function ExtraSection({ children, className = '' }: ExtraSectionProps) {
  return (
    <motion.section
      className={`mt-12 ${className}`}
      {...fadeIn(DELAYS.extra)}
    >
      {children}
    </motion.section>
  );
}

// ============================================================
// Typography Primitives
// ============================================================

interface OrientationHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function OrientationHeading({ children, className = '' }: OrientationHeadingProps) {
  return (
    <h1
      className={`text-heading-sm md:text-heading font-semibold text-white mb-1 ${className}`}
      style={{ letterSpacing: '-0.02em' }}
    >
      {children}
    </h1>
  );
}

interface OrientationSubheadingProps {
  children: React.ReactNode;
  className?: string;
}

export function OrientationSubheading({ children, className = '' }: OrientationSubheadingProps) {
  return (
    <p className={`text-base text-white/40 mb-5 ${className}`}>
      {children}
    </p>
  );
}

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <span className={`text-label-sm font-medium uppercase tracking-wider text-white/40 block mb-3 ${className}`}>
      {children}
    </span>
  );
}

// ============================================================
// Navigation Card Header
// ============================================================

interface NavCardHeaderProps {
  label: string;
  className?: string;
}

export function NavCardHeader({ label, className = '' }: NavCardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-2.5 ${className}`}>
      <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
        {label}
      </span>
      <span className="text-white/30">→</span>
    </div>
  );
}

// ============================================================
// Avatar (Signature Treatment)
// ============================================================

interface OrientationAvatarProps {
  src?: string | null;
  alt: string;
  initials: string;
  size?: 'md' | 'lg';
  className?: string;
}

export function OrientationAvatar({
  src,
  alt,
  initials,
  size = 'lg',
  className = '',
}: OrientationAvatarProps) {
  const sizeClasses = {
    md: 'w-28 h-28 md:w-32 md:h-32',
    lg: 'w-36 h-36 md:w-44 md:h-44',
  }[size];

  const textSize = {
    md: 'text-3xl',
    lg: 'text-4xl',
  }[size];

  return (
    <div
      className={`${sizeClasses} rounded-2xl overflow-hidden ${className}`}
      style={{
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.06),
          0 24px 48px -12px rgba(0,0,0,0.5),
          inset 0 1px 1px rgba(255,255,255,0.04)
        `,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          <span className={`${textSize} font-semibold text-white/30`}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

interface EmptyStateProps {
  children: React.ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <span className="text-sm text-white/30">
      {children}
    </span>
  );
}

// ============================================================
// Exports
// ============================================================

export const Orientation = {
  Layout: OrientationLayout,
  Identity: IdentityBlock,
  Action: ActionBlock,
  Navigation: NavigationBlock,
  Extra: ExtraSection,
  Heading: OrientationHeading,
  Subheading: OrientationSubheading,
  SectionLabel: SectionLabel,
  NavCardHeader: NavCardHeader,
  Avatar: OrientationAvatar,
  Empty: EmptyState,
  fadeIn,
  DELAYS,
  EASE,
};

export default Orientation;
