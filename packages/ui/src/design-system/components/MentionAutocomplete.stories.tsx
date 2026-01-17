import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MentionAutocomplete, useMentionAutocomplete, MentionUser } from './MentionAutocomplete';
import { Text, Card, Input } from '../primitives';

const mockUsers: MentionUser[] = [
  { id: '1', name: 'Jane Doe', handle: 'janedoe', avatar: null, status: 'online' },
  { id: '2', name: 'John Smith', handle: 'johnsmith', avatar: null, status: 'online' },
  { id: '3', name: 'Alice Johnson', handle: 'alicej', avatar: null, status: 'away' },
  { id: '4', name: 'Bob Wilson', handle: 'bobwilson', avatar: null, status: 'offline' },
  { id: '5', name: 'Carol Martinez', handle: 'carolm', avatar: null, status: 'online' },
  { id: '6', name: 'Dave Brown', handle: 'daveb', avatar: null, status: 'offline' },
  { id: '7', name: 'Eve Davis', handle: 'eved', avatar: null, status: 'away' },
  { id: '8', name: 'Frank Miller', handle: 'frankm', avatar: null, status: 'online' },
];

const meta: Meta<typeof MentionAutocomplete> = {
  title: 'Design System/Components/Chat/MentionAutocomplete',
  component: MentionAutocomplete,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '@user mention dropdown for chat. Two variants: basic (names only), preview (with avatar & status).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['basic', 'preview'],
    },
    loading: {
      control: 'boolean',
    },
    selectedIndex: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MentionAutocomplete>;

/**
 * Default — Preview variant
 */
export const Default: Story = {
  args: {
    users: mockUsers.slice(0, 5),
    selectedIndex: 0,
    onSelect: (user) => console.log('Selected:', user),
    variant: 'preview',
  },
};

/**
 * Basic variant
 */
export const Basic: Story = {
  args: {
    users: mockUsers.slice(0, 5),
    selectedIndex: 0,
    onSelect: (user) => console.log('Selected:', user),
    variant: 'basic',
  },
};

/**
 * With search query highlighting
 */
export const WithQuery: Story = {
  render: () => (
    <div className="w-64">
      <MentionAutocomplete
        users={mockUsers.filter((u) => u.name.toLowerCase().includes('j'))}
        selectedIndex={0}
        onSelect={(user) => console.log('Selected:', user)}
        query="j"
        variant="preview"
      />
    </div>
  ),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    users: [],
    loading: true,
    onSelect: () => {},
    variant: 'preview',
  },
};

/**
 * With selection
 */
export const WithSelection: Story = {
  render: () => {
    const [selected, setSelected] = useState(2);
    return (
      <div className="w-64">
        <Text size="xs" tone="muted" className="mb-2">
          Use arrow keys to navigate:
        </Text>
        <MentionAutocomplete
          users={mockUsers.slice(0, 5)}
          selectedIndex={selected}
          onSelect={(user) => console.log('Selected:', user)}
          variant="preview"
        />
        <div className="flex gap-2 mt-4">
          <button
            className="px-3 py-1 text-xs bg-[var(--color-bg-elevated)] rounded"
            onClick={() => setSelected((i) => Math.max(0, i - 1))}
          >
            ↑ Up
          </button>
          <button
            className="px-3 py-1 text-xs bg-[var(--color-bg-elevated)] rounded"
            onClick={() => setSelected((i) => Math.min(4, i + 1))}
          >
            ↓ Down
          </button>
        </div>
      </div>
    );
  },
};

/**
 * Interactive with hook
 */
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [mentionedUsers, setMentionedUsers] = useState<MentionUser[]>([]);

    const {
      isOpen,
      query,
      filteredUsers,
      selectedIndex,
      handleKeyDown,
      handleInputChange,
      selectUser,
    } = useMentionAutocomplete({
      users: mockUsers,
      onMention: (user) => {
        // Replace @query with @handle
        const regex = /@\w*$/;
        setValue((v) => v.replace(regex, `@${user.handle} `));
        setMentionedUsers((users) => [...users, user]);
      },
    });

    return (
      <div className="w-80">
        <Card className="p-4">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                handleInputChange(e.target.value, e.target.selectionStart || 0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type @ to mention someone..."
              className="w-full h-10 px-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm"
            />

            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-full z-50">
                <MentionAutocomplete
                  users={filteredUsers}
                  selectedIndex={selectedIndex}
                  onSelect={selectUser}
                  query={query}
                  variant="preview"
                />
              </div>
            )}
          </div>

          {mentionedUsers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <Text size="xs" tone="muted" className="mb-1">
                Mentioned:
              </Text>
              <div className="flex flex-wrap gap-1">
                {mentionedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="px-2 py-0.5 text-xs bg-[var(--color-bg-elevated)] rounded-full"
                  >
                    @{user.handle}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  },
};

/**
 * In context — Chat composer
 */
export const ChatComposerContext: Story = {
  render: () => {
    const [value, setValue] = useState('Hey @');
    const [showMentions, setShowMentions] = useState(true);

    return (
      <Card className="w-96 p-4">
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type a message..."
            rows={3}
            className="w-full p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm resize-none"
          />

          {showMentions && (
            <div className="absolute bottom-full left-0 mb-1 w-64">
              <MentionAutocomplete
                users={mockUsers.slice(0, 5)}
                selectedIndex={0}
                onSelect={(user) => {
                  setValue(value.replace(/@$/, `@${user.handle} `));
                  setShowMentions(false);
                }}
                query=""
                variant="preview"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-2">
          <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg">
            Send
          </button>
        </div>
      </Card>
    );
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-8">
      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Basic
        </Text>
        <div className="w-56">
          <MentionAutocomplete
            users={mockUsers.slice(0, 4)}
            selectedIndex={1}
            onSelect={() => {}}
            variant="basic"
          />
        </div>
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Preview (with avatar & status)
        </Text>
        <div className="w-64">
          <MentionAutocomplete
            users={mockUsers.slice(0, 4)}
            selectedIndex={1}
            onSelect={() => {}}
            variant="preview"
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * Filtered with no results
 */
export const NoResults: Story = {
  render: () => (
    <div className="w-64">
      <MentionAutocomplete
        users={[]}
        selectedIndex={-1}
        onSelect={() => {}}
        query="xyz"
        variant="preview"
      />
    </div>
  ),
};
