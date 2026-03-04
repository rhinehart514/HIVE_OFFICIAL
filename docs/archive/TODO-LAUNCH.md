# HIVE Launch TODO

> **Source of truth for launch status:** `docs/KNOWN_STATE.md`
> **Source of truth for launch UX:** `docs/LAUNCH-IA.md`
>
> This doc is split into two sections:
> - **Part A — LAUNCH BLOCKERS:** Things that must ship before any real user touches the product. Sourced from KNOWN_STATE.md.
> - **Part B — DESIGN DEBT BACKLOG:** The 1,400+ design system violations and dead code. Real debt, not launch blockers.

---

## PART A — LAUNCH BLOCKERS
_As of Feb 22 2026. Fix these before shipping to real users._

### #1 Events feed: images + space links missing
**Route:** `apps/web/src/app/api/events/personalized/route.ts`
- `coverImageUrl` reads `event.coverImageUrl` but Firestore field is `event.imageUrl`. Fix: `(event.imageUrl || event.coverImageUrl)`.
- `spaceHandle` reads `event.spaceHandle` which doesn't exist. Fix: batch-resolve from `spaces` collection via `Promise.allSettled`.

### #2 Space events returning 0
**Route:** `apps/web/src/app/api/events/route.ts` → `fetchDocsForTimeField`
- Passes `Date` objects to `where('startDate', '>=', now)`. Fix: use `now.toISOString()` when `dateField === 'startDate'`.

### #3 Auth flow — not validated end-to-end
- Last validated ~Feb 14. Need to walk the full flow as a new UB student (email → OTP → onboarding → discover).

### #4 Profile black screen
- Page loads then goes black. Cause not yet diagnosed. See `apps/web/src/app/u/[handle]/ProfilePageContent.tsx` (731 lines).

### #5 7-day account age gate on space creation
**File:** `apps/web/src/app/api/spaces/route.ts:167`
- New users cannot create a space until account is 7 days old. Kills first-session activation.
- Fix: remove the age check. Keep email verification + daily limit of 3.

### #7 Gathering threshold blocks all chat
**File:** `packages/core/src/domain/spaces/aggregates/enhanced-space.ts:100`
- `DEFAULT_ACTIVATION_THRESHOLD = 10` → change to `1`
- With 0 members across all spaces, every space is in "gathering" state. Chat never opens. One-liner.

### #6 Events nav tab in sidebar
**Files:** `apps/web/src/lib/navigation.ts` + `apps/web/src/components/shell/AppSidebar.tsx`
- Events is not a nav tab. It's content inside Feed. Remove the Events entry from both files.
- LAUNCH-IA.md LOCKED DECISION: "Events surface through Feed + Spaces — no dedicated nav tab."

---

## PART B — DESIGN DEBT BACKLOG
_Originally targeted Feb 14. Still valid debt but NOT launch blockers. Ship the product first._
_Design spec: cold/minimal. #000 base, #FFD700 action-only, white + white/50 text, rounded-full pills._

---

## 1. DEAD CODE CLEANUP

Files that are unused, orphaned, or superseded. Delete all.

### Dead Routes
- [ ] `app/home/page.tsx` — redirect only, 24 lines
- [ ] `app/feed/page.tsx` — redirect only, 24 lines
- [ ] `app/feed/coming-soon.tsx` — dead
- [ ] `app/feed/components/DensityToggle.tsx` — dead
- [ ] `app/feed/components/FeedEmptyState.tsx` — uses GlassSurface
- [ ] `app/feed/hooks/useFeedDensity.ts` — dead
- [ ] `app/feed/settings/` — dead (whole folder)
- [ ] `app/feed/layout.tsx` — dead
- [ ] `app/settings/page.tsx` — redirect to /me/settings
- [ ] `app/profile/[id]/` — redirect to /u/[handle] (whole folder, 13 files)
- [ ] `app/login/page.tsx` — 401 lines, uses old Entry.tsx + ConfettiBurst, superseded by /enter

