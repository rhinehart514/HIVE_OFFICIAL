import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import { HttpStatus } from '@/lib/api-response-types';
import { getServerSpaceRepository } from '@hive/core/server';

/**
 * RSS Feed Seeding for Spaces
 * Seeds spaces with initial content from RSS feeds to avoid empty feeling
 */

interface RSSFeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  categories?: string[];
}

// Example RSS feeds by space category
const RSS_FEEDS = {
  'student_org': [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.reddit.com/r/compsci/.rss'
  ],
  'university_org': [
    'https://www.buffalo.edu/news.rss'
  ],
  'greek_life': [
    'https://www.buffalo.edu/studentlife.rss'
  ],
  'residential': [
    'https://www.buffalo.edu/campuslife.rss'
  ]
};

/**
 * Validate space using DDD repository and check membership
 */
async function validateSpaceAndMembership(spaceId: string, userId: string, campusId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: 'Space not found' };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: 'Access denied' };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    if (!space.isPublic) {
      return { ok: false as const, status: HttpStatus.FORBIDDEN, message: 'Membership required' };
    }
    return { ok: true as const, space, membership: { role: 'guest' } };
  }

  return { ok: true as const, space, membership: membershipSnapshot.docs[0].data() };
}

export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  try {
    const validation = await validateSpaceAndMembership(spaceId, userId, campusId);
    if (!validation.ok) {
      const code =
        validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    const space = validation.space;
    const membershipRole = validation.membership.role as string | undefined;
    // Valid roles: owner, admin, moderator, member, guest
    if (!['owner', 'admin', 'moderator'].includes(membershipRole || '')) {
      return respond.error("Only space leaders can seed RSS content", "FORBIDDEN", {
        status: HttpStatus.FORBIDDEN,
      });
    }

    // Get appropriate RSS feeds for space category
    // Use default if category doesn't match RSS_FEEDS keys
    const categoryKey = space.category.value as string;
    const rssFeedsKeys = Object.keys(RSS_FEEDS) as Array<keyof typeof RSS_FEEDS>;
    const categoryFeeds = rssFeedsKeys.includes(categoryKey as keyof typeof RSS_FEEDS)
      ? RSS_FEEDS[categoryKey as keyof typeof RSS_FEEDS]
      : RSS_FEEDS['student_org'];

    let totalSeeded = 0;

    for (const feedUrl of categoryFeeds) {
      try {
        // Fetch RSS feed (simplified for demo)
        const feedItems = await fetchRSSFeed(feedUrl);

        // Seed recent items (last 5)
        const recentItems = feedItems.slice(0, 5);

        for (const item of recentItems) {
          const postData = {
            content: `📰 **${item.title}**\n\n${item.description}\n\n[Read more](${item.link})`,
            type: 'text',
            authorId: 'system',
            spaceId: spaceId,
            createdAt: new Date(item.pubDate),
            updatedAt: new Date(),
            lastActivity: new Date(item.pubDate),
            commentCount: 0,
            reactions: { heart: 0 },
            reactedUsers: { heart: [] },
            isPinned: false,
            isEdited: false,
            isDeleted: false,
            isRSSSeeded: true, // Mark as RSS content
            rssSource: feedUrl,
            campusId: campusId,
          };

          await dbAdmin
            .collection('spaces')
            .doc(spaceId)
            .collection('posts')
            .add(postData);

          totalSeeded++;
          // Real-time updates handled by Firestore listeners on client
        }
      } catch (feedError) {
        logger.warn('Failed to process RSS feed', { feedUrl, error: feedError });
      }
    }

    // Update space metadata - use increment for rssSeededCount
    const { FieldValue } = await import('firebase-admin/firestore');
    await dbAdmin.collection('spaces').doc(spaceId).update({
      lastRSSSeeded: new Date(),
      rssSeededCount: FieldValue.increment(totalSeeded),
      updatedAt: new Date()
    });

    return respond.success({
      seededPosts: totalSeeded,
      feedsProcessed: categoryFeeds.length
    }, {
      message: `Successfully seeded ${totalSeeded} posts from RSS feeds`
    });

  } catch (error) {
    logger.error('Error seeding RSS content', { error: { error: error instanceof Error ? error.message : String(error) }, spaceId, userId });
    return respond.error("Failed to seed RSS content", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * Fetch and parse RSS/Atom feeds.
 * Keeps parsing lightweight to avoid adding a new runtime dependency.
 */
async function fetchRSSFeed(feedUrl: string): Promise<RSSFeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'HIVE RSS Importer/1.0',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed (${response.status})`);
    }

    const xml = await response.text();
    const rssItems = parseRssItems(xml);
    if (rssItems.length > 0) {
      return rssItems;
    }

    const atomItems = parseAtomItems(xml);
    return atomItems;
  } finally {
    clearTimeout(timeout);
  }
}

function parseRssItems(xml: string): RSSFeedItem[] {
  const items: RSSFeedItem[] = [];
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  for (const block of itemBlocks) {
    const title = decodeXmlEntities(extractTag(block, 'title'));
    const descriptionRaw = decodeXmlEntities(extractTag(block, 'description'));
    const link = decodeXmlEntities(extractTag(block, 'link'));
    const pubDateRaw = decodeXmlEntities(extractTag(block, 'pubDate'));
    const categories = extractTags(block, 'category').map((value) => decodeXmlEntities(value));

    if (!title || !link) continue;

    const pubDate = normalizeDate(pubDateRaw);
    const description = cleanDescription(descriptionRaw);

    items.push({
      title,
      description,
      link,
      pubDate,
      categories: categories.length > 0 ? categories : undefined,
    });
  }

  return items;
}

function parseAtomItems(xml: string): RSSFeedItem[] {
  const items: RSSFeedItem[] = [];
  const entryBlocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

  for (const block of entryBlocks) {
    const title = decodeXmlEntities(extractTag(block, 'title'));
    const summary = decodeXmlEntities(extractTag(block, 'summary'));
    const content = decodeXmlEntities(extractTag(block, 'content'));
    const link = extractAtomLink(block);
    const pubDateRaw = decodeXmlEntities(extractTag(block, 'published') || extractTag(block, 'updated'));

    if (!title || !link) continue;

    items.push({
      title,
      description: cleanDescription(summary || content),
      link,
      pubDate: normalizeDate(pubDateRaw),
    });
  }

  return items;
}

function extractTag(source: string, tag: string): string {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = source.match(regex);
  if (!match?.[1]) return '';

  return match[1]
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .trim();
}

function extractTags(source: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const values: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    if (match[1]) {
      values.push(
        match[1]
          .replace(/^<!\[CDATA\[/, '')
          .replace(/\]\]>$/, '')
          .trim()
      );
    }
  }

  return values;
}

function extractAtomLink(entryBlock: string): string {
  const hrefMatch = entryBlock.match(/<link\b[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (hrefMatch?.[1]) return decodeXmlEntities(hrefMatch[1]);

  const textLink = decodeXmlEntities(extractTag(entryBlock, 'link'));
  return textLink;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function cleanDescription(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

function normalizeDate(value: string): string {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return new Date().toISOString();
}
