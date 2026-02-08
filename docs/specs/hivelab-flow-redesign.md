# HiveLab Flow Redesign: Minimum Cognitive Load

The current HiveLab creation flow requires 6+ steps from intent to live tool. This spec redesigns every path from "I need a poll" to "poll is live" to minimize cognitive load, eliminate unnecessary decisions, and match the flow to the student's actual intent level.

---

## Current State Analysis

### What Exists Today

| Step | Screen | Decision Required | Cognitive Load |
|------|--------|-------------------|----------------|
| 1 | `/lab` dashboard | "What do I do here?" | High - unfamiliar concept |
| 2 | "New" button or AI prompt | Choose creation path | Medium - 3+ options |
| 3 | Start Zone: Describe / Template / Manual | Choose workflow | High - technical framing |
| 4 | IDE canvas with elements, panels, palette | Build the tool | Very High - full IDE |
| 5 | Deploy modal: choose space, surface, permissions | Configure deployment | High - 5+ decisions |
| 6 | Confirmation | Verify | Low |

**Total: 6 steps, 10+ decisions, 4 new concepts to learn (canvas, elements, connections, deployment), 3-10 minutes to live.**

### What Breaks

- The word "Lab" implies a technical environment before students even get there
- Every student hits the same IDE regardless of whether they want a quick poll or a custom multi-element app
- "Deploy" is a developer concept; students don't deploy, they share
- The creation flow lives only at `/lab` -- disconnected from where tools are actually used (spaces)
- Template selection requires understanding what templates produce before you can evaluate them
- The AI prompt creates a blank tool, then redirects to IDE with the prompt -- two-step where it should be one

### Current Files Involved

- `apps/web/src/app/lab/page.tsx` -- Builder dashboard (835 lines)
- `apps/web/src/app/lab/new/page.tsx` -- Tool creation intermediary
- `apps/web/src/app/lab/[toolId]/page.tsx` -- IDE page (709 lines)
- `packages/ui/src/components/hivelab/ide/start-zone.tsx` -- Entry choice screen
- `packages/ui/src/components/hivelab/ide/template-gallery.tsx` -- Template browser modal
- `packages/ui/src/components/hivelab/ide/ai-command-palette.tsx` -- AI prompt palette
- `packages/core/src/domain/hivelab/element-registry.ts` -- 27 element types

---

## Design Principles

1. **Match flow complexity to intent complexity.** A student who wants a poll should never see an IDE. A builder who wants a custom app should never be forced through a wizard.

2. **Creation happens where usage happens.** Tools are used in spaces. Creation should start in spaces, not a separate environment.

3. **"Deploy" does not exist.** Tools go live. The concept of deployment is an implementation detail students never need to think about.

4. **Preview is the creation.** For simple tools, what you see during creation IS the final product. No separate preview step.

5. **Progressive disclosure across flows, not within a single flow.** Instead of one flow with progressive disclosure, have separate flows of different complexity. Students self-select by WHERE they start creating.

---

## The Four Flows

### Flow 1: Inline Creation (Consumer)

**Who:** Any space member. Most common use case.
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
  -> Tool is live in the space feed
```

#### What's Different from Today

- No navigation away from the space
- No IDE
- No deploy step -- tool is created in-context, already attached to the space
- AI does the configuration, student just confirms

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

#### Metrics Target

| Metric | Target |
|--------|--------|
| Steps | 2 (trigger + confirm) |
| Decisions | 1 (confirm or edit) |
| Time to live | < 15 seconds |
| New concepts | 0 |
| Target completion rate | 95% |

---

### Flow 2: Template Creation (Customizer)

**Who:** Space leaders who want a specific tool with light customization.
**When:** Student knows roughly what they want and wants to customize before going live.
**Where it starts:** Space leader dashboard, space settings, or `/lab` with template intent.
**Cognitive concepts required:** 1 (templates as starting points).

#### How It Works

1. Student opens template picker from space leader view or `/lab`
2. Templates are shown with LIVE PREVIEWS -- not descriptions, not screenshots, actual rendered tools with sample data and the student's space name already populated
3. Student picks one. It opens in a FOCUSED EDITOR (not the full IDE) -- a single-screen form showing exactly what can be customized
4. Student edits title, options, colors, or whatever the template exposes
5. Student selects which space to add it to (pre-selected if they came from a space)
6. Taps "Go Live" -- tool appears in the space

#### Technical Flow

```
Template picker (space view or /lab)
  -> Client: render live template previews with space context
  -> Student selects template
  -> Client: render focused editor (template-specific config form)
  -> Student customizes exposed fields
  -> POST /api/tools/from-template { templateId, config, targetSpaceId }
  -> Server: creates tool + attaches to space
  -> Client: shows success with link to space
