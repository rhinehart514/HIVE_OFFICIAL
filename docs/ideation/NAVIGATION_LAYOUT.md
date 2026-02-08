# Navigation + Routing + Layout System Ideation

**Date:** Feb 2026
**Scope:** Information architecture, navigation patterns, URL structure, page transitions, responsive strategy, contextual actions, command palette

---

## Current State Summary

The app ships a 4-pillar nav (Home, Spaces, Lab, You) defined in `apps/web/src/lib/navigation.ts`. Desktop gets a 260px fixed sidebar (`apps/web/src/components/layout/AppShell.tsx`) with gold active indicator, breathing logo animation, DM button (feature-flagged), and profile footer. Mobile gets a bottom tab bar (`apps/web/src/components/nav/BottomNav.tsx`) with the same 4 items plus haptic feedback. A mobile drawer exists but has no trigger in the app shell header -- only the HIVE logo mark is shown on mobile.

Two AppShell implementations exist: the live one in `apps/web/src/components/layout/AppShell.tsx` (sidebar-based) and an unused command-first template in `packages/ui/src/design-system/templates/AppShell.tsx` (top header bar with Cmd+K, notification bell, campus pulse). The design system also ships `SpaceShell` (60/40 split layout) and `PageTransition` (fade/slide/scale/morph modes), but the space page (`apps/web/src/app/s/[handle]/page.tsx`) builds its own split-panel layout rather than using SpaceShell.

The "Spaces" nav pillar links to `/spaces`, which is a deprecated redirect page that client-side `router.replace('/home')`. Middleware also has `/spaces/browse` redirecting to `/explore?tab=spaces`. The profile URL situation: `/me` redirects to `/u/[handle]`, `/profile` redirects to `/profile/[id]` which server-redirects to `/u/[handle]`, and `/u/[handle]` is the canonical profile page. Three hops is possible: `/profile` -> `/profile/[id]` -> `/u/[handle]`.

Admin lives in a separate app (`apps/admin`, port 3001) with its own layout. No admin routes exist in the main app despite middleware checking for `/admin` paths.

---

## 1. Information Architecture

### Current 4-Pillar Model

```
Home      Spaces      Lab       You
(/home)   (/spaces)   (/lab)    (/me)
```

**Problem:** Spaces points to a deprecated redirect. The actual content at `/spaces` is just a spinner that sends you to `/home`. Home already shows "Your Spaces" as a card grid. So two pillars lead to the same place.

### Option A: Keep 4 Pillars, Fix Spaces (Recommended)

Make `/spaces` a real page again -- a space roster/management view distinct from Home's activity stream.

- `/home` = "What's happening" -- activity stream, events, recommendations
- `/spaces` = "Your communities" -- full space list, join codes, create/claim, space management
- `/lab` = "Your tools" -- builder dashboard, templates, deployments
- `/me` = "Your profile" -- redirects to `/u/[handle]`, settings, notifications, connections

**What breaks:** Nothing. This is the intended architecture per `navigation.ts` comments. The redirect at `/spaces/page.tsx` is the bug, not the IA.

### Option B: 5 Pillars -- Add Explore

```
Home      Explore      Spaces      Lab       You
```

Add discovery as a first-class pillar. Currently `/explore` is a curated feed accessible via "Browse all" link from Home.

**What breaks:** 5 items in bottom nav is cramped on mobile (iPhone SE has 320px width). Each tab gets 64px instead of 80px. Labels become unreadable. You either drop labels (bad for new users) or sacrifice one pillar. Also, Explore is a lean-back browse activity that competes with Home for attention -- two "feed" pillars creates confusion about where to go first.

### Option C: 3 Pillars -- Merge Home + Spaces

```
Campus       Lab       You
(/campus)    (/lab)    (/me)
```

Combine Home's activity stream with Spaces into a single "Campus" view with tabs or sections. Like Discord's server list merged with a home feed.

**What breaks:** Campus is doing too much. Students need to quickly jump into a specific space (task-oriented) vs. browse what's happening (discovery-oriented). These are different mental models that fight when combined. The current Home page is already 1100 lines and handles new user state, activity feed, events, recommendations, and space grid. Adding space management, join flows, and creation would make it unmanageable. Three bottom tabs also feels sparse and signals "this app doesn't do much."

### Verdict

**Go with Option A.** The 4-pillar model is correct. The Spaces pillar just needs a real page built. The IA matches mental models: "What's new" (Home), "My groups" (Spaces), "My tools" (Lab), "Me" (You).

