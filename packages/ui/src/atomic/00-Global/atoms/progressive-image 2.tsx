/**
 * Progressive Image Component
 *
 * Image component with blur placeholder, lazy loading, and error handling.
 * Provides smooth loading experience for all images in HIVE.
 *
 * @module progressive-image
 * @since 1.0.0
 */

'use client';

import React, { useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

export interface ProgressiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Image source URL */
  src: string;

  /** Low-quality placeholder image (data URI or small image) */
  placeholder?: string;

  /** Alt text (required for accessibility) */
  alt: string;

  /** Aspect ratio (e.g., '16/9', '1/1', '4/3') */
  aspectRatio?: string;

  /** Enable lazy loading (default: true) */
  lazy?: boolean;

  /** Blur amount for placeholder (default: 20) */
  blurAmount?: number;

  /** Fallback image on error */
  fallback?: string;

  /** Callback when image loads */
  onLoad?: () => void;

  /** Callback when image fails to load */
  onError?: () => void;

  /** Container className */
  containerClassName?: string;

  /** Show loading skeleton (default: true) */
  showSkeleton?: boolean;
}

/**
 * Progressive Image with blur placeholder
 *
 * @example
 * ```tsx
 * <ProgressiveImage
 *   src="/images/post-large.jpg"
 *   placeholder="/images/post-tiny.jpg"
 *   alt="Campus event photo"
 *   aspectRatio="16/9"
 *   lazy
 * />
 * ```
 */
export function ProgressiveImage({
  src,
  placeholder,
  alt,
  aspectRatio,
  lazy = true,
  blurAmount = 20,
  fallback,
  onLoad,
  onError,
  className,
  containerClassName,
  showSkeleton = true,
  ...props
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Intersection Observer for lazy loading
   */
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, isInView]);

  /**
   * Handle image load
   */
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  /**
   * Handle image error
   */
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  };

  /**
   * Get image source to display
   */
  const imageSrc = hasError && fallback ? fallback : isInView ? src : placeholder;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        'bg-[var(--hive-background-tertiary)]',
        containerClassName
      )}
      style={{
        aspectRatio: aspectRatio || 'auto',
      }}
    >
      {/* Skeleton loader */}
      {showSkeleton && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse bg-[var(--hive-background-tertiary)]"
          aria-hidden="true"
        />
      )}

      {/* Placeholder image (blurred) */}
      {placeholder && !isLoaded && !hasError && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            'transition-opacity duration-300',
            isLoaded && 'opacity-0'
          )}
          style={{
            filter: `blur(${blurAmount}px)`,
          }}
        />
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover',
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}

      {/* Error fallback */}
      {hasError && !fallback && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-[var(--hive-background-tertiary)]',
            'text-[var(--hive-text-tertiary)]'
          )}
          role="img"
          aria-label="Failed to load image"
        >
          <svg
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Loading indicator */}
      {isInView && !isLoaded && !hasError && !showSkeleton && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          role="status"
          aria-label="Loading image"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--hive-border-primary)] border-t-transparent" />
        </div>
      )}
    </div>
  );
}

/**
 * Avatar Image with progressive loading
 *
 * @example
 * ```tsx
 * <AvatarImage
 *   src={user.avatarUrl}
 *   alt={user.name}
 *   size="lg"
 * />
 * ```
 */
export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallback,
  className,
  ...props
}: Omit<ProgressiveImageProps, 'aspectRatio'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
      <ProgressiveImage
        src={src}
        alt={alt}
        aspectRatio="1/1"
        fallback={fallback || generateAvatarFallback(alt)}
        lazy={false}
        showSkeleton={false}
        containerClassName="!rounded-full"
        className="!rounded-full"
        {...props}
      />
    </div>
  );
}

/**
 * Generate avatar fallback with initials
 */
function generateAvatarFallback(name: string): string {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate data URI with initials
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#1a1a1a"/>
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dy=".35em"
        fill="#666"
        font-family="system-ui"
        font-size="40"
        font-weight="600"
      >${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
