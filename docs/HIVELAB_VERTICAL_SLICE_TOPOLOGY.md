# HiveLab Vertical Slice Topology
**Frontend → Backend → AI → Database → Analytics Data Flow Documentation**

> **Purpose**: "Trace every byte from click to cloud"
> **Philosophy**: End-to-end visibility for debugging, onboarding, and maintenance
> **Architectural Principle**: Clear data lineage from UI action to Firestore document

---

## Strategic Context

### Why Vertical Slice Documentation Matters

**Traditional component-only docs miss critical questions:**
- "User clicks Deploy — what happens next?"
- "Where does the AI-generated tool get saved?"
- "How does localStorage migrate to Firestore?"
- "What analytics events fire during generation?"

**HiveLab's vertical slice documentation answers:**
- ✅ **Complete data flow**: UI → API → Service → Database → Analytics
- ✅ **State management**: localStorage vs. Firestore, optimistic updates, error recovery
- ✅ **Implementation status**: What works ✅ vs. what's missing ⚠️ vs. what's broken ❌
- ✅ **Code reference map**: UI action → File path → Function → Database collection

### Key Architectural Decisions

**1. Google Gemini 1.5 Pro (Vertex AI) over OpenAI/Claude**
- **Cost**: ~$3/1M tokens vs. GPT-4's $30/1M
- **Firebase integration**: Native Vertex AI support
- **Streaming**: Real-time NDJSON chunks for element-by-element reveal
- **Quota**: Generous free tier for beta launch

**2. NDJSON Streaming over Server-Sent Events (SSE)**
- **Simplicity**: Line-by-line JSON parsing, no EventSource API
- **Type safety**: Each line is valid JSON
- **Debugging**: Inspect chunks in Network tab, log individual messages
- **Trade-off**: No auto-reconnect (SSE has it), but more explicit control

