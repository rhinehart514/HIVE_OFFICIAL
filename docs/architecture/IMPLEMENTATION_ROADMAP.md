# HIVE Implementation Roadmap

**Date:** November 28, 2024
**Last Updated:** November 28, 2024
**Purpose:** Ordered implementation sequence with AI-first analysis per slice
**Scope:** Single-campus (UB) MVP to full platform

---

## Progress Tracking

### Completed P0 Tasks ✅

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1.1 | Remove dev password hint from UI | ✅ Done | Deleted dev-auth routes |
| 1.1 | Fix admin auth (remove test token) | ✅ Done | Centralized via `@/lib/admin-auth` |
| 1.1 | Add proper admin JWT validation | ✅ Done | Firebase claims + Firestore |
| 1.2 | Fix non-leader data loss | ✅ Done | Save isLeader, spaces in complete-onboarding |
| 3.2 | Implement basic ranking algorithm | ✅ Done | 8-factor algorithm exists in feed/algorithm |
| 4.1 | Fix SSE broadcast (null controller) | ✅ Done | Store controller in SSEConnection |
| 5.1 | Remove mock data, implement real queries | ✅ Done | Real Firestore queries with campus isolation |
| 8.2 | Filter isHidden in all queries | ✅ Partial | Feed route done, others pending |
| 8.3 | Privacy enforcement in queries | ✅ Partial | users/search done, others pending |

### In Progress

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 3.1 | Spaces DDD integration | ✅ 100% | SpaceManagementService fully wired |

### Newly Completed ✅

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 4.2 | Notification generation triggers | ✅ Done | Service + triggers for comments, likes, joins, builder requests |

### Routes Updated for Centralized Admin Auth

- `apps/web/src/app/api/admin/builder-requests/route.ts` ✅
- `apps/web/src/app/api/analytics/metrics/route.ts` ✅
- `apps/web/src/app/api/spaces/check-create-permission/route.ts` ✅
- `apps/web/src/app/api/spaces/route.ts` ✅
- `apps/web/src/app/api/realtime/metrics/route.ts` ✅

### Notification Generation Integrated

New service: `apps/web/src/lib/notification-service.ts`

Routes with notification triggers:
- `apps/web/src/app/api/spaces/[spaceId]/posts/[postId]/comments/route.ts` - comment/reply notifications
- `apps/web/src/app/api/spaces/[spaceId]/posts/[postId]/reactions/route.ts` - like notifications
- `apps/web/src/app/api/admin/builder-requests/route.ts` - approval/rejection notifications
- `apps/web/src/app/api/spaces/join-v2/route.ts` - space join notifications

Notification types supported:
- `comment`, `comment_reply`, `like`, `mention`
- `space_invite`, `space_join`, `space_role_change`
- `builder_approved`, `builder_rejected`
- `event_reminder`, `event_rsvp`
- `connection_new`, `tool_deployed`, `system`

---

## Implementation Order Rationale

The sequence follows dependency chains and risk reduction:

```
PHASE 1: SECURITY & DATA (Foundation Trust)
   └── Auth hardening, Onboarding data loss

PHASE 2: IDENTITY & ISOLATION (Foundation Layer)
   └── Profiles completion, Campus isolation

PHASE 3: CONTAINERS & CONTENT (Core Experience)
   └── Spaces permissions, Feed algorithm

PHASE 4: DELIVERY & AWARENESS (Infrastructure)
   └── Real-time fixes, Notification generation

PHASE 5: DISCOVERY (User Agency)
   └── Search implementation

PHASE 6: NETWORK & TIME (Engagement)
   └── Social connections, Events/Calendar

PHASE 7: EXTENSIBILITY (Power Features)
   └── Tools/HiveLab, Rituals

PHASE 8: OPERATIONS (Platform Health)
   └── Admin, Moderation, Privacy enforcement
```

---

## Phase 1: Security & Data Integrity

### 1.1 AUTHENTICATION HARDENING

#### How AI Changes This Domain

Authentication is entering a paradoxical moment. AI makes credential attacks more sophisticated (password spraying, phishing personalization, deepfake identity), but also enables better defenses (behavioral biometrics, anomaly detection, risk-based authentication). The traditional username/password model is collapsing. What emerges is continuous authentication—systems that don't just verify you once but continuously assess whether the person using the session is the person who started it.

For a campus platform, the economics shift differently. Students are low-fraud-risk but high-friction-sensitive. The winning pattern is frictionless entry with invisible security—magic links, device trust, campus network detection. AI's role is background threat assessment, not front-door gatekeeping.

#### Domain Mechanics

**Actors:** Students (primary), Faculty (elevated trust), Leaders (elevated permissions), Admins (full access), Attackers (adversarial)

**Objects:** Sessions (JWT cookies), Identities (email → profile link), Credentials (magic link tokens, passwords), Devices (trusted vs. unknown), Campuses (domain verification)

**Workflows:**
1. Initial authentication: email → magic link → session creation
2. Session persistence: cookie → JWT validation → request authorization
3. Elevation: admin grant checking, role-based gating
4. Recovery: token expiry, re-authentication flows

**Constraints:** Must work on mobile web, can't require app install, students won't tolerate 2FA friction, campus IT won't enable SSO

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Primary auth | Magic link (works) | Magic link + device trust |
| Secondary auth | Password with visible hint | Remove or secure |
| Session duration | 30 days fixed | Risk-adaptive (device + behavior) |
| Admin auth | Hardcoded test token | JWT + role verification |
| Threat detection | None | Login anomaly alerts |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Remove `hive123` password hint from UI | P0 | 30min | None |
| Fix admin auth (remove test token) | P0 | 2hr | None |
| Add proper admin JWT validation | P0 | 2hr | Admin auth fix |
| Password login respect onboarding status | P1 | 1hr | None |
| Session refresh mechanism | P2 | 3hr | None |
| Device fingerprint tracking | P3 | 4hr | Session refresh |
| Login anomaly detection | P3 | 6hr | Device tracking |

