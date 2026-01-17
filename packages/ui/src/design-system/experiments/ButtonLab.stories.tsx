'use client';

/**
 * Button Laboratory
 *
 * Comprehensive experiments for all Button independent variables.
 * Each story tests ONE variable in isolation.
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { cn } from '../../lib/utils';

const meta: Meta = {
  title: 'Experiments/Button Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// BASE BUTTON FOR EXPERIMENTS
// =============================================================================

const BaseButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className, style }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center',
      'font-medium text-sm',
      'bg-[var(--color-text-primary)]',
      'text-[var(--color-bg-page)]',
      'transition-opacity duration-200 ease-out',
      'hover:opacity-90 active:opacity-80',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
      className
    )}
    style={style}
  >
    {children}
  </button>
);

// =============================================================================
// EXPERIMENT 1: BORDER RADIUS (Shape)
// =============================================================================

/**
 * SHAPE: Border Radius
 *
 * Testing: 4px vs 8px vs 12px vs full (pill)
 * Question: What feels most premium and intentional?
 */
export const Shape_BorderRadius: Story = {
  name: '1. Shape: Border Radius',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Border Radius Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Which shape feels most HIVE? Premium, intentional, not generic.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { radius: '4px', label: 'Sharp', desc: 'Technical' },
          { radius: '8px', label: 'Rounded', desc: 'Current' },
          { radius: '12px', label: 'Soft', desc: 'Friendly' },
          { radius: '9999px', label: 'Pill', desc: 'iOS-style' },
        ].map(({ radius, label, desc }) => (
          <div key={radius} className="flex flex-col items-center gap-3">
            <BaseButton
              className="h-11 px-6"
              style={{ borderRadius: radius }}
            >
              Continue
            </BaseButton>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {label}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 2: HEIGHT (Size)
// =============================================================================

/**
 * SIZE: Button Heights
 *
 * Testing: 32px vs 36px vs 40px vs 44px vs 48px
 * Question: What's the right touch target? What feels balanced?
 */
export const Size_Height: Story = {
  name: '2. Size: Height',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Button Height Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Touch target vs visual balance. 44px is iOS minimum.
        </p>
      </div>

      <div className="flex gap-6 items-end">
        {[
          { height: 32, label: '32px', desc: 'Compact' },
          { height: 36, label: '36px', desc: 'Small' },
          { height: 40, label: '40px', desc: 'Medium' },
          { height: 44, label: '44px', desc: 'Default' },
          { height: 48, label: '48px', desc: 'Large' },
        ].map(({ height, label, desc }) => (
          <div key={height} className="flex flex-col items-center gap-3">
            <BaseButton
              className="px-6 rounded-lg"
              style={{ height: `${height}px` }}
            >
              Continue
            </BaseButton>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {label}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 3: PADDING (Horizontal Space)
// =============================================================================

/**
 * SIZE: Horizontal Padding
 *
 * Testing: 12px vs 16px vs 20px vs 24px vs 32px
 * Question: How much breathing room around text?
 */
export const Size_Padding: Story = {
  name: '3. Size: Horizontal Padding',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Horizontal Padding Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Breathing room. Tight vs airy.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { padding: 12, label: '12px' },
          { padding: 16, label: '16px' },
          { padding: 20, label: '20px' },
          { padding: 24, label: '24px' },
          { padding: 32, label: '32px' },
        ].map(({ padding, label }) => (
          <div key={padding} className="flex flex-col items-center gap-3">
            <BaseButton
              className="h-11 rounded-lg"
              style={{ paddingLeft: padding, paddingRight: padding }}
            >
              Continue
            </BaseButton>
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 4: FONT WEIGHT
// =============================================================================

/**
 * TYPOGRAPHY: Font Weight
 *
 * Testing: 400 vs 500 vs 600 vs 700
 * Question: What weight commands attention without being heavy?
 */
export const Typography_Weight: Story = {
  name: '4. Typography: Font Weight',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Font Weight Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Balance between readability and presence.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { weight: 400, label: 'Regular' },
          { weight: 500, label: 'Medium' },
          { weight: 600, label: 'Semibold' },
          { weight: 700, label: 'Bold' },
        ].map(({ weight, label }) => (
          <div key={weight} className="flex flex-col items-center gap-3">
            <BaseButton
              className="h-11 px-6 rounded-lg"
              style={{ fontWeight: weight }}
            >
              Continue
            </BaseButton>
            <div className="text-center">
              <p className="text-sm text-[var(--color-text-primary)]">{label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{weight}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 5: FONT SIZE
// =============================================================================

/**
 * TYPOGRAPHY: Font Size
 *
 * Testing: 12px vs 13px vs 14px vs 15px vs 16px
 * Question: What's readable and proportional to button height?
 */
export const Typography_Size: Story = {
  name: '5. Typography: Font Size',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Font Size Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Readability vs proportion to button height (44px).
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[12, 13, 14, 15, 16].map((size) => (
          <div key={size} className="flex flex-col items-center gap-3">
            <BaseButton
              className="h-11 px-6 rounded-lg"
              style={{ fontSize: `${size}px` }}
            >
              Continue
            </BaseButton>
            <p className="text-xs text-[var(--color-text-muted)]">{size}px</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 6: LETTER SPACING
// =============================================================================

/**
 * TYPOGRAPHY: Letter Spacing
 *
 * Testing: -0.02em vs 0 vs 0.02em vs 0.05em
 * Question: Tight or airy text?
 */
export const Typography_LetterSpacing: Story = {
  name: '6. Typography: Letter Spacing',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Letter Spacing Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Tight feels modern, wide feels formal.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { spacing: '-0.02em', label: 'Tight' },
          { spacing: '0', label: 'Normal' },
          { spacing: '0.02em', label: 'Slight' },
          { spacing: '0.05em', label: 'Wide' },
        ].map(({ spacing, label }) => (
          <div key={spacing} className="flex flex-col items-center gap-3">
            <BaseButton
              className="h-11 px-6 rounded-lg"
              style={{ letterSpacing: spacing }}
            >
              Continue
            </BaseButton>
            <div className="text-center">
              <p className="text-sm text-[var(--color-text-primary)]">{label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{spacing}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 7: SECONDARY BUTTON BORDER
// =============================================================================

/**
 * BORDER: Secondary Button Border Width & Opacity
 *
 * Testing border appearance for outlined buttons.
 */
export const Border_Secondary: Story = {
  name: '7. Border: Secondary Style',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Secondary Button Border
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Border weight and opacity for outlined style.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { width: 1, opacity: 0.1, label: '1px / 10%' },
          { width: 1, opacity: 0.2, label: '1px / 20%' },
          { width: 1, opacity: 0.3, label: '1px / 30%' },
          { width: 2, opacity: 0.1, label: '2px / 10%' },
          { width: 2, opacity: 0.2, label: '2px / 20%' },
        ].map(({ width, opacity, label }) => (
          <div key={label} className="flex flex-col items-center gap-3">
            <button
              className={cn(
                'inline-flex items-center justify-center',
                'h-11 px-6 rounded-lg',
                'font-medium text-sm',
                'bg-transparent',
                'text-[var(--color-text-primary)]',
                'transition-opacity duration-200 ease-out',
                'hover:opacity-90 active:opacity-80'
              )}
              style={{
                border: `${width}px solid rgba(255, 255, 255, ${opacity})`,
              }}
            >
              Cancel
            </button>
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 8: CTA GOLD TREATMENT
// =============================================================================

/**
 * CTA: Gold Button Variations
 *
 * Testing how gold CTA should look. Flat vs gradient vs glow.
 */
export const CTA_GoldTreatment: Story = {
  name: '8. CTA: Gold Treatment',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          CTA Gold Treatment
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          How should the gold CTA button feel? Earned moment.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {/* Flat Gold */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-accent-gold)]',
              'text-[var(--color-bg-page)]',
              'transition-opacity duration-200 ease-out',
              'hover:opacity-90 active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">Flat</p>
        </div>

        {/* Gradient Gold */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-gradient-to-r from-[#FFD700] to-[#FFC700]',
              'text-[var(--color-bg-page)]',
              'transition-opacity duration-200 ease-out',
              'hover:opacity-90 active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">Gradient</p>
        </div>

        {/* With subtle glow on hover */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-accent-gold)]',
              'text-[var(--color-bg-page)]',
              'transition-all duration-200 ease-out',
              'hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]',
              'active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">Hover Glow</p>
        </div>

        {/* With border ring */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-accent-gold)]',
              'text-[var(--color-bg-page)]',
              'ring-1 ring-[rgba(255,215,0,0.5)]',
              'transition-opacity duration-200 ease-out',
              'hover:opacity-90 active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">Ring</p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 9: LOADING STATE
// =============================================================================

/**
 * LOADING: Spinner Style
 *
 * Testing how loading state should appear.
 */
export const Loading_Spinner: Story = {
  name: '9. Loading: Spinner Style',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Loading Spinner Styles
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          How should loading feel? Subtle or prominent?
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {/* Simple ring spinner */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'relative inline-flex items-center justify-center',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-text-primary)]',
              'text-[var(--color-bg-page)]'
            )}
            disabled
          >
            <span className="opacity-0">Continue</span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            </span>
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">Ring</p>
        </div>

        {/* Dots */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'relative inline-flex items-center justify-center',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-text-primary)]',
              'text-[var(--color-bg-page)]'
            )}
            disabled
          >
            <span className="opacity-0">Continue</span>
            <span className="absolute inset-0 flex items-center justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">Dots</p>
        </div>

        {/* Text change */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-text-primary)]',
              'text-[var(--color-bg-page)]',
              'opacity-70'
            )}
            disabled
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            Loading...
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">With Text</p>
        </div>

        {/* Gold CTA loading with glow */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'relative inline-flex items-center justify-center',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-accent-gold)]',
              'text-[var(--color-bg-page)]',
              'animate-pulse'
            )}
            disabled
          >
            <span className="opacity-0">Enter HIVE</span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            </span>
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">CTA Pulse</p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// EXPERIMENT 10: ICON BUTTONS
// =============================================================================

/**
 * ICON: Icon Button Proportions
 *
 * Testing icon size relative to button size.
 */
export const Icon_Proportions: Story = {
  name: '10. Icon: Size Proportions',
  render: () => {
    const PlusIcon = ({ size = 16 }: { size?: number }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );

    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Icon Button Proportions
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md">
            Icon size relative to 44px square button.
          </p>
        </div>

        <div className="flex gap-6 items-center">
          {[14, 16, 18, 20, 24].map((size) => (
            <div key={size} className="flex flex-col items-center gap-3">
              <button
                className={cn(
                  'inline-flex items-center justify-center',
                  'h-11 w-11 rounded-lg',
                  'bg-[var(--color-text-primary)]',
                  'text-[var(--color-bg-page)]',
                  'transition-opacity duration-200 ease-out',
                  'hover:opacity-90 active:opacity-80'
                )}
              >
                <PlusIcon size={size} />
              </button>
              <p className="text-xs text-[var(--color-text-muted)]">{size}px</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// =============================================================================
// EXPERIMENT 11: BUTTON WITH ICON
// =============================================================================

/**
 * ICON: Text + Icon Spacing
 *
 * Testing gap between icon and text.
 */
export const Icon_WithText: Story = {
  name: '11. Icon: Text + Icon Gap',
  render: () => {
    const ArrowIcon = () => (
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    );

    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Icon + Text Gap
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md">
            Spacing between icon and text label.
          </p>
        </div>

        <div className="flex gap-6 items-center">
          {[4, 6, 8, 10, 12].map((gap) => (
            <div key={gap} className="flex flex-col items-center gap-3">
              <button
                className={cn(
                  'inline-flex items-center justify-center',
                  'h-11 px-6 rounded-lg',
                  'font-medium text-sm',
                  'bg-[var(--color-text-primary)]',
                  'text-[var(--color-bg-page)]',
                  'transition-opacity duration-200 ease-out',
                  'hover:opacity-90 active:opacity-80'
                )}
                style={{ gap: `${gap}px` }}
              >
                Continue
                <ArrowIcon />
              </button>
              <p className="text-xs text-[var(--color-text-muted)]">{gap}px</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// =============================================================================
// COMPREHENSIVE: All Variables at Once
// =============================================================================

/**
 * MATRIX: Current Button vs Variations
 *
 * See everything together to pick the right combination.
 */
export const Matrix_AllVariants: Story = {
  name: '12. Matrix: All Variants',
  render: () => (
    <div className="flex flex-col gap-8 p-8 max-w-4xl">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Button Variant Matrix
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          All button variants with current styling.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Default */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Default
          </p>
          <BaseButton className="h-11 px-6 rounded-lg w-full">
            Continue
          </BaseButton>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            CTA (Gold)
          </p>
          <button
            className={cn(
              'inline-flex items-center justify-center w-full',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-accent-gold)]',
              'text-[var(--color-bg-page)]',
              'transition-opacity duration-200 ease-out',
              'hover:opacity-90 active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
        </div>

        {/* Secondary */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Secondary
          </p>
          <button
            className={cn(
              'inline-flex items-center justify-center w-full',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-transparent',
              'border border-[var(--color-border)]',
              'text-[var(--color-text-primary)]',
              'transition-all duration-200 ease-out',
              'hover:bg-[var(--color-bg-elevated)]',
              'hover:border-[var(--color-text-muted)]'
            )}
          >
            Cancel
          </button>
        </div>

        {/* Ghost */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Ghost
          </p>
          <button
            className={cn(
              'inline-flex items-center justify-center w-full',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-transparent',
              'text-[var(--color-text-secondary)]',
              'transition-all duration-200 ease-out',
              'hover:bg-[var(--color-bg-elevated)]',
              'hover:text-[var(--color-text-primary)]'
            )}
          >
            Skip
          </button>
        </div>

        {/* Destructive */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Destructive
          </p>
          <button
            className={cn(
              'inline-flex items-center justify-center w-full',
              'h-11 px-6 rounded-lg',
              'font-medium text-sm',
              'bg-[var(--color-status-error)]',
              'text-white',
              'transition-opacity duration-200 ease-out',
              'hover:opacity-90 active:opacity-80'
            )}
          >
            Delete
          </button>
        </div>

        {/* Link */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Link
          </p>
          <button
            className={cn(
              'inline-flex items-center justify-center w-full',
              'font-medium text-sm',
              'bg-transparent',
              'text-[var(--color-text-secondary)]',
              'underline underline-offset-4',
              'transition-colors duration-200 ease-out',
              'hover:text-[var(--color-text-primary)]'
            )}
          >
            Learn more
          </button>
        </div>
      </div>
    </div>
  ),
};
