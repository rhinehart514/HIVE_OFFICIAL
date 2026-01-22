# HIVE Codebase Research

> **Purpose:** Ground-truth understanding of what's built. Foundation for strategic sprints.
> **Generated:** January 2026
> **Status:** Complete

---

## Executive Summary

HIVE is a mature, production-grade campus platform with ~85% of core features ready. The architecture is solid (DDD, modular hooks, clean API design), but there are specific fragility points and incomplete features that need attention before GTM.

| Vertical | Status | Production Ready | Key Issues |
|----------|--------|------------------|------------|
| Entry/Auth | 95% | Yes | None blocking |
| Spaces | 90% | Mostly | useSpacePageState too large, moderation incomplete |
| HiveLab | 100% | Yes | None blocking |
| Events | 90% | Yes | Calendar integrations not wired |
| Feed | 80% | Partial | Settings not persisted, experimental parallel APIs |

---

## 1. Entry & Auth

### What's Built
- **Unified entry flow** (`/enter`) with state machine
- **Returning user login** (`/login`) - streamlined path
- **OTP via email** (Resend primary, SendGrid fallback)
- **JWT sessions** with httpOnly cookies (30-day expiry)
- **Handle reservation** with atomic Firestore transactions

### Flow
```
School → Email → Role → OTP → Identity (name + handle) → Arrival → /spaces
```

### Security Features
- SHA256 hashed OTP codes
- 10 codes/email/hour rate limit
- 5 attempts per code max
- Campus isolation on all operations
- CSRF protection via SameSite cookies

### Time to Value
60-90 seconds from landing to `/spaces`

### Status: PRODUCTION READY

---

## 2. Spaces

### What's Built

**Pages (13 total, 9 production-ready):**
- `/spaces` - Hub with identity claiming, discover section
- `/spaces/[spaceId]` - Theater mode with Hub/Chat/Events/Tools/Members
- `/spaces/[spaceId]/settings` - 6 tabs (general, structure, members, permissions, integrations, danger)
- `/spaces/[spaceId]/members` - Role management, join requests
- `/spaces/[spaceId]/events` - Event listing with RSVP
- `/spaces/[spaceId]/analytics` - Basic (not fully wired)
- `/spaces/[spaceId]/roles` - Minimal
- `/spaces/[spaceId]/moderation` - Stub

**Components:**
- 27 design system components in `@hive/ui`
- SpaceChatBoard, TheaterChatBoard, EventsMode, ToolsMode, MembersMode
- Complete chat system with search, threading, reactions, typing indicators

**API:**
- 67+ endpoints covering all space operations
- Real-time SSE for chat
- Proper auth middleware and campus isolation

**Domain (DDD):**
- EnhancedSpace aggregate with members, tabs, widgets, tools
- ChatMessage entity (442 lines)
- Domain events for all state changes
- Value objects for Space properties

### Architecture Issues

**HIGH RISK:**
1. **useSpacePageState (703 lines)** - Single point of failure for entire page
   - Recommendation: Split into 5-7 smaller hooks

2. **Join requests stored inline** - Array in space document grows unbounded
   - Recommendation: Move to subcollection

**MEDIUM RISK:**
3. **Mode navigation via URL params** - Back button UX issues
4. **Mobile experience rough** - Desktop-first, mobile incomplete

### Missing Features
- Moderation console (stub only)
- Advanced permissions
- Space archiving
- Bulk member operations

### Status: 90% READY, needs useSpacePageState refactor before scale

---

## 3. HiveLab

### What's Built

**Pages:**
- `/tools` - Landing with AI input (ChatGPT-style hero)
- `/tools/new` - Blank canvas IDE
- `/tools/[toolId]` - Studio with edit/preview/deploy/settings/analytics
- `/tools/templates` - Template gallery

**Element System (50+ elements):**
- Input: SearchInput, DatePicker, UserSelector, FormBuilder
- Display: ResultList, ChartDisplay, TagCloud, MapView
- Action: PollElement, RSVPButton, CountdownTimer, Leaderboard
- Connected: EventPicker, SpacePicker (pull HIVE data)
- Space: MemberList, SpaceEvents, SpaceStats (leaders only)

**AI Generation (Goose):**
- Streaming tool composition from natural language
- Fallback chain: Goose (Ollama) → Groq → Firebase AI → Rules-based
- Rate limited: 100 generations/hour/user
- Campus-context aware

**Templates:**
- 25+ code-defined quick templates
- Community templates stored in Firestore
- Remix flow with attribution

**Deployment:**
- Tools deployed to spaces
- Sharded counters for scaling (200 writes/sec default)
- Shared state + user state separation
- Capability gates (4 lanes of access control)

**IDE Features:**
- Drag-drop element palette
- Canvas with smart guides and grid snapping
- Properties panel for element config
- Command bar (⌘K) for AI
- Auto-save with undo/redo

### Architecture

**Tool Composition:**
```typescript
{
  elements: CanvasElement[]     // Instances with position/size
  connections: ElementConnection[] // Data flow between elements
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar'
}
```

**State Architecture:**
- ToolSharedState - Visible to all users (counters, collections)
- ToolUserState - Per-user personalization
- ToolContext - Runtime environment

### Status: 100% COMPLETE, production ready

---

## 4. Events & Calendar

### What's Built

**Pages:**
- `/events` - Campus-wide event discovery
- `/calendar` - Personal calendar (day/week/month views)
- `/spaces/[spaceId]/events` - Space-specific events

**Event Features:**
- Create events with type, capacity, visibility
- RSVP system (going/maybe/not_going)
- Capacity enforcement with waitlist
- Deadline enforcement
- Auto-link to chat board on creation

