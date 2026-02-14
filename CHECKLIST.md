# HIVE FRONTEND CHECKLIST — 0% → 100%

**Created:** 2026-02-14
**Goal:** Every item checked = ready for UB launch
**Rule:** If it's not on this list, it doesn't ship. If it's checked, it's been designed, built, and tested by a human eye.

---

## 0. Landing Page (`/`)

The first thing anyone sees. Must convert a curious student to a user.

- [ ] **Hero section** — clear value prop, not generic startup copy. "Your club is already here" is good but needs visual punch
- [ ] **Product section** — show what HIVE actually looks like (screenshots/demo, not feature bullets)
- [ ] **CTA section** — "Find your space" or "Claim your org" — one clear action
- [ ] **Header** — minimal nav (logo, sign in, get started)
- [ ] **Footer** — legal links, social, about
- [ ] **Mobile layout** — test on actual phone screens
- [ ] **Performance** — loads fast, no layout shift, images optimized
- [ ] **SEO/OG tags** — sharing a link should look good on iMessage/Instagram DMs

---

## 1. Auth & Entry (`/enter`)

The gate. 2-screen flow: email → code + name.

- [ ] **Email screen** — .edu hint/validation? campus detection?
- [ ] **Code verification screen** — clear, fast, no confusion
- [ ] **New user name capture** — inline after code, feels natural
- [ ] **Error states** — wrong code, expired code, rate limited, network error
- [ ] **Loading states** — not just a spinner, feels alive
- [ ] **Redirect after auth** — goes to right place (onboarding for new, spaces for returning)
- [ ] **Mobile keyboard handling** — input doesn't get hidden behind keyboard
- [ ] **Magic link email** — does the email look good? branded? clear CTA?

---

## 2. Onboarding (post-auth, new users only)

First 60 seconds after signup. Decides if they stay.

- [ ] **Interest picker** — does it feel fun or like a form? 40+ signals need to feel light
- [ ] **Space matching** — "Here are spaces for you" based on interests
- [ ] **First space join** — nudge to join at least one space immediately
- [ ] **Skip path** — can you skip and still land somewhere useful?
- [ ] **Progress indication** — how many steps, where am I?
- [ ] **Mobile flow** — smooth on phone, no horizontal scroll, no tiny tap targets

---

## 3. Global Navigation & App Shell

The persistent chrome. Every logged-in page lives inside this.

- [ ] **4-tab nav decided:** Home | Spaces | Create | You
- [ ] **Desktop sidebar** — update from 3 to 4 items, rename labels
- [ ] **Mobile bottom bar** — update from 3 to 4 items, test thumb reach
- [ ] **Active state indicators** — clear which tab you're on
- [ ] **Notification bell** — top bar, shows unread count badge
- [ ] **Notification panel** — opens on bell click, lists recent notifications, mark read, tap to navigate
- [ ] **Global search** — Cmd+K (desktop) / search icon (mobile) → overlay that searches spaces, people, events, tools
- [ ] **HIVE logo/mark** — tapping it goes Home
- [ ] **"Create" button/fab** — prominent, always accessible (current gold "Create" button in sidebar)
- [ ] **Responsive breakpoints** — sidebar on desktop (≥768), bottom bar on mobile
- [ ] **Transition between sections** — smooth, no flash of wrong content
- [ ] **Deep linking** — every page has a shareable URL that works

---

## 4. Spaces Hub (`/spaces`)

Your spaces. The lobby.

- [ ] **Your spaces list** — sorted by recent activity, not alphabetical
- [ ] **Unread badges** — per space, clear and accurate
- [ ] **Space card design** — avatar, name, last activity, member count, unread indicator
- [ ] **Empty state** — new user with no spaces: "Find spaces to join" with recommendations
- [ ] **Browse/search spaces** — search bar, category filters, recommended section
- [ ] **Space creation** — can a student create a new space? flow for that?
- [ ] **Pull to refresh** (mobile behavior)
- [ ] **Loading skeleton** — not a blank page while fetching
- [ ] **Mobile layout** — full-width cards, easy thumb tapping

---

## 5. Space Page (`/s/[handle]`) — THE CORE EXPERIENCE

### 5a. Non-member view (SpaceThreshold)
- [ ] **Space identity** — avatar, name, description, accent color
- [ ] **Social proof** — member count, active today count, mutual friends if possible
- [ ] **Activity preview** — "12 messages today, 2 events this week" or similar
- [ ] **Next event** — if there's an upcoming event, show it as a hook
- [ ] **Join button** — prominent, clear, one tap
- [ ] **Claim button** — for unclaimed orgs, distinct from join
- [ ] **Loading state** — skeleton while fetching space data
- [ ] **Not found state** — space doesn't exist
- [ ] **Mobile layout** — centered, focused, no wasted space

