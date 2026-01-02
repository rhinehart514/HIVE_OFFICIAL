'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';

import { FeedCardPost, type FeedCardPostData } from './feed-card-post';
import { FeedCardEvent, type FeedCardEventData, type FeedEventStatus } from './feed-card-event';
import { FeedCardSystem, type FeedCardSystemData, type FeedSystemVariant } from './feed-card-system';
import { FeedCardTool, type FeedCardToolData } from './feed-card-tool';
import type { MediaItem } from '../molecules/feed-media-preview';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Mock Data Generators
// ============================================================

const mockSpace = {
  id: 'space-1',
  name: 'Design Club',
  color: '#FFD700',
  icon: 'D',
};

const mockAuthor = {
  id: 'user-1',
  name: 'Sarah Chen',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  role: 'President',
  verified: true,
};

const mockMediaImage: MediaItem = {
  type: 'image',
  url: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=600&fit=crop',
  alt: 'Design workshop',
};

const mockMediaMultiple: MediaItem[] = [
  { type: 'image', url: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=400&h=300&fit=crop', alt: 'Workshop 1' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&h=300&fit=crop', alt: 'Workshop 2' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop', alt: 'Workshop 3' },
];

const createMockPost = (overrides: Partial<FeedCardPostData> = {}): FeedCardPostData => ({
  id: 'post-1',
  author: mockAuthor,
  space: mockSpace,
  content: {
    headline: 'Announcing our Spring Design Sprint',
    body: "Join us for an intensive 3-day design sprint where we'll tackle real-world UX challenges. Open to all skill levels - beginners welcome!",
    media: [],
    tags: ['design', 'ux', 'workshop'],
  },
  stats: {
    upvotes: 42,
    comments: 8,
    isUpvoted: false,
    isBookmarked: false,
  },
  meta: {
    timeAgo: '2h ago',
    isPinned: false,
    isEdited: false,
  },
  ...overrides,
});

const createMockEvent = (overrides: Partial<FeedCardEventData> = {}): FeedCardEventData => ({
  id: 'event-1',
  title: 'Weekly Design Review',
  description: 'Join us for our weekly design critique session where members share their work and receive constructive feedback from peers.',
  space: mockSpace,
  coverImage: mockMediaImage,
  meta: {
    scheduleLabel: 'Tomorrow, 6:00 PM',
    locationLabel: 'Student Union 301',
    status: 'upcoming' as FeedEventStatus,
  },
  stats: {
    attendingCount: 24,
    capacity: 40,
    isAttending: false,
  },
  ...overrides,
});

const createMockSystemCard = (overrides: Partial<FeedCardSystemData> = {}): FeedCardSystemData => ({
  id: 'system-1',
  title: 'Weekly Check-In Ritual',
  description: 'Share what you learned this week! This ritual helps our community reflect and celebrate growth together.',
  meta: {
    variant: 'ritual' as FeedSystemVariant,
    timeAgo: '4h left',
    expiresLabel: 'Ends tonight at midnight',
  },
  actionLabel: 'Participate',
  isDismissible: true,
  ...overrides,
});

const createMockTool = (overrides: Partial<FeedCardToolData> = {}): FeedCardToolData => ({
  id: 'tool-1',
  title: 'Design Feedback Poll',
  summary: 'Quickly gather structured feedback on your design work from club members.',
  authorLabel: 'By @sarahchen',
  previewDescription: 'Interactive poll with image upload, rating scales, and anonymous voting options.',
  space: mockSpace,
  meta: {
    featured: true,
    categoryLabel: 'Engagement',
    lastUpdatedLabel: '2 days ago',
  },
  stats: {
    installs: 156,
    activeUsers: 42,
    ratingLabel: '4.8 / 5',
  },
  tags: ['poll', 'feedback', 'design'],
  ...overrides,
});

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '02-Feed/Organisms/FeedCards',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Collection of feed card components: Post, Event, System announcements, and Tool cards.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-2xl mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// FEED CARD POST STORIES
// ============================================================

export const PostDefault: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost()}
      onOpen={action('onOpen')}
      onSpaceClick={action('onSpaceClick')}
      onUpvote={action('onUpvote')}
      onComment={action('onComment')}
      onBookmark={action('onBookmark')}
      onShare={action('onShare')}
    />
  ),
  parameters: {
    docs: { description: { story: 'Default post card with text content and tags.' } },
  },
};

