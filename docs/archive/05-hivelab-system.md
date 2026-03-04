# 05 - HiveLab System (Tools & Creation)

The system that answers: "How do students get useful things into their spaces without becoming developers?"

Covers tool creation (4 flows), the element system, capability governance, AI generation, templates, inline editing, cross-system integration, and the progressive disclosure architecture that makes a 27-element IDE accessible to students who just want a poll.

**Decision filter:** Does this help a student get something useful into their space in under 60 seconds?

**Core insight:** HiveLab is the most powerful feature in HIVE and the most confusing. The capability is right -- the framing is wrong. 80% of students will never know HiveLab exists. They'll use polls, RSVPs, and countdowns as if they were native features. 15% will browse templates and deploy one. 4% will describe what they want to AI. 1% will open the IDE. The system must serve all four levels without forcing anyone up a level they don't need.

---

## Existing Code Assessment

### What Ships (Ready or Near-Ready)

| Component | Location | Status |
|-----------|----------|--------|
| Element registry (27 elements) | `packages/core/src/domain/hivelab/element-registry.ts` | **Ships.** Full specs with actions, inputs, outputs, useCases, defaultSize, stateful/realtime flags. |
| Capability governance (3 lanes + budgets) | `packages/core/src/domain/hivelab/capabilities.ts` | **Ships.** 833 lines. SAFE/SCOPED/POWER presets, budget enforcement, trust tiers, placement validation, object capabilities. |
| Quick templates (29 templates) | `packages/ui/src/lib/hivelab/quick-templates.ts` | **Ships.** 21 simple (1-2 elements), 8 app-tier (4+ elements with connections). TemplateComplexity and TemplateCategory types. |
| System tool templates (11 tools) | `packages/core/src/domain/hivelab/system-tool-templates.ts` | **Ships.** Auto-deploy by space type via 5 universal sidebar templates. |
| AI generation pipeline | `apps/web/src/lib/firebase-ai-generator.ts` | **Ships.** Gemini 2.0 Flash, structured output with Zod validation, quality pipeline, streaming chunks. |
| Tool composition types | `packages/core/src/domain/hivelab/tool-composition.types.ts` | **Ships.** Element, connection, layout, composition types. |
| IDE canvas + editor | `packages/ui/src/components/hivelab/` (80+ files) | **Ships.** Canvas, element palette, layers panel, properties inspector, AI command palette, toolbar, minimap, smart guides, DnD studio. |
| Tool state manager | `packages/ui/src/lib/hivelab/tool-state-manager.ts` | **Ships.** |
| Element rendering system | `packages/ui/src/components/hivelab/elements/` | **Ships.** Interactive (6), universal (10), connected (6), space (varies), core elements. |
| DAG utilities | `packages/ui/src/lib/hivelab/dag-utils.ts` | **Ships.** Connection validation, topological sort. |
| Automation types | `packages/core/src/domain/hivelab/tool-automation.types.ts` | **Ships.** Trigger/action/condition definitions. |
| Connection types | `packages/core/src/domain/hivelab/tool-connection.types.ts` | **Ships.** Port definitions, data flow types. |
| Tool API routes (41 files) | `apps/web/src/app/api/tools/` | **Ships.** CRUD, generate, deploy, execute, browse, search, publish, install, review, feed-integration, usage-stats, recommendations, migrate, capabilities, event-system, state, analytics, share, audit, runs, versions, connections, automations. |
| Lab pages (15 routes) | `apps/web/src/app/lab/` | **Ships with changes.** Dashboard, [toolId] IDE, edit, preview, deploy, run, runs, analytics, settings, templates, create, new, setups. |
| Streaming canvas view | `packages/ui/src/components/hivelab/StreamingCanvasView.tsx` | **Ships.** Real-time AI generation visualization. |
| Deploy wizard | `packages/ui/src/components/hivelab/SetupDashboard/DeployWizard.tsx` | **Ships with changes.** Needs "Go Live" rename and simplified flow. |
| Automation templates | `packages/core/src/domain/hivelab/automation-templates.ts` | **Ships.** Pre-built automation patterns. |
| Tool theme types | `packages/core/src/domain/hivelab/tool-theme.types.ts` | **Ships.** |
| Community templates repo | `packages/core/src/domain/hivelab/templates/` | **Ships.** Firebase repository for published templates. |
| Context interpolation | `packages/core/src/domain/hivelab/context-interpolation.ts` | **Ships.** Space/user context injection. |
| Element ports | `packages/core/src/domain/hivelab/element-ports.ts` | **Ships.** Input/output port definitions. |
| Element capabilities | `packages/core/src/domain/hivelab/element-capabilities.ts` | **Ships.** Per-element capability requirements. |

### What Changes

| Component | Change Required |
|-----------|----------------|
| Lab dashboard (`/lab/page.tsx`) | Reframe from "Welcome to your Lab" to "What does your group need?" with visual outcome tiles. Rename route to `/tools`. |
| Deploy flow | Rename "Deploy" to "Go Live" everywhere. Simplify to space picker + auto-surface selection. |
| Element palette | Rename "Elements" to "Blocks" in IDE. Recategorize from developer taxonomy to need-oriented categories. |
| Template gallery | Add live visual previews. Organize by need ("For your next event") not by category. |
| AI prompt | Change placeholder from "Name your tool..." to "Try: 'poll for meeting times' or 'event countdown'". Add suggestion chips. |
| Navigation | Rename "Lab" to "Tools" in nav. |
| Start Zone | Only show in Power Builder flow. Other flows bypass IDE entirely. |
| Canvas label | Rename "Canvas" to "Editor" in UI copy (avoid LMS confusion with Canvas by Instructure). |

### What's New (Build)

| Component | Location | Purpose |
|-----------|----------|---------|
| `InlineToolCreator` | `apps/web/src/components/spaces/InlineToolCreator.tsx` | 2-step inline creation in space chat/feed. Flow 1. |
| `ToolTypeMenu` | `apps/web/src/components/spaces/ToolTypeMenu.tsx` | Categorized "+" menu for space tool picker. |
| `FocusedToolEditor` | `apps/web/src/components/hivelab/FocusedToolEditor.tsx` | Template + AI creation edit form. Layer 2 editor. The missing middle ground. |
| `ToolLivePreview` | `packages/ui/src/components/hivelab/ToolLivePreview.tsx` | Rendered preview with sample data and space name. |
| `GoLiveButton` | `packages/ui/src/components/hivelab/GoLiveButton.tsx` | Replaces deploy button + modal with simplified space picker. |
| `/api/tools/instant-create` | `apps/web/src/app/api/tools/instant-create/route.ts` | Inline creation: type + context = live tool. |
| `/api/tools/from-template` | `apps/web/src/app/api/tools/from-template/route.ts` | Template creation: templateId + config + spaceId = live tool. |
| `/api/tools/ai-create` | `apps/web/src/app/api/tools/ai-create/route.ts` | AI creation: prompt + context = streamed composition. |
| `/api/tools/[toolId]/go-live` | `apps/web/src/app/api/tools/[toolId]/go-live/route.ts` | Simplified deployment with auto-surface. |
| `/api/tools/[toolId]/inline-edit` | `apps/web/src/app/api/tools/[toolId]/inline-edit/route.ts` | Edit a live tool's config without IDE. |

---

## 1. System Identity & Naming

### The Naming Problem

