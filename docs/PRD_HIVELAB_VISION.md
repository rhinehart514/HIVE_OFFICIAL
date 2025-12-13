# HiveLab Vision: Figma + Cursor

> **Core Vision**: A canvas-first visual builder where AI is an assistant, not the interface. Think Cursor for visual tools.

## The Reference: Cursor IDE

Cursor nailed AI-assisted creation:

| Cursor Pattern | HiveLab Equivalent |
|----------------|-------------------|
| Code editor always visible | Canvas always visible |
| Cmd+K = inline AI prompt | Cmd+K = inline element generation |
| Selection → AI acts on selection | Select elements → AI modifies them |
| Diff view before accepting | Preview before committing |
| Tab to accept suggestion | Click to accept, Esc to dismiss |
| Chat is secondary (Cmd+L) | Chat panel optional, collapsible |
| AI knows your codebase | AI knows your tool + elements |

**Key Insight**: In Cursor, you never start in a chat. You start in code, then invoke AI when needed. HiveLab should be the same - start on canvas, invoke AI when stuck.

---

## The Problem with Current Approach

The current HiveLab has two separate experiences:

| Flow | Component | UX Model |
|------|-----------|----------|
| Creation | `AILandingPageChat` | Chat-first, AI-driven |
| Editing | `HiveLabIDE` | Canvas-first, visual |

**Issue**: Users start with chat, but the *real* power is in the IDE. The chat creates a disconnect - users don't feel like *they* built the tool, the AI did.

---

## The New Vision: Canvas-First, AI-Assisted

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HiveLab                                      [Preview] [Deploy] [Save] │
├────────────┬────────────────────────────────────────────────┬───────────┤
│ ELEMENTS   │                                                │PROPERTIES │
│            │                                                │           │
│ ▼ Input    │          ┌──────────────────────┐              │ Search    │
│   □ Search │          │                      │              │ Input     │
│   □ Form   │          │     INFINITE         │              │───────────│
│   □ Date   │          │                      │              │ Label     │
│            │          │      CANVAS          │              │ [Find...] │
│ ▼ Display  │          │                      │              │           │
│   □ Chart  │          │   (Figma-style)      │              │ Placeholder│
│   □ List   │          │                      │              │ [Type...] │
│   □ Timer  │          │                      │              │           │
│            │          └──────────────────────┘              │ Width     │
│ ▼ Action   │                                                │ [240] px  │
│   □ Poll   │                                                │           │
│   □ Vote   │    ┌─────────────────────────────────────┐    │───────────│
│            │    │ ⌘K  Describe what you want...       │    │ CONNECTIONS│
│ ▼ Connected│    └─────────────────────────────────────┘    │           │
│   □ RSVP   │           (AI Command Palette)                │ outputs → │
│   □ Events │                                                │           │
├────────────┴────────────────────────────────────────────────┴───────────┤
│ LAYERS │ HISTORY │ CONSOLE                    Zoom: 100%  Grid: On     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Figma Feel
| Feature | Description |
|---------|-------------|
| Infinite Canvas | Zoom, pan, no boundaries |
| Direct Manipulation | Drag to move, corner to resize |
| Smart Guides | Snap alignment, spacing hints |
| Multi-select | Shift+click, marquee selection |
| Frame/Groups | Container elements |
| Auto-layout | Flex/grid for responsive tools |
| Layers Panel | Visibility, lock, z-order |
| Component Library | Reusable element groups |

### 2. IDE Feel
| Feature | Description |
|---------|-------------|
| Command Palette | Cmd+K for everything |
| Keyboard First | All actions via shortcuts |
| Properties Panel | Config without modals |
| Connection Ports | Visual data flow |
| History/Undo | Full undo tree |
| Console/Debug | See tool output |
| Version Control | Save versions, compare |

### 3. AI as Assistant (Not Interface)
| Feature | Description |
|---------|-------------|
| Cmd+K AI | "Add a poll with 5 options" |
| Selection Context | Select element → "Make this bigger" |
| Generate from Selection | "Create something like this" |
| Quick Actions | AI suggestions based on canvas |
| No Chat Window | AI responds in-place, not in sidebar |

---

## Implementation Phases

### Phase 1: Unify Entry Point (Week 1-2)
**Goal**: Single canvas-first experience

```typescript
// apps/hivelab/src/app/page.tsx
// Dashboard → New Tool → Opens IDE directly (no chat)

// apps/hivelab/src/app/[toolId]/page.tsx
// Same IDE for new and edit

// apps/hivelab/src/app/create/page.tsx
// REMOVE - redirect to IDE with blank canvas
```

**Changes**:
1. Remove `AILandingPageChat` as entry point
2. `Create Tool` → Opens `HiveLabIDE` with empty canvas
3. First-time UX: Onboarding overlay in canvas

### Phase 2: Canvas Polish (Week 2-3)
**Goal**: True Figma feel

| Task | Description |
|------|-------------|
| Smart Guides | Alignment lines when dragging |
| Snap to Objects | Snap to element edges/centers |
| Marquee Select | Click-drag box selection |
| Resize from Any Edge | Not just bottom-right |
| Canvas Zoom Gestures | Trackpad pinch, scroll+ctrl |
| Minimap | Canvas overview in corner |
| Keyboard Pan | Space+drag, arrow keys |
| Frame Element | Container with auto-layout |

### Phase 3: AI Command Palette (Week 3-4)
**Goal**: AI integrated into canvas, not separate

