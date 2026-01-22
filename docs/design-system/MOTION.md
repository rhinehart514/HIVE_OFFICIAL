# Motion Design

**Premium motion patterns extracted from `/about` page — the gold standard for motion design.**

Motion isn't decoration. It's how the system communicates state, causality, and hierarchy. Every animation must earn its place.

---

## Philosophy

**Motion explains, it doesn't embellish.**

- **Parallax = spatial depth** — elements on different planes move at different speeds
- **Reveals = earning visibility** — nothing is given for free, everything fades in as you scroll
- **Borders drawing = ceremony** — important content gets animated containment
- **Word-by-word = controlled pacing** — force users to read at the intended rhythm
- **Premium easing = physical weight** — everything feels like it has mass

---

## Tokens

All motion tokens live in `packages/ui/src/tokens/motion.ts` and are exported from primitives:

```tsx
import { MOTION } from '@hive/ui/design-system/primitives';
```

### Easing Curves

Use **premium** for everything unless you have a specific reason not to.

```tsx
MOTION.ease = {
  premium: [0.22, 1, 0.36, 1],  // Default - heavy, weighted
  smooth: [0.21, 0.47, 0.32, 0.98],  // Gentle entrance
  bounce: [0.68, -0.55, 0.265, 1.55],  // Playful overshoot
  sharp: [0.4, 0, 0.2, 1],  // Instant response
}
```

**Example:**
```tsx
<motion.div
  animate={{ opacity: 1 }}
  transition={{
    duration: MOTION.duration.base,
    ease: MOTION.ease.premium  // ← Always use premium
  }}
/>
```

### Duration Scale

```tsx
MOTION.duration = {
  instant: 0.15,   // Hover states, button presses
  fast: 0.3,       // Dropdowns, tooltips
  base: 0.6,       // Default for most animations
  slow: 1.0,       // Section reveals
  slower: 1.2,     // Hero animations
  slowest: 1.5,    // Border draws, narrative reveals
}
```

### Stagger Delays

For animating lists/sequences:

```tsx
MOTION.stagger = {
  tight: 0.05,        // Rapid succession
  base: 0.1,          // Standard rhythm
  relaxed: 0.15,      // Deliberate pacing
  words: 0.03,        // For narrative text
  characters: 0.02,   // For dramatic reveals
}
```

### Viewport Margins

Controls when scroll-triggered animations fire (useInView):

```tsx
MOTION.viewport = {
  immediate: '0px',    // Triggers as soon as element enters
  close: '-50px',      // Default for most reveals
  medium: '-100px',    // Staggered lists
  far: '-150px',       // Large sections
  deep: '-200px',      // Hero animations
}
```

### Spring Physics

For physics-based animations:

```tsx
MOTION.spring = {
  gentle: { stiffness: 150, damping: 15 },   // Soft, bouncy
  base: { stiffness: 300, damping: 30 },     // Balanced
  snappy: { stiffness: 400, damping: 40 },   // Tight, responsive
  cursor: { stiffness: 100, damping: 30 },   // For cursor-following
}
```

### Parallax Speed

```tsx
MOTION.parallax = {
  subtle: 0.05,   // Barely noticeable
  base: 0.1,      // Standard parallax
  strong: 0.15,   // Dramatic depth
}
```

---

## Primitives

### RevealSection

Section that fades in when scrolled into view. Standard pattern for all major page sections.

```tsx
import { RevealSection } from '@hive/ui/design-system/primitives';

<RevealSection margin="far" className="py-32">
  <h2>Section Title</h2>
  <p>Content...</p>
</RevealSection>
```

**Props:**
- `margin` — Viewport margin (when to trigger). Default: `'far'` (-150px)
- `duration` — Animation duration. Default: `'slower'` (1.2s)
- `ease` — Easing curve. Default: `'premium'`
- `delay` — Delay before animation starts (seconds)
- `as` — Render as `'section'` or `'div'`

### NarrativeReveal

Text that reveals word-by-word on scroll. Controls reading rhythm.

```tsx
<p className="text-white/50">
  <NarrativeReveal stagger="words">
    HIVE isn't a social app you check. It's infrastructure.
  </NarrativeReveal>
</p>
```

**Props:**
- `stagger` — Delay between words. Default: `'words'` (0.03s)
- `duration` — Animation duration per word. Default: `'base'` (0.6s)
- `ease` — Easing curve. Default: `'premium'`
- `margin` — Viewport margin. Default: `'close'` (-50px)

