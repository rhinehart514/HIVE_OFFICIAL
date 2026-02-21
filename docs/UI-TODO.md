# UI-TODO.md — Foundations, Components, Patterns
**Last updated:** 2026-02-21
**Scope:** Design system refinement. Build what's missing. Fix what's wrong. Define what's ambiguous.
**Rules:** Before touching any UI, read `docs/DESIGN_RULES.md`.

---

## FOUNDATIONS

These define everything. Fix these first — every component inherits them.

### Tokens
- [ ] **Fix radius token collision** — `--radius-md` and `--radius-lg` are both 12px. Resolve: set `--radius-md: 10px`, keep `--radius-lg: 12px`. Update all consuming components.
- [ ] **Declare icon standard** — Document in `DESIGN_RULES.md`: Heroicons, stroke-width 1.5, 20px default size, 16px compact, 24px large. No other icon library.
- [ ] **Define app grid** — 12-column, 24px gutter, 4 breakpoints (sm/md/lg/xl). Add to tokens as CSS vars. Consuming pages currently freehand their spacing.
- [ ] **Enable glow shadows** — `--shadow-glow-sm/md/lg` are defined but all set to `none`. Wire to `--life-pulse`. Enable only for: featured tool cards, active space cards, Lab entry button.
- [ ] **Audit `--duration-breathe` and `--duration-drift`** — Both set to `0ms`. Intentional? If killing breathe/drift animations, document why. If not, set real values.
- [ ] **Document foundations in Storybook** — Foundations checklist in `src/foundations/Foundations.Checklist.mdx` is all unchecked. Fill it out. Token docs story, typography reference, spacing reference, motion reference.

### Typography
- [ ] **Verify Clash Display loads everywhere** — Confirm `--font-clash` is available in production builds. Check web font loading strategy (local vs CDN).
- [ ] **Cap Display usage** — Clash Display is for h1, h2, hero text, and DisplayText component ONLY. h3 and below use Geist. Audit pages for violations.

### Gold Budget
- [ ] **Audit gold usage across the app** — Find all instances of `--life-gold`, `#FFD700`, `text-yellow-*` in components. Flag anything that violates the rules in `DESIGN_RULES.md §3`.
- [ ] **Remove gold from focus rings** — Search for `focus:ring-yellow`, `focus:ring-gold`, `focus-visible:ring-[#FFD700]`. Replace all with `focus-visible:ring-white/50`.

---

## COMPONENTS

Ordered by impact. Each item has a clear action.

### 🔴 Critical — Fix or Build Now

**ToolCard — replace hover state**
- [ ] Current: `hover:opacity-90` — too passive for the hero component
- [ ] Replace with `glow-effect` from `packages/ui/src/components/motion-primitives/glow-effect.tsx`
- [ ] Tune to subtle (not the full Magic UI default intensity)
- [ ] Keep `hover:opacity-90` as fallback for `prefers-reduced-motion`
- [ ] File: `packages/ui/src/design-system/components/ToolCard.tsx`

**ToolCard — wire warmth to useCount recency**
- [ ] SpaceCard has warmth from online users. ToolCard only has warmth for `featured`/`trending` status badges.
- [ ] Add: calculate warmth from `useCount` + `lastUsedAt`. Tool used today = `warmth="medium"`. Tool used this week = `warmth="low"`. Tool unused >30 days = `warmth="none"`.
- [ ] Add `lastUsedAt?: Date` to `ToolCardProps`
- [ ] Add `getWarmthFromToolActivity(useCount, lastUsedAt)` helper (parallel to `getWarmthFromActiveUsers`)
- [ ] File: `packages/ui/src/design-system/components/ToolCard.tsx`

**ToolCardAtom — kill it**
- [ ] `ToolCardAtom.tsx` is a legacy duplicate. Audit its usages.
- [ ] Migrate any consumers to `ToolCard` (compact variant)
- [ ] Delete `ToolCardAtom.tsx`

