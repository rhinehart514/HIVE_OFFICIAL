'use client';

/**
 * EventCreateModal Component
 *
 * Modal for creating events in a space.
 * Full-featured with date/time, location, RSVP settings.
 */

import * as React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
} from '../../primitives/Modal';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

export interface EventCreateInput {
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  type?: string;
  virtualLink?: string;
  maxAttendees?: number;
  requiredRSVP?: boolean;
  announceToSpace?: boolean;
  linkedBoardId?: string;
}

export interface EventCreateModalProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: EventCreateInput) => void | Promise<void>;
  boardId?: string;
  boards?: { id: string; name: string }[];
  defaultBoardId?: string;
}

const EVENT_TYPES = [
  { value: 'academic', label: 'Academic', icon: '📚' },
  { value: 'social', label: 'Social', icon: '🎉' },
  { value: 'recreational', label: 'Sports', icon: '🏃' },
  { value: 'cultural', label: 'Cultural', icon: '🎭' },
  { value: 'meeting', label: 'Meeting', icon: '👥' },
  { value: 'virtual', label: 'Virtual', icon: '💻' },
] as const;

const EventCreateModal: React.FC<EventCreateModalProps> = ({
  open = false,
  onClose,
  onOpenChange,
  onSubmit,
  boards = [],
  defaultBoardId,
}) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [eventType, setEventType] = React.useState<string>('social');
  const [startDate, setStartDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [isVirtual, setIsVirtual] = React.useState(false);
  const [location, setLocation] = React.useState('');
  const [virtualLink, setVirtualLink] = React.useState('');
  const [maxAttendees, setMaxAttendees] = React.useState('');
  const [requireRSVP, setRequireRSVP] = React.useState(false);
  const [linkedBoardId, setLinkedBoardId] = React.useState(defaultBoardId || '');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose?.();
        // Reset form
        setTitle('');
        setDescription('');
        setEventType('social');
        setStartDate('');
        setStartTime('');
        setEndDate('');
        setEndTime('');
        setIsVirtual(false);
        setLocation('');
        setVirtualLink('');
        setMaxAttendees('');
        setRequireRSVP(false);
        setLinkedBoardId(defaultBoardId || '');
        setError(null);
      }
      onOpenChange?.(isOpen);
    },
    [onClose, onOpenChange, defaultBoardId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!startDate || !startTime) {
      setError('Start date and time are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`) : undefined;

      await onSubmit?.({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        type: eventType,
        location: isVirtual ? undefined : location.trim() || undefined,
        virtualLink: isVirtual ? virtualLink.trim() || undefined : undefined,
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        requiredRSVP: requireRSVP,
        linkedBoardId: linkedBoardId || undefined,
        announceToSpace: true,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>Create Event</ModalTitle>
            <ModalDescription>
              Schedule an event for your space
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Event Title <span className="text-red-400">*</span>
              </Text>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., Study Group Session"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Description
              </Text>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this event about?"
                rows={3}
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
                  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
                  'resize-none'
                )}
              />
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Event Type
              </Text>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEventType(type.value)}
                    className={cn(
                      'p-2 rounded-lg border text-center transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-white/50',
                      eventType === type.value
                        ? 'border-[var(--color-life-gold)] bg-[var(--color-life-gold)]/10'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]'
                    )}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <Text
                      size="xs"
                      className={cn(
                        'block mt-1',
                        eventType === type.value && 'text-[var(--color-life-gold)]'
                      )}
                    >
                      {type.label}
                    </Text>
                  </button>
                ))}
              </div>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Text size="sm" weight="medium">
                  Start Date <span className="text-red-400">*</span>
                </Text>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setError(null);
                  }}
                  min={today}
                />
              </div>
              <div className="space-y-2">
                <Text size="sm" weight="medium">
                  Start Time <span className="text-red-400">*</span>
                </Text>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setError(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Text size="sm" weight="medium">
                  End Date
                </Text>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                />
              </div>
              <div className="space-y-2">
                <Text size="sm" weight="medium">
                  End Time
                </Text>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Location Toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsVirtual(false)}
                  className={cn(
                    'flex-1 p-2 rounded-lg border text-center transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    !isVirtual
                      ? 'border-[var(--color-life-gold)] bg-[var(--color-life-gold)]/10'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)]'
                  )}
                >
                  <Text size="sm" className={cn(!isVirtual && 'text-[var(--color-life-gold)]')}>
                    In-Person
                  </Text>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVirtual(true)}
                  className={cn(
                    'flex-1 p-2 rounded-lg border text-center transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    isVirtual
                      ? 'border-[var(--color-life-gold)] bg-[var(--color-life-gold)]/10'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)]'
                  )}
                >
                  <Text size="sm" className={cn(isVirtual && 'text-[var(--color-life-gold)]')}>
                    Virtual
                  </Text>
                </button>
              </div>
            </div>

            {/* Location or Link */}
            {isVirtual ? (
              <div className="space-y-2">
                <Text size="sm" weight="medium">
                  Meeting Link
                </Text>
                <Input
                  value={virtualLink}
                  onChange={(e) => setVirtualLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  type="url"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Text size="sm" weight="medium">
                  Location
                </Text>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Student Union Room 101"
                />
              </div>
            )}

            {/* Optional Settings */}
            <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
              <Text size="sm" weight="medium" tone="muted">
                Optional Settings
              </Text>

              {/* Max Attendees */}
              <div className="flex items-center justify-between">
                <Text size="sm">Max Attendees</Text>
                <Input
                  type="number"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  className="w-24 text-center"
                />
              </div>

              {/* Require RSVP */}
              <div className="flex items-center justify-between">
                <Text size="sm">Require RSVP</Text>
                <button
                  type="button"
                  onClick={() => setRequireRSVP(!requireRSVP)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    requireRSVP ? 'bg-[var(--color-life-gold)]' : 'bg-[var(--color-bg-elevated)]'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow transition-transform',
                      requireRSVP ? 'translate-x-6' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>

              {/* Link to Board */}
              {boards.length > 0 && (
                <div className="flex items-center justify-between">
                  <Text size="sm">Link to Channel</Text>
                  <select
                    value={linkedBoardId}
                    onChange={(e) => setLinkedBoardId(e.target.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg',
                      'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
                      'text-[var(--color-text-primary)] text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-white/50'
                    )}
                  >
                    <option value="">None</option>
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {error && (
              <Text size="sm" className="text-red-400">
                {error}
              </Text>
            )}
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="cta"
              disabled={!title.trim() || !startDate || !startTime || isSubmitting}
              loading={isSubmitting}
            >
              Create Event
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

EventCreateModal.displayName = 'EventCreateModal';

export { EventCreateModal };
