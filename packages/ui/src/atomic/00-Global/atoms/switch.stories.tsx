'use client';

import * as React from 'react';

import { Switch } from './switch';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '00-Global/Atoms/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile switch (toggle) component with haptic feedback, spring animations, and multiple variants. Built with Framer Motion for smooth, organic interactions. Supports controlled/uncontrolled modes with accessibility built-in.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success'],
      description: 'Visual variant of the switch',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size of the switch',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the switch is checked (on)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
    label: {
      control: 'text',
      description: 'Label text displayed next to the switch',
    },
    description: {
      control: 'text',
      description: 'Description text displayed below the switch',
    },
    error: {
      control: 'text',
      description: 'Error message displayed below the switch (overrides description)',
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
};

export const Checked: Story = {
  args: {
    label: 'Dark mode enabled',
    checked: true,
  },
};

export const Unchecked: Story = {
  args: {
    label: 'Email notifications',
    checked: false,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Receive updates about new features and campus events',
  },
};

export const WithError: Story = {
  args: {
    label: 'Two-factor authentication',
    error: 'You must enable 2FA to access admin features',
  },
};

export const WithoutLabel: Story = {
  args: {
    'aria-label': 'Toggle setting',
  },
};

// ===== VISUAL VARIANTS =====

export const DefaultVariant: Story = {
  args: {
    variant: 'default',
    label: 'Default variant (gold)',
    checked: true,
  },
};

export const DestructiveVariant: Story = {
  args: {
    variant: 'destructive',
    label: 'Delete mode enabled',
    description: 'Items will be permanently deleted',
    checked: true,
  },
};

export const SuccessVariant: Story = {
  args: {
    variant: 'success',
    label: 'Backup enabled',
    description: 'Your data is being backed up automatically',
    checked: true,
  },
};

// ===== SIZES =====

export const SizeSmall: Story = {
  args: {
    size: 'sm',
    label: 'Small switch',
    checked: true,
  },
};

export const SizeDefault: Story = {
  args: {
    size: 'default',
    label: 'Default switch',
    checked: true,
  },
};

export const SizeLarge: Story = {
  args: {
    size: 'lg',
    label: 'Large switch',
    checked: true,
  },
};

// ===== STATES =====

export const Disabled: Story = {
  args: {
    label: 'Disabled switch',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    checked: true,
    disabled: true,
    description: 'This setting cannot be changed',
  },
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveToggle: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);

    return (
      <Switch
        label="Toggle me"
        checked={checked}
        onCheckedChange={setChecked}
        description={checked ? 'Switch is ON' : 'Switch is OFF'}
      />
    );
  },
};

export const InteractiveValidation: Story = {
  render: () => {
    const [accepted, setAccepted] = React.useState(false);
    const [touched, setTouched] = React.useState(false);

    const showError = touched && !accepted;

    return (
      <div className="w-[400px]">
        <Switch
          label="Enable data collection"
          checked={accepted}
          onCheckedChange={(checked) => {
            setAccepted(checked);
            setTouched(true);
          }}
          error={showError ? 'You must enable data collection to continue' : undefined}
          description={
            !showError
              ? 'We need this to provide personalized recommendations'
              : undefined
          }
        />
      </div>
    );
  },
};

export const InteractiveStateDisplay: Story = {
  render: () => {
    const [enabled, setEnabled] = React.useState(false);

    return (
      <div className="flex flex-col gap-4 w-[400px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <Switch
          label="Feature enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
          description="Toggle to see real-time state changes"
        />
        <div className="p-4 rounded-lg bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)]">
          <p className="text-sm text-[var(--hive-text-secondary)]">
            Current state:{' '}
            <span className="font-medium text-[var(--hive-text-primary)]">
              {enabled ? 'ON' : 'OFF'}
            </span>
          </p>
        </div>
      </div>
    );
  },
};

// ===== REAL-WORLD EXAMPLES =====

