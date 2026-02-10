# HIVE Front-End & IA Spec — Feb 10, 2026

Everything that needs to happen for front-end and information architecture. Each item has current state, target state, and what to do.

Reference: `docs/design-system/DESIGN-2026.md` is the visual source of truth.

---

## INFORMATION ARCHITECTURE

### Site Map (Target)

```
/                     Landing (no shell)
/enter                Entry flow (no shell)
/about                About page (no shell)
/legal/*              Legal pages (no shell)
/t/[toolId]           Standalone tool (no shell, frameless)
/login                Login redirect (no shell)

── APP SHELL (sidebar desktop / bottom bar mobile) ──

/discover             Campus dashboard (home surface)
/spaces               Your spaces list
/s/[handle]           Space page (chat-first)
/lab                  Tool builder (IDE)
/lab/new              New tool
/lab/[toolId]         Edit tool
/u/[handle]           Public profile
/me                   Own profile
/me/edit              Edit profile
/me/settings          Settings
/me/notifications     Notification settings
```

### Routes to DELETE

```
/home                 → redirect to /discover (if not already)
/feed                 → redirect to /discover (if not already)
/explore              → merge into /discover or kill
/calendar             → kill (events live in spaces + discover)
/hivelab/*            → kill if /lab covers it
/elements             → kill or merge into /lab
/leaders              → kill
/schools              → kill (campus detection handles this)
/profile/*            → redirect to /u/ or /me
/me/connections       → kill (no social graph in v1)
/me/calendar          → kill
/me/reports           → kill or move to settings
/notifications        → kill standalone route (use in-app panel)
/notifications/settings → move under /me/settings
/design-system        → dev only, gate behind admin
/templates            → merge into /lab
/settings             → redirect to /me/settings
```

### API Routes to DELETE

```
/api/rituals/*        → 6 dead routes, kill all
/api/friends/*        → no social graph in v1
/api/connections/*    → no social graph in v1
/api/dm/*             → DMs flagged off, kill or keep gated
/api/social/*         → kill
/api/posts/*          → legacy feed system, chat replaced this
```

---

## SURFACE-BY-SURFACE SPEC

Each surface below lists: **current state** → **target state** → **tasks**.

---

### 1. LANDING PAGE (`/`)

**Files:** `page.tsx`, `components/landing/*` (8 files, ~300 lines total)

**Current:** Header → Hero → Product → CTA → Footer. Copy: "Your Club Is Already Here."

**Target (from DESIGN-2026):**
- Full bleed, no max-width container
- Nav: logo + one button ("Join UB"), no bg, transparent on black
- Hero: headline left ("The app UB was missing"), live poll right with ● LIVE indicator
- Product: 3 real screenshot cards (Discover, Create, Spaces) in uneven grid on `#0A0A0A` surfaces
- CTA: Clash headline + two pills, maximum black space
- Mobile: CTAs above fold, poll below, screenshots stack

**Tasks:**
- [ ] Implement split hero layout (text left, live poll right)
- [ ] Wire a real live poll component (from inline-components) into hero
- [ ] Add ● LIVE yellow pulsing dot to poll
- [ ] Replace ProductMock with real screenshot cards in `#0A0A0A` surfaces
- [ ] Simplify nav to logo + single "Join UB" yellow pill
- [ ] Kill WaitlistModal (direct to /enter instead)
- [ ] Kill AnimatedCounter if unused
- [ ] Apply Clash Display for headlines
- [ ] Ensure full-bleed layout (no container max-width)
- [ ] Mobile: stack CTAs → poll → screenshots vertically

---

### 2. ENTRY FLOW (`/enter`)

**Files:** `EntryFlowV2.tsx` (512 lines)

**Current:** 2-step flow: email → code+name. Uses `bg-void`. Already simplified from 4-phase.

**Target (from DESIGN-2026):**
- Single centered column, max-width 400px
- One thing at a time: headline + input + button directly on black void
- No card wrapping the form
- Progress dots (filled = done, `white/20` = upcoming)
- No logo, no nav — you're in a tunnel
- Phase transition: content fades (100ms out, 150ms in), nothing moves
- Skip links as ghost text below button

