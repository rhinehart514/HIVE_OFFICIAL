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

/**
 * Shared layout shell for auth pages (login, verify, expired)
 *
 * Dark background (#0A0A0A) with subtle breathing gold orb.
 * YC/SF aesthetic: minimal, restrained, intentional.
 */
export function AuthShell({ children, showLogo = true, logoPosition = 'center' }: AuthShellProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--hive-bg-base)' }}
      suppressHydrationWarning
    >
      {/* Ambient gold orb - breathing effect */}
      {!shouldReduceMotion && (
        <motion.div
          initial={{ opacity: 0.03 }}
          animate={{
            opacity: [0.03, 0.06, 0.03],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Static orb for reduced motion */}
      {shouldReduceMotion && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full pointer-events-none opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
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
          <HiveLogo size="sm" variant="default" showIcon={false} showText />
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
            <HiveLogo size="lg" variant="default" showText />
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
      style={{ backgroundColor: 'var(--hive-bg-base)' }}
      suppressHydrationWarning
    >
      {/* Static ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      {/* Content container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Logo - centered */}
        <div className="flex justify-center mb-12">
          <HiveLogo size="lg" variant="default" showText />
        </div>

        {children}
      </div>
    </div>
  );
}