export const SettingsPanel: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      notifications: true,
      emailDigest: false,
      autoSave: true,
      betaFeatures: false,
      analytics: true,
    });

    return (
      <div className="flex flex-col gap-4 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold mb-2">
          App Settings
        </h3>

        <Switch
          label="Push notifications"
          description="Receive real-time updates about your activity"
          checked={settings.notifications}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, notifications: checked })
          }
        />

        <Switch
          label="Weekly email digest"
          description="Get a summary of campus activity every Monday"
          checked={settings.emailDigest}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, emailDigest: checked })
          }
        />

        <Switch
          label="Auto-save drafts"
          description="Automatically save your work every 30 seconds"
          checked={settings.autoSave}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, autoSave: checked })
          }
          variant="success"
        />

        <div className="border-t border-[var(--hive-border-default)] my-2" />

        <Switch
          label="Beta features"
          description="Get early access to new features (may be unstable)"
          checked={settings.betaFeatures}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, betaFeatures: checked })
          }
        />

        <Switch
          label="Analytics tracking"
          description="Help us improve HIVE by sharing anonymous usage data"
          checked={settings.analytics}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, analytics: checked })
          }
        />
      </div>
    );
  },
};

export const PrivacyControls: Story = {
  render: () => {
    const [privacy, setPrivacy] = React.useState({
      profileVisible: true,
      showEmail: false,
      showPhone: false,
      allowMessages: true,
      ghostMode: false,
    });

    return (
      <div className="flex flex-col gap-4 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <div className="mb-2">
          <h3 className="text-[var(--hive-text-primary)] font-semibold mb-1">
            Privacy Settings
          </h3>
          <p className="text-sm text-[var(--hive-text-secondary)]">
            Control who can see your information
          </p>
        </div>

        <Switch
          label="Profile visible to campus"
          description="Anyone with a @buffalo.edu email can view your profile"
          checked={privacy.profileVisible}
          onCheckedChange={(checked) =>
            setPrivacy({ ...privacy, profileVisible: checked })
          }
        />

        <Switch
          label="Show email address"
          description="Display your email on your public profile"
          checked={privacy.showEmail}
          disabled={!privacy.profileVisible}
          onCheckedChange={(checked) =>
            setPrivacy({ ...privacy, showEmail: checked })
          }
        />

        <Switch
          label="Show phone number"
          description="Display your phone number on your public profile"
          checked={privacy.showPhone}
          disabled={!privacy.profileVisible}
          onCheckedChange={(checked) =>
            setPrivacy({ ...privacy, showPhone: checked })
          }
        />

        <div className="border-t border-[var(--hive-border-default)] my-1" />

        <Switch
          label="Allow direct messages"
          description="Other students can send you private messages"
          checked={privacy.allowMessages}
          onCheckedChange={(checked) =>
            setPrivacy({ ...privacy, allowMessages: checked })
          }
        />

        <Switch
          label="Ghost mode"
          description="Hide your online status and activity from others"
          checked={privacy.ghostMode}
          onCheckedChange={(checked) =>
            setPrivacy({ ...privacy, ghostMode: checked })
          }
          variant="success"
        />
      </div>
    );
  },
};

