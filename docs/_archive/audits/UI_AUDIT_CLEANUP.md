# HIVE UI Aesthetic Audit - AI Generic Cleanup List

**Date:** 2025-12-25
**Reference Aesthetic:** Linear, Vercel, Notion, Stripe (clean, dense, functional, serious)
**Current Problem:** Too many "AI startup" vibes - sparkles, glows, gold everywhere

---

## EXECUTIVE SUMMARY

| Pattern | Count | Severity | Action |
|---------|-------|----------|--------|
| Gold color usage | **856** in 203 files | CRITICAL | Reduce by 80% |
| Sparkles icon | **60+** instances | HIGH | Keep only for AI features |
| SparklesText component | 2 files | HIGH | DELETE entirely |
| BorderBeam/ShineBorder | 7 files | HIGH | DELETE entirely |
| GlowEffect usage | 30+ files | MEDIUM | Simplify, remove most |
| Gradients | 100+ instances | MEDIUM | Audit, keep only functional |
| animate-pulse decorative | 40+ instances | MEDIUM | Keep only for loading |

---

## 1. COMPONENTS TO DELETE (motion-primitives)

These screech "AI startup" and add zero value:

### DELETE ENTIRELY:
```
packages/ui/src/components/motion-primitives/sparkles-text.tsx
packages/ui/src/components/motion-primitives/border-beam.tsx
packages/ui/src/components/motion-primitives/shine-border.tsx
```

### Files using SparklesText (must update):
| File | Line | Action |
|------|------|--------|
| atomic/04-Profile/molecules/profile-bento-grid.tsx | 32, 657, 858 | Replace with plain text |

### Files using BorderBeam/ShineBorder (must update):
| File | Lines | Action |
|------|-------|--------|
| atomic/04-Profile/organisms/profile-coming-soon.tsx | 19-20, 63-64, 162-163 | Remove effects |
| atomic/04-Profile/molecules/profile-bento-grid.tsx | 30-31, 1046, 1054 | Remove effects |
| components/hivelab/ide/element-palette.tsx | 32, 362 | Remove effects |

---

## 2. SPARKLES ICON OVERUSE (Lucide)

**Current:** 60+ uses
**Target:** 5-10 uses (AI generation features ONLY)

### KEEP (legitimate AI indicators):
- `components/hivelab/ide/ai-command-palette.tsx` - AI command
- `components/hivelab/AIPromptInput.tsx` - AI input
- `atomic/03-Chat/intent-confirmation.tsx` - AI intent

### REMOVE or REPLACE with simpler icons:
| File | Line | Replace With |
|------|------|-------------|
| atomic/03-Spaces/molecules/space-hero-card.tsx | 19, 151 | Star or nothing |
| atomic/03-Spaces/molecules/rail-widget.tsx | 10, 48 | Zap or Lightning |
| atomic/03-Spaces/molecules/tool-picker-popover.tsx | 322 | Wand2 |
| atomic/03-Spaces/molecules/space-empty-state.tsx | 129 | Package |
| atomic/03-Spaces/molecules/space-discovery-card.tsx | 22, 151 | Star |
| atomic/03-Spaces/premium/premium-composer.tsx | 21, 274 | Send only |
| atomic/03-Spaces/organisms/widget-gallery.tsx | 364 | Grid |
| atomic/03-Spaces/organisms/add-tab-modal.tsx | 10 | Plus |
| atomic/03-Spaces/organisms/space-welcome-modal.tsx | 136 | Check |
| atomic/03-Spaces/organisms/space-leader-onboarding-modal.tsx | 143, 292 | Check, Settings |
| atomic/03-Spaces/organisms/add-widget-modal.tsx | 15 | Plus |
| atomic/00-Global/molecules/empty-state-compact.tsx | 7, 41 | Inbox |
| atomic/00-Global/molecules/hero-input.tsx | 19, 129 | Search |
| atomic/00-Global/organisms/command-palette.tsx | 66 | Command |
| atomic/04-Profile/organisms/profile-hivelab-widget.tsx | 269 | Wrench |
| atomic/04-Profile/organisms/profile-spaces-widget.tsx | 3, 100, 187 | Users or Grid |
| atomic/04-Profile/organisms/profile-completion-card.tsx | 4, 92 | CheckCircle |
| atomic/04-Profile/organisms/profile-coming-soon.tsx | 126, 293 | Clock or Calendar |
| atomic/06-Rituals/molecules/ritual-empty-state.tsx | 3, 37 | Calendar |
| atomic/06-Rituals/templates/rituals-page-layout.tsx | 3, 127 | Calendar |
| atomic/06-Rituals/organisms/ritual-completion-celebration.tsx | 18, 280, 287 | Trophy (keep only trophy) |
| atomic/06-Rituals/organisms/ritual-strip.tsx | 4, 72 | Calendar or event icon |
| atomic/02-Feed/molecules/feed-ritual-banner.tsx | 32, 122 | Calendar |
| atomic/02-Feed/atoms/notification-item.tsx | 113 | Bell |
| atomic/02-Feed/organisms/feed-card-system.tsx | 68 | Bell or Alert |
| atomic/02-Feed/organisms/feed-card-tool.tsx | 92 | Wrench |
| components/hivelab/ide/ide-toolbar.tsx | 225 | Wand2 |
| components/hivelab/ide/onboarding-overlay.tsx | 5, 59, 94 | Lightbulb |
| components/hivelab/remix-dialog.tsx | 181 | RefreshCw |
| components/hivelab/template-suggestions.tsx | 156, 186 | Layout |
| components/hivelab/automation-templates.tsx | 272, 388 | Zap |
| components/hivelab/showcase/TemplateBrowser.tsx | 93 | Layout |
| components/motion-primitives/space-celebrations.tsx | 14, 209 | Star (celebrations OK) |
| pages/hivelab/AILandingPageChat.tsx | 31, 503 | Command |

