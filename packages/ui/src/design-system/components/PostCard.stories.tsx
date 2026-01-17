import type { Meta, StoryObj } from '@storybook/react';
import { PostCard, PostCardSkeleton } from './PostCard';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POSTCARD VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Feed post card with content, media, and interactions.
 *
 * STRUCTURE:
 *   [Avatar]  Name @handle · 2h ago
 *             in Space Name (optional)
 *
 *   Post content text that can span multiple lines...
 *
 *   [MEDIA: Image/Video/Link Preview]
 *
 *   ❤️ 24    💬 8    🔄 3    📤
 *
 * INTERACTIONS:
 * - Like: Red heart when active
 * - Comment: Blue on hover
 * - Repost: Green when active
 * - Share: Default color
 *
 * VARIANTS:
 * - default: Standard feed card
 * - compact: Less padding, smaller text
 * - detailed: More metadata visible
 * - embedded: For embedding in modals
 *
 * MEDIA TYPES:
 * - Single image: Full width
 * - Multiple images: 2x2 grid
 * - Video: With play overlay
 * - Link: Preview card with title/description
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof PostCard> = {
  title: 'Design System/Components/Content/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Feed post card with content, media, and interactions.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed', 'embedded'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PostCard>;

/**
 * Default — Text only
 */
export const Default: Story = {
  args: {
    id: '1',
    author: {
      id: 'u1',
      name: 'Jane Doe',
      handle: 'jane',
      avatar: 'https://i.pravatar.cc/100?u=jane',
    },
    content: 'Just shipped a new feature for our campus app! Check out the live demo and let me know what you think. 🚀',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    likeCount: 24,
    replyCount: 8,
    repostCount: 3,
  },
};

/**
 * With space context
 */
export const WithSpace: Story = {
  args: {
    id: '2',
    author: {
      id: 'u1',
      name: 'Jane Doe',
      handle: 'jane',
    },
    content: 'Looking for collaborators on a new project! We\'re building a tool to help students find study groups based on their schedule and learning style.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    space: { id: 's1', name: 'UB Coders' },
    likeCount: 42,
    replyCount: 15,
    repostCount: 7,
  },
};

/**
 * With single image
 */
export const WithImage: Story = {
  args: {
    id: '3',
    author: {
      id: 'u2',
      name: 'John Smith',
      handle: 'johnsmith',
      avatar: 'https://i.pravatar.cc/100?u=john',
    },
    content: 'Beautiful sunset from the library roof 🌅',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=600',
      },
    ],
    likeCount: 156,
    replyCount: 12,
    repostCount: 8,
  },
};

/**
 * With multiple images
 */
export const WithMultipleImages: Story = {
  args: {
    id: '4',
    author: {
      id: 'u3',
      name: 'Alex Chen',
      handle: 'alexc',
    },
    content: 'Hackathon project showcase! 48 hours of coding later...',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300' },
    ],
    likeCount: 89,
    replyCount: 23,
  },
};

/**
 * With video
 */
export const WithVideo: Story = {
  args: {
    id: '5',
    author: {
      id: 'u4',
      name: 'Sarah Wilson',
      handle: 'sarahw',
      avatar: 'https://i.pravatar.cc/100?u=sarah',
    },
    content: 'Quick demo of the new feature we just launched!',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    media: [
      {
        type: 'video',
        url: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600',
      },
    ],
    likeCount: 67,
    replyCount: 9,
    repostCount: 12,
  },
};

/**
 * With link preview
 */
export const WithLinkPreview: Story = {
  args: {
    id: '6',
    author: {
      id: 'u5',
      name: 'Mike Johnson',
      handle: 'mikej',
    },
    content: 'Great article on the future of campus technology 👇',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    media: [
      {
        type: 'link',
        url: 'https://example.com/article',
        thumbnailUrl: 'https://images.unsplash.com/photo-1497493292307-31c376b6e479?w=600',
        title: 'The Future of Campus Technology',
        description: 'How AI and automation are transforming the student experience at universities across the country.',
      },
    ],
    likeCount: 34,
    replyCount: 5,
  },
};

