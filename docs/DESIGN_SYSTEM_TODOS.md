# Design System TODOs: Apple/Vercel Quality Sprint

**Goal:** Transform every primitive, component, and container to Apple/Vercel quality level.
**Method:** Experimentation in Storybook. Each item gets a story that showcases the enhanced version.
**Philosophy:** The last 30% that makes users *feel* something.

---

## Priority Legend

- **P0** - Core primitives that affect everything else
- **P1** - High-visibility components users interact with constantly
- **P2** - Secondary components that support the experience
- **P3** - Edge cases and polish

---

## PRIMITIVES (32 total)

### Inputs (P0 - Touch Every Interaction)

#### Button.tsx ✅ REFINED (Jan 12, 2026)
- [x] **Glass pills matching Card** - backdrop-blur-sm, rounded-full
- [x] **Spring easing with POP** - `cubic-bezier(0.34,1.56,0.64,1)` overshoot
- [x] **Hover scale** - `hover:scale-[1.02]` with shadow expansion
- [x] **Press state** - `active:scale-[0.97]` for tactile feedback
- [x] **Deep shadows** - Ring + depth + inset highlight matching Card
- [x] **Gold as TEXT** - CTA uses gold text on glass, not solid fill
- [x] **Focus rings WHITE** - Never gold, always white/50

#### Input.tsx
- [ ] **Add focus glow** - Subtle white glow behind focus ring
- [ ] **Add typing animation** - Border color shift while typing
- [ ] **Add error shake** - Micro-animation on validation error
- [ ] **Story: "Input States Comparison"** - All states side-by-side

#### Textarea.tsx
- [ ] **Add focus expansion** - Subtle height increase on focus
- [ ] **Add character count with urgency** - Color shift as limit approaches
- [ ] **Story: "Textarea Focus Behavior"**

#### Select.tsx
- [ ] **Add dropdown animation** - Scale + fade from trigger
- [ ] **Add option hover lift** - Subtle translateY on option hover
- [ ] **Story: "Select Dropdown Animation"**

#### Checkbox.tsx
- [ ] **Add check animation** - SVG path draw animation
- [ ] **Add ripple on click** - Subtle background ripple
- [ ] **Story: "Checkbox Micro-interactions"**

#### Radio.tsx
- [ ] **Add selection pulse** - Gold pulse on selection
- [ ] **Add dot scale animation** - Scale from 0 to 1
- [ ] **Story: "Radio Selection Animation"**

#### Switch.tsx
- [ ] **Add toggle slide** - Smooth thumb movement with overshoot
- [ ] **Add track color transition** - Gradient shift on toggle
- [ ] **Add haptic-feel bounce** - Subtle thumb bounce at end
- [ ] **Story: "Switch Toggle Physics"**

### Containers (P0 - Every Surface)

#### Card.tsx
- [ ] **Differentiate atmospheres dramatically**
  - Landing: Internal glow gradient, more blur
  - Spaces: Layered shadows, subtle depth
  - Workshop: Sharper corners, tighter padding
- [ ] **Add hover lift for interactive** - 2px translateY + shadow expansion
- [ ] **Add warmth pulse** - Subtle pulse at high warmth levels
- [ ] **Add glass reflection** - Subtle gradient overlay on translucent
- [ ] **Story: "Card Atmospheres Dramatic Comparison"**
- [ ] **Story: "Card Hover Physics"**

#### Modal.tsx
- [ ] **Add backdrop blur transition** - Blur increases during open animation
- [ ] **Add content scale** - Scale from 0.95 with smooth easing
- [ ] **Add sheet drag indicator** - Pill that hints at drag
- [ ] **Story: "Modal Open/Close Choreography"**

#### Toast.tsx
- [ ] **Add entrance slide** - Slide from edge with spring
- [ ] **Add progress bar** - Auto-dismiss countdown visualization
- [ ] **Add exit animation** - Slide + fade combo
- [ ] **Story: "Toast Notification Lifecycle"**

#### Tooltip.tsx
- [ ] **Add delay with intent detection** - Only show if hover lingers
- [ ] **Add pointer-following** - Tooltip follows cursor subtly
- [ ] **Story: "Tooltip Hover Intelligence"**

### Typography (P1 - Every Word)

