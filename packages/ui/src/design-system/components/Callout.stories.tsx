'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Callout, CollapsibleCallout, QuoteCallout } from './Callout';
import * as React from 'react';

const meta: Meta<typeof Callout> = {
  title: 'Design System/Components/Callout',
  component: Callout,
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
type Story = StoryObj<typeof Callout>;

/**
 * Default note callout.
 */
export const Default: Story = {
  args: {
    children: 'This is important information that deserves attention.',
  },
};

/**
 * All callout variants.
 */
export const AllVariants: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Callout variant="note">
        <strong>Note:</strong> This is a default note callout with important information.
      </Callout>
      <Callout variant="tip">
        <strong>Tip:</strong> A helpful suggestion or best practice for you.
      </Callout>
      <Callout variant="warning">
        <strong>Warning:</strong> Be careful about this potential issue.
      </Callout>
      <Callout variant="danger">
        <strong>Danger:</strong> Critical information - do not ignore this.
      </Callout>
      <Callout variant="gold">
        <strong>Pro Tip:</strong> Advanced insight for power users.
      </Callout>
    </div>
  ),
};

/**
 * Callout with custom title.
 */
export const CustomTitle: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Callout variant="note" title="Did you know?">
        You can customize the title of any callout variant.
      </Callout>
      <Callout variant="tip" title="Quick Tip">
        Short titles work best for scanning.
      </Callout>
      <Callout variant="warning" title="Heads Up">
        Custom titles help convey specific context.
      </Callout>
    </div>
  ),
};

/**
 * Callout with custom icon.
 */
export const CustomIcon: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Callout variant="note" icon="🔧" title="Configuration">
        Set these environment variables before deploying.
      </Callout>
      <Callout variant="tip" icon="🚀" title="Performance">
        Enable caching to improve load times by 50%.
      </Callout>
      <Callout variant="warning" icon="🔐" title="Security">
        Never commit API keys to version control.
      </Callout>
    </div>
  ),
};

/**
 * Callout without title.
 */
export const NoTitle: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Callout variant="note" hideTitle>
        Remember to save your changes before leaving this page.
      </Callout>
      <Callout variant="warning" hideTitle>
        This action cannot be undone.
      </Callout>
    </div>
  ),
};

/**
 * Callout without icon.
 */
export const NoIcon: StoryObj = {
  render: () => (
    <Callout variant="note" hideIcon>
      This callout has no icon, just a title and content.
    </Callout>
  ),
};

/**
 * Minimal callout (no icon, no title).
 */
export const Minimal: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Callout variant="note" hideIcon hideTitle>
        Just the content, nothing else.
      </Callout>
      <Callout variant="tip" hideIcon hideTitle>
        Clean and simple callout style.
      </Callout>
    </div>
  ),
};

/**
 * Multi-paragraph callout.
 */
export const MultiParagraph: Story = {
  args: {
    variant: 'note',
    title: 'Extended Information',
    children: (
      <>
        <p>This is the first paragraph with important context about the feature.</p>
        <p className="mt-2">
          This second paragraph provides additional details and explains the nuances
          of how everything works together.
        </p>
        <p className="mt-2">
          And a third paragraph with any final notes or considerations.
        </p>
      </>
    ),
  },
};

/**
 * Callout with code snippet.
 */
export const WithCode: Story = {
  args: {
    variant: 'tip',
    title: 'Code Example',
    children: (
      <>
        <p>Use the following command to install:</p>
        <code className="mt-2 block px-3 py-2 rounded-lg bg-black/30 text-white text-sm font-sans">
          pnpm add @hive/ui
        </code>
      </>
    ),
  },
};

/**
 * Callout with list.
 */
export const WithList: Story = {
  args: {
    variant: 'warning',
    title: 'Before You Begin',
    children: (
      <ul className="list-disc list-inside space-y-1">
        <li>Back up your existing configuration</li>
        <li>Ensure all tests are passing</li>
        <li>Notify your team members</li>
        <li>Schedule a maintenance window</li>
      </ul>
    ),
  },
};

/**
 * Collapsible callout (closed by default).
 */
export const Collapsible: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <CollapsibleCallout variant="note" title="Show Details">
        <p>Hidden content revealed when expanded!</p>
        <p className="mt-2">
          This can contain any amount of content that you want to hide
          until the user explicitly requests to see it.
        </p>
      </CollapsibleCallout>

      <CollapsibleCallout variant="tip" title="Advanced Options">
        <ul className="list-disc list-inside space-y-1">
          <li>Enable experimental features</li>
          <li>Configure custom shortcuts</li>
          <li>Set up automation rules</li>
        </ul>
      </CollapsibleCallout>
    </div>
  ),
};

/**
 * Collapsible callout (expanded by default).
 */
export const CollapsibleExpanded: StoryObj = {
  render: () => (
    <CollapsibleCallout variant="warning" title="Important Notice" defaultExpanded>
      <p>
        This content is visible by default because it&apos;s important enough
        to show immediately.
      </p>
    </CollapsibleCallout>
  ),
};

/**
 * Quote callout.
 */
export const Quote: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <QuoteCallout author="Steve Jobs">
        Design is not just what it looks like and feels like. Design is how it works.
      </QuoteCallout>

      <QuoteCallout author="Dieter Rams" authorTitle="Former Design Director, Braun">
        Good design is as little design as possible.
      </QuoteCallout>
    </div>
  ),
};

/**
 * Quote callout without author.
 */
export const AnonymousQuote: StoryObj = {
  render: () => (
    <QuoteCallout>
      The best time to plant a tree was 20 years ago. The second best time is now.
    </QuoteCallout>
  ),
};

/**
 * Callouts in context (documentation example).
 */
export const InContext: StoryObj = {
  render: () => (
    <div className="space-y-6 text-white">
      <h1 className="text-2xl font-bold">Getting Started Guide</h1>

      <p className="text-[var(--color-text-muted)]">
        Welcome to the platform! Follow these steps to set up your account.
      </p>

      <Callout variant="note">
        This guide assumes you already have Node.js 18+ installed on your system.
      </Callout>

      <h2 className="text-lg font-semibold mt-6">Step 1: Installation</h2>

      <Callout variant="tip" icon="💡" title="Recommended">
        Use pnpm for faster installation and better disk space usage.
      </Callout>

      <code className="block px-4 py-3 rounded-lg bg-black/50 text-sm font-sans">
        pnpm create hive-app my-project
      </code>

      <Callout variant="warning">
        Make sure you have at least 2GB of free disk space before proceeding.
      </Callout>

      <h2 className="text-lg font-semibold mt-6">Step 2: Configuration</h2>

      <CollapsibleCallout variant="note" title="Environment Variables">
        <code className="block px-3 py-2 rounded bg-black/30 text-sm font-sans">
          HIVE_API_KEY=your_key_here<br />
          HIVE_ENV=development
        </code>
      </CollapsibleCallout>

      <Callout variant="danger">
        Never commit your API keys to version control. Use environment variables
        or a secrets manager instead.
      </Callout>

      <QuoteCallout author="HIVE Team">
        Ship fast, iterate faster. The best product is the one that solves
        real problems for real people.
      </QuoteCallout>
    </div>
  ),
};

/**
 * Nested callout example.
 */
export const Nested: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Callout variant="note" title="Parent Callout">
        <p>This is the main callout content.</p>
        <div className="mt-4">
          <Callout variant="tip" title="Nested Tip">
            You can nest callouts for hierarchical information!
          </Callout>
        </div>
      </Callout>
    </div>
  ),
};
