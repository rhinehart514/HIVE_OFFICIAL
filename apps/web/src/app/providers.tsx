"use client";

import { type ReactNode, useState, lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UniversalShellProvider } from "./universal-shell-provider";
import { PWAManager } from "@/components/pwa";

// Lazy load Toaster to prevent circular dependency issues on initial load
const Toaster = lazy(() => import("@/hooks/use-toast").then(m => ({ default: m.Toaster })));

interface ProvidersProps {
  children: ReactNode;
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
        <UniversalShellProvider>
          {children}
          {/* <PWAManager /> - disabled for development */}
        </UniversalShellProvider>
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
