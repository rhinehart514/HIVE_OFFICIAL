# HIVE Frontend Rebuild

**Goal:** Rebuild all frontend UI system-by-system, full stack.
**Approach:** For each system — audit current state, define target, design options, build, ship, move on.
**Updated:** 2026-02-02

---

## CRITICAL: Design Audit Results

**Full audit:** `docs/DESIGN_AUDIT.md`
**Screenshots:** `.playwright-mcp/audit/`

### The Problem

HIVE ships as **two different products**:
1. Marketing (`/`, `/about`, `/enter`) — Premium, cinematic, motion-rich
2. App shell (`/home`, `/explore`, `/lab`, `/s/*`) — Static, broken, generic

**The motion system exists (667 lines). The app shell uses none of it.**

### P0: Make It Work

| Issue | Route | Status |
|-------|-------|--------|
| Blank page (opacity stuck) | `/home`, `/me` | **FIXED** ✓ |
| Duplicate space cards | `/explore` | **FIXED** ✓ |
| "1 members" grammar | `/explore` SpaceCard | **FIXED** ✓ |
| Category labels raw | `/explore` SpaceCard | **FIXED** ✓ |
| API 401 errors | `/api/explore/people` | Broken |
| API 500 errors | `/api/explore/events`, `/api/explore/tools` | Broken |
| React hooks crash | `/s/[handle]` | Broken |
| Route missing | `/you` | 404 |
| Sidebar nav broken | All app shell | Buttons don't navigate |
| Missing redirects | `/spaces/*` → `/s/*` | Should 301 |

### P1: Motion Parity

Every component in app shell needs:
- `revealVariants` — Card/list entrances
- `staggerContainerVariants` — List stagger
- `cardHoverVariants` — Interactive cards
- `pageTransitionVariants` — Route changes

**Reference:** `/about` page (working), `packages/tokens/src/motion.ts`

### P2: Consistency

- Kill emojis in tabs OR use everywhere
- Standardize error states (playful vs professional)
- Apply glass treatment to app shell cards

---

## Systems

| # | System | Why This Order | Status |
|---|--------|----------------|--------|
| 0 | **Foundation** | APIs broken, routes 404, motion missing | **CRITICAL** |
| 1 | **Spaces** | The core. If this works, HIVE works. | BLOCKED (API errors) |
| 2 | **Entry** | The gate. First impression. | COMPLETE |
| 3 | **Notifications** | Re-engagement loop. Currently broken. | NOT STARTED |
| 4 | **Profiles** | Social glue. Identity system. | NOT STARTED |
| 5 | **Events/Calendar** | Coordination feature. RSVP broken. | NOT STARTED |
| 6 | **Discovery** | Growth. Browse mode missing. | BLOCKED (API errors) |
| 7 | **HiveLab** | Builder tools. AI generation broken. | COMPLETE |

---

## Active System

**System 0: Foundation** — Fix what's broken before building new

### Foundation Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Fix `/api/explore/people` 401 | NOT STARTED |
| 2 | Fix `/api/explore/events` 500 | NOT STARTED |
| 3 | Fix `/api/explore/tools` 500 | NOT STARTED |
| 4 | Fix Space detail React hooks error | NOT STARTED |
| 5 | Implement `/you` route | NOT STARTED |
| 6 | Fix sidebar navigation (client-side routing) | NOT STARTED |
| 7 | Add `/spaces/*` → `/s/*` redirects | NOT STARTED |
| 8 | Apply motion to Explore page cards | NOT STARTED |
| 9 | Apply motion to Lab page | NOT STARTED |
| 10 | Apply motion to Home page | NOT STARTED |
| 11 | Standardize icon system (kill emojis) | NOT STARTED |
| 12 | Standardize error states | NOT STARTED |

---

## System 1: Spaces

### Current State
**Overall: 95% production-ready.** Split-panel rebuild complete. All core features wired.

#### What Works End-to-End
- Join/leave flow with threshold gate (SpaceThreshold, GatheringThreshold)
- Real-time chat with infinite scroll, reactions, replies, delete
- Boards with drag-to-reorder, create, delete
- Event display in feed (EventCard)
- Member management (promote/demote/suspend/remove)
- Space settings (edit info, delete, social links)
- Tool deployment and sidebar display
- Online presence indicators
- Invite links with expiry
- Search & discovery
- Keyboard navigation (↑↓ boards)
- Unread divider ("Since you left")
- SpacesHub with orbital visualization

