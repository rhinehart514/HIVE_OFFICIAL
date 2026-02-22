# HiveLab: Evolution Engine Spec

## The Frame

HiveLab is the programmable layer of the campus operating system. It's not a tool builder — it's the system where new social mechanics are invented, deployed into live environments, and evolved based on real behavior.

```
HIVE = Campus Operating System

┌─────────────────────────────────────────┐
│  HiveLab — Evolution Engine             │
│  (invent, deploy, observe, evolve)      │
├─────────────────────────────────────────┤
│  Tools — Functional Layer               │
│  (what actions are possible)            │
├─────────────────────────────────────────┤
│  Spaces — Structural Layer              │
│  (where people gather)                  │
├─────────────────────────────────────────┤
│  Profiles — Identity Layer              │
│  (who people are)                       │
├─────────────────────────────────────────┤
│  Feed/Discover — Observation Layer      │
│  (what's happening)                     │
└─────────────────────────────────────────┘
```

A social mechanic needs four things to be real:
1. **Shared state** — everyone sees the same reality
2. **Identity awareness** — the mechanic knows WHO is acting
3. **Rules that trigger** — when X happens, Y follows
4. **Temporal dynamics** — behavior changes over time

---

## Audit: What Exists vs. What's Needed

### 1. SHARED STATE

**What exists:**
- `ElementSharedState` type is fully defined: counters, collections, timeline, computed values, versioning
- `sharedState` prop flows through to elements (`ElementProps.sharedState`)
- Firestore path defined: `deployedTools/{deploymentId}/sharedState/current`
- Per-user state: `toolStates/{deploymentId}_{userId}`
- State API: `/api/tools/[toolId]/state/` with GET/PUT/PATCH, 1MB limit, merge support
- `/api/tools/[toolId]/with-state/` loads tool + shared state + user state together
- Inline components (poll/rsvp/countdown) have their own participation API: `/api/spaces/[id]/components/[componentId]/participate`

**What's fixed:**
- ✅ **Tool execution runtime uses Firestore** — `HIVE.storage.get/set/delete` now call `/api/tools/state/{deploymentId}` with PATCH/PUT/GET. No more localStorage.
- ✅ **Real-time state sync works** — Firebase RTDB via `useToolStateRealtime` + `toolStateBroadcaster`. Votes propagate instantly.

**Remaining:**
- 🟡 **Standalone tools (`/t/`) don't connect to shared state API** — unclear if the runtime hooks wire to the Firestore state in standalone mode

**What to build:**
- [ ] **P1: Optimistic concurrency** — ElementSharedState has `version` field already. Implement compare-and-swap on state writes to prevent race conditions (two people voting simultaneously).
- [ ] **P1: Atomic counters** — Use Firestore FieldValue.increment() for vote counts instead of read-modify-write. The counter key format `{instanceId}:{counterId}` is already defined.

---

### 2. IDENTITY AWARENESS

**What exists:**
- `MemberContext` type is complete: userId, displayName, role (owner/admin/mod/member/guest), tenure (daysInSpace, isNewMember), permissions (canPost, canDeployTools, canModerate, canManageMembers, canAccessAdmin)
- `ToolRuntimeContext` includes userId, campusId, member context, space context
- `VisibilityCondition` system supports field-path conditions like `member.role equals admin`
- `ConditionGroup` supports AND/OR logic for compound conditions
- `evaluateCondition()` and `evaluateConditionGroup()` are fully implemented
- Elements receive `context.userId`, `context.isSpaceLeader`
- Tool execution runtime has `HIVE.user.getId()` and `HIVE.user.getProfile()` (permission-gated)

**What's fixed:**
- ✅ **HIVE.user.getProfile() fetches real data** — calls `/api/profile` + `/api/spaces/{spaceId}/membership`, returns `{ id, name, avatarUrl, role }` with graceful fallback
- ✅ **HIVE.space.getMembers() returns real members** — calls `/api/spaces/{spaceId}/members?limit=100`, maps to safe subset `[{ id, name, avatarUrl, role, isOnline }]`
- 🟡 **Visibility conditions defined but unclear if any element actually uses them** — the infrastructure exists but may not be wired in any real element
- 🟡 **No per-user participation tracking across tools** — a tool can't know "has this user voted in 3 polls today" or "this user's streak is 5 days"

