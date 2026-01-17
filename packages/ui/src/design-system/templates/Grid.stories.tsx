import type { Meta, StoryObj } from '@storybook/react';
import { Grid, CategoryRow, GridItem, GridSection } from './Grid';

/**
 * Grid Template Stories
 *
 * Grid is for discovery—browsing, galleries, and categorized content.
 * Three modes for different exploration patterns.
 */
const meta: Meta<typeof Grid> = {
  title: 'Design System/Templates/Grid',
  component: Grid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The Grid template handles discovery and browsing layouts. It's designed for content that users explore—
spaces, tools, galleries, and search results.

### Modes
- **netflix**: Horizontal scroll rows organized by category
- **uniform**: Standard responsive grid for search results and galleries
- **territorial**: Category sections with territory-specific styling

### Key Features
- Category rows with horizontal scrolling (netflix mode)
- Responsive grid with configurable columns (uniform mode)
- Territory-aware animations and styling
- Built-in infinite scroll
- Empty and loading states
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '800px', background: 'var(--color-bg-page)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Grid>;

// ============================================
// MOCK DATA
// ============================================

const mockSpaces = [
  { id: '1', name: 'Design Club', category: 'Creative', members: 234, activity: 'high' },
  { id: '2', name: 'CS Student Union', category: 'Academic', members: 1205, activity: 'very-high' },
  { id: '3', name: 'Photography Society', category: 'Creative', members: 156, activity: 'medium' },
  { id: '4', name: 'Debate Team', category: 'Academic', members: 89, activity: 'high' },
  { id: '5', name: 'Film Club', category: 'Creative', members: 312, activity: 'medium' },
  { id: '6', name: 'Engineering Society', category: 'Academic', members: 678, activity: 'high' },
];

const mockTools = [
  { id: '1', name: 'Study Timer', icon: '⏱️', uses: 1234 },
  { id: '2', name: 'Group Poll', icon: '📊', uses: 567 },
  { id: '3', name: 'Event RSVP', icon: '📅', uses: 890 },
  { id: '4', name: 'Resource Library', icon: '📚', uses: 456 },
];

const territories = {
  studentOrg: {
    name: 'Student Orgs',
    tagline: 'The real campus life',
    staggerMs: 60,
    baseDelayMs: 150,
    springStiffness: 600,
    springDamping: 25,
  },
  university: {
    name: 'University',
    tagline: 'Official channels, real value',
    staggerMs: 150,
    baseDelayMs: 300,
    springStiffness: 400,
    springDamping: 35,
    gradientAccent: 'rgba(255,255,255,0.02)',
  },
  greekLife: {
    name: 'Greek Life',
    tagline: 'Chapter life, organized',
    staggerMs: 100,
    baseDelayMs: 200,
    springStiffness: 480,
    springDamping: 28,
    gradientAccent: 'rgba(255,215,0,0.015)',
  },
};

// ============================================
// MOCK COMPONENTS
// ============================================

function MockHeader() {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Browse</h1>
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search..."
          className="h-9 px-4 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
        />
      </div>
    </div>
  );
}

