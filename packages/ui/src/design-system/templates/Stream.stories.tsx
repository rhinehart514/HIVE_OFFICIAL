import type { Meta, StoryObj } from '@storybook/react';
import { Stream, StreamSection, StreamItem } from './Stream';

/**
 * Stream Template Stories
 *
 * Stream is for temporal content—things that flow through time.
 * Messages, posts, notifications, activity logs.
 */
const meta: Meta<typeof Stream> = {
  title: 'Design System/Templates/Stream',
  component: Stream,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The Stream template handles temporal content flow. It's designed for content that arrives over time—
chat messages, feed posts, notifications, and activity logs.

### Modes
- **conversational**: Reverse scroll for chat, composer at bottom
- **stories**: Normal scroll for feeds, infinite loading
- **sectioned**: Grouped by time period or category

### Key Features
- Automatic scroll direction based on mode
- Built-in infinite scroll with intersection observer
- Scroll-to-top FAB for stories mode
- Empty and loading states
- AtmosphereProvider integration
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', background: 'var(--color-bg-page)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Stream>;

// ============================================
// MOCK DATA
// ============================================

const mockMessages = [
  { id: '1', user: 'Alex', content: 'Hey everyone! Who\'s up for a study session?', time: '2:30 PM' },
  { id: '2', user: 'Jordan', content: 'I\'m in! Library at 4?', time: '2:31 PM' },
  { id: '3', user: 'Sam', content: 'Count me in too 📚', time: '2:32 PM' },
  { id: '4', user: 'Alex', content: 'Perfect! See you there', time: '2:33 PM' },
  { id: '5', user: 'Casey', content: 'Wait for me! Running a bit late', time: '2:35 PM' },
];

const mockPosts = [
  { id: '1', author: 'Design Club', title: 'New workshop announced!', excerpt: 'Learn Figma basics this Friday...', likes: 24 },
  { id: '2', author: 'CS Student Union', title: 'Hackathon registration open', excerpt: 'Build something amazing this weekend...', likes: 156 },
  { id: '3', author: 'Photography Society', title: 'Photo walk tomorrow', excerpt: 'Meet at the quad at 3pm...', likes: 42 },
];

const mockNotifications = {
  today: [
    { id: '1', type: 'mention', text: 'Alex mentioned you in Design Club', time: '10 min ago' },
    { id: '2', type: 'like', text: 'Your post got 10 new likes', time: '1 hour ago' },
  ],
  yesterday: [
    { id: '3', type: 'follow', text: 'Jordan started following you', time: 'Yesterday' },
    { id: '4', type: 'event', text: 'Reminder: Workshop starts in 2 hours', time: 'Yesterday' },
  ],
  earlier: [
    { id: '5', type: 'achievement', text: 'You earned the "Early Adopter" badge', time: '3 days ago' },
  ],
};

// ============================================
// MOCK COMPONENTS
// ============================================

function MockHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <h1 className="font-semibold text-[var(--color-text-primary)]">{title}</h1>
      <button className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        Filter
      </button>
    </div>
  );
}

function MockComposer() {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 bg-[var(--color-bg-surface)] rounded-xl px-4 py-3">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none"
        />
        <button className="text-[var(--color-gold)] hover:text-[var(--color-gold-hover)] transition-colors">
          Send
        </button>
      </div>
    </div>
  );
}

function MockMessage({ user, content, time }: { user: string; content: string; time: string }) {
  return (
    <div className="flex gap-3 py-2">
      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        {user[0]}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-[var(--color-text-primary)]">{user}</span>
          <span className="text-xs text-[var(--color-text-tertiary)]">{time}</span>
        </div>
        <p className="text-[var(--color-text-secondary)] mt-0.5">{content}</p>
      </div>
    </div>
  );
}

function MockPostCard({ author, title, excerpt, likes }: { author: string; title: string; excerpt: string; likes: number }) {
  return (
    <div className="bg-[var(--color-bg-surface)] rounded-xl p-4 mb-3 border border-[var(--color-border-subtle)]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-[var(--color-bg-elevated)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">{author}</span>
      </div>
      <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{excerpt}</p>
      <div className="flex items-center gap-2 mt-3 text-sm text-[var(--color-text-tertiary)]">
        <span>❤️ {likes}</span>
      </div>
    </div>
  );
}

