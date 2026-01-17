import type { Meta, StoryObj } from '@storybook/react';
import { Mono } from './Mono';
import { Text } from './Text';

/**
 * Mono — Code and technical text
 *
 * Uses Geist Mono font for code snippets and technical content.
 * Use inline={true} for inline code within text.
 *
 * @see docs/design-system/PRIMITIVES.md (Typography Primitives)
 */
const meta: Meta<typeof Mono> = {
  title: 'Design System/Primitives/Typography/Mono',
  component: Mono,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Monospace text for code, commands, and technical content. Uses Geist Mono.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm', 'xs'],
      description: 'Size: default (14px), sm (13px), xs (12px)',
    },
    inline: {
      control: 'boolean',
      description: 'Inline code styling with background',
    },
    as: {
      control: 'select',
      options: ['code', 'pre', 'span', 'div'],
      description: 'HTML element to render as',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Mono>;

/**
 * Default — Block code text
 */
export const Default: Story = {
  args: {
    children: 'const hive = createSpace({ name: "Design Club" })',
  },
};

/**
 * Inline — Code within text
 */
export const Inline: Story = {
  args: {
    inline: true,
    children: 'npm install @hive/ui',
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Mono size="default">Default (14px) — pnpm dev</Mono>
      <Mono size="sm">Small (13px) — git commit -m "fix"</Mono>
      <Mono size="xs">Extra Small (12px) — v1.0.0</Mono>
    </div>
  ),
};

/**
 * In context — Command with description
 */
export const CommandContext: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Text size="sm" tone="secondary">Run this command to install:</Text>
      <Mono inline>pnpm add @hive/core</Mono>
    </div>
  ),
};

/**
 * In context — Inline within paragraph
 */
export const InlineParagraph: Story = {
  render: () => (
    <Text>
      Use the <Mono inline>createTool()</Mono> function to build new tools
      in HiveLab. Pass a <Mono inline>ToolConfig</Mono> object with your element definitions.
    </Text>
  ),
};

/**
 * Code block — Multi-line
 */
export const CodeBlock: Story = {
  render: () => (
    <pre className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <Mono as="code" size="sm">
{`import { createSpace } from '@hive/core';

const space = createSpace({
  name: 'Design Club',
  campus: 'ub-buffalo',
  type: 'club'
});`}
      </Mono>
    </pre>
  ),
};
