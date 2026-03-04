# UI-TODO.md — Full Audit: Foundations, Components, Patterns
**Last updated:** 2026-02-21
**Rules:** Read `docs/DESIGN_RULES.md` before touching anything.

Status key:
- ✅ **LOCKED** — decisions made, do not change
- ✅ **OK** — built correctly, no action needed
- ⚠️ **AUDIT** — needs token compliance check (hex values, gold usage, focus rings)
- 🔨 **FIX** — specific known fix required
- ❌ **DELETE** — legacy, remove
- 🏗️ **BUILD** — missing, create from scratch

---

## FOUNDATIONS

| Item | Status | Action |
|------|--------|--------|
| Color tokens | ✅ OK | Defined in `tokens.css` and `@hive/tokens`. Do not add new color values — use what exists. |
| Typography tokens | ✅ OK | Clash Display + Geist + Geist Mono. Scale defined. |
| Spacing tokens | ✅ OK | 4px base scale. Complete. |
| Motion tokens | ✅ OK | Durations, easings, spring presets, Framer variants all in `@hive/tokens`. |
| Shadows | ✅ OK | Black-only. Glow shadows defined and wired to `--life-pulse`. |
| Radius tokens | 🔨 **FIX** | `--radius-md` and `--radius-lg` are both 12px. Set `--radius-md: 10px`. Audit consumers. |
| Icon standard | 🔨 **FIX** | `Icon.tsx` is LOCKED with stroke-width 1.5px, sizes 16/20/24px. **Document this in `DESIGN_RULES.md`** — currently missing from rules. |
| App grid system | 🏗️ **BUILD** | No 12-col grid token. Pages do freehand spacing. Define: 12-col, 24px gutter, 4 breakpoints. Add to tokens. |
| Gold budget audit | 🔨 **FIX** | Search codebase for `focus:ring-yellow`, `focus:ring-gold`, `focus-visible:ring-[#FFD700]`. Replace all with `focus-visible:ring-white/50`. |
| Foundations Storybook | 🏗️ **BUILD** | `Foundations.Checklist.mdx` all unchecked. Write token docs story, typography reference, spacing reference. |

---

## PRIMITIVES

### Typography
| Primitive | Status | Action |
|-----------|--------|--------|
| `Text` | ✅ LOCKED | — |
| `Heading` | ✅ LOCKED | — |
| `DisplayText` | ✅ LOCKED | Clash Display. Hero/h1/h2 only. |
| `Mono` | ✅ LOCKED | Geist Mono. Stats and code. |
| `Label` | ⚠️ AUDIT | Not locked. Check token compliance. |
| `Link` | ✅ LOCKED | — |

### Interactive Controls
| Primitive | Status | Action |
|-----------|--------|--------|
| `Button` | 🔨 **FIX** | Refined Feb 9, not locked. Core is correct (pill, no scale, white focus). **Add shimmer variant** for Lab/Create CTA only — use `shimmer-button` from motion-primitives. Then lock it. |
| `Input` | 🔨 **FIX** | Not locked. Audit: focus border = `--border-focus` (white 50%), input text = 15px (HIVE decision), placeholder = `--text-tertiary`. Fix violations then lock. |
| `Textarea` | ⚠️ AUDIT | Same audit as Input — focus, text size, placeholder. |
| `Checkbox` | ✅ LOCKED | — |
| `Radio` | ✅ LOCKED | — |
| `Switch` | ✅ LOCKED | — |
| `Select` | ⚠️ AUDIT | Not locked. Check token compliance: focus ring, active state color, dropdown surface. |
| `Toggle` | ⚠️ AUDIT | Not locked. Check token compliance. |
| `Tabs` | ⚠️ AUDIT | Not locked. Check active tab treatment — should use white, not gold. |
| `Slider` | ✅ LOCKED (Jan 2026) | — |

