# Multi-Agent Optimization Strategy

**Created:** Jan 12, 2026
**Purpose:** Maximize efficiency during page-by-page rebuild sessions

---

## Agent Coordination Model

### Available Agents (Skills)

| Agent | Specialty | Invocation | Parallelizable |
|-------|-----------|------------|----------------|
| **fix-todos** | Session orchestration | `/fix-todos` | Orchestrator (main) |
| **hive-design** | Brand guardrails | Auto-applied | Read-only audits |
| **component-smith** | Implementation | `/component-smith` | Sequential |
| **storybook-lab** | Experimentation | `/storybook-lab` | ONE at a time |
| **motion-engineer** | Animation physics | `/motion-engineer` | Sequential |

### Coordination Rules

```
RULE 1: fix-todos orchestrates all other agents
RULE 2: storybook-lab = ONE component at a time (already locked for Phase 2)
RULE 3: hive-design rules apply to ALL implementations
RULE 4: Sequential page reviews (context-dependent decisions)
```

---

## Optimized Session Workflow

### Pre-Session (5 min)

```bash
# Start services in parallel
pnpm --filter=@hive/web dev &    # Port 3000
pnpm storybook:dev &              # Port 6006

# Verify both running
lsof -i :3000 && lsof -i :6006
```

### Per-Page Cycle (15-20 min each)

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: CONTEXT (2 min)                                    │
│ /fix-todos page <route>                                     │
│ → Sets current page                                         │
│ → Lists primary components                                  │
│ → Opens browser + Storybook                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: PARALLEL AUDIT (5 min)                             │
│ Visual inspection with hive-design checklist:               │
│ □ Background warm dark (#0A0A09)?                           │
│ □ Focus rings WHITE (never gold)?                           │
│ □ Avatars rounded-square?                                   │
│ □ Gold only on CTAs/presence/achievements?                  │
│ □ Motion = 300ms + ease-smooth?                             │
│ □ No hardcoded colors?                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: ISSUE LOGGING (3 min)                              │
│ /fix-todos issue <component> "<description>"                │
│ → Logged to DESIGN_SYSTEM_TODOS.md                          │
│ → Tagged with page context                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: DECISION ROUTING (5 min)                           │
│                                                             │
│ Quick Fix?                     Lab Needed?                  │
│ ├─ Token violation             ├─ New variant               │
│ ├─ Missing hover state         ├─ Layout decision           │
│ ├─ Wrong focus ring            ├─ Component redesign        │
│ └─ Use component-smith         └─ Use storybook-lab         │
│                                   (but check if locked!)    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: COMPLETION (2 min)                                 │
│ /fix-todos layout "<shell> + <pattern>"                     │
│ /fix-todos done                                             │
│ → Updates PAGE_REBUILD_PLAN.md                              │
│ → Suggests next page                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Build Performance Optimizations

### Quick Wins (Apply Now)

#### 1. Expand optimizePackageImports

```javascript
// apps/web/next.config.mjs
experimental: {
  optimizePackageImports: [
    '@hive/ui',
    '@hive/core',
    '@hive/hooks',        // ADD
    '@hive/auth-logic',   // ADD
    '@hive/firebase',     // ADD
    '@hive/validation',   // ADD
  ],
},
```

**Impact:** 5-10% faster builds via tree-shaking

#### 2. Tighten Tailwind Content Paths

```javascript
// apps/web/tailwind.config.ts
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  // Be specific instead of catching all UI
  '../../packages/ui/src/design-system/**/*.{tsx,ts}',
  '../../packages/ui/src/components/hivelab/**/*.{tsx,ts}',
  '../../packages/ui/src/shells/**/*.{tsx,ts}',
],
```

**Impact:** 2-3% faster CSS scanning

#### 3. Dev Command Optimization

```bash
# SLOW: Rebuilds all 3 apps
pnpm dev

# FAST: Single app, deps cached
pnpm --filter=@hive/web dev

# PACKAGE CHANGED: Rebuild then dev
pnpm build --filter=@hive/ui && pnpm --filter=@hive/web dev
```

---

## Agent Cost Optimization

### Token Budget Strategy

| Task Type | Recommended Agent | Token Cost |
|-----------|-------------------|------------|
| Page review | fix-todos | Low (orchestration) |
| Quick fix | component-smith | Low (implementation) |
| Lab experiment | storybook-lab | Medium (4-5 variants) |
| Animation work | motion-engineer | Low (targeted) |
| Strategic decision | yc-cofounder | Medium (analysis) |

### Caching Strategy

```
CACHE: DECISIONS.md lookups (already locked choices)
CACHE: Component-to-page mappings (static)
CACHE: Token definitions (CSS variables)
NO CACHE: Page audit results (live inspection)
NO CACHE: Issue logs (accumulating)
```

---

## Parallel Execution Opportunities

### What CAN Run in Parallel

```
During single-page review:
├─ Browser inspection (visual)
├─ Storybook comparison (specs)
└─ hive-design checklist audit

Between pages:
├─ Update DECISIONS.md
├─ Update DESIGN_SYSTEM_TODOS.md
└─ Prepare next page context
```

### What MUST Be Sequential

```
1. Page reviews (context-dependent)
2. Component labs (one at a time - but already locked!)
3. Lock-to-implementation (decision → code → verify)
```

---

## Session Metrics

### Track Per Session

| Metric | Target | Why |
|--------|--------|-----|
| Pages reviewed | 5-8/hour | Momentum |
| Issues logged | 10-15/session | Discovery |
| Quick fixes | 5-10/session | Progress |
| Layouts locked | 3-5/session | Architecture |

### Track Per Page

| Metric | Target | Why |
|--------|--------|-----|
| Audit time | <5 min | Don't overthink |
| Decision time | <2 min | Quick routing |
| Fix time (quick) | <3 min | Ship fast |

---

## Handoff Protocols

### fix-todos → component-smith

```
WHEN: Quick fix identified
CONTEXT: Page route, component name, violation type
ACTION: Implement fix following hive-design rules
VERIFY: Check Storybook + live page
```

### fix-todos → storybook-lab

```
WHEN: Design decision needed (RARE - most locked)
CONTEXT: Component, variable to test, page usage
ACTION: Create 4-5 variants in experiments/
VERIFY: User selects winner → Lock → Implement
```

### component-smith → motion-engineer

```
WHEN: Animation needed
CONTEXT: Component, interaction type, purpose
ACTION: Use motion tokens (300ms, ease-smooth)
VERIFY: prefers-reduced-motion supported
```

---

## Session Checklist

### Before Session

- [ ] Read `docs/design-system/DECISIONS.md` (locked choices)
- [ ] Check `docs/PAGE_REBUILD_PLAN.md` (current progress)
- [ ] Start dev server: `pnpm --filter=@hive/web dev`
- [ ] Start Storybook: `pnpm storybook:dev`
- [ ] Open browser to localhost:3000
- [ ] Open Storybook to localhost:6006

### During Session

- [ ] Use `/fix-todos start <slice>` to begin
- [ ] Use `/fix-todos page <route>` for each page
- [ ] Run visual audit with hive-design checklist
- [ ] Log issues with `/fix-todos issue`
- [ ] Record layouts with `/fix-todos layout`
- [ ] Mark complete with `/fix-todos done`

### After Session

- [ ] Review issues logged
- [ ] Commit any quick fixes
- [ ] Update DECISIONS.md if new locks made
- [ ] Run `/fix-todos summary` for report

---

## Emergency Protocols

### If Storybook Won't Start

```bash
pkill -f storybook
rm -rf node_modules/.cache/storybook
pnpm storybook:dev
```

### If Dev Server Slow

```bash
# Kill everything
pkill -f "next dev"

# Clear Next.js cache
rm -rf apps/web/.next

# Restart single-app
pnpm --filter=@hive/web dev
```

### If Build Fails

```bash
# Full clean rebuild
pnpm clean && pnpm install && pnpm build
```

---

## Success Criteria

### Per Session (2-3 hours)

- [ ] 10-15 pages reviewed
- [ ] All P0 pages in current slice complete
- [ ] 5+ quick fixes implemented
- [ ] 0 regressions introduced
- [ ] Progress updated in PAGE_REBUILD_PLAN.md

### Per Slice

- [ ] All pages reviewed
- [ ] Layout decisions locked
- [ ] High-priority components refined
- [ ] DECISIONS.md updated

### Full Rebuild

- [ ] 46 pages reviewed
- [ ] 6 slices complete
- [ ] All layouts locked
- [ ] Component refinement queue cleared

---

*Last updated: Jan 12, 2026*
