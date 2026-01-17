import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';
import { Label } from './Label';
import { Text } from './Text';

/**
 * Switch — Toggle control
 *
 * GOLD track when on — one of the few places gold is allowed!
 * Focus ring is WHITE, never gold.
 *
 * @see docs/design-system/PRIMITIVES.md (Switch)
 */
const meta: Meta<typeof Switch> = {
  title: 'Design System/Primitives/Inputs/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toggle switch with GOLD track when on (one of few allowed gold uses). WHITE focus ring.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Switch size',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/**
 * Default — Off state
 */
export const Default: Story = {
  args: {},
};

/**
 * Checked — GOLD track
 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '✨ GOLD TRACK: Switch is one of the few components where gold is allowed.',
      },
    },
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Switch size="sm" defaultChecked />
        <Text size="xs" tone="muted">Small</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Switch size="default" defaultChecked />
        <Text size="xs" tone="muted">Default</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Switch size="lg" defaultChecked />
        <Text size="xs" tone="muted">Large</Text>
      </div>
    </div>
  ),
};

/**
 * With label
 */
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="notifications" />
      <Label htmlFor="notifications" className="cursor-pointer">
        Enable notifications
      </Label>
    </div>
  ),
};

/**
 * Disabled states
 */
export const DisabledStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off" className="opacity-50">
          Disabled off
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on" className="opacity-50">
          Disabled on
        </Label>
      </div>
    </div>
  ),
};

/**
 * Focus state — WHITE ring (never gold)
 */
export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size="sm" tone="muted">
        Tab to see WHITE focus ring (never gold, even when switch is gold):
      </Text>
      <div className="flex items-center gap-3">
        <Switch id="focus-demo" defaultChecked />
        <Label htmlFor="focus-demo" className="cursor-pointer">
          Focus me (gold track, white ring)
        </Label>
      </div>
    </div>
  ),
};

/**
 * In context — Settings row
 */
export const SettingsRowContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <Text weight="medium">Privacy Settings</Text>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Label htmlFor="profile-visible" className="cursor-pointer">
              Profile visible
            </Label>
            <Text size="xs" tone="muted">
              Others can see your profile
            </Text>
          </div>
          <Switch id="profile-visible" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Label htmlFor="online-status" className="cursor-pointer">
              Show online status
            </Label>
            <Text size="xs" tone="muted">
              Display when you&apos;re active
            </Text>
          </div>
          <Switch id="online-status" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Label htmlFor="ghost-mode" className="cursor-pointer">
              Ghost mode
            </Label>
            <Text size="xs" tone="muted">
              Browse anonymously
            </Text>
          </div>
          <Switch id="ghost-mode" />
        </div>
      </div>
    </div>
  ),
};

/**
 * Gold budget note
 */
export const GoldBudgetNote: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <Switch defaultChecked />
        <Text weight="medium">Gold in Switch</Text>
      </div>
      <Text size="sm" tone="secondary">
        The Switch component is one of the few places where gold is permitted in
        the design system. Other allowed gold uses:
      </Text>
      <ul className="text-sm text-[var(--color-text-muted)] list-disc list-inside space-y-1">
        <li>PresenceDot (always gold when online)</li>
        <li>Button CTA variant (1% rule)</li>
        <li>LiveCounter numbers</li>
        <li>Achievement badges</li>
      </ul>
      <Text size="xs" tone="muted">
        Total gold budget: 1-2% of the interface
      </Text>
    </div>
  ),
};
