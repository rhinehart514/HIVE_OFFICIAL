# HiveLab Spec

The definitive spec. Replaces all previous HiveLab documents.

Built on: 12 research documents, full codebase audit, competitive analysis of 20+ platforms, and the strategic reframe — students build campus infrastructure, campus is the audience.

---

## 1. What HiveLab Is

HiveLab is HIVE's creation runtime. Students build tools that become campus infrastructure — dining trackers, study matchers, event boards, org dashboards, room finders — without writing code.

It is NOT:
- A feature of Spaces (tools exist independently)
- An app store (tools live in profiles and feeds, not a catalog)
- A code editor (no-code first, AI-assisted, progressive complexity)
- Just for org leaders (any verified student can create)

It IS:
- A runtime for campus tools (WeChat Mini Programs model — apps inside a platform)
- A capabilities platform (auth, storage, state, distribution, connections)
- A social creation experience (remix, fork, share, endorse)
- The thing that makes Spaces useful (tools ARE what a space does)

**The pitch:** HIVE gives you the audience. HiveLab gives you the tools to serve them. A student can go from idea to live-on-campus in 5 minutes.

**The moat:** Every tool is built by a verified student at a real campus. Every tool has a built-in audience (the campus). Every tool accumulates usage data that lives on the creator's profile. No other platform has this.

---

## 2. Three Surfaces

Tools exist in three places. Each has a different relationship to the user.

### Surface 1: Space Tools (V1 Priority)

Tools deployed to a space. This is how most tools start and where most value lives.

- Space leaders curate which tools are active
- Members use tools as part of their space experience
- Tools appear in a dedicated "Tools" tab + sidebar pinning
- Tool activity flows into the space feed
- Space context is injected into tools (members, roles, events, brand)

**Examples:**
- SGA space has a budget tracker, meeting agenda, and proposal voting tool
- Greek chapter has attendance, philanthropy tracker, and rush management
- Design club has a portfolio showcase, project gallery, and critique tool

### Surface 2: Profile Tools

Tools pinned to a creator's profile. This is the portfolio — proof of what you built and who used it.

- Up to 3 pinned tools on profile
- Usage stats visible (users, interactions, spaces deployed to)
- Activity feed shows recent creation activity
- Builder level and badges displayed
- Visitors can try tools directly from the profile

**This is the GitHub profile model.** Your profile becomes a living portfolio of campus impact.

### Surface 3: Campus Feed

Tools surfaced through the campus activity feed. This is discovery.

- Tool launches appear as feed events ("Sarah just launched a dining tracker")
- Milestones trigger feed items ("Room Finder hit 500 users")
- Trending tools surface ("Study Buddy is trending — 89 new users this week")
- Space endorsements show up ("CS Club now uses Project Tracker")
- Friends using tools creates social proof ("Alex and 2 others started using Study Buddy")

**Not an app store.** Tools emerge from the social fabric — people you know building things your campus needs.

---

## 3. Space Integration (The Immediate Work)

This is what makes Spaces and HiveLab feel like one product. The APIs and runtime exist. The gap is UI.

### 3.1 Tools Tab

Every space gets a "Tools" tab in its navigation, alongside Chat, Events, Members.

**What it shows:**
- Grid of deployed tools with name, icon, one-line description, usage count
- "Active" vs. "Inactive" toggle for leaders
- Quick-run: tap a tool to open it inline (modal) or full-page
- Activity indicator: tools with recent activity show a pulse

**For leaders:**
- "Add Tool" button → opens tool gallery filtered by space type
- "Create Tool" button → opens builder with space context pre-loaded
- Drag to reorder tools
- Per-tool settings: visibility (all/members/leaders), placement (tab/sidebar/inline)

**For members:**
- See all tools with visibility = "all" or "members"
- Use tools inline
- Suggest tools to leaders (lightweight request flow)

### 3.2 Add Tool Gallery

When a leader taps "Add Tool", they see:

