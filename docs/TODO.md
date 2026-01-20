# HIVE GTM TODO

**Last Updated:** January 20, 2026
**Sprint Deadline:** Monday
**Status:** Full Platform Audit Complete

---

## Priority Legend

- **P0** — Ship blocker. Must fix before launch.
- **P1** — Core experience. Affects user trust/conversion.
- **P2** — Polish. Affects premium feel.
- **P3** — Nice to have. Post-launch.

---

## P0: Ship Blockers

### Entry/Onboarding

- [ ] **Hardcoded colors → design tokens**
  - `EntryShell.tsx:62,162` → `#0A0A09` should be token
  - `AlumniWaitlistState.tsx:68` → `text-[#FFD700]` should be `text-gold-500`
  - `AmbientGlow.tsx:64` → hardcoded rgba gold
  - `RoleState.tsx:117` → hardcoded focus offset color
  - *Impact:* Design system compliance broken

- [ ] **Focus ring inconsistency (a11y)**
  - `RoleState.tsx:117` → has ring-offset
  - `SchoolState.tsx:169` → no ring-offset
  - `EmailState.tsx:130-141` → links have no focus ring at all
  - *Impact:* WCAG 2.1 AA violation

- [ ] **Alumni waitlist dead end**
  - `AlumniWaitlistState.tsx:151-159` → "Got it" button leads nowhere
  - *Fix:* Add recovery path (browse public spaces, notification preferences)

### Spaces/Chat

- [ ] **Chat loading skeleton missing**
  - `TheaterChatBoard.tsx` → receives `isLoading` but renders nothing
  - *Fix:* Add 3-5 message row skeletons with shimmer
  - *Impact:* Chat feels broken on first load

- [ ] **Chat empty state missing**
  - `TheaterChatBoard.tsx` → no state when `messages.length === 0`
  - *Fix:* Add icon + "No messages yet" + "Send the first message"
  - *Impact:* New spaces look dead

- [ ] **No error states in any mode**
  - `EventsMode.tsx`, `ToolsMode.tsx`, `MembersMode.tsx`, `TheaterChatBoard.tsx`
  - None accept or display `error` prop
  - *Fix:* Add error prop + retry button pattern to all modes
  - *Impact:* Firestore failures show blank page

### HiveLab/Tools

- [ ] **Deploy modal error state broken**
  - `ToolDeployModal.tsx:88` → catches error but `setError()` has no UI
  - *Fix:* Add error display card in modal render
  - *Impact:* Users see infinite loading on deploy failure

- [ ] **Hardcoded colors in IDE**
  - `connection-config.tsx` → `#ef4444`, `#22C55E`, `#3B82F6`
  - `context-rail.tsx` → `#1a1a1a`, `#2a2a2a`, `#4CAF50`
  - *Fix:* Use `var(--status-error)`, `var(--status-success)` tokens

### Feed

- [ ] **Unread messages not implemented**
  - `feed/page.tsx:703` → `unreadSpaces={[]}` with TODO comment
  - *Fix:* Implement unread message fetching, update TodaySection
  - *Impact:* Core Feed feature missing

- [ ] **Design token non-compliance**
  - Throughout `feed/page.tsx` → `bg-white/[0.02]`, `border-white/[0.06]`
  - *Fix:* Replace with `var(--bg-surface)`, `var(--border-default)`
  - *Impact:* Can't theme, inconsistent with Profile

---

## P1: Core Experience

### Entry/Onboarding

- [ ] **Disabled input states unclear**
  - `CodeState.tsx:76-84` → OTPInput disabled but no visual change
  - `EmailState.tsx:78-88` → EmailInput disabled unclear
  - `IdentityState.tsx:110-127` → fields disabled but no cursor change
  - *Fix:* Add opacity-50, cursor-not-allowed, pointer-events-none