#### Heading.tsx
- [ ] **Add letter-spacing tightening** - Tighter at larger sizes
- [ ] **Add gradient text option** - For hero moments
- [ ] **Story: "Heading Scale Demonstration"**

#### Text.tsx
- [ ] **Add prose rhythm** - Proper line-height cascade
- [ ] **Add selection highlight** - Custom ::selection color
- [ ] **Story: "Text Readability Showcase"**

#### DisplayText.tsx
- [ ] **Add Clash Display enforcement** - Font swap at 32px+
- [ ] **Add hero animation** - Fade-in-up on mount option
- [ ] **Story: "Display Text Hero Moments"**

#### Mono.tsx
- [ ] **Add syntax-aware highlighting** - Code-like appearance
- [ ] **Add copy-on-click** - With confirmation animation
- [ ] **Story: "Mono Data Display"**

#### Label.tsx
- [ ] **Add required indicator** - Subtle gold dot
- [ ] **Add error state styling** - Color shift on error
- [ ] **Story: "Label Form Integration"**

### Feedback (P1 - Every Response)

#### Progress.tsx
- [ ] **Add shimmer animation** - Moving highlight along bar
- [ ] **Add completion celebration** - Brief glow at 100%
- [ ] **Story: "Progress Animation States"**

#### Skeleton.tsx
- [ ] **Add shimmer wave** - Use defined @keyframes shimmer
- [ ] **Add pulse alternative** - Breathing opacity for variety
- [ ] **Story: "Skeleton Loading Patterns"**

#### Badge.tsx
- [ ] **Add entrance animation** - Scale-in on mount
- [ ] **Add count update animation** - Number morph
- [ ] **Story: "Badge Notification Patterns"**

### Life Indicators (P0 - HIVE Signature)

#### PresenceDot.tsx
- [ ] **Add breathing animation** - Use --duration-breathe (3s)
- [ ] **Add status transition** - Smooth color morph between states
- [ ] **Add ring pulse on active** - Radiating ring effect
- [ ] **Story: "Presence Breathing Demo"**

#### LiveCounter.tsx
- [ ] **Add number tick animation** - Rolling number effect
- [ ] **Add warmth correlation** - Edge glow increases with count
- [ ] **Story: "Live Counter Activity"**

#### TypingIndicator.tsx
- [ ] **Add dot cascade** - Staggered bounce timing
- [ ] **Add fade in/out** - Smooth appearance/disappearance
- [ ] **Story: "Typing Indicator Realism"**

#### ActivityEdge.tsx
- [ ] **Add warmth gradient** - Edge intensity varies along border
- [ ] **Add pulse on change** - Brief pulse when activity increases
- [ ] **Story: "Activity Edge Warmth Levels"**

### Navigation (P1 - Every Click Path)

#### Tabs.tsx
- [ ] **Add indicator slide** - Animated underline following selection
- [ ] **Add content crossfade** - Smooth content transition
- [ ] **Story: "Tabs Selection Animation"**

#### Link.tsx
- [ ] **Add underline animation** - Draw-in on hover
- [ ] **Add visited state** - Subtle color shift for visited
- [ ] **Story: "Link Hover Behaviors"**

### Utility (P2)

#### Separator.tsx
- [ ] **Add gradient fade** - Edges fade to transparent
- [ ] **Story: "Separator Visual Options"**

#### Icon.tsx
- [ ] **Add hover animation option** - Subtle rotation or scale
- [ ] **Add loading spin** - For action icons
- [ ] **Story: "Icon Interactive States"**

### HiveLab Specific (P2)

#### CanvasArea.tsx
- [ ] **Add grid snap animation** - Elements snap with subtle bounce
- [ ] **Story: "Canvas Grid Behavior"**

#### HandleDot.tsx
- [ ] **Add drag feedback** - Scale up when grabbed
- [ ] **Add drop shadow on drag** - Floating effect
- [ ] **Story: "Handle Drag Interaction"**

#### PropertyField.tsx
- [ ] **Add value change highlight** - Brief glow on value update
- [ ] **Story: "Property Field Updates"**

---

## COMPONENTS (90+ files)

### Space Components (P0)

