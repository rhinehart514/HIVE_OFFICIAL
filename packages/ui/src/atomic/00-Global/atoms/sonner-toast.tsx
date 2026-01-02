'use client';

/**
 * Sonner Toast - Modern toast notifications
 *
 * Features:
 * - Lightweight (~2KB gzipped)
 * - Accessible (WCAG 2.1 AA compliant)
 * - Beautiful animations
 * - Promise-based toasts (loading → success/error)
 * - Simple API: toast.success('Message')
 *
 * Replaces custom toast implementations with industry-standard Sonner.
 * Used by Vercel, Linear, and other top YC companies.
 *
 * Usage:
 * ```tsx
 * import { Toaster, toast } from '@hive/ui';
 *
 * // In your app layout
 * <Toaster />
 *
 * // In a component
 * toast.success('Space joined!');
 * toast.error('Failed to join space');
 * toast.promise(joinSpace(id), {
 *   loading: 'Joining space...',
 *   success: 'Space joined!',
 *   error: 'Failed to join',
 * });
 * ```
 */

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { Check, X, AlertCircle, Info } from 'lucide-react';

/**
 * Toaster component - Add this to your app layout
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'group border border-[#2A2A2A] bg-[#0A0A0A] text-[#FAFAFA] shadow-2xl shadow-black/50 rounded-xl',
          title: 'text-sm font-semibold text-[#FAFAFA]',
          description: 'text-sm text-[#A1A1A6]',
          actionButton: 'bg-[#FFD700] text-[#0A0A0A] font-medium hover:bg-[#FFD700]/90',
          cancelButton: 'bg-[#1A1A1A] text-[#A1A1A6] hover:bg-[#2A2A2A]',
          closeButton: 'bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#2A2A2A] text-[#71717A] hover:text-[#FAFAFA]',
          success: 'border-[#00D46A]/40 bg-[#00D46A]/10',
          error: 'border-[#FF3737]/40 bg-[#FF3737]/10',
          warning: 'border-[#FFB800]/40 bg-[#FFB800]/10',
          info: 'border-white/20 bg-white/[0.04]',
        },
      }}
      icons={{
        success: <Check className="h-5 w-5 text-[#00D46A]" />,
        error: <X className="h-5 w-5 text-[#FF3737]" />,
        warning: <AlertCircle className="h-5 w-5 text-[#FFB800]" />,
        info: <Info className="h-5 w-5 text-white/70" />,
      }}
      duration={4000}
      closeButton
      richColors={false}
    />
  );
}

/**
 * Toast API - Use these methods to show toasts
 */
export const toast = {
  /**
   * Show a success toast
   * @example toast.success('Space joined!')
   */
  success: (message: string, description?: string) => {
    if (description) {
      return sonnerToast.success(message, { description });
    }
    return sonnerToast.success(message);
  },

  /**
   * Show an error toast
   * @example toast.error('Failed to join space')
   */
  error: (message: string, description?: string) => {
    if (description) {
      return sonnerToast.error(message, { description });
    }
    return sonnerToast.error(message);
  },

  /**
   * Show a warning toast
   * @example toast.warning('Approaching storage limit')
   */
  warning: (message: string, description?: string) => {
    if (description) {
      return sonnerToast.warning(message, { description });
    }
    return sonnerToast.warning(message);
  },

  /**
   * Show an info toast
   * @example toast.info('New features available')
   */
  info: (message: string, description?: string) => {
    if (description) {
      return sonnerToast.info(message, { description });
    }
    return sonnerToast.info(message);
  },

  /**
   * Show a promise-based toast (loading → success/error)
   * @example
   * toast.promise(joinSpace(id), {
   *   loading: 'Joining space...',
   *   success: 'Space joined!',
   *   error: 'Failed to join',
   * });
   */
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },

  /**
   * Show a custom toast
   * @example toast.custom('Custom message')
   */
  custom: (message: string, description?: string) => {
    if (description) {
      return sonnerToast(message, { description });
    }
    return sonnerToast(message);
  },

  /**
   * Dismiss a toast by ID
   * @example toast.dismiss(toastId)
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   * @example toast.dismissAll()
   */
  dismissAll: () => {
    return sonnerToast.dismiss();
  },
};

/**
 * Legacy API compatibility
 * Provides backward compatibility with old useToast hook
 */
export interface LegacyToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
  /**
   * Backwards-compat alias for `description`
   */
  message?: string;
  /**
   * Backwards-compat alias for `variant`
   */
  type?: 'default' | 'success' | 'error' | 'warning';
}

/**
 * Legacy toast function for backward compatibility
 * @deprecated Use toast.success(), toast.error(), etc. instead
 */
export function legacyToast(options: LegacyToastOptions) {
  const {
    title,
    description,
    message,
    variant,
    type,
    duration,
  } = options;

  const resolvedDescription = description ?? message;
  const resolvedVariant = type ?? variant ?? 'default';

  const toastOptions = {
    description: resolvedDescription,
    duration,
  };

  switch (resolvedVariant) {
    case 'success':
      return sonnerToast.success(title, toastOptions);
    case 'error':
      return sonnerToast.error(title, toastOptions);
    case 'warning':
      return sonnerToast.warning(title, toastOptions);
    default:
      return sonnerToast.info(title, toastOptions);
  }
}

/**
 * useToast hook for backward compatibility
 * @deprecated Use toast directly instead: import { toast } from '@hive/ui'
 */
export function useToast() {
  return {
    toast: legacyToast,
    success: (title: string, description?: string) => toast.success(title, description),
    error: (title: string, description?: string) => toast.error(title, description),
    warning: (title: string, description?: string) => toast.warning(title, description),
    info: (title: string, description?: string) => toast.info(title, description),
    dismiss: (id?: string | number) => toast.dismiss(id),
  };
}

// Export Sonner toast for advanced use cases
export { toast as sonner } from 'sonner';