export const PostWithMedia: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        content: {
          headline: 'Behind the scenes of our latest project',
          body: 'Check out these photos from our design sprint last weekend!',
          media: [mockMediaImage],
          tags: ['behindthescenes'],
        },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostWithMultipleImages: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        content: {
          headline: 'Workshop Photo Dump',
          body: 'Amazing turnout at our typography workshop! Thanks everyone who joined us.',
          media: mockMediaMultiple,
          tags: ['workshop', 'photos'],
        },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostPinned: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        meta: { timeAgo: '1 week ago', isPinned: true, isEdited: false },
        content: {
          headline: 'Important: Updated Club Guidelines',
          body: 'Please review our updated community guidelines. These changes are effective immediately.',
        },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostEdited: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        meta: { timeAgo: '3h ago', isPinned: false, isEdited: true },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostUpvoted: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        stats: { upvotes: 127, comments: 23, isUpvoted: true, isBookmarked: false },
      })}
      onOpen={action('onOpen')}
      onUpvote={action('onUpvote')}
    />
  ),
};

export const PostBookmarked: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        stats: { upvotes: 42, comments: 8, isUpvoted: false, isBookmarked: true },
      })}
      onOpen={action('onOpen')}
      onBookmark={action('onBookmark')}
    />
  ),
};

export const PostUpvotedAndBookmarked: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        stats: { upvotes: 256, comments: 47, isUpvoted: true, isBookmarked: true },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostCozyLayout: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost()}
      layout="cozy"
      onOpen={action('onOpen')}
    />
  ),
  parameters: {
    docs: { description: { story: 'Cozy layout with reduced padding for dense feeds.' } },
  },
};

export const PostNoSpaceChip: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost()}
      showSpaceChip={false}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostLongContent: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        content: {
          headline: 'A Deep Dive into Design Systems: From Theory to Practice',
          body: `Design systems have become essential for modern product development. In this post, we'll explore the fundamentals of design systems, their core components, and how to implement them effectively in your organization.

A design system is more than just a component library—it's a comprehensive set of standards and guidelines that ensure consistency across products. It includes design tokens, components, patterns, and documentation that teams can use to build cohesive user experiences.

The key benefits include improved collaboration between designers and developers, faster iteration cycles, and a more cohesive brand experience across all touchpoints. However, building and maintaining a design system requires significant investment and organizational buy-in.`,
          tags: ['designsystems', 'ux', 'tutorial', 'longform'],
        },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostNoHeadline: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        content: {
          body: "Just wrapped up an amazing brainstorming session with the team. Can't wait to share what we've been working on!",
          tags: [],
        },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostNoTags: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        content: {
          headline: 'Quick Update',
          body: 'Meeting moved to 4pm today.',
          tags: [],
        },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostNoRole: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        author: { ...mockAuthor, role: undefined },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostNoAvatar: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        author: { ...mockAuthor, avatarUrl: undefined },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostHighEngagement: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        stats: { upvotes: 1247, comments: 89, isUpvoted: true, isBookmarked: true },
        content: {
          headline: 'We hit 1000 members!',
          body: 'Thank you all for making this community what it is today. Here\'s to the next milestone!',
          media: [mockMediaImage],
          tags: ['milestone', 'thankyou'],
        },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

// ============================================================
// FEED CARD EVENT STORIES
// ============================================================

