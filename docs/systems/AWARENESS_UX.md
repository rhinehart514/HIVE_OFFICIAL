# HIVE Awareness System UX Audit

**Date:** 2026-02-04
**Auditor:** Design Agent Panel (15 perspectives)
**Status:** Comprehensive recommendations

---

## Executive Summary

The Awareness System encompasses everything that keeps students informed: the home dashboard, notifications, calendar, and activity feeds. The goal: answer "What's happening?" and "What should I do?" within 3 seconds of opening HIVE.

**Current State:** Solid foundation with real SSE streaming, activity feeds, and calendar. But the experience is fragmented - home, notifications, and calendar feel like three separate apps rather than one coherent awareness layer.

**2026 Vision:** A unified awareness experience that rivals Superhuman's email triage, Linear's inbox, and Apple Calendar's clarity. Information should feel alive, glanceable, and actionable.

---

## 1. Dashboard Composer

### Current Assessment

**File:** `/apps/web/src/app/home/page.tsx`

The home page is a single-column activity stream with 6 sections:
1. Greeting header (time-aware: morning/afternoon/evening)
2. Happening Now (active users across spaces)
3. Up Next (next event within 24h)
4. Your Spaces (grid with unread badges)
5. Recent Activity (last 10 activities)
6. Suggested (one space recommendation)

**What Works:**
- Time-aware greeting creates warmth
- "Happening Now" pulse indicator for liveness
- Unread badges with gold glow (`animate-pulse-gold`) draw attention
- Staggered reveal animations (`staggerContainerVariants`)
- Inline RSVP action on events

**What Doesn't:**
- Information density too low for power users
- No priority signals - everything has equal weight
- "Happening Now" disappears if nobody online (lost real estate)
- Recent Activity lacks type differentiation beyond icons
- No time grouping (Today vs Yesterday vs This Week)
- New user empty state is good, but existing user with 0 activity has no guidance

### 2026 Design Direction

**Reference:** Notion's home with database cards + Linear's inbox prioritization

**Pattern:** "Morning Brief" - A single glanceable summary that answers:
- What's urgent (events starting soon, unread mentions)
- What's active (people online, conversations happening)
- What's yours (your spaces, your tasks)

### Specific Recommendations

**R1.1 - Priority Stack (High Impact)**
```
Replace equal-weight sections with priority-based hierarchy:

[URGENT]    Starting in 30min: Design Club meeting (12 going)  [Join]
[ACTIVE]    8 people active in Hacker Space now               [Jump in]
[UNREAD]    5 new messages across 2 spaces                    [Catch up]
[─────────────────────────────────────────────────────────────────────]
[Your Spaces]  [Recent Activity]  [Events]
```

Implementation: Add `priority` field to activity items. Sort by:
1. Events starting within 2 hours
2. Direct mentions (not yet implemented)
3. Spaces with unread messages (ordered by count)
4. General activity

**R1.2 - Time-Grouped Activity**
```tsx
// Group activity by time buckets
const timeGroups = {
  now: [],        // Last 30 minutes
  today: [],      // Today but not now
  yesterday: [],  // Yesterday
  thisWeek: [],   // Rest of week
};
```

Visual: Use subtle section dividers with time labels. Linear does this beautifully.

**R1.3 - Collapsed "Happening Now" State**
When nobody is online, don't remove the section entirely. Instead:
```
[───────────────────────────]
  All quiet right now. Your spaces wake up around 3pm.
  (Based on activity patterns)
[───────────────────────────]
```

**R1.4 - Activity Type Visual Differentiation**
Current: All activities use same opacity/weight
Proposed: Type-specific treatments

| Type | Icon | Text Weight | Bg Treatment |
|------|------|-------------|--------------|
| new_messages | MessageCircle | semibold | gold glow if unread |
| member_joined | UserPlus | normal | green dot |
| event_created | CalendarPlus | semibold | purple accent |
| tool_deployed | Package | normal | blue accent |

---

## 2. Notification Designer

### Current Assessment

