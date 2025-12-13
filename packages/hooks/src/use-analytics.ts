import { useCallback } from 'react';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

// Type for gtag (Google Analytics 4)
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Analytics hook for tracking events.
 *
 * Sends events to:
 * 1. Google Analytics (gtag) if available
 * 2. Console in development mode
 *
 * Can be extended to send to additional providers (Segment, Mixpanel, etc.)
 */
export function useAnalytics() {
  const track = useCallback((event: AnalyticsEvent) => {
    const { name, properties = {} } = event;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', name, properties);
    }

    // Send to Google Analytics 4 if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        ...properties,
        send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      });
    }

    // Fire and forget to backend for funnel tracking
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        credentials: 'include',
        keepalive: true, // Ensure event is sent even on page unload
      }).catch(() => {
        // Silently ignore - analytics should never block UX
      });
    }
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, unknown>) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Identify:', userId, traits);
    }

    // Set user ID in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        user_id: userId,
        ...traits,
      });
    }
  }, []);

  const page = useCallback((name: string, properties?: Record<string, unknown>) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page:', name, properties);
    }

    // Send page view to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: name,
        page_location: window.location.href,
        ...properties,
      });
    }
  }, []);

  return {
    track,
    identify,
    page,
  };
} 