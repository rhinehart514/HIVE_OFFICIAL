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
import { dbAdmin } from '@/lib/firebase-admin';
import { buildCampusContextPrompt } from '@hive/core/domain';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
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

/**
 * Build the classification system prompt with optional campus context.
 * Falls back to a generic prompt if campusId is not recognized.
 */
function buildClassifySystemPrompt(campusId?: string): string {
  const campusBlock = campusId ? buildCampusContextPrompt(campusId) : null;
  const campusSection = campusBlock ? `\n${campusBlock}\n` : '';

  return `You are a format classifier for a campus social platform called HIVE.
${campusSection}
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
- For polls, always extract 2-6 options. If the user lists items, those are the options. If no explicit options, generate reasonable ones from context. Use campus-specific options when relevant (e.g. dining hall names, study spots).
- For brackets, extract 4-16 entries. Pad to next power of 2 if needed. Use real campus names when the prompt is about campus topics.
- For RSVP, extract any date/time and location mentioned. Use real campus locations when applicable.
- confidence should be 0.0-1.0 where 1.0 means very certain

Return JSON matching this exact schema:
{
  "format": "poll" | "bracket" | "rsvp" | "custom",
  "confidence": number,
  "config": { ... } | null
}`;
}

// ============================================================================
// SPACE CONTEXT HELPER
// ============================================================================

async function fetchSpaceContext(spaceId: string): Promise<string | null> {
  try {
    const doc = await dbAdmin.collection('spaces').doc(spaceId).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    const parts = [
      `Space: "${data.name || 'Unnamed'}"`,
      data.category ? `Category: ${data.category}` : null,
      data.orgTypeName ? `Org type: ${data.orgTypeName}` : null,
      data.tags?.length ? `Tags: ${data.tags.join(', ')}` : null,
    ].filter(Boolean);
    return parts.join(' | ');
  } catch {
    return null;
  }
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export const POST = withAuthAndErrors(
  async (request, _context, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const body = await request.json();

    const parsed = ClassifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return respond.error('Invalid request body', 'INVALID_INPUT', {
        status: 400,
        details: { errors: parsed.error.flatten().fieldErrors },
      });
    }

    const { prompt, spaceId } = parsed.data;

    // Fetch space context if spaceId provided
    const spaceContext = spaceId ? await fetchSpaceContext(spaceId) : null;

    // Check Groq API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.warn('GROQ_API_KEY not configured, falling back to custom format', {
        component: 'classify',
        metadata: { env: process.env.NODE_ENV || 'unknown' },
      });
      // Always fallback gracefully — don't block creation
      return respond.success({
        format: 'custom',
        confidence: 0,
        config: null,
      });
    }

    try {
      const startTime = Date.now();

      const groq = createGroq({ apiKey });

      const userPrompt = spaceContext
        ? `Context: ${spaceContext}\n\nClassify this prompt: "${prompt}"`
        : `Classify this prompt: "${prompt}"`;

      const result = await generateObject({
        model: groq('llama-3.3-70b-versatile'),
        schema: ClassifyResponseSchema,
        system: buildClassifySystemPrompt(campusId || undefined),
        prompt: userPrompt,
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
      logger.error('Shell classification failed, falling back to custom', {
        component: 'classify',
        metadata: {
          userId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      // Graceful fallback: let the user proceed with custom format
      // rather than blocking creation entirely
      return respond.success({
        format: 'custom' as const,
        confidence: 0,
        config: null,
      });
    }
  },
  { rateLimit: RATE_LIMIT_PRESETS.ai }
);
