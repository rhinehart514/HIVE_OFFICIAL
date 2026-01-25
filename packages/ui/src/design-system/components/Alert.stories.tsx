'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription, InlineAlert } from './Alert';
import { Button } from '../primitives';
import * as React from 'react';

/**
 * Alert - LOCKED: January 11, 2026
 *
 * LOCKED DECISIONS:
 * - Border: Full border (consistent with Card pattern)
 * - Background tint: 10% opacity (subtle, doesn't overwhelm)
 * - Colors: Semantic variants (default, success, warning, error, gold)
 * - Gold: Reserved for achievements/special moments only
 * - Radius: rounded-xl (12px)
 *
 * Static alert/notification boxes.
 */
const meta: Meta<typeof Alert> = {
  title: 'Design System/Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 11, 2026**

Alert provides static notification boxes with semantic color variants.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Border | Full border | Consistent with Card pattern |
| Background tint | 10% opacity | Subtle, doesn't overwhelm |
| Colors | Semantic variants | Clear meaning (success, warning, error) |
| Gold variant | Achievements only | Reserved for special moments |
| Radius | rounded-xl (12px) | Consistent with design system |
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Alert>;

// =============================================================================
// LOCKED DESIGN SHOWCASE
// =============================================================================

/**
 * **LOCKED DESIGN** - The final approved visual treatment
 *
 * This showcases the canonical Alert patterns:
 * - Full border (consistent with Card)
 * - 10% background tint
 * - Semantic color variants
 * - Gold for achievements only
 */
export const LockedDesignShowcase: StoryObj = {
  name: '⭐ Locked Design',
  render: () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-lg font-medium text-white">Alert - LOCKED</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          January 11, 2026 • Full border, 10% tint, Semantic colors, Gold for achievements
        </p>
      </div>

      {/* Semantic Variants */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Semantic Variants
          </span>
          <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
            10% tint + full border
          </span>
        </div>
        <div className="space-y-3">
          <Alert variant="default" title="Information">
            Neutral message for general information.
          </Alert>
          <Alert variant="success" title="Success">
            Operation completed successfully.
          </Alert>
          <Alert variant="warning" title="Warning">
            Please review before continuing.
          </Alert>
          <Alert variant="error" title="Error">
            Something went wrong.
          </Alert>
        </div>
      </div>

      {/* Gold Variant */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Gold (Achievements Only)
          </span>
          <span className="text-label-xs text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
            Reserved for special moments
          </span>
        </div>
        <Alert variant="gold" title="Achievement Unlocked">
          You&apos;ve earned a new badge!
        </Alert>
        <p className="text-xs text-white/40">
          Gold variant is ONLY for achievements, rewards, and special celebrations
        </p>
      </div>

      {/* Accent Border */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            With Accent Border
          </span>
        </div>
        <div className="space-y-3">
          <Alert variant="success" accent title="Success">
            Left accent border for emphasis.
          </Alert>
          <Alert variant="error" accent title="Error">
            Left accent border for emphasis.
          </Alert>
        </div>
      </div>

      {/* Inline Alert */}
      <div className="space-y-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          Inline Alert (Compact)
        </span>
        <div className="space-y-2">
          <InlineAlert message="This is a default inline alert." />
          <InlineAlert variant="success" message="Changes saved successfully." />
          <InlineAlert variant="warning" message="Please verify your email." />
          <InlineAlert variant="error" message="Unable to load data." />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

/**
 * Default alert with title and description.
 */
export const Default: Story = {
  args: {
    title: 'Information',
    children: 'This is an informational alert with some helpful content.',
  },
};

/**
 * All alert variants.
 */
export const AllVariants: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="default" title="Default">
        This is a default neutral alert.
      </Alert>
      <Alert variant="success" title="Success">
        Your changes have been saved successfully.
      </Alert>
      <Alert variant="warning" title="Warning">
        Please review your information before continuing.
      </Alert>
      <Alert variant="error" title="Error">
        There was a problem processing your request.
      </Alert>
      <Alert variant="gold" title="Achievement">
        You&apos;ve unlocked a new feature!
      </Alert>
    </div>
  ),
};

/**
 * Alerts with left accent border.
 */
export const WithAccent: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="default" accent title="Default">
        Alert with accent border.
      </Alert>
      <Alert variant="success" accent title="Success">
        Successfully completed.
      </Alert>
      <Alert variant="warning" accent title="Warning">
        Please be careful.
      </Alert>
      <Alert variant="error" accent title="Error">
        Something went wrong.
      </Alert>
      <Alert variant="gold" accent title="Achievement">
        Special achievement unlocked!
      </Alert>
    </div>
  ),
};

/**
 * Alert without icon.
 */
export const WithoutIcon: Story = {
  args: {
    title: 'Simple Alert',
    hideIcon: true,
    children: 'This alert displays without an icon.',
  },
};

/**
 * Alert with custom icon.
 */
export const CustomIcon: Story = {
  args: {
    title: 'Custom Icon',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    variant: 'gold',
    children: 'Alert with a custom sparkle icon.',
  },
};

/**
 * Dismissible alert with close button.
 */
export const Dismissible: StoryObj = {
  render: function DismissibleDemo() {
    const [visible, setVisible] = React.useState(true);

    return (
      <div className="space-y-4">
        {visible ? (
          <Alert
            variant="success"
            title="Dismissible Alert"
            onClose={() => setVisible(false)}
          >
            Click the X button to dismiss this alert.
          </Alert>
        ) : (
          <Button variant="secondary" onClick={() => setVisible(true)}>
            Show Alert
          </Button>
        )}
      </div>
    );
  },
};

/**
 * Alert with action button.
 */
export const WithAction: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Alert
        variant="warning"
        title="Update Available"
        action={<Button variant="secondary" size="sm">Update Now</Button>}
      >
        A new version of the application is available.
      </Alert>

      <Alert
        variant="error"
        title="Session Expired"
        action={<Button variant="primary" size="sm">Log In</Button>}
      >
        Your session has expired. Please log in again.
      </Alert>
    </div>
  ),
};

