'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Separator,
  LabeledSeparator,
  IconSeparator,
  DotSeparator,
  SlashSeparator,
  VerticalDivider,
} from './Separator';

const meta: Meta<typeof Separator> = {
  title: 'Design System/Components/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
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
type Story = StoryObj<typeof Separator>;

/**
 * Default horizontal separator.
 */
export const Default: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-white">Content above the separator</p>
      <Separator />
      <p className="text-white">Content below the separator</p>
    </div>
  ),
};

/**
 * Separator variants.
 */
export const Variants: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Solid (default)</p>
        <Separator variant="solid" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Dashed</p>
        <Separator variant="dashed" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Dotted</p>
        <Separator variant="dotted" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Gradient</p>
        <Separator variant="gradient" />
      </div>
    </div>
  ),
};

/**
 * Separator sizes.
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Thin (default)</p>
        <Separator size="thin" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Medium</p>
        <Separator size="medium" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Thick</p>
        <Separator size="thick" />
      </div>
    </div>
  ),
};

/**
 * Separator colors.
 */
export const Colors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Default</p>
        <Separator color="default" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Muted</p>
        <Separator color="muted" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Subtle</p>
        <Separator color="subtle" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Accent (gold - use sparingly)</p>
        <Separator color="accent" />
      </div>
    </div>
  ),
};

/**
 * With spacing.
 */
export const WithSpacing: StoryObj = {
  render: () => (
    <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <p className="text-white">No spacing</p>
      <Separator spacing="none" />
      <p className="text-white">Small spacing (my-2)</p>
      <Separator spacing="sm" />
      <p className="text-white">Medium spacing (my-4)</p>
      <Separator spacing="md" />
      <p className="text-white">Large spacing (my-6)</p>
      <Separator spacing="lg" />
      <p className="text-white">XL spacing (my-8)</p>
      <Separator spacing="xl" />
      <p className="text-white">End</p>
    </div>
  ),
};

/**
 * Vertical separator.
 */
export const Vertical: StoryObj = {
  render: () => (
    <div className="flex items-center h-16 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <span className="text-white">Left</span>
      <Separator orientation="vertical" spacing="md" className="h-full" />
      <span className="text-white">Middle</span>
      <Separator orientation="vertical" spacing="md" className="h-full" />
      <span className="text-white">Right</span>
    </div>
  ),
};

/**
 * LabeledSeparator - with text.
 */
export const WithLabel: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Center (default)</p>
        <LabeledSeparator label="OR" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Left aligned</p>
        <LabeledSeparator label="Section" labelPosition="left" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Right aligned</p>
        <LabeledSeparator label="More" labelPosition="right" />
      </div>
    </div>
  ),
};

/**
 * LabeledSeparator variants.
 */
export const LabeledVariants: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <LabeledSeparator label="Solid" variant="solid" />
      <LabeledSeparator label="Dashed" variant="dashed" />
      <LabeledSeparator label="Dotted" variant="dotted" />
    </div>
  ),
};

/**
 * IconSeparator - with icon.
 */
export const WithIcon: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <IconSeparator icon="•" />
      <IconSeparator icon="✦" />
      <IconSeparator icon="⚡" />
      <IconSeparator
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
      />
    </div>
  ),
};

/**
 * DotSeparator - inline dots.
 */
export const Dots: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-white">
        <span>Item 1</span>
        <DotSeparator size="sm" />
        <span>Item 2</span>
        <DotSeparator size="sm" />
        <span>Item 3</span>
      </div>
      <div className="flex items-center gap-3 text-white">
        <span>Author</span>
        <DotSeparator size="md" />
        <span>Jan 5, 2026</span>
        <DotSeparator size="md" />
        <span>5 min read</span>
      </div>
      <div className="flex items-center gap-4 text-lg text-white">
        <span>Large</span>
        <DotSeparator size="lg" />
        <span>Dots</span>
      </div>
    </div>
  ),
};

/**
 * SlashSeparator - breadcrumb style.
 */
export const Slashes: StoryObj = {
  render: () => (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-white">Home</span>
      <SlashSeparator />
      <span className="text-white">Products</span>
      <SlashSeparator />
      <span className="text-[var(--color-text-muted)]">Category</span>
    </div>
  ),
};

