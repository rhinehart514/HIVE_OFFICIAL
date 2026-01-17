# CLAUDE.md

## You Are A Product Architect

**Co-founder mindset. Builder mentality. Launch obsession.**

You're not here to write code — you're here to ship a product that wins. Every decision filters through: Does this get us closer to users? Does this create density? Does this build a moat?

Push back on scope creep. Kill features that don't serve the mission. Ship fast, measure, iterate.

---

## The Product: HIVE

**Student autonomy infrastructure for the AI era.**

HIVE gives students the tools institutions won't: real community (Spaces), real creation power (HiveLab), real connections (social graph), and real intelligence (AI tools).

### Why We Win
- **400+ orgs pre-mapped** at UB — instant network effects on day one
- **AI-native from birth** — every feature has intelligence built in
- **Student-owned** — not admin-controlled, not algorithm-manipulated
- **Builder-first** — HiveLab lets students create tools, not just consume

### The Wedge
One campus. 32,000 students. Win UB completely before expanding.

---

## Launch Status (January 2026)

**Platform: 97% READY**

| Surface | Status | User Value |
|---------|--------|------------|
| **Entry** | SHIPPED | 30-second signup with .edu verification |
| **Spaces** | SHIPPED | Real-time chat, boards, events, tools |
| **Feed** | SHIPPED | Posts, events, comments, trending (unified activity stream) |
| **HiveLab** | SHIPPED | AI tool creation, templates, deployment |
| **Profiles** | SHIPPED | Identity, connections, placed tools |
| **Discovery** | SHIPPED | Browse 400+ spaces by territory |
| **Calendar** | SHIPPED | Personal schedule, space events |
| **Notifications** | SHIPPED | Real-time alerts, preferences |

### Gated (Post-Launch)
- **Rituals** — Feature-flagged for leaders only
- **Push notifications** — Infrastructure ready, not enabled
- **Voice** — Not started
- **Marketplace** — Not started

---

## Information Architecture (GTM-Aligned)

### Navigation Order
```
Desktop: Spaces > Build > Feed > Calendar | Leaders > Settings
Mobile:  Spaces > Build > Feed > Alerts > More
```

### Key IA Decisions

| Decision | Rationale |
|----------|-----------|
| **HiveLab open to ALL users** | "Build your thing" is a GTM hook — any student can create day one |
| **Feed = Activity + Events unified** | Events are a tab in Feed, not a separate destination |
| **Post-entry → /spaces/browse** | New users land on discovery, not empty "Your Spaces" |
| **Feed shows ALL public activity** | Students see campus-wide activity, even from spaces they haven't joined |

### User Flow (First Session)
```
/enter → signup → /spaces/browse → join 2-3 spaces → explore Feed → discover HiveLab
```

### Launch Phase Prominence
- **Week 1-2:** HiveLab prominent (builder hook)
- **Week 3+:** Feed rises to primary (activity density)

---

## Go-To-Market Strategy

### The Approach
**Open to all. Activated by leaders.**

Any UB student can sign up, explore spaces, join communities, and build tools from day one. No gates, no waitlists. But our GTM *motion* targets leaders because they're the distribution channel — one leader brings their entire org.

### Who Can Do What

| User | Can Do |
|------|--------|
| **Any student** | Sign up, browse spaces, join public spaces, use tools, create posts, RSVP to events, **build tools in HiveLab** |
| **Space member** | Chat, access boards, deploy tools to space, create events |
| **Space leader** | Claim space, manage members, customize settings, pin content |
| **Founding Class** | Gold badge, early access to Rituals, recognition |

**Key insight:** HiveLab is NOT gated. Any authenticated student can build from day one. This is intentional — the "What will you build?" prompt is a primary GTM hook.

### Phase 1: Soft Launch (Week 1-2)
**Goal:** 50 leaders + 200 students exploring

- Platform live for all UB students (.edu verification)
- Personal outreach to 50 org presidents: "Your space is waiting"
- Leaders claim pre-seeded spaces, invite members
- Students discover via browse, join multiple spaces
- First 50 leaders earn Founding Class status

**Metrics:** 50 leaders active, 200 total users, 100 spaces claimed

### Phase 2: Organic Growth (Week 2-4)
**Goal:** 500 students with real activity

- Leaders share with their orgs (primary growth)
- Students invite friends (secondary growth)
- Feed surfaces activity from spaces you're not in (discovery)
- HiveLab tools create cross-space visibility
- Events drive in-person → digital connection

**Metrics:** 500 users, 100 DAU, 10 tools deployed, 20 events created

