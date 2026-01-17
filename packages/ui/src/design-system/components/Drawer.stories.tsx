'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from './Drawer';
import { Button } from '../primitives';
import * as React from 'react';

/**
 * Drawer - LOCKED: January 11, 2026
 *
 * LOCKED DECISIONS:
 * - Overlay: 60% black (`bg-black/60`) - matches Sheet/Modal
 * - Panel: Apple Glass Dark (gradient surface, inset highlight, deep shadow)
 * - Timing: 300ms slide animation - matches Sheet
 * - Handle: Pill style (`w-10 h-1 rounded-full bg-white/30`) for bottom drawer
 * - Focus: WHITE ring (`ring-white/50`), never gold
 *
 * Slide-out panel from screen edge.
 */
const meta: Meta = {
  title: 'Design System/Components/Drawer',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 11, 2026**

Drawer provides slide-out panels from any screen edge.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Overlay | 60% black | Consistent with Sheet/Modal |
| Panel surface | Apple Glass Dark | Premium glass morphism |
| Animation | 300ms slide | Smooth without feeling slow |
| Handle | Pill style | Clear affordance for bottom drawer |
| Focus ring | WHITE (\`ring-white/50\`) | Consistent focus treatment |
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 min-h-[600px] bg-[var(--color-bg-page)]">
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
 * This showcases the canonical Drawer patterns:
 * - 60% overlay with backdrop blur
 * - Apple Glass Dark panel surface
 * - 300ms slide animation
 * - Pill handle for bottom drawers
 */
export const LockedDesignShowcase: StoryObj = {
  name: '⭐ Locked Design',
  render: () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-lg font-medium text-white">Drawer - LOCKED</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          January 11, 2026 • 60% overlay, Apple Glass Dark, 300ms slide, Pill handle
        </p>
      </div>

      {/* Demo Buttons */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="primary">Right Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Apple Glass Dark Surface</DrawerTitle>
                <DrawerDescription>
                  gradient bg, inset highlight, deep shadow
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody>
                <div className="space-y-4">
                  <p className="text-sm text-white">
                    Notice the subtle gradient and inset shadow at the top.
                  </p>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">CSS Applied:</p>
                    <code className="text-xs text-white/60">
                      background: linear-gradient(135deg, rgba(28,28,28,0.98), rgba(18,18,18,0.95))
                    </code>
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="ghost">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Bottom with Handle</Button>
            </DrawerTrigger>
            <DrawerContent side="bottom" showHandle>
              <DrawerHeader>
                <DrawerTitle>Mobile Bottom Sheet</DrawerTitle>
                <DrawerDescription>Pill handle for swipe affordance</DrawerDescription>
              </DrawerHeader>
              <DrawerBody>
                <p className="text-sm text-white mb-4">
                  The pill handle (w-10 h-1 rounded-full bg-white/30) indicates this can be swiped.
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {['Share', 'Copy', 'Edit', 'Delete'].map((action) => (
                    <button
                      key={action}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-lg">{action[0]}</span>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">{action}</span>
                    </button>
                  ))}
                </div>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </div>

        <p className="text-xs text-white/40">
          300ms animation • 60% overlay with backdrop-blur-sm • White focus ring
        </p>
      </div>
    </div>
  ),
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

/**
 * Default drawer from right.
 */
export const Default: StoryObj = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer Title</DrawerTitle>
          <DrawerDescription>This drawer slides in from the right.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <p className="text-sm text-white">
            Drawer content goes here. You can add any content you want.
          </p>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DrawerClose>
          <Button variant="primary">Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * Drawer from left.
 */
export const FromLeft: StoryObj = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">From Left</Button>
      </DrawerTrigger>
      <DrawerContent side="left">
        <DrawerHeader>
          <DrawerTitle>Navigation</DrawerTitle>
          <DrawerDescription>Main menu</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <nav className="space-y-2">
            {['Home', 'Profile', 'Spaces', 'Tools', 'Settings'].map((item) => (
              <a
                key={item}
                href="#"
                className="block px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * Drawer from bottom (mobile sheet).
 */
export const FromBottom: StoryObj = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">From Bottom</Button>
      </DrawerTrigger>
      <DrawerContent side="bottom" showHandle>
        <DrawerHeader>
          <DrawerTitle>Share</DrawerTitle>
          <DrawerDescription>Share this content with others</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="grid grid-cols-4 gap-4">
            {['Twitter', 'Facebook', 'LinkedIn', 'Copy Link'].map((service) => (
              <button
                key={service}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
                  <span className="text-lg">{service[0]}</span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">{service}</span>
              </button>
            ))}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * Drawer from top.
 */
export const FromTop: StoryObj = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">From Top</Button>
      </DrawerTrigger>
      <DrawerContent side="top" size="sm">
        <DrawerBody className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
              <span className="text-[#FFD700]">🎉</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Congratulations!</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                You&apos;ve earned a new achievement.
              </p>
            </div>
            <DrawerClose className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </DrawerClose>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * Small drawer.
 */
export const Small: StoryObj = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Small Drawer</Button>
      </DrawerTrigger>
      <DrawerContent size="sm">
        <DrawerHeader>
          <DrawerTitle>Quick Actions</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-2">
            {['Edit', 'Duplicate', 'Archive', 'Delete'].map((action) => (
              <button
                key={action}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * Large drawer.
 */
export const Large: StoryObj = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Large Drawer</Button>
      </DrawerTrigger>
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerTitle>User Details</DrawerTitle>
          <DrawerDescription>View and edit user information</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <div>
                <h3 className="text-lg font-medium text-white">John Doe</h3>
                <p className="text-sm text-[var(--color-text-muted)]">john@example.com</p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="p-4 rounded-lg border border-[var(--color-border)]">
                <h4 className="text-sm font-medium text-white mb-2">About</h4>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Software engineer interested in AI and distributed systems.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-[var(--color-border)]">
                <h4 className="text-sm font-medium text-white mb-2">Activity</h4>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Member of 5 spaces • Created 12 tools
                </p>
              </div>
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="ghost">Close</Button>
          </DrawerClose>
          <Button variant="primary">Edit Profile</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * Form drawer.
 */
export const FormDrawer: StoryObj = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Add Member</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Invite Member</DrawerTitle>
          <DrawerDescription>Add a new member to your space</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Email</label>
            <input
              type="email"
              placeholder="Enter email address"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Role</label>
            <select className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50">
              <option>Member</option>
              <option>Moderator</option>
              <option>Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Message (optional)</label>
            <textarea
              placeholder="Add a personal message"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
            />
          </div>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DrawerClose>
          <Button variant="primary">Send Invite</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * Drawer without close button.
 */
export const NoCloseButton: StoryObj = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">No Close Button</Button>
      </DrawerTrigger>
      <DrawerContent showClose={false}>
        <DrawerHeader>
          <DrawerTitle>Confirm Action</DrawerTitle>
          <DrawerDescription>Please confirm your choice</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <p className="text-sm text-white">
            This drawer doesn&apos;t have a close button. Use the action buttons below.
          </p>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DrawerClose>
          <Button variant="primary">Confirm</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

/**
 * All sides comparison.
 */
export const AllSides: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(['right', 'left', 'bottom', 'top'] as const).map((side) => (
        <Drawer key={side}>
          <DrawerTrigger asChild>
            <Button variant="secondary" className="capitalize">{side}</Button>
          </DrawerTrigger>
          <DrawerContent side={side} showHandle={side === 'bottom'}>
            <DrawerHeader>
              <DrawerTitle className="capitalize">{side} Drawer</DrawerTitle>
              <DrawerDescription>This drawer opens from the {side}</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <p className="text-sm text-white">Drawer content here.</p>
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="ghost">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  ),
};

/**
 * All sizes comparison.
 */
export const AllSizes: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(['sm', 'default', 'lg', 'xl'] as const).map((size) => (
        <Drawer key={size}>
          <DrawerTrigger asChild>
            <Button variant="secondary" className="uppercase">{size}</Button>
          </DrawerTrigger>
          <DrawerContent size={size}>
            <DrawerHeader>
              <DrawerTitle className="uppercase">{size} Drawer</DrawerTitle>
              <DrawerDescription>Size: {size}</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <p className="text-sm text-white">This drawer has size &quot;{size}&quot;.</p>
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="ghost">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  ),
};