**Tasks:**
- [ ] Audit EntryFlowV2 against DESIGN-2026 spec
- [ ] Remove any card/container wrapping the form
- [ ] Apply Clash Display for "What's your email?" headline
- [ ] Ensure max-width 400px for input area
- [ ] Add/verify progress dots (white filled / white/20)
- [ ] Verify fade transition between steps (100ms out, 150ms in)
- [ ] Kill any emotional state system remnants
- [ ] Kill skip button excessive styling — make it ghost text `text-white/50, 12px`

---

### 3. APP SHELL (Sidebar + Chrome)

**Files:** `components/shell/AppShell.tsx` (176 lines), `AppSidebar.tsx` (438 lines), `GlobalFAB.tsx`

**Current:** 
- Sidebar: 72px width (`md:pl-[72px]`), icon-based
- Mobile: sticky header with hamburger + HIVE text + create button, swipe-to-open sidebar
- GlobalFAB component exists
- No shell on: `/`, `/enter`, `/landing`, `/waitlist`, `/schools`, `/about`, `/login`, `/legal`, `/t/`

**Target (from DESIGN-2026):**
- Desktop sidebar: 200px fixed, bg `#000000` (same as canvas, no panel, no right border)
- Logo: HIVE mark in yellow, 24px, top left
- Nav items: Geist medium 14px, vertically stacked, `text-white/50` default
- Active item: `text-white` + yellow dot (6px) left of text, NO bg highlight
- Create button: yellow pill `[+ Create]` at bottom
- Spacing between items: 8px
- Mobile bottom bar: `rgba(0,0,0,0.8) backdrop-blur(12px)`, border-top `1px solid white/06`
- Three items: icons + labels in Geist Mono 10px uppercase
- Active: `text-white` + yellow dot below icon
- Mobile FAB: 56px yellow circle, black `+` icon, fixed bottom-right above bottom bar
- Campus mode: Discover | Spaces | You + FAB
- Non-campus mode: Spaces | Create | You

**Tasks:**
- [ ] Widen sidebar from 72px to 200px with text labels
- [ ] Remove sidebar background/border — items sit on void
- [ ] Add yellow HIVE mark (24px) top left
- [ ] Switch nav items to text (Geist medium 14px) with yellow dot active indicator
- [ ] Kill any background highlight on active nav items
- [ ] Add `[+ Create]` yellow pill at sidebar bottom
- [ ] Rebuild mobile bottom bar: frosted bg, 3 items, Geist Mono 10px uppercase labels
- [ ] Replace mobile header with bottom bar navigation
- [ ] Implement yellow FAB on mobile (56px circle, fixed position)
- [ ] Wire campus mode vs non-campus mode nav switching

---

### 4. DISCOVER (`/discover`)

**Files:** `app/discover/page.tsx` (511 lines)

**Current:** Full page with campus data fetching (dining, study spots, events, tools, spaces, search). Uses `useCampusMode` hook.

**Target (from DESIGN-2026):**
- Vercel dashboard energy — dense grid, info-first
- Page title "Discover" in Clash 32px + "Campus Mode" yellow badge top right
- Section labels: Geist Mono 11px uppercase tracked `text-white/50`
- OPEN NOW: horizontal scroll dining cards with urgency (closing soon = yellow time)
- EVENTS TONIGHT: bigger cards (time-sensitive = more weight)
- TRENDING TOOLS: live state with yellow dot + count
- SPACES TO JOIN: text list, not cards — names with `→` arrows
- Full-width search input at top
- Max-width: 960px centered

**Tasks:**
- [ ] Apply Clash Display for "Discover" page title
- [ ] Add "Campus Mode" yellow pill badge top right
- [ ] Convert section headers to Geist Mono 11px uppercase
- [ ] Implement horizontal scroll for dining cards
- [ ] Add urgency styling to dining (yellow for closing soon)
- [ ] Make event cards larger than tool cards (visual weight hierarchy)
- [ ] Add yellow dot + live count to trending tools
- [ ] Simplify spaces section to text list with `→` arrows
- [ ] Set max-width 960px centered
- [ ] Full-width search input

---

### 5. SPACES HUB (`/spaces`)

**Files:** `app/spaces/components/spaces-hub.tsx` (196 lines), `hub-active.tsx`