### Dead Components
- [ ] `components/entry/Entry.tsx` — 201 lines, old 4-phase entry, not imported anywhere
- [ ] `components/entry/screens/CrossingScreen.tsx` — old entry screen
- [ ] `components/entry/screens/FieldScreen.tsx` — old entry screen
- [ ] `components/entry/screens/GateScreen.tsx` — old entry screen
- [ ] `components/entry/screens/NamingScreen.tsx` — old entry screen
- [ ] `components/entry/primitives/GoldFlash.tsx` — ceremonial
- [ ] `components/entry/primitives/ManifestoLine.tsx` — ceremonial
- [ ] `components/entry/primitives/VerificationPending.tsx` — old flow
- [ ] `components/entry/primitives/StepCounter.tsx` — old flow
- [ ] `components/entry/motion/ConfettiBurst.tsx` — ceremonial
- [ ] `components/entry/motion/GoldCheckmark.tsx` — ceremonial
- [ ] `components/entry/motion/variants.ts` — old motion
- [ ] `components/entry/motion/morph-transition.ts` — old motion
- [ ] `components/entry/states/EmailState.tsx` — old state (only used by dead /login)
- [ ] `components/entry/states/CodeState.tsx` — old state (only used by dead /login)
- [ ] `components/spaces/boards-sidebar.tsx` — 609 lines, not imported
- [ ] `components/spaces/crossing-ceremony.tsx` — 0 lines or dead
- [ ] `components/spaces/motion/warmth-glow.tsx` — warmth system leftover
- [ ] `components/spaces/motion/welcome-card.tsx` — only used by crossing-ceremony
- [ ] `components/spaces/UnlockCelebration.tsx` — 177 lines, not imported by active code
- [ ] `components/spaces/onboarding-overlay.tsx` — 481 lines, check if imported
- [ ] `components/spaces/new-user-layout.tsx` — 202 lines, check if used
- [ ] `components/spaces/returning-user-layout.tsx` — 186 lines, check if used
- [ ] `components/spaces/territory-header.tsx` — 106 lines, check if used
- [ ] `components/spaces/identity-cards.tsx` — 398 lines, only type imported by identity-claim-modal
- [ ] `components/spaces/panels/resources-panel.tsx` — resources were deleted
- [ ] `components/spaces/panels/leader-onboarding-panel.tsx` — check if used
- [ ] `app/spaces/components/motion/warmth-glow.tsx` — warmth leftover
- [ ] `app/spaces/components/hub-active.tsx` — 85 lines, uses space-orbit
- [ ] `app/spaces/components/space-orbit.tsx` — 398 lines, old visual

### Dead Primitives (packages/ui)
- [ ] `primitives/motion/Glass.tsx` — glass effects, violates spec
- [ ] `primitives/motion/BorderGlow.tsx` — glow effects
- [ ] `primitives/motion/Gradient.tsx` — gradient effects
- [ ] `primitives/WarmthDots.tsx` — warmth system
- [ ] `primitives/ConnectionStrengthIndicator.tsx` — check usage
- [ ] `primitives/ActivityHeartbeat.tsx` — check usage (AI-ish?)

### Verify Before Deleting
- [ ] `components/landing/ProductMock.tsx` — uses Tilt, CursorGlow, Stagger (all violations). Currently imported?
- [ ] `components/landing/AnimatedCounter.tsx` — counter animation. Used on landing?
- [ ] `components/landing/WaitlistModal.tsx` — still needed for non-UB schools?

---

## 2. GLOBAL DESIGN SYSTEM VIOLATIONS

Mechanical find-and-replace across entire `apps/web/src/`.

