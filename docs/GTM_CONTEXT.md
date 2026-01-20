# HIVE GTM Context

> **Purpose:** Single source of truth for the GTM sprint. Understanding before building.
> **Sprint Deadline:** Monday
> **Updated:** January 2026

---

## Strategic Context

### The Thesis

**HIVE is student autonomy infrastructure for a world where the old paths are dying.**

Students sense that major → degree → job → career is dissolving. AI makes knowledge transfer obsolete. Credentials are devaluing. The traditional path leads nowhere.

What survives: Human connection, identity formation, real relationships, agency over development.

HIVE is where students figure out what comes next — with communities, with tools, with AI that expands thinking.

### Market Position

| vs. | Our Position |
|-----|-------------|
| **Discord** | Discord is chat. HIVE is your campus. Discovery + context + tools |
| **GroupMe** | GroupMe is a group text. HIVE is a community. |
| **Instagram** | Instagram is a stage. HIVE is where you actually belong. |
| **CampusLabs** | Built for administrators. HIVE is built for students. |

### The Wedge

**Win UB at density.** 50%+ of students, 100+ vital spaces, orgs shutting down Discords.

Leader-first GTM: 1 leader = 50-500 members. 50 leaders = critical mass.

---

## User Psychology

### Leaders (Supply Side)

**Who they are:** Ambitious students running orgs. Juniors/seniors juggling everything.

**Emotional reality:**
- Pride mixed with imposter syndrome
- Overwhelmed but won't admit it
- Frustrated with fragmented tools
- Fear of being the one who killed the org

**What lands:** Power, control, agency. "I can actually build the org I imagine."

**First-touch magic:**
1. HIVE knows my org exists → Recognition
2. One-click claim → Ownership
3. Space isn't empty → Instant life
4. Tools appear instantly → Power moment
5. Share link works → Invite flow

### Members (Demand Side)

**Who they are:** Spectrum from core to peripheral. Mostly freshmen/sophomores seeking belonging.

**Emotional reality:**
- Belonging hunger (especially freshmen)
- Social anxiety (joining is scary)
- Default to passive consumption
- FOMO battles inertia

**What lands:** Discovery, belonging, ease. "My people are here."

**First-touch magic:**
1. Preview before commitment
2. Frictionless join
3. See friends already here
4. No demands — lurk freely
5. Low-stakes first action

### The Gap

| Leaders Want | Members Want |
|-------------|--------------|
| Control | Ease |
| Power tools | Just works |
| Rebellion resonates | Belonging resonates |
| Active builders | Passive consumers |

HIVE must serve both without feeling complex to members or limiting to leaders.

---

## Product State

### Feature Readiness

| Surface | Status | GTM Priority |
|---------|--------|--------------|
| Spaces + Chat | 96% | P1 |
| HiveLab | 100% | P1 |
| Onboarding | 90% | P0 |
| Discovery/Browse | 80% | P0 |
| Profiles | 75% | P2 |
| Feed | Real data | P2 |
| Calendar | 90% | P2 |
| Notifications | 90% | P3 |

### Launch Blockers (Deferred)

- Redis for distributed rate limiting (in-memory ok for soft launch)
- Presence refactor to space-specific (monitor performance)
- SSE cleanup with timeout (add if issues arise)

### Technical Foundation

```
Monorepo: pnpm + Turborepo
Web: Next.js 15 (App Router, RSC)
UI: 93 primitives, 138 components
Real-time: SSE (not WebSockets)
Auth: OTP + JWT
Database: Firestore (campus-isolated)
Email: Resend
AI: Goose system (Groq → Ollama → Rules fallback)
```

---

## Design System Essence

### Core Philosophy

| Principle | Rule |
|-----------|------|
| **Color** | 95% grayscale, 5% gold |
| **Dark-First** | #0A0A0A is home |
| **Gold Rule** | Gold is earned — 1% of screens |
| **Motion** | Subtle and functional |
| **Spacing** | ChatGPT-style breathing room |

### Gold is Sacred

**Allowed:** Primary CTAs, achievements, presence indicators, featured badges
**Forbidden:** Focus rings, secondary buttons, borders, hover states, decorative

### Motion Tiers

| Tier | Duration | Use |
|------|----------|-----|
| T1 | 500-700ms | Celebrations only |
| T2 | 300ms | Standard interactions |
| T3 | 150-200ms | Hovers, toggles |
| T4 | 0-50ms | Accessibility fallback |

