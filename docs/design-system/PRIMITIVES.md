# HIVE PRIMITIVES

## Level 5: The Atomic Building Blocks

*Last updated: January 2026*

---

## WHAT THIS DOCUMENT IS

Primitives are the atomic visual and interactive elements from which all HIVE interfaces are composed. They are the smallest units that carry design meaning — below them is only code, above them are Components.

```
WORLDVIEW (what we believe)        ← WORLDVIEW.md
    ↓
PHILOSOPHY (how it feels)          ← PHILOSOPHY.md
    ↓
PRINCIPLES (rules that guide)      ← PRINCIPLES.md
    ↓
LANGUAGE (visual vocabulary)       ← LANGUAGE.md
    ↓
SYSTEMS (behavioral rules)         ← SYSTEMS.md
    ↓
PRIMITIVES (atomic elements)       ← THIS DOCUMENT
    ↓
COMPONENTS → PATTERNS → TEMPLATES → INSTANCES
```

---

## DESIGN PHILOSOPHY

### Apple Restraint + HIVE Gold

HIVE primitives follow Apple's precision and interaction design excellence, but substitute gold wherever Apple uses accent colors. This creates something distinctive:

| Apple Does | HIVE Does |
|------------|-----------|
| Green status indicators | Gold presence indicators |
| Blue accent color | Gold accent color |
| Colorful semantic badges | Gold or gray badges |
| Spring animations | Smooth ease-out |
| Consistent materials | Atmosphere-aware materials |

### Gold Discipline

Gold appears in exactly these primitives, under these conditions:

| Primitive | Gold Condition |
|-----------|---------------|
| PresenceDot | Always when online |
| ActivityEdge | When container has activity |
| LifeBadge | Achievement variant only |
| TypingIndicator | When multiple users typing |
| LiveCounter | Numbers only (not labels) |
| Progress | Completion/achievement fill |
| Button | CTA variant only |

**Everything else is grayscale.** This maintains the 1-2% gold budget from SYSTEMS.md.

### Rounded Square Identity

HIVE uses rounded squares for avatars instead of circles. This:
- Differentiates from every other social platform
- Enables card-like profile discovery (Tinder vision)
- Grids beautifully for browse interfaces
- Allows info overlays naturally

---

## UPSTREAM DEPENDENCIES

### From LANGUAGE.md

```css
/* Colors */
--color-bg-page: #0A0A09;
--color-bg-card: #141414;
--color-bg-elevated: #1A1A1A;
--color-border: #2A2A2A;
--color-text-primary: #FAF9F7;
--color-text-secondary: #A1A1A6;
--color-text-subtle: #6B6B6B;
--color-accent-gold: #FFD700;
--color-error: #FF453A;

/* Typography */
--font-display: "Clash Display", system-ui, sans-serif;
--font-body: "Geist", system-ui, sans-serif;
--font-mono: "Geist Mono", monospace;

/* Spacing */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;

/* Motion */
--duration-snap: 150ms;
--duration-normal: 250ms;
--duration-smooth: 350ms;
--easing-default: cubic-bezier(0.4, 0, 0.2, 1);
--easing-out: cubic-bezier(0, 0, 0.2, 1);
```

### From SYSTEMS.md

- **Atmosphere Spectrum**: Landing (rich) → Spaces (default) → Workshop (focused)
- **Edge-Based Warmth**: Activity shown via border/shadow, not background glow
- **Gold Budget**: 1-2% of screen area
- **Motion**: Purposeful only, no decorative animation

---

## PRIMITIVE CATALOG

### 1. Card

The foundational container. Every surface in HIVE is a card variant.

#### Purpose
Contain and group related content with appropriate atmosphere and activity indication.

#### API

```tsx
interface CardProps {
  atmosphere?: 'landing' | 'spaces' | 'workshop';
  warmth?: 'none' | 'low' | 'high';
  elevation?: 'resting' | 'raised' | 'floating';
  translucent?: boolean; // Apple-style glass effect
  children: React.ReactNode;
}

<Card
  atmosphere="spaces"
  warmth="low"
  elevation="resting"
>
  {children}
</Card>
```

