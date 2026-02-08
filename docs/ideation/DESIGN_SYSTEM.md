# HIVE Design System: Ideation & Evolution

Current grade: A- (90/100). What follows is not a fix-it list -- it is a strategic document for making the design system flawless. Each section presents concrete options with consequences, grounded in what actually exists in the codebase today.

---

## 1. Visual Identity Evolution

### The Current Identity

HIVE's visual identity is **monochrome + gold on void**. The page background is `#0A0A0A`, cards are `#141414`, and gold (`#FFD700`) appears only at dopamine moments -- achievements, presence indicators, primary CTAs. This is codified in `packages/tokens/src/monochrome.ts` with explicit "allowed" and "forbidden" lists, and reinforced in `packages/tokens/src/design-system-v2.ts` where the guidelines object literally says `'Light mode'` is an anti-pattern.

The warmth spectrum in `monochrome.ts` (`empty -> quiet -> active -> live`) is genuinely original. Spaces get warmer backgrounds as activity increases -- `#0A0A0A` shifts to `#0D0B08` with subtle gold glow at 6% opacity. No competitor does this.

### Competitor Positioning

| Platform | Identity | Strength | Weakness |
|----------|----------|----------|----------|
| Discord | Dark purple/blurple, chaotic color per server | Feels alive, community-native | Overwhelming, cluttered, "gamer" connotation |
| Slack | Colorful sidebar, white-dominant content | Professional, approachable | Corporate, aging, not for students |
| Notion | Minimal, light-dominant, one accent color | Clean, intellectual | Cold, solitary, tool-not-community |
| Linear | Monochrome + purple, dark-first | Precise, premium | Too engineering-focused, intimidating |
| Luma | White-dominant, soft gradients | Event-forward, beautiful | Passive, not a daily-use aesthetic |

HIVE's monochrome + gold sits closest to Linear's precision but with warmer DNA. The gold-as-reward system and warmth spectrum give it something none of these have: **the UI itself communicates social energy**.

### Options

**Option A: Stay pure monochrome + gold. Double down.**
Add more warmth spectrum levels (5 instead of 4). Introduce micro-variations in card surfaces based on space activity -- not color, but texture/grain/opacity. Gold stays surgical.

What breaks: Nothing. This is the safest path. Risk is that the platform feels cold on first impression before a student has earned any gold moments. The gap between "onboarding grayscale" and "first gold hit" might be too long.

**Option B: Introduce one secondary accent -- ice blue (`#60A5FA`) -- for informational/navigational signals only.**
Blue for notifications, unread counts, link highlights. Gold stays exclusively for achievements/CTAs. This gives the UI a second emotional register without diluting gold.

What breaks: The purity of the monochrome philosophy. You now have to document and enforce two accent color rules instead of one. The `guidelines.goldUsage` system in `colors-unified.ts` needs a parallel `blueUsage` system. Every new component decision becomes "is this gold, blue, or neither?" instead of "is this gold or not?"

**Option C: Space-scoped accent colors. Each space can choose from 8 preset accent colors that tint borders, badges, and subtle backgrounds within that space only.**
The campus-level UI stays monochrome + gold. Space interiors get personality. Implemented via CSS custom properties scoped to the space container, overriding `--hive-border-hover` and similar tokens.

What breaks: The consistent visual identity across the platform. A student bouncing between 5 spaces sees 5 different color worlds. The warmth spectrum (`monochrome.ts`) becomes harder to read against colored backgrounds. Testing matrix explodes: every component must look correct against 8+ accent colors. This is a serious engineering cost.

**Recommendation:** Option A with one steal from Option B -- use ice blue exclusively for unread/notification counts, where gold would feel wrong (gold = "you did something," blue = "something happened for you"). This is a single, narrow exception that reinforces rather than undermines the gold system.

---

## 2. Component Gaps

### What Exists (91+ primitives, 177 stories)

The primitive layer is strong. From the codebase:

