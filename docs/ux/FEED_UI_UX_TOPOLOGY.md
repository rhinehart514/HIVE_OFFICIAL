# Feed UI/UX Topology

> Campus discovery stream - read-only aggregation of content from joined spaces.

---

## Overview

The Feed is the **primary discovery surface** for students. It aggregates content from all joined spaces into a single, chronological stream optimized for quick scanning and engagement.

### Core Principles

1. **Read-Only**: Feed is for consumption, not creation
2. **Aggregation**: Content from all joined spaces
3. **Discovery**: Help students find new content and spaces
4. **Speed**: Optimized for quick scanning (< 3s to first engagement)

---

## Layout Structure

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar 240px]  │        Main Content                 │
├───────────────────┼─────────────────────────────────────┤
│                   │  Campus Feed                        │
│  Feed ←           │  Your personalized campus pulse     │
│  Spaces           │                                     │
│  Profile          │  [All] [Following] [Spaces] [Academic]
│                   │                                     │
│  MY SPACES        │  ┌─────────────────────────────┐    │
│  ─────────        │  │ Stats Strip                 │    │
│  • Space 1        │  │ 24 Posts | 12 Active | 8 Events │
│  • Space 2        │  └─────────────────────────────┘    │
│                   │                                     │
│                   │  ┌─────────────────────────────┐    │
│                   │  │ FeedCard                    │    │
│                   │  │ Author • Space • Time       │    │
│                   │  │ Content...                  │    │
│                   │  │ [Like] [Comment] [Share]    │    │
│                   │  └─────────────────────────────┘    │
│                   │                                     │
│                   │  ┌─────────────────────────────┐    │
│                   │  │ FeedCard                    │    │
│                   │  └─────────────────────────────┘    │
│                   │                                     │
│  Settings         │  [Load More Posts]                  │
└───────────────────┴─────────────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────────────┐
│ Campus Feed             │
│ [Filters]    [+] [🔔]   │
├─────────────────────────┤
│ [Stats Strip]           │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ FeedCard            │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ FeedCard            │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ [Feed][Spaces][+][🔔][Me]│
└─────────────────────────┘
```

---

## Components

### 1. Page Header

```tsx
<header>
  <Breadcrumb icon={<ActivityIcon />} label="Feed" />
  <h1>Campus Feed</h1>
  <p>Your personalized campus pulse and coordination center</p>
</header>
```

### 2. Filter Tabs

| Tab | Description | Icon |
|-----|-------------|------|
| All | All content from joined spaces | Globe |
| Following | Content from followed users | Heart |
| Spaces | Filter by specific spaces | Users |
| Academic | Academic-related content | GraduationCap |

```tsx
<FilterTabs
  tabs={['All', 'Following', 'Spaces', 'Academic']}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### 3. Stats Strip

Four quick-glance metrics:

```tsx
<StatsStrip>
  <Stat icon={<TrendingUp />} value={24} label="Posts Today" />
  <Stat icon={<Users />} value={12} label="Active Spaces" />
  <Stat icon={<Calendar />} value={8} label="Events Today" />
  <Stat icon={<Zap />} value={5} label="New Tools" />
</StatsStrip>
```

**Colors**: Each stat uses semantic background colors
- Posts: `bg-background-tertiary`
- Spaces: `bg-green-900/30`
- Events: `bg-purple-900/30`
- Tools: `bg-amber-900/30`

### 4. Feed Cards

Four content types with consistent card structure:

#### Post Card
```tsx
<FeedCard type="post">
  <FeedCardHeader
    author={{ name, avatar, handle }}
    space={{ name, color }}
    timestamp={createdAt}
  />
  <FeedCardContent>
    {content}
    {media && <MediaGallery items={media} />}
  </FeedCardContent>
  <FeedCardActions>
    <LikeButton count={likes} />
    <CommentButton count={comments} />
    <ShareButton />
    <BookmarkButton />
  </FeedCardActions>
</FeedCard>
```

#### Event Card
```tsx
<FeedCard type="event">
  <EventBanner date={date} time={time} />
  <FeedCardHeader ... />
  <FeedCardContent>
    <EventDetails
      title={title}
      location={location}
      attendees={attendeeCount}
    />
  </FeedCardContent>
  <FeedCardActions>
    <RSVPButton status={rsvpStatus} />
    <ShareButton />
  </FeedCardActions>
</FeedCard>
```

#### Tool Card
```tsx
<FeedCard type="tool">
  <ToolPreview
    name={name}
    description={description}
    fields={fieldCount}
  />
  <FeedCardActions>
    <UseToolButton />
    <ShareButton />
  </FeedCardActions>
</FeedCard>
```

#### System Card
```tsx
<FeedCard type="system" variant="announcement">
  <SystemMessage
    icon={<InfoIcon />}
    title={title}
    message={message}
  />
  <FeedCardActions>
    <DismissButton />
    <LearnMoreButton />
  </FeedCardActions>
</FeedCard>
```

