# HIVE Launch Roadmap
**Last Updated:** 2026-01-21

**The path to launch through Drama + Motivation.**

This replaces all other TODOs. Each vertical slice gets the full treatment: motivation audit, drama design, implementation spec.

---

## The Process (Per Slice)

```
1. AUDIT      → Map current state, identify gaps
2. DESIGN     → Define drives, find peaks, design arc
3. SPEC       → Specific changes, primitives, timing
4. BUILD      → Implement
5. VALIDATE   → Did the drama land?
```

---

## The Slices (In Order)

| # | Slice | Why This Order |
|---|-------|----------------|
| 1 | **Entry** | First impression. Sets expectations for everything. |
| 2 | **Onboarding** | The 60-second window. Make or break. |
| 3 | **Spaces** | The core product. Where life happens. |
| 4 | **Discovery** | How you find your place. |
| 5 | **Feed** | The pulse. Daily return driver. |
| 6 | **HiveLab** | The differentiator. Builder identity. |
| 7 | **Profiles** | Identity. Who you are here. |
| 8 | **Events** | Coordination. Time-based engagement. |
| 9 | **Settings** | Control. Autonomy over experience. |

---

## Slice 1: Entry

**Routes:** `/`, `/about`, `/enter`, `/schools`

### Current State
- `/about` is the gold standard — dramatic, narrative, memorable
- `/` (landing) functional but not cinematic
- `/enter` clean but transactional
- `/schools` basic list

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| Landing `/` | Epic Meaning, Scarcity | Social Influence | "I need to be in there" |
| Schools `/schools` | Scarcity, Social Influence | Epic Meaning | Finding YOUR campus |
| Enter `/enter` | Ownership | Accomplishment | Domain recognized |
| Threshold | Epic Meaning | Ownership | "You're in." |

### Drama Gaps
- [ ] Landing needs the `/about` energy — scale, movement, life signals
- [ ] Schools needs territory drama — "X students, Y spaces, YOUR campus"
- [ ] Enter → Verified needs a threshold moment, not just redirect
- [ ] "You're in" should be a MOMENT (currently just text)

### Spec (To Design)
```
LANDING
├── Setup: Outsider perspective. Gate visible.
├── Tension: Activity signals. Life inside. You're outside.
├── Peak: CTA moment. "Enter HIVE"
└── Echo: Anticipation of what's inside

THRESHOLD CROSSING
├── Setup: OTP verified. Loading.
├── Tension: Brief pause. World loading.
├── Peak: "You're in." Atmosphere shift. Sound of arrival.
└── Echo: New UI. You're somewhere else now.
```

### Status: `[ ] NOT STARTED`

---

## Slice 2: Onboarding

**Routes:** `/welcome`, `/welcome/identity`, `/welcome/territory`, `/welcome/claimed`

### Current State
- Flow exists and works
- Connected to real APIs (Jan 21, 2026)
- Functional but not dramatic

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| Welcome | Epic Meaning | Ownership | Name recognition |
| Identity | Ownership | Creativity | "This is how you appear" |
| Territory | Scarcity, Social Influence | Ownership | Ghost space discovery |
| Claimed | Accomplishment, Ownership | Epic Meaning | "It's yours." |

### Drama Gaps
- [ ] Welcome hero undersells the moment — should feel like arrival
- [ ] Territory map needs drama — ghost spaces should glow, beckon
- [ ] "Claim" action needs weight — you're taking something
- [ ] Claimed celebration is the BIG moment — needs 10x investment

### Spec (To Design)
```
TERRITORY
├── Setup: Map loads. Your campus visualized.
├── Tension: Ghost spaces visible. "14 students waiting." Unclaimed.
├── Peak: You select one. "Claim this space?"
└── Echo: You're now a founder, not a joiner.

CLAIMED
├── Setup: Processing. Brief uncertainty.
├── Tension: Pause. Weight of what's happening.
├── Peak: "It's yours." Gold. Glow. Expansion.
├── Release: Space materializes. Handle locks in.
└── Echo: "You're building something." Canvas energy.
```

### Status: `[ ] NOT STARTED`

---

## Slice 3: Spaces

**Routes:** `/s/[handle]`, `/spaces`, `/spaces/new/*`, `/spaces/claim`, `/spaces/join/[code]`

### Current State
- Core functionality complete (chat, boards, members)
- APIs connected
- Read receipts working
- Missing: presence, typing, dramatic entry

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| Space Entry | Social Influence, Ownership | Unpredictability | "People are here" |
| First Visit | Unpredictability | Social Influence | Discovery of activity |
| Chat | Social Influence | Accomplishment | Message acknowledged |
| Space Creation | Ownership, Creativity | Epic Meaning | Handle claimed |