#### SpaceCard.tsx
- [ ] **Add warmth-based hover intensity** - More active = stronger hover
- [ ] **Add member avatar peek** - Show 3 avatars on hover
- [ ] **Add territory gradient** - Subtle category-specific gradient
- [ ] **Story: "SpaceCard Warmth Levels"**
- [ ] **Story: "SpaceCard Territory Variants"**

#### SpaceHeader.tsx
- [ ] **Add parallax on scroll** - Background moves slower
- [ ] **Add member count animation** - Tick up on join
- [ ] **Story: "SpaceHeader Scroll Behavior"**

#### ChatMessage.tsx
- [ ] **Add entrance stagger** - Messages slide in sequentially
- [ ] **Add reaction pop** - Reactions bounce in
- [ ] **Add hover reveal** - Actions fade in on hover
- [ ] **Story: "ChatMessage Interaction States"**

#### ChatComposer.tsx
- [ ] **Add typing expansion** - Grows with content
- [ ] **Add send animation** - Message flies to thread
- [ ] **Story: "ChatComposer Focus Behavior"**

#### MessageGroup.tsx
- [ ] **Add read receipt animation** - Checkmarks appear
- [ ] **Add timestamp reveal** - Show on hover
- [ ] **Story: "MessageGroup Threading"**

### Profile Components (P1)

#### ProfileCard.tsx
- [ ] **Add avatar hover zoom** - Subtle scale on avatar hover
- [ ] **Add connection status glow** - Edge warmth for connected users
- [ ] **Story: "ProfileCard Interaction"**

#### AvatarGroup.tsx
- [ ] **Add hover expand** - Stack spreads on hover
- [ ] **Add overflow indicator** - "+5" badge animation
- [ ] **Story: "AvatarGroup Expand Behavior"**

### Event Components (P1)

#### EventCard.tsx
- [ ] **Add countdown urgency** - Color shift as event approaches
- [ ] **Add RSVP animation** - Checkmark draw on confirm
- [ ] **Story: "EventCard Urgency States"**

#### EventCalendar.tsx
- [ ] **Add day hover** - Cell highlight on hover
- [ ] **Add event dot pulse** - Upcoming events pulse
- [ ] **Story: "Calendar Interaction"**

#### RSVPButton.tsx
- [ ] **Add confirmation burst** - Celebration on RSVP
- [ ] **Add attendee count tick** - Number updates animate
- [ ] **Story: "RSVP Confirmation Flow"**

### Form Components (P1)

#### FormField.tsx
- [ ] **Add label float** - Label moves up on focus
- [ ] **Add error shake** - Field shakes on validation fail
- [ ] **Story: "FormField State Transitions"**

#### EmailInput.tsx
- [ ] **Add domain autocomplete** - Suggest common domains
- [ ] **Add validation indicator** - Checkmark on valid email
- [ ] **Story: "EmailInput Smart Behavior"**

#### TagInput.tsx
- [ ] **Add tag entrance** - Scale in on add
- [ ] **Add tag removal** - Shrink + fade on remove
- [ ] **Story: "TagInput Add/Remove"**

#### SearchInput.tsx
- [ ] **Add loading spinner** - In right position during search
- [ ] **Add clear animation** - X rotates on hover
- [ ] **Story: "SearchInput Loading States"**

### Data Components (P2)

#### DataTable.tsx
- [ ] **Add row hover lift** - Subtle elevation on hover
- [ ] **Add sort indicator animation** - Arrow flips smoothly
- [ ] **Add selection checkbox animation**
- [ ] **Story: "DataTable Row Interaction"**

#### StatCard.tsx
- [ ] **Add number morph** - Values animate to new numbers
- [ ] **Add trend indicator** - Arrow with direction animation
- [ ] **Story: "StatCard Value Updates"**

#### Pagination.tsx
- [ ] **Add page transition** - Content fades between pages
- [ ] **Add active indicator slide** - Highlight moves
- [ ] **Story: "Pagination Navigation"**

### Navigation Components (P1)

#### TopBar.tsx
- [ ] **Add scroll behavior** - Shrinks/changes on scroll
- [ ] **Add notification badge pulse** - Pulse on new notification
- [ ] **Story: "TopBar Scroll Transform"**

#### Sidebar.tsx
- [ ] **Add collapse animation** - Smooth width transition
- [ ] **Add item hover** - Background slide in
- [ ] **Story: "Sidebar Collapse/Expand"**

