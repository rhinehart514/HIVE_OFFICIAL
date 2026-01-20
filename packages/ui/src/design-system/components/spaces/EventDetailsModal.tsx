'use client';

/**
 * EventDetailsModal Component
 *
 * Modal for viewing event details and managing RSVP.
 */

import * as React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
} from '../../primitives/Modal';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives';
import { Avatar, AvatarImage, AvatarFallback } from '../../primitives/Avatar';
import { cn } from '../../../lib/utils';

export type RSVPStatus = 'going' | 'maybe' | 'not_going' | null;

export interface SpaceEventDetails {
  id: string;
  title: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  location?: string;
  virtualLink?: string;
  attendees?: string[];
  currentAttendees?: number;
  maxAttendees?: number;
  rsvpStatus?: RSVPStatus;
  userRSVP?: RSVPStatus | null;
  type?: 'academic' | 'social' | 'recreational' | 'cultural' | 'meeting' | 'virtual' | string;
  linkedBoardId?: string;
  organizer?: {
    id: string;
    fullName: string;
    photoURL?: string;
  };
}

export interface EventDetailsModalProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  event?: SpaceEventDetails | null;
  onRSVP?: (eventId: string, status: RSVPStatus) => void | Promise<void>;
  onNavigateToBoard?: (boardId: string) => void;
  onViewBoard?: (boardId: string) => void;
  currentUserId?: string;
  spaceId?: string;
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  academic: '📚',
  social: '🎉',
  recreational: '🏃',
  cultural: '🎭',
  meeting: '👥',
  virtual: '💻',
};

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Generate Google Calendar URL for an event
 */
function generateGoogleCalendarUrl(event: SpaceEventDetails): string {
  const startDate = typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate;
  const endDate = event.endDate
    ? (typeof event.endDate === 'string' ? new Date(event.endDate) : event.endDate)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatForGCal = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatForGCal(startDate)}/${formatForGCal(endDate)}`,
    details: event.description || '',
    location: event.location || event.virtualLink || '',
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  open = false,
  onClose,
  onOpenChange,
  event,
  onRSVP,
  onNavigateToBoard,
  onViewBoard,
}) => {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [currentRSVP, setCurrentRSVP] = React.useState<RSVPStatus>(null);

  React.useEffect(() => {
    setCurrentRSVP(event?.userRSVP || event?.rsvpStatus || null);
  }, [event]);

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose?.();
      }
      onOpenChange?.(isOpen);
    },
    [onClose, onOpenChange]
  );

  const handleRSVP = async (status: RSVPStatus) => {
    if (!event || isUpdating) return;

    setIsUpdating(true);
    try {
      await onRSVP?.(event.id, status);
      setCurrentRSVP(status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewBoard = () => {
    if (event?.linkedBoardId) {
      (onViewBoard || onNavigateToBoard)?.(event.linkedBoardId);
    }
  };

  if (!event) return null;

  const eventIcon = event.type ? EVENT_TYPE_ICONS[event.type] || '📅' : '📅';
  const attendeeCount = event.currentAttendees ?? event.attendees?.length ?? 0;

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{eventIcon}</span>
            <div>
              <ModalTitle>{event.title}</ModalTitle>
              {event.type && (
                <Text size="xs" tone="muted" className="capitalize">
                  {event.type} Event
                </Text>
              )}
            </div>
          </div>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Description */}
          {event.description && (
            <Text size="sm" className="text-[var(--color-text-secondary)]">
              {event.description}
            </Text>
          )}

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <Text size="sm" weight="medium">
                  {formatDate(event.startDate)}
                </Text>
                <Text size="xs" tone="muted">
                  {formatTime(event.startDate)}
                  {event.endDate && ` - ${formatTime(event.endDate)}`}
                </Text>
              </div>
            </div>
          </div>

          {/* Location or Virtual Link */}
          {(event.location || event.virtualLink) && (
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={
                    event.virtualLink
                      ? 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                      : 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  }
                />
              </svg>
              <div>
                {event.virtualLink ? (
                  <a
                    href={event.virtualLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-life-gold)] hover:underline text-sm"
                  >
                    Join Virtual Meeting
                  </a>
                ) : (
                  <Text size="sm">{event.location}</Text>
                )}
              </div>
            </div>
          )}

          {/* Organizer */}
          {event.organizer && (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src={event.organizer.photoURL} alt={event.organizer.fullName} />
                <AvatarFallback>{getInitials(event.organizer.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <Text size="xs" tone="muted">
                  Hosted by
                </Text>
                <Text size="sm" weight="medium">
                  {event.organizer.fullName}
                </Text>
              </div>
            </div>
          )}

          {/* Attendees */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-elevated)]">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <Text size="sm">
                {attendeeCount} attending
                {event.maxAttendees && (
                  <span className="text-[var(--color-text-muted)]">
                    {' '}
                    / {event.maxAttendees} max
                  </span>
                )}
              </Text>
            </div>
          </div>

          {/* RSVP Buttons */}
          <div className="space-y-2">
            <Text size="sm" weight="medium">
              Your RSVP
            </Text>
            <div className="grid grid-cols-3 gap-2">
              {[
                { status: 'going' as RSVPStatus, label: 'Going', icon: '✓' },
                { status: 'maybe' as RSVPStatus, label: 'Maybe', icon: '?' },
                { status: 'not_going' as RSVPStatus, label: "Can't Go", icon: '✕' },
              ].map(({ status, label, icon }) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleRSVP(status)}
                  disabled={isUpdating}
                  className={cn(
                    'p-2 rounded-lg border text-center transition-all active:scale-95',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    'disabled:opacity-50',
                    currentRSVP === status
                      ? status === 'going'
                        ? 'border-green-500 bg-green-500/10 text-green-500'
                        : status === 'maybe'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-red-400 bg-red-400/10 text-red-400'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]'
                  )}
                >
                  {isUpdating && currentRSVP !== status ? (
                    <span className="text-lg opacity-50">{icon}</span>
                  ) : (
                    <span className="text-lg">{icon}</span>
                  )}
                  <Text size="xs" className="block mt-1">
                    {label}
                  </Text>
                </button>
              ))}
            </div>

            {/* Add to Calendar - shows when RSVP'd as going */}
            {currentRSVP === 'going' && (
              <a
                href={generateGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'mt-3 w-full p-2.5 rounded-lg border border-[var(--color-border)]',
                  'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]',
                  'flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
                  'text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add to Google Calendar
              </a>
            )}
          </div>

          {/* Linked Board */}
          {event.linkedBoardId && (
            <button
              type="button"
              onClick={handleViewBoard}
              className={cn(
                'w-full p-3 rounded-lg border border-[var(--color-border)]',
                'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]',
                'flex items-center justify-between transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-white/50'
              )}
            >
              <Text size="sm">View Discussion Channel</Text>
              <svg
                className="w-4 h-4 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

EventDetailsModal.displayName = 'EventDetailsModal';

export { EventDetailsModal };
