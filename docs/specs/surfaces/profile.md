# Profile Surface

The surface that answers: **"What have I done on HIVE, and does it matter?"**

For creators, profile is the receipt — proof that building apps works, that people used them, that effort converted to impact. For everyone else, profile is campus identity — what spaces you're in, who you know, what you care about.

Routes: `/u/[handle]` (canonical), `/me` (redirects to own `/u/[handle]`)

---

## Existing Code Assessment

### What Ships (Ready or Near-Ready)

| Component | Location | Status |
|-----------|----------|--------|
| Profile page (4-zone layout) | `apps/web/src/app/(shell)/u/[handle]/ProfilePageContent.tsx` | **Ships.** Full zone layout: Identity Hero, Builder Showcase, Campus Identity, Momentum. Skeleton loading, error/not-found states. |
| Handle resolution hook | `apps/web/src/app/(shell)/u/[handle]/hooks/use-profile-by-handle.ts` | **Ships.** Resolves handle to profile ID, fetches profile data, tools, activity, connections, organizing events. Presence subscription. |
| Identity Hero component | `packages/ui/src/design-system/components/profile/ProfileIdentityHero.tsx` | **Ships.** Avatar, name, handle, bio, class year, major, campus. Edit/connect/message actions. Badge display. |
| Featured Tool Card | `packages/ui/src/design-system/components/profile/ProfileFeaturedToolCard.tsx` | **Ships.** Hero card for top app with runs count and deployed spaces. |
| Tools Card (grid) | `packages/ui/src/design-system/components/profile/ProfileToolsCard.tsx` | **Ships.** Secondary apps in compact grid. |
| Belonging Space Card | `packages/ui/src/design-system/components/profile/ProfileBelongingSpaceCard.tsx` | **Ships.** Space card with role indicator and shared-space highlight. |
| Activity Heatmap | `packages/ui/src/design-system/components/profile/ProfileActivityHeatmap.tsx` | **Ships.** GitHub-style contribution heatmap with streak count. |
| Connections Card | `packages/ui/src/design-system/components/profile/ProfileConnectionsCard.tsx` | **Ships.** Total connections with mutual connection avatars. |
| Context Banner | `packages/ui/src/design-system/components/profile/ContextBanner.tsx` | **Ships.** Social context: shared spaces, mutual friends, both-builders indicator. |
| Stats Row | `packages/ui/src/design-system/components/profile/ProfileStatsRow.tsx` | **Ships.** Inline stats: spaces, friends, apps, activity count. |
| Tool Modal | `packages/ui/src/design-system/components/profile/ProfileToolModal.tsx` | **Ships.** Detail modal for app inspection. Visibility controls for own profile. |
| Profile API (25+ routes) | `apps/web/src/app/api/profile/` | **Ships.** Handle resolution, profile fetch, tools, activity, events, connections, follow, privacy. |
| Tools API (usage tracking) | `apps/web/src/app/api/tools/` | **Ships.** `usageCount` tracked per tool deployment, incremented on state interactions. |

### What Changes

| Component | Change Required |
|-----------|----------------|
| Builder Showcase section | Add per-app impact line: "47 votes", "12 RSVPs" — not just total runs |
| Stats Row | Replace "Streak" and "Rep" with "Reach" (total unique users who engaged with your apps) |
| Own-profile empty states | Tighter copy, link to `/build` not `/lab` |
| `/me` route | Create redirect to `/u/[currentUser.handle]` |
| Edit profile flow | Currently pushes to `/me/edit` — verify this route exists and works |
| Tool click handler | Currently routes own-profile clicks to `/lab/{toolId}` — should route to `/build/{toolId}` |

---

## 1. Profile Header (Zone 1: Identity Hero)

### What ships

The existing `ProfileIdentityHero` component handles this. Layout:

```
┌─────────────────────────────────────────────┐
│  [Avatar]  Name                              │
│            @handle                            │
│            Bio text (up to 300 chars)         │
│            CS '27 · University at Buffalo     │
│                                               │
│  [Edit Profile]  or  [Connect] [Message]      │
│                                               │
│  "47 people participated in your creations"   │
│                                               │
│  Spaces: 5 · Friends: 12 · Apps: 3 · 89 acts │
└─────────────────────────────────────────────┘
```

