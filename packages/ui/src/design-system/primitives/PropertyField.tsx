'use client';

/**
 * PropertyField Primitive
 * LOCKED: January 11, 2026
 *
 * Decisions:
 * - Layout: Horizontal default (label left 120px, control right)
 * - Vertical: Label above for complex inputs
 * - Full: No label visible (for inline editing)
 * - Sizes: sm (text-xs), default (text-sm), lg (text-base)
 * - Spacing: min-h-8, py-1, gap-3
 *
 * IDE-style form field layout for HiveLab properties panel.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Label } from './Label';

const propertyFieldVariants = cva(
  [
    'grid items-center gap-3',
    'min-h-[var(--space-8)]',
    'py-1',
  ].join(' '),
  {
    variants: {
      layout: {
        // Label on left, control on right
        horizontal: 'grid-cols-[120px_1fr]',
        // Label above control
        vertical: 'grid-cols-1 gap-1.5',
        // Full width control (no label visible)
        full: 'grid-cols-1',
      },
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      layout: 'horizontal',
      size: 'default',
    },
  }
);

export interface PropertyFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof propertyFieldVariants> {
  /** Field label */
  label: string;
  /** Help text / description */
  description?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** HTML for attribute for the label */
  htmlFor?: string;
  /** Children (the control/input) */
  children: React.ReactNode;
}

const PropertyField = React.forwardRef<HTMLDivElement, PropertyFieldProps>(
  (
    {
      className,
      layout,
      size,
      label,
      description,
      error,
      required,
      htmlFor,
      children,
      ...props
    },
    ref
  ) => {
    const isVertical = layout === 'vertical';
    const isFull = layout === 'full';

    return (
      <div
        ref={ref}
        className={cn(propertyFieldVariants({ layout, size }), className)}
        {...props}
      >
        {/* Label */}
        {!isFull && (
          <div
            className={cn(
              'flex flex-col',
              !isVertical && 'justify-center'
            )}
          >
            <Label
              htmlFor={htmlFor}
              className={cn(
                'text-[var(--color-text-secondary)]',
                'truncate',
                size === 'sm' && 'text-xs',
                size === 'lg' && 'text-sm'
              )}
            >
              {label}
              {required && (
                <span className="text-[var(--color-status-error)] ml-0.5">*</span>
              )}
            </Label>
            {description && isVertical && (
              <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}

        {/* Control */}
        <div className="flex flex-col gap-1">
          {children}
          {error && (
            <span className="text-xs text-[var(--color-status-error)]">
              {error}
            </span>
          )}
          {description && !isVertical && !isFull && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {description}
            </span>
          )}
        </div>
      </div>
    );
  }
);

PropertyField.displayName = 'PropertyField';

/**
 * PropertyGroup — Groups related properties
 */
export interface PropertyGroupProps {
  /** Group title */
  title: string;
  /** Collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Children (PropertyField elements) */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

const PropertyGroup: React.FC<PropertyGroupProps> = ({
  title,
  collapsible = true,
  defaultCollapsed = false,
  children,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div
      className={cn(
        'border-b border-[var(--color-border)]',
        'last:border-b-0',
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        className={cn(
          'w-full flex items-center justify-between',
          'px-3 py-2',
          'text-xs font-medium uppercase tracking-wider',
          'text-[var(--color-text-muted)]',
          'hover:text-[var(--color-text-secondary)]',
          'transition-colors duration-[var(--duration-snap)]',
          !collapsible && 'cursor-default'
        )}
        disabled={!collapsible}
      >
        {title}
        {collapsible && (
          <svg
            className={cn(
              'w-3.5 h-3.5 transition-transform duration-[var(--duration-snap)]',
              isCollapsed && '-rotate-90'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-[var(--duration-smooth)]',
          isCollapsed ? 'max-h-0' : 'max-h-[1000px]'
        )}
      >
        <div className="px-3 pb-3 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * PropertySection — Section divider with optional label
 */
export interface PropertySectionProps {
  /** Section label */
  label?: string;
  /** Additional className */
  className?: string;
}

const PropertySection: React.FC<PropertySectionProps> = ({ label, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 py-2',
        className
      )}
    >
      {label && (
        <span className="text-label-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  );
};

export {
  PropertyField,
  PropertyGroup,
  PropertySection,
  propertyFieldVariants,
};