- [ ] **Error state recovery missing**
  - `CodeState.tsx:88-102` → error shows but no auto-focus on retry
  - `EmailState.tsx:90-103` → error clears but no hint
  - *Fix:* Auto-focus error field, provide specific error messages

- [ ] **Loading state inconsistency**
  - Each state implements loading differently (spinner vs text vs both)
  - *Fix:* Create unified `LoadingSpinner.tsx` in entry/motion

### Spaces/Chat

- [ ] **Loading-more indicator missing**
  - `TheaterChatBoard.tsx:64` → `isLoadingMore` passed but not rendered
  - *Fix:* Add loading dots at top of message list during pagination
  - *Impact:* Users think scroll is broken

- [ ] **Button interaction feedback incomplete**
  - `SpaceChatBoard.tsx:486-500` → Send button missing active/focus states
  - `EventsMode.tsx:220-251` → RSVP buttons no loading state
  - `ToolsMode.tsx:182-216` → Run/View/Remove no feedback
  - *Fix:* Add `active:scale-95`, focus rings, loading spinners

- [ ] **Mobile responsiveness gaps**
  - `SpaceChatBoard.tsx:466-504` → composer padding too large on mobile
  - `ChatRowMessage.tsx` → `px-6` too much on iPhone
  - *Fix:* Use `px-3 md:px-6` pattern

### HiveLab/Tools

- [ ] **Mode toggle missing tooltips**
  - `header-bar.tsx:49-55` → Edit/Use buttons have no title attribute
  - *Fix:* Add `title="Switch to Edit Mode"` / `title="Preview Tool"`

- [ ] **Loading state inconsistency**
  - `tools/loading.tsx` → generic spinner
  - `tools/[toolId]/loading.tsx` → skeleton layout
  - `tools/templates/loading.tsx` → skeleton
  - *Fix:* Standardize all to skeleton-based

- [ ] **Analytics panel loading state**
  - `analytics-panel.tsx:37-45` → fetches but no skeleton
  - *Fix:* Add skeleton cards while fetching

### Browse/Discovery

- [ ] **Search input inconsistency**
  - `schools/page.tsx:410-418` → custom styling, different padding
  - `discover-section.tsx:170-196` → SearchInput component, different colors
  - *Fix:* Create unified `SearchBar` design system primitive

- [ ] **Modal content doesn't scroll**
  - `space-preview-modal.tsx:151-224` → `line-clamp-3` truncates abruptly
  - *Fix:* Remove hard limit, let modal expand with max-height + scroll

- [ ] **Loading skeleton mismatch (schools vs spaces)**
  - Schools → spinning loader
  - Spaces → skeleton/pulse
  - *Fix:* Unify on skeleton/pulse for all list states

### Profile

- [ ] **Profile grid not scalable**
  - `ProfilePageContent.tsx:103-198` → fixed 3-column, breaks on lg/xl
  - *Fix:* Add `lg:grid-cols-4 xl:grid-cols-5`, pagination for >10 items

- [ ] **Profile cards missing loading states**
  - `ProfileConnectionsCard.tsx` → no skeleton
  - `ProfileToolsCard.tsx` → no loading state
  - `ProfileInterestsCard.tsx` → no loading state
  - *Fix:* Add `isLoading` prop + skeleton grid to all

- [ ] **ProfileStatsRow not integrated**
  - Component exists but ProfilePageContent doesn't use it
  - *Fix:* Import and display below ProfileHero

- [ ] **ProfileActivityHeatmap not rendered**
  - 270-line component sitting unused
  - *Fix:* Add section in ProfilePageContent, fetch activity data

---

## P2: Polish

### Entry/Onboarding

- [ ] **Spacing inconsistency**
  - Most states use `space-y-8` but `ArrivalState.tsx:83` uses `mb-10`
  - *Fix:* Standardize on one scale (32px or 40px)

- [ ] **Form field stagger entrance**
  - `CodeState.tsx:75-84`, `IdentityState.tsx:108-128` → inputs appear instantly
  - *Fix:* Apply staggered entrance (0.1s delay each)