```

#### Focused Editor vs IDE

The focused editor is NOT the current IDE. It's a purpose-built single-page form that shows:
- Live preview of the tool on the left (or top on mobile)
- Editable fields on the right (or bottom on mobile)
- Only the fields this template exposes (3-8 fields, never more)
- "Go Live" button with space selector

No canvas. No element palette. No layers panel. No connection wires.

#### Template Categories

| Category | Templates | Example |
|----------|-----------|---------|
| Engage | Poll, Quiz, Reaction Board | "Weekly Vibes Check" |
| Events | RSVP, Countdown, Schedule Picker | "Game Day Countdown" |
| Organize | Sign-up Sheet, Task Board, Roster | "Committee Sign-ups" |
| Track | Leaderboard, Progress Bar, Counter | "Reading Challenge" |
| Communicate | Announcement Board, FAQ, Resource Hub | "Club Resources" |

#### Metrics Target

| Metric | Target |
|--------|--------|
| Steps | 3 (pick template + customize + go live) |
| Decisions | 3-5 (template choice + field edits + space) |
| Time to live | < 30 seconds |
| New concepts | 1 (template) |
| Target completion rate | 85% |

---

### Flow 3: AI Creation (Creator)

**Who:** Space leaders or ambitious students who have an idea but not a specific template in mind.
**When:** Student has a clear description of what they want but needs AI to build it.
**Where it starts:** Space leader dashboard, command palette, or `/lab`.
**Cognitive concepts required:** 1 (describing what you want to AI).

#### How It Works

1. Student types a natural language description: "I need a tool where members can vote on weekly meeting times and see results in real-time"
2. AI generates the tool with streaming preview -- student watches it being built
3. Student sees a LIVE INTERACTIVE PREVIEW of the generated tool
4. Student can:
   - Say "Looks good" -> go live
   - Say "Change the colors" or "Add a deadline" -> AI iterates
   - Switch to focused editor for manual tweaks
5. Select space and go live

#### Technical Flow

```
AI prompt input (space view, /lab, or Cmd+K)
  -> POST /api/tools/ai-create { prompt, spaceContext? }
  -> Server: AI generates tool composition (streamed)
  -> Client: streaming canvas view shows tool being built
  -> Student reviews live preview
  -> Iterative refinement via conversational follow-ups
  -> POST /api/tools/create { composition, targetSpaceId }
  -> Tool is live
