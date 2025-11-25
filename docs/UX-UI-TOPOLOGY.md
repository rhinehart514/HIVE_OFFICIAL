# HIVE UX/UI TOPOLOGY
**Platform-Wide Design System & Interaction Patterns**

> **Aesthetic Direction**: Campus Sleek Dark Mode  Vercel's refined minimalism meets OpenAI's conversational warmth, infused with campus energy.

---

## <® DESIGN PHILOSOPHY

### Core Principle: **Refined Intensity**
HIVE is a campus platform where **precision meets energy**. We combine:
- **Vercel's minimal elegance**: Clean layouts, subtle borders, monochrome sophistication
- **OpenAI's conversational warmth**: Smooth animations, generous spacing, human-centric interactions
- **Campus vitality**: Gold moments for live activity, pulse animations for real-time updates, community-first hierarchy

**NOT** a corporate tool. **NOT** Instagram. **NOT** TikTok.
HIVE is the **platform students build to organize campus life on their terms**.

---

## < VISUAL AESTHETIC

### **1. Color System: Monochrome + Gold Discipline**

**Foundation**: Pure black backgrounds with gray elevations
```css
/* Background Hierarchy */
--hive-background-primary: #000000      /* Pure black canvas */
--hive-background-secondary: #171717    /* Elevated surfaces (cards) */
--hive-background-tertiary: #262626     /* Interactive elements */
--hive-background-interactive: #404040  /* Strong interactive */
```

**Text Hierarchy**: High contrast white í gray
```css
--hive-text-primary: #FFFFFF      /* Primary content (body text, headers) */
--hive-text-secondary: #D4D4D4    /* Supporting content (metadata, labels) */
--hive-text-tertiary: #A3A3A3     /* Tertiary content (timestamps, counts) */
--hive-text-disabled: #525252     /* Disabled state */
```

**Gold**: Single accent, used ONLY for:
1. **Online presence** (`--hive-gold-online`) - Live activity indicators
2. **CTAs** (`--hive-gold-cta`) - Primary actions only
3. **Achievements** (`--hive-gold-achievement`) - Ritual completion, badges
4. **Featured content** (`--hive-gold-featured`) - Pinned posts, special announcements

**Grayscale Interactive States** (NOT gold):
```css
--hive-interactive-hover: rgba(255, 255, 255, 0.04)   /* Subtle white hover */
--hive-interactive-focus: rgba(255, 255, 255, 0.20)   /* White focus rings */
--hive-interactive-active: rgba(255, 255, 255, 0.08)  /* Active state */
```

**Why This Works**:
- Instagram: Colorful, global, influencer-centric
- HIVE: Monochrome, campus-focused, community-centric
- Gold becomes **meaningful** when it appears (not decorative noise)

---

### **2. Typography: Geist Sans Everywhere**

**Hierarchy**:
- **Display**: Geist Sans 600 (semibold), -0.025em tracking í Headers, titles
- **Body**: Geist Sans 400 (normal), -0.01em tracking í All content
- **Code/Data**: JetBrains Mono 400 í Handles, technical data, timestamps

**Scale** (mobile-optimized):
```
Display:  40px í 24px (large í small)
Heading:  20px í 14px
Body:     16px í 12px (14px body default)
Caption:  12px í 10px
```

**Why Geist Sans**:
- Not generic (Inter/Roboto)
- Clean, modern, designed for interfaces
- Excellent readability at small sizes (mobile-first)
- Aligns with Vercel aesthetic

**Typography Rules**:
- Headers: Semibold (600), tight tracking (-0.025em)
- Body: Regular (400), subtle tracking (-0.01em)
- ALL CAPS: Only for labels (12px, 0.05em tracking, gray-400)
- Line height: 1.5 for body, 1.2 for headers

---

### **3. Spacing: 4px Grid System**

**Base Unit**: 4px
**Scale**: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

**Component Density**:
- **Compact**: 8px padding (buttons, chips, tags)
- **Default**: 12px-16px padding (cards, forms, inputs)
- **Spacious**: 24px-32px padding (containers, sections)