### Display & Feedback
| Primitive | Status | Action |
|-----------|--------|--------|
| `Badge` | ⚠️ AUDIT | Not locked but used widely. Verify: gold variant = featured/trending only, no gold on decorative badges. Lock after audit. |
| `Avatar` | ✅ LOCKED | Rounded-square (never circle). Ring on presence. |
| `AvatarGroup` | ✅ LOCKED | 🔨 **Define max rule**: max 3 visible + "+N" chip in `--bg-elevated`. Add to lock comment. |
| `PresenceDot` | ✅ LOCKED | Audit colors: online=success, away=warning, dnd=error, offline=ghost. |
| `SpaceHealthBadge` | ✅ OK | Best primitive in the system. `dormant→quiet→active→thriving`. Do not touch. |
| `StatAtom` | 🔨 **FIX** | Not locked. **Add Number Ticker animation on mount** using `animated-number.tsx` from motion-primitives. Respect `prefers-reduced-motion`. Then lock. |
| `Skeleton` | ✅ LOCKED | — |
| `Progress` | ✅ LOCKED | — |
| `Toast` | ✅ LOCKED | — |
| `EmptyState` | ✅ LOCKED (Jan 2026) | — |
| `Separator` | ✅ LOCKED | — |
| `Tooltip` | ✅ LOCKED (Jan 2026) | — |
| `TypingIndicator` | ✅ LOCKED | — |

### Layout & Navigation
| Primitive | Status | Action |
|-----------|--------|--------|
| `Card` | ⚠️ AUDIT | Not locked. Core is excellent (warmth system, elevation, interactive). **Add JSDoc with warmth API examples.** Then lock. |
| `Icon` | ✅ LOCKED | Stroke 1.5px, sizes 16/20/24px. **Add to `DESIGN_RULES.md`** — currently undocumented in rules. |
| `TopBar` | ⚠️ AUDIT | Page-level bar (post-sidebar), 48px. Not locked. Verify token compliance then lock. |
| `BottomNav` | ✅ LOCKED | Mobile nav. — |
| `Breadcrumb` | ⚠️ AUDIT | Not locked. Low-use. Check token compliance. |
| `Tag` | ✅ LOCKED | — |

### Utility
| Primitive | Status | Action |
|-----------|--------|--------|
| `Logo` | ✅ OK | HIVE logo asset. Fine. |
| `Modal` | ⚠️ AUDIT | Not locked. Is this different from Dialog in components? Clarify role, check token compliance. |
| `LoadingState` | ⚠️ AUDIT | Not locked. Check token compliance. |
| `CategoryScroller` | ✅ LOCKED | Horizontal filter scroller. |
| `DeploymentTarget` | ✅ LOCKED | HiveLab-specific. Fine. |
| `ActivityEdge` | ✅ LOCKED | Edge warmth animation. Used in SpaceCard. |
| `EmailInput` | ✅ LOCKED (Jan 2026) | — |
| `HandleInput` | ✅ LOCKED (Jan 2026) | — |
| **`ToolCardAtom`** | ❌ **DELETE** | Legacy. Migrate any consumers to `ToolCard` (compact variant) then delete. |

---

## COMPONENTS

### Cards (Core identity)
| Component | Status | Action |
|-----------|--------|--------|
| `ToolCard` | 🔨 **FIX** | LOCKED but two fixes needed: (1) Replace `hover:opacity-90` with `glow-effect` from motion-primitives, tuned subtle. (2) Add `lastUsedAt` prop + `getWarmthFromToolActivity()` for recency-based warmth. |
| `SpaceCard` | ✅ LOCKED | Best component. Territory gradients, warmth, "X you know". Do not touch. |
| `ProfileCard` (5 variants) | 🔨 **FIX** | LOCKED but `ProfileCardFull` needs redesign. New: slim header (48px avatar, name, handle, bio), horizontal stat row, action buttons. All other variants fine. |
| `EventCard` | ✅ LOCKED (Jan 2026) | — |
| `StatCard` | ✅ OK | Sparklines, trend indicators, size variants. Fine. |
| `PostCard` | ⚠️ AUDIT | Not locked. Feed post with author, content, reactions. Check token compliance — gold usage, focus rings. |
| `GhostSpaceCard` | ⚠️ AUDIT | Placeholder/loading card. Check token compliance. |
| `FileCard` | ⚠️ AUDIT | File attachment display. Low-use. Check token compliance. |

