'use client';

/**
 * EventDetailsModal - Full event view with RSVP
 *
 * Apple-style glass morphism modal for viewing event details.
 * Supports RSVP actions, organizer info, and deep linking to discussion boards.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Users,
  MessageSquare,
  Share2,
  Edit3,
  Trash2,
  Check,
  HelpCircle,
  XCircle,
  ExternalLink,
  BookOpen,
  Gamepad2,
  Palette,
  Video,
  Globe,
} from 'lucide-react';

import { cn } from '../../../lib/utils';
import { premium } from '../../../lib/premium-design';
import { Button } from '../../00-Global/atoms/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';

// ============================================================
// Types
// ============================================================

export type RSVPStatus = 'going' | 'maybe' | 'not_going' | null;
export type EventType = 'academic' | 'social' | 'recreational' | 'cultural' | 'meeting' | 'virtual';

export interface EventOrganizer {
  id: string;
  fullName: string;
  handle?: string;
  photoURL?: string;
}

export interface SpaceEventDetails {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate?: string;
  location?: string;
  virtualLink?: string;
  currentAttendees: number;
  maxAttendees?: number;
  userRSVP: RSVPStatus;
  organizer?: EventOrganizer;
  linkedBoardId?: string;
}

export interface EventDetailsModalProps {
  event: SpaceEventDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRSVP: (eventId: string, status: RSVPStatus) => Promise<void>;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  onViewBoard?: (boardId: string) => void;
  currentUserId?: string;
  spaceId: string;
  className?: string;
}

// ============================================================
// Event Type Config
// ============================================================

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  academic: { label: 'Academic', icon: BookOpen, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  social: { label: 'Social', icon: Users, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  recreational: { label: 'Recreational', icon: Gamepad2, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cultural: { label: 'Cultural', icon: Palette, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  meeting: { label: 'Meeting', icon: Video, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  virtual: { label: 'Virtual', icon: Globe, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
};

// ============================================================
// Helper Functions
// ============================================================

function formatEventDate(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const now = new Date();

  const isToday = start.toDateString() === now.toDateString();
  const isTomorrow = start.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

  let dateStr = start.toLocaleDateString('en-US', dateOptions);
  if (isToday) dateStr = 'Today';
  else if (isTomorrow) dateStr = 'Tomorrow';

  const startTime = start.toLocaleTimeString('en-US', timeOptions);

  // If no end date, just show start
  if (!endDate) {
    return `${dateStr}, ${startTime}`;
  }

  const end = new Date(endDate);
  const isSameDay = start.toDateString() === end.toDateString();
  const endTime = end.toLocaleTimeString('en-US', timeOptions);

  if (isSameDay) {
    return `${dateStr}, ${startTime} - ${endTime}`;
  }

  const endDateStr = end.toLocaleDateString('en-US', dateOptions);
  return `${dateStr} ${startTime} - ${endDateStr} ${endTime}`;
}

function getTimeUntil(startDate: string): { label: string; isUrgent: boolean; isPast: boolean } {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return { label: 'Event has ended', isUrgent: false, isPast: true };
  }
  if (diffMins < 60) {
    return { label: `Starts in ${diffMins} minutes`, isUrgent: true, isPast: false };
  }
  if (diffHours < 24) {
    return { label: `Starts in ${diffHours} hours`, isUrgent: diffHours < 2, isPast: false };
  }
  if (diffDays === 1) {
    return { label: 'Tomorrow', isUrgent: false, isPast: false };
  }
  if (diffDays < 7) {
    return { label: `In ${diffDays} days`, isUrgent: false, isPast: false };
  }
  return { label: `In ${diffDays} days`, isUrgent: false, isPast: false };
}

// ============================================================
// RSVP Button Group
// ============================================================

interface RSVPButtonGroupProps {
  currentStatus: RSVPStatus;
  onStatusChange: (status: RSVPStatus) => void;
  isLoading: boolean;
  disabled?: boolean;
}

function RSVPButtonGroup({ currentStatus, onStatusChange, isLoading, disabled }: RSVPButtonGroupProps) {
  const options: { status: RSVPStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { status: 'going', label: 'Going', icon: Check },
    { status: 'maybe', label: 'Maybe', icon: HelpCircle },
    { status: 'not_going', label: "Can't Go", icon: XCircle },
  ];

  return (
    <div className="flex gap-2">
      {options.map(({ status, label, icon: Icon }) => {
        const isActive = currentStatus === status;
        return (
          <motion.button
            key={status}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStatusChange(isActive ? null : status)}
            disabled={isLoading || disabled}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
              'font-medium text-sm transition-all',
              'border',
              isActive && status === 'going' && 'bg-[#FFD700] text-black border-[#FFD700]',
              isActive && status === 'maybe' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              isActive && status === 'not_going' && 'bg-red-500/20 text-red-400 border-red-500/30',
              !isActive && 'bg-white/[0.03] text-[#9A9A9F] border-white/[0.08] hover:bg-white/[0.06] hover:text-white',
              (isLoading || disabled) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function EventDetailsModal({
  event,
  open,
  onOpenChange,
  onRSVP,
  onEdit,
  onDelete,
  onViewBoard,
  currentUserId,
  spaceId,
  className,
}: EventDetailsModalProps) {
  const [isRSVPLoading, setIsRSVPLoading] = React.useState(false);
  const [localRSVP, setLocalRSVP] = React.useState<RSVPStatus>(null);

  // Sync local RSVP with event prop
  React.useEffect(() => {
    if (event) {
      setLocalRSVP(event.userRSVP);
    }
  }, [event]);

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

  const handleRSVP = async (status: RSVPStatus) => {
    if (!event || isRSVPLoading) return;

    setIsRSVPLoading(true);
    setLocalRSVP(status);

    try {
      await onRSVP(event.id, status);
    } catch {
      // Revert on error
      setLocalRSVP(event.userRSVP);
    } finally {
      setIsRSVPLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    const url = `${window.location.origin}/spaces/${spaceId}/events/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers
    }
  };

  if (!event) return null;

  const typeConfig = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.social;
  const TypeIcon = typeConfig.icon;
  const timeInfo = getTimeUntil(event.startDate);
  const isOrganizer = currentUserId && event.organizer?.id === currentUserId;
  const capacityPercent = event.maxAttendees
    ? Math.min(100, (event.currentAttendees / event.maxAttendees) * 100)
    : 0;
  const isAtCapacity = Boolean(event.maxAttendees && event.currentAttendees >= event.maxAttendees);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            transition={premium.motion.spring.gentle}
            className={cn(
              'relative w-full max-w-lg',
              'bg-[#111111]',
              'border border-white/[0.08]',
              'rounded-2xl shadow-2xl',
              'overflow-hidden',
              className
            )}
          >
            {/* Header with type badge */}
            <div className="relative px-6 pt-6 pb-4">
              {/* Close button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-[#6B6B70] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Type badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium', typeConfig.color)}>
                  <TypeIcon className="h-3.5 w-3.5" />
                  <span>{typeConfig.label}</span>
                </div>
                {timeInfo.isUrgent && !timeInfo.isPast && (
                  <span className="text-xs font-medium text-[#FFD700] animate-pulse">
                    {timeInfo.label}
                  </span>
                )}
                {timeInfo.isPast && (
                  <span className="text-xs font-medium text-[#6B6B70]">
                    {timeInfo.label}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-[#FAFAFA] pr-10 leading-tight">
                {event.title}
              </h2>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 space-y-5">
              {/* Date/Time */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/[0.04]">
                  <Calendar className="h-5 w-5 text-[#9A9A9F]" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-[#FAFAFA]">
                    {formatEventDate(event.startDate, event.endDate)}
                  </p>
                  {!timeInfo.isPast && !timeInfo.isUrgent && (
                    <p className="text-sm text-[#6B6B70] mt-0.5">{timeInfo.label}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white/[0.04]">
                    <MapPin className="h-5 w-5 text-[#9A9A9F]" />
                  </div>
                  <p className="text-[15px] text-[#FAFAFA]">{event.location}</p>
                </div>
              )}

              {/* Virtual Link */}
              {event.virtualLink && (
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white/[0.04]">
                    <Link2 className="h-5 w-5 text-[#9A9A9F]" />
                  </div>
                  <a
                    href={event.virtualLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[15px] text-[#FFD700] hover:text-[#E6C200] transition-colors"
                  >
                    <span className="truncate max-w-[280px]">{event.virtualLink}</span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="pt-2">
                  <p className="text-[15px] text-[#9A9A9F] leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Organizer */}
              {event.organizer && (
                <div className="flex items-center gap-3 pt-2">
                  <Avatar className="h-10 w-10 ring-2 ring-white/[0.06]">
                    {event.organizer.photoURL ? (
                      <AvatarImage src={event.organizer.photoURL} alt={event.organizer.fullName} />
                    ) : (
                      <AvatarFallback className="bg-[#1a1a1a] text-[#9A9A9F] text-sm font-medium">
                        {event.organizer.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-[#FAFAFA]">
                      {event.organizer.fullName}
                    </p>
                    <p className="text-xs text-[#6B6B70]">Organizer</p>
                  </div>
                </div>
              )}

              {/* Attendees */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#6B6B70]" />
                    <span className="text-sm text-[#9A9A9F]">
                      <span className="font-medium text-[#FAFAFA]">{event.currentAttendees}</span>
                      {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attending
                    </span>
                  </div>
                  {isAtCapacity && (
                    <span className="text-xs font-medium text-amber-400">At capacity</span>
                  )}
                </div>
                {event.maxAttendees && (
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${capacityPercent}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        capacityPercent >= 90 ? 'bg-amber-500' : 'bg-[#FFD700]'
                      )}
                    />
                  </div>
                )}
              </div>

              {/* RSVP Buttons */}
              {!timeInfo.isPast && (
                <div className="pt-4">
                  <RSVPButtonGroup
                    currentStatus={localRSVP}
                    onStatusChange={handleRSVP}
                    isLoading={isRSVPLoading}
                    disabled={isAtCapacity && localRSVP !== 'going'}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/[0.06]">
                {/* View Discussion */}
                {event.linkedBoardId && onViewBoard && (
                  <Button
                    variant="secondary"
                    onClick={() => onViewBoard(event.linkedBoardId!)}
                    className="flex-1 gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Discussion</span>
                  </Button>
                )}

                {/* Share */}
                <Button
                  variant="secondary"
                  onClick={handleShare}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>

                {/* Organizer actions */}
                {isOrganizer && (
                  <>
                    {onEdit && (
                      <Button
                        variant="secondary"
                        onClick={() => onEdit(event.id)}
                        className="gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="secondary"
                        onClick={() => onDelete(event.id)}
                        className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

EventDetailsModal.displayName = 'EventDetailsModal';

export default EventDetailsModal;
