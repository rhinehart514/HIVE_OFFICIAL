# Page-by-Page Rebuild Plan

Live rebuild session - running dev server, fixing components as we go.

**Session Tracking:** Use `/fix-todos` to track progress.

---

## Progress Overview

| Slice | Total | Reviewed | Status |
|-------|-------|----------|--------|
| Onboarding | 5 | 0 | NOT STARTED |
| Spaces | 14 | 0 | NOT STARTED |
| HiveLab | 10 | 0 | NOT STARTED |
| Profile | 7 | 0 | NOT STARTED |
| Admin | 5 | 0 | NOT STARTED |
| Feed & Rituals | 5 | 0 | SKIP (paused) |

---

## 1. ONBOARDING (5 pages)
*Entry point - first impression*

| Status | Route | Priority | Components | Notes |
|--------|-------|----------|------------|-------|
| [ ] | `/` (landing) | P0 | Button, Card, Text, Hero sections | |
| [ ] | `/auth/login` | P0 | Input, Button, Card | |
| [ ] | `/auth/verify` | P0 | Input (OTP), Button, Card | |
| [ ] | `/auth/expired` | P1 | Button, Card, Text | |
| [ ] | `/onboarding` | P0 | Input, Button, Card, Progress | |

**Components to watch:**
- Button (refined 2026-01-12)
- Input (needs glass treatment)
- Card (refined 2026-01-12)
- Landing sections

---

## 2. SPACES (14 pages)
*Core product loop*

| Status | Route | Priority | Components | Notes |
|--------|-------|----------|------------|-------|
| [ ] | `/spaces` | P0 | SpaceCard, Button | |
| [ ] | `/spaces/browse` | P0 | SpaceCard, Input, Tabs, Filters | |
| [ ] | `/spaces/search` | P1 | Input, SpaceCard | |
| [ ] | `/spaces/create` | P0 | Input, Button, Card, Stepper | |
| [ ] | `/spaces/claim` | P1 | Input, Button, Card | |
| [ ] | `/spaces/s/[slug]` | P0 | Redirect to spaceId | |
| [ ] | `/spaces/[spaceId]` | P0 | ChatMessage, Sidebar, Tabs | |
| [ ] | `/spaces/[spaceId]/members` | P0 | ProfileCard, Avatar, MemberRow | |
| [ ] | `/spaces/[spaceId]/events` | P1 | EventCard, Calendar | |
| [ ] | `/spaces/[spaceId]/calendar` | P2 | Calendar, EventCard | |
| [ ] | `/spaces/[spaceId]/resources` | P2 | ResourceCard, List | |
| [ ] | `/spaces/[spaceId]/analytics` | P2 | Charts, StatCard | |
| [ ] | `/spaces/[spaceId]/settings` | P1 | Input, Tabs, Toggles | |
| [ ] | `/spaces/[spaceId]/apps/[id]` | P1 | ToolCard, Element renderers | |

**Components to watch:**
- SpaceCard (needs gradient header, warmth)
- ChatMessage (aligned)
- MemberRow (ProfileCard context)
- EventCard (needs RSVP chip)
- Sidebar/Rail

---

## 3. HIVELAB (10 pages)
*Tool builder IDE*

| Status | Route | Priority | Components | Notes |
|--------|-------|----------|------------|-------|
| [ ] | `/tools` | P0 | ToolCard, Button | |
| [ ] | `/tools/create` | P0 | Canvas, PropertyField | |
| [ ] | `/tools/[toolId]` | P0 | ToolCard, Stats | |
| [ ] | `/tools/[toolId]/edit` | P0 | Canvas, IDE panels | |
| [ ] | `/tools/[toolId]/preview` | P0 | Element renderers | |
| [ ] | `/tools/[toolId]/deploy` | P1 | SpaceCard, Button | |
| [ ] | `/tools/[toolId]/run` | P1 | Element renderers | |
| [ ] | `/tools/[toolId]/analytics` | P2 | Charts, StatCard | |
| [ ] | `/tools/[toolId]/settings` | P2 | Input, Tabs | |
| [ ] | `/hivelab` | P1 | Showcase, ToolCard | |

**Components to watch:**
- ToolCard (needs workshop layout)
- IDE panels
- Canvas
- PropertyField
- Element renderers