"HiveLab" sounds like a science department. "Lab" implies experimentation, coding, technical skill. Every UB student uses Canvas (the LMS) daily -- "Canvas" in our IDE creates direct confusion. "Deploy" is military/DevOps vocabulary. "Elements" is developer language. The naming actively excludes the 95% of students who are not builders.

### Naming Decisions

| Current Term | New Term | Scope | Why |
|---|---|---|---|
| **HiveLab** | **Tools** (in nav, UI copy) | User-facing everywhere | Students say "I need a tool for this." One word, zero explanation. |
| **HiveLab IDE** | **HiveLab** (brand name, power users only) | Only in IDE context, never in nav | Keep as internal brand for builders. Never expose to consumers/customizers. |
| **Elements** | **Blocks** | IDE element palette | Notion proved "blocks" works for non-developers. |
| **Deploy** | **Go Live** / **Add to [space]** | All deployment UI | "Add this to Photography Club" is instantly clear. |
| **Canvas** | **Editor** | IDE canvas area | Avoids Canvas LMS confusion. |
| **Composition** | **Layout** (if surfaced) | Internal only; never show to students | Pure engineering jargon. |
| **Automations** | **Auto-actions** or sentence-based UI | All automation surfaces | "When someone RSVPs, notify the group leader" not "automation trigger." |
| **Connections** (tool-to-tool) | Hidden entirely | Internal only | Students don't need to know data flows. It should just work. |
| **Setups** | **Kits** | If surfaced to customizers | "Event Kit" (RSVP + Countdown + Check-in) is self-explanatory. |
| **Surface** (sidebar/inline) | **Where it shows up** | Deploy flow | "Show in sidebar" vs "Show in the main page." |
| **Element Palette** | **Add a block** / **+ button** | IDE | A palette is for painters. Students add things. |
| **Config / Configuration** | **Settings** / **Customize** | All surfaces | Universal comprehension. |

### Language Tone

| Context | Current | Target |
|---------|---------|--------|
| Lab landing | "Welcome to your Lab" | "What does your group need?" |
| Lab description | "Build tools your space will actually use" | "Polls, sign-ups, countdowns -- ready in seconds" |
| AI prompt placeholder | "Name your tool to get started..." | "Try: 'poll for meeting times' or 'event countdown'" |
| Deploy button | "Deploy" | "Go Live" |
| Post-deploy | "Tool deployed successfully" | "Live in [Space Name]!" |

### What to Call Things Per Audience

| Audience | What they experience | Language they hear |
|----------|---------------------|-------------------|
| Consumer (80%) | Polls, RSVPs, countdowns in space sidebars | Nothing. "The poll." "The RSVP." No system vocabulary. |
| Customizer (15%) | Template gallery, one-click deploy | "Templates" or "Apps." "Add an app to your space." |
| Creator (4%) | AI generation, focused editor | "Create" or "Build." "Create with AI." "Your tools." |
| Builder (1%) | Full IDE with blocks, connections, automations | "HiveLab IDE." "Blocks." "Compositions." System vocabulary. |

### Cardinal Rule

Never use builder language for consumers. Never say "HiveLab element composition" to a club president. Never show "DAG" to a freshman. If a consumer ever says "I used HiveLab today," the abstraction leaked.

---

## 2. Capabilities Architecture

### The Three Lanes

Every tool operates in one of three capability lanes. The lane determines what the tool can do at runtime and is enforced server-side.

**Lane 1: Safe (default)**
- Read/write own state (always allowed, cannot be disabled)
- Write shared state (for polls, RSVPs -- visible to all users)
- Zero platform side effects
- No access to space context or member data
- Use case: polls, countdowns, counters, timers, announcements, forms

**Lane 2: Scoped (leader/builder approved)**
- Everything in Safe, plus:
- Read space context (memberCount, spaceId, category)
- Read space member list (for @mentions, attendance, member selectors)
- Use case: attendance trackers, member directories, role-gated content, leaderboards that show member names

**Lane 3: Power (explicitly gated)**
- Everything in Scoped, plus:
- Create posts in space feed
- Send in-app/push notifications to space members
- Trigger space automations
- Object read/write access (with type-specific grants)
- Budget-limited: 3 notifications/day, 10 posts/day, 50 automations/day, 60 executions/user/hour
- Use case: automated announcements, attendance warnings, event reminders, complex multi-tool workflows

### Existing Implementation

```typescript
// packages/core/src/domain/hivelab/capabilities.ts

interface ToolCapabilities {
  // Lane 1 (Safe) - Always allowed
  read_own_state: true;
  write_own_state: true;

  // Lane 2 (Scoped) - Leader/Builder approved
  read_space_context?: boolean;
  read_space_members?: boolean;
  write_shared_state?: boolean;

  // Lane 3 (Power) - Explicitly gated
  create_posts?: boolean;
  send_notifications?: boolean;
  trigger_automations?: boolean;

  // Lane 4 (Objects) - Type-specific access control
  objects_read?: boolean | string[];
  objects_write?: boolean | string[];
  objects_delete?: boolean | string[];
}
```

### Trust Tiers

Trust determines what capabilities can be granted:

| Tier | Who | Max Lane | Object Access |
|------|-----|----------|---------------|
| `unverified` | New student-created tools | Safe | None |
| `community` | Tools with 5+ deployments, positive reviews | Scoped | Specific type IDs only |
| `verified` | Admin-reviewed or system-verified tools | Power | Wildcard access |
| `system` | HIVE-built system tools | Power | Wildcard access |

### Budget Enforcement

Power lane tools have server-enforced daily/hourly limits:

```
Firestore structure:
/budget_usage/{deploymentId}_{YYYY-MM-DD}
  - notificationsSent: number
  - postsCreated: number
  - automationsTriggered: number

/budget_usage_hourly/{deploymentId}_{userId}_{YYYY-MM-DD-HH}
  - count: number
```

Budget checks happen BEFORE execution. Budget recording happens AFTER successful execution. Both are server-only operations.

### Deployment Governance

Each deployed tool has a governance status:

| Status | Meaning |
|--------|---------|
| `active` | Normal operation |
| `paused` | Temporarily stopped by space leader |
| `disabled` | Kill-switched by leader or admin |
| `quarantined` | Flagged for review (budget exceeded, reports filed) |
| `experimental` | Opt-in only, not auto-promoted in recommendations |

### Surface Modes

Tools render in one of two surface modes:

- **Widget** (default): Renders in space sidebar. Compact layout.
- **App**: Renders full-screen at `/spaces/[spaceId]/apps/[deploymentId]`. For complex multi-element tools that need more space.

App-specific config:
```typescript
interface AppConfig {
  layout: 'full' | 'centered' | 'sidebar';
  showWidgetWhenActive: boolean;
  breadcrumbLabel?: string;
}
```

### Placement Validation

Before a tool is placed in a space, `validatePlacementCapabilities()` checks:
1. Is the tool's required lane allowed by the space's governance config?
2. Are there Power lane warnings to surface to the leader? (e.g., "This tool can send notifications to space members")
3. Does the space require approval for Power tools?

### How Students Experience Capabilities (Not Technical Language)

| What students see | What's happening |
|---|---|
| A poll in the sidebar | Safe lane tool with write_shared_state |
| "This tool can see who's in your space" | Scoped lane requesting read_space_members |
| "This tool can send your members notifications (up to 3/day)" | Power lane with budget display |
| Tool grayed out: "Needs leader approval" | Power lane + space governance requireApprovalForPower |

---

## 3. User Flows (Four Levels)

### Flow Summary

