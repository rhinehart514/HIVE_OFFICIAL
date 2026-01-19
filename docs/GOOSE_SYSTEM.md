# Goose System — Status & Documentation

**Last Updated:** January 19, 2026
**Status:** Infrastructure Complete, Model Not Yet Trained

---

## What is Goose?

Goose is a custom AI system for generating HiveLab tools from natural language. Instead of paying for cloud AI APIs, Goose uses a fine-tuned small model that runs locally for free.

**Example:**
```
User: "create a poll about favorite study spots with a results chart"

Goose outputs:
{
  "elements": [
    { "type": "poll-element", "config": { "question": "What's your favorite study spot?", ... } },
    { "type": "chart-display", "config": { "chartType": "bar", ... } }
  ],
  "connections": [
    { "from": { "instanceId": "poll_element_1", "port": "results" }, "to": { "instanceId": "chart_display_1", "port": "data" } }
  ],
  "name": "Study Spots Poll",
  "layout": "grid"
}
```

---

## Current State

### ✅ Complete

| Component | Location | Status |
|-----------|----------|--------|
| Training data generator | `packages/core/src/hivelab/goose/training/generate-dataset.ts` | Working |
| Template converter | `packages/core/src/hivelab/goose/training/templates-to-examples.ts` | Working |
| Training data | `packages/core/src/hivelab/goose/training/data/` | 389 examples |
| Element knowledge base | `packages/core/src/hivelab/goose/training/element-knowledge.json` | 27 elements |
| Output validator | `packages/core/src/hivelab/goose/validator.ts` | Working |
| System prompt builder | `packages/core/src/hivelab/goose/system-prompt.ts` | Working |
| Colab training notebook | `scripts/goose/Goose_Training.ipynb` | Ready |
| Fine-tuning script | `scripts/goose/fine-tune.py` | Ready |
| Ollama Modelfile | `scripts/goose/Modelfile` | Ready |
| Server integration | `apps/web/src/lib/goose-server.ts` | Working |
| Client library | `apps/web/src/lib/goose-client.ts` | Working |
| API endpoint | `apps/web/src/app/api/tools/generate/route.ts` | Updated |
| Environment config | `apps/web/.env.production.template` | Updated |

### ⏳ Not Yet Done

| Component | What's Needed |
|-----------|---------------|
| Trained model | Run Colab notebook to fine-tune Phi-3 |
| GGUF file | Export from training |
| Ollama deployment | `ollama create goose -f Modelfile` |

---

## File Structure

```
packages/core/src/hivelab/goose/
├── index.ts                      # Module exports
├── validator.ts                  # Zod schemas, validation, sanitization
├── system-prompt.ts              # Element catalog, prompt templates
└── training/
    ├── element-knowledge.json    # All 27 HiveLab elements with specs
    ├── generate-dataset.ts       # Synthetic training data generator
    ├── templates-to-examples.ts  # Converts existing templates to examples
    └── data/
        ├── combined-training.jsonl   # 389 combined examples (use this)
        ├── training.jsonl            # 274 synthetic examples
        ├── validation.jsonl          # 29 validation examples
        ├── template-examples.jsonl   # 86 template-based examples
        ├── summary.json              # Stats for synthetic data
        └── combined-summary.json     # Stats for all data

scripts/goose/
├── fine-tune.py              # Python script for Unsloth fine-tuning
├── Goose_Training.ipynb      # Google Colab notebook (use this)
├── Modelfile                 # Ollama model configuration
└── README.md                 # Quick start guide

apps/web/src/lib/
├── goose-client.ts           # Browser client + useGoose() React hook
└── goose-server.ts           # Server-side Ollama/Groq integration
```

---

## Training Data

**Total: 389 examples**

| Source | Count | Description |
|--------|-------|-------------|
| Synthetic | 274 | Generated variations (polls, RSVPs, timers, etc.) |
| Validation | 29 | Held-out test set |
| Templates | 86 | From existing HiveLab templates |

**Element Coverage:** 17 of 27 types
- poll-element, rsvp-button, countdown-timer, leaderboard
- chart-display, result-list, form-builder, counter, timer
- search-input, filter-selector, date-picker, availability-heatmap
- member-list, space-events, space-stats, announcement

---

## API Endpoint

**`POST /api/tools/generate`**

The endpoint automatically selects the best available backend:

| Priority | Backend | Cost | Latency | Requirement |
|----------|---------|------|---------|-------------|
| 1 | Goose (Ollama) | $0 | ~500ms | Ollama running with goose model |
| 2 | Groq | ~$0.0001 | ~300ms | GROQ_API_KEY set |
| 3 | Firebase AI | ~$0.001 | ~2000ms | Firebase configured |
| 4 | Rules-based | $0 | ~100ms | Always works |

