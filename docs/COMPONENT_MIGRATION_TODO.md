# Component Migration TODO

> Track Design System V2 migration and UI/UX polish for all HIVE components.

**Target**: December 9-13, 2025 - Production Launch
**Total Components**: 170+

---

## Priority Legend

- **P0** - Launch blocker
- **P1** - High impact
- **P2** - Nice to have

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete

---

## 00-Global Atoms (P0)

Core primitives used everywhere.

### Inputs & Forms
- [ ] `alert.tsx` - Migrate to CSS vars
- [x] `button.tsx` - Add hover/active states, gold primary
- [ ] `checkbox.tsx` - Focus ring with --ring
- [x] `input.tsx` - Focus states, error states
- [ ] `label.tsx` - Typography tokens
- [ ] `select.tsx` - Dropdown styling
- [ ] `slider.tsx` - Track colors
- [ ] `switch.tsx` - On/off states
- [ ] `textarea.tsx` - Focus states

### Display
- [ ] `avatar.tsx` - Ring colors, fallback
- [x] `badge.tsx` - All variants (default, gold, outline)
- [x] `card.tsx` - Background, border tokens
- [ ] `progress.tsx` - Track and indicator colors
- [x] `skeleton.tsx` - Shimmer animation
- [ ] `tooltip.tsx` - Background, text colors

### Feedback
- [ ] `dialog.tsx` - Overlay, content styling
- [ ] `popover.tsx` - Background, border
- [ ] `sheet.tsx` - Slide animations
- [ ] `toast.tsx` - Status variants
- [ ] `sonner-toast.tsx` - Theme integration

### Navigation
- [ ] `tabs.tsx` - Active state styling
- [ ] `command.tsx` - Search input, item highlights
- [ ] `context-menu.tsx` - Item hover states
- [ ] `dropdown-menu.tsx` - Item styling

### Specialty
- [ ] `date-time-picker.tsx` - Calendar styling
- [ ] `file-upload.tsx` - Drag states
- [ ] `hive-card.tsx` - Brand styling
- [ ] `hive-confirm-modal.tsx` - Action buttons
- [ ] `hive-logo.tsx` - Brand mark
- [ ] `hive-modal.tsx` - Overlay styling
- [ ] `icon-library.tsx` - Icon colors
- [ ] `lazy-image.tsx` - Loading states
- [ ] `loading-button.tsx` - Spinner integration
- [ ] `progressive-image.tsx` - Blur placeholder
- [ ] `simple-avatar.tsx` - Fallback colors

### Utilities
- [ ] `aria-live-region.tsx` - Accessibility
- [ ] `check-icon.tsx` - Color token
- [ ] `connection-status.tsx` - Status colors
- [ ] `grid.tsx` - Gap tokens

---

## 00-Global Molecules (P0)

Composed components for common patterns.

- [ ] `description-list.tsx` - Typography hierarchy
- [ ] `dropdown-menu.tsx` - Item states
- [ ] `empty-state-compact.tsx` - Icon, text colors
- [ ] `filter-chips.tsx` - Active/inactive states
- [ ] `keyboard-shortcuts-overlay.tsx` - Backdrop
- [ ] `kpi-delta.tsx` - Positive/negative colors
- [ ] `notification-card.tsx` - Unread indicator
- [ ] `notification-dropdown.tsx` - Badge count
- [ ] `onboarding-frame.tsx` - Progress indicator
- [ ] `privacy-control.tsx` - Toggle states
- [ ] `progress-list.tsx` - Step states
- [ ] `search-bar.tsx` - Focus states
- [ ] `stat-card.tsx` - Background variants
- [ ] `table.tsx` - Header, row styling
- [ ] `tag-list.tsx` - Tag variants
- [ ] `user-avatar-group.tsx` - Overlap styling

---

## 00-Global Organisms (P1)

Complex patterns for app-wide features.

- [ ] `desktop-nav.tsx` - Active states, sidebar vars
- [ ] `mobile-nav.tsx` - Bottom nav styling
- [ ] `notification-dropdown-branded.tsx` - HIVE styling
- [ ] `notification-system.tsx` - Toast integration
- [ ] `notification-toast-container.tsx` - Position
- [ ] `profile-dropdown-branded.tsx` - Avatar, menu
- [ ] `welcome-mat.tsx` - Onboarding styling
- [ ] `hive-navigation-example.tsx` - Reference impl

