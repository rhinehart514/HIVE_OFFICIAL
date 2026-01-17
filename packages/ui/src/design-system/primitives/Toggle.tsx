'use client';

/**
 * Toggle Primitives - LOCKED 2026-01-10
 *
 * LOCKED: Glass surfaces, gold check icon, spring motion
 * Matches Input/Select (Pure Float unchecked), Badge (glass checked)
 *
 * Recipe:
 *   checkbox: Glass checked + Gold check icon, Pure Float unchecked
 *   radio: Glass checked + White dot, Pure Float unchecked
 *   switch: Glass track + White thumb + Spring motion
 */

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ============================================
// SHARED SURFACES
// ============================================

// LOCKED: Pure Float unchecked state (matches Input)
const uncheckedSurface = {
  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
};

// LOCKED: Glass checked state (matches Badge)
const checkedSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
};

// LOCKED: Switch track surfaces
const switchTrackOff = {
  background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
};

const switchTrackOn = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.2)',
};

// LOCKED: Spring config for switch
const springConfig = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

// ============================================
// CHECKBOX
// ============================================

const checkboxVariants = cva(
  [
    'flex items-center justify-center',
    'rounded-md',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-4 h-4',
        default: 'w-5 h-5',
        lg: 'w-6 h-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size, checked, ...props }, ref) => {
  const isChecked = checked === true || checked === 'indeterminate';

  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(checkboxVariants({ size }), className)}
      style={isChecked ? checkedSurface : uncheckedSurface}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {checked === 'indeterminate' ? (
          <svg
            className={cn(iconSize, 'text-[#FFD700]')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M5 12h14" />
          </svg>
        ) : (
          <svg
            className={cn(iconSize, 'text-[#FFD700]')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = 'Checkbox';

// ============================================
// RADIO GROUP
// ============================================

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('flex flex-col gap-2', className)}
    {...props}
  />
));

RadioGroup.displayName = 'RadioGroup';

const radioItemVariants = cva(
  [
    'flex items-center justify-center',
    'rounded-full',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-4 h-4',
        default: 'w-5 h-5',
        lg: 'w-6 h-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioItemVariants> {}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, size, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(false);
  const itemRef = React.useRef<HTMLButtonElement>(null);

  React.useImperativeHandle(ref, () => itemRef.current!);

  React.useEffect(() => {
    const checkState = () => {
      if (itemRef.current) {
        setIsChecked(itemRef.current.getAttribute('data-state') === 'checked');
      }
    };
    checkState();
    const observer = new MutationObserver(checkState);
    if (itemRef.current) {
      observer.observe(itemRef.current, { attributes: true, attributeFilter: ['data-state'] });
    }
    return () => observer.disconnect();
  }, []);

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  return (
    <RadioGroupPrimitive.Item
      ref={itemRef}
      className={cn(radioItemVariants({ size }), className)}
      style={isChecked ? checkedSurface : uncheckedSurface}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <div className={cn(dotSize, 'rounded-full bg-white')} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

RadioGroupItem.displayName = 'RadioGroupItem';

// ============================================
// SWITCH
// ============================================

const switchVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer rounded-full',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-9 h-5',
        default: 'w-[52px] h-8',
        lg: 'w-14 h-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size, checked, ...props }, ref) => {
  const isOn = checked === true;

  const thumbSizes = {
    sm: { width: 16, height: 16, on: 18, off: 2 },
    default: { width: 24, height: 24, on: 24, off: 4 },
    lg: { width: 24, height: 24, on: 28, off: 4 },
  };

  const thumb = thumbSizes[size || 'default'];

  return (
    <SwitchPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(switchVariants({ size }), className)}
      style={isOn ? switchTrackOn : switchTrackOff}
      {...props}
    >
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          className="block rounded-full pointer-events-none"
          style={{
            width: thumb.width,
            height: thumb.height,
            background: isOn ? '#ffffff' : '#888888',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            position: 'absolute',
            top: '50%',
            marginTop: -thumb.height / 2,
          }}
          animate={{ left: isOn ? thumb.on : thumb.off }}
          transition={springConfig}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = 'Switch';

// ============================================
// EXPORTS
// ============================================

export {
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  // Export variants for composition
  checkboxVariants,
  radioItemVariants,
  switchVariants,
  // Export surfaces for themed variants
  uncheckedSurface,
  checkedSurface,
  switchTrackOff,
  switchTrackOn,
  springConfig,
};