| Flow | Who | Steps | Decisions | Time to Live | Concepts | Target Completion |
|------|-----|-------|-----------|-------------|----------|-------------------|
| Inline | Any member | 2 | 1 | < 15s | 0 | 95% |
| Template | Space leaders | 3 | 3-5 | < 30s | 1 | 85% |
| AI Creation | Leaders/ambitious students | 3-4 | 2-3 | < 60s | 1 | 75% |
| Power Builder | Power users | 5-8 | 10+ | 2-15 min | 4+ | 60% |

**Current state (all users): 6+ steps, 10+ decisions, 3-10 min, 4+ concepts, ~40% estimated completion.**

### Flow 1: Inline Creation (Consumer Path)

**Who:** Any space member.
**When:** Student needs a standard tool in a space they belong to.
**Where it starts:** Space chat, space "+" menu, event creation, or command palette.
**Cognitive concepts required:** 0 new concepts. Text input or menu selection.

#### How It Works

1. Student types "I need a poll about meeting times" in space chat, or taps "+" and selects "Poll" from a categorized menu
2. AI generates the poll inline with smart defaults (title, options inferred from context, space name pre-filled)
3. Student sees a live preview card inline -- the poll is already functional
4. Student taps "Go Live" or just sends it

#### Technical Flow

```
Space chat input OR "+" menu
  -> POST /api/tools/instant-create { type: 'poll', context: spaceId, prompt? }
  -> Server: AI generates config from prompt + space context
  -> Server: creates tool record + auto-attaches to space
  -> Client: renders inline preview (same component used in space feed)
  -> Student confirms or edits inline
  -> Tool is live in the space feed/sidebar
```

#### Entry Points

| Entry Point | Action | Result |
|-------------|--------|--------|
| Space chat | Type "create a poll about..." or "/poll" | Inline tool card appears |
| Space "+" button | Select tool type from categorized menu | Inline config card |
| Event creation form | "Add poll" or "Add RSVP" button | Embedded tool element |
| Command palette (Cmd+K) | "New poll in [space]" | Inline tool card |

#### Supported Tool Types (Inline)

Only tools with simple configuration qualify for inline creation:

| Tool Type | Fields to Configure | Smart Defaults |
|-----------|-------------------|----------------|
| Poll | Question, 2-6 options | Inferred from prompt or generic |
| RSVP | Event name, max attendees | Pulled from event if in event context |
| Countdown | Target date, title | Event date if in event context |
| Counter | Label, starting value | 0, from prompt |
| Announcement | Content, pin status | Unpinned, from prompt |

#### API Contract

```typescript
// POST /api/tools/instant-create
// Request
{
  type: 'poll' | 'rsvp' | 'countdown' | 'counter' | 'announcement';
  spaceId: string;
  prompt?: string; // Natural language description
  config?: Record<string, unknown>; // Override smart defaults
}

// Response
{
  toolId: string;
  deploymentId: string;
  preview: ToolComposition; // For inline rendering
  surface: 'feed' | 'sidebar'; // Auto-selected
}
```

#### Acceptance Criteria

- [ ] Tool is live in < 15 seconds from trigger to visible in space
- [ ] Zero navigation away from the space context
- [ ] AI smart defaults feel right 80%+ of the time (measurable via edit-after-create rate)
- [ ] Mobile: single-column inline creation works in bottom sheet
- [ ] No "Deploy" language anywhere in this flow
- [ ] Space permission check: only members can create inline tools (verified by session campusId + spaceId membership)

---

### Flow 2: Template Creation (Customizer Path)

**Who:** Space leaders who want a specific tool with light customization.
**When:** Student knows roughly what they want and wants to customize before going live.
**Where it starts:** Space leader dashboard, space settings, or `/tools` with template intent.
**Cognitive concepts required:** 1 (templates as starting points).

#### How It Works

1. Student opens template picker from space leader view or `/tools`
2. Templates shown with LIVE PREVIEWS -- actual rendered tools with sample data and the student's space name already populated
3. Student picks one. It opens in the **Focused Editor** (not the full IDE) -- a single-screen form showing exactly what can be customized
4. Student edits title, options, colors, or whatever the template exposes (3-8 fields, never more)
5. Student selects which space to add it to (pre-selected if they came from a space)
6. Taps "Go Live" -- tool appears in the space

#### The Focused Editor (Layer 2)

The Focused Editor is NOT the current IDE. It is a purpose-built single-page form:

- Left side (or top on mobile): live preview of the tool as it will appear to users
- Right side (or bottom on mobile): editable fields this template exposes
- Only the fields this template exposes (3-8 fields, never more)
- "Go Live" button with space selector
- "Open in HiveLab" link for power users who want the full IDE

No canvas. No block palette. No layers panel. No connection wires.

#### Template Categories (Need-Oriented)

| Category | Templates | Student Question |
|----------|-----------|-----------------|
| Engage | Poll, Quiz, Reaction Board, Photo Challenge, Suggestion Box | "I want to collect opinions" |
| Events | RSVP, Countdown, Schedule Picker, Event Series Hub | "I'm planning an event" |
| Organize | Sign-up Sheet, Task Board, Roster, Resource Signup, Study Group Matcher | "I need to organize people/things" |
| Track | Leaderboard, Progress Bar, Counter, Attendance Tracker, Competition Tracker | "I want to track something" |
| Communicate | Announcement Board, FAQ, Resource Hub, Quick Links, Weekly Update | "I need to share information" |

Each category answers a student question. Not "input elements" vs "action elements" -- "I want to collect opinions" vs "I'm planning an event."

#### API Contract

```typescript
// POST /api/tools/from-template
// Request
{
  templateId: string; // Quick template ID or community template ID
  config: Record<string, unknown>; // Template-specific config overrides
  targetSpaceId: string;
  name?: string; // Override default template name
}

// Response
{
  toolId: string;
  deploymentId: string;
  spaceId: string;
  surface: 'feed' | 'sidebar' | 'page'; // Auto-selected by tool type
}
```

#### Acceptance Criteria

- [ ] Template picker shows live visual previews, not text descriptions with icons
- [ ] Focused Editor shows only template-exposed fields (3-8 max)
- [ ] Live preview updates as student edits fields
- [ ] "Go Live" completes in < 2 seconds
- [ ] Space pre-selected when entering from space context
- [ ] Template categories are need-oriented, not developer-taxonomy
- [ ] Mobile: bottom sheet template picker, full-screen focused editor

---

### Flow 3: AI Creation (Creator Path)

**Who:** Space leaders or ambitious students who have an idea but no specific template.
**When:** Student has a clear description of what they want but needs AI to build it.
**Where it starts:** Space leader dashboard, command palette, or `/tools`.
**Cognitive concepts required:** 1 (describing what you want to AI).

#### How It Works

1. Student types a natural language description: "I need a tool where members can vote on weekly meeting times and see results in real-time"
2. AI generates the tool with streaming preview -- student watches it being built element by element
3. Student sees a LIVE INTERACTIVE PREVIEW of the generated tool
4. Student can:
   - "Looks good" --> go live
   - "Change the colors" or "Add a deadline" --> AI iterates
   - Switch to focused editor for manual tweaks
5. Select space and go live

#### Technical Flow

```
AI prompt input (space view, /tools, or Cmd+K)
  -> POST /api/tools/ai-create { prompt, spaceContext? }
  -> Server: Gemini 2.0 Flash generates tool composition (streamed)
  -> Client: StreamingCanvasView shows tool being built
  -> Student reviews live preview
  -> Iterative refinement via conversational follow-ups
  -> POST /api/tools/[toolId]/go-live { targetSpaceId }
  -> Tool is live
```

