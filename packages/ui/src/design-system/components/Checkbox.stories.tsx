'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Checkbox,
  CheckboxField,
  CheckboxCard,
  CheckboxGroup,
  SimpleCheckboxGroup,
} from './Checkbox';
import * as React from 'react';

const meta: Meta<typeof Checkbox> = {
  title: 'Design System/Components/Checkbox',
  component: Checkbox,
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
      control: 'select',
      options: [true, false, 'indeterminate'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

/**
 * Default unchecked checkbox.
 */
export const Default: Story = {
  args: {},
};

/**
 * Checked checkbox with gold background.
 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

/**
 * Indeterminate state (for parent checkbox).
 */
export const Indeterminate: Story = {
  args: {
    checked: 'indeterminate',
  },
};

/**
 * Disabled checkbox states.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="flex flex-col items-center gap-2">
        <Checkbox disabled />
        <span className="text-xs text-[var(--color-text-muted)]">Unchecked</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox disabled defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">Checked</span>
      </div>
    </div>
  ),
};

/**
 * All sizes comparison.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="sm" defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="default" defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="lg" defaultChecked />
        <span className="text-xs text-[var(--color-text-muted)]">Large</span>
      </div>
    </div>
  ),
};

/**
 * Checkbox with label.
 */
export const WithLabel: StoryObj<typeof CheckboxField> = {
  render: () => (
    <div className="w-80">
      <CheckboxField label="Accept terms and conditions" />
    </div>
  ),
};

/**
 * Checkbox with label and description.
 */
export const WithDescription: StoryObj<typeof CheckboxField> = {
  render: () => (
    <div className="w-80">
      <CheckboxField
        label="Enable notifications"
        description="Get notified when someone mentions you or replies to your posts"
      />
    </div>
  ),
};

/**
 * Checkbox with error.
 */
export const WithError: StoryObj<typeof CheckboxField> = {
  render: () => (
    <div className="w-80">
      <CheckboxField
        label="Accept terms and conditions"
        description="You must accept to continue"
        error="This field is required"
      />
    </div>
  ),
};

/**
 * Vertical checkbox group.
 */
export const GroupVertical: Story = {
  render: () => (
    <CheckboxGroup orientation="vertical" className="w-64">
      <CheckboxField label="Design" defaultChecked />
      <CheckboxField label="Engineering" />
      <CheckboxField label="Marketing" defaultChecked />
      <CheckboxField label="Sales" />
    </CheckboxGroup>
  ),
};

/**
 * Horizontal checkbox group.
 */
export const GroupHorizontal: Story = {
  render: () => (
    <CheckboxGroup orientation="horizontal">
      <CheckboxField label="Mon" defaultChecked />
      <CheckboxField label="Tue" defaultChecked />
      <CheckboxField label="Wed" defaultChecked />
      <CheckboxField label="Thu" />
      <CheckboxField label="Fri" />
    </CheckboxGroup>
  ),
};

/**
 * Card-style checkboxes.
 */
export const CardStyle: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-96">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <CheckboxGroup orientation="vertical">
      <CheckboxCard
        title="Email notifications"
        description="Receive updates and announcements via email"
        defaultChecked
      />
      <CheckboxCard
        title="Push notifications"
        description="Get instant notifications on your device"
      />
      <CheckboxCard
        title="SMS notifications"
        description="Receive text messages for critical updates"
      />
    </CheckboxGroup>
  ),
};

/**
 * Simple checkbox group with options prop.
 */
export const SimpleGroup: StoryObj<typeof SimpleCheckboxGroup> = {
  render: function SimpleGroupDemo() {
    const [value, setValue] = React.useState(['design', 'engineering']);

    return (
      <div className="w-64 space-y-4">
        <SimpleCheckboxGroup
          value={value}
          onChange={setValue}
          options={[
            { value: 'design', label: 'Design' },
            { value: 'engineering', label: 'Engineering' },
            { value: 'marketing', label: 'Marketing' },
            { value: 'sales', label: 'Sales' },
          ]}
        />
        <div className="text-xs text-[var(--color-text-muted)]">
          Selected: {value.join(', ') || 'None'}
        </div>
      </div>
    );
  },
};

