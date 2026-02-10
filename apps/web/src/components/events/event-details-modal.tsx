"use client";

/**
 * Event Details Modal - Full implementation for MVP
 * Displays comprehensive event information with RSVP and sharing actions
 */

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Button,
  Badge,
} from "@hive/ui";
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  BookmarkIcon,
  ShareIcon,
  CheckCircleIcon,
  StarIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
} from "@heroicons/react/24/solid";
import type { EventData } from "@/hooks/use-events";
import { getEventTypeColor, getEventTypeIcon } from "@/hooks/use-events";

export interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: EventData | null;
  currentUserId?: string;
  onRSVP?: (eventId: string, status: "going" | "interested" | "not_going") => void;
  onBookmark?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string) => Promise<void>;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUserId,
  onRSVP,
  onBookmark,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  if (!event) return null;

  const isOrganizer = currentUserId === event.organizer.id;
  const isGoing = event.rsvpStatus === "going";
  const isInterested = event.rsvpStatus === "interested";
  const spotsLeft = event.capacity.max - event.capacity.current;
  const isFull = spotsLeft <= 0;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: `${window.location.origin}/events/${event.id}`,
        });
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(
        `${window.location.origin}/events/${event.id}`
      );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <ModalHeader className="pb-0">
          {/* Event Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-10 h-10 ${getEventTypeColor(event.type)} rounded-lg flex items-center justify-center text-lg`}
            >
              {getEventTypeIcon(event.type)}
            </div>
            <Badge variant="secondary" className="capitalize text-xs">
              {event.type}
            </Badge>
            {event.space && (
              <Badge variant="outline" className="text-xs">
                {event.space.name}
              </Badge>
            )}
          </div>

          <ModalTitle className="text-2xl">{event.title}</ModalTitle>
          <ModalDescription className="text-white/50 mt-1">
            Hosted by {event.organizer.name}
            {event.organizer.verified && (
              <CheckCircleIcon className="inline-block w-4 h-4 ml-1 text-[var(--hive-brand-primary)]" />
            )}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {/* Date & Time */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-[var(--hive-brand-primary)]/10 flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-5 h-5 text-[var(--hive-brand-primary)]" />
            </div>
            <div>
              <p className="font-medium text-white">
                {formatDate(event.datetime.start)}
              </p>
              <p className="text-white/50 text-sm">
                {formatTime(event.datetime.start)} - {formatTime(event.datetime.end)}
              </p>
              <p className="text-white/50 text-xs mt-1">
                {event.datetime.timezone}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <MapPinIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">{event.location.name}</p>
              {event.location.address && (
                <p className="text-white/50 text-sm">{event.location.address}</p>
              )}
              <Badge
                variant="secondary"
                className={`mt-2 text-xs ${
                  event.location.type === "virtual"
                    ? "bg-purple-500/10 text-purple-400"
                    : event.location.type === "hybrid"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {event.location.type === "virtual"
                  ? "Virtual Event"
                  : event.location.type === "hybrid"
                    ? "Hybrid Event"
                    : "In Person"}
              </Badge>
              {event.location.virtualLink && (
                <a
                  href={event.location.virtualLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-sm text-[var(--hive-brand-primary)] hover:underline"
                >
                  Join virtual link
                </a>
              )}
            </div>
          </div>

          {/* Capacity */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <UserGroupIcon className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">
                  {event.engagement.going} going
                </p>
                <p className="text-white/50 text-sm">
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : "Event is full"}
                </p>
              </div>
              {/* Capacity bar */}
              <div className="mt-2 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isFull ? "bg-red-500" : "bg-green-500"}`}
                  style={{
                    width: `${Math.min(100, (event.capacity.current / event.capacity.max) * 100)}%`,
                  }}
                />
              </div>
              {event.capacity.waitlist > 0 && (
                <p className="text-white/50 text-xs mt-1">
                  {event.capacity.waitlist} on waitlist
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">
                About
              </h3>
              <p className="text-white leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center gap-6 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-white/50">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-sm">{event.engagement.going} going</span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <StarIcon className="w-4 h-4" />
              <span className="text-sm">{event.engagement.interested} interested</span>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex-col sm:flex-row gap-3">
          {/* Organizer Actions */}
          {isOrganizer && (onEdit || onDelete) && (
            <div className="flex gap-2 flex-1">
              {onEdit && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(event.id)}
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Event
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this event?')) {
                      setIsDeleting(true);
                      try {
                        await onDelete(event.id);
                        onClose();
                      } finally {
                        setIsDeleting(false);
                      }
                    }
                  }}
                  disabled={isDeleting}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          )}

          {/* RSVP Actions */}
          {!isOrganizer && (
            <div className="flex gap-2 flex-1">
              <Button
                variant={isGoing ? "brand" : "outline"}
                className="flex-1"
                onClick={() => onRSVP?.(event.id, isGoing ? "not_going" : "going")}
                disabled={isFull && !isGoing}
              >
                {isGoing ? (
                  <>
                    <CheckCircleSolidIcon className="w-4 h-4 mr-2" />
                    Going
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    {isFull ? "Join Waitlist" : "I'm Going"}
                  </>
                )}
              </Button>
              <Button
                variant={isInterested ? "secondary" : "ghost"}
                onClick={() =>
                  onRSVP?.(event.id, isInterested ? "not_going" : "interested")
                }
              >
                <StarIcon
                  className={`w-4 h-4 ${isInterested ? "fill-current" : ""}`}
                />
              </Button>
            </div>
          )}

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBookmark?.(event.id)}
              aria-label={event.isBookmarked ? "Remove bookmark" : "Bookmark event"}
            >
              {event.isBookmarked ? (
                <BookmarkSolidIcon className="w-5 h-5 text-[var(--hive-brand-primary)]" />
              ) : (
                <BookmarkIcon className="w-5 h-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share event">
              <ShareIcon className="w-5 h-5" />
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EventDetailsModal;