```
┌─────────────────────────────────────────────────────────────┐
│ ⌘K                                                          │
├─────────────────────────────────────────────────────────────┤
│ > Add a countdown timer to the top                          │
│                                                              │
│ ──────── Recent ────────                                    │
│ 📊 Add chart display                                         │
│ 📝 Create form with name and email                          │
│                                                              │
│ ──────── Suggestions ────────                                │
│ ⚡ Quick: Add poll element                                   │
│ 🎯 Connect: Link selected to...                             │
│ 🔄 Transform: Make this a group                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Behaviors**:
1. **No selection**: AI adds new elements to canvas
2. **With selection**: AI modifies selected element(s)
3. **Streaming**: Elements appear on canvas as generated
4. **Confirmation**: "I added 3 elements. Want to adjust?" → Yes/No toast

### Phase 4: Properties Panel 2.0 (Week 4-5)
**Goal**: Full config without modals

Current properties panel is basic. Enhance:

| Enhancement | Description |
|-------------|-------------|
| Tabbed Sections | Design / Data / Actions |
| Connection Manager | Visual port linking |
| Conditional Logic | Show/hide rules |
| Data Binding | Link to space data |
| Animations | Entry/exit motion |
| Responsive | Breakpoint configs |

### Phase 5: Collaboration (Future)
**Goal**: Real-time multiplayer editing

| Feature | Description |
|---------|-------------|
| Presence | See other cursors |
| Selection Sync | Who selected what |
| Conflict Resolution | Operational transforms |
| Comments | Click to comment |
| Version History | Time travel |

---

## Component Architecture

### Existing (Keep & Enhance)

```
packages/ui/src/components/hivelab/
├── ide/
│   ├── hivelab-ide.tsx         ✅ Main IDE shell
│   ├── ide-canvas.tsx          ✅ Canvas (needs polish)
│   ├── ide-toolbar.tsx         ✅ Top toolbar
│   ├── element-palette.tsx     ✅ Left panel elements
│   ├── layers-panel.tsx        ✅ Layers management
│   ├── properties-panel.tsx    ✅ Right panel (needs work)
│   ├── ai-command-palette.tsx  ✅ Cmd+K (needs enhancement)
│   └── components/             ✅ IDE primitives
│
├── element-renderers.tsx       ✅ 27 element renderers
├── StreamingCanvasView.tsx     ❌ Chat-specific, repurpose
└── tool-canvas.tsx             ❌ Duplicate, remove
```

### New Components Needed

```
packages/ui/src/components/hivelab/
├── ide/
│   ├── smart-guides.tsx        🆕 Alignment/spacing guides
│   ├── canvas-minimap.tsx      🆕 Overview navigation
│   ├── selection-box.tsx       🆕 Marquee selection
│   ├── element-frame.tsx       🆕 Container/group element
│   ├── connection-editor.tsx   🆕 Visual data flow
│   ├── history-panel.tsx       🆕 Undo tree
│   └── console-panel.tsx       🆕 Debug output
```

---

## Key Files to Change

### Remove (Chat-First Approach)
```
apps/hivelab/src/app/create/page.tsx → Redirect to IDE
packages/ui/src/pages/hivelab/AILandingPageChat.tsx → Deprecate
```

### Enhance (IDE Components)
```
packages/ui/src/components/hivelab/ide/hivelab-ide.tsx
packages/ui/src/components/hivelab/ide/ide-canvas.tsx
packages/ui/src/components/hivelab/ide/properties-panel.tsx
packages/ui/src/components/hivelab/ide/ai-command-palette.tsx
```

### Routes
```
/                   → Dashboard (list tools)
/create            → Redirect to /new
/new               → IDE with blank canvas
/[toolId]          → IDE with tool loaded
/[toolId]/preview  → Full-screen preview
/[toolId]/deploy   → Deploy flow
/[toolId]/analytics→ Usage analytics
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to first element | ~30s (chat + generate) | <5s (drag & drop) |
| User feels ownership | Low (AI built it) | High (I built it) |
| Canvas usage | 0% (chat-only) | 100% |
| Power user shortcuts | None | All actions |

---

## Comparison: Current vs. Vision

| Aspect | Current (Chat-First) | Vision (Canvas-First) |
|--------|---------------------|----------------------|
| Entry | Chat with examples | Empty canvas with onboarding |
| Creation | Describe → Wait → Get | Drag → Drop → Configure |
| AI Role | Primary interface | Assistant (Cmd+K) |
| Feel | "AI built this" | "I built this with AI help" |
| Power Users | Frustrated by chat | Keyboard shortcuts, speed |
| Beginners | Comfortable | Onboarding overlay |

---

## Immediate Next Steps

1. **Route Consolidation** (1 day)
   - Make `/create` redirect to IDE with blank canvas
   - Remove chat-first flow from HiveLab app

2. **Canvas Polish** (3 days)
   - Smart guides on drag
   - Snap to grid + objects
   - Better resize handles

3. **AI Command Palette Enhancement** (2 days)
   - Selection-aware prompts
   - Streaming to canvas (not preview panel)
   - Quick suggestions

4. **First-Time UX** (1 day)
   - Canvas onboarding overlay
   - "Try dragging a poll element"
   - Cmd+K tutorial

---

## Summary

**Current State**: Chat-driven tool builder where AI is the interface.

**Vision**: Figma-like canvas builder where AI is a power feature accessed via Cmd+K.

**Philosophy Shift**:
- From: "Tell AI what you want"
- To: "Build visually, ask AI for help"

The IDE components already exist. We just need to:
1. Make them the primary experience
2. Polish the canvas interactions
3. Enhance the AI command palette
4. Remove the chat-first flow
