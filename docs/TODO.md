# HIVE Frontend UI/UX TODO

## Visual Identity: "Premium Clean"

**Core Feel**: Vercel/OpenAI premium with subtle campus personality

| Element | Choice | Details |
|---------|--------|---------|
| **Color** | Gold Moments | 95% mono, gold for CTAs/achievements only |
| **Typography** | Geist + Display | Geist Sans body, display font for headings |
| **Motion** | Silk Smooth | Subtle, elegant easing (OpenAI feel) |
| **Illustrations** | Text + Icons | Minimal - Lucide icons, no custom art |
| **Signatures** | Basic | Micro-celebrations (confetti, countups) |

**What makes it HIVE**: Gold accent restraint, confident typography, smooth motion. Playfulness in copy, not visuals.

---

## Strategy: Full Rebuild

**All existing pages and layouts are deprecated.** We're rebuilding the entire UI/UX from scratch using:

- **Layout primitives** for structure (Shell, PageHeader, Section)
- **Feature compounds** for domain logic (FeedList.*, SpaceBoard.*)
- **Shared atoms** for building blocks (Button, Card, Badge)
- **Semantic tokens** for consistency (radius, spacing, typography, motion)

---

## 🚨 ACTIVE: Feed UI/UX Rebuild

**Status**: In Progress
**Goal**: Production-ready feed with real API integration, 60fps performance

### Phase 1: Clean Slate
- [ ] Delete `page-storybook-migration.tsx` (mock data, deprecated)
- [ ] Create fresh `page.tsx` with proper architecture

### Phase 2: Core Feed Experience
- [ ] **Data Layer**
  - [ ] Set up TanStack Query for data fetching
  - [ ] Create `useFeedQuery` hook with `/api/feed` integration
  - [ ] Transform API response to `FeedItem` format
  - [ ] Implement cursor-based pagination

- [ ] **Layout Structure**
  - [ ] Integrate `CollapsiblePageHeader` (scroll-aware)
  - [ ] Set up filter tabs (All/Following/Spaces/Academic)
  - [ ] Connect campus stats to real API data

- [ ] **Virtualized List**
  - [ ] Wire up `FeedVirtualizedList` component
  - [ ] Route `item.type` to correct card component:
    - `post` → `FeedCardPost`
    - `event` → `FeedCardEvent`
    - `tool` → `FeedCardTool`
    - `system` → `FeedCardSystem`
  - [ ] Implement infinite scroll with `hasMore`

### Phase 3: Interactions & Creation
- [ ] **Post Actions**
  - [ ] Connect upvote to `/api/posts/[id]/reactions`
  - [ ] Connect bookmark to `/api/bookmarks`
  - [ ] Implement optimistic updates
  - [ ] Keyboard shortcuts (L/C/B/S)

- [ ] **Feed Composer**
  - [ ] Wire up `FeedComposerSheet`
  - [ ] Connect to post creation API
  - [ ] Space selector with user's spaces
  - [ ] Media upload (max 4 images)

### Phase 4: Real-time & Polish
- [ ] **Real-time Updates**
  - [ ] Integrate `/api/feed/updates`
  - [ ] "New posts" indicator banner
  - [ ] Smooth insertion animations

- [ ] **UX Polish**
  - [ ] Loading skeletons during fetch
  - [ ] Pull-to-refresh on mobile
  - [ ] Empty state with onboarding CTA
  - [ ] Error recovery with retry

### Files
- `apps/web/src/app/feed/page.tsx` - New implementation
- `apps/web/src/hooks/use-feed-query.ts` - Data fetching hook
- Delete: `apps/web/src/app/feed/page-storybook-migration.tsx`

---

## Phase 1: Foundation (Completed ✅)

### Layout Primitives Created
- [x] `Shell` - 5 sizes (xs/sm/md/lg/xl), responsive padding
- [x] `PageHeader` - title, action, sticky, bordered options

### Design Tokens Consolidated
- [x] Semantic radius tokens (button, card, modal, badge, etc.)
- [x] Semantic spacing tokens (gap, stack, page insets)
- [x] Typography token migration (40+ files)
- [x] Motion tokens (easings, durations, springs, staggers)

### Additional Primitives Needed
- [ ] `Section` - vertical rhythm with optional title
- [ ] `Sidebar` - fixed/collapsible pattern
- [ ] `FilterBar` - reusable filter chip row
- [ ] `PageWrapper` - full page with nav integration

---

## Phase 2: Feature Compounds (Build New)

