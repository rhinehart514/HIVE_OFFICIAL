"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  userId: string;
  email: string;
  schoolId?: string;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: () => {},
  refreshSession: async () => {},
});

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session via API (httpOnly cookie is sent automatically)
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser({
            userId: data.user.id || data.user.uid,
            email: data.user.email,
            schoolId: data.user.schoolId || data.user.campusId,
            onboardingCompleted: data.user.onboardingCompleted,
          });
          setIsLoading(false);
          return;
        }
      }

      // Fallback: Check localStorage for dev mode or legacy sessions
      const devAuthMode = window.localStorage.getItem('dev_auth_mode');
      const devUserData = window.localStorage.getItem('dev_user');

      if (devAuthMode === 'true' && devUserData) {
        try {
          const devUser = JSON.parse(devUserData);
          setUser({
            userId: devUser.uid || devUser.id,
            email: devUser.email,
            schoolId: devUser.schoolId,
            onboardingCompleted: devUser.onboardingCompleted
          });
          setIsLoading(false);
          return;
        } catch {
          // Invalid dev user data, ignore
        }
      }

      // No valid session found
      setUser(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    // Re-check on focus (user might have logged in/out in another tab)
    const handleFocus = () => {
      checkSession();
    };
    window.addEventListener('focus', handleFocus);

    // Re-check on storage events (for cross-tab sync with dev mode)
    const handleStorage = () => {
      checkSession();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [checkSession]);

  // Handle route protection
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/landing', '/schools', '/auth/login', '/auth/verify', '/debug-auth', '/waitlist', '/signin'];
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

      if (!user && !isPublicPath) {
        // Not authenticated and trying to access protected route
        router.push('/landing');
      } else if (user && !user.onboardingCompleted && pathname !== '/onboarding' && !isPublicPath) {
        // Authenticated but needs onboarding (except on public/auth pages)
        router.push('/onboarding');
      }
    }
  }, [isLoading, user, pathname, router]);

  const signOut = async () => {
    try {
      // Call logout API to clear the httpOnly cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors, still clear local state
    }

    // Clear any localStorage items
    window.localStorage.removeItem('hive_session');
    window.localStorage.removeItem('emailForSignIn');
    window.localStorage.removeItem('dev_auth_mode');
    window.localStorage.removeItem('dev_user');
    setUser(null);
    router.push('/landing');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signOut,
        refreshSession: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSimpleAuth() {
  return useContext(AuthContext);
}