**Layout Rhythm**:
- Feed cards: 16px gap between cards
- Space board: 12px gap between posts
- Profile widgets: 16px gap in bento grid
- Modal margins: 24px edge spacing

---

### **4. Border Radius: Heavy Radius Design**

**Scale**:
```css
--hive-radius-xs: 6px    /* Tiny elements (badges, chips) */
--hive-radius-sm: 10px   /* Inputs, buttons */
--hive-radius-md: 14px   /* Cards, containers */
--hive-radius-lg: 22px   /* Modals, large cards */
--hive-radius-xl: 32px   /* Hero elements, feature cards */
--hive-radius-full: 9999px /* Pills, avatars */
```

**Application**:
- Buttons: `radius-sm` (10px)  refined, not harsh
- Cards: `radius-md` (14px)  distinct from web defaults (8px)
- Modals: `radius-lg` (22px)  cinematic presence
- Avatars: `radius-full` (perfect circles)

**Why Heavy Radius**:
- Instagram: 12px standard (generic)
- Linear: 8px (too sharp)
- HIVE: 14px-22px (distinctive, modern, approachable)

---

### **5. Borders: Subtle Lines**

**Default Border**:
```css
border: 1px solid var(--hive-border-default);
/* rgba(255, 255, 255, 0.08) */
```

**Border Variants**:
- **Subtle** (default): 8% white opacity  Most cards, containers
- **Hover**: 16% white opacity  Interactive cards on hover
- **Focus**: 40% white opacity  Focused inputs, active elements
- **Strong**: #404040 solid  Dividers, prominent boundaries

**Border Usage Philosophy**:
- Cards use borders OR shadows (not both)
- Borders for **structure** (defining boundaries)
- Shadows for **elevation** (layering depth)
- Default: Border-only (Vercel style)
- Elevated: Shadow-only (depth without lines)
- Glass: Border + backdrop-blur (glassmorph)

---

### **6. Shadows & Elevation**

**5-Level Shadow System**:
```css
--hive-shadow-subtle: 0 1px 2px rgba(0, 0, 0, 0.05)          /* Barely visible */
--hive-shadow-default: 0 2px 8px rgba(0, 0, 0, 0.1)          /* Cards */
--hive-shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.15)         /* Hover cards */
--hive-shadow-large: 0 8px 32px rgba(0, 0, 0, 0.2)           /* Modals */
--hive-shadow-dramatic: 0 16px 64px rgba(0, 0, 0, 0.3)       /* Hero moments */
```

**Glow Effects** (used sparingly):
```css
--hive-shadow-gold-glow: 0 0 20px rgba(255, 215, 0, 0.3)     /* Live activity */
--hive-shadow-gold-glow-strong: 0 0 30px rgba(255, 215, 0, 0.4)  /* Rituals */
```

**Elevation Usage**:
- Feed cards: No shadow (border-only, Vercel style)
- Hover cards: `shadow-medium` (depth on hover)
- Modals/Dialogs: `shadow-large` (clear layering)
- Ritual banners: `shadow-gold-glow` (attention-grabbing)

---

## <≠ MOTION SYSTEM

### **Philosophy: Smooth Confidence**

**3 Core Easing Curves**:
```css
--hive-easing-default: cubic-bezier(0.23, 1, 0.32, 1)    /* Smooth, natural (90% of motion) */
--hive-easing-snap: cubic-bezier(0.4, 0, 0.2, 1)         /* Quick, decisive (toggles, checkboxes) */
--hive-easing-dramatic: cubic-bezier(0.16, 1, 0.3, 1)    /* Cinematic (rituals, achievements) */
```

**Duration Scale**:
```css
--hive-duration-instant: 100ms     /* Micro-interactions (checkbox, toggle) */
--hive-duration-quick: 160ms       /* Button hover, input focus */
--hive-duration-normal: 240ms      /* Standard transitions (most motion) */
--hive-duration-smooth: 400ms      /* Page transitions, modal enter */
--hive-duration-dramatic: 800ms    /* Ritual reveals, achievement unlocks */
```

**Animation Principles**:
1. **Purposeful**: Motion explains causality (what caused this change?)
2. **Directional**: Elements move along clear paths (not random)
3. **Staggered**: List items cascade (40ms delay between items)
4. **Responsive**: Respect `prefers-reduced-motion` (disable all non-essential motion)