### Drama Gaps
- [ ] First entry to a space needs arrival feeling — not just loading content
- [ ] Presence system missing — no "47 online" that matters
- [ ] First message in empty space needs weight — you're starting something
- [ ] Space milestones (10 members, 100 messages) should celebrate

### Spec (To Design)
```
SPACE ENTRY (First Time)
├── Setup: Handle in URL. Loading.
├── Tension: Space materializing. What will you find?
├── Peak: Activity visible. Presence dots. Life.
└── Echo: You're somewhere. Not a page — a place.

FIRST MESSAGE (Empty Space)
├── Setup: Empty chat. Cursor blinking. Canvas.
├── Tension: What will you say? This sets the tone.
├── Peak: Send. Message appears. You broke silence.
└── Echo: "The conversation has started."
```

### Infrastructure Needed
- [ ] Online presence system (Firebase RTDB)
- [ ] Typing indicators (presence-based, not polling)
- [ ] Milestone detection and celebration

### Status: `[ ] NOT STARTED`

---

## Slice 4: Discovery

**Routes:** `/explore`, `/explore?tab=*`

### Current State
- Connected to real APIs (Jan 21, 2026)
- All tabs working
- Functional search
- Ghost spaces visible

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| Explore | Social Influence, Scarcity | Unpredictability | "400+ spaces, yours waiting" |
| Search | Accomplishment | Unpredictability | Finding what you sought |
| Ghost Space | Scarcity, Epic Meaning | Ownership | "14 waiting. Claim it." |

### Drama Gaps
- [ ] Landing state needs scale — "400+ orgs, 2,847 students"
- [ ] Ghost spaces need drama — not just a badge, a beckoning
- [ ] Search results need reveal — not instant dump
- [ ] Joining a space needs confirmation moment

### Spec (To Design)
```
GHOST SPACE DISCOVERY
├── Setup: Browsing. You see unclaimed spaces.
├── Tension: "14 students waiting." They need a leader.
├── Peak: "Claim This Space" — CTA glows.
└── Echo: You could be the one.

JOIN SPACE
├── Setup: You found your org. Join button.
├── Tension: Click. Processing.
├── Peak: "You're in." Member count increments.
└── Echo: Space appears in your nav. Home.
```

### Status: `[ ] NOT STARTED`

---

## Slice 5: Feed

**Routes:** `/feed`, `/feed/settings`

### Current State
- Layout exists
- Basic content
- No real-time, no drama

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| Feed | Unpredictability, Social Influence | Accomplishment | "What's happening now" |
| Return | Unpredictability | Social Influence | "What changed" |

### Drama Gaps
- [ ] Feed should feel ALIVE — not a static list
- [ ] New content should arrive visibly — not refresh to see
- [ ] "Nothing new" should feel peaceful, not empty
- [ ] First feed (new user) needs scaffolding — not empty

### Spec (To Design)
```
FEED (Daily Return)
├── Setup: App opens. Your feed loads.
├── Tension: What's happened? What's new?
├── Peak: New content visible. Activity in your spaces.
└── Echo: Caught up. Your world is current.

FEED (Empty/New User)
├── Setup: Nothing here yet.
├── Tension: What should I see?
├── Peak: Recommendations. "Join these." "Try this."
└── Echo: Feed will fill as you participate.
```

### Infrastructure Needed
- [ ] Real-time feed updates (SSE/WebSocket)
- [ ] Unread state management
- [ ] Recommendation system (basic)

### Status: `[ ] NOT STARTED`

---

## Slice 6: HiveLab

**Routes:** `/hivelab`, `/tools/*`

### Current State
- IDE works
- AI generation works
- 24 elements
- Deployment works
- Missing: drama on creation, real analytics

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| HiveLab Landing | Creativity, Epic Meaning | Accomplishment | "Build what's missing" |
| Creation | Creativity, Accomplishment | Ownership | Tool taking shape |
| Generation | Unpredictability, Creativity | Accomplishment | AI creates your vision |
| Deployment | Ownership, Accomplishment | Social Influence | "Your tool is live" |

### Drama Gaps
- [ ] AI generation should feel like magic — reveal, not loading
- [ ] Tool completion needs milestone — not just "saved"
- [ ] Deployment is THE moment — creation meets world
- [ ] First use notification — someone used your tool

### Spec (To Design)
```
AI GENERATION
├── Setup: You described what you need.
├── Tension: "Creating..." What will it make?
├── Peak: Tool appears piece by piece. Reveal.
└── Echo: "Edit to refine." It's yours to shape.

DEPLOYMENT
├── Setup: Tool is ready. Deploy button.
├── Tension: Click. "Deploying to @space-name..."
├── Peak: "Live." Your tool exists in the world.
└── Echo: "47 members can now use this."
```