**Use for:**
- Long-form narrative content
- Forcing reading pace on key messages
- Creating dramatic reveals

**Don't use for:**
- UI copy (too slow)
- Lists (use stagger instead)
- Code examples (breaks readability)

### AnimatedBorder

Border that draws itself in on scroll.

**Horizontal variant** — Single line divider:

```tsx
<AnimatedBorder variant="horizontal" className="my-32" />
```

**Container variant** — 4-sided border with content reveal:

```tsx
<AnimatedBorder variant="container" className="rounded-2xl p-16">
  <h2>Important Content</h2>
  <p>Gets ceremony through border animation</p>
</AnimatedBorder>
```

**Props:**
- `variant` — `'horizontal'` or `'container'`. Default: `'horizontal'`
- `duration` — Border draw duration
- `delay` — Delay before animation
- `margin` — Viewport margin. Default: `'close'` (-50px)
- `children` — Content (container variant only)

**Use container variant for:**
- Pull quotes
- Feature callouts
- Statistics/metrics
- Testimonials

### ParallaxText

Text container with parallax scroll effect. Creates spatial depth.

```tsx
<ParallaxText speed={0.15}>
  <h2>This header moves slower than scroll</h2>
</ParallaxText>
```

**Speed guidance:**
- `0.05-0.08` — Far background (heroes, large titles)
- `0.1-0.12` — Mid-depth content (section headers)
- `0.15+` — Near foreground (emphasis elements)

**Props:**
- `speed` — Parallax multiplier. Default: `'base'` (0.1)
- `offset` — Scroll range. Default: `['start end', 'end start']`

**Pattern: Nested parallax for depth**

```tsx
<ParallaxText speed={0.15}>
  <h2 className="text-[40px]">Far plane</h2>
</ParallaxText>

<ParallaxText speed={0.1}>
  <p className="text-[22px]">Mid plane</p>
</ParallaxText>

<ParallaxText speed={0.05}>
  <p className="text-[16px]">Near plane</p>
</ParallaxText>
```

Different speeds create the illusion of 3D depth.

### ScrollIndicator

Animated scroll indicator that teaches users the page has depth.

```tsx
<ScrollIndicator text="Scroll to explore" />
```

**Use in:**
- Hero sections
- Landing pages
- Full-height intros

### ScrollSpacer

Empty spacer for parallax effects. Creates breathing room.

```tsx
<HeroSection />
<ScrollSpacer height={50} />  {/* 50vh of space */}
<ContentSection />
```

### HeroParallax

Hero section with parallax fade and scale effect. As user scrolls, hero fades out and scales down.

```tsx
const containerRef = useRef(null);

<div ref={containerRef}>
  <HeroParallax>
    <h1>Hero Content</h1>
  </HeroParallax>
  {/* Other content... */}
</div>
```

**Props:**
- `fadeSpeed` — Fade speed (0-1). Default: `0.15`
- `scaleAmount` — Scale amount (0-1). Default: `0.05`

### ScrollProgress

Fixed scroll progress indicator. Shows how far user has scrolled.

```tsx
<ScrollProgress position="top" color="var(--color-gold)" />
```

---

## Layout Primitives

### LandingSection

Standardized section layout combining reveal + spacing + dividers.

```tsx
import { LandingSection } from '@hive/ui/design-system/primitives';

<LandingSection divider spacing="generous">
  <h2>Section Title</h2>
  <p>Content...</p>
</LandingSection>
```

**Props:**
- `spacing` — Vertical spacing: `'tight'` (py-16), `'base'` (py-24), `'generous'` (py-32), `'expansive'` (py-40)
- `divider` — Show animated top divider. Default: `false`
- `container` — Max width: `'3xl'` (default), `'4xl'`, `'full'`, etc.
- `reveal` — Enable scroll reveal. Default: `true`
- `revealMargin` — Viewport margin. Default: `'far'`
- `padding` — Horizontal padding. Default: `'px-6'`

**Standard landing page structure:**

```tsx
<LandingHero>
  <h1>Welcome</h1>
  <ScrollIndicator />
</LandingHero>

<ScrollSpacer height={50} />

<LandingSection divider spacing="generous">
  <h2>Section 1</h2>
</LandingSection>

<LandingSection divider spacing="generous">
  <h2>Section 2</h2>
</LandingSection>

<LandingSection spacing="expansive">
  <CTA />
</LandingSection>
```

### LandingContainer

Simple max-width container for landing content.

