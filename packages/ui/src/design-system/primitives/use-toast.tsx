'use client';

/**
 * Toast Hook - LOCKED 2026-01-10
 *
 * React hook for managing toast notifications.
 * Works with Toast primitive for rendering.
 *
 * Usage (object style - web app):
 *   const { toast } = useToast();
 *   toast({ title: "Success!", description: "Saved", type: "success" });
 *
 * Usage (method style - admin app):
 *   const { toast } = useToast();
 *   toast.success("Success!", "Your changes have been saved");
 *   toast.error("Error", "Something went wrong");
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Toast, ToastContainer } from './Toast';

// Toast data type
interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Toast options for function call style
interface ToastOptions {
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Global toast state
let toastListeners: Array<(toasts: ToastData[]) => void> = [];
let toastsState: ToastData[] = [];
let toastIdCounter = 0;

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toastsState]));
}

function addToast(toast: Omit<ToastData, 'id'>): string {
  const id = `toast-${++toastIdCounter}`;
  const newToast = { ...toast, id };
  toastsState = [...toastsState, newToast];
  notifyListeners();

  // Auto-remove after duration
  const duration = toast.duration ?? 4000;
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

function removeToast(id: string) {
  toastsState = toastsState.filter((t) => t.id !== id);
  notifyListeners();
}

// Base function that handles object-style calls
function toastFunction(options: ToastOptions): string {
  const variant = options.type || options.variant || 'default';
  return addToast({
    title: options.title,
    description: options.description,
    variant,
    duration: options.duration,
  });
}

// Extend function with method properties
interface ToastAPI {
  (options: ToastOptions): string;
  success: (title: string, description?: string, duration?: number) => string;
  error: (title: string, description?: string, duration?: number) => string;
  warning: (title: string, description?: string, duration?: number) => string;
  info: (title: string, description?: string, duration?: number) => string;
  default: (title: string, description?: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// Create the toast API object that works as both function and has methods
const createToastAPI = (): ToastAPI => {
  const api = toastFunction as ToastAPI;

  api.success = (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: 'success', duration });
  };

  api.error = (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: 'error', duration });
  };

  api.warning = (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: 'warning', duration });
  };

  api.info = (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: 'info', duration });
  };

  api.default = (title: string, description?: string, duration?: number) => {
    return addToast({ title, description, variant: 'default', duration });
  };

  api.dismiss = (id: string) => {
    removeToast(id);
  };

  api.dismissAll = () => {
    toastsState = [];
    notifyListeners();
  };

  return api;
};

const toastApi = createToastAPI();

/**
 * Hook to access toast API and subscribe to toast updates
 */
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>(toastsState);

  React.useEffect(() => {
    // Subscribe to toast updates
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  return {
    toast: toastApi,
    toasts,
  };
}

/**
 * Toaster component - renders active toasts
 * Place this once at the root of your app.
 */
export function Toaster({
  position = 'bottom-right',
}: {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}) {
  const { toasts } = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <ToastContainer position={position}>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          title={t.title}
          description={t.description}
          duration={t.duration ?? 4000}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </ToastContainer>,
    document.body
  );
}

// Also export as ToastProvider for backward compatibility
export const ToastProvider = Toaster;

export type { ToastData, ToastOptions, ToastAPI };
