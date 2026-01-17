'use client';

/**
 * SpaceLayoutWrapper - Responsive layout container for space pages
 *
 * Handles:
 * - Conditional SpaceSubnav display (hidden on main page, shown on subpages)
 * - Mobile bottom padding for BottomNav (only on subpages)
 * - Safe area insets for notched devices
 *
 * Architecture:
 * - Main page (/spaces/[id]) uses theater mode with its own navigation (ContextPill)
 * - Subpages (/spaces/[id]/events, /members, /settings) use SpaceSubnav navigation
 */

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { SpaceSubnav } from './SpaceSubnav.client';

// Mobile detection hook (matches SpaceSubnav)
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

interface SpaceLayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * @deprecated Use SpaceLayoutWithNav instead
 */
export function SpaceLayoutWrapper({ children }: SpaceLayoutWrapperProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-black">
      {children}
      {/* Spacer for mobile BottomNav - prevents content from being hidden */}
      {isMobile && (
        <div
          className="h-16"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * SpaceLayoutWithNav - Smart layout that conditionally shows navigation
 *
 * - Main page: Theater mode handles navigation, no SpaceSubnav
 * - Subpages: SpaceSubnav provides navigation back to main modes
 */
interface SpaceLayoutWithNavProps {
  children: React.ReactNode;
  spaceId: string;
}

export function SpaceLayoutWithNav({ children, spaceId }: SpaceLayoutWithNavProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Check if we're on a subpage (not the main space page)
  // Main page: /spaces/[id] or /spaces/[id]?mode=...
  // Subpages: /spaces/[id]/events, /spaces/[id]/members, /spaces/[id]/settings, etc.
  const basePath = `/spaces/${spaceId}`;
  const isMainPage = pathname === basePath;

  // Main page uses theater mode which has its own navigation
  // Subpages need SpaceSubnav for navigation
  const showSubnav = !isMainPage;

  return (
    <div className="min-h-screen bg-black">
      {showSubnav && <SpaceSubnav spaceId={spaceId} />}
      {children}
      {/* Spacer for mobile BottomNav - only needed on subpages */}
      {showSubnav && isMobile && (
        <div
          className="h-16"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