**Layout:** Container, Grid, Stack, Cluster, Spacer, Section, LandingSection
**Typography:** Text, Heading, DisplayText, Mono, Label
**Data Entry:** Button, Input, EmailInput, HandleInput, OTPInput, Textarea, Select, Radio, Checkbox, Switch, Toggle, TagInput, DatePicker, NumberInput, Combobox, Slider
**Data Display:** Avatar, AvatarGroup, Badge, FeaturedBadge, Tag, Card, SelectionCard, StatCard, PostCard, FileCard, Tooltip, Separator, Progress, ProgressBar
**Feedback:** Toast, Alert, ErrorState, EmptyState, EmptyCanvas, LoadingOverlay, ConfirmDialog
**Navigation:** Tabs, TabNav, BottomNav, SpaceModeNav, Link, Pagination, SpaceSwitcher, CategoryScroller, TemplateScroller
**Overlay:** Drawer, Sheet, Popover, Dropdown, Command (palette)
**Presence/Social:** PresenceDot, PresenceIndicator, LiveIndicator, LiveCounter, TypingIndicator, WarmthDots, FriendStack, ConnectionStrengthIndicator, ActivityBar, ActivityHeartbeat, ActivityEdge, MemberList, AttendeeList
**Chat:** ChatComposer, MessageGroup, ChatRowMessage, SpaceChatBoard, ReactionPicker, MentionAutocomplete
**Space-Specific:** SpaceHeader, SpaceEntryAnimation, ModeTransition, ModeCard, MembersMode, EventsMode, ContextPill, IntentConfirmationInline, PinnedMessagesWidget, AddWidgetModal, AddTabModal, SpaceLeaderOnboardingModal, SpaceWelcomeModal, MemberInviteModal, EventCreateModal, LeaderSetupProgress, MobileActionBar, MobileDrawer
**Profile:** ProfileCard, ProfileToolModal, ProfileInterestsCard, ProfileSpacesCard, ProfileActivityHeatmap, ProfileConnectionsCard, ProfileToolsCard, ProfileStatsRow, ContextBanner
**Motion:** Glass (GlassSurface, GlassPanel, GlassOverlay, GlassPill, FrostedEdge), Reveal, ArrivalTransition, ThresholdReveal, WordReveal, BorderGlow, Scroll, ScrollTransform, Gradient, PageTransition
**Campus:** DockOrb, CampusProvider, CommandBar
**Lab/IDE:** QuickCreateWizard, ImageUploader, Slot, FormField

### What is Missing for a Campus Platform

**Calendar/Schedule View.** An `EventCalendar.stories.tsx` exists but the component itself is lightweight. Students need a week/month calendar that shows events across all their spaces. This is not a generic calendar widget -- it is a social calendar showing which friends are attending what.

**Rich Text / Block Editor.** Chat exists, but there is no announcement editor, event description editor, or long-form content composer. Spaces need to post formatted updates. Without this, space leaders fall back to plain text or external tools.

**File/Media Viewer.** `FileCard` exists but there is no document preview, PDF viewer, image gallery with lightbox, or video player. Shared resources in a space need in-app viewing.

**Data Visualization.** `ProfileActivityHeatmap` and `StatCard` exist, but there are no charts, sparklines, or trend indicators for space analytics. The admin dashboard and space leader views need these. The CSS variables in `design-system-v2.ts` define `--chart-1` through `--chart-5` but no chart components consume them.

**Kanban/Board View.** Spaces with project management needs (hackathon teams, club committees) need a drag-and-drop board. This could be built on top of the existing `Card` primitive with DnD Kit.

**Notification Center.** Toast exists for transient notifications, but there is no persistent notification list/panel component. The `Bell` icon in `AppShell.tsx` has no corresponding dropdown.

**Search Results.** Command palette exists but there is no search results page component -- a list of spaces, people, events, and tools matching a query with filtering and faceting.

**Timeline/Activity Feed.** The feed exists as chat-style messages, but there is no timeline component for event history, space activity log, or profile activity stream in a non-chat format.

### Priority Order (by user impact)

1. Calendar/Schedule (students live by schedules)
2. Rich Text Editor (space leaders need this to post)
3. Notification Center (retention driver)
4. Search Results (discovery driver)
5. File/Media Viewer (utility)
6. Data Visualization (analytics for leaders/admins)
7. Kanban Board (power feature)
8. Timeline (nice-to-have)

---

## 3. Motion Philosophy

### Current State

The motion system is the most mature part of the design system. Three tiers are defined in `packages/tokens/src/motion.ts`:

- **Micro:** 150-200ms, ease-out -- hovers, focus, toggles
- **Standard:** 300-400ms, cubic-bezier(0.23, 1, 0.32, 1) -- transitions, panels
- **Cinematic:** 500-800ms, spring/premium -- entry, celebration

Signature motions are documented: Reveal (fade + slide up), Surface (scale from 0.95 + fade), Blur transition, Stagger (50-80ms). Spring physics presets (`snappy`, `default`, `gentle`, `bouncy`, `snapNav`) are well-defined. The `tinderSprings` set for card interactions shows care for specific interaction patterns.

Framer Motion variants exist for: buttons, cards, messages, success, error shake, page transitions, modals, dropdowns, selection, and reduced motion fallbacks.