#### Design Specification

```css
/* Base */
.card {
  border-radius: 8px;
  transition: box-shadow var(--duration-smooth) var(--easing-out);
}

/* Atmosphere: Landing (rich) */
.card[data-atmosphere="landing"] {
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Atmosphere: Spaces (default) */
.card[data-atmosphere="spaces"] {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

/* Atmosphere: Workshop (focused) */
.card[data-atmosphere="workshop"] {
  background: #0F0F0F;
  border: 1px solid #1A1A1A;
}

/* Translucent variant (Apple glass) */
.card[data-translucent="true"] {
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(40px) saturate(180%);
  border: none;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Elevation */
.card[data-elevation="resting"] {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.card[data-elevation="raised"] {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.card[data-elevation="floating"] {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Edge Warmth (gold activity indication) */
/* Whisper-level: barely perceptible, felt not seen */
.card[data-warmth="low"] {
  box-shadow:
    inset 0 0 0 1px rgba(255, 215, 0, 0.06),
    0 0 40px rgba(255, 215, 0, 0.02);
}

.card[data-warmth="high"] {
  box-shadow:
    inset 0 0 0 1px rgba(255, 215, 0, 0.12),
    0 0 60px rgba(255, 215, 0, 0.04);
}
```

#### Gold Usage
Edge warmth only. Never background tint.

---

### 2. PresenceDot

The atomic indicator of life. Shows someone is here, right now.

#### Purpose
Indicate online/active status with minimal visual footprint.

#### API

```tsx
interface PresenceDotProps {
  status: 'online' | 'away' | 'offline';
  size?: 'sm' | 'default';
}

<PresenceDot status="online" size="default" />
```

#### Design Specification

```css
/* Apple-crisp, no animation */
.presence-dot {
  border-radius: 50%;
  flex-shrink: 0;
}

.presence-dot--sm {
  width: 6px;
  height: 6px;
}

.presence-dot--default {
  width: 8px;
  height: 8px;
}

/* Status colors */
.presence-dot--online {
  background: var(--color-accent-gold);
}

.presence-dot--away {
  background: #4A4A4A;
}

.presence-dot--offline {
  background: #2A2A2A;
}
```

#### Gold Usage
Always gold when online. This is one of the few "always gold" primitives.

---

### 3. ActivityEdge

How containers show they have life inside. The warmth system at component level.

#### Purpose
Indicate activity within a container through subtle edge treatment.

#### API

```tsx
interface ActivityEdgeProps {
  intensity: 'none' | 'low' | 'medium' | 'high';
  children: React.ReactNode;
}

<ActivityEdge intensity="medium">
  <Card>...</Card>
</ActivityEdge>
```

#### Design Specification

```css
/*
 * CRITICAL: Keep whisper-level to avoid AI-generic appearance
 * User should FEEL warmth, not SEE a glow effect
 */

.activity-edge {
  position: relative;
  transition: box-shadow var(--duration-smooth) var(--easing-out);
}

.activity-edge--none {
  box-shadow: none;
}

/* Barely perceptible */
.activity-edge--low {
  box-shadow:
    inset 0 0 0 1px rgba(255, 215, 0, 0.04),
    0 0 30px rgba(255, 215, 0, 0.01);
}

/* Subtle */
.activity-edge--medium {
  box-shadow:
    inset 0 0 0 1px rgba(255, 215, 0, 0.08),
    0 0 50px rgba(255, 215, 0, 0.025);
}

/* Noticeable but not loud */
.activity-edge--high {
  box-shadow:
    inset 0 0 0 1px rgba(255, 215, 0, 0.12),
    0 0 70px rgba(255, 215, 0, 0.04);
}
```

#### Gold Usage
Conditional based on activity level. Inset stronger than outset for authenticity.

#### Anti-Pattern Warning

```css
/* AVOID: AI-generic glow */
box-shadow: 0 0 30px rgba(255, 215, 0, 0.25); /* Too strong */

/* USE: HIVE-authentic whisper */
box-shadow: 0 0 50px rgba(255, 215, 0, 0.025); /* Barely there */
```