**Common Patterns**:
- **Fade In**: Opacity 0 í 1, 240ms, default easing
- **Slide Up**: translateY(8px) í 0, 240ms, default easing
- **Scale In**: scale(0.95) í 1, 240ms, default easing
- **Stagger**: Children delay 40ms incrementally

---

### **Hover States: Lift & Glow**

**Interactive Elements**:
```css
.hive-interactive {
  transition: all 240ms var(--hive-easing-default);
}

.hive-interactive:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--hive-shadow-medium), var(--hive-shadow-gold-glow);
}

.hive-interactive:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 100ms;
}
```

**Why This Works**:
- Subtle lift (2px up) creates perceived depth
- Slight scale (1.02) adds dimensionality
- Gold glow on key moments (CTAs, featured content)
- Active state "presses" element (scale 0.98)

---

## =– LAYOUT SYSTEMS

### **1. Container Widths**

**Feed**: 600px centered (Instagram parity, mobile-optimized)
**Spaces**: 1200px centered (content + right rail)
**Profile**: 1000px centered (bento grid layout)
**HiveLab**: Full viewport (canvas-based builder)
**Modals**: 500px-800px (context-dependent)

**Responsive Breakpoints**:
```
Mobile:   < 768px  (1-column, full-width)
Tablet:   768px-1200px  (2-column, partial rail)
Desktop:  > 1200px  (3-column, full rail)
```

---

### **2. Feed Layout: Vertical Infinite Scroll**

**Structure**:
```
                         
  Ritual Banner (gold)    ê Sticky top when active
                         $
  Feed Card              
  - Post / Event / Tool  
  - 600px max width      
  - 16px gap between     
                         $
  Feed Card              
                         $
  ...virtualized...      
                         
```

**Key Patterns**:
- **Virtualized scroll**: Only render visible + 2 above/below (60fps with 10k+ posts)
- **Optimistic updates**: Upvote/comment appears instantly (< 16ms)
- **Skeleton loading**: Show structure while fetching (no blank screens)
- **Pull-to-refresh**: Mobile pattern for feed refresh

---

### **3. Spaces Layout: Feed-First Minimalism**

**Desktop** (> 768px):
```
                                                  
  Space Header (cover, title, join button)       
                                                  $
                                                  
  FEED (800px)     RAIL (320px)                  
                                                  
  - Posts          - Pinned Posts (vertical)     
  - Events         - About Widget                
  - Tools          - Tools Widget                
  - Single scroll  - Fixed position rail         
                                                  
                                                  
```

**Mobile** (< 768px):
```
                         
  Space Header           
                         $
  Pinned Posts (vert)    
                         $
  Post Composer          
                         $
  Feed Posts (scroll)    
  ...                    
                         
```

**Clutter Reduction**: Spaces went from 600px vertical í 280px (-53%)
- Removed tab navigation (Everything in single scroll)
- Pinned posts: Carousel í Vertical stack (gold left border)
- Composer: No avatar, consolidated [+ Add] dropdown
- Right rail: Only on desktop (hidden on mobile)

---

### **4. Profile Layout: Bento Grid**

**Grid Structure** (desktop):
```
                 ,                 
  Identity         Spaces         
  (2x1)            (2x1)          
                 <                 $
  Activity         Connections    
  (1x1)            (1x1)          
                 <                 $
  HiveLab          Calendar       
  (1x1)            (1x1)          
                 4                 
```

**Responsive** (mobile):
```
                         
  Identity (full-width)  
                         $
  Spaces (full-width)    
                         $
  Activity (full-width)  
                         $
  ...vertical stack...   
                         
```

**Widget Design**:
- 16px padding inside
- 14px border radius
- Subtle border (8% white)
- Hover: 16% white border + slight lift
- Empty state: Centered icon + CTA

---

## <Ø INTERACTION PATTERNS

### **1. Buttons: Clear Hierarchy**

**Variants**:
- **Primary** (gold): White text on gold background  ONE per screen max
- **Secondary** (gray): White text on gray-800 background  Common actions
- **Ghost** (transparent): Gray text, white border  Tertiary actions
- **Link** (text-only): Gray text, no background  Inline actions