#### AI Integration Opportunities

**Near-term (Phase 1):**
- None required for security fixes

**Medium-term (Phase 5+):**
- Behavioral biometrics for continuous auth
- Risk scoring for session duration adjustment
- Anomaly detection for account takeover prevention

---

### 1.2 ONBOARDING DATA INTEGRITY

#### How AI Changes This Domain

Onboarding is being revolutionized by AI in three ways. First, pre-population: AI can infer user attributes from minimal signals (email domain → campus, LinkedIn profile → bio/interests, previous app behavior → preferences). Second, adaptive flows: instead of fixed step sequences, AI determines what information is actually needed and skips irrelevant steps. Third, conversational onboarding: instead of forms, users describe themselves naturally and AI structures the data.

For HIVE, the immediate opportunity isn't fancy AI—it's fixing data loss. But the architectural decision matters: building toward a system that can eventually do intelligent onboarding means not hardcoding step sequences.

#### Domain Mechanics

**Actors:** New users (converting), Returning incomplete users (re-engaging), Leaders (special path), Faculty (different needs), Alumni (waitlist)

**Objects:** Onboarding state (current step, collected data), Profile draft (uncommitted data), Handle reservation (transactional), Space selections (ephemeral until committed)

**Workflows:**
1. Entry: Auth complete → check onboarding status → route
2. Progression: Step complete → validate → persist draft → next step
3. Branching: User type → determines step sequence
4. Completion: All required steps done → commit profile → route to app
5. Abandonment: User leaves → draft persisted → can resume

**Constraints:** Must complete in <5 minutes, mobile-first, can't require information students don't have, must handle browser refresh

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Data persistence | In-memory only | localStorage + server draft |
| Non-leader path | Data lost on redirect | Save before redirect |
| Progress resume | Start over on refresh | Resume from last step |
| Leader gating | Can skip spaces | Must select ≥1 space |
| Alumni flow | Waitlist only | Waitlist with profile basics |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Fix non-leader data loss | P0 | 2hr | None |
| Add localStorage persistence | P0 | 2hr | None |
| Add server-side draft saving | P1 | 3hr | localStorage done |
| Gate leader completion on space selection | P1 | 1hr | None |
| Add progress indicator | P2 | 2hr | None |
| Alumni basic profile collection | P3 | 3hr | None |

#### AI Integration Opportunities

**Near-term (Phase 1):**
- None required for data integrity fixes

**Medium-term (Phase 4+):**
- Interest suggestion based on major/year
- Space recommendations during onboarding
- Bio generation from minimal inputs

**Long-term (Phase 7+):**
- Conversational onboarding ("Tell us about yourself")
- LinkedIn/social import with AI extraction
- Adaptive flow based on engagement signals

---

## Phase 2: Identity & Isolation

### 2.1 USER PROFILES

#### How AI Changes This Domain

User profiles are transforming from static data stores to dynamic identity surfaces. AI enables profiles that write themselves (generating bio from activity), update themselves (inferring new interests from behavior), and present themselves differently to different viewers (adaptive visibility). The profile becomes less about what users input and more about what the system learns.

For campus platforms, this matters because students are terrible at self-description but excellent at demonstrating identity through action. A student who joins 5 music spaces, attends 3 concerts, and comments on band posts has a clearer music identity than their bio ever would. AI can surface this emergent identity.

The economics shift: profile completion stops being a funnel metric and becomes a background process. The system fills in the profile; the user just corrects mistakes.

#### Domain Mechanics

**Actors:** Profile owner (self-expression), Profile viewers (discovery, connection), System (inference, curation), Admins (moderation)

**Objects:** Core identity (handle, name, avatar), Extended profile (bio, major, interests), Activity shadow (inferred from behavior), Privacy layer (visibility controls), Connections (bidirectional relationships)

**Workflows:**
1. Creation: Onboarding → core fields required → extended optional
2. Viewing: Request → privacy check → render appropriate fields
3. Editing: Owner update → validation → persistence
4. Inference: Activity observed → attributes updated → owner notified
5. Discovery: Search/browse → privacy-filtered results

**Constraints:** Handle must be unique, avatar must be appropriate, privacy must be respected, deleted accounts must be truly gone

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| DDD model | Exists but unused | Integrated with API |
| Completion tracking | handle + name only | Rich completion score |
| Handle changes | Old reservation orphaned | Clean up old handle |
| Stats calculation | Inline (expensive) | Cached, async updated |
| Soft delete | None (orphaned data) | Proper cascade |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Integrate EnhancedProfile aggregate | P1 | 4hr | None |
| Fix handle change cleanup | P1 | 2hr | None |
| Add profile completion scoring | P2 | 3hr | EnhancedProfile |
| Cache profile stats | P2 | 4hr | None |
| Implement soft delete cascade | P2 | 4hr | None |
| Activity-based interest inference | P3 | 8hr | Feed analytics |

#### AI Integration Opportunities

**Near-term (Phase 2):**
- Profile completion suggestions ("Add your major to connect with classmates")

**Medium-term (Phase 5+):**
- Bio generation from interests/activity
- Interest inference from space membership
- Connection strength prediction

**Long-term (Phase 7+):**
- Dynamic profile rendering (show music to musicians)
- Emergent identity surfacing
- Conversation starter generation for connections

---

### 2.2 CAMPUS / MULTI-TENANT ISOLATION

#### How AI Changes This Domain

Multi-tenancy is traditionally an infrastructure concern, but AI transforms it into a product opportunity. Each campus becomes a training context—local slang, local events, local social dynamics. An AI trained on UB data understands "UB Late Night" and "Capen Library"; that same model on USC would be useless. This creates defensible moats: the more students use the platform at a campus, the smarter the AI gets for that campus, which attracts more students.