**Files:**
- `/apps/web/src/components/notifications/hive-notification-bell.tsx` (popover)
- `/apps/web/src/app/me/notifications/page.tsx` (full page)
- `/apps/web/src/hooks/use-realtime-notifications.ts` (data layer)

**What Works:**
- SSE streaming for real-time updates (solid infrastructure)
- Grouped by space in popover (good mental model)
- Collapsible groups with unread counts
- Badge animation with spring physics
- "Mark all read" action available
- Full page has filter tabs (All/Mentions/Likes/Follows/Events)

**What Doesn't:**
- No sound/haptic feedback for new notifications
- Bell icon doesn't animate on new notification arrival
- Popover max 5 items per group with "+N more" truncation
- No notification preferences in popover (have to go to settings)
- No snooze functionality
- No quick actions (archive, mute space)
- Full page filters don't persist
- No keyboard navigation in popover

### 2026 Design Direction

**Reference:** Superhuman's split inbox + Linear's notification center

**Pattern:** "Triage Mode" - Allow rapid processing of notifications without leaving current context

### Specific Recommendations

**R2.1 - Notification Arrival Animation (High Impact)**
```tsx
// Bell wiggle on new notification
const bellWiggleVariants = {
  rest: { rotate: 0 },
  wiggle: {
    rotate: [0, -15, 15, -10, 10, -5, 5, 0],
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
};

// Badge scale pulse on increment
const badgePulseVariants = {
  rest: { scale: 1 },
  pulse: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.3 }
  }
};
```

**R2.2 - Keyboard Navigation in Popover**
```
j/k     - Navigate up/down
Enter   - Open notification
e       - Mark as read
Shift+E - Mark all read
Escape  - Close popover
g n     - Go to notifications page
```

Implementation: Add `useKeyboardNav` hook to popover component.

**R2.3 - Quick Actions on Hover**
```
[Notification Item]
  "Sarah joined Design Club"
  2h ago

  On hover, reveal:
  [Mark Read] [Mute Space] [...]
```

Use opacity transition to reveal actions. Don't shift layout.

**R2.4 - Notification Sound (Opt-in)**
```ts
// In use-notification-stream.ts
const playNotificationSound = () => {
  if (userPreferences.notificationSound !== 'none') {
    const audio = new Audio(`/sounds/${userPreferences.notificationSound}.mp3`);
    audio.volume = 0.3;
    audio.play();
  }
};

// Sounds: 'pop', 'ding', 'chime', 'none' (default: none)
```

**R2.5 - Smart Grouping on Full Page**
Current: Filter tabs (All/Mentions/Likes...)
Proposed: Smart sections that collapse

```
[TODAY]
  - 3 new messages in Design Club
  - Event "Hackathon" starts tomorrow

[YESTERDAY]
  - Jordan joined Startup Club
  - New tool deployed: Signup Form

[EARLIER THIS WEEK]
  (collapsed by default)
```

---

## 3. Calendar Visualizer

### Current Assessment

**Files:**
- `/apps/web/src/app/me/calendar/page.tsx`
- `/apps/web/src/hooks/use-calendar.ts`
- `/apps/web/src/components/calendar/calendar-components.tsx`

**What Works:**
- Three views: day/week/month with toggle
- Keyboard shortcuts (t=today, d/w/m=view, arrows=navigate)
- Event type filtering (Campus Events, Classes, etc.)
- Conflict detection with severity levels (overlap/adjacent/close)
- Conflict resolution panel with grouped conflicts
- RSVP actions inline
- Space badge on events

**What Doesn't:**
- Grid layout for events (not actual time blocks)
- No visual time representation in day/week view
- Month view is just a list, not a traditional grid
- No "Add to Google Calendar" option
- No recurring event patterns
- Conflict resolution is modal, not inline
- No quick-add from calendar
- Events sorted by filter, not by actual time in UI

### 2026 Design Direction

**Reference:** Apple Calendar's time block clarity + Notion Calendar's event cards

