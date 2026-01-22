# HIVE Strategic Sprints

> **Purpose:** Deep strategic work before execution. Each sprint goes deep on one layer, building toward a coherent product vision.
> **Created:** January 2026
> **Status:** Planning

---

## Why This Exists

We were sprinting on tactics without grounding in fundamentals. Work orders, polish tasks, UI fixes — execution of *what*?

This document structures the strategic work that must happen before (or alongside) GTM execution. Each sprint produces a locked artifact that informs everything downstream.

---

## The Dependency Chain

```
LAYER 1: Macro Bet
    ↓
LAYER 2: Users
    ↓
LAYER 3: Business Architecture
    ↓
LAYER 4: Product Architecture
    ↓
VERTICAL SLICES: Spaces → Events → HiveLab → Feed → Rituals
    ↓
INFORMATION ARCHITECTURE
    ↓
UI/UX EXPRESSION
    ↓
IMPLEMENTATION
```

Each layer informs the next. Can't do UI/UX without IA. Can't do IA without product architecture. Can't do product without understanding business. Can't do business without understanding users. Can't do any of it without the macro bet.

---

## Sprint Overview

| Sprint | Layer | Focus | Output |
|--------|-------|-------|--------|
| 1 | Macro Bet | Why HIVE exists, the window, the thesis | `LAYER1_MACRO_BET.md` |
| 2 | Users | Leader + member psychology, real mental models | `LAYER2_USERS.md` |
| 3 | Business | Flywheels, moat, revenue, unit economics | `LAYER3_BUSINESS.md` |
| 4 | Product | Objects, relationships, state machines | `LAYER4_PRODUCT_ARCHITECTURE.md` |
| 5 | Spaces | The container where community lives | `SLICE_SPACES.md` |
| 6 | Events | The atomic unit of engagement | `SLICE_EVENTS.md` |
| 7 | HiveLab | The utility layer, tools as wedge | `SLICE_HIVELAB.md` |
| 8 | Feed | The aggregation layer | `SLICE_FEED.md` |
| 9 | Rituals | Engagement and gamification | `SLICE_RITUALS.md` |
| 10 | IA | Navigation, hierarchy, journeys | `INFORMATION_ARCHITECTURE.md` |
| 11 | UI/UX | Emotional arc, visual hierarchy, feel | `UI_UX_EXPRESSION.md` |

---

## Sprint 1: Macro Bet

### Goal
Lock the fundamental thesis. Why HIVE exists, why now, what we're betting on.

### Key Questions
- What's the window? Why 2025-2026?
- What's the thesis in one sentence?
- What's the wedge? (HiveLab as utility layer)
- How do HiveLab, Spaces, Events, Feed, Rituals fit together?
- What are the failure modes and how do we address them?
- What does winning look like?

### Current State
- Draft exists from strategic conversation
- HiveLab as utility layer (Option C) identified as strong direction
- Events identified as core value driver
- Spaces-focused HiveLab (tools enhance spaces, not floating)
- Need final synthesis

### Output
`docs/layers/LAYER1_MACRO_BET.md`

### Acceptance Criteria
- [ ] The window is articulated clearly
- [ ] The thesis is one sentence, memorable
- [ ] The wedge strategy is defined
- [ ] The system (HiveLab + Spaces + Events + Feed + Rituals) is coherent
- [ ] Failure modes are named with mitigations
- [ ] Win condition is specific and measurable

---

## Sprint 2: Users

### Goal
Deep understanding of who we're building for. Not personas — mental models.

### Key Questions
- Who are the leaders, really? What do they feel?
- Who are the members? The passive majority?
- What are the user archetypes? (Anxious achiever, builder, explorer, lost freshman, connector)
- What does each archetype want in the first 3 seconds?
- What's the "holy shit" moment for each?
- What are the barriers to adoption for each?

### Current State
- STRATEGY.md has leader/member psychology
- VISION.md has archetype sketches
- Need to go deeper, pressure-test against real conversations

### Output
`docs/layers/LAYER2_USERS.md`

### Acceptance Criteria
- [ ] Each archetype has a mental model (not just demographics)
- [ ] Emotional reality is articulated for each
- [ ] First-touch expectations are clear
- [ ] "Holy shit" moments are defined
- [ ] Barriers and objections are named
- [ ] Real quotes or observed behaviors support each claim

---

## Sprint 3: Business Architecture

### Goal
Understand how the business works. Not revenue projections — the logic.

### Key Questions
- What are the flywheels? How does value compound?
- What's the moat? What's actually defensible?
- What's the revenue model? (When, how, from whom)
- What are the unit economics intuitions?
- What's the cost structure?
- What breaks if we scale?

### Current State
- VISION.md has flywheel sketches
- STRATEGY.md has moat discussion
- Revenue model is vague ("premium features," "university contracts")
- Need specificity

### Output
`docs/layers/LAYER3_BUSINESS.md`

