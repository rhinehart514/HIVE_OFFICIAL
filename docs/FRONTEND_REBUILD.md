# Frontend Rebuild Checklist

**Status:** Phase 1 complete, Phase 2 ready
**IA Status:** Frozen (52 routes, enforcement tests passing)
**Last Updated:** January 2026

---

## Reference Documents

| Level | Document | Purpose |
|-------|----------|---------|
| 0 | `design-system/WORLDVIEW.md` | What we believe |
| 1 | `design-system/PHILOSOPHY.md` | How it feels |
| 2 | `design-system/PRINCIPLES.md` | Rules that guide |
| 3 | `design-system/LANGUAGE.md` | Visual vocabulary |
| 4 | `design-system/SYSTEMS.md` | Composed patterns |
| 5 | `design-system/PRIMITIVES.md` | Atomic components |
| 6 | `design-system/COMPONENTS.md` | Composed components |
| IA | `IA_INVARIANTS.md` | Route ownership rules |
| Routes | `apps/web/src/lib/routes.manifest.ts` | Route manifest |

---

## Phase 0: Foundation Lock ✅

- [x] Run IA enforcement tests
- [x] Declare all routes in manifest
- [x] Set canonical redirects to 301
- [x] Run orphan route detection
- [x] Locate token files in `packages/tokens/src/`

---

## Phase 1: Design System Alignment

### Token Audit ✅
- [x] List all files in `packages/tokens/src/`
- [x] Read `design-system-v2.ts`
- [x] Read `colors.ts`, `colors-unified.ts`, `colors-prd-aligned.ts`
- [x] Compare token files to `LANGUAGE.md`
- [x] Document findings

**Token Files Found (24 files):**
```
design-system-v2.ts     # Canonical - colors, spacing, typography, animation
colors.ts               # Warm dark palette ("3am room")
colors-unified.ts       # Foundation/semantic/component structure
colors-prd-aligned.ts   # Vercel-inspired monochrome
colors-refined.ts       # Additional refinements
monochrome.ts           # 99% grayscale system
layout.ts               # Max-widths, breakpoints, shells
patterns.ts             # Glass, cards, buttons, inputs
motion.ts               # Springs, stagger, micro-interactions
ide.ts                  # HiveLab-specific tokens
index.ts                # Main exports
+ 13 utility/generator files
```

**Findings - Token vs LANGUAGE.md Comparison:**

| Token | LANGUAGE.md | design-system-v2.ts | Status |
|-------|-------------|---------------------|--------|
| bgBase | #0A0A09 (warm) | #0A0A0A (neutral) | ⚠️ Mismatch |
| bgSurface | #141312 (warm) | #141414 (neutral) | ⚠️ Mismatch |
| textPrimary | #FAF9F7 | #FAFAFA | ⚠️ Minor diff |
| gold | #FFD700 | #FFD700 | ✅ Match |
| focus-ring | rgba(255,255,255,0.50) | rgba(255,255,255,0.50) | ✅ Match |
| duration-smooth | 300ms | 250ms | ⚠️ Mismatch |
| ease-smooth | cubic-bezier(0.22,1,0.36,1) | cubic-bezier(0.25,0.1,0.25,1) | ⚠️ Mismatch |
| font-display | Clash Display | Geist Sans | ❌ Missing Clash |

**Issues to Resolve:**
1. Multiple color files with conflicting warm/neutral values
2. Typography missing Clash Display font
3. Motion timing/easing differs from LANGUAGE.md spec
4. Need consolidation to single source of truth

### Primitive Audit ✅
- [x] List all files in `packages/ui/src/design-system/primitives/`
- [x] Read Button component
- [x] Read Card component
- [x] Read Input component
- [x] Compare to SYSTEMS.md specs
- [x] Document findings

**Primitives Inventory (150+ exports, 14 phases):**
- Phase 1-3: Typography (DisplayText, Heading, Text, Mono, Label, Link)
- Phase 4: Inputs (Button, Input, Select, Checkbox, Switch, Radio, OTPInput)
- Phase 5: Feedback (Modal, Toast, Tooltip, Progress, Skeleton, EmptyState)
- Phase 6: Navigation (Tabs, Avatar, Badge, Tag)
- Phase 7: Life (PresenceDot, ActivityEdge, LiveCounter, TypingIndicator)
- Phase 8: Workshop (PropertyField, CanvasArea, HandleDot)
- Phase 9: Layout (Container, Stack, Grid, Spacer, Section)
- Phase 10: Landing (Hero, Feature, Footer, LandingNav)
- Phase 11: Motion (Tilt, Parallax, TextReveal, Stagger)
- Phase 12: Mobile Nav (BottomNav, CategoryScroller)
- Phase 13: Space (SpacePreviewSheet, MemberCard, SpaceModeNav)
- Phase 14: HiveLab (TemplateScroller, DeploymentTarget, ElementGroup)
- Phase 15: Profile (ProfileBentoGrid, ConnectionStrengthIndicator)