### 5b. Space header
- [ ] **Space avatar** — visible, sized right
- [ ] **Space name** — prominent, uses accent color or display font
- [ ] **Online indicator** — "X online" with green dot
- [ ] **Member count** — tappable, opens member list
- [ ] **Settings gear** — leaders only, opens settings
- [ ] **Accent color system** — leaders pick from palette, touches header/tabs/buttons/links
- [ ] **Description** — one-line preview, tap for full info drawer
- [ ] **Mobile: compact but complete** — everything above in ≤56px height, or collapsible

### 5c. Context bar (NEW — above main content)
- [ ] **Next event** — title, time, RSVP count. Tap opens event detail.
- [ ] **Pinned post** — if leader pinned something, show preview. Tap expands.
- [ ] **Featured tool** — if a tool is deployed, show it. Tap opens.
- [ ] **Collapsible/dismissible** — doesn't steal too much space
- [ ] **Empty state** — no context bar if nothing to show (don't show empty bar)

### 5d. Tab navigation
- [ ] **Tabs: Chat | Events | Posts**
- [ ] **Active tab styling** — uses space accent color
- [ ] **Badge counts** — unread on Chat, event count on Events, new posts on Posts
- [ ] **Tab switch animation** — smooth content transition
- [ ] **Persist tab state** — if I switch to Events and come back, still on Events
- [ ] **Mobile: full-width tabs** — easy to tap, clear labels

### 5e. Chat tab
- [ ] **Message feed** — messages render correctly, grouped by author, timestamps
- [ ] **Message actions** — react, reply, pin, delete (own), report
- [ ] **Threading** — reply opens thread panel, works on mobile
- [ ] **Reactions** — emoji picker, reaction display under messages
- [ ] **Typing indicator** — shows who's typing
- [ ] **Unread divider** — "X new messages" marker
- [ ] **Scroll behavior** — auto-scroll on new message, "jump to bottom" button if scrolled up
- [ ] **Chat input** — multiline, attachment support, slash commands (/poll, /rsvp, /countdown)
- [ ] **Slash command UI** — autocomplete dropdown when typing /
- [ ] **Inline tool rendering** — polls, RSVPs created via slash commands render as interactive cards in chat
- [ ] **Image/file sharing** — upload, preview, download
- [ ] **Empty chat state** — first message prompt for new spaces
- [ ] **Loading state** — skeleton messages while fetching
- [ ] **Load more** — scroll up loads older messages
- [ ] **Mobile keyboard** — input stays visible, chat scrolls correctly
- [ ] **Link previews** — URLs show preview cards

### 5f. Events tab
- [ ] **Grouped list** — Today, Tomorrow, This Week, Later
- [ ] **Event card** — title, time, location/online badge, RSVP count, Going/Interested buttons
- [ ] **Inline RSVP** — optimistic update, feels instant
- [ ] **Past events toggle** — collapsed by default
- [ ] **Create event button** — leaders only, opens create flow
- [ ] **Event detail drawer** — full details, RSVP, location, description, attendee list
- [ ] **Empty state** — "No upcoming events" with create CTA for leaders
- [ ] **Loading skeleton**
- [ ] **Mobile layout** — full-width cards, easy RSVP tap targets

### 5g. Posts tab
- [ ] **Post feed** — sorted by recency, cursor pagination
- [ ] **Post card** — author, timestamp, content, post type badge
- [ ] **Reactions** — toggle reactions on posts
- [ ] **Comments** — expandable comment thread per post
- [ ] **Inline composer** — write a post without leaving the tab
- [ ] **Post types** — announcement, discussion, question — visually distinct
- [ ] **Empty state** — "No posts yet" with compose CTA
- [ ] **Loading skeleton**
- [ ] **Load more** — cursor-based pagination
- [ ] **Mobile layout** — readable, good typography, easy interaction

### 5h. Sidebar (desktop only)
- [ ] **Purpose decision** — identity card? tools? members? all three?
- [ ] **Tools section** — deployed tools, clickable → opens tool in space
- [ ] **"Add Tool" button** — leaders, opens Create with space context
- [ ] **Events preview** — 3 upcoming, click opens event detail
- [ ] **Members section** — online count, avatar row, click opens member list
- [ ] **Empty sidebar** — if space has no tools/events, sidebar should still feel useful
- [ ] **Width/padding** — 200px feels right or needs adjustment?

### 5i. Space settings (leaders only)
- [ ] **Audit 1,978 lines** — what's actually needed for V1?
- [ ] **Essential settings:** name, description, avatar, accent color, privacy (open/request/invite)
- [ ] **Cut for V1:** anything students won't use in first month
- [ ] **Mobile-friendly** — not a desktop-only admin panel

### 5j. Member management
- [ ] **Member list** — searchable, shows role badges
- [ ] **Promote/demote** — wire to existing PATCH API
- [ ] **Remove member** — confirmation dialog
- [ ] **Suspend member** — already works, verify UX
- [ ] **Invite link** — generate/share invite URL
- [ ] **Role badges** — owner, admin, moderator, member visually distinct

### 5k. Moderation (V1 scope decision)
- [ ] **Decision: ship moderation panel for V1?** Probably yes — leaders need basic content control
- [ ] **Reported content queue** — if yes, simple list with approve/remove
- [ ] **Keep minimal** — don't build a full trust & safety suite for launch

---

## 6. Create (`/lab` → rename to `/create`?)

### 6a. Create landing (current `/lab`)
- [ ] **Route decision** — `/lab` stays or rename to `/create`?
- [ ] **Landing page** — prompt-first ("What do you want to make?"), not dashboard-first
- [ ] **Your creations** — grid of tools you've built, with usage stats
- [ ] **Templates/inspiration** — carousel or grid of starting points
- [ ] **Quick start chips** — "Poll", "Signup Sheet", "Countdown" — one-tap creation
- [ ] **Empty state** — first-time creator experience, encouraging
- [ ] **Builder level/stats** — keep? cut? make subtle?
- [ ] **Mobile layout** — prompt hero works on phone

### 6b. Conversational creator (`/lab/create` or `/lab/new`)
- [ ] **Consolidate** — two entry points (`/create` and `/new`), should be one
- [ ] **PromptHero** — the input feels exciting, not like a search bar
- [ ] **Template matching** — when a template fits, suggestion feels helpful not pushy
- [ ] **Streaming preview** — watching the tool build feels magical
- [ ] **Refinement** — "make it more colorful" / "add a timer" iterates smoothly
- [ ] **Transition to editor** — moving from creator to editor feels natural
- [ ] **Mobile flow** — entire creation flow works on phone
- [ ] **Error handling** — generation fails gracefully, offers retry

### 6c. Tool editor/IDE (`/lab/[toolId]`)
- [ ] **Scope decision** — full IDE for V1 or simplified editor?
- [ ] **Visual canvas** — drag/drop elements, connections, minimap
- [ ] **Element rail** — browse available elements, drag to canvas
- [ ] **Preview** — live preview of what the tool looks like
- [ ] **Deploy flow** — pick a space, deploy, get confirmation
- [ ] **Settings** — name, description, permissions
- [ ] **Sub-pages audit:** edit, preview, run, runs, deploy, settings, analytics, feedback — which ship for V1?
- [ ] **Mobile** — is tool editing realistic on phone? if not, show "edit on desktop" message

### 6d. Setups (V1 scope decision)
- [ ] **Decision: ship setups for V1?** These are mini-apps / orchestration. Might be too complex for launch.
- [ ] **If yes:** templates page, setup builder, deployment flow
- [ ] **If no:** hide from nav, keep backend for later

---

## 7. Profile / You (`/u/[handle]`, `/me`)

### 7a. Your own profile
- [ ] **Profile card** — avatar, name, handle, bio
- [ ] **Edit profile** — tap to edit name, bio, avatar
- [ ] **Creation showcase** — tools you've built, displayed as cards with usage stats
- [ ] **Your spaces** — list of spaces you're in
- [ ] **Activity stats** — spaces joined, tools built, events attended (keep light)
- [ ] **Settings access** — gear icon or "Settings" link
- [ ] **Mobile layout** — scrollable profile, not cramped

### 7b. Other people's profiles
- [ ] **Same layout as your own** minus edit/settings
- [ ] **Creation showcase** — their tools (the status signal)
- [ ] **Mutual spaces** — "You're both in X, Y, Z"
- [ ] **Report user** — basic safety
- [ ] **Empty profile** — user with no creations/spaces — still looks good

### 7c. Settings (`/me/settings`)
- [ ] **Audit 531 lines** — what's V1 essential?
- [ ] **Account:** email, name, handle, avatar
- [ ] **Notifications:** push notification toggle (once VAPID key is set), email digest toggle
- [ ] **Privacy:** profile visibility, activity visibility
- [ ] **Danger zone:** delete account, log out
- [ ] **Cut for V1:** anything else
- [ ] **Mobile layout**

### 7d. Notifications (`/me/notifications`)
- [ ] **Notification list** — grouped by today/earlier
- [ ] **Notification types** — event reminders, chat mentions, space invites, tool activity
- [ ] **Read/unread states** — visual distinction
- [ ] **Tap to navigate** — each notification deep links to the relevant content
- [ ] **Mark all read**
- [ ] **Empty state** — "All caught up"
- [ ] **Push notifications** — set VAPID key, test end-to-end
- [ ] **Mobile layout**

---

## 8. Standalone Tool Page (`/t/[toolId]`)

Shareable link for a tool outside of a space.

- [ ] **Tool renders correctly** — canvas, interactivity works
- [ ] **Metadata** — OG tags for sharing (tool name, description, preview image)
- [ ] **Attribution** — "Built by @handle on HIVE"
- [ ] **CTA** — "Join HIVE" or "See this in [space name]"
- [ ] **Mobile layout**

---

## 9. Home / Feed (LAST — needs backend)

- [ ] **New API:** `/api/feed` — aggregated events/posts/activity across joined spaces
- [ ] **Page design** — "what's happening now" dashboard
- [ ] **Happening now section** — active events, live spaces
- [ ] **Recent activity** — posts and events from your spaces, ranked
- [ ] **Suggested spaces** — for users with < 5 spaces
- [ ] **Campus context** — dining, weather (compact, optional, campus-mode only)
- [ ] **Empty state** — new user, no spaces joined yet
- [ ] **Loading skeleton**
- [ ] **Mobile layout**

---

## 10. Cross-cutting Concerns

### Design system
- [ ] **Audit existing primitives** — Button, Input, MOTION — are they consistent across all pages?
- [ ] **Typography scale** — consistent heading/body/caption sizes everywhere
- [ ] **Color system** — dark theme tokens applied consistently, accent color system works
- [ ] **Spacing system** — consistent padding/margins (not ad-hoc px values)
- [ ] **Component library** — shared components used everywhere, no one-off duplicates

### States (every page/component needs these)
- [ ] **Loading** — skeletons, not spinners
- [ ] **Empty** — helpful message + action, not "no data"
- [ ] **Error** — clear message, retry action, not a crash
- [ ] **Offline** — graceful degradation message

### Performance
- [ ] **Bundle size** — check what's being shipped, tree-shake unused code
- [ ] **Image optimization** — next/image everywhere, correct sizes
- [ ] **Route prefetching** — popular routes prefetched
- [ ] **Core Web Vitals** — LCP, CLS, INP all green

### Accessibility
- [ ] **Keyboard navigation** — tab through all interactive elements
- [ ] **Screen reader labels** — aria-labels on icons, buttons
- [ ] **Color contrast** — white on dark meets WCAG AA
- [ ] **Focus indicators** — visible focus rings

### Mobile-specific
- [ ] **Touch targets** — minimum 44px on all tappable elements
- [ ] **Safe areas** — content doesn't hide behind notch/home indicator
- [ ] **Keyboard handling** — inputs don't get hidden, chat scrolls correctly
- [ ] **Pull to refresh** — where appropriate (spaces list, feed)
- [ ] **Viewport** — no horizontal scroll, no zoom issues
- [ ] **PWA** — service worker, manifest, installable? (stretch goal)

### Copy & Microcopy
- [ ] **Every empty state has intentional copy** — not "No items found"
- [ ] **Error messages are human** — not "Error 500" or "Something went wrong"
- [ ] **Button labels are verbs** — "Join", "Create", "Send", not "Submit" or "OK"
- [ ] **Placeholder text is helpful** — not "Enter text here"
- [ ] **Consistent voice** — direct, casual, not corporate

### Dead code cleanup
- [ ] **Remove `events-tab.tsx`** (superseded by `space-events-tab.tsx`)
- [ ] **Remove duplicate route patterns** (`/spaces/[spaceId]/tools` vs `/s/[handle]/tools`)
- [ ] **Audit /design-system page** — dev tool only, exclude from production?
- [ ] **Remove any unused components** — grep for imports

---

## V1 Scope Decisions Needed

These items need a YES/NO before work starts:

| Feature | Ship V1? | Notes |
|---------|----------|-------|
| Moderation panel | ? | Leaders need basic content control |
| Analytics panel | ? | Nice-to-have, not essential for launch |
| Leader dashboard | ? | Useful or premature? |
| Setups/orchestration | ? | Complex, maybe post-launch |
| Tool analytics | ? | Post-launch if nobody has tools yet |
| Tool feedback page | ? | Post-launch |
| Space analytics | ? | Post-launch? |
| Builder levels/gamification | ? | Fun or distracting for V1? |
| Tool runs/run history | ? | Developer feature, not student feature |
| Notification settings page | ? | Just a toggle for V1? |
| About page | ? | Marketing page, low priority |
| PWA/installable | ? | Nice-to-have for web-first |
