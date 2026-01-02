'use client';

/**
 * Event Create Modal
 * Two-step modal for creating events in a space
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springPresets } from '@hive/tokens';
import {
  X,
  BookOpen,
  Users,
  Gamepad2,
  Palette,
  Video,
  Globe,
  Calendar,
  MapPin,
  Link2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Loader2,
  CalendarClock,
} from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms/button';
import { Input } from '../../00-Global/atoms/input';

// ============================================================
// Types
// ============================================================

export type EventType = 'academic' | 'social' | 'recreational' | 'cultural' | 'meeting' | 'virtual';

export interface EventCreateInput {
  title: string;
  description: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  location?: string;
  virtualLink?: string;
  maxAttendees?: number;
  requiredRSVP: boolean;
  announceToSpace: boolean;
  linkedBoardId?: string;
}

export interface BoardOption {
  id: string;
  name: string;
}

export interface AvailabilitySuggestion {
  day: string;
  dayOfWeek: string;
  hour: number;
  availability: number;
  memberCount: number;
}

export interface EventCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: EventCreateInput) => Promise<void>;
  boards?: BoardOption[];
  defaultBoardId?: string;
  className?: string;
  /** Space ID for fetching availability data */
  spaceId?: string;
  /** Optional callback to fetch availability (returns suggestions) */
  onFetchAvailability?: (spaceId: string) => Promise<{
    suggestions: AvailabilitySuggestion[];
    memberCount: number;
    connectedCount: number;
  } | null>;
}

// ============================================================
// Event Type Options
// ============================================================

const EVENT_TYPES: Array<{
  type: EventType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'academic', label: 'Academic', description: 'Study groups, tutoring', icon: BookOpen },
  { type: 'social', label: 'Social', description: 'Hangouts, parties', icon: Users },
  { type: 'recreational', label: 'Recreational', description: 'Sports, games', icon: Gamepad2 },
  { type: 'cultural', label: 'Cultural', description: 'Arts, performances', icon: Palette },
  { type: 'meeting', label: 'Meeting', description: 'Official gatherings', icon: Video },
  { type: 'virtual', label: 'Virtual', description: 'Online events', icon: Globe },
];

// ============================================================
// Helpers
// ============================================================

function getNextHour(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  return new Date(value);
}

// ============================================================
// Main Component
// ============================================================

