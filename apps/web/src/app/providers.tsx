"use client";

import { type ReactNode, useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AtmosphereProvider, PageTransitionProvider, Toaster, useToast } from "@hive/ui";
import { AdminToolbarProvider } from "@/components/admin/AdminToolbarProvider";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { ensureServiceWorker } from "@/lib/fcm-client";
import { onValueMoment } from "@/lib/pwa-triggers";
import { initErrorMonitoring, setUserContext, clearUserContext } from "@/lib/error-monitoring";
import { useAuth } from "@hive/auth-logic";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * ToastBridge - Converts custom 'hive:toast' events into actual toast notifications
 *
 * The apiClient dispatches these events for centralized error handling.
 * This bridge ensures API errors automatically show user-friendly toasts.
 */
function ToastBridge() {
  const { toast } = useToast();

  useEffect(() => {
    const handleToastEvent = (event: CustomEvent<{ title: string; description?: string; type?: string }>) => {
      const { title, description, type } = event.detail;

      switch (type) {
        case 'error':
          toast.error(title, description);
          break;
        case 'warning':
          toast.warning(title, description);
          break;
        case 'success':
          toast.success(title, description);
          break;
        case 'info':
          toast.info(title, description);
          break;
        default:
          toast.default(title, description);
      }
    };

    window.addEventListener('hive:toast', handleToastEvent as EventListener);
    return () => {
      window.removeEventListener('hive:toast', handleToastEvent as EventListener);
    };
  }, [toast]);

  return null;
}

/**
 * PushNotificationRegistration - Registers FCM token for push notifications
 *
 * Uses the newer usePushNotifications hook which handles:
 * - Permission state tracking
 * - Token registration via /api/notifications/register-token
 * - Foreground message toasts via sonner
 * - Auto-request with localStorage gate (no spam on first visit)
 */
function PushNotificationRegistration() {
  const { user } = useAuth();
  usePushNotifications({ userId: user?.uid, autoRequest: true });
  return null;
}

/**
 * InstallPromptHandler - Shows install prompt after value moments
 *
 * Listens for 'hive:value-moment' events (fired after space join, etc.)
 * and triggers the deferred install prompt if available.
 * Also re-triggers push notification auto-request since the localStorage
 * gate is now set.
 */
function InstallPromptHandler() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const { user } = useAuth();
  const { requestPermission, permissionState } = usePushNotifications({ userId: user?.uid });

  useEffect(() => {
    return onValueMoment(() => {
      // After a value moment, show install prompt if available (slight delay for UX)
      if (canInstall) {
        const timer = setTimeout(() => { promptInstall(); }, 2000);
        return () => clearTimeout(timer);
      }

      // If push permission is still default, request it now that the gate is set
      if (permissionState === 'default' && user?.uid) {
        requestPermission();
      }
    });
  }, [canInstall, promptInstall, permissionState, user?.uid, requestPermission]);

  return null;
}

/**
 * ErrorUserContextTracker - Tracks user context for error monitoring
 *
 * Updates Sentry/error monitoring with user info when they log in/out.
 * Helps identify which user experienced an error.
 */
function ErrorUserContextTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setUserContext(user.id, user.email || undefined);
    } else {
      clearUserContext();
    }
  }, [user]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance once per app lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2,        // 2 minutes default (up from 1 min)
            gcTime: 1000 * 60 * 15,          // 15 minutes garbage collection
            retry: 1,                         // Retry once (fail fast for auth errors)
            refetchOnWindowFocus: 'always',   // Show cached data + silent refresh on tab focus
            refetchOnReconnect: true,         // Refetch after network comes back
          },
          mutations: {
            retry: 0,                         // Never retry mutations automatically
          },
        },
      })
  );

  // Initialize error monitoring and service worker on mount
  useEffect(() => {
    initErrorMonitoring();
    // Register SW independently of push permission so all users get offline caching
    ensureServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AtmosphereProvider defaultAtmosphere="spaces">
          <PageTransitionProvider>
            <AdminToolbarProvider>
              {children}
            </AdminToolbarProvider>
            <Toaster />
            <ToastBridge />
            <PushNotificationRegistration />
            <InstallPromptHandler />
            <ErrorUserContextTracker />
          </PageTransitionProvider>
        </AtmosphereProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
