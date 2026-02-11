import { type NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { validateApiAuth } from "@/lib/api-auth-middleware";
import { dbAdmin, isFirebaseConfigured } from "@/lib/firebase-admin";

const FEED_URL = "https://buffalo.campuslabs.com/engage/events.rss";
const CAMPUS_ID = "ub-buffalo";
const TIMEZONE = "America/New_York";

type SpaceIndex = {
  id: string;
  name: string;
  normalizedName: string;
};

export async function GET(request: NextRequest) {
  return runSync(request);
}

export async function POST(request: NextRequest) {
  return runSync(request);
}

async function runSync(request: NextRequest) {
  if (!isFirebaseConfigured) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured" },
      { status: 503 }
    );
  }

  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncCampusLabsEvents();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to sync CampusLabs events",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get("authorization");
  const key = request.nextUrl.searchParams.get("key");
  if (authHeader === `Bearer ${secret}` || key === secret) {
    return true;
  }

  try {
    const auth = await validateApiAuth(request, {
      requireAdmin: true,
      operation: "cron-sync-events",
    });
    return Boolean(auth.isAdmin);
  } catch {
    return false;
  }
}

async function syncCampusLabsEvents() {
  const feedResponse = await fetch(FEED_URL, { cache: "no-store" });
  if (!feedResponse.ok) {
    throw new Error(`RSS fetch failed: ${feedResponse.status} ${feedResponse.statusText}`);
  }

  const xml = await feedResponse.text();
  const parsed: any = await parseStringPromise(xml, { explicitArray: false, trim: true });
  const items = toArray(parsed?.rss?.channel?.item);
  const spaces = await loadCampusLabsSpaces();

  let created = 0;
  let updated = 0;
  let noMatch = 0;

  for (const item of items) {
    const title = toText(item?.title) || "Untitled Event";
    const htmlDescription = toText(item?.description);
    const description = stripHtml(htmlDescription);
    const location = toText(item?.location) || "TBD";
    const categories = uniq(toArray(item?.category).map(toText).filter(Boolean));
    const hosts = collectHosts(item);
    const link = toText(item?.link);
    const guid = toText(item?.guid);

    const startDate = parseDate(item?.start);
    if (!startDate) continue;

    const endDate = parseDate(item?.end) || startDate;
    const eventId = getEventId(link || guid, `${title}-${toText(item?.start)}`);
    const eventType = inferEventType(categories, title, description);
    const imageUrl = getImageUrl(item);

    const primaryHost = hosts[0] || "";
    const matchedSpace = primaryHost ? findSpaceMatch(primaryHost, spaces) : null;
    if (!matchedSpace) noMatch += 1;

    const eventRef = dbAdmin.collection("events").doc(eventId);
    const existingDoc = await eventRef.get();

    const eventDoc: any = {
      title,
      description,
      location,
      locationType: inferLocationType(location),
      startAt: Timestamp.fromDate(startDate),
      endAt: Timestamp.fromDate(endDate),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timezone: TIMEZONE,
      type: eventType,
      eventType,
      state: "published",
      status: "scheduled",
      isHidden: false,
      campusId: CAMPUS_ID,
      source: {
        platform: "campuslabs",
        guid: guid || link || eventId,
        url: link || guid || null,
        hosts,
        status: toText(item?.status) || "confirmed",
      },
      categories,
      tags: categories,
      imageUrl: imageUrl || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      importedAt: FieldValue.serverTimestamp(),
    };

    if (matchedSpace) {
      eventDoc.spaceId = matchedSpace.id;
      eventDoc.spaceName = matchedSpace.name;
    }

    await eventRef.set(eventDoc, { merge: true });

    if (existingDoc.exists) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return { created, updated, noMatch, total: items.length };
}

async function loadCampusLabsSpaces(): Promise<SpaceIndex[]> {
  const snapshot = await dbAdmin
    .collection("spaces")
    .where("source.platform", "==", "campuslabs")
    .get();

  return snapshot.docs
    .map(doc => {
      const data: any = doc.data();
      const name = toText(data?.name);
      const campusId = toText(data?.campusId);
      if (!name || (campusId && campusId !== CAMPUS_ID)) return null;
      return { id: doc.id, name, normalizedName: normalize(name) };
    })
    .filter(Boolean) as SpaceIndex[];
}

function findSpaceMatch(host: string, spaces: SpaceIndex[]) {
  const normalizedHost = normalize(host);
  if (!normalizedHost) return null;

  const exact = spaces.find(space => space.normalizedName === normalizedHost);
  if (exact) return exact;

  for (const space of spaces) {
    if (
      space.normalizedName.includes(normalizedHost) ||
      normalizedHost.includes(space.normalizedName)
    ) {
      return space;
    }
  }

  return null;
}

function getEventId(sourceUrl: string, fallback: string) {
  const eventNum = sourceUrl.match(/\/event\/(\d+)(?:[/?#]|$)/i)?.[1];
  if (eventNum) return `campuslabs-${eventNum}`;

  const stable = Buffer.from(sourceUrl || fallback)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 24)
    .toLowerCase();

  return `campuslabs-${stable || "unknown"}`;
}

function inferEventType(categories: string[], title: string, description: string) {
  const text = `${categories.join(" ")} ${title} ${description}`.toLowerCase();
  if (/(workshop|lecture|study|class|academic)/.test(text)) return "academic";
  if (/(career|professional|network|resume|internship)/.test(text)) return "professional";
  if (/(meeting|board|committee)/.test(text)) return "meeting";
  if (/(virtual|online|zoom|webex|teams)/.test(text)) return "virtual";
  if (/(sport|recreation|fitness|game|tournament)/.test(text)) return "recreational";
  return "social";
}

function inferLocationType(location: string) {
  return /(virtual|online|zoom|webex|teams)/i.test(location) ? "virtual" : "physical";
}

function collectHosts(item: any) {
  const values = [...toArray(item?.host), ...toArray(item?.author)].map(toText).filter(Boolean);
  return uniq(values);
}

function getImageUrl(item: any) {
  const enclosure = toArray(item?.enclosure)[0];
  if (typeof enclosure?.$?.url === "string") return enclosure.$.url;
  return "";
}

function parseDate(value: any) {
  const date = new Date(toText(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function toText(value: any): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && typeof value._ === "string") return value._.trim();
  return "";
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function uniq(values: string[]) {
  return Array.from(new Set(values));
}