#### Existing AI Pipeline

The AI generation pipeline is already built and ships:

- **Model:** Gemini 2.0 Flash via `firebase-ai-generator.ts`
- **Structured output:** Zod schema validation ensures generated compositions are valid
- **Quality pipeline:** Validation checks, auto-fixes for common issues, quality scoring, tracking
- **Prompt enhancement:** RAG with learned patterns from successful tools
- **Streaming:** Chunks stream to `StreamingCanvasView` for real-time build animation
- **Retry logic:** Mock generator fallback if AI fails
- **Cost:** ~$0.002 per generation request, ~$6/month at 5K students

#### Conversation Patterns

| Student Says | AI Does |
|-------------|---------|
| "Make a poll for meeting times" | Generates poll with time-slot options |
| "Add a deadline" | Adds countdown timer connected to poll close |
| "Make it anonymous" | Changes poll config to anonymous voting |
| "Looks good, send it to [space]" | Attaches to space, goes live |
| "I want to customize more" | Opens focused editor or full IDE |

#### API Contract

```typescript
// POST /api/tools/ai-create
// Request
{
  prompt: string;
  spaceId?: string; // Context for smart defaults
  iterateFrom?: string; // toolId to modify
}

// Response (streamed)
{
  toolId: string;
  composition: ToolComposition; // Streamed incrementally
  suggestions: string[]; // "Add a deadline?", "Make it anonymous?"
  qualityScore: number; // 0-100
}
```

#### Acceptance Criteria

- [ ] Streaming preview shows tool being built element-by-element (not blank then complete)
- [ ] First element visible in < 2 seconds after prompt submission
- [ ] Iterative refinement works conversationally (at least 3 follow-up turns)
- [ ] Quality score > 70 for 80% of generations (tracked via quality pipeline)
- [ ] "Open in HiveLab" escape hatch always available
- [ ] Suggestion chips appear after generation ("Add a deadline?", "Make it anonymous?")
- [ ] AI prompt placeholder shows examples, not a blank "Name your tool"

---

### Flow 4: Power Builder (Builder Path)

**Who:** Students who want full creative control. Repeat tool creators. CS/design students.
**When:** Building complex multi-element tools, custom apps, or tools with automations.
**Where it starts:** `/tools` explicitly, with intent to build from scratch.
**Cognitive concepts required:** 4+ (editor/canvas, blocks/elements, connections, automations).

#### How It Works

1. Student navigates to `/tools` intentionally
2. Starts from blank editor, template, or AI generation
3. Full IDE: block palette (27 elements), editor canvas, properties panel, layers, connections, AI command palette
4. Build, preview, iterate
5. "Go Live" with simplified space selection

#### What the IDE Contains (Existing, Ships)

| Component | File | Purpose |
|-----------|------|---------|
| Canvas + minimap | `canvas-minimap.tsx` | Spatial element layout with bird's-eye navigation |
| Block palette | `element-palette.tsx` + `element-belt.tsx` | Browse and drag 27 elements (renamed from "Element Palette") |
| Layers panel | `layers-panel.tsx` | Z-order management, visibility toggles |
| Properties inspector | `contextual-inspector.tsx` | Per-element config editing |
| AI command palette | `ai-command-palette.tsx` | In-IDE AI assistance (Cmd+K within editor) |
| Toolbar | `ide-toolbar.tsx` + `command-bar.tsx` | Undo/redo, zoom, grid, view modes |
| Start Zone | `start-zone.tsx` | Entry choice (blank/template/AI) -- only in Power flow |
| Template gallery | `template-gallery.tsx` | Browse quick + community templates |
| Smart guides | `smart-guides.tsx` | Alignment assistance during drag |
| Ghost elements | `ghost-element.tsx` | Drag preview placeholders |
| DnD studio | `studio/` | Drag-and-drop framework |
| Streaming view | `StreamingCanvasView.tsx` | AI generation real-time visualization |
| Automations panel | `automations-panel.tsx` | Trigger-action automation builder |
| Surfaces config | `surfaces/` | Embedded + compact render modes |

#### What Changes from Current

| Current | New |
|---------|-----|
| "Deploy" button + modal | "Go Live" button + inline space picker |
| Deploy modal with permissions, surface, privacy | Auto-sensible defaults; advanced settings behind "More options" |
| Must navigate to /lab to start | Can start from anywhere; /tools is for power users |
| IDE is the only creation path | IDE is one of four creation paths |
| Start Zone shows for all users | Start Zone only in Power Builder; other flows bypass it |
| "Elements" terminology | "Blocks" in palette UI |
| "Canvas" terminology | "Editor" in UI copy |

#### Acceptance Criteria

- [ ] IDE loads in < 2s with skeleton states for panels
- [ ] All 27 blocks available with search/filter
- [ ] Block palette uses need-oriented categories (see Section 10)
- [ ] "Go Live" replaces "Deploy" with auto-surface defaults
- [ ] Preview mode shows tool exactly as space members will see it
- [ ] AI command palette (Cmd+K in IDE) generates and modifies elements
- [ ] Undo/redo for all canvas operations

---

## 4. Entry Points & Discovery

### How Students Find Tools (Frequency-Ordered)

| Path | Frequency | Description | Conversion Target |
|------|-----------|-------------|-------------------|
| Inside a space sidebar | 70% | Student uses deployed tools as native features. Polls, RSVPs, countdowns. | Consumer stays consumer. No conversion needed. |
| In chat / inline | 15% | Leader drops inline poll/RSVP/countdown into chat. Members interact in-flow. | Member discovers "+" button for inline tool insertion. |
| From another student | 8% | "How did you make that?" Social proof from seeing a custom tool. | Customizer -> Creator via AI generation bridge. |
| From an event | 4% | Check-in tool at physical event. Post-event feedback form. | Event organizer discovers templates. |
| From search / browse | 2% | Intentional visit to template gallery or `/tools`. | Already a creator or builder. |
| From AI suggestion | 1% | "Your club has an event but no RSVP. Add one?" | Zero-friction conversion. |

### Entry Points Map

Every place a student can BEGIN creating a tool:

| Entry Point | Available Flows | Default Flow |
|-------------|----------------|--------------|
| Space chat (type or "/poll") | Inline | Inline |
| Space "+" button | Inline, Template | Inline for known types, Template for browse |
| Space leader dashboard | Template, AI Creation | Template |
| Event creation form | Inline (RSVP, Countdown) | Inline |
| Space settings > "Manage tools" | Template, AI Creation | Template |
| Command palette (Cmd+K) | Inline, AI Creation | Infers from query |
| `/tools` (direct navigation) | Template, AI Creation, Power | Power |
| Fork existing tool | Template (pre-filled) | Template |
| Empty sidebar state | Inline, Template | Template |
| Search results ("no polls found") | Inline, Template | Inline |

### System Tools Auto-Deploy (Existing, Ships)

The Trojan horse. Every space has working tools from day one without anyone "creating" anything.

11 system tools auto-deploy by space type via 5 universal sidebar templates:

| System Tool | ID | Element Type | Category |
|-------------|-----|-------------|----------|
| About | `system:about` | space-stats | essential |
| Upcoming Events | `system:events` | space-events | essential |
| Members | `system:members` | member-list | essential |
| Tools | `system:tools` | tool-list | essential |
| Quick Poll | `system:poll` | poll | engagement |
| Countdown | `system:countdown` | countdown | engagement |
| Quick Links | `system:links` | link-list | info |
| Announcements | `system:announcements` | announcement | info |
| Leaderboard | `system:leaderboard` | leaderboard | engagement |
| Availability | `system:availability` | availability-heatmap | info |