---

## 00-Global Templates (P1)

- [ ] `auth-onboarding-layout.tsx` - Page structure

---

## 02-Feed Atoms (P0)

- [ ] `media-thumb.tsx` - Hover overlay
- [ ] `media-viewer.tsx` - Modal styling
- [ ] `notification-bell.tsx` - Badge indicator
- [ ] `notification-item.tsx` - Read/unread states
- [ ] `percent-bar.tsx` - Track colors
- [ ] `post-card.tsx` - Card styling
- [ ] `presence-indicator.tsx` - Gold online dot

---

## 02-Feed Molecules (P0)

- [ ] `feed-filter-bar.tsx` - Tab active states
- [ ] `feed-media-preview.tsx` - Gallery styling
- [ ] `feed-post-actions.tsx` - Like, comment, share
- [ ] `feed-ritual-banner.tsx` - Gold accent
- [ ] `feed-space-chip.tsx` - Space colors

---

## 02-Feed Organisms (P0)

- [ ] `feed-card-event.tsx` - Event styling
- [ ] `feed-card-post.tsx` - Standard post
- [ ] `feed-card-system.tsx` - System announcements
- [ ] `feed-card-tool.tsx` - Tool preview
- [ ] `feed-composer-sheet.tsx` - Create post
- [ ] `feed-virtualized-list.tsx` - Performance
- [ ] `post-composer-skeleton.tsx` - Loading state

---

## 02-Feed Templates (P0)

- [ ] `feed-loading-skeleton.tsx` - Full page skeleton
- [ ] `feed-page-layout.tsx` - Page structure

---

## 03-Chat (P2)

- [ ] `chat-input.tsx` - Input styling
- [ ] `conversation-thread.tsx` - Message list
- [ ] `message-bubble.tsx` - Sent/received
- [ ] `tool-preview-card.tsx` - Embedded tool
- [ ] `typing-indicator.tsx` - Animation

---

## 03-Spaces Atoms (P1)

- [ ] `top-bar-nav.tsx` - Navigation

---

## 03-Spaces Molecules (P0)

- [ ] `navigation-primitives.tsx` - Core nav
- [ ] `now-card.tsx` - Live activity
- [ ] `pinned-posts-stack.tsx` - Max 2 pins
- [ ] `rail-widget.tsx` - Widget card
- [ ] `space-about-widget.tsx` - Description
- [ ] `space-composer.tsx` - Create post
- [ ] `space-header.tsx` - Banner, actions
- [ ] `space-tools-widget.tsx` - Tool list
- [ ] `today-drawer.tsx` - Calendar

---

## 03-Spaces Organisms (P0)

- [ ] `space-board-layout.tsx` - Main layout
- [ ] `space-board-skeleton.tsx` - Loading
- [ ] `space-post-composer.tsx` - Full composer

---

## 03-Spaces Templates (P1)

- [ ] `space-board-template.tsx` - Page template

---

## 04-Profile Molecules (P1)

- [ ] `profile-bento-grid.tsx` - Grid layout

---

## 04-Profile Organisms (P1)

- [ ] `profile-activity-widget.tsx` - Activity feed
- [ ] `profile-completion-card.tsx` - Progress
- [ ] `profile-connections-widget.tsx` - Friends
- [ ] `profile-identity-widget.tsx` - Bio, major
- [ ] `profile-spaces-widget.tsx` - Joined spaces
- [ ] `profile-widgets.tsx` - Widget container

---

## 04-Profile Templates (P1)

- [ ] `profile-view-layout.tsx` - Page layout

---

## 05-HiveLab Molecules (P2)

- [ ] `hivelab-element-palette.tsx` - Drag source
- [ ] `hivelab-inspector-panel.tsx` - Properties
- [ ] `hivelab-lint-panel.tsx` - Validation
- [ ] `hivelab-tool-library-card.tsx` - Tool card

---

## 05-HiveLab Organisms (P2)

