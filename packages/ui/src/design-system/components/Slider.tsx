'use client';

/**
 * Slider Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Thumb hover: Opacity brighten (80% → 100%), NO SCALE
 * - Track fill: Gold for CTAs, White for neutral
 * - Dragging: White glow (matches HandleDot)
 * - Tooltip: Glass Dark (matches Tooltip primitive)
 *
 * Range input slider for numeric value selection.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC SLIDER:
 * ┌────────────────────────────────────────────────────────────────┐
 * │                                                                │
 * │  ════════════════●══════════════════════════════               │
 * │         │        │                                             │
 * │         │        └── Thumb (draggable, white circle)           │
 * │         └── Filled track (gold for CTA, blue for info)         │
 * │                                                                │
 * └────────────────────────────────────────────────────────────────┘
 *
 * TRACK ANATOMY:
 *
 *  ├──────────────────────────────────────────────────────────────┤
 *  │       FILLED (gold/colored)       │    UNFILLED (muted)      │
 *  ├────────────────────●─────────────────────────────────────────┤
 *                       │
 *                       └── Current position (thumb)
 *
 * THUMB STATES:
 *
 * Default:
 *     ┌───┐
 *     │ ● │   White circle, shadow
 *     └───┘
 *
 * Hover:
 *     ┌─────┐
 *     │  ●  │   Slight scale up, stronger shadow
 *     └─────┘
 *
 * Dragging:
 *     ┌─────┐
 *     │  ●  │   Scale up, gold ring
 *     └─────┘
 *
 * Focus:
 *     ┌───┐
 *     │ ● │   White focus ring (NOT gold)
 *     └───┘
 *
 * WITH VALUE LABEL:
 *
 *         ┌─────┐
 *         │ 50  │   ← Tooltip above thumb
 *         └──┬──┘
 *            │
 *  ════════════●══════════════════════════
 *
 * WITH MARKS/TICKS:
 *
 *  ════════════●══════════════════════════
 *  │           │           │           │
 *  0          25          50          75         100
 *
 * RANGE SLIDER (Two thumbs):
 *
 *  ══════════════════●════════════●════════════════
 *                    │            │
 *                    │            └── Max thumb
 *                    └── Min thumb
 *
 * SIZE VARIANTS:
 *
 * Small (sm):
 *  ═══●═══   (track: 4px, thumb: 12px)
 *
 * Default:
 *  ═══●═══   (track: 6px, thumb: 16px)
 *
 * Large (lg):
 *  ═══●═══   (track: 8px, thumb: 20px)
 *
 * WITH LABELS:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Volume                                              75%       │
 * │  ════════════════════════════════════════●══════════           │
 * └────────────────────────────────────────────────────────────────┘
 *
 * DISABLED:
 *  ════════════════●══════════════════════════
 *  50% opacity, no interaction
 *
 * COLORS:
 * - Track filled: #FFD700 (gold) for CTA/actions, #4A9EFF for info
 * - Track unfilled: var(--color-bg-elevated)
 * - Thumb: white
 * - Focus ring: white/50 (NOT gold)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const sliderVariants = cva('relative flex w-full touch-none select-none items-center', {
  variants: {
    size: {
      sm: '',
      default: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const trackSizes = {
  sm: 'h-1',
  default: 'h-1.5',
  lg: 'h-2',
};

const thumbSizes = {
  sm: 'h-3 w-3',
  default: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const trackColors = {
  gold: 'bg-life-gold',
  primary: 'bg-blue-400',
  success: 'bg-green-500',
  default: 'bg-white',
};

export interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'onChange'>,
    VariantProps<typeof sliderVariants> {
  /** Color variant */
  color?: 'gold' | 'primary' | 'success' | 'default';
  /** Show value tooltip */
  showValue?: boolean;
  /** Format value display */
  formatValue?: (value: number) => string;
  /** Change handler */
  onChange?: (value: number[]) => void;
}