**Current:** Has header with "Spaces" title + New button. Loading/error states. Uses `HubActive` component for the active list.

**Target (from DESIGN-2026):**
- iMessage / Slack energy — it's a LIST
- Space name (Geist medium 15px white) + last message preview (Geist 13px `white/50` truncated) + timestamp (Geist Mono 11px `white/50` right-aligned)
- Unread: yellow dot (6px) left of name, name in `text-white`. Read: name in `text-white/50`
- Hover: `bg rgba(255,255,255,0.03)`
- Dividers: `1px solid rgba(255,255,255,0.04)`
- Max-width: 640px centered
- "Browse all spaces →" ghost link at bottom
- Create: small yellow pill or `+` icon top right
- NO identity constellation, NO hub states (empty/onboarding/active) — always show the list

**Tasks:**
- [ ] Rebuild as a flat message-preview list (not cards/grid)
- [ ] Add last message preview + timestamp per space
- [ ] Add yellow unread dot indicator
- [ ] Set max-width 640px centered
- [ ] Kill hub states (empty/onboarding/active) — always render list, show empty state inline
- [ ] Kill identity constellation if it exists
- [ ] Add "Browse all spaces →" ghost link
- [ ] Apply correct typography (Geist medium/mono as specified)

---

### 6. SPACE PAGE (`/s/[handle]`)

**Files:** `app/s/[handle]/page.tsx` (1233 lines), `space-layout.tsx` (185), `space-header.tsx` (486), `space-tabs.tsx`, `chat-input.tsx`, `feed/*`, `sidebar/*`, `threshold/*`, `space-settings.tsx` (1979)

**Current:**
- Chat-only tabs (SpaceTabs already refactored to single 'chat' type) ✅
- Slash commands in chat-input ✅
- Inline components in message-item ✅
- Split panel: sidebar (boards, tools, members) + chat area
- Header: avatar, name, handle, member count, badges, actions
- Threshold for non-members (two variants: active vs gathering)

**Target (from DESIGN-2026):**
- Chat takes full screen. No tabs visible. The space IS the chat.
- Space name top left in Clash 20px. Member count as pill badge top right.
- Settings gear icon, ghost style.
- Messages: no backgrounds. Author name Geist medium white. Content Geist regular `white/80`. Timestamp Geist Mono 11px `white/30`.
- Inline components: `#0A0A0A` surface, 16px radius, yellow accent on selected + live indicators
- Chat input: bottom fixed. `bg rgba(255,255,255,0.03)`, 12px radius. Placeholder: `/ Try /poll, /rsvp, /countdown`. Send button: yellow circle with arrow.
- Slash command menu: solid `#0A0A0A` surface above input
- Tools/Events: gear icon opens drawer/panel from right (desktop) or bottom sheet (mobile). NOT a tab.

**Tasks:**
- [ ] Simplify space-header: Clash 20px name, pill member count, ghost gear icon only
- [ ] Kill any remaining tab UI rendering (even if data model is chat-only)
- [ ] Strip message backgrounds — messages sit on void
- [ ] Apply message typography: author Geist medium, content `white/80`, timestamp Geist Mono `white/30`
- [ ] Style inline components: `#0A0A0A` surface, 16px radius, yellow accents
- [ ] Restyle chat input: `white/3` bg, 12px radius, yellow send button
- [ ] Update placeholder to `/ Try /poll, /rsvp, /countdown`
- [ ] Move tools/events access to gear drawer instead of sidebar/tabs
- [ ] Wire sidebar tools (currently passing `tools: []` — fix the `_sidebarTools` → `tools` prop)
- [ ] Audit threshold views against design spec
- [ ] Reduce page.tsx (1233 lines — decompose further if needed)

---

### 7. PROFILE (`/u/[handle]` and `/me`)

**Files:** `app/u/[handle]/page.tsx` (91 lines), `app/me/*`

**Current:** Minimal (91 lines for public profile). `/me/connections` exists, social infra hidden by flags.