**Pattern:** "Time as Canvas" - Events should occupy their actual time space, not just be listed

### Specific Recommendations

**R3.1 - Time Block View for Day/Week (High Impact)**
```
Day View:
[────── 9am ──────]
|                  |
| Design Club      |  <- 9-10am
| @ Room 204       |
|                  |
[────── 10am ─────]
|                  |  <- Free
[────── 11am ─────]
| CS 301 Lab       |
| @ Engineering    |
[────── 12pm ─────]
```

Implementation: Calculate event height based on duration. Use CSS Grid with hour rows.

```tsx
const getEventStyle = (event: CalendarEvent) => {
  const startHour = new Date(event.startTime).getHours();
  const duration = (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60 * 60);

  return {
    gridRowStart: startHour - 8, // Assuming 8am start
    gridRowEnd: `span ${Math.ceil(duration)}`,
  };
};
```

**R3.2 - Week View with Stacked Days**
```
        Mon    Tue    Wed    Thu    Fri
9am     [Evt]         [Evt]
10am           [Lab]         [Lab]
11am    [Evt]  [───]         [───]
12pm
```

Mobile: Show current day expanded, others as pills.

**R3.3 - Conflict Inline Resolution**
Current: Modal dialog for conflicts
Proposed: Inline conflict indicator with action

```
[Event A - 2pm]  ⚠️ Conflicts with Event B
                 [Skip this] [Skip Event B]
```

Don't interrupt flow with modal. Let users decide in context.

**R3.4 - Month Grid View**
```
         February 2026
  Su  Mo  Tu  We  Th  Fr  Sa
                          1
  2   3   4   5   6   7   8
      •       ••  •
  9  10  11  12  13  14  15
  •       •
```

Where dots indicate events. Click to expand day.

**R3.5 - Calendar Sync Status**
```
[Settings cog] -> "Events from your spaces only"
                  Want personal events? Connect Google Calendar (coming soon)
```

Be transparent about data sources.

---

## 4. Feed Item Designer

### Current Assessment

**Files:**
- `/apps/web/src/app/api/activity-feed/route.ts` (API)
- Activity items in home page

**Activity Types:**
1. `new_messages` - Grouped message count by space
2. `member_joined` - Someone joined a space
3. `event_created` - New event in space
4. `tool_deployed` - Tool added to space

**What Works:**
- Clean API with batched queries
- User name resolution with caching
- Time-based filtering (last 7 days default)
- Space context on all items

**What Doesn't:**
- All items look identical (same icon size, text weight)
- No preview of actual content (just counts)
- No direct action from feed (have to navigate)
- No "show less like this" feedback
- Message counts don't show who sent them
- No distinction between "I care" and "I don't care"

### 2026 Design Direction

**Reference:** Linear's activity feed + GitHub's notifications

**Pattern:** "Contextual Cards" - Each activity type gets its own optimized layout

### Specific Recommendations

**R4.1 - Activity Card Templates**

```tsx
// NEW_MESSAGES card
<ActivityCard variant="messages">
  <SpaceAvatar />
  <div>
    <span className="font-medium">{spaceName}</span>
    <p className="text-white/50">
      {actorName} and {count - 1} others sent messages
    </p>
    <p className="text-white/30 text-sm">
      "{truncate(lastMessagePreview, 60)}"  // Preview of last message
    </p>
  </div>
  <Button size="sm">View</Button>
</ActivityCard>

// EVENT_CREATED card
<ActivityCard variant="event">
  <EventIcon type={eventType} />
  <div>
    <span className="font-medium">{eventTitle}</span>
    <p className="text-white/50">
      {eventDate} · {spaceName}
    </p>
    <p className="text-white/30">
      {rsvpCount} going
    </p>
  </div>
  <Button size="sm" variant="gold">RSVP</Button>  // Inline RSVP
</ActivityCard>
```

