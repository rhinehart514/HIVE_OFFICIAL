# HIVE Vertical Slice Specifications

**Last Updated:** December 2025

---

## Philosophy

Every feature built to production quality. No "basic" versions. Feature flags control rollout, not quality.

**The Rule:** If it's worth building, it's worth building right. If it's not ready for users, flag it off.

---

## Slice 1: Spaces

### What Spaces Is

Spaces are the heart of HIVE — Discord-quality community hubs native to campus life.

**The Experience:**
- Enter a space → immediately see active conversation
- Sidebar shows context (events, tools, members) without leaving chat
- Everything flows through chat, but chat is enhanced with interactive components
- Leaders customize with HiveLab tools deployed to sidebar or inline

**Why It Matters (Student Autonomy Lens):**
- **Community Autonomy**: Leaders have full control. No permission needed.
- **Tool Autonomy**: HiveLab tools deployed where members already are
- **Attention Autonomy**: Members choose what spaces to follow, how to engage

---

### Current State: 85% Complete

**What's Working:**
| Feature | Status | Location |
|---------|--------|----------|
| Real-time chat (SSE) | Done | `useChatMessages` (953 lines) |
| Threading | Done | `SpaceChatBoard` |
| Reactions | Done | Chat components |
| Message editing/deletion | Done | Chat API |
| Board (channel) system | Done | `SpaceChatService` (1,478 lines) |
| Auto-General board | Done | Service auto-creates |
| Pinned messages | Done | `usePinnedMessages` (161 lines) |
| Role hierarchy | Done | owner → admin → mod → member |
| 60/40 layout | Done | Space page |
| Sidebar tools | Done | HiveLab integration |
| Ownership detection | Done | createdBy + leaders array |
| Rate limiting | Done | 20 msg/min |
| XSS protection | Done | Input sanitization |
| Premium UI variant | Done | ?premium=true flag |

**What's Broken/Missing:**
| Issue | Priority | Impact |
|-------|----------|--------|
| Typing indicator spam | P1 | 2s polling creates noise |
| Ghost mode incomplete | P2 | Privacy feature gaps |
| Mobile navigation polish | P2 | Drawer UX needs work |
| Automations panel mock | P2 | Shows UI, no real triggers |
| Read receipts | P3 | Not implemented |
| Thread notifications | P3 | No notification on replies |

---

### Complete Spaces Specification

#### 1. Core Chat Experience (100% → 100%)

**Already Complete:**
- Real-time SSE streaming from Firestore
- Optimistic updates with rollback on failure
- Message CRUD with proper permissions
- Threading with reply indicators
- Reactions (emoji picker + quick reactions)
- @ mentions with autocomplete
- Link previews
- Image/file attachments
- Message search (basic)

**Polish Required:**
- [ ] Fix typing indicator: Switch to presence-based (write to RTD only when actually typing, TTL 5s)
- [ ] Add "X people typing" indicator (not just list of names)
- [ ] Smooth scroll-to-bottom on new messages (currently jumps)
- [ ] Unread message indicator (line + badge)

#### 2. Board System (100% → 100%)

**Already Complete:**
- Create/edit/delete boards
- Auto-create "General" on space creation
- Board tab bar navigation
- Per-board message streams
- Board permissions (who can post)

**Polish Required:**
- [ ] Board reordering (drag tabs)
- [ ] Board mute/unmute per user
- [ ] Archive board (hide but preserve)
- [ ] Board-level pinned messages

#### 3. Sidebar (90% → 100%)

**Currently:**
- Upcoming events widget
- Deployed HiveLab tools
- Member list (with search)
- Space info/description

**Complete:**
- [ ] Collapsible sections with memory
- [ ] Tool quick-actions (expand inline vs new page)
- [ ] "Add to sidebar" flow for leaders
- [ ] Sidebar section reordering
- [ ] Custom sidebar layouts (compact, expanded, auto)

#### 4. Leadership Tools (85% → 100%)

**Currently:**
- Role management
- Member invite/remove
- Space settings (name, description, category)
- Analytics stub

**Complete:**
- [ ] Real analytics (not mock data):
  - Messages per day/week/month
  - Active members (DAU/WAU/MAU)
  - Peak activity times
  - Top contributors
  - Tool engagement
- [ ] Moderation queue (flagged messages)
- [ ] Announcement system (banner + notification)
- [ ] Scheduled messages
- [ ] Export member list

#### 5. Mobile Experience (75% → 100%)