**ProfileCardFull — redesign**
- [ ] Current: portrait card (`w-36 h-48`) with large avatar = maroon gradient card. Wrong direction.
- [ ] New direction: slim horizontal header — avatar 48px circle, name + handle + bio one-liner, stat row, action buttons
- [ ] Keep all existing `ProfileUser` type fields — no data changes needed
- [ ] Keep Connect (gold text) + Message buttons — just in a horizontal bar, not stacked
- [ ] File: `packages/ui/src/design-system/components/ProfileCard.tsx` → `ProfileCardFull`

**StatAtom — add Number Ticker animation**
- [ ] Current: static number renders instantly
- [ ] Add count-up animation on mount using `animated-number.tsx` (already in `packages/ui/src/components/motion-primitives/animated-number.tsx`)
- [ ] Animation only fires once on mount, not on every re-render
- [ ] Respect `prefers-reduced-motion` — skip animation if reduced motion
- [ ] File: `packages/ui/src/design-system/primitives/StatAtom.tsx`

### 🟠 High — Define and Build

**UniversalNav — token-compliant rebuild**
- [ ] Current: active state uses ad-hoc classnames, not token system. Lab item looks identical to Feed.
- [ ] New active state: full-opacity icon + text (`--text-primary`). Inactive: `--text-muted` (40% opacity). No pill backgrounds except on Lab item.
- [ ] Lab item: `--life-gold` left-border accent (1px), icon in `--life-gold`, slightly larger icon (22px vs 20px)
- [ ] Add visual separator above Lab item and below it (hairline `--border-subtle`)
- [ ] Wire active detection to token system — `isActive` → set CSS vars, not hardcoded classes
- [ ] File: `packages/ui/src/navigation/UniversalNav.tsx`

**ProfileActivityHeatmap — verify and wire**
- [ ] Component exists at `packages/ui/src/design-system/components/profile/ProfileActivityHeatmap.tsx` — built and real
- [ ] Verify: gold at intensity 3-4, warm grayscale at 1-2, subtle grid at 0 ✓ (already correct)
- [ ] Verify: is it wired to real activity data on the profile page?
- [ ] If not wired: connect to user's tool creation + execute events from Firestore
- [ ] Add to ProfilePage organism (see Patterns below)

**SpaceCard — surface mutual spaces label**
- [ ] `mutualCount` prop exists and renders "X you know" in gold when > 0
- [ ] Verify: is `mutualCount` being calculated and passed from the profile page?
- [ ] If not: implement mutual spaces query — `currentUser.spaces ∩ profileUser.spaces`
- [ ] This is the entire social layer before follows exist — highest social ROI

**AvatarGroup — define max display rule**
- [ ] Current: no enforced cap on how many avatars show
- [ ] Rule: max 3 avatars visible, then "+N" overflow chip in `--bg-elevated`
- [ ] File: `packages/ui/src/design-system/primitives/AvatarGroup.tsx`

### 🟡 Medium — Refine Existing

**Badge — SpaceHealthBadge audit**
- [ ] `SpaceHealthBadge` is the best component in the system. Verify `dormant→quiet→active→thriving` thresholds are correct.
- [ ] Should ToolCard have a parallel `ToolHealthBadge`? (usage velocity instead of online count)
- [ ] If yes: build `ToolHealthBadge` with levels: `unused → occasional → active → viral`

**Button — shimmer variant for Lab CTA**
- [ ] `border-beam` and `shimmer-button` exist in motion-primitives
- [ ] Apply `shimmer-button` treatment to the primary "Create Tool" / "Open Lab" CTA only
- [ ] This is the one place Magic UI shimmer is approved outside of achievement moments
- [ ] Do not apply to any other buttons

**Card — document warmth API**
- [ ] The warmth system is HIVE's fingerprint — inset gold edge glow from `getWarmthFromActiveUsers()`
- [ ] Add JSDoc to `Card` primitive with warmth usage examples
- [ ] Ensure `warmth` prop is correctly typed and documented
- [ ] File: `packages/ui/src/design-system/primitives/Card.tsx`