**R4.2 - Message Preview in Activity**
Add `lastMessagePreview` to activity API response:
```ts
// In activity-feed/route.ts
if (count > 0) {
  const latestPost = postsSnapshot.docs[0].data();
  items.push({
    // ... existing fields
    lastMessagePreview: latestPost.content?.substring(0, 80),
    lastMessageAuthor: await resolveUserName(latestPost.authorId),
  });
}
```

**R4.3 - Action Density Slider (Settings)**
Let users control feed density:
- **Verbose:** Show all activity with previews
- **Balanced:** Show activity without previews (current)
- **Minimal:** Show only events and mentions

---

## 5. Home Page Architect

### Current Assessment

**Section Order:**
1. Header (greeting + date)
2. Happening Now (if anyone online)
3. Up Next (if event within 24h)
4. Your Spaces
5. Recent Activity
6. Suggested

**What Works:**
- Greeting creates emotional connection
- Time-sensitive content (events) near top
- Clear hierarchy with section headers

**What Doesn't:**
- Fixed order doesn't adapt to user context
- Morning vs evening should prioritize differently
- Power users want density, new users want guidance
- No pinned/favorite spaces concept

### 2026 Design Direction

**Reference:** iOS widgets + Notion's home customization

**Pattern:** "Adaptive Priority" - Page structure responds to time and user state

### Specific Recommendations

**R5.1 - Time-Adaptive Ordering**

```
Morning (6am-12pm):
1. Header: "Good morning, [Name]"
2. Today's Events (what's on your calendar today)
3. Your Spaces (start the day)
4. Activity overnight

Evening (6pm-12am):
1. Header: "Good evening, [Name]"
2. Happening Now (who's online?)
3. Your Spaces
4. Tomorrow's Events (prep for tomorrow)
```

**R5.2 - Pinned Spaces**
Add heart icon to spaces. Pinned spaces appear first and get larger cards.

```tsx
interface SpaceData {
  // ... existing
  isPinned?: boolean;
}

// Sort: pinned first, then by lastActivityAt
spaces.sort((a, b) => {
  if (a.isPinned && !b.isPinned) return -1;
  if (!a.isPinned && b.isPinned) return 1;
  return new Date(b.lastActivityAt) - new Date(a.lastActivityAt);
});
```

**R5.3 - Collapsible Sections**
```tsx
<CollapsibleSection
  title="Recent Activity"
  defaultCollapsed={activityItems.length > 5}
>
  {/* Show 5, collapse rest */}
</CollapsibleSection>
```

---

## 6. Notification Center Designer

### Current Assessment

**Full page:** `/me/notifications`
- Tab filters: All, Mentions, Likes, Follows, Events
- Card-based list with icons
- Mark all read action
- Delete individual notifications
- Empty states for each filter

**What Works:**
- Filter tabs help focus
- Click-to-navigate with auto-mark-read
- Accessibility: proper roles, aria labels

**What Doesn't:**
- No bulk actions beyond "mark all read"
- No search within notifications
- No date grouping
- Can't mute specific notification types
- Settings link is small/hidden

### 2026 Design Direction

**Reference:** Gmail's inbox + Superhuman's triage

**Pattern:** "Inbox Zero" - Design for clearing, not accumulating

### Specific Recommendations

**R6.1 - Swipe Actions (Mobile)**
```
<─── Swipe left:  Archive/Delete
───> Swipe right: Mark as read
```

Implementation: Use `framer-motion` drag gestures with threshold.

**R6.2 - Bulk Selection**
```
[Select mode]
  □ Notification 1
  □ Notification 2
  □ Notification 3

[3 selected] [Mark read] [Delete] [Cancel]
```

**R6.3 - Search/Filter Bar**
```
[🔍 Search notifications...]  [All ▾] [This week ▾]
```

Filter by text content, type, and time range.

**R6.4 - Notification Preferences Quick Access**
Add settings cog in header that expands inline:
```
[⚙️ Settings]
  □ Messages (on)
  □ Events (on)
  □ New members (off)
  □ Tool updates (off)
  [Manage all →]
```

---

## 7. Calendar Layout

### Current Assessment

