"use client";

/**
 * Toast hook for the web app
 *
 * Re-exports the toast system from @hive/ui.
 * The `toast` function is accessed via the `useToast()` hook.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success("Success!", "Your changes have been saved");
 *   toast.error("Error", "Something went wrong");
 */

export { useToast, Toaster } from "@hive/ui";

// Re-export ToastProvider as an alias for Toaster for backward compatibility
export { Toaster as ToastProvider } from "@hive/ui";