function MockFilterBar() {
  const filters = ['All', 'Student Orgs', 'University', 'Greek Life'];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter, i) => (
        <button
          key={filter}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            i === 0
              ? 'bg-[var(--color-life-gold)]/10 text-[var(--color-life-gold)] border border-[var(--color-life-gold)]'
              : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function MockSpaceCard({ name, category, members, activity }: typeof mockSpaces[0]) {
  const activityColors = {
    'very-high': 'bg-green-500',
    high: 'bg-emerald-500',
    medium: 'bg-yellow-500',
  };

  return (
    <div className="w-[280px] p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center text-xl">
          {name[0]}
        </div>
        <span className={`w-2 h-2 rounded-full ${activityColors[activity as keyof typeof activityColors]}`} />
      </div>
      <h3 className="font-medium text-[var(--color-text-primary)] mb-1">{name}</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{category}</p>
      <div className="mt-3 text-xs text-[var(--color-text-tertiary)]">
        {members.toLocaleString()} members
      </div>
    </div>
  );
}

function MockToolCard({ name, icon, uses }: typeof mockTools[0]) {
  return (
    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-colors">
      <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center text-2xl mb-3">
        {icon}
      </div>
      <h3 className="font-medium text-[var(--color-text-primary)] mb-1">{name}</h3>
      <p className="text-xs text-[var(--color-text-tertiary)]">{uses.toLocaleString()} uses</p>
    </div>
  );
}

function MockHero() {
  return (
    <div className="px-6 py-12 text-center">
      <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
        Where do you belong?
      </h1>
      <p className="text-[var(--color-text-secondary)]">
        Discover spaces that match your vibe
      </p>
    </div>
  );
}

// ============================================
// STORIES
// ============================================

/**
 * Netflix mode with horizontal scroll rows.
 * Great for category-based browsing.
 */
export const Netflix: Story = {
  args: {
    mode: 'netflix',
    header: <MockHeader />,
    heroSection: <MockHero />,
    maxWidth: '2xl',
  },
  render: (args) => (
    <Grid {...args}>
      <CategoryRow title="Popular Right Now" subtitle="Most active spaces this week">
        {mockSpaces.map((space) => (
          <MockSpaceCard key={space.id} {...space} />
        ))}
      </CategoryRow>
      <CategoryRow title="Recommended For You">
        {mockSpaces.slice(0, 4).map((space) => (
          <MockSpaceCard key={space.id} {...space} />
        ))}
      </CategoryRow>
      <CategoryRow title="Tools" showSeeAll onSeeAllClick={() => console.log('See all tools')}>
        {mockTools.map((tool) => (
          <MockToolCard key={tool.id} {...tool} />
        ))}
      </CategoryRow>
    </Grid>
  ),
};

/**
 * Uniform grid for search results and galleries.
 * Responsive columns adapt to screen size.
 */
export const Uniform: Story = {
  args: {
    mode: 'uniform',
    header: <MockHeader />,
    filterBar: <MockFilterBar />,
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    gap: 'md',
    maxWidth: 'xl',
  },
  render: (args) => (
    <Grid {...args}>
      {mockSpaces.map((space) => (
        <GridItem key={space.id}>
          <MockSpaceCard {...space} />
        </GridItem>
      ))}
    </Grid>
  ),
};

/**
 * Territorial mode with category-specific sections.
 * Each section can have its own animation timing.
 */
export const Territorial: Story = {
  args: {
    mode: 'territorial',
    header: <MockHeader />,
    filterBar: <MockFilterBar />,
    maxWidth: 'xl',
  },
  render: (args) => (
    <Grid {...args}>
      <GridSection title="Student Orgs" territory={territories.studentOrg}>
        {mockSpaces.slice(0, 3).map((space) => (
          <MockSpaceCard key={space.id} {...space} />
        ))}
      </GridSection>
      <GridSection title="University" territory={territories.university}>
        {mockSpaces.slice(3, 5).map((space) => (
          <MockSpaceCard key={space.id} {...space} />
        ))}
      </GridSection>
      <GridSection title="Greek Life" territory={territories.greekLife}>
        {mockSpaces.slice(0, 2).map((space) => (
          <MockSpaceCard key={space.id} {...space} />
        ))}
      </GridSection>
    </Grid>
  ),
};

/**
 * Empty state when no content is available.
 */
export const Empty: Story = {
  args: {
    mode: 'uniform',
    header: <MockHeader />,
    filterBar: <MockFilterBar />,
    maxWidth: 'xl',
  },
  render: (args) => <Grid {...args}>{null}</Grid>,
};

/**
 * Loading state for initial load.
 */
export const Loading: Story = {
  args: {
    mode: 'uniform',
    header: <MockHeader />,
    isLoading: true,
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    maxWidth: 'xl',
  },
  render: (args) => <Grid {...args}>{null}</Grid>,
};

/**
 * Custom empty state with specific messaging.
 */
export const CustomEmptyState: Story = {
  args: {
    mode: 'uniform',
    header: <MockHeader />,
    filterBar: <MockFilterBar />,
    maxWidth: 'xl',
    emptyState: (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          No results found
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Try adjusting your filters or search terms.
        </p>
      </div>
    ),
  },
  render: (args) => <Grid {...args}>{null}</Grid>,
};

/**
 * With featured item highlighted at the top.
 */
export const WithFeaturedItem: Story = {
  args: {
    mode: 'uniform',
    header: <MockHeader />,
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    maxWidth: 'xl',
    featuredItem: (
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--color-life-gold)]/10 to-transparent border border-[var(--color-life-gold)]/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--color-life-gold)]/20 flex items-center justify-center text-3xl">
            ⭐
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Featured Space
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Check out this week's spotlight
            </p>
          </div>
        </div>
      </div>
    ),
  },
  render: (args) => (
    <Grid {...args}>
      {mockSpaces.map((space) => (
        <GridItem key={space.id}>
          <MockSpaceCard {...space} />
        </GridItem>
      ))}
    </Grid>
  ),
};

/**
 * With infinite scroll enabled.
 */
export const InfiniteScroll: Story = {
  args: {
    mode: 'uniform',
    header: <MockHeader />,
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    maxWidth: 'xl',
    hasMore: true,
    onLoadMore: () => console.log('Load more...'),
  },
  render: (args) => (
    <Grid {...args}>
      {[...mockSpaces, ...mockSpaces].map((space, i) => (
        <GridItem key={`${space.id}-${i}`}>
          <MockSpaceCard {...space} />
        </GridItem>
      ))}
    </Grid>
  ),
};