**What to build:**
- [ ] **P0: Wire HIVE.user.getProfile()** to real Firestore user data (name, avatar, role in current space)
- [ ] **P0: Wire HIVE.space.getMembers()** to real member list API
- [ ] **P1: User participation history** — `toolStates/{deploymentId}_{userId}` already exists. Add a `participation` subcollection or field that tracks: what actions this user took, when, how many times. This is the foundation for streaks, reputation, behavioral patterns.
- [ ] **P1: Cross-tool identity** — a user's identity should carry context across tools in the same space. "This person is a power user in CompSci Club" should be available to any tool deployed there. Use the member context + a computed engagement score.
- [ ] **P2: Anonymous mode** — some mechanics work better anonymous (Q&A, feedback). Add `anonymous: true` to tool config. The system knows who acted (for moderation) but other users don't.

---

### 3. RULES THAT TRIGGER (Automations)

**What exists:**

**Space automations** (`/api/spaces/[id]/automations/`):
- Triggers: `member_join`, `event_reminder`, `schedule` (daily/weekly/monthly), `keyword` (exact/contains match in chat)
- Actions: `send_message`, `create_component` (poll/countdown/rsvp/announcement), `assign_role`, `notify`
- Full CRUD + toggle enable/disable
- Template support (`/automations/from-template/`)
- Manual trigger endpoint

**Tool automations** (`/api/tools/[toolId]/automations/`):
- Triggers: `event` (element emits event), `schedule` (cron), `threshold` (value crosses boundary)
- Actions: defined in `@hive/core` (not fully audited but schema exists)
- Conditions system for filtering
- Run history tracking
- Test endpoint
- Limits: max automations per tool, max actions/conditions per automation

**Automation infrastructure:**
- Cron job: `/api/cron/automations/` — processes scheduled automations
- Automation awareness panel in lab IDE

**What's broken:**
- 🟡 **Cron changed to daily for Vercel hobby tier** — scheduled automations that need hourly/minute resolution won't fire accurately
- 🟡 **No evidence automations have been tested e2e** — the APIs exist but unclear if the trigger → action pipeline actually fires
- 🟡 **Space automations and tool automations are separate systems** — a space automation can't trigger based on tool state, and a tool automation can't send a message to the space chat

