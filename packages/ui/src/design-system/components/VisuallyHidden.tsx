'use client';

/**
 * VisuallyHidden Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Hides content visually while keeping it accessible to screen readers.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CONCEPT:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │   [Search Icon]                                                        │
 * │        ↑                                                               │
 * │   Visually: Just an icon                                               │
 * │   Screen Reader: "Search"                                              │
 * │                                                                        │
 * │   The text "Search" is rendered but visually hidden                    │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * VISUAL VS ACCESSIBLE:
 *
 * What sighted users see:
 * ┌──────────────┐
 * │     🔍       │
 * └──────────────┘
 *
 * What screen readers announce:
 * "Search button"
 *
 * HOW IT WORKS:
 * The content is positioned off-screen using CSS but remains in the DOM,
 * allowing screen readers to access it.
 *
 * CSS technique:
 * - position: absolute
 * - width: 1px, height: 1px
 * - overflow: hidden
 * - clip: rect(0, 0, 0, 0)
 * - white-space: nowrap
 *
 * USE CASES:
 *
 * 1. Icon-only buttons:
 * ┌────────┐
 * │   ✕    │  + VisuallyHidden("Close")
 * └────────┘
 *
 * 2. Skip links:
 *    VisuallyHidden("Skip to main content") - visible on focus
 *
 * 3. Form labels for icon inputs:
 *    🔍 [__________]  + VisuallyHidden("Search")
 *
 * 4. Table captions:
 *    [Table data]  + VisuallyHidden("User statistics")
 *
 * 5. Section headings:
 *    [Content]  + VisuallyHidden("Additional information")
 *
 * ACCESSIBILITY CONSIDERATIONS:
 * - Always provide accessible text for icon-only controls
 * - Don't hide essential information
 * - Test with screen readers
 * - Consider aria-label as alternative for simple cases
 *
 * WHEN TO USE aria-label VS VisuallyHidden:
 *
 * aria-label:
 * - Simple, single elements
 * - When you don't need the text in the DOM
 * - Shorter strings
 *
 * VisuallyHidden:
 * - Complex content (formatted text, multiple elements)
 * - When you need the text in the DOM for other purposes
 * - When you want it visible on focus (skip links)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as VisuallyHiddenPrimitive from '@radix-ui/react-visually-hidden';
import { cn } from '../../lib/utils';

export interface VisuallyHiddenProps
  extends React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root> {}

/**
 * VisuallyHidden - Hides content visually but keeps it accessible
 */
const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
  VisuallyHiddenProps
>(({ className, ...props }, ref) => (
  <VisuallyHiddenPrimitive.Root
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
VisuallyHidden.displayName = VisuallyHiddenPrimitive.Root.displayName;

/**
 * VisuallyHiddenInput - Hidden input for custom form controls
 */
export interface VisuallyHiddenInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const VisuallyHiddenInput = React.forwardRef<HTMLInputElement, VisuallyHiddenInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        '[clip:rect(0,0,0,0)]',
        className
      )}
      {...props}
    />
  )
);
VisuallyHiddenInput.displayName = 'VisuallyHiddenInput';

/**
 * FocusableVisuallyHidden - Visible on focus (for skip links)
 */
export interface FocusableVisuallyHiddenProps
  extends React.HTMLAttributes<HTMLAnchorElement> {
  /** Target element ID to skip to */
  href: string;
}

const FocusableVisuallyHidden = React.forwardRef<HTMLAnchorElement, FocusableVisuallyHiddenProps>(
  ({ className, children, href, ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(
        // Visually hidden by default
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        '[clip:rect(0,0,0,0)]',
        // Visible on focus
        'focus:w-auto focus:h-auto focus:p-4 focus:m-0 focus:overflow-visible',
        'focus:[clip:auto] focus:whitespace-normal',
        'focus:z-50 focus:fixed focus:top-4 focus:left-4',
        'focus:bg-[var(--life-gold)] focus:text-black focus:rounded-lg focus:font-medium',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
);
FocusableVisuallyHidden.displayName = 'FocusableVisuallyHidden';

/**
 * srOnly - CSS class utility for screen reader only content
 */
const srOnlyClass = 'sr-only';

/**
 * notSrOnly - CSS class utility to override sr-only
 */
const notSrOnlyClass = 'not-sr-only';

export {
  VisuallyHidden,
  VisuallyHiddenInput,
  FocusableVisuallyHidden,
  srOnlyClass,
  notSrOnlyClass,
};