**Target (from DESIGN-2026):**
- Single centered column, max-width 480px
- Name in Clash 40px centered (biggest text on page)
- Handle in Geist Mono `white/50`
- Bio/major/year: Geist `white/50`, one line
- Online status: yellow dot + "Online" Geist 12px
- Divider: `1px solid white/06`
- Tools built: small cards, 2-column grid, `#0A0A0A` surface, emoji + name + usage count
- Spaces: text list, minimal
- NO social metrics, NO follower counts, NO connections section
- Tools built IS the proof of work
- Edit (own profile): ghost "Edit" button top right → modal

**Tasks:**
- [ ] Rebuild profile layout: centered column, 480px max-width
- [ ] Name in Clash 40px, handle in Geist Mono
- [ ] Add "Tools built" section with 2-column card grid
- [ ] Add "Spaces" as text list
- [ ] Remove all social infrastructure from profile view (connections, followers)
- [ ] Kill `/me/connections` route
- [ ] Add yellow online dot indicator
- [ ] Edit button → ghost style, opens modal

---

### 8. LAB (`/lab`)

**Files:** `app/lab/page.tsx` (940 lines), `app/lab/new/`, `app/lab/[toolId]/`

**Current:** 940-line page. Full tool builder.

**Target (from DESIGN-2026):**
- Sidebar + main area. VS Code / Vercel hybrid.
- Left sidebar: tool list, name + yellow dot if live/active
- Main: editor, preview, settings for selected tool
- Deploy button: yellow pill (main action)
- Can be denser/more technical than rest of HIVE
- No max-width — full content width

**Tasks:**
- [ ] Audit lab layout against DESIGN-2026 sidebar+main spec
- [ ] Add yellow dot on active/live tools in sidebar list
- [ ] Ensure Deploy is a prominent yellow pill
- [ ] Verify no max-width constraint
- [ ] Reduce 940-line page.tsx if possible

---

### 9. STANDALONE TOOL (`/t/[toolId]`)

**Files:** `app/t/[toolId]/page.tsx` (87 lines)

**Current:** 87 lines. Renders tool standalone. Already no-shell.

**Target (from DESIGN-2026):**
- Frameless. No nav, no shell, no sidebar, no bottom bar.
- Pure black canvas. Tool centered. Max-width 480px.
- Tool in `#0A0A0A` surface, 16px radius.
- HIVE watermark: yellow dot + "HIVE" in Geist Mono 10px `white/30`, bottom center.
- CTA below: "Sign up to build your own →" ghost text → /enter
- Must load FAST. Minimal JS. Most important surface for growth.

**Tasks:**
- [ ] Add HIVE watermark (yellow dot + Geist Mono text)
- [ ] Add "Sign up to build your own →" ghost CTA
- [ ] Verify max-width 480px centered
- [ ] Verify `#0A0A0A` surface with 16px radius on tool container
- [ ] Audit bundle size — this page must be lightweight

---

### 10. ABOUT (`/about`)

**Files:** `app/about/page.tsx` (966 lines)

**Current:** 966 lines. Heavy.

**Target (from DESIGN-2026):**
- Single column editorial, max-width 640px centered
- Headline: Clash 48px white
- Body: Geist 16px white (full white, not dimmed — reading page)
- Pull quotes: Clash 24px yellow
- Section spacing: 120px between sections
- Reduce to: What HIVE Is → Why → What's In It → Contributors → CTA
- Kill visualizations (BeforeAfterSplit, TimeCollapseBar, NetworkRipple)
- Contributors: names in horizontal wrap
- Bottom CTA: "Your club is already here." + two pills

**Tasks:**
- [ ] Gut and rebuild — 966 lines is way too much
- [ ] Max-width 640px centered
- [ ] Kill all visualization components
- [ ] Restructure to 5 sections max
- [ ] Apply Clash headlines, Geist body, yellow pull quotes
- [ ] 120px section spacing
- [ ] Add bottom CTA with two pills

---

## GLOBAL DESIGN TASKS

### Typography
- [ ] Install/configure Clash Display font
- [ ] Apply Clash to all headlines, page titles, space names, tool names, profile display names
- [ ] Ensure Geist Sans body / Geist Mono for labels+timestamps everywhere
- [ ] Kill 6-tier text opacity system — enforce only `#FFFFFF` and `rgba(255,255,255,0.5)`