/**
 * Simple checkbox group with card style.
 */
export const SimpleCardGroup: StoryObj<typeof SimpleCheckboxGroup> = {
  decorators: [
    (Story) => (
      <div className="p-8 w-96">
        <Story />
      </div>
    ),
  ],
  render: function SimpleCardGroupDemo() {
    const [value, setValue] = React.useState(['email']);

    return (
      <SimpleCheckboxGroup
        value={value}
        onChange={setValue}
        cardStyle
        options={[
          { value: 'email', label: 'Email', description: 'Receive email updates' },
          { value: 'push', label: 'Push', description: 'Browser notifications' },
          { value: 'sms', label: 'SMS', description: 'Text message alerts' },
        ]}
      />
    );
  },
};

/**
 * Controlled checkbox.
 */
export const Controlled: Story = {
  render: function ControlledCheckbox() {
    const [checked, setChecked] = React.useState(false);

    return (
      <div className="space-y-4">
        <CheckboxField
          label="Enable feature"
          checked={checked}
          onCheckedChange={(c) => setChecked(c === true)}
        />
        <div className="text-sm text-[var(--color-text-muted)]">
          State: <span className="text-white">{checked ? 'Checked' : 'Unchecked'}</span>
        </div>
      </div>
    );
  },
};

/**
 * Select all with indeterminate.
 */
export const SelectAll: Story = {
  render: function SelectAllDemo() {
    const [items, setItems] = React.useState({
      all: false,
      design: true,
      engineering: true,
      marketing: false,
      sales: false,
    });

    const allChecked = items.design && items.engineering && items.marketing && items.sales;
    const someChecked =
      (items.design || items.engineering || items.marketing || items.sales) && !allChecked;

    const handleAllChange = (checked: boolean | 'indeterminate') => {
      const newValue = checked === true;
      setItems({
        all: newValue,
        design: newValue,
        engineering: newValue,
        marketing: newValue,
        sales: newValue,
      });
    };

    const handleItemChange = (key: keyof typeof items) => (checked: boolean | 'indeterminate') => {
      setItems((prev) => ({ ...prev, [key]: checked === true }));
    };

    return (
      <div className="w-64 space-y-3">
        <CheckboxField
          label="Select all"
          checked={allChecked ? true : someChecked ? 'indeterminate' : false}
          onCheckedChange={handleAllChange}
        />
        <div className="ml-6 space-y-2">
          <CheckboxField
            label="Design"
            checked={items.design}
            onCheckedChange={handleItemChange('design')}
          />
          <CheckboxField
            label="Engineering"
            checked={items.engineering}
            onCheckedChange={handleItemChange('engineering')}
          />
          <CheckboxField
            label="Marketing"
            checked={items.marketing}
            onCheckedChange={handleItemChange('marketing')}
          />
          <CheckboxField
            label="Sales"
            checked={items.sales}
            onCheckedChange={handleItemChange('sales')}
          />
        </div>
      </div>
    );
  },
};

/**
 * In form context.
 */
export const InForm: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-96">
        <Story />
      </div>
    ),
  ],
  render: function FormDemo() {
    const [agreed, setAgreed] = React.useState(false);

    return (
      <div className="space-y-6 p-4 rounded-xl border border-[var(--color-border)] bg-[#141414]">
        <div>
          <h3 className="text-sm font-medium text-white mb-1">Privacy Settings</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            Control how your data is used
          </p>
          <CheckboxGroup orientation="vertical">
            <CheckboxCard
              title="Share usage data"
              description="Help us improve by sharing anonymous usage statistics"
              defaultChecked
            />
            <CheckboxCard
              title="Personalized recommendations"
              description="Get suggestions based on your activity"
              defaultChecked
            />
            <CheckboxCard
              title="Marketing emails"
              description="Receive updates about new features and offers"
            />
          </CheckboxGroup>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <CheckboxField
            label="I agree to the Terms of Service and Privacy Policy"
            checked={agreed}
            onCheckedChange={(c) => setAgreed(c === true)}
          />
        </div>

        <button
          className="w-full py-2.5 px-4 rounded-lg bg-[#FFD700] text-black font-medium hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!agreed}
        >
          Save Preferences
        </button>
      </div>
    );
  },
};
