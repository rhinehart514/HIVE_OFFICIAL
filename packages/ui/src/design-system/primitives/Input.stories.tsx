import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Label } from './Label';
import { Text } from './Text';

/**
 * Input — Text input primitive
 *
 * Focus uses border brightening only (no ring).
 * Supports error state with red border.
 *
 * @see docs/design-system/PRIMITIVES.md (Input)
 */
const meta: Meta<typeof Input> = {
  title: 'Design System/Primitives/Inputs/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Text input with border-only focus treatment (no focus ring). Supports error and disabled states.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Input size',
    },
    error: {
      control: 'boolean',
      description: 'Error state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

/**
 * Default — Standard text input
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter your email...',
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <Text size="xs" tone="muted" className="mb-1">Small</Text>
        <Input size="sm" placeholder="Small input" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Default</Text>
        <Input size="default" placeholder="Default input" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Large</Text>
        <Input size="lg" placeholder="Large input" />
      </div>
    </div>
  ),
};

/**
 * Error state — Red border
 */
export const ErrorState: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="email-error">Email</Label>
      <Input
        id="email-error"
        placeholder="Enter your email..."
        error
        defaultValue="invalid@"
      />
      <Text size="xs" className="text-[var(--color-status-error)]">
        Please enter a valid email address
      </Text>
    </div>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Cannot edit...',
    defaultValue: 'Disabled input',
  },
};

/**
 * Focus state — Border brightens on focus
 */
export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Text size="sm" tone="muted">
        Tab to see the border brighten on focus (no ring):
      </Text>
      <Input placeholder="Focus me to see brighter border" />
    </div>
  ),
};

/**
 * Text size — 15px on default and large
 */
export const TextSize15px: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <Text size="xs" tone="muted" className="mb-1">Default (15px)</Text>
        <Input size="default" defaultValue="15px text size" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Large (15px)</Text>
        <Input size="lg" defaultValue="Also 15px text size" />
      </div>
    </div>
  ),
};

/**
 * Input types
 */
export const InputTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <Label htmlFor="text-type" className="mb-1">Text</Label>
        <Input id="text-type" type="text" placeholder="Text input" />
      </div>
      <div>
        <Label htmlFor="email-type" className="mb-1">Email</Label>
        <Input id="email-type" type="email" placeholder="email@example.com" />
      </div>
      <div>
        <Label htmlFor="password-type" className="mb-1">Password</Label>
        <Input id="password-type" type="password" placeholder="Enter password" />
      </div>
      <div>
        <Label htmlFor="number-type" className="mb-1">Number</Label>
        <Input id="number-type" type="number" placeholder="0" />
      </div>
      <div>
        <Label htmlFor="search-type" className="mb-1">Search</Label>
        <Input id="search-type" type="search" placeholder="Search..." />
      </div>
    </div>
  ),
};

/**
 * In context — Form field
 */
export const FormFieldContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div className="flex flex-col gap-2">
        <Label htmlFor="handle">Handle</Label>
        <Input id="handle" placeholder="@yourhandle" />
        <Text size="xs" tone="muted">
          This will be your public username
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Input id="bio" placeholder="Tell us about yourself" />
      </div>
    </div>
  ),
};

/**
 * In context — Search header
 */
export const SearchHeaderContext: Story = {
  render: () => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] w-96">
      <svg
        className="w-5 h-5 text-[var(--color-text-muted)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        placeholder="Search spaces..."
        className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
      />
      <kbd className="px-2 py-1 rounded bg-[var(--color-bg-page)] text-[var(--color-text-muted)] text-xs font-mono">
        ⌘K
      </kbd>
    </div>
  ),
};