### Opacity Tiers (703 instances)
Replace all non-canonical white opacities with the 2-tier system:
- [ ] `white/[0.02]` → `white/[0.04]` (use `--bg-subtle`)
- [ ] `white/[0.03]` → `white/[0.04]` (use `--bg-subtle`)
- [ ] `white/[0.04]` → keep (= `--bg-subtle`)
- [ ] `white/[0.06]` → keep for borders (= `--border-subtle`)
- [ ] `white/[0.08]` → `white/[0.06]` or `white/10`
- [ ] `white/[0.10]` → `white/10`
- [ ] `white/[0.12]` → `white/10`
- [ ] `white/[0.14]` → `white/10`
- [ ] `white/5` → `white/[0.04]`
- [ ] `white/60` → `white/50` (text secondary is 0.50)
- [ ] `white/70` → `white` or `white/50`
- [ ] `white/40` → `white/50` (collapse to 2-tier)
- [ ] `white/30` → `white/50` or `white/25` (use `--text-muted`)
- [ ] `white/20` → `white/50` for text, keep for separators
- [ ] `white/90` → `white`

### Border Radius (359 instances)
- [ ] `rounded-xl` → `rounded-lg` (12px for cards/inputs) or `rounded-full` (pills for buttons)
- [ ] `rounded-2xl` → `rounded-lg` or `rounded-full`
- [ ] `rounded-3xl` → `rounded-full`

### Animations (199 instances, excluding loading.tsx)
- [ ] Kill all `animate-pulse` except loading skeletons
- [ ] Kill all `backdrop-blur-sm` / `backdrop-blur`
- [ ] Kill all `animate-bounce`
- [ ] Replace loading `animate-spin` → keep (functional)

### Gradients (82 instances)
- [ ] Kill `bg-gradient-to-*` on cards and surfaces
- [ ] Kill `from-` / `to-` / `via-` gradient classes
- [ ] Keep only: gradient masks for scroll fade, header scroll indicator

### Hover Effects (49 instances)
- [ ] Kill `hover:scale-*` everywhere
- [ ] Kill `shadow-lg`, `shadow-xl`, `shadow-2xl`
- [ ] Kill `drop-shadow-*`
- [ ] Replace hover states with `hover:bg-white/[0.06]` (consistent interactive)

### Warm Colors (13 instances)
- [ ] `bg-zinc-*` → `bg-black` or `var(--bg-surface)`
- [ ] `text-zinc-*` → `text-white` or `text-white/50`
- [ ] `bg-gray-*` → canonical tokens
- [ ] `text-gray-*` → canonical tokens

### GlassSurface Usage (11 files)
- [ ] Replace all `GlassSurface` imports with `Card` or plain div + canonical tokens
- [ ] Files: explore/SpaceCard, SpaceGrid, EventList, PeopleGrid, ToolGallery, GhostSpaceCard, FeedEmptyState, tools-feed, builder/AccessOption, builder/TemplateCard, explore page

### Tilt/CursorGlow Usage (16 files)
- [ ] Remove all `Tilt`, `CursorGlow`, `FadeUp`, `Stagger` from non-landing pages
- [ ] Replace with static layout or simple opacity transition

---

## 3. SURFACE-BY-SURFACE DESIGN PASS

### 3A. Landing Page (`/` + `components/landing/`)
- [ ] `HeroSection.tsx` — mostly clean. Fix: `white/60` → `white/50` in subhead
- [ ] `ProductSection.tsx` — violations: `rounded-2xl`, `bg-zinc-900/50`, `border-white/10`, motion whileInView, `motion.div` stagger. Rewrite cards as flat static `Card` components.
- [ ] `CTASection.tsx` — violations: motion whileInView. Replace with static or CSS-only fade.
- [ ] `LandingHeader.tsx` — violations: inline `rgba` styles for border. Use CSS vars.
- [ ] `LandingFooter.tsx` — clean (uses Footer primitive)
- [ ] `ProductMock.tsx` — full of violations (Tilt, CursorGlow, GlassSurface, stagger, shadow-2xl). **Delete or rebuild from scratch** as a simple static screenshot/mockup.
- [ ] `WaitlistModal.tsx` — violations: `rounded-2xl`, `white/[0.03]`, `rounded-xl`, `scale(0.95)` animation. Fix all.
- [ ] `AnimatedCounter.tsx` — counter animation is fine functionally but audit if used.
- [ ] Fix metadata: "Campus Social Platform" → match current positioning
- [ ] Fix OG description

