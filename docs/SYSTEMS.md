# HIVE Systems

System-by-system breakdown with outcomes, standards, and quality game plans.

---

## Tier 1: Launch Blockers

These must be flawless. If they fail, launch fails.

### Entry

**Outcome:** "I'm in. That was easy."
**Standard:** Email → inside app < 90 seconds
**Status:** Built

**Key Files:**
- `apps/web/src/app/enter/page.tsx`
- `apps/web/src/components/entry/Entry.tsx`
- `apps/web/src/app/api/auth/`

**Quality Checklist:**
- [ ] Every transition has motion (no hard cuts)
- [ ] Email input: instant validation feedback
- [ ] Code entry: auto-advance on complete, clear error on wrong code
- [ ] Handle selection: real-time availability check
- [ ] Final moment: celebration that feels earned (GoldFlash)
- [ ] Error states: human copy, clear recovery path
- [ ] Back navigation: works without losing progress

---

### Spaces

**Outcome:** "I found my people. They're active."
**Standard:** Join → see real activity < 10 seconds
**Status:** Built

**Key Files:**
- `apps/web/src/app/s/[handle]/page.tsx`
- `apps/web/src/app/s/[handle]/components/`
- `apps/web/src/hooks/use-space-residence-state.ts`
- `apps/web/src/app/api/spaces/`

**Quality Checklist:**
- [ ] Threshold (non-member): Compelling preview, obvious join CTA
- [ ] Join action: Instant feedback, no page reload
- [ ] Chat: Messages appear instantly (optimistic UI)
- [ ] Chat: Typing indicators, online presence feel alive
- [ ] Sidebar: Boards clearly navigable, active board obvious
- [ ] Empty board: "Start the conversation" not "No messages"
- [ ] Member list: Shows who's online, photos load fast
- [ ] Events in feed: Clear date/time, easy RSVP
- [ ] Mobile: Sidebar accessible, chat input not blocked by keyboard
- [ ] Loading: Skeleton matches layout, no content shift

**Cold Start Reality:**
Empty space = dead space. Pre-seed with real campus orgs. Recruit 5-10 space leaders to be active day 1.

---

### Discovery

**Outcome:** "I can find exactly who/what I'm looking for."
**Standard:** Find relevant space < 30 seconds
**Status:** Built

**Key Files:**
- `apps/web/src/app/explore/page.tsx`
- `apps/web/src/app/api/search/route.ts`
- `apps/web/src/app/api/spaces/browse/route.ts`

**Quality Checklist:**
- [ ] Search: Results appear as you type (<200ms feel)
- [ ] Search: Clear what's being searched (spaces? people? all?)
- [ ] Tabs: Obvious which is selected, smooth transitions
- [ ] Cards: Enough info to decide (name, description, member count, activity)
- [ ] Cards: Hover states, click targets obvious
- [ ] Empty search: Helpful suggestions, not "No results"
- [ ] Loading: Skeleton cards match final layout

---

## Tier 1.5: Dashboard

### Home

**Outcome:** "I see what's happening and where to go."
**Standard:** Instant orientation in 5 seconds
**Status:** Built

**Key Files:**
- `apps/web/src/app/home/page.tsx`

**Quality Checklist:**
- [ ] Loads fast — skeleton, not spinner
- [ ] Hierarchy clear: Most important is most prominent
- [ ] Space cards: Activity indicator (online count, recent messages)
- [ ] Events: Date/time obvious, RSVP status clear
- [ ] Empty state: New user sees clear onboarding path

---

## Tier 2: Retention (Week 2)

### Profiles

**Outcome:** "I know who this person is."
**Standard:** See identity + activity + context in 3 seconds
**Status:** Built

**Key Files:**
- `apps/web/src/app/u/[handle]/page.tsx`
- `packages/ui/src/design-system/components/profile/`

**Quality Checklist:**
- [ ] Hero loads fast, no avatar pop-in
- [ ] Hierarchy: name > handle > credentials > bio
- [ ] Activity section: Shows real work, not empty cards
- [ ] Spaces pills: Clickable, lead somewhere useful
- [ ] Message/Connect buttons: Obviously clickable
- [ ] Own profile: Edit prompts feel helpful not naggy

---

### DMs

**Outcome:** "I can actually reach out."
**Standard:** Send message in 2 taps from any profile
**Status:** Built, flagged OFF

**Key Files:**
- `apps/web/src/contexts/dm-context.tsx`
- `apps/web/src/components/dm/`
- `apps/web/src/app/api/dm/`

**Quality Checklist:**
- [ ] Panel slides smoothly
- [ ] Conversation list: Unread indicators clear
- [ ] Message input: Focus on open, send on Enter
- [ ] Messages: Appear instantly (optimistic)
- [ ] Empty state: First message prompt

---

### Notifications

**Outcome:** "I know when things happen."
**Standard:** Notified within 1 minute of activity
**Status:** Built

**Key Files:**
- `apps/web/src/app/me/notifications/page.tsx`
- `apps/web/src/lib/notification-service.ts`
- `apps/web/src/lib/notification-delivery-service.ts`

**Quality Checklist:**
- [ ] Clear what's unread vs read
- [ ] Items are actionable (click goes somewhere)
- [ ] Mark as read: Instant feedback
- [ ] Empty state: "You're all caught up"
- [ ] Email: Arrives promptly, looks professional

---

## Tier 3: Differentiators (Month 1)

### HiveLab

**Outcome:** "I built something useful in 60 seconds."
**Standard:** Describe → Generate → Deploy → See results
**Status:** Built

**Key Files:**
- `apps/web/src/app/lab/`
- `apps/web/src/app/api/tools/`

**Quality Checklist:**
- [ ] Templates: Obvious what each does
- [ ] Canvas: Drag-drop doesn't jank
- [ ] Deploy: Clear which space, confirmation of success
- [ ] AI failures: Have fallback/retry

---

### Settings

**Outcome:** "I can control my experience."
**Standard:** Find any setting < 10 seconds
**Status:** Built

**Key Files:**
- `apps/web/src/app/me/settings/`

**Quality Checklist:**
- [ ] Organized into logical sections
- [ ] Changes save with clear feedback
- [ ] Destructive actions have confirmation

---

### Calendar

**Outcome:** "I see all my events."
**Standard:** View upcoming events, RSVP status clear
**Status:** Built

**Key Files:**
- `apps/web/src/app/me/calendar/page.tsx`

**Quality Checklist:**
- [ ] Events grouped by day
- [ ] RSVP status obvious
- [ ] Click event → goes to space

---

## Tier 4: Deferred

### Rituals
Campus-wide challenges. Needs critical mass. Code exists, don't invest until 1000+ users.

### Connections/Friends
Friend graph adds overhead. DMs sufficient. Code exists, flag OFF.

### Google Calendar Sync
OAuth nice-to-have. Not blocking.

---

## Shell (Infrastructure)

**Outcome:** User always knows where they are.
**Status:** Built

**Key Files:**
- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/layout/Sidebar.tsx`

**Quality Checklist:**
- [ ] Current page indicator is obvious (gold accent)
- [ ] Navigation items clearly labeled
- [ ] Mobile nav accessible
- [ ] Page transitions smooth
- [ ] Sign out works and redirects