### Never Do

- Scale on hover (use opacity/brightness)
- Gold focus rings (white only)
- Light mode (dark-first always)
- Decorative gold (functional only)

---

## The Three Loops

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

## GTM Sprint Methodology

### The 4-Phase Framework

For each surface:

1. **Interrogate** — Purpose, user intent, current reality
2. **Decide** — Keep / Kill / Redesign / Add
3. **Design** — Hierarchy, layout, components, states
4. **Build** — Implement with design system compliance

### Priority Tiers

**P0 — Conversion Critical:**
- Landing, Entry/Login, Browse/Discovery

**P1 — Core Experience:**
- Space Detail, Space Chat, HiveLab Gallery, Tool Builder

**P2 — Supporting:**
- Feed, Profile, Calendar, Events

**P3 — Functional > Beautiful:**
- Settings, Notifications, Leaders Dashboard

### State Matrix (Every Surface)

| State | Required |
|-------|----------|
| Loading | Skeleton matches final layout |
| Empty | Helpful message + clear action |
| Error | What went wrong + recovery path |
| Partial | Doesn't feel broken |
| Full | Pagination/virtualization |
| Success | Confirmation + next step |

---

## Weekly Scaling Framework

### Week N Sprint Structure

**Monday:** Review previous week, plan current week
- What shipped?
- What feedback came in?
- What's blocking users?
- What's the ONE thing that moves the needle?

**Tuesday-Thursday:** Build
- Vertical slices only
- Ship incrementally
- Test with real users if possible

**Friday:** Polish + Ship
- Fix edge cases
- Quality gate (typecheck, build, lint)
- Deploy

**Weekend:** Observe
- How are users behaving?
- What signals are emerging?
- What should next week focus on?

### Success Signals to Watch

| Signal | Target |
|--------|--------|
| Space vitality | >10 messages/week in 100+ spaces |
| Cross-space engagement | 40% of users in 2+ spaces |
| D7 retention | 50% |
| Time to first message | <5 min from signup |
| Organic growth | 30%+ from referral after month 2 |

---

## Current Sprint Focus

### Active Surfaces

| Surface | Focus | Status |
|---------|-------|--------|
| Entry/Onboarding | Premium feel, buttery transitions | Pending |
| Spaces | Chat responsiveness, empty states | Pending |
| HiveLab | Builder experience | Pending |
| Browse | Card polish, search feel | Pending |
| Feed | Visual consistency | Pending |

### Sprint Checklist

- [ ] Entry feels premium, transitions are buttery
- [ ] Success states create "wow" moments
- [ ] Chat feels responsive and real-time
- [ ] Empty space states invite action
- [ ] Loading states match design system
- [ ] HiveLab builder experience is premium
- [ ] Browse space cards are consistent
- [ ] Search feels responsive

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Full launch mindset | Build for 1000s, not 10-20 |
| Leader-first GTM | Leaders bring 50-500 members each |
| UB-only for Year 1 | Prove density at one campus |
| Feed is real | No "Coming Soon" — actual content |
| Rituals gated | Enable post-launch |
| AI invisible | Students cynical about AI hype |

---

## Quick Reference

### Commands
```bash
pnpm dev                      # All dev servers
pnpm --filter=@hive/web dev   # Web only
pnpm build && pnpm typecheck  # Quality gate
```

### Key Paths
| Surface | Path |
|---------|------|
| Entry | `/enter` + `components/entry/` |
| Feed | `/feed` + `/posts/[postId]` |
| Spaces | `/spaces/[spaceId]` + chat hooks |
| Profile | `/profile/[id]` + `/profile/edit` |
| Tools | `/tools/[toolId]` + HiveLab components |
| Discovery | `/spaces` (browse) |

### Documentation
| Need | Doc |
|------|-----|
| Vision | `docs/VISION.md` |
| Strategy | `docs/STRATEGY.md` |
| Design | `docs/DESIGN_PRINCIPLES.md` |
| Database | `docs/DATABASE_SCHEMA.md` |
| Launch | `docs/LAUNCH_PLAN.md` |
| Rethink | `docs/GTM_SURFACE_RETHINK_FRAMEWORK.md` |

---

*This document is the foundation for every GTM sprint conversation. Read it, internalize it, build from it.*