1. **Recommended for your space type** — templates curated by space category (see Section 8)
2. **Popular on campus** — tools other spaces have deployed, sorted by usage
3. **Built by members** — tools created by people in this space
4. **Browse all templates** — the full template catalog

Each template card shows: name, preview, description, "Used by X spaces", one-tap deploy.

### 3.3 Create Tool from Space

"Create Tool" in a space should:

1. Open the builder at `/lab/new?spaceId={id}&spaceType={type}`
2. Pre-load space context: name, member count, category, brand colors
3. Suggest templates based on space type
4. After building, "Deploy" defaults to the originating space
5. Space members see the tool appear in real-time

**The loop:** See a need in your space → Create a tool → Deploy it → Members use it → Iterate based on feedback. All without leaving the space context mentally.

### 3.4 Tool Activity in Space Feed

When tools are used, activity flows into the space feed:

- "24 members RSVPed to Friday's event" (aggregate, not individual)
- "New poll: What should our next event be?" (tool launch within space)
- "Budget Tracker updated by Sarah" (creator activity)
- "Study Group Matcher has 3 new groups this week" (tool milestone)

This makes tools feel alive and part of the space, not a sidebar afterthought.

### 3.5 Tool Management for Leaders

A "Manage Tools" panel in space settings:

- List all deployed tools with status (active/inactive/outdated)
- Usage stats per tool (weekly active users, interactions, trend)
- Bulk actions: activate, deactivate, reorder, remove
- Update notifications: "Budget Tracker has a new version available"
- Governance: which capability lanes are allowed for this space

---

## 4. Creation Experience

Four complexity levels. Each feels like a natural extension of the previous one.

### Level 1: Instant (30 seconds)

**What:** Slash commands and one-tap templates.

- `/poll "Best dining hall?" [North] [South] [East]` → live poll, instantly deployed
- One-tap templates: "Quick Poll", "Event RSVP", "Announcement", "Meeting Agenda"
- No builder UI. The creation IS the tool. Like posting a message.

**Who:** Anyone. No learning curve. If you can type, you can create.

**Target:** 60% of all tools created should be Level 1.

### Level 2: Template (5 minutes)

**What:** Choose a template, customize fields, deploy.

- Template provides structure (elements, layout, logic)
- Creator fills in campus-specific details (which dining halls, what hours, which courses)
- Light customization: colors, labels, element order, visibility rules
- Deploy is one tap

**Who:** Curious students, space leaders setting up their space.

**Target:** 25% of all tools created.

### Level 3: AI-Assisted (30 minutes)

**What:** Describe what you want, AI generates it, you refine.

- "I want to match students by course, schedule, and study style"
- AI generates elements, layout, logic, and connections
- Creator reviews, tweaks, adds campus-specific context
- Iterative: "Add a filter for library vs. dorm" → AI adjusts

**Who:** Students with a specific need that templates don't cover.

**Target:** 12% of all tools created.

### Level 4: Full Builder (hours to days)

**What:** Visual canvas with full element control, connections, conditional logic.

- Drag-and-drop element placement
- Connection system between elements (output of one → input of another)
- Conditional visibility based on user role, time, space state
- External data connections (Canvas, Google Sheets, calendar)
- Custom styling, responsive layouts, multi-page tools

**Who:** Technical students, CS majors, hackathon builders, power users.

**Target:** 3% of all tools created, but 40%+ of all tool USAGE.

### The Gradient Rule

Each level should have a visible "open the hood" path to the next:

- Level 1 poll → "Customize this poll" → Level 2 template editor
- Level 2 template → "Add more elements" → Level 3 AI assist
- Level 3 AI output → "Edit manually" → Level 4 full builder

**Never a cliff. Always a ramp.**

---

## 5. Element Architecture

The element system is the atomic layer. Everything in HiveLab is built from elements.

### Current State (27 Elements)

