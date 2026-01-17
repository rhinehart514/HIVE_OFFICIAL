'use client';

/**
 * PageTransitionWrapper - Client component that wraps page content with route animations
 *
 * Uses usePathname() to key transitions, enabling automatic fade animations
 * between route changes. Respects reduced motion preferences.
 */

import { usePathname } from 'next/navigation';
import { RouteTransition, type TransitionMode } from '@hive/ui';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Determines the transition mode based on the route
 */
function getTransitionMode(pathname: string): TransitionMode {
  // Entry flow uses slide transitions
  if (pathname.startsWith('/enter')) {
    return 'slide';
  }

  // Settings tabs use quick fade
  if (pathname.startsWith('/settings')) {
    return 'fade';
  }

  // Default fade for all other routes
  return 'fade';
}

export function PageTransitionWrapper({ children, className }: PageTransitionWrapperProps) {
  const pathname = usePathname();
  const mode = getTransitionMode(pathname);

  return (
    <RouteTransition
      pageKey={pathname}
      mode={mode}
      className={className}
    >
      {children}
    </RouteTransition>
  );
}