### Universal Sidebar Templates (Auto-Selected by Space Category)

| Template | Default? | Target Categories | Included System Tools |
|----------|----------|-------------------|-----------------------|
| `universal-default` | Yes | All | About, Events, Members, Tools, Poll |
| `academic` | No | Academic spaces | About, Events, Members, Quick Links |
| `social` | No | Social, Greek | About, Events, Members, Poll, Leaderboard |
| `professional` | No | Career, Professional | About, Events, Members, Quick Links |
| `interest` | No | Hobby, Interest | About, Events, Members, Poll |

`getTemplateForCategory()` maps space category to the best-fit sidebar template. If no match, falls back to `universal-default`.

### The "Oh, I Can Make That?" Moment

The single most important conversion event. The moment a consumer/customizer realizes tools aren't built-in features -- they were CREATED by other students.

**What triggers it:**
1. Watching a leader deploy a template in 15 seconds (most common)
2. A template gap: "The attendance tracker is great but I need it to also track X"
3. Social proof: "Marcus built this tracker that 8 other clubs use"
4. A role change: becoming a space leader creates new operational needs

**What the CTA should be:**
- Wrong: "Build your own tool in HiveLab!" (too technical)
- Wrong: "Try our no-code IDE!" (IDE = builder language)
- Right: "Need something for your space? Pick a template or describe what you want."
- Right: "12 other clubs use this. Want to add it to yours?"

### Missing Entry Points to Build

| Missing Entry Point | Where It Should Be | Why |
|---|---|---|
| "Add a Poll / RSVP / Countdown" in space sidebar | Space sidebar, prominent button | Students don't want to "build a tool." They want to add a poll. |
| "Add countdown / RSVP" in event creation | Event creation form | Natural moment to add event-linked tools. |
| Empty sidebar state with template suggestions | Space sidebar when no custom tools deployed | "Your sidebar is empty. Add a poll, countdown, or sign-up sheet." |
| Contextual AI prompts | In-space, based on detected opportunities | "Photography Club has an event next week but no RSVP. Add one?" |
| Post-event creation success screen | After creating an event | "Want to add a countdown to this event?" One-click setup. |

---

## 5. The Inline Editor (Layer 2)

### The Problem It Solves

The current system has no middle ground between templates and the full IDE. Students go from "pick a template" to "full visual IDE with canvas, block palette, properties panel, and connection wires." This is the single biggest cognitive cliff in HiveLab.

90% of students who pick a template and want to make one small change (edit the poll question) are dumped into a development environment.

### Current Cognitive Load

```
Layer 1: Templates (pick and deploy) --> EXISTS
Layer 2: Inline editing (click to edit, add a block) --> MISSING
Layer 3: Full IDE (canvas, blocks, connections, automations) --> EXISTS
```

### What the Focused Editor Is

A single-screen experience that shows the tool as it will appear to users, with inline editing.

**Layout:**
- Desktop: 60/40 split. Left = live preview. Right = editable fields.
- Mobile: stacked. Top = live preview. Bottom = field form in bottom sheet.

**What it shows:**
- The tool rendered exactly as it appears in a space sidebar or feed
- Click on any text to edit it inline (poll question, countdown title, announcement text)
- "Add a block" button shows the 8 most common blocks with plain descriptions
- Each configurable field as a labeled input
- "Go Live" button with space selector

**What it hides:**
- Canvas positioning (blocks are auto-laid out)
- Connection wires (connections are auto-inferred from block types)
- Automation configuration (use sentence-based UI: "When someone RSVPs, notify the group leader")
- Raw block properties
- Layer management
- Capability lane details

### When to Show It

| Scenario | Editor |
|----------|--------|
| Student picks a template and taps "Customize" | Focused Editor |
| Student taps "Edit" on a live tool in their space | Focused Editor |
| AI generates a tool and student taps "Customize" | Focused Editor |
| Student wants full control | "Open in HiveLab" link -> Full IDE |
| Student navigates to `/tools/[toolId]/studio` | Full IDE |

### Edit-After-Live

What happens when a student wants to change a live tool:

| Flow Level | Edit Experience |
|------------|----------------|
| Inline (consumer) | Tap tool in space -> inline edit overlay. Same fields as creation. |
| Template (customizer) | Tap "Edit" -> focused editor reopens with current values. |
| AI Creation (creator) | Tap "Edit" -> choice: focused editor OR "Open in HiveLab." |
| Power Builder | Tap "Edit" -> always opens full IDE. |

### Edit Permissions

| Actor | Can Edit |
|-------|----------|
| Tool creator | Always |
| Space leader | Any tool in their space |
| Space member | Only their own inline-created tools |
| Campus admin | Any tool |

### Component Spec: FocusedToolEditor

```typescript
interface FocusedToolEditorProps {
  toolId: string;
  composition: ToolComposition;
  templateConfig?: TemplateConfig; // Exposed fields from template
  spaceContext?: { spaceId: string; spaceName: string; spaceType: string };
  onGoLive: (targetSpaceId: string) => void;
  onOpenIDE: () => void; // Escape hatch to full IDE
}
```

**Behavior:**
- Renders live preview using existing tool runtime components
- Editable fields derived from template's exposed config OR from composition element configs
- Changes reflect immediately in preview (optimistic local state)
- "Go Live" saves and deploys in one action
- "Open in HiveLab" navigates to `/tools/[toolId]/studio`

### Acceptance Criteria

- [ ] Focused Editor loads in < 1s with no panel chrome
- [ ] Click-to-edit on any text element in the preview
- [ ] "Add a block" shows 8 most common blocks with need-oriented labels
- [ ] Preview updates instantly on field change (no save button needed for preview)
- [ ] "Go Live" completes in < 2s
- [ ] "Open in HiveLab" escape hatch always visible
- [ ] Mobile: full-screen focused editor with preview in collapsible top section
- [ ] No developer vocabulary in any label or tooltip

---

## 6. Cross-System Integration

### Identity & Home System (Spec 01)

| Integration Point | What flows | Direction |
|---|---|---|
| User context in tools | `userId`, `campusId`, `handle`, `interests`, `residenceType`, `lookingFor` | Identity -> Tools |
| Tool activity in home feed | "For You" cards surface relevant tools | Tools -> Home |
| Profile-based tool recommendations | Interests + engagement scores feed template suggestions | Identity -> Tools |
| Privacy enforcement | `ghostMode` hides user from tool leaderboards/member lists | Identity -> Tools |

**Key dependency:** `getCampusId(req)` from session middleware. Every tool API route must filter by campusId. Never accept campusId from client.

### Spaces & Events System (Spec 02)

| Integration Point | What flows | Direction |
|---|---|---|
| System tool auto-deploy | Space creation triggers universal sidebar template deployment | Spaces -> Tools |
| SpaceHub mode cards | Tool count displayed in space overview | Tools -> Spaces |
| Space leader setup progress | `firstToolDeployed` tracked as setup milestone | Tools -> Spaces |
| Event-tool linking | Event creation offers inline RSVP/countdown creation | Spaces <-> Tools |
| Space sidebar rendering | Deployed tools render in space sidebar via slot system | Tools -> Spaces |
| Space permissions | Space role (leader/member) determines edit permissions | Spaces -> Tools |
| Space governance | Space allows/restricts capability lanes for deployed tools | Spaces -> Tools |

