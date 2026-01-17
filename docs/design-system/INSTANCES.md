# HIVE INSTANCES

## Level 9: Final Embodiment

> "Every instance is where belief becomes experience."

---

## WHAT THIS DOCUMENT IS

This is the final layer of HIVE's design system. Everything flows here.

**The Complete Hierarchy:**
```
Level 0: WORLDVIEW     ─┐
Level 1: PHILOSOPHY     │  Why we exist, how it feels
Level 2: PRINCIPLES     │  Rules that guide
Level 3: LANGUAGE      ─┤  Visual vocabulary
Level 4: SYSTEMS        │  Composed tokens
Level 5: PRIMITIVES     │  Atomic elements
Level 6: COMPONENTS     │  Composed elements
Level 7: PATTERNS       │  User experiences
Level 8: TEMPLATES     ─┤  Page structures
Level 9: INSTANCES     ─┘  ← YOU ARE HERE
```

**Instances are where theory becomes reality.**

An instance is not a "page." It's the final embodiment of every upstream decision:
- The **worldview** (student autonomy, expand what's possible)
- The **philosophy** (2am campus energy, alive-in-the-dark)
- The **principles** (dark is home, gold is earned)
- The **language** (tokens, spacing, type)
- The **systems** (surfaces, glass, motion)
- The **primitives** (atoms)
- The **components** (molecules)
- The **patterns** (experiences)
- The **templates** (structures)

When a student visits `/spaces/chess-club`, they don't see our design system. They feel it. Every pixel carries the weight of decisions made upstream.

---

## UPSTREAM LINEAGE

Before defining our instance philosophy, we learn from those who ship coherent experiences:

| Product | What They Ship | What We Learn |
|---------|----------------|---------------|
| **Apple** | Unified experience across devices | Instance coherence matters more than individual page perfection |
| **Stripe** | Documentation that feels like product | Instances can teach—every screen educates while serving |
| **Linear** | Every screen feels inevitable | Consistency breeds trust; surprise should be meaningful |
| **Notion** | Blank canvas that invites creation | Instances should feel open, not prescriptive |
| **Discord** | Servers feel like places | Instances have spatial identity, not just URL identity |
| **Superhuman** | Every interaction feels intentional | Instance details compound into experience quality |
| **Arc** | Browser as personal space | Instances can have memory and personality |
| **Figma** | Canvas that gets out of the way | Instances should serve the user's intent, not display features |

**The synthesis for HIVE:**

Instances are **addresses you visit**, not pages you view. They have **atmosphere** (feeling), **gravity** (pull), **memory** (state), and **character** (personality). Students don't "use" HIVE—they **inhabit** it.

---

## INSTANCE PHILOSOPHY

### 1. Instances Are Addresses, Not Pages

**The old model:** URLs are routes to content. `/spaces/123` loads a page about space 123.

**The HIVE model:** URLs are addresses to places. `/spaces/chess-club` is somewhere you **go**.

This distinction matters:
- Pages are **viewed** → Instances are **entered**
- Pages **display** content → Instances **contain** activity
- Pages are **static** → Instances are **alive**
- Pages **load** → Instances **welcome**

**Design implication:** Transitions between instances should feel like movement through space, not navigation between documents.

---

### 2. Instances Breathe

The same instance should feel different based on context:

| Context | How It Feels |
|---------|--------------|
| **Time of day** | Morning (fresh start) vs. 2am (deep work, kinship) |
| **Activity level** | Buzzing (multiple typing, recent posts) vs. Quiet (calm, contemplative) |
| **User state** | First visit (discovery) vs. Returning (familiarity) |
| **Device** | Mobile (quick check-in) vs. Desktop (settling in) |

**The same template, different life.** A space at 2am with 3 people typing feels different than the same space at noon with no activity. The structure is identical; the atmosphere shifts.

**Design implication:** Build breathing room into instances. Activity indicators, presence dots, time-aware greetings, contextual empty states—these aren't features, they're how instances breathe.

---

### 3. Instances Remember

An instance you return to should feel like coming home:

| What Gets Remembered | Why It Matters |
|---------------------|----------------|
| **Scroll position** | "Where I was" is sacred |
| **Draft states** | Unfinished thoughts shouldn't disappear |
| **Panel configurations** | Personal arrangements respected |
| **View preferences** | Grid vs. list, collapsed vs. expanded |
| **Last interaction** | "Welcome back" vs. "First time here" |

**The anti-pattern:** Every visit feels like starting over. The instance has no memory of you.

**The HIVE pattern:** The instance recognizes you. Your sidebar is how you left it. Your draft is still there. The scroll position jumps to "new since you left."

**Design implication:** Instance memory isn't just localStorage. It's a design philosophy: every instance should evolve its relationship with each user.

---

### 4. Instances Have Gravity

Some instances pull you in. Others let you go quickly. **Gravity is intentional, not accidental.**

| Gravity Level | Character | Examples |
|--------------|-----------|----------|
| **High gravity** | You want to stay; time disappears | `/spaces/[id]`, `/feed`, `/tools/create` |
| **Medium gravity** | Browse, compare, choose | `/spaces/browse`, `/tools`, `/schools` |
| **Low gravity** | Check and go; quick tasks | `/settings`, `/profile/edit`, `/notifications` |
| **Escape velocity** | Launch you elsewhere | `/` (landing), `/auth/login` |

**High gravity instances** should have:
- Infinite scroll or deep content
- Activity that rewards attention
- Composer/creation affordances
- "One more thing" moments

**Low gravity instances** should have:
- Clear completion states
- Obvious exit paths
- No infinite scroll traps
- "Done" feedback

**Design implication:** Match instance gravity to user intent. A settings page with high gravity is frustrating. A space page with low gravity feels empty.

---

## INSTANCE CATEGORIES

Every instance in HIVE fits one of five categories. Each category has its own character, gravity, and design considerations.

### 1. Portal Instances (Entry Points)

**What they are:** The doors to HIVE. Instances that transform—you enter as one thing and emerge as another.

```
/                    → The door to HIVE
/auth/login          → The verification gate
/auth/verify         → The threshold
/onboarding/*        → The unwrapping
```

**Atmosphere:** Landing (spacious, atmospheric, ambient)

**Gravity:** Escape velocity—portals don't hold you, they launch you

**Character:**
- Anticipation, welcome, becoming
- Activity is visible but protected (no names for outsiders)
- Clear singular path forward
- Transformation happens here

**Template composition:**
- Focus (Portal) for login/landing
- Focus (Reveal) for onboarding stages

**Instance memory:** None for outsiders (fresh every visit). For returning users: quick path to re-entry.

**Transitions:**
- Landing → Login: **Enter** (portal effect, stepping through)
- Login → Verify: **Suspend** (waiting state, anticipation)
- Verify → Onboarding: **Emerge** (space opens up)
- Onboarding → First Space: **Arrive** (full shell appears, you're home)

---

### 2. Home Instances (Where You Live)

**What they are:** The places you inhabit. Where you spend time, not just pass through.

```
/spaces/[id]         → Your community home
/feed                → Your activity stream
/notifications       → Your inbox
```

**Atmosphere:** Comfortable (standard density, familiar)

**Gravity:** High—you want to stay, time disappears here

**Character:**
- Belonging, conversation, presence
- Activity is central, not peripheral
- You can speak (composer) or listen (scroll)
- Depth is available (threads, details, history)

**Template composition:**
- Shell (Living Sidebar) → Stream (Conversational) for spaces
- Shell (Minimal Rail) → Stream (Sectioned) for feed
- Shell (Minimal Rail) → Stream (Conversational) for notifications

**Instance memory:**
- Scroll position preserved
- Draft messages restored
- Thread states remembered
- Panel configurations saved
- Read markers tracked

**Transitions:**
- Browse → Space: **Focus** (grid collapses, space expands)
- Space → Thread: **Deepen** (drawer slides, context preserved)
- Space → Tool: **Shift** (stream exits, workspace enters)
- Space → Settings: **Aside** (modal/overlay, space behind)

---

### 3. Discovery Instances (Where You Explore)

**What they are:** The browsing grounds. Instances designed for exploration and choice.

```
/spaces/browse       → Territory exploration
/tools               → Marketplace browsing
/schools             → Campus discovery
/spaces/search       → Finding specific things
```

**Atmosphere:** Comfortable with moments of Landing (hero sections, featured content)

**Gravity:** Medium—browse, compare, decide, move on

**Character:**
- Curiosity, abundance, choice
- Invitation without pressure
- Variety on display
- Clear paths to commitment (join, use, enter)

**Template composition:**
- Shell (Minimal Rail) → Grid (Territorial) for browse
- Shell (Minimal Rail) → Grid (Netflix) for tools
- Focus (Portal) → Grid (Uniform) for schools

**Instance memory:**
- Filter states preserved
- Scroll position within category
- Recently viewed items
- Search history

**Transitions:**
- Home → Browse: **Expand** (shell compresses, grid takes over)
- Browse → Space preview: **Peek** (modal/drawer preview)
- Browse → Space enter: **Focus** (card expands to full instance)
- Tool card → Tool detail: **Lift** (card zooms up into detail view)

---

### 4. Creation Instances (Where You Build)

**What they are:** The workshops. Instances optimized for making things.

```
/tools/create        → Tool builder (blank canvas)
/tools/[id]/edit     → Tool editor (existing work)
/spaces/create       → Space wizard
/profile/edit        → Self-definition
```

**Atmosphere:** Workshop (compact, utilitarian, focused)

**Gravity:** Variable—flow state (hours vanish) vs. quick task (minutes)

**Character:**
- Focus, power, possibility
- Tools available but not overwhelming
- AI assistance ready but not intrusive
- Progress visible and saveable

**Template composition:**
- Workspace (Magic Mode) for AI-first creation
- Workspace (Build Mode) for direct manipulation
- Focus (Reveal) for wizard flows

**Instance memory:**
- WIP auto-saved continuously
- Canvas state preserved (zoom, pan, selection)
- Mode preference remembered
- AI conversation history maintained
- Undo stack persisted

**Transitions:**
- Tools grid → Create: **Open** (canvas zooms from card origin)
- Create → Preview: **Split** (canvas shrinks, preview appears)
- Create → Deploy: **Wizard** (overlay flow, canvas behind)
- Edit → Space: **Return** (workspace compresses, space expands)

---

### 5. Identity Instances (Where You Reflect)

**What they are:** The mirrors. Instances about the user themselves.

```
/profile/[id]        → Public presence (your identity to others)
/profile/me          → Your own view
/settings            → Preferences and control
/settings/privacy    → Visibility control
```

**Atmosphere:** Comfortable to Landing (profile view has hero energy)

**Gravity:** Low—check and go, unless viewing someone else's profile

**Character:**
- Expression, control, privacy
- Personal space, not public stage
- Honest representation
- Quick access to important settings

**Template composition:**
- Shell (Minimal Rail) → Grid (Bento) for profile view
- Shell (Minimal Rail) → Focus (Form) for profile edit
- Shell (Minimal Rail) → Focus (Form) for settings

**Instance memory:**
- Section expansions remembered
- Privacy preferences cached
- Edit draft states saved
- Return path preserved

**Transitions:**
- Anywhere → Own profile: **Glance** (quick slide-in)
- Anywhere → Other profile: **Visit** (full navigation)
- Profile → Edit: **Modify** (fields become editable in place)
- Settings → Anywhere: **Dismiss** (quick exit, settings collapse)

---

## CANONICAL INSTANCES

Three fully specified instances showing how philosophy becomes reality.

---

### Instance: `/spaces/[id]` — The Space Home

**Category:** Home
**Template:** Shell (Living Sidebar) → Stream (Conversational)
**Atmosphere:** Comfortable
**Gravity:** High

#### The Experience

Entering a space should feel like walking into a room where your friends are already talking. You see who's there (presence), what's happening (activity), and where you can contribute (composer).

#### Composition Breakdown

```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  [Search]  [⚡ Create]  [🔔]  [Avatar▾]         │  ← Global header
├────────────┬────────────────────────────────────────────┤
│            │  [Breadcrumb: Spaces > Chess Club]         │
│   Rail     │  ┌─────────────────────────────────────┐   │
│  [Home]    │  │                                     │   │
│  [Feed]    │  │         Message Stream              │   │
│  [...]     │  │                                     │   │
│            │  │  [Thread indicators] [Reactions]    │   │
│  ─────     │  │                                     │   │
│  Spaces    │  │                                     │   │
│  [Chess]●  │  │                                     │   │
│  [Photo]   │  └─────────────────────────────────────┘   │
│  [Code]    │  ┌─────────────────────────────────────┐   │
│            │  │  [Composer with slash commands]     │   │
│            │  └─────────────────────────────────────┘   │
├────────────┴────────────────────────────────────────────┤
│              [Typing: Alex, Jordan...]                  │  ← Presence bar
└─────────────────────────────────────────────────────────┘
```

#### Character Details

| Element | Specification |
|---------|--------------|
| **Presence** | Active members shown in rail (dot indicators), typing bar shows who's composing |
| **Activity** | Unread marker ("New since you left"), message grouping by time |
| **Depth** | Thread drawer slides from right, preserves stream scroll |
| **Tools** | Sidebar shows deployed tools with quick-launch |
| **Composer** | Anchored bottom, slash commands, attachment options |

#### Instance Memory

| State | Preserved? | How |
|-------|-----------|-----|
| Scroll position | Yes | localStorage keyed to space+user |
| Draft message | Yes | Auto-save every 3 seconds |
| Thread drawer state | Yes | Remember open/closed + position |
| Sidebar collapsed | Yes | User preference |

#### Instance Breathing

| Context | Adaptation |
|---------|------------|
| Multiple typing | Composer bar expands, energy increases |
| No recent activity | "Be the first to say hi" subtle prompt |
| Late night (11pm-3am) | Slightly warmer tones, "night owl" micro-acknowledgment |
| First visit | Welcome banner with space description |
| Returning | "12 new messages since yesterday" |

#### Transitions

| From → To | Transition Effect |
|-----------|------------------|
| Browse → This space | Grid card expands, shell assembles around it |
| This space → Thread | Stream compresses left, drawer slides from right |
| This space → Tool | Stream crossfades to workspace canvas |
| This space → Settings | Overlay rises, space visible behind at 50% opacity |

---

### Instance: `/tools/create` — The Creation Studio

**Category:** Creation
**Template:** Shell (Hidden) → Workspace (Magic Mode → Build Mode)
**Atmosphere:** Workshop
**Gravity:** High (flow state)

#### The Experience

Creating a tool should feel like opening a fresh notebook with AI ready to help. The canvas is infinite possibility. You can talk to AI (Magic Mode) or build directly (Build Mode). The result is the same: something you made.

#### Composition Breakdown

```
┌─────────────────────────────────────────────────────────┐
│ [← Back]  Tool Studio  [Preview] [Save▾] [Deploy]       │  ← Minimal header
├────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │                                                 │   │
│   │              INFINITE CANVAS                    │   │
│   │                                                 │   │
│   │   [Placed elements render here]                 │   │
│   │                                                 │   │
│   │                                                 │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌────────────────────────────────────────────────┐    │
│   │  [AI Input: "Create a poll for meeting times"] │    │  ← Magic Mode
│   │  [Element belt: □ ○ ◇ ▣ ⚡ below]               │    │     composer
│   └────────────────────────────────────────────────┘    │
│                                                         │
│        [Magic ◆]  [Build ▤]  ← Mode toggle              │
└─────────────────────────────────────────────────────────┘
```

**Build Mode alternative:**
```
┌────────────────────────────────────────┬───────────────┐
│                                        │  Properties   │
│          CANVAS                        │  ───────────  │
│                                        │  [Inspector]  │
│                                        │               │
├────────────────────────────────────────┴───────────────┤
│  [Element palette: Components | Templates | Saved]     │
└────────────────────────────────────────────────────────┘
```

#### Character Details

| Element | Specification |
|---------|--------------|
| **Canvas** | Infinite, pannable, zoomable, grid-snapped |
| **AI input** | Natural language, suggests elements, generates layouts |
| **Element belt** | Quick access to most-used elements |
| **Properties panel** | Shows selected element options (Build Mode) |
| **Preview** | Live preview in modal or split view |

#### Instance Memory

| State | Preserved? | How |
|-------|-----------|-----|
| Canvas position | Yes | Pan/zoom state persisted |
| WIP elements | Yes | Auto-save every 5 seconds |
| Mode preference | Yes | Last used mode remembered |
| AI conversation | Yes | Full history maintained |
| Undo stack | Yes | 50 steps of undo available |

#### Instance Breathing

| Context | Adaptation |
|---------|------------|
| Blank canvas | Gentle suggestions: "Start with a template or ask AI" |
| AI generating | Canvas shows "Creating..." with subtle animation |
| Complex tool | Auto-zoom to fit, mini-map appears |
| First tool | Onboarding overlay with quick tips |
| Returning to WIP | "Continue where you left off" toast |

#### Transitions

| From → To | Transition Effect |
|-----------|------------------|
| Tools grid → Create | Card zooms out, canvas fades in from center |
| Create → Preview | Canvas shrinks left, preview appears right (split) |
| Create → Deploy | Wizard overlay slides up, canvas dims behind |
| Create → Back to tools | Canvas collapses to card, returns to grid position |

---

### Instance: `/` — The Landing Portal

**Category:** Portal
**Template:** Focus (Portal)
**Atmosphere:** Landing
**Gravity:** Escape velocity

#### The Experience

The landing page should feel like arriving at campus at 2am—the energy is palpable even from outside. You see the activity, sense the community, but can't fully enter until you're verified. The door is clear. The invitation is warm. The transformation awaits.

#### Composition Breakdown

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [HIVE Logo]                          │
│                                                         │
│              "Where UB actually happens"                │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │        [Live activity ticker]                   │   │
│   │   "Someone joined Photography Club • 2 people   │   │
│   │    chatting in Code Club • New tool created"    │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│          ┌─────────────────────────────┐                │
│          │     [Enter HIVE →]          │  ← Gold CTA   │
│          └─────────────────────────────┘                │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │ 400+     │  │ 847      │  │ 27       │             │
│   │ Spaces   │  │ Students │  │ Elements │             │
│   └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│      [Scroll indicator]                                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   [Section 2: What HIVE offers]                         │
│   [Section 3: HiveLab preview]                          │
│   [Section 4: Spaces grid]                              │
│   [Footer: Links, waitlist]                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Character Details

| Element | Specification |
|---------|--------------|
| **Hero** | Full viewport, atmospheric, activity is ambient |
| **Activity ticker** | Real activity, names anonymized for outsiders |
| **CTA** | Single, gold, unmissable |
| **Social proof** | Numbers that impress without overwhelming |
| **Scroll sections** | Progressive revelation of platform value |

#### Instance Memory

None for outsiders (privacy by design). For authenticated users who land here: immediate redirect to `/feed` or last visited space.

#### Instance Breathing

| Context | Adaptation |
|---------|------------|
| High platform activity | Ticker moves faster, numbers update live |
| Late night | "Join the night owls" micro-copy |
| First visit | Full experience |
| Return visit (no auth) | "Welcome back" + quick login path |
| Return visit (auth) | Redirect to home instance |

#### Transitions

| From → To | Transition Effect |
|-----------|------------------|
| Landing → Login | **Portal**: Content slides aside, login form enters as "stepping through" |
| Landing → Browse (if public) | **Reveal**: Shell assembles, grid fades in |
| External link → Landing | **Arrive**: Smooth load, no jarring transition |

---

## INSTANCE TRANSITIONS

Transitions between instances should feel like **movement through space**, not navigation between documents.

### Transition Vocabulary

| Transition | Feeling | When to Use |
|------------|---------|-------------|
| **Enter** | Stepping through a doorway | Portal → authenticated space |
| **Expand** | Something small becomes your world | Card → full instance |
| **Focus** | Attention narrows | Grid → single item |
| **Shift** | Context changes but location doesn't | Stream → Workspace (same space) |
| **Aside** | Temporary attention diversion | Anywhere → settings/modal |
| **Deepen** | Going into detail | Message → thread drawer |
| **Return** | Coming back with memory | Tool → space that deployed it |
| **Dismiss** | Quick exit without ceremony | Settings → previous location |

### Transition Matrix

| From \ To | Portal | Home | Discovery | Creation | Identity |
|-----------|--------|------|-----------|----------|----------|
| **Portal** | — | Enter, Arrive | Expand | — | — |
| **Home** | — | Shift | Expand | Shift | Glance |
| **Discovery** | — | Focus | — | Open | Visit |
| **Creation** | — | Return | — | — | — |
| **Identity** | — | Dismiss | — | — | Modify |

### Motion Specifications

| Transition Type | Duration | Easing | Character |
|----------------|----------|--------|-----------|
| **Enter/Arrive** | 500ms | ease-out | Welcoming, settling |
| **Expand/Focus** | 300ms | ease-in-out | Swift, purposeful |
| **Shift** | 200ms | ease-in-out | Seamless, same-space |
| **Aside** | 250ms | ease-out | Quick, temporary |
| **Deepen** | 200ms | ease-out | Drawer-like |
| **Return** | 300ms | ease-in-out | Memory of origin |
| **Dismiss** | 150ms | ease-in | Swift, decisive |

---

## INSTANCE STATES

Every instance has states beyond "loaded." Each state has character.

### Universal States

| State | Character | Visual Treatment |
|-------|-----------|------------------|
| **Loading** | Anticipation | Skeleton with activity hints, not spinning |
| **Empty** | Invitation, possibility | Clear action path, not sad face |
| **Active** | Life, presence | Indicators moving, content fresh |
| **Quiet** | Calm, patience | Restful, not abandoned |
| **Error** | Honesty, recovery | Clear explanation, retry path |
| **Offline** | Independence, cached | Cached content works, sync indicator |

### State × Category Specifics

| Category | Empty State | Active State |
|----------|-------------|--------------|
| **Portal** | Never empty (always has CTA) | Activity ticker, live numbers |
| **Home** | "Start the conversation" | Typing indicators, unread counts |
| **Discovery** | "Nothing matches—try broader filters" | Fresh content, new badges |
| **Creation** | "Blank canvas—what will you build?" | Auto-save indicator, AI thinking |
| **Identity** | "Complete your profile" | Completion progress, activity feed |

### Error State Philosophy

Errors should be **honest but not alarming**:

```
✗ "Something went wrong"              → Generic, unhelpful
✓ "Couldn't load messages. Retry?"    → Specific, actionable

✗ "Error 500"                         → Technical, scary
✓ "HIVE's taking a quick break. Back soon." → Human, calm

✗ [Blank screen]                      → Broken, confusing
✓ [Cached content] + "You're offline" → Functional, clear
```

---

## INSTANCE × TEMPLATE MATRIX

How instances compose templates:

| Instance | Primary Template | Secondary | Atmosphere | Gravity |
|----------|-----------------|-----------|------------|---------|
| `/` | Focus (Portal) | — | Landing | Escape |
| `/auth/login` | Focus (Portal) | — | Landing | Escape |
| `/onboarding/*` | Focus (Reveal) | — | Landing → Comfortable | Escape |
| `/spaces/[id]` | Shell (Living) | Stream (Chat) | Comfortable | High |
| `/spaces/[id]/calendar` | Shell (Living) | Grid (Calendar) | Comfortable | Medium |
| `/spaces/browse` | Shell (Rail) | Grid (Territorial) | Comfortable | Medium |
| `/feed` | Shell (Rail) | Stream (Sectioned) | Comfortable | High |
| `/notifications` | Shell (Rail) | Stream (Chat) | Comfortable | Low |
| `/tools` | Shell (Rail) | Grid (Netflix) | Comfortable | Medium |
| `/tools/create` | Workspace (Magic) | — | Workshop | High |
| `/tools/[id]/edit` | Workspace (Build) | — | Workshop | High |
| `/profile/[id]` | Shell (Rail) | Grid (Bento) | Comfortable/Landing | Low-Medium |
| `/profile/edit` | Shell (Rail) | Focus (Form) | Comfortable | Low |
| `/settings` | Shell (Rail) | Focus (Form) | Comfortable | Low |
| `/schools` | Focus (Portal) | Grid (Uniform) | Landing | Medium |

---

## THE COMPLETE HIERARCHY

With INSTANCES complete, the full design system:

```
┌─────────────────────────────────────────────────────────┐
│  Level 0: WORLDVIEW                                     │
│  "Student autonomy infrastructure"                      │
│  Why HIVE exists. What we believe.                      │
├─────────────────────────────────────────────────────────┤
│  Level 1: PHILOSOPHY                                    │
│  "2am campus energy"                                    │
│  How HIVE should feel. The soul.                        │
├─────────────────────────────────────────────────────────┤
│  Level 2: PRINCIPLES                                    │
│  "Dark is home, gold is earned"                         │
│  Rules that guide every decision.                       │
├─────────────────────────────────────────────────────────┤
│  Level 3: LANGUAGE                                      │
│  Tokens: color, type, space, motion                     │
│  The visual vocabulary.                                 │
├─────────────────────────────────────────────────────────┤
│  Level 4: SYSTEMS                                       │
│  Surface, Glass, Motion systems                         │
│  Tokens composed into patterns.                         │
├─────────────────────────────────────────────────────────┤
│  Level 5: PRIMITIVES                                    │
│  Button, Card, Avatar, Input...                         │
│  The atomic elements.                                   │
├─────────────────────────────────────────────────────────┤
│  Level 6: COMPONENTS                                    │
│  SpaceCard, ChatMessage, ToolPreview...                 │
│  Atoms composed into molecules.                         │
├─────────────────────────────────────────────────────────┤
│  Level 7: PATTERNS                                      │
│  Space Participation, Tool Building, Discovery...       │
│  User experiences defined.                              │
├─────────────────────────────────────────────────────────┤
│  Level 8: TEMPLATES                                     │
│  Focus, Shell, Stream, Grid, Workspace                  │
│  Page structures that hold patterns.                    │
├─────────────────────────────────────────────────────────┤
│  Level 9: INSTANCES                                     │
│  /spaces/[id], /tools/create, /, ...                    │
│  The final embodiment. Theory → Reality.                │
└─────────────────────────────────────────────────────────┘
```

---

## SUMMARY

### What We Established

1. **Instances are addresses, not pages.** Students visit places, not routes.

2. **Instances breathe.** Same structure, different life based on context.

3. **Instances remember.** Return visits feel like coming home.

4. **Instances have gravity.** Some pull you in, some let you go.

### The Five Categories

| Category | Character | Examples |
|----------|-----------|----------|
| **Portal** | Transformation, threshold | `/`, `/auth/*`, `/onboarding/*` |
| **Home** | Belonging, presence | `/spaces/[id]`, `/feed` |
| **Discovery** | Curiosity, choice | `/spaces/browse`, `/tools` |
| **Creation** | Focus, possibility | `/tools/create`, `/spaces/create` |
| **Identity** | Expression, control | `/profile/*`, `/settings` |

### Ready for Rebuild

This design system—from WORLDVIEW to INSTANCES—is now complete. Every layer has been defined. Every decision has been made. The foundation is set.

**What comes next:** Implementation. Rebuilding every UI and UX component to embody this system. Not adding features—expressing philosophy through pixels.

The hierarchy exists. Now we build what it describes.

---

## NEXT LEVEL

There is no next level. Instances are where design becomes experience.

****See also:****
- `docs/TEMPLATES.md` — Page structures (upstream)
- `docs/PATTERNS.md` — User experiences (upstream)
- Implementation begins in `packages/ui/` and `apps/web/`

---

*Level 9 of 9. The design system is complete.*