- [ ] **Resend code cooldown not clear**
  - `CodeState.tsx:115-140` → button disappears during cooldown
  - *Fix:* Keep button visible but disabled, show "Resend in 30s"

- [ ] **Missing a11y error announcements**
  - `EmailState.tsx:92-102`, `CodeState.tsx:88-109` → no `role="alert"`
  - *Fix:* Wrap errors in `<div role="alert" aria-live="polite">`

- [ ] **Progress indicator hides labels on mobile**
  - `EntryProgress.tsx:110` → `hidden sm:block` on step labels
  - *Fix:* Show abbreviated labels or icons on mobile

### Spaces/Chat

- [ ] **Disabled/locked states for non-leaders**
  - `EventsMode.tsx:300-308` → Create Event shows for everyone
  - `ToolsMode.tsx:276-299` → Build Tool button exists but undefined handler
  - *Fix:* Show disabled state with tooltip explaining why

- [ ] **Hub mode cards missing loading state**
  - `SpaceHub.tsx:150` → mode cards show empty if no `modeData`
  - *Fix:* Add loading placeholder for each card type

- [ ] **Typing indicator missing text**
  - `TheaterChatBoard.tsx` → accepts `typingUsers` but unclear feedback
  - *Fix:* Add "X is typing..." text above chat input

- [ ] **Accessibility labels missing**
  - No `aria-label` on icon-only buttons (pin, delete, react)
  - No `role="tab"` on board tabs
  - *Fix:* Add systematically across all interactive elements

### HiveLab/Tools

- [ ] **Hidden elements in palette**
  - `element-palette.tsx:44-57` → `study-spot-finder`, `dining-picker` hidden
  - *Fix:* Implement missing APIs or remove from ELEMENTS array

- [ ] **Floating action bar AI input focus state**
  - `floating-action-bar.tsx` → no focus ring on keyboard nav
  - *Fix:* Add focus-visible ring styling

- [ ] **Onboarding "Next Step" CTA subtle**
  - `onboarding-overlay.tsx:70-120` → step dots visible but no "Next" button
  - *Fix:* Add explicit "Next →" button with clear progression

- [ ] **Properties panel validation no text**
  - `properties-panel.tsx:35-50` → shake animation but no error message
  - *Fix:* Show error text under invalid fields

- [ ] **Deploy dropdown missing success feedback**
  - `deploy-dropdown.tsx:71-77` → no toast after successful deploy
  - *Fix:* Add `toast.success("Tool deployed to ${spaceName}")`

### Browse/Discovery

- [ ] **Empty state tone inconsistency**
  - YourSpacesList: enthusiastic "Ready to explore?" with CTA
  - DiscoverSection: terse "No spaces found"
  - *Fix:* Harmonize tone, both welcoming and brief

- [ ] **Search debounce no visual feedback**
  - `discover-section.tsx:248` → 300ms debounce but no "searching..." state
  - *Fix:* Add loading state to SearchInput during debounce

- [ ] **Notification badge hardcoded color**
  - `your-spaces-list.tsx:226` → falls back to `#FFD700`
  - *Fix:* Use `bg-gold-500` design token

- [ ] **Activity indicator missing accessibility**
  - `space-list-row.tsx:68-93` → no `aria-label` or `title`
  - *Fix:* Add `aria-label={Activity: ${level}}` and title

### Feed

- [ ] **Visual density inconsistency**
  - TodaySection: `mb-8` but internal `gap-3`
  - YourSpacesSection: `grid-cols-4 gap-3` wrong proportion
  - ThisWeekSection: `ml-6` margin hack (line 382)
  - *Fix:* Standardize on 8px grid, use flex/grid gap

- [ ] **Missing hover/active states on cards**
  - `feed/page.tsx:204` → has hover but no active/disabled
  - *Fix:* Add `whileTap={{ opacity: 0.7 }}`, focus rings