```

#### AI Creation vs Current AI Command Palette

Current: AI command palette (Cmd+K) inside the IDE generates elements on a canvas. Student must already be in the IDE.

New: AI creation is a standalone flow. It produces a complete, functional tool. The streaming preview shows the finished product, not canvas elements. If the student wants to go deeper, they can "Open in Lab" to access the full IDE.

#### Conversation Patterns

| Student Says | AI Does |
|-------------|---------|
| "Make a poll for meeting times" | Generates poll with time-slot options |
| "Add a deadline" | Adds countdown timer connected to poll |
| "Make it anonymous" | Changes poll config to anonymous voting |
| "Looks good, send it to [space]" | Attaches to space, goes live |
| "I want to customize more" | Opens focused editor or IDE |

#### Metrics Target

| Metric | Target |
|--------|--------|
| Steps | 3-4 (describe + review + iterate? + go live) |
| Decisions | 2-3 (prompt + confirm + space) |
| Time to live | < 60 seconds |
| New concepts | 1 (AI generation) |
| Target completion rate | 75% |

---

### Flow 4: Power Builder (Builder)

**Who:** Students who want full creative control. Repeat tool creators. Power users.
**When:** Building complex multi-element tools, custom apps, or tools with automations.
**Where it starts:** `/lab` explicitly.
**Cognitive concepts required:** 4+ (canvas, elements, connections, automations).

#### How It Works

This is the current IDE flow, but with improvements:

1. Student navigates to `/lab` intentionally
2. Starts from blank canvas, template, or AI generation
3. Full IDE: element palette, canvas, properties panel, layers, connections, AI command palette
4. Build, preview, iterate
5. When ready: "Go Live" (replaces "Deploy") with simplified space selection

#### What Changes from Current

| Current | New |
|---------|-----|
| "Deploy" button + modal | "Go Live" button + inline space picker |
| Deploy modal with permissions, surface, privacy | Auto-sensible defaults; advanced settings behind "More options" |
| Must navigate to /lab to start | Can start from anywhere, /lab is for power users |
| IDE is the only creation path | IDE is one of four creation paths |
| Start Zone shows 3 options on empty canvas | Start Zone only for power flow; other flows bypass it entirely |

#### Metrics Target

| Metric | Target |
|--------|--------|
| Steps | 5-8 (navigate + choose path + build + preview + go live) |
| Decisions | 10+ (all element and config decisions) |
| Time to live | 2-15 minutes |
| New concepts | 4+ (canvas, elements, connections, etc.) |
| Target completion rate | 60% |

---

## Flow Summary Table

| Flow | Who | Steps | Decisions | Time to Live | Concepts | Target Completion |
|------|-----|-------|-----------|-------------|----------|-------------------|
| Inline | Any member | 2 | 1 | < 15s | 0 | 95% |
| Template | Leaders | 3 | 3-5 | < 30s | 1 | 85% |
| AI Creation | Leaders | 3-4 | 2-3 | < 60s | 1 | 75% |
| Power Builder | Power users | 5-8 | 10+ | 2-15 min | 4+ | 60% |

**Current flow (all users): 6+ steps, 10+ decisions, 3-10 min, 4+ concepts, ~40% estimated completion.**

---

## Entry Points Map

Every place a student can BEGIN creating a tool:

| Entry Point | Available Flows | Default Flow |
|-------------|----------------|--------------|
| Space chat (type or "/tool") | Inline | Inline |
| Space "+" button | Inline, Template | Inline for known types, Template for browse |
| Space leader dashboard | Template, AI Creation | Template |
| Event creation form | Inline (RSVP, Countdown) | Inline |
| Space settings | Template, AI Creation | Template |
| Command palette (Cmd+K) | Inline, AI Creation | Infers from query |
| `/lab` (direct navigation) | Template, AI Creation, Power | Power |
| Fork existing tool | Template (pre-filled) | Template |
| Search results ("no polls found, create one?") | Inline, Template | Inline |

---

## Eliminating "Deploy"

### The Problem

"Deploy" is a software engineering concept. Students don't think in terms of deployment targets, surfaces, permissions, and deployment configurations. They think: "put this in my space."

### The Solution

Replace "Deploy" with "Go Live" everywhere. The concept shift:

| Old Concept | New Concept |
|-------------|-------------|
| Deploy | Go Live |
| Deployment target | "Which space?" |
| Surface (sidebar, feed, page) | Auto-selected based on tool type |
| Deployment permissions | Inherit from space role permissions |
| Deployment privacy | Inherit from space privacy |
| Deployment configuration | Doesn't exist for Flows 1-3 |

### Auto-Surface Selection

Instead of asking students where to put the tool:

| Tool Type | Auto Surface |
|-----------|-------------|
| Poll, Counter, RSVP | Space feed (inline card) |
| Leaderboard, Resource Hub | Space sidebar widget |
| Multi-element apps | Space tools page |
| Countdown | Space feed + space header accent |
| Form, Sign-up | Space feed (expandable card) |

Students can override auto-surface in the Power Builder flow. For all other flows, it just works.

---

## Preview Solution

Each flow level has a different preview approach:

| Flow | Preview Approach |
|------|-----------------|
| Inline | The creation IS the preview. Student sees exactly what space members will see. |
| Template | Live preview with sample data + space name. Shows real component rendering. |
| AI Creation | Streaming build preview, then interactive live preview. |
| Power Builder | Toggle between Edit and Use modes (current behavior, already implemented). |

---

## Edit-After-Live Solution

What happens when a student wants to change a live tool:

| Flow Level | Edit Experience |
|------------|----------------|
| Inline (consumer) | Tap tool in space -> inline edit overlay (same fields as creation). Space leaders can edit any tool. Regular members can only edit tools they created. |
| Template (customizer) | Tap "Edit" on tool -> focused editor reopens with current values. Same form as creation, pre-filled. |
| AI Creation (creator) | Tap "Edit" -> choice: focused editor OR "Open in Lab" for full IDE. |
| Power Builder | Tap "Edit" -> always opens full IDE at `/lab/[toolId]`. |

### Edit Permissions

| Actor | Can Edit |
|-------|----------|
| Tool creator | Always |
| Space leader | Any tool in their space |
| Space member | Only their own inline-created tools |
| Campus admin | Any tool |

---

## New API Routes Required

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tools/instant-create` | POST | Inline creation: type + context -> live tool |
| `/api/tools/from-template` | POST | Template creation: templateId + config + spaceId -> live tool |
| `/api/tools/ai-create` | POST | AI creation: prompt + context -> streamed composition |
| `/api/tools/[toolId]/go-live` | POST | Replaces deploy: simplified go-live with auto-surface |
| `/api/tools/[toolId]/inline-edit` | PATCH | Edit a live tool's config without IDE |

