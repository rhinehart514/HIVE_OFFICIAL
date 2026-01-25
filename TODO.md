# HIVE TODO — Platform Build + System Health

**Updated:** January 25, 2026
**Mode:** GTM Sprint
**Goal:** Infrastructure-grade platform ready for campus deployment

---

## Status Dashboard

| System | Health | Notes |
|--------|--------|-------|
| **Design System** | 7/10 | 96 primitives, 114 components, CSS variable mismatch |
| **Feed** | C+ | Shell exists, no data binding, hardcoded typography |
| **Spaces** | B- | Functional, inline gradients, typography issues |
| **Explore** | B | Good state coverage, typography hardcoded |
| **Profile** | C | Redirect only, minimal actual UI |
| **/about** | A | Reference standard |

### Audit Scores by Category

| Category | Score | Blockers |
|----------|-------|----------|
| Token Compliance | 5/10 | CSS vars don't match token defs, 64 hardcoded gold values |
| Typography | 4/10 | `text-[Npx]` throughout all product pages |
| State Coverage | 6/10 | Empty states good, loading/error inconsistent |
| Motion | 8/10 | MOTION tokens used well, consistent easing |
| Layout | 7/10 | Spacing mostly correct, some drift |

---

## P0: Ship Blockers

**Must fix before any GTM deployment. These break trust or function.**

### CSS Variable Mismatch
Primitives reference CSS variables that don't exist in the token definitions.

- [ ] **Audit Text/Heading/Button primitives** — map all `var(--font-size-*)` references
- [ ] **Create missing CSS variables** or update primitives to use correct tokens
- [ ] **Verify cascade** — tokens → CSS vars → component usage
- [ ] **Add token validation test** — CI should catch var mismatches

**Files:** `packages/ui/src/design-system/primitives/typography/`

### Unified Loading State Pattern
Mix of spinners and skeletons with no standard. Loading states communicate system health.

- [ ] **Create LoadingState primitive** — skeleton-first approach
- [ ] **Define loading state types:** inline, card, page, overlay
- [ ] **Document pattern** in design system docs
- [ ] **Audit and replace** all spinner-based loading states

**Decision:** Skeleton > Spinner. Skeleton shows structure, spinner shows activity. Structure builds trust.

### Feed Data Binding
Feed exists as shell but isn't wired to real data.

- [ ] **Wire Feed to Firestore** — posts collection, real-time subscription
- [ ] **Implement recap aggregation** — group by space/time
- [ ] **Add "Since you left" logic** — track last visit timestamp
- [ ] **Handle empty state** — first-time user vs returning with no new content

**Pattern:** Feed should be recap-style, not infinite scroll. Memory, not stream.

### Profile UI
Currently redirects. Profile is how users understand themselves on the platform.

- [ ] **Build `/profile` page** — own profile view
- [ ] **Build `/profile/[id]` page** — other user view
- [ ] **Build `/u/[handle]` page** — public profile
- [ ] **Show actions over bio** — spaces joined, tools created, events attended

**Invariant:** Profile shows what you've done, not what you claim. Bio optional.

---

## P1: Design System Debt

**Token and consistency fixes. These undermine system coherence.**

### Typography Standardization
All product pages use hardcoded `text-[Npx]` instead of typography tokens.

- [ ] **Create typography token scale:**
  ```
  text-label-xs    → 10px (rarely used)
  text-label-sm    → 11px
  text-label       → 12px
  text-body-sm     → 13px
  text-body        → 14px
  text-body-lg     → 16px
  text-title-sm    → 18px
  text-title       → 20px
  text-title-lg    → 24px
  text-heading-sm  → 28px
  text-heading     → 32px
  text-heading-lg  → 40px
  text-display-sm  → 48px
  text-display     → 56px
  text-display-lg  → 64px
  ```
- [ ] **Add to Tailwind config** as custom utilities
- [ ] **Audit Feed page** — replace all `text-[Npx]`
- [ ] **Audit Spaces page** — replace all `text-[Npx]`
- [ ] **Audit Explore page** — replace all `text-[Npx]`
- [ ] **Audit Profile page** — replace all `text-[Npx]`

**Enforcement:** Lint rule to flag `text-[` pattern in product pages.

### Gold Value Consolidation
64 instances of hardcoded `#FFD700`, `rgb(255, 215, 0)`, or Tailwind `yellow-*` instead of life-gold token.

