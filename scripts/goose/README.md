# Goose System

Custom AI for HiveLab tool generation. Fine-tuned on HiveLab element schemas to generate valid tool compositions from natural language.

## Quick Start

### 1. Generate Training Data

```bash
# From project root
pnpm tsx packages/core/src/hivelab/goose/training/generate-dataset.ts
pnpm tsx packages/core/src/hivelab/goose/training/templates-to-examples.ts
```

Output: `packages/core/src/hivelab/goose/training/data/`

### 2. Fine-Tune Model

**Option A: Google Colab (Free T4 GPU)**

1. Upload `fine-tune.py` and training data to Colab
2. Install dependencies:
   ```python
   !pip install unsloth transformers datasets peft trl
   ```
3. Run:
   ```python
   !python fine-tune.py --export-gguf
   ```

**Option B: Local (Apple Silicon)**

```bash
pip install unsloth transformers datasets peft trl
python scripts/goose/fine-tune.py --local --export-gguf
```

### 3. Deploy with Ollama

```bash
# Copy GGUF model to scripts/goose/
cp goose-model.gguf scripts/goose/

# Create Ollama model
cd scripts/goose
ollama create goose -f Modelfile

# Test
ollama run goose "create a poll about favorite study spots"
```

### 4. Use in HIVE

The API endpoint at `/api/tools/generate` will automatically use Goose when available:

```typescript
import { gooseClient } from '@/lib/goose-client';

// Streaming
for await (const message of gooseClient.generate("create a poll")) {
  console.log(message);
}

// Or sync
const tool = await gooseClient.generateSync("create a poll");
```

## Architecture

```
packages/core/src/hivelab/goose/
├── index.ts              # Module exports
├── validator.ts          # Output validation (Zod schemas)
├── system-prompt.ts      # Prompt builder with element catalog
└── training/
    ├── element-knowledge.json    # Element specifications
    ├── generate-dataset.ts       # Synthetic data generator
    ├── templates-to-examples.ts  # Template converter
    └── data/                     # Generated training data

scripts/goose/
├── fine-tune.py          # Unsloth fine-tuning script
├── Modelfile             # Ollama model definition
└── README.md             # This file

apps/web/src/lib/
└── goose-client.ts       # Client library with React hook
```

## Training Data

Current: **389 examples** covering 17 element types

| Dataset | Examples | Source |
|---------|----------|--------|
| Synthetic | 303 | Generated variations |
| Templates | 86 | Existing HiveLab templates |

Target: 1,500 examples for production quality.

## Model Options

| Model | Size | VRAM | Speed |
|-------|------|------|-------|
| Phi-3-mini-4k | 3.8B | 4GB | Fast |
| Qwen2-1.5B | 1.5B | 2GB | Faster |
| TinyLlama-1.1B | 1.1B | 1.5GB | Fastest |

Default: **Phi-3-mini-4k** - best balance for structured JSON output.

## Fallback Options

If Goose isn't available, the system falls back to:

1. **Groq API** - Fast cloud inference (~$0.0001/request)
2. **Rules-based generator** - Zero cost, limited capability

Configure in `.env.local`:

```env
GOOSE_BACKEND=ollama  # or 'groq' or 'rules'
OLLAMA_HOST=http://localhost:11434
GROQ_API_KEY=gsk_...
```

## Validation

All Goose outputs are validated before use:

```typescript
import { validateToolComposition } from '@hive/core/hivelab/goose';

const result = validateToolComposition(output);
if (!result.valid) {
  console.error('Invalid output:', result.errors);
}
```

## Development

```bash
# Type check
pnpm --filter=@hive/core exec tsc --noEmit

# Test module
pnpm tsx -e "import { validateToolComposition } from './packages/core/src/hivelab/goose/index.js'; console.log('OK');"
```