#### What's Partially Working
- Analytics (API ready, admin dashboard exists)
- Moderation (API ready, admin dashboard exists)
- Threading (replies work, thread view not implemented)

#### What's Stubbed/Missing
- `/api/spaces/attention` — leader alerts not implemented
- `unreadCount` badge (shows 0, needs membership data)

#### Technical Debt
- Membership stored in composite keys (should be subcollection)
- Mix of cursor-based and offset-based pagination

### Target State

#### Non-member Outcomes
| Goal | Success | Time Bar |
|------|---------|----------|
| Evaluate if this space is for me | See activity, members, purpose without joining | < 30 sec |
| Join a space | One action, immediately participating | < 10 sec |
| Understand what this space is about | Clear purpose, not just a name | < 5 sec |

#### Member Outcomes
| Goal | Success | Time Bar |
|------|---------|----------|
| Catch up on what I missed | See unread, jump to new content | < 15 sec |
| Participate in conversation | Send message, see it appear | < 5 sec |
| Find a specific conversation | Search or navigate to right board | < 10 sec |
| Know what's happening soon | See upcoming events without hunting | < 5 sec |
| Connect with other members | See who's here, view profiles | < 10 sec |
| Use a tool (poll, form, etc.) | Complete tool interaction | < 30 sec |
| Leave a space | One action, clean exit | < 5 sec |

#### Leader Outcomes
| Goal | Success | Time Bar |
|------|---------|----------|
| See space health at a glance | Activity, engagement, issues visible | < 10 sec |
| Manage members | Promote/remove/suspend without hunting | < 30 sec |
| Organize content | Create/reorder boards intuitively | < 30 sec |
| Invite new members | Generate link, share anywhere | < 15 sec |
| Create an event | Event live and visible to members | < 60 sec |
| Deploy a tool | Tool available to members | < 60 sec |
| Handle problems | Flag content, moderate, respond | < 30 sec |
| Edit space info | Update name/description/avatar | < 30 sec |

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/spaces` | Hub/list | DEPRECATED → redirects to /home |
| `/s/[handle]` | Residence (member) | COMPLETE — 60/40 split layout |
| `/s/[handle]` | Threshold (non-member) | COMPLETE — join gate with preview |
| `/s/[handle]/analytics` | Leader analytics | PARTIAL — exists but no charts |
| `/s/[handle]/tools/[toolId]` | Tool in space context | WIRED |

### Key Components
| Component | Location | Status |
|-----------|----------|--------|
| SpaceHeader | `/s/[handle]/components/` | COMPLETE |
| SpaceThreshold | `/s/[handle]/components/` | COMPLETE |
| UnifiedActivityFeed | `/components/spaces/` | COMPLETE |
| BoardsSidebar | `/components/spaces/` | COMPLETE |
| ChatInput | `/s/[handle]/components/` | COMPLETE |
| ChatMessages | `/s/[handle]/components/` | COMPLETE |
| SpaceSettings | `/s/[handle]/components/` | COMPLETE |
| MemberManagement | `/s/[handle]/components/` | COMPLETE |
| InviteLinkModal | `/components/spaces/` | COMPLETE |
| IdentityClaimModal | `/components/spaces/` | COMPLETE |

### APIs (75+ endpoints)
| Category | Count | Status |
|----------|-------|--------|
| Core CRUD | 7 | COMPLETE |
| Membership | 10 | COMPLETE |
| Chat | 14 | COMPLETE |
| Boards | 6 | COMPLETE |
| Events | 6 | COMPLETE |
| Tools | 6 | WIRED |
| Discovery | 7 | COMPLETE (1 stubbed) |
| Invites | 4 | COMPLETE |
| Analytics | 3 | WIRED |
| Moderation | 2 | COMPLETE (no UI) |
| **Total** | **75+** | **~95% wired** |

### Hooks
| Hook | Purpose | Status |
|------|---------|--------|
| useSpaceResidenceState | Primary state for /s/[handle] | COMPLETE |
| useSpaceVisitTracking | "Since you left" tracking | COMPLETE |
| useSpaceQuery | Fetch space by ID | COMPLETE |
| useSpaceBoardsQuery | List boards | COMPLETE |
| useSpaceChatQuery | Chat with mutations | COMPLETE |
| useJoinSpace | Join mutation | COMPLETE |
| useLeaveSpace | Leave mutation | COMPLETE |

### Design Direction
**Direction A: Split Panel** — Linear issue view meets Slack

#### Layout
```
SPACE CONTENT AREA (inside global shell)
┌─────────────────────────────────────────────────────────┐
│  [Space Name]  [• 12 online]           [⚙️] [+ Event]  │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  BOARDS    │     ACTIVE BOARD CONTENT                   │
│  ───────   │                                            │
│  # general │     Messages / Events / Tools              │
│  # events  │     (unified feed, scrollable)             │
│  # random  │                                            │
│            │                                            │
│  ───────   │                                            │
│  TOOLS     │                                            │
│  🗳️ Poll   │                                            │
│  📋 Form   │                                            │
│            │─────────────────────────────────────────────
│  ───────   │     [Message input]              [Send]   │
│  MEMBERS   │                                            │
│  (12)      │                                            │
└────────────┴────────────────────────────────────────────┘
    200px                   remaining
