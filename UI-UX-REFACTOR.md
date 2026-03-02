# HIVE — UI/UX Refactor: Audit & Divergent Approaches

**Generated:** 2026-03-01 | **Source:** 12 parallel UI/UX audit agents across all surfaces, systems, and cross-cutting concerns | **Scope:** Full IA, UX, and UI assessment with 3 divergent approaches per domain

---

## Executive Summary

**Current state: 5/10.** The product has solid bones — the architecture is right, the token system is well-designed, the shell structure works. But execution is broken in critical places: CSS variables never injected, motion durations 1000x too slow, WCAG AA violations across every surface, the primary create flow routes to a deleted page, and the landing page sells AI building instead of showing it.

**The 5 highest-leverage fixes:**
1. Fix `MOTION.duration` bug (100-second animations → 150ms) — every animated surface is broken
2. Fix WCAG text opacity violations (`text-white/30` = 2.4:1 contrast, needs 4.5:1) — 20+ files
3. Fix CreatePromptBar routing to deleted `/lab` → `/build` — every create attempt 404s
4. Kill Space Home tab bar (Chat|Events|Posts|Apps) — spec says unified stream
5. Strip entry flow from 7 screens to 3-4 — estimated 40-50% drop-off currently

**12 audit domains, 36 divergent approaches.** Each domain below has current state assessment + 3 approaches spanning conservative → radical.

---

## Table of Contents