### Acceptance Criteria
- [ ] Flywheels are diagrammed with mechanics explained
- [ ] Moat is specific (not just "network effects")
- [ ] Revenue model has timing and targets
- [ ] Unit economics have directional logic
- [ ] Cost drivers are identified
- [ ] Scale risks are named

---

## Sprint 4: Product Architecture

### Goal
Map the product as a system. Objects, relationships, state machines.

### Key Questions
- What are the core objects? (Space, Event, Tool, Profile, Post, etc.)
- How do they relate to each other?
- What's the state machine for a user's lifecycle?
- What's the state machine for a space's lifecycle?
- What's the state machine for an event's lifecycle?
- Where does data flow? Where are the feedback loops?

### Current State
- DATABASE_SCHEMA.md exists
- Domain logic exists in packages/core
- Need to synthesize into a coherent system view

### Output
`docs/layers/LAYER4_PRODUCT_ARCHITECTURE.md`

### Acceptance Criteria
- [ ] Core objects are defined with properties
- [ ] Relationships are mapped (ERD or equivalent)
- [ ] User lifecycle state machine is clear
- [ ] Space lifecycle state machine is clear
- [ ] Event lifecycle state machine is clear
- [ ] Data flow is diagrammed

---

## Sprint 5: Vertical Slice — Spaces

### Goal
Define what a Space is and how it works. The container where community lives.

### Key Questions
- What's the ONE job of a space?
- How does leader experience differ from member experience?
- What are the components? (Chat, boards, tools, events, members)
- What's the 60/40 layout serving?
- What are all the states? (Empty, nascent, active, thriving, dying)
- How do spaces get discovered?
- How do spaces die?

### Current State
- Spaces are 96% built
- SPACES_ARCHITECTURE.md exists
- UI exists but may not match strategic intent

### Output
`docs/slices/SLICE_SPACES.md`

### Acceptance Criteria
- [ ] Purpose is one sentence
- [ ] Leader vs member journeys are mapped
- [ ] All components are defined with purpose
- [ ] All states are defined with transitions
- [ ] Discovery mechanics are clear
- [ ] Death/dormancy mechanics are clear

---

## Sprint 6: Vertical Slice — Events

### Goal
Define Events as the atomic unit of engagement.

### Key Questions
- How do events drive the core loop?
- What's the creation flow for leaders?
- What's the discovery flow for members?
- How do events surface across spaces? (Feed, calendar, recommendations)
- What makes an event successful?
- What happens after an event? (Photos, connections, follow-up)

### Current State
- Events exist in spaces
- Calendar exists
- RSVP works
- Cross-space event discovery is unclear

### Output
`docs/slices/SLICE_EVENTS.md`

### Acceptance Criteria
- [ ] Events role in core loop is articulated
- [ ] Creation flow is mapped
- [ ] Discovery flow is mapped
- [ ] Cross-space visibility is defined
- [ ] Success metrics are defined
- [ ] Post-event flow is defined

---

## Sprint 7: Vertical Slice — HiveLab

### Goal
Define HiveLab as the utility layer. Tools as wedge.

### Key Questions
- How does HiveLab serve as entry point for members? (Option C)
- How does HiveLab enhance spaces for leaders?
- What's the tool creation flow? (Templates, AI generation, manual build)
- How are tools discovered? (Within space, across campus)
- How do tools connect users to communities?
- What's the tool lifecycle? (Created, deployed, used, retired)

### Current State
- HiveLab is 100% built
- 27 elements, 35 templates
- AI generation works (Goose system)
- Currently spaces-focused
- Ambient utility layer is strategic direction, not yet implemented

### Output
`docs/slices/SLICE_HIVELAB.md`

### Acceptance Criteria
- [ ] Dual role is articulated (member wedge + leader power)
- [ ] Creation flows are mapped (template, AI, manual)
- [ ] Discovery mechanics are defined
- [ ] Tool → community connection is designed
- [ ] Tool lifecycle is mapped
- [ ] Metrics are defined

---

## Sprint 8: Vertical Slice — Feed

### Goal
Define the Feed as the aggregation layer.

### Key Questions
- What appears in the feed? (Events, posts, tool activity, space activity)
- Who sees what? (Personalized, campus-wide, space-specific)
- How does feed drive engagement without being addictive?
- What's the relationship between feed and spaces?
- What's the ranking/surfacing logic?
- When does feed become valuable? (Cold start)

### Current State
- Feed exists with real data
- Currently shows posts
- Event aggregation is unclear
- Personalization is minimal

### Output
`docs/slices/SLICE_FEED.md`

### Acceptance Criteria
- [ ] Content types are defined with priority
- [ ] Visibility rules are clear
- [ ] Non-addictive engagement is designed
- [ ] Feed ↔ Space relationship is mapped
- [ ] Ranking logic is directional
- [ ] Cold start strategy is defined

