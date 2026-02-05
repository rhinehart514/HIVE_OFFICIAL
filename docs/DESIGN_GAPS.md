# Design Gaps

What's missing or incomplete in the design system.

**Last Updated:** 2026-02-01

---

## Health Summary

| Layer | Status | Notes |
|-------|--------|-------|
| Information Architecture | ✅ 100% | Frozen - 52 routes, CI enforcement |
| Tokens | ✅ 95% | `design-system-v2.ts` canonical, needs consolidation |
| Primitives | ✅ 90% | 123 components, missing DatePicker/TimePicker/ColorPicker |
| Components | 🔄 85% | 194 components, HiveLab isolated, legacy profile exists |
| Documentation | 🔄 80% | Strong foundations, COMPONENTS.md incomplete |
| Layout Systems | ⚠️ 30% | No grid system, no density modes |
| Interaction Patterns | ⚠️ 40% | Button states inconsistent, keyboard nav incomplete |
| Motion Implementation | ⚠️ 20% | Defined in docs, not fully implemented |
| Empty States | ⚠️ 40% | Treated as bugs, not opportunities |

---

## Information Architecture ✅

**Status:** COMPLETE and FROZEN

**Done:**
- [x] Site map with page hierarchy
- [x] Navigation model documented (`IA_INVARIANTS.md`)
- [x] URL structure standardized
- [x] Route manifest with ownership rules (`routes.manifest.ts`)
- [x] CI enforcement tests (301 redirects, orphan detection, import boundaries)
- [x] 52 routes declared with friction weights

**Frozen - Changes require:**
- Invariant review
- Manifest update
- Test verification

---

## Token System ✅

**Status:** 95% complete

**Done:**
- [x] `design-system-v2.ts` as canonical source
- [x] Color system (12-step scales, semantic tokens)
- [x] Typography scale (10 sizes, Geist)
- [x] Spacing scale (4px base, 0.5-96)
- [x] Motion tokens (5 duration tiers, easings)
- [x] Component tokens (button, card, input, avatar, badge, presence)
- [x] CSS variable generation
- [x] IDE tokens for HiveLab isolation (`ide.ts`)