**Viewer context determines actions:**

| Viewer | Actions shown |
|--------|-------------|
| Self | Edit Profile button |
| Same campus, connected | Message, Share |
| Same campus, not connected | Connect, Share |
| Same campus, pending outgoing | Pending (disabled), Share |
| Same campus, pending incoming | Accept / Reject, Share |
| Different campus | Never visible (campus isolation enforced server-side) |

**Context Banner** (other users only): Shows shared spaces, mutual friends, both-builders badge. Appears below the hero.

**Participation count**: `"{N} people participated in {your/Name's} creations"` — visible when totalToolRuns > 0. This is the creator signal. It tells every visitor: this person builds things that people actually use.

### Data source

All data comes from `useProfileByHandle` which calls:
- `GET /api/profile/handle/{handle}` — resolve handle to profile ID
- `GET /api/profile/{profileId}` — full profile data including spaces, connections, stats

### What changes

**Stats Row** currently shows: Spaces, Friends, Streak, Rep. Change to:

| Stat | Source | Why |
|------|--------|-----|
| Spaces | `profileSpaces.length` | Campus identity — where you belong |
| Friends | `totalConnections` | Social proof |
| Apps | `dedupedTools.length` | Creator identity |
| Reach | New: sum of unique users across all apps | The number that makes creators come back |

**Reach** is the new stat. It replaces "activity count" which is opaque. Reach = total unique users who interacted with any of your apps. For consumers (0 apps), this stat is hidden and the row shows 3 items.

### Data model for Reach

```
users/{userId}
  creatorStats: {
    totalReach: number         // unique users who engaged with any of their apps
    totalInteractions: number  // total interactions (votes, RSVPs, views, submissions)
    lastUpdated: Timestamp
  }
```

**Write path:** When a user interacts with any app (vote, RSVP, form submit), the tool state handler (`/api/tools/[toolId]/state`) already increments `usageCount` on the deployment doc. Add a cloud function or post-write hook that increments the tool creator's `creatorStats.totalInteractions` and maintains a set of unique user IDs per tool to compute reach.

**Read path:** `GET /api/profile/{profileId}` returns `creatorStats` as part of the profile response. The hook maps it into the stats row.

**Launch shortcut:** For launch, Reach can be approximated as `totalToolRuns` (already computed in `ProfilePageContent.tsx` as `sortedTools.reduce((sum, t) => sum + (t.runs || 0), 0)`). The unique-user deduplication is a post-launch refinement.

---

## 2. Builder Showcase (Zone 2)

### What ships

The existing zone renders when `hasTools || isOwnProfile`:

- **Featured App Card**: Hero-sized card for the top app (most runs). Shows name, description, emoji, runs count, deployed spaces count.
- **Secondary Apps Grid**: Remaining apps in a compact grid.
- **Empty State** (own profile only): "Build your first app to unlock your portfolio" with link to `/build`.

### What changes: Per-App Impact Lines

Currently, each app shows `runs` as a plain number. Change to a contextual impact line:

```
Featured App Card:
┌─────────────────────────────────────────────┐
│  [emoji]  "Friday Night Poll"                │
│           "Quick poll for the group"          │
│                                               │
│           47 votes · in 2 spaces              │
└─────────────────────────────────────────────┘

Secondary App:
┌──────────────────────────┐
│  [emoji]  "RSVP Tracker"  │
│           12 RSVPs         │
└──────────────────────────┘
```

The impact line uses the app's primary interaction type:
- Polls: "{N} votes"
- RSVPs/Events: "{N} RSVPs"
- Forms: "{N} submissions"
- Generic: "{N} uses"

**Data source:** The tool deployment doc already stores `usageCount`. To get the interaction type label, read `tool.type` or `tool.config.primaryAction` from the tool document. If unavailable, fall back to "uses".

**Implementation:** Modify `ProfileFeaturedToolCard` and `ProfileToolsCard` to accept an optional `impactLabel` string prop. The hook computes it from tool metadata.

### Empty state (own profile)

