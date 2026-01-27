'use client';

/**
 * SpacePreviewModal - Space preview before joining/entering
 *
 * Shows a preview of a space with:
 * - Name, avatar, description
 * - Member count, online count
 * - Upcoming events (optional)
 * - Actions: Join (non-members) or Enter (members)
 *
 * Used in DiscoverSection for consistent UX across all users.
 *
 * @version 1.0.0 - Spaces Perfection Plan (Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  UserGroupIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
} from '@hive/ui';
import { Text, ModalOverlay } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { secureApiFetch } from '@/lib/secure-auth-utils';

// ============================================================
// Types
// ============================================================

export interface SpacePreviewData {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  category?: string;
  memberCount: number;
  onlineCount?: number;
  isJoined: boolean;
  isVerified?: boolean;
  upcomingEvents?: {
    id: string;
    title: string;
    date: string;
  }[];
  toolCount?: number;
}

export interface SpacePreviewModalProps {
  space: SpacePreviewData | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin?: (spaceId: string) => Promise<void>;
}

// ============================================================
// Component
// ============================================================

export function SpacePreviewModal({
  space,
  isOpen,
  onClose,
  onJoin,
}: SpacePreviewModalProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = React.useState(false);
  const [justJoined, setJustJoined] = React.useState(false);

  // Reset state when modal opens with new space
  React.useEffect(() => {
    if (isOpen) {
      setIsJoining(false);
      setJustJoined(false);
    }
  }, [isOpen, space?.id]);

  const handleJoin = async () => {
    if (!space || !onJoin) return;

    setIsJoining(true);
    try {
      await onJoin(space.id);
      setJustJoined(true);

      // Navigate to space after brief delay
      setTimeout(() => {
        router.push(`/spaces/${space.id}`);
        onClose();
      }, 1500);
    } catch {
      setIsJoining(false);
    }
  };

  const handleEnter = () => {
    if (!space) return;
    router.push(`/spaces/${space.id}`);
    onClose();
  };

  if (!space) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="max-w-md p-0 bg-[var(--bg-surface)] border-white/[0.06] overflow-hidden">
        {/* Banner/Header */}
        <div className="relative h-32 bg-gradient-to-br from-white/[0.04] to-white/[0.02]">
          {space.bannerUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${space.bannerUrl})` }}
            />
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            aria-label="Close preview"
          >
            <XMarkIcon className="w-4 h-4 text-white/70" aria-hidden="true" />
          </button>

          {/* Avatar positioned at bottom, overlapping */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <Avatar className="h-20 w-20 border-4 border-[var(--bg-surface)]">
              <AvatarImage src={space.avatarUrl} alt={space.name} />
              <AvatarFallback className="text-2xl bg-white/[0.08] text-white/60">
                {space.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 pb-6 px-6">
          {/* Name & Category */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-white mb-1 flex items-center justify-center gap-2">
              {space.name}
              {space.isVerified && (
                <CheckIcon className="w-4 h-4 text-gold-500" />
              )}
            </h2>
            {space.category && (
              <Text size="sm" className="text-white/40 capitalize">
                {space.category.replace(/_/g, ' ')}
              </Text>
            )}
          </div>

          {/* Description */}
          {space.description && (
            <Text className="text-center text-white/60 text-sm mb-6 line-clamp-3">
              {space.description}
            </Text>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <UserGroupIcon className="w-4 h-4" />
              <span>{space.memberCount.toLocaleString()} {space.memberCount === 1 ? 'member' : 'members'}</span>
            </div>
            {space.onlineCount !== undefined && space.onlineCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-400">{space.onlineCount} online</span>
              </div>
            )}
          </div>

          {/* Upcoming Events (if any) */}
          {space.upcomingEvents && space.upcomingEvents.length > 0 && (
            <div className="mb-6">
              <Text size="xs" className="text-white/30 uppercase tracking-wider mb-2 text-center">
                Upcoming Events
              </Text>
              <div className="space-y-2">
                {space.upcomingEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <CalendarIcon className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Text size="sm" className="text-white/80 truncate">
                        {event.title}
                      </Text>
                      <Text size="xs" className="text-white/40">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool Count (if any) */}
          {space.toolCount !== undefined && space.toolCount > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-white/40">
              <WrenchScrewdriverIcon className="w-4 h-4" />
              <span>{space.toolCount} {space.toolCount === 1 ? 'tool' : 'tools'} available</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {justJoined ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 py-3 text-gold-500"
              >
                <CheckIcon className="w-5 h-5" />
                <span className="font-medium">Welcome! Taking you there...</span>
              </motion.div>
            ) : space.isJoined ? (
              <Button
                onClick={handleEnter}
                className="w-full bg-white text-[#0A0A09] hover:bg-white/90 font-medium"
              >
                <span>Enter Space</span>
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className={cn(
                  'w-full font-medium transition-all duration-200',
                  'bg-gold-500 text-[#0A0A09] hover:bg-gold-400',
                  isJoining && 'opacity-70 cursor-wait'
                )}
              >
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  'Join Space'
                )}
              </Button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SpacePreviewModal;
