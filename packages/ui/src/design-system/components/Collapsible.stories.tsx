'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  SimpleCollapsible,
  CollapsibleCard,
} from './Collapsible';
import { Button } from '../primitives';
import * as React from 'react';

const meta: Meta = {
  title: 'Design System/Components/Collapsible',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

/**
 * Default collapsible with card-style trigger.
 */
export const Default: StoryObj = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger>Advanced Options</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-white">Enable Notifications</span>
              <input type="checkbox" className="accent-[#FFD700]" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-white">Dark Mode</span>
              <input type="checkbox" defaultChecked className="accent-[#FFD700]" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-white">Auto-save</span>
              <input type="checkbox" className="accent-[#FFD700]" />
            </label>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Ghost variant with minimal styling.
 */
export const Ghost: StoryObj = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger variant="ghost">Show more details</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 text-sm text-[var(--color-text-muted)]">
          <p>
            These are the additional details that were hidden. The ghost variant
            is useful for inline content reveals where a card wrapper would be too heavy.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Inline variant for text-style toggles.
 */
export const Inline: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        HIVE combines community, creation, and connection into one platform.
      </p>
      <Collapsible>
        <CollapsibleTrigger variant="inline">Learn more about HIVE</CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 text-sm text-[var(--color-text-muted)]">
            <p>
              HIVE is student autonomy infrastructure that gives you the tools to
              organize, create, and connect on your own terms.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};

/**
 * Plus/minus icon style.
 */
export const PlusMinus: StoryObj = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger iconType="plus-minus">Additional Information</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
          This uses a plus/minus toggle instead of a chevron.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Custom trigger with button.
 */
export const CustomTrigger: StoryObj = {
  render: function CustomTriggerDemo() {
    const [open, setOpen] = React.useState(false);

    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="secondary" size="sm">
            {open ? 'Hide Details' : 'Show Details'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
            Custom trigger using a button component.
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

/**
 * Default open state.
 */
export const DefaultOpen: StoryObj = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Expanded by Default</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
          This content is visible by default.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Disabled state.
 */
export const Disabled: StoryObj = {
  render: () => (
    <Collapsible disabled>
      <CollapsibleTrigger disabled className="opacity-50 cursor-not-allowed">
        Disabled Section
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
          This content cannot be accessed.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * SimpleCollapsible pre-composed component.
 */
export const Simple: StoryObj = {
  render: () => (
    <SimpleCollapsible label="Show Options">
      <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
        Simple collapsible with a label prop.
      </div>
    </SimpleCollapsible>
  ),
};

/**
 * SimpleCollapsible variants.
 */
export const SimpleVariants: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <SimpleCollapsible label="Default Variant">
        <div className="p-3 rounded-lg bg-black/20 text-sm text-[var(--color-text-muted)]">
          Default card-style wrapper.
        </div>
      </SimpleCollapsible>

      <SimpleCollapsible variant="ghost" label="Ghost Variant">
        <div className="p-3 rounded-lg bg-[var(--color-bg-elevated)] text-sm text-[var(--color-text-muted)]">
          Minimal ghost styling.
        </div>
      </SimpleCollapsible>

      <SimpleCollapsible variant="inline" label="Inline Variant">
        <div className="p-3 text-sm text-[var(--color-text-muted)]">
          Link-style inline toggle.
        </div>
      </SimpleCollapsible>
    </div>
  ),
};

/**
 * CollapsibleCard with header.
 */
export const Card: StoryObj = {
  render: () => (
    <CollapsibleCard
      title="Privacy Settings"
      description="Control who can see your profile"
      icon="🔒"
    >
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-sm text-white">Profile visible</span>
          <input type="checkbox" defaultChecked className="accent-[#FFD700]" />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-white">Show activity</span>
          <input type="checkbox" className="accent-[#FFD700]" />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-white">Allow messages</span>
          <input type="checkbox" defaultChecked className="accent-[#FFD700]" />
        </label>
      </div>
    </CollapsibleCard>
  ),
};

/**
 * Multiple CollapsibleCards stacked.
 */
export const CardStack: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <CollapsibleCard title="Account" description="Manage your account details" icon="👤">
        <div className="text-sm text-[var(--color-text-muted)]">
          Email, password, and account security settings.
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Notifications" description="Control your alerts" icon="🔔" defaultOpen>
        <div className="text-sm text-[var(--color-text-muted)]">
          Configure email, push, and in-app notifications.
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Appearance" description="Customize the look" icon="🎨">
        <div className="text-sm text-[var(--color-text-muted)]">
          Theme, colors, and display preferences.
        </div>
      </CollapsibleCard>
    </div>
  ),
};

/**
 * Nested collapsibles.
 */
export const Nested: StoryObj = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Parent Section</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            This is the parent content.
          </p>
          <Collapsible>
            <CollapsibleTrigger variant="ghost" iconType="plus-minus">
              Nested Section
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-3 rounded-lg bg-black/20 text-sm text-[var(--color-text-muted)]">
                This is nested collapsible content.
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Controlled collapsible.
 */
export const Controlled: StoryObj = {
  render: function ControlledDemo() {
    const [open, setOpen] = React.useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            Open
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          State: {open ? 'Open' : 'Closed'}
        </p>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger>Controlled Section</CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
              This collapsible is controlled by external state.
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
};

/**
 * Show more pattern.
 */
export const ShowMore: StoryObj = {
  render: () => (
    <div className="space-y-4 text-sm text-[var(--color-text-muted)]">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua.
      </p>
      <Collapsible>
        <CollapsibleTrigger variant="inline" hideIcon>
          Show more ↓
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="mt-2">
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit
            in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};
