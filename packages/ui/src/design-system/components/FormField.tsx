'use client';

/**
 * FormField Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Wrapper for form inputs with label, description, and error states.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * STRUCTURE:
 * ┌─────────────────────────────────────────────┐
 * │  Label Text *                               │  <- Label (optional asterisk if required)
 * │  Helper description text                    │  <- Description (optional, muted)
 * ├─────────────────────────────────────────────┤
 * │  [Input / Select / Textarea]                │  <- Slot for any form control
 * ├─────────────────────────────────────────────┤
 * │  ⚠ Error message text                       │  <- Error (optional, red)
 * │  Character count: 45/100                    │  <- Counter (optional)
 * └─────────────────────────────────────────────┘
 *
 * SPACING:
 * - Label to input: 6px (mb-1.5)
 * - Description to input: 4px (mb-1)
 * - Input to error/counter: 6px (mt-1.5)
 *
 * TYPOGRAPHY:
 * - Label: text-sm font-medium, text-primary
 * - Required asterisk: text-[var(--color-status-error)]
 * - Description: text-xs, text-muted
 * - Error: text-xs, text-[var(--color-status-error)]
 * - Counter: text-xs, text-muted (error state: red when over)
 *
 * STATES:
 * - Default: Label + input
 * - With description: Adds helper text below label
 * - Error: Red border on input, error message below
 * - Disabled: 50% opacity, cursor-not-allowed
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Whether field is required */
  required?: boolean;
  /** Helper description */
  description?: string;
  /** Error message */
  error?: string;
  /** Show character counter */
  showCounter?: boolean;
  /** Current character count */
  charCount?: number;
  /** Max character limit */
  maxLength?: number;
  /** Disabled state */
  disabled?: boolean;
  /** HTML id for label association */
  htmlFor?: string;
  /** Children (the form control) */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * FormField - Form control wrapper
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  description,
  error,
  showCounter = false,
  charCount = 0,
  maxLength,
  disabled = false,
  htmlFor,
  children,
  className,
}) => {
  const isOverLimit = maxLength && charCount > maxLength;

  return (
    <div
      className={cn(
        'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            'block mb-1.5',
            disabled && 'cursor-not-allowed'
          )}
        >
          <Text size="sm" weight="medium">
            {label}
            {required && (
              <span className="text-[var(--color-status-error)] ml-0.5">*</span>
            )}
          </Text>
        </label>
      )}

      {/* Description */}
      {description && (
        <Text size="xs" tone="muted" className="mb-1 block">
          {description}
        </Text>
      )}

      {/* Form control slot */}
      <div className={cn(error && '[&_input]:border-[var(--color-status-error)] [&_textarea]:border-[var(--color-status-error)] [&_select]:border-[var(--color-status-error)]')}>
        {children}
      </div>

      {/* Footer: Error and/or counter */}
      {(error || showCounter) && (
        <div className="flex items-center justify-between mt-1.5 gap-4">
          {/* Error message */}
          {error && (
            <Text size="xs" className="text-[var(--color-status-error)]">
              {error}
            </Text>
          )}

          {/* Character counter */}
          {showCounter && maxLength && (
            <Text
              size="xs"
              tone={isOverLimit ? undefined : 'muted'}
              className={cn(
                'ml-auto',
                isOverLimit && 'text-[var(--color-status-error)]'
              )}
            >
              {charCount}/{maxLength}
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';

/**
 * FormFieldGroup - Group multiple form fields
 */
export interface FormFieldGroupProps {
  /** Group label */
  label?: string;
  /** Group description */
  description?: string;
  /** Inline layout (horizontal) */
  inline?: boolean;
  /** Children (FormField components) */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  label,
  description,
  inline = false,
  children,
  className,
}) => {
  return (
    <fieldset className={cn('border-none p-0 m-0', className)}>
      {label && (
        <legend className="mb-2">
          <Text size="sm" weight="semibold">
            {label}
          </Text>
          {description && (
            <Text size="xs" tone="muted" className="block mt-0.5">
              {description}
            </Text>
          )}
        </legend>
      )}
      <div
        className={cn(
          inline ? 'flex flex-wrap gap-4' : 'space-y-4'
        )}
      >
        {children}
      </div>
    </fieldset>
  );
};

FormFieldGroup.displayName = 'FormFieldGroup';

/**
 * FormSection - Major form section with heading
 */
export interface FormSectionProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Children */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <section className={cn('space-y-6', className)}>
      <div className="pb-4 border-b border-[var(--color-border)]">
        <Text size="lg" weight="semibold">
          {title}
        </Text>
        {description && (
          <Text size="sm" tone="muted" className="mt-1">
            {description}
          </Text>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
};

FormSection.displayName = 'FormSection';

export { FormField, FormFieldGroup, FormSection };
