'use client';

/**
 * HIVE Modal Component
 * Portal-based modal with proper z-index stacking
 */

import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnOverlay ? () => onOpenChange(false) : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className={cn(
        'relative w-full bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)]',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        sizeClasses[size],
        className
      )}>
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
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
    <div className={cn('px-4 pt-4 pb-3 border-b border-[#2A2A2A]', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-[#818187] hover:text-[#FAFAFA] transition-colors duration-100"
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
    <h2 className={cn('text-sm font-medium text-[#FAFAFA]', className)}>
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
    <p className={cn('mt-1 text-xs text-[#A1A1A6]', className)}>
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
    <div className={cn('px-4 pb-4 pt-3 border-t border-[#2A2A2A]', className)}>
      {children}
    </div>
  );
}