### 3B. Entry Flow (`/enter` + `components/entry/`)
- [ ] `EntryShell.tsx` — violations: `NoiseOverlay`, ambient glow with GOLD radial gradients, `backdrop-blur-sm` on loading overlay, `animate-spin` with gold pulse, `lineDrawVariants` gradient line. Strip all decorative motion. Keep structure.
- [ ] `EntryFlowV2.tsx` — audit for violations (512 lines)
- [ ] `components/entry/motion/constants.ts` — GOLD glow constants, `EASE_PREMIUM`. Keep easing, kill gold glow config.
- [ ] `EntryShell` loading overlay: kill `backdrop-blur-sm`, kill opacity pulse animation on spinner
- [ ] Kill `entryTone` / celebration / anticipation glow system — just render flat black bg

### 3C. App Shell (`components/shell/`)
- [ ] `AppShell.tsx` — violations: `border-white/[0.06]`, `bg-black/95`, `hover:bg-white/[0.06]`. Minor fixes. Mostly clean.
- [ ] `AppSidebar.tsx` (438 lines) — full audit needed. Check for hover effects, opacity tiers, radius.
- [ ] `GlobalFAB.tsx` (300 lines) — audit: check overlap with LeaderCreateFAB. Both exist. Clarify: one global FAB or two separate ones?

### 3D. Discover (`/discover`)
- [ ] 511 lines. Full audit: uses animate-pulse, backdrop-blur. Heavy page. Check all card styles.

### 3E. Spaces Hub (`/spaces`)
- [ ] `spaces-hub.tsx` (191 lines) — uses hub-active, which uses space-orbit (dead visual?)
- [ ] `SpacesHQ.tsx` (536 lines) — uses IdentityRow, OrganizationsPanel, fadeInUpVariants
- [ ] `IdentityRow.tsx` (245 lines) — gradients, shadows
- [ ] `OrganizationsPanel.tsx` — audit
- [ ] Consolidate: do we need both `spaces-hub.tsx` and `SpacesHQ.tsx`?

### 3F. Space View (`/s/[handle]/`) — 10,078 lines across 35 files
- [ ] `page.tsx` (1230 lines) — large orchestrator. Audit motion imports, AnimatePresence usage.
- [ ] `space-header.tsx` (486 lines) — full audit: health badge, online indicator, social links
- [ ] `space-sidebar.tsx` (89 lines) — probably clean, verify
- [ ] `space-layout.tsx` (185 lines) — audit backdrop-blur usage
- [ ] `space-threshold.tsx` (146 lines) — violations: `rounded-xl` (should be `rounded-lg`), `white/[0.02]`, `white/[0.06]`. Fix opacity tiers + radius.
- [ ] `leader-create-fab.tsx` (195 lines) — reviewed: actually clean! `white/[0.08]` and `white/[0.12]` need fixing. No gradients/shadows despite earlier notes.
- [ ] `chat-input.tsx` (389 lines) — audit all styles
- [ ] `chat-messages.tsx` (387 lines) — audit
- [ ] `main-content.tsx` — audit
- [ ] `feed/message-item.tsx` (454 lines) — audit: hover actions, reaction styles
- [ ] `feed/message-feed.tsx` (328 lines) — audit: animate-pulse, unread divider
- [ ] `feed/event-card.tsx` (250 lines) — hover effects, shadows
- [ ] `feed/tool-card.tsx` — hover effects
- [ ] `feed/thread-panel.tsx` (302 lines) — backdrop-blur likely
- [ ] `feed/typing-indicator.tsx` — animate-pulse likely
- [ ] `feed/unread-divider.tsx` — audit
- [ ] `sidebar/events-list.tsx` — audit hover effects
- [ ] `sidebar/tools-list.tsx` — audit: animate-pulse
- [ ] `sidebar/members-preview.tsx` — audit hover effects
- [ ] `events-tab.tsx` — hover effects, shadows
- [ ] `leader-dashboard.tsx` (344 lines) — audit
- [ ] `analytics-panel.tsx` (427 lines) — gradients, pulse
- [ ] `member-management.tsx` (903 lines) — large, audit
- [ ] `members-list.tsx` (340 lines) — audit
- [ ] `moderation-panel.tsx` (535 lines) — audit
- [ ] `search-overlay.tsx` (229 lines) — backdrop-blur
- [ ] `space-info-drawer.tsx` (346 lines) — audit
- [ ] `space-settings.tsx` (1978 lines) — massive. Full audit. Wrong opacity tiers throughout.
- [ ] `space-tabs.tsx` — audit (may be dead since chat-only view)
- [ ] `tools-feed.tsx` (219 lines) — uses GlassSurface
- [ ] `residence/residence-header.tsx` (256 lines) — warmth/ceremony references
- [ ] `residence/residence-view.tsx` (232 lines) — Tilt, warmth references

