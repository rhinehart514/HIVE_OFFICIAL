# GTM Surface Rethink Framework

> **Purpose:** Systematic methodology for redesigning and rethinking every UI surface before GTM launch.
> **Created:** January 2026
> **Status:** Active Sprint

---

## Philosophy

This is not a polish pass. We are questioning everything:
- Does this page need to exist?
- Is it doing the right job?
- Are the features serving users or adding noise?
- Would a student screenshot this and share it?

Every surface must earn its place.

---

## The Four Phases

### Phase 1: Interrogate

Before touching code, answer these questions honestly:

#### Purpose
| Question | Answer |
|----------|--------|
| Why does this page exist? | |
| What's the ONE job it must do? | |
| If we deleted it, what breaks? | |
| Does it serve the Leader Loop, Builder Loop, or Event Loop? | |

#### User Intent
| Question | Answer |
|----------|--------|
| Who lands here? (Persona) | |
| What do they want in the first 3 seconds? | |
| What's the ideal next action? | |
| What question are they trying to answer? | |

#### Current Reality
| Question | Answer |
|----------|--------|
| What's working well? | |
| What's confusing or broken? | |
| What's there that nobody uses? | |
| What's missing that should exist? | |

---

### Phase 2: Decide

Make hard calls on every element:

| Decision | Meaning | When to Use |
|----------|---------|-------------|
| **KEEP** | Works, aligned with purpose | Element is doing its job well |
| **KILL** | Remove entirely | Adds complexity, low/no value |
| **REDESIGN** | Right idea, wrong execution | Purpose is correct, UI/UX fails |
| **ADD** | Create something new | Missing something critical |
| **MERGE** | Combine with another surface | Two pages doing similar jobs |
| **SPLIT** | Break into multiple surfaces | One page doing too many jobs |

#### Decision Principles
1. When in doubt, KILL it
2. Simpler is always better
3. One page = one job
4. If it doesn't serve a loop, question its existence
5. Empty space is not wasted space

---

### Phase 3: Design

Define the new surface with precision:

#### Hierarchy (What matters most → least)
```
1. [Primary element/action]
2. [Secondary element]
3. [Tertiary element]
4. [Supporting content]
```

#### Layout Pattern
- [ ] Single column (mobile-first, focused)
- [ ] Split view (60/40 or 50/50)
- [ ] Grid (discovery, gallery)
- [ ] Dashboard (multiple widgets)
- [ ] Full-bleed (immersive)

#### Components Needed
List every UI component required:
- [ ] Header/Navigation
- [ ] Primary CTA
- [ ] Cards/List items
- [ ] Empty state
- [ ] Loading skeleton
- [ ] Error state
- [ ] Modals/Overlays
- [ ] Forms/Inputs

#### State Matrix
Every surface must handle ALL states:

| State | Designed? | Notes |
|-------|-----------|-------|
| Loading | | Skeleton matches final layout |
| Empty | | Helpful message + clear action |
| Error | | What went wrong + recovery path |
| Partial (1-2 items) | | Doesn't feel broken |
| Full (many items) | | Pagination/virtualization |
| Success | | Confirmation + next step |
| Offline | | Graceful degradation |

#### Interaction Design
| Element | Hover | Focus | Active | Transition |
|---------|-------|-------|--------|------------|
| | | | | |

**Motion Tiers:**
- T1 (500-700ms): Page transitions, celebrations
- T2 (300ms): Panel opens, card hovers
- T3 (150-200ms): Button clicks, toggles
- T4 (0-50ms): Instant feedback

#### Mobile Adaptation
- [ ] Touch targets ≥44px
- [ ] Thumb-zone friendly CTAs
- [ ] Horizontal scroll where appropriate
- [ ] Bottom sheet modals (not centered)
- [ ] Reduced motion for performance

---

### Phase 4: Build

Implementation with discipline:

#### Pre-Build Checklist
- [ ] Phase 1-3 documented
- [ ] Decisions approved
- [ ] Design direction clear
- [ ] No ambiguity remaining