---

## 4. PROFILE (7 pages)
*User identity*

| Status | Route | Priority | Components | Notes |
|--------|-------|----------|------------|-------|
| [ ] | `/profile` | P0 | ProfileCard (Full), BentoGrid | |
| [ ] | `/profile/[id]` | P0 | ProfileCard (Full), Avatar | |
| [ ] | `/profile/edit` | P0 | Input, Avatar upload | |
| [ ] | `/settings` | P1 | Input, Toggles, Tabs | |
| [ ] | `/notifications` | P1 | NotificationCard, List | |
| [ ] | `/calendar` | P2 | Calendar, EventCard | |
| [ ] | `/events` | P2 | EventCard, List | |

**Components to watch:**
- ProfileCard (5 contexts needed)
- Avatar
- BentoGrid
- Badge
- PresenceDot

---

## 5. ADMIN (5 pages)
*Platform management - port 3001*

| Status | Route | Priority | Components | Notes |
|--------|-------|----------|------------|-------|
| [ ] | `/dashboard` | P0 | StatCard, Charts | |
| [ ] | `/dashboard/users` | P1 | DataTable, Filters | |
| [ ] | `/dashboard/spaces` | P1 | DataTable, SpaceCard | |
| [ ] | `/dashboard/moderation` | P1 | DataTable, Actions | |
| [ ] | `/dashboard/analytics` | P2 | Charts, StatCard | |

**Components to watch:**
- DataTable
- StatCard
- Charts
- AdminSidebar

---

## 6. FEED & RITUALS (5 pages)
*Currently paused/gated - SKIP for now*

| Status | Route | Priority | Notes |
|--------|-------|----------|-------|
| [ ] | `/feed` | P2 | Paused - showing "Coming Soon" |
| [ ] | `/rituals` | P2 | Feature-gated |
| [ ] | `/rituals/[slug]` | P2 | Feature-gated |
| [ ] | `/leaders` | P2 | Low priority |
| [ ] | `/resources` | P2 | Low priority |

---

## Component Refinement Queue

### Already Refined (Jan 12, 2026)
- [x] Button - Glass pills, spring easing, depth matching Card
- [x] Card - Apple Glass Dark, shadow depth

### High Priority (Tomorrow)
- [ ] Input - Needs glass treatment like Button
- [ ] SpaceCard - Gradient header, immersive portal
- [ ] ProfileCard - 5 context variants
- [ ] ChatMessage - Verify alignment
- [ ] EventCard - RSVP chip, edge warmth
- [ ] ToolCard - Workshop layout, category icons

### Medium Priority
- [ ] Tabs - Active state refinement
- [ ] Modal - Glass overlay
- [ ] Toast - Consistent with Card
- [ ] Badge - Size/color variants
- [ ] Avatar - Rounded-square enforcement

### As Encountered
- [ ] Select
- [ ] Checkbox
- [ ] Switch
- [ ] Progress
- [ ] Slider

---

## Layout Shell Decisions

Track which shell each page type uses:

| Page Type | Shell | Width | Notes |
|-----------|-------|-------|-------|
| Auth pages | VoidShell | 480px | Centered, dark |
| Onboarding | VoidShell | 480px | Centered, step flow |
| Browse/Discovery | BrowseShell | 1200px | Grid, filters |
| Space detail | ConversationShell | Full | 60/40 split |
| Tool editor | CanvasShell | Full | 3-column IDE |
| Profile | BrowseShell | 1000px | Bento grid |
| Settings | TBD | 640px | Form-focused |
| Admin | TBD | Full | Dashboard layout |

---

## Session Notes

### Session 1 (Jan 13, 2026)
*Started:*
*Ended:*
*Pages reviewed:*
*Issues found:*
*Decisions made:*

---

## Workflow Reminders

1. **Start:** `pnpm dev` + `pnpm storybook:dev`
2. **Per page:** Navigate, observe, log issues
3. **Quick fixes:** Do immediately
4. **Lab needed:** Use `/storybook-lab`
5. **Record:** Update this file, DECISIONS.md
6. **Verify:** Check Storybook + page

---

*Created: Jan 12, 2026*
*Session: Tomorrow's rebuild*