### 3G. Lab / HiveLab (`/lab` + `/hivelab` + `components/hivelab/`)
- [ ] `app/hivelab/page.tsx` — redirect to /lab, clean
- [ ] `app/lab/page.tsx` — large (uses Stagger, FadeUp, motion variants). Full reskin.
- [ ] `app/lab/new/page.tsx` — audit
- [ ] `app/lab/create/page.tsx` — audit
- [ ] `app/lab/[toolId]/page.tsx` — gradients, pulse, shadows
- [ ] `app/lab/[toolId]/components/ai-input-bar.tsx` — gradients
- [ ] `app/lab/[toolId]/components/analytics-panel.tsx` — gradients, shadows
- [ ] `app/lab/[toolId]/components/deploy-dropdown.tsx` — pulse, shadows
- [ ] `app/lab/[toolId]/components/element-popover.tsx` — shadows
- [ ] `app/lab/[toolId]/components/quick-elements.tsx` — shadows, radius
- [ ] `app/lab/[toolId]/components/studio-header.tsx` — audit
- [ ] `app/lab/[toolId]/components/tool-settings-modal.tsx` — pulse
- [ ] `app/lab/[toolId]/components/deploy-success-toast.tsx` — radius
- [ ] `app/lab/[toolId]/components/automation-awareness-panel.tsx` — radius
- [ ] `app/lab/templates/page.tsx` — gradients, Tilt
- [ ] `app/lab/setups/` — multiple pages, all need audit
- [ ] `components/hivelab/FeedbackModal.tsx` (280 lines) — audit
- [ ] `components/hivelab/FocusedToolEditor.tsx` (253 lines) — audit
- [ ] `components/hivelab/InlineCreate.tsx` (216 lines) — gradients
- [ ] `components/hivelab/conversational/ConversationalCreator.tsx` (405 lines) — gradients
- [ ] `components/hivelab/conversational/PromptHero.tsx` (185 lines) — audit
- [ ] `components/hivelab/conversational/StreamingPreview.tsx` (304 lines) — audit
- [ ] `components/hivelab/dashboard/BuilderLevel.tsx` (132 lines) — pulse
- [ ] `components/hivelab/dashboard/ToolCard.tsx` (290 lines) — hover effects
- [ ] `components/hivelab/dashboard/QuickStartChips.tsx` (197 lines) — audit

### 3H. Tool Pages (`/t/[toolId]`)
- [ ] `StandaloneToolClient.tsx` (379 lines) — audit

### 3I. Profile (`/u/[handle]` + `/me`)
- [ ] `app/u/[handle]/ProfilePageContent.tsx` (731 lines) — Tilt, FadeUp, audit all
- [ ] `app/me/settings/page.tsx` (531 lines) — wrong opacity tiers (0.02/0.04/0.06/0.08)
- [ ] `app/me/notifications/page.tsx` (334 lines) — audit
- [ ] `app/me/connections/page.tsx` (839 lines) — large, audit
- [ ] `app/me/calendar/page.tsx` (327 lines) — audit
- [ ] `app/me/edit/page.tsx` (36 lines) — probably redirect, clean