### Feed
- [ ] `FeedList` compound
  - [ ] `FeedList.Item`
  - [ ] `FeedList.Skeleton`
  - [ ] `FeedList.Empty`
  - [ ] `FeedList.LoadMore`

### Spaces
- [ ] `SpaceBoard` compound
  - [ ] `SpaceBoard.Header`
  - [ ] `SpaceBoard.Pins`
  - [ ] `SpaceBoard.Feed`
  - [ ] `SpaceBoard.Rail`
- [ ] `SpaceCard` compound
  - [ ] `SpaceCard.Cover`
  - [ ] `SpaceCard.Info`
  - [ ] `SpaceCard.Actions`

### Profile
- [ ] `ProfileView` compound
  - [ ] `ProfileView.Identity`
  - [ ] `ProfileView.Stats`
  - [ ] `ProfileView.Activity`
  - [ ] `ProfileView.Widgets`

### HiveLab
- [ ] `ToolLibrary` compound
  - [ ] `ToolLibrary.Grid`
  - [ ] `ToolLibrary.Filters`
  - [ ] `ToolLibrary.Empty`
- [ ] `ToolStudio` compound
  - [ ] `ToolStudio.Canvas`
  - [ ] `ToolStudio.Palette`
  - [ ] `ToolStudio.Inspector`

### Auth
- [ ] `AuthFlow` compound
  - [ ] `AuthFlow.Email`
  - [ ] `AuthFlow.Verify`
  - [ ] `AuthFlow.Welcome`

### Notifications
- [ ] `NotificationList` compound
  - [ ] `NotificationList.Item`
  - [ ] `NotificationList.Empty`
  - [ ] `NotificationList.Filters`

---

## Phase 3: Pages (Rebuild from Scratch)

All pages will be rebuilt using Shell + compounds.

### Core Pages (P0)
- [x] `/feed` - Real API integration, semantic tokens, optimistic updates
- [x] `/spaces` - Discovery page with HIVE branding, list format
- [x] `/spaces/[id]` - Space board with semantic tokens
- [x] `/spaces/browse` - Search page with filters, category pills
- [x] `/spaces/[id]/settings` - Leader settings with tabbed interface
- [ ] `/profile` - Shell lg + ProfileView
- [ ] `/profile/[handle]` - Shell lg + ProfileView (public)

### Secondary Pages (P1)
- [ ] `/notifications` - Shell md + NotificationList
- [ ] `/tools` - Shell xl + ToolLibrary
- [ ] `/tools/[id]` - Shell xl + ToolStudio
- [ ] `/settings` - Shell md + settings forms
- [ ] `/calendar` - Shell lg + calendar view

### Utility Pages (P2)
- [ ] `/auth/login` - Shell xs + AuthFlow
- [ ] `/auth/verify` - Shell xs + AuthFlow
- [ ] `/onboarding/*` - Shell sm + onboarding steps
- [ ] `/legal/*` - Shell md + prose content

### Admin Pages (P3)
- [ ] `/admin` - Shell xl + admin dashboard
- [ ] `/admin/users` - Shell xl + user management
- [ ] `/admin/spaces` - Shell xl + space management
- [ ] `/admin/rituals` - Shell xl + ritual management

---

## Phase 4: Deprecate Old Code

### Templates to Delete
- [ ] `FeedPageLayout`
- [ ] `ProfileViewLayout`
- [ ] `SpaceBoardTemplate`
- [ ] `RitualsPageLayout`
- [ ] `AuthOnboardingLayout`
- [ ] All files in `atomic/*/templates/`

### Pages to Delete
- [ ] All current page implementations in `apps/web/src/app/`
- [ ] Keep only route structure, replace content

### Old Components to Audit
- [ ] Review 162 existing components
- [ ] Keep atoms that use tokens
- [ ] Delete organisms that duplicate compound logic
- [ ] Consolidate duplicate components

---

## Phase 5: Polish & Micro-interactions

### Loading States
- [ ] Consistent skeleton shimmer animation
- [ ] Progressive image loading with blur
- [ ] Optimistic UI updates

### Empty States
- [ ] Contextual illustrations per feature
- [ ] Actionable CTAs (not generic)
- [ ] Consistent layout pattern

### Micro-interactions (All Components)
- [ ] Button: tap scale 0.98, hover lift
- [ ] Card: hover lift, focus ring
- [ ] Input: focus ring, error shake
- [ ] Toggle: spring physics
- [ ] Toast: slide + fade