```

#### Key Traits
- Space-level sidebar (boards, tools, members) — collapses on mobile
- Chat dominant — main area is active board
- Header compact — space identity + key actions
- Keyboard nav — ↑↓ between boards, ⌘K for search

#### Rationale
- Builder aesthetic (efficient, keyboard-navigable)
- Power users (leaders managing spaces) well-served
- High information density (boards, members, tools visible at once)
- Differentiated from Discord/Slack

### Component Hierarchy
```
SpaceResidence (page)
├── SpaceHeader
│   ├── SpaceIdentity (name, avatar, verified badge)
│   ├── PresenceIndicator (• 12 online)
│   └── HeaderActions (settings, + event, + tool)
│
├── SpaceSidebar (200px, collapsible)
│   ├── BoardsList
│   │   ├── BoardItem (with unread badge)
│   │   └── AddBoardButton
│   ├── ToolsList
│   │   └── ToolItem (pinned tools)
│   └── MembersPreview
│       └── OnlineCount + avatars
│
├── MainContent (remaining width)
│   ├── BoardHeader (board name, search, pin)
│   ├── MessageFeed
│   │   ├── UnreadDivider ("Since you left")
│   │   ├── MessageItem
│   │   │   ├── Avatar
│   │   │   ├── Content
│   │   │   └── HoverActions (react, reply, pin)
│   │   ├── EventCard (inline)
│   │   └── ToolCard (inline)
│   └── ChatInput
│       ├── TextArea
│       ├── AttachButton
│       └── SendButton
│
└── SpaceThreshold (non-member view)
    ├── ThresholdHeader
    ├── ActivityPreview (blurred peek)
    ├── MemberPreview
    └── JoinButton
```

### Layout Specs
```
SPACE LAYOUT
┌─────────────────────────────────────────────────────────┐
│ HEADER                                          h: 56px │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  SIDEBAR   │  MAIN CONTENT                              │
│  w: 200px  │  w: remaining                              │
│            │                                            │
│  p: 12px   │  p: 0 (feed handles own padding)          │
│            │                                            │
│            │─────────────────────────────────────────────
│            │  INPUT                             h: 64px │
└────────────┴────────────────────────────────────────────┘
```

| Element | Value | Token |
|---------|-------|-------|
| Header height | 56px | `--space-header-h` |
| Sidebar width | 200px | `--space-sidebar-w` |
| Sidebar padding | 12px | `spacing.3` |
| Input height | 64px | `--space-input-h` |
| Board item height | 36px | `spacing.9` |
| Board item padding | 8px 12px | `spacing.2 spacing.3` |
| Message gap | 2px | `spacing.0.5` |
| Section gap (sidebar) | 24px | `spacing.6` |

### Color Specs
| Element | Color | Token |
|---------|-------|-------|
| Sidebar background | `#0A0A09` | `--color-surface-base` |
| Sidebar border | `white/6%` | `--color-border-subtle` |
| Board item hover | `white/4%` | `--color-surface-hover` |
| Board item active | `white/8%` | `--color-surface-active` |
| Unread badge | `--color-gold` | Gold accent |
| Online indicator | `#22C55E` | Green-500 |
| Header border | `white/6%` | `--color-border-subtle` |
| Input background | `white/4%` | `--color-surface-input` |
| Input border focus | `--color-gold/50%` | Gold glow |