#### TabNav.tsx
- [ ] **Add indicator slide** - Follows selection
- [ ] **Add content crossfade**
- [ ] **Story: "TabNav Selection Flow"**

#### CommandPalette.tsx
- [ ] **Add open animation** - Scale + blur backdrop
- [ ] **Add result filtering** - Fade in results
- [ ] **Add selection highlight** - Item glow on select
- [ ] **Story: "CommandPalette Open Flow"**

### Overlay Components (P1)

#### Dropdown.tsx
- [ ] **Add origin-aware animation** - Opens from trigger
- [ ] **Add item hover slide** - Background slides in
- [ ] **Story: "Dropdown Open Animation"**

#### Popover.tsx
- [ ] **Add arrow pointing** - Arrow faces trigger
- [ ] **Add position-aware entrance** - Animates from edge
- [ ] **Story: "Popover Positioning"**

#### Sheet.tsx
- [ ] **Add drag-to-dismiss** - Sheet can be swiped away
- [ ] **Add velocity-aware snap** - Fast swipe dismisses
- [ ] **Story: "Sheet Drag Interaction"**

#### Drawer.tsx
- [ ] **Add slide animation** - Smooth slide from edge
- [ ] **Add overlay fade** - Backdrop fades in
- [ ] **Story: "Drawer Open/Close"**

### Feedback Components (P2)

#### Alert.tsx
- [ ] **Add icon animation** - Warning bounces, success checks
- [ ] **Add dismiss slide** - Slides out on dismiss
- [ ] **Story: "Alert Notification Types"**

#### NotificationBanner.tsx
- [ ] **Add entrance slide** - Slides down from top
- [ ] **Add auto-dismiss progress** - Visual countdown
- [ ] **Story: "Banner Lifecycle"**

#### LoadingOverlay.tsx
- [ ] **Add blur animation** - Background blurs in
- [ ] **Add spinner pulse** - Loading indicator breathes
- [ ] **Story: "LoadingOverlay States"**

### Auth Components (P0 - First Impression)

#### AuthShell.tsx ✅ LOCKED (Jan 12, 2026)
- [x] **Background: Plain Dark** - No gold orb, uses `var(--bg-ground)`
- [x] **Container: Glass Card** - Uses Card primitive
- [x] **Logo: Large Centered** - HiveLogo size="lg" variant="white"
- [x] **Focus rings: WHITE** - Never gold

#### Login Page ✅ LOCKED (Jan 12, 2026)
- [x] **Uses locked primitives** - Button, Card, Heading, Text
- [x] **Button: default variant** - White with pop, not gold CTA
- [x] **Domain suffix visible** - text-secondary + font-medium
- [x] **Focus rings: WHITE** - Throughout all inputs

#### AuthSuccessState.tsx
- [ ] **Add celebration burst** - Gold confetti/glow on success
- [ ] **Add checkmark draw** - SVG path animation
- [ ] **Add redirect countdown** - Visual countdown to redirect
- [ ] **Story: "Auth Success Celebration"**

### Mobile Navigation Components (P0 - Mobile First)

#### CampusDock.tsx — NOT STARTED
- [ ] **Lab: Dock Style** - Floating pill vs fixed bar vs island
- [ ] **Lab: Background** - Glass blur vs solid vs gradient
- [ ] **Lab: Item Layout** - 4 icons vs 5 icons vs 3+orb
- [ ] **Lab: Safe Area** - Home indicator padding
- [ ] **Story: "CampusDock Style Comparison"**

#### DockOrb.tsx — NOT STARTED
- [ ] **Lab: Orb Style** - Gold ring vs solid vs gradient
- [ ] **Lab: Size** - 48px vs 56px vs 64px
- [ ] **Lab: Press Animation** - Scale vs glow vs ripple
- [ ] **Lab: State** - Idle vs active vs loading
- [ ] **Story: "DockOrb Interaction States"**

#### CampusDrawer.tsx ✅ LOCKED (Jan 12, 2026)
- [x] **Slide Direction:** Left Side (75% width)
- [x] **Overlay:** Dark Dim 60%
- [x] **Content Layout:** User Header + Grouped Sections
- [x] **Handle Style:** Title + Close X (no pill for side drawer)
- [x] **Animation:** Spring (damping: 25, stiffness: 300)

