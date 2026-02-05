'use client';

import { useState, useEffect } from 'react';
import { breakpointValues } from '@hive/tokens';

/**
 * Custom hook for responsive media queries
 * Works on both client and server (SSR safe)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use addEventListener if available (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

// Common breakpoint hooks derived from @hive/tokens breakpointValues
// breakpointValues: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px' }
export const useIsDesktop = () => useMediaQuery(`(min-width: ${breakpointValues.xl})`);
export const useIsTablet = () => useMediaQuery(`(min-width: ${breakpointValues.md}) and (max-width: ${parseInt(breakpointValues.xl) - 1}px)`);
export const useIsMobile = () => useMediaQuery(`(max-width: ${parseInt(breakpointValues.md) - 1}px)`);
export const useIsLargeScreen = () => useMediaQuery(`(min-width: ${breakpointValues['2xl']})`);
export const useIsMediumScreen = () => useMediaQuery(`(min-width: ${breakpointValues.lg})`);
export const useIsSmallScreen = () => useMediaQuery(`(max-width: ${breakpointValues.sm})`);
