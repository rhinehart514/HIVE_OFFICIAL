"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@hive/auth-logic';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Authentication guard that protects routes and handles authentication redirects.
 * Uses UnifiedAuth context for consistent authentication state.
 */
export function AuthGuard({ 
  children, 
  requireAuth = true,
  redirectTo = '/schools' 
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // Don't redirect while auth is loading
    if (isLoading) {
      return;
    }

    // If auth is required but user is not authenticated, redirect to login
    if (requireAuth && !isAuthenticated) {
      // Store the intended destination for post-login redirect
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
      return;
    }

    // If user is authenticated but needs onboarding, redirect to entry flow
    if (isAuthenticated && user && !user.onboardingCompleted) {
      // Allow access to entry pages
      if (pathname.startsWith('/enter')) {
        return;
      }

      router.push('/enter?state=identity');
      return;
    }

    // If user is authenticated and on entry/schools pages, redirect to spaces
    if (isAuthenticated && (pathname.startsWith('/enter') || pathname.startsWith('/schools'))) {
      router.push('/spaces');
      return;
    }

  }, [isLoading, isAuthenticated, user, pathname, requireAuth, redirectTo, router]);

  // Show loading state while auth is initializing - minimal, no gold
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // For protected routes, only render if authenticated
  if (requireAuth && !isAuthenticated) {
    return null; // Redirect is handled in useEffect
  }

  return <>{children}</>;
}