- [ ] `hivelab-studio.tsx` - Main editor
- [ ] `hivelab-widget.tsx` - Embedded widget
- [ ] `tool-library-skeleton.tsx` - Loading

---

## 06-Rituals Molecules (P1)

- [ ] `ritual-empty-state.tsx` - No rituals
- [ ] `ritual-error-state.tsx` - Error display
- [ ] `ritual-loading-skeleton.tsx` - Loading
- [ ] `ritual-progress-bar.tsx` - Completion

---

## 06-Rituals Organisms (P1)

- [ ] `ritual-beta-lottery.tsx` - Beta access
- [ ] `ritual-card.tsx` - Standard card
- [ ] `ritual-feature-drop.tsx` - Feature unlock
- [ ] `ritual-founding-class.tsx` - Early adopter
- [ ] `ritual-launch-countdown.tsx` - Timer
- [ ] `ritual-leak.tsx` - Sneak peek
- [ ] `ritual-rule-inversion.tsx` - Challenge
- [ ] `ritual-strip.tsx` - Horizontal list
- [ ] `ritual-survival.tsx` - Survival game
- [ ] `ritual-tournament-bracket.tsx` - Tournament
- [ ] `ritual-unlock-challenge.tsx` - Challenge

---

## 06-Rituals Templates (P1)

- [ ] `rituals-page-layout.tsx` - Page layout

---

## 07-Admin Organisms (P2)

- [ ] `admin-dashboard-primitives.tsx` - Charts
- [ ] `admin-shell.tsx` - Admin layout

---

## A11y Components (P0)

Accessibility primitives.

- [ ] `ClickAwayListener.tsx` - Outside click
- [ ] `FocusRing.tsx` - Focus indicator
- [ ] `FocusTrap.tsx` - Modal focus
- [ ] `LiveRegion.tsx` - Screen reader
- [ ] `Measure.tsx` - Size measurement
- [ ] `Portal.tsx` - React portal
- [ ] `SkipToContent.tsx` - Skip link
- [ ] `VirtualList.tsx` - Virtualization
- [ ] `VisuallyHidden.tsx` - SR only

---

## Layout Components (P1)

- [ ] `container.tsx` - Max width
- [ ] `grid.tsx` - CSS Grid
- [ ] `page-header.tsx` - Page title
- [ ] `scroll-area.tsx` - Scrollbar
- [ ] `separator.tsx` - Divider
- [ ] `spacer.tsx` - Spacing
- [ ] `stack.tsx` - Flex stack
- [ ] `surface.tsx` - Background
- [ ] `viewport-safe-area.tsx` - Mobile safe

---

## Typography Components (P1)

- [ ] `caption.tsx` - Small text
- [ ] `heading.tsx` - H1-H6
- [ ] `link.tsx` - Anchor styling
- [ ] `text.tsx` - Body text

---

## Identity Components (P1)

- [ ] `icon.tsx` - Icon wrapper
- [ ] `presence.tsx` - Online status

---

## Auth Organisms (P0)

- [ ] `LoginEmailCard.tsx` - Email input
- [ ] `LoginLinkSentCard.tsx` - Confirmation
- [ ] `LoginSchoolSelectionCard.tsx` - School picker
- [ ] `VerifyLinkStatusCard.tsx` - Verification
- [ ] `SignupGateModal.tsx` - Signup prompt

---

## HiveLab Components (P2)

- [ ] `AIPromptInput.tsx` - AI prompt
- [ ] `element-renderers.tsx` - Element display
- [ ] `SkeletonCanvas.tsx` - Loading canvas
- [ ] `StreamingCanvasView.tsx` - Live preview
- [ ] `StreamingCanvasWrapper.tsx` - Wrapper
- [ ] `ToolDeployModal.tsx` - Deploy dialog
- [ ] `visual-tool-composer.tsx` - Visual editor

### Studio Components
- [ ] `CanvasDropZone.tsx` - Drop target
- [ ] `DndStudioProvider.tsx` - DnD context
- [ ] `DraggablePaletteItem.tsx` - Drag source
- [ ] `SortableCanvasElement.tsx` - Sortable
- [ ] `ToolStudioExample.tsx` - Example

