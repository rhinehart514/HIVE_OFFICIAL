import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FormField, FormFieldGroup, FormSection } from './FormField';
import { Text, Input, Card, Button, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FORMFIELD VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * STRUCTURE:
 *   Label Text *             <- Label with optional asterisk
 *   Helper description       <- Muted description text
 *   [────────────────]       <- Any form control (Input, Select, etc.)
 *   ⚠ Error message    45/100 <- Error left, counter right
 *
 * SPACING:
 *   Label → Input: 6px
 *   Input → Error: 6px
 *
 * TYPOGRAPHY:
 *   Label: text-sm font-medium
 *   Description: text-xs text-muted
 *   Error: text-xs text-red (--color-status-error)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof FormField> = {
  title: 'Design System/Components/Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Wrapper for form inputs with label, description, error states, and character counter.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

/**
 * Default — Basic form field
 */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Email" htmlFor="email">
        <Input id="email" type="email" placeholder="you@example.com" />
      </FormField>
    </div>
  ),
};

/**
 * Required field
 */
export const Required: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Username" required htmlFor="username">
        <Input id="username" placeholder="Enter username" />
      </FormField>
    </div>
  ),
};

/**
 * With description
 */
export const WithDescription: Story = {
  render: () => (
    <div className="w-80">
      <FormField
        label="Password"
        description="Must be at least 8 characters with one number"
        htmlFor="password"
      >
        <Input id="password" type="password" placeholder="••••••••" />
      </FormField>
    </div>
  ),
};

/**
 * With error
 */
export const WithError: Story = {
  render: () => (
    <div className="w-80">
      <FormField
        label="Email"
        error="Please enter a valid email address"
        htmlFor="email-error"
      >
        <Input id="email-error" type="email" defaultValue="invalid-email" />
      </FormField>
    </div>
  ),
};

/**
 * With character counter
 */
export const WithCounter: Story = {
  render: () => {
    const [value, setValue] = useState('Hello world');
    return (
      <div className="w-80">
        <FormField
          label="Bio"
          description="Tell us about yourself"
          showCounter
          charCount={value.length}
          maxLength={100}
          htmlFor="bio"
        >
          <Textarea
            id="bio"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Write something..."
            rows={3}
          />
        </FormField>
      </div>
    );
  },
};

/**
 * Over character limit
 */
export const OverLimit: Story = {
  render: () => (
    <div className="w-80">
      <FormField
        label="Tweet"
        showCounter
        charCount={285}
        maxLength={280}
        error="Tweet is too long"
        htmlFor="tweet"
      >
        <Textarea
          id="tweet"
          defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit."
          rows={4}
        />
      </FormField>
    </div>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Locked Field" disabled htmlFor="locked">
        <Input id="locked" defaultValue="Cannot edit" disabled />
      </FormField>
    </div>
  ),
};

/**
 * Form field group — Vertical
 */
export const FieldGroup: Story = {
  render: () => (
    <div className="w-80">
      <FormFieldGroup label="Personal Information" description="Basic details about you">
        <FormField label="First Name" htmlFor="fname">
          <Input id="fname" placeholder="Jane" />
        </FormField>
        <FormField label="Last Name" htmlFor="lname">
          <Input id="lname" placeholder="Doe" />
        </FormField>
        <FormField label="Email" required htmlFor="email-group">
          <Input id="email-group" type="email" placeholder="jane@example.com" />
        </FormField>
      </FormFieldGroup>
    </div>
  ),
};

/**
 * Form field group — Inline
 */
export const FieldGroupInline: Story = {
  render: () => (
    <div className="w-[500px]">
      <FormFieldGroup label="Name" inline>
        <FormField label="First" htmlFor="first">
          <Input id="first" placeholder="Jane" />
        </FormField>
        <FormField label="Last" htmlFor="last">
          <Input id="last" placeholder="Doe" />
        </FormField>
      </FormFieldGroup>
    </div>
  ),
};

/**
 * Form section
 */
export const Section: Story = {
  render: () => (
    <Card className="w-[500px] p-6">
      <FormSection
        title="Account Settings"
        description="Manage your account preferences"
      >
        <FormField label="Display Name" htmlFor="display">
          <Input id="display" placeholder="How others see you" />
        </FormField>
        <FormField label="Email" required htmlFor="section-email">
          <Input id="section-email" type="email" placeholder="your@email.com" />
        </FormField>
        <FormField label="Time Zone" htmlFor="timezone">
          <Select>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="est">Eastern Time</SelectItem>
              <SelectItem value="pst">Pacific Time</SelectItem>
              <SelectItem value="utc">UTC</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </FormSection>
    </Card>
  ),
};

/**
 * Complete form example
 */
export const CompleteForm: Story = {
  render: () => (
    <Card className="w-[500px] p-6">
      <form className="space-y-8">
        <FormSection title="Profile" description="Public information about you">
          <FormField label="Username" required description="This cannot be changed later" htmlFor="cf-user">
            <Input id="cf-user" placeholder="@username" />
          </FormField>
          <FormField
            label="Bio"
            showCounter
            charCount={42}
            maxLength={160}
            htmlFor="cf-bio"
          >
            <Textarea id="cf-bio" placeholder="Tell us about yourself..." rows={3} />
          </FormField>
        </FormSection>

        <FormSection title="Notifications" description="How you want to be notified">
          <FormFieldGroup inline>
            <FormField label="Email notifications" htmlFor="cf-email-notif">
              <Input id="cf-email-notif" type="checkbox" className="w-4 h-4" />
            </FormField>
            <FormField label="Push notifications" htmlFor="cf-push-notif">
              <Input id="cf-push-notif" type="checkbox" className="w-4 h-4" />
            </FormField>
          </FormFieldGroup>
        </FormSection>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost">Cancel</Button>
          <Button variant="cta">Save Changes</Button>
        </div>
      </form>
    </Card>
  ),
};
