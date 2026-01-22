'use client';

/**
 * WelcomeShell - Shared layout for onboarding flow
 *
 * Apple Checkout-style vertical layout with:
 * - Logo at top
 * - Progress dots at bottom
 * - Skip always available but understated
 * - Clean, ceremonial feel
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogoMark } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { MOTION } from '@hive/ui/design-system/primitives';

// Step configuration
const STEPS = [
  { path: '/welcome', label: 'Welcome' },
  { path: '/welcome/identity', label: 'Identity' },
  { path: '/welcome/territory', label: 'Territory' },
  { path: '/welcome/claimed', label: 'Complete' },
] as const;

export interface WelcomeShellProps {
  children: React.ReactNode;
  /** Current step (0-indexed) */
  currentStep: number;
  /** Whether to show skip button. Default: true */
  showSkip?: boolean;
  /** Skip button label. Default: 'Skip to feed' */
  skipLabel?: string;
  /** Custom background. Default: void gradient */
  background?: 'void' | 'warm' | 'none';
}

export function WelcomeShell({
  children,
  currentStep,
  showSkip = true,
  skipLabel = 'Skip to feed',
  background = 'void',
}: WelcomeShellProps) {
  const router = useRouter();

  const handleSkip = () => {
    router.push('/feed');
  };

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col',
        background === 'void' && 'bg-[var(--bg-void)]',
        background === 'warm' && 'bg-[var(--bg-ground)]',
        background === 'none' && ''
      )}
    >
      {/* Header - Logo + Skip */}
      <header className="flex items-center justify-between px-6 py-6 lg:px-12 lg:py-8">
        <LogoMark className="w-8 h-8 text-white/80" />

        {showSkip && (
          <motion.button
            type="button"
            onClick={handleSkip}
            className="text-[12px] text-white/30 hover:text-white/50 transition-colors"
            whileHover={{ opacity: 0.6 }}
            whileTap={{ scale: 0.98 }}
          >
            {skipLabel}
          </motion.button>
        )}
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-6 lg:px-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer - Progress Dots */}
      <footer className="flex justify-center py-8">
        <ProgressDots currentStep={currentStep} totalSteps={STEPS.length} />
      </footer>

      {/* Subtle gradient overlay */}
      {background === 'void' && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 245, 235, 0.02) 0%, transparent 60%)',
          }}
        />
      )}
    </div>
  );
}

// ============================================
// PROGRESS DOTS
// ============================================

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'w-2 h-2 rounded-full transition-colors duration-300',
            i === currentStep
              ? 'bg-[var(--life-gold)]'
              : i < currentStep
                ? 'bg-white/40'
                : 'bg-white/10'
          )}
          initial={false}
          animate={{
            scale: i === currentStep ? 1.2 : 1,
          }}
          transition={{ duration: 0.2, ease: MOTION.ease.premium }}
        />
      ))}
    </div>
  );
}

// ============================================
// WELCOME ACTION BUTTON
// ============================================

export interface WelcomeActionProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function WelcomeAction({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  className,
}: WelcomeActionProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full h-12 rounded-xl font-medium text-[14px] transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' &&
          'bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold-hover)]',
        variant === 'secondary' &&
          'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10',
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

// ============================================
// WELCOME HEADING
// ============================================

export interface WelcomeHeadingProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

export function WelcomeHeading({ title, subtitle, className }: WelcomeHeadingProps) {
  return (
    <div className={cn('space-y-2 text-center', className)}>
      <motion.h1
        className="text-[32px] lg:text-[40px] font-semibold tracking-tight text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, delay: 0.1, ease: MOTION.ease.premium }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          className="text-[14px] text-white/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.2, ease: MOTION.ease.premium }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