**3. localStorage Pre-Signup Storage**
- **PLG strategy**: "Try before you sign up" — build tools anonymously
- **Capacity**: 10MB (vs. cookies' 4KB) for full ToolComposition JSON
- **Migration**: After signup, tools move from localStorage → Firestore
- **Limit**: 10 tools max to prevent bloat

**4. Optimistic UI with Rollback**
- **UX**: Instant feedback on Deploy, not "Deploying..." spinners
- **Implementation**: Update UI immediately, rollback on API error
- **Trade-off**: Complexity vs. perceived performance

### How to Use This Document

**Debugging Production Issues:**
1. Find the UI component in Section 3 (Frontend Layer)
2. Trace to API endpoint in Section 4 (Backend Layer)
3. Check service logic in Section 5 (AI Service Layer)
4. Verify database writes in Section 7 (Database Persistence)

**Onboarding New Developers:**
1. Read Section 2 (Core Data Model) for schema understanding
2. Follow Section 9 (Complete Data Flow Diagram) for big picture
3. Deep dive into Section 3-8 for implementation details

**Planning New Features:**
1. Check Section 12 (Implementation Gaps) for what's missing
2. Reference Section 10 (Code Reference Map) for where to add code
3. Follow existing patterns from documented vertical slices

---

## Core Data Model

### Firestore Collections

#### `tools/` Collection
**Purpose**: Store all HiveLab tools (drafts, published, archived)

**Schema** (`ToolDocument`):
```typescript
{
  // Identity
  toolId: string;                      // e.g., "tool_abc123"
  name: string;                        // "Event RSVP Manager"
  description: string;                 // "Collect RSVPs with meal preferences"

  // Ownership
  createdBy: string;                   // User ID
  campusId: string;                    // "ub-buffalo" (REQUIRED for isolation)

  // Content
  elements: CanvasElement[];           // Array of element instances
  connections: ElementConnection[];    // Data flow wiring
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';

  // Lifecycle
  status: 'draft' | 'published' | 'archived';
  isTemplate: boolean;                 // Featured in marketplace

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;

  // Stats
  viewCount: number;
  deployCount: number;
  responseCount: number;

  // AI Generation (if applicable)
  generatedByAI?: boolean;
  originalPrompt?: string;             // User's AI prompt
  generationTimestamp?: Timestamp;
}
```

**Example Document**:
```json
{
  "toolId": "tool_rsvp_001",
  "name": "Event RSVP Manager",
  "description": "Collect RSVPs with meal preferences and dietary restrictions",
  "createdBy": "user_alice",
  "campusId": "ub-buffalo",
  "elements": [
    {
      "elementId": "form-builder",
      "instanceId": "elem_001",
      "config": {
        "fields": [
          {"name": "name", "type": "text", "required": true},
          {"name": "email", "type": "email", "required": true},
          {"name": "meal", "type": "select", "options": ["Vegan", "Vegetarian", "No Preference"]}
        ]
      },
      "position": {"x": 0, "y": 0},
      "size": {"width": 280, "height": 200}
    },
    {
      "elementId": "result-list",
      "instanceId": "elem_002",
      "config": {"itemsPerPage": 20},
      "position": {"x": 320, "y": 0},
      "size": {"width": 280, "height": 300}
    }
  ],
  "connections": [
    {
      "from": {"instanceId": "elem_001", "output": "submittedData"},
      "to": {"instanceId": "elem_002", "input": "items"}
    }
  ],
  "layout": "flow",
  "status": "published",
  "isTemplate": false,
  "createdAt": "2025-11-15T10:30:00Z",
  "updatedAt": "2025-11-15T11:00:00Z",
  "publishedAt": "2025-11-15T11:00:00Z",
  "viewCount": 45,
  "deployCount": 3,
  "responseCount": 127,
  "generatedByAI": true,
  "originalPrompt": "Create an event RSVP form with meal preferences",
  "generationTimestamp": "2025-11-15T10:30:00Z"
}
```

---

#### `deployments/` Collection
**Purpose**: Track tool deployments to spaces

**Schema** (`DeploymentDocument`):
```typescript
{
  deploymentId: string;                // e.g., "deploy_xyz789"
  toolId: string;                      // Reference to tools/{toolId}
  spaceId: string;                     // Space where tool is deployed
  campusId: string;                    // "ub-buffalo"

  // Deployment settings
  placement: 'pinned' | 'rail' | 'tab';
  visibility: 'all_members' | 'leaders_only';
  isActive: boolean;

  // Metadata
  deployedBy: string;                  // User ID
  deployedAt: Timestamp;
  deactivatedAt?: Timestamp;

  // Stats
  interactionCount: number;            // Total interactions
  uniqueUsers: string[];               // User IDs who interacted
}
```

---

#### `tool_responses/` Collection
**Purpose**: Store user responses from deployed tools

**Schema** (`ToolResponseDocument`):
```typescript
{
  responseId: string;
  toolId: string;
  deploymentId: string;
  campusId: string;

  // Response data
  data: Record<string, any>;           // Element outputs (e.g., form fields)
  submittedBy: string;                 // User ID
  submittedAt: Timestamp;

  // Metadata
  elementInstanceId: string;           // Which element captured this
  isAnonymous: boolean;
}
```

---

#### `analytics/` Collection (HiveLab Events)
**Purpose**: Track user interactions for analytics dashboard

**Schema** (`AnalyticsEventDocument`):
```typescript
{
  eventId: string;
  eventType: 'ai_prompt_submitted' | 'tool_generated' | 'tool_deployed' | 'tool_interacted' | 'generation_failed';

  // Context
  userId: string;
  campusId: string;
  timestamp: Timestamp;

  // Event-specific payload
  metadata: {
    toolId?: string;
    prompt?: string;
    generationTimeMs?: number;
    errorCode?: string;
    // ... varies by eventType
  };
}
```

---

### Collection Relationships

```
users/{userId}
    ↓ (createdBy)
tools/{toolId} ──────────────→ deployments/{deploymentId}
    ↓ (toolId)                          ↓ (deploymentId)
tool_responses/{responseId}  ←──────────┘
    ↓ (generates)
analytics/{eventId}
```

**Query Patterns**:
- **User's tools**: `tools/` where `createdBy == userId` and `campusId == 'ub-buffalo'`
- **Space deployments**: `deployments/` where `spaceId == spaceId` and `isActive == true`
- **Tool responses**: `tool_responses/` where `toolId == toolId` order by `submittedAt desc`

---

## AI Generation Vertical Slice (PRIMARY FOCUS)

### Overview

The AI Generation flow is the most complex and unique vertical slice in HiveLab. It demonstrates:
- **Real-time streaming**: User sees tool build element-by-element (not all at once)
- **Multi-layer architecture**: UI → API → AI Service → Gemini API → Streaming response
- **State transitions**: localStorage (pre-signup) → Firestore (post-signup)
- **Error handling**: Network failures, JSON parsing, validation failures

**User Journey**:
```
1. User lands on / (AILandingPage)
   ↓
2. Watches auto-play demo (Event RSVP generation)
   ↓
3. Clicks "Build Your Own" → Prompt input appears
   ↓
4. Enters custom prompt → Watches streaming generation
   ↓
5. Reviews generated tool → Clicks "Deploy"
   ↓
6. Signup gate modal (if unauthenticated)
   ↓
7. Signs up with @buffalo.edu → Tool saved to Firestore
   ↓
8. Deploys to space → Success
```

---

### 3.1 Frontend Layer

#### AILandingPage Component

**File**: `packages/ui/src/pages/hivelab/AILandingPage.tsx`

**Purpose**: PLG-first landing experience with AI tool generation

**Modes**:
- **`demo`**: Auto-play demo on mount, show "Build Your Own" CTA
- **`build`**: User enters custom prompt, watches generation
- **`review`**: Generation complete, show Deploy/Edit/Start Over actions

**State Management**:
```typescript
const [mode, setMode] = useState<'demo' | 'build' | 'review'>('demo');
const [showSignupGate, setShowSignupGate] = useState(false);

const { state, generate, reset } = useStreamingGeneration({
  onComplete: (composition) => {
    saveLocalTool(composition);  // Pre-signup localStorage
    setMode('review');
  },
  onError: (error) => {
    toast.error(`Generation failed: ${error}`);
  }
});
```

**Component Tree**:
```
<AILandingPage>
  ├─ <AIPromptInput variant="hero" />  (if mode == 'build')
  ├─ <StreamingCanvasView />            (shows elements as they're generated)
  ├─ <ActionButtons>                    (if mode == 'review')
  │   ├─ <Button>Deploy</Button>
  │   ├─ <Button>Edit</Button>
  │   └─ <Button>Start Over</Button>
  └─ <SignupGateModal open={showSignupGate} />
</AILandingPage>
```

**Props**:
```typescript
interface AILandingPageProps {
  initialMode?: 'demo' | 'build';
  onToolCreated?: (tool: ToolComposition) => void;
  demoPrompt?: string;                    // Default: "Create event RSVP..."
  showSuggestions?: boolean;              // Show demo prompt chips
}
```

**Implementation Status**:
- ✅ **Demo auto-play**: Triggers on mount if `!hasSeenDemo`
- ✅ **Custom prompt input**: Hero-style ChatGPT input
- ✅ **Streaming canvas**: Real-time element-by-element rendering
- ✅ **localStorage persistence**: Saves tools before signup (10-tool limit)
- ⚠️ **Signup gate modal**: UI complete, but signup API integration pending
- ⚠️ **localStorage → Firestore migration**: No migration endpoint implemented yet
- ❌ **Analytics tracking**: No events fired yet (`ai_prompt_submitted`, `tool_generated`)

**Key Functions**:
```typescript
// Auto-play demo on mount
useEffect(() => {
  if (mode === 'demo' && !hasSeenDemo) {
    generate({ prompt: DEMO_PROMPTS[0] });
    localStorage.setItem('hivelab_demo_seen', 'true');
  }
}, [mode]);

// Handle Deploy click (shows signup gate if unauthenticated)
const handleDeploy = () => {
  if (!isAuthenticated) {
    setShowSignupGate(true);
  } else {
    // TODO: Trigger deploy flow
  }
};
```

---

#### AIPromptInput Component

**File**: `packages/ui/src/components/hivelab/AIPromptInput.tsx`

**Purpose**: ChatGPT-style prompt input with demo suggestions

**Variants**:
- **`hero`**: Large landing page input (120px-300px auto-resize)
- **`inline`**: Compact canvas header input

**Features**:
- Auto-resize textarea (grows as user types)
- Character counter (1000 max)
- Demo prompt suggestions (4 chips)
- Gold gradient border on focus
- Submit on Enter (Shift+Enter for new line)

**Props**:
```typescript
interface AIPromptInputProps {
  onSubmit: (prompt: string) => void;
  isGenerating?: boolean;
  status?: string;                      // "Adding search input..."
  demoPrompts?: string[];
  showSuggestions?: boolean;
  variant?: 'hero' | 'inline';
}
```

**Implementation**:
```typescript
const [prompt, setPrompt] = useState('');
const [charCount, setCharCount] = useState(0);
const textareaRef = useRef<HTMLTextAreaElement>(null);

const handleSubmit = () => {
  if (prompt.trim().length === 0 || prompt.length > 1000) return;
  onSubmit(prompt);
  setPrompt('');  // Clear after submit
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
};
```

**Implementation Status**:
- ✅ **Auto-resize**: Textarea grows/shrinks based on content
- ✅ **Character validation**: 1-1000 chars, shows counter
- ✅ **Demo prompts**: 4 pre-loaded suggestions, clickable
- ✅ **Keyboard shortcuts**: Enter to submit, Shift+Enter for new line
- ✅ **Loading state**: Spinner + status text while generating
- ❌ **Voice input**: No speech-to-text integration

---

#### useStreamingGeneration Hook

**File**: `packages/hooks/src/use-streaming-generation.ts`

**Purpose**: React hook for consuming NDJSON streaming API with real-time state updates

**State**:
```typescript
interface StreamingState {
  isGenerating: boolean;
  currentStatus: string;                // "Adding search input..."
  elements: CanvasElement[];            // Elements added so far
  composition: ToolComposition | null;  // Final composition
  error: string | null;
  progress: number;                     // 0-100
}
```

**API**:
```typescript
const { state, generate, cancel, reset } = useStreamingGeneration({
  onElementAdded: (element, status) => {
    console.log('Element added:', element);
  },
  onComplete: (composition) => {
    console.log('Generation complete:', composition);
  },
  onError: (error) => {
    console.error('Generation failed:', error);
  },
  onStatusUpdate: (status) => {
    console.log('Status:', status);
  }
});

// Start generation
await generate({ prompt: 'Create an event RSVP form' });

// Cancel mid-generation
cancel();

// Reset state
reset();
```

**Streaming Flow**:
```typescript
async function generate({ prompt }: { prompt: string }) {
  setState({ isGenerating: true, error: null, elements: [], composition: null });

  const response = await fetch('/api/tools/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';  // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const chunk = JSON.parse(line);

        if (chunk.type === 'element_added') {
          setState(prev => ({
            ...prev,
            elements: [...prev.elements, chunk.element],
            currentStatus: chunk.status || '',
            progress: Math.min((prev.elements.length + 1) * 20, 100)
          }));
          onElementAdded?.(chunk.element, chunk.status);
          onStatusUpdate?.(chunk.status);
        } else if (chunk.type === 'generation_complete') {
          setState({
            isGenerating: false,
            composition: chunk.composition,
            currentStatus: 'Complete!',
            progress: 100
          });
          onComplete?.(chunk.composition);
        } else if (chunk.type === 'error') {
          setState({ error: chunk.message, isGenerating: false });
          onError?.(chunk.message);
        }
      } catch (parseError) {
        console.warn('Failed to parse chunk:', line, parseError);
        // Continue - partial chunks expected
      }
    }
  }
}
```

**Implementation Status**:
- ✅ **NDJSON parsing**: Line-by-line chunk processing
- ✅ **Progress tracking**: 0-100% based on element count
- ✅ **Error recovery**: Graceful handling of partial chunks, network errors
- ✅ **Abort support**: `cancel()` method to abort mid-generation
- ✅ **Callbacks**: `onElementAdded`, `onComplete`, `onError`, `onStatusUpdate`
- ⚠️ **Retry logic**: No automatic retry on transient failures
- ❌ **Reconnection**: No auto-reconnect on network drop (SSE has this)

---

#### StreamingCanvasView Component

**File**: `packages/ui/src/components/hivelab/StreamingCanvasView.tsx`

**Purpose**: Real-time visual feedback as AI generates tool

**Features**:
- **Element-by-element rendering**: Framer Motion fade-in + slide animations
- **"Just added" indicator**: Highlighted gold border on newest element (3s duration)
- **Progress bar**: Visual 0-100% progress at top
- **Connection visualization**: SVG lines showing data flow between elements
- **Live preview**: Renders actual element UI (not placeholders)

**Animation Timing**:
```typescript
const elementVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.2  // 200ms delay between elements
    }
  }
};
```

**Implementation**:
```typescript
<div className="relative w-full h-[600px] bg-secondary rounded-lg overflow-hidden">
  {/* Progress bar */}
  <div className="absolute top-0 left-0 right-0 h-1 bg-border-subtle">
    <motion.div
      className="h-full bg-gradient-to-r from-gold-start to-gold-end"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.3 }}
    />
  </div>

  {/* Canvas */}
  <motion.div
    className="p-8 space-y-4"
    variants={staggerChildren}
    initial="hidden"
    animate="visible"
  >
    {elements.map((element, index) => (
      <motion.div
        key={element.instanceId}
        variants={elementVariants}
        className={cn(
          "relative p-4 rounded-lg border",
          index === elements.length - 1
            ? "border-gold-start shadow-gold"  // Just added
            : "border-border-subtle"
        )}
      >
        <ElementRenderer element={element} />
      </motion.div>
    ))}
  </motion.div>

  {/* Connection lines (SVG) */}
  <svg className="absolute inset-0 pointer-events-none">
    {connections.map(conn => (
      <ConnectionLine key={conn.id} from={conn.from} to={conn.to} />
    ))}
  </svg>
</div>
```

**Implementation Status**:
- ✅ **Real-time rendering**: Elements appear as chunks arrive
- ✅ **Framer Motion animations**: 60fps hardware-accelerated
- ✅ **"Just added" highlight**: Gold border + glow on newest element
- ✅ **Progress bar**: Animates 0-100%
- ⚠️ **Connection lines**: SVG rendering implemented, but positioning buggy on dynamic layout
- ❌ **Zoom/pan controls**: No canvas navigation for large tools

---

### 3.2 Backend Layer

#### `/api/tools/generate` Endpoint

**File**: `apps/web/src/app/api/tools/generate/route.ts`

**Purpose**: Streaming AI tool generation via Gemini API

**Request**:
```http
POST /api/tools/generate
Content-Type: application/json

{
  "prompt": "Create an event RSVP form with meal preferences",
  "templateId": "template_event_001",  // Optional: Start from template
  "constraints": {
    "maxElements": 5,                   // Optional: Limit complexity
    "allowedCategories": ["input", "display"]  // Optional: Restrict element types
  }
}
```

**Request Schema** (Zod):
```typescript
const requestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  templateId: z.string().optional(),
  constraints: z.object({
    maxElements: z.number().min(1).max(10).optional(),
    allowedCategories: z.array(z.enum(['input', 'display', 'filter', 'action'])).optional()
  }).optional()
});
```

**Response**: `application/x-ndjson` (Newline-Delimited JSON)

Each line is a JSON chunk:

**Chunk 1: Element Added**
```json
{"type":"element_added","element":{"elementId":"form-builder","instanceId":"elem_001","config":{...},"position":{"x":0,"y":0}},"status":"Adding RSVP form..."}
```

**Chunk 2: Element Added**
```json
{"type":"element_added","element":{"elementId":"result-list","instanceId":"elem_002","config":{...},"position":{"x":320,"y":0}},"status":"Adding attendee list..."}
```

**Chunk 3: Generation Complete**
```json
{"type":"generation_complete","composition":{"id":"tool_abc123","name":"Event RSVP Manager","description":"...","elements":[...],"connections":[...],"layout":"flow"}}
```

**Error Chunk**:
```json
{"type":"error","message":"Gemini API quota exceeded","code":"QUOTA_EXCEEDED"}
```

**Implementation**:
```typescript
import { withAuthAndErrors, getUserId, respond } from '@/lib/middleware';
import { AIToolGeneratorService } from '@hive/core/application/hivelab/ai-tool-generator.service';

export const POST = withAuthAndErrors(async (request, context, respond) => {
  // Note: Auth optional for demo mode (anonymous users can try)
  const userId = getUserId(request) || 'anonymous';

  const data = await parseJsonBody(request);
  const validated = requestSchema.parse(data);

  // Create streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const generator = new AIToolGeneratorService();

        for await (const chunk of generator.generateToolStreaming({
          prompt: validated.prompt,
          userId,
          campusId: 'ub-buffalo',
          constraints: validated.constraints
        })) {
          // Send NDJSON chunk
          controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
        }

        controller.close();
      } catch (error) {
        const errorChunk = {
          type: 'error',
          message: error.message,
          code: error.code || 'GENERATION_FAILED'
        };
        controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + '\n'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
});

// Alternative: GET for demo prompts metadata
export const GET = async (request: Request) => {
  return Response.json({
    demoPrompts: [
      'Create an event RSVP form with meal preferences',
      'Build an anonymous feedback tool for club meetings',
      'Make a room finder for group study sessions',
      'Design a poll for voting on club logo designs'
    ],
    elementCatalog: ElementRegistry.getInstance().getAllElements(),
    version: '1.0.0'
  });
};
```

**Implementation Status**:
- ✅ **Streaming response**: NDJSON chunks emitted as Gemini generates
- ✅ **Request validation**: Zod schema ensures 1-1000 char prompt
- ✅ **Error handling**: Try/catch with error chunk emission
- ⚠️ **Authentication**: Currently optional for demo mode, should be required for production
- ⚠️ **Rate limiting**: No rate limiting implemented yet (target: 60 req/min per IP)
- ⚠️ **Quota monitoring**: No Gemini API quota tracking
- ❌ **Analytics tracking**: No event fired on generation start/complete
- ❌ **Template support**: `templateId` parameter accepted but not implemented

---

### 3.3 AI Service Layer

#### AIToolGeneratorService

**File**: `packages/core/src/application/hivelab/ai-tool-generator.service.ts`

**Purpose**: Core AI generation logic using Google Gemini API

**Class Methods**:

**1. `generateTool(options)` - Non-streaming**
```typescript
async generateTool(options: {
  prompt: string;
  userId: string;
  campusId: string;
  constraints?: GenerationConstraints;
}): Promise<ToolComposition> {
  const systemPrompt = buildSystemPrompt(options.constraints);
  const userPrompt = buildUserPrompt(options.prompt);

  const response = await geminiClient.generateContent({
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxOutputTokens: 4096,
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
    ]
  });

  const composition = parseGeminiResponse(response.text);
  validateComposition(composition);  // Throws if invalid

  return composition;
}
```

**2. `generateToolStreaming(options)` - Streaming ⭐**
```typescript
async *generateToolStreaming(options: {
  prompt: string;
  userId: string;
  campusId: string;
  constraints?: GenerationConstraints;
}): AsyncGenerator<StreamChunk> {
  const systemPrompt = buildSystemPrompt(options.constraints);
  const userPrompt = buildUserPrompt(options.prompt);

  const stream = await geminiClient.streamGenerateContent({
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxOutputTokens: 4096,
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
    ]
  });

  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk.text();

    // Try to parse element_added messages from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';  // Keep incomplete line

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);

        if (parsed.type === 'element_added') {
          yield {
            type: 'element_added',
            element: parsed.element,
            status: parsed.status
          };
        }
      } catch (e) {
        // Continue - Gemini may output partial JSON
      }
    }
  }

  // Final parse: Extract complete composition from buffer
  try {
    const finalResponse = JSON.parse(buffer);

    if (finalResponse.type === 'generation_complete') {
      const composition = finalResponse.composition;
      validateComposition(composition);

      yield {
        type: 'generation_complete',
        composition
      };
    }
  } catch (e) {
    yield {
      type: 'error',
      message: 'Failed to parse final composition',
      code: 'PARSE_ERROR'
    };
  }
}
```

**Helper Functions**:

**`buildSystemPrompt(constraints)`**:
```typescript
function buildSystemPrompt(constraints?: GenerationConstraints): string {
  const elements = ElementRegistry.getInstance().getAllElements();

  return `You are an expert at generating campus tool configurations for HIVE.

Available Elements:
${elements.map(el => `- ${el.id}: ${el.description}`).join('\n')}

Output Format: Stream JSON chunks in this format:

{"type": "element_added", "element": {...element config...}, "status": "Adding search input..."}
{"type": "element_added", "element": {...element config...}, "status": "Adding result list..."}
{"type": "generation_complete", "composition": {...complete tool...}}

Rules:
- Use 2-5 elements (max ${constraints?.maxElements || 5})
- Input elements on left (x: 0-280), display elements on right (x: 320+)
- Connect element outputs to inputs via connections array
- Optimize for ${constraints?.allowedCategories?.join(', ') || 'all categories'}

Few-Shot Examples:
${getFewShotExamples()}
`;
}
```

**`parseGeminiResponse(text)`**:
```typescript
function parseGeminiResponse(text: string): ToolComposition {
  // Gemini may wrap JSON in markdown code blocks
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);

  if (!jsonMatch) {
    throw new Error('No JSON found in Gemini response');
  }

  const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

  return {
    id: `tool_${generateId()}`,
    name: parsed.name,
    description: parsed.description,
    elements: parsed.elements,
    connections: parsed.connections || [],
    layout: parsed.layout || 'flow'
  };
}
```

**`validateComposition(composition)`**:
```typescript
function validateComposition(composition: ToolComposition): void {
  const schema = z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().max(500),
    elements: z.array(z.object({
      elementId: z.string(),
      instanceId: z.string(),
      config: z.record(z.any()),
      position: z.object({ x: z.number(), y: z.number() }),
      size: z.object({ width: z.number(), height: z.number() }).optional()
    })).min(1).max(10),
    connections: z.array(z.object({
      from: z.object({ instanceId: z.string(), output: z.string() }),
      to: z.object({ instanceId: z.string(), input: z.string() })
    })),
    layout: z.enum(['grid', 'flow', 'tabs', 'sidebar'])
  });

  schema.parse(composition);  // Throws if invalid
}
```

**Implementation Status**:
- ✅ **Gemini API integration**: Vertex AI client configured
- ✅ **Streaming support**: `streamGenerateContent` with async generator
- ✅ **System prompt**: 3000+ token prompt with element catalog
- ✅ **Few-shot examples**: 2 complete tool generations included
- ✅ **JSON parsing**: Handles markdown-wrapped JSON from Gemini
- ✅ **Validation**: Zod schema ensures valid composition
- ⚠️ **Error handling**: Basic try/catch, but no retry logic for transient failures
- ⚠️ **Quota monitoring**: No tracking of API usage/quota
- ❌ **Cost tracking**: No cost per generation calculation
- ❌ **Multi-turn refinement**: No support for "make it better" follow-up prompts

---

### 3.4 Prompt Engineering System

**File**: `packages/core/src/application/hivelab/prompts/tool-generation.prompt.ts`

**System Prompt Structure** (3000+ tokens):

**1. Element Catalog** (10 elements with specs):
```
- search-input: Autocomplete search with suggestions
  Config: { placeholder, showSuggestions, debounceMs }
  Outputs: { query: string }
  Use cases: Filter lists, find users, search content

- filter-selector: Multi-select filters with categories
  Config: { filters: Array<{label, options}> }
  Outputs: { selectedFilters: Record<string, string[]> }
  Use cases: Narrow results, category selection

... (8 more elements)
```

**2. Layout Rules**:
```
- Input elements (search, filter, date-picker) → Left side (x: 0-280)
- Display elements (result-list, chart-display) → Right side (x: 320+)
- Form elements → Full width if standalone, left side if paired with results
- Spacing: 40px horizontal gap, 20px vertical gap
```

**3. Connection Patterns**:
```
Common patterns:
- search-input.query → result-list.filter
- filter-selector.selectedFilters → result-list.filter
- form-builder.submittedData → result-list.items
- date-picker.selectedDate → result-list.filter
```

**4. Campus Context Examples**:
```
Student org use cases:
- Event RSVPs: form-builder + result-list (attendees)
- Room booking: date-picker + filter-selector + result-list (available rooms)
- Anonymous feedback: form-builder (anonymous) + chart-display (sentiment)
- Poll voting: form-builder (single choice) + chart-display (results)
```

**5. Streaming Protocol Instructions**:
```
Output format: NDJSON (one JSON object per line)

Step 1: Emit element_added for each element
{"type": "element_added", "element": {...}, "status": "Adding search input..."}

Step 2: Emit generation_complete with full composition
{"type": "generation_complete", "composition": {...}}

Note: Do NOT emit intermediate status messages without elements.
```

**6. Few-Shot Examples** (2 complete tools):

**Example 1: Event RSVP Tool**
```json
Prompt: "Create an event RSVP form with meal preferences"

Response:
{"type": "element_added", "element": {"elementId": "form-builder", "instanceId": "elem_001", "config": {"fields": [{"name": "name", "type": "text"}, {"name": "email", "type": "email"}, {"name": "meal", "type": "select", "options": ["Vegan", "Vegetarian", "No Preference"]}]}, "position": {"x": 0, "y": 0}}, "status": "Adding RSVP form..."}
{"type": "element_added", "element": {"elementId": "result-list", "instanceId": "elem_002", "config": {"itemsPerPage": 20}, "position": {"x": 320, "y": 0}}, "status": "Adding attendee list..."}
{"type": "generation_complete", "composition": {"name": "Event RSVP Manager", "description": "Collect RSVPs with meal preferences", "elements": [...], "connections": [{"from": {"instanceId": "elem_001", "output": "submittedData"}, "to": {"instanceId": "elem_002", "input": "items"}}], "layout": "flow"}}
```

**Example 2: Room Booking Tool**
```json
Prompt: "Make a room finder for group study sessions"

Response:
{"type": "element_added", "element": {"elementId": "date-picker", "instanceId": "elem_001", "config": {"mode": "range", "minDate": "today"}, "position": {"x": 0, "y": 0}}, "status": "Adding date selector..."}
{"type": "element_added", "element": {"elementId": "filter-selector", "instanceId": "elem_002", "config": {"filters": [{"label": "Building", "options": ["Capen", "NSC", "Student Union"]}, {"label": "Capacity", "options": ["2-4", "5-10", "10+"]}]}, "position": {"x": 0, "y": 120}}, "status": "Adding location filters..."}
{"type": "element_added", "element": {"elementId": "result-list", "instanceId": "elem_003", "config": {"itemsPerPage": 15, "showMap": true}, "position": {"x": 320, "y": 0}}, "status": "Adding room results..."}
{"type": "generation_complete", "composition": {...}}
```

**Demo Prompts** (Pre-loaded suggestions):
```typescript
export const DEMO_PROMPTS = [
  'Create an event RSVP form with meal preferences and dietary restrictions',
  'Build an anonymous feedback tool for club meetings with sentiment analysis',
  'Make a room finder for group study sessions with availability calendar',
  'Design a poll for voting on club logo designs with image upload'
];
```

**Implementation Status**:
- ✅ **Element catalog**: All 10 elements documented with specs
- ✅ **Layout rules**: Clear positioning guidelines
- ✅ **Connection patterns**: Common data flow examples
- ✅ **Campus context**: Student org-specific use cases
- ✅ **Streaming protocol**: Clear NDJSON format instructions
- ✅ **Few-shot examples**: 2 complete generations included
- ⚠️ **Prompt versioning**: No version tracking for A/B testing
- ❌ **Multi-language**: English-only prompts (no Spanish, Chinese, etc.)

---

### 3.5 State Management

#### localStorage Strategy (Pre-Signup)

**Purpose**: Allow anonymous users to create tools before signing up (PLG strategy)

**Key**: `hivelab_local_tools`
**Value**: JSON array of `ToolComposition` objects

**Implementation** (`packages/ui/src/lib/hivelab/local-tool-storage.ts`):

```typescript
const LOCAL_STORAGE_KEY = 'hivelab_local_tools';
const MAX_LOCAL_TOOLS = 10;

export function saveLocalTool(composition: ToolComposition): void {
  const tools = getLocalTools();

  // Check limit
  if (tools.length >= MAX_LOCAL_TOOLS) {
    throw new Error(`Maximum ${MAX_LOCAL_TOOLS} tools allowed before signup`);
  }

  tools.push({
    ...composition,
    createdAt: new Date().toISOString(),
    status: 'draft'
  });

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tools));
}

export function getLocalTools(): ToolComposition[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function clearLocalTools(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function exportToJSON(): string {
  return JSON.stringify(getLocalTools(), null, 2);
}

export function importFromJSON(json: string): ToolComposition[] {
  const tools = JSON.parse(json);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tools));
  return tools;
}
```

**Usage Pattern**:
```typescript
// After AI generation completes (anonymous user)
const { state } = useStreamingGeneration({
  onComplete: (composition) => {
    if (!isAuthenticated) {
      saveLocalTool(composition);  // Store locally
      toast.success('Tool saved! Sign up to deploy.');
    } else {
      // Save to Firestore immediately
      await createTool(composition);
    }
  }
});
```

**Implementation Status**:
- ✅ **Save/load**: Basic localStorage CRUD operations
- ✅ **10-tool limit**: Prevents bloat
- ✅ **Export/import**: JSON download/upload for backup
- ⚠️ **localStorage → Firestore migration**: **NOT IMPLEMENTED**
  - **Missing**: `/api/tools/migrate` endpoint
  - **Missing**: Auth state change listener to trigger migration
  - **Missing**: Deduplication logic (avoid saving same tool twice)
- ⚠️ **Session recovery**: Works across page refresh, but not across browsers
- ❌ **Conflict resolution**: If user creates tool on mobile then desktop, no merge logic

---

#### Firestore State Management (Post-Signup)

**Real-time Listeners**:
```typescript
// Listen to user's tools
const unsubscribe = onSnapshot(
  query(
    collection(db, 'tools'),
    where('createdBy', '==', userId),
    where('campusId', '==', 'ub-buffalo'),
    orderBy('updatedAt', 'desc')
  ),
  (snapshot) => {
    const tools = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    setTools(tools);
  }
);
```

**Optimistic Updates** (Deploy flow):
```typescript
async function deployTool(toolId: string, spaceId: string) {
  // 1. Optimistic UI update
  setDeploymentStatus('deploying');
  updateUI({ deployed: true });  // Instant feedback

  try {
    // 2. API call
    const response = await fetch(`/api/tools/${toolId}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ spaceId })
    });

    if (!response.ok) throw new Error('Deploy failed');

    // 3. Server confirms, UI already updated
    setDeploymentStatus('success');
  } catch (error) {
    // 4. Rollback on error
    updateUI({ deployed: false });  // Undo optimistic update
    setDeploymentStatus('error');
    toast.error(`Deploy failed: ${error.message}`);
  }
}
```

**Implementation Status**:
- ✅ **Real-time listeners**: onSnapshot for live updates
- ✅ **Optimistic updates**: Immediate UI feedback, rollback on error
- ⚠️ **Error recovery**: Basic rollback, but no exponential backoff retry
- ❌ **Offline support**: No offline-first Firestore persistence enabled
- ❌ **Conflict resolution**: No operational transform for concurrent edits

---

### 3.6 Database Persistence

#### When Tool is Saved to Firestore

**Authenticated User** (immediate save):
```typescript
// After AI generation completes (authenticated user)
const { state } = useStreamingGeneration({
  onComplete: async (composition) => {
    if (isAuthenticated) {
      const toolRef = await addDoc(collection(db, 'tools'), {
        ...composition,
        createdBy: userId,
        campusId: 'ub-buffalo',  // REQUIRED
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
        deployCount: 0,
        responseCount: 0,
        generatedByAI: true,
        originalPrompt: prompt,
        generationTimestamp: serverTimestamp()
      });

      toast.success('Tool created!');
      router.push(`/tools/${toolRef.id}/edit`);
    }
  }
});
```

**Anonymous User** (deferred save via migration):
```typescript
// CURRENTLY NOT IMPLEMENTED - TODO
async function migrateLocalToolsToFirestore(userId: string) {
  const localTools = getLocalTools();

  const batch = writeBatch(db);

  for (const tool of localTools) {
    const toolRef = doc(collection(db, 'tools'));
    batch.set(toolRef, {
      ...tool,
      createdBy: userId,
      campusId: 'ub-buffalo',
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  await batch.commit();
  clearLocalTools();  // Clear localStorage after successful migration

  return localTools.length;
}

// Trigger on auth state change
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const count = await migrateLocalToolsToFirestore(user.uid);
    if (count > 0) {
      toast.success(`${count} tool(s) synced to your account!`);
    }
  }
});
```

**Draft vs. Published States**:
- **`draft`**: Tool created but not deployed (default after AI generation)
- **`published`**: Tool deployed to at least one space (after first deployment)
- **`archived`**: Soft-deleted (user clicked "Delete", can be restored)

**Campus Isolation Enforcement**:
```typescript
// Firestore Security Rules (infrastructure/firebase/firestore.rules)
match /tools/{toolId} {
  allow create: if request.auth != null
                && request.resource.data.campusId == 'ub-buffalo'
                && request.resource.data.createdBy == request.auth.uid;

  allow read: if resource.data.campusId == 'ub-buffalo'
              && (resource.data.createdBy == request.auth.uid
                  || resource.data.status == 'published');

  allow update: if request.auth != null
                && resource.data.createdBy == request.auth.uid
                && request.resource.data.campusId == 'ub-buffalo';

  allow delete: if request.auth != null
                && resource.data.createdBy == request.auth.uid;
}
```

**Implementation Status**:
- ✅ **Authenticated save**: Immediate Firestore write after generation
- ✅ **Campus isolation**: `campusId: 'ub-buffalo'` enforced in security rules
- ✅ **Draft status**: Default to `draft` after creation
- ⚠️ **localStorage migration**: **NOT IMPLEMENTED** (critical gap)
- ⚠️ **Batch writes**: Migration uses batch (good), but no error handling
- ❌ **Deduplication**: No check to avoid saving same tool twice
- ❌ **Published status auto-update**: Should flip to `published` on first deployment (not implemented)

---

### 3.7 Analytics Tracking

#### Events to Track (Defined, Not Implemented)

**AI Generation Events**:
```typescript
// 1. Prompt submission
trackEvent('ai_prompt_submitted', {
  promptLength: prompt.length,
  isAuthenticated: !!userId,
  timestamp: Date.now()
});

