import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { withCache } from '../../../../lib/cache-headers';
import { COMPOSITION_PATTERNS } from '@/lib/ai-generator/composition-patterns';
import type { Intent } from '@/lib/ai-generator/intent-detection';

const CategorySchema = z.enum([
  'governance',
  'scheduling',
  'commerce',
  'content',
  'social',
  'events',
  'org-management',
  'campus-life',
]);

const SpaceTypeSchema = z.enum([
  'student_org',
  'university_org',
  'greek_life',
  'campus_living',
  'hive_exclusive',
]);

const SortSchema = z.enum(['popular', 'recent', 'trending']);

type DiscoveryCategory = z.infer<typeof CategorySchema>;
type DiscoverySpaceType = z.infer<typeof SpaceTypeSchema>;
type DiscoverySort = z.infer<typeof SortSchema>;

interface ToolRecord {
  id: string;
  name: string;
  description: string;
  category: DiscoveryCategory;
  creatorId?: string;
  creatorName?: string;
  spaceOrigin: {
    id: string | null;
    name: string | null;
    type: DiscoverySpaceType | null;
  };
  forkCount: number;
  useCount: number;
  createdAt: string;
  createdAtDate: Date;
  thumbnail: string | null;
  trendingScore: number;
  popularityScore: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const INTENT_TO_CATEGORY: Partial<Record<Intent, DiscoveryCategory>> = {
  'multi-vote': 'governance',
  'enable-voting': 'governance',
  'track-time': 'scheduling',
  'event-series': 'scheduling',
  'resource-management': 'commerce',
  'competition-goals': 'commerce',
  'collect-input': 'content',
  'show-results': 'content',
  'visualize-data': 'content',
  broadcast: 'content',
  'custom-visual': 'social',
  'group-matching': 'social',
  'photo-challenge': 'social',
  'discover-events': 'events',
  'attendance-tracking': 'org-management',
  'suggestion-triage': 'org-management',
  'find-food': 'campus-life',
  'find-study-spot': 'campus-life',
  'search-filter': 'campus-life',
  'coordinate-people': 'events',
  'rank-items': 'org-management',
};

const PATTERN_INTENT_BY_ID = new Map<string, Intent>();
for (const [intent, patterns] of Object.entries(COMPOSITION_PATTERNS)) {
  for (const pattern of patterns || []) {
    PATTERN_INTENT_BY_ID.set(pattern.id, intent as Intent);
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date(0);
}

function normalizeSpaceType(value: unknown): DiscoverySpaceType | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  const parsed = SpaceTypeSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

function resolveCategory(data: Record<string, unknown>): DiscoveryCategory {
  const directCategory = CategorySchema.safeParse(data.category);
  if (directCategory.success) {
    return directCategory.data;
  }

  const metadata = (data.metadata as Record<string, unknown> | undefined) || {};
  const metadataCategory = CategorySchema.safeParse(metadata.patternCategory);
  if (metadataCategory.success) {
    return metadataCategory.data;
  }

  const patternId = typeof metadata.patternId === 'string' ? metadata.patternId : null;
  if (patternId && PATTERN_INTENT_BY_ID.has(patternId)) {
    const intent = PATTERN_INTENT_BY_ID.get(patternId);
    if (intent && INTENT_TO_CATEGORY[intent]) {
      return INTENT_TO_CATEGORY[intent] as DiscoveryCategory;
    }
  }

  const intentRaw =
    (typeof metadata.intent === 'string' ? metadata.intent : null) ||
    (typeof data.intent === 'string' ? data.intent : null);
  if (intentRaw) {
    const mapped = INTENT_TO_CATEGORY[intentRaw as Intent];
    if (mapped) {
      return mapped;
    }
  }

  const text = `${String(data.name || '')} ${String(data.description || '')}`.toLowerCase();
  if (text.includes('vote') || text.includes('election') || text.includes('ballot')) {
    return 'governance';
  }
  if (text.includes('rsvp') || text.includes('event')) {
    return 'events';
  }
  if (text.includes('schedule') || text.includes('countdown') || text.includes('timeline')) {
    return 'scheduling';
  }
  if (text.includes('dining') || text.includes('study') || text.includes('campus')) {
    return 'campus-life';
  }

  return 'content';
}

function getForkCount(data: Record<string, unknown>): number {
  const direct = typeof data.forkCount === 'number' ? data.forkCount : null;
  if (direct !== null) {
    return direct;
  }

  const provenance = data.provenance as Record<string, unknown> | undefined;
  return typeof provenance?.forkCount === 'number' ? provenance.forkCount : 0;
}

function getUseCount(data: Record<string, unknown>): number {
  if (typeof data.useCount === 'number') {
    return data.useCount;
  }

  const stats = data.stats as Record<string, unknown> | undefined;
  if (stats && typeof stats.uses === 'number') {
    return stats.uses;
  }

  return 0;
}

function isPublishedTool(data: Record<string, unknown>): boolean {
  return data.status === 'published';
}

const _GET = withAuthAndErrors(async (
  request,
  _context,
  respond,
) => {
  const req = request as AuthenticatedRequest;
  const campusId = getCampusId(req);
  const { searchParams } = new URL(request.url);

  const categoryFilter = CategorySchema.safeParse(searchParams.get('category') || undefined);
  const spaceTypeFilter = SpaceTypeSchema.safeParse(searchParams.get('spaceType') || undefined);
  const sortFilter = SortSchema.safeParse(searchParams.get('sort') || undefined);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

  const category = categoryFilter.success ? categoryFilter.data : undefined;
  const spaceType = spaceTypeFilter.success ? spaceTypeFilter.data : undefined;
  const sort = sortFilter.success ? sortFilter.data : ('popular' as DiscoverySort);

  const snapshot = await dbAdmin
    .collection('tools')
    .where('status', '==', 'published')
    .get();

  const rawTools: Array<Record<string, unknown> & { id: string }> = snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
    .filter((data) => isPublishedTool(data));

  // Campus filtering is kept in-memory to avoid composite index requirements.
  const campusFiltered = rawTools.filter((tool) => {
    if (!campusId) {
      return true;
    }
    const toolCampusId = tool.campusId as string | undefined;
    return !toolCampusId || toolCampusId === campusId;
  });

  const spaceIdsToFetch = new Set<string>();
  for (const tool of campusFiltered) {
    const originalContext = tool.originalContext as Record<string, unknown> | undefined;
    if (originalContext?.type === 'space' && typeof originalContext.id === 'string') {
      spaceIdsToFetch.add(originalContext.id);
    }
    if (typeof tool.spaceId === 'string') {
      spaceIdsToFetch.add(tool.spaceId);
    }
  }

  const spaceMeta = new Map<string, { name: string | null; type: DiscoverySpaceType | null }>();
  if (spaceIdsToFetch.size > 0) {
    const refs = Array.from(spaceIdsToFetch).map((spaceId) =>
      dbAdmin.collection('spaces').doc(spaceId)
    );
    const docs = await dbAdmin.getAll(...refs);
    for (const doc of docs) {
      if (!doc.exists) {
        continue;
      }
      const data = doc.data() || {};
      spaceMeta.set(doc.id, {
        name: (data.name as string | undefined) || null,
        type: normalizeSpaceType(data.type || data.spaceType),
      });
    }
  }

  const now = new Date();
  const normalized: ToolRecord[] = campusFiltered.map((tool) => {
    const createdAtDate = toDate(tool.createdAt);
    const daysSinceCreation = Math.max(
      0,
      (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyMultiplier = 1 / (1 + daysSinceCreation / 7);
    const forkCount = getForkCount(tool);
    const useCount = getUseCount(tool);
    const originalContext = tool.originalContext as Record<string, unknown> | undefined;
    const metadata = (tool.metadata as Record<string, unknown> | undefined) || {};

    const originSpaceId =
      (typeof originalContext?.id === 'string' && originalContext?.type === 'space'
        ? originalContext.id
        : undefined) ||
      (typeof tool.spaceId === 'string' ? tool.spaceId : undefined) ||
      (typeof metadata.spaceId === 'string' ? metadata.spaceId : undefined) ||
      null;

    const fallbackSpaceType =
      normalizeSpaceType(tool.spaceType) ||
      normalizeSpaceType(metadata.spaceType) ||
      null;

    return {
      id: tool.id as string,
      name: (tool.name as string | undefined) || 'Untitled Tool',
      description: (tool.description as string | undefined) || '',
      category: resolveCategory(tool),
      creatorId:
        (tool.ownerId as string | undefined) ||
        (tool.creatorId as string | undefined) ||
        (tool.createdBy as string | undefined),
      creatorName: (tool.creatorName as string | undefined) || undefined,
      spaceOrigin: {
        id: originSpaceId,
        name: originSpaceId ? (spaceMeta.get(originSpaceId)?.name || null) : null,
        type: originSpaceId
          ? (spaceMeta.get(originSpaceId)?.type || fallbackSpaceType)
          : fallbackSpaceType,
      },
      forkCount,
      useCount,
      createdAt: createdAtDate.toISOString(),
      createdAtDate,
      thumbnail:
        (tool.thumbnailUrl as string | undefined) ||
        (tool.previewImage as string | undefined) ||
        (metadata.thumbnail as string | undefined) ||
        null,
      popularityScore: forkCount + useCount,
      trendingScore: (forkCount * 3 + useCount) * recencyMultiplier,
    };
  });

  const filtered = normalized.filter((tool) => {
    if (category && tool.category !== category) {
      return false;
    }
    if (spaceType && tool.spaceOrigin.type !== spaceType) {
      return false;
    }
    if (q) {
      const haystack = `${tool.name} ${tool.description}`.toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sort === 'recent') {
      return b.createdAtDate.getTime() - a.createdAtDate.getTime();
    }
    if (sort === 'trending') {
      if (b.trendingScore !== a.trendingScore) {
        return b.trendingScore - a.trendingScore;
      }
      return b.createdAtDate.getTime() - a.createdAtDate.getTime();
    }
    if (b.popularityScore !== a.popularityScore) {
      return b.popularityScore - a.popularityScore;
    }
    return b.createdAtDate.getTime() - a.createdAtDate.getTime();
  });

  const paginated = filtered.slice(offset, offset + limit);
  const creatorIds = Array.from(
    new Set(paginated.map((tool) => tool.creatorId).filter((value): value is string => Boolean(value)))
  );

  const creatorNameMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const refs = creatorIds.map((creatorId) => dbAdmin.collection('users').doc(creatorId));
    const docs = await dbAdmin.getAll(...refs);
    for (const doc of docs) {
      if (!doc.exists) {
        continue;
      }
      const data = doc.data() || {};
      const name =
        (data.displayName as string | undefined) ||
        (data.fullName as string | undefined) ||
        (data.name as string | undefined) ||
        'Unknown';
      creatorNameMap.set(doc.id, name);
    }
  }

  return respond.success({
    tools: paginated.map((tool) => ({
      id: tool.id,
      title: tool.name,
      description: tool.description,
      category: tool.category,
      creator: {
        id: tool.creatorId || null,
        name: (tool.creatorId && creatorNameMap.get(tool.creatorId)) || tool.creatorName || 'Unknown',
      },
      spaceOrigin: tool.spaceOrigin,
      forkCount: tool.forkCount,
      useCount: tool.useCount,
      createdAt: tool.createdAt,
      thumbnail: tool.thumbnail,
    })),
    pagination: {
      limit,
      offset,
      total: filtered.length,
      hasMore: offset + limit < filtered.length,
    },
    filters: {
      category: category || null,
      spaceType: spaceType || null,
      sort,
      q: q || null,
    },
  });
});

export const GET = withCache(_GET, 'SHORT');