**States**:
- Hover: Lift 2px + glow
- Active: Press down (scale 0.98)
- Disabled: 60% opacity + no interaction
- Loading: Spinner replaces text (button stays same size)

**Sizes**:
- `sm`: 32px height, 12px padding
- `md`: 40px height, 16px padding (default)
- `lg`: 48px height, 20px padding

---

### **2. Forms: Minimal Friction**

**Input States**:
```css
/* Default */
border: 1px solid var(--hive-border-default);
background: var(--hive-background-secondary);

/* Focus */
border: 1px solid var(--hive-interactive-focus);
box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);

/* Error */
border: 1px solid var(--hive-status-error);
```

**Form Principles**:
- Labels above inputs (not placeholders as labels)
- Error messages below field (red text, 12px)
- Inline validation after blur (not while typing)
- Autofocus first field in modals
- Tab order follows visual order

---

### **3. Modals: Focused Contexts**

**Modal Structure**:
```
                                
  Header (Title + Close)        
                                $
  Content (scrollable body)     
                                 
                                 
                                $
  Footer (Actions)              
                                
```

**Behavior**:
- Backdrop: `rgba(0, 0, 0, 0.6)` overlay
- Enter: Fade + scale (0.95 í 1), 240ms
- Exit: Fade + scale (1 í 0.95), 240ms
- Focus trap: Tab cycles within modal
- Esc to close: Always enabled
- Click outside: Closes by default (can disable)

---

### **4. Toasts: Subtle Notifications**

**Position**: Bottom-right (desktop), bottom-center (mobile)
**Duration**: 3s (info), 5s (success/warning), persist (error)
**Max visible**: 3 toasts stacked
**Behavior**: Auto-dismiss with progress bar

**Variants**:
- **Info**: Gray background, white text
- **Success**: Green accent border, white text
- **Warning**: Yellow accent border, white text
- **Error**: Red accent border, white text, manual dismiss

---

## = COMPONENT PATTERNS

### **1. Cards: Structure & Elevation**

**3 Card Variants**:

**Bordered** (default):
```css
background: var(--hive-background-secondary);
border: 1px solid var(--hive-border-default);
border-radius: var(--hive-radius-md);
```

**Elevated**:
```css
background: var(--hive-background-secondary);
border: none;
box-shadow: var(--hive-shadow-default);
border-radius: var(--hive-radius-md);
```

**Glass**:
```css
background: var(--hive-overlay-glass);
backdrop-filter: blur(12px) saturate(180%);
border: 1px solid var(--hive-border-subtle);
border-radius: var(--hive-radius-md);
```

**Usage**:
- Feed cards: **Bordered** (Vercel style, clean)
- Hover cards: **Elevated** (adds depth)
- Overlays: **Glass** (modals, popovers, tooltips)

---

### **2. Loading States: Skeleton Screens**

**Principles**:
- Show structure immediately (no blank screens)
- Pulse animation (opacity 0.5 í 1, 1.5s infinite)
- Match final content layout
- Replace with real content (no flash)

**Skeleton Pattern**:
```tsx
<div className="animate-pulse">
  <div className="h-12 bg-gray-800 rounded-md w-2/3 mb-4" />
  <div className="h-4 bg-gray-800 rounded-md w-full mb-2" />
  <div className="h-4 bg-gray-800 rounded-md w-4/5 mb-2" />
</div>
```

---

### **3. Empty States: Guidance**

**Structure**:
```
Icon (48px, gray-600)
Title (18px, white, semibold)
Description (14px, gray-400, 2 lines max)
CTA Button (primary or secondary)
```

**Tone**:
- Encouraging, not negative
- Show next action (not just "empty")
- Context-specific guidance

**Examples**:
- Feed empty: "No spaces joined yet  Browse Spaces to get started"
- Space empty: "No posts yet  Be the first to post"
- Profile empty: "Complete your profile to unlock campus features"

---

### **4. Error States: Recovery**