---

## 2. Desktop Navigation

### Current State

260px fixed sidebar that never collapses. Gold active indicator with `layoutId` animation. Logo with breathing opacity animation. DM button at bottom (feature-flagged). Profile card with settings hover reveal. No search. No notification bell. No Cmd+K.

**File:** `apps/web/src/components/layout/AppShell.tsx`, line 63 -- `style={{ width: railWidth }}`

### Option A: Keep Fixed Sidebar, Add Cmd+K Overlay (Recommended)

Keep the current sidebar exactly as-is. Layer in a command palette triggered by Cmd+K. Add a small search trigger button in the sidebar (below nav items, above DMs).

- Sidebar stays 260px, always visible, ChatGPT aesthetic
- Cmd+K opens a centered overlay (like the unused design system AppShell already has at `packages/ui/src/design-system/templates/AppShell.tsx` line 237-254)
- Notification bell added to sidebar above profile card, or as a badge on the "Home" nav item

**What breaks:** 260px is meaningful screen real estate on a 1024px laptop. Content area is 764px. On 1280px, content is 1020px. Acceptable for most views but the Lab IDE/builder pages and space split-panel already feel the squeeze. Those pages already opt out of max-width constraint (line 415-422 `isWideContentPage` check).

### Option B: Collapsible Sidebar (64px icon rail / 260px expanded)

The design system AppShell comment at line 8 mentions "Collapsible sidebar (64px icon -> 240px with labels)" but this was never built. Add a collapse toggle.

- 64px mode: icons only, tooltips on hover
- 260px mode: icons + labels (current)
- Toggle via hamburger or dedicated collapse button
- Persist preference in localStorage

**What breaks:** Collapsible sidebars add interaction complexity. Students open the app, see icons, don't know what they mean. The 4 nav items (Home, Spaces, Lab, You) are not universally recognizable as icons alone -- BeakerIcon for "Lab" and SpacesIcon for "Spaces" are ambiguous without labels. Also requires building the 64px icon mode, tooltips, and animation between states. Non-trivial engineering for marginal gain -- the only time you want the sidebar smaller is on narrow screens, and those get the mobile layout anyway (breakpoint at `lg` / 1024px).

### Option C: No Sidebar -- Top Bar + Cmd+K (Design System Template)

Switch to the unused `packages/ui/src/design-system/templates/AppShell.tsx` pattern. Header bar with logo, Cmd+K hint, campus pulse, notification bell, profile avatar. Full-width content.

**What breaks:** Loses the "place" feeling of the sidebar. The sidebar makes HIVE feel like a tool you live in (like Slack, Discord, Linear). A top bar makes it feel like a website you visit. For a campus platform targeting daily use, the sidebar signals permanence. Also requires rewriting the entire shell component and re-testing every page layout. The top bar pattern already exists unused -- if it were better, it would have been shipped.

### Verdict

**Go with Option A.** The sidebar is working. Add Cmd+K as a power-user overlay and a notification indicator. Don't collapse -- the labels matter.

---

## 3. Mobile Navigation

### Current State

Bottom tab bar with 4 items (Home, Spaces, Lab, You). Gold indicator with `layoutId` animation. Haptic feedback via `navigator.vibrate`. Hidden at `lg` breakpoint. Mobile header shows only the HIVE logo mark -- no hamburger trigger, no notification bell, no profile.

Mobile drawer exists (`MobileNav` component in AppShell, line 253-385) with full nav + DMs + Settings + Sign Out. But `mobileNavOpen` state has no trigger in the UI -- the hamburger button was removed or never added.

**File:** `apps/web/src/components/layout/AppShell.tsx`, line 444 -- mobile header is just a centered logo

### Option A: Bottom Tabs + Floating Notification Dot (Recommended)

Keep 4 bottom tabs. Add notification indicator to mobile header (right side). Replace the centered logo with a left-aligned logo + right-aligned notification bell + profile avatar.

```
[HIVE logo]                    [bell] [avatar]
----- content area -----
[Home] [Spaces] [Lab] [You]
```

- Bell opens a slide-up notification sheet
- Avatar opens the existing mobile drawer (settings, DMs, sign out)
- This gives the drawer a trigger it currently lacks