---

## Interactions

### Card Actions

| Action | Behavior | Animation |
|--------|----------|-----------|
| Like | Toggle + counter update | Heart pulse |
| Comment | Open comment sheet | Slide up |
| Share | Open share menu | Fade in |
| Bookmark | Toggle saved state | Check mark |
| RSVP | Toggle attendance | Status update |

### Optimistic Updates

All actions update UI immediately before API call:

```tsx
const handleLike = async () => {
  // Optimistic update
  setLiked(true);
  setLikeCount(prev => prev + 1);

  try {
    await likePost(postId);
  } catch {
    // Rollback on error
    setLiked(false);
    setLikeCount(prev => prev - 1);
    toast.error('Failed to like post');
  }
};
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `j` | Next post |
| `k` | Previous post |
| `l` | Like focused post |
| `c` | Open comments |
| `b` | Bookmark |
| `Enter` | Open post detail |

---

## Data Flow

### Feed Query

```typescript
const feedQuery = {
  collection: 'posts',
  where: [
    ['campusId', '==', 'ub-buffalo'],
    ['spaceId', 'in', userJoinedSpaceIds],
    ['isPublished', '==', true],
  ],
  orderBy: ['createdAt', 'desc'],
  limit: 20,
};
```

### Pagination

- **Initial load**: 20 posts
- **Load more**: +20 posts per request
- **Virtualization**: Only render visible cards (10,000+ posts support)

### Real-time Updates

```typescript
// Poll every 30 seconds for new content
useInterval(() => {
  checkForNewPosts();
}, 30_000);

// Show "New posts available" banner
{hasNewPosts && (
  <NewPostsBanner onClick={loadNewPosts} />
)}
```

---

## States

### Loading

```tsx
<FeedSkeleton>
  <StatsSkeleton />
  <CardSkeleton count={3} />
</FeedSkeleton>
```

### Empty

```tsx
<EmptyState
  icon={<InboxIcon />}
  title="Your feed is empty"
  description="Join some spaces to see content here"
  action={<Button href="/spaces">Browse Spaces</Button>}
/>
```

### Error

```tsx
<ErrorState
  title="Failed to load feed"
  description={error.message}
  action={<Button onClick={refetch}>Try Again</Button>}
/>
```

### Filtered Empty

```tsx
<EmptyState
  icon={<FilterIcon />}
  title="No posts match this filter"
  description="Try selecting a different filter"
  action={<Button onClick={clearFilters}>Clear Filters</Button>}
/>
```

---

## Performance

### Targets

| Metric | Target | Technique |
|--------|--------|-----------|
| Initial load | < 1s | SSR + streaming |
| Scroll performance | 60fps | Virtualization |
| Interaction response | < 16ms | Optimistic updates |
| Image load | < 500ms | Lazy loading + CDN |

### Optimization Techniques

1. **Virtualized list** for infinite scroll
2. **Image lazy loading** with blur placeholder
3. **Skeleton loaders** for perceived performance
4. **Request batching** for likes/bookmarks
5. **Prefetch** next page on scroll threshold

---

## Accessibility

### Requirements

- [ ] All cards keyboard navigable
- [ ] Focus visible on all interactive elements
- [ ] ARIA labels for icon buttons
- [ ] Screen reader announces new posts
- [ ] Reduced motion option

### Implementation

```tsx
<FeedCard
  role="article"
  aria-labelledby={`post-${id}-title`}
  tabIndex={0}
  onKeyDown={handleKeyNav}
>
  <button aria-label={`Like post by ${author.name}`}>
    <HeartIcon />
  </button>
</FeedCard>
```

---

## Testing

### Unit Tests

```typescript
describe('FeedCard', () => {
  it('renders post content', () => {
    render(<FeedCard post={mockPost} />);
    expect(screen.getByText(mockPost.content)).toBeInTheDocument();
  });

  it('handles like interaction', async () => {
    const { user } = render(<FeedCard post={mockPost} />);
    await user.click(screen.getByRole('button', { name: /like/i }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
test('feed loads and scrolls', async ({ page }) => {
  await page.goto('/feed');

  // Initial load
  await expect(page.locator('[data-testid="feed-card"]')).toHaveCount(20);

  // Scroll to load more
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('[data-testid="feed-card"]')).toHaveCount(40);
});
```

---

## Related Documentation

- [`UI_UX_WORKING_GUIDE.md`](../UI_UX_WORKING_GUIDE.md) - Design tokens reference
- [`COGNITIVE_BUDGETS.md`](../COGNITIVE_BUDGETS.md) - Rail widget limits
- [`FEATURE_TOPOLOGY_REGISTRY.md`](../FEATURE_TOPOLOGY_REGISTRY.md) - Route/component mapping

---

*Last updated: November 2025*