1. [Design System & Tokens](#1-design-system--tokens)
2. [Typography & Information Density](#2-typography--information-density)
3. [Motion & Animation](#3-motion--animation)
4. [Shell & Navigation](#4-shell--navigation)
5. [Landing & Entry](#5-landing--entry)
6. [Build Entry & Studio](#6-build-entry--studio)
7. [Space Home](#7-space-home)
8. [Discover & Feed](#8-discover--feed)
9. [Creation View (Viral Surface)](#9-creation-view-viral-surface)
10. [Profile & Social](#10-profile--social)
11. [Mobile & PWA](#11-mobile--pwa)
12. [Empty States & Error States](#12-empty-states--error-states)

---

## 1. Design System & Tokens

**Current State: 4/10**

### Critical Findings
- **4 parallel color systems** — `design-system-v2.ts`, `colors-unified.ts`, `monochrome.ts`, `ide.ts` overlap and conflict
- **CSS variables never injected** — `generateCSSVariables()` exists in `design-system-v2.ts` but is never called. `--hive-*` tokens aren't available at runtime. Root cause of pervasive hardcoded values.
- **WCAG AA violations** — Text opacity hierarchy (`text-white/50` on `#000000` = 4.5:1 barely passes; `text-white/30` = 2.4:1 FAILS). 20+ files use failing opacities.
- **Hardcoded `#FFD700`** — Gold appears as a literal string 4+ times in AppSidebar alone instead of using tokens.

### Approach A: Minimal Evolution
- Call `generateCSSVariables()` in root layout
- Consolidate 4 color files → 1 authoritative source
- Fix opacity violations: `text-white/30` → `text-white/50` minimum
- **Effort:** 4-6 hours | **Disruption:** Low

### Approach B: v3 Design System
- New `design-system-v3.ts` with WCAG-compliant opacity hierarchy
- Semantic color tokens: `--hive-text-primary` (0.90), `--hive-text-secondary` (0.60), `--hive-text-tertiary` (0.50)
- Tailwind plugin that autocompletes semantic tokens
- **Effort:** 12-16 hours | **Disruption:** Medium

### Approach C: Radical Simplification
- Kill all 4 color files. One flat token map: 8 semantic colors + 4 opacities
- CSS custom properties only — no JS token objects
- No design system package dependency at runtime
- **Effort:** 20-24 hours | **Disruption:** High, but permanent fix

---

## 2. Typography & Information Density

**Current State: 6/10**

### Critical Findings
- **Clash Display broken in production** — `--font-clash` CSS variable is never set. Every `clashDisplay` heading (landing hero, about page) falls through to `system-ui`.
- **Two competing type scales** — `design-system-v2.ts` (10 sizes) and `typography.ts` (12 sizes). Components use neither — raw `text-[16px]` inline everywhere.
- **Sub-WCAG text everywhere** — `text-white/30` used 20+ times (2.4:1 ratio). `text-white/25` used 5+ times (1.9:1). `text-white/20` used 3+ times (1.6:1). All fail WCAG AA's 4.5:1 minimum.
- **10px text exists** — Card stats and social proof use `text-[10px]`, below the defined scale entirely. Illegible on non-Retina.
- **No grid on discover desktop** — Single-column cards at 256px each = 3 visible on mobile, sparse on desktop.
- **40px gradient accent bar per card** — Carries zero information, costs 40px of vertical space per card.

### Approach A: Tight & Dense (Linear/Notion energy)
- Drop Clash Display entirely (fixes the production bug). Geist Sans for everything.
- 6-level scale: Display (40px) → Body (13px) → Micro (10px)
- Cards collapse from ~256px to ~160px (remove gradient bar, tighten spacing)
- 2-column grid at `lg`, 3-column at `xl` on discover
- **Optimizes for:** Information density, scanning speed
- **Effort:** 8-10 hours

### Approach B: Comfortable & Readable (Apple/Stripe energy)
- Fix Clash Display loading (add to `layout.tsx` via `next/font/local`)
- 7-level scale with clear hierarchy gaps
- Body at 15px/1.65 line height — generous for dark-mode reading
- Requires rebuilding right rail for desktop density
- **Optimizes for:** Readability, comfort, nighttime phone usage
- **Effort:** 12-16 hours

### Approach C: Bold & Editorial (The Verge energy)
- Bimodal scale: either very big (28-96px) or very small (11-15px). No middle.
- Cards become editorial tiles — title IS the visual at 24-28px
- Landing hero fills 40-50% of viewport height
- **Risk:** Requires editorial-quality content. Empty cards at large type look embarrassing.
- **Optimizes for:** Brand differentiation, campus-as-media
- **Effort:** 16-20 hours

---

## 3. Motion & Animation

**Current State: 5/10 (well-designed but broken in execution)**

### Critical Findings
- **MOTION.duration bug — CRITICAL** — `MOTION.duration.fast` returns `150` (milliseconds) but Framer Motion expects seconds. Result: 150-SECOND animations. Found in 20+ files across `apps/web/src` and `packages/ui/src`.
- **Correct workaround exists but underused** — `durationSeconds` export is correct but only ~30% of files use it.
- **`ArrivalTransition` component will crash** — References `MOTION.ease.premium` and `MOTION.duration.fast`/`MOTION.duration.base` which don't exist on the current `MOTION` object.
- **Motion wrappers are neutered** — `HoverLift`, `HoverScale`, `TapScale` in `packages/ui` accept props but `void` them. Only animate opacity.
- **No deploy/publish celebration wired** — `creationPublishVariants`, `deployRippleVariants`, `GoldConfettiBurst` all defined in tokens but never triggered.
- **Page transitions too slow** — 400ms enter is noticeable. Should be 150-200ms.
- **`prefers-reduced-motion` only in ~30% of animated components**.

### Approach A: Fix & Standardize
- Codemod all `MOTION.duration` → `durationSeconds` (fixes the 1000x bug)
- Create 6 animation presets: `fadeIn`, `slideUp`, `scaleIn`, `springSnap`, `stagger`, `celebrate`
- Make `prefers-reduced-motion` universal
- Wire existing celebration animations to publish/deploy/join
- **Effort:** 10-14 hours | **Performance:** +10-20% (animations go from 150s → 0.15s)

### Approach B: View Transitions API
- Replace Framer Motion page transitions with native View Transitions (2026 baseline)
- Keep Framer Motion only for complex orchestration (HiveLab, celebrations)
- CSS animations for simple state changes
- **Effort:** 6 hours | **Performance:** +15-20% (eliminates JS overhead for nav)

### Approach C: Motion-as-Personality
- Design signature HIVE motion language (honeycomb ripples, hexagonal reveals, organic springs)
- Custom `HiveMotion` component library
- Gold glow pulses reserved for creation moments
- Generation reveal: blurred ghost → sharp reveal (photograph developing)
- **Effort:** 22-28 hours | **Risk:** Over-engineering if not disciplined

---

## 4. Shell & Navigation

**Current State: 6/10**

### Critical Findings
- **CreatePromptBar routes to deleted `/lab`** — Will 404 on every create attempt. Should route to `/build`.
- **Search button dispatches synthetic KeyboardEvent** — Nothing handles it. `⌘K` is dead.
- **Notification badge on wrong tab** — Shows on an icon that isn't the bell.
- **Active indicator is 1px invisible** — Barely visible, no spring animation on mobile.
- **z-index conflict** — `ShellCreateBar` and `MobileBottomBar` both `z-40`.
- **Hardcoded `#FFD700`** — 4 instances in AppSidebar instead of token references.

### Approach A: Polish Current
- Fix routing (`/lab` → `/build`)
- Wire `⌘K` handler (search overlay)
- Move notification badge to correct icon
- Increase active indicator to 3px with spring animation
- Fix z-index layering
- **Effort:** 6-8 hours

### Approach B: Contextual Shell
- Shell adapts to context: Build tab shows code controls, Spaces shows quick-actions
- Sidebar width responds to content (collapsed in chat, expanded in build)
- Create FAB transforms into contextual actions per surface
- **Effort:** 16-20 hours

### Approach C: Conversation-First Shell
- Kill the sidebar on mobile entirely — full-screen surfaces
- Navigation via gestures (swipe between tabs) + minimal bottom icons
- Create action embedded in every surface header, not a floating button
- **Effort:** 20-24 hours

---

## 5. Landing & Entry

**Current State: Landing 5/10 | Entry 4/10**

### Critical Findings — Landing
- **Hero is marketing copy, not product** — Spec says "the product IS the landing page." Current: headline + 2 CTAs + inert mockup. The BuildPreview is a simulation — nothing is interactive.
- **No campus detection** — "Live at UB" is hardcoded. Spec calls for IP-based "Hey, UB" personalization.
- **No non-authenticated creation** — Spec's entire thesis is: create → deploy triggers signup. Current: CTA → `/enter` immediately.
- **Social proof bar at `text-white/40`** — Nearly invisible. Stats may be zero at launch.
- **About page has better copy** — "We stopped waiting for institutions" is sharper than anything on landing.

### Critical Findings — Entry
- **7 screens (spec says 3-4)** — Email → OTP → Name → Interests → CampusLive → Create → Spaces
- **Interest picker is a 5-section survey** — Major, Greek life, housing, orgs, vibes. Estimated 45-90 seconds alone.
- **Progress dots shown** — Spec says don't show them for sub-90s flows. 6 dots visible = "I have to do 6 more things."
- **Estimated 40-50% cumulative drop-off** before entering product.
- **Total time: 2-4 minutes** (spec targets under 90 seconds including OTP).
- **Native `<select>` dropdowns in InterestPicker** — Break the visual consistency on iOS/Android.

### Approach A: Product-as-Landing (Spec Direction)
- Landing page IS Build Entry — prompt input centered, live preview right panel
- Campus detection personalizes greeting + starter chips
- "Post to UB Dorm Chat" replaces "Sign up" CTA
- Entry: 3 screens (Email → OTP → Name). Spaces optional.
- Creation persists through auth (localStorage + URL + temp Firestore)
- **Prerequisite:** Format shell system working at <2s
- **Effort:** HIGH (3-4 weeks) | **Optimizes for:** Activation (<60s to first creation)

### Approach B: Social Proof Landing
- Landing IS a read-only campus feed — "23 events at UB this week" + live ticker
- Entry: 2 screens (Email+campus → OTP+name). Pre-join top 3 spaces.
- **Prerequisite:** Real campus activity (5+ org creations + events)
- **Risk:** Dead campus = dead landing page
- **Effort:** MEDIUM-HIGH | **Optimizes for:** Conversion via FOMO

### Approach C: Story-First Landing
- Scroll-driven narrative: video/animated sequence showing a day with HIVE
- Each section is an interactive micro-demo
- Entry embedded inline at scroll threshold
- **Risk:** Requires production quality. Bad video kills it.
- **Effort:** MEDIUM | **Optimizes for:** Comprehension + emotional buy-in

### Immediate Fix (All Approaches)
- Replace "Start building" with "Join UB" on all CTAs — wrong audience signal
- Strip entry to 4 screens: Email → OTP (with ambient activity) → Name → Spaces
- Kill InterestPicker, CampusLive screen, Create screen, progress dots

---

## 6. Build Entry & Studio

**Current State: 5/10**

### Critical Findings
- **No format shells exist** — Every creation goes through 15-30s full Groq code gen. Spec targets 1-2s for common formats.
- **No split panel** — Single-column chat, no side-by-side prompt + preview.
- **No deploy-to-space** — Only "copy link." Spec's core loop is prompt → preview → deploy to space.
- **"Edit" routes to deleted `/lab/[toolId]`** — Will 404.
- **CreatePromptBar routes to `/lab`** — Also 404.

### Approach A: Chat-First (Current + Fix)
- Fix routing (`/lab` → `/build`)
- Add split panel: chat left, live preview right
- Implement format shell system (8 templates, Groq structured output)
- Add deploy-to-space flow
- **Effort:** 2-3 weeks

### Approach B: Prompt-and-Done
- Single input → instant preview (no chat history)
- Template gallery replaces chat for common formats
- Full code gen only for "Custom" option
- Fastest possible path to deployed creation
- **Effort:** 1-2 weeks

### Approach C: Template Gallery First
- Browse existing templates by category
- Each template has a "Remix" button → pre-populated prompt
- Chat is for customization, not cold-start
- **Effort:** 2 weeks

---

## 7. Space Home

**Current State: 5/10**

### Critical Findings
- **Tab bar still exists (Chat|Events|Posts|Apps)** — The exact failure mode the spec names. Spec says: kill tabs, unified stream with interactive cards.
- **Interactive card infrastructure 70% built** — `InteractiveCard` component exists. But events still route to Events tab, not inline cards.
- **No stream card types** — Spec defines 4: event, poll, tool, action. Currently: messages only in chat, everything else in tabs.
- **No Space History Line** — Spec added: "This space has been active since Jan 2025 · 47 events · 12 tools built."

### Approach A: Unified Stream (Spec Direction)
- Kill tab bar. Single scrollable stream.
- 4 card types inline: event cards (RSVP inline), poll cards (vote inline), tool cards (interact inline), action cards (structured announcements)
- Events, tools, posts all interleaved chronologically
- **Effort:** 3-4 weeks

### Approach B: Spatial Layout
- Keep chat as primary but add a persistent sidebar with pinned items
- Events, tools, announcements in sidebar cards
- Mobile: chat full-screen, sidebar as bottom sheet via `#` icon
- **Effort:** 2 weeks

### Approach C: Activity-First
- Default view is activity feed (not chat) — who joined, what was created, what happened
- Chat is a tab/mode, not the default
- Surfaces what's important without reading every message
- **Effort:** 2-3 weeks

---

## 8. Discover & Feed

**Current State: 5/10**

### Critical Findings
- **Tools filter bar above hero event** — Backwards information hierarchy. The most important content (hero event) should be first.
- **Relevance scoring computed then discarded** — `relevanceScore` calculated but always requests `sort=soonest`. Personalization is wasted work.
- **RSVP count at `text-white/20`** — 1.6:1 contrast ratio. Invisible.
- **Right rail hidden on mobile** — `hidden lg:flex`. 70%+ of users never see trending content.
- **No infinite scroll** — Loads all items at once. Memory leak risk on long scroll.

### Approach A: Feed (Fix Current)
- Move hero event above filter bar
- Wire relevance scoring to actual sort order
- Fix RSVP opacity to `text-white/70` minimum
- Add infinite scroll with virtualization
- Mobile: trending content as horizontal scroll above feed
- **Effort:** 8-12 hours

### Approach B: Dashboard
- 3-panel layout: campus events (left), trending creations (center), your spaces activity (right)
- Mobile: horizontal tabs between panels
- Dense, scannable, TV-remote browsing
- **Effort:** 2-3 weeks

### Approach C: Pulse
- Real-time activity feed — not curated, just what's happening now
- Live counters on events/polls
- "X people are looking at this" presence indicators
- **Effort:** 2-3 weeks (requires RTDB integration)

---

## 9. Creation View (Viral Surface)

**Current State: 3/10**

### Critical Findings
- **Viral funnel is dead** — Generic "Create your own" CTA at `text-white/30` opacity post-interaction. No result card, no identity hook, no participation pulse.
- **Creator attribution at `text-white/25`** — Invisible. The builder who made this gets zero credit.
- **Share button at `text-white/20`** — The most important viral action is the least visible element.
- **No ghost voting** — Non-users can't participate at all. Spec says: participate → see results → "Sign up to see who voted like you."
- **No result card** — After voting in a bracket/poll, there's no celebratory reveal of results.
- **385-line monolith** — `StandaloneToolClient.tsx` handles everything. Needs decomposition.

### Approach A: Minimal Frame
- Fix opacities (share/creator to `text-white/80`+)
- Add ghost voting (Firebase Anonymous Auth → merge on signup)
- Add result card after interaction
- Identity hook: "Sign up to see who else voted X"
- **Effort:** 1-2 weeks

### Approach B: Social Wrapper
- Full social context around the creation: who made it, who participated, trending reactions
- Real-time participation pulse ("14 people voting right now")
- Post-interaction: result + friend overlay + signup gate
- **Effort:** 2-3 weeks

### Approach C: Full-Screen Takeover
- Creation fills entire viewport — no chrome, no header, pure interaction
- After interaction: cinematic result reveal + social context slides in
- Share is native (`navigator.share()`) not a copy-link button
- **Effort:** 2-3 weeks

---

## 10. Profile & Social

**Current State: 5/10**

### Critical Findings
- **No Remix button** on any creation card. Spec's key viral mechanic.
- **Impact line buried** — 13px at `text-white/40` below hero. Should be inside hero, prominent.
- **"Currently building" status doesn't exist** — Spec calls for it on Profile + cross-surface visibility.
- **No mutual context** — "Also in UB Gaming, CS 101 study group" banner doesn't exist.
- **Social graph is 4/10** — Built but disconnected. Nothing surfaces friend signals.

### Approach A: Builder Portfolio
- Impact line prominent in hero: "Built 3 tools used by 47 students"
- Creation cards get Remix button + usage sparkline
- Mutual spaces shown in context banner
- **Effort:** 1-2 weeks

### Approach B: Social Identity
- Friend connections front and center
- Activity feed of what this person has been doing
- Mutual context is the hero element
- **Effort:** 2-3 weeks (requires social graph fixes)

### Approach C: Living Card
- Profile is a single shareable card (like a link preview)
- Shows name, impact line, top 3 creations, mutual context
- Shareable as an image (OG generation)
- **Effort:** 1-2 weeks

---

## 11. Mobile & PWA

**Current State: 6/10**

### Critical Findings
- **No install prompt** — `beforeinstallprompt` never intercepted. Users don't know they can install.
- **`start_url: '/'`** — Installed users cold-launch to marketing page. Should be `/discover`.
- **SVG-only icons** — iOS Safari doesn't render SVG from manifest. No PNG `apple-touch-icon`.
- **No iOS splash screens** — Cold launch shows white/black flash.
- **Bottom nav touch targets 38px** — Below 44px WCAG/Apple HIG minimum.
- **Swipe-back gesture broken** — iOS Safari swipe-back doesn't work in `standalone` mode. No replacement implemented.
- **No pull-to-refresh** on any feed.
- **No top safe area handling** — Content underlaps notch/Dynamic Island.
- **Page transition `mode="wait"`** — Brief black flash between routes.
- **`skipWaiting()` on SW install** — Can break mid-session for active users.

### Approach A: Native-Feel PWA
- Fix manifest (`start_url: '/discover'`, PNG icons, splash screens)
- Increase bottom nav to 48px targets
- Add swipe-back via Framer Motion `drag` on `PageTransition`
- Switch transitions to `mode="sync"` with directional awareness
- Add `navigator.vibrate()` haptics on key actions
- Add install prompt after 3rd action
- **Effort:** 2-3 weeks | **Optimizes for:** Native feel without native code

### Approach B: Mobile-Only Design
- Full redesign for phone — swipe between tabs, bottom sheets for everything
- No split panels on mobile — full-screen surfaces
- Pull-to-create gesture on Build tab
- Long-press context menus
- Shared element transitions via `layoutId`
- **Effort:** 6-8 weeks | **Risk:** Diverges from desktop codebase

### Approach C: Progressive Enhancement
- Same components adapt via container queries (not viewport media queries)
- Bottom sheets replace modals on mobile
- Swipeable cards on discover feeds
- Install prompt after value moment
- `⌘K` on desktop, gesture nav on mobile
- **Effort:** 2-3 weeks | **Optimizes for:** Single codebase, minimal maintenance

---

## 12. Empty States & Error States

**Current State: 6/10**

### Critical Findings

| Surface | Empty State | Loading | Error | Rating |
|---|---|---|---|---|
| Spaces hub (first visit) | Great onboarding modal | Proper Framer Motion skeleton | **Silently fails** (catch swallows) | 6/10 |
| Space chat | **2 lines of text — worst in product** | Spinner (no skeleton) | No error UI | 2/10 |
| Space events (non-leader) | No CTA for members | Good skeleton | Inline error | 4/10 |
| Build (new user) | Chat IS the empty state (good) | Skeleton grid | Broken CTA → `/lab/create` (404) | 7/10 |
| Discover | Not seen at detail level | animate-pulse | Retry only | 5/10 |
| Events page | Has CTA and reason | **No loading.tsx** | Retry only | 5/10 |
| Profile | Green-tinted builder card | 4-zone skeleton (thorough) | Clear states | 8/10 |
| Notifications | 3 variants, right CTAs | Shape-accurate skeleton | — | 8/10 |

### Approach A: Systematic Coverage
- Shared `EmptyStateCard` component with 4 variants: `new`, `no_results`, `no_data`, `error_retry`
- Each variant: icon + title + subtitle + CTA + motion
- Every surface gets all 3 states (empty/loading/error)
- **Effort:** 2-3 days | **Optimizes for:** Consistency, scalability

### Approach B: Empty States as Onboarding
- Every empty state teaches something: "No creations yet" → "Build a bracket in 10 seconds" with inline template preview
- Ghost previews show what populated state looks like
- Track which empty states convert to actions (analytics)
- **Effort:** 3-5 days | **Optimizes for:** Activation, education

### Approach C: Alive by Default
- Pre-populate every surface with campus content. Students never see blank.
- Events: show all UB events, not just user's spaces
- Build: show campus apps for new users, creation prompt secondary
- Chat: auto-send welcome message on join
- Notifications: seed with "Welcome to HIVE at UB" notification
- **Effort:** 4-6 days | **Optimizes for:** Perception of life, retention

---

## Recommended Implementation Order

### Week 1: Critical Bugs (All Approaches Need These)
1. Fix `MOTION.duration` bug (codemod `MOTION.duration` → `durationSeconds`) — 2-3 hours
2. Fix WCAG opacity violations (`text-white/30` → `text-white/50` minimum) — 4 hours
3. Fix CreatePromptBar routing (`/lab` → `/build`) — 30 minutes
4. Fix Build error boundary CTA (`/lab/create` → `/build`) — 30 minutes
5. Fix Clash Display font loading — 1 hour
6. Call `generateCSSVariables()` in root layout — 1 hour
7. Fix `start_url` in manifest.json → `/discover` — 5 minutes
8. Fix `ArrivalTransition` property name crashes — 1 hour

### Week 2: Entry Flow + Shell
1. Strip entry to 4 screens (kill InterestPicker, CampusLive, Create, progress dots)
2. Fix shell: wire ⌘K, move notification badge, fix z-index
3. Bottom nav touch targets → 48px
4. Space chat empty state → invite-to-type pattern
5. Add PNG apple-touch-icon + splash screens

### Week 3-4: Core Surfaces
1. Build Entry: split panel + format shell system + deploy-to-space
2. Landing: interactive prompt (Approach A) or strip to essentials
3. Discover: fix hierarchy (hero above filters), wire relevance scoring, add grid
4. Creation View: ghost voting + result card + identity hook

### Week 5-6: Polish & Mobile
1. Space Home: unified stream (kill tab bar) or spatial layout
2. Profile: impact line in hero, Remix buttons, mutual context
3. Motion: wire celebrations, reduce page transition to 180ms, View Transitions API
4. PWA: install prompt, swipe-back, haptics

### Week 7: Growth
1. Social graph signals across surfaces (friend presence on cards)
2. Pre-populated empty states (campus content everywhere)
3. Notifications: push notifications via FCM
4. About page copy → landing page

---

## Approach Recommendations by Domain

| Domain | Recommended | Rationale |
|---|---|---|
| Design System | **A then B** | Fix critical bugs first, then semantic system |
| Typography | **A** (Tight & Dense) | Students scan, don't read. Fix contrast, tighten cards. |
| Motion | **A then B** | Fix the bug (hours), then View Transitions (days) |
| Shell | **A** (Polish Current) | Ship fixes, not a redesign |
| Landing | **A** (Product-as-Landing) | Spec direction. Prerequisite: format shells. |
| Entry | **Strip to 4 screens** | Non-negotiable. 40-50% drop-off is fatal. |
| Build Entry | **A** (Chat-First + Fix) | Format shells + split panel + deploy |
| Space Home | **A** (Unified Stream) | Spec direction. Kill tabs. |
| Discover | **A** (Fix Current) | Hero above filters, wire scoring, add grid |
| Creation View | **A** (Minimal Frame) | Ghost voting + result card = viral loop |
| Profile | **A** (Builder Portfolio) | Impact line + Remix = growth mechanics |
| Mobile | **C then A** | Progressive enhancement first, native feel second |
| Empty States | **A + C hybrid** | Systematic component + pre-populate campus data |

---

## Key Decision Points

These are the 5 architectural decisions that shape everything else:

1. **Format shell system** — Pre-built templates vs full code gen. Unblocks Build Entry, Landing, Creation View. This is the critical path.

2. **Space Home: tabs vs stream** — Kill the tab bar (unified stream) or keep it (spatial layout). Affects every space interaction.

3. **Landing: product vs marketing** — Interactive prompt (Approach A) or social proof (Approach B). Determines the entire acquisition funnel.

4. **Motion: fix vs redesign** — Fix the duration bug and ship (Approach A) or invest in signature motion language (Approach C). Ship speed vs brand differentiation.

5. **Mobile: progressive vs native-feel** — Same components adapt (Approach C) or separate mobile design (Approach B). Maintenance cost vs UX quality.
