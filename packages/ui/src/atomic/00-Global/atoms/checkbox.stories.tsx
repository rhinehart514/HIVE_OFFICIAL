'use client';

import { Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as React from 'react';

import { Checkbox } from './checkbox';

import type { Meta, StoryObj } from '@storybook/react';


const meta = {
  title: '00-Global/Atoms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile checkbox component with spring animations, multiple variants, sizes, and states. Supports checked, unchecked, and indeterminate states with smooth Framer Motion transitions. Built with accessibility in mind using ARIA attributes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning'],
      description: 'Visual variant of the checkbox',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size of the checkbox',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Whether the checkbox is in indeterminate state (partially checked)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    label: {
      control: 'text',
      description: 'Label text displayed next to the checkbox',
    },
    description: {
      control: 'text',
      description: 'Description text displayed below the checkbox',
    },
    error: {
      control: 'text',
      description: 'Error message displayed below the checkbox (overrides description)',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'I agree to the terms',
    checked: true,
  },
};

export const Unchecked: Story = {
  args: {
    label: 'Subscribe to newsletter',
    checked: false,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all items',
    indeterminate: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Email notifications',
    description: 'Receive updates about your account activity and new features.',
  },
};

export const WithError: Story = {
  args: {
    label: 'I have read the privacy policy',
    error: 'You must accept the privacy policy to continue.',
  },
};

export const WithoutLabel: Story = {
  args: {
    'aria-label': 'Select item',
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
    label: 'Delete all data permanently',
    checked: true,
  },
};

export const SuccessVariant: Story = {
  args: {
    variant: 'success',
    label: 'Email verified successfully',
    checked: true,
  },
};

export const WarningVariant: Story = {
  args: {
    variant: 'warning',
    label: 'Proceed with caution',
    checked: true,
  },
};

// ===== SIZES =====

export const SizeSmall: Story = {
  args: {
    size: 'sm',
    label: 'Small checkbox',
    checked: true,
  },
};

export const SizeDefault: Story = {
  args: {
    size: 'default',
    label: 'Default checkbox',
    checked: true,
  },
};

export const SizeLarge: Story = {
  args: {
    size: 'lg',
    label: 'Large checkbox',
    checked: true,
  },
};

// ===== STATES =====

export const Disabled: Story = {
  args: {
    label: 'Disabled checkbox',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    checked: true,
    disabled: true,
  },
};

export const DisabledIndeterminate: Story = {
  args: {
    label: 'Disabled and indeterminate',
    indeterminate: true,
    disabled: true,
  },
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveToggle: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);

    return (
      <Checkbox
        label="Toggle me"
        checked={checked}
        onCheckedChange={setChecked}
        description={checked ? 'Checkbox is checked' : 'Checkbox is unchecked'}
      />
    );
  },
};

export const InteractiveIndeterminate: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);
    const [indeterminate, setIndeterminate] = React.useState(true);

    const handleChange = (newChecked: boolean) => {
      setChecked(newChecked);
      setIndeterminate(false);
    };

    return (
      <div className="flex flex-col gap-4">
        <Checkbox
          label="Parent checkbox"
          checked={checked}
          indeterminate={indeterminate}
          onCheckedChange={handleChange}
          description={
            indeterminate
              ? 'Some items selected'
              : checked
              ? 'All items selected'
              : 'No items selected'
          }
        />
        <div className="text-xs text-[var(--hive-text-secondary)]">
          Click to cycle: Indeterminate → Checked → Unchecked
        </div>
      </div>
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
        <Checkbox
          label="I accept the terms and conditions"
          checked={accepted}
          onCheckedChange={(checked) => {
            setAccepted(checked);
            setTouched(true);
          }}
          error={showError ? 'You must accept the terms to continue' : undefined}
          description={!showError ? 'Please read and accept our terms of service' : undefined}
        />
      </div>
    );
  },
};

// ===== REAL-WORLD EXAMPLES =====