**Component vs SYSTEMS.md Comparison:**

| Component | SYSTEMS.md Spec | Implementation | Status |
|-----------|-----------------|----------------|--------|
| Button | White primary CTA, gold rare | White primary, NO gold | ✅ Match |
| Button focus | White ring | ring-white/30 | ✅ Match |
| Card | Warmth via border only | border-gold/10-30% | ✅ Match |
| Card surface | --surface-card | bg-[#0A0A0A] | ⚠️ Different |
| Input | Subtle border | border-white/10 | ✅ Match |
| Input focus | White ring | ring-white/20 | ✅ Match |

All three marked "REFINED: Jan 29, 2026 - Matches /about aesthetic"

### Component Audit ✅
- [x] List all files in `packages/ui/src/design-system/components/`
- [x] Identify components with "Legacy" or "Old" in name
- [x] Identify components with "IDE" prefix
- [x] Document component inventory

**Component Categories (1000+ lines in index.ts):**
- Layout: OrientationLayout
- Cards: SpaceCard, GhostSpaceCard, EventCard, ProfileCard (5 variants), ToolCard
- Chat: ChatMessage, MessageGroup, ReactionPicker, ChatComposer, ThreadDrawer
- Navigation: TopNavBar, CommandBar, CommandPalette, TopBar, TabNav, BoardTabs
- Forms: ImageUploader, SearchInput, FormField, DatePicker, TagInput, NumberInput
- Data: DataTable, StatCard
- Feedback: EmptyState, ErrorState, LoadingOverlay
- Space: SpaceHub, ModeCard, TheaterChatBoard, EventsMode, ToolsMode, MembersMode
- Profile: ProfileIdentityHero, ProfileActivityCard, ProfileLeadershipCard (3-zone layout)
- Modals: AddTabModal, MemberInviteModal, EventCreateModal, ChatSearchModal

**Legacy Components Found (3):**
1. `ProfileCardLegacy` - deprecated, use context-specific variants
2. `ProfileBentoCard` / `ProfileBentoCardLegacy` - legacy widget style
3. `element-renderers-legacy.tsx` - in hivelab directory

### HiveLab Audit ✅
- [x] List all IDE-prefixed components
- [x] Read each IDE component
- [x] Compare to unified primitives
- [x] Document findings

**IDE Components (12 files in `/components/hivelab/ide/`):**
```
ide-button.tsx      # IDEButton - uses own variants, NOT unified Button
ide-input.tsx       # IDEInput - uses own variants, NOT unified Input
ide-panel.tsx       # IDEPanel, IDEPanelHeader, IDEPanelContent, IDEPanelFooter
ide-section.tsx     # IDESection
ide-canvas.tsx      # IDECanvas - main canvas component
ide-toolbar.tsx     # IDEToolbar
hivelab-ide.tsx     # Main HiveLabIDE component
HiveLabContext.tsx  # IDE state management
```

**HiveLab Token Isolation:**
- Uses `packages/tokens/src/ide.ts` for IDE-specific tokens
- Exports: IDE_TOKENS, ideSurface, ideBorder, ideText, ideInteractive
- NOT using unified primitives - intentional "workshop" aesthetic (per SYSTEMS.md)

**Integration Status:**
- IDE components re-exported via `design-system/components/index.ts`
- Tokens exported via `packages/tokens/src/index.ts`
- Isolated by design: "Workshop atmosphere - zero effects, pure function"

---

## Phase 2: Critical Path Screens

### Entry Flow
| Route | Task |
|-------|------|
| `/` | Read current implementation |
| `/` | Compare to INSTANCES.md spec |
| `/login` | Read current implementation |
| `/enter` | Read current implementation |
| `/schools` | Read current implementation |

### Home Surface
| Route | Task |
|-------|------|
| `/home` | Read current implementation |
| `/home` | Compare to route manifest ownership |

### Spaces Flow
| Route | Task |
|-------|------|
| `/spaces` | Read current implementation |
| `/s/[handle]` | Read current implementation |
| `/s/[handle]/tools/[toolId]` | Read current implementation |
| `/s/[handle]/analytics` | Read current implementation |

### Identity Flow
| Route | Task |
|-------|------|
| `/u/[handle]` | Read current implementation |
| `/me` | Read current implementation |
| `/me/edit` | Read current implementation |
| `/me/settings` | Read current implementation |

### Discovery Flow
| Route | Task |
|-------|------|
| `/explore` | Read current implementation |

---

## Phase 3: Builder Surfaces

| Route | Task |
|-------|------|
| `/lab` | Read current implementation |
| `/lab/new` | Read current implementation |
| `/lab/[toolId]` | Read current implementation |
| `/lab/[toolId]/edit` | Read current implementation |
| `/lab/[toolId]/preview` | Read current implementation |
| `/lab/[toolId]/deploy` | Read current implementation |
| `/lab/[toolId]/settings` | Read current implementation |
| `/lab/[toolId]/analytics` | Read current implementation |

---

## Phase 4: Secondary Surfaces

| Route | Task |
|-------|------|
| `/calendar` | Read current implementation |
| `/me/calendar` | Read current implementation |
| `/notifications` | Read current implementation |
| `/me/notifications` | Read current implementation |
| `/notifications/settings` | Read current implementation |
| `/settings` | Read current implementation |
| `/feed` | Read current implementation |
| `/feed/settings` | Read current implementation |
| `/resources` | Read current implementation |
| `/leaders` | Read current implementation |
| `/rituals` | Read current implementation |
| `/rituals/[slug]` | Read current implementation |
| `/templates` | Read current implementation |
| `/profile/[id]` | Read current implementation |
| `/profile/edit` | Read current implementation |
| `/profile/connections` | Read current implementation |
| `/me/connections` | Read current implementation |

---

## Phase 5: Utility Surfaces

| Route | Task |
|-------|------|
| `/about` | Read current implementation |
| `/legal/privacy` | Read current implementation |
| `/legal/terms` | Read current implementation |
| `/legal/community-guidelines` | Read current implementation |
| `/offline` | Read current implementation |
| `/design-system` | Read current implementation |
| `/elements` | Read current implementation |
| `/hivelab` | Read current implementation |
| `/hivelab/demo` | Read current implementation |

---

## Phase 6: State Transitions

| Transition | Task |
|------------|------|
| Profile edit → save | Trace data flow |
| Notification → acknowledge → clear | Trace state changes |
| Calendar item lifecycle | Trace state changes |
| Connection lifecycle | Trace state changes |
| Space join/leave | Trace state changes |
| Tool draft → deploy | Trace state changes |
| Onboarding flow | Trace state changes |

---

## Phase 7: Motion & Feedback

- [ ] Read SYSTEMS.md Motion section
- [ ] Read LANGUAGE.md Motion section
- [ ] Audit page transitions
- [ ] Audit component entrance animations
- [ ] Audit loading states
- [ ] Audit success feedback
- [ ] Audit error feedback
- [ ] Audit hover/focus states
- [ ] Audit presence indicators

---

## Phase 8: Verification

- [ ] Run all routes
- [ ] Run IA enforcement tests
- [ ] Run typecheck
- [ ] Audit empty states
- [ ] Audit loading states
- [ ] Audit error states
- [ ] Run accessibility audit

---

## Rules During Rebuild

1. IA is frozen - no new routes without invariant review
2. Reference existing docs - read before writing
3. Use tokens from `design-system-v2.ts`
4. Create Storybook story before using component in page
5. Mark component status: STUBBED / WIRED / COMPLETE / PRODUCTION-READY
6. Implement empty state for each component
7. Implement loading state for async components
8. Implement error state for fallible components

---

## Progress Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 0 - Foundation Lock | ✅ Complete | 2026-01-30 | 2026-01-30 |
| 1 - Design System Alignment | ✅ Complete | 2026-01-30 | 2026-01-30 |
| 2 - Critical Path | Ready | | |
| 3 - Builder Surfaces | Not started | | |
| 4 - Secondary Surfaces | Not started | | |
| 5 - Utility Surfaces | Not started | | |
| 6 - State Transitions | Not started | | |
| 7 - Motion & Feedback | Not started | | |
| 8 - Verification | Not started | | |

---

## Required Tests

```bash
# IA Enforcement
pnpm --filter=@hive/web test src/test/ia-enforcement

# Typecheck
pnpm typecheck
```