**Currently:**
- Responsive layout
- Mobile drawer for sidebar
- Touch-friendly message actions

**Complete:**
- [ ] Bottom sheet for message actions
- [ ] Swipe gestures:
  - Swipe right → reply
  - Swipe left → reactions
  - Long press → full menu
- [ ] Pull-to-refresh
- [ ] Keyboard-aware input
- [ ] Image gallery viewer (swipe between)
- [ ] Voice message recording (flagged off initially)

#### 6. Inline Components (80% → 100%)

**Currently:**
- Polls inline in chat
- RSVP buttons
- Countdown timers

**Complete:**
- [ ] Inline forms (quick surveys)
- [ ] Inline scheduling (Calendly-like)
- [ ] Expandable cards (collapse/expand rich content)
- [ ] Live counters (attendance, signups)
- [ ] Reactions summary on inline components

#### 7. Notifications (60% → 100%)

**Currently:**
- In-app notification center
- Basic toast notifications

**Complete:**
- [ ] Push notifications (mobile web + desktop)
- [ ] Email digests (daily/weekly summary)
- [ ] Per-space notification settings:
  - All messages
  - Mentions only
  - Nothing
- [ ] Per-board settings
- [ ] Quiet hours
- [ ] Notification batching (don't spam)

#### 8. Discovery & Join Flow (85% → 100%)

**Currently:**
- Browse spaces page
- Category filtering
- Search by name
- Join public spaces
- Request access to private

**Complete:**
- [ ] "Spaces for you" recommendations (based on interests)
- [ ] Trending spaces (most activity recently)
- [ ] "Your friends are here" indicator
- [ ] Join confirmation with space info modal
- [ ] Onboarding message to new members
- [ ] Welcome flow for first-time visitors

---

### Spaces Feature Flags

```typescript
const SPACES_FLAGS = {
  // Rollout Stage
  'spaces.premium_ui': { default: false, targets: ['beta_users'] },
  'spaces.voice_messages': { default: false, targets: [] },

  // Density Triggers
  'spaces.trending_algorithm': {
    default: false,
    trigger: 'active_spaces > 50'
  },
  'spaces.cross_space_suggestions': {
    default: false,
    trigger: 'user_spaces > 2'
  },

  // Feature Categories
  'spaces.advanced_moderation': { default: false, targets: ['space_leaders'] },
  'spaces.scheduled_messages': { default: false, targets: ['space_leaders'] },
  'spaces.analytics_v2': { default: false, targets: ['space_leaders'] },
  'spaces.email_digests': { default: false, targets: [] },
  'spaces.push_notifications': { default: false, targets: [] },

  // Always On
  'spaces.real_time_chat': { default: true },
  'spaces.threading': { default: true },
  'spaces.reactions': { default: true },
  'spaces.inline_components': { default: true },
};
```

---

### Spaces Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SPACE PAGE                                   │
│  apps/web/src/app/spaces/[spaceId]/page.tsx (1796 lines)           │
├─────────────────────────────────┬───────────────────────────────────┤
│                                 │                                   │
│       CHAT BOARD (60%)          │         SIDEBAR (40%)             │
│                                 │                                   │
│  ┌─────────────────────────┐    │  ┌─────────────────────────────┐ │
│  │ useChatMessages (953L)  │    │  │ Events Widget               │ │
│  │ - SSE streaming         │    │  │ - space-events element      │ │
│  │ - Optimistic updates    │    │  │ - Real-time from API        │ │
│  │ - Thread management     │    │  └─────────────────────────────┘ │
│  │ - Reaction handling     │    │                                   │
│  └─────────────────────────┘    │  ┌─────────────────────────────┐ │
│                                 │  │ HiveLab Tools               │ │
│  ┌─────────────────────────┐    │  │ - placedTools from space    │ │
│  │ SpaceChatBoard          │    │  │ - InlineElementRenderer     │ │
│  │ - Message list          │    │  └─────────────────────────────┘ │
│  │ - Input composer        │    │                                   │
│  │ - Thread panel          │    │  ┌─────────────────────────────┐ │
│  │ - Reactions             │    │  │ Members                     │ │
│  └─────────────────────────┘    │  │ - member-list element       │ │
│                                 │  │ - Role badges               │ │
├─────────────────────────────────┴───────────────────────────────────┤
│                      BOARD TAB BAR                                   │
│  [General] [Events] [Study Group] [Announcements] [+]               │
└─────────────────────────────────────────────────────────────────────┘

Backend:
┌─────────────────────────────────────────────────────────────────────┐
│ SpaceChatService (1478 lines) - packages/core/application/spaces/  │
├─────────────────────────────────────────────────────────────────────┤
│ - createMessage()      - Threading, mentions, attachments           │
│ - updateMessage()      - Edit with history                          │
│ - deleteMessage()      - Soft delete with permission check          │
│ - createBoard()        - Auto-General on space creation             │
│ - addReaction()        - Emoji reactions with user tracking         │
│ - getPinnedMessages()  - Per-board pinned messages                  │
│ - getMessagesStream()  - SSE real-time via Firestore onSnapshot     │
└─────────────────────────────────────────────────────────────────────┘

API Routes:
┌─────────────────────────────────────────────────────────────────────┐
│ /api/spaces/[spaceId]/                                              │
│ ├── route.ts           - GET space, PATCH update, DELETE           │
│ ├── chat/route.ts      - GET/POST messages                         │
│ ├── chat/stream/       - SSE endpoint                              │
│ ├── boards/            - CRUD boards                                │
│ ├── members/           - GET/POST/DELETE members                   │
│ └── analytics/         - GET engagement metrics                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Slice 2: HiveLab

### What HiveLab Is

HiveLab is where leaders build tools that make their communities unique.

**The Experience:**
- "I need a poll for event locations" → describe in plain English → AI generates it
- Drag-and-drop canvas for visual composition
- 24 elements across 3 tiers (Universal, Connected, Space)
- Deploy to sidebar, inline in chat, or standalone pages
- Real-time state persistence

**Why It Matters (Student Autonomy Lens):**
- **Tool Autonomy**: Don't wait for us to add features. Create what you need.
- **Creation**: Building is the skill that matters. HiveLab is the canvas.
- **Sharing**: Tools built for one space template to others

---

### Current State: 80% Complete

**What's Working:**
| Feature | Status | Location |
|---------|--------|----------|
| AI generation | Done | `/api/tools/generate` |
| Visual canvas | Done | `hivelab-ide.tsx`, `ide-canvas.tsx` |
| 24 element library | Done | `element-system.ts` |
| Element renderers | Done | `element-renderers.tsx` (2500+ lines) |
| DnD composition | Done | `DndStudioProvider`, `SortableCanvasElement` |
| Properties panel | Done | `properties-panel.tsx` |
| Tool deployment | Done | `ToolDeployModal` |
| Inline rendering | Done | `InlineElementRenderer` (764 lines) |
| Runtime execution | Done | `useToolRuntime` (596 lines) |
| State persistence | Done | Firestore + auto-save |
| Local storage backup | Done | `local-tool-storage.ts` |
| Templates | Done | `TOOL_TEMPLATES` in element-system |

**What's Broken/Missing:**
| Issue | Priority | Impact |
|-------|----------|--------|
| Analytics mock data | P1 | Shows fake metrics |
| No undo/redo | P2 | Canvas editing frustrating |
| Connection cascade incomplete | P2 | Data flow between elements buggy |
| Template browser limited | P2 | Only 3 templates |
| No collaboration | P3 | Single user editing |
| No version history | P3 | Can't revert changes |

---

### Complete HiveLab Specification

#### 1. AI Generation (90% → 100%)

**Currently:**
- Natural language → tool composition
- Streaming response
- Element selection based on intent

**Complete:**
- [ ] Intent detection improvement:
  - "I need attendance tracking" → suggests counter + member-selector
  - "Weekly check-in" → suggests form + timer + announcement
  - "Competition" → suggests leaderboard + counter + timer
- [ ] Generation presets:
  - "Quick poll" → single poll element
  - "Event signup" → form + rsvp + countdown
  - "Community tracker" → stats + leaderboard + chart
- [ ] Iteration support:
  - "Add a timer to this"
  - "Make the poll anonymous"
  - "Change colors to match our brand"
- [ ] Context awareness:
  - Include space info in generation
  - Suggest space-tier elements for leaders
  - Reference existing tools

#### 2. Visual Canvas (85% → 100%)

**Currently:**
- Drag-and-drop from palette
- Grid-based positioning
- Resize handles
- Selection highlighting
- Properties panel

**Complete:**
- [ ] Undo/redo (command pattern):
  - Ctrl+Z / Ctrl+Shift+Z
  - Undo stack with 50 actions
  - Group operations (multi-element move)
- [ ] Multi-select:
  - Shift+click to add to selection
  - Drag to box-select
  - Ctrl+A to select all
- [ ] Alignment tools:
  - Align left/center/right
  - Distribute evenly
  - Snap to grid with toggle
- [ ] Copy/paste:
  - Copy single element
  - Copy multiple elements
  - Paste with offset
- [ ] Canvas controls:
  - Zoom in/out (scroll + modifier)
  - Pan (space + drag)
  - Fit to view
  - Reset zoom
- [ ] Keyboard shortcuts:
  - Delete → remove selected
  - Arrow keys → nudge
  - Tab → next element

#### 3. Element Library (100% → 100%)

**Current Elements (24 total):**

**Universal (12)** — Everyone can use:
- search-input, filter-selector, result-list
- date-picker, tag-cloud, map-view
- chart-display, form-builder, countdown-timer
- poll-element, leaderboard, notification-display

**Connected (5)** — Pulls public HIVE data:
- event-picker (campus events)
- space-picker (space directory)
- user-selector (user search)
- rsvp-button (event signup)
- connection-list (user connections)

**Space (7)** — Leaders only, space data:
- member-list, member-selector
- space-events, space-feed, space-stats
- announcement, role-gate

**New Elements to Add:**
- [ ] `text-block` — Rich text display with markdown
- [ ] `image-upload` — User-uploaded images with gallery
- [ ] `link-card` — OG preview for URLs
- [ ] `schedule-picker` — When2meet-style availability
- [ ] `progress-bar` — Goal tracking with milestones
- [ ] `embed` — YouTube, Spotify, external embeds
- [ ] `qr-code` — Generate QR for tool/space/event
- [ ] `reaction-poll` — Quick emoji-based voting

#### 4. Properties Panel (80% → 100%)

**Currently:**
- Config editing per element
- Type-appropriate inputs (text, number, boolean, select)
- Real-time preview

**Complete:**
- [ ] Conditional visibility:
  - Show/hide based on other element values
  - Role-based visibility (admin only)
- [ ] Data binding:
  - Connect element to data source
  - Map fields explicitly
- [ ] Styling options:
  - Color picker for accent colors
  - Size presets (small, medium, large)
  - Custom CSS (advanced mode)
- [ ] Action configuration:
  - On submit → trigger action
  - On value change → update other elements
  - External webhooks (flagged)

#### 5. Deployment (85% → 100%)

**Currently:**
- Deploy to space sidebar
- Deploy to profile widget
- Inline chat integration
- Standalone page URL

**Complete:**
- [ ] Deployment preview:
  - See how it looks in sidebar before deploying
  - Mobile preview
- [ ] Deployment settings:
  - Who can see (all members, roles, specific users)
  - Who can interact
  - Collect analytics (on/off)
- [ ] Multi-deployment:
  - Same tool to multiple spaces
  - Track where deployed
- [ ] Undeployment:
  - Remove from target
  - Archive vs delete
- [ ] Embed code:
  - Generate iframe embed for external sites

#### 6. Templates (50% → 100%)

**Currently:**
- 3 basic templates (search, event manager, analytics)
- Use template → creates copy

**Complete:**
- [ ] Template gallery:
  - Categorized (Engagement, Events, Admin, Fun)
  - Preview before use
  - Popularity/usage metrics
- [ ] Save as template:
  - Any tool → template
  - Public vs private templates
  - Template versioning
- [ ] Featured templates:
  - Curated by HIVE team
  - Community submissions
- [ ] Template customization:
  - Quick start wizard
  - Fill in the blanks (title, options, etc.)

**Initial Template Set:**
| Template | Elements | Use Case |
|----------|----------|----------|
| Quick Poll | poll-element | Instant voting |
| Event Signup | form + rsvp + countdown | Event registration |
| Weekly Check-in | form + timer + notification | Recurring engagement |
| Leaderboard | leaderboard + counter | Gamification |
| Meeting Scheduler | schedule-picker + user-selector | Coordination |
| Feedback Form | form + chart | Collect responses |
| Announcement Board | announcement + space-feed | Broadcasts |
| Study Timer | timer + leaderboard | Focus sessions |
| Resource Directory | search + result-list + filter | Curated links |
| RSVP Tracker | rsvp + member-list + countdown | Attendance |

#### 7. Analytics (30% → 100%)

**Currently:**
- Mock data displayed
- UI components exist

**Complete (Real Data):**
- [ ] Tool engagement:
  - Views (unique, total)
  - Interactions (per element)
  - Completion rate (forms)
- [ ] User analytics:
  - Who interacted
  - When (time distribution)
  - Return users
- [ ] Element analytics:
  - Poll results over time
  - Form submission patterns
  - Timer usage
- [ ] Export:
  - CSV export of responses
  - Chart images
- [ ] Insights:
  - "Most popular option was X"
  - "Peak usage at Y time"
  - Comparison to similar tools

#### 8. Collaboration (0% → 100%)

**Currently:**
- Single user editing only

**Complete (Flagged for Later):**
- [ ] Real-time collaboration:
  - See other cursors
  - Lock element being edited
  - Conflict resolution
- [ ] Comments:
  - Comment on elements
  - Resolve comments
- [ ] Share for feedback:
  - View-only link
  - Comment-only link
- [ ] Version history:
  - Auto-save versions
  - Named versions
  - Restore previous

---

### HiveLab Feature Flags

```typescript
const HIVELAB_FLAGS = {
  // Rollout Stage
  'hivelab.ai_generation': { default: true, targets: ['space_leaders'] },
  'hivelab.collaboration': { default: false, targets: [] },
  'hivelab.webhooks': { default: false, targets: [] },

  // Feature Categories
  'hivelab.advanced_styling': { default: false, targets: ['power_users'] },
  'hivelab.embed_export': { default: false, targets: [] },
  'hivelab.template_sharing': { default: false, targets: ['space_leaders'] },
  'hivelab.analytics_v2': { default: false, targets: ['space_leaders'] },

  // Element Flags
  'hivelab.element.schedule_picker': { default: false, targets: ['beta_users'] },
  'hivelab.element.embed': { default: false, targets: [] },
  'hivelab.element.qr_code': { default: true, targets: ['space_leaders'] },

  // Always On
  'hivelab.visual_canvas': { default: true },
  'hivelab.core_elements': { default: true },
  'hivelab.deployment': { default: true },
  'hivelab.templates': { default: true },
};
```

---

### HiveLab Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      HIVELAB IDE                                     │
│  apps/web/src/app/tools/[toolId]/edit/page.tsx                      │
├─────────┬───────────────────────────────────────────────┬───────────┤
│         │                                               │           │
│ PALETTE │              CANVAS                           │ INSPECTOR │
│         │                                               │           │
│ Elements│  ┌─────────────────────────────────────────┐  │ Properties│
│ by tier │  │                                         │  │ Config    │
│         │  │   Drag-and-drop composition             │  │ Data      │
│ ┌─────┐ │  │   Grid-based layout                     │  │ Actions   │
│ │Univ.│ │  │   Selection + resize handles            │  │ Style     │
│ └─────┘ │  │                                         │  │           │
│ ┌─────┐ │  └─────────────────────────────────────────┘  │ ┌───────┐ │
│ │Conn.│ │                                               │ │ Save  │ │
│ └─────┘ │  ┌─────────────────────────────────────────┐  │ └───────┘ │
│ ┌─────┐ │  │ AI Input: "Create a poll for..."       │  │ ┌───────┐ │
│ │Space│ │  └─────────────────────────────────────────┘  │ │Deploy │ │
│ └─────┘ │                                               │ └───────┘ │
├─────────┴───────────────────────────────────────────────┴───────────┤
│                        PREVIEW / EDIT TOGGLE                         │
└─────────────────────────────────────────────────────────────────────┘

Element System:
┌─────────────────────────────────────────────────────────────────────┐
│ packages/ui/src/lib/hivelab/element-system.ts                       │
├─────────────────────────────────────────────────────────────────────┤
│ ElementRegistry (singleton)                                          │
│ - registerElement()                                                  │
│ - getElement(id)                                                     │
│ - getElementsByCategory()                                            │
│ - getAllElements()                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ ElementEngine                                                        │
│ - executeComposition()                                               │
│ - processDataFlow() — connection cascade                             │
└─────────────────────────────────────────────────────────────────────┘

Renderers:
┌─────────────────────────────────────────────────────────────────────┐
│ packages/ui/src/components/hivelab/element-renderers.tsx (2500L)    │
├─────────────────────────────────────────────────────────────────────┤
│ renderElement(elementId, props) — Main renderer                      │
│ renderElementSafe() — With error boundary                            │
│                                                                      │
│ Per-element components:                                              │
│ - SearchInputElement       - PollElement                             │
│ - FilterSelectorElement    - LeaderboardElement                      │
│ - ResultListElement        - CountdownTimerElement                   │
│ - DatePickerElement        - TimerElement                            │
│ - FormBuilderElement       - CounterElement                          │
│ - ChartDisplayElement      - RsvpButtonElement                       │
│ - MemberListElement        - AnnouncementElement                     │
│ - ... (24 total)           - RoleGateElement                         │
└─────────────────────────────────────────────────────────────────────┘

Runtime:
┌─────────────────────────────────────────────────────────────────────┐
│ apps/web/src/hooks/use-tool-runtime.ts (596 lines)                  │
├─────────────────────────────────────────────────────────────────────┤
│ - SSE real-time sync                                                 │
│ - State persistence (Firestore)                                      │
│ - Action execution                                                   │
│ - Auto-save (2s debounce)                                           │
│ - Retry logic with exponential backoff                              │
└─────────────────────────────────────────────────────────────────────┘

API Routes:
┌─────────────────────────────────────────────────────────────────────┐
│ /api/tools/                                                          │
│ ├── route.ts           - GET list, POST create                      │
│ ├── generate/          - AI generation                               │
│ ├── [toolId]/          - GET/PATCH/DELETE                           │
│ ├── [toolId]/deploy/   - Deploy to target                           │
│ ├── [toolId]/state/    - State persistence                          │
│ ├── [toolId]/execute/  - Action execution                           │
│ ├── [toolId]/analytics/ - Usage metrics                             │
│ └── browse/            - Marketplace listing                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Winter Launch Priorities

### Leader Value First

For soft launch (end of December), leaders need to see immediate value:

**Spaces — Winter Must-Haves:**
1. Real-time chat working flawlessly
2. Board creation and management
3. Member management
4. Sidebar with deployed tools
5. Basic analytics (real data, not mock)

**HiveLab — Winter Must-Haves:**
1. AI generation working reliably
2. Core 24 elements rendering correctly
3. Deployment to sidebar working
4. Tool state persistence
5. 10 quality templates

**Flagged Off for Winter:**
- Email notifications
- Push notifications
- Voice messages
- Collaboration features
- Advanced analytics
- External embeds
- Webhooks

---

## Success Criteria

### Spaces Complete When:
- [ ] Leader can create space, add boards, invite members in <2 minutes
- [ ] Chat feels instant (no perceptible lag on send)
- [ ] 100 concurrent messages in a space doesn't break
- [ ] Mobile experience is usable (not just functional)
- [ ] Analytics show real data that leaders find valuable

### HiveLab Complete When:
- [ ] Leader can describe tool in English → see working tool in <30 seconds
- [ ] Visual editing feels smooth (no jank, proper undo)
- [ ] Deployment to sidebar works first try
- [ ] Tools persist state correctly across sessions
- [ ] Templates cover 80% of common use cases

---

## Integration Points

### Spaces ↔ HiveLab

```
Leader creates tool in HiveLab
         ↓
Deploys to space sidebar
         ↓
Tool appears in space sidebar for all members
         ↓
Members interact with tool
         ↓
State persists, analytics tracked
         ↓
Leader sees engagement in HiveLab analytics
```

### Spaces ↔ Feed

```
Space post created
         ↓
Post appears in member feeds
         ↓
Engagement (reactions, comments) syncs back to space
```

### HiveLab ↔ Data Layer

```
Space element requests data
         ↓
Runtime checks context (spaceId, userId, permissions)
         ↓
Firestore query with campusId isolation
         ↓
Data returned to element renderer
```

---

## Technical Debt

### Spaces
- Typing indicator polling (needs presence-based)
- Message search (needs full-text index)
- File uploads (needs proper CDN strategy)

### HiveLab
- Connection cascade (needs proper DAG evaluation)
- Canvas performance (needs virtualization for >20 elements)
- Template versioning (needs migration system)

---

## Next Steps

1. **P0 Fixes (This Week)**
   - Fix typing indicator spam
   - Replace mock analytics with real queries
   - Test deployment flow end-to-end

2. **P1 Completion (Before Winter Launch)**
   - Mobile polish for spaces
   - Undo/redo for canvas
   - 7 more quality templates

3. **P2 Enhancement (Spring Launch)**
   - Push notifications
   - Collaboration features
   - Advanced analytics

---

*This document is the source of truth for Spaces and HiveLab feature completeness. Update when features ship.*
