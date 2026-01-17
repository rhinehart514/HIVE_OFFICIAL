'use client';

/**
 * FormLayout Pattern
 * Source: docs/design-system/COMPONENTS.md
 *
 * Reusable form layout patterns for consistent form structure.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * VERTICAL LAYOUT (default):
 * ┌──────────────────────────────────────────┐
 * │  Label                                   │
 * │  ┌────────────────────────────────────┐  │
 * │  │ Input                              │  │
 * │  └────────────────────────────────────┘  │
 * │  Helper text                             │
 * │                                          │
 * │  Label                                   │
 * │  ┌────────────────────────────────────┐  │
 * │  │ Input                              │  │
 * │  └────────────────────────────────────┘  │
 * └──────────────────────────────────────────┘
 *
 * HORIZONTAL LAYOUT (side-by-side):
 * ┌──────────────────────────────────────────┐
 * │  Label        ┌─────────────────────┐    │
 * │               │ Input               │    │
 * │               └─────────────────────┘    │
 * │                                          │
 * │  Label        ┌─────────────────────┐    │
 * │               │ Input               │    │
 * │               └─────────────────────┘    │
 * └──────────────────────────────────────────┘
 *
 * INLINE LAYOUT (compact):
 * ┌──────────────────────────────────────────┐
 * │  ┌────────┐ ┌────────┐ ┌────────┐        │
 * │  │ Field  │ │ Field  │ │ Field  │        │
 * │  └────────┘ └────────┘ └────────┘        │
 * └──────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ============================================
// FORM LAYOUT VARIANTS
// ============================================

const formLayoutVariants = cva('w-full', {
  variants: {
    layout: {
      vertical: 'flex flex-col',
      horizontal: 'grid grid-cols-[200px_1fr]',
      inline: 'flex flex-row flex-wrap items-end',
    },
    spacing: {
      compact: 'gap-3',
      default: 'gap-4',
      relaxed: 'gap-6',
    },
    maxWidth: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    layout: 'vertical',
    spacing: 'default',
    maxWidth: 'full',
  },
});

const formFieldVariants = cva('', {
  variants: {
    layout: {
      vertical: 'flex flex-col gap-1.5',
      horizontal: 'contents',
      inline: 'flex flex-col gap-1',
    },
  },
  defaultVariants: {
    layout: 'vertical',
  },
});

const formLabelVariants = cva(
  'text-sm font-medium text-[var(--text-secondary)]',
  {
    variants: {
      layout: {
        vertical: '',
        horizontal: 'py-2.5 text-right pr-4',
        inline: 'text-xs',
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-red-500",
        false: '',
      },
    },
    defaultVariants: {
      layout: 'vertical',
      required: false,
    },
  }
);

const formHelperVariants = cva('text-xs', {
  variants: {
    variant: {
      default: 'text-[var(--text-tertiary)]',
      error: 'text-red-500',
      success: 'text-green-500',
    },
    layout: {
      vertical: 'mt-1',
      horizontal: 'col-start-2 mt-1',
      inline: 'mt-0.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    layout: 'vertical',
  },
});

// ============================================
// TYPES
// ============================================

export interface FormLayoutProps
  extends React.HTMLAttributes<HTMLFormElement>,
    VariantProps<typeof formLayoutVariants> {
  /** Form submission handler */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Disable form submission */
  disabled?: boolean;
}

export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  /** Field label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message (overrides helper) */
  error?: string;
  /** Success message */
  success?: string;
  /** Required field */
  required?: boolean;
  /** Field ID for label association */
  htmlFor?: string;
}

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment of actions */
  align?: 'left' | 'center' | 'right' | 'between';
}

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
}

// ============================================
// CONTEXT
// ============================================

interface FormLayoutContextValue {
  layout: 'vertical' | 'horizontal' | 'inline';
}

const FormLayoutContext = React.createContext<FormLayoutContextValue>({
  layout: 'vertical',
});

const useFormLayout = () => React.useContext(FormLayoutContext);

// ============================================
// COMPONENTS
// ============================================

/**
 * FormLayout - Container for form fields
 */
const FormLayout = React.forwardRef<HTMLFormElement, FormLayoutProps>(
  (
    { className, layout = 'vertical', spacing, maxWidth, children, ...props },
    ref
  ) => {
    return (
      <FormLayoutContext.Provider value={{ layout: layout ?? 'vertical' }}>
        <form
          ref={ref}
          className={cn(
            formLayoutVariants({ layout, spacing, maxWidth }),
            className
          )}
          {...props}
        >
          {children}
        </form>
      </FormLayoutContext.Provider>
    );
  }
);
FormLayout.displayName = 'FormLayout';

/**
 * FormField - Individual form field with label and helper
 */
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      success,
      required,
      htmlFor,
      children,
      ...props
    },
    ref
  ) => {
    const { layout } = useFormLayout();
    const helperVariant = error ? 'error' : success ? 'success' : 'default';
    const helperContent = error || success || helperText;

    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ layout }), className)}
        {...props}
      >
        {label && (
          <label
            htmlFor={htmlFor}
            className={formLabelVariants({ layout, required })}
          >
            {label}
          </label>
        )}
        <div className="flex-1">{children}</div>
        {helperContent && (
          <span className={formHelperVariants({ variant: helperVariant, layout })}>
            {helperContent}
          </span>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

/**
 * FormActions - Container for form action buttons
 */
const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, align = 'right', children, ...props }, ref) => {
    const alignmentClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 pt-4 border-t border-[var(--border-subtle)]',
          alignmentClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormActions.displayName = 'FormActions';

/**
 * FormSection - Group related form fields
 */
const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-base font-medium text-[var(--text-primary)]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-[var(--text-tertiary)]">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="space-y-4">{children}</div>
      </div>
    );
  }
);
FormSection.displayName = 'FormSection';

/**
 * FormDivider - Visual separator between form sections
 */
const FormDivider = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn('border-[var(--border-subtle)] my-6', className)}
    {...props}
  />
));
FormDivider.displayName = 'FormDivider';

export {
  FormLayout,
  FormField,
  FormActions,
  FormSection,
  FormDivider,
  formLayoutVariants,
  formFieldVariants,
  formLabelVariants,
  formHelperVariants,
};