export const EventDefault: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent()}
      onViewDetails={action('onViewDetails')}
      onToggleRsvp={action('onToggleRsvp')}
      onSpaceClick={action('onSpaceClick')}
    />
  ),
  parameters: {
    docs: { description: { story: 'Default event card with RSVP button.' } },
  },
};

export const EventToday: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        meta: {
          scheduleLabel: 'Today, 3:00 PM',
          locationLabel: 'Capen Hall 212',
          status: 'today',
        },
      })}
      onViewDetails={action('onViewDetails')}
      onToggleRsvp={action('onToggleRsvp')}
    />
  ),
};

export const EventAttending: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        stats: { attendingCount: 25, capacity: 40, isAttending: true },
      })}
      onToggleRsvp={action('onToggleRsvp')}
    />
  ),
};

export const EventSoldOut: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        meta: {
          scheduleLabel: 'Friday, 7:00 PM',
          locationLabel: 'Knox Hall 104',
          status: 'sold_out',
        },
        stats: { attendingCount: 40, capacity: 40, isAttending: false },
      })}
      onToggleRsvp={action('onToggleRsvp')}
    />
  ),
};

export const EventPast: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        title: 'Fall Kickoff Party',
        meta: {
          scheduleLabel: 'Sep 15, 2024',
          locationLabel: 'Student Union Ballroom',
          status: 'past',
        },
        stats: { attendingCount: 156, capacity: 200, isAttending: true },
      })}
      onViewDetails={action('onViewDetails')}
    />
  ),
};

export const EventNoCoverImage: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        coverImage: undefined,
      })}
      onViewDetails={action('onViewDetails')}
    />
  ),
};

export const EventNoCapacity: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        stats: { attendingCount: 67, capacity: undefined, isAttending: false },
      })}
      onViewDetails={action('onViewDetails')}
    />
  ),
};

export const EventNoLocation: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        title: 'Virtual Design Meetup',
        meta: {
          scheduleLabel: 'Saturday, 2:00 PM',
          locationLabel: undefined,
          status: 'upcoming',
        },
      })}
      onViewDetails={action('onViewDetails')}
    />
  ),
};

export const EventLongTitle: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        title: 'Annual Design Excellence Awards Ceremony and Networking Reception 2024',
        description: 'Join us for an evening celebrating outstanding design work from our community members.',
      })}
      onViewDetails={action('onViewDetails')}
    />
  ),
};

