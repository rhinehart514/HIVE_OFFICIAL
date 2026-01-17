import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

// Import HIVE domain components
import { SpaceCard, type SpaceCardProps } from '../components/SpaceCard';
import { ChatMessage, type ChatMessageProps } from '../components/ChatMessage';
import { ProfileCard, type ProfileCardProps } from '../components/ProfileCard';
import { EventCard, type EventCardProps } from '../components/EventCard';
import { ToolCard, type ToolCardProps } from '../components/ToolCard';
import { ReactionPicker } from '../components/ReactionPicker';
import { ReactionBadge } from '../components/ReactionBadge';
import { RSVPButton } from '../components/RSVPButton';

const meta: Meta = {
  title: 'Experiments/HIVE Domain Components Lab',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// MOCK DATA
// ============================================

const mockSpace = {
  id: '1',
  name: 'Engineering Club',
  description: 'Where builders come together to create amazing things',
  category: 'Technology',
  memberCount: 156,
  onlineCount: 12,
  members: [
    { id: '1', name: 'Alice', avatar: '' },
    { id: '2', name: 'Bob', avatar: '' },
    { id: '3', name: 'Carol', avatar: '' },
  ],
};

const mockUser = {
  id: '1',
  name: 'Alice Johnson',
  handle: 'alice',
  bio: 'Engineering student passionate about building things',
  status: 'online' as const,
  badges: ['Founding Class', 'Builder'],
};

const mockEvent = {
  id: '1',
  title: 'Weekly Standup',
  type: 'virtual' as const,
  startDate: new Date(Date.now() + 3600000), // 1 hour from now
  location: 'Zoom',
  currentAttendees: 8,
  maxAttendees: 20,
  attendees: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Carol' },
  ],
  organizerName: 'Alice Johnson',
};

const mockTool = {
  id: '1',
  name: 'Event Planner',
  description: 'Plan and manage events for your space',
  creator: { id: '1', name: 'Alice', avatar: '' },
  runCount: 42,
  category: 'Organization',
  isDeployed: true,
};

const mockMessage = {
  id: '1',
  content: 'Hey everyone! Who wants to join the study session tomorrow?',
  author: { id: '1', name: 'Alice Johnson', avatar: '' },
  timestamp: new Date(),
  reactions: [
    { emoji: '👍', count: 3, hasReacted: true },
    { emoji: '🔥', count: 2, hasReacted: false },
  ],
};

// ============================================
// SPACE CARD LAB
// ============================================

/**
 * EXPERIMENT: Space Card Warmth Levels
 * Compare: Activity glow intensities
 * Decisions: Warmth thresholds, edge treatment
 */
