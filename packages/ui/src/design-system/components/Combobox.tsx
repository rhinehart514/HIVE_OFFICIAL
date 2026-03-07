'use client';

/**
 * Combobox Primitive
 * LOCKED: January 11, 2026
 *
 * Decisions:
 * - Trigger: Pure Float (matches Input)
 * - Options: Glass hover + Check icon (matches Dropdown)
 * - Create CTA: Gold TEXT only (gold-as-light rule)
 * - Empty: Simple "No results found" text
 * - Loading: Spinner (matches Button)
 * - Focus: WHITE ring (ring-white/50)
 *
 * Searchable dropdown with filtering and keyboard navigation.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC COMBOBOX (closed):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔍  Search options...                                    ▼   │
 * └────────────────────────────────────────────────────────────────┘
 *    Search icon, placeholder text, chevron
 *
 * COMBOBOX (open, no search yet):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔍  |                                                    ▼   │ ← Focus/cursor
 * └────────────────────────────────────────────────────────────────┘
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Option One                                                   │ ← Highlighted
 * │  Option Two                                                   │
 * │  Option Three                                                 │
 * │  Another Option                                               │
 * └────────────────────────────────────────────────────────────────┘
 *
 * COMBOBOX (open, with search):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔍  opt|                                                 ▼   │ ← User typing
 * └────────────────────────────────────────────────────────────────┘
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Option One                                                   │ ← Filtered results
 * │  Option Two                                                   │
 * │  Option Three                                                 │
 * │  Another Option                                               │
 * └────────────────────────────────────────────────────────────────┘
 *    Results filtered by search query
 *
 * NO RESULTS:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔍  xyz|                                                 ▼   │
 * └────────────────────────────────────────────────────────────────┘
 * ┌────────────────────────────────────────────────────────────────┐
 * │  No results found                                             │ ← Empty state
 * └────────────────────────────────────────────────────────────────┘
 *
 * WITH VALUE SELECTED:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔍  Option Two                                      ✓    ▼   │ ← Checkmark shows selection
 * └────────────────────────────────────────────────────────────────┘
 *
 * MULTI-SELECT:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  [Option 1] [Option 2] [+2]                               ▼   │ ← Tags for selected items
 * └────────────────────────────────────────────────────────────────┘
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ✓  Option One                                                │ ← Checked items
 * │  ✓  Option Two                                                │
 * │     Option Three                                              │
 * │     Option Four                                               │
 * └────────────────────────────────────────────────────────────────┘
 *
 * WITH GROUPS:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  RECENT                                                       │
 * │  Recent Option 1                                              │
 * │  Recent Option 2                                              │
 * │  ─────────────────────────────────────────────────────────────│
 * │  ALL OPTIONS                                                  │
 * │  Option A                                                     │
 * │  Option B                                                     │
 * └────────────────────────────────────────────────────────────────┘
 *
 * WITH CREATE OPTION:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔍  newvalue|                                            ▼   │
 * └────────────────────────────────────────────────────────────────┘
 * ┌────────────────────────────────────────────────────────────────┐
 * │  + Create "newvalue"                                          │ ← Create new option
 * └────────────────────────────────────────────────────────────────┘
 *
 * LOADING STATE:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔍  Search...                                            ▼   │
 * └────────────────────────────────────────────────────────────────┘
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ○ Loading...                                                 │ ← Spinner
 * └────────────────────────────────────────────────────────────────┘
 *
 * KEYBOARD:
 * - ↑↓: Navigate options
 * - Enter: Select highlighted option
 * - Escape: Close dropdown
 * - Type: Filter options
 *
 * STATES:
 * - Default: bg-elevated, border
 * - Focus: White focus ring
 * - Disabled: 50% opacity
 * - Error: Red border
 *
 * COLORS:
 * - Input bg: var(--color-bg-elevated)
 * - Border: var(--color-border)
 * - Text: White (value), var(--color-text-muted) (placeholder)
 * - Dropdown bg: var(--color-bg-elevated)
 * - Highlight: white/10
 * - Selected checkmark: White
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Use Radix primitives directly instead of broken components/Popover.tsx
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1 shadow-sm outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));

const comboboxTriggerVariants = cva(
  'flex items-center justify-between w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      error: {
        true: 'border-red-500 focus:ring-red-500/50',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
);

/**
 * Command root from cmdk
 */
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-xl bg-[var(--color-bg-elevated)]',
      className
    )}
    {...props}
  />
));
Command.displayName = 'Command';

/**
 * Command input
 */
const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-[var(--color-border)] px-3" cmdk-input-wrapper="">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-10 w-full bg-transparent py-3 px-2 text-sm text-white placeholder:text-[var(--color-text-muted)] outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

