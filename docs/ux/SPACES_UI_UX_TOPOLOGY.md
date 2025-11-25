# Spaces UI/UX Topology

> Community hubs for clubs and organizations - the core social unit of HIVE.

---

## Overview

Spaces are community containers where members post, share events, build tools, and coordinate. Each space has its own feed, pinned content, and customizable widgets.

### Core Principles

1. **Feed-First**: Content is the hero, not chrome
2. **Minimalism**: Only essential UI elements
3. **Leader Tools**: Admins get moderation + analytics
4. **Community Identity**: Custom branding within constraints

---

## Space Types

| Type | Auto-Join | Description |
|------|-----------|-------------|
| `residential` | Yes | Dorms & living communities |
| `greek` | No | Fraternities & sororities |
| `student_org` | No | Clubs & organizations |
| `university_org` | Yes | Official campus departments |

---

## Layout Structure

### Space Board (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Space Header                             │
│             │  [Avatar] CS Club                         │
│             │  Computer Science Society                 │
│             │  [Join] [Notify] [Share]                  │
├─────────────┼───────────────────────────────────────────┤
│             │  ┌─────────┐ ┌─────────┐                  │
│  Feed       │  │ Pin 1   │ │ Pin 2   │  ← Max 2 pins   │
│  Spaces ←   │  └─────────┘ └─────────┘                  │
│  Profile    │                                           │
│             │  [Post] [Event] [Poll] [Tool]              │
│             │                                           │
│             │  ┌─────────────────────────────┐          │
│             │  │ FeedCard                    │          │
│             │  └─────────────────────────────┘          │
│             │  ┌─────────────────────────────┐          │
│             │  │ FeedCard                    │          │
│             │  └─────────────────────────────┘          │
└─────────────┴───────────────────────────────────────────┘
```

---

## Components

### 1. Space Header

```tsx
<SpaceHeader>
  <SpaceAvatar src={avatar} fallback={initials} />
  <div>
    <h1>{name}</h1>
    <p>{description}</p>
    <SpaceStats members={memberCount} posts={postCount} />
  </div>
  <SpaceActions>
    <JoinButton status={membershipStatus} />
    <NotifyButton isNotified={isNotified} />
    <ShareButton />
  </SpaceActions>
</SpaceHeader>
```

### 2. Pinned Posts (Max 2)

```tsx
const maxPins = useCognitiveBudget('spaceBoard', 'maxPins'); // 2

<PinnedSection>
  {pins.slice(0, maxPins).map(pin => (
    <PinnedCard key={pin.id} {...pin} />
  ))}
</PinnedSection>
```

**Pin Card Design**:
- Elevated background (`bg-background-secondary`)
- Pin icon indicator
- Compact layout
- Quick actions on hover

### 3. Composer

```tsx
<Composer>
  <ComposerTabs>
    <Tab icon={<PenIcon />}>Post</Tab>
    <Tab icon={<CalendarIcon />}>Event</Tab>
    <Tab icon={<PollIcon />}>Poll</Tab>
    <Tab icon={<ToolIcon />}>Tool</Tab>
  </ComposerTabs>
  <ComposerInput
    placeholder="Share something with the space..."
    onSubmit={handlePost}
  />
</Composer>
```

### 4. Space Feed

Same as main Feed but filtered to single space:

```typescript
const spaceFeedQuery = {
  collection: 'posts',
  where: [
    ['spaceId', '==', spaceId],
    ['campusId', '==', 'ub-buffalo'],
  ],
  orderBy: ['createdAt', 'desc'],
};
```

---

## Member Roles

| Role | Permissions |
|------|-------------|
| `owner` | All permissions + transfer ownership |
| `admin` | Moderate + pin + edit space settings |
| `member` | Post + comment + react |

### Role Badges

```tsx
<Badge variant={role === 'owner' ? 'gold' : 'default'}>
  {role === 'owner' && <CrownIcon />}
  {role === 'admin' && <ShieldIcon />}
  {roleLabel}
</Badge>
```

---

## Interactions

### Join Flow

```tsx
const handleJoin = async () => {
  setIsJoining(true);

  try {
    await joinSpace(spaceId);
    toast.success(`Joined ${spaceName}`);
    // Update sidebar "My Spaces"
    invalidateMySpaces();
  } catch (error) {
    toast.error('Failed to join space');
  } finally {
    setIsJoining(false);
  }
};
```

### Pin Post (Admin only)

```tsx
const handlePin = async (postId: string) => {
  const maxPins = useCognitiveBudget('spaceBoard', 'maxPins');

  if (pins.length >= maxPins) {
    toast.error(`Maximum ${maxPins} pins. Unpin one first.`);
    return;
  }

  await pinPost(spaceId, postId);
  toast.success('Post pinned');
};
```

---

## States

### Loading

```tsx
<SpaceSkeleton>
  <HeaderSkeleton />
  <PinsSkeleton count={2} />
  <FeedSkeleton count={3} />
</SpaceSkeleton>
```

### Not Found

```tsx
<NotFoundState
  title="Space not found"
  description="This space may have been deleted or you don't have access"
  action={<Button href="/spaces">Browse Spaces</Button>}
/>
```

### Empty Feed

```tsx
<EmptyState
  icon={<MessageSquareIcon />}
  title="No posts yet"
  description="Be the first to share something"
  action={<Button onClick={openComposer}>Create Post</Button>}
/>
```

### Not a Member

```tsx
<GatedContent>
  <LockIcon />
  <p>Join this space to see content</p>
  <JoinButton />
</GatedContent>
```

---

## Cognitive Budgets

| Constraint | Value | Usage |
|------------|-------|-------|
| `maxPins` | 2 | Pinned posts above feed |
| `maxRailWidgets` | 3 | Right rail widgets (if enabled) |
| `toolFields` | 8 | Custom tool form fields |
| `cardPrimaryCtas` | 2 | Actions per card |

---

## Performance

| Metric | Target |
|--------|--------|
| Space load | < 1s |
| Join action | < 200ms UI |
| Post create | < 100ms UI |
| Pin toggle | < 50ms UI |

---

## Accessibility

- [ ] Space header has proper heading hierarchy
- [ ] Join button has loading state announcement
- [ ] Pinned posts marked with `aria-label`
- [ ] Composer has accessible labels
- [ ] Role badges have screen reader text

---

## Related Documentation

- [`COGNITIVE_BUDGETS.md`](../COGNITIVE_BUDGETS.md) - Pin and widget limits
- [`FEED_UI_UX_TOPOLOGY.md`](./FEED_UI_UX_TOPOLOGY.md) - Feed card patterns
- [`UI_UX_WORKING_GUIDE.md`](../UI_UX_WORKING_GUIDE.md) - Design tokens

---

*Last updated: November 2025*