export const SettingsForm: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      darkMode: true,
    });

    return (
      <div className="flex flex-col gap-4 w-[400px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold mb-2">
          Notification Settings
        </h3>
        <Checkbox
          label="Email notifications"
          description="Receive email updates about your activity"
          checked={settings.emailNotifications}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, emailNotifications: checked })
          }
        />
        <Checkbox
          label="Push notifications"
          description="Get push notifications on your device"
          checked={settings.pushNotifications}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, pushNotifications: checked })
          }
        />
        <Checkbox
          label="Weekly digest"
          description="Receive a weekly summary of campus activity"
          checked={settings.weeklyDigest}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, weeklyDigest: checked })
          }
        />
        <div className="border-t border-[var(--hive-border-default)] my-2" />
        <Checkbox
          label="Dark mode"
          description="Use dark theme across the app"
          checked={settings.darkMode}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, darkMode: checked })
          }
        />
      </div>
    );
  },
};

export const SelectAllPattern: Story = {
  render: () => {
    const [items, setItems] = React.useState([
      { id: 1, name: 'Introduction to Computer Science', checked: true },
      { id: 2, name: 'Data Structures and Algorithms', checked: false },
      { id: 3, name: 'Operating Systems', checked: true },
      { id: 4, name: 'Database Management', checked: false },
    ]);

    const checkedCount = items.filter((item) => item.checked).length;
    const allChecked = checkedCount === items.length;
    const someChecked = checkedCount > 0 && checkedCount < items.length;

    const handleSelectAll = (checked: boolean) => {
      setItems(items.map((item) => ({ ...item, checked })));
    };

    const handleItemToggle = (id: number) => {
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    };

    return (
      <div className="flex flex-col gap-3 w-[400px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <Checkbox
          label="Select all courses"
          checked={allChecked}
          indeterminate={someChecked}
          onCheckedChange={handleSelectAll}
          description={`${checkedCount} of ${items.length} courses selected`}
        />
        <div className="border-t border-[var(--hive-border-default)] my-1" />
        <div className="flex flex-col gap-2 ml-7">
          {items.map((item) => (
            <Checkbox
              key={item.id}
              label={item.name}
              checked={item.checked}
              onCheckedChange={() => handleItemToggle(item.id)}
              size="sm"
            />
          ))}
        </div>
      </div>
    );
  },
};

export const OnboardingChecklist: Story = {
  render: () => {
    const [steps, setSteps] = React.useState([
      { id: 1, label: 'Create your profile', completed: true },
      { id: 2, label: 'Upload a profile photo', completed: true },
      { id: 3, label: 'Join at least 3 spaces', completed: false },
      { id: 4, label: 'Make your first post', completed: false },
      { id: 5, label: 'Connect with 5 students', completed: false },
    ]);

    const completedCount = steps.filter((step) => step.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    return (
      <div className="flex flex-col gap-4 w-[400px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <div className="mb-2">
          <h3 className="text-[var(--hive-text-primary)] font-semibold mb-1">
            Complete your profile
          </h3>
          <p className="text-sm text-[var(--hive-text-secondary)]">
            {completedCount} of {steps.length} steps completed ({progress}%)
          </p>
          <div className="w-full h-2 bg-[var(--hive-background-tertiary)] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--hive-brand-primary)] to-[var(--hive-brand-secondary)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {steps.map((step) => (
            <Checkbox
              key={step.id}
              label={step.label}
              checked={step.completed}
              variant={step.completed ? 'success' : 'default'}
              onCheckedChange={(checked) =>
                setSteps(
                  steps.map((s) =>
                    s.id === step.id ? { ...s, completed: checked } : s
                  )
                )
              }
            />
          ))}
        </div>
      </div>
    );
  },
};

export const AgreementForm: Story = {
  render: () => {
    const [agreements, setAgreements] = React.useState({
      terms: false,
      privacy: false,
      marketing: false,
    });

    const [submitted, setSubmitted] = React.useState(false);

    const canSubmit = agreements.terms && agreements.privacy;

    return (
      <div className="flex flex-col gap-4 w-[400px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold mb-2">
          Terms and Agreements
        </h3>
        <Checkbox
          label="I accept the Terms of Service"
          description="Required to create an account"
          checked={agreements.terms}
          onCheckedChange={(checked) =>
            setAgreements({ ...agreements, terms: checked })
          }
          error={
            submitted && !agreements.terms
              ? 'You must accept the terms of service'
              : undefined
          }
        />
        <Checkbox
          label="I accept the Privacy Policy"
          description="Required to create an account"
          checked={agreements.privacy}
          onCheckedChange={(checked) =>
            setAgreements({ ...agreements, privacy: checked })
          }
          error={
            submitted && !agreements.privacy
              ? 'You must accept the privacy policy'
              : undefined
          }
        />
        <Checkbox
          label="Send me marketing emails"
          description="Optional - You can change this later in settings"
          checked={agreements.marketing}
          onCheckedChange={(checked) =>
            setAgreements({ ...agreements, marketing: checked })
          }
        />
        <button
          onClick={() => setSubmitted(true)}
          disabled={!canSubmit}
          className="mt-4 px-4 py-2 rounded-lg bg-[var(--hive-brand-primary)] text-[var(--hive-text-on-brand)] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Create Account
        </button>
      </div>
    );
  },
};