**Key dependency:** Tool deployment creates records in both `/tools/{toolId}` and `/spaces/{spaceId}/deployments/{deploymentId}`. Space sidebar reads from deployments subcollection.

### Discovery & Intelligence System (Spec 03)

| Integration Point | What flows | Direction |
|---|---|---|
| Tool search | Tools are searchable entities with text matching | Tools -> Discovery |
| AI generation | Gemini 2.0 Flash for tool composition generation | Discovery -> Tools |
| Template recommendations | AI suggests templates based on space type and activity | Discovery -> Tools |
| Quality pipeline | Validation, auto-fixes, scoring for AI-generated tools | Internal |

**Key dependency:** AI generation cost ~$0.002/request. At 5K students, ~$6/month. Budget-safe for launch.

### Communication & Social System (Spec 04)

| Integration Point | What flows | Direction |
|---|---|---|
| Inline components in chat | Poll, RSVP, Countdown, custom HiveLab tools embedded in messages | Tools -> Chat |
| Slash commands | `/poll`, `/event`, `/countdown` create inline tools from chat | Chat -> Tools |
| Participant subcollections | Inline component state stored as hybrid: aggregate + participants subcollection | Shared |
| Tool insertion toolbar | Chat composer offers tool creation via "+" button | Chat -> Tools |

**Key dependency:** `InlineComponent` entity supports three tool types (poll, countdown, rsvp) plus custom HiveLab tools. State model: aggregate counts in parent document, individual votes in participant subcollection. Enables both fast reads (aggregate) and auditability (individual).

### Data Flow Diagram

```
Student in space
  |
  |-- Sees sidebar tools (auto-deployed by space type)
  |-- Sees inline tools in chat (slash commands / "+" menu)
  |-- Taps "Add to space" (template gallery)
  |-- Describes what they want (AI creation)
  |-- Opens /tools (power builder)
  |
  v
Tool creation (instant / template / AI / manual)
  |
  |-- POST /api/tools/* (create tool record)
  |-- POST /api/tools/[toolId]/go-live (attach to space)
  |-- Firestore: /tools/{toolId}, /spaces/{spaceId}/deployments/{deploymentId}
  |-- Budget tracking: /budget_usage/{id}
  |
  v
Tool runtime
  |
  |-- Read/write own state: /tools/{toolId}/state
  |-- Shared state: /tools/{toolId}/shared_state
  |-- Participant data: /tools/{toolId}/participants/{userId}
  |-- Capability enforcement: server-side per-request
  |-- Budget enforcement: server-side per-request
```

---

## 7. Data Model & API Contracts

### Firestore Collections

```
/tools/{toolId}
  - name: string
  - description: string
  - campusId: string (campus isolation)
  - creatorId: string
  - composition: ToolComposition (elements, connections, layout)
  - capabilities: ToolCapabilities
  - budgets: ToolBudgets
  - trustTier: TrustTier
  - surfaceModes: SurfaceModes
  - appConfig?: AppConfig
  - theme?: ToolTheme
  - status: 'draft' | 'live' | 'archived'
  - templateId?: string (if created from template)
  - createdAt: Timestamp
  - updatedAt: Timestamp

/tools/{toolId}/state/{stateKey}
  - value: any
  - updatedAt: Timestamp

/tools/{toolId}/shared_state/{stateKey}
  - value: any
  - updatedAt: Timestamp

/tools/{toolId}/participants/{userId}
  - data: Record<string, any> (votes, RSVPs, form submissions)
  - updatedAt: Timestamp

/tools/{toolId}/versions/{versionId}
  - composition: ToolComposition
  - createdAt: Timestamp
  - note: string

/spaces/{spaceId}/deployments/{deploymentId}
  - toolId: string
  - surface: 'sidebar' | 'feed' | 'page'
  - order: number (sidebar position)
  - governance: DeploymentGovernance
  - status: DeploymentGovernanceStatus
  - deployedBy: string
  - deployedAt: Timestamp

/budget_usage/{deploymentId}_{YYYY-MM-DD}
  - notificationsSent: number
  - postsCreated: number
  - automationsTriggered: number

/budget_usage_hourly/{deploymentId}_{userId}_{YYYY-MM-DD-HH}
  - count: number
```

### API Routes (Existing + New)

#### Core CRUD (Existing)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools` | GET | List user's tools |
| `/api/tools` | POST | Create a new tool |
| `/api/tools/[toolId]` | GET | Get tool details |
| `/api/tools/[toolId]` | PATCH | Update tool |
| `/api/tools/[toolId]` | DELETE | Delete tool |

#### Creation Flows (New)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/instant-create` | POST | Inline creation: type + context -> live tool |
| `/api/tools/from-template` | POST | Template creation: templateId + config + spaceId -> live tool |
| `/api/tools/ai-create` | POST | AI creation: prompt + context -> streamed composition |

#### Deployment (Existing, rename)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/[toolId]/go-live` | POST | Simplified deploy with auto-surface (replaces deploy) |
| `/api/tools/[toolId]/inline-edit` | PATCH | Edit live tool config without IDE |
| `/api/tools/deploy` | POST | Legacy deploy route (keep for backwards compat, redirect) |

#### Generation & Intelligence (Existing)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/generate` | POST | AI tool generation (streaming) |
| `/api/tools/browse` | GET | Browse community tools |
| `/api/tools/search` | GET | Search tools |
| `/api/tools/recommendations` | GET | Personalized tool suggestions |
| `/api/tools/publish` | POST | Publish tool as community template |

#### Tool Runtime (Existing)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/[toolId]/state` | GET/POST | Tool state read/write |
| `/api/tools/execute` | POST | Execute tool action (capability + budget checked) |
| `/api/tools/[toolId]/analytics` | GET | Usage analytics |
| `/api/tools/[toolId]/reviews` | GET/POST | Community reviews |
| `/api/tools/[toolId]/share` | POST | Share/fork tool |
| `/api/tools/[toolId]/audit` | GET | Audit log |
| `/api/tools/[toolId]/runs` | GET | Execution history |
| `/api/tools/[toolId]/versions` | GET | Version history |
| `/api/tools/[toolId]/connections` | GET/POST | Tool-to-tool connections |
| `/api/tools/[toolId]/automations` | GET/POST | Automation rules |

#### System & Admin (Existing)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/capabilities` | GET | Available capabilities for trust tier |
| `/api/tools/event-system` | GET/POST | Event-linked tool operations |
| `/api/tools/feed-integration` | GET | Feed integration status |
| `/api/tools/install` | POST | Install community tool to space |
| `/api/tools/review` | POST | Submit tool review |
| `/api/tools/usage-stats` | GET | Platform-wide usage stats |
| `/api/tools/migrate` | POST | Migration utilities |
| `/api/tools/updates` | GET | Tool update notifications |
| `/api/tools/personal` | GET | Personal tool dashboard data |

### Route Architecture (Recommended IA)

Current: 15 routes under `/lab/`

Recommended: 5 routes under `/tools/` (public-facing) with IDE preserved under `/tools/[toolId]/studio`

```
/tools                        -- Your tools (returning users) + "What do you need?" (new users)
/tools/gallery                -- Browse all templates with visual previews
/tools/[toolId]               -- View/use your tool + inline editing (Layer 2 Focused Editor)
/tools/[toolId]/studio        -- Full IDE (Power Builder, opt-in)
/tools/[toolId]/analytics     -- Analytics (power users)

# Embedded entry points (no new routes):
Space sidebar: "Add a poll" --> inline creation
Event creation: "Add countdown" --> inline creation
Space settings: "Manage tools" --> list of deployed tools
```

