'use client';

/**
 * Modal Primitive
 * REFINED: Jan 29, 2026 - Matches /about aesthetic
 *
 * Design principles:
 * - Simple dark surface with subtle border
 * - No heavy shadows or gradients
 * - Clean, minimal chrome
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const modalOverlayStyles = cn(
  'fixed inset-0 z-50',
  'bg-black/80 backdrop-blur-sm',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'duration-200'
);

const modalContentVariants = cva(
  [
    'fixed z-50',
    'bg-[#080808]',
    'border border-white/[0.06]',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]',
    'duration-200',
    'focus:outline-none',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-lg max-h-[85vh]',
          'rounded-2xl',
          'p-6',
        ].join(' '),
        alert: [
          'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-md',
          'rounded-2xl',
          'p-6',
        ].join(' '),
        sheet: [
          'inset-x-0 bottom-0',
          'w-full',
          'rounded-t-2xl',
          'p-6',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        ].join(' '),
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

const modalHeaderStyles = cn(
  'flex flex-col gap-1.5',
  'text-center sm:text-left'
);

const modalFooterStyles = cn(
  'flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3',
  'mt-6'
);

const modalTitleStyles = cn(
  'text-lg font-medium',
  'text-white',
  'leading-none tracking-tight'
);

const modalDescriptionStyles = cn(
  'text-sm',
  'text-white/40'
);

const modalBodyStyles = cn(
  'flex-1',
  'py-4'
);

const modalCloseStyles = cn(
  'absolute right-4 top-4',
  'w-8 h-8 rounded-lg',
  'flex items-center justify-center',
  'text-white/30 hover:text-white/50',
  'hover:bg-white/[0.04]',
  'transition-all duration-150',
  'focus:outline-none',
  'disabled:pointer-events-none'
);

export interface ModalProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {}

export interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof modalContentVariants> {
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface ModalTitleProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {}
export interface ModalDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {}

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
>(({ className, variant, size, showClose = true, children, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(modalContentVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className={modalCloseStyles}>
          <svg
            className="h-4 w-4"
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
