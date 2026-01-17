'use client';

/**
 * Modal Primitive - LOCKED 2026-01-10
 *
 * Minimal choreography: Fast 150ms scale, Apple Glass Dark surface
 *
 * Recipe:
 *   backdrop: bg-black/60 backdrop-blur-sm
 *   surface: Apple Glass Dark (gradient + deep shadow)
 *   animation: 150ms scale(0.96 → 1), ease-smooth
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Backdrop - 60% black with subtle blur
const modalOverlayStyles = cn(
  'fixed inset-0 z-50',
  'bg-black/60 backdrop-blur-sm',
  // Animation - 150ms fade
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'duration-150'
);

// LOCKED: Apple Glass Dark surface
const modalSurface = {
  background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
};

// Content variants
const modalContentVariants = cva(
  [
    'fixed z-50',
    'backdrop-blur-xl',
    // LOCKED: Minimal animation - 150ms scale
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-[0.96] data-[state=open]:zoom-in-[0.96]',
    'duration-150',
    // Focus
    'focus:outline-none',
  ].join(' '),
  {
    variants: {
      variant: {
        // Default: Centered modal
        default: [
          'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-lg max-h-[85vh]',
          'rounded-3xl',
          'p-6',
        ].join(' '),
        // Alert: Smaller centered modal for confirmations
        alert: [
          'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-md',
          'rounded-3xl',
          'p-6',
        ].join(' '),
        // Sheet: Slides from bottom (mobile)
        sheet: [
          'inset-x-0 bottom-0',
          'w-full',
          'rounded-t-3xl',
          'p-6',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        ].join(' '),
        // Fullscreen: Takes entire screen
        fullscreen: [
          'inset-0',
          'w-full h-full',
          'rounded-none',
          'p-0',
        ].join(' '),
      },
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Header styles
const modalHeaderStyles = cn(
  'flex flex-col gap-1.5',
  'text-center sm:text-left'
);

// Footer styles
const modalFooterStyles = cn(
  'flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3',
  'mt-6'
);

// Title styles
const modalTitleStyles = cn(
  'text-lg font-semibold',
  'text-[var(--color-text-primary)]',
  'leading-none tracking-tight'
);

// Description styles
const modalDescriptionStyles = cn(
  'text-sm',
  'text-[var(--color-text-secondary)]'
);

// Body styles (main content area)
const modalBodyStyles = cn(
  'flex-1',
  'py-4'
);

// LOCKED: Close button - opacity hover, no ring
const modalCloseStyles = cn(
  'absolute right-4 top-4',
  'w-8 h-8 rounded-lg',
  'flex items-center justify-center',
  'text-white/40 hover:text-white/70',
  'hover:bg-white/5',
  'transition-all duration-150',
  'focus:outline-none',
  'disabled:pointer-events-none'
);

// Types
export interface ModalProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {}

export interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof modalContentVariants> {
  /** Show close button */
  showClose?: boolean;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface ModalTitleProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {}
export interface ModalDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {}

// Components
const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalPortal = DialogPrimitive.Portal;
const ModalClose = DialogPrimitive.Close;

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(modalOverlayStyles, className)}
    {...props}
  />
));

ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ className, variant, size, showClose = true, children, style, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(modalContentVariants({ variant, size }), className)}
      style={{ ...modalSurface, ...style }}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className={modalCloseStyles}>
          <svg
            className="h-4 w-4 text-[var(--color-text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </ModalPortal>
));

ModalContent.displayName = DialogPrimitive.Content.displayName;

const ModalHeader = ({ className, ...props }: ModalHeaderProps) => (
  <div className={cn(modalHeaderStyles, className)} {...props} />
);

ModalHeader.displayName = 'ModalHeader';

const ModalFooter = ({ className, ...props }: ModalFooterProps) => (
  <div className={cn(modalFooterStyles, className)} {...props} />
);

ModalFooter.displayName = 'ModalFooter';

const ModalBody = ({ className, ...props }: ModalBodyProps) => (
  <div className={cn(modalBodyStyles, className)} {...props} />
);

ModalBody.displayName = 'ModalBody';

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  ModalTitleProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(modalTitleStyles, className)}
    {...props}
  />
));

ModalTitle.displayName = DialogPrimitive.Title.displayName;

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  ModalDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(modalDescriptionStyles, className)}
    {...props}
  />
));

ModalDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  modalContentVariants,
};