export function EventCreateModal({
  open,
  onOpenChange,
  onSubmit,
  boards = [],
  defaultBoardId,
  className,
  spaceId,
  onFetchAvailability,
}: EventCreateModalProps) {
  const [step, setStep] = React.useState<'basic' | 'details'>('basic');

  // Availability state
  const [availabilitySuggestions, setAvailabilitySuggestions] = React.useState<AvailabilitySuggestion[]>([]);
  const [availabilityMeta, setAvailabilityMeta] = React.useState<{ memberCount: number; connectedCount: number } | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = React.useState(false);

  // Form state
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [eventType, setEventType] = React.useState<EventType>('social');
  const [startDate, setStartDate] = React.useState<Date>(() => getNextHour());
  const [endDate, setEndDate] = React.useState<Date>(() => addHours(getNextHour(), 1));
  const [location, setLocation] = React.useState('');
  const [virtualLink, setVirtualLink] = React.useState('');
  const [maxAttendees, setMaxAttendees] = React.useState<string>('');
  const [requiredRSVP, setRequiredRSVP] = React.useState(false);
  const [announceToSpace, setAnnounceToSpace] = React.useState(true);
  const [linkedBoardId, setLinkedBoardId] = React.useState<string>(defaultBoardId || '');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setStep('basic');
      setTitle('');
      setDescription('');
      setEventType('social');
      setStartDate(getNextHour());
      setEndDate(addHours(getNextHour(), 1));
      setLocation('');
      setVirtualLink('');
      setMaxAttendees('');
      setRequiredRSVP(false);
      setAnnounceToSpace(true);
      setLinkedBoardId(defaultBoardId || '');
      setError(null);
      setAvailabilitySuggestions([]);
      setAvailabilityMeta(null);
    }
  }, [open, defaultBoardId]);

  // Fetch availability when entering details step
  React.useEffect(() => {
    if (step === 'details' && spaceId && onFetchAvailability && availabilitySuggestions.length === 0) {
      setIsLoadingAvailability(true);
      onFetchAvailability(spaceId)
        .then((data) => {
          if (data) {
            setAvailabilitySuggestions(data.suggestions);
            setAvailabilityMeta({ memberCount: data.memberCount, connectedCount: data.connectedCount });
          }
        })
        .catch(() => {
          // Silently fail - availability is optional enhancement
        })
        .finally(() => {
          setIsLoadingAvailability(false);
        });
    }
  }, [step, spaceId, onFetchAvailability, availabilitySuggestions.length]);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  // Validation
  const isStep1Valid = title.trim().length > 0 && title.trim().length <= 200;
  const isStep2Valid = startDate < endDate;
  const showVirtualLink = eventType === 'virtual' || eventType === 'meeting';

  const handleNext = () => {
    if (isStep1Valid) {
      setStep('details');
    }
  };

  const handleBack = () => {
    setStep('basic');
    setError(null);
  };

  // Apply an availability suggestion to the date fields
  const applySuggestion = (suggestion: AvailabilitySuggestion) => {
    const suggestionDate = new Date(suggestion.day);
    suggestionDate.setHours(suggestion.hour, 0, 0, 0);
    setStartDate(suggestionDate);
    setEndDate(addHours(suggestionDate, 1));
  };

  const handleSubmit = async () => {
    if (!isStep1Valid || !isStep2Valid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        type: eventType,
        startDate,
        endDate,
        location: location.trim() || undefined,
        virtualLink: virtualLink.trim() || undefined,
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        requiredRSVP,
        announceToSpace,
        linkedBoardId: linkedBoardId || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springPresets.snappy}
            className={cn(
              'relative w-full max-w-lg mx-4 bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] rounded-2xl shadow-2xl',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hive-border-default)]">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-[var(--hive-text-primary)]">Create Event</h2>
                <div className="flex gap-1">
                  <div
                    className={cn(
                      'h-1.5 w-6 rounded-full transition-colors',
                      step === 'basic' ? 'bg-[var(--hive-brand-primary)]' : 'bg-[var(--hive-border-default)]'
                    )}
                  />
                  <div
                    className={cn(
                      'h-1.5 w-6 rounded-full transition-colors',
                      step === 'details' ? 'bg-[var(--hive-brand-primary)]' : 'bg-[var(--hive-border-default)]'
                    )}
                  />
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 min-h-[340px]">
              <AnimatePresence mode="wait">
                {step === 'basic' ? (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                        Event Title
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's happening?"
                        className="bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                        maxLength={200}
                        autoFocus
                      />
                      {title.length > 0 && (
                        <p className="mt-1 text-xs text-[var(--hive-text-tertiary)]">
                          {200 - title.length} characters remaining
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                        Description <span className="text-[var(--hive-text-tertiary)]">(optional)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add more details about your event..."
                        className="w-full h-20 px-3 py-2 text-sm rounded-xl bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] text-[var(--hive-text-primary)] placeholder:text-[var(--hive-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--hive-brand-primary)] resize-none"
                        maxLength={2000}
                      />
                    </div>

                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-2">
                        Event Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {EVENT_TYPES.map((et) => {
                          const Icon = et.icon;
                          const isSelected = eventType === et.type;
                          return (
                            <button
                              key={et.type}
                              onClick={() => setEventType(et.type)}
                              className={cn(
                                'flex flex-col items-center p-2.5 rounded-xl border transition-all text-center',
                                isSelected
                                  ? 'border-[var(--hive-brand-primary)] bg-[var(--hive-brand-primary)]/10'
                                  : 'border-[var(--hive-border-default)] hover:border-[var(--hive-border-hover)] bg-[var(--hive-background-tertiary)]'
                              )}
                            >
                              <Icon
                                className={cn(
                                  'h-5 w-5 mb-1',
                                  isSelected
                                    ? 'text-[var(--hive-brand-primary)]'
                                    : 'text-[var(--hive-text-tertiary)]'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  isSelected
                                    ? 'text-[var(--hive-text-primary)]'
                                    : 'text-[var(--hive-text-secondary)]'
                                )}
                              >
                                {et.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Best Times - Availability Suggestions */}
                    {spaceId && onFetchAvailability && (
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--hive-text-primary)] mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-[var(--hive-brand-primary)]" />
                          Best Times
                          {availabilityMeta && availabilityMeta.connectedCount > 0 && (
                            <span className="text-xs text-[var(--hive-text-tertiary)] font-normal">
                              based on {availabilityMeta.connectedCount} connected calendar{availabilityMeta.connectedCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </label>

                        {isLoadingAvailability ? (
                          <div className="flex items-center gap-2 py-3 px-3 bg-[var(--hive-background-tertiary)] rounded-xl">
                            <Loader2 className="h-4 w-4 animate-spin text-[var(--hive-text-tertiary)]" />
                            <span className="text-sm text-[var(--hive-text-tertiary)]">
                              Checking member availability...
                            </span>
                          </div>
                        ) : availabilitySuggestions.length > 0 ? (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {availabilitySuggestions.slice(0, 4).map((suggestion, idx) => {
                              const availabilityPercent = Math.round(suggestion.availability * 100);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => applySuggestion(suggestion)}
                                  className={cn(
                                    'flex flex-col items-center px-3 py-2 rounded-xl border transition-all shrink-0',
                                    'border-[var(--hive-border-default)] hover:border-[var(--hive-brand-primary)] bg-[var(--hive-background-tertiary)]',
                                    'hover:bg-[var(--hive-brand-primary)]/10'
                                  )}
                                >
                                  <span className="text-xs font-medium text-[var(--hive-text-secondary)]">
                                    {suggestion.dayOfWeek}
                                  </span>
                                  <span className="text-sm font-semibold text-[var(--hive-text-primary)]">
                                    {suggestion.hour > 12 ? suggestion.hour - 12 : suggestion.hour || 12}
                                    {suggestion.hour >= 12 ? 'PM' : 'AM'}
                                  </span>
                                  <span className={cn(
                                    'text-[10px] font-medium',
                                    availabilityPercent >= 70 ? 'text-[var(--hive-status-success)]' :
                                    availabilityPercent >= 40 ? 'text-[var(--hive-brand-primary)]' :
                                    'text-[var(--hive-text-tertiary)]'
                                  )}>
                                    {availabilityPercent}% free
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : availabilityMeta && availabilityMeta.connectedCount === 0 ? (
                          <div className="flex items-center gap-2 py-2 px-3 bg-[var(--hive-background-tertiary)] rounded-xl">
                            <CalendarClock className="h-4 w-4 text-[var(--hive-text-tertiary)]" />
                            <span className="text-xs text-[var(--hive-text-tertiary)]">
                              No members have connected calendars yet
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Date/Time Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Start
                        </label>
                        <input
                          type="datetime-local"
                          value={formatDateTimeLocal(startDate)}
                          onChange={(e) => {
                            const d = parseDateTimeLocal(e.target.value);
                            if (d) {
                              setStartDate(d);
                              // Auto-adjust end date if needed
                              if (d >= endDate) {
                                setEndDate(addHours(d, 1));
                              }
                            }
                          }}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] text-[var(--hive-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hive-brand-primary)]"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          End
                        </label>
                        <input
                          type="datetime-local"
                          value={formatDateTimeLocal(endDate)}
                          onChange={(e) => {
                            const d = parseDateTimeLocal(e.target.value);
                            if (d) setEndDate(d);
                          }}
                          min={formatDateTimeLocal(startDate)}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] text-[var(--hive-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hive-brand-primary)]"
                        />
                      </div>
                    </div>
                    {!isStep2Valid && (
                      <p className="text-xs text-[var(--hive-status-error)]">
                        End time must be after start time
                      </p>
                    )}

                    {/* Location */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Location <span className="text-[var(--hive-text-tertiary)]">(optional)</span>
                      </label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Where is it happening?"
                        className="bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                      />
                    </div>

                    {/* Virtual Link (conditional) */}
                    {showVirtualLink && (
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                          <Link2 className="h-3.5 w-3.5" />
                          Virtual Link <span className="text-[var(--hive-text-tertiary)]">(optional)</span>
                        </label>
                        <Input
                          value={virtualLink}
                          onChange={(e) => setVirtualLink(e.target.value)}
                          placeholder="Zoom, Meet, or other link..."
                          className="bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                        />
                      </div>
                    )}

                    {/* Toggles Row */}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => setRequiredRSVP(!requiredRSVP)}
                          className={cn(
                            'h-5 w-5 rounded border flex items-center justify-center transition-colors',
                            requiredRSVP
                              ? 'bg-[var(--hive-brand-primary)] border-[var(--hive-brand-primary)]'
                              : 'border-[var(--hive-border-default)] bg-[var(--hive-background-tertiary)]'
                          )}
                        >
                          {requiredRSVP && <Check className="h-3 w-3 text-white" />}
                        </button>
                        <span className="text-sm text-[var(--hive-text-secondary)]">Require RSVP</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => setAnnounceToSpace(!announceToSpace)}
                          className={cn(
                            'h-5 w-5 rounded border flex items-center justify-center transition-colors',
                            announceToSpace
                              ? 'bg-[var(--hive-brand-primary)] border-[var(--hive-brand-primary)]'
                              : 'border-[var(--hive-border-default)] bg-[var(--hive-background-tertiary)]'
                          )}
                        >
                          {announceToSpace && <Check className="h-3 w-3 text-white" />}
                        </button>
                        <span className="text-sm text-[var(--hive-text-secondary)]">Announce to space</span>
                      </label>
                    </div>

                    {/* Link to Board */}
                    {boards.length > 0 && (
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Link to Board <span className="text-[var(--hive-text-tertiary)]">(optional)</span>
                        </label>
                        <select
                          value={linkedBoardId}
                          onChange={(e) => setLinkedBoardId(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] text-[var(--hive-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--hive-brand-primary)]"
                        >
                          <option value="">No board</option>
                          {boards.map((board) => (
                            <option key={board.id} value={board.id}>
                              {board.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <p className="text-sm text-[var(--hive-status-error)] bg-[var(--hive-status-error)]/10 rounded-lg p-2">
                        {error}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--hive-border-default)]">
              {step === 'basic' ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!isStep1Valid}
                    className="bg-white text-black hover:bg-neutral-100 gap-1"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!isStep2Valid || isSubmitting}
                    className="bg-white text-black hover:bg-neutral-100"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

EventCreateModal.displayName = 'EventCreateModal';
