'use client';

/**
 * Accordion Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Header hover: Glass highlight (bg-white/[0.08])
 * - Chevron: 180° rotation, 300ms ease-smooth
 * - Content: 300ms height transition (animate-accordion-down/up)
 * - Focus: WHITE ring (ring-white/50)
 *
 * Vertically stacked expandable sections.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC ACCORDION (collapsed):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Section One                                              ▼    │
 * ├────────────────────────────────────────────────────────────────┤
 * │  Section Two                                              ▼    │
 * ├────────────────────────────────────────────────────────────────┤
 * │  Section Three                                            ▼    │
 * └────────────────────────────────────────────────────────────────┘
 *
 * ACCORDION (one expanded):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Section One                                              ▲    │
 * │  ──────────────────────────────────────────────────────────    │
 * │  This is the content of section one. It can contain any        │
 * │  elements including text, lists, images, or other components.  │
 * │                                                                │
 * ├────────────────────────────────────────────────────────────────┤
 * │  Section Two                                              ▼    │
 * ├────────────────────────────────────────────────────────────────┤
 * │  Section Three                                            ▼    │
 * └────────────────────────────────────────────────────────────────┘
 *
 * ACCORDION VARIANTS:
 *
 * Default (separated items):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Section One                                              ▼    │
 * └────────────────────────────────────────────────────────────────┘
 *                            (8px gap)
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Section Two                                              ▼    │
 * └────────────────────────────────────────────────────────────────┘
 *
 * Bordered (connected items):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Section One                                              ▼    │
 * ├────────────────────────────────────────────────────────────────┤
 * │  Section Two                                              ▼    │
 * ├────────────────────────────────────────────────────────────────┤
 * │  Section Three                                            ▼    │
 * └────────────────────────────────────────────────────────────────┘
 *
 * Ghost (minimal styling):
 *   Section One                                               ▼
 *   ────────────────────────────────────────────────────────────
 *   Section Two                                               ▼
 *   ────────────────────────────────────────────────────────────
 *   Section Three                                             ▼
 *
 * WITH ICON:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  📝  Section with Icon                                    ▼    │
 * └────────────────────────────────────────────────────────────────┘
 *
 * MULTIPLE EXPANDED:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Section One                                              ▲    │
 * │  ──────────────────────────────────────────────────────────    │
 * │  Content for section one...                                    │
 * └────────────────────────────────────────────────────────────────┘
 *                            (8px gap)
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Section Two                                              ▲    │
 * │  ──────────────────────────────────────────────────────────    │
 * │  Content for section two...                                    │
 * └────────────────────────────────────────────────────────────────┘
 *
 * STATES:
 * - Collapsed: Chevron pointing down (▼)
 * - Expanded: Chevron pointing up (▲), content visible below trigger
 * - Hover: Subtle background highlight on trigger
 * - Focus: White focus ring (never gold)
 * - Disabled: Reduced opacity (50%), no interaction
 *
 * COLORS:
 * - Background: var(--color-bg-elevated) or transparent (ghost)
 * - Border: var(--color-border)
 * - Text: White (title), var(--color-text-muted) (content)
 * - Chevron: var(--color-text-muted)
 *
 * ANIMATION:
 * - Height transition: 200ms ease-out
 * - Chevron rotation: 200ms ease-out
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const accordionVariants = cva('', {
  variants: {
    variant: {
      default: 'space-y-2',
      bordered: 'border border-[var(--color-border)] rounded-xl overflow-hidden divide-y divide-[var(--color-border)]',
      ghost: 'divide-y divide-[var(--color-border)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const accordionItemVariants = cva(
  'overflow-hidden',
  {
    variants: {
      variant: {
        default: 'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]',
        bordered: 'bg-[var(--color-bg-elevated)]',
        ghost: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const accordionTriggerVariants = cva(
  'flex flex-1 items-center justify-between py-4 text-sm font-medium text-white transition-colors duration-150',
  {
    variants: {
      variant: {
        // LOCKED: Glass highlight hover (bg-white/[0.08])
        default: 'px-4 hover:bg-white/[0.08]',
        bordered: 'px-4 hover:bg-white/[0.08]',
        ghost: 'hover:text-white/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Use type alias instead of interface to handle Radix discriminated union
export type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> &
  VariantProps<typeof accordionVariants>;

/**
 * Accordion - Container for expandable items
 */
const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(({ className, variant, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn(accordionVariants({ variant }), className)}
    {...props}
  />
));
Accordion.displayName = 'Accordion';

export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    VariantProps<typeof accordionItemVariants> {}

/**
 * AccordionItem - Individual expandable item
 */
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(accordionItemVariants({ variant }), className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    VariantProps<typeof accordionTriggerVariants> {
  /** Icon to display before title */
  icon?: React.ReactNode;
}

/**
 * AccordionTrigger - Clickable header
 */
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, variant, icon, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        accordionTriggerVariants({ variant }),
        'group w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0',
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">
        {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
        {children}
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {}

/**
 * AccordionContent - Expandable content area
 */
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm text-[var(--color-text-muted)] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('px-4 pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

/**
 * SimpleAccordion - Pre-composed accordion with items prop
 */
export interface SimpleAccordionItem {
  value: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SimpleAccordionProps extends VariantProps<typeof accordionVariants> {
  /** Accordion items */
  items: SimpleAccordionItem[];
  /** Allow multiple items to be expanded */
  multiple?: boolean;
  /** Default expanded item(s) */
  defaultValue?: string | string[];
  /** Controlled value */
  value?: string | string[];
  /** Change handler */
  onValueChange?: (value: string | string[]) => void;
  /** Additional class names */
  className?: string;
}

const SimpleAccordion = React.forwardRef<HTMLDivElement, SimpleAccordionProps>(
  (
    {
      items,
      multiple = false,
      defaultValue,
      value,
      onValueChange,
      variant,
      className,
    },
    ref
  ) => {
    if (multiple) {
      return (
        <Accordion
          ref={ref}
          type="multiple"
          defaultValue={defaultValue as string[] | undefined}
          value={value as string[] | undefined}
          onValueChange={onValueChange as ((value: string[]) => void) | undefined}
          variant={variant}
          className={className}
        >
          {items.map((item) => (
            <AccordionItem key={item.value} value={item.value} variant={variant} disabled={item.disabled}>
              <AccordionTrigger variant={variant} icon={item.icon}>
                {item.title}
              </AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    }

    return (
      <Accordion
        ref={ref}
        type="single"
        collapsible
        defaultValue={defaultValue as string | undefined}
        value={value as string | undefined}
        onValueChange={onValueChange as ((value: string) => void) | undefined}
        variant={variant}
        className={className}
      >
        {items.map((item) => (
          <AccordionItem key={item.value} value={item.value} variant={variant} disabled={item.disabled}>
            <AccordionTrigger variant={variant} icon={item.icon}>
              {item.title}
            </AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }
);
SimpleAccordion.displayName = 'SimpleAccordion';

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  SimpleAccordion,
  accordionVariants,
  accordionItemVariants,
  accordionTriggerVariants,
};