- [ ] **Error state styling mismatch**
  - `feed/error.tsx` → uses `bg-amber-500/10`, `rounded-full`
  - *Fix:* Use design system: `bg-error/10`, `rounded-xl`

- [ ] **Loading skeleton outdated tokens**
  - `FeedLoadingSkeleton.tsx:12-38` → uses `hive-background-page`
  - *Fix:* Update to current tokens: `--bg-ground`, `--border-subtle`

### Profile

- [ ] **Hero aspect ratio issues on mobile**
  - `ProfileHero.tsx:109` → `aspect-[16/10]` too wide on mobile
  - *Fix:* Use `aspect-[4/3]` mobile, `aspect-[16/10]` sm

- [ ] **Section header opacity**
  - `feed/page.tsx:126` → `text-white/60` borderline illegible
  - *Fix:* Change to `text-white/50` for better contrast

- [ ] **Message button disabled unclear**
  - `ProfilePageContent.tsx:234-239` → disabled but not greyed enough
  - *Fix:* Use proper disabled styling, show tooltip on hover

---

## P3: Post-Launch

### Technical Debt

- [ ] Consolidate `users` and `profiles` collections
- [ ] Migrate legacy `reactions` field to `engagement`
- [ ] Add comprehensive test coverage
- [ ] Performance audit and optimization

### Future Features

- [ ] Thread notifications
- [ ] Read receipts
- [ ] Board reordering
- [ ] Space analytics (real data)
- [ ] Typing indicator optimization
- [ ] Rituals (feature-flagged)
- [ ] Push notifications (infrastructure ready)
- [ ] Voice messages
- [ ] Marketplace

### Polish Backlog

- [ ] Template gallery pagination
- [ ] Element rail collapse animation
- [ ] Emoji picker expansion
- [ ] Keyboard shortcut help modal
- [ ] Sorting algorithm weight constants
- [ ] Schools waitlist actual click handler

---

## Quality Gates

Before release:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] Manual QA on core flows:
  - [ ] Entry → Onboarding complete
  - [ ] Browse → Join space → Chat
  - [ ] HiveLab → Create tool → Deploy
  - [ ] Feed → View posts → Navigate
  - [ ] Profile → View → Edit

---

## Effort Estimates

| Priority | Items | Est. Hours |
|----------|-------|------------|
| P0 | 11 items | ~8 hrs |
| P1 | 15 items | ~10 hrs |
| P2 | 23 items | ~12 hrs |
| **Total Critical Path** | **26 items** | **~18 hrs** |

---

## Surface Status Summary

| Surface | GTM Ready | Key Blockers |
|---------|-----------|--------------|
| Entry/Onboarding | 70% | Tokens, focus rings, alumni flow |
| Spaces/Chat | 75% | Chat loading/empty states, error handling |
| HiveLab/Tools | 72% | Deploy error, token compliance |
| Browse/Discovery | 85% | Search consistency, modal scroll |
| Feed | 65% | Unread messages, token compliance |
| Profile | 78% | Grid scaling, missing integrations |

---

## Sprint Approach

### Day 1 (Today): P0 Foundation
1. Design token migration (Entry, HiveLab, Feed)
2. Chat loading/empty states
3. Deploy modal error state
4. Focus ring standardization

### Day 2: P0 Complete + P1 Start
1. Alumni waitlist recovery
2. Error states in modes
3. Unread messages implementation
4. Mobile responsiveness pass

### Day 3: P1 Complete + P2 Polish
1. Button interaction feedback
2. Loading state consistency
3. Profile integrations
4. Visual polish pass

### Monday: QA + Ship
1. Quality gate checks
2. Manual testing all flows
3. Fix any regressions
4. Deploy to production

---

*This TODO reflects a comprehensive platform audit. Focus on P0/P1 for GTM, defer P2/P3 to post-launch sprints.*