/**
 * Liked and reposted
 */
export const LikedAndReposted: Story = {
  args: {
    id: '7',
    author: {
      id: 'u1',
      name: 'Jane Doe',
      handle: 'jane',
      avatar: 'https://i.pravatar.cc/100?u=jane',
    },
    content: 'Excited to announce that our team won first place at the hackathon! 🏆',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    likeCount: 234,
    replyCount: 45,
    repostCount: 28,
    isLiked: true,
    isReposted: true,
  },
};

/**
 * Pinned post
 */
export const Pinned: Story = {
  args: {
    id: '8',
    author: {
      id: 'u1',
      name: 'UB Coders',
      handle: 'ubcoders',
    },
    content: '📌 Welcome to UB Coders! Check out our upcoming events and join the conversation.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isPinned: true,
    likeCount: 89,
    replyCount: 12,
  },
};

/**
 * Long content
 */
export const LongContent: Story = {
  args: {
    id: '9',
    author: {
      id: 'u6',
      name: 'Emily Brown',
      handle: 'emilyb',
      avatar: 'https://i.pravatar.cc/100?u=emily',
    },
    content: `Just finished my thesis and wanted to share some thoughts on the research process...

First, finding a good advisor is crucial. Someone who understands your vision and can guide you without micromanaging.

Second, don't underestimate the literature review. It's not just a formality - it shapes your entire approach.

Third, embrace the setbacks. My first two hypotheses were completely wrong, but that failure led me to discover something even more interesting.

Fourth, take breaks. Burnout is real, and your best ideas often come when you step away from the work.

Finally, celebrate the small wins. Every completed chapter, every successful experiment, every positive feedback - they all matter.

Looking forward to defending next month! 🎓`,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    likeCount: 178,
    replyCount: 34,
    repostCount: 12,
  },
};

/**
 * Compact variant
 */
export const Compact: Story = {
  args: {
    variant: 'compact',
    id: '10',
    author: {
      id: 'u1',
      name: 'Jane Doe',
      handle: 'jane',
    },
    content: 'Quick update: meeting moved to 3pm',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    likeCount: 5,
    replyCount: 2,
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  ),
};

/**
 * Clickable (for navigation)
 */
export const Clickable: Story = {
  args: {
    id: '11',
    author: {
      id: 'u1',
      name: 'Jane Doe',
      handle: 'jane',
      avatar: 'https://i.pravatar.cc/100?u=jane',
    },
    content: 'Click anywhere on this card to navigate to the detail view',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    likeCount: 10,
    replyCount: 3,
    onClick: () => alert('Navigating to post detail'),
    onAuthorClick: () => alert('Navigating to author profile'),
    onLike: () => console.log('Liked'),
    onReply: () => console.log('Reply'),
    onRepost: () => console.log('Repost'),
    onShare: () => console.log('Share'),
  },
};

/**
 * Feed layout
 */
export const FeedLayout: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <PostCard
        id="1"
        author={{ id: 'u1', name: 'Jane Doe', handle: 'jane', avatar: 'https://i.pravatar.cc/100?u=jane' }}
        content="Morning coffee and code ☕️"
        timestamp={new Date(Date.now() - 30 * 60 * 1000)}
        likeCount={12}
        replyCount={2}
      />
      <PostCard
        id="2"
        author={{ id: 'u2', name: 'John Smith', handle: 'johnsmith' }}
        content="Just published my first npm package! It's a utility library for common React patterns."
        timestamp={new Date(Date.now() - 2 * 60 * 60 * 1000)}
        space={{ id: 's1', name: 'UB Coders' }}
        likeCount={45}
        replyCount={8}
        repostCount={3}
        isLiked
      />
      <PostCard
        id="3"
        author={{ id: 'u3', name: 'Alex Chen', handle: 'alexc', avatar: 'https://i.pravatar.cc/100?u=alex' }}
        content="Beautiful day for a walk around campus"
        timestamp={new Date(Date.now() - 4 * 60 * 60 * 1000)}
        media={[{ type: 'image', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600' }]}
        likeCount={89}
        replyCount={5}
      />
    </div>
  ),
};