// 2. Generation complete
trackEvent('tool_generated', {
  toolId: composition.id,
  elementCount: composition.elements.length,
  generationTimeMs: endTime - startTime,
  originalPrompt: prompt,
  isAuthenticated: !!userId
});

// 3. Generation failed
trackEvent('generation_failed', {
  errorCode: error.code,
  errorMessage: error.message,
  promptLength: prompt.length,
  isAuthenticated: !!userId
});
```

**Tool Lifecycle Events**:
```typescript
// 4. Tool deployed
trackEvent('tool_deployed', {
  toolId: toolId,
  spaceId: spaceId,
  wasGenerated: tool.generatedByAI,
  elementCount: tool.elements.length
});

// 5. Tool interacted
trackEvent('tool_interacted', {
  toolId: toolId,
  deploymentId: deploymentId,
  elementInstanceId: instanceId,
  actionType: 'submit' | 'click' | 'input'
});
```

**Analytics Collection** (Firestore):
```typescript
// Write to analytics/{eventId}
await addDoc(collection(db, 'analytics'), {
  eventType: 'tool_generated',
  userId: userId,
  campusId: 'ub-buffalo',
  timestamp: serverTimestamp(),
  metadata: {
    toolId: composition.id,
    elementCount: composition.elements.length,
    generationTimeMs: 3240,
    originalPrompt: 'Create event RSVP form...'
  }
});
```

**Aggregation** (Cron job):
```typescript
// Cloud Function runs daily at midnight
export const aggregateToolStats = onSchedule('0 0 * * *', async () => {
  const analytics = await getDocs(
    query(
      collection(db, 'analytics'),
      where('eventType', '==', 'tool_generated'),
      where('timestamp', '>=', yesterday),
      where('timestamp', '<', today)
    )
  );

  const stats = {
    totalGenerations: analytics.size,
    avgGenerationTimeMs: average(analytics.docs.map(d => d.data().metadata.generationTimeMs)),
    avgElementCount: average(analytics.docs.map(d => d.data().metadata.elementCount)),
    topPrompts: getMostFrequent(analytics.docs.map(d => d.data().metadata.originalPrompt))
  };

  await setDoc(doc(db, 'analytics_aggregated', today.toISOString()), stats);
});
```

**Implementation Status**:
- ❌ **Event tracking**: **NOT IMPLEMENTED** (no `trackEvent` calls in codebase)
- ❌ **Analytics collection**: No writes to `analytics/` collection
- ❌ **Aggregation**: No cron job for daily stats
- ❌ **Dashboard UI**: No `/tools/analytics` page yet
- ⚠️ **Schema defined**: TypeScript interfaces exist for events, but unused

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AI GENERATION FLOW                          │
│                  (Prompt → Tool → Deploy → Analytics)               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│  USER       │
│ (Anonymous  │
│  or Authed) │
└─────┬───────┘
      │
      │ 1. Lands on /
      ├──────────────────────────────────────────────────────────────┐
      │                                                              │
      ▼                                                              │
┌──────────────────┐                                                │
│ AILandingPage    │ (packages/ui/src/pages/hivelab/AILandingPage) │
│                  │                                                │
│ Mode: demo       │ ◄── Auto-play demo on mount                   │
│                  │                                                │
│ ┌──────────────┐ │                                                │
│ │ StreamingCanvas│ Shows "Creating Event RSVP..."                │
│ └──────────────┘ │                                                │
└────────┬─────────┘                                                │
         │                                                           │
         │ 2. User clicks "Build Your Own"                          │
         │                                                           │
         ▼                                                           │
┌──────────────────┐                                                │
│ AIPromptInput    │ (packages/ui/src/components/hivelab/)         │
│ (variant: hero)  │                                                │
│                  │                                                │
│ "Create an event │ ◄── User types prompt (1-1000 chars)          │
│  RSVP form..."   │                                                │
│                  │                                                │
│ [Submit] ────────┼── Enter key or click Submit                   │
└────────┬─────────┘                                                │
         │                                                           │
         │ 3. Call generate({ prompt })                             │
         │                                                           │
         ▼                                                           │
┌─────────────────────────────────┐                                │
│ useStreamingGeneration hook     │ (packages/hooks/)              │
│                                 │                                │
│ State:                          │                                │
│ - isGenerating: true            │                                │
│ - elements: []                  │                                │
│ - progress: 0                   │                                │
└────────┬────────────────────────┘                                │
         │                                                           │
         │ 4. POST /api/tools/generate                              │
         │    { prompt: "Create event RSVP..." }                    │
         │                                                           │
         ▼                                                           │
┌─────────────────────────────────────────────────────────────────┐│
│ Backend: /api/tools/generate                                    ││
│ (apps/web/src/app/api/tools/generate/route.ts)                  ││
│                                                                  ││
│ 1. Validate request (Zod schema)                                ││
│ 2. Create ReadableStream                                        ││
│ 3. Call AIToolGeneratorService.generateToolStreaming()          ││
│ 4. Stream NDJSON chunks back to client                          ││
└────────┬────────────────────────────────────────────────────────┘│
         │                                                           │
         │ 5. Streaming NDJSON response                             │
         │                                                           │
         ▼                                                           │
┌─────────────────────────────────────────────────────────────────┐│
│ AIToolGeneratorService                                          ││
│ (packages/core/src/application/hivelab/)                        ││
│                                                                  ││
│ 1. Build system prompt (element catalog + rules)                ││
│ 2. Build user prompt (original + constraints)                   ││
│ 3. Call Gemini API (streamGenerateContent)                      ││
│ 4. Parse streaming response                                     ││
│ 5. Yield chunks: element_added, generation_complete             ││
└────────┬────────────────────────────────────────────────────────┘│
         │                                                           │
         │ 6. Gemini API streaming                                  │
         │                                                           │
         ▼                                                           │
┌─────────────────────────────────────────────────────────────────┐│
│ Google Gemini 1.5 Pro (Vertex AI)                               ││
│                                                                  ││
│ Model: gemini-1.5-pro                                           ││
│ Temperature: 0.7                                                ││
│ Max tokens: 4096                                                ││
│                                                                  ││
│ Generates JSON in NDJSON format:                                ││
│ {"type": "element_added", "element": {...}}                     ││
│ {"type": "element_added", "element": {...}}                     ││
│ {"type": "generation_complete", "composition": {...}}           ││
└────────┬────────────────────────────────────────────────────────┘│
         │                                                           │
         │ 7. Stream chunks back through layers                     │
         │                                                           │
         ├───► AIToolGeneratorService ──► /api/tools/generate ──┐  │
         │                                                        │  │
         │ 8. Frontend receives NDJSON chunks                    │  │
         │                                                        │  │
         ▼                                                        │  │
┌─────────────────────────────────┐                              │  │
│ useStreamingGeneration          │ ◄────────────────────────────┘  │
│                                 │                                 │
│ Chunk 1: element_added          │                                 │
│ → setState({ elements: [elem1] })                                 │
│ → onElementAdded(elem1)         │                                 │
│ → progress: 20%                 │                                 │
│                                 │                                 │
│ Chunk 2: element_added          │                                 │
│ → setState({ elements: [elem1, elem2] })                          │
│ → onElementAdded(elem2)         │                                 │
│ → progress: 40%                 │                                 │
│                                 │                                 │
│ Chunk 3: generation_complete    │                                 │
│ → setState({ composition, isGenerating: false })                  │
│ → onComplete(composition)       │                                 │
│ → progress: 100%                │                                 │
└────────┬────────────────────────┘                                 │
         │                                                           │
         │ 9. Update UI in real-time                                │
         │                                                           │
         ▼                                                           │
┌──────────────────────────┐                                        │
│ StreamingCanvasView      │                                        │
│                          │                                        │
│ [Progress: ████████ 40%] │                                        │
│                          │                                        │
│ ┌─────────────────────┐  │                                        │
│ │ RSVP Form           │  │ ◄── elem1 (Framer Motion fade-in)     │
│ │ ┌─────────────────┐ │  │                                        │
│ │ │ Name:         │ │  │                                        │
│ │ │ Email:        │ │  │                                        │
│ │ │ Meal:  [▼]    │ │  │                                        │
│ │ └─────────────────┘ │  │                                        │
│ └─────────────────────┘  │                                        │
│ ┌─────────────────────┐  │                                        │
│ │ Attendee List       │  │ ◄── elem2 (Just added! Gold border)   │
│ │ (Connected to form) │  │                                        │
│ └─────────────────────┘  │                                        │
└────────┬─────────────────┘                                        │
         │                                                           │
         │ 10. Generation complete, mode: review                    │
         │                                                           │
         ▼                                                           │
┌──────────────────────────┐                                        │
│ Review Actions           │                                        │
│                          │                                        │
│ [Deploy] [Edit] [Start Over]                                     │
└────────┬─────────────────┘                                        │
         │                                                           │
         │ 11. User clicks Deploy                                   │
         │                                                           │
         ▼                                                           │
┌────────────────────────────────────────────────────────────────┐ │
│ STATE MANAGEMENT FORK                                          │ │
│                                                                │ │
│ IF authenticated:                  IF anonymous:              │ │
│ ├─ Save to Firestore immediately   ├─ Save to localStorage    │ │
│ └─ Navigate to /tools/{id}/edit    └─ Show signup gate modal  │ │
│                                                                │ │
└────────┬────────────────────────────┬──────────────────────────┘ │
         │                            │                             │
         │ (Authenticated)            │ (Anonymous)                 │
         ▼                            ▼                             │
┌──────────────────┐        ┌─────────────────────┐               │
│ Firestore        │        │ localStorage        │               │
│                  │        │                     │               │
│ tools/{toolId}   │        │ Key:                │               │
│ {                │        │ "hivelab_local_tools"│              │
│   name: "..."    │        │                     │               │
│   elements: [...] │        │ Value:              │               │
│   status: "draft"│        │ [{ composition }]   │               │
│   campusId: "ub" │        │                     │               │
│ }                │        │ Limit: 10 tools     │               │
└──────────────────┘        └────────┬────────────┘               │
                                     │                             │
                                     │ 12. User signs up           │
                                     │                             │
                                     ▼                             │
                            ┌─────────────────────┐               │
                            │ Migration Endpoint  │               │
                            │ (NOT IMPLEMENTED)   │               │
                            │                     │               │
                            │ POST /api/tools/    │               │
                            │      migrate        │               │
                            │                     │               │
                            │ ⚠️ TODO:            │               │
                            │ - Read localStorage │               │
                            │ - Batch write to    │               │
                            │   Firestore         │               │
                            │ - Clear localStorage│               │
                            └─────────────────────┘               │
                                                                   │
                                                                   │
┌────────────────────────────────────────────────────────────────┐ │
│ ANALYTICS TRACKING (NOT IMPLEMENTED)                           │ │
│                                                                │ │
│ Events that SHOULD be fired:                                  │ │
│                                                                │ │
│ ❌ ai_prompt_submitted (on step 3)                            │ │
│ ❌ tool_generated (on step 10)                                │ │
│ ❌ generation_failed (on error)                               │ │
│ ❌ tool_deployed (after deploy)                               │ │
│                                                                │ │
│ None of these are currently tracked.                          │ │
└────────────────────────────────────────────────────────────────┘ │
                                                                   │
                                                                   │
┌────────────────────────────────────────────────────────────────┐ │
│ END STATE                                                      │ │
│                                                                │ │
│ ✅ Tool generated and saved (Firestore or localStorage)       │ │
│ ✅ Canvas shows final composition                             │ │
│ ✅ User can Deploy, Edit, or Start Over                       │ │
│ ⚠️  localStorage migration pending (if anonymous)             │ │
│ ❌ No analytics tracked                                       │ │
└────────────────────────────────────────────────────────────────┘ │
                                                                   │
═══════════════════════════════════════════════════════════════════┘
```