**What breaks:** Mobile header goes from 56px decoration to functional UI. Need to handle safe areas, status bar overlap. The header now has interactive elements, which means scroll-behind content gets occluded by a thicker interactive zone. 56px header + 64px bottom nav = 120px of persistent chrome on a 667px iPhone 8 screen, leaving 547px for content. Tight but standard (Instagram uses ~130px of chrome).

### Option B: Bottom Tabs with 5th "More" Item

Replace "You" with "More" that opens the drawer. Move profile, notifications, DMs, settings into the drawer.

```
[Home] [Spaces] [Lab] [Search] [More]
```

- Search gets promoted to a tab
- More opens the drawer with profile, notifications, DMs, settings

**What breaks:** "More" is a junk drawer. It buries the profile, which is a key engagement surface (seeing your own activity, connections, completeness). Search as a tab is overkill -- students search occasionally, not as a primary action. The 4-pillar model is clean; adding a 5th item dilutes it.

### Option C: Bottom Tabs + Swipe Gesture for Drawer

Keep 4 tabs. Add a right-edge swipe gesture to open the mobile drawer. Add a subtle edge indicator.

**What breaks:** Gesture discoverability is near zero. No visual affordance means no one finds it. Swipe-from-edge also conflicts with iOS back gesture on the left and browser back gesture. Edge swipe on the right is non-standard. Students will never discover it without onboarding, which is wasted effort for a nav drawer.

### Verdict

**Go with Option A.** Make the mobile header functional: logo left, bell + avatar right. Avatar taps to open the existing drawer. Bell opens notifications. Bottom tabs stay at 4 items.

---

## 4. Space Context Navigation

### Current State

When inside a space (`/s/[handle]`), the page renders its own `SpaceLayout` with:
- `SpaceHeader`: space identity, online count, settings, moderation, mute, build tool, create event
- `SpaceSidebar`: boards list, tools list, online members preview
- `MainContent`: message feed for active board
- `ChatInput`: message composition

The global AppShell (sidebar + bottom nav) wraps this page. But the space page fills `h-screen` and manages its own layout. The global sidebar is visible on desktop (taking 260px), and the global bottom nav is visible on mobile (taking 64px at bottom). This means the space view is already nested inside the shell.

The design system `SpaceShell` template (`packages/ui/src/design-system/templates/SpaceShell.tsx`) defines a 60/40 split with header, board tabs, content area, and contextual panel (NOW/NEXT UP/PINNED). It also has a mobile bottom sheet for the panel. This template is not used -- the space page builds everything custom.

**File:** `apps/web/src/app/s/[handle]/page.tsx` -- 1243 lines, entirely custom layout

### Option A: Global Nav Recedes, Space Nav Takes Over (Recommended)

When inside a space, the sidebar collapses to 64px (icon rail only) or hides entirely. The space's own sidebar (boards, tools, members) takes the freed space. Mobile bottom nav hides; space's own bottom input bar takes that position.

Implementation: AppShell detects `/s/` prefix in pathname and switches to a minimal mode. Or the space page opts out of AppShell entirely (add `/s/` to `isStandalonePage` check at line 405-411).

```
Desktop (in space):
[64px icons] [200px boards] [chat feed + input]

Mobile (in space):
[space header with back button]
[board tabs (horizontal scroll)]
[chat messages]
[chat input]
```

- Back button returns to `/home` or previous page
- Global nav accessible via icon rail (desktop) or back button (mobile)
- No bottom tab bar when in a space -- the input bar replaces it

**What breaks:** Navigation between spaces becomes harder. You need to go back to `/home` or `/spaces` to switch spaces. Quick-switch between spaces requires an additional UI element (Cmd+K, space switcher dropdown, or recent spaces list). Also, making the sidebar collapse only for spaces means maintaining two sidebar modes -- increases complexity of AppShell.

### Option B: Keep Global Nav, Space Content Adapts

Leave the sidebar exactly as-is. The space page continues to render inside the 764px+ content area. Space's internal sidebar (boards/tools) sits inside the content column.

```
Desktop:
[260px global nav] [200px boards] [remaining: chat]
```

On a 1280px screen: 260 + 200 = 460px for nav, 820px for chat. On 1024px: 260 + 200 = 460px, only 564px for chat. Tight.

**What breaks:** On laptops, chat messages get squeezed. Most space-page content is already full-width (`isWideContentPage` returns true for `/s/`). But the 260px global sidebar is always present, consuming space the chat could use. Two visible sidebars on screen (global nav + space boards) creates visual noise.