### 3J. Settings (old settings components, still used by /me/settings)
- [ ] `settings/components/account-section.tsx` — wrong opacity tiers (0.08, 0.06 throughout)
- [ ] `settings/components/profile-section.tsx` — wrong opacity tiers
- [ ] `settings/components/interests-section.tsx` — wrong opacity tiers
- [ ] `settings/components/privacy-section.tsx` — wrong opacity tiers (0.02, 0.04, 0.06)
- [ ] `settings/components/notification-sections.tsx` — wrong opacity tiers, wrong radius
- [ ] `settings/components/ui-primitives.tsx` — wrong opacity tiers (0.02, 0.04, 0.06, 0.08)
- [ ] `settings/components/completion-card.tsx` — audit

### 3K. Explore (`/explore`)
- [ ] 500+ lines. Uses framer-motion AnimatePresence, multiple sections. Full audit.
- [ ] Overlaps with `/discover` — consolidate or keep both?

### 3L. Notifications (`/notifications`)
- [ ] `page.tsx` (14 lines) — probably redirect
- [ ] `settings/` — audit if used

### 3M. Calendar (`/calendar`)
- [ ] `page.tsx` (14 lines) — probably redirect
- [ ] `components/calendar/calendar-components.tsx` — gradients

### 3N. Templates (`/templates`)
- [ ] `page.tsx` (558 lines) — uses Heroicons, GlassSurface likely. Full audit.

### 3O. Leaders (`/leaders`)
- [ ] `page.tsx` (377 lines) — audit

### 3P. Schools (`/schools`)
- [ ] `page.tsx` (8 lines) — minimal
- [ ] `components/school-search.tsx` — pulse

### 3Q. About (`/about`)
- [ ] `page.tsx` (966 lines) — large page, uses Tilt/FadeUp/gradients. Full reskin.

### 3R. DM System (`components/dm/`)
- [ ] `DMPanel.tsx` (253 lines) — pulse, gradients
- [ ] `DMConversationList.tsx` (133 lines) — audit
- [ ] `DMMessageInput.tsx` (108 lines) — gradients

### 3S. Shared Components
- [ ] `components/spaces/SpaceClaimModal.tsx` (599 lines) — audit
- [ ] `components/spaces/SpaceCreationModal.tsx` (391 lines) — audit
- [ ] `components/spaces/SpaceJoinModal.tsx` (343 lines) — audit
- [ ] `components/spaces/identity-claim-modal.tsx` (412 lines) — audit
- [ ] `components/spaces/invite-link-modal.tsx` — used by space-settings
- [ ] `components/spaces/sidebar-tool-card.tsx` — audit
- [ ] `components/spaces/sidebar-tool-section.tsx` — audit
- [ ] `components/spaces/space-list-row.tsx` — audit
- [ ] `components/spaces/space-preview-modal.tsx` — used by discover-section
- [ ] `components/spaces/homebase-activity-feed.tsx` (354 lines) — audit
- [ ] `components/spaces/unified-activity-feed.tsx` (739 lines) — audit
- [ ] `components/spaces/discover-section.tsx` (618 lines) — audit
- [ ] `components/spaces/MajorSpaceCard.tsx` (204 lines) — audit
- [ ] `components/spaces/space-quick-actions.tsx` (183 lines) — audit
- [ ] `components/explore/` — all 6 files use GlassSurface, Tilt. Full reskin.
- [ ] `components/spaces/builder/` — AccessOption, TemplateCard use GlassSurface, Tilt
- [ ] `components/notifications/hive-notification-bell.tsx` — pulse
- [ ] `components/feedback-toast.tsx` — pulse
- [ ] `components/offline-status-bar.tsx` — pulse
- [ ] `components/share/ShareButton.tsx` — pulse
- [ ] `components/privacy/GhostModeModal.tsx` — pulse
- [ ] `components/pwa/install-banner.tsx` — audit
- [ ] `components/pwa/push-prompt.tsx` — audit
- [ ] `components/auth-guard.tsx` — pulse
- [ ] `components/error-boundary.tsx` — gradients