- [ ] **Grep and catalog all gold usages** — build replacement map
- [ ] **Create gold variants if needed:**
  ```css
  --life-gold: #FFD700
  --life-gold-dim: rgba(255, 215, 0, 0.6)
  --life-gold-glow: rgba(255, 215, 0, 0.2)
  ```
- [ ] **Replace all hardcoded instances**
- [ ] **Document gold budget** — when to use gold (achievements, claims, important actions)

**Gold budget rule:** Gold marks significance. Overuse destroys meaning.

### Opacity Tokenization
`white/30`, `white/40`, `white/50` patterns scattered without semantic meaning.

- [ ] **Create opacity scale:**
  ```css
  --opacity-ghost: 0.1
  --opacity-subtle: 0.2
  --opacity-muted: 0.3
  --opacity-soft: 0.4
  --opacity-mid: 0.5
  --opacity-visible: 0.6
  --opacity-strong: 0.8
  --opacity-full: 1.0
  ```
- [ ] **Create semantic opacity tokens:**
  ```css
  --glass-opacity: var(--opacity-subtle)
  --hover-opacity: var(--opacity-ghost)
  --disabled-opacity: var(--opacity-muted)
  --border-opacity: var(--opacity-subtle)
  ```
- [ ] **Audit and replace** all inline opacity values

### Gradient Standardization
Inline `rgba()` gradients in Spaces and elsewhere instead of glass tokens.

- [ ] **Catalog glass/gradient patterns** in codebase
- [ ] **Verify glass tokens exist** in design system
- [ ] **Create missing glass variants** if needed
- [ ] **Replace inline gradients** with token references

**Files to audit:** `apps/web/src/app/(protected)/spaces/`

### Motion Token Sync
Motion defined in TypeScript (`MOTION.ease.premium`) and CSS separately. No sync mechanism.

- [ ] **Audit motion token usage** — TypeScript vs CSS
- [ ] **Create single source of truth** — prefer TypeScript, generate CSS
- [ ] **Document motion patterns** with examples

---

## P2: Page Compliance

**Bring each page to /about quality standard.**

### Feed (C+ → A)

Current issues:
- Typography hardcoded (`text-[12px]`, `text-[14px]`)
- Opacity values inline (`white/30`, `white/40`)
- No structured loading state
- Shell without real data

Tasks:
- [ ] Replace hardcoded typography with tokens
- [ ] Tokenize opacity values
- [ ] Implement skeleton loading state
- [ ] Wire to real data (see P0)
- [ ] Add "since you left" header
- [ ] Implement space grouping

### Spaces (B- → A)

Current issues:
- Inline `rgba()` gradients instead of glass tokens
- Typography hardcoded
- Member list styling inconsistent

Tasks:
- [ ] Replace inline gradients with glass tokens
- [ ] Replace hardcoded typography
- [ ] Standardize member list component
- [ ] Add presence indicators (see P3)
- [ ] Verify empty state

### Explore (B → A)

Current issues:
- Typography hardcoded
- Card spacing slightly inconsistent
- Search state transitions need polish

Tasks:
- [ ] Replace hardcoded typography with tokens
- [ ] Audit card spacing against 4/8/12/16/24/32 scale
- [ ] Polish search state transitions
- [ ] Verify all tab states

### Profile (C → A)

Current issues:
- Essentially just a redirect
- No actual profile UI built
- Event type colors hardcoded

Tasks:
- [ ] Build profile layout (see P0)
- [ ] Replace hardcoded event type colors with tokens
- [ ] Add profile completion indicator
- [ ] Implement mutual context ("X spaces in common")
- [ ] Create edit profile flow

### Entry/Auth (Polish)

Current issues:
- Minor typography inconsistencies
- Loading states need verification

Tasks:
- [ ] Audit typography against tokens
- [ ] Verify all loading states use skeleton pattern
- [ ] Test "You're in" moment motion
- [ ] Verify OTP input states

### Onboarding (Polish)

Current issues:
- Territory map performance on large datasets
- Claimed state motion needs refinement

Tasks:
- [ ] Optimize territory rendering
- [ ] Polish claimed reveal motion
- [ ] Verify skip flow works correctly
- [ ] Test handle availability UX

---

## P3: Infrastructure Gaps

**Systems that don't exist yet but are needed for full experience.**

### Presence System
**Priority:** High
**Dependency:** Firebase Realtime Database

