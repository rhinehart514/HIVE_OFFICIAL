/**
 * AI Tool Generation API (Streaming)
 *
 * Generates HiveLab tools from natural language prompts.
 * Supports multiple backends: Goose (Ollama), Firebase AI (Gemini), Groq, or rules-based.
 *
 * Priority order:
 * 1. Goose (Ollama) - Custom fine-tuned model, self-hosted
 * 2. Groq - Fast cloud inference, low cost
 * 3. Firebase AI - Gemini 2.0 Flash
 * 4. Rules-based - Zero cost fallback
 */

import { type NextRequest, NextResponse } from 'next/server';
import { mockGenerateToolStreaming, type StreamingChunk } from '@/lib/mock-ai-generator';
import {
  firebaseGenerateToolStreaming,
  isFirebaseAIAvailable,
  type GenerationContext,
} from '@/lib/firebase-ai-generator';
import {
  generateToolStream,
  getAvailableBackend,
  checkOllamaHealth,
  type GooseBackend,
} from '@/lib/goose-server';
import { canGenerate, recordGeneration } from '@/lib/ai-usage-tracker';
import { validateApiAuth } from '@/lib/api-auth-middleware';
import { aiGenerationRateLimit } from '@/lib/rate-limit-simple';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * Backend selection configuration
 *
 * GOOSE_BACKEND options:
 * - 'goose' or 'ollama': Use Goose (fine-tuned Phi-3) via Ollama - self-hosted, free
 * - 'groq': Use Groq cloud API - fast, ~$0.0001/request
 * - 'firebase': Use Firebase AI (Gemini) - ~$0.001/request
 * - 'rules': Use rules-based generator - $0, deterministic
 *
 * Default behavior:
 * 1. Try Goose/Ollama if GOOSE_BACKEND=goose and Ollama is running
 * 2. Try Groq if GROQ_API_KEY is set
 * 3. Fall back to rules-based (always works, $0)
 */
const GOOSE_BACKEND = process.env.GOOSE_BACKEND as GooseBackend | undefined;
const USE_RULES_BASED_GENERATION = process.env.USE_RULES_BASED_GENERATION !== 'false';

/**
 * Request schema for tool generation
 */
const GenerateToolRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  templateId: z.string().optional(),
  constraints: z.object({
    maxElements: z.number().optional(),
    allowedCategories: z.array(z.string()).optional()
  }).optional(),
  // Space context for contextual tool generation
  spaceContext: z.object({
    spaceId: z.string(),
    spaceName: z.string(),
    spaceType: z.string().optional(), // 'club', 'dorm', 'class', 'organization', etc.
    category: z.string().optional(),
    memberCount: z.number().optional(),
    description: z.string().optional(),
  }).optional(),
  // Iteration support - modify existing tool
  existingComposition: z.object({
    elements: z.array(z.any()),
    name: z.string().optional(),
  }).optional(),
  isIteration: z.boolean().optional(),
});

/**
 * POST /api/tools/generate
 *
 * Generate a tool from a natural language prompt (streaming)
 */
