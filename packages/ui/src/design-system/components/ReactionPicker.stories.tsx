import type { Meta, StoryObj } from '@storybook/react';
import {
  ReactionPicker,
  ReactionPickerMinimal,
  ReactionPickerGrid,
  ReactionPickerPopover,
} from './ReactionPicker';
import { Text, Button, Card } from '../primitives';

const meta: Meta<typeof ReactionPicker> = {
  title: 'Design System/Components/Chat/ReactionPicker',
  component: ReactionPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Emoji reaction picker for chat messages. Three variants: minimal, grid, popover.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['minimal', 'grid', 'popover'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReactionPicker>;

/**
 * Minimal — Quick emoji bar
 */
export const Minimal: Story = {
  args: {
    variant: 'minimal',
    onSelect: (emoji) => console.log('Selected:', emoji),
  },
};

/**
 * Grid — Full emoji picker with categories
 */
export const Grid: Story = {
  args: {
    variant: 'grid',
    onSelect: (emoji) => console.log('Selected:', emoji),
  },
};

/**
 * Popover — Click to open grid
 */
export const Popover: Story = {
  args: {
    variant: 'popover',
    onSelect: (emoji) => console.log('Selected:', emoji),
  },
};

/**
 * With selection
 */
export const WithSelection: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size="sm" tone="muted">
        Selected emoji is highlighted:
      </Text>
      <ReactionPickerMinimal
        onSelect={(emoji) => console.log('Selected:', emoji)}
        selected="❤️"
      />
    </div>
  ),
};

/**
 * Custom quick emojis
 */
export const CustomEmojis: Story = {
  render: () => (
    <ReactionPickerMinimal
      onSelect={(emoji) => console.log('Selected:', emoji)}
      quickEmojis={['✅', '❌', '🤔', '👍', '👎', '⚡']}
    />
  ),
};

/**
 * Popover with custom trigger
 */
export const CustomTrigger: Story = {
  render: () => (
    <ReactionPickerPopover
      onSelect={(emoji) => console.log('Selected:', emoji)}
      trigger={
        <Button variant="secondary" size="sm">
          Add Reaction 😊
        </Button>
      }
    />
  ),
};

/**
 * In context — Chat message hover
 */
export const ChatMessageContext: Story = {
  render: () => (
    <div className="relative">
      <Card className="max-w-md p-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-elevated)]" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Text weight="medium" size="sm">
                Jane Doe
              </Text>
              <Text size="xs" tone="muted">
                2:34 PM
              </Text>
            </div>
            <Text size="sm" className="mt-1">
              Hey! Anyone want to study for the midterm?
            </Text>
          </div>
        </div>
      </Card>

      {/* Reaction picker appears on hover */}
      <div className="absolute -bottom-4 right-4">
        <ReactionPickerMinimal
          onSelect={(emoji) => console.log('Selected:', emoji)}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Minimal picker appears on message hover for quick reactions.',
      },
    },
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Minimal (quick picks)
        </Text>
        <ReactionPickerMinimal
          onSelect={(emoji) => console.log('Selected:', emoji)}
        />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Grid (full picker)
        </Text>
        <ReactionPickerGrid
          onSelect={(emoji) => console.log('Selected:', emoji)}
        />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Popover (click to open)
        </Text>
        <ReactionPickerPopover
          onSelect={(emoji) => console.log('Selected:', emoji)}
        />
      </div>
    </div>
  ),
};