---

## Code Reference Map

Map of UI actions to code locations:

| UI Action | Component File | API Endpoint | Service Function | DB Collection | Analytics Event |
|-----------|---------------|--------------|------------------|---------------|-----------------|
| User types prompt | `AIPromptInput.tsx:45` | - | - | - | ❌ (should fire `ai_prompt_submitted`) |
| User submits prompt | `AILandingPage.tsx:78` → `useStreamingGeneration.ts:32` | `POST /api/tools/generate` | `AIToolGeneratorService.generateToolStreaming()` | - | ❌ (should fire `ai_prompt_submitted`) |
| Gemini generates element | - | `/api/tools/generate/route.ts:56` | `ai-tool-generator.service.ts:124` | - | - |
| Element appears on canvas | `StreamingCanvasView.tsx:89` | - | - | - | - |
| Generation completes | `useStreamingGeneration.ts:78` | - | - | - | ❌ (should fire `tool_generated`) |
| User clicks Deploy (authed) | `AILandingPage.tsx:145` | `POST /api/tools` | - | `tools/` | ❌ (should fire `tool_created`) |
| User clicks Deploy (anon) | `AILandingPage.tsx:149` → `local-tool-storage.ts:12` | - | - | localStorage | - |
| Signup gate appears | `SignupGateModal.tsx:23` | - | - | - | - |
| User signs up | - | ⚠️ `POST /api/tools/migrate` (NOT IMPLEMENTED) | ⚠️ Migration service (MISSING) | `tools/` | ❌ (should fire `tools_migrated`) |
| Tool deployed to space | ⚠️ (NOT IMPLEMENTED) | ⚠️ `POST /api/tools/{id}/deploy` (exists but unused) | - | `deployments/` + `posts/` | ❌ (should fire `tool_deployed`) |

