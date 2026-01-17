# HIVE Design System

## The Complete Philosophy-to-Pixel Framework

*Last updated: January 2026*

---

## TL;DR — Use the Primitives

```typescript
import { Button, Card, Input, Avatar, Badge, Text } from '@hive/ui/design-system/primitives';
```

**Don't write custom CSS. The primitives implement all design decisions.** This documentation explains WHY. The primitives handle HOW.

---

## What This Is

This is HIVE's design system — a 10-level hierarchy from beliefs to pixels. Every document flows from the one above it. Every decision traces back to worldview.

**For building UI:** Just use the primitives. They implement everything below.
**For understanding WHY:** Read the philosophy hierarchy.

---

## The Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  Level 0: WORLDVIEW                                     │
│  "Student autonomy infrastructure"                      │
│  Why HIVE exists. What we believe about the world.      │
│  → WORLDVIEW.md                                         │
├─────────────────────────────────────────────────────────┤
│  Level 1: PHILOSOPHY                                    │
│  "Campus at 2am"                                        │
│  How HIVE should feel. The emotional truth.             │
│  → PHILOSOPHY.md                                        │
├─────────────────────────────────────────────────────────┤
│  Level 2: PRINCIPLES                                    │
│  "Dark is home. Gold is earned."                        │
│  Rules that guide every decision.                       │
│  → PRINCIPLES.md                                        │
├─────────────────────────────────────────────────────────┤
│  Level 3: LANGUAGE                                      │
│  Tokens: color, typography, spacing, motion             │
│  The visual vocabulary.                                 │
│  → LANGUAGE.md                                          │
├─────────────────────────────────────────────────────────┤
│  Level 4: SYSTEMS                                       │
│  Surface, Glass, Motion, Atmosphere                     │
│  Tokens composed into reusable recipes.                 │
│  → SYSTEMS.md                                           │
├─────────────────────────────────────────────────────────┤
│  Level 5: PRIMITIVES                                    │
│  Button, Card, Avatar, Input, Badge...                  │
│  The atomic building blocks.                            │
│  → PRIMITIVES.md                                        │
├─────────────────────────────────────────────────────────┤
│  Level 6: COMPONENTS                                    │
│  SpaceCard, ChatMessage, ToolPreview...                 │
│  Primitives composed into functional units.             │
│  → COMPONENTS.md                                        │
├─────────────────────────────────────────────────────────┤
│  Level 7: PATTERNS                                      │
│  Space Participation, Discovery, Tool Building...       │
│  Complete user experiences.                             │
│  → PATTERNS.md                                          │
├─────────────────────────────────────────────────────────┤
│  Level 8: TEMPLATES                                     │
│  Focus, Shell, Stream, Grid, Workspace                  │
│  Page-level structures.                                 │
│  → TEMPLATES.md                                         │
├─────────────────────────────────────────────────────────┤
│  Level 9: INSTANCES                                     │
│  /spaces/[id], /tools/create, /...                      │
│  The final embodiment. Theory becomes reality.          │
│  → INSTANCES.md                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Navigation

### By Purpose

| I need to... | Read |
|-------------|------|
| Understand why HIVE exists | WORLDVIEW.md |
| Know how it should feel | PHILOSOPHY.md |
| Make a design decision | PRINCIPLES.md |
| Find a color/spacing/font value | LANGUAGE.md |
| Understand surface/motion systems | SYSTEMS.md |
| Build a basic element | PRIMITIVES.md |
| Build a complex component | COMPONENTS.md |
| Design a user flow | PATTERNS.md |
| Structure a page | TEMPLATES.md |
| Specify a complete page | INSTANCES.md |

### By Role

| Role | Start With | Then Read |
|------|------------|-----------|
| **Designer** | PHILOSOPHY → PRINCIPLES | LANGUAGE → SYSTEMS |
| **Developer** | LANGUAGE → SYSTEMS | PRIMITIVES → COMPONENTS |
| **Product** | WORLDVIEW → PHILOSOPHY | PATTERNS → TEMPLATES |
| **New Team Member** | WORLDVIEW → PHILOSOPHY | Everything else |

---

## Key Threads

These concepts flow through the entire hierarchy:

### 1. The 2am Philosophy
> "Campus at 2am — when the pretense drops, the real ones remain, and things actually happen."

