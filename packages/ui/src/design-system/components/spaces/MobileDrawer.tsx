'use client';

/**
 * MobileDrawer Component
 *
 * Bottom sheet drawer for mobile space navigation.
 * Wraps content in a swipe-to-dismiss container.
 */

import * as React from 'react';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';
import type { MobileDrawerType } from './MobileActionBar';

export interface MobileDrawerProps {
  open?: boolean;
  onClose?: () => void;
  type?: MobileDrawerType;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open = false,
  onClose,
  type,
  title,
  children,
  className,
}) => {
  const [dragY, setDragY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const startY = React.useRef(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const getDefaultTitle = (drawerType?: MobileDrawerType): string => {
    switch (drawerType) {
      case 'info':
        return 'Info';
      case 'chat':
        return 'Chat';
      case 'events':
        return 'Events';
      case 'tools':
        return 'Tools';
      case 'members':
        return 'Members';
      case 'settings':
        return 'Settings';
      case 'automations':
        return 'Automations';
      default:
        return '';
    }
  };

  const displayTitle = title || getDefaultTitle(type);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow drag from the handle area
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drawer-handle]')) return;

    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // Only allow dragging down
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // If dragged more than 100px, close the drawer
    if (dragY > 100) {
      onClose?.();
    }

    setDragY(0);
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40',
          'bg-black/50 backdrop-blur-sm',
          'lg:hidden',
          'animate-in fade-in duration-200'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={contentRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-[var(--color-bg-surface)]',
          'rounded-t-2xl',
          'max-h-[85vh]',
          'lg:hidden',
          'animate-in slide-in-from-bottom duration-300',
          className
        )}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div
          data-drawer-handle
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-[var(--color-border)]">
          <Text size="lg" weight="semibold">
            {displayTitle}
          </Text>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg',
              'hover:bg-[var(--color-bg-elevated)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          >
            <svg
              className="w-5 h-5 text-[var(--color-text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {children}
        </div>

        {/* Safe area padding */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
};

MobileDrawer.displayName = 'MobileDrawer';

export { MobileDrawer };
