'use client';

/**
 * Button Refined - Round 2
 *
 * Base decisions:
 * - Shape: Pill
 * - CTA: Hover gradient
 * - Loading: Ring
 * - Icon: 16px
 * - Gap: 6px
 * - Direction: Apple-like
 *
 * Now testing micro-variations within these constraints.
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { cn } from '../../lib/utils';

const meta: Meta = {
  title: 'Experiments/Button Refined',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// BASE: Pill shape, 6px gap, 16px icons
// =============================================================================

const PillButton: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'cta' | 'secondary' | 'ghost';
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, variant = 'default', className, style }) => {
  const variants = {
    default: 'bg-white text-black hover:opacity-90 active:opacity-80',
    cta: 'bg-[#FFD700] text-black',
    secondary: 'bg-transparent border text-white',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center',
        'gap-1.5',           // 6px
        'rounded-full',      // Pill
        'font-medium text-sm tracking-tight',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        variants[variant],
        className
      )}
      style={style}
    >
      {children}
    </button>
  );
};

// =============================================================================
// 1. PILL RADIUS REFINEMENT
// =============================================================================

/**
 * Even with "pill" there are options:
 * - Full pill (9999px)
 * - Large radius that's almost pill (24px, 32px)
 */
export const Pill_RadiusVariations: Story = {
  name: '1. Pill Radius Variations',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Pill Radius Refinement</h2>
        <p className="text-sm text-white/50 max-w-md">
          Full pill vs large radius. Which feels more intentional?
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { radius: '16px', label: 'Large' },
          { radius: '24px', label: 'Very Large' },
          { radius: '32px', label: 'Almost Pill' },
          { radius: '9999px', label: 'Full Pill' },
        ].map(({ radius, label }) => (
          <div key={radius} className="flex flex-col items-center gap-3">
            <button
              className={cn(
                'inline-flex items-center justify-center',
                'h-11 px-5',
                'bg-white text-black',
                'font-medium text-sm tracking-tight',
                'transition-all duration-200 ease-out',
                'hover:opacity-90 active:opacity-80'
              )}
              style={{ borderRadius: radius }}
            >
              Continue
            </button>
            <p className="text-xs text-white/50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// 2. CTA GRADIENT VARIATIONS
// =============================================================================

/**
 * Subtle gradient hover - testing different gradients.
 */
export const CTA_GradientVariations: Story = {
  name: '2. CTA Gradient Options',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">CTA Gradient Hover</h2>
        <p className="text-sm text-white/50 max-w-md">
          Hover each to see the gradient. Which is most subtle/premium?
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {/* Flat to slightly lighter */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-5 rounded-full',
              'bg-[#FFD700] text-black',
              'font-medium text-sm tracking-tight',
              'transition-all duration-200 ease-out',
              'hover:bg-[#FFE033]',
              'active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-white/50">Lighter on hover</p>
        </div>

        {/* Gradient right */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-5 rounded-full',
              'bg-[#FFD700] text-black',
              'font-medium text-sm tracking-tight',
              'transition-all duration-300 ease-out',
              'hover:bg-gradient-to-r hover:from-[#FFD700] hover:to-[#FFE55C]',
              'active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-white/50">Gradient right</p>
        </div>

        {/* Gradient bottom */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-5 rounded-full',
              'bg-[#FFD700] text-black',
              'font-medium text-sm tracking-tight',
              'transition-all duration-300 ease-out',
              'hover:bg-gradient-to-b hover:from-[#FFE033] hover:to-[#FFD700]',
              'active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-white/50">Gradient bottom</p>
        </div>

        {/* Radial glow */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-5 rounded-full',
              'bg-[#FFD700] text-black',
              'font-medium text-sm tracking-tight',
              'transition-all duration-300 ease-out',
              'hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]',
              'active:opacity-80'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-white/50">Inner glow</p>
        </div>

        {/* Subtle brightness */}
        <div className="flex flex-col items-center gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-11 px-5 rounded-full',
              'bg-[#FFD700] text-black',
              'font-medium text-sm tracking-tight',
              'transition-all duration-200 ease-out',
              'hover:brightness-110',
              'active:brightness-95'
            )}
          >
            Enter HIVE
          </button>
          <p className="text-xs text-white/50">Brightness</p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// 3. HEIGHT REFINEMENT
// =============================================================================

/**
 * Apple uses different heights. Testing around 44px.
 */
export const Height_Refinement: Story = {
  name: '3. Height Refinement',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Height Options</h2>
        <p className="text-sm text-white/50 max-w-md">
          Testing heights around 44px. Which feels most balanced?
        </p>
      </div>

      <div className="flex gap-6 items-end">
        {[40, 42, 44, 46, 48].map((height) => (
          <div key={height} className="flex flex-col items-center gap-3">
            <button
              className={cn(
                'inline-flex items-center justify-center',
                'px-5 rounded-full',
                'bg-white text-black',
                'font-medium text-sm tracking-tight',
                'transition-all duration-200 ease-out',
                'hover:opacity-90 active:opacity-80'
              )}
              style={{ height: `${height}px` }}
            >
              Continue
            </button>
            <p className="text-xs text-white/50">{height}px</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// 4. PADDING REFINEMENT
// =============================================================================

/**
 * Horizontal padding options.
 */
export const Padding_Refinement: Story = {
  name: '4. Padding Refinement',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Padding Options</h2>
        <p className="text-sm text-white/50 max-w-md">
          Horizontal breathing room. Apple tends generous.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[16, 20, 24, 28, 32].map((padding) => (
          <div key={padding} className="flex flex-col items-center gap-3">
            <button
              className={cn(
                'inline-flex items-center justify-center',
                'h-11 rounded-full',
                'bg-white text-black',
                'font-medium text-sm tracking-tight',
                'transition-all duration-200 ease-out',
                'hover:opacity-90 active:opacity-80'
              )}
              style={{ paddingLeft: padding, paddingRight: padding }}
            >
              Continue
            </button>
            <p className="text-xs text-white/50">{padding}px</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// 5. SECONDARY BORDER REFINEMENT
// =============================================================================

/**
 * Secondary button border options.
 */
export const Secondary_BorderOptions: Story = {
  name: '5. Secondary Border',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Secondary Border</h2>
        <p className="text-sm text-white/50 max-w-md">
          Border opacity for outlined button. Apple is very subtle.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { opacity: 0.1, label: '10%' },
          { opacity: 0.15, label: '15%' },
          { opacity: 0.2, label: '20%' },
          { opacity: 0.25, label: '25%' },
          { opacity: 0.3, label: '30%' },
        ].map(({ opacity, label }) => (
          <div key={label} className="flex flex-col items-center gap-3">
            <button
              className={cn(
                'inline-flex items-center justify-center',
                'h-11 px-5 rounded-full',
                'bg-transparent text-white',
                'font-medium text-sm tracking-tight',
                'transition-all duration-200 ease-out',
                'hover:bg-white/5'
              )}
              style={{ border: `1px solid rgba(255, 255, 255, ${opacity})` }}
            >
              Cancel
            </button>
            <p className="text-xs text-white/50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// 6. FONT WEIGHT OPTIONS
// =============================================================================

export const Typography_Weight: Story = {
  name: '6. Font Weight',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Font Weight</h2>
        <p className="text-sm text-white/50 max-w-md">
          Apple uses 500-600. Testing in pill context.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { weight: 400, label: 'Regular' },
          { weight: 500, label: 'Medium' },
          { weight: 600, label: 'Semibold' },
        ].map(({ weight, label }) => (
          <div key={weight} className="flex flex-col items-center gap-3">
            <button
              className={cn(
                'inline-flex items-center justify-center',
                'h-11 px-5 rounded-full',
                'bg-white text-black',
                'text-sm tracking-tight',
                'transition-all duration-200 ease-out',
                'hover:opacity-90 active:opacity-80'
              )}
              style={{ fontWeight: weight }}
            >
              Continue
            </button>
            <p className="text-xs text-white/50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// 7. LETTER SPACING OPTIONS
// =============================================================================

export const Typography_Spacing: Story = {
  name: '7. Letter Spacing',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Letter Spacing</h2>
        <p className="text-sm text-white/50 max-w-md">
          Tight feels modern. Testing in pill.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[
          { spacing: '-0.02em', label: 'Tight' },
          { spacing: '-0.01em', label: 'Slightly Tight' },
          { spacing: '0', label: 'Normal' },
          { spacing: '0.01em', label: 'Slightly Wide' },
        ].map(({ spacing, label }) => (
          <div key={spacing} className="flex flex-col items-center gap-3">
            <button
              className={cn(
                'inline-flex items-center justify-center',
                'h-11 px-5 rounded-full',
                'bg-white text-black',
                'font-medium text-sm',
                'transition-all duration-200 ease-out',
                'hover:opacity-90 active:opacity-80'
              )}
              style={{ letterSpacing: spacing }}
            >
              Continue
            </button>
            <p className="text-xs text-white/50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// 8. HOVER OPACITY LEVELS
// =============================================================================

export const Hover_OpacityLevels: Story = {
  name: '8. Hover Opacity',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Hover Opacity</h2>
        <p className="text-sm text-white/50 max-w-md">
          How much opacity change on hover? Subtle vs noticeable.
        </p>
      </div>

      <div className="flex gap-6 items-center">
        {[95, 92, 90, 85, 80].map((opacity) => (
          <div key={opacity} className="flex flex-col items-center gap-3">
            <button
              className={cn(
                'inline-flex items-center justify-center',
                'h-11 px-5 rounded-full',
                'bg-white text-black',
                'font-medium text-sm tracking-tight',
                'transition-all duration-200 ease-out',
                'active:opacity-70'
              )}
              style={
                {
                  '--hover-opacity': opacity / 100,
                } as React.CSSProperties
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = String(opacity / 100);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Continue
            </button>
            <p className="text-xs text-white/50">{opacity}%</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// 9. ALL VARIANTS TOGETHER
// =============================================================================

export const AllVariants_Refined: Story = {
  name: '9. All Variants (Refined)',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">All Variants</h2>
        <p className="text-sm text-white/50 max-w-md">
          Current refined look with pill shape.
        </p>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        {/* Default */}
        <button
          className={cn(
            'inline-flex items-center justify-center',
            'h-11 px-5 rounded-full',
            'bg-white text-black',
            'font-medium text-sm tracking-tight',
            'transition-all duration-200 ease-out',
            'hover:opacity-90 active:opacity-80'
          )}
        >
          Continue
        </button>

        {/* CTA */}
        <button
          className={cn(
            'inline-flex items-center justify-center',
            'h-11 px-5 rounded-full',
            'bg-[#FFD700] text-black',
            'font-medium text-sm tracking-tight',
            'transition-all duration-200 ease-out',
            'hover:brightness-110 active:brightness-95'
          )}
        >
          Enter HIVE
        </button>

        {/* Secondary */}
        <button
          className={cn(
            'inline-flex items-center justify-center',
            'h-11 px-5 rounded-full',
            'bg-transparent border border-white/15 text-white',
            'font-medium text-sm tracking-tight',
            'transition-all duration-200 ease-out',
            'hover:bg-white/5 hover:border-white/25'
          )}
        >
          Cancel
        </button>

        {/* Ghost */}
        <button
          className={cn(
            'inline-flex items-center justify-center',
            'h-11 px-5 rounded-full',
            'bg-transparent text-white/70',
            'font-medium text-sm tracking-tight',
            'transition-all duration-200 ease-out',
            'hover:text-white hover:bg-white/5'
          )}
        >
          Skip
        </button>

        {/* Destructive */}
        <button
          className={cn(
            'inline-flex items-center justify-center',
            'h-11 px-5 rounded-full',
            'bg-red-500 text-white',
            'font-medium text-sm tracking-tight',
            'transition-all duration-200 ease-out',
            'hover:opacity-90 active:opacity-80'
          )}
        >
          Delete
        </button>
      </div>
    </div>
  ),
};

// =============================================================================
// 10. IN CONTEXT
// =============================================================================

export const InContext_Modal: Story = {
  name: '10. In Context: Modal',
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">In Context</h2>
        <p className="text-sm text-white/50 max-w-md">
          How do these feel in a real modal?
        </p>
      </div>

      {/* Modal mockup */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Join Space</h3>
        <p className="text-sm text-white/60 mb-6">
          You're about to join Developer Community. You'll have access to all channels and resources.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-10 px-4 rounded-full',
              'bg-transparent border border-white/15 text-white',
              'font-medium text-sm tracking-tight',
              'transition-all duration-200 ease-out',
              'hover:bg-white/5 hover:border-white/25'
            )}
          >
            Cancel
          </button>
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-10 px-4 rounded-full',
              'bg-[#FFD700] text-black',
              'font-medium text-sm tracking-tight',
              'transition-all duration-200 ease-out',
              'hover:brightness-110 active:brightness-95'
            )}
          >
            Join Space
          </button>
        </div>
      </div>
    </div>
  ),
};