**Legend**:
- ✅ = Fully implemented
- ⚠️ = Partially implemented or missing integration
- ❌ = Not implemented

---

## Implementation Gaps & TODOs

### Critical (Launch Blockers) 🔴

1. **localStorage → Firestore Migration**
   - **Status**: ❌ Not implemented
   - **Impact**: Anonymous users lose tools after signup
   - **Files needed**:
     - `apps/web/src/app/api/tools/migrate/route.ts` (new endpoint)
     - `apps/web/src/lib/auth-state-listener.ts` (trigger on auth change)
   - **Implementation**:
     ```typescript
     export const POST = withAuthAndErrors(async (request, context, respond) => {
       const userId = getUserId(request);
       const { tools } = await parseJsonBody(request);

       const batch = writeBatch(db);

       for (const tool of tools) {
         const toolRef = doc(collection(db, 'tools'));
         batch.set(toolRef, {
           ...tool,
           createdBy: userId,
           campusId: 'ub-buffalo',
           status: 'draft',
           createdAt: serverTimestamp(),
           updatedAt: serverTimestamp()
         });
       }

       await batch.commit();

       return respond.created({ migrated: tools.length });
     });
     ```

2. **Signup Flow Integration**
   - **Status**: ⚠️ UI complete, API integration missing
   - **Impact**: Users can't actually sign up from signup gate
   - **Files needed**:
     - `apps/web/src/components/signup-gate-modal.tsx` (wire up auth)
   - **Implementation**: Call existing auth API, trigger migration after success