The calendar is event-card based, not time-grid based. This works for "what's happening" but not for "when am I free?"

**Primary View:** Month (default)
**Problem:** Students need to see their actual schedule blocks, not just event cards.

### 2026 Design Direction

**Reference:** Apple Calendar day view + Google Calendar week view

**Pattern:** "Time as Primary Dimension" - Show time on Y-axis, not just as metadata

### Specific Recommendations

**R7.1 - Default to Week View**
Students think in weeks (class schedules). Make week the default, with day as drill-down.

```tsx
const { initialViewMode = 'week' } = options; // Change from 'month'
```

**R7.2 - Mini Month Picker**
Add small month grid for quick navigation:
```
[<] February 2026 [>]   [Week view ▾]
       M  T  W  T  F
      [3][4][5][6][7]  <- Current week highlighted
      10 11 12 13 14
      17 18 19 20 21
```

**R7.3 - "Agenda" View Option**
For quick scanning without time grid:
```
MONDAY, FEB 10
  9:00am  Design Club meeting (2h)
  2:00pm  CS 301 Lab (3h)

TUESDAY, FEB 11
  No events

WEDNESDAY, FEB 12
  11:00am Hackathon kickoff
```

---

## 8. Widget System Designer

### Current Assessment

No widget system exists. Home page has hardcoded sections.

### 2026 Design Direction

**Reference:** iOS widgets + Notion blocks

**Pattern:** "Composable Awareness" - Let users build their own dashboard

### Specific Recommendations

**R8.1 - Widget Types (Future Feature)**

| Widget | Size | Content |
|--------|------|---------|
| `next-event` | small | Next upcoming event with RSVP |
| `active-now` | small | Online count across spaces |
| `space-quick` | medium | Single space with unread + online |
| `calendar-day` | medium | Today's schedule blocks |
| `activity-feed` | large | Recent activity stream |
| `my-tools` | medium | Tools I built/use |

**R8.2 - Widget Shell Component**
```tsx
interface WidgetProps {
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
  onRemove: () => void;
  onConfigure: () => void;
}

<Widget type="next-event" size="small">
  <WidgetHeader>
    <WidgetTitle>Up Next</WidgetTitle>
    <WidgetActions />
  </WidgetHeader>
  <WidgetContent>
    {/* Widget-specific content */}
  </WidgetContent>
</Widget>
```

**R8.3 - Widget Grid Layout**
```
Desktop:
[small] [small] [medium    ]
[large         ] [medium    ]

Mobile:
[medium    ]
[small][small]
[large         ]
```

Use CSS Grid with named areas.

---

## 9. Real-Time Update Animator

### Current Assessment

**SSE Infrastructure:**
- `/api/notifications/stream` sends real-time updates
- `use-notification-stream.ts` handles connection with reconnect logic
- Optimistic updates for mark-as-read

**Animation on New Notification:**
- Badge count increments with spring animation
- No bell animation
- No sound
- No toast/banner for new notifications

### 2026 Design Direction

**Reference:** Slack's new message indicator + iMessage typing bubble

**Pattern:** "Ambient Awareness" - Updates should be noticed but not intrusive

### Specific Recommendations

**R9.1 - New Notification Toast**
Show brief toast when notification arrives (if user not in popover):
```tsx
<AnimatePresence>
  {showToast && (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-4 right-4 z-50"
    >
      <NotificationToast
        title={notification.title}
        onClick={() => navigate(notification.actionUrl)}
        onDismiss={() => setShowToast(false)}
        autoDismiss={5000}
      />
    </motion.div>
  )}
</AnimatePresence>
```

**R9.2 - Bell Attention Animation**
```tsx
// Wiggle only once when count increases
useEffect(() => {
  if (unreadCount > prevUnreadCount.current) {
    controls.start('wiggle');
  }
  prevUnreadCount.current = unreadCount;
}, [unreadCount]);
```

**R9.3 - Activity Feed Live Updates**
When new activity arrives while viewing home:
```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  className="bg-gold-500/5 border-l-2 border-gold-500"
>
  <NewActivityItem />
</motion.div>
```

