# HIVE Awareness System

**Philosophy:** "A student with HIVE has a campus that knows them."

The Awareness System is how HIVE keeps students informed about what matters. It answers: "What should I pay attention to right now?"

---

## Table of Contents

1. [Current State](#current-state)
2. [Gaps & Refinements](#gaps--refinements)
3. [Feature Ideation](#feature-ideation)
4. [Strategic Considerations](#strategic-considerations)
5. [Feature Specifications](#feature-specifications)
6. [Integration Points](#integration-points)

---

## Current State

### 1. Home/Dashboard (`/home`)

**File:** `/apps/web/src/app/home/page.tsx`

The home page is a single-column activity stream designed to answer "what should I do?"

**Current Sections (in order):**
1. **Greeting Header** - Time-based greeting with user's first name + today's date
2. **Happening Now** - Active users across spaces (green pulse indicator)
3. **Up Next** - Next event within 24 hours (if any), with RSVP action
4. **Your Spaces** - 2-column grid with unread badges, online counts
5. **Recent Activity** - Last 10 activities across spaces
6. **Suggested** - One space recommendation (once per day)

**New User State:** If user has 0 spaces, shows:
- Centered empty state message
- Recommended spaces with join buttons
- "Explore All Spaces" CTA

**Data Sources:**
- `/api/profile/my-spaces` - User's space memberships
- `/api/profile/dashboard?includeRecommendations=true` - Events + recommendations
- `/api/activity-feed?limit=10` - Cross-space activity

**What Works:**
- Clean, single-column design with clear hierarchy
- Graceful loading states (skeletons match layout)
- New user flow is thoughtful (not an empty dead end)
- Motion is subtle and consistent (uses `@hive/tokens`)
- RSVP actions work inline

**What's Janky:**
- 3 parallel fetch calls on mount (could be consolidated)
- Activity feed mark-as-viewed fires after 5-second timeout (arbitrary)
- No real-time updates - requires page refresh to see new activity
- "Happening Now" section only shows if totalOnline > 0 (can flicker)

---

### 2. Notifications (`/me/notifications`)

**File:** `/apps/web/src/app/me/notifications/page.tsx`

Full-page notification hub with filter tabs.

**Filter Tabs:**
- All | Mentions | Likes | Follows | Events

**Features:**
- Unread count badge in header
- Mark all read action
- Delete individual notifications
- Click notification to navigate + mark read
- Settings link to `/me/settings`

**Empty States:**
- `new_user`: "Stay in the loop" + Browse Spaces CTA
- `filtered`: "Nothing here" (filter-specific)
- `caught_up`: "You're all caught up" with emerald checkmark

**Notification Types Supported:**
- `like`, `comment`, `mention`, `follow`, `event`, `announcement`

**What Works:**
- Filter tabs work correctly
- Empty states are contextual and helpful
- Mark all read is one click
- Good accessibility (aria labels, roles)

**What's Janky:**
- Fetches on every filter change (could cache)
- No pagination (hard limit of 50)
- Polling fallback (not true real-time)

---

### 3. Notification Bell (Header Component)

**File:** `/apps/web/src/components/notifications/hive-notification-bell.tsx`

Popover notification bell with space-grouped notifications.

**Features:**
- Unread count badge (gold, max "99+")
- Grouped by space (collapsible sections)
- "General" group for non-space notifications
- Max 5 notifications per group shown
- "+X more" overflow indicator
- "View all notifications" footer link

**Data Flow:**
- Uses `useRealtimeNotifications` hook
- Hook uses `useNotificationStream` for SSE
- Falls back to polling if SSE fails

---

### 4. Real-time Notification Stream

**Hook:** `/apps/web/src/hooks/use-notification-stream.ts`

SSE-based real-time notification delivery.

**Connection Strategy:**
1. Establish SSE connection to `/api/notifications/stream`
2. On error: exponential backoff reconnect (max 5 attempts)
3. After max attempts: fall back to 30-second polling
4. Handle message types: `connected`, `notification`, `notification_update`, `notification_delete`, `unread_count`, `ping`

**Optimistic Updates:**
- `optimisticMarkAsRead(notificationId)` - instant UI update
- `optimisticMarkAllAsRead()` - instant UI update

**What Works:**
- SSE provides near-instant notifications
- Graceful degradation to polling
- Optimistic updates feel responsive

**What's Missing:**
- No reconnection indicator in UI
- Polling fallback interval (30s) is too slow

---

### 5. Calendar (`/me/calendar`)

**File:** `/apps/web/src/app/me/calendar/page.tsx`

Read-only calendar showing events from user's spaces.

**View Modes:** Day | Week | Month

**Features:**
- Event type filter (Campus Events, Classes, Assignments, Meetings, Personal)
- Conflict detection (overlap, adjacent, close proximity)
- Conflict resolution panel modal
- Keyboard navigation (arrows, t/d/w/m)
- Event details modal with RSVP

**Data Source:** `/api/calendar` - fetches events from all user's spaces

**Conflict Detection:**
- `overlap`: Time ranges overlap
- `adjacent`: Events end/start at same time
- `close`: Within 15 minutes of each other

**What Works:**
- Conflict detection is smart
- Keyboard shortcuts are intuitive
- Empty states guide to explore

**What's Missing:**
- No external calendar sync (Google Calendar integration stubbed)
- No personal events (by design - spaces-first)
- No event creation from calendar view

---

### 6. Presence System

**Hook:** `/apps/web/src/hooks/use-presence.ts`

Firebase-based real-time presence tracking.

**Status Types:** `online` | `away` | `offline`

**Behavior:**
- Sets online on page load
- Sets away on tab hidden (visibility change)
- Sets offline on page close/unload
- Heartbeat every 60 seconds
- TTL: 90 minutes, Stale threshold: 5 minutes

**Hooks Available:**
- `usePresence()` - Track current user's presence
- `useOnlineUsers(spaceId?)` - Get online users in space/campus
- `useTypingIndicator(contextId)` - Typing indicators for chat
- `useActiveTodayCount()` - Users active in last 24h
- `useUserStatus(userId)` - Single user's status

**What Works:**
- Immediate feedback for online status
- Stale filtering prevents ghost users
- Page lifecycle events handled well

**What's Broken:**
- `beforeunload` may not always fire (browser limitation)
- No reconnection handling on network change

---

### 7. Activity Feed API

**File:** `/apps/web/src/app/api/activity-feed/route.ts`

Server-side activity aggregation across user's spaces.

**Activity Types:**
- `new_messages` - Grouped by space, shows count
- `member_joined` - New members in user's spaces
- `event_created` - New events in user's spaces
- `tool_deployed` - Tools added to spaces

**Query Parameters:**
- `limit`: 1-50, default 20
- `since`: ISO timestamp, default 7 days ago

**Implementation:**
- Batches Firestore queries (max 30 per 'in' query)
- Resolves user names from ID
- Sorts by timestamp descending

---

### 8. Notification Service (Server-side)

**File:** `/apps/web/src/lib/notification-service.ts`

Creates notifications when platform events occur.

**Notification Types:**
```
comment, comment_reply, like, mention, space_invite, space_join,
space_role_change, builder_approved, builder_rejected,
space_event_created, event_reminder, event_rsvp, connection_new,
tool_deployed, ritual_joined, ritual_active, ritual_checkin, system
```

**Categories:**
```
social, spaces, events, connections, tools, rituals, system
```

**Features:**
- User preference checking (category toggles, quiet hours)
- Per-space mute settings (with expiration)
- Duplicate prevention (1 hour window)
- Bulk notification support (batched in 10s)

**Convenience Functions:**
- `notifyNewComment()`, `notifyCommentReply()`, `notifyPostLike()`
- `notifyMention()`, `notifySpaceInvite()`, `notifySpaceJoin()`
- `notifyRoleChange()`, `notifyBuilderApproved/Rejected()`
- `notifyEventRsvp()`, `notifySpaceEventCreated()`, `notifyRsvpConfirmation()`
- `notifyNewConnection()`, `notifyToolDeployment()`
- `notifyRitualJoined/Active/CheckIn()`, `sendSystemNotification()`

---

### 9. Notification Delivery Service

**File:** `/apps/web/src/lib/notification-delivery-service.ts`

Handles actual delivery of notifications via email and push.

**Channels:**
- Email (SendGrid)
- Push (Firebase Cloud Messaging)
- In-app (Firestore)

**Features:**
- User preference checking per channel/category
- Email template generation (branded HTML)
- FCM token management (removes invalid tokens)
- Delivery status tracking in Firestore

**What's Implemented:**
- Email delivery via SendGrid (requires env vars)
- FCM push notifications
- In-app via Firestore

**What's Stubbed:**
- `deliverNotification()` calls exist but may not have SendGrid configured
- No push notification permission flow in UI

---

### Audit Findings (2026-02-05 — 17-Agent Cross-System Audit)

**API Layer (6 route groups):**
- Notification SSE streaming functional with 6 message types
- Activity feed has hardcoded 7-day window (not configurable)
- Dashboard API makes 3 separate calls (should consolidate)
- Calendar CRUD functional, Google Calendar OAuth stubbed (returns 503 when env vars missing)
- Feature flags: inline service with rollout strategies (all, percentage, users, schools, roles)
- Presence: 90-min TTL, 5-min stale threshold, 60s heartbeat
- Tool updates SSE: partial (infrastructure present, not fully integrated)

**Component Layer:**
- Home page (1,120 lines): real data for greeting, happening now, up next, spaces, activity, suggestions
- Notification bell (405 lines): space-grouped, max 5 per group, SSE streaming
- Dual shell: AppShell (463 lines, active) vs UniversalShell (503 lines, unused)
- Presence tracking works but limited to home page only — not in space member lists or profiles

**Ship Blockers Found:**
1. **SendGrid not configured** — email notification delivery broken
2. **Push notification permission flow missing** — no browser prompt UI
3. **Polling fallback is 30s** — spec says 10s

**Missing Features:**
- Priority ranking for home sections (R1.1)
- Time-grouped activity feed (R1.2)
- "All quiet" empty state for home (R1.3)
- Real-time activity updates (requires page refresh)
- Bell wiggle animation on new notifications
- Keyboard navigation in notification popover
- Quick actions from notification items
- Notification sound/snooze
- TopBar notification badge is RED (#EF4444) — should be GOLD (#FFD700) per brand
- BottomNav has no notification badge on home icon

**Data:**
- 3 parallel data fetches on home mount (should consolidate into 1)
- Activity feed mark-as-viewed fires after arbitrary 5s timeout

---

## Gaps & Refinements

### Critical Gaps

| Gap | Impact | Current State | Fix Complexity |
|-----|--------|---------------|----------------|
| **No push notification permission flow** | Users don't get mobile push | FCM logic exists, no UI prompt | Medium |
| **Activity feed not real-time** | Stale data, users must refresh | Server-side polling | High |
| **No unread message counts in home** | Users don't know where to go | Badge data exists, not SSE | Medium |
| **SendGrid not configured** | No email notifications | Code exists, env vars missing | Low |
| **No campus rhythm awareness** | System doesn't adapt to academic calendar | Not implemented | High |

### Quality Refinements

| Issue | Location | Fix |
|-------|----------|-----|
| 3 parallel fetches on home | `/home/page.tsx` | Consolidate into single dashboard API |
| 30s polling fallback too slow | `use-notification-stream.ts` | Reduce to 10s or use Firebase listener |
| No loading indicator for filter change | `/me/notifications/page.tsx` | Add skeleton during re-fetch |
| Activity feed 7-day window arbitrary | `/api/activity-feed` | Make configurable, show "load more" |
| Typing indicator cleanup stubbed | `/api/realtime/typing` | Implement TTL cleanup job |
| Presence offline unreliable | `use-presence.ts` | Add Firebase disconnect trigger |

### Data Flow Issues

1. **Dashboard API makes too many queries:**
   - Fetches spaces, then events per space, then RSVPs per event
   - Should: Pre-aggregate event counts in space documents

2. **Notification stream SSE reconnection:**
   - No user indication when reconnecting
   - Should: Show "Reconnecting..." toast

3. **Calendar conflict detection runs on client:**
   - Should: Move to server for large event sets

---

## Feature Ideation

### Theme 1: Smart Dashboard

#### F1. Personalized Priority Ranking
The home feed currently shows activity by recency. It should rank by relevance:
- Events I RSVP'd to > other events
- Activity in spaces I lead > spaces I follow
- Messages mentioning me > general messages
- First event of the day highlighted

#### F2. Time-Aware Greeting
Go beyond "Good morning" to:
- "Finals week - you got this" (during finals)
- "Welcome back" (after break)
- "It's the last week of classes" (context)
- "3 events today" (daily summary)

#### F3. Quick Actions Widget
Surface the 2-3 most likely next actions:
- "Continue conversation in CS 370" (recent unread)
- "RSVP to tonight's event"
- "Your event starts in 30 minutes"

#### F4. Dashboard Digest Mode
Weekly email/in-app digest summarizing:
- Spaces you were active in
- Events you attended
- New connections made
- Activity you missed

---

### Theme 2: Intelligent Notifications

#### F5. Notification Batching & Digests
Group similar notifications:
- "5 new messages in CS 370" instead of 5 individual
- "3 people RSVPd to your event"
- Daily digest for low-priority items

#### F6. Smart Notification Timing
Don't notify during:
- Detected class times (from calendar)
- User-set focus hours
- Late night (11pm-7am default)

#### F7. Notification Channels Matrix
Let users set per-type, per-channel preferences:
| Type | Push | Email | In-app |
|------|------|-------|--------|
| Mentions | Yes | No | Yes |
| Event reminders | Yes | Yes | Yes |
| New members | No | No | Yes |

#### F8. Unsubscribe from Space Notifications
Without leaving the space:
- Mute for 1 hour / 1 day / forever
- Still see activity, just no notifications

---

### Theme 3: Calendar Intelligence

#### F9. Event Recommendations
"Based on your interests, you might like:"
- Events in spaces you're not in (discovery)
- Recurring events you always miss
- Events your connections are attending

#### F10. Free Time Finder
"You're both free Tuesday 2-4pm"
- Find overlap with connections
- Suggest meeting times
- Block focus time

#### F11. Event Reminders
Configurable reminders:
- 1 hour before (default)
- 10 minutes before (optional)
- Morning of (for all-day events)

#### F12. Calendar Conflict Resolution
When conflicts detected:
- Show both events side-by-side
- One-click "Skip this one"
- "Notify organizer I'll be late"

---

### Theme 4: Campus Rhythm Engine

#### F13. Academic Calendar Integration
System knows:
- First/last day of classes
- Reading days, finals week
- Breaks (fall, winter, spring, summer)
- Registration periods

#### F14. Rhythm-Aware UI Adaptations
During finals week:
- Promote study groups
- Hide social events
- Show "Campus is quiet" instead of activity

During orientation:
- Highlight new student spaces
- Surface "meet people" content
- Boost welcome events

#### F15. Semester Transitions
End of semester:
- "Archive or keep?" for spaces
- "Summary of your semester"
- "See you next semester" for seasonal spaces

Start of semester:
- "What's new in your spaces"
- "Spaces to check out this term"
- Re-engagement prompts

#### F16. Time-of-Day Awareness
Morning (before 12pm):
- Show today's schedule prominently
- "3 events today" summary

Afternoon:
- Show what's happening now
- "Next up in 2 hours"

Evening:
- Tomorrow preview
- Wind down messaging

---

### Theme 5: Activity Feed Evolution

#### F17. Feed Filters
- All activity
- Mentions only
- Events only
- My spaces only
- Custom filters

#### F18. Activity Reactions
Quick reactions to feed items:
- "Congrats!" on announcements
- "See you there!" on events
- "Nice!" on achievements

#### F19. Activity Bookmarking
Save items to "Later":
- Events to RSVP to
- Posts to read
- People to connect with

#### F20. Shared Activity Feed Component
Reusable across:
- Home page
- Space pages
- Profile pages (their activity)

---

## Strategic Considerations

### Cold Start Physics

**User #1 Dashboard:**
- No spaces joined → Shows recommendations
- No activity → Shows "Find your first space"
- No events → Empty but not broken

**First Hour Experience:**
1. Entry complete → Land on /home
2. See "Find your first space" card
3. Recommendations based on major/interests
4. Join first space → Card transforms to space card
5. First activity appears in feed

**Risk:** If recommendations are bad, user bounces.
**Mitigation:** Pre-seed with verified, active spaces per campus.

---

### Attention Economics

**What Competes for Attention:**
1. Notification badge (global, persistent)
2. Unread badges on spaces (home page)
3. "Happening Now" indicator
4. Up Next event card
5. Recent Activity feed

**Hierarchy (most to least urgent):**
1. Events happening NOW (requires action)
2. Unread messages (someone wants response)
3. Upcoming events (time-sensitive)
4. New activity (can wait)
5. Recommendations (no urgency)

**Avoiding Fatigue:**
- Default to conservative notification settings
- Batch similar notifications
- Quiet hours on by default (11pm-7am)
- Easy one-click mute per space
- "Caught up" state feels rewarding

---

### Urgency Detection

**What Creates Urgency:**

| Signal | Urgency Level | Action |
|--------|---------------|--------|
| Event starts in < 30 min | Critical | Push + prominent badge |
| Mentioned in chat | High | Push + notification |
| Event tomorrow I RSVP'd to | Medium | Evening reminder |
| New event in my space | Low | In-app only |
| Someone joined my space | Low | Batch into digest |

**Surfacing Urgency:**
- Critical: Red badge, sound, push
- High: Gold badge, push
- Medium: Badge only, in-app
- Low: Feed only, maybe digest

---

### Edge Cases

#### No Activity
- **New user:** Show recommendations
- **Returning user:** Show "All caught up" + explore prompt
- **Long absence:** "Welcome back" + summary

#### Too Much Activity
- **Busy space:** Group into "15 messages in CS 370"
- **Event flood:** Show "5 events today" card
- **Notification overload:** Auto-enable digest mode

#### Stale Data
- **Activity older than 7 days:** Don't show in feed
- **Event passed:** Mark as past, grey out
- **User offline > 5 min:** Mark presence as away

#### Timezone Hell
- **All times:** Display in user's local timezone
- **Event creation:** Always store UTC
- **Cross-timezone spaces:** Show "in your time" annotation

#### Network Issues
- **SSE disconnected:** Show indicator, fall back to polling
- **Offline:** Cache last state, show "Offline" badge
- **Slow connection:** Skeleton states, not spinners

---

## Feature Specifications

### F1. Smart Home Feed Ranking

**Priority:** P0
**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Feed items sorted by relevance score, not just timestamp
- [ ] Relevance factors: user role in space, RSVP status, mentions, recency
- [ ] Score weights configurable server-side
- [ ] Performance: <200ms additional latency
- [ ] A/B testable (flag to enable/disable)

**Technical Approach:**
- Add `relevanceScore` field to activity items
- Calculate on server during `/api/activity-feed`
- Factors: `isLeader * 3 + hasMention * 2 + isRSVP * 1.5 + recencyDecay`

---

### F2. Push Notification Permission Flow

**Priority:** P0
**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Prompt appears after user takes first meaningful action (joins space, RSVPs)
- [ ] Clear value proposition: "Get notified when events start"
- [ ] "Not now" option that doesn't nag for 7 days
- [ ] FCM token stored in user document
- [ ] Token refresh handled automatically
- [ ] Settings page shows push status and toggle

**UI Flow:**
1. User joins first space
2. Bottom sheet: "Want to know when your events start?"
3. "Enable Notifications" / "Not now"
4. If enabled: Browser permission prompt
5. If granted: Token saved, toast "You're all set!"

---

### F3. Real-time Activity Feed

**Priority:** P1
**Complexity:** High

**Acceptance Criteria:**
- [ ] New activity appears without page refresh
- [ ] Smooth animation for new items (slide in from top)
- [ ] "New activity" indicator if scrolled down
- [ ] Deduplication (same item doesn't appear twice)
- [ ] Graceful degradation if SSE fails

**Technical Approach:**
- Extend notification SSE to include activity events
- Client maintains local activity cache
- New items merge into cache with animation
- Or: Firebase Realtime Database listener per user

---

### F4. Notification Batching

**Priority:** P1
**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Messages from same space within 5 minutes batched
- [ ] Batch shows: "5 new messages in [Space]"
- [ ] Clicking batch opens space chat
- [ ] Individual notifications still stored (for notification page)
- [ ] Configurable batch window (user setting)

**Technical Approach:**
- Add `batchKey` to notification creation
- Batch service runs every minute, groups by key
- Update existing batch notification or create new
- Client shows latest batch state

---

### F5. Campus Rhythm Integration

**Priority:** P1
**Complexity:** High

**Acceptance Criteria:**
- [ ] Academic calendar stored per campus
- [ ] API to query current academic period
- [ ] Home page adapts greeting based on period
- [ ] Notification frequency adjusts during finals
- [ ] Admin can set calendar dates

**Data Model:**
```typescript
interface AcademicCalendar {
  campusId: string;
  periods: {
    type: 'classes' | 'finals' | 'reading' | 'break' | 'orientation';
    startDate: string;
    endDate: string;
    name: string;
  }[];
  updatedBy: string;
  updatedAt: string;
}
```

---

### F6. Event Reminders

**Priority:** P1
**Complexity:** Low

**Acceptance Criteria:**
- [ ] Default reminder: 1 hour before
- [ ] User can set: 10min, 30min, 1h, 2h, day before
- [ ] Reminder stored with RSVP
- [ ] Push notification at reminder time
- [ ] "Starting now" notification when event begins

**Technical Approach:**
- Add `reminderMinutes` to RSVP document
- Cloud Function runs every minute, queries upcoming reminders
- Creates notification for due reminders
- Marks reminder as sent

---

### F7. Quiet Hours

**Priority:** P2
**Complexity:** Low

**Acceptance Criteria:**
- [ ] Default: 11pm-7am user local time
- [ ] User can customize start/end times
- [ ] During quiet hours: no push, no email
- [ ] In-app still stores notifications (just no ping)
- [ ] Override for critical (event starting now)

**Technical Approach:**
- Already partially implemented in `notification-service.ts`
- Add UI in settings to configure
- Add override flag for critical notifications

---

### F8. Notification Preferences Matrix

**Priority:** P2
**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Table UI: rows = notification types, columns = channels
- [ ] Checkboxes for each cell
- [ ] "All" toggle per row and column
- [ ] Changes save automatically (debounced)
- [ ] Default preferences sensible (not all on)

**UI Location:** `/me/settings` → Notifications section

---

### F9. Dashboard API Consolidation

**Priority:** P2
**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Single `/api/home` endpoint returns all home data
- [ ] Response includes: spaces, events, activity, recommendations
- [ ] Response time < 500ms
- [ ] Caching strategy for recommendations (1 hour)

**Current State:**
- 3 parallel calls: my-spaces, dashboard, activity-feed
- Should be 1 call with all data

---

### F10. Calendar External Sync

**Priority:** P3
**Complexity:** High

**Acceptance Criteria:**
- [ ] OAuth flow for Google Calendar
- [ ] Import events from Google (read-only)
- [ ] Export HIVE events to Google (optional)
- [ ] Sync runs hourly
- [ ] User can disconnect calendar

**Files to Implement:**
- `/api/calendar/connect` - OAuth initiation
- `/api/calendar/callback` - OAuth callback
- `/api/calendar/sync` - Manual sync trigger

---

### F11. Activity Feed Filters

**Priority:** P3
**Complexity:** Low

**Acceptance Criteria:**
- [ ] Filter buttons: All | Mentions | Events | My Spaces
- [ ] Filter persists in URL (shareable)
- [ ] Empty state per filter type
- [ ] Count badge per filter option

---

### F12. Semester Transition Flow

**Priority:** P3
**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Triggers 1 week before semester end
- [ ] Shows modal: "Semester ending - review your spaces"
- [ ] List spaces with: Keep / Archive / Leave options
- [ ] "See your semester summary" link
- [ ] Only shows once per transition

---

### F13. Free Time Finder

**Priority:** P4
**Complexity:** High

**Acceptance Criteria:**
- [ ] Select 1+ connections
- [ ] Shows overlapping free times this week
- [ ] "Suggest meeting" creates calendar block
- [ ] Respects quiet hours and focus time
- [ ] Works with Google Calendar data if synced

---

### F14. Activity Reactions

**Priority:** P4
**Complexity:** Low

**Acceptance Criteria:**
- [ ] Quick reaction bar on feed items
- [ ] 3 reactions: Congrats / See you there / Nice
- [ ] Reaction count visible
- [ ] Creator gets notification
- [ ] Reactions visible in activity detail

---

### F15. Weekly Digest Email

**Priority:** P4
**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Sends Sunday evening (user timezone)
- [ ] Summarizes: events attended, spaces active in, new connections
- [ ] "Quiet week" version if low activity
- [ ] Unsubscribe link (one-click)
- [ ] User can change to daily/monthly/off

---

## Integration Points

### Awareness <-> Identity

| Awareness Needs | Identity Provides |
|-----------------|-------------------|
| User's interests for recommendations | Profile interests array |
| User's major for relevance scoring | Profile major field |
| Display name for notifications | Profile displayName |
| Avatar for activity feed | Profile avatarUrl |

### Awareness <-> Spaces

| Awareness Needs | Spaces Provides |
|-----------------|-----------------|
| Space memberships | spaceMembers collection |
| Space activity | space activity subcollection |
| Online users | presence data per space |
| Unread counts | per-user read cursors |
| Events | events collection + space events |

### Awareness <-> Tools

| Awareness Needs | Tools Provides |
|-----------------|----------------|
| Tool deployments | toolDeployments collection |
| Tool updates | tool update events |
| Tool usage | tool usage analytics |

### Awareness <-> Discovery

| Awareness Needs | Discovery Provides |
|-----------------|---------------------|
| Recommendations | browse API with scoring |
| Trending spaces | activity aggregation |
| Similar users | connection suggestions |

---

## Implementation Priority

### Phase 1: Ship Readiness (Week 1-2)
1. Push notification permission flow (P0)
2. Smart home feed ranking (P0)
3. Fix 3-parallel-fetch issue (P2 but quick)
4. Configure SendGrid for email delivery

### Phase 2: Retention Boosters (Week 3-4)
5. Real-time activity feed (P1)
6. Notification batching (P1)
7. Event reminders (P1)
8. Quiet hours UI (P2)

### Phase 3: Differentiation (Month 2)
9. Campus rhythm integration (P1)
10. Dashboard API consolidation (P2)
11. Notification preferences matrix (P2)

### Phase 4: Polish (Month 3+)
12. Calendar external sync (P3)
13. Activity feed filters (P3)
14. Semester transitions (P3)
15. Free time finder, reactions, digest (P4)

---

## Key Files Reference

| Component | File |
|-----------|------|
| Home page | `/apps/web/src/app/home/page.tsx` |
| Notifications page | `/apps/web/src/app/me/notifications/page.tsx` |
| Calendar page | `/apps/web/src/app/me/calendar/page.tsx` |
| Notification bell | `/apps/web/src/components/notifications/hive-notification-bell.tsx` |
| Notification stream hook | `/apps/web/src/hooks/use-notification-stream.ts` |
| Realtime notifications hook | `/apps/web/src/hooks/use-realtime-notifications.ts` |
| Presence hook | `/apps/web/src/hooks/use-presence.ts` |
| Calendar hook | `/apps/web/src/hooks/use-calendar.ts` |
| Notification service | `/apps/web/src/lib/notification-service.ts` |
| Notification delivery | `/apps/web/src/lib/notification-delivery-service.ts` |
| Activity feed API | `/apps/web/src/app/api/activity-feed/route.ts` |
| Dashboard API | `/apps/web/src/app/api/profile/dashboard/route.ts` |
| Calendar API | `/apps/web/src/app/api/calendar/route.ts` |
| Realtime notifications API | `/apps/web/src/app/api/realtime/notifications/route.ts` |
| Presence API | `/apps/web/src/app/api/realtime/presence/route.ts` |
| Notifications empty state | `/apps/web/src/components/ui/NotificationsEmptyState.tsx` |
| Calendar empty state | `/apps/web/src/components/ui/CalendarEmptyState.tsx` |

---

## Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Time to first notification seen | < 5 seconds | Unknown |
| Notification click-through rate | > 30% | Unknown |
| Home page load time | < 1.5s | ~2s (3 fetches) |
| SSE connection success rate | > 95% | Unknown |
| Push notification opt-in rate | > 40% | N/A (not implemented) |
| Daily active users checking home | > 60% | Unknown |

---

*Document generated: February 2026*
*Last updated by: Claude Opus 4.5*
