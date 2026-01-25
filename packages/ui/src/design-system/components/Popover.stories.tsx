'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
  PopoverClose,
  PopoverCard,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from './Popover';
import { Button } from '../primitives';
import * as React from 'react';

/**
 * Popover - LOCKED: January 2026
 *
 * LOCKED DECISIONS:
 * - Surface: Apple Glass Dark (matches Modal)
 * - Arrow: No arrow by default (cleaner aesthetic)
 * - Animation: Scale + Fade (0.96→1, 150ms)
 * - Radius: rounded-xl (12px)
 *
 * Floating content panel anchored to a trigger.
 */
const meta: Meta = {
  title: 'Design System/Components/Popover',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 2026**

Popover provides floating content panels anchored to a trigger element.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Surface | Apple Glass Dark | Matches Modal, premium feel |
| Arrow | No arrow default | Cleaner aesthetic |
| Animation | Scale + Fade (0.96→1) | Subtle, 150ms entrance |
| Radius | rounded-xl (12px) | Consistent with design system |
| Focus ring | WHITE (\`ring-white/50\`) | Consistent focus treatment |
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 min-h-[400px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// =============================================================================
// LOCKED DESIGN SHOWCASE
// =============================================================================

/**
 * **LOCKED DESIGN** - The final approved visual treatment
 *
 * This showcases the canonical Popover patterns:
 * - Apple Glass Dark surface
 * - Scale + Fade animation
 * - No arrow by default
 * - Consistent padding and radius
 */
export const LockedDesignShowcase: StoryObj = {
  name: '⭐ Locked Design',
  render: () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-lg font-medium text-white">Popover - LOCKED</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          January 2026 • Apple Glass Dark, Scale + Fade, No arrow default
        </p>
      </div>

      {/* Basic Popover */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Apple Glass Dark Surface
          </span>
          <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
            gradient + blur + inset
          </span>
        </div>
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Glass Dark Surface</PopoverTitle>
              <PopoverDescription>
                gradient bg, blur(20px), inset highlight
              </PopoverDescription>
              <PopoverBody className="mt-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/60">
                    background: linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92))
                  </p>
                </div>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">With Arrow</Button>
            </PopoverTrigger>
            <PopoverContent showArrow>
              <PopoverTitle>Arrow Variant</PopoverTitle>
              <PopoverDescription>
                Arrow available when pointing needed.
              </PopoverDescription>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-xs text-white/40">
          Animation: scale(0.96) → scale(1) + fade in, 150ms
        </p>
      </div>

      {/* With Footer */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            With Footer Actions
          </span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Confirm Action</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <PopoverTitle>Confirm Delete</PopoverTitle>
            <PopoverDescription>This action cannot be undone.</PopoverDescription>
            <PopoverFooter>
              <PopoverClose asChild>
                <Button variant="ghost" size="sm">Cancel</Button>
              </PopoverClose>
              <Button variant="primary" size="sm">Delete</Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </div>

      {/* Hover Card */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Hover Card
          </span>
        </div>
        <p className="text-sm text-white">
          Check out{' '}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a href="#" className="text-[#4A9EFF] hover:underline">@johndoe</a>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                <div>
                  <h4 className="text-sm font-medium text-white">John Doe</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">@johndoe</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Software Engineer
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          &apos;s profile.
        </p>
        <p className="text-xs text-white/40">
          Same Glass Dark surface, shows on hover
        </p>
      </div>
    </div>
  ),
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

/**
 * Basic popover.
 */
export const Default: StoryObj = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Popover Title</PopoverTitle>
        <PopoverDescription>This is a description of the popover content.</PopoverDescription>
        <PopoverBody className="mt-3">
          <p className="text-sm text-white">
            Popover content goes here. You can add any content you want.
          </p>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * Popover with arrow.
 */
export const WithArrow: StoryObj = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">With Arrow</Button>
      </PopoverTrigger>
      <PopoverContent showArrow>
        <PopoverTitle>Arrow Popover</PopoverTitle>
        <PopoverDescription>This popover has an arrow pointing to the trigger.</PopoverDescription>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * Different positions.
 */
export const Positions: StoryObj = {
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top" showArrow>
          <PopoverTitle>Top</PopoverTitle>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" showArrow>
          <PopoverTitle>Bottom</PopoverTitle>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left" showArrow>
          <PopoverTitle>Left</PopoverTitle>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right" showArrow>
          <PopoverTitle>Right</PopoverTitle>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

/**
 * Alignment options.
 */
export const Alignment: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      {(['start', 'center', 'end'] as const).map((align) => (
        <Popover key={align}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="capitalize">{align}</Button>
          </PopoverTrigger>
          <PopoverContent align={align}>
            <PopoverTitle className="capitalize">{align} Aligned</PopoverTitle>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};

/**
 * Popover with footer actions.
 */
export const WithFooter: StoryObj = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Settings</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverTitle>Notification Settings</PopoverTitle>
        <PopoverDescription>Configure how you receive notifications.</PopoverDescription>
        <PopoverBody className="mt-3 space-y-3">
          {['Email', 'Push', 'SMS'].map((type) => (
            <label key={type} className="flex items-center justify-between">
              <span className="text-sm text-white">{type}</span>
              <input type="checkbox" defaultChecked={type === 'Email'} className="accent-[#FFD700]" />
            </label>
          ))}
        </PopoverBody>
        <PopoverFooter>
          <PopoverClose asChild>
            <Button variant="ghost" size="sm">Cancel</Button>
          </PopoverClose>
          <Button variant="primary" size="sm">Save</Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * Popover card with image.
 */
export const CardWithImage: StoryObj = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">User Info</Button>
      </PopoverTrigger>
      <PopoverCard
        title="Jane Smith"
        description="Product Designer at HIVE"
        image={
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
        }
        showClose
        footer={
          <>
            <Button variant="ghost" size="sm">Message</Button>
            <Button variant="primary" size="sm">Follow</Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          Member since 2024 • 12 spaces
        </p>
      </PopoverCard>
    </Popover>
  ),
};

/**
 * Form in popover.
 */
export const FormPopover: StoryObj = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Quick Add</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverTitle>Add Task</PopoverTitle>
        <PopoverDescription>Create a quick task.</PopoverDescription>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            placeholder="Task name"
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <select className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50">
            <option>High Priority</option>
            <option>Medium Priority</option>
            <option>Low Priority</option>
          </select>
        </div>
        <PopoverFooter>
          <PopoverClose asChild>
            <Button variant="ghost" size="sm">Cancel</Button>
          </PopoverClose>
          <Button variant="primary" size="sm">Add Task</Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * Hover card.
 */
export const HoverCardDemo: StoryObj = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#" className="text-[#4A9EFF] hover:underline">@johndoe</a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white">John Doe</h4>
            <p className="text-xs text-[var(--color-text-muted)]">@johndoe</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Software Engineer • Building cool stuff
            </p>
            <div className="flex gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
              <span><strong className="text-white">1.2k</strong> followers</span>
              <span><strong className="text-white">500</strong> following</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

/**
 * Hover card in context.
 */
export const HoverCardInContext: StoryObj = {
  render: () => (
    <p className="text-sm text-white">
      Check out this project by{' '}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="#" className="text-[#4A9EFF] hover:underline">@designer</a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <div>
              <h4 className="text-sm font-medium text-white">Sarah Designer</h4>
              <p className="text-xs text-[var(--color-text-muted)]">Product Designer</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>{' '}
      and{' '}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="#" className="text-[#4A9EFF] hover:underline">@developer</a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500" />
            <div>
              <h4 className="text-sm font-medium text-white">Mike Developer</h4>
              <p className="text-xs text-[var(--color-text-muted)]">Software Engineer</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
      .
    </p>
  ),
};

/**
 * Menu popover.
 */
export const MenuPopover: StoryObj = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1">
        <div className="space-y-0.5">
          {['Edit', 'Duplicate', 'Archive'].map((action) => (
            <button
              key={action}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
            >
              {action}
            </button>
          ))}
          <div className="h-px bg-[var(--color-border)] my-1" />
          <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#FF6B6B] hover:bg-white/10 transition-colors">
            Delete
          </button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * Controlled popover.
 */
export const Controlled: StoryObj = {
  render: function ControlledPopover() {
    const [open, setOpen] = React.useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="secondary">Toggle Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Controlled</PopoverTitle>
              <PopoverDescription>This popover is controlled via state.</PopoverDescription>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          State: {open ? 'Open' : 'Closed'}
        </p>
      </div>
    );
  },
};
