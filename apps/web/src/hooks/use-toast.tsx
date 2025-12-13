"use client";

/**
 * Toast hook for the web app
 *
 * Re-exports the Sonner-based toast system from @hive/ui
 * for backward compatibility with existing code.
 */

export { toast, useToast, legacyToast, Toaster } from "@hive/ui";
export type { LegacyToastOptions } from "@hive/ui";

// Re-export ToastProvider as an alias for Toaster for backward compatibility
export { Toaster as ToastProvider } from "@hive/ui";