export async function POST(request: NextRequest) {
  // Track user ID for usage (optional - allow unauthenticated for demo)
  let userId: string | null = null;

  try {
    // Rate limit check - use IP for unauthenticated, user ID for authenticated
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Try to get authenticated user (optional)
    try {
      const auth = await validateApiAuth(request, { operation: 'tool-generate' });
      userId = auth.userId;
    } catch {
      // Unauthenticated - allow for demo but with stricter limits
      userId = null;
    }

    // Apply rate limiting (stricter for unauthenticated)
    const rateLimitKey = userId ? `user:${userId}` : `ip:${clientIp}`;
    const rateLimitResult = aiGenerationRateLimit.check(rateLimitKey);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many generation requests. Please wait before trying again.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          }
        }
      );
    }

    // Check usage limits for authenticated users
    if (userId) {
      const usage = await canGenerate(userId);
      if (!usage.allowed) {
        return NextResponse.json(
          {
            error: 'Usage limit reached',
            tier: usage.tier,
            limit: usage.limit,
            message: `You've used all ${usage.limit} tool generations this month. Upgrade for more.`,
            upgradeUrl: '/settings/subscription',
          },
          { status: 429 }
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const validated = GenerateToolRequestSchema.parse(body);

    // Determine which generator to use
    // Priority: Goose (Ollama) > Groq > Firebase AI > Rules-based
    const firebaseAvailable = isFirebaseAIAvailable() && process.env.NEXT_PUBLIC_USE_FIREBASE_AI !== 'false';
    const gooseBackend = GOOSE_BACKEND || (await getAvailableBackend());
    const useGoose = gooseBackend === 'ollama' || gooseBackend === 'groq';
    const useFirebaseAI = !useGoose && !USE_RULES_BASED_GENERATION && firebaseAvailable;

    // Create generation context for quality tracking
    const generationContext: GenerationContext = {
      userId,
      sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      campusId: undefined, // Could be extracted from user session if available
    };

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Select generator based on available backend
          // Priority: Goose > Firebase AI > Rules-based
          let generator: AsyncGenerator<StreamingChunk>;
          let providerName: string;
          let costEstimate: string;

          if (useGoose) {
            // Use Goose (Ollama or Groq)
            generator = generateToolStream({
              prompt: validated.prompt,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              existingComposition: validated.existingComposition as any,
              isIteration: validated.isIteration,
            }) as AsyncGenerator<StreamingChunk>;
            const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
            const is70b = groqModel.includes('70b');
            providerName = gooseBackend === 'ollama'
              ? 'Goose (Ollama)'
              : `Goose (Groq ${is70b ? '70b' : '8b'})`;
            costEstimate = gooseBackend === 'ollama' ? '$0' : (is70b ? '~$0.001' : '~$0.0001');
          } else if (useFirebaseAI) {
            generator = firebaseGenerateToolStreaming(validated, generationContext);
            providerName = 'Firebase AI (Gemini 2.0 Flash)';
            costEstimate = '~$0.001';
          } else {
            generator = mockGenerateToolStreaming(validated);
            providerName = 'Rules-based generator';
            costEstimate = '$0';
          }

          const mode = validated.isIteration ? 'iteration' : 'new';
          logger.info(`Tool generation (${mode})`, {
            component: 'tools-generate',
            provider: providerName,
            backend: gooseBackend,
            userId: userId || 'anonymous',
            cost: costEstimate,
          });

          // Start streaming generation
          for await (const chunk of generator) {
            // Format as newline-delimited JSON
            const data = JSON.stringify(chunk) + '\n';
            controller.enqueue(encoder.encode(data));

            // If generation is complete, record usage and close stream
            if (chunk.type === 'complete') {
              // Record usage for authenticated users
              if (userId) {
                try {
                  await recordGeneration(userId, 500); // Estimate ~500 tokens
                  logger.debug('Recorded generation', { component: 'tools-generate', userId });
                } catch (err) {
                  logger.error('Failed to record usage', { component: 'tools-generate' }, err instanceof Error ? err : undefined);
                }
              }

              controller.close();
              return;
            }

            // If error, close stream (don't count as usage)
            if (chunk.type === 'error') {
              controller.close();
              return;
            }
          }

          // Close stream if loop exits without completion
          controller.close();
        } catch (error) {
          logger.error('Generation error', { component: 'tools-generate' }, error instanceof Error ? error : undefined);

          // Send error chunk
          const errorChunk: StreamingChunk = {
            type: 'error',
            data: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
          controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + '\n'));
          controller.close();
        }
      },

      cancel() {
        // Cleanup if client cancels
      }
    });

    // Return streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    logger.error('Error in /api/tools/generate', { component: 'tools-generate' }, error instanceof Error ? error : undefined);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate tool',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tools/generate
 *
 * Get generation info and demo prompts
 */
export async function GET() {
  const { DEMO_PROMPTS } = await import('@hive/core');
  const firebaseAvailable = isFirebaseAIAvailable() && process.env.NEXT_PUBLIC_USE_FIREBASE_AI !== 'false';
  const gooseBackend = await getAvailableBackend();
  const ollamaHealthy = await checkOllamaHealth();

  // Determine active backend for response
  let activeBackend: string;
  let model: string;
  let costPerGeneration: string;
  let latency: string;

  if (gooseBackend === 'ollama' && ollamaHealthy) {
    activeBackend = 'goose-ollama';
    model = 'goose-phi3-finetuned';
    costPerGeneration = '$0 (self-hosted)';
    latency = '~500ms';
  } else if (gooseBackend === 'groq') {
    const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const is70b = groqModel.includes('70b');
    activeBackend = 'goose-groq';
    model = groqModel;
    costPerGeneration = is70b ? '~$0.001' : '~$0.0001';
    latency = is70b ? '~800ms' : '~300ms';
  } else if (!USE_RULES_BASED_GENERATION && firebaseAvailable) {
    activeBackend = 'firebase-ai';
    model = 'gemini-2.0-flash';
    costPerGeneration = '~$0.001';
    latency = '~2000ms';
  } else {
    activeBackend = 'rules-based';
    model = 'rules-based-v1';
    costPerGeneration = '$0';
    latency = '~100ms';
  }

  return NextResponse.json({
    demoPrompts: Array.from(DEMO_PROMPTS),
    model,
    backend: activeBackend,
    maxPromptLength: 1000,
    streamingSupported: true,
    costPerGeneration,
    latency,
    features: {
      structuredOutput: true,
      complexTools: activeBackend !== 'rules-based',
      multiStage: activeBackend !== 'rules-based',
      campusSpecificIntents: true,
      refinementSupport: true,
      gooseModel: activeBackend.startsWith('goose'),
    },
    config: {
      GOOSE_BACKEND: GOOSE_BACKEND,
      USE_RULES_BASED_GENERATION,
      firebaseAIAvailable: firebaseAvailable,
      ollamaHealthy,
    },
  });
}
