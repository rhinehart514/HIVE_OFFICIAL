'use client';

/**
 * Popover Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Surface: Apple Glass Dark (matches Modal)
 * - Arrow: No arrow (matches Tooltip, cleaner aesthetic)
 * - Animation: Scale + Fade (0.96→1, 150ms)
 * - Radius: rounded-xl (12px)
 *
 * Floating content panel anchored to a trigger.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC POPOVER:
 *
 *                    ┌─────────────────────────────────────┐
 *                    │  Popover content goes here...       │
 *                    │                                     │
 *                    │  Can contain any content.           │
 *                    └───────────────┬─────────────────────┘
 *                                    │
 *                                    ▼
 *                              [Trigger]
 *
 * POSITION VARIANTS:
 *
 * Top:
 *              ┌─────────────────┐
 *              │    Content      │
 *              └────────┬────────┘
 *                       ▼
 *                  [Trigger]
 *
 * Bottom (default):
 *                  [Trigger]
 *                       ▲
 *              ┌────────┴────────┐
 *              │    Content      │
 *              └─────────────────┘
 *
 * Left:
 *  ┌─────────────────┐
 *  │    Content      │→ [Trigger]
 *  └─────────────────┘
 *
 * Right:
 *                      ┌─────────────────┐
 *  [Trigger] ←         │    Content      │
 *                      └─────────────────┘
 *
 * ALIGNMENT:
 *
 * Start:
 *  [Trigger]
 *  ┌─────────────────┐
 *  │ Content...      │
 *  └─────────────────┘
 *
 * Center:
 *       [Trigger]
 *  ┌─────────────────┐
 *  │    Content      │
 *  └─────────────────┘
 *
 * End:
 *            [Trigger]
 *  ┌─────────────────┐
 *  │      ...Content │
 *  └─────────────────┘
 *
 * WITH ARROW:
 *
 *              ┌─────────────────┐
 *              │    Content      │
 *              └────────◆────────┘
 *                       ▼
 *                  [Trigger]
 *
 * POPOVER CARD:
 * ┌────────────────────────────────────────┐
 * │  ┌────┐  Title                    ✕    │
 * │  │ 📷 │  Description text             │
 * │  └────┘                               │
 * │                                        │
 * │  Some content...                       │
 * │                                        │
 * │  ─────────────────────────────────────│
 * │                           [Action]     │
 * └────────────────────────────────────────┘
 *
 * ANIMATION:
 * - Open: Fade in + slide from side, 150ms
 * - Close: Fade out + slide to side, 100ms
 * - Origin based on position
 *
 * COLORS:
 * - Background: #1A1A1A
 * - Border: var(--color-border)
 * - Shadow: large shadow for depth
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverPortal = PopoverPrimitive.Portal;
const PopoverAnchor = PopoverPrimitive.Anchor;
const PopoverClose = PopoverPrimitive.Close;

export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  /** Show arrow */
  showArrow?: boolean;
}

/**
 * PopoverContent - Popover container
 */
// LOCKED: Apple Glass Dark surface
const appleGlassDark = {
  background: 'linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92))',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
  backdropFilter: 'blur(20px)',
};

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = 'center', sideOffset = 8, showArrow = false, children, style, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-xl p-4 outline-none',
        // LOCKED: Scale + Fade animation (0.96→1, 150ms)
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96] data-[state=open]:duration-150',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.96] data-[state=closed]:duration-100',
        className
      )}
      style={{ ...appleGlassDark, ...style }}
      {...props}
    >
      {children}
      {showArrow && (
        <PopoverPrimitive.Arrow className="fill-[#1c1c1c]" />
      )}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';

/**
 * PopoverHeader - Header section
 */
const PopoverHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-start gap-3 mb-3', className)} {...props} />
);
PopoverHeader.displayName = 'PopoverHeader';

/**
 * PopoverTitle - Popover title
 */
const PopoverTitle = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h4 className={cn('text-sm font-medium text-white', className)} {...props}>
    {children}
  </h4>
);
PopoverTitle.displayName = 'PopoverTitle';

/**
 * PopoverDescription - Popover description
 */
const PopoverDescription = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-[var(--color-text-muted)]', className)} {...props}>
    {children}
  </p>
);
PopoverDescription.displayName = 'PopoverDescription';

/**
 * PopoverBody - Main content area
 */
const PopoverBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-sm', className)} {...props} />
);
PopoverBody.displayName = 'PopoverBody';

/**
 * PopoverFooter - Footer with actions
 */
const PopoverFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--color-border)]', className)}
    {...props}
  />
);
PopoverFooter.displayName = 'PopoverFooter';

/**
 * PopoverCard - Pre-composed popover with title, description, image
 */
export interface PopoverCardProps extends PopoverContentProps {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Image/icon on left */
  image?: React.ReactNode;
  /** Show close button */
  showClose?: boolean;
  /** Footer content */
  footer?: React.ReactNode;
}

const PopoverCard = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverCardProps
>(({ title, description, image, showClose = false, footer, children, className, ...props }, ref) => (
  <PopoverContent ref={ref} className={cn('w-80', className)} {...props}>
    <div className="flex items-start gap-3">
      {image && (
        <div className="shrink-0 w-12 h-12 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center">
          {image}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Text size="sm" weight="medium">{title}</Text>
          {showClose && (
            <PopoverClose className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </PopoverClose>
          )}
        </div>
        {description && (
          <Text size="xs" tone="muted" className="mt-0.5">{description}</Text>
        )}
      </div>
    </div>
    {children && <div className="mt-3">{children}</div>}
    {footer && (
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--color-border)]">
        {footer}
      </div>
    )}
  </PopoverContent>
));
PopoverCard.displayName = 'PopoverCard';

/**
 * HoverCard - Popover that shows on hover
 */
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & {
    showArrow?: boolean;
  }
>(({ className, align = 'center', sideOffset = 8, showArrow = false, children, style, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 w-64 rounded-xl p-4 outline-none',
      // LOCKED: Scale + Fade animation (0.96→1, 150ms)
      'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96] data-[state=open]:duration-150',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.96] data-[state=closed]:duration-100',
      className
    )}
    style={{ ...appleGlassDark, ...style }}
    {...props}
  >
    {children}
    {showArrow && (
      <HoverCardPrimitive.Arrow className="fill-[#1c1c1c]" />
    )}
  </HoverCardPrimitive.Content>
));
HoverCardContent.displayName = 'HoverCardContent';

export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
  PopoverCard,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
};
