'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { logger } from '@/lib/logger';

/**
 * Web Vitals Monitoring Component
 *
 * Tracks Core Web Vitals (LCP, FID, CLS) and other performance metrics.
 * Sends data to analytics for performance monitoring.
 *
 * Core Web Vitals Targets (Production):
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 600ms
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Web Vitals: ${metric.name}`, {
        component: 'WebVitals',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Log to server for monitoring
      logger.info('Web Vitals', {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
      });

      // Send to analytics service (e.g., Google Analytics, Vercel Analytics)
      if (typeof window !== 'undefined' && (window as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as { gtag: (...args: unknown[]) => void }).gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }
    }

    // Alert for poor performance in development
    if (process.env.NODE_ENV === 'development') {
      if (metric.rating === 'poor') {
        logger.warn(`Poor ${metric.name} performance detected`, {
          component: 'WebVitals',
          value: metric.value,
          threshold: getThreshold(metric.name),
          improvement: `Consider optimizing ${getOptimizationTip(metric.name)}`,
        });
      }
    }
  });

  return null; // This component doesn't render anything
}

/**
 * Get threshold for each metric
 */
function getThreshold(metricName: string): string {
  const thresholds: Record<string, string> = {
    LCP: '2.5s',
    FID: '100ms',
    CLS: '0.1',
    FCP: '1.8s',
    TTFB: '600ms',
    INP: '200ms',
  };
  return thresholds[metricName] || 'Unknown';
}

/**
 * Get optimization tips for each metric
 */
function getOptimizationTip(metricName: string): string {
  const tips: Record<string, string> = {
    LCP: 'image loading, server response time, or resource load time',
    FID: 'JavaScript execution time and third-party scripts',
    CLS: 'image/video dimensions, dynamic content injection, or web fonts',
    FCP: 'server response time, render-blocking resources, or font loading',
    TTFB: 'server response time, CDN configuration, or API performance',
    INP: 'JavaScript execution, event handlers, or DOM updates',
  };
  return tips[metricName] || 'overall performance';
}