3. **Deploy Flow (Tool → Space)**
   - **Status**: ⚠️ API exists, UI integration missing
   - **Impact**: Can't deploy generated tools to spaces
   - **Files needed**:
     - `apps/web/src/components/hivelab/deploy-modal.tsx` (new component)
     - Wire up to existing `POST /api/tools/{id}/deploy`
   - **Implementation**: Modal to select space, call deploy API, show success

4. **Error Boundaries**
   - **Status**: ❌ Not implemented
   - **Impact**: App crashes on API failures
   - **Files needed**:
     - `apps/web/src/components/error-boundaries/ai-generation-error-boundary.tsx`
   - **Implementation**: Catch errors, show retry UI

---

### Important (Quality of Life) 🟡

5. **Analytics Tracking**
   - **Status**: ❌ Schema defined, no implementation
   - **Impact**: No visibility into usage, success rate, popular prompts
   - **Files needed**:
     - `packages/analytics/src/hivelab-events.ts` (event definitions)
     - Wire up `trackEvent()` calls at key points
   - **Events to add**:
     - `ai_prompt_submitted`
     - `tool_generated`
     - `generation_failed`
     - `tool_deployed`
     - `tool_interacted`

6. **Rate Limiting**
   - **Status**: ❌ Not implemented
   - **Impact**: Potential abuse, quota exhaustion
   - **Files needed**:
     - `apps/web/src/lib/middleware/rate-limit.ts` (use existing middleware)
   - **Implementation**: 60 req/min per IP, 429 response on exceed

