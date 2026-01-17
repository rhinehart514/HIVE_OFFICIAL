import type { Metadata } from 'next';
import { cookies } from 'next/headers';

interface Props {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}

// Fetch event data server-side for metadata
async function fetchEventForMetadata(eventId: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/events/${eventId}`, {
      headers: sessionCookie ? { Cookie: `session=${sessionCookie}` } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

// Format date for display in metadata
function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Event Detail Layout
 *
 * Provides dynamic OG metadata for event sharing.
 * Rich preview includes: title, date/time, location, attendee count.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const event = await fetchEventForMetadata(eventId);

  if (!event) {
    return {
      title: 'Event Not Found - HIVE',
      description: 'This event could not be found.',
    };
  }

  const title = event.title || 'HIVE Event';
  const dateStr = event.startAt ? formatEventDate(event.startAt) : '';
  const location = event.location || (event.isVirtual ? 'Virtual Event' : '');
  const attendeeCount = event.attendeeCount || 0;
  const spaceName = event.spaceName || '';
  const coverImage = event.coverImage;

  // Build description with key details
  const descParts = [event.description || `Join us for ${title}`];
  if (dateStr) descParts.push(dateStr);
  if (location) descParts.push(location);
  if (attendeeCount > 0) descParts.push(`${attendeeCount} attending`);
  const description = descParts.join(' • ').slice(0, 160);

  return {
    title: `${title} - ${spaceName || 'HIVE'}`,
    description,
    openGraph: {
      title: `${title} - HIVE`,
      description,
      type: 'website',
      siteName: 'HIVE',
      ...(coverImage && {
        images: [{ url: coverImage, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: coverImage ? 'summary_large_image' : 'summary',
      title: `${title} - HIVE`,
      description,
      ...(coverImage && { images: [coverImage] }),
    },
  };
}

export default function EventDetailLayout({ children }: Props) {
  return children;
}