---

## 3. GLOW EFFECT OVERUSE

### KEEP (achievement moments only):
- `motion/interactions.tsx` - achievement glow (line 279-293)
- `motion-primitives/glow-effect.tsx` - but simplify

### REMOVE glow from:
| File | Context | Action |
|------|---------|--------|
| atomic/03-Spaces/atoms/glass-surface.tsx | glass surface glow prop | Remove glow option |
| atomic/03-Spaces/atoms/momentum-indicator.tsx | pulse + glow | Keep pulse, remove glow |
| atomic/03-Spaces/atoms/category-pill.tsx | gold glow on active | Remove |
| atomic/03-Spaces/molecules/space-hero-card.tsx | hover glow | Remove |
| atomic/03-Spaces/molecules/space-discovery-card.tsx | hover glow | Remove |
| atomic/03-Spaces/molecules/space-empty-state.tsx | icon glow | Remove |
| atomic/03-Spaces/molecules/space-header.tsx | online dot glow | Remove shadow |
| atomic/02-Feed/organisms/feed-card-system.tsx | accent glow | Remove |
| atomic/02-Feed/atoms/notification-bell.tsx | urgent glow | Keep for urgent only |
| atomic/06-Rituals/organisms/ritual-strip.tsx | gold glow | Remove |
| atomic/06-Rituals/organisms/ritual-completion-celebration.tsx | radial glow | Keep (celebration) |
| components/hivelab/ide/ide-canvas.tsx | glow on hover | Remove |
| components/hivelab/ide/element-palette.tsx | premium tier glow | Remove |
| lib/glass-morphism.ts | glow tokens | Reduce/simplify |
| lib/premium-design.ts | glow utilities | Remove most |
| styles-v4.css | hive-glow animation | Remove |
| styles/tech-sleek-theme.css | glow-pulse, text-gold-glow | Remove |

---

## 4. GOLD COLOR OVERUSE

**Current:** 856 occurrences in 203 files
**Target:** ~100 occurrences (CTAs, achievements, verification only)

### GOLD RULES (per design system):
**ALLOWED:**
- Primary CTA buttons ONLY
- Achievement badges
- Verified indicators
- Active navigation (sparingly)
- Progress completion celebrations

**NOT ALLOWED:**
- Decorative backgrounds
- Text color (except on dark CTAs)
- Borders
- General icons
- Loading states
- Hover effects
- "Featured" badges (use white border instead)