/**
 * Slider - Range input control
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      size = 'default',
      color = 'gold',
      showValue = false,
      formatValue = (v) => v.toString(),
      onChange,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState(props.defaultValue || props.value || [0]);
    const [isDragging, setIsDragging] = React.useState(false);

    const handleValueChange = (value: number[]) => {
      setLocalValue(value);
      onChange?.(value);
      onValueChange?.(value);
    };

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(sliderVariants({ size }), className)}
        onValueChange={handleValueChange}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(
            'relative w-full grow overflow-hidden rounded-full',
            'bg-elevated',
            trackSizes[size || 'default']
          )}
        >
          <SliderPrimitive.Range
            className={cn('absolute h-full', trackColors[color])}
          />
        </SliderPrimitive.Track>
        {(props.value || props.defaultValue || [0]).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className={cn(
              'block rounded-full shadow-lg',
              'ring-offset-background transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              'disabled:pointer-events-none disabled:opacity-50',
              // Hover: opacity brighten, NO SCALE
              'bg-white/80 hover:bg-white',
              thumbSizes[size || 'default']
            )}
            style={{
              // Dragging: white glow (matches HandleDot)
              boxShadow: isDragging
                ? '0 0 12px rgba(255,255,255,0.6), 0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {showValue && (
              <div
                className={cn(
                  'absolute -top-8 left-1/2 -translate-x-1/2',
                  'px-2 py-1 rounded-md text-xs text-white',
                  // Glass Dark (matches Tooltip primitive)
                  'bg-[rgba(20,20,20,0.85)] backdrop-blur-[20px]',
                  'border border-white/[0.06]',
                  'opacity-0 transition-opacity duration-150',
                  isDragging && 'opacity-100'
                )}
              >
                {formatValue(localValue[i])}
              </div>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = 'Slider';

/**
 * SliderWithLabels - Slider with label and value display
 */
export interface SliderWithLabelsProps extends SliderProps {
  /** Label text */
  label: string;
  /** Show value on right */
  showValueLabel?: boolean;
  /** Unit suffix */
  unit?: string;
}

const SliderWithLabels = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderWithLabelsProps
>(
  (
    {
      label,
      showValueLabel = true,
      unit = '',
      formatValue = (v) => v.toString(),
      className,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState(
      props.defaultValue || props.value || [0]
    );

    const handleChange = (newValue: number[]) => {
      setValue(newValue);
      props.onChange?.(newValue);
    };

    return (
      <div className={cn('w-full', className)}>
        <div className="flex justify-between mb-2">
          <Text size="sm" weight="medium">
            {label}
          </Text>
          {showValueLabel && (
            <Text size="sm" tone="muted">
              {formatValue(value[0])}{unit}
            </Text>
          )}
        </div>
        <Slider ref={ref} {...props} value={value} onChange={handleChange} />
      </div>
    );
  }
);
SliderWithLabels.displayName = 'SliderWithLabels';

/**
 * RangeSlider - Dual thumb slider for min/max selection
 */
export interface RangeSliderProps extends Omit<SliderProps, 'defaultValue' | 'value'> {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Default range [min, max] */
  defaultValue?: [number, number];
  /** Controlled range */
  value?: [number, number];
  /** Label text */
  label?: string;
  /** Unit suffix */
  unit?: string;
}

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(
  (
    {
      min = 0,
      max = 100,
      step = 1,
      defaultValue = [25, 75],
      label,
      unit = '',
      formatValue = (v) => v.toString(),
      className,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState(
      props.value || defaultValue
    );

    const handleChange = (newValue: number[]) => {
      setValue(newValue as [number, number]);
      props.onChange?.(newValue);
    };

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <div className="flex justify-between mb-2">
            <Text size="sm" weight="medium">
              {label}
            </Text>
            <Text size="sm" tone="muted">
              {formatValue(value[0])}{unit} – {formatValue(value[1])}{unit}
            </Text>
          </div>
        )}
        <Slider
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }
);
RangeSlider.displayName = 'RangeSlider';

/**
 * SliderWithMarks - Slider with tick marks
 */
export interface SliderWithMarksProps extends SliderProps {
  /** Mark positions and labels */
  marks: { value: number; label?: string }[];
  /** Show labels below marks */
  showLabels?: boolean;
}

const SliderWithMarks = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderWithMarksProps
>(({ marks, showLabels = true, min = 0, max = 100, className, ...props }, ref) => (
  <div className={cn('w-full', className)}>
    <Slider ref={ref} min={min} max={max} {...props} />
    {showLabels && (
      <div className="relative mt-2">
        {marks.map((mark) => (
          <div
            key={mark.value}
            className="absolute flex flex-col items-center"
            style={{
              left: `${((mark.value - min) / (max - min)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-px h-2 bg-[var(--color-border)]" />
            {mark.label && (
              <Text size="xs" tone="muted" className="mt-1">
                {mark.label}
              </Text>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
));
SliderWithMarks.displayName = 'SliderWithMarks';

export { Slider, SliderWithLabels, RangeSlider, SliderWithMarks, sliderVariants };
