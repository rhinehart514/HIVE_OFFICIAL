import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';
import { Label } from './Label';
import { Text } from './Text';

/**
 * Checkbox — Selection control
 *
 * White check mark on checked state.
 * Focus ring is WHITE, never gold.
 *
 * @see docs/design-system/PRIMITIVES.md (Checkbox)
 */
const meta: Meta<typeof Checkbox> = {
  title: 'Design System/Primitives/Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Checkbox with WHITE check mark and WHITE focus ring (never gold).',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Checkbox size',
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
type Story = StoryObj<typeof Checkbox>;

/**
 * Default — Unchecked
 */
export const Default: Story = {
  args: {},
};

/**
 * Checked
 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="sm" defaultChecked />
        <Text size="xs" tone="muted">16px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="default" defaultChecked />
        <Text size="xs" tone="muted">20px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="lg" defaultChecked />
        <Text size="xs" tone="muted">24px</Text>
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
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="cursor-pointer">
        I agree to the terms and conditions
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
        <Checkbox id="disabled-unchecked" disabled />
        <Label htmlFor="disabled-unchecked" className="opacity-50">
          Disabled unchecked
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked" className="opacity-50">
          Disabled checked
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
        Tab to see WHITE focus ring (never gold):
      </Text>
      <div className="flex items-center gap-3">
        <Checkbox id="focus-demo" />
        <Label htmlFor="focus-demo" className="cursor-pointer">
          Focus me
        </Label>
      </div>
    </div>
  ),
};

/**
 * In context — Settings options
 */
export const SettingsContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <Text weight="medium">Notification Settings</Text>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Checkbox id="email-notif" defaultChecked />
          <div className="flex flex-col">
            <Label htmlFor="email-notif" className="cursor-pointer">
              Email notifications
            </Label>
            <Text size="xs" tone="muted">
              Receive updates via email
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox id="push-notif" defaultChecked />
          <div className="flex flex-col">
            <Label htmlFor="push-notif" className="cursor-pointer">
              Push notifications
            </Label>
            <Text size="xs" tone="muted">
              Receive push alerts
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox id="marketing" />
          <div className="flex flex-col">
            <Label htmlFor="marketing" className="cursor-pointer">
              Marketing emails
            </Label>
            <Text size="xs" tone="muted">
              Receive product updates
            </Text>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * In context — Task list
 */
export const TaskListContext: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Text weight="medium" className="mb-2">Today&apos;s Tasks</Text>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <Checkbox id="task-1" defaultChecked />
        <Label
          htmlFor="task-1"
          className="cursor-pointer line-through text-[var(--color-text-muted)]"
        >
          Review design system
        </Label>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <Checkbox id="task-2" defaultChecked />
        <Label
          htmlFor="task-2"
          className="cursor-pointer line-through text-[var(--color-text-muted)]"
        >
          Build primitives
        </Label>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <Checkbox id="task-3" />
        <Label htmlFor="task-3" className="cursor-pointer">
          Write Storybook stories
        </Label>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <Checkbox id="task-4" />
        <Label htmlFor="task-4" className="cursor-pointer">
          Test components
        </Label>
      </div>
    </div>
  ),
};