Current copy is good. One change: route the CTA to `/build` (correct) — verify the existing `href="/build"` link still works after recent route changes.

### What we're NOT building

- Sparkline charts per app (over-engineered for launch, data volume too low at 50 users)
- "Pin to top" app reordering (sort by runs is sufficient)
- App categories or tags on profile

---

## 3. Campus Identity (Zone 3: Spaces + Interests)

### What ships

**Spaces grid**: Cards showing each space the user belongs to, with role indicators (owner/leader/member) and a "shared" highlight when the viewer is also in that space.

**Interests pills**: Tag chips from the user's interest selections. Shows "N shared" pill when viewing another profile with overlapping interests.

### What changes

Nothing structural. Two refinements:

1. **Space click handler**: Currently `router.push(/s/${spaceId})`. Correct — links to the space surface.
2. **Empty state** (own profile, no spaces): Currently links to `/discover`. Copy says "Join spaces to show where you belong." This is correct and ships.

### Viewer differences

| Viewer | Spaces shown | Interests shown |
|--------|-------------|----------------|
| Self | All spaces | All interests, editable inline |
| Connected | All spaces (unless privacy hides) | All interests |
| Campus, not connected | Spaces respecting `showSpaces` privacy setting | Interests respecting `showInterests` privacy setting |

---

## 4. Momentum (Zone 4: Activity + Connections + Events)

### What ships

**Activity Heatmap**: GitHub-style contribution grid. 365 days of activity data. Shows total contributions and current streak.

**Connections Card**: Total connection count with avatars of mutual connections.

**Organizing Events**: Upcoming events this user is organizing. Shows title, date, location, attendee count.

**Next Event** (own profile only): The user's next upcoming event (from personalized events API).

### What changes

**Activity heatmap data source**: Currently fetches from `GET /api/profile/{profileId}/activity?days=365`. Verify this endpoint returns data in the `ActivityContribution[]` format the heatmap expects. At launch with 0 existing users, this will be empty for everyone — the empty state ("No activity yet" with link to Build) handles this.

**Connections**: The connections card shows fine as-is. At launch with 50 users, most people will have 0-5 connections. The card handles this gracefully (just shows the count).

---

## 5. The Creator Feedback Loop

This is the reason the profile exists. A creator checks their profile after building 2 apps and the profile answers: **"Yes, it was worth it. 47 people used your poll. 12 people RSVP'd through your tracker."**

### Where feedback lives on the profile

1. **Participation count** (Zone 1): `"47 people participated in your creations"` — the headline number, visible immediately below the hero.

2. **Per-app impact lines** (Zone 2): Each app card shows its own engagement number with a contextual label (votes, RSVPs, submissions).

3. **Stats Row** (Zone 1): Reach stat — the total unique users across all apps.

4. **Activity Heatmap** (Zone 4): Shows building activity over time. Creates a visual record of effort.

### How usage data flows to profiles

```
User interacts with app (votes, RSVPs, submits)
  → POST /api/tools/[toolId]/state
    → Increments deployment.usageCount
    → (Post-launch) Increments creator's creatorStats

Creator opens their profile
  → GET /api/tools?userId={creatorId}
    → Returns all tools with usageCount
  → ProfilePageContent computes:
    → totalToolRuns = sum of all tool runs
    → sortedTools = tools ordered by runs (most popular first)
    → featuredTool = sortedTools[0]
```

### What we're NOT building (feedback loop scope)

- Weekly digest emails ("Your apps got 23 uses this week") — post-launch
- Push notifications for usage milestones ("Your poll just hit 50 votes!") — post-launch
- Comparative stats ("Your app is in the top 10%") — requires user base
- Revenue/monetization signals — not in scope

### The moment that matters

An org leader creates a poll for their 60-person club on Tuesday. By Thursday, 47 people have voted. They open their profile and see:

```
Identity Hero: "Maya Johnson @maya · CS '27"
"47 people participated in your creations"

Builder Showcase:
  Featured: "Friday Night Poll" — 47 votes · in 1 space
  Secondary: "Meeting RSVP" — 12 RSVPs

Stats: Spaces 3 · Friends 8 · Apps 2 · Reach 52
```