function MockNotification({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--color-bg-surface)] transition-colors">
      <div className="w-2 h-2 rounded-full bg-[var(--color-gold)]" />
      <div className="flex-1">
        <p className="text-sm text-[var(--color-text-primary)]">{text}</p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ============================================
// STORIES
// ============================================

/**
 * Conversational mode for real-time chat.
 * Messages appear at bottom, scroll is reversed.
 */
export const Conversational: Story = {
  args: {
    mode: 'conversational',
    header: <MockHeader title="Design Club" />,
    composer: <MockComposer />,
    maxWidth: 'md',
  },
  render: (args) => (
    <Stream {...args}>
      {mockMessages.map((msg) => (
        <StreamItem key={msg.id}>
          <MockMessage {...msg} />
        </StreamItem>
      ))}
    </Stream>
  ),
};

/**
 * Stories mode for feed-style content.
 * Normal scroll direction with infinite loading.
 */
export const Stories: Story = {
  args: {
    mode: 'stories',
    header: <MockHeader title="Your Feed" />,
    infiniteScroll: true,
    hasMore: true,
    maxWidth: 'md',
  },
  render: (args) => (
    <Stream {...args}>
      {mockPosts.map((post) => (
        <StreamItem key={post.id}>
          <MockPostCard {...post} />
        </StreamItem>
      ))}
    </Stream>
  ),
};

/**
 * Sectioned mode for grouped content like notifications.
 */
export const Sectioned: Story = {
  args: {
    mode: 'sectioned',
    header: <MockHeader title="Notifications" />,
    maxWidth: 'md',
  },
  render: (args) => (
    <Stream {...args}>
      <StreamSection title="Today">
        {mockNotifications.today.map((notif) => (
          <StreamItem key={notif.id}>
            <MockNotification {...notif} />
          </StreamItem>
        ))}
      </StreamSection>
      <StreamSection title="Yesterday">
        {mockNotifications.yesterday.map((notif) => (
          <StreamItem key={notif.id}>
            <MockNotification {...notif} />
          </StreamItem>
        ))}
      </StreamSection>
      <StreamSection title="Earlier">
        {mockNotifications.earlier.map((notif) => (
          <StreamItem key={notif.id}>
            <MockNotification {...notif} />
          </StreamItem>
        ))}
      </StreamSection>
    </Stream>
  ),
};

/**
 * Empty state when no content is available.
 */
export const Empty: Story = {
  args: {
    mode: 'stories',
    header: <MockHeader title="Empty Feed" />,
    maxWidth: 'md',
  },
  render: (args) => <Stream {...args}>{null}</Stream>,
};

/**
 * Loading state for initial load.
 */
export const Loading: Story = {
  args: {
    mode: 'stories',
    header: <MockHeader title="Loading..." />,
    isLoading: true,
    maxWidth: 'md',
  },
  render: (args) => <Stream {...args}>{null}</Stream>,
};

/**
 * Custom empty state.
 */
export const CustomEmptyState: Story = {
  args: {
    mode: 'stories',
    header: <MockHeader title="Custom Empty" />,
    maxWidth: 'md',
    emptyState: (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          All caught up!
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          You've seen everything. Check back later for new content.
        </p>
      </div>
    ),
  },
  render: (args) => <Stream {...args}>{null}</Stream>,
};

/**
 * Full width stream without max-width constraint.
 */
export const FullWidth: Story = {
  args: {
    mode: 'stories',
    header: <MockHeader title="Full Width Feed" />,
    maxWidth: 'full',
    contentPadding: 'lg',
  },
  render: (args) => (
    <Stream {...args}>
      {mockPosts.map((post) => (
        <StreamItem key={post.id}>
          <MockPostCard {...post} />
        </StreamItem>
      ))}
    </Stream>
  ),
};
