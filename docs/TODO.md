# HIVE Development Tracking

**Superseded:** January 21, 2026

---

## Active Roadmap

All development is now tracked in:

### [LAUNCH_ROADMAP.md](./LAUNCH_ROADMAP.md)

The roadmap uses the Drama + Octalysis framework to systematically work through each vertical slice with motivation and emotional architecture.

---

## Framework Reference

### [design-system/DRAMA.md](./design-system/DRAMA.md)

Defines:
- 8 core motivation drives (Octalysis)
- Emotional architecture principles
- Drive hierarchy and guardrails
- Feature spec template

---

## Current State

### [CURRENT_STATE.md](./CURRENT_STATE.md)

Single source of truth for what exists, organized by vertical slice.

---

## Slice Progress

| # | Slice | Status | Primary Drives |
|---|-------|--------|----------------|
| 1 | Entry | `[ ] Not Started` | Epic Meaning, Scarcity |
| 2 | Onboarding | `[ ] Not Started` | Ownership, Accomplishment |
| 3 | Spaces | `[ ] Not Started` | Social Influence, Ownership |
| 4 | Discovery | `[ ] Not Started` | Scarcity, Social Influence |
| 5 | Feed | `[ ] Not Started` | Unpredictability, Social Influence |
| 6 | HiveLab | `[ ] Not Started` | Creativity, Accomplishment |
| 7 | Profiles | `[ ] Not Started` | Ownership, Creativity |
| 8 | Events | `[ ] Not Started` | Social Influence, Scarcity |
| 9 | Settings | `[ ] Not Started` | Ownership |

---

## The Process

For each slice:

```
1. AUDIT      → Read current code, map against drives
2. DESIGN     → Find peaks, design dramatic arc
3. SPEC       → Specific changes, primitives, timing
4. BUILD      → Implement
5. VALIDATE   → Did the drama land?
```

---

## Quality Gates

Per slice:
- [ ] Motivation drives clearly firing
- [ ] At least one unforgettable moment
- [ ] No accidental dark patterns
- [ ] Primitives used consistently

Overall:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] First 60 seconds create "I need this"

---

## The Bar

> "Would we be proud to explain exactly how this works to our users?"

If no, don't ship it.
