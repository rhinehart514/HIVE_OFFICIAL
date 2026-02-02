"use client";

import { type ReactNode, useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AtmosphereProvider, PageTransitionProvider, Toaster, useToast } from "@hive/ui";
import { DMProvider } from "@/contexts/dm-context";
import { DMPanel } from "@/components/dm";
import { useFCMRegistration } from "@/hooks/use-fcm-registration";

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
 * FCMRegistration - Automatically registers FCM token for push notifications
 *
 * Runs on app startup for authenticated users.
 * Token is stored in user profile for server-side push delivery.
 */
function FCMRegistration() {
  // This hook handles all the FCM logic internally
  useFCMRegistration();
  return null;
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance once per app lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AtmosphereProvider defaultAtmosphere="spaces">
          <PageTransitionProvider defaultMode="fade">
            <DMProvider>
              {children}
              <DMPanel />
              <Toaster />
              <ToastBridge />
              <FCMRegistration />
            </DMProvider>
          </PageTransitionProvider>
        </AtmosphereProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