### Signature Moments
- [x] Ritual completion celebration
- [ ] First post celebration
- [ ] Space join success
- [ ] Profile completion milestone
- [ ] Tool publish success
- [ ] Onboarding complete

---

## Phase 6: Performance

### Virtualization
- [x] Feed list (TanStack Virtual)
- [ ] Space member list
- [ ] Tool library grid
- [ ] Notification list

### Code Splitting
- [ ] Lazy load HiveLab studio
- [ ] Lazy load admin dashboard
- [ ] Lazy load rich text editor
- [ ] Route-based splitting

### Assets
- [ ] Next.js Image everywhere
- [ ] Blur placeholders
- [ ] WebP with fallbacks
- [ ] Font subsetting

---

## Phase 7: Accessibility

### Keyboard
- [ ] Focus trap in modals
- [ ] Arrow navigation in lists
- [ ] Escape closes overlays
- [ ] Skip to content link

### Screen Readers
- [ ] ARIA labels
- [ ] Live regions
- [ ] Landmark roles
- [ ] Announce dynamic content

### Motion
- [ ] `prefers-reduced-motion` support
- [ ] Pause/reduce animations option

---

## Phase 8: Documentation

### Design System Docs
- [ ] Token usage guide
- [ ] Component API reference
- [ ] Layout patterns
- [ ] Motion patterns
- [ ] Accessibility guidelines

### Storybook
- [ ] Stories for all compounds
- [ ] Interactive examples
- [ ] Prop documentation

---

## Technical Debt

### Types
- [ ] Remove all `any` types
- [ ] Strict types for compounds
- [ ] Export all prop types

### Cleanup
- [ ] Fix 657 TypeScript errors
- [ ] Remove unused imports
- [ ] Delete duplicate files (*.skip, *2.tsx)
- [ ] Remove old layouts after migration

---

## Session Progress

### Commits (This Session)
1. `9406885` - Motion system consolidation
2. `fd7791a` - Shell + PageHeader layout primitives
3. `efcd989` - Semantic radius/spacing tokens
4. `c483289` - Typography migration (21 files)
5. `198b425` - Pages + components migration (8 files)
6. `613c66e` - Final typography cleanup (11 files)
7. `9c4e198` - TODO documentation

### UI/UX Rating Progress
- **Start**: 6.5/10
- **Current**: ~7.5/10
- **Target**: 9/10 (OpenAI/Linear tier)

---

## Implementation Order

### Week 1: Core Primitives + Feed
1. Create remaining primitives (Section, Sidebar, FilterBar)
2. Create FeedList compound
3. Rebuild /feed page
4. Delete old FeedPageLayout

### Week 2: Spaces
1. Create SpaceCard compound
2. Create SpaceBoard compound
3. Rebuild /spaces and /spaces/[id]
4. Delete old space templates

### Week 3: Profile + Auth
1. Create ProfileView compound
2. Create AuthFlow compound
3. Rebuild /profile and /auth/* pages
4. Delete old profile/auth layouts

### Week 4: HiveLab + Admin
1. Create ToolLibrary compound
2. Create ToolStudio compound
3. Rebuild /tools/* pages
4. Rebuild /admin/* pages

### Week 5: Polish
1. Loading states consistency
2. Empty states with illustrations
3. Micro-interactions audit
4. Signature moments

### Week 6: Ship
1. Performance audit
2. Accessibility audit
3. Final QA
4. Deploy to production

---

## Token Reference

### Shell Sizes
- `xs`: 480px (auth, modals)
- `sm`: 640px (chat, single column)
- `md`: 768px (feed, articles)
- `lg`: 1024px (dashboards)
- `xl`: 1200px (full grids)

### Typography
- `text-body-xs`: 10px
- `text-body-meta`: 11px
- `text-body-sm`: 12px
- `text-body-md`: 14px
- `text-body-chat`: 15px
- `text-body-lg`: 16px

### Tracking
- `tracking-caps`: 0.18em
- `tracking-caps-wide`: 0.24em
- `tracking-caps-wider`: 0.32em

### Radius
- `rounded-lg`: 16px (buttons, inputs)
- `rounded-xl`: 24px (popovers)
- `rounded-2xl`: 32px (cards)
- `rounded-full`: pills, badges

### Motion
- `durationSeconds.quick`: 0.2s
- `durationSeconds.standard`: 0.3s
- `springPresets.snappy`: stiff 400, damp 30
- `springPresets.bouncy`: stiff 300, damp 15