The economics favor early density over broad distribution. Better to have 80% of one campus than 10% of eight campuses. The AI compounds locally.

#### Domain Mechanics

**Actors:** Students (single-campus), Faculty (potentially multi-campus), Admins (platform-wide or campus-scoped), Campuses (as tenants)

**Objects:** Campus entity (id, domain, config), Campus content (spaces, events, posts), Campus users (filtered by campusId), Campus AI context (local knowledge)

**Workflows:**
1. Detection: Email domain → campus lookup → assignment
2. Isolation: All queries → campus filter → scoped results
3. Cross-campus: Admin view → multi-campus access
4. Provisioning: New campus → domain setup → seed data

**Constraints:** Users can't accidentally see other campus data, performance can't degrade with campus count, campus config must be flexible

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Campus detection | Mock/null in production | Real domain lookup |
| Campus ID | Static constant | Runtime context |
| Query isolation | Inconsistent | All queries filtered |
| Multi-campus admin | Not supported | Role-based access |
| Campus provisioning | Manual | Automated with verification |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Fix CURRENT_CAMPUS_ID to runtime | P1 | 3hr | None |
| Implement real campus detection | P1 | 4hr | Campus ID fix |
| Audit all queries for campus filter | P1 | 4hr | Campus ID fix |
| Fix connections hardcoded campus | P0 | 1hr | None |
| Add campus to session context | P2 | 3hr | Detection done |
| Campus admin scoping | P3 | 6hr | Admin auth done |

#### AI Integration Opportunities

**Near-term (Phase 2):**
- None required for isolation fixes

**Medium-term (Phase 5+):**
- Campus-specific search ranking
- Local event detection from external sources
- Campus sentiment analysis

**Long-term (Phase 7+):**
- Campus-specific content moderation (local norms)
- Cross-campus knowledge transfer for similar schools
- Predictive campus expansion targeting

---

## Phase 3: Core Experience

### 3.1 SPACES (Communities)

#### How AI Changes This Domain

Community management is being unbundled by AI. Traditional platforms require human leaders to moderate, curate, plan events, and spark engagement. AI can do most of this—detecting toxic content instantly, surfacing relevant discussions, auto-generating event ideas, and nudging members toward engagement. The leader becomes a creative director rather than an operator.

This changes who can lead communities. Previously, only people with time and social skills could run successful groups. With AI assistance, a passionate but busy student can lead a thriving space because the AI handles operational overhead. This dramatically expands the supply of viable communities.

For HIVE, this means the space creation flow should assume AI assistance from day one. Don't build manual moderation and then add AI—build with AI as the default moderator and let humans override.

#### Domain Mechanics

**Actors:** Leaders (creators/admins), Members (participants), Followers (passive), Admins (platform oversight), AI (assistant/moderator)

**Objects:** Space entity (metadata, config), Membership (role, status, permissions), Content (posts, events, tools), Tabs (custom views), Widgets (surface cards)

**Workflows:**
1. Creation: Leader request → approval (if required) → space setup
2. Discovery: Browse/search → preview → join/follow
3. Participation: View → post/comment/react → engage
4. Leadership: Moderate → configure → delegate
5. Evolution: Activity tracking → suggestions → adaptation

**Constraints:** Leaders need control, members need safety, content needs moderation, growth needs to be organic not spammy

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Permission model | createdBy vs role (inconsistent) | Unified role-based |
| Request-to-lead | Undefined | Workflow with approval |
| Slug uniqueness | Not enforced | Unique within campus |
| Approval tracking | No pending queue | Proper state machine |
| Tab/widget config | Not validated | Schema validation |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Unify permission model (role-based) | P1 | 4hr | None |
| Enforce slug uniqueness | P1 | 2hr | None |
| Implement request-to-lead workflow | P2 | 6hr | Permission model |
| Add approval queue tracking | P2 | 4hr | Request-to-lead |
| Validate tab/widget configuration | P2 | 3hr | None |
| Leader dashboard with insights | P3 | 8hr | Analytics |

#### AI Integration Opportunities

**Near-term (Phase 3):**
- Content moderation auto-flagging
- Duplicate post detection

**Medium-term (Phase 5+):**
- Space health scoring (engagement prediction)
- Member recommendation for spaces
- Event idea generation from space activity

**Long-term (Phase 7+):**
- AI co-leader (handles routine moderation, suggests actions)
- Automatic space merging suggestions (similar communities)
- Content summarization for catch-up

---

### 3.2 FEED (Personalized Stream)

#### How AI Changes This Domain

The feed is where AI impact is most direct and most valuable. Traditional feeds are either chronological (Twitter pre-algorithm), engagement-optimized (Facebook), or interest-matched (TikTok). AI enables a new paradigm: intent-aware feeds that adapt to why you opened the app right now.

A student checking between classes wants quick updates. The same student on Sunday evening wants to discover new things. The feed should know the difference without being told. This requires modeling not just preferences but context: time, device, session history, campus events happening now.

The economics are compelling: better feeds mean more time in app, which means more value created for both consumers and publishers. Every percentage point improvement in relevance compounds across millions of sessions.

For HIVE, the feed is currently just chronological—the minimum viable implementation. Moving to personalized ranking is the single highest-impact improvement possible.

#### Domain Mechanics

**Actors:** Consumers (viewing), Publishers (spaces, leaders), System (ranking), Advertisers (future, not MVP)

**Objects:** Feed items (posts, events, tools, system messages), Ranking signals (engagement, recency, affinity), User state (preferences, history, context), Feed configuration (filters, sources)

**Workflows:**
1. Generation: User request → gather candidates → rank → paginate → deliver
2. Interaction: View → engage (like/comment/share) → signal capture
3. Learning: Signals aggregated → model updated → future ranking improved
4. Refresh: New content → push/pull → re-rank visible items

