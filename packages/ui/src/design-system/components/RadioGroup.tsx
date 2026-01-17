'use client';

/**
 * RadioGroup Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Single-select option group with radio buttons.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC RADIO:
 *
 * Unselected:
 * ┌───┐
 * │ ○ │   Empty circle, border only
 * └───┘
 *
 * Selected:
 * ┌───┐
 * │ ◉ │   Filled inner dot (gold)
 * └───┘
 *
 * Focus:
 * ┌───┐
 * │ ○ │   White focus ring (NOT gold)
 * └───┘
 *
 * Disabled:
 * ┌───┐
 * │ ○ │   50% opacity
 * └───┘
 *
 * RADIO WITH LABEL:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ○  Option Label                                               │
 * │      Description text here if provided                         │
 * └────────────────────────────────────────────────────────────────┘
 *
 * VERTICAL GROUP (Default):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ◉  Option One                                                 │
 * │      First option description                                  │
 * │                                                                │
 * │  ○  Option Two                                                 │
 * │      Second option description                                 │
 * │                                                                │
 * │  ○  Option Three                                               │
 * │      Third option description                                  │
 * └────────────────────────────────────────────────────────────────┘
 *
 * HORIZONTAL GROUP:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ◉ Option One    ○ Option Two    ○ Option Three                │
 * └────────────────────────────────────────────────────────────────┘
 *
 * CARD STYLE:
 * ┌────────────────────────────────────────────────────────────────┐
 * │ ┌──────────────────────────────────────┐                       │
 * │ │  ◉  Premium Plan                     │ ← Selected: gold border
 * │ │      Best for power users            │                       │
 * │ │      $29/month                       │                       │
 * │ └──────────────────────────────────────┘                       │
 * │                                                                │
 * │ ┌──────────────────────────────────────┐                       │
 * │ │  ○  Basic Plan                       │ ← Unselected: subtle border
 * │ │      For casual users                │                       │
 * │ │      Free                            │                       │
 * │ └──────────────────────────────────────┘                       │
 * └────────────────────────────────────────────────────────────────┘
 *
 * SIZES:
 *
 * Small (sm):
 * ○ Label   (14px circle)
 *
 * Default:
 * ○ Label   (16px circle)
 *
 * Large (lg):
 * ○ Label   (20px circle)
 *
 * STATES:
 * - Unselected: Border only, muted
 * - Selected: Inner dot (gold), border highlighted
 * - Hover: Slight background highlight
 * - Focus: White ring (NOT gold)
 * - Disabled: 50% opacity
 *
 * COLORS:
 * - Border: var(--color-border)
 * - Selected indicator: #FFD700 (gold)
 * - Focus ring: white/50
 * - Label: white
 * - Description: muted
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const radioGroupVariants = cva('grid gap-3', {
  variants: {
    orientation: {
      vertical: 'grid-cols-1',
      horizontal: 'grid-flow-col auto-cols-max gap-4',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

const radioSizes = {
  sm: 'h-3.5 w-3.5',
  default: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const indicatorSizes = {
  sm: 'h-1.5 w-1.5',
  default: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

// Use type alias to handle Radix's orientation prop conflict
export type RadioGroupProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  'orientation'
> &
  VariantProps<typeof radioGroupVariants>;

/**
 * RadioGroup - Container for radio options
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn(radioGroupVariants({ orientation }), className)}
    {...props}
  />
));
RadioGroup.displayName = 'RadioGroup';

/**
 * RadioGroupItem - Individual radio button
 */
export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, size = 'default', ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'aspect-square rounded-full border border-[var(--color-border)]',
      'ring-offset-background',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-life-gold',
      'transition-colors',
      radioSizes[size],
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <div className={cn('rounded-full bg-life-gold', indicatorSizes[size])} />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

/**
 * RadioOption - Radio with label and description
 */
export interface RadioOptionProps extends Omit<RadioGroupItemProps, 'children'> {
  /** Option label */
  label: string;
  /** Option description */
  description?: string;
}

const RadioOption = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioOptionProps
>(({ label, description, className, size = 'default', ...props }, ref) => (
  <label
    className={cn(
      'flex items-start gap-3 cursor-pointer',
      props.disabled && 'cursor-not-allowed opacity-50',
      className
    )}
  >
    <RadioGroupItem ref={ref} size={size} {...props} />
    <div className="flex-1 min-w-0">
      <Text size="sm" weight="medium" className="leading-none">
        {label}
      </Text>
      {description && (
        <Text size="xs" tone="muted" className="mt-1">
          {description}
        </Text>
      )}
    </div>
  </label>
));
RadioOption.displayName = 'RadioOption';

/**
 * RadioCard - Card-style radio option
 */
export interface RadioCardProps extends Omit<RadioGroupItemProps, 'children'> {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Extra content (price, badge, etc.) */
  extra?: React.ReactNode;
  /** Selected state (for styling, automatically set by RadioGroup) */
  selected?: boolean;
}

const RadioCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardProps
>(({ title, description, extra, className, size = 'default', ...props }, ref) => (
  <label
    className={cn(
      'relative flex items-start gap-3 p-4 rounded-xl cursor-pointer',
      'border border-[var(--color-border)] bg-ground',
      'transition-all hover:bg-surface-hover',
      'has-[[data-state=checked]]:border-life-gold has-[[data-state=checked]]:bg-life-gold/5',
      props.disabled && 'cursor-not-allowed opacity-50',
      className
    )}
  >
    <RadioGroupItem ref={ref} size={size} className="mt-0.5" {...props} />
    <div className="flex-1 min-w-0">
      <Text size="sm" weight="medium">
        {title}
      </Text>
      {description && (
        <Text size="xs" tone="muted" className="mt-1">
          {description}
        </Text>
      )}
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  </label>
));
RadioCard.displayName = 'RadioCard';

/**
 * SimpleRadioGroup - Convenience component with built-in options
 */
export interface SimpleRadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SimpleRadioGroupProps
  extends Omit<RadioGroupProps, 'children'> {
  /** Options to render */
  options: SimpleRadioOption[];
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Use card style */
  cardStyle?: boolean;
}

const SimpleRadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  SimpleRadioGroupProps
>(({ options, size = 'default', cardStyle = false, ...props }, ref) => (
  <RadioGroup ref={ref} {...props}>
    {options.map((option) =>
      cardStyle ? (
        <RadioCard
          key={option.value}
          value={option.value}
          title={option.label}
          description={option.description}
          disabled={option.disabled}
          size={size}
        />
      ) : (
        <RadioOption
          key={option.value}
          value={option.value}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
          size={size}
        />
      )
    )}
  </RadioGroup>
));
SimpleRadioGroup.displayName = 'SimpleRadioGroup';

export {
  RadioGroup,
  RadioGroupItem,
  RadioOption,
  RadioCard,
  SimpleRadioGroup,
  radioGroupVariants,
};
