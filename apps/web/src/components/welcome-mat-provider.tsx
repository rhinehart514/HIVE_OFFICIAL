"use client";

import { useSession } from "../hooks/use-session";
import { WelcomeMat, useWelcomeMat } from "@hive/ui";

interface WelcomeMatProviderProps {
  children: React.ReactNode;
}

export const WelcomeMatProvider = ({ children }: WelcomeMatProviderProps) => {
  const { user, isLoading } = useSession();
  const { isOpen, closeFlow } = useWelcomeMat();

  // Only show welcome mat for authenticated users who have completed entry
  // AND are not on entry/schools pages
  const isOnAuthPage = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/schools') ||
    window.location.pathname.startsWith('/enter') ||
    window.location.pathname.startsWith('/waitlist')
  );
  
  const shouldShowWelcomeMat =
    !isLoading &&
    user &&
    user.onboardingCompleted &&
    isOpen &&
    !isOnAuthPage;

  return (
    <>
      {children}
      {shouldShowWelcomeMat && (
        <WelcomeMat
          onDismiss={closeFlow}
          userName={user.fullName || undefined}
        />
      )}
    </>
  );
};
