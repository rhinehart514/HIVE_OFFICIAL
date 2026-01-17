'use client';

/**
 * ToggleGroup Primitive
 * LOCKED: January 11, 2026
 *
 * Decisions:
 * - Variant: Outline Contained (default)
 * - Selected: Glass highlight (bg-white/10)
 * - Hover: Glass hover (bg-white/[0.06])
 * - Gold variant: Gold TEXT only (text-[#FFD700]), not gold background
 * - Size: Default 36px (h-9)
 * - Focus: WHITE ring (ring-white/50)
 *
 * Single or multi-select button group for options.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SINGLE SELECT (Radio-like):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐                              │
 * │  │  Daily   │  │ ▓Weekly▓ │  │ Monthly  │                              │
 * │  └──────────┘  └──────────┘  └──────────┘                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 *        │              │              │
 *        │              │              └── Unselected: transparent bg, muted text
 *        │              └── Selected: elevated bg, white text
 *        └── Options are mutually exclusive
 *
 * MULTI SELECT (Checkbox-like):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
 * │  │ ▓ React ▓│  │   Vue    │  │▓ Svelte ▓│  │  Angular │                │
 * │  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *        │                            │
 *        └── Multiple can be selected └── Multiple selected
 *
 * VARIANTS:
 *
 * Outline (default):
 * ┌──────────┐  ┌──────────┐
 * │  Option  │  │▓Selected▓│
 * └──────────┘  └──────────┘
 * - Unselected: border only
 * - Selected: filled background
 *
 * Pills:
 * (  Option  ) (▓ Selected ▓)
 * - Pill-shaped with full rounding
 * - More compact appearance
 *
 * Cards:
 * ┌────────────────┐  ┌────────────────┐
 * │     Option     │  │ ▓▓ Selected ▓▓ │
 * │   Description  │  │   Description  │
 * └────────────────┘  └────────────────┘
 * - Larger with optional description
 *
 * WITH ICONS:
 * ┌──────────────┐  ┌──────────────┐
 * │  🌙  Dark    │  │ ▓☀️  Light ▓ │
 * └──────────────┘  └──────────────┘
 *
 * STATES:
 * - Unselected: transparent/border, muted text
 * - Selected: elevated bg, white text
 * - Hover: slight bg tint
 * - Disabled: 50% opacity
 * - Gold variant selected: Gold bg (#FFD700) - for CTAs
 *
 * SIZES:
 * - sm: h-8, text-xs
 * - default: h-10, text-sm
 * - lg: h-12, text-base
 *
 * COLORS:
 * - Selected bg: var(--color-bg-elevated)
 * - Selected text: white
 * - Unselected text: var(--color-text-muted)
 * - Gold selected: #FFD700 bg, black text (CTA variant)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const toggleGroupVariants = cva(
  'inline-flex items-center rounded-xl p-1 gap-1',
  {
    variants: {
      variant: {
        outline: 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
        pills: 'bg-transparent gap-2',
        cards: 'flex-wrap gap-3',
        ghost: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  }
);

const toggleItemVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all cursor-pointer',
  {
    variants: {
      variant: {
        outline: 'rounded-lg',
        pills: 'rounded-full border border-transparent',
        cards: 'rounded-xl border flex-col p-4 min-w-[120px]',
        ghost: 'rounded-lg',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        default: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
      selected: {
        true: '',
        false: '',
      },
      selectedVariant: {
        default: '',
        gold: '',
      },
    },
    compoundVariants: [
      // Default selected
      {
        selected: true,
        selectedVariant: 'default',
        className: 'bg-white/10 text-white',
      },
      // Gold selected (for CTAs) - LOCKED: Gold TEXT only, not gold background
      {
        selected: true,
        selectedVariant: 'gold',
        className: 'bg-white/10 text-[#FFD700]',
      },
      // Unselected - LOCKED: Glass hover (bg-white/[0.06])
      {
        selected: false,
        className: 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.06]',
      },
      // Pills unselected
      {
        variant: 'pills',
        selected: false,
        className: 'border-[var(--color-border)]',
      },
      // Pills selected
      {
        variant: 'pills',
        selected: true,
        selectedVariant: 'default',
        className: 'bg-white/10 text-white border-white/10',
      },
      // Cards
      {
        variant: 'cards',
        size: 'sm',
        className: 'h-auto px-3 py-2',
      },
      {
        variant: 'cards',
        size: 'default',
        className: 'h-auto px-4 py-3',
      },
      {
        variant: 'cards',
        size: 'lg',
        className: 'h-auto px-6 py-4',
      },
      {
        variant: 'cards',
        selected: false,
        className: 'border-[var(--color-border)]',
      },
      {
        variant: 'cards',
        selected: true,
        selectedVariant: 'default',
        className: 'border-white/20 bg-white/5',
      },
    ],
    defaultVariants: {
      variant: 'outline',
      size: 'default',
      selected: false,
      selectedVariant: 'default',
    },
  }
);

export interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface ToggleGroupProps extends VariantProps<typeof toggleGroupVariants> {
  /** Options to display */
  options: ToggleOption[];
  /** Selected value(s) */
  value: string | string[];
  /** Change handler */
  onChange: (value: string | string[]) => void;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Size of toggle items */
  size?: 'sm' | 'default' | 'lg';
  /** Selected variant (default or gold) */
  selectedVariant?: 'default' | 'gold';
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * ToggleGroup - Single or multi-select button group
 */
const ToggleGroup: React.FC<ToggleGroupProps> = ({
  options,
  value,
  onChange,
  multiple = false,
  variant = 'outline',
  size = 'default',
  selectedVariant = 'default',
  disabled = false,
  className,
}) => {
  const selectedValues = Array.isArray(value) ? value : [value];

  const handleSelect = (optionValue: string) => {
    if (disabled) return;

    if (multiple) {
      const newValue = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
    }
  };

  return (
    <div
      className={cn(
        toggleGroupVariants({ variant }),
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      role={multiple ? 'group' : 'radiogroup'}
    >
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={isSelected}
            onClick={() => handleSelect(option.value)}
            disabled={disabled || option.disabled}
            className={cn(
              toggleItemVariants({
                variant,
                size,
                selected: isSelected,
                selectedVariant,
              }),
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {option.icon}
            <span>{option.label}</span>
            {variant === 'cards' && option.description && (
              <Text size="xs" tone="muted" className="mt-1">
                {option.description}
              </Text>
            )}
          </button>
        );
      })}
    </div>
  );
};

ToggleGroup.displayName = 'ToggleGroup';

/**
 * ToggleButton - Standalone toggle button
 */
export interface ToggleButtonProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  variant?: 'default' | 'gold';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  className?: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  pressed,
  onPressedChange,
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={pressed}
    onClick={() => !disabled && onPressedChange(!pressed)}
    disabled={disabled}
    className={cn(
      toggleItemVariants({
        variant: 'outline',
        size,
        selected: pressed,
        selectedVariant: variant,
      }),
      'border border-[var(--color-border)]',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
  >
    {children}
  </button>
);

ToggleButton.displayName = 'ToggleButton';

export { ToggleGroup, ToggleButton, toggleGroupVariants, toggleItemVariants };
