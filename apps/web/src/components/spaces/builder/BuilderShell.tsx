'use client';

/**
 * BuilderShell - Shared layout for space creation flow
 *
 * VoidShell variant - focused, minimal nav
 * - Logo at top
 * - Progress indicator
 * - Back button when applicable
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogoMark, MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

// Step configuration
const STEPS = [
  { path: '/spaces/new', label: 'Template' },
  { path: '/spaces/new/identity', label: 'Identity' },
  { path: '/spaces/new/access', label: 'Access' },
  { path: '/spaces/new/launch', label: 'Launch' },
] as const;

export interface BuilderShellProps {
  children: React.ReactNode;
  /** Current step (0-indexed) */
  currentStep: number;
  /** Whether to show back button. Default: true for steps > 0 */
  showBack?: boolean;
  /** Optional title for the step */
  stepTitle?: string;
  /** Custom back URL (defaults to previous step) */
  backUrl?: string;
}

export function BuilderShell({
  children,
  currentStep,
  showBack,
  stepTitle,
  backUrl,
}: BuilderShellProps) {
  const router = useRouter();
  const showBackButton = showBack ?? currentStep > 0;

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else if (currentStep > 0) {
      router.push(STEPS[currentStep - 1].path);
    } else {
      router.push('/spaces');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-void)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 lg:px-12 lg:py-8">
        {/* Back / Logo */}
        <div className="flex items-center gap-4">
          {showBackButton ? (
            <motion.button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-white/50 hover:text-white/50 transition-colors"
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-body-sm">Back</span>
            </motion.button>
          ) : (
            <LogoMark className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Step Title */}
        {stepTitle && (
          <span className="text-label text-white/50 uppercase tracking-wider">
            {stepTitle}
          </span>
        )}

        {/* Progress */}
        <ProgressIndicator currentStep={currentStep} totalSteps={STEPS.length} />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 lg:px-12 pb-12">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        >
          {children}
        </motion.div>
      </main>

      {/* Subtle gradient overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 215, 0, 0.03) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}

// ============================================
// PROGRESS INDICATOR
// ============================================

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-300',
            i === currentStep
              ? 'w-6 bg-[var(--life-gold)]'
              : i < currentStep
                ? 'w-3 bg-white/50'
                : 'w-3 bg-white/[0.06]'
          )}
          initial={false}
          layout
        />
      ))}
    </div>
  );
}

// ============================================
// BUILDER ACTION BUTTON
// ============================================

export interface BuilderActionProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
  className?: string;
}

export function BuilderAction({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  type = 'button',
  className,
}: BuilderActionProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full h-12 rounded-lg font-medium text-body transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' &&
          'bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold-hover)]',
        variant === 'secondary' &&
          'bg-white/[0.06] text-white hover:bg-white/[0.06] border border-white/[0.06]',
        className
      )}
      whileHover={{ opacity: disabled ? 1 : 0.97 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4  rounded-full border border-2 border-current/20 border-t-current" />
          <span>Creating...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

// ============================================
// BUILDER HEADING
// ============================================

export interface BuilderHeadingProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

export function BuilderHeading({ title, subtitle, className }: BuilderHeadingProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <motion.h1
        className="text-heading-sm lg:text-heading font-semibold tracking-tight text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, delay: 0.1, ease: MOTION.ease.premium }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          className="text-body text-white/50"
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