Key changes:
- 15 routes collapsed to 5
- `/tools/[toolId]/studio` (IDE) is opt-in, not the default
- "Go Live" is an action, not a page
- Setups, runs, run history are accessible from within studio but not top-level routes

---

## 8. AI Integration Deep Dive

### AI's Role Per Persona Level

| Level | AI Behavior | Visibility |
|-------|-------------|------------|
| Consumer (80%) | Invisible. Powers smart defaults, feed ordering, search. | Never visible. |
| Customizer (15%) | Suggestive. Recommends templates based on space type and activity. | "Based on your space type, other clubs use: Attendance Tracker, Event RSVP" |
| Creator (4%) | Generative. Primary creation mechanism. Describe -> Deploy. | Interactive prompt + streaming preview. |
| Builder (1%) | Co-pilot. Element suggestions, connection wiring, capability guidance, debugging. | AI command palette within IDE. |

### Generation Pipeline (Existing)

**Infrastructure:** `apps/web/src/lib/firebase-ai-generator.ts`

```
Student prompt
  -> Prompt enhancement (RAG + learned patterns)
  -> Gemini 2.0 Flash (structured output, Zod-validated)
  -> Quality pipeline:
     1. Structural validation (valid elements, valid connections)
     2. Auto-fixes (missing defaults, orphan connections, layout issues)
     3. Quality scoring (0-100)
     4. Tracking (prompt, result, score, edits for learning)
  -> Streaming chunks -> StreamingCanvasView
  -> Interactive preview
```

**What the quality pipeline checks:**
- Are all referenced element IDs valid? (cross-reference element-registry)
- Are connections between compatible port types?
- Are required config fields populated?
- Is the composition renderable? (layout validation)
- Does the tool match the prompt intent? (semantic similarity)

**Learning loop:** Every AI generation is tracked. Post-generation edits (what students change) feed back into prompt enhancement. Over time, the AI learns what "attendance tracker" means at UB specifically.

### Smart Defaults by Context

| Context Signal | Smart Default |
|---|---|
| Space type: `greek` | Template suggestions: Points Tracker, Multi-Poll, Competition Tracker |
| Space type: `residential` | Template suggestions: Floor Poll, Meet Your Neighbors, Availability |
| Space type: `student` | Template suggestions: Quick Poll, Event RSVP, Attendance Tracker |
| Space has upcoming event | Suggest: "Add a countdown?" / Pre-fill RSVP with event name |
| Space has > 50 members | Suggest: Announcement Board (leaders-only posting) |
| AI prompt mentions "vote" | Generate poll element with options |
| AI prompt mentions "track" | Generate leaderboard + counter elements |
| AI prompt mentions "sign up" | Generate form + result list elements |

### AI in the IDE (Existing, Ships)

The AI command palette (`ai-command-palette.tsx`) within the IDE provides:
- "Add a block that does X" -> AI places appropriate element on canvas
- "Connect these two blocks" -> AI wires connection
- "Make this tool work for events" -> AI adds event-related elements
- "Why isn't this working?" -> AI diagnoses composition issues

### Generation Costs and Limits

| Metric | Value |
|--------|-------|
| Cost per generation | ~$0.002 |
| Monthly cost at 5K students | ~$6 |
| Monthly cost at 50K students | ~$60 |
| Generation timeout | 30 seconds |
| Max elements per generation | 8 |
| Max connections per generation | 12 |
| Rate limit | 10 generations per user per hour |
| Fallback | Mock generator if AI service unavailable |

### AI Anti-Patterns

- Never generate tools that look like they contain real data (use obviously fake sample data)
- Never generate tools that access capabilities the creator's trust tier doesn't allow
- Never auto-deploy generated tools without student confirmation
- Never show confidence scores or model names to students
- Never generate tools with hardcoded campusId or userId -- always use context interpolation

---

## 9. Launch Prioritization

### What Ships for Launch (Phase 0)

Everything in the "Ships" column from the code assessment. The full IDE, all 27 elements, all 29 templates, AI generation, system tools, capability governance, template gallery.

**Plus these quick wins (< 1 day each):**

| Change | Effort | Impact |
|--------|--------|--------|
| Rename "Deploy" to "Go Live" in all UI copy | 2 hours | Immediate clarity. One find-and-replace. |
| Rename "Lab" to "Tools" in navigation | 30 min | One nav item change. |
| Change "Welcome to your Lab" to "What does your group need?" | 30 min | Copy change on dashboard. |
| Change AI placeholder to show examples | 30 min | "Try: 'poll for meeting times' or 'event countdown'" |
| Rename "Elements" to "Blocks" in IDE palette | 1 hour | Find-and-replace in UI components. |
| Add template visual preview placeholders | 4 hours | Show what templates produce, not just names. |

### Phase 1: Template Flow + Focused Editor (Post-Launch Week 1-2)

| Feature | Effort | Impact |
|---------|--------|--------|
| `FocusedToolEditor` component | 3-4 days | The missing Layer 2. Eliminates the biggest cognitive cliff. |
| `GoLiveButton` component | 1 day | Simplified deploy with auto-surface selection. |
| Template picker with live previews | 2-3 days | Visual outcome tiles instead of text descriptions. |
| `/api/tools/from-template` route | 1 day | One-step template -> live tool. |
| `/api/tools/[toolId]/go-live` route | 1 day | Simplified deploy with auto-surface. |
| Auto-surface selection logic | 1 day | Polls -> feed, leaderboards -> sidebar, apps -> page. |

**Total: ~2 weeks. Covers 60% of leader creation use cases.**

### Phase 2: Inline Creation (Post-Launch Week 3-4)

| Feature | Effort | Impact |
|---------|--------|--------|
| `InlineToolCreator` component | 3-4 days | Space chat/feed inline creation card. |
| `ToolTypeMenu` component | 1 day | Categorized "+" menu in space. |
| `/api/tools/instant-create` route | 2 days | Type + context -> live tool in one request. |
| "Add Poll/RSVP/Countdown" buttons in space sidebar | 1 day | Most impactful entry point. |
| Empty sidebar state with suggestions | 1 day | "Your sidebar is empty. Add a poll." |

**Total: ~2 weeks. Covers 80% of member creation use cases.**

### Phase 3: AI Creation Flow Enhancement (Post-Launch Week 5-6)

| Feature | Effort | Impact |
|---------|--------|--------|
| Standalone AI creation flow (outside IDE) | 3-4 days | AI creation as its own path, not inside IDE. |
| Conversational iteration (follow-up prompts) | 2-3 days | "Add a deadline" after initial generation. |
| `/api/tools/ai-create` route | 2 days | Prompt -> streamed composition as standalone endpoint. |
| Suggestion chips post-generation | 1 day | "Add a deadline?", "Make it anonymous?" |
| `/api/tools/[toolId]/inline-edit` route | 1 day | Edit live tools without IDE. |

**Total: ~2 weeks. Differentiator. High engagement for creators.**

### Phase 4: Chat Integration (Post-Launch Month 2+)

| Feature | Effort | Impact |
|---------|--------|--------|
| Space chat "/poll" command inline | 2 days | Most frictionless entry point. |
| Space chat "/countdown" command | 1 day | Event-linked countdown from chat. |
| Space chat "/rsvp" command | 1 day | Event-linked RSVP from chat. |
| Command palette creation integration | 2 days | "New poll in [space]" from Cmd+K. |
| Event creation tool linking | 2 days | "Add countdown" in event creation form. |

