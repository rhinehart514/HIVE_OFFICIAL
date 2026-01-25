'use client';

/**
 * PersonalizedEventFeed Element (Connected Tier)
 *
 * Displays events ranked by relevance to the user based on:
 * - Interest matching
 * - Friends attending
 * - Space membership
 * - Time proximity
 *
 * This powers the "Event for Me Tonight" hero demo.
 */

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  SparklesIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import { Button } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface PersonalizedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  eventType?: string;
  spaceId?: string;
  spaceName?: string;
  organizerName?: string;
  coverImageUrl?: string;
  rsvpCount: number;
  relevanceScore: number;
  matchReasons: string[];
  friendsAttending: number;
  friendsAttendingNames?: string[];
  isUserRsvped: boolean;
  interestMatch?: string[];
}

interface ApiResponse {
  success: boolean;
  data?: {
    events: PersonalizedEvent[];
    meta: {
      timeRange: string;
      totalAvailable: number;
      returned: number;
      userInterests: string[];
      hasMoreEvents: boolean;
    };
  };
  error?: string;
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    return 'Started';
  } else if (diffHours === 0) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `In ${diffMins}m`;
  } else if (diffHours < 24) {
    return `In ${diffHours}h`;
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function PersonalizedEventFeedElement({ config, onChange, onAction }: ElementProps) {
  const [events, setEvents] = useState<PersonalizedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  const timeRange = (config.timeRange as string) || 'tonight';
  const maxItems = (config.maxItems as number) || 8;
  const showFriendCount = config.showFriendCount !== false;
  const showMatchReasons = config.showMatchReasons !== false;

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeRange,
        maxItems: String(maxItems),
      });

      const response = await fetch(`/api/events/personalized?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setEvents(result.data.events);
        setUserInterests(result.data.meta.userInterests || []);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, maxItems]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventClick = (event: PersonalizedEvent) => {
    onChange?.({ selectedEvent: event, eventId: event.id });
    onAction?.('select', { selectedEvent: event, eventId: event.id });
  };

  const handleRsvp = (event: PersonalizedEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.('rsvp', { eventId: event.id, eventTitle: event.title });
  };

  const timeRangeLabel = {
    tonight: "Tonight's Events",
    today: "Today's Events",
    'this-week': 'This Week',
    'this-month': 'This Month',
  }[timeRange] || 'Events For You';

  return (
    <Card className="bg-gradient-to-br from-muted/30 to-muted/10">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{config.title || timeRangeLabel}</span>
          </div>
          {userInterests.length > 0 && (
            <div className="flex gap-1">
              {userInterests.slice(0, 2).map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchEvents}>
              Try Again
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events found for {timeRange}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Check back later or explore different time ranges
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="w-full text-left group"
              >
                <div className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background hover:border-border transition-all">
                  {/* Event Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      {event.spaceName && (
                        <p className="text-xs text-muted-foreground truncate">{event.spaceName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>{formatEventTime(event.startDate)}</span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>{formatTime(event.startDate)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 truncate">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Context & Match Reasons */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Friends attending */}
                      {showFriendCount && event.friendsAttending > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <UserGroupIcon className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="text-yellow-600 font-medium">
                            {event.friendsAttending} friend{event.friendsAttending > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Interest match badges */}
                      {showMatchReasons && event.interestMatch && event.interestMatch.length > 0 && (
                        <div className="flex items-center gap-1">
                          {event.interestMatch.slice(0, 2).map((interest) => (
                            <Badge key={interest} variant="outline" className="text-label-xs px-1.5 py-0">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RSVP / Relevance indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      {event.isUserRsvped ? (
                        <Badge variant="secondary" className="text-label-xs">Going</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => handleRsvp(event, e)}
                        >
                          RSVP
                        </Button>
                      )}
                      <ChevronRightIcon className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  {/* Match reason tooltip on hover */}
                  {showMatchReasons && event.matchReasons.length > 0 && (
                    <div className="mt-2 text-label-xs text-muted-foreground/70 line-clamp-1">
                      {event.matchReasons[0]}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        {events.length > 0 && (
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>{events.length} events matched for you</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onAction?.('viewAll', { timeRange })}
            >
              View All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
