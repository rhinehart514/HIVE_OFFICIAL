'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Optimized image component that uses Next.js Image component
 * with proper lazy loading and optimization
 */
export function OptimizedImage({
  src,
  alt,
  width = 500,
  height = 300,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Generate blur data URL for better UX
  const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="var(--hive-background-secondary)" offset="20%" />
          <stop stop-color="var(--hive-border-hover)" offset="50%" />
          <stop stop-color="var(--hive-background-secondary)" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="var(--hive-background-secondary)" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>`;

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  const dataUrl = `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL || dataUrl}
        className={`duration-700 ease-in-out ${
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'
        }`}
        onLoad={() => setIsLoading(false)}
        // Responsive sizes for optimal image loading
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 50vw, 33vw"
        loading={priority ? undefined : 'lazy'}
      />
    </div>
  );
}

/**
 * Avatar-specific optimized image
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      quality={90}
      priority={false}
    />
  );
}

/**
 * Hero image with high priority loading (LCP optimization)
 * Use this for above-the-fold hero images, space banners, and featured content
 */
export function OptimizedHeroImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      className={className}
      quality={85}
      priority={true} // Critical: Improves LCP by preloading
    />
  );
}

/**
 * Feed Post Image with optimized loading
 * Uses lazy loading for better performance on long feeds
 */
export function OptimizedPostImage({
  src,
  alt,
  className = '',
  priority = false, // Only true for first 2 posts
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={800}
      height={600}
      className={className}
      quality={80}
      priority={priority}
    />
  );
}

/**
 * Space Banner Image with priority loading
 */
export function OptimizedSpaceBanner({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1200}
      height={400}
      className={className}
      quality={85}
      priority={true} // Banners are typically above-the-fold
    />
  );
}