- **WORLDVIEW**: Students need authentic connection
- **PHILOSOPHY**: The emotional truth of HIVE
- **PRINCIPLES**: Dark is home, warmth in darkness
- **LANGUAGE**: Warm blacks (#0A0A09), subtle warmth
- **SYSTEMS**: Edge warmth on active containers
- **PRIMITIVES**: Presence indicators, breathing animations
- **PATTERNS**: Real-time presence, typing indicators
- **TEMPLATES**: Shell feels like a room
- **INSTANCES**: Spaces feel like places you visit

### 2. The Gold Budget
> "Gold is the campfire. One fire per room. 1-2% maximum."

- **PRINCIPLES**: Gold = activity only, never decorative
- **LANGUAGE**: `--life-gold: #FFD700`, strict usage rules
- **SYSTEMS**: Life budget per screen
- **PRIMITIVES**: Only PresenceDot, Button(CTA), LiveCounter
- **COMPONENTS**: Active indicators, primary CTAs
- **TEMPLATES**: One gold CTA per viewport
- **INSTANCES**: Presence dots, typing, achievements

### 3. The Inside/Outside Gate
> "Non-students see the monster. They don't get an invite."

- **PHILOSOPHY**: The velvet rope, scarcity creates value
- **PRINCIPLES**: Maintain the boundary
- **PATTERNS**: Gate pattern, onboarding flow
- **TEMPLATES**: Focus (Portal) for outsiders
- **INSTANCES**: Landing shows activity, hides names

### 4. Atmosphere Spectrum
> "Landing is Apple-rich. Spaces are comfortable. HiveLab is workshop."

- **SYSTEMS**: Three atmosphere contexts defined
- **PRIMITIVES**: Atmosphere-aware variants
- **COMPONENTS**: Context-dependent styling
- **TEMPLATES**: Atmosphere assignment per template
- **INSTANCES**: Atmosphere per category (Portal/Home/Discovery/Creation/Identity)

---

## Document Sizes

| Level | Document | Lines | Purpose |
|-------|----------|-------|---------|
| 0 | WORLDVIEW.md | ~770 | Beliefs, macro context, big plays |
| 1 | PHILOSOPHY.md | ~360 | 2am energy, inside/outside |
| 2 | PRINCIPLES.md | ~435 | Visual, motion, voice rules |
| 3 | LANGUAGE.md | ~865 | All tokens defined |
| 4 | SYSTEMS.md | ~940 | Composed patterns |
| 5 | PRIMITIVES.md | ~1,820 | 20+ atomic elements |
| 6 | COMPONENTS.md | ~13,835 | Comprehensive component specs |
| 7 | PATTERNS.md | ~2,830 | 8 core patterns |
| 8 | TEMPLATES.md | ~1,395 | 5 templates with modes |
| 9 | INSTANCES.md | ~800 | Instance philosophy + canonicals |
| | **TOTAL** | **~24,000** | |

---

## How Documents Connect

```
WORLDVIEW ─────────────────────────────────────────────────┐
    │ "Students will build what institutions can't"        │
    ▼                                                      │
PHILOSOPHY ────────────────────────────────────────────────┤
    │ "Campus at 2am"                                      │
    ▼                                                      │
PRINCIPLES ────────────────────────────────────────────────┤
    │ "Dark is home, gold is earned"                       │
    ▼                                                      │ UPSTREAM
LANGUAGE ──────────────────────────────────────────────────┤ (Why)
    │ #0A0A09, #FFD700, Clash Display, Geist               │
    ▼                                                      │
SYSTEMS ───────────────────────────────────────────────────┤
    │ Surface, Glass, Motion, Atmosphere recipes           │
    ▼                                                      │
PRIMITIVES ────────────────────────────────────────────────┘
    │ Button, Card, Avatar...
    ▼
COMPONENTS ────────────────────────────────────────────────┐
    │ SpaceCard, ChatMessage...                            │
    ▼                                                      │ DOWNSTREAM
PATTERNS ──────────────────────────────────────────────────┤ (How)
    │ Space Participation, Discovery...                    │
    ▼                                                      │
TEMPLATES ─────────────────────────────────────────────────┤
    │ Focus, Shell, Stream, Grid, Workspace                │
    ▼                                                      │
INSTANCES ─────────────────────────────────────────────────┘
    └ /spaces/[id], /tools/create, /...
```

---

## The Tests

Before shipping anything, ask:

| Test | Question |
|------|----------|
| **2am Test** | Would this feel right at 3am with three real people? |
| **Precision Test** | Can we explain why every element is exactly where it is? |
| **Alive Test** | Does this feel like things are happening? |
| **Human Test** | Does this sound like a person, not a brand? |
| **Gate Test** | Does this maintain inside/outside? |
| **Gold Test** | Is gold only used for life/activity/achievement? |
| **Builder Test** | Does this make building easier? |

---

## Using This System

### For New Features

1. **Start at PATTERNS** — Does a pattern exist for this?
2. **Check TEMPLATES** — What template structure fits?
3. **Reference COMPONENTS** — What components compose it?
4. **Apply SYSTEMS** — What atmosphere/density/motion?
5. **Verify against PRINCIPLES** — Does it pass the tests?

### For Bug Fixes

1. **Check LANGUAGE** — Are tokens correct?
2. **Check SYSTEMS** — Is the recipe followed?
3. **Check PRIMITIVES/COMPONENTS** — Is the spec honored?

### For Design Decisions

1. **Start at PRINCIPLES** — What rules apply?
2. **Trace to PHILOSOPHY** — Does it feel like 2am?
3. **Verify against WORLDVIEW** — Does it serve student autonomy?

---

## Maintaining This System

### When to Update

- **WORLDVIEW**: Rarely (fundamental shifts only)
- **PHILOSOPHY**: Rarely (emotional truth is stable)
- **PRINCIPLES**: Occasionally (new rules discovered)
- **LANGUAGE**: As needed (new tokens)
- **SYSTEMS**: As needed (new recipes)
- **PRIMITIVES**: As built (new elements)
- **COMPONENTS**: As built (new compositions)
- **PATTERNS**: As designed (new flows)
- **TEMPLATES**: Rarely (structure is stable)
- **INSTANCES**: As routes evolve

### Update Protocol

1. Changes flow DOWN, not up
2. If you need to change upstream, question the downstream first
3. Every change should trace back to worldview
4. Document the "why" in commit messages

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `docs/IA.md` | Information Architecture (to be created) |
| `docs/CLAUDE.md` | Development context |
| `docs/TODO.md` | Active work items |
| `docs/LAUNCH_PLAN.md` | Go-to-market |

---

*This design system is the foundation for rebuilding HIVE's UI/UX. Every pixel should trace back to worldview. Every interaction should feel like 2am.*