7. **Gemini API Quota Monitoring**
   - **Status**: ❌ Not implemented
   - **Impact**: No visibility into quota usage, surprise quota errors
   - **Files needed**:
     - `packages/core/src/application/hivelab/quota-monitor.ts`
   - **Implementation**: Track tokens used per generation, alert at 80% quota

8. **Tool Editing in Studio**
   - **Status**: ⚠️ Studio exists, AI-generated tool editing missing
   - **Impact**: Can't tweak AI-generated tools before deploy
   - **Files needed**:
     - `apps/web/src/app/tools/[toolId]/edit/page.tsx` (wire up to studio)
   - **Implementation**: Load composition into visual editor, allow drag-drop edits

---

### Nice to Have (Future) 🟢

9. **Multi-turn Refinement**
   - **Status**: ❌ Not implemented
   - **Impact**: Can't say "make it better" to improve generation
   - **Files needed**:
     - `packages/core/src/application/hivelab/refinement-service.ts`
   - **Implementation**: Store conversation history, send to Gemini as multi-turn chat

10. **Voice Input**
    - **Status**: ❌ Not implemented
    - **Impact**: Slower input on mobile
    - **Files needed**:
      - `packages/ui/src/components/hivelab/voice-input-button.tsx`
    - **Implementation**: Web Speech API, transcribe to text

