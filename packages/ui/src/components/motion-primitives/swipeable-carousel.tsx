// @ts-nocheck
// TODO: Fix duplicate 'type' property spread
'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { cn } from '../../lib/utils';
import { tinderSprings } from '@hive/tokens';

export interface SwipeableCarouselProps {
  children: React.ReactNode[];
  showIndicators?: boolean;
  className?: string;
  cardClassName?: string;
  gap?: number;
  cardWidth?: number;
  /** Callback when active card changes */
  onCardChange?: (index: number) => void;
}

/**
 * Tinder-style swipeable carousel for horizontal card navigation
 *
 * Features:
 * - Drag to swipe between cards
 * - Snap to nearest card on release
 * - Rubber band effect at edges
 * - Dot indicators
 * - Spring physics from HIVE tokens
 */
export function SwipeableCarousel({
  children,
  showIndicators = true,
  className,
  cardClassName,
  gap = 12,
  cardWidth = 100, // percentage of container
  onCardChange,
}: SwipeableCarouselProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);

  const x = useMotionValue(0);
  const childrenArray = React.Children.toArray(children);
  const cardCount = childrenArray.length;

  // Calculate total drag distance
  const totalDragDistance = (containerWidth + gap) * (cardCount - 1);

  // Update container width on mount and resize
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Animate indicator opacity based on position
  const indicatorProgress = useTransform(
    x,
    [0, -totalDragDistance],
    [0, cardCount - 1]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    const currentX = x.get();

    // Calculate card width including gap
    const cardWidthWithGap = containerWidth + gap;

    // Determine target based on velocity and offset
    let targetIndex = activeIndex;

    if (Math.abs(velocity) > 500) {
      // High velocity - move in direction of swipe
      targetIndex = velocity > 0 ? activeIndex - 1 : activeIndex + 1;
    } else if (Math.abs(offset) > containerWidth * 0.25) {
      // Significant drag - move to next/prev
      targetIndex = offset > 0 ? activeIndex - 1 : activeIndex + 1;
    }

    // Clamp to valid range
    targetIndex = Math.max(0, Math.min(cardCount - 1, targetIndex));

    // Animate to target position
    const targetX = -targetIndex * cardWidthWithGap;
    animate(x, targetX, {
      type: 'spring',
      ...tinderSprings.snapBack,
    });

    if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex);
      onCardChange?.(targetIndex);
    }
  };

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      {/* Cards container */}
      <motion.div
        ref={containerRef}
        className="flex touch-pan-y"
        style={{
          x,
          gap: `${gap}px`,
        }}
        drag="x"
        dragConstraints={{
          left: -totalDragDistance,
          right: 0,
        }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {childrenArray.map((child, index) => (
          <motion.div
            key={index}
            className={cn(
              'flex-shrink-0',
              cardClassName
            )}
            style={{
              width: `${cardWidth}%`,
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>

      {/* Dot indicators */}
      {showIndicators && cardCount > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {childrenArray.map((_, index) => (
            <motion.button
              key={index}
              type="button"
              onClick={() => {
                const targetX = -index * (containerWidth + gap);
                animate(x, targetX, {
                  type: 'spring',
                  ...tinderSprings.snapBack,
                });
                setActiveIndex(index);
                onCardChange?.(index);
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === activeIndex
                  ? 'bg-white scale-110'
                  : 'bg-white/30 hover:bg-white/50'
              )}
              whileTap={{ scale: 0.9 }}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SwipeableCarousel;
