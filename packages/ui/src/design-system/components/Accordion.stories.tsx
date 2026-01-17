'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  SimpleAccordion,
} from './Accordion';
import * as React from 'react';

/**
 * Accordion - LOCKED: January 2026
 *
 * LOCKED DECISIONS:
 * - Header hover: Glass highlight (`bg-white/[0.08]`)
 * - Chevron: 180° rotation, 200ms ease-out
 * - Content: Height transition (animate-accordion-down/up)
 * - Focus: WHITE ring (`ring-white/50`) - never gold
 * - Variants: default (separated), bordered (connected), ghost (minimal)
 *
 * Vertically stacked expandable sections.
 */
const meta: Meta = {
  title: 'Design System/Components/Accordion',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 2026**

Accordion provides expandable content sections with smooth transitions.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Header hover | Glass highlight (\`bg-white/[0.08]\`) | Subtle glass effect |
| Chevron rotation | 180° with 200ms ease-out | Smooth reveal |
| Content animation | Height transition | Native feel |
| Focus ring | WHITE (\`ring-white/50\`) | Never gold |
| Variants | default, bordered, ghost | Different use cases |
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

// =============================================================================
// LOCKED DESIGN SHOWCASE
// =============================================================================

/**
 * **LOCKED DESIGN** - The final approved visual treatment
 *
 * This showcases the canonical Accordion patterns:
 * - Glass highlight hover (`bg-white/[0.08]`)
 * - 180° chevron rotation with smooth easing
 * - Height-based content animation
 * - White focus ring (never gold)
 */
export const LockedDesignShowcase: StoryObj = {
  name: '⭐ Locked Design',
  render: () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-lg font-medium text-white">Accordion - LOCKED</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          January 2026 • Glass highlight hover, 180° chevron, Height animation, White focus
        </p>
      </div>

      {/* Default Variant */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Default (Separated)
          </span>
          <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
            Individual bordered items
          </span>
        </div>
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Hover to see glass highlight</AccordionTrigger>
            <AccordionContent>
              Header hover: <code className="text-[#FFD700] bg-white/5 px-1.5 py-0.5 rounded text-xs">bg-white/[0.08]</code>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Click to see chevron rotate</AccordionTrigger>
            <AccordionContent>
              Chevron: <code className="text-[#FFD700] bg-white/5 px-1.5 py-0.5 rounded text-xs">rotate-180</code> with 200ms ease-out
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <p className="text-xs text-white/40">
          Tab to test focus ring: WHITE ring-white/50 (never gold)
        </p>
      </div>

      {/* Bordered Variant */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Bordered (Connected)
          </span>
          <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
            Shared container
          </span>
        </div>
        <Accordion type="single" collapsible variant="bordered">
          <AccordionItem value="item-1" variant="bordered">
            <AccordionTrigger variant="bordered">Account Settings</AccordionTrigger>
            <AccordionContent>Manage your account settings and preferences.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" variant="bordered">
            <AccordionTrigger variant="bordered">Privacy & Security</AccordionTrigger>
            <AccordionContent>Control your privacy and security options.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Ghost Variant */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Ghost (Minimal)
          </span>
          <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
            No background
          </span>
        </div>
        <Accordion type="single" collapsible variant="ghost">
          <AccordionItem value="item-1" variant="ghost">
            <AccordionTrigger variant="ghost">What is HIVE?</AccordionTrigger>
            <AccordionContent>Student autonomy platform.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" variant="ghost">
            <AccordionTrigger variant="ghost">How do Spaces work?</AccordionTrigger>
            <AccordionContent>Community hubs for collaboration.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* With Icons */}
      <div className="space-y-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          With Icons
        </span>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger icon="📊">Analytics</AccordionTrigger>
            <AccordionContent>View your metrics and insights.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger icon="⚙️">Settings</AccordionTrigger>
            <AccordionContent>Configure your preferences.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  ),
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

/**
 * Default accordion with separated items.
 */
export const Default: StoryObj = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches HIVE&apos;s design system.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default with smooth height transitions.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Bordered variant with connected items.
 */
export const Bordered: StoryObj = {
  render: () => (
    <Accordion type="single" collapsible variant="bordered">
      <AccordionItem value="item-1" variant="bordered">
        <AccordionTrigger variant="bordered">Account Settings</AccordionTrigger>
        <AccordionContent>
          Manage your account settings, profile information, and preferences.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" variant="bordered">
        <AccordionTrigger variant="bordered">Privacy & Security</AccordionTrigger>
        <AccordionContent>
          Control your privacy settings, manage connected apps, and set up two-factor authentication.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" variant="bordered">
        <AccordionTrigger variant="bordered">Notifications</AccordionTrigger>
        <AccordionContent>
          Configure email, push, and in-app notification preferences.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Ghost variant with minimal styling.
 */
export const Ghost: StoryObj = {
  render: () => (
    <Accordion type="single" collapsible variant="ghost">
      <AccordionItem value="item-1" variant="ghost">
        <AccordionTrigger variant="ghost">What is HIVE?</AccordionTrigger>
        <AccordionContent>
          HIVE is a student autonomy platform combining community, creation, and connection.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" variant="ghost">
        <AccordionTrigger variant="ghost">How do Spaces work?</AccordionTrigger>
        <AccordionContent>
          Spaces are community hubs where members can chat, share resources, and collaborate.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" variant="ghost">
        <AccordionTrigger variant="ghost">What is HiveLab?</AccordionTrigger>
        <AccordionContent>
          HiveLab is our no-code tool builder that lets you create custom campus tools.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Multiple items can be expanded simultaneously.
 */
export const MultipleExpanded: StoryObj = {
  render: () => (
    <Accordion type="multiple" defaultValue={['item-1', 'item-2']}>
      <AccordionItem value="item-1">
        <AccordionTrigger>First Section</AccordionTrigger>
        <AccordionContent>
          This section is expanded by default.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second Section</AccordionTrigger>
        <AccordionContent>
          This section is also expanded by default.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third Section</AccordionTrigger>
        <AccordionContent>
          This section starts collapsed but can be opened.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Accordion items with icons.
 */
export const WithIcons: StoryObj = {
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger icon="📊">Analytics Overview</AccordionTrigger>
        <AccordionContent>
          View detailed analytics and metrics for your spaces and tools.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger icon="⚙️">Settings</AccordionTrigger>
        <AccordionContent>
          Configure your preferences and account settings.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger icon="🔔">Notifications</AccordionTrigger>
        <AccordionContent>
          Manage your notification preferences.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Disabled item.
 */
export const WithDisabled: StoryObj = {
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Available Section</AccordionTrigger>
        <AccordionContent>
          This section is available and can be expanded.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled>
        <AccordionTrigger>Disabled Section</AccordionTrigger>
        <AccordionContent>
          This content cannot be accessed.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Another Available Section</AccordionTrigger>
        <AccordionContent>
          This section is also available.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Rich content inside accordion.
 */
export const RichContent: StoryObj = {
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Features</AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside space-y-2">
            <li>Real-time collaboration</li>
            <li>Custom tool builder</li>
            <li>AI-powered assistance</li>
            <li>Campus-wide community</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Getting Started</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <p>Follow these steps to get started:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create your account</li>
              <li>Join your first space</li>
              <li>Explore HiveLab</li>
            </ol>
            <button className="mt-2 px-3 py-1.5 rounded-lg bg-[#FFD700] text-black text-sm font-medium">
              Start Now
            </button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * SimpleAccordion with items prop.
 */
export const Simple: StoryObj = {
  render: () => (
    <SimpleAccordion
      items={[
        {
          value: 'spaces',
          title: 'Spaces',
          icon: '🏠',
          content: 'Community hubs for student organizations.',
        },
        {
          value: 'hivelab',
          title: 'HiveLab',
          icon: '🔧',
          content: 'No-code tool builder for campus apps.',
        },
        {
          value: 'profiles',
          title: 'Profiles',
          icon: '👤',
          content: 'Your identity and connections on HIVE.',
        },
      ]}
      defaultValue="spaces"
    />
  ),
};

/**
 * SimpleAccordion with multiple expansion.
 */
export const SimpleMultiple: StoryObj = {
  render: () => (
    <SimpleAccordion
      items={[
        {
          value: 'one',
          title: 'Section One',
          content: 'Content for section one.',
        },
        {
          value: 'two',
          title: 'Section Two',
          content: 'Content for section two.',
        },
        {
          value: 'three',
          title: 'Section Three',
          content: 'Content for section three.',
        },
      ]}
      multiple
      defaultValue={['one', 'two']}
    />
  ),
};

/**
 * FAQ style accordion.
 */
export const FAQ: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible variant="bordered">
        <AccordionItem value="q1" variant="bordered">
          <AccordionTrigger variant="bordered">How do I create a Space?</AccordionTrigger>
          <AccordionContent>
            Navigate to Spaces → Create, fill out the form with your space details,
            and invite your first members. Spaces can be public or private.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q2" variant="bordered">
          <AccordionTrigger variant="bordered">Can I build tools without coding?</AccordionTrigger>
          <AccordionContent>
            Yes! HiveLab is our no-code tool builder. Drag and drop elements,
            configure their behavior, and deploy to your spaces.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q3" variant="bordered">
          <AccordionTrigger variant="bordered">How does privacy work?</AccordionTrigger>
          <AccordionContent>
            HIVE offers 4 privacy levels: Public (everyone), Campus (students only),
            Space (members only), and Ghost Mode (fully invisible).
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q4" variant="bordered">
          <AccordionTrigger variant="bordered">Is HIVE free to use?</AccordionTrigger>
          <AccordionContent>
            HIVE is free for all UB students. Just sign in with your @buffalo.edu email.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

/**
 * Controlled accordion.
 */
export const Controlled: StoryObj = {
  render: function ControlledDemo() {
    const [value, setValue] = React.useState('item-1');

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setValue('item-1')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors',
              value === 'item-1' ? 'bg-white text-black' : 'bg-white/10 text-white'
            )}
          >
            Open First
          </button>
          <button
            onClick={() => setValue('item-2')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors',
              value === 'item-2' ? 'bg-white text-black' : 'bg-white/10 text-white'
            )}
          >
            Open Second
          </button>
        </div>
        <Accordion type="single" value={value} onValueChange={setValue}>
          <AccordionItem value="item-1">
            <AccordionTrigger>First Section</AccordionTrigger>
            <AccordionContent>Content for the first section.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second Section</AccordionTrigger>
            <AccordionContent>Content for the second section.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  },
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
