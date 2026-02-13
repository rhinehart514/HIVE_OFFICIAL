import { createHash } from 'node:crypto';
import type {
  CustomBlockAction,
  CustomBlockConfig,
  CustomBlockManifest,
  CustomBlockPort,
} from '../../domain/hivelab/custom-block.types';
import { validateCustomBlockCode } from '../../domain/hivelab/validation/custom-block-validator';

const DEFAULT_MODEL = 'llama-3.1-70b-versatile';
const MAX_TOKENS = 4096;

interface GroqMessage {
  role: 'system' | 'user';
  content: string;
}

interface GroqChatRequest {
  model: string;
  messages: GroqMessage[];
  temperature: number;
  max_tokens: number;
  response_format: { type: 'json_object' };
}

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface GroqClientLike {
  chat: {
    completions: {
      create: (request: GroqChatRequest) => Promise<GroqChatResponse>;
    };
  };
}

interface GeneratedPayload {
  html?: string;
  css?: string;
  js?: string;
  explanation?: string;
  name?: string;
  description?: string;
  metadata?: {
    name?: string;
    description?: string;
  };
  manifest?: {
    actions?: unknown[];
    inputs?: unknown[];
    outputs?: unknown[];
    stateSchema?: {
      type?: string;
      properties?: Record<string, unknown>;
    };
  };
}

function getEnvApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  return apiKey;
}

function buildSystemPrompt(): string {
  return [
    'You generate secure Hive custom blocks for iframe sandbox execution.',
    '',
    'HIVE SDK API available to block JavaScript (window.HIVE):',
    '- window.HIVE.getState()',
    '- window.HIVE.setState(updates)',
    '- window.HIVE.executeAction(actionId, payload)',
    '- window.HIVE.getContext()',
    '- window.HIVE.getInput(inputId)',
    '- window.HIVE.emitOutput(outputId, data)',
    '- window.HIVE.notify(message, type)',
    '- window.HIVE.onStateChange(callback)',
    '',
    'Available CSS variables:',
    '- --hive-color-black, --hive-color-white, --hive-color-gold, --hive-color-gold-hover, --hive-color-gold-active',
    '- --hive-gray-50..--hive-gray-950',
    '- --hive-bg-ground, --hive-bg-surface, --hive-bg-surface-hover, --hive-bg-surface-active',
    '- --hive-text-primary, --hive-text-secondary, --hive-text-tertiary, --hive-text-disabled',
    '- --hive-border-default, --hive-border-subtle, --hive-border-hover, --hive-border-focus',
    '- --hive-spacing-1,2,3,4,5,6,8,10,12,16,20,24',
    '- --hive-radius-sm,md,lg,xl,2xl,full',
    '- --hive-font-size-xs,sm,base,lg,xl,2xl,3xl,4xl',
    '- --hive-font-weight-normal,medium,semibold,bold',
    '- --hive-line-height-tight,normal,relaxed',
    '- --hive-shadow-sm,md,lg,gold-glow',
    '',
    'Available utility classes:',
    '- .hive-btn',
    '- .hive-btn-primary',
    '- .hive-btn-secondary',
    '- .hive-card',
    '- .hive-input',
    '',
    'Hard constraints:',
    '- No network requests',
    '- No eval or Function constructor',
    '- No external resources (no script src, no link href)',
    '- No localStorage/sessionStorage/cookies',
    '- Use window.HIVE for state and actions',
    '',
    'Return JSON only with this exact shape:',
    '{',
    '  "html": "<markup>",',
    '  "css": "<styles>",',
    '  "js": "<script>",',
    '  "manifest": {',
    '    "actions": [{ "id": "string", "label": "string", "category": "aggregate|personal|hybrid", "payloadSchema": {} }],',
    '    "inputs": [{ "id": "string", "label": "string", "type": "string|number|boolean|object|array", "description": "string" }],',
    '    "outputs": [{ "id": "string", "label": "string", "type": "string|number|boolean|object|array", "description": "string" }],',
    '    "stateSchema": { "type": "object", "properties": {} }',
    '  },',
    '  "name": "short block name",',
    '  "description": "one sentence description",',
    '  "explanation": "brief generation explanation"',
    '}',
  ].join('\n');
}

function buildUserPrompt(opts: {
  prompt: string;
  spaceContext?: { name: string; type: string; memberCount: number };
  validationFeedback?: string;
}): string {
  const sections = [
    `User request: ${opts.prompt}`,
  ];

  if (opts.spaceContext) {
    sections.push(
      `Space context: name=${opts.spaceContext.name}, type=${opts.spaceContext.type}, memberCount=${opts.spaceContext.memberCount}`
    );
  }

  if (opts.validationFeedback) {
    sections.push(`Previous attempt failed validation:\n${opts.validationFeedback}`);
    sections.push('Fix all validation issues and regenerate a fully compliant block.');
  }

  return sections.join('\n\n');
}

function toSha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function parseJsonPayload(raw: string): GeneratedPayload {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed) as GeneratedPayload;
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim()) as GeneratedPayload;
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as GeneratedPayload;
    }
    throw new Error('Model response was not valid JSON');
  }
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizePortList(raw: unknown, fallbackPrefix: string): CustomBlockPort[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const type = source.type;
    const normalizedType: CustomBlockPort['type'] =
      type === 'string' || type === 'number' || type === 'boolean' || type === 'array' || type === 'object'
        ? type
        : 'object';

    const id = safeString(source.id, `${fallbackPrefix}_${index + 1}`);
    const label = safeString(source.label, id);
    const description = safeString(source.description) || undefined;

    return {
      id,
      label,
      type: normalizedType,
      description,
    };
  });
}

