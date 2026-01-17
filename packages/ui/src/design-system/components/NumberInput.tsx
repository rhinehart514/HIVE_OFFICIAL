'use client';

/**
 * NumberInput Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Specialized input for numeric values with increment/decrement controls.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC NUMBER INPUT:
 * ┌────────────────────────────────────────┐
 * │ ┌──────────────────────────────────┐   │
 * │ │              42                  │   │
 * │ └──────────────────────────────────┘   │
 * └────────────────────────────────────────┘
 *
 * WITH STEPPER BUTTONS (default):
 * ┌────────────────────────────────────────┐
 * │ ┌────────────────────────────────┬─┬─┐ │
 * │ │              42                │-│+│ │
 * │ └────────────────────────────────┴─┴─┘ │
 * │          │ Decrement  Increment  │     │
 * └──────────┴───────────────────────┴─────┘
 *
 * VERTICAL STEPPER:
 * ┌────────────────────────────────────────┐
 * │ ┌────────────────────────────────┬───┐ │
 * │ │              42                │ ▲ │ │ ← Increment
 * │ │                                ├───┤ │
 * │ │                                │ ▼ │ │ ← Decrement
 * │ └────────────────────────────────┴───┘ │
 * └────────────────────────────────────────┘
 *
 * INLINE STEPPER:
 * ┌────────────────────────────────────────┐
 * │       [ - ]     42     [ + ]           │
 * │         │               │              │
 * │     Decrement       Increment          │
 * └────────────────────────────────────────┘
 *
 * WITH PREFIX/SUFFIX:
 * ┌────────────────────────────────────────┐
 * │ ┌────────────────────────────────┬─┬─┐ │
 * │ │ $           42.00              │-│+│ │
 * │ └────────────────────────────────┴─┴─┘ │
 * └────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────┐
 * │ ┌────────────────────────────────┬─┬─┐ │
 * │ │              100           %   │-│+│ │
 * │ └────────────────────────────────┴─┴─┘ │
 * └────────────────────────────────────────┘
 *
 * WITH MIN/MAX REACHED:
 * ┌────────────────────────────────────────┐
 * │ ┌────────────────────────────────┬─┬─┐ │
 * │ │              0                 │░│+│ │ ← Decrement disabled at min
 * │ └────────────────────────────────┴─┴─┘ │
 * └────────────────────────────────────────┘
 *
 * SIZES:
 *
 * Small (sm):
 *   Height: 32px
 *   Button: 24px
 *   Text: text-sm
 *
 * Medium (md - default):
 *   Height: 40px
 *   Button: 32px
 *   Text: text-base
 *
 * Large (lg):
 *   Height: 48px
 *   Button: 40px
 *   Text: text-lg
 *
 * STATES:
 *
 * Default:
 *   border-[var(--color-border)]
 *
 * Focused:
 *   ring-2 ring-white/50
 *
 * Error:
 *   border-[#FF6B6B]
 *
 * Disabled:
 *   opacity-50, cursor-not-allowed
 *
 * BUTTON INTERACTION:
 * - Click: increment/decrement by step
 * - Hold: continuous increment/decrement (accelerating)
 * - Keyboard: Arrow up/down, Page up/down
 *
 * COLORS:
 * - Background: var(--color-bg-elevated)
 * - Border: var(--color-border)
 * - Text: white
 * - Button: white/10 hover → white/20
 * - Button icon: white
 * - Disabled button: opacity-30
 *
 * ACCESSIBILITY:
 * - role="spinbutton"
 * - aria-valuenow, aria-valuemin, aria-valuemax
 * - Arrow key support
 * - Shift+Arrow for larger steps
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const numberInputVariants = cva(
  'flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] transition-colors',
  {
    variants: {
      size: {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
      },
      error: {
        true: 'border-red-500',
        false: '',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
      disabled: false,
    },
  }
);

const stepperButtonVariants = cva(
  'flex items-center justify-center shrink-0 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'w-6 h-6 text-sm',
        md: 'w-8 h-8',
        lg: 'w-10 h-10 text-lg',
      },
      position: {
        left: 'rounded-l-md',
        right: 'rounded-r-md',
        inline: 'rounded-md',
      },
    },
    defaultVariants: {
      size: 'md',
      position: 'right',
    },
  }
);

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange' | 'value' | 'disabled' | 'prefix'>,
    VariantProps<typeof numberInputVariants> {
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Current value */
  value?: number;
  /** Default value (uncontrolled) */
  defaultValue?: number;
  /** Change handler */
  onChange?: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step amount */
  step?: number;
  /** Large step (Shift+Arrow) */
  largeStep?: number;
  /** Precision (decimal places) */
  precision?: number;
  /** Show stepper buttons */
  showStepper?: boolean;
  /** Stepper position */
  stepperPosition?: 'right' | 'sides' | 'vertical';
  /** Prefix (e.g., "$") */
  prefix?: React.ReactNode;
  /** Suffix (e.g., "%") */
  suffix?: React.ReactNode;
  /** Error state */
  error?: boolean;
  /** Custom format function */
  formatValue?: (value: number) => string;
  /** Custom parse function */
  parseValue?: (value: string) => number;
  /** Input class name */
  inputClassName?: string;
}