---

### 4. LifeBadge

Achievement/status indicators. The "earned gold" moments.

#### Purpose
Indicate achievements, status, or categories with minimal color palette.

#### API

```tsx
interface LifeBadgeProps {
  variant: 'neutral' | 'gold' | 'error';
  children: React.ReactNode;
}

<LifeBadge variant="gold">Founding Member</LifeBadge>
<LifeBadge variant="neutral">3 members</LifeBadge>
<LifeBadge variant="error">Failed</LifeBadge>
```

#### Design Specification

```css
.life-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
}

/* Neutral (default) */
.life-badge--neutral {
  background: #2A2A2A;
  color: var(--color-text-secondary);
}

/* Gold (achievements only) */
.life-badge--gold {
  background: rgba(255, 215, 0, 0.1);
  color: var(--color-accent-gold);
}

/* Error (safety, keep red) */
.life-badge--error {
  background: rgba(255, 69, 58, 0.15);
  color: var(--color-error);
}
```

#### Gold Usage
Achievement variant only. No success/warning/info colors — just gold, gray, or error red.

---

### 5. TypingIndicator

Real-time presence in conversation.

#### Purpose
Show that users are typing in a chat context.

#### API

```tsx
interface TypingIndicatorProps {
  users: Array<{ id: string; name: string }>;
}

<TypingIndicator users={[{ id: '1', name: 'Alex' }]} />
// Multiple users triggers gold color
```

#### Design Specification

```css
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 8px 12px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-subtle);
  animation: typing-pulse 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-pulse {
  0%, 60%, 100% { opacity: 0.4; transform: scale(1); }
  30% { opacity: 1; transform: scale(1.1); }
}

/* Multiple users = gold (conversation heating up) */
.typing-indicator--multiple .typing-dot {
  background: var(--color-accent-gold);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.typing-indicator-text {
  font-size: 13px;
  color: var(--color-text-subtle);
  margin-left: 8px;
}
```

#### Gold Usage
Only when multiple users are typing simultaneously.

---

### 6. LiveCounter

Numbers that update in real-time.

#### Purpose
Display live metrics with visual acknowledgment of updates.

#### API

```tsx
interface LiveCounterProps {
  value: number;
  label?: string;
  gold?: boolean; // Force gold numbers
}

<LiveCounter value={127} label="online now" />
```

#### Design Specification

```css
.live-counter {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.live-counter-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-accent-gold);
  transition: transform var(--duration-snap) var(--easing-out);
}

.live-counter-value--updating {
  animation: counter-bump 200ms var(--easing-out);
}

@keyframes counter-bump {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.live-counter-label {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-subtle);
}
```

#### Gold Usage
Numbers are gold. Labels are gray. Reserve for active counts only, not static data.

---

### 7. PropertyField

Form fields in the IDE/workshop context.

#### Purpose
Label + input combinations optimized for dense property panels.

#### API

```tsx
interface PropertyFieldProps {
  label: string;
  layout?: 'horizontal' | 'vertical';
  children: React.ReactNode;
}

<PropertyField label="Border Radius" layout="horizontal">
  <Input type="number" />
</PropertyField>
```

#### Design Specification

```css
/* Vertical (default for forms) */
.property-field--vertical {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* Horizontal (workshop density) */
.property-field--horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.property-field--horizontal .property-label {
  flex: 0 0 40%;
  text-align: right;
}

.property-label {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600; /* Apple bold labels */
  color: var(--color-text-secondary);
}
```

#### Gold Usage
None.

---

### 8. CanvasArea

The main building surface in HiveLab IDE.

#### Purpose
Provide a workspace for visual tool composition.

#### API

```tsx
interface CanvasAreaProps {
  showGrid?: boolean;
  gridSize?: number;
  children: React.ReactNode;
}

<CanvasArea showGrid={true} gridSize={20}>
  {elements}
</CanvasArea>
```

#### Design Specification