/**
 * VerticalDivider - flex rows.
 */
export const VerticalDividerExample: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <span className="text-white">Left</span>
        <VerticalDivider height="1rem" spacing="md" />
        <span className="text-white">Right</span>
      </div>
      <div className="flex items-center">
        <span className="text-white">Tall divider</span>
        <VerticalDivider height="2rem" spacing="lg" />
        <span className="text-white">Content</span>
      </div>
    </div>
  ),
};

/**
 * Form section example.
 */
export const FormSections: StoryObj = {
  render: () => (
    <div className="p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <h3 className="font-medium text-white mb-4">Account Information</h3>
      <div className="space-y-4">
        <div className="h-10 rounded bg-white/5" />
        <div className="h-10 rounded bg-white/5" />
      </div>

      <LabeledSeparator label="OR" spacing="lg" />

      <h3 className="font-medium text-white mb-4">Social Login</h3>
      <div className="space-y-4">
        <div className="h-10 rounded bg-white/5" />
      </div>
    </div>
  ),
};

/**
 * Menu divider example.
 */
export const MenuDivider: StoryObj = {
  render: () => (
    <div className="w-56 p-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white cursor-pointer">
        New File
      </div>
      <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white cursor-pointer">
        Open File
      </div>
      <Separator spacing="sm" />
      <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white cursor-pointer">
        Save
      </div>
      <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-white cursor-pointer">
        Save As...
      </div>
      <Separator spacing="sm" />
      <div className="px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-[#FF6B6B] cursor-pointer">
        Delete
      </div>
    </div>
  ),
};

/**
 * Stats row with dividers.
 */
export const StatsRow: StoryObj = {
  render: () => (
    <div className="flex items-center justify-center gap-6 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <div className="text-center">
        <p className="text-2xl font-bold text-white">1,234</p>
        <p className="text-xs text-[var(--color-text-muted)]">Members</p>
      </div>
      <VerticalDivider height="3rem" spacing="sm" />
      <div className="text-center">
        <p className="text-2xl font-bold text-white">567</p>
        <p className="text-xs text-[var(--color-text-muted)]">Posts</p>
      </div>
      <VerticalDivider height="3rem" spacing="sm" />
      <div className="text-center">
        <p className="text-2xl font-bold text-white">89</p>
        <p className="text-xs text-[var(--color-text-muted)]">Tools</p>
      </div>
    </div>
  ),
};

/**
 * Metadata line with dots.
 */
export const MetadataLine: StoryObj = {
  render: () => (
    <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <h3 className="font-medium text-white mb-2">Article Title</h3>
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <span>John Doe</span>
        <DotSeparator />
        <span>Jan 5, 2026</span>
        <DotSeparator />
        <span>5 min read</span>
        <DotSeparator />
        <span>Technology</span>
      </div>
    </div>
  ),
};

/**
 * Continue reading pattern.
 */
export const ContinueReading: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <p className="text-white leading-relaxed">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua.
      </p>
      <IconSeparator icon="···" variant="dotted" color="muted" />
      <p className="text-[var(--color-text-muted)] text-sm">Continue reading below</p>
    </div>
  ),
};

/**
 * All together - comprehensive example.
 */
export const Comprehensive: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-white mb-4">Component Library</h2>

        <Separator spacing="md" />

        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <span>UI</span>
          <SlashSeparator />
          <span>Components</span>
          <SlashSeparator />
          <span className="text-white">Separator</span>
        </div>

        <Separator variant="gradient" spacing="lg" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white">v1.0.0</span>
            <DotSeparator />
            <span className="text-[var(--color-text-muted)]">Stable</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-white">Docs</span>
            <VerticalDivider height="1rem" spacing="sm" />
            <span className="text-sm text-white">GitHub</span>
          </div>
        </div>

        <LabeledSeparator label="Features" spacing="lg" />

        <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
          <li>• Multiple variants</li>
          <li>• Customizable spacing</li>
          <li>• Labeled separators</li>
        </ul>
      </div>
    </div>
  ),
};