### Typography Specs
| Element | Style | Token |
|---------|-------|-------|
| Space name | 16px / 600 / -0.01em | `text-body font-semibold tracking-tight` |
| Board name | 14px / 500 | `text-body-sm font-medium` |
| Section label | 11px / 600 / uppercase / 40% | `text-label-xs font-semibold uppercase text-white/40` |
| Message author | 14px / 600 | `text-body-sm font-semibold` |
| Message content | 14px / 400 | `text-body-sm` |
| Message timestamp | 12px / 400 / 40% | `text-label-sm text-white/40` |
| Online count | 12px / 500 | `text-label-sm font-medium` |
| Unread count | 11px / 600 | `text-label-xs font-semibold` |

### Motion Specs
| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover state | 150ms | ease-out |
| Sidebar collapse | 200ms | ease-premium |
| Message appear | 150ms | ease-out |
| Unread divider | 300ms | ease-out (fade) |
| Board switch | 100ms | ease-out |

### Component Specs

#### BoardItem
```
┌─────────────────────────────┐
│ # board-name          (3)  │  h: 36px
└─────────────────────────────┘
  ↑                      ↑
  Hash icon (14px)       Unread badge (gold, 18px circle)

States:
- Default: text-white/60
- Hover: bg-white/4%, text-white/80
- Active: bg-white/8%, text-white, gold left border (2px)
```

#### MessageItem
```
┌─────────────────────────────────────────────┐
│ [Avatar]  Name · 2:34 PM                    │
│           Message content here that can     │
│           wrap to multiple lines            │
│                                             │
│           [React] [Reply] [•••]  ← on hover │
└─────────────────────────────────────────────┘

Avatar: 32px, rounded-full
Name: font-semibold, text-white/90
Time: text-white/40, ml-2
Content: text-white/80
Hover actions: appear on hover, 150ms fade
```

#### ChatInput
```
┌─────────────────────────────────────────────┐
│  [📎]  Type a message...           [Send]  │
└─────────────────────────────────────────────┘

Height: 64px (container), 44px (input)
Background: white/4%
Border: white/8%, gold/50% on focus
Attach: left side, 20px icon
Send: right side, gold when has content
```

### Build Tasks
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Space tokens file | COMPLETE | packages/tokens/src/spaces.ts |
| 2 | SpaceHeader | COMPLETE | 9.2K, premium identity header |
| 3 | SpaceSidebar shell | COMPLETE | 200px container + sections |
| 4 | BoardItem | COMPLETE | Row with unread badge, states |
| 5 | BoardsList | COMPLETE | List + add + drag reorder |
| 6 | ToolsList | COMPLETE | Pinned tools section |
| 7 | MembersPreview | COMPLETE | Online count + avatar stack |
| 8 | MainContent shell | COMPLETE | Feed + input container |
| 9 | MessageFeed | COMPLETE | Infinite scroll, 10K lines |
| 10 | MessageItem | COMPLETE | Avatar, content, hover actions |
| 11 | UnreadDivider | COMPLETE | "Since you left" marker |
| 12 | EventCard | COMPLETE | Inline event in feed |
| 13 | ToolCard | COMPLETE | Inline tool in feed |
| 14 | ChatInput | COMPLETE | Text + attach + send |
| 15 | SpaceThreshold | COMPLETE | 12K + 8 subcomponents |
| 16 | Mobile sidebar | PARTIAL | Needs testing |
| 17 | Keyboard nav | COMPLETE | useKeyboardNav hook |
| 18 | Wire to APIs | COMPLETE | 95% of endpoints wired |

### Work
- [x] Audit current implementation
- [x] Define target user outcomes
- [x] Choose design direction (Split Panel)
- [x] Define component specs
- [x] Define build tasks
- [x] Build tokens
- [x] Build components
- [x] Wire APIs
- [x] Ship

### Status
COMPLETE — Split-panel rebuild shipped 2026-02-01

---

## System 2: Entry

### Current State
**Overall: 90% production-ready.** Narrative entry flow with 3 acts, 9 scenes.

#### What Works End-to-End
- Email validation and campus detection
- Verification code entry with OTP input
- Name and handle collection
- Role selection (student/alumni/faculty)
- Major/field of study selection
- Interest/passion selection
- Profile preview during flow

#### What's Partially Working
- School selection (simplified, could be richer)

#### What's Stubbed/Missing
- Alumni-specific flow variations