### Option C: Overlay Space Navigation

When in a space, the space sidebar (boards/tools/members) becomes an overlay panel triggered by a button, not a persistent sidebar. Chat gets the full content width.

**What breaks:** Board switching becomes a two-step action (open overlay, pick board) instead of one-click. Boards are the primary navigation within a space -- burying them behind a toggle hurts the chat-first workflow. This pattern works for rarely-accessed settings panels but not for frequently-used board navigation.

### Verdict

**Go with Option A** but implement it incrementally. First step: add `/s/` paths to `isStandalonePage` in AppShell so spaces render outside the global shell. The space page already has its own back navigation. Second step: add a small floating "home" button or breadcrumb to get back to global nav. Third step: add Cmd+K or a space-switcher for quick switching.

---

## 5. URL Architecture

### Current State: Profile URL Confusion

Three patterns coexist:

1. `/me` -- redirects to `/u/[handle]` via client-side router.replace (file: `apps/web/src/app/me/page.tsx`)
2. `/profile` -- redirects to `/profile/[id]` via client-side router.replace (file: `apps/web/src/app/profile/page.tsx`)
3. `/profile/[id]` -- server-side redirect to `/u/[handle]` (file: `apps/web/src/app/profile/[id]/page.tsx`)
4. `/u/[handle]` -- canonical profile page with SSR metadata (file: `apps/web/src/app/u/[handle]/page.tsx`)

Worst case chain: `/profile` -> client redirect -> `/profile/[id]` -> server redirect -> `/u/[handle]`. Three hops, two round trips. The `/profile` page also triggers auth loading before redirecting, adding latency.

Sub-routes under `/me/` are real pages, not redirects:
- `/me/settings` -- settings page (canonical)
- `/me/notifications` -- notifications hub
- `/me/connections` -- connections list
- `/me/calendar` -- calendar view
- `/me/reports` -- reports view
- `/me/edit` -- profile editor

But `/settings` redirects to `/me/settings`, `/notifications` redirects to `/me/notifications`, and `/profile/settings` and `/profile/edit` also exist as separate pages.

### Redirect Chains in Middleware

The edge middleware (`apps/web/src/middleware.ts` line 64-87) defines permanent redirects:
- `/browse` -> `/spaces`... but `/spaces` itself redirects to `/home`. So `/browse` -> `/spaces` -> `/home`. Two hops.
- `/spaces/browse` -> `/explore?tab=spaces`
- `/people` -> `/explore?tab=people`
- `/leaders` -> `/spaces?claim=true`... but `/spaces` redirects to `/home`. Two hops again.

### Option A: Clean URL Hierarchy (Recommended)

Canonical URL structure:

```
/                           Landing (public)
/enter                      Onboarding flow (public)
/home                       Activity stream (authed)
/explore                    Discovery feed (authed)
/spaces                     Space roster/management (REBUILD - stop redirecting)
/s/[handle]                 Space residence
/s/[handle]/tools/[id]      Tool inside a space
/s/[handle]/analytics       Space analytics
/s/[handle]/setups/[id]     Setup deployment in space
/lab                        Builder dashboard
/lab/[toolId]               Tool editor
/lab/[toolId]/edit           Tool code editor
/lab/[toolId]/preview        Tool preview
/lab/[toolId]/deploy         Tool deploy
/lab/[toolId]/analytics      Tool analytics
/lab/[toolId]/settings       Tool settings
/lab/[toolId]/run            Tool runner
/lab/[toolId]/runs           Tool run history
/lab/create                 Create new tool
/lab/new                    Alias -> /lab/create (middleware redirect)
/lab/templates              Template browser
/lab/setups                 Setup management
/u/[handle]                 Profile (canonical, SEO, shareable)
/me                         Redirect -> /u/[handle] (keep as convenience)
/me/settings                Account settings (canonical)
/me/notifications           Notifications (canonical)
/me/connections             Connections
/me/calendar                Calendar
/me/edit                    Profile editor
/about                      Marketing (public)
/legal/*                    Legal pages (public)
```