**Switch, Checkbox, Radio — token audit**
- [ ] These use Radix UI underneath but may have drifted from HIVE token system
- [ ] Audit: focus rings white? Active states use `--interactive-active`? No gold on form controls?
- [ ] Fix any violations found

**Input / Textarea — audit focus state**
- [ ] Focus border should be `--border-focus` (white 50%), not gold
- [ ] Check `15px` input text size is honored (LOCKED design decision)
- [ ] Verify placeholder opacity is `--text-tertiary`

### 🟢 Low — When Time Allows

**sparkles-text — restrict deployment**
- [ ] `sparkles-text.tsx` exists in motion-primitives
- [ ] Currently: unknown how widely deployed
- [ ] Audit: should only appear on first tool creation + milestone achievements
- [ ] Remove from any nav items, headers, or section labels if present

**border-beam — restrict deployment**
- [ ] `border-beam.tsx` exists in motion-primitives
- [ ] Approved uses: Lab entry button, featured ToolCard only
- [ ] Audit and remove from any other usage

**PresenceDot — verify all status colors**
- [ ] `online`: `--status-success` (green)
- [ ] `away`: `--status-warning` (amber)
- [ ] `dnd`: `--status-error` (red)
- [ ] `offline`: `--text-ghost` (near-invisible)
- [ ] Confirm ring treatment uses correct background color token

---

## PATTERNS (Organisms)

These compose components into screens. Build after components are stable.

### 🔴 Build: ProfilePage organism
- [ ] Replace current `ProfileCardFull` portrait layout with:
  - Slim header: 48px avatar + name + handle + one-line bio + action buttons
  - Stat row: `StatAtom` with Number Ticker for Tools Built, Views, Spaces
  - Spaces row: horizontal scroll of `SpaceCard` compact variant with "3 mutual spaces" indicator
  - ToolGrid: 2-col bento (see below)
  - `ProfileActivityHeatmap`: gold squares, 90-day window (component already built)
- [ ] Hide zero stats — don't show "0 Spaces" or "0 Connections"
- [ ] "Mutual spaces" under avatar when viewing someone else's profile

### 🔴 Build: ToolGrid pattern
- [ ] No pattern exists for composing ToolCards into a grid
- [ ] 2-column bento layout
- [ ] First 2 slots are "pinned" — visually elevated, larger
- [ ] Remaining tools sorted by `useCount` desc
- [ ] "Open Lab →" link in header of section
- [ ] Empty state: "No tools yet — open Lab to build your first" with shimmer CTA

### 🟠 Refine: UniversalNav (see Components above)

### 🟠 Verify: SpacePanel token compliance
- [ ] `SpacePanel.tsx` exists in design-system/components
- [ ] Audit for token violations (hex values, focus ring colors, gold usage)
- [ ] Verify warmth system is wired to online count

---

## DONE — Do Not Redo
- ✅ ToolCard — built and locked (Jan 2026)
- ✅ ProfileCard — 5 context variants built (Jan 2026)
- ✅ SpaceCard — territory system + warmth + "X you know" (Jan 2026)
- ✅ StatCard — sparklines, trend indicators (Jan 2026)
- ✅ ProfileActivityHeatmap — gold squares, real implementation
- ✅ border-beam, shine-border, glow-effect, sparkles-text — pulled into motion-primitives
- ✅ All motion variants + spring presets — in `@hive/tokens`
- ✅ Glass surface primitives — GlassSurface, GlassPanel, GlassOverlay
- ✅ Arrival transitions — ArrivalTransition + ArrivalZone
- ✅ Auth flow — EmailInput, OTPInput, AuthShell
- ✅ Design system documentation — DESIGN_SYSTEM.md (comprehensive)
- ✅ Agent build rules — DESIGN_RULES.md (added 2026-02-21)
