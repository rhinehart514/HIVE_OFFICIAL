'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Switch, SwitchField } from './Switch';
import * as React from 'react';

const meta: Meta<typeof Switch> = {
  title: 'Design System/Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/**
 * Default switch in unchecked state.
 */
export const Default: Story = {
  args: {},
};

/**
 * Switch in checked (on) state - gold track.
 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

/**
 * Small switch variant.
 */
export const Small: Story = {
  args: {
    size: 'sm',
  },
};

/**
 * Large switch variant.
 */
export const Large: Story = {
  args: {
    size: 'lg',
    defaultChecked: true,
  },
};

/**
 * Disabled switch states.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col items-center gap-2">
        <Switch disabled />
        <span className="text-xs text-[var(--color-text-muted)]">Off</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Switch disabled defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">On</span>
      </div>
    </div>
  ),
};

/**
 * Loading state with spinner.
 */
export const Loading: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col items-center gap-2">
        <Switch loading />
        <span className="text-xs text-[var(--color-text-muted)]">Saving...</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Switch loading defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">Saving...</span>
      </div>
    </div>
  ),
};

/**
 * All sizes comparison.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Switch size="sm" defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Switch size="default" defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Switch size="lg" defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">Large</span>
      </div>
    </div>
  ),
};

/**
 * Controlled switch with state.
 */
export const Controlled: Story = {
  render: function ControlledSwitch() {
    const [checked, setChecked] = React.useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <Switch checked={checked} onCheckedChange={setChecked} />
        <span className="text-sm text-white">
          State: {checked ? 'ON' : 'OFF'}
        </span>
      </div>
    );
  },
};

/**
 * Switch with label (left position).
 */
export const WithLabelLeft: StoryObj<typeof SwitchField> = {
  render: () => (
    <div className="w-80">
      <SwitchField
        label="Enable notifications"
        description="Receive updates when someone mentions you"
      />
    </div>
  ),
};

/**
 * Switch with label (right position).
 */
export const WithLabelRight: StoryObj<typeof SwitchField> = {
  render: () => (
    <div className="w-80">
      <SwitchField
        label="Dark mode"
        description="Use dark theme throughout the app"
        labelPosition="right"
        defaultChecked
      />
    </div>
  ),
};

/**
 * Switch field with error.
 */
export const WithError: StoryObj<typeof SwitchField> = {
  render: () => (
    <div className="w-80">
      <SwitchField
        label="Accept terms"
        description="You must accept the terms to continue"
        error="This field is required"
      />
    </div>
  ),
};

/**
 * Multiple switch settings.
 */
export const SettingsPanel: StoryObj = {
  render: function SettingsPanel() {
    const [settings, setSettings] = React.useState({
      notifications: true,
      emails: false,
      darkMode: true,
      analytics: false,
    });

    const updateSetting = (key: keyof typeof settings) => (value: boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
      <div className="w-96 space-y-4 p-4 rounded-xl border border-[var(--color-border)] bg-[#141414]">
        <h3 className="text-lg font-medium text-white mb-4">Settings</h3>

        <SwitchField
          label="Push notifications"
          description="Get notified about updates"
          checked={settings.notifications}
          onChange={updateSetting('notifications')}
        />

        <SwitchField
          label="Email digests"
          description="Receive weekly email summaries"
          checked={settings.emails}
          onChange={updateSetting('emails')}
        />

        <SwitchField
          label="Dark mode"
          description="Use dark theme"
          checked={settings.darkMode}
          onChange={updateSetting('darkMode')}
        />

        <SwitchField
          label="Analytics"
          description="Help improve the product"
          checked={settings.analytics}
          onChange={updateSetting('analytics')}
        />
      </div>
    );
  },
};

/**
 * Interactive demo showing toggle animation.
 */
export const Interactive: Story = {
  render: function InteractiveSwitch() {
    const [checked, setChecked] = React.useState(false);

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-4xl mb-2">{checked ? '🌙' : '☀️'}</div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {checked ? 'Dark Mode' : 'Light Mode'}
          </div>
        </div>
        <Switch
          size="lg"
          checked={checked}
          onCheckedChange={setChecked}
        />
      </div>
    );
  },
};