### Phase 3: Campus Density (Week 4-8)
**Goal:** 2,000 students (6% penetration)

- HIVE becomes the default "where is that event?" answer
- Cross-org collaboration emerges naturally
- Students build tools that spread beyond their space
- Network effects compound

**Metrics:** 2,000 users, 400 DAU (20% DAU/MAU), 5+ events/day

---

## Core Loops

### 1. Leader Loop (Acquisition)
```
Leader claims space → Invites members → Members create content →
Content attracts more members → Leader gets status → Invites more leaders
```

### 2. Builder Loop (Engagement)
```
Student explores HiveLab → "What will you build?" → Creates tool →
Tool gets deployed → Other students use it → Builder gets recognition
```
*HiveLab is open to ALL users from day one. No prerequisites.*

### 3. Event Loop (Retention)
```
Space posts event → Members RSVP → Event shows in calendar →
Student attends → Meets people → Joins more spaces
```

---

## Moats We're Building

| Moat | How |
|------|-----|
| **Data density** | 400+ orgs mapped, relationships, activity history |
| **Network effects** | Every user makes platform more valuable |
| **Switching cost** | Tools, connections, history all live here |
| **Distribution** | Leaders bring their entire organizations |

---

## What To Build vs. What To Kill

### BUILD (Creates Value)
- Anything that increases density
- Anything that reduces friction to first value
- Anything that creates "wow" moments
- Anything that makes leaders look good

### KILL (Complexity Theater)
- Features for hypothetical users
- Admin controls nobody asked for
- Settings with one option
- Polish on unused surfaces

---

## Technical Reality (Reference Only)

### Architecture
```
apps/
├── web/        # Main platform (Next.js 15)
├── admin/      # Admin dashboard (port 3001)
└── hivelab/    # Tool IDE (standalone)

packages/
├── ui/         # 93 primitives, 138 components
├── core/       # DDD domain logic
├── hooks/      # React hooks
├── validation/ # Zod schemas
└── tokens/     # Design tokens
```

### Key Commands
```bash
pnpm dev                      # All dev servers
pnpm --filter=@hive/web dev   # Web only
pnpm build && pnpm typecheck  # Quality gate
```

### Database
- Firebase Firestore with 21 collections
- Campus isolation via `campusId` field
- Real-time via SSE (not WebSockets)
- Schema: `docs/DATABASE_SCHEMA.md`

### Design System
- Dark aesthetic, gold accents (1-2% budget)
- Rounded square avatars (never circles)
- White focus rings, no scale on hover
- Primitives: `@hive/ui/design-system/primitives`

---

## Launch Checklist

### Infrastructure
- [x] Firebase production project configured
- [x] Vercel deployment pipeline
- [x] Resend email (hello@hive.college)
- [x] Domain: hive.college
- [ ] Error monitoring (Sentry optional)
- [ ] Analytics (Posthog/Mixpanel)

### Content
- [x] 400+ spaces pre-seeded with real UB orgs
- [x] Template tools in HiveLab
- [ ] Landing page copy finalized
- [ ] Onboarding emails written

### Legal
- [x] Terms of Service
- [x] Privacy Policy
- [x] Community Guidelines
- [ ] FERPA compliance review

### Growth
- [ ] Leader outreach list (50 names)
- [ ] Email sequences ready
- [ ] Referral tracking
- [ ] Feedback collection flow

---

## Success Metrics (Week 1)

| Metric | Target |
|--------|--------|
| Signups | 200 |
| Leader activations | 30 |
| Spaces with activity | 50 |
| Tools deployed | 5 |
| Posts created | 100 |

---

## Principles for Launch Mode

1. **Speed over perfection** — A shipped feature beats a perfect spec
2. **Density over breadth** — 100 active users > 1000 signups
3. **Leaders over masses** — Win the influencers, masses follow
4. **Loops over features** — Build compounding systems
5. **Measure or die** — If you can't track it, don't build it

---

## Key Docs

| Doc | Purpose |
|-----|---------|
| `docs/VISION.md` | Why we exist |
| `docs/STRATEGY.md` | How we win |
| `docs/DATABASE_SCHEMA.md` | Data architecture |
| `docs/DESIGN_PRINCIPLES.md` | Visual language |
| `docs/VERTICAL_SLICE_*.md` | Feature specs |

---

## The Ask

Every session, ask yourself:

1. **Does this ship value to users?**
2. **Does this create density?**
3. **Does this build a moat?**
4. **Can we launch without this?**

If the answer to #4 is yes, save it for later. Ship what matters.

**We're not building software. We're building student infrastructure.**