export const EventAllStatuses: Story = {
  render: () => {
    const statuses: FeedEventStatus[] = ['upcoming', 'today', 'sold_out', 'past'];

    return (
      <div className="space-y-6">
        {statuses.map((status) => (
          <FeedCardEvent
            key={status}
            event={createMockEvent({
              id: `event-${status}`,
              title: `${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} Event`,
              meta: {
                scheduleLabel: status === 'past' ? 'Last week' : 'Tomorrow, 6:00 PM',
                locationLabel: 'Student Union',
                status,
              },
            })}
            onViewDetails={action('onViewDetails')}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'All event status variants displayed together.' } },
  },
};

// ============================================================
// FEED CARD SYSTEM STORIES
// ============================================================

export const SystemRitual: Story = {
  render: () => (
    <FeedCardSystem
      card={createMockSystemCard()}
      onAction={action('onAction')}
      onDismiss={action('onDismiss')}
    />
  ),
  parameters: {
    docs: { description: { story: 'Campus ritual card with golden accent.' } },
  },
};

export const SystemAnnouncement: Story = {
  render: () => (
    <FeedCardSystem
      card={createMockSystemCard({
        title: 'New Features Available',
        description: 'We just shipped polls, event RSVPs, and real-time notifications. Check out what\'s new!',
        meta: { variant: 'announcement', timeAgo: 'Just now' },
        actionLabel: 'See what\'s new',
      })}
      onAction={action('onAction')}
      onDismiss={action('onDismiss')}
    />
  ),
};

export const SystemUrgent: Story = {
  render: () => (
    <FeedCardSystem
      card={createMockSystemCard({
        title: 'Scheduled Maintenance Tonight',
        description: 'HIVE will be briefly unavailable from 2-4 AM EST for infrastructure upgrades.',
        meta: { variant: 'urgent', timeAgo: '1h ago' },
        actionLabel: 'Learn more',
        isDismissible: false,
      })}
      onAction={action('onAction')}
    />
  ),
};

export const SystemNoDismiss: Story = {
  render: () => (
    <FeedCardSystem
      card={createMockSystemCard({
        isDismissible: false,
      })}
      onAction={action('onAction')}
    />
  ),
};

export const SystemNoAction: Story = {
  render: () => (
    <FeedCardSystem
      card={createMockSystemCard({
        title: 'Community Guidelines Reminder',
        description: 'Please remember to keep discussions respectful and inclusive.',
        actionLabel: undefined,
        meta: { variant: 'announcement' },
      })}
      onDismiss={action('onDismiss')}
    />
  ),
};

export const SystemWithExpiry: Story = {
  render: () => (
    <FeedCardSystem
      card={createMockSystemCard({
        meta: {
          variant: 'ritual',
          timeAgo: '30m left',
          expiresLabel: 'Ends in 30 minutes',
        },
      })}
      onAction={action('onAction')}
    />
  ),
};

export const SystemAllVariants: Story = {
  render: () => {
    const variants: FeedSystemVariant[] = ['ritual', 'announcement', 'urgent'];

    return (
      <div className="space-y-6">
        {variants.map((variant) => (
          <FeedCardSystem
            key={variant}
            card={createMockSystemCard({
              id: `system-${variant}`,
              title: `${variant.charAt(0).toUpperCase() + variant.slice(1)} Notification`,
              meta: { variant, timeAgo: '1h ago' },
            })}
            onAction={action('onAction')}
            onDismiss={action('onDismiss')}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'All system card variants displayed together.' } },
  },
};

export const SystemDismissInteractive: Story = {
  render: () => {
    const [dismissed, setDismissed] = React.useState<string[]>([]);
    const cards = ['card-1', 'card-2', 'card-3'];

    return (
      <div className="space-y-4">
        <p className="text-white/60 text-sm text-center mb-4">
          Dismissed: {dismissed.length} / {cards.length}
        </p>
        {cards.map((id) => (
          !dismissed.includes(id) && (
            <FeedCardSystem
              key={id}
              card={createMockSystemCard({
                id,
                title: `Notification ${id}`,
                isDismissible: true,
              })}
              onDismiss={(cardId) => {
                setDismissed((prev) => [...prev, cardId]);
                action('onDismiss')(cardId);
              }}
            />
          )
        ))}
        {dismissed.length === cards.length && (
          <div className="text-center py-8">
            <p className="text-white/60 mb-4">All notifications dismissed!</p>
            <button
              onClick={() => setDismissed([])}
              className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Interactive demo of dismissing system cards.' } },
  },
};

// ============================================================
// FEED CARD TOOL STORIES
// ============================================================

export const ToolDefault: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool()}
      onOpenTool={action('onOpenTool')}
      onPreview={action('onPreview')}
      onSpaceClick={action('onSpaceClick')}
    />
  ),
  parameters: {
    docs: { description: { story: 'Default featured tool card.' } },
  },
};

export const ToolFeatured: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({ meta: { featured: true, categoryLabel: 'Featured', lastUpdatedLabel: 'Today' } })}
      tone="featured"
      onOpenTool={action('onOpenTool')}
    />
  ),
};

export const ToolNotFeatured: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({ meta: { featured: false, categoryLabel: 'Community', lastUpdatedLabel: '1 week ago' } })}
      onOpenTool={action('onOpenTool')}
    />
  ),
};

export const ToolNoStats: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({ stats: undefined })}
      onOpenTool={action('onOpenTool')}
    />
  ),
};

