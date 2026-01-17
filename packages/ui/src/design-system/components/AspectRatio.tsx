'use client';

/**
 * AspectRatio Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Maintains a consistent width-to-height ratio for content.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ASPECT RATIO CONCEPT:
 * ┌────────────────────────────────────────┐
 * │                                        │
 * │            Content Area                │  ← Width fills container
 * │         (maintains ratio)              │  ← Height adjusts to maintain ratio
 * │                                        │
 * └────────────────────────────────────────┘
 *   The container scales but the ratio stays constant
 *
 * COMMON RATIOS:
 *
 * 1:1 (Square):
 * ┌──────────┐
 * │          │
 * │   1:1    │
 * │          │
 * └──────────┘
 *
 * 16:9 (Widescreen/Video):
 * ┌────────────────────────────────────────┐
 * │                                        │
 * │              16:9                      │
 * │                                        │
 * └────────────────────────────────────────┘
 *
 * 4:3 (Standard):
 * ┌──────────────────────────┐
 * │                          │
 * │          4:3             │
 * │                          │
 * └──────────────────────────┘
 *
 * 21:9 (Ultrawide):
 * ┌──────────────────────────────────────────────────────────┐
 * │                          21:9                            │
 * └──────────────────────────────────────────────────────────┘
 *
 * 9:16 (Portrait/Story):
 * ┌──────┐
 * │      │
 * │      │
 * │ 9:16 │
 * │      │
 * │      │
 * │      │
 * └──────┘
 *
 * 3:2 (Photo):
 * ┌───────────────────────┐
 * │                       │
 * │         3:2           │
 * │                       │
 * └───────────────────────┘
 *
 * USE CASES:
 * - Video embeds (16:9)
 * - Profile photos (1:1)
 * - Thumbnails (4:3)
 * - Card images (3:2)
 * - Story/reel format (9:16)
 * - Banners (3:1)
 *
 * CONTENT FITTING:
 * - object-fit: cover (fills area, may crop)
 * - object-fit: contain (fits inside, may letterbox)
 * - object-fit: fill (stretches to fill)
 *
 * IMPLEMENTATION:
 * Uses CSS padding-bottom trick or aspect-ratio CSS property
 * Content is positioned absolutely to fill the ratio container
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';
import { cn } from '../../lib/utils';

export interface AspectRatioProps
  extends Omit<React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>, 'ratio'> {
  /** Aspect ratio as number (width/height) or preset string */
  ratio?: number | '1:1' | '4:3' | '3:2' | '16:9' | '21:9' | '9:16' | '3:1';
  /** Additional class names */
  className?: string;
}

const ratioPresets: Record<string, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
  '21:9': 21 / 9,
  '9:16': 9 / 16,
  '3:1': 3 / 1,
};

/**
 * AspectRatio - Maintains content ratio
 */
const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  AspectRatioProps
>(({ ratio = 16 / 9, className, ...props }, ref) => {
  const computedRatio = typeof ratio === 'string' ? ratioPresets[ratio] || 16 / 9 : ratio;

  return (
    <AspectRatioPrimitive.Root
      ref={ref}
      ratio={computedRatio}
      className={cn('relative', className)}
      {...props}
    />
  );
});
AspectRatio.displayName = 'AspectRatio';

/**
 * AspectRatioImage - Pre-composed aspect ratio with image
 */
export interface AspectRatioImageProps {
  /** Image source */
  src: string;
  /** Alt text */
  alt: string;
  /** Aspect ratio */
  ratio?: AspectRatioProps['ratio'];
  /** Object fit mode */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  /** Object position */
  objectPosition?: string;
  /** Fallback when image fails to load */
  fallback?: React.ReactNode;
  /** Additional class names for container */
  className?: string;
  /** Additional class names for image */
  imageClassName?: string;
}

const AspectRatioImage = React.forwardRef<HTMLDivElement, AspectRatioImageProps>(
  (
    {
      src,
      alt,
      ratio = 16 / 9,
      objectFit = 'cover',
      objectPosition = 'center',
      fallback,
      className,
      imageClassName,
    },
    ref
  ) => {
    const [error, setError] = React.useState(false);

    return (
      <AspectRatio ref={ref} ratio={ratio} className={cn('overflow-hidden rounded-lg', className)}>
        {error && fallback ? (
          fallback
        ) : (
          <img
            src={src}
            alt={alt}
            onError={() => setError(true)}
            className={cn(
              'w-full h-full',
              objectFit === 'cover' && 'object-cover',
              objectFit === 'contain' && 'object-contain',
              objectFit === 'fill' && 'object-fill',
              objectFit === 'none' && 'object-none',
              imageClassName
            )}
            style={{ objectPosition }}
          />
        )}
      </AspectRatio>
    );
  }
);
AspectRatioImage.displayName = 'AspectRatioImage';

/**
 * AspectRatioVideo - Pre-composed aspect ratio with video/iframe
 */
export interface AspectRatioVideoProps {
  /** Video/iframe source */
  src: string;
  /** Title for iframe */
  title?: string;
  /** Aspect ratio */
  ratio?: AspectRatioProps['ratio'];
  /** Allow fullscreen */
  allowFullScreen?: boolean;
  /** Additional class names */
  className?: string;
}

const AspectRatioVideo = React.forwardRef<HTMLDivElement, AspectRatioVideoProps>(
  ({ src, title = 'Video', ratio = 16 / 9, allowFullScreen = true, className }, ref) => (
    <AspectRatio ref={ref} ratio={ratio} className={cn('overflow-hidden rounded-lg bg-black', className)}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={allowFullScreen}
        className="w-full h-full border-0"
      />
    </AspectRatio>
  )
);
AspectRatioVideo.displayName = 'AspectRatioVideo';

/**
 * AspectRatioPlaceholder - Skeleton placeholder with ratio
 */
export interface AspectRatioPlaceholderProps {
  /** Aspect ratio */
  ratio?: AspectRatioProps['ratio'];
  /** Show loading animation */
  animate?: boolean;
  /** Additional class names */
  className?: string;
}

const AspectRatioPlaceholder = React.forwardRef<HTMLDivElement, AspectRatioPlaceholderProps>(
  ({ ratio = 16 / 9, animate = true, className }, ref) => (
    <AspectRatio ref={ref} ratio={ratio} className={cn('overflow-hidden rounded-lg', className)}>
      <div
        className={cn(
          'w-full h-full bg-[var(--color-bg-elevated)]',
          animate && 'animate-pulse'
        )}
      />
    </AspectRatio>
  )
);
AspectRatioPlaceholder.displayName = 'AspectRatioPlaceholder';

export { AspectRatio, AspectRatioImage, AspectRatioVideo, AspectRatioPlaceholder };
