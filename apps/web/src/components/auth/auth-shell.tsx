'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { HiveLogo } from '@hive/ui';
import { WorldBackground } from '@/components/landing/world-background';

interface AuthShellProps {
  children: React.ReactNode;
  /** Show HIVE logo (default: true) */
  showLogo?: boolean;
  /** Logo position: 'center' for login, 'top-left' for consistency (default: 'center') */
  logoPosition?: 'center' | 'top-left';
  /** Show world background (fragments). Default: true */
  showWorldBackground?: boolean;
}

// Edge-to-edge theme - matches landing page
const AUTH_COLORS = {
  background: '#050505',  // Match landing page exactly
  surface: '#0A0A0A',     // Slightly elevated
  border: 'rgba(255, 255, 255, 0.08)',
  text: {
    primary: '#FFFFFF',
    secondary: '#A3A3A3',
    subtle: '#737373',
    disabled: '#525252',
  },
  gold: {
    base: '#FFD700',
    subtle: 'rgba(255, 215, 0, 0.08)',
  },
  error: '#EF4444',
};

/**
 * Edge-to-Edge Auth Shell
 *
 * Matches landing page and onboarding aesthetic:
 * - #030303 background (matches WindowLanding)
 * - World fragments in background (dimmed)
 * - No cards or containers
 * - Content floats directly on background
 * - Gold only on success states
 */
export function AuthShell({
  children,
  showLogo = true,
  logoPosition = 'center',
  showWorldBackground = true,
}: AuthShellProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        background: '#030303', // Match WindowLanding exactly
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
      {/* World background - shows fragments from landing, dimmed */}
      {showWorldBackground && !shouldReduceMotion && (
        <WorldBackground opacity={0.3} animated={true} fragmentCount={5} />
      )}

      {/* Subtle top gradient - matches landing */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.02) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Logo - top left (matches onboarding) */}
      {showLogo && logoPosition === 'top-left' && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={shouldReduceMotion ? {} : { duration: 0.5, delay: 0.2 }}
          className="fixed top-6 left-6 md:top-8 md:left-8 z-50"
        >
          <span className="text-[13px] font-medium tracking-[0.15em] text-white/30">
            HIVE
          </span>
        </motion.div>
      )}

      {/* Content container - above world background */}
      <div className="w-full max-w-sm relative z-20">
        {/* Logo - centered (for login) */}
        {showLogo && logoPosition === 'center' && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? {} : { duration: 0.5 }}
            className="flex justify-center mb-12"
          >
            <HiveLogo size="lg" variant="white" showText />
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
        background: AUTH_COLORS.background,
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
      {/* Subtle top gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.03) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Content container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Logo - centered */}
        <div className="flex justify-center mb-12">
          <HiveLogo size="lg" variant="white" showText />
        </div>

        {children}
      </div>
    </div>
  );
}
