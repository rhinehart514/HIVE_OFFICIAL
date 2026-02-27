/**
 * Conversational Lab Chat API
 *
 * Pre-generation conversation phase. The AI chats naturally with the user
 * to refine their idea before triggering code generation. Returns structured
 * output with a readyToBuild flag that the client uses to auto-trigger generation.
 */

import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { withAuthAndErrors } from '@/lib/middleware';
import { logger } from '@/lib/logger';

const RequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).min(1).max(10),
  spaceContext: z.object({
    spaceId: z.string(),
    spaceName: z.string(),
    spaceType: z.string().optional(),
  }).optional(),
});

const SYSTEM_PROMPT = `You are a creative app builder assistant on HIVE, a social platform for college campuses. Students use you to build small interactive apps (timers, polls, trackers, games, tools, etc.).

Your job: have a brief, natural conversation to understand what the user wants to build, then trigger generation when you have enough detail.

Rules:
- Be warm, casual, and concise. You're talking to college students. One short paragraph max per response.
- If the request is clear and specific enough to build (e.g. "countdown timer for finals week", "poll for picking a restaurant"), set readyToBuild to true immediately. Don't ask unnecessary questions.
- If the request is vague (e.g. "something for my dorm", "an app", "something fun"), ask 1-2 focused questions to understand what they actually need. Never more than 2 questions before building.
- When readyToBuild is true, write a detailed buildPrompt that describes exactly what to generate — include features, layout, behavior, and any specifics the user mentioned.
- Never ask about technical implementation (frameworks, languages). Focus on what the app does and who it's for.
- If a space context is provided, factor in the space name and type when understanding the request.`;

export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const body = RequestSchema.parse(await request.json());

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return respond.error('Chat service unavailable', 'SERVICE_UNAVAILABLE', { status: 503 });
  }

  const groq = createGroq({ apiKey: groqApiKey });

  const systemContent = body.spaceContext
    ? `${SYSTEM_PROMPT}\n\nThe user is building within a space called "${body.spaceContext.spaceName}"${body.spaceContext.spaceType ? ` (type: ${body.spaceContext.spaceType})` : ''}.`
    : SYSTEM_PROMPT;

  try {
    const result = await generateObject({
      model: groq(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'),
      schema: z.object({
        response: z.string().describe('Your conversational response to the user'),
        readyToBuild: z.boolean().describe('True when you have enough detail to generate the app'),
        buildPrompt: z.string().optional().describe('Detailed prompt for code generation when readyToBuild is true'),
      }),
      messages: [
        { role: 'system', content: systemContent },
        ...body.messages,
      ],
    });

    return respond.success(result.object);
  } catch (error) {
    logger.error('Lab chat failed', {
      component: 'api/tools/chat',
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Chat failed', 'INTERNAL_ERROR', { status: 500 });
  }
});