/**
 * NumberInput - Numeric input with stepper controls
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      size = 'md',
      value: controlledValue,
      defaultValue = 0,
      onChange,
      min,
      max,
      step = 1,
      largeStep = 10,
      precision = 0,
      showStepper = true,
      stepperPosition = 'right',
      prefix,
      suffix,
      error,
      disabled,
      formatValue,
      parseValue,
      inputClassName,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [inputText, setInputText] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const holdTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const holdIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const clampValue = React.useCallback(
      (val: number) => {
        let result = val;
        if (min !== undefined) result = Math.max(min, result);
        if (max !== undefined) result = Math.min(max, result);
        return Number(result.toFixed(precision));
      },
      [min, max, precision]
    );

    const updateValue = React.useCallback(
      (newValue: number) => {
        const clamped = clampValue(newValue);
        if (controlledValue === undefined) {
          setInternalValue(clamped);
        }
        onChange?.(clamped);
      },
      [controlledValue, clampValue, onChange]
    );

    const increment = React.useCallback(
      (amount = step) => {
        updateValue(value + amount);
      },
      [value, step, updateValue]
    );

    const decrement = React.useCallback(
      (amount = step) => {
        updateValue(value - amount);
      },
      [value, step, updateValue]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setInputText(text);

      // Try to parse
      const parsed = parseValue ? parseValue(text) : parseFloat(text);
      if (!isNaN(parsed)) {
        updateValue(parsed);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      setInputText('');
    };

    const handleFocus = () => {
      setIsFocused(true);
      setInputText(value.toString());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const multiplier = e.shiftKey ? largeStep / step : 1;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          increment(step * multiplier);
          break;
        case 'ArrowDown':
          e.preventDefault();
          decrement(step * multiplier);
          break;
        case 'PageUp':
          e.preventDefault();
          increment(largeStep);
          break;
        case 'PageDown':
          e.preventDefault();
          decrement(largeStep);
          break;
        case 'Home':
          if (min !== undefined) {
            e.preventDefault();
            updateValue(min);
          }
          break;
        case 'End':
          if (max !== undefined) {
            e.preventDefault();
            updateValue(max);
          }
          break;
      }
    };

    const startHold = (action: () => void) => {
      action();
      holdTimeoutRef.current = setTimeout(() => {
        let delay = 100;
        holdIntervalRef.current = setInterval(() => {
          action();
          delay = Math.max(30, delay - 10);
        }, delay);
      }, 500);
    };

    const stopHold = () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };

    React.useEffect(() => {
      return stopHold;
    }, []);

    const displayValue = isFocused
      ? inputText
      : formatValue
      ? formatValue(value)
      : value.toFixed(precision);

    const isAtMin = min !== undefined && value <= min;
    const isAtMax = max !== undefined && value >= max;

    const MinusIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" d="M5 12h14" />
      </svg>
    );

    const PlusIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
    );

    const ChevronUpIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    );

    const ChevronDownIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    );

    const DecrementButton = (
      <button
        type="button"
        disabled={disabled || isAtMin}
        onMouseDown={() => !disabled && !isAtMin && startHold(() => decrement())}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        className={cn(
          stepperButtonVariants({ size, position: stepperPosition === 'sides' ? 'left' : 'inline' }),
          'bg-white/5 hover:bg-white/10'
        )}
        tabIndex={-1}
        aria-label="Decrement"
      >
        {stepperPosition === 'vertical' ? ChevronDownIcon : MinusIcon}
      </button>
    );

    const IncrementButton = (
      <button
        type="button"
        disabled={disabled || isAtMax}
        onMouseDown={() => !disabled && !isAtMax && startHold(() => increment())}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        className={cn(
          stepperButtonVariants({ size, position: 'right' }),
          'bg-white/5 hover:bg-white/10'
        )}
        tabIndex={-1}
        aria-label="Increment"
      >
        {stepperPosition === 'vertical' ? ChevronUpIcon : PlusIcon}
      </button>
    );

    return (
      <div
        className={cn(
          numberInputVariants({ size, error, disabled }),
          isFocused && 'ring-2 ring-white/50',
          className
        )}
      >
        {/* Left stepper for "sides" position */}
        {showStepper && stepperPosition === 'sides' && DecrementButton}

        {/* Prefix */}
        {prefix && (
          <span className="pl-3 text-white/50 select-none">{prefix}</span>
        )}

        {/* Input */}
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'flex-1 min-w-0 bg-transparent text-center text-white outline-none',
            'disabled:cursor-not-allowed',
            size === 'sm' && 'text-sm px-2',
            size === 'md' && 'text-base px-3',
            size === 'lg' && 'text-lg px-4',
            inputClassName
          )}
          {...props}
        />

        {/* Suffix */}
        {suffix && (
          <span className="pr-3 text-white/50 select-none">{suffix}</span>
        )}

        {/* Right stepper buttons */}
        {showStepper && stepperPosition === 'right' && (
          <div className="flex border-l border-[var(--border)]">
            {DecrementButton}
            <div className="w-px bg-[var(--border)]" />
            {IncrementButton}
          </div>
        )}

        {/* Vertical stepper */}
        {showStepper && stepperPosition === 'vertical' && (
          <div className="flex flex-col border-l border-[var(--border)]">
            {IncrementButton}
            <div className="h-px bg-[var(--border)]" />
            {DecrementButton}
          </div>
        )}

        {/* Right side stepper for "sides" position */}
        {showStepper && stepperPosition === 'sides' && IncrementButton}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';