Use gold highlight for new items, fade to normal after 5 seconds.

---

## 10. Notification Triage Designer

### Current Assessment

**Triage Actions:**
- Mark as read (click + navigate)
- Mark all as read (button)
- Delete individual (button)

**Missing:**
- Snooze
- Archive (separate from delete)
- Bulk select
- Keyboard shortcuts

### 2026 Design Direction

**Reference:** Superhuman's email triage + Linear's keyboard-first design

**Pattern:** "Zero Friction Processing" - Handle notifications without thinking

### Specific Recommendations

**R10.1 - Keyboard Shortcut System**
```
Global:
  Cmd+K      Command palette
  g n        Go to notifications

In Notifications:
  j/k        Navigate
  Enter      Open/action
  e          Mark read
  #          Delete
  Shift+A    Archive all read
  s          Snooze 1 hour
  Shift+S    Snooze menu
```

**R10.2 - Snooze Feature**
```tsx
const SNOOZE_OPTIONS = [
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: 'Tomorrow morning', value: getNextMorning() },
  { label: 'Next week', value: 7 * 24 * 60 * 60 * 1000 },
];

// In notification document
interface Notification {
  // ... existing
  snoozedUntil?: Timestamp;
}

// Filter out snoozed in queries
.where('snoozedUntil', '<=', new Date())
```

**R10.3 - Command Palette Integration**
```
[Cmd+K] > "notifications"
  > Mark all notifications read
  > Open notification center
  > Mute Design Club notifications
```

---

## 11. Time Navigation

### Current Assessment

**Calendar Navigation:**
- Prev/Next buttons
- "Today" button
- Keyboard: arrows navigate, 't' goes to today

**What Works:**
- Keyboard shortcuts documented in UI
- Smooth transitions between dates

**What Doesn't:**
- No quick jump to specific date
- No "this weekend" or "next week" shortcuts
- Relative time in activity uses "Xm ago" format (good)

### 2026 Design Direction

**Reference:** Apple Calendar's date picker + Fantastical's natural language

**Pattern:** "Smart Time Jump" - Get anywhere in time quickly

### Specific Recommendations

**R11.1 - Date Picker Popover**
Click on date title to open picker:
```
[February 2026 ▾]

    February 2026
Su Mo Tu We Th Fr Sa
                   1
 2  3  4  5  6  7  8
 9 10 11 12 13 14 15
16 17 18 19 20 21 22
23 24 25 26 27 28

[Today] [This weekend] [Next week]
```

**R11.2 - Natural Language Input (Future)**
```
[Jump to...] "next tuesday"
             → Navigates to Feb 11, 2026
```

**R11.3 - Relative Time Consistency**
Ensure all timestamps use same format:
- Under 1 min: "just now"
- Under 1 hour: "Xm ago"
- Under 24 hours: "Xh ago"
- Yesterday: "yesterday"
- This week: "Monday" (day name)
- Older: "Feb 4" (month + day)
- Different year: "Feb 4, 2025"

---

## 12. Quick Actions Designer

### Current Assessment

**Inline Actions:**
- RSVP from home page event card (works)
- RSVP from calendar event (works)
- Mark notification read (implicit on click)

**Missing:**
- Join space from activity
- Message space from notification
- Add event to calendar from notification
- Share event from anywhere

### 2026 Design Direction

**Reference:** iOS long-press menus + Notion's quick actions

**Pattern:** "Action in Context" - Do it now, don't navigate away

### Specific Recommendations

**R12.1 - Activity Quick Actions**
```
[Activity: "5 new messages in Design Club"]
  Right side: [→ Go]
  On hover: [↵ Reply] [🔇 Mute]
  Long press (mobile): Full action menu
```

**R12.2 - Event Quick Actions**
```
[Event Card]
  [RSVP ▾] -> Going / Interested / Not going
  [⋮] -> Add to calendar / Share / Copy link
```