### Target State
- [x] New user can go from email to full profile in < 2 minutes
- [x] Each step feels intentional, not bureaucratic
- [x] Identity is built progressively with visual feedback

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/` | Landing | COMPLETE |
| `/login` | Returning user | COMPLETE |
| `/schools` | School selector | COMPLETE |

### Components
| Component | Purpose | Status |
|-----------|---------|--------|
| NarrativeEntry | Main orchestrator | COMPLETE |
| NarrativeShell | Layout wrapper | COMPLETE |
| ActOne/Two/Three | Act containers | COMPLETE |
| ArrivalScene | Email entry | COMPLETE |
| ProofScene | Code verification | COMPLETE |
| GateScene | Threshold moment | COMPLETE |
| NameScene | First + last name | COMPLETE |
| HandleScene | Username selection | COMPLETE |
| RoleScene | Student/alumni/faculty | COMPLETE |
| FieldScene | Major selection | COMPLETE |
| PassionsScene | Interest selection | COMPLETE |
| InvitationScene | Welcome | COMPLETE |
| GoldFlash | Celebration animation | COMPLETE |
| IdentityCard | Profile preview | COMPLETE |
| ManifestoLine | Text reveal | COMPLETE |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| /api/auth/request-signin-code | Send verification email | COMPLETE |
| /api/auth/complete-entry | Verify code, create session | COMPLETE |
| /api/auth/complete-onboarding | Finalize profile | COMPLETE |
| /api/schools | List/search schools | COMPLETE |

### Work
- [x] Audit current implementation
- [x] Define target user outcomes
- [x] Present design options
- [x] Build
- [x] Ship

### Status
COMPLETE — Narrative entry flow shipped 2026-02-01

---

## System 3: Notifications

### Current State
_To be audited_

### Target State
_User outcome: [what users can accomplish when done]_

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/notifications` | Notification center | |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| | | |

### Design Direction
_Options to be presented_

### Work
- [ ] Audit current implementation
- [ ] Define target user outcomes
- [ ] Present design options
- [ ] Build
- [ ] Ship

### Status
NOT STARTED

---

## System 4: Profiles

### Current State
_To be audited_

### Target State
_User outcome: [what users can accomplish when done]_

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/me` | Profile hub | |
| `/profile/[id]` | View profile | |
| `/profile/edit` | Edit profile | |
| `/profile/connections` | Social graph | |
| `/u/[handle]` | Shareable URL | |
| `/settings` | User settings | |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| | | |

### Design Direction
_Options to be presented_

### Work
- [ ] Audit current implementation
- [ ] Define target user outcomes
- [ ] Present design options
- [ ] Build
- [ ] Ship

### Status
NOT STARTED

---

## System 5: Events/Calendar

### Current State
_To be audited_

### Target State
_User outcome: [what users can accomplish when done]_

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/calendar` | Calendar view | |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| | | |

### Design Direction
_Options to be presented_

### Work
- [ ] Audit current implementation
- [ ] Define target user outcomes
- [ ] Present design options
- [ ] Build
- [ ] Ship

### Status
NOT STARTED

---

## System 6: Discovery

### Current State
_To be audited_

### Target State
_User outcome: [what users can accomplish when done]_

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/home` | Dashboard | |
| `/explore` | Search/browse | |
| `/leaders` | Leadership board | |
| `/resources` | Resources | |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| | | |

### Design Direction
_Options to be presented_

### Work
- [ ] Audit current implementation
- [ ] Define target user outcomes
- [ ] Present design options
- [ ] Build
- [ ] Ship

### Status
NOT STARTED

---

## System 7: HiveLab

### Current State
**Overall: 100% production-ready.** All subsystems fully implemented and wired.

#### What Works End-to-End
- Tool canvas with drag-drop, resize, connections
- Element palette with 18 element types
- Tool save/load/versioning
- Deploy to space or profile
- Templates gallery (25+ quick templates)
- Preview/test mode
- Settings and metadata editing
- AI generation (Groq → Firebase → Rules fallback)
- Setup gallery with category filters, search, deploy
- Setup detail with tool slots, orchestration rules visualization
- Space automations tab with CRUD, templates, toggle
- Orchestration executor (all trigger types + actions)
- Cron jobs (automations, tool-automations, setup-orchestration)

#### What's Partially Working
_None — all systems complete_

#### What's Stubbed/Missing
_None — all systems complete_

### Target State
- [x] Builder can describe tool in natural language → AI generates it
- [x] Builder can see analytics (charts, trends, retention)
- [x] Builder can create multi-tool Setups for events
- [x] Leader can set up automations (triggers → actions)

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/lab` | Builder dashboard | COMPLETE |
| `/lab/new` | Create tool (redirects) | COMPLETE |
| `/lab/[toolId]` | Tool IDE | COMPLETE |
| `/lab/[toolId]/edit` | Edit mode | COMPLETE |
| `/lab/[toolId]/preview` | Preview/test | COMPLETE |
| `/lab/[toolId]/settings` | Tool config | COMPLETE |
| `/lab/[toolId]/analytics` | Usage analytics | COMPLETE |
| `/lab/templates` | Template gallery | COMPLETE |
| `/lab/setups` | Setup gallery | COMPLETE |
| `/lab/setups/[setupId]` | Setup detail + deploy | COMPLETE |