- [ ] **Set up Firebase RTDB** for presence (not Firestore)
- [ ] **Create presence hook** — `usePresence(spaceId)`
- [ ] **Implement "X online" display**
- [ ] **Add typing indicators**
- [ ] **Handle disconnect gracefully**

**Pattern:** Presence shows life. Dead spaces feel abandoned.

### Unread System
**Priority:** High
**Dependency:** Firestore collection

- [ ] **Create `userBoardReads` collection** — track last read timestamps
- [ ] **Implement unread count hook** — `useUnreadCount(spaceId)`
- [ ] **Add unread badges** to space cards and navigation
- [ ] **Implement "mark as read" logic**

### Real-Time Feed Updates
**Priority:** Medium
**Dependency:** SSE or Firestore listeners

- [ ] **Implement SSE endpoint** for feed updates
- [ ] **Create "new content" indicator**
- [ ] **Handle content insertion animation**
- [ ] **Implement recap summarization** (AI-assisted grouping)

### Tool Analytics (Real)
**Priority:** Medium
**Dependency:** Analytics collection

- [ ] **Replace mock analytics data** with real queries
- [ ] **Track tool usage events** — runs, responses, errors
- [ ] **Create analytics aggregation** — hourly/daily/weekly
- [ ] **Build analytics visualization**

### Post-Event Recaps
**Priority:** Low
**Dependency:** Event end detection

- [ ] **Detect event completion**
- [ ] **Generate recap data** — attendees, duration, photos
- [ ] **Create recap component**
- [ ] **Send recap notification**

---

## P4: Feature Decisions

**72 decisions from product definition. Work through these as slices are addressed.**

### Slice 1: Entry & Auth
Routes: `/`, `/enter`, `/about`, `/schools`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 1.1 | Landing hero: inline email vs separate CTA | Layout | `[ ]` |
| 1.2 | Landing: what stats/proof to show | Copy | `[ ]` |
| 1.3 | Enter: single page vs multi-step states | Flow | `[ ]` |
| 1.4 | Enter: OTP input style (6 boxes vs single field) | Component | `[ ]` |
| 1.5 | "You're in" moment: copy + motion | Copy/Motion | `[ ]` |
| 1.6 | Schools: card layout vs list | Layout | `[ ]` |
| 1.7 | Schools: what data per campus | Copy | `[ ]` |

### Slice 2: Onboarding
Routes: `/welcome`, `/welcome/identity`, `/welcome/territory`, `/welcome/claimed`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 2.1 | Welcome hero: copy + visual treatment | Copy/Layout | `[ ]` |
| 2.2 | Identity: what fields required vs optional | Flow | `[ ]` |
| 2.3 | Identity: handle input UX (suggestions, availability) | Component | `[ ]` |
| 2.4 | Territory: map visual vs list vs cards | Layout | `[ ]` |
| 2.5 | Territory: ghost space presentation | Component | `[ ]` |
| 2.6 | Claim flow: confirmation step or direct? | Flow | `[ ]` |
| 2.7 | Claimed: the reveal moment (copy + motion) | Copy/Motion | `[ ]` |
| 2.8 | Skip flow: what if they don't claim? | Flow | `[ ]` |

### Slice 3: Spaces
Routes: `/spaces`, `/spaces/new/*`, `/spaces/claim`, `/s/[handle]`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 3.1 | Space residence layout (split, tabs, panels) | Layout | `[ ]` |
| 3.2 | Chat: message grouping + timestamps | Component | `[ ]` |
| 3.3 | Chat: composer position + behavior | Component | `[ ]` |
| 3.4 | Presence: how to show "X online" | Component | `[ ]` |
| 3.5 | First message in empty space: copy + state | Copy/State | `[ ]` |
| 3.6 | Space header: what info, what hierarchy | Layout | `[ ]` |
| 3.7 | Member milestone (10, 50, 100): how to mark | Motion/Copy | `[ ]` |
| 3.8 | New launch celebration: copy + motion | Copy/Motion | `[ ]` |
| 3.9 | Join confirmation: inline vs modal | Component | `[ ]` |

### Slice 4: Discovery
Routes: `/explore`, `/explore?tab=*`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 4.1 | Explore hero: what headline + stats | Copy | `[ ]` |
| 4.2 | Search: ChatGPT-style vs traditional | Component | `[ ]` |
| 4.3 | Tab order: spaces first or events first? | Flow | `[ ]` |
| 4.4 | Ghost spaces: how prominent, what CTA | Component/Copy | `[ ]` |
| 4.5 | Space cards: what info to show | Layout | `[ ]` |
| 4.6 | People cards: what info, mutual context | Layout | `[ ]` |
| 4.7 | Empty search: what to show | State | `[ ]` |
| 4.8 | Join space from explore: inline or redirect | Flow | `[ ]` |

