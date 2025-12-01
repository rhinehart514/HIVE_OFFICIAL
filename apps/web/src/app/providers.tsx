"use client";

import { type ReactNode, useState } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/hooks/use-toast";
import { UniversalShellProvider } from "./universal-shell-provider";

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
        <ToastProvider>
          <UniversalShellProvider>
            {children}
          </UniversalShellProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