```css
.canvas-area {
  background: var(--color-bg-page);
  position: relative;
  min-height: 400px;
  overflow: hidden;
}

/* Optional dot grid (toggleable) */
.canvas-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #2A2A2A 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0;
  transition: opacity 200ms var(--easing-out);
  pointer-events: none;
}

.canvas-area--grid-visible::before {
  opacity: 1;
}

/* Optional Apple gradient depth */
.canvas-area--depth {
  background: radial-gradient(
    ellipse at center,
    #0F0F0F 0%,
    var(--color-bg-page) 70%
  );
}
```

#### Gold Usage
None.

---

### 9. HandleDot

Resize/connection handles on canvas elements.

#### Purpose
Provide grab points for resizing and connecting elements.

#### API

```tsx
interface HandleDotProps {
  position: 'top-left' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left';
  onDrag: (delta: { x: number; y: number }) => void;
}

<HandleDot position="bottom-right" onDrag={handleResize} />
```

#### Design Specification

```css
.handle-dot {
  width: 10px; /* Apple sizing for touch */
  height: 10px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 1.5px solid var(--color-bg-page);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--duration-snap) var(--easing-out),
              transform var(--duration-snap) var(--easing-out);
}

.canvas-element:hover .handle-dot,
.canvas-element--selected .handle-dot {
  opacity: 1;
}

.handle-dot:hover {
  transform: scale(1.2);
}

/* Cursor variants by position */
.handle-dot--top-left,
.handle-dot--bottom-right { cursor: nwse-resize; }
.handle-dot--top-right,
.handle-dot--bottom-left { cursor: nesw-resize; }
.handle-dot--top,
.handle-dot--bottom { cursor: ns-resize; }
.handle-dot--left,
.handle-dot--right { cursor: ew-resize; }
```

#### Gold Usage
None.

---

### 10. Modal

Overlay dialogs for focused interactions.

#### Purpose
Present focused content that requires user attention or action.

#### API

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  variant?: 'default' | 'alert' | 'sheet' | 'fullscreen';
  children: React.ReactNode;
}

<Modal open={isOpen} onClose={close} variant="default">
  <ModalHeader>Title</ModalHeader>
  <ModalContent>...</ModalContent>
  <ModalFooter>...</ModalFooter>
</Modal>
```

#### Design Specification

```css
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(24px);
  opacity: 0;
  transition: opacity var(--duration-normal) var(--easing-out);
}

.modal-backdrop--open {
  opacity: 1;
}

/* Alert variant (heavier blur) */
.modal-backdrop--alert {
  backdrop-filter: blur(40px);
}

