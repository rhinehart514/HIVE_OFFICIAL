# Page Redesign Tracker

> **Status Key:**
> - `[x]` Complete
> - `[~]` In Progress
> - `[ ]` Not Started
> - `[!]` Needs Redesign
> - `[-]` Skip/Delete

---

## Critical Path (Do First)

These pages form the core loop. Fix these before anything else.

### Entry → Discovery → Residence → Action

| Page | Current | Target | Status |
|------|---------|--------|--------|
| `/auth/login` | VoidShell | VoidShell (polish) | `[ ]` |
| `/auth/verify` | VoidShell | VoidShell (polish) | `[ ]` |
| `/onboarding` | Custom layout | VoidShell + progress | `[ ]` |
| `/spaces` | BrowseShell | BrowseShell (redesign) | `[!]` |
| `/s/[handle]` | ConversationShell | ConversationShell (redesign) | `[!]` |
| `/tools` | BrowseShell | BrowseShell (polish) | `[ ]` |
| `/tools/[id]` | CanvasShell | CanvasShell (polish) | `[ ]` |

---

## All Pages by Priority

### Tier 1: Entry Points

| Path | Shell | Layout | Priority | Status | Notes |
|------|-------|--------|----------|--------|-------|
| `/` | VoidShell | Living Glass | HIGH | `[!]` | Landing redesign |
| `/auth/login` | VoidShell | Centered | HIGH | `[ ]` | Polish only |
| `/auth/verify` | VoidShell | Centered | HIGH | `[ ]` | Polish only |
| `/auth/expired` | VoidShell | Centered | MED | `[ ]` | Add recovery |
| `/onboarding` | VoidShell | Centered + dots | HIGH | `[!]` | Simplify flow |

### Tier 2: Territory (Discovery)

| Path | Shell | Layout | Priority | Status | Notes |
|------|-------|--------|----------|--------|-------|
| `/spaces` | BrowseShell | Grid | HIGH | `[!]` | Ghost Spaces, FOMO |
| `/spaces/browse` | BrowseShell | Grid | HIGH | `[!]` | Merge with `/spaces`? |
| `/spaces/search` | BrowseShell | Grid | MED | `[ ]` | Same as browse |
| `/spaces/create` | VoidShell | Wizard | HIGH | `[!]` | Handle moment |
| `/spaces/claim` | VoidShell | Wizard | HIGH | `[!]` | Waitlist pressure |

### Tier 3: Residence (Space Home)

| Path | Shell | Layout | Priority | Status | Notes |
|------|-------|--------|----------|--------|-------|
| `/s/[handle]` | ConversationShell | Split 60/40 | HIGH | `[!]` | Core redesign |
| `/s/[handle]?view=events` | BrowseShell | Grid | HIGH | `[ ]` | Event cards |
| `/s/[handle]?view=members` | BrowseShell | Grid | MED | `[ ]` | Online-first |
| `/s/[handle]?view=calendar` | Custom | Calendar | MED | `[ ]` | Space calendar |
| `/s/[handle]?view=resources` | BrowseShell | List | LOW | `[ ]` | File list |
| `/s/[handle]?view=tools` | BrowseShell | Grid | MED | `[ ]` | Deployed tools |
| `/s/[handle]?view=analytics` | CanvasShell | Dashboard | LOW | `[ ]` | Leader only |
| `/s/[handle]?view=settings` | Custom | Form | MED | `[ ]` | Leader only |

### Tier 4: Creation (HiveLab)

| Path | Shell | Layout | Priority | Status | Notes |
|------|-------|--------|----------|--------|-------|
| `/tools` | BrowseShell | Grid | HIGH | `[ ]` | Gallery redesign |
| `/tools/create` | CanvasShell | AI chat | HIGH | `[ ]` | Creation flow |
| `/tools/[id]` | CanvasShell | IDE | HIGH | `[ ]` | Studio polish |
| `/tools/[id]/preview` | Custom | Sandbox | MED | `[ ]` | Runtime |
| `/tools/[id]/deploy` | VoidShell | Wizard | MED | `[ ]` | Space picker |
| `/tools/[id]/analytics` | CanvasShell | Dashboard | LOW | `[ ]` | Usage stats |
| `/tools/[id]/settings` | Custom | Form | LOW | `[ ]` | Config |

### Tier 5: Identity (Profile)

| Path | Shell | Layout | Priority | Status | Notes |
|------|-------|--------|----------|--------|-------|
| `/u/[handle]` | ProfileShell | Hero + content | HIGH | `[!]` | Public profile |
| `/profile` | ProfileShell | Dashboard | MED | `[ ]` | Own profile |
| `/profile/edit` | Custom | Form | MED | `[ ]` | Edit flow |
| `/profile/calendar` | Custom | Calendar | LOW | `[ ]` | Personal calendar |
| `/profile/connections` | BrowseShell | Grid | LOW | `[ ]` | Friend list |
| `/profile/settings` | Custom | Form | LOW | `[-]` | Merge with /settings |

### Tier 6: Utility

| Path | Shell | Layout | Priority | Status | Notes |
|------|-------|--------|----------|--------|-------|
| `/calendar` | Custom | Calendar | MED | `[ ]` | Combined calendar |
| `/events` | BrowseShell | Grid | MED | `[ ]` | Campus events |
| `/notifications` | StreamShell | List | MED | `[ ]` | Notification center |
| `/settings` | Custom | Form | LOW | `[ ]` | Global settings |
| `/leaders` | BrowseShell | Grid | LOW | `[ ]` | Notable users |