That's the retention moment. Maya sees proof that building on HIVE reaches her people better than a GroupMe message or Google Form. She builds a third app.

---

## 6. Own Profile vs. Viewing Someone Else's

### `/me` route

Create a simple redirect page at `apps/web/src/app/(shell)/me/page.tsx`:

```typescript
// Redirect /me to /u/[currentUser.handle]
redirect(`/u/${currentUser.handle}`);
```

If the user is not authenticated, redirect to `/enter`.

### Differences between own and other profiles

| Element | Own Profile | Other's Profile |
|---------|-----------|----------------|
| Header actions | Edit Profile | Connect / Message / Share / Report |
| Context Banner | Hidden | Shows shared spaces, mutual friends |
| Builder Showcase empty state | Shown (CTA to Build) | Hidden |
| Spaces empty state | Shown (CTA to Discover) | Hidden |
| Activity empty state | Shown (CTA to Build) | Hidden |
| Tool click | Routes to `/build/{toolId}` (edit) | Routes to `/t/{toolId}` (standalone view) |
| Next Event card | Shown | Hidden |
| Privacy controls | Full edit access via Settings | N/A |
| Profile completeness | Nudge shown if < 100% | Hidden |
| Report button | Hidden | Available in hero overflow menu |

### Privacy enforcement

Privacy is enforced server-side in `GET /api/profile/{profileId}`. The API checks the viewer's relationship to the profile and strips fields according to the profile owner's privacy settings. The client never receives data the viewer shouldn't see.

Default privacy settings (from 2026 Standards):
- Profile visible to: campus only
- Spaces visible to: space members only
- Online status: off by default
- Interests on profile: on by default

---

## 7. Edit Profile

### Current flow

`handleEditProfile` pushes to `/me/edit`. The settings page at `apps/web/src/app/me/settings/page.tsx` has 4 sections: Profile, Notifications, Privacy, Account.

### What's editable

| Field | Where | Constraints |
|-------|-------|------------|
| First name | Settings > Profile | Required, 1-50 chars |
| Last name | Settings > Profile | Required, 1-50 chars |
| Handle | Settings > Profile | One-time change, availability check, 72hr redirect from old |
| Avatar | Settings > Profile | Max 5MB, auto-crop to square, inline preview |
| Bio | Settings > Profile | 300 chars, plain text, no links |
| Major | Settings > Profile | Optional, free text |
| Graduation year | Settings > Profile | Optional, dropdown |
| Pronouns | Settings > Profile | Optional, free text |
| Interests | Inline on profile (tap to add/remove) | Max 10 |

### Save behavior

Optimistic save with rollback on failure. No separate "Save" button per section — changes auto-save (per 2026 Standards: "Never a settings page that requires a separate save button for each section").

---

## 8. Component Hierarchy

```
ProfilePageContent (page component)
├── ProfileLoadingState (skeleton)
├── ProfileNotFoundState (404)
├── ProfileErrorState (error + retry)
└── [Loaded state]
    ├── Zone 1: Identity Hero
    │   ├── ProfileIdentityHero
    │   │   ├── Avatar (with online indicator)
    │   │   ├── Name / Handle / Bio / Academic info
    │   │   ├── Action buttons (Edit | Connect/Message/Share)
    │   │   └── Badge row
    │   ├── ContextBanner (other profiles only)
    │   ├── Participation count line
    │   └── ProfileStatsRow
    │
    ├── Zone 2: Builder Showcase
    │   ├── ProfileFeaturedToolCard (top app)
    │   ├── ProfileToolsCard (remaining apps grid)
    │   └── Empty state → Link to /build (own profile only)
    │
    ├── Zone 3: Campus Identity
    │   ├── ProfileBelongingSpaceCard[] (space grid)
    │   ├── Empty state → Link to /discover (own profile only)
    │   └── Interest pills (with "N shared" indicator)
    │
    ├── Zone 4: Momentum
    │   ├── ProfileActivityHeatmap
    │   ├── ProfileConnectionsCard
    │   ├── Organizing events list
    │   └── Next event card (own profile only)
    │
    └── Modals
        ├── ProfileToolModal (app detail/settings)
        └── ReportContentModal (other profiles)
```