### Infrastructure Needed
- [ ] Real analytics (replace mock data)
- [ ] First-use notifications
- [ ] Usage milestones

### Status: `[ ] NOT STARTED`

---

## Slice 7: Profiles

**Routes:** `/profile`, `/profile/[id]`, `/profile/edit`, `/profile/connections`

### Current State
- Functional
- Edit works
- Basic layout

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| Own Profile | Ownership | Creativity | "This is you" |
| Edit | Creativity, Ownership | Accomplishment | Changes reflected |
| Other's Profile | Social Influence | Unpredictability | Mutual connection |

### Drama Gaps
- [ ] Profile should feel like identity, not form
- [ ] Edit saves should feel satisfying
- [ ] Viewing mutual connections needs discovery feeling
- [ ] "X spaces in common" should create recognition

### Status: `[ ] NOT STARTED`

---

## Slice 8: Events

**Routes:** `/events`, `/events/[eventId]`, `/calendar`

### Current State
- Functional
- RSVP works
- Calendar exists

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| Events | Social Influence, Unpredictability | Scarcity | "This is happening" |
| RSVP | Accomplishment, Social Influence | Ownership | "You're going" |
| Calendar | Ownership, Accomplishment | Unpredictability | "Your schedule" |

### Drama Gaps
- [ ] RSVP should feel like commitment — not just a button
- [ ] "X people going" should create pull
- [ ] Live events need urgency — "Happening now"
- [ ] Calendar should feel like YOUR time, mapped

### Status: `[ ] NOT STARTED`

---

## Slice 9: Settings

**Routes:** `/settings`, `/notifications`, `/notifications/settings`

### Current State
- Functional
- Basic controls

### Motivation Target

| Screen | Primary Drive | Secondary | Peak Moment |
|--------|--------------|-----------|-------------|
| Settings | Ownership | Accomplishment | "You control this" |
| Notifications | Ownership, Loss Avoidance | Accomplishment | "Stay connected your way" |

### Drama Gaps
- [ ] Settings should feel like CONTROL — not admin panel
- [ ] Save confirmations should feel satisfying
- [ ] Dangerous actions (delete, leave) need appropriate weight

### Status: `[ ] NOT STARTED`

---

## The Order of Operations

### Phase 1: Foundation (Week 1)
- [ ] Finalize DRAMA.md (this is done)
- [ ] Review with team
- [ ] Establish measurement baseline

### Phase 2: Entry + Onboarding (Week 2)
- [ ] Entry slice audit + design
- [ ] Entry implementation
- [ ] Onboarding slice audit + design
- [ ] Onboarding implementation
- [ ] Validate: First 60 seconds feel right?

### Phase 3: Core Experience (Weeks 3-4)
- [ ] Spaces slice audit + design
- [ ] Presence system infrastructure
- [ ] Spaces implementation
- [ ] Discovery slice audit + design
- [ ] Discovery implementation
- [ ] Validate: Core loop feels alive?

### Phase 4: Daily Engagement (Week 5)
- [ ] Feed slice audit + design
- [ ] Feed implementation
- [ ] HiveLab slice audit + design
- [ ] HiveLab implementation
- [ ] Validate: Reasons to return?

### Phase 5: Polish (Week 6)
- [ ] Profiles slice
- [ ] Events slice
- [ ] Settings slice
- [ ] Cross-slice consistency check

### Phase 6: Launch Prep (Week 7)
- [ ] Full flow testing
- [ ] Drama validation (user testing)
- [ ] Performance check
- [ ] Launch

---

## How We Work Through Each Slice

When we sit down to do a slice:

1. **I read the current implementation** — understand what exists
2. **We audit against the framework** — drives, drama, gaps
3. **We design the arc** — setup, tension, peak, release, echo
4. **We spec the changes** — specific, with primitives and timing
5. **You approve** — does this feel right?
6. **Build** — implement the spec
7. **Validate** — did the drama land?

Each slice is a focused session. We don't move on until it's right.

---

## Success Criteria

### Per Slice
- [ ] Motivation drives clearly firing
- [ ] At least one unforgettable moment
- [ ] No accidental dark patterns
- [ ] Primitives used consistently
- [ ] Timing/rhythm intentional

### Overall
- [ ] First 60 seconds create "I need this"
- [ ] Core loop (spaces) feels alive
- [ ] Creation (HiveLab) feels powerful
- [ ] Users can describe how it felt a week later
- [ ] Would be proud to explain every mechanic

---

## Ready?

Start with Slice 1: Entry.

Tell me when, and we'll audit the current state, map the drives, find the peaks, and spec the changes.

---

*This document is the roadmap. Each slice gets completed before moving on. Drama and motivation guide every decision.*
