import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';
import { Label } from './Label';
import { Text } from './Text';

/**
 * Textarea — Multi-line text input
 *
 * Focus ring is WHITE, never gold.
 * Supports auto-resize based on content.
 *
 * @see docs/design-system/PRIMITIVES.md (Textarea)
 */
const meta: Meta<typeof Textarea> = {
  title: 'Design System/Primitives/Inputs/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-line text input with WHITE focus ring (never gold). Supports auto-resize.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Textarea size',
    },
    error: {
      control: 'boolean',
      description: 'Error state',
    },
    autoResize: {
      control: 'boolean',
      description: 'Auto-resize based on content',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

/**
 * Default — Standard textarea
 */
export const Default: Story = {
  args: {
    placeholder: 'Write your message...',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div>
        <Text size="xs" tone="muted" className="mb-1">Small (80px min)</Text>
        <Textarea size="sm" placeholder="Small textarea" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Default (120px min)</Text>
        <Textarea size="default" placeholder="Default textarea" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Large (160px min)</Text>
        <Textarea size="lg" placeholder="Large textarea" />
      </div>
    </div>
  ),
};

/**
 * Auto-resize — Grows with content
 */
export const AutoResize: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Text size="sm" tone="muted">
        Type to see the textarea grow with content (max 300px):
      </Text>
      <Textarea
        autoResize
        maxHeight={300}
        placeholder="Start typing... the textarea will grow as you add more content"
      />
    </div>
  ),
};

/**
 * Error state — Red border
 */
export const ErrorState: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="bio-error">Bio</Label>
      <Textarea
        id="bio-error"
        placeholder="Tell us about yourself..."
        error
        defaultValue="x"
      />
      <Text size="xs" className="text-[var(--color-status-error)]">
        Bio must be at least 20 characters
      </Text>
    </div>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Cannot edit...',
    defaultValue: 'This content cannot be edited.',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * Focus state — WHITE ring (never gold)
 */
export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Text size="sm" tone="muted">
        Tab to see WHITE focus ring (never gold):
      </Text>
      <Textarea placeholder="Focus me to see white ring" />
    </div>
  ),
};

/**
 * With character count
 */
export const WithCharacterCount: Story = {
  render: () => {
    const maxLength = 280;
    const currentLength = 47;
    return (
      <div className="flex flex-col gap-2 w-80">
        <Label htmlFor="post">What&apos;s happening?</Label>
        <Textarea
          id="post"
          placeholder="Share your thoughts..."
          defaultValue="Just shipped the new design system primitives!"
          maxLength={maxLength}
        />
        <div className="flex justify-end">
          <Text size="xs" tone="muted">
            {currentLength}/{maxLength}
          </Text>
        </div>
      </div>
    );
  },
};

/**
 * In context — Space description
 */
export const SpaceDescriptionContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-96 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div>
        <Text weight="medium">Space Description</Text>
        <Text size="sm" tone="muted">
          Describe what this space is about
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <Textarea
          autoResize
          maxHeight={200}
          placeholder="A community for..."
          defaultValue="A community for students interested in web development, from beginners to experts. We share resources, collaborate on projects, and help each other grow."
        />
        <Text size="xs" tone="muted">
          Markdown supported
        </Text>
      </div>
    </div>
  ),
};

/**
 * In context — Chat composer
 */
export const ChatComposerContext: Story = {
  render: () => (
    <div className="flex gap-3 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] w-[500px]">
      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-card)] flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Textarea
          size="sm"
          autoResize
          maxHeight={200}
          placeholder="Message #general"
          className="min-h-[40px]"
        />
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="p-1.5 rounded hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button className="p-1.5 rounded hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-page)] text-sm font-medium">
            Send
          </button>
        </div>
      </div>
    </div>
  ),
};