export const FeatureFlags: Story = {
  render: () => {
    const [features, setFeatures] = React.useState({
      newFeed: false,
      experimentalSearch: true,
      aiRecommendations: false,
      advancedFilters: true,
      betaHiveLab: false,
    });

    const betaCount = Object.values(features).filter(Boolean).length;

    return (
      <div className="flex flex-col gap-4 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <div className="mb-2">
          <h3 className="text-[var(--hive-text-primary)] font-semibold mb-1">
            Beta Features
          </h3>
          <p className="text-sm text-[var(--hive-text-secondary)]">
            {betaCount} beta feature{betaCount !== 1 ? 's' : ''} enabled
          </p>
        </div>

        <Switch
          label="New feed algorithm"
          description="Try our improved content discovery system"
          checked={features.newFeed}
          onCheckedChange={(checked) =>
            setFeatures({ ...features, newFeed: checked })
          }
        />

        <Switch
          label="Experimental search"
          description="Enhanced search with filters and suggestions"
          checked={features.experimentalSearch}
          onCheckedChange={(checked) =>
            setFeatures({ ...features, experimentalSearch: checked })
          }
        />

        <Switch
          label="AI recommendations"
          description="Get personalized space and event suggestions"
          checked={features.aiRecommendations}
          onCheckedChange={(checked) =>
            setFeatures({ ...features, aiRecommendations: checked })
          }
        />

        <Switch
          label="Advanced filters"
          description="More filtering options for Feed and Spaces"
          checked={features.advancedFilters}
          onCheckedChange={(checked) =>
            setFeatures({ ...features, advancedFilters: checked })
          }
        />

        <Switch
          label="HiveLab beta access"
          description="Early access to new tool builder features"
          checked={features.betaHiveLab}
          onCheckedChange={(checked) =>
            setFeatures({ ...features, betaHiveLab: checked })
          }
          variant="success"
        />
      </div>
    );
  },
};

export const AccessControl: Story = {
  render: () => {
    const [permissions, setPermissions] = React.useState({
      canPost: true,
      canComment: true,
      canUpvote: true,
      canCreateSpaces: false,
      canModerate: false,
      isAdmin: false,
    });

    // Admin enables everything
    React.useEffect(() => {
      if (permissions.isAdmin) {
        setPermissions({
          canPost: true,
          canComment: true,
          canUpvote: true,
          canCreateSpaces: true,
          canModerate: true,
          isAdmin: true,
        });
      }
    }, [permissions.isAdmin]);

    return (
      <div className="flex flex-col gap-4 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold mb-2">
          User Permissions
        </h3>

        <Switch
          label="Can create posts"
          description="User can create new posts in spaces"
          checked={permissions.canPost}
          disabled={permissions.isAdmin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, canPost: checked })
          }
        />

        <Switch
          label="Can comment"
          description="User can comment on posts"
          checked={permissions.canComment}
          disabled={permissions.isAdmin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, canComment: checked })
          }
        />

        <Switch
          label="Can upvote"
          description="User can upvote posts and comments"
          checked={permissions.canUpvote}
          disabled={permissions.isAdmin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, canUpvote: checked })
          }
        />

        <div className="border-t border-[var(--hive-border-default)] my-1" />

        <Switch
          label="Can create spaces"
          description="User can create new spaces and communities"
          checked={permissions.canCreateSpaces}
          disabled={permissions.isAdmin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, canCreateSpaces: checked })
          }
        />

        <Switch
          label="Moderator access"
          description="User can moderate content and ban users"
          checked={permissions.canModerate}
          disabled={permissions.isAdmin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, canModerate: checked })
          }
          variant="destructive"
        />

        <Switch
          label="Administrator access"
          description="Full access to all features (enables all above)"
          checked={permissions.isAdmin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, isAdmin: checked })
          }
          variant="destructive"
        />
      </div>
    );
  },
};

