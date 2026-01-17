'use client';

/**
 * Stepper Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Multi-step progress indicator for wizards and flows.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * HORIZONTAL STEPPER:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │   (1)─────────(2)─────────(3)─────────(4)                                   │
 * │   Step 1      Step 2      Step 3      Step 4                                │
 * │   Details     Profile     Review      Complete                              │
 * │    ✓          Active      ○           ○                                     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *       │           │
 *       │           └── Current step (gold ring, white text)
 *       └── Completed step (✓ checkmark, gold fill)
 *
 * STEP STATES:
 *
 * Completed:
 *   (✓)    Gold filled circle with white checkmark
 *   ═══    Connected line is gold
 *   Label  White text
 *
 * Current/Active:
 *   (2)    White ring, number inside
 *   ─ ─    Line to next is muted
 *   Label  White text (bold)
 *
 * Upcoming:
 *   (3)    Muted ring, muted number
 *   ─ ─    Line is muted
 *   Label  Muted text
 *
 * Error:
 *   (!)    Red ring with exclamation
 *   ═══    Line is red if from error
 *   Label  Red text
 *
 * VERTICAL STEPPER:
 * ┌───────────────────────────────────────────┐
 * │  (✓) Step 1: Account Details              │
 * │   │  Enter your email and password        │
 * │   │                                       │
 * │  (2) Step 2: Profile Information          │ ← Current
 * │   │  Tell us about yourself               │
 * │   │                                       │
 * │  (○) Step 3: Review                       │
 * │   │  Confirm your information             │
 * │   │                                       │
 * │  (○) Step 4: Complete                     │
 * │      You're all set!                      │
 * └───────────────────────────────────────────┘
 *
 * STEPPER VARIANTS:
 *
 * Default (circles with numbers):
 *   (1)──(2)──(3)──(4)
 *   Numbers inside circles
 *
 * Dots (simple dots):
 *   ●───●───○───○
 *   Just circles, no numbers
 *
 * Labels (with text below):
 *   (1)──(2)──(3)──(4)
 *   Step 1 Step 2 Step 3 Step 4
 *
 * Progress (bar style):
 *   [████████░░░░░░░░] 50%
 *   Progress bar with percentage
 *
 * SIZES:
 *
 * Small (sm):
 *   Step circles: 24px
 *   Line: 2px
 *   Text: text-xs
 *
 * Medium (md - default):
 *   Step circles: 32px
 *   Line: 2px
 *   Text: text-sm
 *
 * Large (lg):
 *   Step circles: 40px
 *   Line: 3px
 *   Text: text-base
 *
 * INTERACTIVE:
 * - Clickable completed steps (navigate back)
 * - Non-clickable upcoming steps
 * - Current step is highlighted
 *
 * COLORS:
 * - Completed: #FFD700 (gold) fill, white checkmark
 * - Current: White ring, white number
 * - Upcoming: var(--color-text-muted) ring and number
 * - Error: #FF6B6B ring and exclamation
 * - Connector (complete): #FFD700
 * - Connector (incomplete): var(--color-border)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const stepVariants = cva(
  'flex items-center justify-center rounded-full font-medium transition-colors',
  {
    variants: {
      size: {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
      },
      status: {
        completed: 'bg-[var(--life-gold)] text-black',
        current: 'border-2 border-white text-white',
        upcoming: 'border-2 border-[var(--border)] text-white/50',
        error: 'border-2 border-red-500 text-red-500',
      },
    },
    defaultVariants: {
      size: 'md',
      status: 'upcoming',
    },
  }
);

const connectorVariants = cva('transition-colors', {
  variants: {
    size: {
      sm: 'h-0.5',
      md: 'h-0.5',
      lg: 'h-1',
    },
    completed: {
      true: 'bg-[var(--life-gold)]',
      false: 'bg-[var(--border)]',
    },
    orientation: {
      horizontal: 'flex-1',
      vertical: 'w-0.5 min-h-8',
    },
  },
  defaultVariants: {
    size: 'md',
    completed: false,
    orientation: 'horizontal',
  },
});

export interface Step {
  /** Step label */
  label: string;
  /** Step description */
  description?: string;
  /** Step icon (replaces number) */
  icon?: React.ReactNode;
  /** Error state */
  error?: boolean;
  /** Optional custom content */
  content?: React.ReactNode;
}