---

## Motion Primitives (P2)

- [ ] `auto-animated.tsx` - Auto animate
- [ ] `in-view.tsx` - Intersection
- [ ] `lottie-animation.tsx` - Lottie

---

## Page Components (P1)

### Feed Pages
- [ ] `FeedLoadingSkeleton.tsx` - Skeleton
- [ ] `FeedPage.tsx` - Main feed

### HiveLab Pages
- [ ] `AILandingPageChat.tsx` - Chat landing
- [ ] `HiveLabSkeletons.tsx` - Skeletons
- [ ] `HiveLabToolsPage.tsx` - Tool library
- [ ] `ToolAnalyticsPage.tsx` - Analytics
- [ ] `ToolEditPage.tsx` - Editor
- [ ] `ToolPreviewPage.tsx` - Preview

### Profile Pages
- [ ] `ProfileOverviewPage.tsx` - Main profile
- [ ] `ProfileViewLoadingSkeleton.tsx` - Skeleton

### Spaces Pages
- [ ] `SpaceCard.tsx` - Space card
- [ ] `SpacesDiscoveryPage.tsx` - Browse
- [ ] `SpacesSkeletons.tsx` - Skeletons

### Onboarding
- [ ] `OnboardingFlowPage.tsx` - Flow

---

## Layouts (P1)

- [ ] `FeedLayout.tsx` - Feed page layout
- [ ] `ProfileBentoLayout.tsx` - Profile grid

---

## Shells (P0)

- [ ] `UniversalShell.tsx` - Main app shell
- [ ] `motion-safe.tsx` - Reduced motion

---

## Providers (P1)

- [ ] `HiveProvider.tsx` - Root provider

---

## Systems (P1)

- [ ] `modal-toast-system.tsx` - Modal/toast

---

## Navigation (P1)

- [ ] `UniversalNav.tsx` - Navigation

---

## Other (P2)

- [ ] `countdown.tsx` - Timer
- [ ] `input-otp.tsx` - OTP input
- [ ] `resizable-divider.tsx` - Resize handle
- [ ] `welcome-mat.tsx` - Welcome

---

## Duplicate Files to Remove

These have " 2" suffix and should be deleted:

- [x] ~~`button 2.tsx`~~ (not found)
- [x] `hive-card 2.tsx` - Removed
- [x] `input 2.tsx` - Removed
- [x] `select 2.tsx` - Removed

---

## Migration Checklist Per Component

For each component:

1. [ ] Replace hardcoded colors with CSS vars
2. [ ] Use semantic tokens (--background, --foreground)
3. [ ] Add proper hover/focus states
4. [ ] Test dark theme
5. [ ] Verify touch targets (44px min)
6. [ ] Check contrast ratios
7. [ ] Add loading/error/empty states
8. [ ] Update Storybook story

---

## Progress Tracking

| Category | Total | Complete | % |
|----------|-------|----------|---|
| 00-Global Atoms | 35 | 5 | 14% |
| 00-Global Molecules | 16 | 0 | 0% |
| 00-Global Organisms | 8 | 0 | 0% |
| 02-Feed | 16 | 0 | 0% |
| 03-Spaces | 12 | 0 | 0% |
| 04-Profile | 8 | 0 | 0% |
| 05-HiveLab | 7 | 0 | 0% |
| 06-Rituals | 15 | 0 | 0% |
| Auth | 5 | 0 | 0% |
| Layout | 9 | 0 | 0% |
| A11y | 9 | 0 | 0% |
| Pages | 14 | 0 | 0% |
| **Total** | **154** | **5** | **3%** |

---

## Quick Wins (Do First)

High impact, low effort:

1. [x] `button.tsx` - Used everywhere
2. [x] `card.tsx` - Used everywhere
3. [x] `input.tsx` - Forms
4. [x] `badge.tsx` - Labels
5. [x] `skeleton.tsx` - Loading states
6. [ ] `UniversalShell.tsx` - App shell
7. [ ] `feed-card-post.tsx` - Main content
8. [ ] `space-header.tsx` - Space identity

---

*Last updated: November 2025*