---

## Sprint 9: Vertical Slice — Rituals

### Goal
Define Rituals as the engagement/gamification layer.

### Key Questions
- What behaviors do we want to reward?
- What's the status system? (For leaders, for members)
- What are the ritual mechanics? (Streaks, achievements, levels)
- How do rituals drive the core loops without being manipulative?
- When do rituals unlock? (Not at launch — when?)
- What's the long-term vision for rituals?

### Current State
- Rituals are 75% built
- Feature-gated
- Participation scoring incomplete

### Output
`docs/slices/SLICE_RITUALS.md`

### Acceptance Criteria
- [ ] Rewarded behaviors are defined
- [ ] Status system is designed
- [ ] Mechanics are specified
- [ ] Non-manipulative design is articulated
- [ ] Unlock timing is decided
- [ ] Long-term vision is sketched

---

## Sprint 10: Information Architecture

### Goal
Given all the above, how is the product organized?

### Key Questions
- What's the navigation model?
- What's the page hierarchy?
- How do user journeys map to structure?
- What's the entry point? (Landing, HiveLab tool, invite link, etc.)
- What's the home state for each user type?
- Where are the dead ends? How do we prevent them?

### Current State
- Navigation exists (MinimalSidebar)
- Pages exist but may not serve journeys
- Multiple entry points exist

### Output
`docs/INFORMATION_ARCHITECTURE.md`

### Acceptance Criteria
- [ ] Navigation model is diagrammed
- [ ] Page hierarchy is mapped
- [ ] User journeys are overlaid on structure
- [ ] Entry points are defined with flows
- [ ] Home states are defined per user type
- [ ] Dead ends are identified and addressed

---

## Sprint 11: UI/UX Expression

### Goal
Given all the above, how does it feel?

### Key Questions
- What's the emotional arc per journey?
- What's the visual hierarchy per page?
- Where does the design system serve this? Where does it fight it?
- What are the "wow" moments?
- What's the motion strategy?
- What's the sound/haptic strategy (if any)?

### Current State
- DESIGN_PRINCIPLES.md is locked
- Design system exists (93 primitives, 138 components)
- Implementation varies in quality

### Output
`docs/UI_UX_EXPRESSION.md`

### Acceptance Criteria
- [ ] Emotional arcs are mapped per journey
- [ ] Visual hierarchy is defined per key page
- [ ] Design system gaps are identified
- [ ] "Wow" moments are designed
- [ ] Motion is specified per interaction type
- [ ] Implementation priorities are clear

---

## Working Process

For each sprint:

```
1. GATHER
   - Pull existing docs
   - Identify gaps
   - List open questions

2. THINK
   - Strategic conversation
   - Pressure-test assumptions
   - Explore alternatives

3. SYNTHESIZE
   - Draft the output doc
   - Review for coherence
   - Connect to previous layers

4. LOCK
   - Final review
   - Mark as complete
   - Update dependencies
```

---

## Progress Tracker

| Sprint | Status | Started | Completed | Output |
|--------|--------|---------|-----------|--------|
| 1. Macro Bet | **LOCKED** | Jan 2026 | Jan 2026 | `docs/layers/LAYER1_MACRO_BET.md` |
| 2. Users | **LOCKED** | Jan 2026 | Jan 2026 | `docs/layers/LAYER2_USERS.md` |
| 3. Business | **LOCKED** | Jan 2026 | Jan 2026 | `docs/layers/LAYER3_BUSINESS.md` |
| 4. Product | **LOCKED** | Jan 2026 | Jan 2026 | `docs/layers/LAYER4_PRODUCT_ARCHITECTURE.md` |
| 5. Spaces | **LOCKED** | Jan 2026 | Jan 2026 | `docs/slices/SLICE_SPACES.md` |
| 6. Events | **LOCKED** | Jan 2026 | Jan 2026 | `docs/slices/SLICE_EVENTS.md` |
| 7. HiveLab | **LOCKED** | Jan 2026 | Jan 2026 | `docs/slices/SLICE_HIVELAB.md` |
| 8. Feed | **LOCKED** | Jan 2026 | Jan 2026 | `docs/slices/SLICE_FEED.md` |
| 9. Rituals | **LOCKED** | Jan 2026 | Jan 2026 | `docs/slices/SLICE_RITUALS.md` |
| 10. IA | **LOCKED** | Jan 2026 | Jan 2026 | `docs/INFORMATION_ARCHITECTURE.md` |
| 11. UI/UX | **LOCKED** | Jan 2026 | Jan 2026 | `docs/UI_UX_EXPRESSION.md` |

---

## Notes

- Sprints can run in parallel where dependencies allow
- Some sprints may need revisiting as later sprints reveal gaps
- The goal is locked artifacts, not perfect artifacts
- Speed matters, but depth matters more here — this is foundation work

---

*This document is the roadmap. Update it as sprints complete.*