export interface StepperProps extends VariantProps<typeof stepVariants> {
  /** Array of steps */
  steps: Step[];
  /** Current active step (0-indexed) */
  currentStep: number;
  /** Step change handler (for clickable completed steps) */
  onStepChange?: (step: number) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Show labels */
  showLabels?: boolean;
  /** Show descriptions */
  showDescriptions?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Stepper - Multi-step progress indicator
 */
const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      steps,
      currentStep,
      onStepChange,
      orientation = 'horizontal',
      showLabels = true,
      showDescriptions = false,
      size,
      className,
    },
    ref
  ) => {
    const getStepStatus = (index: number, step: Step): 'completed' | 'current' | 'upcoming' | 'error' => {
      if (step.error) return 'error';
      if (index < currentStep) return 'completed';
      if (index === currentStep) return 'current';
      return 'upcoming';
    };

    const handleStepClick = (index: number) => {
      if (index < currentStep && onStepChange) {
        onStepChange(index);
      }
    };

    const CheckIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );

    const ErrorIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    );

    if (orientation === 'vertical') {
      return (
        <div ref={ref} className={cn('flex flex-col', className)}>
          {steps.map((step, index) => {
            const status = getStepStatus(index, step);
            const isClickable = index < currentStep && onStepChange;

            return (
              <div key={index} className="flex">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={cn(
                      stepVariants({ size, status }),
                      isClickable && 'cursor-pointer hover:opacity-80',
                      !isClickable && 'cursor-default'
                    )}
                    aria-label={`Step ${index + 1}: ${step.label}`}
                    aria-current={status === 'current' ? 'step' : undefined}
                  >
                    {step.icon || (status === 'completed' ? CheckIcon : status === 'error' ? ErrorIcon : index + 1)}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        connectorVariants({ size, completed: index < currentStep, orientation: 'vertical' }),
                        'my-1'
                      )}
                    />
                  )}
                </div>
                {(showLabels || showDescriptions) && (
                  <div className="ml-4 pb-8">
                    {showLabels && (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          status === 'current' && 'text-white',
                          status === 'completed' && 'text-white',
                          status === 'upcoming' && 'text-white/50',
                          status === 'error' && 'text-red-500'
                        )}
                      >
                        {step.label}
                      </span>
                    )}
                    {showDescriptions && step.description && (
                      <p className="text-xs text-white/50 mt-0.5">{step.description}</p>
                    )}
                    {step.content && <div className="mt-2">{step.content}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('flex items-start', className)}>
        {steps.map((step, index) => {
          const status = getStepStatus(index, step);
          const isClickable = index < currentStep && onStepChange;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    stepVariants({ size, status }),
                    isClickable && 'cursor-pointer hover:opacity-80',
                    !isClickable && 'cursor-default'
                  )}
                  aria-label={`Step ${index + 1}: ${step.label}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {step.icon || (status === 'completed' ? CheckIcon : status === 'error' ? ErrorIcon : index + 1)}
                </button>
                {showLabels && (
                  <span
                    className={cn(
                      'mt-2 text-center',
                      size === 'sm' && 'text-xs',
                      size === 'md' && 'text-sm',
                      size === 'lg' && 'text-base',
                      status === 'current' && 'text-white font-medium',
                      status === 'completed' && 'text-white',
                      status === 'upcoming' && 'text-white/50',
                      status === 'error' && 'text-red-500'
                    )}
                  >
                    {step.label}
                  </span>
                )}
                {showDescriptions && step.description && (
                  <span className="text-xs text-white/50 mt-0.5 text-center max-w-24">
                    {step.description}
                  </span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    connectorVariants({ size, completed: index < currentStep, orientation: 'horizontal' }),
                    'mx-2 mt-4',
                    size === 'sm' && 'mt-3',
                    size === 'lg' && 'mt-5'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);
Stepper.displayName = 'Stepper';

/**
 * DotStepper - Simple dot-based stepper
 */
export interface DotStepperProps {
  /** Total number of steps */
  totalSteps: number;
  /** Current step (0-indexed) */
  currentStep: number;
  /** Step change handler */
  onStepChange?: (step: number) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

const DotStepper = React.forwardRef<HTMLDivElement, DotStepperProps>(
  ({ totalSteps, currentStep, onStepChange, size = 'md', className }, ref) => {
    const dotSizes = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
    };

    const gapSizes = {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
    };

    return (
      <div ref={ref} className={cn('flex items-center', gapSizes[size], className)} role="tablist">
        {Array.from({ length: totalSteps }, (_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep && onStepChange;

          return (
            <button
              key={index}
              type="button"
              onClick={() => isClickable && onStepChange?.(index)}
              disabled={!isClickable}
              className={cn(
                'rounded-full transition-all',
                dotSizes[size],
                isCompleted && 'bg-[var(--life-gold)]',
                isCurrent && 'bg-white',
                !isCompleted && !isCurrent && 'bg-[var(--border)]',
                isClickable && 'cursor-pointer hover:opacity-80',
                !isClickable && 'cursor-default'
              )}
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Step ${index + 1}`}
            />
          );
        })}
      </div>
    );
  }
);
DotStepper.displayName = 'DotStepper';

/**
 * ProgressStepper - Bar-style progress indicator
 */
export interface ProgressStepperProps {
  /** Current step (0-indexed) */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Show percentage */
  showPercentage?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

const ProgressStepper = React.forwardRef<HTMLDivElement, ProgressStepperProps>(
  ({ currentStep, totalSteps, showPercentage = false, size = 'md', className }, ref) => {
    const percentage = Math.round(((currentStep + 1) / totalSteps) * 100);

    const heightSizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    return (
      <div ref={ref} className={cn('flex items-center gap-3', className)}>
        <div className={cn('flex-1 rounded-full bg-[var(--border)] overflow-hidden', heightSizes[size])}>
          <div
            className={cn('h-full bg-[var(--life-gold)] transition-all duration-300 rounded-full')}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showPercentage && (
          <span className={cn('text-white font-medium', size === 'sm' && 'text-xs', size === 'md' && 'text-sm', size === 'lg' && 'text-base')}>
            {percentage}%
          </span>
        )}
      </div>
    );
  }
);
ProgressStepper.displayName = 'ProgressStepper';

export {
  Stepper,
  DotStepper,
  ProgressStepper,
  stepVariants,
  connectorVariants,
};