/* Panel base */
.modal-panel {
  position: fixed;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  max-width: 480px;
  width: 90vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Default: centered, slide up */
.modal-panel--default {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateY(16px);
  opacity: 0;
  transition:
    transform var(--duration-smooth) var(--easing-out),
    opacity var(--duration-normal) var(--easing-out);
}

.modal-panel--default.modal-panel--open {
  transform: translate(-50%, -50%) translateY(0);
  opacity: 1;
}

/* Alert: centered, fade only */
.modal-panel--alert {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity var(--duration-normal) var(--easing-out);
}

.modal-panel--alert.modal-panel--open {
  opacity: 1;
}

/* Sheet: slides from bottom */
.modal-panel--sheet {
  top: auto;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 100%;
  border-radius: 12px 12px 0 0;
  transform: translateY(100%);
  transition: transform var(--duration-smooth) var(--easing-out);
}

.modal-panel--sheet.modal-panel--open {
  transform: translateY(0);
}

/* Fullscreen: no border radius */
.modal-panel--fullscreen {
  inset: 0;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
  border: none;
  opacity: 0;
  transition: opacity var(--duration-normal) var(--easing-out);
}

.modal-panel--fullscreen.modal-panel--open {
  opacity: 1;
}

/* Internal structure */
.modal-header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-content {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
```

#### Gold Usage
None in modal chrome. CTAs inside modal follow Button gold rules.

---

### 11. Toast

Transient notifications that auto-dismiss.

#### Purpose
Provide brief feedback that doesn't require user action.

#### API

```tsx
interface ToastProps {
  variant?: 'default' | 'success' | 'error';
  duration?: number;
  children: React.ReactNode;
}

toast({ variant: 'success', children: 'Message saved' });
```

#### Design Specification

```css
.toast {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%) translateY(16px);
  opacity: 0;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition:
    transform var(--duration-normal) var(--easing-out),
    opacity 200ms var(--easing-out);
  z-index: 9999;
}

.toast--visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* Variant borders */
.toast--success {
  border-color: rgba(52, 199, 89, 0.3);
}

.toast--error {
  border-color: rgba(255, 69, 58, 0.3);
}
```

#### Gold Usage
None. Success is quiet, not gold.

---

### 12. Tooltip

Contextual hints on hover.

#### Purpose
Provide additional context without cluttering the interface.

#### API

```tsx
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

<Tooltip content="Edit profile" side="top">
  <Button>...</Button>
</Tooltip>
```

#### Design Specification

```css
.tooltip {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 10px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity var(--duration-snap) var(--easing-out),
    transform var(--duration-snap) var(--easing-out);
  pointer-events: none;
  z-index: 9999;
  /* No arrow — minimal design */
}

.tooltip--visible {
  opacity: 1;
  transform: translateY(0);
}

/* 150ms delay before showing */
[data-tooltip-trigger]:hover + .tooltip {
  transition-delay: 150ms;
}
```

#### Gold Usage
None.

---

### 13. Progress

Visual indication of completion or loading.

#### Purpose
Show progress toward a goal or during loading.

#### API

```tsx
interface ProgressProps {
  value: number; // 0-100
  variant?: 'default' | 'gold';
  size?: 'sm' | 'default' | 'lg';
}

<Progress value={75} variant="gold" size="default" />
```

#### Design Specification

```css
.progress {
  width: 100%;
  background: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
}

.progress--sm { height: 4px; }
.progress--default { height: 6px; }
.progress--lg { height: 8px; }

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width var(--duration-smooth) var(--easing-out);
}

/* Default: gray fill */
.progress-fill--default {
  background: var(--color-text-secondary);
}

/* Gold: for achievements/completion */
.progress-fill--gold {
  background: var(--color-accent-gold);
}
```

#### Gold Usage
Gold variant for achievements and completion. Default is gray.

---

### 14. Skeleton

Loading placeholders that maintain layout.

#### Purpose
Show content structure during data fetching.

#### API

```tsx
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
}

<Skeleton variant="text" width={200} />
<Skeleton variant="circular" width={40} height={40} />
```

#### Design Specification

```css
.skeleton {
  background: var(--color-bg-elevated);
  animation: skeleton-pulse 2s ease-in-out infinite;
}

.skeleton--text {
  height: 1em;
  border-radius: 4px;
}

.skeleton--circular {
  border-radius: 50%;
}

.skeleton--rectangular {
  border-radius: 4px;
}

/* Apple-style subtle shimmer pulse */
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 0.4;
    background: var(--color-bg-elevated);
  }
  50% {
    opacity: 0.7;
    background: linear-gradient(
      90deg,
      var(--color-bg-elevated) 0%,
      #252525 50%,
      var(--color-bg-elevated) 100%
    );
  }
}
```

#### Gold Usage
None.

---

### 15. Tabs

Navigation between related views.

#### Purpose
Switch between content sections within a container.

#### API

```tsx
<Tabs defaultValue="chat">
  <TabsList>
    <TabsTrigger value="chat">Chat</TabsTrigger>
    <TabsTrigger value="board">Board</TabsTrigger>
    <TabsTrigger value="files">Files</TabsTrigger>
  </TabsList>
  <TabsContent value="chat">...</TabsContent>
  <TabsContent value="board">...</TabsContent>
  <TabsContent value="files">...</TabsContent>
</Tabs>
```

#### Design Specification

```css
.tabs-list {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--color-bg-page);
  border-radius: 8px;
  position: relative;
}