**Constraints:** Must be fast (<500ms), must feel fair (not just popular content), must surface new content (not just proven), must respect privacy

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Algorithm | Chronological only | Multi-factor ranking |
| Personalization | None | User preference model |
| Engagement tracking | None | Views, clicks, dwell time |
| Cold start | Empty/irrelevant | Onboarding-seeded preferences |
| Real-time updates | Not implemented | Live new content indicators |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Implement basic ranking algorithm | P0 | 8hr | None |
| Add engagement tracking (views) | P1 | 4hr | None |
| User preference model (from onboarding) | P1 | 4hr | Onboarding fix |
| Cold start handling | P1 | 4hr | Preference model |
| Trending score calculation (cron) | P2 | 4hr | Engagement tracking |
| Real-time new content indicators | P2 | 6hr | Real-time fixes |
| Feed personalization v2 (ML) | P3 | 16hr | Engagement data |

#### AI Integration Opportunities

**Near-term (Phase 3):**
- Rule-based ranking (recency + engagement + affinity)
- Content type diversity injection

**Medium-term (Phase 5+):**
- Collaborative filtering (users like you liked...)
- Content-based filtering (posts similar to ones you engaged with)
- Time-aware ranking (morning vs. evening content)

**Long-term (Phase 7+):**
- Intent prediction (why are you here right now?)
- Feed summarization ("While you were away...")
- Proactive content generation (AI-created digests)

---

## Phase 4: Infrastructure

### 4.1 REAL-TIME DELIVERY

#### How AI Changes This Domain

Real-time infrastructure is traditionally about speed and reliability—getting messages from A to B as fast as possible. AI adds intelligence to the pipe: determining what's worth sending in real-time versus batched, predicting when users will be receptive, and even generating real-time content (like typing indicators that say "writing something thoughtful..." instead of just dots).

The economics shift from "deliver everything instantly" to "deliver the right things instantly." A like notification might not need real-time; a direct message does. AI can learn these preferences per user.

For HIVE, the immediate need is fixing broken delivery (SSE passes null). But the architecture should support intelligent delivery decisions.

#### Domain Mechanics

**Actors:** Publishers (content creators), Subscribers (content consumers), Channels (routing abstractions), System (delivery infrastructure)

**Objects:** Messages (typed payloads), Connections (user → channel subscriptions), Channels (topic-based routing), Queues (offline storage), Presence (online/typing/active)

**Workflows:**
1. Connection: User connects → authenticate → subscribe to channels
2. Publication: Event occurs → message created → route to channels
3. Delivery: Channel receives → filter subscribers → deliver or queue
4. Presence: Heartbeat → update presence → broadcast to relevant users
5. Recovery: User reconnects → deliver queued → sync state

**Constraints:** Must work on unreliable mobile connections, must not drain battery, must handle thousands of concurrent users, must degrade gracefully

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| SSE delivery | Passes null controller | Working broadcast |
| WebSocket | REST API (not real WS) | Actual WebSocket or remove |
| Systems | 3 competing | Single unified system |
| Typing indicators | Stored, never delivered | Working delivery |
| Stale connections | No cleanup | Heartbeat + cleanup |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Fix SSE broadcast (null controller) | P0 | 4hr | None |
| Remove fake WebSocket or implement real | P1 | 6hr | SSE fix |
| Unify real-time systems | P1 | 8hr | SSE + WS decisions |
| Implement connection cleanup | P2 | 3hr | Unified system |
| Typing indicator delivery | P2 | 4hr | Unified system |
| Presence accuracy improvements | P3 | 4hr | Connection cleanup |

#### AI Integration Opportunities

**Near-term (Phase 4):**
- None required for infrastructure fixes

**Medium-term (Phase 6+):**
- Delivery priority scoring (urgent vs. background)
- Optimal notification timing prediction
- Battery-aware delivery batching