export const ToolHighStats: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({
        stats: {
          installs: 12500,
          activeUsers: 3200,
          ratingLabel: '4.9 / 5',
        },
      })}
      onOpenTool={action('onOpenTool')}
    />
  ),
};

export const ToolNoPreview: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({ previewDescription: undefined })}
      onOpenTool={action('onOpenTool')}
    />
  ),
};

export const ToolNoTags: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({ tags: [] })}
      onOpenTool={action('onOpenTool')}
    />
  ),
};

export const ToolManyTags: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({
        tags: ['poll', 'feedback', 'design', 'collaboration', 'realtime', 'voting'],
      })}
      onOpenTool={action('onOpenTool')}
    />
  ),
};

export const ToolLongTitle: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({
        title: 'Comprehensive Event Planning and RSVP Management Dashboard',
        summary: 'All-in-one solution for event organizers with attendance tracking, reminders, and analytics.',
      })}
      onOpenTool={action('onOpenTool')}
    />
  ),
};

// ============================================================
// COMPARISON STORIES
// ============================================================

export const AllCardTypes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-white text-lg font-medium mb-4">Post Card</h3>
        <FeedCardPost post={createMockPost()} onOpen={action('onOpen')} />
      </div>
      <div>
        <h3 className="text-white text-lg font-medium mb-4">Event Card</h3>
        <FeedCardEvent event={createMockEvent()} onViewDetails={action('onViewDetails')} />
      </div>
      <div>
        <h3 className="text-white text-lg font-medium mb-4">System Card</h3>
        <FeedCardSystem card={createMockSystemCard()} onAction={action('onAction')} />
      </div>
      <div>
        <h3 className="text-white text-lg font-medium mb-4">Tool Card</h3>
        <FeedCardTool tool={createMockTool()} onOpenTool={action('onOpenTool')} />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All 4 feed card types displayed together for comparison.' } },
  },
};

