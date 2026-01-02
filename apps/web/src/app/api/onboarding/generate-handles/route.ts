import { z } from "zod";
import { createCrudHandler, type ApiContext } from "@/lib/api-wrapper";
import { checkHandleAvailability, validateHandleFormat } from "@/lib/handle-service";

// Validation schema
const generateHandlesSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

interface GenerateHandlesResponse {
  handles: string[];
  error?: string;
}

// Handle modifiers for creative suggestions
const MODIFIERS = [
  'vibes', 'hive', 'ub', 'the', 'its', 'hey', 'real', 'just', 'hi',
  'im', 'yo', 'at', 'is', 'be', 'go', 'on', 'up', 'so'
];

// Years for variation
const YEARS = ['25', '26', '27', '28', '29'];

/**
 * Generate creative handle candidates from a name
 */
function generateCandidates(name: string): string[] {
  const parts = name.toLowerCase().trim().split(/\s+/);
  const first = parts[0] || '';
  const last = parts[parts.length - 1] || '';
  const initials = parts.map(p => p[0]).join('');

  // Clean up - only alphanumeric
  const cleanFirst = first.replace(/[^a-z0-9]/g, '');
  const cleanLast = last.replace(/[^a-z0-9]/g, '');

  if (!cleanFirst) return [];

  const candidates: string[] = [];

  // Classic: firstname + lastname
  if (cleanLast && cleanLast !== cleanFirst) {
    candidates.push(`${cleanFirst}${cleanLast}`);
    candidates.push(`${cleanFirst}.${cleanLast}`);
    candidates.push(`${cleanFirst}_${cleanLast}`);
  }

  // First name only
  candidates.push(cleanFirst);

  // First name + modifiers
  for (const mod of MODIFIERS) {
    candidates.push(`${cleanFirst}${mod}`);
    candidates.push(`${mod}${cleanFirst}`);
  }

  // First name + year
  for (const year of YEARS) {
    candidates.push(`${cleanFirst}${year}`);
  }

  // Initial patterns
  if (cleanLast && cleanLast !== cleanFirst) {
    candidates.push(`${cleanFirst[0]}${cleanLast}`);
    candidates.push(`${cleanFirst}${cleanLast[0]}`);
    candidates.push(`${initials}${YEARS[Math.floor(Math.random() * YEARS.length)]}`);
  }

  // Playful: reversed, doubled
  if (cleanFirst.length >= 3) {
    candidates.push(`the${cleanFirst}`);
    candidates.push(`${cleanFirst}x`);
    candidates.push(`${cleanFirst}o`);
  }

  // Shuffle for variety
  return shuffleArray(candidates);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Find N available handles from candidates
 */
async function findAvailableHandles(
  candidates: string[],
  count: number = 3
): Promise<string[]> {
  const available: string[] = [];

  for (const candidate of candidates) {
    if (available.length >= count) break;

    // Validate format first (synchronous)
    const formatResult = validateHandleFormat(candidate);
    if (!formatResult.isAvailable) continue;

    // Check availability (async)
    const result = await checkHandleAvailability(candidate);
    if (result.isAvailable && result.normalizedHandle) {
      // Avoid duplicates
      if (!available.includes(result.normalizedHandle)) {
        available.push(result.normalizedHandle);
      }
    }
  }

  return available;
}

// Modern API handler
const handler = createCrudHandler({
  post: async (context: ApiContext) => {
    const { name } = generateHandlesSchema.parse(context.body);

    if (!name.trim()) {
      return { handles: [], error: 'Name is required' } as GenerateHandlesResponse;
    }

    // Generate candidates
    const candidates = generateCandidates(name);

    if (candidates.length === 0) {
      return { handles: [], error: 'Could not generate handles from name' } as GenerateHandlesResponse;
    }

    // Find 3 available handles
    const handles = await findAvailableHandles(candidates, 3);

    if (handles.length === 0) {
      // Try with more modifiers if all taken
      const fallbackCandidates = [
        `${name.split(' ')[0]?.toLowerCase() || 'user'}${Date.now().toString().slice(-4)}`,
        `${name.split(' ')[0]?.toLowerCase() || 'user'}_hive`,
        `hive_${name.split(' ')[0]?.toLowerCase() || 'user'}`,
      ];
      const fallbackHandles = await findAvailableHandles(fallbackCandidates, 3);

      return {
        handles: fallbackHandles,
        error: fallbackHandles.length === 0 ? 'No handles available' : undefined
      } as GenerateHandlesResponse;
    }

    return { handles } as GenerateHandlesResponse;
  },
}, {
  public: true, // No auth required during onboarding
  rateLimit: 'api', // API rate limiting
  validation: {
    body: generateHandlesSchema,
  }
});

export const POST = handler;