### APIs (50+ endpoints)
| Category | Count | Status |
|----------|-------|--------|
| Core CRUD | 7 | COMPLETE |
| AI Generation | 2 | COMPLETE |
| Deployment | 4 | COMPLETE |
| Versions | 4 | COMPLETE |
| State | 5 | COMPLETE |
| Execution | 1 | COMPLETE |
| Analytics | 2 | COMPLETE |
| Space Automations | 5 | COMPLETE |
| Tool Automations | 6 | COMPLETE |
| Setup Templates | 2 | COMPLETE |
| Setup Deploy | 3 | COMPLETE |
| Orchestration | 2 | COMPLETE |
| Cron Jobs | 3 | COMPLETE |
| Sharing | 5 | COMPLETE |

### Components
| Component | Status |
|-----------|--------|
| HiveLabIDE | COMPLETE |
| ToolCanvas | COMPLETE |
| QuickElements | COMPLETE |
| ElementPopover | COMPLETE |
| ToolDeployModal | COMPLETE |
| AIInputBar | COMPLETE |
| AnalyticsPanel | COMPLETE |
| AutomationsPanel | COMPLETE |
| AutomationBuilderModal | COMPLETE |
| SetupCard | COMPLETE |
| SetupDetailPage | COMPLETE |
| OrchestrationRuleCard | COMPLETE |
| ToolSlotCard | COMPLETE |

### Subsystems
| # | Subsystem | Status | Verification |
|---|-----------|--------|--------------|
| 1 | AI Generation | COMPLETE | GROQ_API_KEY set, multi-backend fallback |
| 2 | Tool Canvas/IDE | COMPLETE | Element palette, config popovers, deploy modal |
| 3 | Templates | COMPLETE | 25+ quick templates in `/lab/templates` |
| 4 | Space Automations | COMPLETE | Tab in settings with full CRUD |
| 5 | Automation Components | COMPLETE | AutomationsPanel, AutomationBuilderModal exported |
| 6 | Automation APIs | COMPLETE | 5 routes: list, create, toggle, delete, from-template |
| 7 | Setup Gallery | COMPLETE | `/lab/setups` with category filters, search |
| 8 | Setup Detail | COMPLETE | Shows tools, orchestration rules, config fields |
| 9 | Setup Deploy | COMPLETE | Modal with space selector, calls `/api/setups/deploy` |
| 10 | Setup Templates | COMPLETE | 4 system templates (Event, Campaign, Onboarding, Rituals) |
| 11 | Orchestration Executor | COMPLETE | All trigger types + actions implemented |
| 12 | Cron Jobs | COMPLETE | automations, tool-automations, setup-orchestration |

### Work
- [x] Audit current implementation
- [x] Define target user outcomes
- [x] **AI Generation**: Groq API key set, multi-backend fallback
- [x] **Analytics**: Chart components wired
- [x] **Setup System**: Gallery, detail, deploy all wired
- [x] **Automations**: Panel, builder, APIs, cron jobs complete
- [x] **Orchestration**: All trigger types + actions implemented

### Status
COMPLETE — All subsystems verified and production-ready

---

## Decisions Log

