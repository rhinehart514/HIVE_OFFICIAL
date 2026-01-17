'use client';

/**
 * ConfirmDialog Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Modal for confirming destructive or important actions.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DESTRUCTIVE CONFIRM:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                                                                         │
 * │                         ⚠️                                              │
 * │                                                                         │
 * │                  Delete this space?                                     │
 * │                                                                         │
 * │     This action cannot be undone. All messages, files,                  │
 * │     and data will be permanently removed.                               │
 * │                                                                         │
 * │     ┌─────────────┐            ┌─────────────────────┐                 │
 * │     │   Cancel    │            │  ▓ Delete Space ▓   │                 │
 * │     └─────────────┘            └─────────────────────┘                 │
 * │          │                              │                              │
 * │          │                              └── Red destructive button      │
 * │          └── Ghost/outline cancel button                               │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * CONFIRMATION CONFIRM:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                                                                         │
 * │                         ✓                                               │
 * │                                                                         │
 * │                  Leave this space?                                      │
 * │                                                                         │
 * │     You can rejoin anytime from the browse page.                        │
 * │                                                                         │
 * │     ┌─────────────┐            ┌─────────────────────┐                 │
 * │     │   Cancel    │            │  ▓ Leave Space ▓    │                 │
 * │     └─────────────┘            └─────────────────────┘                 │
 * │                                         │                              │
 * │                                         └── Gold action button         │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * INFO/WARNING DIALOG:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                                                                         │
 * │                         ℹ️                                              │
 * │                                                                         │
 * │                  Unsaved changes                                        │
 * │                                                                         │
 * │     You have unsaved changes. Would you like to save                    │
 * │     before leaving?                                                     │
 * │                                                                         │
 * │     ┌───────────┐  ┌───────────┐  ┌─────────────────┐                  │
 * │     │  Discard  │  │   Cancel  │  │   ▓ Save ▓      │                  │
 * │     └───────────┘  └───────────┘  └─────────────────┘                  │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * VARIANTS:
 * - danger: Red accent, warning icon, destructive action
 * - warning: Amber accent, caution icon
 * - info: Blue accent, info icon
 * - success: Green accent, check icon
 *
 * ICONS BY VARIANT:
 * - danger: ⚠️ Triangle exclamation (red)
 * - warning: ⚠️ Triangle exclamation (amber)
 * - info: ℹ️ Circle info (blue)
 * - success: ✓ Circle check (green)
 *
 * BUTTON COLORS:
 * - Cancel: Ghost/outline (always)
 * - Confirm (danger): Red background (#FF6B6B)
 * - Confirm (warning): Amber background (#FFA500)
 * - Confirm (info/success): Gold background (#FFD700)
 *
 * ANIMATIONS:
 * - Backdrop: Fade in 200ms
 * - Dialog: Scale from 95% + fade, 200ms
 * - Close: Reverse
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { Button } from '../primitives/Button';

type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

const variantConfig: Record<
  DialogVariant,
  { icon: React.ReactNode; iconBg: string; confirmColor: string }
> = {
  danger: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    iconBg: 'bg-red-500/10 text-red-500',
    confirmColor: 'bg-red-500 hover:bg-red-500/90 text-white',
  },
  warning: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    iconBg: 'bg-amber-500/10 text-amber-500',
    confirmColor: 'bg-amber-500 hover:bg-amber-500/90 text-black',
  },
  info: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
    iconBg: 'bg-blue-500/10 text-blue-500',
    confirmColor: 'bg-life-gold hover:bg-life-gold/90 text-black',
  },
  success: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-green-500/10 text-green-500',
    confirmColor: 'bg-life-gold hover:bg-life-gold/90 text-black',
  },
};

export interface ConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Close handler */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Variant determining color and icon */
  variant?: DialogVariant;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm handler */
  onConfirm: () => void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Hide icon */
  hideIcon?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * ConfirmDialog - Confirmation modal
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  variant = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  hideIcon = false,
  className,
}) => {
  const config = variantConfig[variant];

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0'
          )}
        />

        {/* Dialog */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
            'bg-surface border border-border rounded-2xl shadow-2xl',
            'p-6',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            className
          )}
        >
          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            {!hideIcon && (
              <div
                className={cn(
                  'w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center',
                  config.iconBg
                )}
              >
                {config.icon}
              </div>
            )}

            {/* Title */}
            <DialogPrimitive.Title asChild>
              <Text size="lg" weight="semibold" className="mb-2">
                {title}
              </Text>
            </DialogPrimitive.Title>

            {/* Description */}
            {description && (
              <DialogPrimitive.Description asChild>
                <Text size="sm" tone="muted" className="mb-6">
                  {description}
                </Text>
              </DialogPrimitive.Description>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="ghost" onClick={handleCancel} disabled={loading}>
              {cancelText}
            </Button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                'inline-flex items-center justify-center h-10 px-6 rounded-xl font-medium transition-colors',
                config.confirmColor,
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} strokeOpacity={0.25} />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

ConfirmDialog.displayName = 'ConfirmDialog';

/**
 * HiveConfirmModal - Alias for ConfirmDialog with legacy prop support
 * Supports both `loading` and `isLoading` props
 */
export interface HiveConfirmModalProps extends Omit<ConfirmDialogProps, 'loading'> {
  /** Loading state (legacy alias for loading) */
  isLoading?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Legacy onClose handler */
  onClose?: () => void;
}

const HiveConfirmModal: React.FC<HiveConfirmModalProps> = ({
  isLoading,
  loading,
  onClose,
  onOpenChange,
  ...props
}) => {
  // Support both isLoading and loading props
  const isLoadingState = isLoading ?? loading ?? false;

  // Support both onClose and onOpenChange
  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose();
    }
    onOpenChange?.(open);
  };

  return (
    <ConfirmDialog
      {...props}
      loading={isLoadingState}
      onOpenChange={handleOpenChange}
    />
  );
};

HiveConfirmModal.displayName = 'HiveConfirmModal';

/**
 * useConfirmDialog - Hook for imperative usage
 */
export interface UseConfirmDialogOptions {
  title: string;
  description?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    open: boolean;
    options: UseConfirmDialogOptions | null;
    resolve: ((confirmed: boolean) => void) | null;
  }>({
    open: false,
    options: null,
    resolve: null,
  });

  const confirm = React.useCallback((options: UseConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState({ open: false, options: null, resolve: null });
  }, [state.resolve]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState({ open: false, options: null, resolve: null });
  }, [state.resolve]);

  const DialogComponent = React.useMemo(() => {
    if (!state.options) return null;

    return (
      <ConfirmDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        title={state.options.title}
        description={state.options.description}
        variant={state.options.variant}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [state.open, state.options, handleConfirm, handleCancel]);

  return { confirm, Dialog: DialogComponent };
}

export { ConfirmDialog, HiveConfirmModal };