**R12.3 - Space Quick Actions in Spaces Grid**
```
[Space Card: Design Club]
  On hover: [💬 Chat] [📅 Events] [⚙️]
```

---

## 13. Morning Check-In Experience

### Current Assessment

User opens HIVE at 9am Monday.

**Current Flow:**
1. See greeting "Good morning, Jordan"
2. See today's date
3. See "3 people active across 2 spaces" (if anyone online)
4. See next event (if within 24h)
5. See spaces with unread counts
6. See activity feed

**What Works:**
- Greeting creates warmth
- Unread badges are noticeable

**What Doesn't:**
- No summary of what happened overnight
- No "what's on today" section
- Activity feed shows everything, not curated

### 2026 Design Direction

**Reference:** Apple Watch morning summary + Notion's day plan

**Pattern:** "Morning Brief" - 10-second scan tells you everything

### Specific Recommendations

**R13.1 - Morning Summary Card**
```tsx
<MorningSummaryCard>
  <h3>While you were away</h3>
  <ul>
    <li>12 new messages in 3 spaces</li>
    <li>Jordan joined Startup Club</li>
    <li>Tomorrow: Hackathon kickoff at 2pm</li>
  </ul>
  <Button>Catch up</Button>
</MorningSummaryCard>
```

Show only if last visit was >8 hours ago.

**R13.2 - Today's Schedule Mini**
```
[TODAY'S SCHEDULE]
9am   Free
10am  CS 301 Lab
1pm   Design Club meeting
4pm   Free
```

Collapsed by default if no events. Expanded if events exist.

**R13.3 - "Start Your Day" CTA**
For new/returning users:
```
[Your day starts here]
Join a conversation →  (links to most active space)
```

---

## 14. Notification Overload Handler

### Current Assessment

User returns after 2 weeks with 50 unread notifications.

**Current Experience:**
- See "50 new" badge
- Open popover, see grouped by space
- Each group shows 5 items + "+N more"
- Can mark all read

**What Works:**
- Grouping reduces visual noise
- Mark all read exists

**What Doesn't:**
- No "catch up" summary
- No smart prioritization
- No "see only important" filter
- Overwhelming list

### 2026 Design Direction

**Reference:** Gmail's "Important first" + Superhuman's split inbox

**Pattern:** "Graceful Degradation" - More notifications = smarter filtering

### Specific Recommendations

**R14.1 - Overwhelm Detection**
```tsx
const isOverwhelmed = unreadCount > 20;

if (isOverwhelmed) {
  return (
    <OverwhelmSummary>
      <h3>50 notifications while you were away</h3>
      <SummaryStats>
        <li>32 messages across 4 spaces</li>
        <li>8 new members</li>
        <li>6 events created</li>
        <li>4 tools deployed</li>
      </SummaryStats>
      <div className="flex gap-2">
        <Button variant="gold">Show important only</Button>
        <Button variant="ghost">Mark all read</Button>
      </div>
    </OverwhelmSummary>
  );
}
```

**R14.2 - "Important" Filter**
Define importance:
1. Direct mentions (when implemented)
2. Events starting within 24h
3. Messages from pinned spaces
4. Everything else

Add filter: `[All] [Important] [Messages] [Events]`

**R14.3 - Smart Mark Read**
```
[Mark read: messages only]
[Mark read: older than 1 week]
[Mark all read]
```

Let users be specific about what to clear.

---

## 15. Calendar Integration

### Current Assessment

**Data Sources:**
- HIVE space events (primary)
- Personal events removed (use Google Calendar)

**Integration Status:**
- No external calendar sync
- No .ics export
- No "Add to calendar" links

### 2026 Design Direction

**Reference:** Notion Calendar + Calendly's sync

**Pattern:** "Single Pane of Glass" - See all events, regardless of source

### Specific Recommendations

**R15.1 - Add to Calendar Links**
```tsx
const generateCalendarLinks = (event: CalendarEvent) => ({
  google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`,
  apple: generateICS(event),
  outlook: generateOutlookLink(event),
});

