"use client";

import { type ReactNode, useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [firebaseReady, setFirebaseReady] = useState(false);

  // Initialize Firebase client-side only to avoid build-time env var errors
  useEffect(() => {
    import("@hive/firebase")
      .then(() => setFirebaseReady(true))
      .catch((_err) => {
        // Firebase init failed - still allow app to render
        setFirebaseReady(true);
      });
  }, []);

  // Show minimal loading state while Firebase initializes
  if (!firebaseReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
