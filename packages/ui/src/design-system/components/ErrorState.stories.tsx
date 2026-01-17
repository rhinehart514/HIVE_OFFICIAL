import type { Meta, StoryObj } from '@storybook/react';
import { ErrorState, ErrorStatePresets } from './ErrorState';
import { Card } from '../primitives';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ERRORSTATE VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Displays error messages with optional retry action.
 *
 * VARIANTS:
 * 1. Full: Page-level centered error with icon, title, description, actions
 * 2. Inline: Component-level horizontal error bar
 * 3. Toast: Notification-style with dismiss button
 *
 * SEVERITY COLORS:
 * - error (red): #FF6B6B - Critical failures
 * - warning (amber): #FFA500 - Non-blocking issues
 * - info (blue): #4A9EFF - Informational notices
 *
 * FEATURES:
 * - Collapsible technical details section
 * - Error code display
 * - Retry action button
 * - Secondary action option
 * - Presets for common error types
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof ErrorState> = {
  title: 'Design System/Components/Feedback/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays error messages with optional retry action.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['full', 'inline', 'toast'],
    },
    severity: {
      control: 'select',
      options: ['error', 'warning', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

/**
 * Default — Basic error
 */
export const Default: Story = {
  args: {
    title: 'Something went wrong',
    description: "We couldn't load this content. Please try again.",
  },
};

/**
 * With retry action
 */
export const WithRetry: Story = {
  args: {
    title: 'Failed to load messages',
    description: 'There was a problem loading the messages.',
    onRetry: () => alert('Retrying...'),
  },
};

/**
 * With technical details
 */
export const WithDetails: Story = {
  args: {
    title: 'Connection failed',
    description: "We couldn't connect to the server.",
    code: 'NETWORK_ERROR',
    details: 'Error: ECONNREFUSED - Connection refused at 127.0.0.1:3000. The server may be down or the network is unreachable.',
    onRetry: () => alert('Retrying...'),
    showDetails: true,
  },
};

/**
 * Inline variant
 */
export const Inline: Story = {
  render: () => (
    <Card className="w-[500px] p-0">
      <ErrorState
        variant="inline"
        title="Failed to save changes"
        description="Your changes could not be saved"
        onRetry={() => alert('Retrying...')}
      />
    </Card>
  ),
};

/**
 * Toast variant
 */
export const Toast: Story = {
  render: () => (
    <div className="w-[400px]">
      <ErrorState
        variant="toast"
        title="Failed to send message"
        description="Your message has been saved as a draft"
        onRetry={() => alert('Retrying...')}
        onDismiss={() => alert('Dismissed')}
      />
    </div>
  ),
};

/**
 * Warning severity
 */
export const Warning: Story = {
  args: {
    severity: 'warning',
    title: 'Slow connection detected',
    description: 'Your connection is slow. Some features may be delayed.',
    onRetry: () => alert('Retrying...'),
    retryLabel: 'Reconnect',
  },
};

/**
 * Info severity
 */
export const Info: Story = {
  args: {
    severity: 'info',
    title: 'Maintenance scheduled',
    description: 'The system will be unavailable for maintenance on Sunday 2am-4am EST.',
    secondaryAction: {
      label: 'Learn More',
      onClick: () => alert('Learn more'),
    },
  },
};

/**
 * All severities — Inline
 */
export const AllSeveritiesInline: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[500px]">
      <ErrorState
        variant="inline"
        severity="error"
        title="Error: Connection failed"
        description="Unable to connect to server"
      />
      <ErrorState
        variant="inline"
        severity="warning"
        title="Warning: Slow connection"
        description="Some features may be delayed"
      />
      <ErrorState
        variant="inline"
        severity="info"
        title="Info: Maintenance scheduled"
        description="Sunday 2am-4am EST"
      />
    </div>
  ),
};

/**
 * All severities — Toast
 */
export const AllSeveritiesToast: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[400px]">
      <ErrorState
        variant="toast"
        severity="error"
        title="Failed to save"
        onDismiss={() => {}}
      />
      <ErrorState
        variant="toast"
        severity="warning"
        title="Connection unstable"
        onDismiss={() => {}}
      />
      <ErrorState
        variant="toast"
        severity="info"
        title="Update available"
        onDismiss={() => {}}
      />
    </div>
  ),
};

/**
 * Preset: Network error
 */
export const PresetNetworkError: Story = {
  args: {
    ...ErrorStatePresets.networkError,
    onRetry: () => alert('Retrying...'),
  },
};

/**
 * Preset: Server error
 */
export const PresetServerError: Story = {
  args: {
    ...ErrorStatePresets.serverError,
    onRetry: () => alert('Retrying...'),
  },
};

/**
 * Preset: Not found
 */
export const PresetNotFound: Story = {
  args: {
    ...ErrorStatePresets.notFound,
    secondaryAction: {
      label: 'Go Home',
      onClick: () => alert('Going home'),
    },
  },
};

/**
 * Preset: Unauthorized
 */
export const PresetUnauthorized: Story = {
  args: {
    ...ErrorStatePresets.unauthorized,
    secondaryAction: {
      label: 'Sign In',
      onClick: () => alert('Sign in'),
    },
  },
};

/**
 * Custom icon
 */
export const CustomIcon: Story = {
  args: {
    title: 'Payment failed',
    description: 'Your payment could not be processed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth={2} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    onRetry: () => alert('Retry payment'),
    retryLabel: 'Try Again',
    secondaryAction: {
      label: 'Use Different Card',
      onClick: () => alert('Change card'),
    },
  },
};

/**
 * In context — Page error
 */
export const PageContext: Story = {
  render: () => (
    <Card className="w-[600px] h-[400px] flex items-center justify-center">
      <ErrorState
        title="Failed to load space"
        description="We couldn't load this space. It may have been deleted or you don't have access."
        code={404}
        onRetry={() => alert('Retrying...')}
        secondaryAction={{
          label: 'Browse Spaces',
          onClick: () => alert('Browse'),
        }}
      />
    </Card>
  ),
};

/**
 * In context — Component error
 */
export const ComponentContext: Story = {
  render: () => (
    <Card className="w-[400px]">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h3 className="font-medium">Recent Activity</h3>
      </div>
      <ErrorState
        variant="inline"
        title="Failed to load activity"
        onRetry={() => alert('Retrying...')}
      />
    </Card>
  ),
};
