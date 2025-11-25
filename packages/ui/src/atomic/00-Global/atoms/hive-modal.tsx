'use client';

/**
 * HIVE Modal Component
 * Simple modal wrapper that integrates with the design system
 */

import { X } from 'lucide-react';
import React from 'react';

import { cn } from '../../../lib/utils';

export interface HiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
}

export function HiveModal({
  open,
  onOpenChange,
  children,
  className,
  size = 'md',
  closeOnOverlay = true
}: HiveModalProps) {
  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onOpenChange(false);
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-background-overlay/80 backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-label="Close dialog"
      />

      {/* Modal */}
      <div className={cn(
        // Semantic radius: modal = 2xl (32px)
        'relative w-full mx-4 bg-background-secondary border border-border-default rounded-2xl shadow-lg',
        sizeClasses[size],
        className
      )}>
        {children}
      </div>
    </div>
  );
}

// Modal subcomponents for better composition
export function HiveModalHeader({
  children,
  className,
  showCloseButton = true,
  onClose
}: {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className={cn('px-4 pt-4 pb-3 border-b border-border-subtle', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-text-muted hover:text-text-primary transition-colors duration-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function HiveModalTitle({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn('text-sm font-medium text-text-primary', className)}>
      {children}
    </h2>
  );
}

export function HiveModalDescription({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('mt-1 text-xs text-text-secondary', className)}>
      {children}
    </p>
  );
}

export function HiveModalContent({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  );
}

export function HiveModalFooter({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-4 pb-4 pt-3 border-t border-border-subtle', className)}>
      {children}
    </div>
  );
}