### State management

All state lives in `useProfileByHandle()` hook. No additional contexts needed. The hook:
1. Resolves handle to profile ID
2. Fetches profile data (single API call)
3. Fetches tools, activity, events, connections (parallel)
4. Subscribes to presence (Firestore real-time)
5. Computes derived values (shared interests, hero data, etc.)
6. Exposes handlers for all interactions

---

## 9. What We're NOT Building

| Feature | Why not |
|---------|---------|
| Badges / achievements system | Gamification that punishes absence (anti-pattern per 2026 Standards). The participation count IS the achievement. |
| Schedule display on profile | Privacy risk, low value at launch. Schedule data feeds Home dashboard, not profile. |
| Interest tags as filterable categories | Over-engineering for 50 users. Pills are sufficient. |
| Identity atoms / personality traits | Aspirational, requires behavioral data we won't have at launch. |
| Profile themes / customization | Vanity feature, zero impact on creator retention. |
| Public profiles (outside campus) | Campus isolation is a hard rule. Profiles are campus-only by default. |
| Profile analytics dashboard | Creator stats in the profile itself are sufficient. A separate dashboard is post-launch. |
| "Who viewed my profile" | Privacy anti-pattern. |

---

## 10. Performance

| What | Target | Strategy |
|------|--------|----------|
| Shell render (skeleton) | < 200ms | SSR the shell, client-side data fetch |
| Handle resolution | < 400ms | Server-side Firestore query on `users` collection where `handle == X` |
| Profile data | < 500ms | Single API call, server-side aggregation |
| Tools data | < 500ms | Parallel fetch, cached with React Query (`staleTime: 5min`) |
| Activity heatmap | < 800ms | Separate query, loads after core data |
| Presence | Real-time | Firestore `onSnapshot` subscription |

**Skeleton strategy**: `ProfileLoadingState` renders layout-matched skeletons for all 4 zones. Skeletons match actual content dimensions to prevent CLS.

---

## 11. API Contracts

### Existing (ships as-is)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/handle/{handle}` | GET | Resolve handle to profile ID + privacy check |
| `/api/profile/{profileId}` | GET | Full profile data (spaces, connections, stats) |
| `/api/profile/{profileId}/activity` | GET | Activity contributions for heatmap |
| `/api/profile/{profileId}/events` | GET | Organizing events |
| `/api/profile/{profileId}/follow` | GET/POST/DELETE | Connection state and follow actions |
| `/api/tools?userId={userId}` | GET | User's created tools with usage counts |
| `/api/profile/tools` | GET/PATCH/DELETE | Deployed tools management (own profile) |
| `/api/events/personalized` | GET | Next event for own profile |

### New (launch)

None required. All data flows exist. The Reach stat can be computed client-side from existing tool data at launch.

