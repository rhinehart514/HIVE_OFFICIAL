'use client';

/**
 * Collapsible Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Simple show/hide toggle for content sections.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC COLLAPSIBLE (collapsed):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ▶  Show More Options                                         │
 * └────────────────────────────────────────────────────────────────┘
 *
 * BASIC COLLAPSIBLE (expanded):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ▼  Show More Options                                         │
 * │                                                                │
 * │  ┌──────────────────────────────────────────────────────────┐  │
 * │  │  Option A                                                │  │
 * │  │  Option B                                                │  │
 * │  │  Option C                                                │  │
 * │  └──────────────────────────────────────────────────────────┘  │
 * └────────────────────────────────────────────────────────────────┘
 *
 * COLLAPSIBLE VARIANTS:
 *
 * Default (with card wrapper):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ▶  Advanced Settings                                         │
 * └────────────────────────────────────────────────────────────────┘
 *   bg-elevated, rounded-xl, border
 *
 * Ghost (minimal):
 * ▶  Advanced Settings
 *   Just text + chevron, no background
 *
 * Inline (text style toggle):
 * Show advanced options ▶
 *   Underlined link-style text
 *
 * TRIGGER STYLES:
 *
 * With Chevron (default):
 * │  ▶  Click to expand                                           │
 *    Chevron rotates on expand
 *
 * With Plus/Minus:
 * │  [+]  Click to expand                                         │
 * │  [-]  Click to collapse                                       │
 *
 * Custom Trigger:
 * │  [ Show Details ]                                             │
 *    Button-style trigger
 *
 * CONTENT ANIMATION:
 * - Height animates from 0 to auto
 * - Opacity fades in
 * - Duration: 200ms ease-out
 *
 * STATES:
 * - Collapsed: Content hidden, chevron →
 * - Expanded: Content visible, chevron ↓
 * - Hover: Subtle highlight on trigger
 * - Focus: White focus ring
 * - Disabled: 50% opacity, no interaction
 *
 * COLORS:
 * - Trigger text: White
 * - Chevron: var(--color-text-muted)
 * - Content: var(--color-text-muted)
 * - Background: var(--color-bg-elevated) (default variant)
 * - Border: var(--color-border)
 *
 * USE CASES:
 * - Advanced settings toggle
 * - "Show more" content reveal
 * - Expandable sections in forms
 * - FAQ items (prefer Accordion for multiple)
 * - Nested content reveal
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const collapsibleTriggerVariants = cva(
  'flex items-center gap-2 text-sm font-medium text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
  {
    variants: {
      variant: {
        default: 'w-full justify-between p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:bg-white/5',
        ghost: 'hover:text-white/80',
        inline: 'text-blue-500 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CollapsibleProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> {
  /** Additional class names */
  className?: string;
}

/**
 * Collapsible - Root container
 */
const Collapsible = CollapsiblePrimitive.Root;

export interface CollapsibleTriggerProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>,
    VariantProps<typeof collapsibleTriggerVariants> {
  /** Icon type */
  iconType?: 'chevron' | 'plus-minus';
  /** Custom icon */
  icon?: React.ReactNode;
  /** Hide icon entirely */
  hideIcon?: boolean;
}

/**
 * CollapsibleTrigger - Toggle button
 */
const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProps
>(({ className, variant, iconType = 'chevron', icon, hideIcon, children, ...props }, ref) => {
  const ChevronIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );

  const PlusMinusIcon = (
    <span className="text-[var(--color-text-muted)] shrink-0 w-4 h-4 flex items-center justify-center text-lg font-light group-data-[state=open]:hidden">
      +
    </span>
  );

  const MinusIcon = (
    <span className="text-[var(--color-text-muted)] shrink-0 w-4 h-4 items-center justify-center text-lg font-light hidden group-data-[state=open]:flex">
      −
    </span>
  );

  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      className={cn(collapsibleTriggerVariants({ variant }), 'group', className)}
      {...props}
    >
      {!hideIcon && iconType === 'chevron' && !icon && ChevronIcon}
      {!hideIcon && iconType === 'plus-minus' && !icon && (
        <>
          {PlusMinusIcon}
          {MinusIcon}
        </>
      )}
      {!hideIcon && icon}
      <span className="flex-1 text-left">{children}</span>
      {variant === 'inline' && !hideIcon && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-90"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </CollapsiblePrimitive.Trigger>
  );
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export interface CollapsibleContentProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> {}

/**
 * CollapsibleContent - Expandable content area
 */
const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
    {...props}
  >
    <div className={cn('pt-2', className)}>{children}</div>
  </CollapsiblePrimitive.Content>
));
CollapsibleContent.displayName = 'CollapsibleContent';

/**
 * SimpleCollapsible - Pre-composed collapsible
 */
export interface SimpleCollapsibleProps extends VariantProps<typeof collapsibleTriggerVariants> {
  /** Trigger label */
  label: string;
  /** Content to show/hide */
  children: React.ReactNode;
  /** Default open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Change handler */
  onOpenChange?: (open: boolean) => void;
  /** Icon type */
  iconType?: 'chevron' | 'plus-minus';
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

const SimpleCollapsible = React.forwardRef<HTMLDivElement, SimpleCollapsibleProps>(
  (
    {
      label,
      children,
      defaultOpen = false,
      open,
      onOpenChange,
      variant,
      iconType = 'chevron',
      className,
      disabled,
    },
    ref
  ) => (
    <Collapsible
      ref={ref}
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      className={cn(disabled && 'opacity-50 cursor-not-allowed', className)}
    >
      <CollapsibleTrigger variant={variant} iconType={iconType} disabled={disabled}>
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
);
SimpleCollapsible.displayName = 'SimpleCollapsible';

/**
 * CollapsibleCard - Card-style collapsible
 */
export interface CollapsibleCardProps {
  /** Card title */
  title: string;
  /** Optional description */
  description?: string;
  /** Content to show/hide */
  children: React.ReactNode;
  /** Default open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Change handler */
  onOpenChange?: (open: boolean) => void;
  /** Icon before title */
  icon?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

const CollapsibleCard = React.forwardRef<HTMLDivElement, CollapsibleCardProps>(
  (
    {
      title,
      description,
      children,
      defaultOpen = false,
      open,
      onOpenChange,
      icon,
      className,
    },
    ref
  ) => (
    <Collapsible
      ref={ref}
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden',
        className
      )}
    >
      <CollapsiblePrimitive.Trigger className="group flex w-full items-center justify-between p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
          <div>
            <h3 className="text-sm font-medium text-white">{title}</h3>
            {description && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="px-4 pb-4 pt-0 border-t border-[var(--color-border)]">
          <div className="pt-4 text-sm text-[var(--color-text-muted)]">{children}</div>
        </div>
      </CollapsiblePrimitive.Content>
    </Collapsible>
  )
);
CollapsibleCard.displayName = 'CollapsibleCard';

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  SimpleCollapsible,
  CollapsibleCard,
  collapsibleTriggerVariants,
};