---

## New Components Required

| Component | Location | Purpose |
|-----------|----------|---------|
| `InlineToolCreator` | `apps/web/src/components/spaces/InlineToolCreator.tsx` | Chat/feed inline creation card |
| `ToolTypeMenu` | `apps/web/src/components/spaces/ToolTypeMenu.tsx` | "+" menu categorized tool picker |
| `FocusedToolEditor` | `apps/web/src/components/hivelab/FocusedToolEditor.tsx` | Template + AI creation edit form |
| `ToolLivePreview` | `packages/ui/src/components/hivelab/ToolLivePreview.tsx` | Rendered preview with sample data |
| `GoLiveButton` | `packages/ui/src/components/hivelab/GoLiveButton.tsx` | Replaces deploy button + modal |
| `SpacePicker` | `packages/ui/src/design-system/components/spaces/SpacePicker.tsx` | Simplified space selector |
| `StreamingToolPreview` | `packages/ui/src/components/hivelab/StreamingToolPreview.tsx` | AI generation streaming view |

---

## Migration from Current Flows

### What stays

- `/lab` route and full IDE (Power Builder flow)
- Element registry and composition system
- Tool canvas rendering
- Template system (enhanced with live previews)
- AI command palette (within IDE only)

### What changes

- "Deploy" -> "Go Live" throughout (UI copy, button labels, modal title)
- Deploy modal simplified: remove permissions, privacy, surface config for non-power flows
- Dashboard (`/lab/page.tsx`): reframed as power builder entry, not the default creation path
- Template gallery: enhanced with live previews instead of static cards
- New tool creation (`/lab/new/page.tsx`): only used for power builder flow

### What's new

- Inline creation system (Flows 1-3)
- Focused editor component
- Auto-surface logic
- Space-context tool creation APIs
- Edit-after-live inline editing

### What's removed

- Start Zone as first screen for all users (only shows in power builder)
- Deploy concept for non-power flows
- The need to navigate to `/lab` for simple tool creation

---

## Implementation Priority

| Phase | Scope | Impact |
|-------|-------|--------|
| P0 | Rename "Deploy" to "Go Live" everywhere | Low effort, immediate clarity |
| P0 | Template flow with focused editor | Covers 60% of leader creation |
| P1 | Inline creation for Poll, RSVP, Countdown | Covers 80% of member creation |
| P1 | AI creation flow with streaming preview | Differentiator, high engagement |
| P2 | Auto-surface selection logic | Removes last deployment decision |
| P2 | Edit-after-live for all flow levels | Completes the lifecycle |
| P3 | Space chat integration ("/poll" commands) | Most frictionless entry point |
| P3 | Command palette integration for creation | Power-user shortcut |

---

## Success Criteria

| Metric | Current (est.) | Target |
|--------|---------------|--------|
| Average steps to live tool | 6+ | 3.2 (weighted by flow usage) |
| Average time to live tool | 5-10 min | < 60s for 80% of creation |
| Tool creation completion rate | ~40% | > 80% overall |
| % of tools created outside /lab | 0% | > 70% |
| Students who create a tool in first session | ~5% | > 25% |
| "I don't know how to use this" support tickets | Baseline | -80% |

---

## Alignment with 2026 Standards

| Standard | How This Spec Addresses It |
|----------|---------------------------|
| AI-Native (S1) | AI is invisible in inline creation (smart defaults), interactive in AI creation flow, ambient in auto-surface selection |
| Performance (S2) | Inline creation renders in < 500ms (no page navigation). Streaming preview for AI flow. |
| Personalization (S3) | Templates show space name, tool types sorted by space category relevance |
| Interaction (S4) | Progressive disclosure across flows (not within). Command palette integration. |
| Visual/Motion (S5) | Streaming build animation for AI flow. Inline card animations < 300ms. |
| Empty States (S6) | "No tools yet" in spaces links directly to inline creation, not /lab |
| Inclusivity (S7) | Inline flow works for introverts (no navigating to unfamiliar pages). Template flow for customizers. Every student type has a path. |
| Privacy (S8) | Tool visibility inherits from space. No separate privacy decisions. |
| Anti-patterns (S9) | No unnecessary confirmation dialogs. No deploy ceremony. No forced steps. |