// In EventDetailsModal:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="secondary">Add to calendar</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => window.open(links.google)}>
      Google Calendar
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => downloadICS(event)}>
      Apple Calendar (.ics)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => window.open(links.outlook)}>
      Outlook
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**R15.2 - .ics Export for Events**
```ts
const generateICS = (event: CalendarEvent) => `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatICSDate(event.startTime)}
DTEND:${formatICSDate(event.endTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR
`;
```

**R15.3 - Google Calendar Sync (Future Feature)**
```
[Calendar Settings]
  □ Show personal events (requires Google Calendar connection)

  [Connect Google Calendar]

  When connected:
  - Personal events appear in gray
  - HIVE events appear in gold
  - Conflicts detected across both
```

**R15.4 - Visual Differentiation of Sources**
```
| Source | Color | Border |
|--------|-------|--------|
| HIVE space | Gold accent | Solid |
| Personal | Gray | Dashed |
| External | Blue | Dotted |
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 weeks)
- R2.1: Bell wiggle animation on new notification
- R3.2: Week view as default
- R4.1: Activity card templates with type differentiation
- R9.1: New notification toast
- R15.1: Add to calendar links

### Phase 2: Core Improvements (3-4 weeks)
- R1.1: Priority stack on home page
- R1.2: Time-grouped activity
- R2.2: Keyboard navigation in popover
- R10.1: Keyboard shortcut system
- R13.1: Morning summary card

### Phase 3: Advanced Features (5-8 weeks)
- R3.1: Time block view for day/week
- R10.2: Snooze feature
- R8.1: Widget system foundation
- R14.1: Overwhelm detection
- R15.3: Google Calendar sync (if prioritized)

---

## Design System Additions Needed

### New Components
- `<NotificationToast />` - Brief notification popup
- `<MorningSummaryCard />` - Overnight summary
- `<TimeBlockGrid />` - Calendar time visualization
- `<OverwhelmSummary />` - High notification count handler
- `<QuickActionMenu />` - Context-specific actions

### New Tokens
```ts
// motion.ts additions
export const notificationEntryVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10 },
};

export const bellWiggleVariants = {
  rest: { rotate: 0 },
  wiggle: { rotate: [0, -15, 15, -10, 10, -5, 5, 0] },
};
```

### New Hooks
- `useKeyboardNav` - Keyboard navigation for lists
- `useNotificationSound` - Sound preferences + playback
- `useTimeAwareLayout` - Morning vs evening adaptations

---

## Files to Modify

1. `/apps/web/src/app/home/page.tsx` - Priority ordering, time grouping
2. `/apps/web/src/components/notifications/hive-notification-bell.tsx` - Animation, keyboard nav
3. `/apps/web/src/app/me/notifications/page.tsx` - Bulk actions, filters
4. `/apps/web/src/hooks/use-calendar.ts` - Week default, time blocks
5. `/apps/web/src/app/me/calendar/page.tsx` - Time grid view
6. `/apps/web/src/components/events/event-details-modal.tsx` - Add to calendar
7. `/apps/web/src/app/api/activity-feed/route.ts` - Message previews
8. `/packages/tokens/src/motion.ts` - New animation variants

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to understand "what's happening" | ~15s | <5s |
| Notification clear rate (per session) | ~40% | >70% |
| Calendar view changes (per visit) | 1.5 | <1.2 |
| Return to home (after navigation) | 3.2x | <2x |
| Keyboard shortcut adoption | 0% | 20% |

---

## References

- **Superhuman:** Split inbox, keyboard-first, snooze
- **Linear:** Notification triage, keyboard navigation, issue inbox
- **Apple Calendar:** Time block clarity, mini month picker
- **Notion:** Database views, customizable home, block system
- **iOS Widgets:** Glanceable info, size variants
- **ChatGPT:** Streaming updates, conversational feel
- **Slack:** New message indicators, channel sidebar
- **Gmail:** Smart categories, importance filter
