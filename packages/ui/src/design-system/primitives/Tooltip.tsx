'use client';

/**
 * Tooltip Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Apple Glass Dark, rounded-lg, no arrow, scale+fade 150ms, 0 delay
 * Matches Card surface treatment.
 *
 * Recipe:
 *   surface: Apple Glass Dark
 *   radius: rounded-lg (8px)
 *   arrow: No arrow (cleaner)
 *   motion: Scale 0.95→1 + Fade, 150ms
 *   delay: 0ms (instant)
 */

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';

// LOCKED: Apple Glass Dark surface
const tooltipSurface = {
  background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
};

// Types
export interface TooltipProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {}

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {}

// Provider - LOCKED: 0 delay
const TooltipProvider = ({ children, ...props }: TooltipPrimitive.TooltipProviderProps) => (
  <TooltipPrimitive.Provider delayDuration={0} {...props}>
    {children}
  </TooltipPrimitive.Provider>
);

// Root component
const Tooltip = TooltipPrimitive.Root;

// Trigger component
const TooltipTrigger = TooltipPrimitive.Trigger;

// LOCKED: Content with Apple Glass Dark + Scale+Fade
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50',
        'px-3 py-1.5',
        'text-xs font-medium text-white',
        // LOCKED: rounded-lg (8px)
        'rounded-lg',
        // LOCKED: Scale+Fade animation
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-1',
        'data-[side=left]:slide-in-from-right-1',
        'data-[side=right]:slide-in-from-left-1',
        'data-[side=top]:slide-in-from-bottom-1',
        className
      )}
      style={tooltipSurface}
      {...props}
    >
      {children}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));

TooltipContent.displayName = 'TooltipContent';

// Simple tooltip wrapper for common use case
export interface SimpleTooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Element to wrap */
  children: React.ReactNode;
  /** Side to show tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Custom className for content */
  className?: string;
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  children,
  side = 'top',
  className,
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
  tooltipSurface,
};