export const PermissionsManager: Story = {
  render: () => {
    const [permissions, setPermissions] = React.useState({
      read: true,
      write: true,
      delete: false,
      admin: false,
    });

    // If admin is checked, enable all permissions
    React.useEffect(() => {
      if (permissions.admin) {
        setPermissions({
          read: true,
          write: true,
          delete: true,
          admin: true,
        });
      }
    }, [permissions.admin]);

    return (
      <div className="flex flex-col gap-4 w-[400px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold mb-2">
          User Permissions
        </h3>
        <Checkbox
          label="Read access"
          description="View spaces and posts"
          checked={permissions.read}
          disabled={permissions.admin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, read: checked })
          }
        />
        <Checkbox
          label="Write access"
          description="Create and edit posts"
          checked={permissions.write}
          disabled={permissions.admin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, write: checked })
          }
        />
        <Checkbox
          label="Delete access"
          description="Delete posts and comments"
          variant="warning"
          checked={permissions.delete}
          disabled={permissions.admin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, delete: checked })
          }
        />
        <div className="border-t border-[var(--hive-border-default)] my-1" />
        <Checkbox
          label="Admin access"
          description="Full access to all features (enables all above)"
          variant="destructive"
          checked={permissions.admin}
          onCheckedChange={(checked) =>
            setPermissions({ ...permissions, admin: checked })
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
        <Checkbox size="sm" label="Small checkbox" checked />
        <Checkbox size="default" label="Default checkbox" checked />
        <Checkbox size="lg" label="Large checkbox" checked />
      </div>
    );
  },
};

export const VariantComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 items-start">
        <Checkbox variant="default" label="Default (gold)" checked />
        <Checkbox variant="destructive" label="Destructive (red)" checked />
        <Checkbox variant="success" label="Success (green)" checked />
        <Checkbox variant="warning" label="Warning (yellow)" checked />
      </div>
    );
  },
};

export const StateComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 items-start">
        <Checkbox label="Unchecked" checked={false} />
        <Checkbox label="Checked" checked={true} />
        <Checkbox label="Indeterminate" indeterminate={true} />
        <Checkbox label="Disabled unchecked" disabled checked={false} />
        <Checkbox label="Disabled checked" disabled checked={true} />
        <Checkbox label="Disabled indeterminate" disabled indeterminate={true} />
      </div>
    );
  },
};

// ===== ACCESSIBILITY =====

export const AccessibilityDemo: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[400px]">
        <div className="text-sm text-[var(--hive-text-secondary)] mb-2">
          <p className="font-medium text-[var(--hive-text-primary)] mb-1">
            Accessibility Features:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Proper label associations with htmlFor</li>
            <li>aria-checked="mixed" for indeterminate state</li>
            <li>role="alert" for error messages</li>
            <li>aria-disabled for disabled states</li>
            <li>Keyboard navigable (Tab, Space)</li>
            <li>Focus-visible ring styles</li>
            <li>Spring animations with smooth physics</li>
          </ul>
        </div>

        <Checkbox
          label="Accessible checkbox"
          description="Try using Tab to focus and Space to toggle"
        />

        <Checkbox
          label="Error example"
          error="This demonstrates role=alert for screen readers"
        />

        <Checkbox
          label="Indeterminate example"
          indeterminate
          description="Uses aria-checked=mixed for screen readers"
        />
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
        <Checkbox label="Default variant" checked />
        <Checkbox label="Success variant" variant="success" checked />
        <Checkbox label="Destructive variant" variant="destructive" checked />
        <Checkbox
          label="With description"
          description="All variants work in dark mode"
          checked
        />
        <Checkbox
          label="With error"
          error="Error messages are clearly visible"
        />
      </div>
    );
  },
};