**What to build:**
- [ ] **P1: Verify automation pipeline e2e** — create a test: member joins space → automation fires → message appears in chat. Does it actually work?
- [ ] **P1: Bridge space and tool automations** — add `tool_state_change` as a space automation trigger (when a tool's shared state changes, fire a space automation). Add `send_chat_message` as a tool automation action. This connects the functional layer to the structural layer.
- [ ] **P1: Threshold triggers for shared state** — "when poll votes reach 50, close the poll and announce results." The `threshold` trigger type exists for tool automations. Wire it to watch `sharedState.counters`.
- [ ] **P2: Chained automations** — automation A's output feeds automation B's input. "When signup fills → create countdown → when countdown ends → send announcement." This is the evolution engine: students create behavioral sequences, not just single tools.
- [ ] **P2: Community-triggered automations** — `vote_threshold` (community decides), `consensus` (all admins approve), `quorum` (N people must act). These are governance primitives for student orgs.
- [ ] **P3: Temporal evolution rules** — "This tool changes behavior after week 2" or "poll options narrow each round." Tools that evolve on their own schedule. Store evolution rules in tool config, evaluate against temporal context.

---

### 4. TEMPORAL DYNAMICS

**What exists:**
- `TemporalContext` type: dayOfWeek, hourOfDay, isWeekend, isEvening, isMorning, timestamp, timezone
- `createTemporalContext()` factory function
- `countdown-timer` element with live-updating display and "Event has started!" state
- `schedule` automation trigger with daily/weekly/monthly + time + timezone
- Tool automations support cron expressions
- Visibility conditions can filter on temporal fields

**What's broken:**
- 🟡 **No tool lifecycle** — tools don't have start/end dates, phases, or progression. A poll is forever until someone manually closes it.
- 🟡 **No historical state** — you can't see how a tool's state changed over time. When did the vote swing? When did signups spike? The `timeline` field in `ElementSharedState` exists but nothing writes to it.

**What to build:**
- [ ] **P1: Tool lifecycle** — add `lifecycle` to tool config:
  ```
  lifecycle: {
    startsAt?: string          // ISO timestamp — tool is inactive before this
    endsAt?: string            // ISO timestamp — tool closes/locks after this  
    phases?: [{
      name: string,
      startsAt: string,
      config: Record<string, any>  // override element configs per phase
    }]
  }
  ```
  A poll that runs for 24 hours. A signup that closes at capacity. A bracket that advances rounds on a schedule. These are all lifecycle configurations.

- [ ] **P1: State timeline** — every state mutation writes to `ElementSharedState.timeline`. This is the observation data. Format already defined: `{ id, type, timestamp, userId, action, data }`. This is how creators observe behavior.

- [ ] **P2: Behavioral analytics** — aggregate timeline data into patterns. "Voting peaks at 9pm." "Signups stall after 15." "Engagement drops after day 3." Surface this in the lab IDE as an observation panel.

- [ ] **P2: Adaptive mechanics** — tools that change behavior based on accumulated state. "If fewer than 10 people sign up by Thursday, extend the deadline." "If one poll option has >80%, close early." These are conditional lifecycle rules:
  ```
  adaptiveRules: [{
    condition: { field: 'sharedState.counters.totalVotes', operator: '<', value: 10 },
    after: '2026-02-13T00:00:00Z',
    action: { type: 'extendLifecycle', days: 3 }
  }]
  ```

- [ ] **P3: Seasonal/recurring mechanics** — tools that reset and run again. "Weekly poll." "Monthly spotlight vote." "Semesterly elections." Store recurrence config, auto-clone tool with fresh state on schedule.

---

## New Capabilities to Build

### 5. COMPOSABILITY (Elements Talking to Each Other)

**What exists:**
- `ToolComposition` type with `connections` array: `{ from: { instanceId, output }, to: { instanceId, input } }`
- `CONNECTION_MAP` defines valid port-to-port connections (poll.results → chart.data, form.submissions → result-list.items, etc.)
- `ELEMENT_AFFINITY` maps which elements work well together
- `suggestConnections()` auto-suggests wiring based on existing elements
- Intelligence module with `getConnectionDescription()` for human-readable descriptions

**What's broken:**
- 🔴 **Connections are defined but no evidence they execute at runtime** — the connection map describes relationships but the tool canvas likely renders elements independently without dataflow
- 🟡 **Layout is flow-only** — `ToolComposition.layout = 'flow'`, grid/tabs/sidebar are listed as future work

**What to build:**
- [ ] **P1: Runtime dataflow engine** — when poll-element emits results, chart-display receives them. Implement a simple pub/sub within the tool canvas: elements publish to output ports, connected elements subscribe to input ports. State flows through connections.
- [ ] **P1: Reactive re-rendering** — when an upstream element's output changes, downstream elements re-render. This makes compositions feel alive — vote on a poll, chart updates instantly.
- [ ] **P2: Conditional connections** — data flows only if a condition is met. "Show results chart only after voting closes." Wire visibility conditions to connections, not just elements.
- [ ] **P2: Aggregation connections** — merge data from multiple sources. "Leaderboard combines data from 3 different polls." New connection type: many-to-one with a merge function.

---

### 6. OBSERVATION (The Creator's View)

**What exists:**
- Tool analytics API: `/api/tools/usage-stats`
- Space analytics panel with health score, metrics, peak activity, top contributors
- `automation-awareness-panel.tsx` in lab IDE
- `ElementSharedState.timeline` type (defined but unpopulated)

**What's broken:**
- 🟡 **No tool-level behavioral observation** — creators can see usage counts but not HOW people behave. When do they vote? Do they change their vote? Do they abandon the tool halfway through?

**What to build:**
- [ ] **P1: Live observation mode** — in the lab IDE, show a real-time feed of actions happening on your deployed tool. "Jake voted for Option A" "Maria signed up for Slot 3" "15 people viewed, 8 acted." This is the feedback loop that makes the evolution engine work.
- [ ] **P1: Behavioral funnel** — for each tool: views → interactions → completions. Where do people drop off? This is tool-level analytics, not space-level.
- [ ] **P2: Heatmaps** — which elements get interacted with most? Which are ignored? Visual overlay in the lab IDE showing attention distribution.
- [ ] **P2: Comparison mode** — deploy two versions of a mechanic (A/B). Compare behavioral patterns. "Version A got 40% participation, Version B got 65%." This is how mechanics evolve scientifically.
- [ ] **P3: Behavioral signals API** — expose anonymized behavioral patterns to other tools. "Tools in this space see highest engagement on Tuesdays at 9pm." Context that makes all tools smarter.

---

### 7. EVOLUTION (How Mechanics Improve)

**What exists:**
- Remix/clone API: `/api/tools/remix`
- ConversationalCreator with refinement phase
- RefinementBar component
- Template system for sharing patterns

**What to build:**
- [ ] **P1: Fork + evolve** — "I see CompSci Club's poll mechanic. I want that but with ranked choice voting." Fork the tool, modify the mechanic, deploy. Both versions exist. The better one spreads. This is natural selection for social mechanics.
- [ ] **P1: Version history** — every deployment is a version. Rollback to previous versions. See what changed and how behavior shifted. The `versions` API route exists but needs UI integration.
- [ ] **P2: Mechanic genetics** — when a tool is forked, track lineage. "This attendance tracker descended from the original CS Club version, through 3 forks." Visualize evolution trees. Show which mutations improved engagement.
- [ ] **P2: Cross-space pollination** — "This mechanic worked great in CS Club. Suggest it to Engineering Society." The system observes what works and recommends it to similar spaces. Mechanics spread based on fitness, not marketing.
- [ ] **P3: Auto-evolution** — the system suggests improvements based on behavioral data. "Your poll gets 30% participation. Tools with a deadline get 55%. Add a deadline?" AI-assisted evolution of mechanics.

---

## Element System Gaps

### New Element Types Needed

| Element | What It Is | Why It Matters |
|---------|-----------|----------------|
| **Availability Grid** | When2Meet-style time grid | Most-shared tool type in college. Replaces an external app. |
| **Ranked Choice** | Preference-ordered voting | Elections, prioritization. Current poll is single-choice only. |
| **Bracket** | Tournament bracket with progression | Gaming, debate, intramural. Visual, shareable, temporal. |
| **Roster/Attendance** | Check-in tracker with history | SGA compliance, accountability, streak mechanics. |
| **Payment Tracker** | "Who's paid?" toggle board | Every group activity involves money collection. Not processing — tracking. |
| **Reaction Board** | Freeform emoji/text reactions to a prompt | Lightweight feedback, icebreakers, sentiment. Lower barrier than polls. |
| **Canvas/Whiteboard** | Collaborative freeform drawing/sticky notes | Brainstorming, planning. High engagement, visual output. |
| **Conditional Display** | Shows content based on rules | "If you've RSVP'd, see the location." Unlockable content based on participation. |

### Element System Upgrades

- [ ] **P1: Element events** — elements emit named events (voted, signed_up, completed, expired). Other elements and automations can listen. This is the pub/sub foundation.
- [ ] **P1: Element state subscriptions** — elements can subscribe to each other's state changes. Poll results auto-feed into chart. Signup count auto-feeds into progress bar.
- [ ] **P2: Custom element SDK** — for the 5% who code. React component + schema definition + state management. Deploy as a custom element type. This is how the element library grows beyond what you build.
- [ ] **P2: Element composition presets** — "Poll + Chart + Countdown" as a single composite block. Frequently-composed patterns become first-class compound elements.

---

## Priority Roadmap

### Phase 0: Foundation Integrity ✓
The evolution engine can't run on broken infrastructure.

| Task | Status | Notes |
|------|--------|-------|
| Wire shared state to Firestore (kill localStorage) | ✓ Done | `tool-execution-runtime.ts` now calls `/api/tools/state/{deploymentId}` for all storage ops |
| Real-time state sync (onSnapshot or SSE for tools) | ✓ Already working | Firebase RTDB via `useToolStateRealtime` + `toolStateBroadcaster` |
| Wire chat SSE to frontend | ✓ Already working | `useChatStream` → `useSpaceResidenceState` |
| Wire HIVE.user.getProfile() to real data | ✓ Done | Fetches `/api/profile` + `/api/spaces/{spaceId}/membership` with graceful fallback |
| Wire HIVE.space.getMembers() to real data | ✓ Done | Fetches `/api/spaces/{spaceId}/members?limit=100`, returns safe subset |
| Test automation pipeline e2e | ✓ Done | 3 cron handler test suites + runtime unit tests |

### Phase 1: Mechanics That Live (Weeks 2-3)
Tools become living social mechanics.

| Task | Why |
|------|-----|
| Runtime dataflow engine (connections execute) | Compositions become reactive systems |
| Tool lifecycle (start/end/phases) | Mechanics have temporal shape |
| State timeline (every mutation logged) | Observation data starts accumulating |
| Live observation mode in lab IDE | Creators can watch behavior |
| Element events (pub/sub) | Elements communicate |
| Bridge space + tool automations | Rules span layers |
| Availability grid element | First "killer" new element |

### Phase 2: Mechanics That Evolve (Weeks 4-6)
The system starts learning.

| Task | Why |
|------|-----|
| Behavioral funnel analytics | Creators see what works |
| Fork + evolve with lineage tracking | Natural selection for mechanics |
| Adaptive mechanics (conditional lifecycle) | Tools respond to behavior |
| Cross-space pollination | Good mechanics spread |
| Threshold triggers on shared state | Rules react to collective behavior |
| Ranked choice + Bracket elements | High-demand mechanics |
| Anonymous mode | Safety for feedback mechanics |
| A/B comparison mode | Scientific evolution |

### Phase 3: The Platform (Weeks 7-10)
HiveLab becomes an ecosystem.

| Task | Why |
|------|-----|
| Custom element SDK | Community extends the element library |
| Chained automations | Behavioral sequences |
| Seasonal/recurring mechanics | Persistent social infrastructure |
| Auto-evolution suggestions | AI-assisted mechanic improvement |
| Behavioral signals API | Cross-tool intelligence |
| Embeddable tools | Distribution beyond HIVE |
| Mechanic marketplace | Network effects |
| Governance primitives (vote_threshold, quorum) | Democratic mechanics |

---

## The Test

A student in CompSci Club thinks: "What if we had a system where people stake their attendance streak to vouch for a project idea, and if the project ships, everyone who vouched gets reputation, but if it doesn't, they lose their streak?"

Can they build that in HiveLab today? **No.**

After Phase 0? Still no — but the state is shared so tools are real.

After Phase 1? **Getting close** — they'd compose a signup element + a conditional display + an automation that checks status after a deadline. The pieces exist but require manual wiring.

After Phase 2? **Yes** — fork an existing accountability tool, add streak tracking via state timeline, wire a threshold trigger for project completion, use adaptive rules for the stake/reward logic.

After Phase 3? **Others can build on it** — the pattern becomes a template, other clubs fork it, it evolves across spaces.

That's the evolution engine. Students don't just use systems. They invent them.

---

## Known Limitations

| Area | Limitation | Mitigation |
|------|-----------|------------|
| **Cron frequency** | Vercel Hobby limits all crons to daily. Event reminders with <24h windows and scheduled automations with hourly/minute resolution will miss their targets. | Upgrade to Vercel Pro and change cron config to `*/5 * * * *` for the three automation endpoints. |
| **Full table scans** | Cron routes scan all spaces/deployments on every run. This works at current scale but won't at 1000+ spaces. | Add `hasActiveAutomations: true` flag to space/deployment docs and filter on it in cron queries. |
| **Custom-code runtime not wired** | `tool-execution-runtime.ts` is functional (storage, profile, members all backed by real APIs) but not imported by any component. There's no UI for creating custom-code tools yet. | Needs a UI entry point in HiveLab for custom-code tool creation. Element-based tools (the current UX) work via a different pipeline. |
| **Storage per-user scoping** | The custom-code runtime's `HIVE.storage.get/set` hits the state API which stores per-user state. Shared state between users requires using the element-based tool pipeline or the shared state API directly. | For Phase 1, expose shared state in the custom-code sandbox via `HIVE.sharedStorage`. |
| **Automation cross-system gap** | Space automations and tool automations are separate systems. A space automation can't trigger based on tool state, and a tool automation can't send a message to space chat. | Phase 1 priority: add `tool_state_change` as a space automation trigger and `send_chat_message` as a tool automation action. |