### Navigation
| Component | Status | Action |
|-----------|--------|--------|
| `TopNavBar` | ⚠️ AUDIT | Global header (56px). Not locked. Verify: search trigger, notification icon, user avatar. Token compliance check. |
| `TabNav` | ⚠️ AUDIT | Horizontal tab nav. Not locked. Active tab = white, not gold. Check. |
| `BoardTabs` | ⚠️ AUDIT | LOCKED but purpose unclear from name. Check what it does, verify token compliance. |
| `SpaceSwitcher` | ⚠️ AUDIT | Space selector. Not locked. Check token compliance. |
| `Stepper` | ⚠️ AUDIT | Multi-step wizard. Not locked. Check active step treatment — white not gold. |
| `CommandBar` | ✅ LOCKED | ⌘K command palette. |
| `CommandPalette` | ⚠️ AUDIT | Is this different from CommandBar? Clarify role. May be duplicate. |
| `UniversalNav` | 🔨 **FIX** | In `navigation/` dir. Active state ad-hoc, not token-driven. Lab item not differentiated. See rebuild spec in patterns section. |

### Overlays & Dialogs
| Component | Status | Action |
|-----------|--------|--------|
| `Dialog` | ✅ OK | shadcn-based. Fine. |
| `Sheet` | ✅ LOCKED (Jan 2026) | — |
| `Drawer` | ✅ LOCKED (Jan 2026) | — |
| `Popover` | ✅ LOCKED (Jan 2026) | — |
| `ConfirmDialog` | ✅ OK | Standard confirm pattern. Fine. |
| `ThreadDrawer` | ⚠️ AUDIT | Thread sidebar. Not locked. Check token compliance. |
| `Portal` | ✅ OK | DOM portal utility. Fine. |

### Forms
| Component | Status | Action |
|-----------|--------|--------|
| `FormField` | ✅ OK | Wrapper with label, description, error, counter. Fine. |
| `RadioGroup` | ⚠️ AUDIT | Not locked. Token compliance check. |
| `ToggleGroup` | ✅ LOCKED (Jan 2026) | — |
| `Combobox` | ✅ LOCKED (Jan 2026) | — |
| `TagInput` | ⚠️ AUDIT | Multi-tag input. Check token compliance. |
| `DatePicker` | ⚠️ AUDIT | Not locked. Check focus states, active day treatment (white not gold). |
| `NumberInput` | ⚠️ AUDIT | Numeric stepper. Check token compliance. |
| `ImageUploader` | ⚠️ AUDIT | File upload. Check token compliance. |
| `OTPInput` | ✅ LOCKED (Jan 2026) | — |
| `SearchInput` | ⚠️ AUDIT | Search field. Not locked. Check token compliance. |

### Feedback & Status
| Component | Status | Action |
|-----------|--------|--------|
| `Alert` | ✅ LOCKED (Jan 2026) | — |
| `Callout` | ⚠️ AUDIT | Info callout box. Not locked. Check: no gold on informational callouts. |
| `NotificationBanner` | ⚠️ AUDIT | Top banner. Not locked. Check: gold reserved for achievement banners only. |
| `LoadingOverlay` | ⚠️ AUDIT | Full-screen loader. Not locked. Check token compliance. |
| `ProgressBar` | ⚠️ AUDIT | Linear progress. Not locked. Check: progress fill color = white not gold (unless achievement). |
| `ErrorState` | ✅ LOCKED (Jan 2026) | — |
| `AuthSuccessState` | ✅ OK | Auth context only. Fine. |

### Social & Messaging
| Component | Status | Action |
|-----------|--------|--------|
| `ChatMessage` | ✅ LOCKED | — |
| `ChatComposer` | ⚠️ AUDIT | Message input. Not locked. Check: focus ring, send button treatment. |
| `MessageGroup` | ⚠️ AUDIT | Message grouping. Not locked. Token compliance check. |
| `MentionAutocomplete` | ⚠️ AUDIT | @mention dropdown. Not locked. Check: selected item = white bg, not gold. |
| `ReactionBadge` | ⚠️ AUDIT | Emoji reaction count chip. Not locked. Check token compliance. |
| `ReactionPicker` | ⚠️ AUDIT | Emoji picker overlay. Not locked. Token compliance check. |
| `PresenceIndicator` | ⚠️ AUDIT | Online count display. Not locked. Check: online count display uses `--life-gold` only when > 0 users active. |