### Slice 5: Feed
Routes: `/feed`, `/feed/settings`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 5.1 | Feed structure: stream vs recap vs grouped | Layout | `[ ]` |
| 5.2 | Card types: what kinds of content, how styled | Component | `[ ]` |
| 5.3 | Empty feed (new user): what to show | State/Copy | `[ ]` |
| 5.4 | "Since you left" header: how to present | Copy/Layout | `[ ]` |
| 5.5 | Real-time: how new content appears | Motion | `[ ]` |
| 5.6 | Space grouping: collapsed vs expanded | Layout | `[ ]` |
| 5.7 | Filters: what options, where placed | Component | `[ ]` |

### Slice 6: HiveLab
Routes: `/hivelab`, `/tools/*`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 6.1 | HiveLab landing: hero copy + CTA | Copy/Layout | `[ ]` |
| 6.2 | AI input: how it looks, what placeholder | Component/Copy | `[ ]` |
| 6.3 | AI generation: reveal animation | Motion | `[ ]` |
| 6.4 | Tool cards: what info, how styled | Component | `[ ]` |
| 6.5 | Deploy flow: confirm step or direct? | Flow | `[ ]` |
| 6.6 | Deploy success: copy + motion | Copy/Motion | `[ ]` |
| 6.7 | Analytics: what metrics, how presented | Layout/Copy | `[ ]` |
| 6.8 | First response notification: copy | Copy | `[ ]` |
| 6.9 | Empty tools state: what to show | State/Copy | `[ ]` |

### Slice 7: Events
Routes: `/events`, `/events/[eventId]`, `/calendar`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 7.1 | Events list: chronological vs grouped | Layout | `[ ]` |
| 7.2 | Event cards: what info, how compact | Component | `[ ]` |
| 7.3 | RSVP button: states + feedback | Component/Motion | `[ ]` |
| 7.4 | "X going" display: face piles or count | Component | `[ ]` |
| 7.5 | Event detail: hero layout | Layout | `[ ]` |
| 7.6 | Post-event recap: what to show | Layout/Copy | `[ ]` |
| 7.7 | Calendar: month vs week vs list default | Layout | `[ ]` |
| 7.8 | "Happening now" treatment | Component/Copy | `[ ]` |

### Slice 8: Profiles
Routes: `/profile`, `/profile/[id]`, `/u/[handle]`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 8.1 | Profile layout: hero vs compact header | Layout | `[ ]` |
| 8.2 | What sections: spaces, creations, events | Layout | `[ ]` |
| 8.3 | Bio: where placed, how prominent | Layout/Copy | `[ ]` |
| 8.4 | Stats: what to show ("Since Sept", "X spaces") | Copy | `[ ]` |
| 8.5 | Mutual context: "X spaces in common" treatment | Component | `[ ]` |
| 8.6 | Edit: what fields required vs optional | Flow | `[ ]` |
| 8.7 | Avatar: upload UX, cropping | Component | `[ ]` |
| 8.8 | Public profile: what visible to others | Layout | `[ ]` |

### Slice 9: Settings
Routes: `/settings`, `/notifications/*`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 9.1 | Settings layout: sections vs single page | Layout | `[ ]` |
| 9.2 | Notification center: list vs grouped | Layout | `[ ]` |
| 9.3 | Notification cards: what info, how compact | Component | `[ ]` |
| 9.4 | "Mark all read" behavior | Flow | `[ ]` |
| 9.5 | Dangerous actions: confirmation style | Flow/Copy | `[ ]` |
| 9.6 | Privacy controls: what options | Layout | `[ ]` |
| 9.7 | Save confirmation: toast vs inline | Component | `[ ]` |

### Slice 10: Support & Legal
Routes: `/legal/*`, `/resources`, `/offline`