### 3T. Loading States (all `loading.tsx` files)
- [ ] Most use `animate-pulse` or `animate-spin` — acceptable for loading skeletons
- [ ] Audit for wrong radius/opacity tiers in skeleton shapes

---

## 4. STRUCTURAL / IA DECISIONS

- [ ] **Resolve `/explore` vs `/discover` overlap** — pick one, redirect or delete the other
- [ ] **Resolve `/spaces` page** — is this the hub, or does `/discover` replace it? `spaces-hub.tsx` vs `SpacesHQ.tsx` both exist.
- [ ] **Resolve GlobalFAB vs LeaderCreateFAB** — one global FAB, or different FABs per context?
- [ ] **Resolve `space-tabs.tsx`** — still used, or dead since chat-only view?
- [ ] **Resolve `residence-header.tsx` + `residence-view.tsx`** — used? Or superseded by main space-header?

---

## 5. FUNCTIONAL WORK (features, not styling)

### Must Have for Friday
- [ ] **RSS events in spaces** — `fetchRSSFeed()` returns mock data. Wire to real UB data already in Firebase.
- [ ] **Claiming flow UI** — "Claim This Space" button on unclaimed spaces. Backend `claim/route.ts` exists. `SpaceClaimModal.tsx` exists (599 lines). Wire it.
- [ ] **Leader FAB handlers** — `onCreateEvent`, `onAddTool`, `onCreateAnnouncement` need real wiring in `page.tsx`
- [ ] **/poll slash command working e2e** — verify: type `/poll`, submit, renders inline, others can vote
- [ ] **Events in sidebar** — `sidebar/events-list.tsx` exists but needs data from Firebase + RSS
- [ ] **End-to-end user journey test** — landing → enter → discover → join space → chat → slash command → share

### Should Have
- [ ] **Transfer ownership UI** — API exists (`transfer-ownership/route.ts`), needs dropdown wiring
- [ ] **Space seeding verification** — confirm 11 UB spaces show up on discover page
- [ ] **Wire `sidebar/tools-list.tsx`** to real deployed tools data
- [ ] **Wire `sidebar/members-preview.tsx`** to real member data
- [ ] **OG images working** for `/t/[toolId]` share links

### Nice to Have
- [ ] DM system working
- [ ] Notifications page populated
- [ ] Calendar integration
- [ ] Profile bento grid
- [ ] Template gallery polished

---

## 6. METADATA / SEO

- [ ] Root layout: "Campus Social Platform" → update to match current positioning
- [ ] Landing page OG: update title/description
- [ ] All route metadata: audit for stale descriptions
- [ ] Favicon / apple-icon verified

---

## 7. PERFORMANCE

- [ ] `space-settings.tsx` is 1978 lines — consider splitting
- [ ] `member-management.tsx` is 903 lines — consider splitting
- [ ] `connections/page.tsx` is 839 lines — heavy for a profile page
- [ ] Space page.tsx is 1230 lines with many dynamic imports — verify bundle splitting works

---

## EXECUTION ORDER (suggested)

**Day 1 (Mon night):** Dead code cleanup (#1) — fast wins, reduce surface area
**Day 2 (Tue):** Global violations (#2) — mechanical find-replace across 1400+ instances
**Day 3 (Wed):** Critical surfaces (#3A-3F) — landing, entry, shell, discover, spaces, space view
**Day 4 (Thu):** Functional work (#5) — RSS, claiming, FAB wiring, e2e test
**Day 5 (Fri):** Remaining surfaces (#3G-3T) + deploy + 5 users

---

*Generated: Feb 9, 2026 — 28 routes, 10,078 lines in space view alone, ~1,400 design violations*