### Post-launch

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile/{profileId}/creator-stats` | GET | Dedicated creator stats with reach, per-app breakdown |
| `/api/profile/personalization-data` | GET | What HIVE knows about this user (transparency) |
| `/api/profile/personalization-data` | DELETE | Reset personalization signals |

---

## 12. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Profile with 0 apps, 0 spaces, 0 connections | All empty states render with CTAs (own profile). Other viewers see a minimal profile with just header. |
| Handle not found | `ProfileNotFoundState` renders with link to Discover. |
| Private profile (viewer not connected) | `ProfileNotFoundState` renders (same as not found — no information leak). |
| User changes handle | Old handle returns 404 after 72hr redirect window. New handle resolves immediately. |
| Extremely popular app (1000+ runs) | Numbers display with `toLocaleString()` (already implemented). No special treatment. |
| Profile loads but tools API fails | Profile renders without Zone 2. Non-blocking fetch — tools failure doesn't break the page. |
| Viewer and profile share no context | Context Banner hidden. No shared interests pill. Profile still renders normally. |

---

## 13. Acceptance Criteria

### Must ship (launch blockers)

- [ ] `/u/[handle]` renders full profile with 4 zones within 1.5s on 4G
- [ ] `/me` redirects authenticated users to `/u/[handle]`
- [ ] Participation count ("N people participated in your creations") visible for users with apps
- [ ] Per-app impact lines show contextual engagement numbers (votes, RSVPs, uses)
- [ ] Stats Row shows Spaces, Friends, Apps, and Reach (for creators)
- [ ] Own profile shows all empty states with CTAs to Build/Discover
- [ ] Other profiles show Connect/Message actions with optimistic state updates
- [ ] Tool click routes to `/build/{toolId}` (own) or `/t/{toolId}` (other)
- [ ] Skeleton loading matches actual layout (no CLS)
- [ ] Privacy enforced server-side: campus isolation, per-field visibility
- [ ] Edit Profile navigates to settings with auto-save
- [ ] Report profile works end-to-end

### Should ship (quality, not blocking)

- [ ] Context Banner shows shared spaces and mutual friends
- [ ] Shared interests pill appears when viewing overlapping profiles
- [ ] Activity heatmap renders 365-day contribution grid
- [ ] Organizing events card shows upcoming events for event organizers
- [ ] 44px+ touch targets on all interactive elements
- [ ] Keyboard navigable: Tab through all zones and interactive elements
- [ ] Reduced motion: no decorative animations, functional transitions only

---

## Evals

### creator-checks-impact: Profile proves that building apps works

**Value prop:** An org leader who built 2 apps checks their profile and immediately sees proof of impact. The numbers are visible, contextual, and make them want to build a third app.

**Scenario:** Maya, a junior running a 60-person club, created a poll (47 votes) and an RSVP tracker (12 RSVPs) over the last week. She opens her profile on her phone.

**Perspectives:** overwhelmed-org-leader, returning-skeptic

**What must be true:**
- Maya sees "47 people participated in your creations" within 2 seconds of opening
- Each app shows its own impact number ("47 votes", "12 RSVPs")
- The stats row shows Reach: 52 (not a vanity metric — real people)
- Maya's next action is obvious: Build another app (CTA visible if she scrolls)

**Files:**
- `apps/web/src/app/(shell)/u/[handle]/ProfilePageContent.tsx`
- `packages/ui/src/design-system/components/profile/ProfileFeaturedToolCard.tsx`
- `packages/ui/src/design-system/components/profile/ProfileStatsRow.tsx`

### sparse-profile-dignity: Profile at day 1 doesn't feel empty or broken

**Value prop:** A brand new user with 0 apps, 2 spaces, and 0 connections opens their profile. It feels like a starting point, not a wasteland.

**Scenario:** Alex just finished onboarding 5 minutes ago. They joined 2 spaces during entry flow. They tap their profile from the sidebar.

**Perspectives:** lonely-freshman, transfer-student

**What must be true:**
- Profile renders immediately (no empty loading states that flash)
- Zone 1 shows name, handle, academic info — feels like a real profile
- Zone 2 empty state says "Build your first app to unlock your portfolio" (inviting, not demanding)
- Zone 3 shows the 2 spaces they joined (not empty)
- Zone 4 hides gracefully (no "No activity yet" for brand new users who haven't had time)
- Overall feeling: "This is mine and it will fill up" — not "This is empty and I'm behind"

**Files:**
- `apps/web/src/app/(shell)/u/[handle]/ProfilePageContent.tsx`
- `apps/web/src/app/(shell)/u/[handle]/hooks/use-profile-by-handle.ts`

### profile-drives-connection: Viewing a profile makes you want to connect

**Value prop:** A student views another student's profile and the shared context (spaces, interests, builder status) makes them want to connect — not just scroll past.

**Scenario:** Jordan, a sophomore, taps on a profile from a space member list. The other person is in 2 of the same spaces, shares 3 interests, and built an app Jordan used.

**Perspectives:** lonely-freshman, thursday-night-sophomore

**What must be true:**
- Context Banner immediately shows "2 shared spaces, 3 shared interests"
- The Connect button is prominent and one-tap
- If the other person is a builder, the participation count adds social proof
- The profile feels like a person, not a data card

**Files:**
- `packages/ui/src/design-system/components/profile/ContextBanner.tsx`
- `packages/ui/src/design-system/components/profile/ProfileIdentityHero.tsx`
- `packages/ui/src/design-system/components/profile/ConnectButton.tsx`
