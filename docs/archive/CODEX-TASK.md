# HIVE Custom Block System: Implementation Task

## Codebase
Location: `~/Desktop/HIVE/`
Stack: Next.js 15, Firebase/Firestore, Turborepo monorepo
Packages: `packages/core/` (domain + application logic), `packages/ui/` (components), `apps/web/` (Next.js app)

## Context
HiveLab is HIVE's creation engine. It has a custom block system that runs AI-generated HTML/CSS/JS in sandboxed iframes with a full SDK (`window.HIVE`). The system is ~85% built. This task completes the remaining 15% to make it fully end-to-end.

## What Already Exists (DO NOT REWRITE)
- `packages/core/src/domain/hivelab/custom-block.types.ts` — Full type system (CustomBlockConfig, BlockState, HIVESDK, manifests, validation types, postMessage protocol)
- `packages/ui/src/lib/hivelab/hive-sdk.ts` — `generateHiveSDK()` that produces client JS injected into iframes. Full `window.HIVE` API.
- `packages/ui/src/design-system/components/hivelab/CustomBlockRenderer.tsx` — Sandboxed iframe renderer with CSP, design tokens, postMessage bridge, loading/error states
- `packages/ui/src/lib/hivelab/csp-builder.ts` — CSP policy builder with security verification
- `packages/ui/src/components/hivelab/elements/custom/custom-block-element.tsx` — Element wrapper integrating CustomBlockRenderer with element system
- `packages/ui/src/components/hivelab/elements/registry.tsx` — Element registry, `'custom-block'` is registered at line 150
- `apps/web/src/hooks/use-tool-runtime.ts` — Tool runtime with shared+user state, persists via `/api/tools/[toolId]/state`, auto-save, real-time sync
- `packages/core/src/domain/hivelab/element-ports.ts` — Inter-element output/input port mappings
- `packages/core/src/application/hivelab/connection-resolver.service.ts` — Resolves data flow between connected elements
- `apps/web/src/app/api/tools/[toolId]/state/route.ts` — State persistence API

## Tasks (in order)

### Task 1: Wire I/O Ports for Custom Blocks

**File:** `packages/ui/src/components/hivelab/elements/custom/custom-block-element.tsx`

The `get_input` handler currently returns `null` with a TODO comment. The `emit_output` handler only does `console.log`.

**What to do:**
1. The `CustomBlockElement` receives props. Add `connections` and `onOutput` props (or use existing element system props) to provide connection data.
2. For `get_input`: Look up the connected element's output via the element ports system. The parent tool runtime manages all element states — the custom block element needs access to sibling element states via props or context.
3. For `emit_output`: Call `onAction` (or a new `onOutput` callback) with the output port ID and data so the tool runtime can cascade it to connected elements.

**Reference:** 
- `packages/core/src/domain/hivelab/element-ports.ts` for port definitions
- `packages/ui/src/lib/hivelab/element-system.ts` for ElementProps interface (line 83: `onAction`)
- `apps/web/src/hooks/use-tool-runtime.ts` for how state cascades between elements

### Task 2: Wire User/Space Context

**File:** `packages/ui/src/components/hivelab/elements/custom/custom-block-element.tsx`

The `get_context` handler returns a placeholder `{ userId: 'current-user' }`.

**What to do:**
1. Accept a `context` prop of type `BlockContext` (from `@hive/core`)
2. Pass real user data: userId, userDisplayName, userRole (from auth), spaceId, spaceName (from space context)
3. The `CustomBlockRenderer` already accepts a `context` prop and sends it to the iframe on ready — just pass real data through

**Reference:**
- `packages/core/src/domain/hivelab/custom-block.types.ts` — `BlockContext` interface
- `apps/web/src/hooks/use-tool-runtime.ts` — has access to spaceId
- `@hive/auth-logic` — `useAuth()` hook provides user data

### Task 3: Wire Toast Notifications

**File:** `packages/ui/src/components/hivelab/elements/custom/custom-block-element.tsx`

The `notify` handler only does `console.log`.

**What to do:**
1. Import the toast system (check `@hive/ui` or `apps/web/src/hooks/use-toast.ts`)
2. On `notify` message from iframe, call the toast function with the message and type
3. Map `notifyType` ('success' | 'error' | 'info') to toast variants

### Task 4: Custom Block Code Validation

**New file:** `packages/core/src/domain/hivelab/validation/custom-block-validator.ts`

Types already exist in `custom-block.types.ts` (`CodeValidationResult`, `CodeValidationError`, `CodeValidationWarning`).

**What to build:**
```typescript
export function validateCustomBlockCode(code: CustomBlockCode): CodeValidationResult
```

Checks:
1. **Size limits:** HTML < 50KB, CSS < 20KB, JS < 50KB, total < 100KB
2. **Security — JS forbidden patterns:**
   - `eval(`, `Function(`, `setTimeout(` with string arg, `setInterval(` with string arg
   - `document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`
   - `XMLHttpRequest`, `fetch(`, `WebSocket`, `navigator.sendBeacon`
   - `window.open`, `window.location`, `document.domain`
   - `importScripts`, `Worker(`