**Error Pattern**:
```
Icon (error symbol, red-500)
Title ("Something went wrong")
Description (specific error, if safe to show)
Actions:
  - Primary: "Try Again" (retry action)
  - Secondary: "Go Back" (safe fallback)
```

**Error Boundary** (global):
- Catches uncaught errors
- Shows friendly error page
- Logs error to analytics
- Offers reset button (clears state)

---

## <™ FEATURE-SPECIFIC PATTERNS

### **Feed**
- Read-only aggregation (no posting in Feed)
- Virtualized scroll (60fps with 10k+ posts)
- Real-time updates every 30 seconds
- Keyboard navigation (`j/k` to navigate, `l` to like, `c` to comment)

### **Spaces**
- Feed-first minimalism (single scroll on mobile)
- Pinned posts: Vertical stack with gold left border
- Composer: Inline, no avatar, [+ Add] dropdown
- Right rail: About + Tools widgets (desktop only)

### **Profile**
- Bento grid layout (6 customizable widgets)
- Completion psychology (80% complete í Add major!)
- Ghost mode (privacy control for course stalking)
- Campus identity focus (major, grad year, clubs)

### **HiveLab**
- Canvas-based builder (Figma-style)
- 2-tab studio (Design + Deploy)
- Element palette (drag-drop)
- Property inspector (right rail)
- Desktop-first (mobile shows toast + fallback)

### **Rituals**
- Gold banner at top of Feed (sticky)
- 9 archetypes (Tournament, FeatureDrop, FoundingClass, etc.)
- Real-time participation tracking
- Completion rewards (badges, unlocks)

---

## =Ò MOBILE-FIRST REALITY

**80% of usage is mobile (375px viewport)**

**Mobile Optimizations**:
- Touch targets: 44px min (not 40px)
- Font sizes: 14px body min (not 12px)
- Spacing: 12px min (not 8px)
- Bottom navigation: Fixed tab bar (Feed, Spaces, Profile, More)
- Swipe gestures: Swipe left for actions (archive, upvote)
- Pull-to-refresh: Standard iOS/Android pattern

**Performance Budget**:
- Initial load: < 1s (Feed, Spaces, Profile)
- Interactions: < 16ms (60fps)
- Scroll: 60fps with virtualization
- Bundle: < 800KB initial, < 200KB per page

---

##  ACCESSIBILITY

**WCAG 2.1 AA Compliance**:
- Color contrast: 4.5:1 (body text), 3:1 (large text)
- Keyboard navigation: All interactions keyboard-accessible
- Focus indicators: 2px white ring on focus
- Screen readers: ARIA labels on interactive elements
- Reduced motion: Respect `prefers-reduced-motion`

**Keyboard Shortcuts**:
- `/`: Focus search
- `Cmd+K`: Command palette
- `j/k`: Navigate feed
- `l`: Like/upvote
- `c`: Comment
- `Esc`: Close modal/dropdown
- `?`: Show shortcuts overlay

---

## =Ä PERFORMANCE

**Core Web Vitals**:
- **LCP**: < 2.5s (Feed, Spaces, Profile)
- **FID**: < 100ms (all interactions)
- **CLS**: < 0.1 (no layout shift)

**Optimization Strategies**:
- Code splitting: Lazy load HiveLab, Admin
- Virtualization: Feed, Spaces post lists
- Optimistic updates: Upvote, comment, join space
- Image optimization: WebP, lazy load, blur placeholder
- React.memo: High-frequency components (FeedCardPost, SpaceHeader)

---

## =⁄ REFERENCE AESTHETICS

**Vercel**: Monochrome minimalism, subtle borders, clean hierarchy
**OpenAI**: Conversational warmth, smooth motion, generous spacing
**Linear**: Keyboard-first, command palette, fast interactions
**Arc**: Personal analytics, progressive disclosure, elegant handoff
**Figma**: Canvas-based editing, property inspector, real-time collaboration

**NOT**:
- Instagram: Colorful, influencer-centric, global algorithm
- TikTok: Maximalist, short-form, algorithmic feed
- Notion: Workspace-centric, block-based, document metaphor

**HIVE is**: Campus-first, community-owned, student-built infrastructure

---

**Last Updated**: November 16, 2025
**Maintained By**: Design System Team