**Long-term (Phase 8+):**
- Predictive pre-fetching (content you'll want next)
- AI-generated presence states ("In a meeting" inferred from calendar)
- Smart notification grouping

---

### 4.2 NOTIFICATION GENERATION

#### How AI Changes This Domain

Notifications are the most abused and most valuable real estate in mobile. Traditional notification systems blast everything; users disable them. AI enables intelligent notification that knows what's worth interrupting you for and when you want to be interrupted.

The transformation is from "notify on event" to "notify on value." A like from your crush is notification-worthy; a like from a stranger isn't. AI can learn these social graphs and preferences without explicit configuration.

For HIVE, the first problem is that nothing generates notifications at all. The second problem is that when generation exists, it needs to be intelligent from day one. Don't build spam and then add AI filtering—build smart generation.

#### Domain Mechanics

**Actors:** Recipients (notification targets), Triggers (events that might notify), System (generation + delivery), Users (preference setters)

**Objects:** Notification entity (type, content, read status), Triggers (post, comment, like, mention, event, system), Preferences (per-type enablement), Channels (in-app, push, email)

**Workflows:**
1. Trigger: Event occurs → evaluate notification rules → generate if warranted
2. Delivery: Notification created → check preferences → route to channels
3. Consumption: User sees → marks read → optional action
4. Preference: User adjusts → future generation filtered

**Constraints:** Must not spam, must not miss important things, must respect quiet hours, must work without push permission

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Generation | None | Event-triggered creation |
| Storage paths | Dual (inconsistent) | Single unified path |
| Field naming | category vs type | Consistent schema |
| Email/push | None | Email for critical, push optional |
| Grouping | None (10 likes = 10 notifs) | Intelligent grouping |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Implement notification generation triggers | P0 | 8hr | None |
| Unify storage paths | P1 | 3hr | Generation done |
| Consistent schema (type, not category) | P1 | 2hr | Storage unified |
| Implement notification grouping | P2 | 4hr | Schema done |
| Email notifications (critical only) | P2 | 6hr | Generation done |
| Push notification setup | P3 | 8hr | Email done |

#### AI Integration Opportunities

**Near-term (Phase 4):**
- Rule-based generation (define which events notify)
- Basic grouping (same type within window)

**Medium-term (Phase 6+):**
- Importance scoring (notify only if score > threshold)
- Social graph awareness (notify for close connections)
- Timing optimization (when is user receptive)

**Long-term (Phase 8+):**
- Predictive notification ("Event you'd like starts in 1 hour")
- Digest generation ("Your daily HIVE summary")
- Channel optimization (this user prefers email over push)

---

## Phase 5: Discovery

### 5.1 SEARCH IMPLEMENTATION

#### How AI Changes This Domain

Search is being transformed from keyword matching to intent understanding. Traditional search returns documents containing your words; AI search returns answers to your questions. "Events this weekend" becomes a live-computed result, not a keyword match.

More profoundly, AI enables search over unstructured content. A student asking "who knows about machine learning" can get results from bio text, post content, course mentions, and space memberships—all unified into a coherent answer.

For HIVE, search is currently returning mock data. The opportunity is to skip traditional search entirely and build semantic search from the start. The cost of vector embeddings has dropped enough that this is viable even for MVP.

#### Domain Mechanics

**Actors:** Searchers (users with intent), Content (searchable objects), System (indexing + retrieval), Admins (relevance tuning)

**Objects:** Query (user input), Index (searchable content representations), Results (ranked matches), Filters (category, date, privacy), Embeddings (semantic vectors)

**Workflows:**
1. Indexing: Content created/updated → embed → store in index
2. Query: User searches → parse intent → retrieve candidates → rank → filter → return
3. Interaction: Results shown → user clicks → feedback captured
4. Learning: Click patterns → relevance tuning → improved ranking

**Constraints:** Must be fast (<200ms), must respect privacy (ghost mode), must handle typos, must surface diverse content types

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Implementation | Hardcoded mock data | Real search |
| Approach | None | Semantic + keyword hybrid |
| Privacy filtering | None | Respect ghost mode |
| Content types | All mocked | Spaces, people, events, posts |
| Ranking | None | Relevance + personalization |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Remove mock data, implement real queries | P0 | 4hr | None |
| Firestore text search (basic) | P1 | 6hr | Mock removal |
| Privacy filtering in search | P1 | 3hr | Privacy settings |
| Search result ranking | P2 | 4hr | Basic search |
| Semantic search (embeddings) | P3 | 12hr | Basic search |
| Search analytics | P3 | 4hr | Basic search |

#### AI Integration Opportunities

**Near-term (Phase 5):**
- Query expansion (synonyms, related terms)
- Typo tolerance
- Category inference from query

**Medium-term (Phase 6+):**
- Semantic search with embeddings
- Personalized ranking (your connections first)
- Intent classification (finding person vs. finding content)

**Long-term (Phase 8+):**
- Conversational search ("Find me study groups for calc 2")
- Federated search (search across campus resources)
- Predictive search (suggestions before you type)

---

## Phase 6: Engagement

### 6.1 SOCIAL / CONNECTIONS

#### How AI Changes This Domain

Social connection on campus is fundamentally about reducing friction to meeting people. Traditional platforms require explicit actions (send friend request, wait for acceptance). AI can infer connection potential and reduce it to a single confirmation rather than a negotiation.

The deeper transformation is from "connections as explicit relationships" to "connections as emergent properties." Two students in the same spaces, similar majors, and attending the same events have a de facto connection even if neither has friended the other. AI can surface these latent connections.

For HIVE, the auto-connection system already does basic attribute matching. The opportunity is making connections valuable—not just a number, but a source of introductions, recommendations, and serendipitous encounters.

#### Domain Mechanics

**Actors:** Users (connecting), System (suggesting + facilitating), Spaces (connection contexts), Events (connection opportunities)

**Objects:** Connections (bidirectional relationships), Connection strength (affinity score), Suggestions (potential connections), Interactions (the history of engagement)

**Workflows:**
1. Discovery: Shared attributes detected → suggestion generated → surfaced to user
2. Formation: User confirms suggestion → bidirectional connection created
3. Strengthening: Interactions occur → strength score updated
4. Surfacing: Connection list → sorted by strength → presented in relevant contexts

**Constraints:** Must not feel creepy, must respect privacy preferences, must surface genuine connections not just mutual follows, must work for introverts

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Campus isolation | Hardcoded 'ub-buffalo' | Runtime campus context |
| Detection trigger | Manual POST | Automatic on attribute change |
| Friends system | Separate, not wired | Unified with connections |
| Mention parsing | None | @user, #space support |
| Blocking | None | Block with cascade effects |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Fix hardcoded campus in connections | P0 | 1hr | None |
| Auto-trigger connection detection | P1 | 3hr | Campus fix |
| Unify friends and connections | P2 | 4hr | Auto-trigger |
| Implement mention parsing | P2 | 4hr | None |
| Implement blocking | P2 | 4hr | None |
| Connection-based feed boosting | P3 | 4hr | Feed algorithm |

#### AI Integration Opportunities

**Near-term (Phase 6):**
- Improved strength scoring (more attributes)
- Connection suggestions with reasons ("Both in Jazz Club")

**Medium-term (Phase 7+):**
- Mutual connection surfacing ("You might know X through Y")
- Event-based connection prompts ("Going to same event, want to meet?")
- Conversation starters ("You both posted about...")

**Long-term (Phase 8+):**
- Introduction facilitation (AI-mediated intros)
- Connection prediction (who will you want to know in 6 months)
- Social graph analysis for space recommendations

---

### 6.2 CALENDAR / EVENTS

#### How AI Changes This Domain

Campus events are currently discovered through fragmented channels—Instagram stories, GroupMe messages, flyers, word of mouth. AI enables a unified event layer that aggregates, deduplicates, and personalizes across sources.

The deeper shift is from "events as scheduled objects" to "events as opportunities." AI can understand that a student interested in startups should know about the entrepreneurship mixer even if they're not in that space. Events become discoverable by intent, not just membership.

For HIVE, events are half-built—the backend works but there's no creation UI. The opportunity is building event creation that's so easy (AI-assisted) that every space leader uses it.

#### Domain Mechanics

**Actors:** Organizers (event creators), Attendees (RSVPers), Browsers (discoverers), Spaces (event containers), System (aggregation + recommendation)

**Objects:** Events (time-bound occurrences), RSVPs (attendance intentions), Calendar (personal aggregation), Conflicts (overlapping events), External sources (Google Calendar, Instagram)

**Workflows:**
1. Creation: Leader creates → validation → publication → notification
2. Discovery: Browse/search/recommend → preview → RSVP
3. Attendance: RSVP → calendar addition → reminder → check-in
4. Aggregation: External events → import → deduplicate → integrate

**Constraints:** Must sync with external calendars, must handle recurring events, must not over-notify, must show conflicts

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Creation UI | None | Full event creation flow |
| Recurring events | Defined, not implemented | Working recurrence |
| Calendar sync | None | Google Calendar export |
| Dev mode | Returns mocks | Production-ready |
| Recommendations | None | AI-powered suggestions |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Remove dev mode mocks | P1 | 1hr | None |
| Event creation UI | P1 | 8hr | Spaces permissions |
| Recurring event implementation | P2 | 6hr | Creation UI |
| Google Calendar export | P2 | 6hr | Creation UI |
| Event recommendations | P3 | 6hr | Feed algorithm |
| External event aggregation | P3 | 12hr | Recommendations |

#### AI Integration Opportunities

**Near-term (Phase 6):**
- Event description generation from minimal input
- Conflict detection and suggestions

**Medium-term (Phase 7+):**
- Interest-based event recommendations
- Attendance prediction for organizers
- Optimal timing suggestions

**Long-term (Phase 8+):**
- External event discovery (scrape Instagram, campus sites)
- Event summarization post-facto
- Social event coordination ("Your friends are going to...")

---

## Phase 7: Power Features

### 7.1 TOOLS / HIVELAB

#### How AI Changes This Domain

HiveLab represents the most AI-native opportunity in HIVE. Traditional platforms offer fixed features; AI enables infinite features generated on demand. A space leader describing "I want members to vote on meeting times" gets a fully functional voting tool without writing code.

This changes the economics of feature development. Instead of product teams deciding what features to build, users describe what they need and AI builds it. The platform becomes a tool-generation system rather than a tool-delivery system.

The competitive moat is significant: every tool generated becomes training data for better tool generation. Users effectively build the product by using it.

#### Domain Mechanics

**Actors:** Builders (tool creators), Users (tool consumers), Spaces (tool hosts), Admins (tool curators), AI (tool generator)

**Objects:** Tools (functional units), Templates (reusable patterns), Deployments (tool instances), State (per-user-per-deployment data), Marketplace (tool discovery)

**Workflows:**
1. Creation: Describe need → AI generates → preview → refine → publish
2. Deployment: Browse tools → deploy to profile/space → configure
3. Usage: User interacts → state updated → results displayed
4. Evolution: Usage patterns → improvement suggestions → iteration

**Constraints:** Generated tools must be safe (no code injection), must be performant, must be understandable, must be deletable

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| AI generator | Mock only | Working generation |
| Visual builder | None | Drag-and-drop interface |
| Execution | Stubs (fixed returns) | Real state management |
| Marketplace | Empty array | Curated + community tools |
| Deployment UI | Incomplete | Full management |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Implement real execution handlers | P2 | 8hr | None |
| Tool state management (real) | P2 | 6hr | Execution handlers |
| Curated marketplace seed | P2 | 4hr | None |
| Visual tool builder v1 | P3 | 16hr | Execution handlers |
| AI tool generation v1 | P3 | 20hr | Visual builder |
| Tool analytics | P3 | 6hr | Real execution |

#### AI Integration Opportunities

**Near-term (Phase 7):**
- Tool template suggestion based on space type
- Configuration assistance

**Medium-term (Phase 7-8):**
- Natural language tool generation
- Tool behavior customization via chat
- Usage-based improvement suggestions

**Long-term (Phase 8+):**
- Fully autonomous tool creation
- Cross-tool integration
- Tool composition (combine simple tools into complex workflows)

---

### 7.2 RITUALS

#### How AI Changes This Domain

Rituals are structured engagement mechanics—challenges, competitions, countdowns, unlocks. Traditionally these require significant design and implementation per ritual. AI changes this by generating ritual mechanics from high-level descriptions.

A leader saying "I want to build hype for our spring concert over 2 weeks" could get an AI-designed ritual with daily unlocks, ticket giveaways, and engagement milestones—all without specifying the exact mechanics.

The deeper opportunity is adaptive rituals that adjust based on participation. If a challenge is too hard (no completions), AI lowers the bar. If it's too easy (everyone completes instantly), AI adds difficulty. The ritual becomes a living system.

#### Domain Mechanics

**Actors:** Creators (ritual designers), Participants (ritual players), Spectators (ritual viewers), System (ritual executor), AI (ritual designer + adapter)

**Objects:** Ritual entity (archetype, phases, config), Participation (user progress), Rewards (unlocks, badges, recognition), Leaderboards (competitive rankings), Phases (time-bound stages)

**Workflows:**
1. Creation: Leader designs → configure archetype → set parameters → schedule
2. Lifecycle: Draft → announced → active → cooldown → ended
3. Participation: User joins → completes actions → earns progress → receives rewards
4. Adaptation: Participation patterns → parameter adjustment → improved engagement

**Constraints:** Must be fair, must end cleanly, must not require constant leader attention, must be comprehensible to participants

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Implementation | Schemas only | Working execution |
| APIs | None | Full CRUD + participation |
| Phase transitions | None | Automated state machine |
| Participation tracking | None | Real progress system |
| Admin interface | List only | Create + edit + monitor |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Ritual CRUD APIs | P2 | 8hr | None |
| Participation tracking | P2 | 6hr | CRUD APIs |
| Phase transition automation | P2 | 6hr | CRUD APIs |
| Admin create/edit interface | P3 | 8hr | CRUD APIs |
| Single archetype execution (FOUNDING_CLASS) | P3 | 8hr | Participation |
| Additional archetype executions | P3 | 4hr each | First archetype |

#### AI Integration Opportunities

**Near-term (Phase 7):**
- Parameter suggestions based on space size
- Duration recommendations

**Medium-term (Phase 8+):**
- Ritual design from description
- Adaptive difficulty
- Engagement prediction

**Long-term (Phase 8+):**
- Novel archetype generation
- Cross-ritual narratives
- Personalized ritual recommendations

---

## Phase 8: Operations

### 8.1 ADMIN DASHBOARD

#### How AI Changes This Domain

Admin dashboards traditionally show metrics and provide manual controls. AI transforms them into proactive operations centers that surface anomalies, predict problems, and suggest interventions.

Instead of an admin noticing engagement dropped, the system alerts "Engagement in Jazz Club dropped 40% this week, likely because leader @john hasn't posted. Suggest: nudge message?" The admin goes from data analyst to decision maker.

For HIVE, the admin dashboard exists but has security issues (test token auth) and missing capabilities. The foundation needs fixing before AI augmentation.

#### Domain Mechanics

**Actors:** Platform admins (full access), Campus admins (scoped access), Support (read + limited actions), System (monitoring + alerting)

**Objects:** Metrics (platform health), Users (management targets), Content (moderation targets), Audit log (action history), Alerts (anomaly notifications)

**Workflows:**
1. Monitoring: Metrics collected → dashboards rendered → anomalies flagged
2. Investigation: Alert received → drill down → root cause identification
3. Intervention: Decision made → action taken → audit logged
4. Reporting: Data aggregated → reports generated → stakeholders informed

**Constraints:** Must be secure (auth properly), must be audited (all actions logged), must be scoped (campus admins limited), must be responsive (real-time enough)

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Auth | Test token in dev | Proper JWT always |
| Fallback user | test-user if no IDs | Error, no fallback |
| Audit trail | In-memory + partial Firestore | Complete persistent log |
| User actions | No suspend/ban | Full user management |
| Space actions | No deletion | Full space management |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Fix admin auth (done in Phase 1) | P0 | - | - |
| Complete audit logging | P1 | 4hr | Auth fixed |
| User suspend/ban endpoints | P2 | 4hr | Audit logging |
| Space management (delete, transfer) | P2 | 4hr | Audit logging |
| Campus admin scoping | P2 | 6hr | Auth + scoping |
| Anomaly alerting | P3 | 8hr | Metrics collection |

#### AI Integration Opportunities

**Near-term (Phase 8):**
- Basic anomaly detection (engagement drops)
- Suggested actions for common issues

**Medium-term (Phase 8+):**
- Predictive alerting (this space will become inactive)
- Automated report generation
- Natural language querying ("Show me inactive spaces")

**Long-term (Post-launch):**
- Autonomous intervention (auto-nudge inactive leaders)
- Trend prediction
- Platform health scoring

---

### 8.2 CONTENT MODERATION

#### How AI Changes This Domain

Content moderation is the most obvious AI application and the most urgently needed. Human moderation doesn't scale; AI moderation scales infinitely. But AI moderation makes mistakes, so the system needs human oversight for edge cases.

The pattern that works: AI makes fast decisions on obvious cases (clear spam, clear violations), queues uncertain cases for human review, and learns from human decisions to improve. This creates a funnel where 90% of content is auto-moderated and 10% gets human attention.

For HIVE, the moderation system exists but doesn't work (isHidden doesn't filter). Fixing the basics enables AI augmentation.