### Tier 7: System

| Path | Shell | Layout | Priority | Status | Notes |
|------|-------|--------|----------|--------|-------|
| `/legal/privacy` | VoidShell | Article | LOW | `[ ]` | Legal page |
| `/legal/terms` | VoidShell | Article | LOW | `[ ]` | Legal page |
| `/legal/community-guidelines` | VoidShell | Article | LOW | `[ ]` | Legal page |
| `/offline` | VoidShell | Centered | LOW | `[ ]` | Offline state |
| `/not-found` | VoidShell | Centered | LOW | `[ ]` | 404 |

### Tier 8: Gated/Future

| Path | Shell | Layout | Priority | Status | Notes |
|------|-------|--------|----------|--------|-------|
| `/feed` | StreamShell | Stream | PAUSED | `[-]` | "Coming Soon" |
| `/rituals` | BrowseShell | Grid | GATED | `[-]` | Feature flagged |
| `/rituals/[slug]` | Custom | Detail | GATED | `[-]` | Feature flagged |

---

## Consolidation Candidates

Pages that might merge or be deleted:

| Current | Merge Into | Reason |
|---------|------------|--------|
| `/spaces/browse` | `/spaces` | Duplicate discovery |
| `/spaces/search` | `/spaces?q=` | Query param instead |
| `/profile/settings` | `/settings` | One settings location |
| `/user/[handle]` | `/u/[handle]` | Duplicate route |
| `/spaces/s/[slug]` | `/s/[handle]` | Duplicate route |
| `/hivelab` | `/tools` | Duplicate route |
| `/hivelab/demo` | Remove | Dev only |
| `/ux/*` | Remove | Dev/testing only |
| `/design-system` | Remove or hide | Dev only |
| `/elements` | Remove | Dev only |

---

## Component Dependencies

### Must Build First (Blocking)

1. **GlobalNav** — Blocks all pages
2. **ShellLayout** — Blocks all pages
3. **SidebarShell** — Blocks navigation
4. **MobileBottomNav** — Blocks mobile

### Can Build In Parallel

- SpaceCard (for `/spaces`)
- ToolCard (for `/tools`)
- ProfileCard (for `/u/[handle]`)
- EventCard (for events views)

### Can Build Last

- Analytics dashboards
- Settings forms
- Legal pages

---

## Page-by-Page Specs

### `/spaces` — Territory Map

**Before:**
- Basic grid
- No ghost Spaces
- Weak activity signals

**After:**
- Search prominent
- Categories filterable
- Ghost Spaces with "Claim" CTA
- Online counts on all cards
- Waitlist pressure visible

**Components needed:**
- `SpaceCard` (claimed variant)
- `GhostSpaceCard` (unclaimed variant)
- `CategoryFilter`
- `SpaceSearchInput`

---

### `/s/[handle]` — Space Home

**Before:**
- Theater mode (hub + modes)
- Multiple layouts

**After:**
- Chat-first default
- Horizontal view tabs
- 60/40 split (chat + sidebar)
- Sidebar shows events, members, tools

**Components needed:**
- `SpaceHeader`
- `ViewTabs`
- `ChatView`
- `SpaceSidebar`
- `BoardTabs`

---

### `/u/[handle]` — Public Profile

**Before:**
- Basic profile
- Limited info

**After:**
- Hero with parallax
- Spaces membership prominent
- Tools created visible
- Activity feed

**Components needed:**
- `ProfileHero`
- `SpaceMembershipGrid`
- `ToolsCreatedGrid`
- `ActivityStream`

---

## Sprint Planning

### Sprint 1: Foundation
- [ ] New shell system
- [ ] GlobalNav redesign
- [ ] SidebarShell implementation
- [ ] MobileBottomNav

### Sprint 2: Discovery
- [ ] `/spaces` redesign
- [ ] SpaceCard component
- [ ] GhostSpaceCard component
- [ ] Search + filters

### Sprint 3: Residence
- [ ] `/s/[handle]` redesign
- [ ] Chat experience
- [ ] SpaceSidebar
- [ ] View tabs

### Sprint 4: Creation
- [ ] `/tools` polish
- [ ] Tool studio improvements
- [ ] Deploy flow

### Sprint 5: Identity
- [ ] `/u/[handle]` redesign
- [ ] Profile edit flow
- [ ] Onboarding polish

### Sprint 6: Polish
- [ ] All empty states
- [ ] Loading skeletons
- [ ] Error recovery
- [ ] Animations

---

## Success Metrics

### Per-Page Metrics

| Page | Metric | Target |
|------|--------|--------|
| `/spaces` | Time to first join | < 60s |
| `/spaces/claim` | Claim completion rate | > 80% |
| `/s/[handle]` | Messages sent per session | > 1 |
| `/tools` | Tool creation started | > 10% |
| `/u/[handle]` | Profile completeness | > 70% |

### Overall Metrics

- **Activation:** Join a Space within first session
- **Retention:** Return within 7 days
- **Engagement:** Messages sent per week
- **Creation:** Tools built per user

---

## Notes

- All pages use the design system (`@hive/ui`)
- Gold is for CTAs and presence ONLY
- Focus rings are WHITE, never gold
- Empty states = canvas, not absence
- Every page must have a single-session win