export const NotificationPreferences: Story = {
  render: () => {
    const [notifications, setNotifications] = React.useState({
      all: true,
      mentions: true,
      upvotes: false,
      comments: true,
      newFollowers: false,
      spacePosts: true,
      rituals: true,
    });

    // If all is disabled, disable everything
    React.useEffect(() => {
      if (!notifications.all) {
        setNotifications({
          all: false,
          mentions: false,
          upvotes: false,
          comments: false,
          newFollowers: false,
          spacePosts: false,
          rituals: false,
        });
      }
    }, [notifications.all]);

    return (
      <div className="flex flex-col gap-4 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold mb-2">
          Notification Preferences
        </h3>

        <Switch
          label="All notifications"
          description="Master toggle for all notification types"
          checked={notifications.all}
          onCheckedChange={(checked) =>
            setNotifications({ ...notifications, all: checked })
          }
          variant="success"
        />

        <div className="border-t border-[var(--hive-border-default)] my-1" />

        <Switch
          label="Mentions"
          description="When someone mentions you in a post or comment"
          checked={notifications.mentions}
          disabled={!notifications.all}
          onCheckedChange={(checked) =>
            setNotifications({ ...notifications, mentions: checked })
          }
        />

        <Switch
          label="Upvotes"
          description="When someone upvotes your post or comment"
          checked={notifications.upvotes}
          disabled={!notifications.all}
          onCheckedChange={(checked) =>
            setNotifications({ ...notifications, upvotes: checked })
          }
        />

        <Switch
          label="Comments"
          description="When someone comments on your post"
          checked={notifications.comments}
          disabled={!notifications.all}
          onCheckedChange={(checked) =>
            setNotifications({ ...notifications, comments: checked })
          }
        />

        <Switch
          label="New connections"
          description="When someone connects with you on campus"
          checked={notifications.newFollowers}
          disabled={!notifications.all}
          onCheckedChange={(checked) =>
            setNotifications({ ...notifications, newFollowers: checked })
          }
        />

        <Switch
          label="Space activity"
          description="When spaces you joined have new posts"
          checked={notifications.spacePosts}
          disabled={!notifications.all}
          onCheckedChange={(checked) =>
            setNotifications({ ...notifications, spacePosts: checked })
          }
        />

        <Switch
          label="Ritual updates"
          description="When new campus rituals are launched"
          checked={notifications.rituals}
          disabled={!notifications.all}
          onCheckedChange={(checked) =>
            setNotifications({ ...notifications, rituals: checked })
          }
        />
      </div>
    );
  },
};

// ===== SIZE COMPARISON =====

export const SizeComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 items-start">
        <Switch size="sm" label="Small switch" checked />
        <Switch size="default" label="Default switch" checked />
        <Switch size="lg" label="Large switch" checked />
      </div>
    );
  },
};

export const VariantComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 items-start">
        <Switch variant="default" label="Default (gold)" checked />
        <Switch variant="destructive" label="Destructive (red)" checked />
        <Switch variant="success" label="Success (green)" checked />
      </div>
    );
  },
};

export const StateComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 items-start">
        <Switch label="Unchecked" checked={false} />
        <Switch label="Checked" checked={true} />
        <Switch label="Disabled unchecked" disabled checked={false} />
        <Switch label="Disabled checked" disabled checked={true} />
      </div>
    );
  },
};

// ===== ACCESSIBILITY =====

export const AccessibilityDemo: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[500px]">
        <div className="text-sm text-[var(--hive-text-secondary)] mb-2">
          <p className="font-medium text-[var(--hive-text-primary)] mb-1">
            Accessibility Features:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Proper label associations with htmlFor</li>
            <li>role="switch" for screen readers</li>
            <li>aria-checked for current state</li>
            <li>aria-describedby for descriptions</li>
            <li>Keyboard navigable (Tab, Space, Enter)</li>
            <li>Focus-visible ring styles</li>
            <li>Spring animations with haptic feedback</li>
          </ul>
        </div>

        <Switch
          label="Accessible switch"
          description="Try using Tab to focus and Space to toggle"
        />

        <Switch
          label="Error example"
          error="This demonstrates role=alert for screen readers"
        />

        <Switch label="Without label" aria-label="Hidden switch" />
      </div>
    );
  },
};

// ===== DARK MODE =====

export const DarkModeExample: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => {
    return (
      <div className="flex flex-col gap-4 p-6 rounded-lg bg-[var(--hive-background-primary)]">
        <Switch label="Default variant" checked />
        <Switch label="Success variant" variant="success" checked />
        <Switch label="Destructive variant" variant="destructive" checked />
        <Switch
          label="With description"
          description="All variants work in dark mode"
          checked
        />
        <Switch
          label="With error"
          error="Error messages are clearly visible"
        />
      </div>
    );
  },
};