/**
 * Alert with both action and close button.
 */
export const ActionAndClose: StoryObj = {
  render: function ActionCloseDemo() {
    const [visible, setVisible] = React.useState(true);

    if (!visible) {
      return <Button variant="secondary" onClick={() => setVisible(true)}>Show Alert</Button>;
    }

    return (
      <Alert
        variant="default"
        title="Email Verification"
        action={<Button variant="secondary" size="sm">Resend</Button>}
        onClose={() => setVisible(false)}
      >
        Please verify your email address to access all features.
      </Alert>
    );
  },
};

/**
 * Alert without title (description only).
 */
export const DescriptionOnly: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="default">
        This is an alert with only a description, no title.
      </Alert>
      <Alert variant="warning">
        Please save your work before leaving this page.
      </Alert>
    </div>
  ),
};

/**
 * Using sub-components for more control.
 */
export const Compositional: StoryObj = {
  render: () => (
    <Alert variant="success">
      <AlertTitle>Payment Successful</AlertTitle>
      <AlertDescription>
        Your payment of <strong className="text-white">$99.00</strong> has been processed.
        A confirmation email has been sent to your inbox.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Inline alert (compact single-line).
 */
export const Inline: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <InlineAlert message="This is a default inline alert." />
      <InlineAlert variant="success" message="Changes saved successfully." />
      <InlineAlert variant="warning" message="Please verify your email." />
      <InlineAlert variant="error" message="Unable to load data." />
      <InlineAlert variant="gold" message="You earned 50 points!" />
    </div>
  ),
};

/**
 * Inline alert with action.
 */
export const InlineWithAction: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <InlineAlert
        variant="warning"
        message="Please verify your email address."
        action={<Button variant="ghost" size="sm">Resend</Button>}
      />
      <InlineAlert
        variant="default"
        message="3 items in your cart."
        action={<Button variant="secondary" size="sm">View Cart</Button>}
      />
    </div>
  ),
};

/**
 * Dismissible inline alert.
 */
export const InlineDismissible: StoryObj = {
  render: function InlineDismissDemo() {
    const [visible, setVisible] = React.useState(true);

    return visible ? (
      <InlineAlert
        variant="success"
        message="Profile updated successfully."
        onClose={() => setVisible(false)}
      />
    ) : (
      <Button variant="secondary" size="sm" onClick={() => setVisible(true)}>
        Show Alert
      </Button>
    );
  },
};

/**
 * Multiple alerts stacked.
 */
export const Stacked: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <Alert variant="error" accent title="Critical Update Required">
        Please update your password immediately.
      </Alert>
      <Alert variant="warning" accent title="Incomplete Profile">
        Add a profile photo to help others recognize you.
      </Alert>
      <Alert variant="default" accent title="New Features Available">
        Check out the latest updates in settings.
      </Alert>
    </div>
  ),
};
