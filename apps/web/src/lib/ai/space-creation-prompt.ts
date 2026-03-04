/**
 * Space Creation Prompt Builder + Generator
 *
 * Generates contextually relevant creations (poll, bracket, RSVP) for a space
 * using Groq. Server-side only.
 */

import { z } from 'zod';
import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { logger } from '@/lib/logger';
import {
  PollConfigSchema,
  BracketConfigSchema,
  RSVPConfigSchema,
} from '@/lib/shells/index';
import type { PollConfig, BracketConfig, RSVPConfig } from '@/lib/shells/types';

// ============================================================================
// TYPES
// ============================================================================

export interface UpcomingEvent {
  title: string;
  date?: string;
  type?: string;
}

export interface SpaceContext {
  name: string;
  description?: string;
  type?: string;
  category?: string;
  tags?: string[];
  orgTypeName?: string;
  upcomingEvent?: UpcomingEvent;
}

export interface SpaceCreationResult {
  shellFormat: 'poll' | 'bracket' | 'rsvp';
  shellConfig: PollConfig | BracketConfig | RSVPConfig;
  title: string;
  description: string;
}

// ============================================================================
// RESPONSE SCHEMA
// ============================================================================

const SpaceCreationResponseSchema = z.object({
  shellFormat: z.enum(['poll', 'bracket', 'rsvp']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  config: z.union([
    z.object({
      type: z.literal('poll'),
      question: z.string().min(1).max(300),
      options: z.array(z.string().min(1).max(100)).min(2).max(6),
    }),
    z.object({
      type: z.literal('bracket'),
      topic: z.string().min(1).max(200),
      entries: z.array(z.string().min(1).max(100)).min(4).max(16),
    }),
    z.object({
      type: z.literal('rsvp'),
      title: z.string().min(1).max(200),
      dateTime: z.string().optional(),
      location: z.string().max(200).optional(),
      capacity: z.number().min(1).max(10000).optional(),
    }),
  ]),
});

// ============================================================================
// PROMPT BUILDER
// ============================================================================

export function buildSpaceCreationPrompt(space: {
  name: string;
  description?: string;
  type?: string;
  category?: string;
  tags?: string[];
  orgTypeName?: string;
  upcomingEvent?: UpcomingEvent;
}): string {
  const spaceInfo = [
    `Space name: "${space.name}"`,
    space.description ? `Description: "${space.description}"` : null,
    space.type ? `Type: ${space.type}` : null,
    space.category ? `Category: ${space.category}` : null,
    space.orgTypeName ? `Org type: ${space.orgTypeName}` : null,
    space.tags?.length ? `Tags: ${space.tags.join(', ')}` : null,
    space.upcomingEvent ? `Upcoming event: "${space.upcomingEvent.title}"${space.upcomingEvent.date ? ` on ${space.upcomingEvent.date}` : ''}${space.upcomingEvent.type ? ` (${space.upcomingEvent.type})` : ''}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are a creation generator for HIVE, a campus social platform at the University at Buffalo (UB), Buffalo NY.

Campus context:
- Dining: Crossroads, C3, Governor's, Sizzles, Tikka House, Moe's, Tim Hortons, Au Bon Pain, Hubie's (late night)
- Study spots: Lockwood Library, Silverman, Capen Hall, NSC, Student Union
- Hangouts: Student Union, Ellicott Complex, Center for Tomorrow

Given a student organization or space, generate ONE interactive creation that would be engaging and relevant for that community.

Choose the BEST format for this space:
- "poll": A question with 2-6 multiple choice options. Best for opinions, preferences, decisions.
- "bracket": A tournament with 4-16 entries competing head-to-head. Best for rankings, favorites, competitions.
- "rsvp": An event attendance tracker. Best for meetings, hangouts, activities.

${spaceInfo}

RULES:
- Make it specific to the space's identity and interests
- Use casual, fun language that college students would engage with
- For polls: ask a question members would actually debate
- For brackets: pick entries members would have strong opinions about
- For RSVP: suggest a realistic event the space might host
- If an upcoming event is listed, strongly prefer creating something related to it (e.g. an agenda poll, RSVP, or bracket for the event)
- The title should be catchy and short (what appears as the app name)
- The description should be one sentence explaining the creation

EXAMPLES:
- Space "UB Chess Club" → Poll: "Best chess opening?" with options ["Sicilian Defense", "Queen's Gambit", "Italian Game", "King's Indian"]
- Space "UB Film Society" → Bracket: "Greatest Director Tournament" with entries ["Spielberg", "Scorsese", "Kubrick", "Tarantino", "Nolan", "Coppola", "Hitchcock", "Kurosawa"]
- Space "UB Hiking Club" → RSVP: "Spring Trail Day" with location "Letchworth State Park"

Return JSON with:
- "shellFormat": "poll" | "bracket" | "rsvp"
- "title": short catchy name for the creation
- "description": one-sentence description
- "config": the format-specific config object with a "type" field matching shellFormat
  - For poll: { type: "poll", question, options }
  - For bracket: { type: "bracket", topic, entries }
  - For rsvp: { type: "rsvp", title, dateTime?, location?, capacity? }`;
}

// ============================================================================
// GENERATOR
// ============================================================================

export async function generateSpaceCreation(
  space: SpaceContext
): Promise<SpaceCreationResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn('GROQ_API_KEY not configured, cannot generate space creation', {
      component: 'space-creation',
    });
    return null;
  }

  try {
    const startTime = Date.now();
    const groq = createGroq({ apiKey });

    const result = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: SpaceCreationResponseSchema,
      system: buildSpaceCreationPrompt(space),
      prompt: `Generate one creation for the space "${space.name}".`,
      temperature: 0.7,
      maxRetries: 1,
    });

    const { shellFormat, title, description, config } = result.object;

    // Validate config against the proper Zod schema
    let shellConfig: PollConfig | BracketConfig | RSVPConfig;

    if (shellFormat === 'poll' && config.type === 'poll') {
      const parsed = PollConfigSchema.safeParse({
        question: config.question,
        options: config.options,
      });
      if (!parsed.success) {
        logger.warn('Poll config validation failed', {
          component: 'space-creation',
          metadata: { errors: JSON.stringify(parsed.error.flatten()) },
        });
        return null;
      }
      shellConfig = parsed.data;
    } else if (shellFormat === 'bracket' && config.type === 'bracket') {
      const parsed = BracketConfigSchema.safeParse({
        topic: config.topic,
        entries: config.entries,
      });
      if (!parsed.success) {
        logger.warn('Bracket config validation failed', {
          component: 'space-creation',
          metadata: { errors: JSON.stringify(parsed.error.flatten()) },
        });
        return null;
      }
      shellConfig = parsed.data;
    } else if (shellFormat === 'rsvp' && config.type === 'rsvp') {
      const parsed = RSVPConfigSchema.safeParse({
        title: config.title,
        dateTime: config.dateTime,
        location: config.location,
        capacity: config.capacity,
      });
      if (!parsed.success) {
        logger.warn('RSVP config validation failed', {
          component: 'space-creation',
          metadata: { errors: JSON.stringify(parsed.error.flatten()) },
        });
        return null;
      }
      shellConfig = parsed.data;
    } else {
      logger.warn('Shell format and config type mismatch', {
        component: 'space-creation',
        metadata: { shellFormat, configType: config.type },
      });
      return null;
    }

    const duration = Date.now() - startTime;

    logger.info('Space creation generated', {
      component: 'space-creation',
      metadata: {
        spaceName: space.name,
        shellFormat,
        title,
        durationMs: String(duration),
      },
    });

    return { shellFormat, shellConfig, title, description };
  } catch (error) {
    logger.error('Space creation generation failed', {
      component: 'space-creation',
      metadata: {
        spaceName: space.name,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return null;
  }
}
