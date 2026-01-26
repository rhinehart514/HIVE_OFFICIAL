'use client';

/**
 * EventEditModal Component
 *
 * Modal for editing events in a space.
 * Includes CampusLabs fields (theme, benefits) for imported events.
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
import type { SpaceEventDetails } from './EventDetailsModal';

export interface EventEditInput {
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  type?: string;
  virtualLink?: string;
  maxAttendees?: number;
  requiredRSVP?: boolean;
  // CampusLabs fields
  theme?: string;
  benefits?: string[];
}

export interface EventEditModalProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (eventId: string, data: EventEditInput) => void | Promise<void>;
  event?: SpaceEventDetails | null;
}

const EVENT_TYPES = [
  { value: 'academic', label: 'Academic', icon: '📚' },
  { value: 'social', label: 'Social', icon: '🎉' },
  { value: 'recreational', label: 'Sports', icon: '🏃' },
  { value: 'cultural', label: 'Cultural', icon: '🎭' },
  { value: 'meeting', label: 'Meeting', icon: '👥' },
  { value: 'virtual', label: 'Virtual', icon: '💻' },
] as const;

function formatDateForInput(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

function formatTimeForInput(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toTimeString().slice(0, 5);
}

const EventEditModal: React.FC<EventEditModalProps> = ({
  open = false,
  onClose,
  onOpenChange,
  onSubmit,
  event,
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
  const [theme, setTheme] = React.useState('');
  const [benefitsInput, setBenefitsInput] = React.useState('');
  const [benefits, setBenefits] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Populate form when event changes
  React.useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setEventType(event.type || 'social');
      setStartDate(formatDateForInput(event.startDate));
      setStartTime(formatTimeForInput(event.startDate));
      setEndDate(formatDateForInput(event.endDate));
      setEndTime(formatTimeForInput(event.endDate));
      setIsVirtual(!!event.virtualLink);
      setLocation(event.location || '');
      setVirtualLink(event.virtualLink || '');
      setMaxAttendees(event.maxAttendees?.toString() || '');
      setTheme(event.theme || '');
      setBenefits(event.benefits || []);
    }
  }, [event]);

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose?.();
        setError(null);
      }
      onOpenChange?.(isOpen);
    },
    [onClose, onOpenChange]
  );

  const handleAddBenefit = () => {
    const trimmed = benefitsInput.trim();
    if (trimmed && benefits.length < 10 && !benefits.includes(trimmed)) {
      setBenefits([...benefits, trimmed]);
      setBenefitsInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) return;

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

      await onSubmit?.(event.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        type: eventType,
        location: isVirtual ? undefined : location.trim() || undefined,
        virtualLink: isVirtual ? virtualLink.trim() || undefined : undefined,
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        theme: theme.trim() || undefined,
        benefits: benefits.length > 0 ? benefits : undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return null;

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>Edit Event</ModalTitle>
            <ModalDescription>
              Update event details
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
                  min={startDate}
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

            {/* Theme (CampusLabs field) */}
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Theme
              </Text>
              <Input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., Networking, Professional Development"
                maxLength={50}
              />
            </div>

            {/* Benefits (CampusLabs field) */}
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Benefits
              </Text>
              <div className="flex gap-2">
                <Input
                  value={benefitsInput}
                  onChange={(e) => setBenefitsInput(e.target.value)}
                  placeholder="Add a benefit..."
                  maxLength={100}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBenefit();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddBenefit}
                  disabled={!benefitsInput.trim() || benefits.length >= 10}
                >
                  Add
                </Button>
              </div>
              {benefits.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-xs"
                    >
                      {benefit}
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(i)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Text size="xs" tone="muted">
                {benefits.length}/10 benefits
              </Text>
            </div>

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
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

EventEditModal.displayName = 'EventEditModal';

export { EventEditModal };