### HIGH-PRIORITY GOLD CLEANUP FILES:
| File | Occurrences | Priority |
|------|-------------|----------|
| atomic/03-Spaces/* | 150+ | HIGH |
| atomic/04-Profile/* | 50+ | HIGH |
| atomic/06-Rituals/* | 40+ | HIGH |
| components/hivelab/* | 60+ | MEDIUM |
| atomic/02-Feed/* | 30+ | MEDIUM |
| lib/premium-design.ts | 15+ | HIGH (defines tokens) |
| styles/tech-sleek-theme.css | 26 | HIGH |

---

## 5. GRADIENT OVERUSE

**Current:** 100+ gradient usages
**Linear/Vercel style:** Solid colors, minimal gradients

### KEEP gradients only for:
- Overlay fades (to-transparent for readability)
- Progress bars
- Actual celebratory moments

### REMOVE gradients from:
| File | Line | Context |
|------|------|---------|
| pages/hivelab/ToolAnalyticsPage.tsx | 93, 108, 140 | Replace with solid |
| layouts/ProfileBentoLayout.tsx | 13, 17, 61, 74, 87 | Replace with solid + border |
| atomic/06-Rituals/organisms/ritual-strip.tsx | 55-56 | Replace with subtle border |
| atomic/06-Rituals/organisms/ritual-card.tsx | 87, 103, 114, 198 | Replace with solid |
| atomic/02-Feed/organisms/feed-card-system.tsx | 51, 53, 55 | Replace with solid + border |
| atomic/02-Feed/molecules/feed-ritual-banner.tsx | 101, 106, 113, 162 | Simplify |

---

## 6. EXCESSIVE ANIMATION (animate-*)

### animate-pulse - KEEP only for:
- Loading skeletons
- Status indicators (online, live)
- Urgent notifications

### REMOVE animate-pulse from:
| File | Line | Context |
|------|------|---------|
| atomic/06-Rituals/organisms/ritual-survival.tsx | 49 | Badge pulse |
| components/hivelab/SkeletonCanvas.tsx | 44-56 | Too many pulses |
| atomic/03-Spaces/organisms/event-details-modal.tsx | 334 | Text pulse |

### animate-bounce - REMOVE all decorative:
Only keep for loading/progress states.

---

## 7. SHIMMER EFFECTS

**Delete all shimmer except loading skeletons:**
| File | Line | Action |
|------|------|--------|
| atomic/06-Rituals/organisms/ritual-strip.tsx | 64 | Remove gold shimmer |
| atomic/06-Rituals/organisms/ritual-card.tsx | 101 | Remove gold shimmer |
| atomic/04-Profile/organisms/profile-coming-soon.tsx | 238 | Remove shimmer |

---

## IMPLEMENTATION ORDER

### Phase 1: Delete Components (30 min)
1. Delete `sparkles-text.tsx`, `border-beam.tsx`, `shine-border.tsx`
2. Update exports in `motion-primitives/index.ts` and `ui/src/index.ts`
3. Fix import errors in profile-bento-grid.tsx, profile-coming-soon.tsx, element-palette.tsx

### Phase 2: Sparkles Icon Sweep (1 hour)
1. Replace all non-AI Sparkles icons with appropriate alternatives
2. Keep only in: ai-command-palette, AIPromptInput, intent-confirmation

### Phase 3: Gold Reduction (2 hours)
1. Update `lib/premium-design.ts` - remove glow utilities
2. Update `lib/glass-morphism.ts` - remove gold glow tokens
3. Update `styles/tech-sleek-theme.css` - remove gold animations
4. Sweep through high-priority files, replace gold with white/gray borders

### Phase 4: Motion Cleanup (1 hour)
1. Remove GlowEffect from most components
2. Simplify to: hover border color change, subtle scale
3. Remove gradient backgrounds, replace with solid

### Phase 5: Gradient Simplification (1 hour)
1. Replace decorative gradients with solid colors
2. Keep only functional gradients (overlays, progress)

---

## QUICK WINS (Do First)

1. **Delete motion-primitives files** - Instant cleanup
2. **Remove `shadow-[0_0_*px_*]` glow shadows** - grep and delete
3. **Replace `text-gold-*` with `text-white`** - mass replace
4. **Remove `bg-gradient-to-* from-[#FFD700]`** - grep and simplify

---

## AESTHETIC TARGET

**Before:** ✨🌟💫 Sparkly AI startup vibes
**After:** Clean. Dense. Functional. Serious.

Think: Linear's sidebar. Vercel's dashboard. Notion's editor. Stripe's docs.

No sparkles. No glows. No "billion-dollar UI" comments. Just good software.