**Input:** SearchInput, FilterSelector, DatePicker, FormBuilder
**Display:** PhotoGallery, ResultList, TagCloud, MapView, ChartDisplay, NotificationCenter
**Interactive:** CountdownTimer, Poll, Leaderboard, RsvpButton, Timer, Counter
**Connected:** EventPicker, SpacePicker, ConnectionList
**Space-Aware:** MemberList, MemberSelector, SpaceEvents, SpaceFeed, SpaceStats, Announcement, RoleGate, AvailabilityHeatmap

### Element Execution Model

Elements do NOT run arbitrary code. They execute through predefined action handlers:

| Action | What it does |
|--------|-------------|
| `submit` | Saves form data to shared state |
| `vote` | Records vote, updates counters |
| `increment` / `decrement` | Adjusts counter values |
| `toggle` | Flips boolean state |
| `rsvp` | Records attendance response |

This is safe by design. No `new Function()`, no `eval()`, no sandbox escapes. The tradeoff is flexibility — tools can only do what action handlers support. New capabilities require new handlers, not user-written code.

### State Architecture

Two-tier state, both persisted in Firestore:

**SharedState** (visible to all users):
- `counters` — vote counts, RSVP totals, form submissions
- `collections` — entities (voters, attendees, submissions)
- `timeline` — activity log (last 100 events)
- `computed` — derived values (averages, totals, trends)

**UserState** (per-user, personal):
- `selections` — user's choices
- `participation` — flags (hasVoted, hasSubmitted)
- `personal` — drafts, preferences
- `ui` — collapsed sections, active tabs

Real-time sync via Firebase RTDB for instant feedback (poll results update live, RSVP counts change immediately).

### Elements to Add (Prioritized)

| Element | Why | Complexity |
|---------|-----|-----------|
| **SchedulePicker** | When2Meet has no API; build scheduling into tools | Medium |
| **VotingBoard** | Ranked choice, approval voting, not just single-pick polls | Medium |
| **SignupSheet** | Slot-based signups (office hours, volunteer shifts) | Low |
| **DirectoryList** | Searchable member/contact directory | Low |
| **BudgetTable** | Income/expense tracking for orgs | Medium |
| **ChecklistTracker** | Shared progress tracking (onboarding, event prep) | Low |
| **QRCodeGenerator** | Create QR codes linking to tools (physical distribution) | Low |
| **CanvasConnect** | Pull assignments/deadlines from Canvas API | High |
| **CalendarSync** | Push/pull events to/from Google Calendar | High |
| **GroupMeBot** | Post tool updates to GroupMe (dominant campus messaging) | Medium |

---

## 6. Capabilities Layer

What the platform provides so builders don't have to.

### Platform-Provided (Builders Never Touch)

| Capability | What HIVE Handles |
|-----------|------------------|
| **Authentication** | Campus email verification, session management |
| **Identity** | Verified student profiles with campus affiliation |
| **Storage** | Firestore persistence for tool state, user data |
| **Real-time** | RTDB for live updates across all connected users |
| **Permissions** | Role-based access (creator, leader, member, visitor) |
| **Distribution** | Deploy to spaces, appear in feeds, live on profiles |
| **Analytics** | Usage tracking, interaction counts, active users |
| **Notifications** | In-app alerts when tools need attention |
| **Search** | Platform-level search across all campus tools |
| **Mobile** | Responsive rendering, touch-optimized elements |
| **Versioning** | Draft/published/archived states, version history |
| **Security** | Capability-gated actions, rate limiting, admin review |

### Builder-Provided (What Creators Do)

| Capability | What Builders Handle |
|-----------|---------------------|
| **Domain knowledge** | What their campus actually needs |
| **Content** | The specific data, labels, options, descriptions |
| **Curation** | Which elements, what layout, what logic |
| **Context** | Campus-specific information no template can know |
| **Maintenance** | Updating content, responding to feedback |

### The Line

HIVE provides the runtime. Builders provide the intent. The platform should never require a builder to think about infrastructure — auth, hosting, databases, deployment, performance. Those are solved. The builder's job is to serve their campus.

---