export const SpaceCardLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-4xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>SPACE CARD</strong> - Activity warmth + variants
      </div>

      {/* Warmth levels */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Warmth Levels (Activity Edge)
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">None (0 online)</div>
            <SpaceCard
              space={{ ...mockSpace, onlineCount: 0 }}
              warmth="none"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">Low (1-3 online)</div>
            <SpaceCard
              space={{ ...mockSpace, onlineCount: 2 }}
              warmth="low"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">Medium (4-10 online)</div>
            <SpaceCard
              space={{ ...mockSpace, onlineCount: 8 }}
              warmth="medium"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">High (10+ online)</div>
            <SpaceCard
              space={{ ...mockSpace, onlineCount: 25 }}
              warmth="high"
            />
          </div>
        </div>
      </div>

      {/* Size variants */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Size Variants
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Compact</div>
            <SpaceCard space={mockSpace} variant="compact" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Default</div>
            <SpaceCard space={mockSpace} variant="default" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Large</div>
            <SpaceCard space={mockSpace} variant="large" />
          </div>
        </div>
      </div>

      {/* Featured */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Featured Badge
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <SpaceCard space={mockSpace} />
          <SpaceCard space={mockSpace} featured />
        </div>
      </div>
    </div>
  ),
};

// ============================================
// CHAT MESSAGE LAB
// ============================================

/**
 * EXPERIMENT: Chat Message States
 * Compare: Own vs other, pinned, reactions
 * Decisions: Bubble alignment, hover actions
 */
export const ChatMessageLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-2xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>CHAT MESSAGE</strong> - Message bubble states
      </div>

      {/* Message types */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Message Types
        </div>
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)] space-y-3">
          <ChatMessage
            message={mockMessage}
            showAuthor
            showTimestamp
          />
          <ChatMessage
            message={{ ...mockMessage, id: '2', isOwn: true, content: 'I\'m in! What time?' }}
            showAuthor
            showTimestamp
          />
          <ChatMessage
            message={{
              ...mockMessage,
              id: '3',
              content: '3pm works for everyone',
              isPinned: true,
            }}
            showAuthor
            showTimestamp
          />
        </div>
      </div>

      {/* Compact mode */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Compact vs Normal
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Normal</div>
            <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
              <ChatMessage message={mockMessage} showAuthor />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Compact</div>
            <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
              <ChatMessage message={mockMessage} showAuthor compact />
            </div>
          </div>
        </div>
      </div>

      {/* Reactions */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Reaction Components
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <ReactionBadge emoji="👍" count={5} hasReacted />
          <ReactionBadge emoji="🔥" count={3} />
          <ReactionBadge emoji="❤️" count={12} hasReacted />
          <ReactionBadge emoji="😂" count={8} />
        </div>
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
          <div className="text-xs text-[var(--color-text-muted)] mb-2">Reaction Picker:</div>
          <ReactionPicker
            onSelect={(emoji) => console.log('Selected:', emoji)}
          />
        </div>
      </div>
    </div>
  ),
};

// ============================================
// PROFILE CARD LAB
// ============================================

/**
 * EXPERIMENT: Profile Card Variants
 * Compare: compact vs default vs expanded
 * Decisions: Presence indicator, action buttons
 */