/**
 * SimpleNumberInput - Minimal number input without stepper
 */
export interface SimpleNumberInputProps
  extends Omit<NumberInputProps, 'showStepper' | 'stepperPosition'> {}

const SimpleNumberInput = React.forwardRef<HTMLInputElement, SimpleNumberInputProps>(
  (props, ref) => <NumberInput ref={ref} {...props} showStepper={false} />
);
SimpleNumberInput.displayName = 'SimpleNumberInput';

/**
 * CurrencyInput - Pre-configured for currency values
 */
export interface CurrencyInputProps extends Omit<NumberInputProps, 'prefix' | 'precision'> {
  /** Currency symbol */
  currency?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ currency = '$', ...props }, ref) => (
    <NumberInput
      ref={ref}
      prefix={currency}
      precision={2}
      min={0}
      formatValue={(val) => val.toFixed(2)}
      {...props}
    />
  )
);
CurrencyInput.displayName = 'CurrencyInput';

/**
 * PercentInput - Pre-configured for percentage values
 */
export interface PercentInputProps extends Omit<NumberInputProps, 'suffix' | 'min' | 'max'> {}

const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  (props, ref) => (
    <NumberInput
      ref={ref}
      suffix="%"
      min={0}
      max={100}
      {...props}
    />
  )
);
PercentInput.displayName = 'PercentInput';

export { NumberInput, SimpleNumberInput, CurrencyInput, PercentInput, numberInputVariants };
