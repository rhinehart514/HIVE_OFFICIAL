'use client';

/**
 * Drawer Primitive
 * LOCKED: January 11, 2026
 *
 * Decisions:
 * - Overlay: 60% black (`bg-black/60`) - matches Sheet/Modal
 * - Panel: Apple Glass Dark (gradient surface, inset highlight, deep shadow)
 * - Timing: 300ms slide animation - matches Sheet
 * - Handle: Pill style (`w-10 h-1 rounded-full bg-white/30`) for bottom drawer
 * - Focus: WHITE ring (`ring-white/50`), never gold
 *
 * Slide-out panel from screen edge.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DRAWER FROM RIGHT (Default):
 * ┌────────────────────────────────┬────────────────────────────────────────┐
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                                  ✕     │
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Drawer Title                         │
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Description text                     │
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                                        │
 * │░░░░░ Backdrop (clickable) ░░░░│  Drawer content goes here...          │
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                                        │
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                                        │
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ─────────────────────────────────────│
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                 [Cancel]  [Save]       │
 * └────────────────────────────────┴────────────────────────────────────────┘
 *                                  │                                        │
 *                                  └── Drawer slides in from right ────────┘
 *
 * DRAWER FROM LEFT:
 * ┌────────────────────────────────────────┬────────────────────────────────┐
 * │  ✕                                     │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │  Navigation                            │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │                                        │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │  • Home                                │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │  • Profile                             │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │  • Settings                            │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │                                        │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * └────────────────────────────────────────┴────────────────────────────────┘
 *
 * DRAWER FROM BOTTOM (Mobile sheet):
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * ├────────────────────────────────────────────────────────────────────────┤
 * │                            ═══════                                     │ ← Handle
 * │  Sheet Title                                                     ✕     │
 * │  Description                                                          │
 * │                                                                        │
 * │  Content...                                                           │
 * │                                                                        │
 * │                                     [Action]                           │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * DRAWER FROM TOP:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  Notification Bar                                               ✕      │
 * │  Important message here...                                            │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * SIZE VARIANTS:
 *
 * Small (sm): 320px
 * Default (md): 400px
 * Large (lg): 500px
 * Extra Large (xl): 600px
 * Full: 100% of side
 *
 * ANIMATION:
 * - Right: Slide from right, 200ms
 * - Left: Slide from left, 200ms
 * - Bottom: Slide from bottom, 200ms
 * - Top: Slide from top, 200ms
 *
 * COLORS:
 * - Background: #1A1A1A
 * - Border: var(--color-border)
 * - Backdrop: black/80
 * - Handle (bottom drawer): muted
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

/**
 * DrawerOverlay - Backdrop overlay
 */
const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = 'DrawerOverlay';

const drawerContentVariants = cva(
  [
    'fixed z-50 border-[var(--color-border)] shadow-xl backdrop-blur-xl',
    'flex flex-col',
  ],
  {
    variants: {
      side: {
        right: [
          'right-0 top-0 h-full border-l',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-right',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right',
        ],
        left: [
          'left-0 top-0 h-full border-r',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-left',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left',
        ],
        bottom: [
          'bottom-0 left-0 right-0 border-t rounded-t-xl',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
        ],
        top: [
          'top-0 left-0 right-0 border-b rounded-b-xl',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-top',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top',
        ],
      },
      size: {
        sm: '',
        default: '',
        lg: '',
        xl: '',
        full: '',
      },
    },
    compoundVariants: [
      // Right/Left sizes
      { side: 'right', size: 'sm', className: 'w-80' },
      { side: 'right', size: 'default', className: 'w-[400px]' },
      { side: 'right', size: 'lg', className: 'w-[500px]' },
      { side: 'right', size: 'xl', className: 'w-[600px]' },
      { side: 'right', size: 'full', className: 'w-screen' },
      { side: 'left', size: 'sm', className: 'w-80' },
      { side: 'left', size: 'default', className: 'w-[400px]' },
      { side: 'left', size: 'lg', className: 'w-[500px]' },
      { side: 'left', size: 'xl', className: 'w-[600px]' },
      { side: 'left', size: 'full', className: 'w-screen' },
      // Top/Bottom sizes
      { side: 'bottom', size: 'sm', className: 'max-h-[30vh]' },
      { side: 'bottom', size: 'default', className: 'max-h-[50vh]' },
      { side: 'bottom', size: 'lg', className: 'max-h-[70vh]' },
      { side: 'bottom', size: 'xl', className: 'max-h-[85vh]' },
      { side: 'bottom', size: 'full', className: 'h-screen' },
      { side: 'top', size: 'sm', className: 'max-h-[30vh]' },
      { side: 'top', size: 'default', className: 'max-h-[50vh]' },
      { side: 'top', size: 'lg', className: 'max-h-[70vh]' },
      { side: 'top', size: 'xl', className: 'max-h-[85vh]' },
      { side: 'top', size: 'full', className: 'h-screen' },
    ],
    defaultVariants: {
      side: 'right',
      size: 'default',
    },
  }
);

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerContentVariants> {
  /** Show close button */
  showClose?: boolean;
  /** Show handle (for bottom drawer) */
  showHandle?: boolean;
}

/**
 * DrawerContent - Drawer container
 */
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, side, size, showClose = true, showHandle = false, children, style, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(drawerContentVariants({ side, size }), 'duration-300', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        ...style,
      }}
      {...props}
    >
      {showHandle && side === 'bottom' && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>
      )}
      {children}
      {showClose && (
        <DrawerClose className="absolute right-4 top-4 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </DrawerClose>
      )}
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

/**
 * DrawerHeader - Header section
 */
const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 p-6 pb-0', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

/**
 * DrawerTitle - Drawer title
 */
const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-medium text-white', className)}
    {...props}
  />
));
DrawerTitle.displayName = 'DrawerTitle';

/**
 * DrawerDescription - Drawer description
 */
const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--color-text-muted)]', className)}
    {...props}
  />
));
DrawerDescription.displayName = 'DrawerDescription';

/**
 * DrawerBody - Main content area
 */
const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto p-6', className)} {...props} />
);
DrawerBody.displayName = 'DrawerBody';

/**
 * DrawerFooter - Footer with actions
 */
const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex justify-end gap-3 p-6 border-t border-[var(--color-border)]',
      className
    )}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
  drawerContentVariants,
};