export const ProfileCardLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-3xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>PROFILE CARD</strong> - User representation
      </div>

      {/* Variants */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Size Variants
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Compact</div>
            <ProfileCard user={mockUser} variant="compact" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Default</div>
            <ProfileCard user={mockUser} variant="default" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Expanded</div>
            <ProfileCard user={mockUser} variant="expanded" />
          </div>
        </div>
      </div>

      {/* Presence states */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Presence States
        </div>
        <div className="grid grid-cols-4 gap-4">
          <ProfileCard user={{ ...mockUser, status: 'online' }} variant="compact" />
          <ProfileCard user={{ ...mockUser, status: 'away' }} variant="compact" />
          <ProfileCard user={{ ...mockUser, status: 'dnd' }} variant="compact" />
          <ProfileCard user={{ ...mockUser, status: 'offline' }} variant="compact" />
        </div>
        <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
          <span>Online</span>
          <span>Away</span>
          <span>Do Not Disturb</span>
          <span>Offline</span>
        </div>
      </div>

      {/* With/without actions */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Actions
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">With Actions</div>
            <ProfileCard
              user={mockUser}
              showActions
              onConnect={() => {}}
              onMessage={() => {}}
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Without Actions</div>
            <ProfileCard user={mockUser} showActions={false} />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// EVENT CARD LAB
// ============================================

/**
 * EXPERIMENT: Event Card Variants
 * Compare: Event types, time states
 * Decisions: RSVP button, attendee display
 */
export const EventCardLab: Story = {
  render: () => {
    const [rsvp, setRsvp] = React.useState<'going' | 'maybe' | 'not_going' | null>(null);

    return (
      <div className="space-y-12 max-w-3xl">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <strong>EVENT CARD</strong> - Event display + RSVP
        </div>

        {/* Event types */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Event Types
          </div>
          <div className="grid grid-cols-3 gap-4">
            <EventCard
              event={{ ...mockEvent, type: 'meeting' }}
              showRSVP
            />
            <EventCard
              event={{ ...mockEvent, type: 'social', title: 'Game Night' }}
              showRSVP
            />
            <EventCard
              event={{ ...mockEvent, type: 'virtual', title: 'Online Workshop' }}
              showRSVP
            />
          </div>
        </div>

        {/* Time states */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Time States
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Upcoming</div>
              <EventCard
                event={{ ...mockEvent, startDate: new Date(Date.now() + 86400000 * 3) }}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Today / Soon</div>
              <EventCard
                event={{ ...mockEvent, startDate: new Date(Date.now() + 3600000) }}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Live Now</div>
              <EventCard
                event={{
                  ...mockEvent,
                  startDate: new Date(Date.now() - 1800000),
                  endDate: new Date(Date.now() + 1800000),
                }}
              />
            </div>
          </div>
        </div>

        {/* RSVP Button */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            RSVP Button States
          </div>
          <div className="flex gap-4 flex-wrap">
            <RSVPButton status={null} onChange={(s) => console.log(s)} />
            <RSVPButton status="going" onChange={(s) => console.log(s)} />
            <RSVPButton status="maybe" onChange={(s) => console.log(s)} />
            <RSVPButton status="not_going" onChange={(s) => console.log(s)} />
          </div>
        </div>

        {/* Variants */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Size Variants
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Compact</div>
              <EventCard event={mockEvent} variant="compact" />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Expanded</div>
              <EventCard event={mockEvent} variant="expanded" showRSVP />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// TOOL CARD LAB
// ============================================

/**
 * EXPERIMENT: Tool Card Variants
 * Compare: sizes, featured state
 * Decisions: Preview image, run count display
 */
export const ToolCardLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-3xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>TOOL CARD</strong> - HiveLab tool display
      </div>

      {/* Size variants */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Size Variants
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Compact</div>
            <ToolCard tool={mockTool} variant="compact" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Default</div>
            <ToolCard tool={mockTool} variant="default" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Large</div>
            <ToolCard tool={mockTool} variant="large" />
          </div>
        </div>
      </div>

      {/* Featured */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Featured Tools (Gold Ring)
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <ToolCard tool={mockTool} />
          <ToolCard tool={mockTool} featured />
        </div>
      </div>

      {/* Different tools */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Tool Gallery
        </div>
        <div className="grid grid-cols-3 gap-4">
          <ToolCard
            tool={{ ...mockTool, name: 'Poll Creator', description: 'Create polls for decisions', runCount: 128 }}
          />
          <ToolCard
            tool={{ ...mockTool, name: 'Task Board', description: 'Kanban for projects', runCount: 89 }}
          />
          <ToolCard
            tool={{ ...mockTool, name: 'Study Timer', description: 'Pomodoro technique', runCount: 256 }}
            featured
          />
        </div>
      </div>
    </div>
  ),
};

// ============================================
// MASTER SHOWCASE
// ============================================

/**
 * MASTER SHOWCASE: All HIVE Domain Components
 */
export const MasterShowcase: Story = {
  render: () => (
    <div className="space-y-16 max-w-4xl">
      <div className="text-lg font-medium text-white">
        HIVE Domain Components - Complete Collection
      </div>

      {/* Space Card */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Space Card</h3>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <SpaceCard space={mockSpace} warmth="medium" />
          <SpaceCard space={mockSpace} featured />
        </div>
      </section>

      {/* Chat Message */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Chat Message</h3>
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)] max-w-md">
          <ChatMessage message={mockMessage} showAuthor showTimestamp />
        </div>
      </section>

      {/* Profile Card */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Profile Card</h3>
        <ProfileCard user={mockUser} variant="default" />
      </section>

      {/* Event Card */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Event Card</h3>
        <EventCard event={mockEvent} showRSVP />
      </section>

      {/* Tool Card */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Tool Card</h3>
        <ToolCard tool={mockTool} />
      </section>
    </div>
  ),
};