## 7. Connections Layer

External data that makes tools useful beyond static elements.

### Phase 1: No Permission Required (Launch)

These connections work with student-authorized data or public APIs.

| Connection | What It Enables | Auth Model |
|-----------|----------------|-----------|
| **Google Calendar** | Event sync, availability, scheduling | OAuth (student's own account) |
| **Google Sheets** | Data import/export, live dashboards | OAuth |
| **Google Forms** | Response collection, survey aggregation | OAuth |
| **GroupMe** | Post tool updates to group chats | Bot API (free) |
| **Discord** | Webhooks for tool notifications | Webhook URL |
| **Slack** | Webhooks for tool notifications | Webhook URL |
| **GTFS Transit** | Campus shuttle tracking, real-time location | Public feeds |
| **Weather** | Campus weather data for outdoor event tools | Free API |
| **iCal** | Import/export events from any calendar | Standard format |

### Phase 2: Student-Authorized Campus Data

These require the student to connect their own campus account.

| Connection | What It Enables | Auth Model |
|-----------|----------------|-----------|
| **Canvas API** | Assignments, deadlines, course info | Personal access token (student authorizes own data) |
| **Notion** | Import/sync with existing org documentation | OAuth |
| **Spotify** | Collaborative playlists, music for events | OAuth |

### Phase 3: Institutional Partnership

These require the university to grant API access.

| Connection | What It Enables | Auth Model |
|-----------|----------------|-----------|
| **Campus SSO** | Single sign-on via CAS/Shibboleth | Institutional agreement |
| **SIS Data** | Course catalogs, enrollment, schedules | Institutional API |
| **Library Systems** | Room availability, resource access | Institutional API |
| **Dining Services** | Menus, hours, nutrition data | Scrape or vendor API |
| **Campus Card** | Meal plan balance, building access | Institutional partnership |

### Connection Architecture

Connections are a **shared layer**. A Canvas connector built once means every tool on HIVE can offer "Connect your Canvas." Each new connection makes every tool on the platform more powerful.

Builders don't build connections. They enable them:
1. Drag a `CanvasConnect` element into their tool
2. User sees "Connect your Canvas" button
3. User authorizes their data
4. Tool has access to that user's course/assignment data

---

## 8. Space-Type Intelligence

Different space types need different tools. The platform should know this.

### Student Organizations

**Pre-installed:** Announcements, Event RSVP, Quick Poll
**Recommended templates:** Meeting Agenda, Budget Overview, Member Directory, Photo Gallery
**Space-specific elements:** MemberList, SpaceEvents, Leaderboard

**What they actually need:** Meeting management, event coordination, member engagement tracking, budget transparency, handoff documentation for new leadership.

### University Organizations

**Pre-installed:** Announcements, Event Calendar, Office Hours
**Recommended templates:** Student Feedback Form, Resource Directory, FAQ Board
**Space-specific elements:** DirectoryList, SchedulePicker, Announcement

**What they actually need:** Service delivery tools (advising signups, resource booking), event promotion, student feedback collection, data reporting.

### Residential

**Pre-installed:** Announcements, Quick Poll, Event RSVP
**Recommended templates:** Floor Events, Study Group Finder, Noise Level Tracker
**Space-specific elements:** AvailabilityHeatmap, Poll, Counter

**What they actually need:** Community building (floor events, common interest discovery), shared resource coordination (laundry, study rooms), quiet hours / noise communication.

### Greek Life

**Pre-installed:** Announcements, Attendance Tracker, Event RSVP
**Recommended templates:** Philanthropy Tracker, Rush Management, Chapter Budget, Brotherhood/Sisterhood Points
**Space-specific elements:** Leaderboard, ChecklistTracker, BudgetTable

**What they actually need:** Compliance tracking (attendance, community service hours), rush management, philanthropy coordination, internal governance, dues collection tracking.

### The Template Selection Algorithm

When a leader taps "Add Tool":
1. Filter templates by space type (category field)
2. Sort by usage among similar spaces ("12 Greek chapters use this")
3. Highlight tools that address the space type's known pain points
4. Show "Popular at [campus name]" for campus-specific social proof

---

## 9. Remix & Fork

The most powerful creation pattern. Stealing from Glitch and Figma.

### How It Works

1. Student sees a tool in another space, on someone's profile, or in the feed
2. Taps "Remix" → gets their own copy with all elements and layout
3. Customizes for their context (different labels, colors, data, space)
4. Deploys to their space or profile
5. Original creator gets "Remixed by X" credit

### Why This Matters

- **Lowers creation barrier:** You don't need to start from zero
- **Accelerates campus coverage:** One good dining tracker becomes 50 campus-specific ones
- **Creates a creation culture:** Remixing is how Gen Z creates (TikTok duets, Instagram templates, Figma community)
- **Gives creators social proof:** "Remixed 47 times" is a badge of honor

### Evolution Chains

```
Quick Poll → Weighted Poll → Multi-Round Vote → Budget Allocation Tool
Simple RSVP → RSVP + Waitlist → Event Hub → Event Series Platform
Dining Hours → Dining Tracker → Meal Planner → Nutrition Dashboard
```

Each remix adds capability. The campus ecosystem grows organically.

### Rules

- Any published tool can be remixed (this is the default; creators can opt out)
- Remixed tools are independent — changes to the original don't cascade
- Original creator is always credited ("Based on Sarah's Dining Tracker")
- Remix chains are visible: see the lineage of any tool
- Remix count is a creator metric (profile badge, builder level XP)

---

## 10. Tool Lifecycle

### States

```
idea → draft → published → deployed → active → maintained → handed-off → archived
```

| State | What's Happening | Who Sees It |
|-------|-----------------|------------|
| **Draft** | Creator is building in /lab | Only creator |
| **Published** | Submitted for review, approved | Discoverable on campus |
| **Deployed** | Active in one or more spaces | Space members |
| **Active** | Users are interacting with it | Everyone with access |
| **Maintained** | Creator pushes updates, fixes | Users get latest version |
| **Handed-off** | Creator graduated/left, new maintainer | Transparent to users |
| **Archived** | No maintainer, tool sunset gracefully | Shows "archived" badge |

### Publishing Flow (Existing — Works)

1. Creator finishes tool in builder
2. Clicks "Publish" → confirms guidelines (content appropriate, tested, documented, privacy compliant)
3. Tool enters `pending_review` state
4. Admin reviews and approves/rejects
5. On approval: tool is `published` and discoverable

### Deploy Flow (Existing — Works)

1. Creator clicks "Deploy" on a published tool
2. `DeployTakeover` component shows space selection
3. Creator picks target space(s) — filtered to spaces where they're leader/admin
4. Animation: tool flies to space
5. Tool appears in space's Tools tab and sidebar

### Maintenance (New — Needs Building)

**Platform-absorbed maintenance (Level 1-2 tools):**
- Platform handles element updates, security patches, performance
- Creator only needs to update content (not code/structure)
- If creator disappears, tool keeps working

**Creator-maintained (Level 3-4 tools):**
- Creator sees usage dashboard (active users, errors, feedback)
- "Your tool had 12 errors this week" alerts
- Version control: push updates without breaking deployed instances
- Changelog visible to users

### Graduation Handoff (New — Needs Building)

1. Senior year: creator gets "Find a successor" prompt (proactive, not last minute)
2. Interested students can "apply" to co-maintain
3. Co-maintenance period: new maintainer learns alongside creator
4. Creator graduates → new maintainer takes over
5. Creator stays listed as "Original Creator" forever

---

## 11. Discovery

Three surfaces. No app store.

### Profile Discovery (Pull)

Creator profiles show:
- Pinned tools (up to 3) with usage stats
- Builder level + XP
- Total impact ("Built tools used by 1,200 students")
- Spaces contributed to
- Activity feed of recent creation work
- Endorsements from spaces

**This is living proof of work.** Not a static portfolio.

### Feed Discovery (Push)

Tool activity appears naturally in the campus feed:

| Event Type | Trigger | Example |
|-----------|---------|---------|
| Launch | Creator publishes | "Marcus just launched Study Buddy" |
| Milestone | Usage threshold | "Room Finder hit 500 users" |
| Trending | Rapid growth | "Dining Tracker: 89 new users this week" |
| Endorsement | Space adopts | "Engineering Club now uses Project Tracker" |
| Update | Creator ships update | "Sarah added meal ratings to Dining Tracker" |
| Social proof | Friend starts using | "Alex and 2 others started using Study Buddy" |

**Social framing, not product framing.** "Sarah built a way to see what's open for dinner" — not "Dining Tracker v1.0 now available."

### Space Bridging (Viral)

Tools adopted by one space get recommended to similar spaces:
- "3 STEM clubs use Project Tracker. You're in Engineering Club — want to try it?"
- QR codes for physical distribution (posters, club fairs, classroom)
- One-tap sharing via link

### Cold Start → Scale

| Phase | Users | Discovery Approach |
|-------|-------|-------------------|
| Launch | < 500 | Chronological feed + staff picks + manual curation |
| Growth | 500-2K | Add trending, popularity sorting, space-based recs |
| Scale | 2K+ | Interest graph, collaborative filtering, personalized feed |

Chronological never goes away. It's the fairest for new creators.

---

## 12. Trust & Quality

### Trust Stack (No Store Needed)

| Signal | Strength | Source |
|--------|----------|--------|
| "3 of your friends use this" | Highest | Peer social proof |
| "1,200 students use this" | Very high | Aggregate usage |
| "Popular in Design Club" | High | Community endorsement |
| "Built by Sarah, Level 4 Builder" | High | Creator reputation |
| "Updated 2 days ago" | Medium | Active maintenance |
| "Featured by campus" | Medium | Institutional trust |

Foundation of all trust: **verified campus identity.** Every builder is a real student. You can find them, message them, hold them accountable.

### Quality Signals

Quality comes from usage, not ratings:

| Metric | What It Measures |
|--------|-----------------|
| **Weekly Active Users** | Real engagement |
| **Retention (7-day)** | Ongoing value |
| **Interaction Rate** | Users doing things, not just viewing |
| **Space Adoption** | Multiple spaces deploying the same tool |
| **Remix Count** | Other builders learning from this tool |
| **Error Rate** | Technical quality |
| **Update Frequency** | Creator engagement |

### Admin Review

Every tool requires admin approval before publishing. Review checks:
- Content appropriate for campus
- Functionality tested and working
- Description is accurate
- No privacy violations
- Elements are functional (not empty/broken)

---

## 13. Creator Progression

Earned through usage and impact. Not paywalled.

### Levels

| Level | Name | Requirements | Unlocks |
|-------|------|-------------|---------|
| 1 | **Creator** | Publish 1 tool | Basic builder, all Level 1-2 templates |
| 2 | **Builder** | 3 tools, 100 total users | Level 3 AI-assisted creation, connections |
| 3 | **Architect** | 5 tools, 500 total users, 1 space endorsement | Level 4 full builder, advanced elements |
| 4 | **Innovator** | 10 tools OR 1 tool with 1000+ users, 3 remixes | Beta features, template publishing, mentorship |

### What Levels Do

Levels gate complexity, not access. Every student can create. But advanced features (AI generation, external connections, advanced elements) unlock as you demonstrate you can build things people actually use.

This prevents the "empty tool" problem — students who haven't built anything that works don't get access to powerful features that could create broken, complex tools.

### Profile Badges

- "First Launch" — Published your first tool
- "100 Users" — A tool hit 100 users
- "Space Endorsed" — A space officially adopted your tool
- "Semester Streak" — Maintained a tool for a full semester
- "Remixed 10x" — Your tool was remixed 10 times
- "Multi-Space" — Tool deployed to 3+ spaces

---

## 14. Metrics

### Creator Health

| Metric | Target (Launch) | Target (Growth) |
|--------|----------------|-----------------|
| Tools created / week | 10+ | 50+ |
| Templates used (% of creations) | 70%+ | 50%+ (more custom) |
| Time to first tool | < 5 min | < 3 min |
| Creator 30-day retention | 40%+ | 60%+ |
| Tools with 10+ users | 30%+ | 50%+ |

### Tool Health

| Metric | Target |
|--------|--------|
| WAU per deployed tool | 15+ |
| Interaction rate (users who do something) | 60%+ |
| 7-day retention per tool | 30%+ |
| Error rate | < 1% |
| Average load time | < 2s |

### Space Integration Health

| Metric | Target |
|--------|--------|
| Spaces with 1+ active tool | 50%+ |
| Tools per active space | 3+ |
| Leader tool management actions / month | 5+ |
| Member tool interactions / week | 3+ |

### Platform Vitality

| Metric | Formula | Target |
|--------|---------|--------|
| **Tool Engagement Rate** | DAU tools / total deployed tools | 40%+ |
| **Creator Density** | Active creators / total verified students | 5%+ |
| **Cross-Space Adoption** | Tools in 2+ spaces / total published | 20%+ |
| **Remix Rate** | Remixed tools / total published | 15%+ |

---

## 15. Implementation Sequence

### Phase 1: Space Integration (Now → 4 weeks)

**Goal:** Make Spaces and HiveLab feel like one product.

| Work | What It Is | Priority |
|------|-----------|----------|
| Tools tab in Space view | New tab component showing deployed tools grid | P0 |
| "Add Tool" gallery | Template browser filtered by space type | P0 |
| "Create Tool" from space | Link to builder with space context pre-loaded | P0 |
| Tool activity in space feed | Feed items for tool usage, launches, milestones | P1 |
| Tool management panel | Leader settings for tool visibility, ordering, status | P1 |
| Space-type template curation | Tag existing 23 templates by space type | P1 |

**What exists and works:** PlacedTool data model, space tools API, tool runtime, deploy flow, sidebar tool cards, 23 templates, publishing flow, admin review.

**What needs building:** Tools tab UI, Add Tool gallery, Create from Space flow, feed integration, management panel.

### Phase 2: Creation Polish (Weeks 4-8)

**Goal:** Make creation feel magical for Level 1-2 (85% of creators).

| Work | What It Is | Priority |
|------|-----------|----------|
| Slash command creation | `/poll`, `/rsvp`, `/countdown` in space chat | P0 |
| Template one-tap deploy | Skip builder entirely for simple templates | P0 |
| Space-type defaults | Pre-installed tools based on space category | P1 |
| Remix flow | "Remix this tool" button on any published tool | P1 |
| Creator dashboard | Usage stats, active tools, feedback inbox | P1 |
| New elements: SchedulePicker, SignupSheet, DirectoryList | High-value missing elements | P1 |

### Phase 3: Connections + Discovery (Weeks 8-14)

**Goal:** Tools connect to real data. Campus sees what's being built.

| Work | What It Is | Priority |
|------|-----------|----------|
| Google Calendar connection | OAuth flow, event sync element | P0 |
| GroupMe bot connection | Post tool updates to group chats | P0 |
| Feed discovery | Tool launches and milestones in campus feed | P0 |
| Profile tools section | Pinned tools, builder level, usage stats on profile | P1 |
| Canvas connection | Personal token flow, assignment/deadline element | P1 |
| QR code generation | Physical distribution for campus tools | P2 |

### Phase 4: Scale + AI (Weeks 14-20)

**Goal:** AI-assisted creation, trending, power users.

| Work | What It Is | Priority |
|------|-----------|----------|
| AI tool generation | "Describe what you want" → AI builds it | P0 |
| Trending algorithm | Surface popular tools campus-wide | P0 |
| Creator progression system | Levels, badges, capability unlocks | P1 |
| Graduation handoff | Co-maintainer flow, successor prompts | P1 |
| Tool analytics dashboard | Deep usage data for creators and leaders | P1 |
| Advanced elements | BudgetTable, VotingBoard, ChecklistTracker | P2 |

---

## 16. What We Explicitly Do NOT Build

| Feature | Why Not |
|---------|---------|
| Code editor / custom JS | Security nightmare. Predefined actions are safer and sufficient for 95% of use cases |
| Payment processing in tools | Regulatory complexity. Link to Venmo/CashApp instead |
| Tool marketplace with listings fees | We're not an app store. Tools are free to create and deploy |
| Anonymous tool creation | Campus identity is the moat. Every tool has a verified creator |
| Tool ratings / star reviews | Usage metrics are more honest than opinions. "500 active users" > "4.2 stars" |
| Standalone tool hosting (no HIVE account) | Tools live on HIVE. The platform IS the distribution |
| Tool-to-tool communication | Overly complex for V1. Each tool is independent |
| Arbitrary webhook execution | Security risk. Only pre-approved connection types |

---

## 17. Open Questions

Things we need to decide but don't need to decide now:

1. **Tool pricing:** Should creators ever charge for tools? (Current answer: no. Revisit when we have 1000+ tools.)
2. **Cross-campus tools:** Should a tool at UB be discoverable at other campuses? (Current answer: no. Campus isolation is the moat. Revisit with multi-campus launch.)
3. **Org-owned vs. creator-owned:** When a space leader creates a tool for their org, who "owns" it? (Current answer: creator owns, space has a deployment. If creator leaves the space, tool stays deployed but creator retains ownership.)
4. **AI generation limits:** How many AI-assisted creations per day? (Current answer: 5/day for Builders, 10/day for Architects, unlimited for Innovators. Revisit based on cost.)
5. **Template publishing by users:** When should Level 4 creators publish templates to the platform? (Current answer: Phase 4, after we understand what good templates look like.)

---

## 18. Success Criteria

HiveLab is working when:

- **60% of active spaces** have at least 1 deployed tool
- **A new space leader** can have 3 tools running in their space within 15 minutes of creation
- **A curious student** can go from "I have an idea" to "people are using my tool" in under 30 minutes
- **Tool usage** is a top-3 activity on the platform (alongside chat and events)
- **"What tools does your space have?"** becomes a natural question in campus conversations
- **Creator profiles** are shared in resumes, LinkedIn, and job applications

The ultimate test: when a student says "I built that" and points to something thousands of people on their campus use every week.

---

## Sources

This spec synthesizes findings from:
- `docs/research/PLATFORM_INFRASTRUCTURE_MODELS.md` — 10 platform case studies
- `docs/research/CAMPUS_DATA_CONNECTIONS.md` — Campus APIs and integration patterns
- `docs/research/SOCIAL_DISCOVERY_MODEL.md` — Discovery through profiles, feeds, sharing
- `docs/research/CAMPUS_BUILDER_EXPERIENCE.md` — Creation UX, progressive disclosure, maintenance
- `docs/research/AUDIENCE_EXPANSION_RESEARCH.md` — 5-tier audience model
- `docs/research/CREATION_PARADIGMS.md` — 10 creation paradigm analyses
- `docs/research/SPACE_TYPE_NEEDS.md` — 4 space type ground truth
- `docs/research/CAMPUS_CREATION_CULTURE.md` — Gen Z creation patterns
- `docs/research/MAGIC_MOMENTS.md` — Time-to-magic benchmarks
- `docs/research/CREATION_VISIONS.md` — 15 divergent creation visions
- `docs/research/TOOL_ECOSYSTEM_IDEATION.md` — Space-type tool operating systems
- `docs/research/QUALITY_BENCHMARKS_IDEATION.md` — Quality metrics framework
- Full codebase audit of packages/core/domain/hivelab, apps/web/src/components/hivelab, apps/web/src/app/api/tools