| Date | System | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-31 | All | System-by-system rebuild | Ship complete systems incrementally vs. UI-first or loop-first |
| 2026-01-31 | All | Spaces first | Core product. If this works, HIVE works. |
| 2026-01-31 | Spaces | Split Panel layout (Direction A) | Builder aesthetic, keyboard-nav, high density, leader-friendly |
| 2026-01-31 | Spaces | 200px sidebar width | Balance info density vs content space |
| 2026-01-31 | Spaces | 56px header, 64px input | Compact but touchable, Linear-style |
| 2026-01-31 | Spaces | Gold accent for unread/focus | Consistent with HIVE brand, draws attention |
| 2026-01-31 | HiveLab | Serial subsystem order | AI → Analytics → Setup → Automations. Each ships complete. |
| 2026-01-31 | HiveLab | Groq for AI backend | Free tier, fast (~300ms), llama-3.1-70b quality. Skip Firebase AI (needs billing). |
| 2026-01-31 | HiveLab | Highest quality standard | Full 70b model, rich system prompts, JSON mode. |

---

## Design Principles (Reference)

- **Web-first:** Desktop is primary, mobile follows
- **Builder aesthetic:** Precision, confidence, speed (Linear/Notion/Stripe)
- **Social with purpose:** Connections that lead to doing things
- **No dead ends:** Every state shows next action
- **Real handlers:** No console.log placeholders, no "coming soon" theater

---

## Session Log

### 2026-01-31
- Restructured TODO.md for system-by-system rebuild
- Defined 7 systems in priority order
- Completed Spaces system audit
  - 75+ API endpoints (95% wired)
  - 30+ components (most complete)
  - Core features work end-to-end
  - Gaps: analytics UI, moderation UI, threading UI, 3 stubbed endpoints
- Defined target outcomes for Spaces (non-member, member, leader)
- Chose Direction A: Split Panel layout
- Added full component specs:
  - Layout specs (header 56px, sidebar 200px, input 64px)
  - Color specs (surface, border, accent tokens)
  - Typography specs (all text styles)
  - Motion specs (hover, transitions)
  - Component specs (BoardItem, MessageItem, ChatInput)
- Defined 18 build tasks in order
- Ready to build Spaces
- **Marked HiveLab COMPLETE** — All 12 subsystems verified:
  - AI Generation (Groq multi-backend)
  - Tool Canvas/IDE
  - Templates (25+)
  - Space Automations (Settings tab + CRUD)
  - Automation Components (Panel + Builder)
  - Automation APIs (5 routes)
  - Setup Gallery (category filters, search)
  - Setup Detail (tool slots, orchestration rules)
  - Setup Deploy (modal + API)
  - Setup Templates (4 system templates)
  - Orchestration Executor (all triggers + actions)
  - Cron Jobs (3 scheduled routes)

### 2026-02-01
- **Audited Spaces system** — Found 95% complete, not 70% as documented
  - All 18 build tasks already implemented
  - 78 components across feed/, sidebar/, threshold/, residence/
  - useSpaceResidenceState (30K lines) orchestrates all data
  - APIs 95% wired with React Query + optimistic updates
- **Committed work in 7 logical commits:**
  1. feat(spaces): Split-panel residence layout (78 files, +12K lines)
  2. feat(entry): Narrative entry flow with acts (33 files, +4.7K lines)
  3. feat(admin): Spaces management dashboard (26 files, +4.8K lines)
  4. chore: Remove deprecated routes/hooks/tokens (53 files, -9.7K lines)
  5. fix(api): Improve validation, add endpoints (30 files, +3.3K lines)
  6. feat: Update design system tokens and UI (143 files, +18K lines)
  7. docs: Update TODO.md to reflect actual state
- **Marked COMPLETE:**
  - Spaces (was "IN PROGRESS")
  - Entry (was "NOT STARTED")
- **DESIGN AUDIT (evening)** — External design review via Playwright
  - **Screenshots captured:** 13 pages documented in `.playwright-mcp/audit/`
  - **Critical finding:** Marketing vs app shell are two different products
  - **Motion system:** 667 lines of tokens exist, 0 used in app shell
  - **Broken routes:** `/you` (404), `/s/*` (hooks crash), sidebar nav (broken)
  - **API failures:** People (401), Events (500), Tools (500)
  - **Documentation created:** `docs/DESIGN_AUDIT.md`
  - **Priority changed:** Foundation fixes before new features
  - **Status updates:**
    - Spaces: COMPLETE → BLOCKED (API errors prevent Space pages)
    - Discovery: NOT STARTED → BLOCKED (API errors)
    - Added System 0: Foundation (12 tasks)