#### CampusProvider.tsx ✅ LOCKED (Jan 12, 2026)
- [x] **Context structure:** `useCampusNavigation()` hook with drawer state, active route
- [x] **Actions:** openDrawer, closeDrawer, toggleDrawer, setActiveRoute
- [x] **Drawer integration:** Built-in CampusDrawer with all locked decisions
- [x] **Menu items:** Customizable with icons, labels, routes, danger state
- [x] **User data:** Optional user header with avatar, name, handle, campus

### Reaction Components (P2)

#### ReactionPicker.tsx
- [ ] **Add emoji pop** - Emojis bounce in staggered
- [ ] **Add selection pulse** - Selected emoji glows
- [ ] **Story: "ReactionPicker Selection"**

### Presence Components (P0 - Life System)

#### PresenceIndicator.tsx
- [ ] **Add status transition** - Smooth between online/away/offline
- [ ] **Add tooltip on hover** - Shows "Last seen 5m ago"
- [ ] **Story: "PresenceIndicator States"**

---

## BROKEN COMPONENTS (Fix First)

These have type errors blocking them. Fix before enhancement.

| Component | Issue | Priority |
|-----------|-------|----------|
| ProfileCard | Avatar size variants | P1 |
| EventCard | Avatar size variants | P1 |
| ToolCard | Avatar size variants | P1 |
| PostCard | "md" size doesn't exist, variant null | P1 |
| MemberList | Avatar missing 'src', "base" size | P2 |
| AttendeeList | Avatar 'src', size variants | P2 |
| AvatarGroup | "md" size doesn't exist | P1 |
| RadioGroup | interface extension conflict | P2 |
| Checkbox | CheckboxField label prop | P2 |
| Accordion | interface extension, type prop | P2 |
| Tabs | orientation conflict, null issue | P1 |
| AspectRatio | ratio type conflict | P3 |
| Separator | orientation conflict | P3 |

---

## STORYBOOK STRUCTURE

Organize stories for experimentation:

```
Design System/
├── Primitives/
│   ├── Inputs/
│   │   ├── Button (with hover experiments)
│   │   ├── Input
│   │   └── ...
│   ├── Containers/
│   │   ├── Card (atmosphere comparison)
│   │   └── Modal
│   ├── Typography/
│   ├── Feedback/
│   └── Life Indicators/
│       ├── PresenceDot (breathing demo)
│       ├── LiveCounter
│       └── TypingIndicator
├── Components/
│   ├── Space/
│   ├── Profile/
│   ├── Navigation/
│   └── ...
└── Experiments/
    ├── Hover Physics Lab
    ├── Animation Timing Lab
    └── Glass Morphism Lab
```

---

## EXPERIMENTATION STORIES TO CREATE

These are new story files purely for experimentation:

### `experiments/HoverPhysics.stories.tsx`
- Side-by-side comparison of static vs animated hovers
- Different easing curves
- Scale amounts (1.01 vs 1.02 vs 1.05)

### `experiments/AnimationTiming.stories.tsx`
- Same animation at 100ms, 150ms, 200ms, 300ms
- Different easings on same duration
- Spring vs ease-out comparison

### `experiments/GlassMorphism.stories.tsx`
- Blur amounts (8px, 12px, 20px, 40px)
- Saturation levels
- Background opacity combinations

### `experiments/LifeIndicators.stories.tsx`
- Presence breathing at different speeds
- Warmth edge intensities
- Activity pulse patterns

### `experiments/EntranceAnimations.stories.tsx`
- Fade vs slide vs scale
- Stagger timing for lists
- Spring bounce amounts

---

## SUCCESS CRITERIA

For each component, verify in Storybook:

1. **Hover feels responsive** - No lag, immediate feedback
2. **Press feels tactile** - Scale down gives physical feedback
3. **Focus is clear** - White ring visible without being harsh
4. **Transitions are smooth** - No janky movements
5. **Gold is earned** - Only appears for life/CTAs/achievements
6. **Would a student screenshot this?** - The ultimate test

---

## TRACKING

Update this file as items are completed:
- [ ] → Started
- [x] → Complete
- [-] → Blocked
- [?] → Needs discussion

Last updated: January 12, 2026
