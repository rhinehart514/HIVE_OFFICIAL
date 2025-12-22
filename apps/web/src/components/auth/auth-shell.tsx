'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { HiveLogo } from '@hive/ui';

interface AuthShellProps {
  children: React.ReactNode;
  /** Show HIVE logo (default: true) */
  showLogo?: boolean;
  /** Logo position: 'center' for login, 'top-right' for onboarding (default: 'center') */
  logoPosition?: 'center' | 'top-right';
}

// Light theme colors for auth pages
const AUTH_COLORS = {
  background: '#FAFAFA',  // Soft white
  surface: '#FFFFFF',     // Pure white
  border: '#E5E5E5',      // Light gray border
  text: {
    primary: '#0A0A0A',   // Near black
    secondary: '#404040', // Dark gray
    subtle: '#737373',    // Medium gray
    disabled: '#A3A3A3',  // Light gray
  },
  gold: {
    base: '#D4A012',      // Rich gold (darker for light bg)
    subtle: 'rgba(212, 160, 18, 0.08)',
  },
  error: '#DC2626',
};

/**
 * Shared layout shell for auth pages (login, verify, expired)
 *
 * Bright, clean aesthetic with subtle gold accents.
 * YC/SF aesthetic: minimal, inviting, premium.
 */
export function AuthShell({ children, showLogo = true, logoPosition = 'center' }: AuthShellProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        backgroundColor: AUTH_COLORS.background,
        // Override CSS variables for light theme
        '--hive-bg-base': AUTH_COLORS.background,
        '--hive-bg-surface': AUTH_COLORS.surface,
        '--hive-text-primary': AUTH_COLORS.text.primary,
        '--hive-text-secondary': AUTH_COLORS.text.secondary,
        '--hive-text-subtle': AUTH_COLORS.text.subtle,
        '--hive-text-disabled': AUTH_COLORS.text.disabled,
        '--hive-border-default': AUTH_COLORS.border,
        '--hive-gold': AUTH_COLORS.gold.base,
        '--hive-gold-subtle': AUTH_COLORS.gold.subtle,
        '--hive-status-error': AUTH_COLORS.error,
      } as React.CSSProperties}
      suppressHydrationWarning
    >
      {/* Ambient gold orb - breathing effect (softer on light bg) */}
      {!shouldReduceMotion && (
        <motion.div
          initial={{ opacity: 0.15 }}
          animate={{
            opacity: [0.15, 0.25, 0.15],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(212, 160, 18, 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Static orb for reduced motion */}
      {shouldReduceMotion && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full pointer-events-none opacity-[0.12]"
          style={{
            background: 'radial-gradient(circle, rgba(212, 160, 18, 0.2) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Logo - top right (for consistency with onboarding) */}
      {showLogo && logoPosition === 'top-right' && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? {} : { duration: 0.5, delay: 0.2 }}
          className="fixed top-4 right-4 md:top-6 md:right-6 z-50"
        >
          <HiveLogo size="sm" variant="dark" showIcon={false} showText />
        </motion.div>
      )}

      {/* Content container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Logo - centered (for login) */}
        {showLogo && logoPosition === 'center' && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? {} : { duration: 0.5 }}
            className="flex justify-center mb-12"
          >
            <HiveLogo size="lg" variant="dark" showText />
          </motion.div>
        )}

        {children}
      </div>
    </div>
  );
}

/**
 * Static fallback shell (no animations, for Suspense)
 */
export function AuthShellStatic({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        backgroundColor: AUTH_COLORS.background,
        '--hive-bg-base': AUTH_COLORS.background,
        '--hive-bg-surface': AUTH_COLORS.surface,
        '--hive-text-primary': AUTH_COLORS.text.primary,
        '--hive-text-secondary': AUTH_COLORS.text.secondary,
        '--hive-text-subtle': AUTH_COLORS.text.subtle,
        '--hive-text-disabled': AUTH_COLORS.text.disabled,
        '--hive-border-default': AUTH_COLORS.border,
        '--hive-gold': AUTH_COLORS.gold.base,
        '--hive-gold-subtle': AUTH_COLORS.gold.subtle,
        '--hive-status-error': AUTH_COLORS.error,
      } as React.CSSProperties}
      suppressHydrationWarning
    >
      {/* Static ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, rgba(212, 160, 18, 0.2) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
        aria-hidden="true"
      />

      {/* Content container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Logo - centered */}
        <div className="flex justify-center mb-12">
          <HiveLogo size="lg" variant="dark" showText />
        </div>

        {children}
      </div>
    </div>
  );
}