**Current default:** Rules-based (free, always available)

**Check status:**
```bash
curl http://localhost:3000/api/tools/generate
```

---

## Environment Variables

Add to `.env.local` to configure:

```env
# Backend selection: 'ollama', 'groq', or 'rules'
GOOSE_BACKEND=rules

# Ollama (when using ollama backend)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=goose

# Groq (optional cloud fallback)
GROQ_API_KEY=your_key_here

# Legacy flag
USE_RULES_BASED_GENERATION=true
```

---

## How to Train (Free)

### Step 1: Open Google Colab
1. Go to [colab.research.google.com](https://colab.research.google.com)
2. File → Upload notebook → Select `scripts/goose/Goose_Training.ipynb`
3. Runtime → Change runtime type → T4 GPU → Save

### Step 2: Upload Training Data
Run the upload cell and select:
```
packages/core/src/hivelab/goose/training/data/combined-training.jsonl
```

### Step 3: Run All Cells
Training takes ~15-30 minutes on free T4 GPU.

### Step 4: Download Model
The notebook exports `goose-model.gguf` — download it.

### Step 5: Deploy to Ollama
```bash
# Move model file
mv ~/Downloads/goose-*.gguf scripts/goose/goose-model.gguf

# Create Ollama model
cd scripts/goose
ollama create goose -f Modelfile

# Test
ollama run goose "create a poll about favorite foods"
```

### Step 6: Enable in HIVE
```env
GOOSE_BACKEND=ollama
```

---

## Client Usage

### React Hook
```typescript
import { useGoose } from '@/lib/goose-client';

function ToolGenerator() {
  const { generate, isGenerating, progress, error } = useGoose({
    onElement: (el) => console.log('New element:', el),
    onComplete: (tool) => console.log('Done:', tool),
  });

  return (
    <button onClick={() => generate("create a poll")}>
      {isGenerating ? 'Generating...' : 'Generate'}
    </button>
  );
}
```

### Direct Client
```typescript
import { gooseClient } from '@/lib/goose-client';

// Streaming
for await (const msg of gooseClient.generate("create a poll")) {
  console.log(msg.type, msg.data);
}

// Sync
const tool = await gooseClient.generateSync("create a poll");
```

---

## Validation

All outputs are validated before use:

```typescript
import { validateToolComposition } from '@hive/core/hivelab/goose';

const result = validateToolComposition(modelOutput);

if (result.valid) {
  // Use result.sanitized
} else {
  console.error(result.errors);
}
```

**Validates:**
- Element types (must be in VALID_ELEMENT_TYPES)
- Required config fields (e.g., poll needs question + options)
- Unique instance IDs
- Valid connections (ports exist, no circular refs)
- Position/size bounds

---

## Cost Analysis

| Scenario | Monthly Cost |
|----------|--------------|
| **Goose + Ollama (local)** | $0 |
| **Goose + Groq (cloud)** | ~$1 for 10K generations |
| **Rules-based only** | $0 |
| Firebase AI (Gemini) | ~$10-100 depending on usage |

**Recommendation:** Use Goose + Ollama for $0 operation.

---

## Next Steps

1. **Train the model** — Run Colab notebook (free, ~30 min)
2. **Deploy to Ollama** — Local, free, unlimited
3. **Test quality** — Verify outputs match expectations
4. **Expand training data** — Target 1,500 examples for better quality

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Prompt                             │
│          "create a poll about study spots"                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 /api/tools/generate                         │
│                                                             │
│   Selects backend: Ollama → Groq → Firebase → Rules        │
└─────────────────────────┬───────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐
    │  Ollama   │  │   Groq    │  │  Rules    │
    │  (Goose)  │  │   (LLM)   │  │  Based    │
    │    $0     │  │  ~$0.0001 │  │    $0     │
    └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Validator                                │
│         Ensures valid JSON, element types, configs          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              NDJSON Streaming Response                      │
│                                                             │
│  {"type":"thinking","data":{...}}                          │
│  {"type":"element","data":{...}}                           │
│  {"type":"connection","data":{...}}                        │
│  {"type":"complete","data":{...}}                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Commands

```bash
# Generate training data
pnpm tsx packages/core/src/hivelab/goose/training/generate-dataset.ts

# Check API status
curl http://localhost:3000/api/tools/generate

# Test generation
curl -X POST http://localhost:3000/api/tools/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "create a poll"}'

# After training - create Ollama model
cd scripts/goose && ollama create goose -f Modelfile

# Test Goose directly
ollama run goose "create a poll about favorite foods"
```
