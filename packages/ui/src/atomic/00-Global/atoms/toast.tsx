'use client';

/**
 * Toast - Notification toast primitive
 *
 * Features:
 * - Auto-dismiss after 4 seconds
 * - 4 variants: default, success, error, warning
 * - White glow focus states
 * - Framer Motion animations
 * - Max 3 toasts visible at once (managed by ToastProvider)
 *
 * Based on Radix UI Toast + HIVE design system
 *
 * Usage:
 * ```tsx
 * import { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, useToast } from '@hive/ui';
 *
 * // In your app layout
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // In a component
 * const { toast } = useToast();
 *
 * toast({
 *   title: "Space joined!",
 *   description: "You're now a member of CS Study Group",
 *   variant: "success"
 * });
 * ```
 */

import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { XIcon, LucideCheck, AlertCircleIcon, AlertTriangleIcon, InfoIcon } from '../../00-Global/atoms/icon-library';

// Toast viewport (container positioned in top-right)
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-0 sm:right-0 sm:max-w-[420px] sm:flex-col',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// Toast variants
const toastVariants = cva(
  // Semantic radius: toast = xl (24px)
  'group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border-[#2A2A2A]',
        success: 'border-[#00D46A]/30 bg-[#00D46A]/10',
        error: 'border-[#FF3737]/30 bg-[#FF3737]/10',
        warning: 'border-[#FFB800]/30 bg-[#FFB800]/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Toast component
export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      duration={4000} // Auto-dismiss after 4 seconds
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

// Toast icon (renders based on variant)
export const ToastIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  const Icon = {
    default: InfoIcon,
    success: LucideCheck,
    error: AlertCircleIcon,
    warning: AlertTriangleIcon,
  }[variant || 'default'];

  const iconColor = {
    default: 'text-[#A1A1A6]',
    success: 'text-[#00D46A]',
    error: 'text-[#FF3737]',
    warning: 'text-[#FFB800]',
  }[variant || 'default'];

  return (
    <div ref={ref} className={cn('flex-shrink-0', className)} {...props}>
      <Icon className={cn('h-5 w-5', iconColor)} />
    </div>
  );
});
ToastIcon.displayName = 'ToastIcon';

// Toast action (for interactive toasts)
export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-[#2A2A2A] bg-transparent px-3 text-sm font-medium transition-colors duration-100 hover:bg-[#1A1A1A] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

// Toast close button
export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-[#71717A] opacity-0 transition-opacity duration-100 hover:text-[#FAFAFA] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 group-hover:opacity-100',
      className
    )}
    toast-close=""
    {...props}
  >
    <XIcon className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

// Toast title
export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-medium text-[#FAFAFA]', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

// Toast description
export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm text-[#A1A1A6]', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// Toast provider (wraps app)
export const ToastProvider = ToastPrimitives.Provider;

// Export variant types
export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
export type ToastActionElement = React.ReactElement<typeof ToastAction>;