The motion library in `packages/ui/src/motion/` provides re-exports from tokens plus additional primitives, interactions, orchestration, and narrative primitives.

### Where Motion Gets Inconsistent

**Reduced motion support exists but is not enforced.** `reducedMotionVariants` is defined in tokens, and 52 files reference `prefers-reduced-motion` or `useReducedMotion`. But there is no wrapper that automatically applies reduced motion. Each component decides independently whether to respect the preference. Some use `useReducedMotion()` from Framer Motion, others use CSS media queries, others ignore it entirely.

**Heavy-data views lack motion strategy.** The feed, member lists, and chat messages use stagger animations. But when scrolling through 200+ messages or a list of 50 members, stagger animations on every item create jank. The current `staggerPresets.fast` at 30ms means 50 items take 1.5 seconds to fully render -- unacceptable for a scroll-heavy UI.

**Orchestration timing is defined but underused.** The `motion.orchestration` object in `motion.ts` defines precise timing for tool creation, space activation, feed updates, and builder progression sequences. These are beautifully designed but most are not connected to actual component implementations.

### Options

**Option A: Motion budget system.** Each page gets a motion budget (e.g., max 3 animated elements visible simultaneously). Items entering the viewport use reveal animations, but items already visible when the page loads appear instantly. Stagger only applies to the first 5-8 items in any list; the rest appear instantly.

What breaks: Some of the "wow factor" on initial page loads where everything cascades in. But this is the right tradeoff -- performance and usability over spectacle.

**Option B: Motion context provider.** A `<MotionContext>` component that wraps the app and provides `motionTier` (full, reduced, none) based on device capability, user preference, and current view complexity. Components read from context instead of making their own decisions. Chat views automatically get `reduced` tier; landing pages get `full` tier.

What breaks: Requires refactoring every animated component to consume context. Significant migration effort. But it solves the consistency problem permanently.

**Option C: Keep current approach, just fix the stagger math.** Cap stagger at 8 items max regardless of list length. Add `will-change: transform` only during active animations (already partially done in `performance` object). Use `IntersectionObserver` for scroll-triggered animations instead of mount-triggered.

What breaks: Nothing. Incremental improvement. Doesn't solve the reduced-motion inconsistency.

**Recommendation:** Option B long-term, Option C immediately. Build the `MotionContext` provider, migrate critical paths first (feed, chat, member lists), let the rest migrate organically.

---

## 4. Responsive Design System

### Current State

Breakpoints are defined in `packages/tokens/src/layout.ts`:
- Mobile: 0-639px (single column, bottom nav)
- Tablet: 640-1023px (2 columns possible, collapsed sidebar)
- Desktop: 1024px+ (full sidebar, panels)
- Wide: 1440px+ (centered with max-width)

The `RESPONSIVE_BEHAVIOR` object documents expected behavior for navigation, content width, modals, panels, touch targets, typography, and spacing. `MOBILE_ONLY` and `DESKTOP_ONLY` arrays list feature sets.

Touch targets: 44px minimum desktop, 48px minimum mobile (`TOUCH_TARGETS` in layout.ts).

`AppShell.tsx` implements responsive behavior with a `useResponsive` hook that checks `window.innerWidth < 768`. Mobile gets bottom nav (64px), desktop gets the full header with command palette hint.

### Gaps

**No density modes.** The spacing scale is fixed. A compact view for power users who want to see more spaces/messages at once does not exist. Linear offers compact/comfortable/spacious -- HIVE should too, at minimum for the feed and member list views.

**Tablet is underserved.** The code jumps from "mobile bottom nav" to "desktop full experience" at a single breakpoint. iPad users (a significant campus demographic) get either a phone layout or a desktop layout with too-wide content. There is no tablet-optimized two-column layout.

**Responsive typography does not scale.** `design-system-v2.ts` says "Typography: Same scale across all breakpoints." But the display type in `patterns.ts` does use `md:` breakpoint: `'text-[40px] md:text-[48px]'`. This is inconsistent with the stated philosophy. More importantly, `body` text at 15px is fine on desktop but could be 16px on mobile for readability.

**Bottom sheet behavior is defined but minimal.** `SPACE_RESPONSIVE` defines sheet snap points (`['40%', '90%']`) but there is no shared bottom sheet primitive that handles swipe-to-dismiss, snap points, and keyboard avoidance. Each implementation is bespoke.

### Options