### Surfaces
- [ ] Standardize: cards/containers = `#0A0A0A`, 16px radius, `1px solid white/8` border
- [ ] Subtle surfaces (list items, inputs) = `rgba(255,255,255,0.03)`, 12px radius, no border
- [ ] Overlays (modals, sheets) = `rgba(10,10,10,0.9)`, blur(20px), 20px radius
- [ ] Kill blur on anything that doesn't overlay other content

### Buttons
- [ ] All buttons → pills (border-radius: 9999px)
- [ ] Primary: `#FFD700` bg, black text — max ONE per screen
- [ ] Secondary: `#1A1A1A` bg, white text, `white/10` border
- [ ] Ghost: transparent, `white/50` text → hover: `white/6` bg, white text

### Motion
- [ ] Kill all `whileHover={{ y: -2 }}` instances
- [ ] Kill word-by-word text reveals (WordReveal, NarrativeReveal)
- [ ] Kill parallax components
- [ ] Kill stagger animations on lists
- [ ] Kill scale-on-hover
- [ ] Max animation duration: 300ms
- [ ] Keep: fade on route change, poll bar animations, yellow dot pulse, modal slide-up on mobile

### Signature Element: Yellow Pulsing Dot
- [ ] Create reusable `LiveDot` component: 6px circle, `#FFD700`, 3s breathe animation (opacity 0.6→1→0.6)
- [ ] Apply to: live tools, active spaces, online profiles, LIVE badge on landing, unread indicators

### Kill List (from DESIGN-2026 "WHAT DIES")
- [ ] `tokens.css` warmth system
- [ ] `NoiseOverlay` component
- [ ] `AnimatedBorder` component
- [ ] `WordReveal` / `NarrativeReveal` components
- [ ] `ParallaxText` / `Parallax` components
- [ ] `ScrollIndicator` component
- [ ] `ScrollSpacer` component
- [ ] `Magnetic` wrapper component
- [ ] `Stagger` / `staggerContainerVariants`
- [ ] All `whileHover={{ y: -2 }}` patterns
- [ ] `cardHoverVariants` / `revealVariants`
- [ ] `BeforeAfterSplit` / `TimeCollapseBar` / `NetworkRipple`
- [ ] 6-tier opacity system
- [ ] `bg-foundation-gray-1000` / warm bg tokens
- [ ] Identity constellation in SpacesHub
- [ ] Hub states (empty/onboarding/active)
- [ ] Emotional state system in entry flow

---

## CLEANUP & INFRA

- [ ] Delete 6 ritual API routes (`/api/rituals/*`)
- [ ] Delete `/api/friends/*`, `/api/connections/*`, `/api/social/*`
- [ ] Audit and remove `localhost:3000` hardcoded references (replace with `process.env.NEXT_PUBLIC_APP_URL`)
- [ ] Delete dead component `chat-messages.tsx` (superseded by MessageFeed)
- [ ] Delete `tools-feed.tsx` if unused
- [ ] Wire sidebar tools in space page (`_sidebarTools` → `tools` prop)
- [ ] Remove audit screenshot PNGs from repo root
- [ ] Delete `/me/connections` page
- [ ] Delete `/me/calendar` page
- [ ] Gate `/design-system` behind admin flag

---

## PRIORITY ORDER

**Phase 1 — Kill dead weight (1 day)**
1. Delete dead routes, components, and API endpoints
2. Remove kill-list components from DESIGN-2026
3. Fix `localhost:3000` references

**Phase 2 — Shell + Navigation (1 day)**
4. Rebuild AppShell (200px sidebar, mobile bottom bar)
5. Wire campus/non-campus nav modes
6. Implement GlobalFAB as yellow circle

**Phase 3 — Core surfaces (2-3 days)**
7. Landing page → DESIGN-2026 spec
8. Entry flow polish
9. Spaces Hub → flat list
10. Space page → chat-first cleanup
11. Profile → centered column, tools-as-proof-of-work

**Phase 4 — Secondary surfaces (1-2 days)**
12. Discover → dashboard density
13. Lab audit
14. Standalone tool → watermark + CTA
15. About → gut and rebuild

**Phase 5 — Global polish (1 day)**
16. Typography pass (Clash everywhere)
17. Surface/button standardization
18. LiveDot component + apply everywhere
19. Motion cleanup

---

*This is the checklist. Work top to bottom. Check boxes as you go.*