Delete or redirect these pages:
- `/profile` -> middleware 301 to `/me` (which resolves to `/u/[handle]`)
- `/profile/[id]` -> keep as server redirect to `/u/[handle]` (existing bookmarks)
- `/profile/settings` -> middleware 301 to `/me/settings`
- `/profile/edit` -> middleware 301 to `/me/edit`
- `/profile/calendar` -> middleware 301 to `/me/calendar`
- `/profile/connections` -> middleware 301 to `/me/connections`
- `/settings` -> middleware 301 to `/me/settings` (already exists)
- `/notifications` -> middleware 301 to `/me/notifications` (already exists)
- `/feed` -> middleware 301 to `/home`
- `/browse` -> middleware 301 to `/explore` (fix the chain -- don't send to `/spaces`)
- `/leaders` -> middleware 301 to `/explore?claim=true` (fix the chain)

**What breaks:** Any bookmarks to old URLs get redirected. Since these are 301s, search engines will update. The `/me` convenience URL adds one redirect hop, but it is a simple client-side `router.replace` that resolves in <100ms. The real fix is making `/me` resolve server-side via middleware to eliminate the client-side redirect. Add `/me` to `ROUTE_REDIRECTS` in middleware, reading the session cookie to extract the handle.

### Option B: Drop `/me` Entirely, Use `/u/[handle]` Everywhere

Remove `/me` and all `/me/*` sub-routes. Profile and settings live under `/u/[handle]/settings`, `/u/[handle]/notifications`, etc.

```
/u/[handle]                 Profile
/u/[handle]/settings        Settings
/u/[handle]/notifications   Notifications
```

**What breaks:** Settings and notifications are private pages -- having them under a public handle URL is semantically wrong. Someone visiting `/u/alice/settings` sees Alice's settings? No -- it would 403 unless you're Alice. But the URL implies public access. Also, the nav pillar "You" links to `/me`, and changing it to the user's handle URL requires knowing the handle at render time (currently NAV_ITEMS is a static array in `navigation.ts` line 21).

### Option C: Keep All Three Patterns, Fix the Chains

Leave `/me`, `/profile`, and `/u/[handle]` all in place. Just fix the middleware redirect chains so nothing takes more than one hop.

**What breaks:** Conceptual debt stays. Three URL patterns for the same destination is confusing for developers and creates future bugs. Every new profile-related feature needs to decide which URL pattern to use.

### Verdict

**Go with Option A.** `/u/[handle]` is canonical for public profiles. `/me/*` is canonical for private sections (settings, notifications, etc). Kill `/profile/*` routes with middleware redirects. Fix all chain redirects in middleware. Make `/spaces` a real page again.

---

## 6. Page Transitions

### Current State

`PageTransition` component exists in `packages/ui/src/design-system/templates/PageTransition.tsx` with four modes: fade, slide, slideUp, scale. A `PageTransitionWrapper` in `apps/web/src/components/layout/page-transition-wrapper.tsx` maps routes to transition modes (entry flow = slide, everything else = fade).

However, the AppShell has a comment at line 451: "No animation wrapper - caused opacity:0 bug." The page transition wrapper is imported but the actual wrapping is disabled. Pages render without transitions.

The design system also exports `FadeTransition`, `SlideTransition`, `ScaleTransition`, and `StaggerContainer` utility components, plus `pageTransitionPresets` for common patterns.

Motion presets from `packages/ui/src/motion/presets.ts` include easing curves (silk, snap, dramatic), duration values (0.15s to 0.5s), spring configs, and gesture presets (button lift, card hover). These are used extensively within individual pages but not for route transitions.

### Option A: Subtle Fade Only, No Route Transitions (Recommended for Now)

Don't animate route changes. Let each page handle its own enter animation (most already do with staggered reveals). Route transitions in Next.js App Router are notoriously fragile because of React Suspense boundaries, streaming, and layout re-renders. The opacity:0 bug that caused the current disabling is a known pattern.

Individual pages already animate their content on mount:
- Home page: staggered sections with delays (0.1s, 0.15s, 0.2s, etc.)
- Explore page: animated card reveals
- Space page: AnimatePresence with mode="wait" for threshold/split-panel transitions
- Settings page: fadeInUpVariants on section cards

**What breaks:** No cross-page transition polish. Navigating between Home and Lab is an instant swap. For a premium platform, this feels abrupt. But it is functional and avoids the flash-of-invisible-content bugs that route-level AnimatePresence causes in App Router.

### Option B: View Transitions API (Browser-Native)

Use the experimental View Transitions API (`document.startViewTransition()`) which Next.js is exploring. No React animation library needed. Browser handles the cross-fade natively.

**What breaks:** Safari support is incomplete as of early 2026. Chrome and Edge have full support. Firefox has partial. Since this is a campus platform, students use a mix of browsers. A polyfill exists but adds complexity. The API also doesn't support directional transitions (slide left/right) without CSS `view-transition-name` on shared elements, which requires careful implementation per page pair.

### Option C: Re-enable PageTransition with Fix

Debug the opacity:0 bug and re-enable the `PageTransitionWrapper`. The bug likely came from AnimatePresence's exit animation keeping the outgoing page at opacity:0 while the incoming page hadn't mounted yet, causing a blank frame.

Fix: Use `mode="popLayout"` instead of `mode="wait"` in AnimatePresence, or set `initial={false}` to skip the enter animation on first mount. Or defer to `useLayoutEffect` to ensure the page is measured before animating.

**What breaks:** Risk of re-introducing the opacity:0 bug on edge cases (slow networks, Suspense fallbacks, error boundaries). Each page that uses `loading.tsx` or `Suspense` boundaries creates a potential flash point. Testing surface is large (60+ pages). If this ships and one page flashes blank, it erodes trust in the whole app.

### Verdict

**Option A for now, Option B as a future investment.** Individual page mount animations are already good. Route-level transitions are not worth the risk until the View Transitions API stabilizes or Next.js ships a blessed integration.

---

## 7. Contextual Actions

### Current State

No floating action button (FAB). No global create button. No keyboard shortcuts outside of space-specific ones (Cmd+1-4 for board switching, Cmd+Shift+P for panel toggle in spaces). The design system AppShell template has Cmd+K for command palette, but the live AppShell doesn't implement it.

### Option A: Cmd+K Command Palette + Mobile Create FAB (Recommended)

**Desktop:** Add Cmd+K command palette. No FAB -- the sidebar + command palette covers everything.

**Mobile:** Add a floating action button (gold circle, "+" icon) above the bottom nav, offset right. Taps to reveal a radial menu or bottom sheet with contextual actions based on current page:
- On Home: "Create Space", "Join Space"
- On Spaces: "Create Space", "Join by Code"
- On Lab: "New Tool", "From Template"
- On profile: "Edit Profile"

**What breaks:** FABs can occlude content on small screens. If the button overlaps a space card or a message, it creates a tap target conflict. Position it at `bottom: 80px` (above the 64px bottom nav) and `right: 16px`. On iPhone SE, this puts it in the bottom-right corner, which may overlap the last item in a scrollable list. Add a bottom padding of 80px to all mobile scroll containers to compensate. Also, the FAB must hide when the keyboard is open (chat input focus).

### Option B: Persistent Create Button in Nav

Add a 5th item to the bottom nav: a "+" button in the center (Instagram-style). On desktop, add a "Create" button at the top of the sidebar.

**What breaks:** Overloads the nav bar with an action item mixed in with navigation items. The "+" doesn't navigate anywhere -- it opens a creation flow. Mixing navigation and action in the same bar is a UX anti-pattern that confuses the mental model of "tabs take me places" vs "buttons do things." Also pushes to 5 items in the bottom nav.

### Option C: Contextual Top Bar Actions

Add action buttons to the mobile header bar, contextual to the current page. Home header gets a "+" button. Space header already has action buttons. Lab header gets "New Tool."

**What breaks:** The mobile header is small (56px). Adding multiple action buttons crowds it. Also, actions embedded in the header are not discoverable -- users look at the header for branding/navigation, not for actions. Per Fitts's law, action buttons should be near the content they act on, not at the top of the screen.

### Verdict

**Go with Option A.** Cmd+K on desktop covers power users. Mobile FAB gives one-tap access to the most important action on each screen. Keep it simple: one button, contextual action sheet.

---

## 8. Responsive Strategy

### Current Breakpoints

Defined implicitly through Tailwind:
- Mobile: `< 1024px` (below `lg`) -- bottom nav, mobile header, single column
- Desktop: `>= 1024px` (`lg`) -- sidebar, no bottom nav

There is no tablet breakpoint. A 768px iPad gets the mobile layout (bottom nav, no sidebar). The design system AppShell template uses 768px as the mobile breakpoint, but the live AppShell uses 1024px.

### Option A: Three Breakpoints (Recommended)

```
Mobile:   0 - 639px    (sm breakpoint)
Tablet:   640 - 1023px (md/lg breakpoint)
Desktop:  1024px+      (lg breakpoint)
```

**Mobile (0-639px):**
- Bottom tab bar (4 items)
- Single column content
- Functional header (logo, bell, avatar)
- Mobile FAB for create actions
- Sheets and drawers for secondary UI (settings, members, modals)

**Tablet (640-1023px):**
- Bottom tab bar (same as mobile, but wider spacing)
- Two-column grid for space cards on Home
- Larger content area for space chat
- Modals instead of full-screen sheets for settings
- Consider: sidebar at 200px on iPad landscape (1024px, which hits desktop)

**Desktop (1024px+):**
- 260px fixed sidebar
- Multi-column grids
- Split panels (space view)
- Cmd+K command palette
- Hover states, tooltips

**What breaks:** Adding a true tablet breakpoint means testing a third layout mode. Most components already respond to Tailwind's `sm:` and `md:` prefixes. The main change is ensuring the space page's split-panel layout degrades gracefully. On a 768px iPad portrait, 260px sidebar + 200px boards sidebar = 460px, leaving 308px for chat. That is unusable. This reinforces Option A from Section 4 (space pages should opt out of the global sidebar).

### Option B: Two Breakpoints Only (Current)

Keep the current `< 1024px` / `>= 1024px` split. Tablets get mobile layout.

**What breaks:** iPad users (common in college) see the phone layout on a 10-inch screen. The bottom tab bar on iPad looks comically spacious. Content is phone-width on a tablet-sized viewport. This works but doesn't feel native. If HIVE targets campus students, a meaningful percentage use iPads for note-taking in lectures while also checking HIVE.

### Option C: Fully Fluid, No Breakpoints

Use CSS container queries and fluid typography/spacing. No hard breakpoints. Components adapt continuously.

**What breaks:** Container queries have good browser support but Tailwind CSS 3 doesn't have first-class container query support (Tailwind 4 does). Building fluid layouts requires custom CSS that fights the Tailwind utility-class pattern used everywhere in the codebase. Also, some layouts (sidebar vs. bottom nav) are categorically different and require a hard switch, not a fluid transition.

### Verdict

**Go with Option A** but implement incrementally. The current two-breakpoint system works for launch. The tablet breakpoint is a polish item for when iPad usage is validated through analytics.

---

## 9. Command Palette / Quick Actions

### Current State

The design system `AppShell` template (`packages/ui/src/design-system/templates/AppShell.tsx`) has a command palette trigger (Cmd+K) with keyboard shortcut handler (line 201-209) and a search-bar-style hint button (line 237-254). But the live AppShell doesn't use this template. No command palette exists in the shipped app.

The space page has its own `SearchOverlay` component (dynamically imported at line 85-88) triggered by Cmd+K within the space context. This searches messages within that space.

### Option A: Global Cmd+K with Scoped Results (Recommended)

Build a single Cmd+K palette that works everywhere. Results are scoped by context:

**Global scope (anywhere in the app):**
- Jump to: Home, Spaces, Lab, Settings, Notifications
- Search spaces by name/handle
- Search people by name/handle
- Quick actions: Create Space, New Tool, Join by Code

**Space scope (when inside /s/[handle]):**
- All global results +
- Search messages in this space (current SearchOverlay behavior)
- Switch boards (Cmd+1-4 shortcuts already exist)
- Quick actions: Create Event, Build Tool for This Space, Invite Member

**Implementation:**
- Register Cmd+K handler in AppShell (global)
- Space page registers additional scoped results via context
- Use a `CommandPaletteProvider` that allows pages to register commands
- Render as a centered modal overlay with search input + results list
- Reference: Linear, Vercel, Raycast command palette patterns

**What breaks:** Building a good command palette is non-trivial. Fuzzy search over spaces, people, and actions requires an indexing strategy. For spaces and people, hit the existing search APIs (`/api/spaces/browse-v2`, `/api/users/search`). For actions, maintain a static registry. Latency is critical -- results must appear within 100ms of typing. Debounce at 150ms, show cached results immediately, update with API results. This is a meaningful engineering investment (2-3 days for a good implementation).

### Option B: Simple Search Modal, Not a Command Palette

A search-only modal. Type to search spaces and people. No actions, no navigation commands.

**What breaks:** Misses the power-user opportunity. Students who use Cmd+K are the ones who will become daily users. A search-only modal is just a slightly fancier version of an Explore page search bar. The command palette pattern (actions + navigation + search in one interface) is what makes tools like Linear feel magical.

### Option C: Defer Command Palette, Ship Search in Sidebar

Add a search input at the top of the desktop sidebar. Inline results dropdown below the input. No Cmd+K, no modal.

**What breaks:** Sidebar search is small (260px - 24px padding = 236px wide input). Results dropdown competes with nav items. Mobile has no equivalent since the sidebar doesn't exist there. This is the least ambitious option and delays the inevitable command palette.

### Verdict

**Go with Option A.** The command palette is the single highest-leverage nav improvement for power users. Ship a basic version (jump to pages + search spaces) first, then add scoped commands incrementally.

---

## Implementation Priority

Ranked by impact-to-effort ratio:

1. **Fix Spaces pillar** -- Make `/spaces` a real page instead of a redirect. Remove the deprecated redirect page. Effort: 1 day. Impact: Fixes broken navigation for every user.

2. **Fix mobile header** -- Add notification bell and avatar/hamburger trigger to mobile header. The drawer already exists with no trigger. Effort: 0.5 days. Impact: Mobile users can access settings, DMs, and sign out.

3. **Fix redirect chains** -- Update middleware `ROUTE_REDIRECTS` so `/browse` goes to `/explore` (not `/spaces`), `/leaders` goes to `/explore?claim=true` (not `/spaces`). Add `/profile` -> `/me`, `/profile/settings` -> `/me/settings`, etc. Effort: 0.5 days. Impact: Eliminates multi-hop redirects.

4. **Cmd+K command palette (basic)** -- Jump to pages + search spaces. Register Cmd+K handler in AppShell. Effort: 2-3 days. Impact: Power users get fast navigation.

5. **Space pages opt out of global shell** -- Add `/s/` prefix to `isStandalonePage` check in AppShell. Space pages already manage their own layout. Effort: 0.5 days. Impact: More screen real estate for space chat, cleaner visual hierarchy.

6. **Mobile create FAB** -- Floating action button above bottom nav with contextual actions. Effort: 1 day. Impact: One-tap creation on mobile.

7. **Consolidate profile URLs** -- Kill `/profile/*` routes, redirect via middleware to `/me/*`. Effort: 1 day. Impact: Clean URL architecture, fewer redirect hops.

8. **Notification bell in desktop sidebar** -- Add bell icon with unread count above profile card. Effort: 0.5 days. Impact: Notifications are discoverable without navigating away.

---

## Files Referenced

| File | Purpose |
|------|---------|
| `apps/web/src/lib/navigation.ts` | Nav item config (4 pillars) |
| `apps/web/src/components/layout/AppShell.tsx` | Live app shell (sidebar + bottom nav) |
| `apps/web/src/components/nav/BottomNav.tsx` | Mobile bottom tab bar |
| `apps/web/src/middleware.ts` | Edge middleware (redirects, auth, rate limiting) |
| `packages/ui/src/design-system/templates/AppShell.tsx` | Unused command-first shell template |
| `packages/ui/src/design-system/templates/SpaceShell.tsx` | Unused 60/40 space shell template |
| `packages/ui/src/design-system/templates/PageTransition.tsx` | Route transition system (disabled) |
| `apps/web/src/components/layout/page-transition-wrapper.tsx` | Route-to-transition-mode mapper |
| `apps/web/src/app/spaces/page.tsx` | Deprecated redirect to /home |
| `apps/web/src/app/home/page.tsx` | Activity stream home page |
| `apps/web/src/app/s/[handle]/page.tsx` | Space residence page (1243 lines) |
| `apps/web/src/app/me/page.tsx` | Redirect to /u/[handle] |
| `apps/web/src/app/profile/page.tsx` | Redirect to /profile/[id] |
| `apps/web/src/app/profile/[id]/page.tsx` | Server redirect to /u/[handle] |
| `apps/web/src/app/u/[handle]/page.tsx` | Canonical profile page |
| `apps/web/src/app/me/settings/page.tsx` | Settings page (canonical) |
| `apps/web/src/app/me/notifications/page.tsx` | Notifications page (canonical) |
| `apps/web/src/app/explore/page.tsx` | Discovery feed |
| `apps/web/src/app/lab/page.tsx` | Builder dashboard |
| `apps/web/src/app/layout.tsx` | Root layout (wraps everything in AppShell) |
| `apps/web/src/contexts/dm-context.tsx` | DM state management |
| `packages/ui/src/motion/presets.ts` | Motion easing, duration, spring presets |