/**
 * Command list (scrollable area)
 */
const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden p-1', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

/**
 * Command empty state
 */
const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-[var(--color-text-muted)]"
    {...props}
  />
));
CommandEmpty.displayName = 'CommandEmpty';

/**
 * Command group
 */
const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-text-muted)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide',
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

/**
 * Command separator
 */
const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('h-px my-1 mx-1 bg-[var(--color-border)]', className)}
    {...props}
  />
));
CommandSeparator.displayName = 'CommandSeparator';

/**
 * Command item
 */
const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & {
    icon?: React.ReactNode;
    description?: string;
  }
>(({ className, icon, description, children, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-white outline-none',
      'data-[selected=true]:bg-white/10 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className
    )}
    {...props}
  >
    {icon && <span className="mr-2 shrink-0">{icon}</span>}
    <div className="flex-1">
      <span>{children}</span>
      {description && (
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
      )}
    </div>
  </CommandPrimitive.Item>
));
CommandItem.displayName = 'CommandItem';

/**
 * Command loading state
 */
const CommandLoading = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Loading>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Loading
    ref={ref}
    className={cn('py-6 flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]', className)}
    {...props}
  >
    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    Loading...
  </CommandPrimitive.Loading>
));
CommandLoading.displayName = 'CommandLoading';

/**
 * Combobox - Complete searchable select component
 */
export interface ComboboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxGroup {
  label: string;
  options: ComboboxOption[];
}

export interface ComboboxProps extends VariantProps<typeof comboboxTriggerVariants> {
  /** Options (flat or grouped) */
  options: ComboboxOption[] | ComboboxGroup[];
  /** Placeholder text */
  placeholder?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Empty state text */
  emptyText?: string;
  /** Selected value (controlled) */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Allow creating new options */
  creatable?: boolean;
  /** Create handler */
  onCreate?: (value: string) => void;
  /** Additional class names */
  className?: string;
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      placeholder = 'Select an option...',
      searchPlaceholder = 'Search...',
      emptyText = 'No results found.',
      value,
      defaultValue,
      onValueChange,
      disabled,
      loading,
      creatable,
      onCreate,
      size,
      error,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');

    const currentValue = value !== undefined ? value : internalValue;

    const isGrouped = options.length > 0 && 'label' in options[0];

    const allOptions = isGrouped
      ? (options as ComboboxGroup[]).flatMap((g) => g.options)
      : (options as ComboboxOption[]);

    const selectedOption = allOptions.find((opt) => opt.value === currentValue);

    const handleSelect = (optionValue: string) => {
      if (value === undefined) {
        setInternalValue(optionValue);
      }
      onValueChange?.(optionValue);
      setOpen(false);
      setSearch('');
    };

    const handleCreate = () => {
      if (search && onCreate) {
        onCreate(search);
        setSearch('');
        setOpen(false);
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(comboboxTriggerVariants({ size, error }), className)}
          >
            <div className="flex items-center gap-2 truncate">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span className={cn(!selectedOption && 'text-[var(--color-text-muted)]')}>
                {selectedOption?.label || placeholder}
              </span>
            </div>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={cn(
                'w-4 h-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200',
                open && 'rotate-180'
              )}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <CommandLoading />
              ) : (
                <>
                  <CommandEmpty>{emptyText}</CommandEmpty>
                  {isGrouped
                    ? (options as ComboboxGroup[]).map((group, index) => (
                        <React.Fragment key={group.label}>
                          {index > 0 && <CommandSeparator />}
                          <CommandGroup heading={group.label}>
                            {group.options.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.label}
                                icon={option.icon}
                                description={option.description}
                                disabled={option.disabled}
                                onSelect={() => handleSelect(option.value)}
                              >
                                <span className="flex-1">{option.label}</span>
                                {currentValue === option.value && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </React.Fragment>
                      ))
                    : (options as ComboboxOption[]).map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          icon={option.icon}
                          description={option.description}
                          disabled={option.disabled}
                          onSelect={() => handleSelect(option.value)}
                        >
                          <span className="flex-1">{option.label}</span>
                          {currentValue === option.value && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </CommandItem>
                      ))}
                  {creatable && search && !allOptions.some((opt) => opt.label.toLowerCase() === search.toLowerCase()) && (
                    <>
                      <CommandSeparator />
                      <CommandItem onSelect={handleCreate}>
                        <span className="text-[#FFD700]">+ Create &quot;{search}&quot;</span>
                      </CommandItem>
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
Combobox.displayName = 'Combobox';

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandLoading,
  Combobox,
  comboboxTriggerVariants,
};