#### Build Rules
1. Start fresh if foundations are broken (don't polish garbage)
2. Use design system primitives exclusively
3. No hardcoded colors — use tokens
4. Test ALL states during development
5. Mobile-first, then desktop
6. Typecheck before calling it done

#### Design System Compliance
- [ ] Colors: White/opacity + Gold (1-2% budget only)
- [ ] Focus rings: White (`focus-visible:ring-white/50`)
- [ ] Hover: Brightness/opacity only, never scale
- [ ] Borders: `white/[0.06]` or `white/[0.08]`
- [ ] Backgrounds: `white/[0.02]` for cards
- [ ] Typography: Proper size tokens
- [ ] Spacing: Consistent padding system

#### Post-Build Verification
- [ ] All states implemented
- [ ] Mobile tested
- [ ] Keyboard navigation works
- [ ] Focus visible on all interactive elements
- [ ] Typecheck passes
- [ ] No console errors

---

## Priority Tiers

### P0 — Must Nail (Conversion Critical)
| Surface | Job | Loop |
|---------|-----|------|
| Landing | Convert visitor → signup | — |
| Entry/Login | Frictionless authentication | — |
| Browse/Discovery | First space join in <60s | Leader |

### P1 — Core Experience (Value Delivery)
| Surface | Job | Loop |
|---------|-----|------|
| Space Detail Hub | Understand space, decide to engage | Leader |
| Space Chat | Real-time communication | Leader |
| HiveLab Gallery | Discover what's possible | Builder |
| Tool Builder | Create something | Builder |

### P2 — Supporting (Engagement)
| Surface | Job | Loop |
|---------|-----|------|
| Feed | See campus activity | All |
| Profile | Identity + connections | All |
| Calendar | Personal schedule | Event |
| Events | Discover + RSVP | Event |

### P3 — Can Ship Rough (Functional > Beautiful)
| Surface | Job | Loop |
|---------|-----|------|
| Settings | Account management | — |
| Notifications | Stay informed | — |
| Leaders Dashboard | Space management | Leader |

---

## The Three Loops (Reference)

Every surface should serve at least one:

### Leader Loop (Acquisition)
```
Leader claims space → Invites members → Members create content →
Content attracts more members → Leader gets status → Invites more leaders
```

### Builder Loop (Engagement)
```
Student explores HiveLab → "What will you build?" → Creates tool →
Tool gets deployed → Other students use it → Builder gets recognition
```

### Event Loop (Retention)
```
Space posts event → Members RSVP → Event shows in calendar →
Student attends → Meets people → Joins more spaces
```

---

## Working Process

For each surface:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INTERROGATE                                              │
│    Claude presents: Purpose, User Intent, Current Reality   │
│    Output: Documented answers to all questions              │
├─────────────────────────────────────────────────────────────┤
│ 2. DECIDE                                                   │
│    Together: Review each element                            │
│    Output: Keep/Kill/Redesign/Add decisions                 │
├─────────────────────────────────────────────────────────────┤
│ 3. DESIGN                                                   │
│    Claude proposes: Hierarchy, Layout, Components, States   │
│    User approves or redirects                               │
│    Output: Clear design specification                       │
├─────────────────────────────────────────────────────────────┤
│ 4. BUILD                                                    │
│    Claude implements with design system compliance          │
│    Output: Working surface, all states, typecheck passes    │
└─────────────────────────────────────────────────────────────┘
```

---

## Surface Tracking

| Surface | Phase | Status | Decisions | Notes |
|---------|-------|--------|-----------|-------|
| Landing | 4 | ✅ Done | Polish + focus rings | Minor fixes only |
| Entry | 1 | ⏳ Pending | | |
| Browse | 1 | ⏳ Pending | | Started audit, paused |
| Space Detail | — | ⏳ Pending | | |
| Space Chat | — | ⏳ Pending | | |
| HiveLab | — | ⏳ Pending | | |
| Feed | — | ⏳ Pending | | |
| Profile | — | ⏳ Pending | | |
| Calendar | — | ⏳ Pending | | |
| Settings | — | ⏳ Pending | | |
| Leaders | — | ⏳ Pending | | |
| Notifications | — | ⏳ Pending | | |

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│         RETHINK CHECKLIST               │
├─────────────────────────────────────────┤
│ □ What's the ONE job?                   │
│ □ Who's the user? What do they want?    │
│ □ What can we KILL?                     │
│ □ What must we REDESIGN?                │
│ □ All states designed?                  │
│ □ Mobile works?                         │
│ □ Focus rings on everything?            │
│ □ Gold budget respected?                │
│ □ Typecheck passes?                     │
└─────────────────────────────────────────┘
```

---

## Changelog

| Date | Change |
|------|--------|
| Jan 2026 | Framework created for GTM sprint |