### Space & Campus
| Component | Status | Action |
|-----------|--------|--------|
| `SpaceHeader` | ⚠️ AUDIT | Space top header. Not locked. Check: verified badge treatment, online count gold, join button. |
| `SpacePanel` | ⚠️ AUDIT | Space layout panel. Not locked. Token compliance check. |
| `MemberList` | ⚠️ AUDIT | Member list organism. Not locked. Uses `ProfileCardMemberRow` — verify correctly. |
| `AttendeeList` | ⚠️ AUDIT | Event attendees. Not locked. Token compliance check. |
| `RSVPButton` | ⚠️ AUDIT | Event RSVP toggle. Not locked. Verify: "Going" state uses white not gold. |
| `EventCalendar` | ⚠️ AUDIT | Full calendar view. Not locked. Check: selected day = white, today indicator = subtle. |

### Data & Utility
| Component | Status | Action |
|-----------|--------|--------|
| `Accordion` | ✅ LOCKED (Jan 2026) | — |
| `ScrollArea` | ✅ LOCKED (Jan 2026) | — |
| `Collapsible` | ⚠️ AUDIT | Expand/collapse. Not locked. Token compliance check. |
| `DataTable` | ⚠️ AUDIT | Table. Admin-focused. Check token compliance. |
| `Pagination` | ⚠️ AUDIT | Page nav. Not locked. Active page = white not gold. |
| `Slot` | ✅ OK | Cognitive budget slot. Fine. |
| `AspectRatio` | ✅ OK | Utility ratio container. Fine. |
| `OrientationLayout` | ✅ LOCKED | — |
| `VisuallyHidden` | ✅ OK | A11y utility. Fine. |
| `CampusProvider` | ✅ OK | Context provider, not UI. Fine. |

---

## PATTERNS (Organisms)

### 🔴 Build
| Pattern | Action |
|---------|--------|
| **ProfilePage organism** | Slim header (48px avatar + name + handle + bio + action buttons) → stat row (StatAtom with Number Ticker) → Spaces row (SpaceCard compact + mutual spaces count) → ToolGrid → ProfileActivityHeatmap |
| **ToolGrid** | 2-col bento of ToolCards. First 2 slots pinned (visually elevated). Rest sorted by `useCount` desc. "Open Lab →" header link. Empty state with shimmer CTA. |

### 🔨 Fix
| Pattern | Action |
|---------|--------|
| **UniversalNav** | Token-correct active states. Lab item: gold 1px left-border, gold icon, 22px icon. Separator above/below Lab. Inactive items: `--text-muted`. Active: `--text-primary`. No pill backgrounds except Lab. |

### ⚠️ Audit
| Pattern | Action |
|---------|--------|
| **SpacePanel** | Token compliance — hex values, focus rings, gold usage |
| **SpaceHeader** | Token compliance — verified badge, online count |

---

## SUMMARY — Actions by Priority

### Do first (blockers or highest-impact):
1. 🔨 Fix radius token collision (`--radius-md` vs `--radius-lg`)
2. 🔨 Fix ToolCard hover → glow-effect + recency warmth
3. 🔨 Fix ProfileCardFull → slim header
4. 🔨 Fix StatAtom → Number Ticker animation
5. 🔨 Fix Button → add shimmer variant for Lab CTA, then lock
6. 🔨 Fix Input / Textarea → audit focus + 15px text, then lock
7. ❌ Delete ToolCardAtom
8. 🏗️ Build UniversalNav rebuild
9. 🏗️ Build ToolGrid pattern
10. 🏗️ Build ProfilePage organism

### Audit pass (token compliance sweep):
11. ⚠️ All ⚠️ AUDIT items above — focus rings white, gold only where approved, no hardcoded hex
    Priority order: Badge → Card → TopBar → PostCard → SpaceHeader → ChatComposer → all others

### Documentation:
12. 🔨 Add Icon standard to `DESIGN_RULES.md`
13. 🔨 Add Card warmth API JSDoc
14. 🏗️ App grid tokens
15. 🏗️ Foundations Storybook docs
