'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { VisuallyHidden, VisuallyHiddenInput, FocusableVisuallyHidden } from './VisuallyHidden';

const meta: Meta<typeof VisuallyHidden> = {
  title: 'Design System/Components/VisuallyHidden',
  component: VisuallyHidden,
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
};

export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

/**
 * Icon-only button with accessible label.
 */
export const IconButton: Story = {
  render: () => (
    <button
      type="button"
      className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
      aria-label="Close"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      <VisuallyHidden>Close dialog</VisuallyHidden>
    </button>
  ),
};

/**
 * Search input with hidden label.
 */
export const SearchInput: Story = {
  render: () => (
    <div className="relative">
      <label>
        <VisuallyHidden>Search</VisuallyHidden>
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Search..."
          className="w-64 pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-white placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-white/50"
        />
      </label>
    </div>
  ),
};

/**
 * Social media buttons with accessible labels.
 */
export const SocialButtons: Story = {
  render: () => (
    <div className="flex gap-2">
      {[
        { name: 'Twitter', icon: '𝕏' },
        { name: 'GitHub', icon: '⌨' },
        { name: 'LinkedIn', icon: 'in' },
      ].map((social) => (
        <button
          key={social.name}
          type="button"
          className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center"
        >
          <span className="text-lg">{social.icon}</span>
          <VisuallyHidden>Follow on {social.name}</VisuallyHidden>
        </button>
      ))}
    </div>
  ),
};

/**
 * Table with visually hidden caption.
 */
export const TableCaption: Story = {
  render: () => (
    <table className="w-full text-sm">
      <caption>
        <VisuallyHidden>User statistics for Q4 2025</VisuallyHidden>
      </caption>
      <thead>
        <tr className="border-b border-[var(--color-border)]">
          <th className="py-2 px-3 text-left text-[var(--color-text-muted)]">Name</th>
          <th className="py-2 px-3 text-left text-[var(--color-text-muted)]">Role</th>
          <th className="py-2 px-3 text-left text-[var(--color-text-muted)]">Status</th>
        </tr>
      </thead>
      <tbody>
        {[
          { name: 'Alice', role: 'Admin', status: 'Active' },
          { name: 'Bob', role: 'User', status: 'Active' },
          { name: 'Charlie', role: 'User', status: 'Pending' },
        ].map((user) => (
          <tr key={user.name} className="border-b border-[var(--color-border)]">
            <td className="py-2 px-3 text-white">{user.name}</td>
            <td className="py-2 px-3 text-white">{user.role}</td>
            <td className="py-2 px-3 text-white">{user.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/**
 * Skip link that becomes visible on focus.
 */
export const SkipLink: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        Press Tab to reveal the skip link:
      </p>
      <div className="relative">
        <FocusableVisuallyHidden href="#main-content">
          Skip to main content
        </FocusableVisuallyHidden>
        <button className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm">
          Focusable element
        </button>
      </div>
      <div id="main-content" className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <p className="text-white">Main content area</p>
      </div>
    </div>
  ),
};

/**
 * Custom checkbox with hidden native input.
 */
export const CustomCheckbox: Story = {
  render: () => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <span className="relative">
        <VisuallyHiddenInput
          type="checkbox"
          className="peer"
        />
        <span className="w-5 h-5 rounded border-2 border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex items-center justify-center peer-checked:bg-[#FFD700] peer-checked:border-[#FFD700] peer-focus:ring-2 peer-focus:ring-white/50 transition-colors">
          <svg className="w-3 h-3 text-black opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
      </span>
      <span className="text-sm text-white">Subscribe to newsletter</span>
    </label>
  ),
};

/**
 * Icon-only navigation.
 */
export const IconNavigation: Story = {
  render: () => (
    <nav className="p-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <ul className="flex gap-1">
        {[
          { label: 'Home', icon: '🏠' },
          { label: 'Search', icon: '🔍' },
          { label: 'Notifications', icon: '🔔' },
          { label: 'Messages', icon: '✉️' },
          { label: 'Profile', icon: '👤' },
        ].map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              <VisuallyHidden>{item.label}</VisuallyHidden>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  ),
};

/**
 * Decorative vs meaningful image.
 */
export const ImageAccessibility: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-white mb-2">Decorative image (hidden from AT)</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text-muted)]">
            User profile section
          </p>
        </div>
      </div>
      <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-white mb-2">Meaningful image (with alt text)</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-[var(--color-bg-page)] flex items-center justify-center text-2xl">
            📊
            <VisuallyHidden>Chart showing 45% growth in user engagement</VisuallyHidden>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Engagement statistics
          </p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Loading state with accessible status.
 */
export const LoadingStatus: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <VisuallyHidden aria-live="polite">Loading, please wait...</VisuallyHidden>
      <span className="text-sm text-white">Loading</span>
    </div>
  ),
};
