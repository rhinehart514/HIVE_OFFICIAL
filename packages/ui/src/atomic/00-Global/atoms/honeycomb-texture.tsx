'use client';

/**
 * HoneycombTexture - Subtle hexagonal pattern background
 *
 * Provides distinctive HIVE branding through honeycomb patterns.
 * Use at very low opacity (0.02-0.05) for subtle background texture.
 *
 * Usage:
 * - Empty states: adds visual interest without distraction
 * - Hero cards: premium feel with brand identity
 * - Loading skeletons: distinctive shimmer patterns
 *
 * @example
 * <div className="relative">
 *   <HoneycombTexture opacity={0.03} />
 *   <ContentGoesHere />
 * </div>
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';

export interface HoneycombTextureProps {
  /** Opacity level (0.01 - 0.1 recommended) */
  opacity?: number;
  /** Size of each hexagon cell in pixels */
  cellSize?: number;
  /** Color variant */
  variant?: 'neutral' | 'gold';
  /** Additional className for positioning */
  className?: string;
  /** Whether texture is animated (subtle drift) */
  animated?: boolean;
}

/**
 * Creates an inline SVG pattern for the honeycomb texture.
 * Using inline SVG ensures the pattern works without external dependencies.
 */
function createHoneycombPattern(
  cellSize: number,
  color: string
): string {
  // Hexagon dimensions based on cell size
  const width = cellSize * 2;
  const height = cellSize * 1.732; // sqrt(3)

  // Hexagon path (pointy-top orientation)
  const hexPath = `
    M ${cellSize * 0.5} 0
    L ${cellSize * 1.5} 0
    L ${cellSize * 2} ${height * 0.5}
    L ${cellSize * 1.5} ${height}
    L ${cellSize * 0.5} ${height}
    L 0 ${height * 0.5}
    Z
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height * 1.5}">
      <defs>
        <pattern id="honeycomb" width="${width}" height="${height * 1.5}" patternUnits="userSpaceOnUse">
          <path d="${hexPath}" fill="none" stroke="${color}" stroke-width="0.5" transform="translate(0, 0)"/>
          <path d="${hexPath}" fill="none" stroke="${color}" stroke-width="0.5" transform="translate(${cellSize}, ${height * 0.75})"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#honeycomb)"/>
    </svg>
  `;
}

export function HoneycombTexture({
  opacity = 0.03,
  cellSize = 24,
  variant = 'neutral',
  className,
  animated = false,
}: HoneycombTextureProps) {
  const color = variant === 'gold' ? '#FFD700' : '#FFFFFF';

  // Create the SVG pattern as a data URL
  const svgPattern = React.useMemo(() => {
    const svg = createHoneycombPattern(cellSize, color);
    return `url("data:image/svg+xml,${encodeURIComponent(svg.trim())}")`;
  }, [cellSize, color]);

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        animated && 'animate-subtle-drift',
        className
      )}
      style={{
        backgroundImage: svgPattern,
        backgroundRepeat: 'repeat',
        opacity,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Simplified honeycomb gradient overlay - just the visual effect without full SVG
 * Use when you want a hint of texture without the complexity
 */
export function HoneycombGradient({
  opacity = 0.02,
  variant = 'neutral',
  className,
}: Omit<HoneycombTextureProps, 'cellSize' | 'animated'>) {
  const baseColor = variant === 'gold' ? 'rgba(255, 215, 0,' : 'rgba(255, 255, 255,';

  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        background: `
          radial-gradient(ellipse at 20% 30%, ${baseColor} ${opacity}) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, ${baseColor} ${opacity * 0.5}) 0%, transparent 40%),
          radial-gradient(ellipse at 50% 50%, ${baseColor} ${opacity * 0.3}) 0%, transparent 60%)
        `,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Static honeycomb cells using CSS pseudo-elements
 * Lighter weight alternative to full SVG pattern
 */
export function HoneycombCells({
  count = 3,
  opacity = 0.04,
  className,
}: {
  count?: number;
  opacity?: number;
  className?: string;
}) {
  // Create positioned hexagon cells
  const cells = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${15 + i * 25}%`,
      top: `${20 + (i % 2) * 30}%`,
      size: 40 + Math.random() * 20,
      rotation: i * 15,
    }));
  }, [count]);

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      {cells.map((cell) => (
        <svg
          key={cell.id}
          className="absolute text-white"
          style={{
            left: cell.left,
            top: cell.top,
            width: cell.size,
            height: cell.size,
            opacity,
            transform: `rotate(${cell.rotation}deg)`,
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={0.5}
        >
          <path d="M12 2L21 7v10l-9 5-9-5V7l9-5z" />
        </svg>
      ))}
    </div>
  );
}

export default HoneycombTexture;