export const MixedFeed: Story = {
  render: () => (
    <div className="space-y-4">
      <FeedCardSystem
        card={createMockSystemCard({
          title: 'Weekly Reflection Ritual',
          meta: { variant: 'ritual', timeAgo: '2h left' },
        })}
        onAction={action('onAction')}
      />
      <FeedCardPost
        post={createMockPost({
          content: {
            headline: 'Great session today!',
            body: 'Thanks everyone who joined the workshop. Check out the slides in our shared drive.',
            media: [mockMediaImage],
          },
        })}
        onOpen={action('onOpen')}
      />
      <FeedCardEvent
        event={createMockEvent({
          title: 'End of Semester Party',
          meta: { scheduleLabel: 'Dec 15, 8:00 PM', status: 'upcoming' },
        })}
        onViewDetails={action('onViewDetails')}
      />
      <FeedCardPost
        post={createMockPost({
          id: 'post-2',
          author: { id: 'user-2', name: 'Alex Kim', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
          content: { body: 'Quick question: what time does the meeting start tomorrow?', tags: [] },
          stats: { upvotes: 3, comments: 2, isUpvoted: false, isBookmarked: false },
          meta: { timeAgo: '15m ago' },
        })}
        onOpen={action('onOpen')}
      />
      <FeedCardTool
        tool={createMockTool({ meta: { featured: false, categoryLabel: 'New' } })}
        onOpenTool={action('onOpenTool')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Simulated mixed feed with various card types.' } },
  },
};

// ============================================================
// INTERACTIVE STORIES
// ============================================================

export const PostInteractiveActions: Story = {
  render: () => {
    const [stats, setStats] = React.useState({
      upvotes: 42,
      comments: 8,
      isUpvoted: false,
      isBookmarked: false,
    });

    return (
      <div className="space-y-4">
        <div className="flex gap-4 justify-center text-sm text-white/60">
          <span>Upvotes: {stats.upvotes}</span>
          <span>Upvoted: {stats.isUpvoted ? 'Yes' : 'No'}</span>
          <span>Bookmarked: {stats.isBookmarked ? 'Yes' : 'No'}</span>
        </div>
        <FeedCardPost
          post={createMockPost({ stats })}
          onUpvote={() => {
            setStats((prev) => ({
              ...prev,
              isUpvoted: !prev.isUpvoted,
              upvotes: prev.isUpvoted ? prev.upvotes - 1 : prev.upvotes + 1,
            }));
          }}
          onBookmark={() => {
            setStats((prev) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
          }}
          onOpen={action('onOpen')}
          onComment={action('onComment')}
          onShare={action('onShare')}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Interactive post card with working upvote and bookmark toggles.' } },
  },
};

export const EventInteractiveRSVP: Story = {
  render: () => {
    const [isAttending, setIsAttending] = React.useState(false);
    const [attendingCount, setAttendingCount] = React.useState(24);

    return (
      <div className="space-y-4">
        <div className="text-center text-sm text-white/60">
          Status: {isAttending ? 'You\'re going!' : 'Not attending'} | Attendees: {attendingCount}/40
        </div>
        <FeedCardEvent
          event={createMockEvent({
            stats: { attendingCount, capacity: 40, isAttending },
          })}
          onToggleRsvp={(_, nextValue) => {
            setIsAttending(nextValue);
            setAttendingCount((prev) => (nextValue ? prev + 1 : prev - 1));
          }}
          onViewDetails={action('onViewDetails')}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Interactive event card with working RSVP toggle.' } },
  },
};

// ============================================================
// EDGE CASES
// ============================================================

export const PostMinimalContent: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        content: { body: 'Hi', tags: [] },
        stats: { upvotes: 0, comments: 0, isUpvoted: false, isBookmarked: false },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const PostZeroEngagement: Story = {
  render: () => (
    <FeedCardPost
      post={createMockPost({
        stats: { upvotes: 0, comments: 0, isUpvoted: false, isBookmarked: false },
      })}
      onOpen={action('onOpen')}
    />
  ),
};

export const EventAtCapacity: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        stats: { attendingCount: 40, capacity: 40, isAttending: false },
        meta: { scheduleLabel: 'Tomorrow, 6:00 PM', status: 'sold_out' },
      })}
      onViewDetails={action('onViewDetails')}
    />
  ),
};

export const EventOneSpotLeft: Story = {
  render: () => (
    <FeedCardEvent
      event={createMockEvent({
        stats: { attendingCount: 39, capacity: 40, isAttending: false },
      })}
      onViewDetails={action('onViewDetails')}
    />
  ),
};

export const ToolNewNoInstalls: Story = {
  render: () => (
    <FeedCardTool
      tool={createMockTool({
        stats: { installs: 0, activeUsers: 0 },
        meta: { featured: false, lastUpdatedLabel: 'Just published' },
      })}
      onOpenTool={action('onOpenTool')}
    />
  ),
};

// ============================================================
// RESPONSIVE STORIES
// ============================================================

export const ResponsiveMobile: Story = {
  render: () => (
    <div className="max-w-[375px] mx-auto space-y-4">
      <FeedCardPost post={createMockPost()} onOpen={action('onOpen')} />
      <FeedCardEvent event={createMockEvent()} onViewDetails={action('onViewDetails')} />
      <FeedCardSystem card={createMockSystemCard()} onAction={action('onAction')} />
      <FeedCardTool tool={createMockTool()} onOpenTool={action('onOpenTool')} />
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: { description: { story: 'All card types at mobile width (375px).' } },
  },
};

export const ResponsiveTablet: Story = {
  render: () => (
    <div className="max-w-[768px] mx-auto space-y-4">
      <FeedCardPost post={createMockPost()} onOpen={action('onOpen')} />
      <FeedCardEvent event={createMockEvent()} onViewDetails={action('onViewDetails')} />
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: { description: { story: 'Cards at tablet width (768px).' } },
  },
};
