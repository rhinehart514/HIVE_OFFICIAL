/**
 * AI Tool Generation API (Streaming)
 *
 * Generates HiveLab tools from natural language prompts using Gemini AI.
 * Returns streaming response for real-time canvas updates.
 *
 * DEVELOPMENT MODE: Uses mock generator (no Firebase/GCP required)
 * PRODUCTION MODE: Uses real Gemini AI (requires Google Cloud credentials)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { mockGenerateToolStreaming, type StreamingChunk } from '@/lib/mock-ai-generator';
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
  }).optional()
});

/**
 * POST /api/tools/generate
 *
 * Generate a tool from a natural language prompt (streaming)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const validated = GenerateToolRequestSchema.parse(body);

    // Check if we should use real AI or mock
    const useMock = process.env.NODE_ENV === 'development' || !process.env.GOOGLE_CLOUD_PROJECT;

    // Create streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // AI Studio disabled - always use mock for now
          const generator = mockGenerateToolStreaming(validated);
          void useMock; // Silence unused variable warning

          // Start streaming generation
          for await (const chunk of generator) {
            // Format as newline-delimited JSON
            const data = JSON.stringify(chunk) + '\n';
            controller.enqueue(encoder.encode(data));

            // If generation is complete, close stream
            if (chunk.type === 'generation_complete') {
              controller.close();
              return;
            }

            // If error, close stream
            if (chunk.type === 'error') {
              controller.close();
              return;
            }
          }

          // Close stream if loop exits without completion
          controller.close();
        } catch (error) {
          console.error('[API] Generation error:', error);

          // Send error chunk
          const errorChunk: StreamingChunk = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
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
    console.error('[API] Error in /api/tools/generate:', error);

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
 * Get demo prompts
 */
export async function GET() {
  const { DEMO_PROMPTS } = await import('@hive/core');

  return NextResponse.json({
    demoPrompts: Array.from(DEMO_PROMPTS),
    model: 'gemini-1.5-pro',
    maxPromptLength: 1000,
    streamingSupported: true
  });
}
