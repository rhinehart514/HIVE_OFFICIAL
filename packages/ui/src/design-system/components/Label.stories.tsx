'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Label, InlineLabel, FieldLabel, ScreenReaderLabel } from './Label';
import * as React from 'react';

const meta: Meta<typeof Label> = {
  title: 'Design System/Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Label>;

/**
 * Default label.
 */
export const Default: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-white/50"
      />
    </div>
  ),
};

/**
 * Label sizes.
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="sm" size="sm">Small Label</Label>
        <input
          id="sm"
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="md" size="md">Medium Label (default)</Label>
        <input
          id="md"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lg" size="lg">Large Label</Label>
        <input
          id="lg"
          className="w-full px-4 py-3 text-lg rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none"
        />
      </div>
    </div>
  ),
};

/**
 * Required field.
 */
export const Required: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="required" required>Email</Label>
      <input
        id="required"
        type="email"
        required
        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none"
      />
    </div>
  ),
};

/**
 * Optional field.
 */
export const Optional: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="optional" optional>Bio</Label>
      <textarea
        id="optional"
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none resize-none"
      />
    </div>
  ),
};

/**
 * With hint text.
 */
export const WithHint: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="password" hint="Must be at least 8 characters">Password</Label>
      <input
        id="password"
        type="password"
        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none"
      />
    </div>
  ),
};

/**
 * With error message.
 */
export const WithError: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="error" error="Please enter a valid email address">Email</Label>
      <input
        id="error"
        type="email"
        defaultValue="invalid"
        className="w-full px-3 py-2 rounded-lg border border-[#FF6B6B] bg-[var(--color-bg-elevated)] text-white outline-none"
      />
    </div>
  ),
};

/**
 * With character count.
 */
export const WithCharacterCount: StoryObj = {
  render: function CharCountDemo() {
    const [value, setValue] = React.useState('Hello world');
    const maxLength = 50;

    return (
      <div className="space-y-2">
        <Label htmlFor="count" count={{ current: value.length, max: maxLength }}>
          Username
        </Label>
        <input
          id="count"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none"
        />
      </div>
    );
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled" disabled>Disabled Field</Label>
      <input
        id="disabled"
        disabled
        defaultValue="Cannot edit"
        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white opacity-50 cursor-not-allowed outline-none"
      />
    </div>
  ),
};

/**
 * InlineLabel - checkbox/radio style.
 */
export const Inline: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          id="checkbox1"
          type="checkbox"
          className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[#FFD700] focus:ring-white/50"
        />
        <InlineLabel htmlFor="checkbox1" position="right">Accept terms and conditions</InlineLabel>
      </div>
      <div className="flex items-center">
        <input
          id="checkbox2"
          type="checkbox"
          defaultChecked
          className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[#FFD700] focus:ring-white/50"
        />
        <InlineLabel htmlFor="checkbox2" position="right">Subscribe to newsletter</InlineLabel>
      </div>
      <div className="flex items-center">
        <InlineLabel htmlFor="text-inline" position="left">Name:</InlineLabel>
        <input
          id="text-inline"
          className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white text-sm outline-none"
        />
      </div>
    </div>
  ),
};

/**
 * FieldLabel - complete field wrapper.
 */
export const FieldLabelExample: Story = {
  render: () => (
    <div className="space-y-6">
      <FieldLabel
        label="Email"
        htmlFor="field-email"
        required
        hint="We'll never share your email"
      >
        <input
          id="field-email"
          type="email"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none focus:ring-2 focus:ring-white/50"
        />
      </FieldLabel>

      <FieldLabel
        label="Password"
        htmlFor="field-password"
        required
        error="Password is too short"
      >
        <input
          id="field-password"
          type="password"
          defaultValue="123"
          className="w-full px-3 py-2 rounded-lg border border-[#FF6B6B] bg-[var(--color-bg-elevated)] text-white outline-none"
        />
      </FieldLabel>

      <FieldLabel
        label="Bio"
        htmlFor="field-bio"
        optional
        count={{ current: 45, max: 200 }}
      >
        <textarea
          id="field-bio"
          rows={3}
          defaultValue="I'm a software developer..."
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none resize-none"
        />
      </FieldLabel>
    </div>
  ),
};

/**
 * ScreenReaderLabel - visually hidden.
 */
export const ScreenReaderOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        The label below is visually hidden but accessible to screen readers:
      </p>
      <div className="relative">
        <ScreenReaderLabel htmlFor="search">Search</ScreenReaderLabel>
        <input
          id="search"
          type="search"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white placeholder:text-[var(--color-text-muted)] outline-none"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  ),
};

/**
 * Form example with multiple fields.
 */
export const FormExample: Story = {
  render: () => (
    <form className="space-y-6 p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <h3 className="text-lg font-semibold text-white mb-4">Create Account</h3>

      <FieldLabel label="Full Name" htmlFor="name" required>
        <input
          id="name"
          type="text"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-page)] text-white outline-none focus:ring-2 focus:ring-white/50"
        />
      </FieldLabel>

      <FieldLabel label="Email" htmlFor="form-email" required hint="We'll send a verification email">
        <input
          id="form-email"
          type="email"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-page)] text-white outline-none focus:ring-2 focus:ring-white/50"
        />
      </FieldLabel>

      <FieldLabel label="Password" htmlFor="form-password" required hint="Min 8 characters, 1 number">
        <input
          id="form-password"
          type="password"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-page)] text-white outline-none focus:ring-2 focus:ring-white/50"
        />
      </FieldLabel>

      <FieldLabel label="Phone" htmlFor="phone" optional>
        <input
          id="phone"
          type="tel"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-page)] text-white outline-none focus:ring-2 focus:ring-white/50"
        />
      </FieldLabel>

      <div className="flex items-start gap-2">
        <input
          id="terms"
          type="checkbox"
          className="mt-1 w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-page)]"
        />
        <InlineLabel htmlFor="terms" position="right">
          I agree to the Terms of Service and Privacy Policy
        </InlineLabel>
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 rounded-lg bg-[#FFD700] text-black font-medium hover:bg-[#FFD700]/90"
      >
        Create Account
      </button>
    </form>
  ),
};

/**
 * All features combined.
 */
export const Comprehensive: Story = {
  render: () => (
    <div className="space-y-4 p-4 rounded-xl bg-[var(--color-bg-page)] border border-[var(--color-border)]">
      <div className="space-y-2">
        <Label
          htmlFor="comprehensive"
          required
          hint="Enter your display name"
          count={{ current: 12, max: 30 }}
          size="md"
        >
          Display Name
        </Label>
        <input
          id="comprehensive"
          defaultValue="John Doe 123"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white outline-none"
        />
      </div>
    </div>
  ),
};
