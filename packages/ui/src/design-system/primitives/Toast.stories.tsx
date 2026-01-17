import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastContainer } from './Toast';
import { Button } from './Button';
import { Text } from './Text';

/**
 * Toast — Pill notifications
 *
 * 5 variants: default, success, error, warning, info.
 * Use with sonner or similar for auto-dismiss.
 *
 * @see docs/design-system/PRIMITIVES.md (Toast)
 */
const meta: Meta<typeof Toast> = {
  title: 'Design System/Primitives/Feedback/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Pill notification with 5 variants. Integrates with toast libraries like sonner.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning', 'info'],
      description: 'Toast variant',
    },
    title: {
      control: 'text',
      description: 'Toast title',
    },
    description: {
      control: 'text',
      description: 'Toast description',
    },
    showIcon: {
      control: 'boolean',
      description: 'Show variant icon',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

/**
 * Default — Neutral notification
 */
export const Default: Story = {
  args: {
    title: 'Notification',
    description: 'This is a default toast notification.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

/**
 * Success — Confirmation
 */
export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Space created',
    description: 'Your new space is ready to use.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

/**
 * Error — Something went wrong
 */
export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Failed to save',
    description: 'Please check your connection and try again.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

/**
 * Warning — Caution
 */
export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Storage almost full',
    description: 'You have used 90% of your available storage.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

/**
 * Info — Informational
 */
export const Info: Story = {
  args: {
    variant: 'info',
    title: 'New feature available',
    description: 'Check out the new dark mode toggle in settings.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-96">
      <Toast title="Default" description="A neutral notification" />
      <Toast variant="success" title="Success" description="Operation completed" />
      <Toast variant="error" title="Error" description="Something went wrong" />
      <Toast variant="warning" title="Warning" description="Proceed with caution" />
      <Toast variant="info" title="Info" description="Here's some information" />
    </div>
  ),
};

/**
 * With action button
 */
export const WithAction: Story = {
  render: () => (
    <div className="w-96">
      <Toast
        variant="info"
        title="Update available"
        description="A new version is ready to install."
        action={
          <Button size="sm" variant="secondary">
            Update
          </Button>
        }
      />
    </div>
  ),
};

/**
 * With close button
 */
export const WithClose: Story = {
  render: () => (
    <div className="w-96">
      <Toast
        variant="success"
        title="Changes saved"
        description="Your profile has been updated."
        onClose={() => console.log('Toast closed')}
      />
    </div>
  ),
};

/**
 * Without icon
 */
export const WithoutIcon: Story = {
  args: {
    title: 'Simple toast',
    description: 'This toast has no icon.',
    showIcon: false,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

/**
 * Title only
 */
export const TitleOnly: Story = {
  args: {
    variant: 'success',
    title: 'Copied to clipboard!',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

/**
 * In context — Stacked toasts
 */
export const StackedContext: Story = {
  render: () => (
    <div className="relative h-[400px] w-[500px] bg-[var(--color-bg-page)] rounded-xl border border-[var(--color-border)]">
      <div className="p-6">
        <Text>Main content area</Text>
      </div>
      <ToastContainer position="bottom-right">
        <Toast
          variant="success"
          title="Member added"
          description="Jane joined the space"
          onClose={() => {}}
        />
        <Toast
          variant="info"
          title="New message"
          description="You have 3 unread messages"
          onClose={() => {}}
        />
      </ToastContainer>
    </div>
  ),
};

/**
 * In context — Action required
 */
export const ActionRequiredContext: Story = {
  render: () => (
    <div className="w-96">
      <Toast
        variant="warning"
        title="Session expiring"
        description="Your session will expire in 5 minutes."
        action={
          <Button size="sm">
            Stay signed in
          </Button>
        }
        onClose={() => {}}
      />
    </div>
  ),
};

/**
 * In context — Undo action
 */
export const UndoContext: Story = {
  render: () => (
    <div className="w-96">
      <Toast
        title="Message deleted"
        description="The message has been removed."
        action={
          <Button size="sm" variant="ghost">
            Undo
          </Button>
        }
        onClose={() => {}}
      />
    </div>
  ),
};

/**
 * Position variants
 */
export const Positions: Story = {
  render: () => (
    <div className="relative h-[400px] w-[600px] bg-[var(--color-bg-page)] rounded-xl border border-[var(--color-border)]">
      <div className="absolute top-4 right-4">
        <Toast
          variant="success"
          title="Top right"
          className="w-56"
        />
      </div>
      <div className="absolute top-4 left-4">
        <Toast
          variant="info"
          title="Top left"
          className="w-56"
        />
      </div>
      <div className="absolute bottom-4 right-4">
        <Toast
          variant="warning"
          title="Bottom right"
          className="w-56"
        />
      </div>
      <div className="absolute bottom-4 left-4">
        <Toast
          variant="error"
          title="Bottom left"
          className="w-56"
        />
      </div>
    </div>
  ),
};
