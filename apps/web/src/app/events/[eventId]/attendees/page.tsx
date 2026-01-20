'use client';

/**
 * /events/[eventId]/attendees — Event Attendees List
 *
 * Archetype: Discovery
 * Purpose: View who's attending an event
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - List all attendees with RSVP status
 * - Filter by going/maybe
 * - Quick profile access
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, HelpCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Heading, Card, Button, Badge, SimpleAvatar, getInitials } from '@hive/ui/design-system/primitives';
import { DiscoveryLayout, DiscoveryList, DiscoveryEmpty } from '@hive/ui';

interface Attendee {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  status: 'going' | 'maybe';
  rsvpAt: string;
}

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string;

  const [attendees, setAttendees] = React.useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [eventTitle, setEventTitle] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'going' | 'maybe'>('all');

  // Fetch attendees
  React.useEffect(() => {
    async function fetchData() {
      if (!eventId) return;

      try {
        // Fetch event info
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEventTitle(eventData.title || 'Event');
        }

        // Fetch attendees
        const attendeesRes = await fetch(`/api/events/${eventId}/attendees`);
        if (attendeesRes.ok) {
          const data = await attendeesRes.json();
          setAttendees(data.attendees || []);
        }
      } catch {
        // Failed to fetch attendees
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [eventId]);

  // Filter attendees
  const filteredAttendees = filter === 'all'
    ? attendees
    : attendees.filter(a => a.status === filter);

  const goingCount = attendees.filter(a => a.status === 'going').length;
  const maybeCount = attendees.filter(a => a.status === 'maybe').length;

  // Header
  const header = (
    <div className="flex items-center gap-3">
      <Link
        href={`/events/${eventId}`}
        className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <Heading level={1} className="text-xl">
          Attendees
        </Heading>
        <Text size="sm" tone="muted" className="truncate max-w-xs">
          {eventTitle}
        </Text>
      </div>
    </div>
  );

  return (
    <DiscoveryLayout header={header}>
      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Check className="h-4 w-4 text-green-500" />
                <Text size="lg" weight="medium">{goingCount}</Text>
              </div>
              <Text size="xs" tone="muted">Going</Text>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <HelpCircle className="h-4 w-4 text-amber-500" />
                <Text size="lg" weight="medium">{maybeCount}</Text>
              </div>
              <Text size="xs" tone="muted">Maybe</Text>
            </Card>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            {(['all', 'going', 'maybe'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm capitalize transition-colors',
                  filter === f
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/50 hover:text-white/80'
                )}
              >
                {f} {f !== 'all' && `(${f === 'going' ? goingCount : maybeCount})`}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {filteredAttendees.length === 0 && (
            <DiscoveryEmpty
              message={filter === 'all' ? 'No attendees yet' : `No one ${filter} yet`}
              action={
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/events/${eventId}`)}
                >
                  Back to Event
                </Button>
              }
            />
          )}

          {/* Attendees list */}
          <DiscoveryList gap="sm">
            {filteredAttendees.map((attendee) => (
              <Link key={attendee.id} href={`/profile/${attendee.id}`}>
                <Card interactive className="p-3">
                  <div className="flex items-center gap-3">
                    <SimpleAvatar
                      src={attendee.avatarUrl}
                      fallback={getInitials(attendee.name)}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <Text weight="medium" className="truncate">{attendee.name}</Text>
                      {attendee.handle && (
                        <Text size="xs" tone="muted">@{attendee.handle}</Text>
                      )}
                    </div>
                    <Badge
                      variant={attendee.status === 'going' ? 'neutral' : 'neutral'}
                      size="sm"
                      className={attendee.status === 'going' ? 'text-green-500' : 'text-amber-500'}
                    >
                      {attendee.status === 'going' ? (
                        <><Check className="h-3 w-3 mr-1" /> Going</>
                      ) : (
                        <><HelpCircle className="h-3 w-3 mr-1" /> Maybe</>
                      )}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </DiscoveryList>
        </div>
      )}
    </DiscoveryLayout>
  );
}