3. **Security — HTML forbidden patterns:**
   - `<script src=`, `<link rel="stylesheet" href=` (no external resources)
   - `<iframe`, `<object`, `<embed` (no nesting)
   - `on[a-z]+=` (no inline event handlers — use addEventListener in JS)
4. **Structure:** HTML must not be empty. JS should contain `window.HIVE` usage (warning if not).
5. Return `{ valid, errors, warnings, stats: { htmlSize, cssSize, jsSize, totalSize } }`

### Task 5: Custom Block Generation via Groq

**New file:** `packages/core/src/application/hivelab/custom-block-generator.service.ts`

**What to build:**
A service that takes a natural language description and generates a valid `CustomBlockConfig`.

```typescript
export async function generateCustomBlock(opts: {
  prompt: string;
  spaceContext?: { name: string; type: string; memberCount: number };
  model?: string;
}): Promise<{ config: CustomBlockConfig; explanation: string }>
```

**Implementation:**
1. Use Groq SDK (`groq-sdk` package — check if already in dependencies, if not add it)
2. Model: `llama-3.1-70b-versatile` (needs to be good at code gen)
3. System prompt should include:
   - Available HIVE SDK API (`window.HIVE.getState()`, `.setState()`, `.executeAction()`, `.getContext()`, `.notify()`, `.onStateChange()`)
   - Available CSS variables (list from `CustomBlockRenderer.tsx`'s `generateDesignTokensCSS`)
   - Available utility classes (`.hive-btn`, `.hive-btn-primary`, `.hive-btn-secondary`, `.hive-card`, `.hive-input`)
   - Constraints: no network requests, no eval, no external resources, must use HIVE SDK for state
   - Output format: JSON with `{ html, css, js, manifest: { actions, inputs, outputs, stateSchema } }`
4. Parse the response, construct a `CustomBlockConfig` with metadata
5. Run `validateCustomBlockCode()` on the generated code
6. If validation fails, retry once with error feedback in prompt
7. Generate code hash (SHA-256 of html+css+js)

**Environment:** `GROQ_API_KEY` env var. Check if it's in `.env.local` or `.env.development.local`.

### Task 6: API Route for Custom Block Creation

**New file:** `apps/web/src/app/api/tools/create-custom-block/route.ts`

```typescript
// POST /api/tools/create-custom-block
// Body: { prompt: string, spaceId?: string, spaceName?: string, spaceType?: string }
// Returns: { tool: { id, name, description, status }, customBlock: { config } }
```

**Implementation:**
1. Auth required (use `withAuthAndErrors` middleware pattern from other routes)
2. Call `generateCustomBlock()` with prompt and space context
3. Create a tool document in Firestore `tools` collection:
   ```
   {
     name: generated name,
     description: generated description,
     status: 'draft',
     type: 'custom-block',
     elements: [{
       elementId: 'custom-block',
       instanceId: 'custom_block_1',
       config: customBlockConfig,
       position: { x: 0, y: 0 },
       size: { width: 400, height: 300 }
     }],
     connections: [],
     ownerId: userId,
     campusId: campusId,
     createdAt: new Date(),
     updatedAt: new Date(),
     metadata: {
       generatedFrom: 'custom-block-generator',
       prompt: body.prompt,
     }
   }
   ```
4. If `spaceId` provided, also deploy to space (create `placed_tools` doc)
5. Return the tool ID and config

**Reference:** Look at `apps/web/src/app/api/tools/[toolId]/clone/route.ts` for the pattern of creating tool documents.

### Task 7: Intent Engine Route for Custom Block Fallback

**New file:** `apps/web/src/app/api/tools/create-from-intent/route.ts`

```typescript
// POST /api/tools/create-from-intent
// Body: { prompt: string, spaceId?: string, spaceName?: string, spaceType?: string }
// Returns: { tool: { id, name, description }, creationType: 'composition' | 'custom-block' }
```

**Implementation:**
1. Auth required
2. First, try the existing template matcher (`packages/core/src/hivelab/goose/system-prompt.ts` has `ELEMENT_CATALOG`). Check if the prompt maps to a known element type.
3. If a known element matches with high confidence → create a standard tool composition (reuse existing generation logic from `goose-server.ts` or `ai-tool-generator.service.ts`)
4. If no match → fall back to `generateCustomBlock()` from Task 5
5. Return the created tool

This is the two-path creation model: known pattern → element composition, novel → custom block.

## Testing

After implementation, these should work:

1. **Manual custom block test:** Create a tool with a `custom-block` element via the API, deploy to a space, open the space, verify the block renders in the iframe, state persists on refresh.

2. **Generation test:** POST to `/api/tools/create-custom-block` with prompt "Create a simple voting tool where users can upvote or downvote an idea" — should return a working tool.

3. **Intent fallback test:** POST to `/api/tools/create-from-intent` with prompt "I need a tournament bracket for our gaming club" — should fall through to custom block generation since no predefined element matches.

## DO NOT
- Do not rewrite existing working code
- Do not change the CustomBlockRenderer, HIVE SDK, or CSP builder (they're complete)
- Do not add new dependencies without checking if they already exist in the monorepo
- Do not modify the element registry structure
- Do not touch the existing tool runtime hook (it works)
- Do not use Gemini or Vertex AI — use Groq only (or rules-based)