11. **Cost Tracking**
    - **Status**: ❌ Not implemented
    - **Impact**: No visibility into $ spent per generation
    - **Files needed**:
      - `packages/core/src/application/hivelab/cost-calculator.ts`
    - **Implementation**: Track tokens used, multiply by Gemini pricing ($0.000003/token)

12. **Template Customization**
    - **Status**: ❌ Parameter accepted but not used
    - **Impact**: Can't start from template and AI-refine
    - **Files needed**:
      - `packages/core/src/application/hivelab/template-service.ts`
    - **Implementation**: Load template composition, include in Gemini prompt as starting point

---

## Testing Strategy

### Unit Tests

**AIToolGeneratorService**:
```typescript
// packages/core/src/application/hivelab/__tests__/ai-tool-generator.service.test.ts

describe('AIToolGeneratorService', () => {
  it('should generate valid tool composition from prompt', async () => {
    const service = new AIToolGeneratorService();
    const result = await service.generateTool({
      prompt: 'Create an event RSVP form',
      userId: 'user_test',
      campusId: 'ub-buffalo'
    });

    expect(result.name).toBeTruthy();
    expect(result.elements.length).toBeGreaterThan(0);
    expect(result.elements[0].elementId).toBe('form-builder');
  });

  it('should stream chunks in correct order', async () => {
    const service = new AIToolGeneratorService();
    const chunks = [];

    for await (const chunk of service.generateToolStreaming({
      prompt: 'Create a poll',
      userId: 'user_test',
      campusId: 'ub-buffalo'
    })) {
      chunks.push(chunk);
    }

    expect(chunks[0].type).toBe('element_added');
    expect(chunks[chunks.length - 1].type).toBe('generation_complete');
  });
});
```

**useStreamingGeneration Hook**:
```typescript
// packages/hooks/src/__tests__/use-streaming-generation.test.ts

describe('useStreamingGeneration', () => {
  it('should update state on each chunk', async () => {
    const { result } = renderHook(() => useStreamingGeneration());

    await act(async () => {
      await result.current.generate({ prompt: 'Test' });
    });

    expect(result.current.state.elements.length).toBeGreaterThan(0);
    expect(result.current.state.composition).toBeTruthy();
    expect(result.current.state.isGenerating).toBe(false);
  });
});
```

---

### Integration Tests

**End-to-End AI Generation Flow**:
```typescript
// apps/web/src/__tests__/integration/ai-generation-flow.test.ts

describe('AI Generation Flow (Integration)', () => {
  it('should generate tool and save to localStorage (anonymous)', async () => {
    // 1. Render AILandingPage
    render(<AILandingPage />);

    // 2. Enter prompt
    const input = screen.getByPlaceholder('Describe your tool...');
    fireEvent.change(input, { target: { value: 'Create event RSVP' } });

    // 3. Submit
    fireEvent.click(screen.getByText('Generate'));

    // 4. Wait for generation
    await waitFor(() => {
      expect(screen.getByText('Event RSVP Manager')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 5. Check localStorage
    const tools = getLocalTools();
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe('Event RSVP Manager');
  });

  it('should save to Firestore immediately (authenticated)', async () => {
    // Mock authenticated user
    mockAuthState({ uid: 'user_test', email: 'test@buffalo.edu' });

    render(<AILandingPage />);

    // ... generate tool ...

    // Check Firestore write
    const toolsSnapshot = await getDocs(
      query(collection(db, 'tools'), where('createdBy', '==', 'user_test'))
    );
    expect(toolsSnapshot.size).toBe(1);
  });
});
```

---

### E2E Tests (Playwright)

**Complete User Journey**:
```typescript
// apps/web/src/__tests__/e2e/hivelab-ai-generation.spec.ts

test('AI generation → signup → deploy flow', async ({ page }) => {
  // 1. Land on page
  await page.goto('/');

  // 2. Watch demo auto-play
  await page.waitForSelector('[data-testid="streaming-canvas"]');
  await page.waitForTimeout(5000);  // Let demo run

  // 3. Click "Build Your Own"
  await page.click('text=Build Your Own');

  // 4. Enter custom prompt
  await page.fill('[data-testid="ai-prompt-input"]', 'Create poll for logo voting');
  await page.click('text=Generate');

  // 5. Wait for generation
  await page.waitForSelector('text=Complete!', { timeout: 30000 });

  // 6. Click Deploy (should show signup gate)
  await page.click('text=Deploy');
  await page.waitForSelector('[data-testid="signup-gate-modal"]');

  // 7. Sign up
  await page.fill('[type="email"]', 'test@buffalo.edu');
  await page.click('text=Send Magic Link');

  // 8. Check email, click link (mock in test)
  // ...

  // 9. After signup, tool should migrate
  await page.waitForSelector('text=1 tool synced to your account!');

  // 10. Deploy to space
  // ...
});
```

---

## Conclusion

This vertical slice topology document provides complete traceability from UI action to database write for HiveLab's AI generation flow. Key takeaways:

**What Works** ✅:
- AI generation with Gemini 1.5 Pro
- Real-time streaming UI with element-by-element reveal
- localStorage pre-signup persistence
- Comprehensive prompt engineering

**Critical Gaps** ⚠️:
- localStorage → Firestore migration (not implemented)
- Deploy flow integration (API exists, UI missing)
- Analytics tracking (zero events fired)
- Error boundaries (no graceful degradation)

**Next Steps** 🚀:
1. Implement localStorage migration endpoint + auth listener
2. Wire up deploy modal to existing API
3. Add analytics tracking for all key events
4. Add error boundaries for production robustness
5. Test with 10 UB student leaders before launch

**Reference This Doc For**:
- Debugging production issues (trace UI → API → DB)
- Onboarding new developers (see complete data flow)
- Planning new features (understand existing patterns)
- Code reviews (verify campus isolation, error handling)
