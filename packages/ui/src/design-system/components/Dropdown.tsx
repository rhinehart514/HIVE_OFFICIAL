'use client';

/**
 * Dropdown Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Container: Apple Glass Dark (matches Popover)
 * - Item hover: Glass highlight (bg-white/[0.08])
 * - Separator: Inset shadow (matches Separator primitive)
 * - Destructive: Red text only, no red bg
 * - Animation: Scale 0.96→1, 150ms (matches Popover)
 *
 * Dropdown menu for actions or selection.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TRIGGER (Closed):
 * ┌────────────────────────────────────────────┐
 * │  Select an option                     ▼    │
 * └────────────────────────────────────────────┘
 *                                         │
 *                                         └── Chevron down icon
 *
 * TRIGGER (Open):
 * ┌────────────────────────────────────────────┐
 * │  Select an option                     ▲    │
 * └────────────────────────────────────────────┘
 * ┌────────────────────────────────────────────┐
 * │  Option 1                                  │
 * │  ─────────────────────────────────────────│
 * │  Option 2                                  │
 * │  Option 3                                  │
 * │  ─────────────────────────────────────────│
 * │  Destructive action                   🗑️   │
 * └────────────────────────────────────────────┘
 *
 * MENU ITEM TYPES:
 *
 * Standard:
 * ┌────────────────────────────────────────────┐
 * │  Edit                                      │
 * └────────────────────────────────────────────┘
 *
 * With icon:
 * ┌────────────────────────────────────────────┐
 * │  ✏️  Edit                                  │
 * └────────────────────────────────────────────┘
 *
 * With description:
 * ┌────────────────────────────────────────────┐
 * │  🔒 Make Private                           │
 * │      Only you can see this                 │
 * └────────────────────────────────────────────┘
 *
 * With shortcut:
 * ┌────────────────────────────────────────────┐
 * │  📋 Copy                           ⌘C      │
 * └────────────────────────────────────────────┘
 *
 * Destructive:
 * ┌────────────────────────────────────────────┐
 * │  🗑️ Delete                           (red) │
 * └────────────────────────────────────────────┘
 * - Red text color
 * - Red icon
 *
 * Separator:
 * ┌────────────────────────────────────────────┐
 * │  ─────────────────────────────────────────│
 * └────────────────────────────────────────────┘
 * - Thin horizontal line
 *
 * STATES:
 * - Default: Neutral text
 * - Hover: bg-hover, white text
 * - Focused: Same as hover (keyboard)
 * - Disabled: 50% opacity, no hover
 * - Destructive: Red text + icon
 *
 * ANIMATION:
 * - Open: Fade in + scale from 95%, 150ms
 * - Close: Fade out + scale to 95%, 100ms
 * - Origin based on position
 *
 * POSITIONS:
 * - bottom-start (default)
 * - bottom-end
 * - top-start
 * - top-end
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

// Re-export primitives
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// LOCKED: Apple Glass Dark surface (matches Popover)
const appleGlassDark = {
  background: '#080808',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
  backdropFilter: 'blur(20px)',
};

/**
 * DropdownMenuContent - Menu container
 */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, style, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[180px] overflow-hidden rounded-xl p-1 outline-none',
        // LOCKED: Scale + Fade animation (0.96→1, 150ms)
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96] data-[state=open]:duration-150',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.96] data-[state=closed]:duration-100',
        className
      )}
      style={{ ...appleGlassDark, ...style }}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

/**
 * DropdownMenuItem - Menu item
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    destructive?: boolean;
  }
>(({ className, destructive = false, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors',
      // LOCKED: Glass highlight hover (matches Select options)
      'hover:bg-white/[0.08] focus:bg-white/[0.08]',
      // LOCKED: Destructive = red text only
      destructive ? 'text-red-500' : 'text-white',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

/**
 * DropdownMenuCheckboxItem - Checkbox item
 */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors',
      // LOCKED: Glass highlight hover
      'hover:bg-white/[0.08] focus:bg-white/[0.08]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

/**
 * DropdownMenuRadioItem - Radio item
 */
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors',
      // LOCKED: Glass highlight hover
      'hover:bg-white/[0.08] focus:bg-white/[0.08]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <div className="w-2 h-2 rounded-full bg-white" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

/**
 * DropdownMenuLabel - Group label
 */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-3 py-2 text-xs font-medium text-muted',
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// LOCKED: Inset shadow separator (matches Separator primitive)
const separatorStyle = {
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
  boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.5)',
};

/**
 * DropdownMenuSeparator - Divider
 */
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, style, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px', className)}
    style={{ ...separatorStyle, ...style }}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

/**
 * DropdownMenuShortcut - Keyboard shortcut
 */
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'ml-auto text-xs tracking-widest text-muted',
      className
    )}
    {...props}
  />
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

/**
 * DropdownMenuSubTrigger - Sub menu trigger
 */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors',
      'focus:bg-white/10 data-[state=open]:bg-white/10',
      className
    )}
    {...props}
  >
    {children}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="ml-auto w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

/**
 * DropdownMenuSubContent - Sub menu content
 */
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[180px] overflow-hidden rounded-xl',
      'bg-elevated border border-border',
      'p-1 shadow-xl',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
      'data-[side=bottom]:slide-in-from-top-2',
      'data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2',
      'data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