**Option A: Three density modes via CSS custom properties.**
`--hive-density: compact | comfortable | spacious` modifies spacing tokens at runtime. Compact reduces all spacing by 25%, increases items-per-screen. Spacious adds 25% more breathing room. User preference stored in local storage.

What breaks: Every spacing value that is currently a hardcoded Tailwind class (which is most of them) would need to switch to CSS custom property consumption. Large migration.

**Option B: Density only for list views.**
Feed, member lists, and space browse get a density toggle (compact/comfortable). Other views stay fixed. Implemented per-component, not system-wide.

What breaks: Nothing significant. Scope is narrow enough to implement quickly. Doesn't solve the broader responsive gap.

**Option C: Responsive overhaul -- tablet breakpoint + fluid typography + density.**
Add a `tablet` breakpoint at `768px-1023px` with a two-column layout (collapsed sidebar + content). Implement `clamp()` for fluid typography between mobile and desktop. Add density modes.

What breaks: Significant engineering effort. Requires touching `AppShell`, `SpaceShell`, and every page layout. But this is what makes the product feel native on iPad.

**Recommendation:** Option C, phased. Phase 1: fluid typography with `clamp()` (low effort, high impact). Phase 2: tablet breakpoint in shells. Phase 3: density modes for list views.

---

## 5. Dark Mode Perfection

### Current State

HIVE is dark-only. `design-system-v2.ts` guidelines explicitly list `'Light mode'` as an anti-pattern. The page background is `#0A0A0A` (not pure black -- OLED-adjacent but with enough warmth to avoid the "infinite void" feeling). Cards at `#141414` provide just enough elevation distinction.

The color system achieves contrast through opacity layers rather than hue changes: surfaces are `rgba(255, 255, 255, 0.02)` to `rgba(255, 255, 255, 0.08)`. This is sophisticated and works well on both LCD and OLED screens.

### The Light Mode Question

**Should HIVE have a light mode?**

Consider the use case: a student sitting outdoors on campus between classes, checking their phone in bright sunlight. `#0A0A0A` backgrounds wash out to invisible on LCD screens in direct sunlight. OLED handles it better, but the secondary text at `#A1A1A6` (which is 65% gray) becomes nearly unreadable.

### Options

**Option A: No light mode. Ever. Dark is the brand.**
Students can increase screen brightness. The platform is web-first (laptops in libraries and dorms), not mobile-first. Mobile is a "companion for quick checks" per the layout philosophy. Outdoor usage is an edge case.

What breaks: Accessibility for students in bright environments. Potential user complaints from iOS users who expect system-level appearance matching. Some campus environments (outdoor common areas, bright classrooms) make dark UIs genuinely hard to read.

**Option B: "Outdoor mode" -- not a full light mode, but a high-contrast dark mode.**
Background shifts from `#0A0A0A` to `#1A1A1A`. Text jumps from `#FAFAFA`/`#A1A1A6` to pure `#FFFFFF`/`#CCCCCC`. Gold stays the same. Borders get 50% more visible. Triggered manually or via ambient light sensor API (`AmbientLightSensor`). Not a theme toggle -- an accessibility adjustment.

What breaks: The carefully tuned surface hierarchy gets flattened. The difference between `surface` and `elevated` shrinks. The glass effects (2-6% opacity backgrounds) become invisible. But readability improves dramatically.

**Option C: Full light mode with token inversion.**
Every semantic token gets a light mode counterpart. `semantic.background.base` becomes `#FAFAFA` in light. Gold on white requires careful contrast work. This is a complete second theme.

What breaks: Doubles the design surface area. Every component screenshot, every Storybook story, every visual regression test needs light + dark variants. The "void is the brand" philosophy dies. Gold on light backgrounds has lower contrast and feels less special. The warmth spectrum becomes meaningless against light backgrounds.

**Recommendation:** Option B. Ship "outdoor mode" as a toggle in settings, not as a full theme. It is an accessibility feature, not a design choice. Implementation: a single CSS class on `<html>` that overrides 8-10 CSS custom properties. Keep it invisible in marketing -- it is for students who need it, not a feature to advertise.

---

## 6. Theming & Customization

### Current State

No per-space theming exists yet. All spaces use the same monochrome + gold palette. The `SPACE_COLORS` in `packages/tokens/src/spaces.ts` defines a single color set. The `SPACE_LAYOUT` defines fixed dimensions.

CSS custom properties are already used extensively (`cssVariables` in `design-system-v2.ts`), which makes theming architecturally possible. The `spaceColorVars` object shows the pattern: `--space-surface-base`, `--space-border-subtle`, etc.

### Options