**Total: ~1.5 weeks.**

### Route Migration Timeline

| Phase | Route Change |
|-------|-------------|
| Launch | `/lab` works as-is, "Tools" in nav label only |
| Phase 1 | Add `/tools` alias that serves same dashboard |
| Phase 2 | `/tools` becomes primary, `/lab` redirects |
| Phase 3 | `/tools/[toolId]` shows Focused Editor by default, `/tools/[toolId]/studio` for IDE |
| Phase 4 | `/lab/*` routes redirect to `/tools/*` equivalents |

---

## 10. Existing Code Assessment: The 27 Elements

### Element Registry Overview

All 27 elements registered in `packages/core/src/domain/hivelab/element-registry.ts` with full specs.

### Current Categories (Developer-Oriented)

```
Input Elements (4): Search Input, Date Picker, User Selector, Form Builder
Filter Elements (1): Filter Selector
Display Elements (3): Result List, Chart Display, Progress Indicator
Action Elements (6): Poll, RSVP Button, Countdown Timer, Leaderboard, Counter, Timer
Layout Elements (1): Role Gate
Connected Elements (3): Event Picker, Space Picker, Connection List
Space Elements (7): Member List, Member Selector, Space Events, Space Feed, Space Stats, Announcement, Availability Heatmap
Additional Universal (3): Tag Cloud, Map View, Notification Center
```

### Recommended Categories (Need-Oriented)

For the block palette in the IDE and the "Add a block" menu in the Focused Editor:

| Category | Student Question | Blocks |
|----------|-----------------|--------|
| Collect Responses | "I want to ask people something" | Poll, RSVP, Form Builder, User Selector |
| Show Info | "I want to display something" | Countdown, Progress Indicator, Announcement, Space Stats, Space Feed |
| Display Data | "I want to show results" | Result List, Chart Display, Leaderboard, Tag Cloud |
| Find Things | "I want to help people find things" | Search Input, Filter Selector, Date Picker, Event Picker |
| Team Tools | "I want to manage people" | Member List, Member Selector, Availability Heatmap, Connection List |
| Space Integration | "I want to connect to my space" | Space Events, Space Picker, Map View, Notification Center |
| Control Access | "I want to control who sees what" | Role Gate |

### Quick Template Inventory

**Simple Templates (21) -- 1-2 elements, one-click deploy:**

Quick Poll, Event Countdown, Quick Links, Study Group Signup, Weekly Update, Floor Poll, Meet Your Neighbors, Anonymous Q&A, Office Hours, Resource Board, Reading Progress, Daily Standup, Skill Matcher, Volunteer Signup, Budget Tracker, Club Elections, Mentor Match, Room Booking, Debate Board, Wish List, Gratitude Wall

**App-Tier Templates (8) -- 4+ elements with connections:**

Photo Challenge, Attendance Tracker, Resource Signup, Multi-Poll Dashboard, Event Series Hub, Suggestion Box, Study Group Matcher, Competition Tracker

**Hidden/Incomplete Templates (3):**

What Should I Eat, Study Spot Finder (incomplete elements), one additional

### Template Quality Bar

Every template must:
- Have a visual preview (not just a name and icon)
- Show sample data that looks real (but is obviously placeholder)
- Pre-fill the space name when opened from a space context
- Deploy in < 2 seconds from "Go Live" tap
- Work on mobile without horizontal scrolling
- Have a clear one-line description that says what it DOES, not what it IS

### Element Runtime Components

Interactive elements (6): Poll, RSVP, Countdown, Leaderboard, Counter, Timer
Universal elements (10): Search, Filter, Date Picker, Chart, Form, Tag Cloud, Map, Notification, User Selector, Photo Gallery
Connected elements (6): Event Picker, Space Picker, Connection List, Dining Picker, Study Spot Finder, Personalized Event Feed
Space elements: Member List, Member Selector, Space Events, Space Feed, Space Stats, Announcement, Availability Heatmap

All rendered via `packages/ui/src/components/hivelab/elements/` with domain-specific subdirectories.

---

## Cognitive Load Scorecard

Current vs target fluency scores (1 = instant comprehension, 5 = requires tutorial):

| Area | Current | Target | Fix |
|------|---------|--------|-----|
| Finding tool creation | 4 | 1 | "Tools" in nav, inline creation in spaces |
| Understanding what it does | 3 | 1 | "Polls, sign-ups, countdowns" -- show outcomes |
| Picking a template | 2 | 1 | Visual previews instead of text labels |
| AI prompt creation | 3 | 2 | Examples in placeholder, suggestion chips |
| IDE first impression | 5 | 3 | Only Power users see IDE; others get Focused Editor |
| Adding a block | 4 | 2 | Need-oriented categories, "Add a block" menu |
| Configuring a block | 3 | 2 | Inline editing in Focused Editor |
| Going live | 4 | 1 | "Go Live" + auto-surface, no permissions/surface config |
| Understanding automations | 5 | 3 | Sentence-based: "When X, do Y" |
| Understanding connections | 5 | N/A | Hidden from 98% of students, auto-inferred |
| Returning to a tool | 2 | 1 | Dashboard works well already |

**Overall: 3.6 / 5 (current) -> 1.7 / 5 (target)**

---

## Success Criteria

| Metric | Current (est.) | Target |
|--------|---------------|--------|
| Average steps to live tool | 6+ | 3.2 (weighted by flow usage) |
| Average time to live tool | 5-10 min | < 60s for 80% of creation |
| Tool creation completion rate | ~40% | > 80% overall |
| % of tools created outside /tools | 0% | > 70% |
| Students who create a tool in first session | ~5% | > 25% |
| "I don't know how to use this" support tickets | Baseline | -80% |
| Cognitive fluency score | 3.6 / 5 | 1.7 / 5 |

---

## Alignment with 2026 Standards

| Standard | How This Spec Addresses It |
|----------|---------------------------|
| AI-Native (S1) | AI is invisible in inline creation (smart defaults), interactive in AI creation, ambient in auto-surface. Gemini 2.0 Flash with streaming, not bolted on. |
| Performance (S2) | Inline creation renders in < 500ms (no page navigation). Streaming preview for AI. IDE skeleton states. Tool execution < 300ms p95. |
| Personalization (S3) | Templates show space name, tool types sorted by space category relevance. AI pre-fills based on space context. |
| Interaction (S4) | Progressive disclosure across 4 flows, not within one. Command palette integration. Keyboard shortcuts in IDE. |
| Visual/Motion (S5) | Streaming build animation for AI flow. Inline card entrance < 300ms. Tool preview transitions. All motion via `@hive/ui/motion`. |
| Empty States (S6) | "No tools yet" in spaces links to inline creation, not /tools. Empty sidebar guides with template suggestions. |
| Inclusivity (S7) | Inline flow works for introverts (no navigating to unfamiliar pages). Anonymous tools available. Templates work for all student types. |
| Privacy (S8) | Tool visibility inherits from space. No separate privacy decisions. Ghost mode respected in leaderboards/member lists. |
| Anti-patterns (S9) | No unnecessary confirmation dialogs. No deploy ceremony. No forced steps. No "AI-powered" badges. |
| Ship Real (S10) | Every button does real work. No console.log handlers. No placeholder deployments. All 27 elements functional. |