.tabs-trigger {
  position: relative;
  padding: 8px 16px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 6px;
  transition: color var(--duration-snap) var(--easing-out);
  z-index: 1;
  cursor: pointer;
  background: transparent;
  border: none;
}

.tabs-trigger:hover {
  color: var(--color-text-primary);
}

.tabs-trigger[data-state="active"] {
  color: var(--color-text-primary);
}

/* Sliding indicator (Framer Motion layoutId) */
.tabs-indicator {
  position: absolute;
  background: var(--color-bg-elevated);
  border-radius: 6px;
  z-index: 0;
  /* Position/size handled by Framer Motion */
}

.tabs-content {
  padding-top: var(--space-4);
}
```

#### Gold Usage
None.

---

### 16. Avatar

User representation with rounded square identity.

#### Purpose
Display user photos or initials in a distinctive HIVE style.

#### API

```tsx
interface AvatarProps {
  src?: string;
  fallback: string; // Initials
  size?: 'sm' | 'default' | 'lg' | 'xl';
  alt?: string;
}

<Avatar src={user.avatar} fallback="JD" size="default" />
```

#### Design Specification

```css
/* HIVE Identity: Rounded square, not circle */
.avatar {
  overflow: hidden;
  background: var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Sizes */
.avatar--sm {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.avatar--default {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.avatar--lg {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.avatar--xl {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.avatar--sm .avatar-fallback { font-size: 10px; }
.avatar--default .avatar-fallback { font-size: 12px; }
.avatar--lg .avatar-fallback { font-size: 14px; }
.avatar--xl .avatar-fallback { font-size: 16px; }
```

#### Gold Usage
None in base avatar. See AvatarWithPresence for gold ring.

#### AvatarWithPresence Wrapper

```tsx
<AvatarWithPresence status="online">
  <Avatar ... />
</AvatarWithPresence>
```

```css
.avatar-with-presence {
  position: relative;
}

.avatar-with-presence::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 2px solid transparent;
  pointer-events: none;
}

.avatar-with-presence--online::after {
  border-color: var(--color-accent-gold);
}
```

---

### 17. AvatarGroup

Multiple avatars shown together.

#### Purpose
Display multiple users with overlap and overflow indication.

#### API

```tsx
interface AvatarGroupProps {
  max?: number;
  children: React.ReactNode; // Avatar components
}

<AvatarGroup max={4}>
  <Avatar ... />
  <Avatar ... />
  <Avatar ... />
  <Avatar ... />
  <Avatar ... />
</AvatarGroup>
// Shows 4 avatars + "+1" overflow badge
```

#### Design Specification

```css
.avatar-group {
  display: flex;
  align-items: center;
}

/* Apple-style ring separation */
.avatar-group > .avatar {
  margin-left: -8px;
  border: 2px solid var(--color-bg-page);
  position: relative;
}

.avatar-group > .avatar:first-child {
  margin-left: 0;
}

/* Stacking order: first on top */
.avatar-group > .avatar:nth-child(1) { z-index: 5; }
.avatar-group > .avatar:nth-child(2) { z-index: 4; }
.avatar-group > .avatar:nth-child(3) { z-index: 3; }
.avatar-group > .avatar:nth-child(4) { z-index: 2; }
.avatar-group > .avatar:nth-child(5) { z-index: 1; }

/* Overflow indicator */
.avatar-group-overflow {
  margin-left: -8px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  z-index: 0;
}
```

#### Gold Usage
None.

---

### 18. Badge

Small status/category indicators.

#### Purpose
Label items with status, category, or count information.

#### API

```tsx
interface BadgeProps {
  variant?: 'default' | 'gold' | 'error';
  children: React.ReactNode;
}

<Badge variant="gold">Pro</Badge>
<Badge variant="default">12 members</Badge>
<Badge variant="error">Offline</Badge>
```

#### Design Specification

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
}

.badge--default {
  background: var(--color-border);
  color: var(--color-text-secondary);
}

.badge--gold {
  background: rgba(255, 215, 0, 0.1);
  color: var(--color-accent-gold);
}

.badge--error {
  background: rgba(255, 69, 58, 0.15);
  color: var(--color-error);
}
```

#### Gold Usage
Gold variant for premium/special status. Default is gray.

---

### 19. Separator

Visual divider between content sections.

#### Purpose
Create visual breaks between content groups.

#### API

```tsx
interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
}

<Separator orientation="horizontal" />
```

#### Design Specification

```css
/* Gradient fade for elegance */
.separator--horizontal {
  height: 1px;
  width: 100%;
  background: linear-gradient(
    to right,
    transparent,
    var(--color-border) 20%,
    var(--color-border) 80%,
    transparent
  );
}

.separator--vertical {
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--color-border) 20%,
    var(--color-border) 80%,
    transparent
  );
}
```

#### Gold Usage
None.

---

### 20. Icon

Iconography system using Heroicons.

#### Purpose
Provide consistent iconography across the interface.

#### API

```tsx
import { HomeIcon, Cog6ToothIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid } from '@heroicons/react/24/solid';

// Via wrapper
interface IconProps {
  name: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'solid';
}

<Icon name="home" size="default" variant="outline" />

// Or direct import
<HomeIcon className="icon icon--default" />
```

#### Design Specification

```css
.icon {
  stroke-width: 1.5px;
  color: currentColor;
  flex-shrink: 0;
}

.icon--sm {
  width: 16px;
  height: 16px;
}

.icon--default {
  width: 20px;
  height: 20px;
}

.icon--lg {
  width: 24px;
  height: 24px;
}
```

#### Icon Selection Guidelines

| Context | Variant |
|---------|---------|
| Navigation | Outline 24px |
| Status indicators | Solid 20px mini |
| Buttons | Outline 20px |
| Badges | Solid 16px mini |

#### Gold Usage
None in icon styling. Icons inherit text color.

---

### 21. AtmosphereProvider

System-level context for primitive appearance.

#### Purpose
Adjust primitive styling based on page context (landing, spaces, workshop).

#### API

```tsx
interface AtmosphereProviderProps {
  level: 'landing' | 'spaces' | 'workshop';
  children: React.ReactNode;
}

// In layout
<AtmosphereProvider level="landing">
  <LandingPage />
</AtmosphereProvider>

// In component
const { atmosphere } = useAtmosphere();
// OR read CSS variable
// var(--blur-intensity), var(--card-bg), etc.
```

#### Design Specification

```tsx
// Context + CSS Variables hybrid
const atmosphereConfig = {
  landing: {
    '--blur-intensity': '12px',
    '--card-bg': 'rgba(20, 20, 20, 0.8)',
    '--card-border': 'rgba(255, 255, 255, 0.06)',
    '--gold-intensity': '1',
  },
  spaces: {
    '--blur-intensity': '8px',
    '--card-bg': '#141414',
    '--card-border': '#2A2A2A',
    '--gold-intensity': '0.8',
  },
  workshop: {
    '--blur-intensity': '0px',
    '--card-bg': '#0F0F0F',
    '--card-border': '#1A1A1A',
    '--gold-intensity': '0.6',
  },
};

const AtmosphereProvider = ({ level, children }) => {
  const config = atmosphereConfig[level];

  return (
    <AtmosphereContext.Provider value={{ level }}>
      <div className={`atmosphere-${level}`} style={config}>
        {children}
      </div>
    </AtmosphereContext.Provider>
  );
};
```

```css
/* Atmosphere classes for global cascading */
.atmosphere-landing {
  /* Rich, premium, Apple-like */
}

.atmosphere-spaces {
  /* Default, balanced */
}

.atmosphere-workshop {
  /* Focused, utilitarian, VS Code-like */
}
```

#### Gold Usage
Controls `--gold-intensity` variable that primitives can reference.

---

## TYPOGRAPHY PRIMITIVES

Already confirmed in previous session. Summary:

### DisplayText

```tsx
<DisplayText size="default" | "sm">Headline</DisplayText>
```

```css
.display-text {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.display-text--default { font-size: 72px; line-height: 1.0; }
.display-text--sm { font-size: 48px; line-height: 1.1; }
```

### Heading

```tsx
<Heading level={1 | 2 | 3}>Title</Heading>
```

```css
.heading-1 {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.heading-2 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.heading-3 {
  font-family: var(--font-body);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
}
```

### Text

```tsx
<Text size="default" | "sm" | "xs" truncate={boolean}>Body</Text>
```

```css
.text { font-family: var(--font-body); color: var(--color-text-primary); }
.text--default { font-size: 16px; line-height: 1.5; }
.text--sm { font-size: 14px; line-height: 1.5; }
.text--xs { font-size: 13px; line-height: 1.4; }
.text--truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

### Mono

```tsx
<Mono size="default" | "sm" | "xs" inline={boolean}>code</Mono>
```

```css
.mono { font-family: var(--font-mono); color: var(--color-text-primary); }
.mono--default { font-size: 14px; }
.mono--sm { font-size: 13px; }
.mono--xs { font-size: 12px; }
.mono--inline {
  background: var(--color-bg-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}
```

### Label

```tsx
<Label size="default">Field Label</Label>
```

```css
.label {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}
```

### Link

```tsx
<Link href="/path" external={boolean}>Link text</Link>
```

```css
.link {
  color: var(--color-text-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: opacity var(--duration-snap) var(--easing-out);
}

.link:hover { opacity: 0.7; }
```

---

## INPUT PRIMITIVES

Already confirmed. Summary:

### Button

5 variants: `default`, `cta`, `ghost`, `destructive`, `link`
5 sizes: `sm`, `default`, `lg`, `xl`, `icon`

Gold: CTA variant only (~1% of buttons)

### Input

2 variants: `default`, `ghost`
Status prop: `error`
Focus ring: WHITE (never gold)

### Textarea

Same as Input + `autoResize` prop

### Select

Custom dropdown with Radix

### Checkbox

White check mark

### Switch

Gold track when on

### Radio

White dot

---

## IMPLEMENTATION NOTES

### Build Order

1. **AtmosphereProvider** — Context for all other primitives
2. **Card** — Foundation container
3. **Typography** — DisplayText, Heading, Text, Mono, Label, Link
4. **Input System** — Button, Input, Textarea, Select, Checkbox, Switch, Radio
5. **Feedback** — Modal, Toast, Tooltip, Progress, Skeleton
6. **Navigation** — Tabs, Avatar, AvatarGroup, Badge
7. **Life System** — PresenceDot, ActivityEdge, LifeBadge, TypingIndicator, LiveCounter
8. **Workshop** — PropertyField, CanvasArea, HandleDot
9. **Utility** — Separator, Icon

### Dependencies

- **Radix UI**: Dialog, Tooltip, Select, Checkbox, Switch, Radio, Tabs
- **Framer Motion**: Tabs indicator, Modal animations, Toast stack
- **Heroicons**: Icon system
- **CVA (Class Variance Authority)**: Variant management

### Testing Requirements

Each primitive needs:
- Visual regression test (Storybook + Chromatic)
- Accessibility audit (axe-core)
- Keyboard navigation test
- Atmosphere variant test (landing/spaces/workshop)
- Gold usage audit (ensure discipline)

---

## MIGRATION FROM CURRENT UI

The current codebase has 267 components across atomic folders. Migration approach:

1. **Audit current atoms** (`packages/ui/src/atomic/00-Global/atoms/`)
2. **Map to new primitives** (many will consolidate)
3. **Build new primitives** in parallel directory
4. **Gradual replacement** page by page
5. **Delete old atoms** once replaced

Key changes:
- Circle avatars → Rounded square avatars
- Lucide icons → Heroicons
- Various card styles → Unified Card with atmosphere
- Scattered gold usage → Disciplined gold budget

---

## NEXT LEVEL

Primitives combine to form **Components (Level 6)** — higher-order compositions with specific purposes.

See: `COMPONENTS.md`

---

*Primitives are the vocabulary. Components are the sentences. Together they speak HIVE.*
