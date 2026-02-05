# HiveLab Tools System: UI/UX Design Audit

**Date:** February 2026
**Status:** Comprehensive Design Review
**Scope:** 15 Design Perspectives for HiveLab Tool Builder

---

## Executive Summary

HiveLab is HIVE's no-code tool builder for campus spaces. This audit examines the system through 15 design lenses, comparing current implementation against 2026 best-in-class builders (Notion, Figma, Linear, Retool, Zapier). Key findings:

**Strengths:**
- Strong template system (35 templates across 6 categories, 8 app-tier compositions)
- Solid element palette with tiered permissions (Universal/Connected/Space)
- AI command palette foundation (Cmd+K) with selection-aware commands
- Clean IDE-inspired visual language with consistent token usage

**Critical Gaps:**
- Canvas lacks visual connection lines between elements (connections are data-only)
- No undo/redo stack visible in UI
- Onboarding relies on templates rather than guided creation
- Analytics panel is read-only with no actionable insights
- Automation builder is awareness-only (shows existing, can't create inline)

---

## Visual Design Agents

### 1. Canvas Aesthetician

**Current Assessment:**
- Canvas uses absolute positioning with `position: { x, y }` coordinates
- Elements render in a flow/stack layout for preview, grid coordinates for IDE
- Background is solid `var(--hivelab-bg)` with no grid visualization
- No pan/zoom controls visible (documented in IDE index but not prominent)
- Smart guides mentioned but subtle implementation

**What Works:**
- Clean dark aesthetic aligns with IDE/creative tool conventions
- Warm gold accents (`var(--life-gold)`) provide HIVE brand continuity
- Skeleton loading states maintain spatial relationships

**What Doesn't:**
- No visible grid for alignment reference
- Free-form placement without snap-to-grid feedback
- Canvas feels empty without element placement guides

**2026 Design Direction:**

*Reference: Figma's infinite canvas with zoom levels*

```
Canvas Layers (bottom to top):
1. Grid Layer: Subtle 20px grid, opacity 0.03 (togglable)
2. Guide Layer: Smart alignment guides on drag (Figma-style)
3. Connection Layer: Bezier curves between connected elements
4. Element Layer: The actual tool elements
5. Selection Layer: Multi-select marquee, resize handles
6. Overlay Layer: Tooltips, command palette, modals
```

**Specific Recommendations:**

1. **Add Grid Toggle**
   - Keyboard shortcut: `Cmd+'` (Figma convention)
   - Grid sizes: 8px (tight), 20px (default), 40px (loose)
   - Show grid at zoom >50%, hide at lower zoom

2. **Implement Visible Snap Behavior**
   - Snap lines appear at 4px proximity to other elements
   - Snap to: element edges, element centers, canvas center
   - Audio micro-feedback on snap (subtle click)

3. **Canvas Navigation**
   - Space+drag for pan (Figma standard)
   - Scroll wheel for zoom (centered on cursor)
   - Zoom indicator in bottom-left: "100%" clickable for reset
   - Minimap in bottom-right for large compositions (collapse on small tools)

4. **Empty Canvas State**
   - Current: "No elements yet" with icon
   - Proposed: Ghost element placeholders showing common patterns
   - "Drag an element here" with pulsing drop zone

---

### 2. Element Library Designer

**Current Assessment:**
- 27 elements across 3 tiers: Universal (11), Connected (5), Space (7)
- 5 categories: Input, Display, Filter, Action, Layout
- Element palette uses collapsible categories with search
- Tier badges: "Auth" (blue) for Connected, "Space" (purple) for Space-tier
- Coming-soon elements show "Soon" badge, greyed out

**What Works:**
- Tiered system respects user context (space leaders see more)
- Category groupings are logical for intent-based discovery
- Search filters by name and description
- Drag-and-drop works with HTML5 native drag

**What Doesn't:**
- 27 elements is large enough to feel overwhelming
- No preview of what element looks like
- Icon-only representation doesn't convey functionality
- No "recently used" or "favorites" section

**2026 Design Direction:**

*Reference: Retool component library with live previews*

**Recommendations:**

1. **Two-Panel Element Browser**
   ```
   +------------------+--------------------+
   | Category List    | Element Grid       |
   | - Input (4)      | [Preview] [Preview]|
   | - Display (4)    | [Preview] [Preview]|
   | - Action (3)     |                    |
   | > All (20)       | Hover: Live demo   |
   +------------------+--------------------+
   ```

2. **Element Card Redesign**
   - 80x80px cards with mini live preview
   - Name below icon (not beside)
   - Tier indicator as colored left-border (not badge)
   - Hover state: Expand to show description + "Drag to add"

3. **Smart Suggestions Section**
   - "Based on your tool" section at top
   - If tool has poll, suggest chart-display
   - If tool has form, suggest result-list
   - Connection recommendations based on element compatibility

4. **Quick Add Menu**
   - `/` key opens inline element search (Notion-style)
   - Filters by element name, outputs matching elements
   - Arrow keys to navigate, Enter to add at cursor/selection

5. **Element Preview Panel**
   - Click element (not drag) to open preview
   - Shows: Live interactive demo, config options, "Use in tool" CTA
   - Common configurations as presets: "Poll with 3 options", "Simple counter"

---

### 3. Connection Visualizer

**Current Assessment:**
- Connections exist in data model: `{ from: { instanceId, port }, to: { instanceId, port } }`
- `transformToCanvasElements` extracts connections but they're not visually rendered
- `connections-panel.tsx` and `connection-builder-modal.tsx` exist for manual connection
- No visible lines, arrows, or flow indicators on canvas

**What Works:**
- Data model supports port-based connections (input/output distinction)
- Connection infrastructure is in place for automation logic

**What Doesn't:**
- Users cannot see relationships between elements
- No visual feedback when elements are connected
- Connection creation is modal-based, not direct manipulation

**2026 Design Direction:**

*Reference: Zapier's trigger-action visualization + Figma's prototype flow arrows*

**Recommendations:**

1. **Connection Visualization Layer**
   ```
   Element A [output port] -----> [input port] Element B
                           \
                            '---> [input port] Element C
   ```
   - Bezier curves with subtle animation (data "flowing")
   - Color coding: Gold for active, gray for inactive
   - Hover on connection: Show data shape being passed

2. **Port System UI**
   - Elements show input ports (left edge) and output ports (right edge)
   - Ports appear on hover or when connection mode active
   - Port types: Data (circle), Event (diamond), Conditional (triangle)

3. **Direct Connection Creation**
   - Drag from output port to input port
   - Ghost line follows cursor during drag
   - Valid drop targets highlight, invalid dim
   - Connection snaps when within 20px of valid port

4. **Connection Inspector**
   - Click connection line to select
   - Properties panel shows: Source, Target, Data transformation
   - Quick actions: Delete, Disable, Add condition

5. **Flow Direction Indicators**
   - Animated dots moving along connection lines
   - Speed indicates data frequency
   - Paused when connection disabled

---

### 4. Template Gallery Curator

**Current Assessment:**
- 35 templates: 8 app-tier (4+ elements), 27 simple (1-2 elements)
- Categories: apps, events, engagement, resources, feedback, teams
- Templates page (`/lab/templates`) with WordReveal animation, category filters
- Featured templates shown on dashboard for new users
- Direct creation: Click template -> Create tool -> Redirect to IDE

**What Works:**
- Complexity tiers (app vs simple) help users find appropriate starting points
- Setup fields allow customization before creation
- Category filtering narrows options effectively
- "Multi-element" badge differentiates sophisticated templates

**What Doesn't:**
- No visual preview of what template looks like deployed
- No usage metrics ("12 spaces use this")
- Can't see element composition before committing
- No "similar templates" or "pairs well with" suggestions

**2026 Design Direction:**

*Reference: Notion template gallery with rich previews*

**Recommendations:**

1. **Template Card Redesign**
   ```
   +----------------------------------+
   | [Live Preview Thumbnail]         |
   | Photo Challenge                  |
   | "Run photo contests with..."     |
   | [camera] [poll] [trophy] [timer] | <- Element icons
   | 47 spaces | 4.8 rating           |
   | [Use Template]                   |
   +----------------------------------+
   ```

2. **Template Detail Modal**
   - Full interactive preview (read-only)
   - Element breakdown with descriptions
   - "What you can customize" section
   - "Spaces using this" social proof
   - "Related templates" carousel

3. **Smart Template Recommendations**
   - Based on space type: "For Greek Life", "For Academic Clubs"
   - Based on use case: "Running an event", "Managing resources"
   - Seasonal: "End of semester feedback", "Welcome week tools"

4. **Template Versioning**
   - Show "Updated 2 weeks ago" for freshness
   - "New" badge for templates < 30 days old
   - Changelog for major template updates

5. **Community Templates Section (Future)**
   - "Published by @designer-handle"
   - Fork count, remix capability
   - Quality badges: "HIVE Verified", "Community Favorite"

---

## Layout Agents

### 5. Builder Interface Architect

**Current Assessment:**
- Full-screen IDE layout with:
  - Header bar (tool name, save/preview/deploy actions, mode toggle)
  - Left rail (element palette icons)
  - Main canvas (element rendering)
  - Right panel (properties inspector, context-dependent)
- Mode toggle: Edit (IDE) vs Use (runtime preview)
- Panels are fixed-width, not resizable

**What Works:**
- Header provides clear tool context and primary actions
- Mode toggle allows testing without leaving builder
- Clean separation between building and previewing

**What Doesn't:**
- No panel resizing or collapse controls
- No layers panel visible by default
- Canvas takes less space than it could
- Mobile builder experience undefined

**2026 Design Direction:**

*Reference: Figma's panel system + VS Code's sidebar*

**Recommendations:**

1. **Flexible Panel System**
   ```
   +--------+-------------------------+---------+
   | Rail   | Canvas                  | Panel   |
   | 48px   | flex-1                  | 280px   |
   |        |                         | resize  |
   | [icon] |                         |         |
   | [icon] |                         |         |
   | [icon] |                         |         |
   +--------+-------------------------+---------+
           ^                         ^
           drag to resize            drag to resize
   ```

2. **Panel Collapse Behavior**
   - Click rail icon: Toggle corresponding panel
   - Double-click panel edge: Collapse to rail
   - Keyboard: `Cmd+B` toggle left, `Cmd+Shift+B` toggle right
   - Remember panel state per user

3. **Panel Tab System**
   - Right panel tabs: Properties | Layers | Connections | Automations
   - Tab persists selection across element changes
   - Badge on tab when relevant (e.g., "3" on Connections)

4. **Responsive Breakpoints**
   ```
   Desktop (>1200px): Full three-column layout
   Laptop (900-1200px): Collapsible panels, narrower defaults
   Tablet (600-900px): Single panel at a time, bottom sheet for panels
   Mobile (<600px): Preview-only mode, editing not supported
   ```

5. **Focus Mode**
   - `Cmd+.` hides all panels, canvas goes full-screen
   - Floating mini-toolbar for essential actions
   - Escape returns to normal layout

---

### 6. Automation Flow Designer

**Current Assessment:**
- Automation awareness panel shows existing automations for deployed tools
- Links to `/spaces/:id/automations/:id` for editing
- Trigger types: event, schedule, data_change, manual, tool_event
- No inline automation creation in builder
- Automations stored but execution engine noted as not live (from memory)

**What Works:**
- Awareness of automations affecting tool is valuable
- Trigger type categorization is clear
- Space context preserved in automation links

**What Doesn't:**
- Can't create automations while building
- No visual flow representation (trigger -> condition -> action)
- No simulation/testing of automation logic
- Execution status not visible (is it running? errors?)

**2026 Design Direction:**

*Reference: Zapier's Zap builder + n8n's visual workflow*

**Recommendations:**

1. **Automation Tab in Builder**
   - Fourth tab in right panel: "Automations"
   - Shows: Existing automations, "Create automation" CTA
   - Quick-create common patterns: "When counter hits 10", "Daily reset"

2. **Inline Trigger Builder**
   ```
   +------------------------------------------+
   | When: [Element] [Event]                  |
   |       poll-element receives vote         |
   +------------------------------------------+
   | Condition: (optional)                    |
   |       [votes] [>] [10]                   |
   +------------------------------------------+
   | Then: [Action]                           |
   |       Send notification to space         |
   +------------------------------------------+
   | [Test] [Save Automation]                 |
   +------------------------------------------+
   ```

3. **Visual Flow Canvas (Advanced Mode)**
   - Toggle to full automation builder
   - Nodes: Trigger (hexagon), Condition (diamond), Action (rectangle)
   - Drag connections between nodes
   - Live data preview at each step

4. **Automation Testing**
   - "Test with sample data" button
   - Shows: Trigger fired -> Condition evaluated -> Action executed
   - Error highlighting with suggestions

5. **Execution Log**
   - Recent runs: Success (green), Failed (red), Skipped (gray)
   - Click to expand: Input data, timestamps, error messages
   - "Re-run with same data" for debugging

---

### 7. Tool Card Composer

**Current Assessment:**
- Two ToolCard implementations:
  - `packages/ui/src/design-system/components/ToolCard.tsx`: Workshop card (category icon, space origin, uses count)
  - `apps/web/src/components/hivelab/dashboard/ToolCard.tsx`: Dashboard card (status badge, stats, updated)
- Status indicators: draft, published, deployed (Live/Ready/Draft)
- Hover effect uses opacity change, not scale (locked decision)
- Warmth edge glow for featured/trending

**What Works:**
- Category icon provides quick visual identification
- Status badges are clear and color-coded
- "Uses" count provides social proof
- Locked decisions prevent design drift

**What Doesn't:**
- Two implementations could diverge
- No mini-preview of tool content
- Can't see element composition from card
- No quick actions (duplicate, archive) on hover

**2026 Design Direction:**

*Reference: Linear's issue cards + Notion's database cards*

**Recommendations:**

1. **Unified ToolCard Component**
   - Single source of truth in design system
   - Props control variant: `variant="dashboard" | "gallery" | "compact"`
   - Consistent across all surfaces

2. **Card Anatomy (Gallery Variant)**
   ```
   +----------------------------------+
   | [Mini Canvas Preview]            | <- Live element thumbnails
   +----------------------------------+
   | Meeting Poll                     | <- Name
   | Updated 2h ago                   | <- Timestamp
   +----------------------------------+
   | [poll] [counter] +2              | <- Element composition
   | 142 uses | 4 spaces              | <- Social proof
   +----------------------------------+
   | [draft] ........................ | <- Status + quick actions on hover
   +----------------------------------+
   ```

3. **Quick Actions (Dashboard Variant)**
   - Hover reveals: Duplicate, Archive, Share
   - Right-click context menu with full options
   - Keyboard shortcuts when card focused

4. **Card States**
   - Default: Elevated surface
   - Hover: Subtle lift (no scale per locked decision)
   - Selected: Gold border
   - Dragging (for reorder): Semi-transparent + shadow
   - Error (sync failed): Red indicator

5. **Accessibility**
   - Card is focusable via Tab
   - Enter opens tool, Space opens quick actions
   - Status announced by screen readers

---

### 8. Analytics Dashboard Designer

**Current Assessment:**
- `ToolAnalyticsPanel` slides in from right as overlay
- Metrics: Total usage, Active users, Avg rating, Retention rate
- Charts: Daily usage (bar), Top spaces, Top actions, Rating distribution
- Recent reviews with star ratings
- Empty state when no data

**What Works:**
- Slide-out panel keeps context
- Metric cards with trends (+X% vs prev)
- Mini bar chart is scannable
- Reviews provide qualitative feedback

**What Doesn't:**
- Read-only, no actionable insights
- No time range comparison
- Can't drill down into specific days/spaces
- No export functionality
- No goals or benchmarks

**2026 Design Direction:**

*Reference: Amplitude's insight panels + Stripe dashboard*

**Recommendations:**

1. **Actionable Insights Section**
   ```
   +------------------------------------------+
   | INSIGHTS                                 |
   +------------------------------------------+
   | [trending-up] Usage up 23% this week     |
   |     Consider promoting this tool         |
   +------------------------------------------+
   | [alert] Drop-off at "submit" step        |
   |     View funnel > Simplify form          |
   +------------------------------------------+
   | [star] 4.8 avg rating (top 10%)          |
   |     Feature on profile                   |
   +------------------------------------------+
   ```

2. **Interactive Charts**
   - Click bar to filter to that day's data
   - Hover for detailed breakdown
   - Drag to select range for comparison
   - "Compare to previous period" toggle

3. **Goal Setting**
   - Set target: "100 uses this month"
   - Progress bar toward goal
   - Notification when goal achieved

4. **Cohort Analysis (Advanced)**
   - "Users who used poll also used..."
   - Retention curves by element type
   - A/B comparison for element variations

5. **Export & Sharing**
   - "Export to CSV" for raw data
   - "Share insight" generates link
   - Scheduled reports (weekly digest)

---

## Interaction Agents

### 9. Drag-Drop Choreographer

**Current Assessment:**
- HTML5 native drag from element palette
- `onDragStart` sets `elementId` in dataTransfer
- Canvas accepts drop and creates element at position
- No visual feedback during drag (ghost element mentioned in IDE index)
- Smart guides exist but implementation is subtle

**What Works:**
- Standard drag metaphor is learnable
- Element data properly transferred
- Drop creates element immediately

**What Doesn't:**
- No preview of element while dragging
- No snap feedback (visual or haptic)
- Drop zone not clearly indicated
- Can't cancel drag gracefully

**2026 Design Direction:**

*Reference: Figma's drag preview + Framer's snap feedback*

**Recommendations:**

1. **Drag Preview**
   - Ghost element follows cursor at 80% opacity
   - Shows actual element shape, not just icon
   - Scale 0.8x during drag, 1x on approach to drop

2. **Drop Zone Feedback**
   ```
   Before drag: Canvas normal
   During drag: Canvas shows subtle grid
               Valid zones pulse gently
               Ghost element snaps to grid
   On drop:    Element animates in (scale 0.9 -> 1.0)
               Brief gold glow on success
   ```

3. **Smart Guide System**
   - Guides appear at 8px proximity
   - Colors: Pink for center alignment, blue for edge alignment
   - Persist for 300ms after alignment achieved

4. **Keyboard Modifiers**
   - Hold Shift: Constrain to axis (horizontal/vertical only)
   - Hold Alt: Duplicate element instead of move
   - Hold Cmd: Disable snapping temporarily

5. **Drag Cancellation**
   - Escape key cancels drag, returns to start
   - Drop outside canvas cancels
   - Clear affordance: "Release to cancel" when outside

6. **Reorder Drag**
   - When dragging existing element, others shift to make space
   - Placeholder shows insertion point
   - Smooth animation (200ms) for reflow

---

### 10. Configuration Panel Designer

**Current Assessment:**
- Properties panel appears when element selected
- `contextual-inspector.tsx` handles context-dependent properties
- Form fields generated from element config schema
- Field types: text, textarea, number, options, date, checkbox
- No conditional fields based on other field values

**What Works:**
- Config tied to element selection
- Field types cover common needs
- Labels and placeholders provide guidance

**What Doesn't:**
- All fields shown at once (overwhelming for complex elements)
- No grouping or collapsible sections
- No preview of config changes
- No "reset to default" option
- Validation feedback delayed

**2026 Design Direction:**

*Reference: Webflow's style panel + Notion's property editor*

**Recommendations:**

1. **Grouped Configuration**
   ```
   +------------------------------------------+
   | Poll Element                             |
   +------------------------------------------+
   | v Content                                |
   |   Question: [___________________]        |
   |   Options:  [Option 1] [x]               |
   |             [Option 2] [x]               |
   |             [+ Add option]               |
   +------------------------------------------+
   | > Behavior (click to expand)             |
   +------------------------------------------+
   | > Appearance (click to expand)           |
   +------------------------------------------+
   ```

2. **Live Preview Toggle**
   - "Preview changes" checkbox
   - When enabled, canvas updates as you type
   - Debounced 300ms to prevent thrash

3. **Conditional Fields**
   - Show "Closing date" only when "Has deadline" checked
   - Dim disabled fields with explanation tooltip
   - Animate field appearance/disappearance

4. **Quick Presets**
   - "Common configurations" dropdown
   - "Yes/No poll", "Rating 1-5", "Multiple choice"
   - Apply preset fills multiple fields

5. **Field-Level Actions**
   - Reset icon next to each field
   - Copy value, paste value
   - "Use variable" for dynamic content

6. **Validation UX**
   - Inline validation as you type
   - Error state: Red border, error message below
   - Warning state: Yellow border (works but not recommended)
   - Valid state: Subtle green checkmark

---

### 11. AI Assistant Interface

**Current Assessment:**
- `AICommandPalette` opens with Cmd+K
- Selection-aware commands (different when 0, 1, or multi selected)
- Command types: generate, modify, add, explain, action
- Suggestions shown when input empty
- Streaming text support for AI responses

**What Works:**
- Keyboard-first invocation (Cmd+K is standard)
- Selection context changes available commands (Cursor-like)
- Suggestions lower barrier to entry
- Loading state with spinner

**What Doesn't:**
- No persistent chat history
- Single-turn interaction (submit -> result)
- No "refine" or "try again" flow
- Limited commands (6 base commands)
- No AI explanation of what it will do

**2026 Design Direction:**

*Reference: Cursor's Cmd+K + ChatGPT's conversational flow*

**Recommendations:**

1. **Conversational AI Panel**
   ```
   +------------------------------------------+
   | AI Assistant                        [x]  |
   +------------------------------------------+
   | USER: Create a poll for event dates      |
   +------------------------------------------+
   | AI: I'll create a poll with these        |
   |     options based on common event        |
   |     scheduling patterns:                 |
   |                                          |
   |     [Preview of poll element]            |
   |                                          |
   |     [Add to canvas] [Modify] [Explain]   |
   +------------------------------------------+
   | USER: Make it anonymous                  |
   +------------------------------------------+
   | AI: Updated. Anonymous voting enabled.   |
   |     Results visible only to you.         |
   |                                          |
   |     [Apply change] [Undo]                |
   +------------------------------------------+
   | [Type a message...]              [Send]  |
   +------------------------------------------+
   ```

2. **Inline AI Actions**
   - Right-click element: "Ask AI about this"
   - Selection + Cmd+K: AI knows what's selected
   - "Suggest improvements" command

3. **AI Preview Before Apply**
   - Show ghost element before adding
   - Show diff for modifications
   - "This will change X, Y, Z" explanation

4. **Multi-Turn Context**
   - AI remembers conversation within session
   - "Do the same for the other poll"
   - "Actually, make it 5 options instead"

5. **AI Templates**
   - "Build me a [use case]" generates full tool
   - Progress indicator: "Creating elements... Configuring... Done"
   - Option to review before applying

6. **AI Explain Mode**
   - Select anything, ask "Explain how this works"
   - AI provides plain-language explanation
   - Links to documentation

---

### 12. Deploy Flow Designer

**Current Assessment:**
- `ToolDeployModal` with 4 steps: target -> config -> confirm -> success
- Targets: Profile, Spaces (user leads)
- Config options: Surface, visibility, permissions, settings
- Flight animation for space deployments
- Success state with "View in space" CTA

**What Works:**
- Step-by-step reduces cognitive load
- Profile vs Space distinction is clear
- Privacy controls for profile deployments
- Celebratory animation rewards completion

**What Doesn't:**
- 4 steps feels long for simple deployment
- Can't deploy to multiple spaces at once
- No "quick deploy" for repeat deployments
- No preview of how tool will appear in space
- No rollback after deployment

**2026 Design Direction:**

*Reference: Vercel's deploy preview + Netlify's deploy flow*

**Recommendations:**

1. **Smart Defaults**
   - If user has deployed before, show "Deploy same as last time"
   - Pre-select most common space
   - Skip config step if using defaults

2. **Quick Deploy Mode**
   ```
   [Deploy] dropdown:
   |- Deploy to [Last Space] (quick)
   |- Deploy to Profile
   |- Deploy to new space...
   |- Configure deployment...
   ```

3. **Deploy Preview**
   - Before confirming, show "Preview in space context"
   - Simulates how tool will look in space sidebar
   - Test interactions in preview

4. **Multi-Space Deploy**
   - Checkbox list of spaces
   - "Deploy to all my spaces" option
   - Progress: "Deploying to 1 of 3..."

5. **Deployment History**
   - Show past deployments with timestamps
   - "Rollback to previous version" option
   - Compare current vs deployed config

6. **Post-Deploy Actions**
   ```
   +------------------------------------------+
   | Deployed to Design Club!                 |
   +------------------------------------------+
   | What's next?                             |
   |                                          |
   | [View in space] Most common              |
   | [Share link]    Copy deploy link         |
   | [Add automation] Set up triggers         |
   | [Deploy elsewhere] More spaces           |
   +------------------------------------------+
   ```

---

## Experience Agents

### 13. First Tool Builder (Onboarding)

**Current Assessment:**
- New users see: Welcome message -> Quick start templates -> AI prompt input
- `OnboardingOverlay` exists but dismissed via localStorage
- Templates are primary path (5 featured on dashboard)
- "Welcome to your Lab" word-reveal animation
- Value props shown: Engage members, Organize events, Track progress

**What Works:**
- Templates lower barrier to entry significantly
- Value props explain why build tools
- AI prompt allows freeform creation
- Empty state guides to action

**What Doesn't:**
- No guided walkthrough of IDE
- Template click goes straight to IDE (can be overwhelming)
- No "tour" or feature highlights
- No progressive disclosure of advanced features

**2026 Design Direction:**

*Reference: Notion's onboarding + Figma's interactive tutorial*

**Recommendations:**

1. **First Tool Flow (Interactive)**
   ```
   Step 1: Pick a starting point
           [Template] [AI Generate] [Blank Canvas]

   Step 2: (if template) Customize basics
           [Poll question: ___________]
           [Options: Yes, No, Maybe]

   Step 3: Tour the IDE
           Highlight: Canvas, Elements, Properties, Deploy
           "Next" button walks through each

   Step 4: Make one change
           "Try changing the poll question"
           Validates user made a change

   Step 5: Preview your tool
           "Click Preview to see it in action"
           User interacts with their own tool

   Step 6: Deploy!
           "Your tool is ready. Deploy to a space?"
   ```

2. **Contextual Tips**
   - First time opening element palette: "Drag elements here"
   - First time selecting element: "Configure in the panel"
   - First time using Cmd+K: "AI can help you build"
   - Tips dismissable, don't repeat

3. **Achievement Moments**
   - "First tool created!" badge
   - "First deployment!" celebration
   - "10 uses!" notification
   - Gamification without being annoying

4. **Help Always Available**
   - `?` key opens contextual help
   - "What can I do here?" at each stage
   - Video snippets for complex features

5. **Templates with Guidance**
   - "Guided" template variants
   - Step-by-step configuration with explanations
   - "Why this matters" for each field

---

### 14. Power User Builder

**Current Assessment:**
- Cmd+K for AI command palette
- IDE keyboard shortcuts mentioned but not documented in UI
- No visible undo/redo buttons (mentioned in IDE index)
- No duplication shortcut visible
- No versioning system
- Tools show in grid, can expand to see all

**What Works:**
- Cmd+K is discoverable for keyboard users
- IDE visual language signals "power tool"
- Mode toggle (Edit/Use) allows quick testing

**What Doesn't:**
- Keyboard shortcuts not discoverable
- No undo/redo visibility or keyboard hints
- Can't duplicate elements with Cmd+D
- No tool versioning or history
- No keyboard navigation within canvas

**2026 Design Direction:**

*Reference: Linear's keyboard-first design + Figma's version history*

**Recommendations:**

1. **Keyboard Shortcuts Panel**
   ```
   [Cmd+?] or [Cmd+/] opens:

   Navigation
   Tab / Shift+Tab     Move between elements
   Arrow keys          Nudge selected (1px)
   Shift+Arrow         Nudge (10px)

   Actions
   Cmd+D               Duplicate selected
   Cmd+Z               Undo
   Cmd+Shift+Z         Redo
   Backspace/Delete    Delete selected

   Canvas
   Space+Drag          Pan
   Cmd++ / Cmd+-       Zoom in/out
   Cmd+0               Zoom to fit

   Panels
   Cmd+1               Focus elements
   Cmd+2               Focus properties
   Cmd+K               AI commands
   ```

2. **Undo/Redo Stack**
   - Visible in header: [Undo] [Redo] with Cmd+Z/Cmd+Shift+Z hints
   - Click and hold to see history dropdown
   - "Revert to this point" option

3. **Version History**
   - Auto-save creates versions (every 5 minutes, or on significant change)
   - "Version history" in tool settings
   - Named versions: "Before demo", "After feedback"
   - Compare versions side-by-side

4. **Bulk Operations**
   - Cmd+A selects all elements
   - Shift+click for range select
   - Bulk actions: Align, distribute, delete, duplicate

5. **Tool Templates from Existing**
   - "Save as template" action
   - Share template with team
   - Template library includes personal templates

6. **Quick Switcher**
   - Cmd+O opens tool switcher
   - Search across all tools
   - Recently edited at top
   - Create new from switcher

---

### 15. Tool Consumer Experience

**Current Assessment:**
- `/s/[handle]/tools/[toolId]` renders deployed tool
- `ToolRuntimeProvider` provides context (space, member, temporal)
- `ToolCanvas` renders elements with runtime state
- Header shows: Tool name, description, "Live" indicator
- Full-screen option, back button

**What Works:**
- Clean consumption experience separate from building
- Context injection means tools adapt to user
- "Live" indicator shows tool is active
- Runtime state management handles interactions

**What Doesn't:**
- No way to provide feedback on tool
- Can't report issues with tool
- No "powered by HiveLab" attribution (for discoverability)
- No "similar tools" or recommendations
- Can't save/bookmark favorite tools

**2026 Design Direction:**

*Reference: iOS widget experience + Notion database views*

**Recommendations:**

1. **Tool Consumer Header**
   ```
   +------------------------------------------+
   | <- Back to Space                         |
   +------------------------------------------+
   | Meeting Poll                             |
   | by @space-leader | 142 uses              |
   +------------------------------------------+
   | [Tool Content]                           |
   |                                          |
   +------------------------------------------+
   | [Rate] [Report] [Share]     [Full screen]|
   +------------------------------------------+
   ```

2. **Feedback Integration**
   - 5-star quick rating after interaction
   - "Was this helpful?" binary feedback
   - "Report an issue" flows to space leader

3. **Tool Discovery**
   - "More tools from this space" carousel
   - "Similar tools on campus" section
   - "Tools you might like" personalization

4. **Tool Interactions**
   - Remember user's previous inputs
   - "Continue where you left off"
   - Notification when tool updates affect you

5. **Embedding Options**
   - Tools can embed in space posts
   - Tools can embed in profiles
   - Iframe embed code for external sites

6. **Accessibility**
   - All elements keyboard navigable
   - Screen reader announcements for state changes
   - High contrast mode support
   - Reduced motion respects prefers-reduced-motion

---

## Implementation Priorities

### Phase 1: Foundation (High Impact, Medium Effort)

1. **Connection Visualization** - Critical for understanding tool logic
2. **Keyboard Shortcuts Panel** - Unlocks power user velocity
3. **Undo/Redo Stack UI** - Basic expectation for any editor
4. **Element Preview Cards** - Reduces element palette overwhelm

### Phase 2: Polish (High Impact, Higher Effort)

5. **Template Preview in Gallery** - Increases template conversion
6. **First Tool Guided Flow** - Reduces new user drop-off
7. **Drag Preview + Snap Feedback** - Delightful building experience
8. **Analytics Insights Section** - Actionable data over vanity metrics

### Phase 3: Advanced (Differentiation)

9. **Inline Automation Builder** - Unique HiveLab capability
10. **Conversational AI Panel** - Next-gen building experience
11. **Version History** - Enterprise-grade confidence
12. **Multi-Space Deploy** - Operational efficiency

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| First tool completion rate | Unknown | >70% | % of new users who deploy a tool |
| Time to first tool | Unknown | <5 min | From lab entry to first deploy |
| Template usage rate | Unknown | >60% | % of tools starting from template |
| AI command usage | Unknown | >30% | % of sessions using Cmd+K |
| Return builder rate | Unknown | >40% | % of builders who create 2+ tools |
| Tool deployment rate | Unknown | >80% | % of created tools that get deployed |
| Consumer interaction rate | Unknown | >50% | % of tool views with interaction |

---

## Appendix: Reference Implementations

### Notion
- Block-based composition
- `/` command for quick add
- Drag blocks to reorder
- Templates with customization

### Figma
- Infinite canvas with zoom
- Smart guides for alignment
- Multi-select operations
- Component system

### Linear
- Keyboard-first navigation
- Command palette (Cmd+K)
- Minimal, focused UI
- Fast performance

### Retool
- Component library with previews
- Properties panel with sections
- Data binding visualization
- Query builder

### Zapier
- Trigger -> Action visual flow
- Step-by-step configuration
- Testing at each step
- Templates gallery

---

*Document maintained by HIVE Frontend Team. Last updated: February 2026.*
