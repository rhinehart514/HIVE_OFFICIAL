'use client';

/**
 * LazyImage - Lazy-loaded image with Intersection Observer
 *
 * Features:
 * - Only loads when scrolled into view
 * - Smooth fade-in animation
 * - Placeholder support (blur, skeleton, custom)
 * - Error handling with fallback
 * - Accessibility (alt text, ARIA)
 *
 * Uses react-intersection-observer for performance.
 *
 * Usage:
 * ```tsx
 * import { LazyImage } from '@hive/ui';
 *
 * <LazyImage
 *   src="https://example.com/image.jpg"
 *   alt="Description"
 *   width={400}
 *   height={300}
 * />
 * ```
 */

import * as React from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '../../../lib/utils';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width of image */
  width?: number | string;
  /** Height of image */
  height?: number | string;
  /** Placeholder type */
  placeholderType?: 'blur' | 'skeleton' | 'none';
  /** Custom placeholder element */
  placeholder?: React.ReactNode;
  /** Fallback image on error */
  fallbackSrc?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Threshold for triggering load (0-1) */
  threshold?: number;
  /** Root margin for Intersection Observer */
  rootMargin?: string;
  /** Container className */
  containerClassName?: string;
}

export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      placeholderType = 'skeleton',
      placeholder,
      fallbackSrc,
      onLoad,
      onError,
      threshold = 0.1,
      rootMargin = '50px',
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const [imageSrc, setImageSrc] = React.useState<string | null>(null);

    // Intersection Observer - triggers when image enters viewport
    const { ref: inViewRef, inView } = useInView({
      threshold,
      rootMargin,
      triggerOnce: true, // Only trigger once
    });

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLImageElement | null) => {
        inViewRef(node);
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLImageElement | null>).current = node;
        }
      },
      [inViewRef, ref]
    );

    // Start loading image when in view
    React.useEffect(() => {
      if (inView && !imageSrc && !hasError) {
        setImageSrc(src);
      }
    }, [inView, src, imageSrc, hasError]);

    const handleLoad = React.useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    const handleError = React.useCallback(() => {
      setHasError(true);
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
        setHasError(false); // Try to load fallback
      }
      onError?.();
    }, [fallbackSrc, onError]);

    // Render placeholder
    const renderPlaceholder = () => {
      if (placeholder) {
        return placeholder;
      }

      if (placeholderType === 'skeleton') {
        return (
          <div
            className="animate-pulse bg-[var(--hive-background-tertiary)]"
            style={{ width, height }}
            aria-label="Loading image"
          />
        );
      }

      if (placeholderType === 'blur') {
        return (
          <div
            className="backdrop-blur-sm bg-[var(--hive-background-tertiary)]"
            style={{ width, height }}
            aria-label="Loading image"
          />
        );
      }

      return null;
    };

    return (
      <div
        className={cn('relative overflow-hidden', containerClassName)}
        style={{ width, height }}
      >
        {/* Placeholder (shown while loading) */}
        {!isLoaded && !hasError && renderPlaceholder()}

        {/* Image */}
        {imageSrc && !hasError && (
          <img
            ref={combinedRef}
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy" // Native lazy loading as backup
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            {...props}
          />
        )}

        {/* Error State */}
        {hasError && !fallbackSrc && (
          <div
            className="flex items-center justify-center bg-[var(--hive-background-tertiary)] text-[var(--hive-text-tertiary)]"
            style={{ width, height }}
            aria-label="Failed to load image"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

/**
 * LazyBackgroundImage - Lazy-loaded background image
 *
 * Usage:
 * ```tsx
 * <LazyBackgroundImage
 *   src="https://example.com/bg.jpg"
 *   className="h-64 w-full"
 * >
 *   <div>Content on top of background</div>
 * </LazyBackgroundImage>
 * ```
 */
export interface LazyBackgroundImageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Background image URL */
  src: string;
  /** Background size */
  backgroundSize?: 'cover' | 'contain' | 'auto';
  /** Background position */
  backgroundPosition?: string;
  /** Placeholder type */
  placeholderType?: 'blur' | 'skeleton' | 'none';
  /** Threshold for triggering load */
  threshold?: number;
  /** Root margin for Intersection Observer */
  rootMargin?: string;
}

export const LazyBackgroundImage = React.forwardRef<HTMLDivElement, LazyBackgroundImageProps>(
  (
    {
      src,
      backgroundSize = 'cover',
      backgroundPosition = 'center',
      placeholderType = 'skeleton',
      threshold = 0.1,
      rootMargin = '50px',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [backgroundImage, setBackgroundImage] = React.useState<string | null>(null);

    // Intersection Observer
    const { ref: inViewRef, inView } = useInView({
      threshold,
      rootMargin,
      triggerOnce: true,
    });

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        inViewRef(node);
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [inViewRef, ref]
    );

    // Preload image when in view
    React.useEffect(() => {
      if (inView && !backgroundImage) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          setBackgroundImage(src);
          setIsLoaded(true);
        };
      }
    }, [inView, src, backgroundImage]);

    return (
      <div
        ref={combinedRef}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          placeholderType === 'skeleton' && !isLoaded && 'animate-pulse bg-[var(--hive-background-tertiary)]',
          placeholderType === 'blur' && !isLoaded && 'backdrop-blur-sm bg-[var(--hive-background-tertiary)]',
          className
        )}
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize,
          backgroundPosition,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LazyBackgroundImage.displayName = 'LazyBackgroundImage';