**Option A: Accent color per space. 8 preset colors. Tints borders, badges, and presence indicators within the space.**
The space leader picks an accent during creation. It overrides `--space-border-subtle`, `--space-surface-hover`, and badge colors within the space's DOM tree. Everything else stays monochrome. Gold is unaffected.

Implementation: CSS custom properties scoped to `[data-space-accent="blue"]` or injected via style attribute on the space container. 8 colors: red, orange, amber, green, teal, blue, purple, pink. Each defined as a 12-step scale similar to `scale.gold` in `design-system-v2.ts`.

What breaks: The monochrome purity. Testing complexity increases (8 accent colors x N components). The warmth spectrum needs rethinking -- does "active" warmth still use gold tones in a blue-accented space? Likely yes -- warmth is a global signal, accent is a local identity.

**Option B: Cover image + accent color. Spaces get a header image and a derived accent color (similar to Spotify's album color extraction).**
The accent color is extracted from the cover image using a dominant-color algorithm, then mapped to the nearest of 8 presets. This feels more organic -- the space's visual identity emerges from its imagery rather than a settings dropdown.

What breaks: Same testing complexity as Option A, plus image processing dependency. Color extraction can produce ugly results. Students without design sensibility upload low-quality images that produce muddy accent colors. Need a fallback/override system.

**Option C: No per-space theming. Spaces differentiate through content, not color.**
Spaces are identified by their icon, name, and activity -- not by color. The monochrome system treats all spaces equally. Differentiation comes from what is inside, not the container.

What breaks: Space leaders feel constrained. Spaces feel interchangeable visually. Students navigating between spaces have no color-coded wayfinding. But the design stays pristine.

**Recommendation:** Option A, implemented conservatively. 8 accent colors, affecting only: space badge/tag color, sidebar active indicator, and typing indicator dot. Not borders, not backgrounds, not text. The accent is a whisper, not a shout. Implemented via a single CSS custom property (`--space-accent`) that 3-4 components consume.

---

## 7. Accessibility

### Current State

**Focus rings:** White (`rgba(255, 255, 255, 0.50)`), consistently defined across `FOCUS` patterns in `patterns.ts`, `semantic.interactive.focus` in `colors-unified.ts`, and reinforced in multiple guideline objects. This is correct and well-enforced.

**ARIA/Keyboard:** 20 primitive files contain `aria-`, `role=`, `tabIndex`, or `onKeyDown` references. The Radix UI foundation provides strong baseline accessibility for Dialog, Popover, Select, Tabs, and other overlay primitives.

**Contrast:** The `color-validator.ts` file implements WCAG AA validation with `getContrastRatio` and `meetsWCAGAA` functions. The `generateContrastReport` function tests all text/background combinations. The `generateAccessibilityAudit` function produces scores.

**Reduced motion:** 52 files reference reduced motion preferences. The `reducedMotionVariants` object provides fallbacks. But enforcement is inconsistent -- some components check, others do not.

### Gaps

**Text contrast on subtle backgrounds.** `semantic.text.subtle` at `#818187` on `semantic.background.base` at `#0A0A0A` yields approximately 5.2:1 contrast -- passes AA. But `semantic.text.placeholder` at `#71717A` on `#0A0A0A` yields approximately 4.0:1 -- fails AA for normal text. Placeholder text is technically decorative, but if users need to read placeholder instructions, this is a problem.

**Color-blind safety.** The status colors (green `#00D46A`, red `#FF3737`, amber `#FFB800`) rely on hue to communicate meaning. There are no shape/icon differentiators mandated by the design system for status indicators. A deuteranopic user cannot distinguish success from error by color alone.

**Screen reader support.** Radix handles overlay components well, but custom components like `WarmthDots`, `ActivityHeartbeat`, `ConnectionStrengthIndicator`, and `LiveCounter` are visual-only. They need `aria-label` attributes describing what they communicate.

**Keyboard navigation.** The command palette (`Command.tsx`) handles keyboard well. But space navigation (switching between boards, modes, and tools) has no documented keyboard shortcuts or skip-link system.

### Options

**Option A: Accessibility audit sprint. Fix the known gaps, add lint rules, ship.**
Bump placeholder color to `#808080` (passes AA). Add `aria-label` to all visual-only indicators. Add shape differentiators to status badges (checkmark for success, X for error, triangle for warning). Document keyboard shortcuts. Add an ESLint rule that flags components without `aria-label` or `role` attributes.

What breaks: Nothing. Pure improvement. Cost: 2-3 days of focused work.

**Option B: Full WCAG 2.1 AA certification pass.**
Everything in Option A plus: automated accessibility testing in CI (axe-core), screen reader testing documentation, keyboard navigation testing for all flows, high contrast mode support, forced-colors media query support.

What breaks: Slows feature development while certification is in progress. But the legal and ethical case for accessibility is strong.

**Option C: Accessibility-first component API redesign.**
Every primitive gets required accessibility props. `<Badge>` requires `label`. `<Avatar>` requires `alt`. `<PresenceDot>` requires `aria-label`. TypeScript enforces it -- missing props cause type errors.

What breaks: Every existing usage of these components needs updating. Significant migration cost. But it makes inaccessible usage impossible going forward.

**Recommendation:** Option A immediately, Option C for new components going forward, Option B as a quarterly initiative.

---

## 8. Design Token Strategy

### Current State

The token architecture is three-tiered: Foundation (raw values) -> Semantic (purpose-based) -> Component (component-specific). This is codified in `packages/tokens/src/colors-unified.ts` and consumed via `@hive/tokens` imports.

Multiple token systems coexist:
- `colors-unified.ts` -- the "correct" three-tier system
- `design-system-v2.ts` -- a parallel system with `colors`, `scale`, `cssVariables`, `componentTokens`
- `monochrome.ts` -- Tailwind class strings and raw values
- `patterns.ts` -- pre-composed Tailwind class strings (GLASS, CARD, INPUT, BUTTON, etc.)

This creates confusion. A developer adding a new component has 4 places to look for the "right" way to apply a background color.

### The Hardcoded Color Problem

89 files in `apps/web/src` contain hardcoded hex colors. Examples from the grep results include landing pages, space components, entry flows, lab pages, and loading states. These files reference colors like `#0A0A0A`, `#141414`, `#FFD700`, and others directly instead of through tokens.

### Options

**Option A: ESLint plugin that flags hardcoded colors in TSX files.**
A custom ESLint rule that catches hex colors (`#XXXXXX`), rgb/rgba values, and named colors (except `transparent`, `currentColor`, `inherit`) in JSX props and style objects. Provides auto-fix suggestions mapping known values to token imports. Run in CI as a warning initially, then error after migration.

The `hiveColorRules.semanticTokens` function in `color-validator.ts` already maps common hardcoded values to their token equivalents. This can feed the ESLint rule.

What breaks: Nothing. Warnings do not block shipping. Auto-fix handles the easy cases.

**Option B: Consolidate token systems into one.**
Merge `colors-unified.ts`, `design-system-v2.ts`, `monochrome.ts`, and `patterns.ts` into a single token file (or a single coherent module with clear imports). Kill the legacy aliases. One way to do each thing.

What breaks: Every import from these files needs updating. `design-system-v2.ts` is 617 lines with its own type system. `monochrome.ts` provides Tailwind class strings that are used directly in components. The merge is not trivial. But the cognitive overhead of 4 systems is worse than a one-time migration.

**Option C: Token governance process. Do not merge files, but document the canonical path.**
A decision tree in the design system docs: "If you need a raw color value, use `foundation.*`. If you need a purpose-based color, use `semantic.*`. If you need a pre-composed Tailwind class, use `MONOCHROME.*` or `CARD.*`." Add a `@deprecated` JSDoc to every non-canonical export.

What breaks: Nothing immediately. But the 4-system problem persists and grows. New developers still get confused.

**Recommendation:** Option A (lint rule) immediately. Option B (consolidation) as a dedicated sprint. The lint rule catches new violations while the consolidation fixes existing ones.

Concrete consolidation plan:
1. `colors-unified.ts` is the canonical color source (it already is the most complete)
2. `monochrome.ts` becomes a utility that generates Tailwind classes from `colors-unified.ts` values (not a parallel source of truth)
3. `patterns.ts` stays but references `colors-unified.ts` values instead of hardcoding `rgba` strings
4. `design-system-v2.ts` gets split: its unique contributions (cognitive budgets, z-index, breakpoints, guidelines) move to their own files, its color/spacing/typography values get killed in favor of the canonical files

---

## 9. Micro-Interactions & Delight

### Current State

The motion tokens define variants for: button press, card hover, message entry, success, error shake, page transition, modal entrance, dropdown, and selection ring. These are in `packages/tokens/src/motion.ts`.

Motion primitives in `packages/ui/src/design-system/primitives/motion/` include: Glass (surfaces), Reveal, ArrivalTransition, ThresholdReveal, WordReveal, BorderGlow, Scroll, ScrollTransform, Gradient.

Specialized components: `SuccessCheckmark`, `ActivityHeartbeat`, `LiveIndicator`, `WarmthDots`, `SpaceEntryAnimation`, `UnlockCelebration`, `ConfettiBurst`.

### What Moments Need More Delight

**1. Joining a space.** The `SpaceEntryAnimation` exists but the moment of clicking "Join" and becoming a member should feel like crossing a threshold -- a brief pulse, the member count incrementing with a number animation, your avatar appearing in the member list with a subtle pop.

**2. First message in a space.** Breaking the ice is psychologically significant. The first message a student sends in a new space should get a subtle distinction -- not gamification, but acknowledgment. A brief warmth pulse in the input area after sending.

**3. Receiving a reaction.** Someone reacting to your message is a social signal. The reaction should pop in with the `bouncy` spring (`stiffness: 300, damping: 15`), not just appear.

**4. Profile completion milestones.** `ProfileCompletionNudge` exists. Each completion step should trigger a micro-celebration -- the progress bar filling with a liquid motion, a brief gold shimmer on the completed section.

**5. Space going "live."** When a space transitions from `quiet` to `active` or `active` to `live` in the warmth spectrum, the UI should breathe -- a subtle ambient pulse, border glow intensifying over 2 seconds, not an instant state change.

**6. Tool deployment.** The HiveLab has a `deploy-takeover.tsx` and `flight-animation.tsx` -- this is clearly already a cinematic moment. Make sure the success state uses the `successVariants` from tokens for consistency.

**7. Empty state transitions.** When content arrives in an empty state, the empty state should dissolve (fade out + scale down) as the content fades in. Currently, empty states likely just disappear and content replaces them.

### Loading States

The `LOADING` pattern in `patterns.ts` defines a simple spinner. The guidelines say "No skeleton loaders (use spinners instead)." This is a strong opinion. Skeleton loaders fake content shapes and can feel dishonest. A simple spinner is more honest but can feel dead.

A middle ground: **Pulse loaders.** Not skeleton shapes, but the container (card, panel) itself pulses with a subtle `bg-white/[0.02]` to `bg-white/[0.04]` animation. The container is real, the content is loading. This is different from skeleton shimmer -- it is the surface breathing, consistent with the warmth/life philosophy.

### Error States

`errorShakeVariants` provides a physics-based shake. This is good for form validation. For network errors, a different pattern: a subtle red flash on the border of the affected area (not the whole screen), using `semantic.status.errorDim` as a brief overlay that fades in and out over 1.5 seconds.

---

## 10. Design System as Product

### Current Storybook State

177 stories across `packages/ui/src/design-system/`. Storybook config at `packages/ui/.storybook/main.ts` shows Vite-based setup with react-vite framework, running on port 6006 (`pnpm storybook:dev`). Stories are scoped to `../src/design-system/**/*.stories.@(js|jsx|mjs|ts|tsx)`.

Addons: `@storybook/addon-links`, `@storybook/addon-essentials`, `@storybook/addon-interactions`. No visual regression addon. No accessibility addon.

### Options

**Option A: Add testing addons to existing Storybook. Keep it internal.**
Add `@storybook/addon-a11y` for accessibility checks in stories. Add Chromatic or Percy for visual regression testing. Add `@storybook/test-runner` for interaction testing. Keep Storybook behind VPN/auth.

What breaks: Chromatic/Percy adds cost ($$$). Increases CI time. But catches visual regressions before they ship.

**Option B: Public Storybook + documentation site.**
Deploy Storybook publicly (storybook.hive.so or similar). Add MDX documentation pages alongside stories. Make it a resource for the campus developer community -- students who want to build integrations or understand the platform.

What breaks: Public Storybook reveals internal component structure. Requires maintaining public-facing documentation quality. But for a platform targeting builders (students who "do things"), a public design system is a feature, not a liability. It signals craft and transparency.

**Option C: Figma sync with Style Dictionary.**
Export design tokens to Figma variables using Style Dictionary or Tokens Studio. Designers work in Figma with the same token values that developers use. Changes flow bidirectionally.

What breaks: Requires a Figma subscription and ongoing sync maintenance. If the team is all-code (no dedicated designer), this is overhead with no user. But when a designer joins, having token sync from day one is massively valuable.

### Recommendation

**Option A immediately** -- the `addon-a11y` integration is trivial (one line in `main.ts` addons array) and catches accessibility issues per-story. Visual regression testing is the highest-ROI testing investment for a design system.

**Option B when HIVE launches publicly** -- a public Storybook is a marketing asset for a platform that values craft. Deploy it on Vercel alongside the main app.

**Option C when a designer joins** -- not before. Token sync without a designer consumer is waste.

### Governance Model

As the team grows beyond 1-3 engineers:

1. **Token changes require a design system PR label.** No token value changes ship without explicit review.
2. **New primitives require a Storybook story.** No component merges without at least a default story and a docs page.
3. **Pattern compliance is automated.** The ESLint plugin (Section 8) catches hardcoded colors. A Storybook visual regression test catches unintended visual changes.
4. **Token deprecation has a timeline.** When a token is deprecated (like the `legacy` object in `colors-unified.ts`), set a deadline. After the deadline, the deprecated export becomes a type error.

---

## Summary: Priority Matrix

| Action | Effort | Impact | Do When |
|--------|--------|--------|---------|
| Fix placeholder text contrast | 1 hour | High (accessibility) | Now |
| Add `aria-label` to visual indicators | 1 day | High (accessibility) | Now |
| Add `@storybook/addon-a11y` | 30 min | Medium (catches issues early) | Now |
| ESLint rule for hardcoded colors | 2-3 days | High (prevents drift) | Next sprint |
| Motion budget for lists (cap stagger at 8) | 1 day | High (performance) | Next sprint |
| Ice blue for notification counts | 2 hours | Medium (clarity) | Next sprint |
| "Outdoor mode" high-contrast toggle | 2 days | Medium (accessibility) | Next sprint |
| Calendar/schedule component | 1-2 weeks | High (core feature) | Next cycle |
| Rich text editor integration | 1-2 weeks | High (space leaders need it) | Next cycle |
| Fluid typography with clamp() | 2 days | Medium (responsive) | Next cycle |
| MotionContext provider | 3-5 days | Medium (consistency) | Next cycle |
| Space accent colors (8 presets) | 1 week | Medium (expression) | After launch |
| Token system consolidation | 1 week | High (DX) | Dedicated sprint |
| Tablet breakpoint in shells | 1 week | Medium (iPad users) | After launch |
| Density modes for lists | 3-5 days | Low-Medium | After launch |
| Public Storybook | 2-3 days | Medium (marketing) | At launch |
| Visual regression testing (Chromatic) | 1 day setup | High (prevents regressions) | Before launch |

---

## Files Referenced

| File | Purpose |
|------|---------|
| `packages/tokens/src/colors-unified.ts` | Three-tier color system (foundation, semantic, component) |
| `packages/tokens/src/design-system-v2.ts` | Parallel design system with colors, spacing, radius, typography, breakpoints, z-index, cognitive budgets |
| `packages/tokens/src/monochrome.ts` | Monochrome discipline: Tailwind classes, raw values, warmth spectrum, presence states |
| `packages/tokens/src/patterns.ts` | Pre-composed Tailwind class patterns for glass, cards, inputs, buttons, badges, focus, typography, motion tiers, elevation |
| `packages/tokens/src/motion.ts` | Motion tokens: durations, easings, springs, stagger, signature transitions, micro-interaction variants |
| `packages/tokens/src/typography.ts` | Font families (Clash Display, Geist, Geist Mono), font sizes, weights, line heights, letter spacing |
| `packages/tokens/src/spacing.ts` | 4px base unit spacing scale, layout sizes, containers |
| `packages/tokens/src/radius.ts` | Border radius scale with semantic aliases |
| `packages/tokens/src/effects.ts` | Box shadows, backdrop blur, opacity scale |
| `packages/tokens/src/layout.ts` | Max-widths, breakpoints, touch targets, spacing rhythm, shell types, chat spacing, responsive behavior |
| `packages/tokens/src/spaces.ts` | Space-specific layout dimensions, colors, typography, motion, component tokens |
| `packages/tokens/src/ide.ts` | HiveLab IDE semantic tokens via CSS custom properties |
| `packages/tokens/src/color-validator.ts` | WCAG contrast validation, gold usage rules, deprecated color detection |
| `packages/tokens/src/index.ts` | Central token exports |
| `packages/ui/src/motion/presets.ts` | Framer Motion presets (transitions, variants, gestures, stagger) |
| `packages/ui/src/motion/index.ts` | Motion library entry point |
| `packages/ui/src/design-system/primitives/motion/Glass.tsx` | Glass surface primitives (GlassSurface, GlassPanel, GlassOverlay, GlassPill, FrostedEdge) |
| `packages/ui/src/design-system/templates/AppShell.tsx` | Command-first navigation shell with responsive header and mobile bottom nav |
| `packages/ui/.storybook/main.ts` | Storybook configuration |
| `docs/DESIGN_SYSTEM.md` | Existing design system documentation |
