# HIVE — Project Instructions

## Product
Student autonomy infrastructure for the AI era.

---

## Operating Mandate

Assume you were hired with a billion-dollar mandate from top-tier tech and YC to design and ship HIVE as enduring campus infrastructure. Every product, system, and UI decision must still make sense at national scale five years from now.

**Build like it's already won.** This isn't a startup hedging bets — it's infrastructure that thousands of campuses will depend on. Design for the weight of that responsibility.

**The standard:** Would this decision survive 100x users? Would a new engineer understand this in 2029? Would a campus administrator trust their students to this?

**What earns trust:** Inevitability on first contact. Clarity that suggests depth. Polish that signals care. Systems that feel like they've always existed.

---

## Design Partner Mode

**Every page is a product.** It has a job, states, and feel. Evaluate it like you're charging for it.

**Foundation:** HIVE design system — 93 primitives, 138 components, tokens. Default to it. If a pattern is missing or dated, propose the evolution.

**Taste calibration:** Linear's density, Notion's clarity, Stripe's polish.

**When you open a page:**
Quick scan — what's the job? What's off? What state is missing?

**Never ship:**
- Spacing off the scale (4/8/12/16/24/32)
- Missing states (empty, loading, error, partial, edge)
- No interaction feedback (hover, active, disabled, loading)
- Unclear hierarchy (what do I look at first?)
- Dead ends (what's my next action?)
- Hardcoded values that should be tokens
- Patterns that exist in the system but were reinvented
- Anything that feels "almost done" — almost is worse than missing

**Prioritization:** Feel > Function > Consistency > Polish

**The bar:** Would this page make an institution trust us with their students?

---

## Technical Foundation

### Architecture
```
apps/
├── web/        # Next.js 15 (App Router, RSC)
├── admin/      # Admin dashboard (port 3001)
└── hivelab/    # Tool IDE (standalone)

packages/
├── ui/         # 93 primitives, 138 components
├── core/       # DDD domain logic
├── hooks/      # React hooks
├── validation/ # Zod schemas
└── tokens/     # Design tokens
```

### Commands
```bash
pnpm dev                      # All dev servers
pnpm --filter=@hive/web dev   # Web only
pnpm build && pnpm typecheck  # Quality gate
```

### External Services

**Firebase**
- Firestore: 50K reads/day free tier, ~500 concurrent listeners
- Storage: 10MB file limit, 5MB image limit
- Pattern: All queries include `campusId` for campus isolation

**Vercel**
- Edge functions for middleware (rate limiting, auth)
- ISR for semi-static pages (browse, templates)

**AI (Goose)**
- Fallback chain: Groq → Ollama → Rules-based
- Always works — rules-based is deterministic fallback

**Resend** — Transactional email, 3K/month free tier

**Redis (Upstash)** — Rate limiting, session cache. Optional.

### Docs

| Need | Path |
|------|------|
| Vision | `docs/VISION.md` |
| Strategy | `docs/STRATEGY.md` |
| Design principles | `docs/DESIGN_PRINCIPLES.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Design system | `docs/design-system/INDEX.md` |
| HiveLab | `docs/HIVELAB_ARCHITECTURE.md` |

---

## Quality Standards

- Validate at boundaries — Zod schemas for all inputs
- Structured errors — typed responses, not string messages
- Design system compliance — tokens, not hardcoded values
- Campus isolation — always filter by `campusId`

---

## Current Mode: GTM Sprint

**Focus:** Ship the first campus-ready release. Every surface polished to infrastructure-grade.

**Active Surfaces (priority order):**
1. **Entry → Onboarding** — First 30 seconds set expectations for everything else
2. **Feed** — The pulse of campus; must feel alive from day one
3. **Spaces** — Where students build together; must feel like home
4. **Browse** — Discovery and possibility; must spark action
5. **HiveLab** — Builder tools; must feel powerful and trustworthy

**Decision framework:**
- Will this scale? → Ship it
- Is this a shortcut we'll regret? → Fix it now
- Does this add complexity without clarity? → Cut it
- Would this embarrass us at a campus-wide demo? → Not ready

**Quality gates:**
- Every page handles empty state gracefully
- Every action has immediate visual feedback
- Every transition communicates system state
- No dead ends — always a clear next action

**The bar:** If a dean walked through this product, would they see infrastructure or an experiment?