| # | Decision | Type | Status |
|---|----------|------|--------|
| 10.1 | Legal page layout: sticky nav vs scroll | Layout | `[ ]` |
| 10.2 | Terms: plain language summary at top? | Copy | `[ ]` |
| 10.3 | Privacy: data export link placement | Layout | `[ ]` |
| 10.4 | Guidelines: examples format (do/don't) | Copy/Layout | `[ ]` |
| 10.5 | Resources: categories vs search-first | Layout | `[ ]` |

---

## Quality Bar Checklist

**Use this template when auditing any page.**

```markdown
## Page Audit: [Route]

### Token Compliance
- [ ] No hardcoded colors (no #, rgb(), tailwind color classes)
- [ ] No hardcoded typography (no text-[Npx])
- [ ] Spacing on 4/8/12/16/24/32 scale
- [ ] Motion uses MOTION tokens
- [ ] Glass/gradient uses glass tokens

### State Coverage
- [ ] Empty state with clear CTA
- [ ] Loading state (skeleton, not spinner)
- [ ] Error state with recovery action
- [ ] Partial data state
- [ ] Success/confirmation state

### Motion
- [ ] Entrance animations use MOTION.ease.premium
- [ ] Proper viewport margins for scroll triggers
- [ ] No instant transitions (minimum 150ms)
- [ ] Exit animations considered

### Interaction
- [ ] Hover feedback on all interactive elements
- [ ] Active/pressed states
- [ ] Disabled states with clear reason
- [ ] Focus states for accessibility

### Invariant Check
- [ ] Witnessed: Creates memory, not ephemeral
- [ ] Steward: Ownership feels like responsibility
- [ ] Action: Asks for action, not identity
- [ ] Memory: Users ask "will this work?" not "will this look good?"

### Grade: [A/B/C/D/F]
```

---

## Storybook Coverage

**Current:** 32 stories / 96 primitives = 36% coverage

### Primitives Needing Stories (Priority)

**Typography (Critical)**
- [ ] Text variants
- [ ] Heading variants
- [ ] Display variants

**Interactive (Critical)**
- [ ] Button all states
- [ ] Input all states
- [ ] Form patterns

**Layout (Medium)**
- [ ] Card variants
- [ ] Stack/Flex utilities
- [ ] Container patterns

**Motion (Medium)**
- [ ] RevealSection
- [ ] NarrativeReveal
- [ ] AnimatedBorder
- [ ] ParallaxText

**Feedback (Low)**
- [ ] Badge variants
- [ ] Tooltip
- [ ] Toast patterns

---

## Documentation Drift

**Issues to fix:**

- [ ] `PRIMITIVES.md` says "20+ primitives" — actual count is 96
- [ ] Component count in docs outdated (says ~100, actual is 114)
- [ ] Motion token documentation incomplete
- [ ] Glass token patterns undocumented

---

## Governing Principle

**HIVE fights erasure, not chaos.**

Students aren't lonely because they lack people. They're lonely because they lack stable contexts where contribution matters.

Every page, feature, and interaction passes through four invariants:

| Invariant | The Shift | Enforcement |
|-----------|-----------|-------------|
| **Witnessed** | Unwitnessed → Witnessed | Recaps, not feeds. "Here's what happened." |
| **Steward** | Perform → Steward | Weight, not celebration. "It's yours." |
| **Action** | Define yourself → Just act | Low narrative burden. "What are you building?" |
| **Memory** | Visibility → Memory | Artifacts, not applause. "Will this work?" |

**Copy rules (enforced everywhere):**
- Never: "Sign up", "Great job!", "Don't miss out!", "Trending"
- Always: "Enter", "It's yours.", "Here's what happened", "Your spaces"

**Full framework:** `docs/design-system/DRAMA.md`

---

## Success Criteria

Platform is ready when:

- [ ] All pages score A on audit checklist
- [ ] P0 ship blockers resolved
- [ ] P1 design system debt <10 issues
- [ ] Token compliance >95% across product pages
- [ ] Loading states consistent (skeleton-first)
- [ ] Presence system operational
- [ ] Unread counts working
- [ ] Feed wired to real data
- [ ] Profile pages built
- [ ] Storybook coverage >60%

**The test:** Would a dean walk through this and see infrastructure, not an experiment?

---

## Priority Sequence

1. **P0 Ship Blockers** — Fix what breaks function or trust
2. **P1 Design System Debt** — Fix tokens, then pages inherit fixes
3. **P2 Page Compliance** — Bring each page to /about standard
4. **P3 Infrastructure** — Add presence, unread, real-time
5. **P4 Feature Decisions** — Work through 72 decisions by slice

**Do not skip ahead.** Token fixes propagate to all pages. Infrastructure enables features. Decisions are only valuable when the system is coherent.

---

*This document reflects the January 25, 2026 platform audit. All P0 items must be resolved before GTM.*