#### Domain Mechanics

**Actors:** Reporters (users flagging content), Moderators (reviewers), System (auto-moderation), Appeals (users contesting), AI (analysis + suggestion)

**Objects:** Reports (user complaints), Content (moderation targets), Actions (taken decisions), Appeals (contestations), Rules (automated policies)

**Workflows:**
1. Report: User flags → report created → queued for review
2. Auto-review: Content analyzed → rules applied → auto-action or queue
3. Human review: Moderator reviews → decision made → action taken
4. Appeal: User contests → re-review → decision confirmed or reversed
5. Learning: Decisions analyzed → rules refined → AI improved

**Constraints:** Must be fast (toxic content can't stay up), must be fair (appealable), must be consistent, must not over-moderate (chilling effect)

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| AI analysis | Mock data | Real content analysis |
| isHidden enforcement | Not filtered | All queries respect |
| Automated rules | Match but don't act | Full execution |
| Appeals | Field exists, no implementation | Working flow |
| Reporter trust | Captured, not used | Trust-weighted reports |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Filter isHidden in all queries | P0 | 4hr | None |
| Implement real AI content analysis | P2 | 8hr | API integration |
| Automated rule execution | P2 | 6hr | AI analysis |
| Appeal workflow | P3 | 6hr | Rules execution |
| Reporter trust scoring | P3 | 4hr | Rules execution |
| Moderator dashboard improvements | P3 | 6hr | All above |

#### AI Integration Opportunities

**Near-term (Phase 8):**
- Toxicity detection (OpenAI moderation API or similar)
- Spam detection
- Duplicate content detection

**Medium-term (Phase 8+):**
- Context-aware moderation (okay in meme space, not in study group)
- Severity scoring
- Suggested actions with confidence

**Long-term (Post-launch):**
- Proactive detection (identify problematic users before reports)
- Community norm learning (each space can have different standards)
- Appeal prediction (which decisions will be contested)

---

### 8.3 PRIVACY ENFORCEMENT

#### How AI Changes This Domain

Privacy is typically implemented as access control—rules that block or allow access. AI adds nuance: inferring privacy preferences from behavior, detecting privacy violations proactively, and explaining privacy tradeoffs to users.

For campus platforms, privacy is complex. Students want to be discoverable but not stalked. The AI opportunity is adaptive privacy—defaults that adjust based on context. A student in a large lecture might want privacy; the same student at a small club meeting wants visibility.

For HIVE, privacy settings exist but aren't enforced. This is a trust-breaking bug that must be fixed before AI augmentation makes sense.

#### Domain Mechanics

**Actors:** Users (privacy setters), Viewers (privacy subjects), System (enforcement), Admins (override capability)

**Objects:** Settings (user preferences), Visibility rules (who sees what), Activity (tracked actions), Presence (online status), Ghost mode (full invisibility)

**Workflows:**
1. Configuration: User sets preferences → stored → applied globally
2. Enforcement: Request made → check requester against settings → filter response
3. Override: Admin action → documented override → user notified
4. Audit: Access patterns → violation detection → user alerting

**Constraints:** Must be comprehensible (users understand what settings do), must be enforceable (no leaks), must have escape hatch (admin override for safety)

#### Current State → Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Settings storage | Works | Works |
| Enforcement | None | All queries respect |
| Ghost mode | Ignored | Full invisibility |
| Activity hiding | Ignored | Activity not shown |
| Presence privacy | Ignored | Presence not broadcast |

#### Implementation Tasks

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Audit all queries for privacy filtering | P1 | 4hr | None |
| Enforce ghost mode in search | P1 | 2hr | Search implementation |
| Enforce ghost mode in browse | P1 | 2hr | Privacy audit |
| Enforce activity hiding | P2 | 3hr | Privacy audit |
| Enforce presence privacy | P2 | 3hr | Real-time fixes |
| Privacy violation alerting | P3 | 4hr | All enforcement |

#### AI Integration Opportunities

**Near-term (Phase 8):**
- Privacy setting recommendations
- Clear explanations of setting effects

**Medium-term (Post-launch):**
- Anomaly detection (unusual access patterns)
- Adaptive defaults based on behavior
- Privacy impact predictions ("If you make this public, ~50 people will see it")

**Long-term (Post-launch):**
- Context-aware privacy (auto-adjust based on situation)
- Privacy assistant ("You haven't updated your privacy settings in 6 months, review?")
- Violation prediction and prevention

---

## Summary: Implementation Sequence

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| 1 | Security & Data | Week 1 | Auth hardened, Onboarding data saved |
| 2 | Identity & Isolation | Week 1-2 | Profiles working, Campus isolated |
| 3 | Core Experience | Week 2-3 | Spaces permissions, Feed algorithm |
| 4 | Infrastructure | Week 3-4 | Real-time working, Notifications exist |
| 5 | Discovery | Week 4 | Search works |
| 6 | Engagement | Week 5-6 | Connections, Events UI |
| 7 | Power Features | Week 6-8 | Tools execution, Rituals v1 |
| 8 | Operations | Week 8-10 | Admin complete, Moderation working |

## Total Effort Estimate

| Phase | P0 Tasks | P1 Tasks | P2 Tasks | P3 Tasks | Total |
|-------|----------|----------|----------|----------|-------|
| 1 | 4.5hr | 3hr | 3hr | 10hr | 20.5hr |
| 2 | 1hr | 17hr | 9hr | 6hr | 33hr |
| 3 | 8hr | 12hr | 21hr | 24hr | 65hr |
| 4 | 4hr | 17hr | 13hr | 16hr | 50hr |
| 5 | 4hr | 9hr | 8hr | 16hr | 37hr |
| 6 | 1hr | 11hr | 24hr | 22hr | 58hr |
| 7 | - | - | 42hr | 62hr | 104hr |
| 8 | 4hr | 8hr | 31hr | 28hr | 71hr |
| **Total** | **26.5hr** | **77hr** | **151hr** | **184hr** | **438.5hr** |

**P0+P1 (MVP Critical): 103.5 hours (~2.5 weeks full-time)**
**P0+P1+P2 (Feature Complete): 254.5 hours (~6 weeks full-time)**
**All Phases: 438.5 hours (~11 weeks full-time)**

---

## AI Integration Summary

| Slice | Near-term AI | Medium-term AI | Long-term AI |
|-------|--------------|----------------|--------------|
| Auth | - | Behavioral biometrics | Continuous auth |
| Onboarding | - | Interest suggestion, Space rec | Conversational flow |
| Profiles | Completion prompts | Bio generation, Interest inference | Dynamic rendering |
| Campus | - | Local search ranking | Cross-campus transfer |
| Spaces | Auto-moderation | Health scoring, Event gen | AI co-leader |
| Feed | Rule-based ranking | Collaborative filtering | Intent prediction |
| Real-time | - | Delivery priority | Predictive fetch |
| Notifications | Rule-based gen | Importance scoring | Predictive notif |
| Search | Query expansion | Semantic search | Conversational |
| Social | Strength scoring | Mutual connections | Introduction facilitation |
| Events | Desc generation | Recommendations | External aggregation |
| Tools | Template suggestion | NL generation | Autonomous creation |
| Rituals | Parameter suggestions | Adaptive difficulty | Novel archetypes |
| Admin | Anomaly detection | Predictive alerts | Autonomous intervention |
| Moderation | Toxicity detection | Context-aware | Proactive detection |
| Privacy | Setting recommendations | Adaptive defaults | Context-aware |

---

*Document generated: November 28, 2024*
*For Claude Code implementation tracking*