**Discovery:**
- Campus-wide aggregation across spaces
- Personalized recommendations (8-factor algorithm)
- Type and time filters
- "Event for Me Tonight" hero

**RSVP System:**
- Flat collection `/rsvps/{eventId}_{userId}`
- Notifications to organizers
- Real-time attendee counts

### API Endpoints
- `GET /api/events` - Campus discovery
- `GET /api/events/personalized` - AI-ranked recommendations
- `GET/POST /api/spaces/[spaceId]/events` - Space events
- `POST /api/spaces/[spaceId]/events/[eventId]/rsvp` - RSVP

### Missing
- Calendar integrations (Google/Canvas/Outlook) marked "Coming Soon"
- Export calendar functionality disabled
- Comments/shares on events not wired

### Status: 90% READY for core flows

---

## 5. Feed & Posts

### What's Built

**Pages:**
- `/feed` - Activity stream (not user posts)
- `/feed/settings` - Preferences UI (not persisted)
- `/posts/[postId]` - Post detail with comments

**Feed Algorithm (8 factors):**
1. Space Engagement (25%)
2. Content Recency (15%)
3. Content Quality (20%)
4. Tool Interaction Value (15%)
5. Social Signals (10%)
6. Creator Influence (5%)
7. Diversity Factor (5%)
8. Temporal Relevance (5%)

**Privacy Features:**
- Ghost mode filtering
- Space membership access checks
- Campus isolation throughout

**What's Real:**
- Activity stream functional
- Ranking algorithm working
- Like/bookmark/share actions
- Comments (basic, no nesting)

**What's Placeholder:**
- Feed settings don't persist
- Aggregation API exists but not integrated
- Enhanced algorithm is parallel implementation

### Architecture Notes
- Feature-flagged (disabled by default)
- Focused on activity stream, not user posts
- Multiple experimental APIs suggest exploration phase

### Status: 80% READY, needs consolidation

---

## 6. Profiles

### What's Built (from docs, not audited)
- View profile (`/profile/[id]`)
- Edit profile (`/profile/edit`)
- Connections/followers
- Placed tools display
- Privacy settings
- Bento grid layout

### Status: 75% per LAUNCH_PLAN.md

---

## 7. Design System

### Scale
- 93 primitives
- 138 composed components
- Complete token system

### Key Tokens
- Colors: 95% grayscale, 5% gold
- Spacing: 4px base unit (4/8/12/16/24/32)
- Motion: 4 tiers (T1=celebrations, T2=standard, T3=micro, T4=a11y)
- Typography: Geist Sans (body), Space Grotesk (display), JetBrains Mono (code)

### Gold Discipline
- Allowed: Primary CTAs, achievements, presence, featured badges
- Forbidden: Focus rings (white only), secondary buttons, hover states

### Glass Morphism
```css
background: linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92));
box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5);
```

---

## 8. Technical Architecture

### Stack
```
Frontend: Next.js 15 (App Router, RSC)
UI: @hive/ui (design system)
Domain: @hive/core (DDD)
Database: Firestore (campus-isolated)
Auth: OTP + JWT (httpOnly cookies)
Real-time: SSE (not WebSockets)
Email: Resend (primary), SendGrid (fallback)
AI: Goose system (Groq → Ollama → Rules-based)
```

### Key Patterns
- DDD with aggregates, entities, value objects, domain events
- React Context + Hooks (no Redux/Zustand)
- API routes with middleware (auth, campus isolation, rate limiting)
- Feature flags for progressive rollout
- Campus isolation on ALL queries

### Firestore Collections
```
users/              # Profiles
spaces/             # Space metadata
  └─ boards/        # Chat boards
     └─ messages/   # Messages
  └─ events/        # Space events
  └─ tools/         # Deployed tools
spaceMembers/       # Flat membership (not subcollection)
posts/              # Feed posts
  └─ comments/      # Post comments
  └─ likes/         # Post likes
tools/              # Tool definitions
tool_deployments/   # Tool placements
verification_codes/ # OTP codes
handles/            # Handle reservations
```

---

## 9. Critical Path for GTM

### P0: Must Fix Before Launch

1. **Split useSpacePageState** (Spaces)
   - 703 lines is too fragile
   - Any change risks breaking the entire space page

2. **Complete moderation console** (Spaces)
   - Users need to flag content
   - Leaders need to manage reports

3. **Fix mobile navigation** (Spaces)
   - Theater mode switching is rough on mobile
   - Critical for student usage patterns

### P1: High Impact

4. **Wire feed settings persistence**
5. **Move join requests to subcollection**
6. **Add loading states to all modals**
7. **Implement proper error recovery**

### P2: Polish

8. **Analytics data wiring**
9. **Calendar integrations**
10. **Comments nesting**

---

## 10. Architecture Strengths

1. **Clean DDD modeling** - Domain logic isolated in @hive/core
2. **Modular hook system** - Chat hooks well-separated
3. **Campus isolation** - Enforced everywhere
4. **Security-first auth** - Proper rate limiting, hashing, httpOnly cookies
5. **Real-time ready** - SSE infrastructure in place
6. **AI-native tooling** - Goose system with smart fallbacks
7. **Design system complete** - 93 primitives, tokens locked

---

## 11. Architecture Risks

1. **useSpacePageState** - Single point of failure
2. **Experimental parallel APIs** - Feed has 3 implementations
3. **Mobile as afterthought** - Desktop-first throughout
4. **Inline arrays in documents** - Join requests will bloat
5. **Missing error boundaries** - Errors can cascade
6. **Test coverage unclear** - No visible test files in audit

---

*This document grounds all strategic sprint decisions in codebase reality.*
