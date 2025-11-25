# UI/UX Polish Checklist

> Actionable tasks to polish HIVE before launch (Dec 9-13, 2025).

---

## Visual Consistency

### Colors
- [ ] No hardcoded hex values (use semantic tokens)
- [ ] Gold accent only for CTAs/achievements (5% rule)
- [ ] Consistent hover states (`rgba(255,255,255,0.04)`)
- [ ] Focus rings visible on all interactive elements

### Typography
- [ ] All text uses Geist Sans (no system fonts)
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] Line heights consistent (1.5 body, 1.2 headers)
- [ ] No orphaned words in headlines

### Spacing
- [ ] 4px grid alignment
- [ ] Consistent padding (16px cards, 8px gaps)
- [ ] No cramped layouts
- [ ] Breathing room between sections

### Borders & Radius
- [ ] Consistent radius (10px buttons, 14px cards)
- [ ] Border colors use tokens (`border-default`)
- [ ] No harsh borders (use subtle opacity)

---

## Interactions

### Buttons
- [ ] All buttons have hover state
- [ ] All buttons have active/pressed state
- [ ] Loading state with spinner
- [ ] Disabled state visually distinct

### Links
- [ ] Hover underline or color change
- [ ] Visited state (if applicable)
- [ ] External links have indicator

### Forms
- [ ] Focus state visible
- [ ] Error state with red border + message
- [ ] Success state feedback
- [ ] Placeholder text helpful

### Cards
- [ ] Hover elevation or highlight
- [ ] Click area covers entire card
- [ ] Loading skeleton matches layout

---

## States

### Loading
- [ ] Every data view has skeleton loader
- [ ] Skeletons match actual content layout
- [ ] Shimmer animation (not static)
- [ ] Loading text for slow operations

### Empty
- [ ] Custom empty state (not just blank)
- [ ] Helpful message explaining why empty
- [ ] Action CTA to populate content
- [ ] Appropriate icon

### Error
- [ ] Clear error message
- [ ] Retry button
- [ ] Report issue option
- [ ] Graceful degradation

### Success
- [ ] Confirmation feedback (toast/message)
- [ ] Next steps suggestion
- [ ] Undo option (where applicable)

---

## Responsive

### Mobile (<768px)
- [ ] All layouts stack vertically
- [ ] Touch targets 44px minimum
- [ ] Bottom nav visible
- [ ] No horizontal scroll

### Tablet (768px - 1024px)
- [ ] Sidebar collapses or hides
- [ ] Content fills width appropriately
- [ ] Touch-friendly interactions

### Desktop (>1024px)
- [ ] Sidebar always visible (240px)
- [ ] Content has max-width
- [ ] Hover states work

---

## Accessibility

### Keyboard
- [ ] All interactive elements focusable
- [ ] Tab order logical
- [ ] Escape closes modals
- [ ] Enter/Space activates buttons

### Screen Readers
- [ ] ARIA labels on icon buttons
- [ ] Headings have proper hierarchy
- [ ] Images have alt text
- [ ] Live regions for dynamic content

### Visual
- [ ] 4.5:1 contrast ratio text
- [ ] 3:1 contrast ratio large text
- [ ] Focus indicator visible
- [ ] No color-only indicators

### Motion
- [ ] Reduced motion option respected
- [ ] No auto-playing videos
- [ ] Animations < 500ms

---

## Performance

### Initial Load
- [ ] FCP < 1.8s
- [ ] LCP < 2.5s
- [ ] No render-blocking resources

### Interactions
- [ ] Optimistic updates for actions
- [ ] No jank on scroll (60fps)
- [ ] Button feedback < 16ms

### Images
- [ ] Lazy loading enabled
- [ ] WebP format with fallbacks
- [ ] Blur placeholder on load
- [ ] Proper sizing (no huge images)

---

## Micro-interactions

### Feedback
- [ ] Button press animation (scale 0.98)
- [ ] Like animation (heart pulse)
- [ ] Toast notifications for actions
- [ ] Skeleton → content transitions

### Transitions
- [ ] Page transitions smooth
- [ ] Modal slide-up animation
- [ ] Dropdown fade-in
- [ ] Accordion expand/collapse

### Delight
- [ ] Achievement celebration
- [ ] Confetti on milestones
- [ ] Gold shimmer on featured
- [ ] Progress indicators

---

## Content

### Copy
- [ ] Action verbs for buttons ("Join", not "Membership")
- [ ] Helpful error messages
- [ ] Consistent terminology
- [ ] No jargon

### Empty States
- [ ] Encouraging tone
- [ ] Clear next action
- [ ] Contextual help

### Onboarding
- [ ] Welcome message
- [ ] Feature hints
- [ ] Progress indicator

---

## Component Audit

### Shell
- [ ] Sidebar navigation works
- [ ] Mobile nav works
- [ ] Active state on current route
- [ ] Logo links to feed

### Feed
- [ ] Cards render correctly
- [ ] Filters work
- [ ] Load more works
- [ ] Stats accurate

### Spaces
- [ ] Space header complete
- [ ] Join/leave works
- [ ] Pins display (max 2)
- [ ] Composer works

### Profile
- [ ] Avatar uploads
- [ ] Bio editable
- [ ] Activity shows
- [ ] Settings accessible

---

## Testing Checklist

### Manual Testing
- [ ] Test on Chrome, Safari, Firefox
- [ ] Test on iPhone, Android
- [ ] Test with slow network (3G)
- [ ] Test with keyboard only
- [ ] Test with screen reader

### Automated Testing
- [ ] Axe accessibility scan passes
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] No failed network requests

---

## Pre-Launch

### Final Checks
- [ ] All console.logs removed
- [ ] Error boundaries in place
- [ ] Analytics tracking works
- [ ] Meta tags complete
- [ ] Favicon set

### Content
- [ ] Legal pages linked
- [ ] Help/support accessible
- [ ] Contact info visible

---

## Priority Matrix

### P0 - Launch Blockers
- Loading states for all data
- Error boundaries
- Mobile navigation
- Authentication flow

### P1 - High Impact
- Empty states
- Hover states
- Toast notifications
- Keyboard navigation

### P2 - Nice to Have
- Micro-animations
- Delight moments
- Advanced a11y

---

*Track progress: Check boxes as you complete items. Target: 100% P0, 90% P1, 50% P2 by launch.*