**Needs:**
- [ ] Consolidate redundant color files (4 files with conflicting values)
- [ ] Add Clash Display font (specified in LANGUAGE.md, missing in tokens)
- [ ] Align warm tints (#0A0A09) vs neutral (#0A0A0A) across files
- [ ] Explicit density mode tokens (compact/comfortable/spacious)
- [ ] Container width standards

---

## Primitives ✅

**Status:** 90% complete (123 components)

**Has:**
- [x] Visual: Card, Avatar, Badge, PresenceDot, ActivityEdge, Icon, Separator
- [x] Typography: DisplayText, Heading, Text, Mono, Label, Link
- [x] Input: Button, Input, Textarea, Select, Checkbox, Switch, Radio, OTPInput
- [x] Feedback: Modal, Toast, Tooltip, Progress, Skeleton, Alert, Spinner
- [x] Navigation: Tabs, Breadcrumb, Pagination, BottomNav
- [x] Layout: Stack, Grid, Spacer, Container, ScrollArea
- [x] Life System: PresenceDot, ActivityEdge, TypingIndicator, LiveCounter

**Missing:**
- [ ] DatePicker
- [ ] TimePicker
- [ ] ColorPicker

---

## Components 🔄

**Status:** 85% complete (194+ components)

**Has:**
- Data Display: SpaceCard, ProfileCard (5 variants), EventCard, ToolCard, DataTable
- Forms: FormField, ImageUploader, TagInput, SearchInput, DatePicker
- Chat: ChatMessage, ChatComposer, ReactionPicker, ThreadDrawer
- Navigation: TopNavBar, CommandPalette, CommandBar, BoardTabs
- Spaces: SpaceHub, ModeCard, TheaterChatBoard, MembersList
- Profile: ProfileIdentityHero, ProfileActivityCard, ProfileLeadershipCard (3-zone)

**Issues:**
- [x] HiveLab IDE components isolated - INTENTIONAL per SYSTEMS.md "workshop aesthetic"
- [ ] Legacy profile components still in use (ProfileBentoCard, ProfileCardLegacy)
- [ ] No formal component status tracking (STUBBED/WIRED/COMPLETE)
- [ ] Missing: Timeline, Tree, Diff viewers

---

## Documentation 🔄

**Status:** 80% complete

**Complete:**
- [x] WORLDVIEW.md
- [x] PHILOSOPHY.md
- [x] PRINCIPLES.md (VA principles)
- [x] LANGUAGE.md (tokens)
- [x] SYSTEMS.md (composed patterns)
- [x] PRIMITIVES.md (21 detailed primitives)
- [x] IA_INVARIANTS.md
- [x] VOICE.md

**Incomplete:**
- [ ] COMPONENTS.md (started, only MinimalSidebar documented)
- [ ] Storybook organization matching design system hierarchy

---

## Layout Systems ⚠️

**Status:** 30% complete

**Exists:**
- [x] Spacing scale (4/8/12/16/24/32)
- [x] Container tokens in design-system-v2.ts

**Missing:**
- [ ] Grid system (columns, gutters, margins)
- [ ] Density modes (compact/comfortable/spacious as context)
- [ ] Responsive behavior per breakpoint
- [ ] Page template library
- [ ] Sidebar/panel patterns

---

## Interaction Patterns ⚠️

**Status:** 40% complete

**Exists:**
- [x] Modal/Dialog
- [x] Toast/Notifications
- [x] Some hover states

**Missing:**
- [ ] Button states audit (verify disabled/loading across all variants)
- [ ] Selection patterns (single, multi, range)
- [ ] Keyboard navigation model
- [ ] Touch gesture vocabulary
- [ ] Loading state patterns (skeleton vs spinner vs progressive)
- [ ] Error state patterns (inline vs toast vs page-level)

---

## Motion Implementation ⚠️

**Status:** 20% implemented (defined in docs)

| Tier | Definition | Implementation |
|------|------------|----------------|
| T1 (500-700ms) | Achievements, celebrations | ❌ Not used |
| T2 (300ms) | Standard interactions | 🔄 Partial |
| T3 (150ms) | Hovers, toggles | 🔄 Partial |
| T4 (0-50ms) | Reduced motion | ❌ Missing |

**Missing:**
- [ ] Motion token system applied consistently
- [ ] Entrance/exit patterns
- [ ] Celebration moments (T1)
- [ ] Reduced motion support (`prefers-reduced-motion`)
- [ ] Scroll-linked animations

---

## Empty States ⚠️

**Status:** 40% complete

Every surface needs three empty states:
1. **New user** (never had content)
2. **Filtered** (had content, filter excludes it)
3. **Cleared** (had content, now empty)

| Surface | Status | Notes |
|---------|--------|-------|
| Feed | ❌ Generic | Needs onboarding prompt |
| Spaces | ❌ Generic | Needs "Your spaces appear here" + CTA |
| Space Chat | ❌ Blank | Needs "Start the conversation" |
| Profile | ❌ Empty sections | Needs completion prompts |
| Notifications | 🔄 Partial | Needs "You're caught up" |
| HiveLab | ❌ Generic | Needs "Create your first tool" |
| Calendar | ❌ Empty | Needs "No events this week" + CTA |
| Search | ❌ Generic | Needs suggestions |

---

## Prioritized Actions

### Must Do (Blocking rebuild)

1. **Complete COMPONENTS.md** - Catalog all 194+ components
2. ~~Fix HiveLab isolation~~ - INTENTIONAL: IDE uses separate tokens per SYSTEMS.md
3. **Add component status** - Mark STUBBED/WIRED/COMPLETE/PRODUCTION-READY
4. **Consolidate token files** - Resolve conflicts between 4 color files

### Should Do (High value)

5. **Add Clash Display font** - Missing from tokens, specified in LANGUAGE.md
6. **Implement motion tokens** - Apply SYSTEMS.md motion spec
7. **Add reduced motion support** - `prefers-reduced-motion` queries
8. **Design empty states** - Per INSTANCES.md patterns
9. **Migrate legacy profile** - Remove ProfileBentoCard, ProfileCardLegacy

### Nice to Have

9. **Add Timeline/Tree/Diff** - Data visualization primitives
10. **Create DatePicker/TimePicker/ColorPicker** - Form primitives
11. **Add density modes** - Context-based spacing (compact/comfortable/spacious)
12. **Storybook organization** - Match 10-level design system hierarchy
