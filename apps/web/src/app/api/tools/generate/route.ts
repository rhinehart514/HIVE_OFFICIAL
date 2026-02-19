/**
 * AI Tool Generation API (Streaming)
 *
 * Generates HiveLab tools from natural language prompts.
 * Uses rules-based generation as primary with optional Groq enhancement path.
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  generateToolStream,
  getAvailableBackend,
  type StreamMessage,
} from '@/lib/goose-server';
import { canGenerate, recordGeneration } from '@/lib/ai-usage-tracker';
import { validateApiAuth } from '@/lib/middleware/auth';
import { aiGenerationRateLimit } from '@/lib/rate-limit-simple';
import { logger } from '@/lib/logger';
import { z } from 'zod';

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
            resetAt: usage.resetAt.toISOString(),
            message: 'Daily generation limit reached. Resets at midnight.',
          },
          { status: 429 }
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const validated = GenerateToolRequestSchema.parse(body);

    const availableBackend = await getAvailableBackend();
    const groqAvailable = availableBackend === 'groq';

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = generateToolStream({
            prompt: validated.prompt,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            existingComposition: validated.existingComposition as any,
            isIteration: validated.isIteration,
          }) as AsyncGenerator<StreamMessage>;

          const mode = validated.isIteration ? 'iteration' : 'new';
          logger.info(`Tool generation (${mode})`, {
            component: 'tools-generate',
            provider: 'Rules-based generator',
            backend: 'rules',
            groqAvailable,
            userId: userId || 'anonymous',
            cost: '$0',
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
          const errorChunk: StreamMessage = {
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
  const availableBackend = await getAvailableBackend();
  const groqAvailable = availableBackend === 'groq';
  const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const is70b = groqModel.includes('70b');

  return NextResponse.json({
    demoPrompts: Array.from(DEMO_PROMPTS),
    model: 'rules-based-v1',
    backend: 'rules-based',
    maxPromptLength: 1000,
    streamingSupported: true,
    costPerGeneration: '$0',
    latency: '~100ms',
    enhancedOption: groqAvailable
      ? {
          backend: 'groq',
          model: groqModel,
          costPerGeneration: is70b ? '~$0.001' : '~$0.0001',
          latency: is70b ? '~800ms' : '~300ms',
        }
      : null,
    features: {
      structuredOutput: true,
      complexTools: groqAvailable,
      multiStage: groqAvailable,
      campusSpecificIntents: true,
      refinementSupport: true,
      gooseModel: groqAvailable,
    },
    config: {
      activeBackend: 'rules',
      groqAvailable,
    },
  });
}
