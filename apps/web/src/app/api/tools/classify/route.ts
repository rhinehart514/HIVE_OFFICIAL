/**
 * Shell Classification API
 *
 * POST /api/tools/classify
 *
 * Takes a natural language prompt and classifies it into one of the
 * native format shells (poll, bracket, rsvp) or falls back to 'custom'.
 * Uses Groq llama-3.3-70b with structured JSON output (~500ms).
 */

import { z } from 'zod';
import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
  RATE_LIMIT_PRESETS,
} from '@/lib/middleware';

// ============================================================================
// REQUEST / RESPONSE SCHEMAS
// ============================================================================

const ClassifyRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  spaceId: z.string().optional(),
});

const ClassifyResponseSchema = z.object({
  format: z.enum(['poll', 'bracket', 'rsvp', 'custom']),
  confidence: z.number().min(0).max(1),
  config: z.union([
    // Poll config
    z.object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(6),
      timerSeconds: z.number().optional(),
    }),
    // Bracket config
    z.object({
      topic: z.string(),
      entries: z.array(z.string()).min(4).max(16),
    }),
    // RSVP config
    z.object({
      title: z.string(),
      dateTime: z.string().optional(),
      location: z.string().optional(),
      capacity: z.number().optional(),
    }),
    // Custom — no structured config
    z.null(),
  ]),
});

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const CLASSIFY_SYSTEM_PROMPT = `You are a format classifier for a campus social platform called HIVE.

Given a user's natural language prompt, classify it into one of these formats:
- "poll": The user wants to ask a question with multiple choice options. Extract the question and options.
- "bracket": The user wants a tournament/bracket where entries compete head-to-head. Extract the topic and entries.
- "rsvp": The user wants to track attendance for an event or gathering. Extract the title, date/time, and location if mentioned.
- "custom": Anything that doesn't fit the above formats.

RULES:
- If the prompt mentions voting between options, choosing favorites, or "which" questions → poll
- If the prompt mentions "bracket", "tournament", "march madness", or head-to-head competition → bracket
- If the prompt mentions "coming", "attending", "RSVP", "who's in", "party", "meeting", or event-like language → rsvp
- If unsure or the prompt is too vague, classify as "custom" with confidence < 0.5
- For polls, always extract 2-6 options. If the user lists items, those are the options. If no explicit options, generate reasonable ones from context.
- For brackets, extract 4-16 entries. Pad to next power of 2 if needed.
- For RSVP, extract any date/time and location mentioned.
- confidence should be 0.0-1.0 where 1.0 means very certain

Return JSON matching this exact schema:
{
  "format": "poll" | "bracket" | "rsvp" | "custom",
  "confidence": number,
  "config": { ... } | null
}`;

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export const POST = withAuthAndErrors(
  async (request, _context, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const body = await request.json();

    const parsed = ClassifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return respond.error('Invalid request body', 'INVALID_INPUT', {
        status: 400,
        details: { errors: parsed.error.flatten().fieldErrors },
      });
    }

    const { prompt } = parsed.data;

    // Check Groq API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.warn('GROQ_API_KEY not configured, falling back to custom', {
        component: 'classify',
      });
      return respond.success({
        format: 'custom',
        confidence: 0,
        config: null,
      });
    }

    try {
      const startTime = Date.now();

      const groq = createGroq({ apiKey });

      const result = await generateObject({
        model: groq('llama-3.3-70b-versatile'),
        schema: ClassifyResponseSchema,
        system: CLASSIFY_SYSTEM_PROMPT,
        prompt: `Classify this prompt: "${prompt}"`,
        temperature: 0.1,
        maxRetries: 1,
      });

      const duration = Date.now() - startTime;

      logger.info('Shell classification completed', {
        component: 'classify',
        metadata: {
          userId,
          format: result.object.format,
          confidence: String(result.object.confidence),
          durationMs: String(duration),
        },
      });

      return respond.success(result.object);
    } catch (error) {
      logger.error('Shell classification failed', {
        component: 'classify',
        metadata: {
          userId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      // Graceful fallback to custom
      return respond.success({
        format: 'custom' as const,
        confidence: 0,
        config: null,
      });
    }
  },
  { rateLimit: RATE_LIMIT_PRESETS.ai }
);
