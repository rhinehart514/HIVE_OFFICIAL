import type { Metadata } from 'next';
import { dbAdmin } from '@/lib/firebase-admin';
import { getEventStartDate, getEventEndDate } from '@/lib/events/event-time';
import { isContentHidden } from '@/lib/content-moderation';
import { EventDetailPageClient } from './event-detail-client';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Server component that fetches event data for OG meta tags,
 * then renders the client component for interactivity.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;

  try {
    const eventDoc = await dbAdmin.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return { title: 'Event Not Found | HIVE' };
    }

    const data = eventDoc.data()!;
    if (isContentHidden(data)) {
      return { title: 'Event Not Found | HIVE' };
    }

    const title = (data.title as string) ?? 'Event';
    const description = (data.description as string) ?? 'Check out this event on HIVE';
    const startDate = getEventStartDate(data as Record<string, unknown>);
    const location = (data.locationName ?? data.location ?? '') as string;

    const dateStr = startDate
      ? startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : '';
    const timeStr = startDate
      ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';

    const ogDescription = [
      dateStr && timeStr ? `${dateStr} at ${timeStr}` : '',
      location ? `at ${location}` : '',
      description.slice(0, 120),
    ].filter(Boolean).join(' -- ');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college';

    return {
      title: `${title} | HIVE`,
      description: ogDescription,
      openGraph: {
        title: `${title} | HIVE`,
        description: ogDescription,
        url: `${appUrl}/e/${eventId}`,
        siteName: 'HIVE',
        type: 'website',
        images: data.imageUrl ? [{ url: data.imageUrl as string }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | HIVE`,
        description: ogDescription,
      },
    };
  } catch {
    return { title: 'Event | HIVE' };
  }
}

export default async function EventPage({ params }: PageProps) {
  const { eventId } = await params;
  return <EventDetailPageClient eventId={eventId} />;
}