```tsx
<LandingContainer size="3xl">
  <h1>Centered Content</h1>
</LandingContainer>
```

### LandingHero

Hero section layout with scroll indicator.

```tsx
<LandingHero showScrollIndicator scrollText="Scroll">
  <h1>Welcome to HIVE</h1>
  <p>Student autonomy infrastructure</p>
</LandingHero>
```

---

## Patterns

### Pattern: Section Reveal

Every major section should earn visibility:

```tsx
<LandingSection divider spacing="generous">
  <ParallaxText speed={0.15}>
    <h2>Section Title</h2>
  </ParallaxText>

  <ParallaxText speed={0.1}>
    <NarrativeReveal>
      Long-form narrative text that reveals word by word
      as the user scrolls into view.
    </NarrativeReveal>
  </ParallaxText>
</LandingSection>
```

**Breakdown:**
1. `LandingSection` — Provides reveal + spacing + optional divider
2. `ParallaxText` — Adds depth through different scroll speeds
3. `NarrativeReveal` — Controls reading pace

### Pattern: Ceremonial Container

Important content gets animated borders:

```tsx
<AnimatedBorder variant="container" className="rounded-2xl p-16">
  <blockquote className="text-[36px] font-medium">
    "The feed isn't the product. The Space is."
  </blockquote>
</AnimatedBorder>
```

**Use for:**
- Pull quotes that deserve emphasis
- Feature callouts
- Stats/metrics
- Testimonials

### Pattern: Layered Parallax

Create 3D depth through speed variation:

```tsx
// Background layer - slowest
<ParallaxText speed={0.05}>
  <div className="text-[72px] opacity-20">BACKGROUND</div>
</ParallaxText>

// Mid layer
<ParallaxText speed={0.1}>
  <h2 className="text-[40px]">Title</h2>
</ParallaxText>

// Foreground layer - fastest
<ParallaxText speed={0.15}>
  <p className="text-[20px]">Body text</p>
</ParallaxText>
```

### Pattern: Hero Parallax Fade

Hero that fades and scales as user scrolls:

```tsx
const containerRef = useRef(null);

<div ref={containerRef}>
  <HeroParallax>
    <motion.h1
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: MOTION.ease.premium }}
    >
      Hero Content
    </motion.h1>

    <ScrollIndicator />
  </HeroParallax>

  <ScrollSpacer height={50} />

  {/* Rest of page */}
</div>
```

---

## Rules

1. **Always use premium easing** unless you have a specific reason not to
2. **Never animate without useInView** (except hover states) — animations only fire once when scrolled into view
3. **Generous spacing signals confidence** — py-32 between sections, not py-8
4. **Parallax creates depth, not distraction** — speeds between 0.05-0.15
5. **Borders draw for ceremony** — use container variant sparingly
6. **Narrative reveals for key messages only** — not for all body text
7. **One reveal per section** — don't stack RevealSection inside RevealSection
8. **Opacity gradients > color variety** — white/60, white/40, white/30
9. **Motion explains state transitions** — fade in = appearing, scale = emphasis, y transform = hierarchy

---

## Migration from Custom Implementations

If you have custom motion code like `/about` originally did:

**Before:**
```tsx
const EASE = [0.22, 1, 0.36, 1] as const;

function AnimatedLine({ ... }) {
  // 20 lines of custom code
}
```

**After:**
```tsx
import { MOTION, AnimatedBorder } from '@hive/ui/design-system/primitives';

<AnimatedBorder variant="horizontal" />
```

**Replace:**
- Custom `EASE` → `MOTION.ease.premium`
- Custom `AnimatedLine` → `AnimatedBorder variant="horizontal"`
- Custom `AnimatedContainer` → `AnimatedBorder variant="container"`
- Custom `ParallaxText` → `ParallaxText` primitive
- Custom `NarrativeReveal` → `NarrativeReveal` primitive
- Custom `RevealSection` → `RevealSection` primitive
- `<div className="h-[50vh]" />` → `<ScrollSpacer height={50} />`

---

## Reference Implementation

See `/apps/web/src/app/about/page.tsx` for the canonical implementation of all these patterns working together.

**What it demonstrates:**
- Premium easing throughout
- Layered parallax for depth
- Narrative reveals for key messages
- Ceremonial borders on important content
- Section reveals with generous spacing
- Hero parallax fade
- Scroll indicators
- Tab switching without navigation
- Opacity gradients for hierarchy
- Display font only for statements

This is the gold standard. Other pages should match this quality bar.