function normalizeActionList(raw: unknown): CustomBlockAction[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const id = safeString(source.id, `action_${index + 1}`);
    const label = safeString(source.label, id);
    const categoryValue = source.category;
    const category: CustomBlockAction['category'] =
      categoryValue === 'aggregate' || categoryValue === 'personal' || categoryValue === 'hybrid'
        ? categoryValue
        : 'hybrid';

    const payloadSchema =
      source.payloadSchema && typeof source.payloadSchema === 'object'
        ? (source.payloadSchema as Record<string, unknown>)
        : undefined;

    return {
      id,
      label,
      category,
      payloadSchema,
    };
  });
}

function normalizeManifest(raw: GeneratedPayload['manifest']): CustomBlockManifest {
  const actions = normalizeActionList(raw?.actions);
  const inputs = normalizePortList(raw?.inputs, 'input');
  const outputs = normalizePortList(raw?.outputs, 'output');

  const stateSchema =
    raw?.stateSchema &&
    raw.stateSchema.type === 'object' &&
    raw.stateSchema.properties &&
    typeof raw.stateSchema.properties === 'object'
      ? {
          type: 'object' as const,
          properties: raw.stateSchema.properties as Record<
            string,
            {
              type: 'string' | 'number' | 'boolean' | 'object' | 'array';
              description?: string;
              default?: unknown;
            }
          >,
        }
      : undefined;

  return {
    actions,
    inputs,
    outputs,
    stateSchema,
  };
}

function deriveName(prompt: string): string {
  const words = prompt.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length === 0) return 'Custom Block';
  return words
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .slice(0, 64);
}

function createFetchGroqClient(apiKey: string): GroqClientLike {
  return {
    chat: {
      completions: {
        create: async (request: GroqChatRequest): Promise<GroqChatResponse> => {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(request),
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`Groq request failed (${response.status}): ${errText || response.statusText}`);
          }

          return (await response.json()) as GroqChatResponse;
        },
      },
    },
  };
}

async function createGroqClient(apiKey: string): Promise<GroqClientLike> {
  const moduleName = 'groq-sdk';
  try {
    const groqModule = (await import(moduleName)) as {
      default?: new (opts: { apiKey: string }) => GroqClientLike;
    };
    if (groqModule.default) {
      return new groqModule.default({ apiKey });
    }
  } catch {
    // Fall back to fetch-based client when SDK is unavailable in this environment.
  }

  return createFetchGroqClient(apiKey);
}

async function requestGeneration(opts: {
  client: GroqClientLike;
  model: string;
  prompt: string;
  spaceContext?: { name: string; type: string; memberCount: number };
  validationFeedback?: string;
}): Promise<GeneratedPayload> {
  const completion = await opts.client.chat.completions.create({
    model: opts.model,
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(),
      },
      {
        role: 'user',
        content: buildUserPrompt({
          prompt: opts.prompt,
          spaceContext: opts.spaceContext,
          validationFeedback: opts.validationFeedback,
        }),
      },
    ],
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    response_format: { type: 'json_object' },
  });

  const rawContent = completion.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Groq returned an empty response');
  }

  return parseJsonPayload(rawContent);
}

function buildValidationFeedback(errors: string[]): string {
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
}

export async function generateCustomBlock(opts: {
  prompt: string;
  spaceContext?: { name: string; type: string; memberCount: number };
  model?: string;
}): Promise<{ config: CustomBlockConfig; explanation: string }> {
  const apiKey = getEnvApiKey();
  const model = opts.model || DEFAULT_MODEL;
  const client = await createGroqClient(apiKey);

  let validationErrorsForRetry: string[] = [];
  let lastParseError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const payload = await requestGeneration({
        client,
        model,
        prompt: opts.prompt,
        spaceContext: opts.spaceContext,
        validationFeedback:
          attempt === 1 && validationErrorsForRetry.length > 0
            ? buildValidationFeedback(validationErrorsForRetry)
            : undefined,
      });

      const html = safeString(payload.html).trim();
      const css = safeString(payload.css).trim();
      const js = safeString(payload.js).trim();
      const combined = `${html}\n/*__HIVE_SPLIT__*/\n${css}\n/*__HIVE_SPLIT__*/\n${js}`;
      const hash = toSha256(combined);

      const code = { html, css, js, hash };
      const validation = validateCustomBlockCode(code);

      if (!validation.valid) {
        validationErrorsForRetry = validation.errors.map((error) => error.message);
        continue;
      }

      const now = new Date().toISOString();
      const manifest = normalizeManifest(payload.manifest);
      const name = safeString(payload.metadata?.name, safeString(payload.name, deriveName(opts.prompt)));
      const description = safeString(
        payload.metadata?.description,
        safeString(payload.description, opts.prompt.slice(0, 160))
      );

      const config: CustomBlockConfig = {
        blockId: `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        version: 1,
        metadata: {
          name,
          description,
          createdBy: 'ai',
          createdAt: now,
          updatedAt: now,
        },
        code,
        manifest,
      };

      const explanation = safeString(
        payload.explanation,
        'Generated from your prompt with runtime-safe Hive SDK patterns.'
      );

      return { config, explanation };
    } catch (error) {
      lastParseError = error instanceof Error ? error : new Error(String(error));
      validationErrorsForRetry = [
        lastParseError.message,
      ];
    }
  }

  throw new Error(
    lastParseError?.message ||
      'Unable to generate a valid custom block after retrying with validation feedback'
  );
}

export const DEFAULT_CUSTOM_BLOCK_MODEL = DEFAULT_MODEL;
