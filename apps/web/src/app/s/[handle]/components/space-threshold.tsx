'use client';

/**
 * SpaceThreshold - Inline Join Prompt
 *
 * Simplified threshold experience — one compact card at top of feed.
 * No modals, no separate routes, no ceremonies.
 *
 * Shows: space info, member count, join button.
 *
 * @version 2.0.0 - Simplified (Feb 2026)
 */

import * as React from 'react';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';

interface SpaceThresholdProps {
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
    onlineCount: number;
  };
  onJoin: () => void;
  isJoining?: boolean;
  joinError?: string | null;
  onClearError?: () => void;
}

export function SpaceThreshold({
  space,
  onJoin,
  isJoining = false,
  joinError = null,
  onClearError,
}: SpaceThresholdProps) {
  const handleJoin = () => {
    if (onClearError) onClearError();
    onJoin();
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto mb-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durationSeconds.gentle, ease: MOTION.ease.premium }}
    >
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6">
        {/* Header: Avatar + Info */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar size="lg" className="flex-shrink-0">
            {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
            <AvatarFallback className="text-lg">{getInitials(space.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Space Name */}
            <h2 className="text-heading-sm font-semibold text-white mb-1 leading-tight">
              {space.name}
            </h2>

            {/* Handle + Stats */}
            <div className="flex items-center gap-3 mb-2">
              <Text size="sm" className="text-white/40 font-mono">
                @{space.handle}
              </Text>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-white/30" />
                <Text size="sm" tone="muted">
                  {space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}
                </Text>
              </div>
              {space.onlineCount > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />
                    <Text size="sm" className="text-[var(--color-gold)]/80">
                      {space.onlineCount} online
                    </Text>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            {space.description && (
              <Text size="sm" className="text-white/50 leading-relaxed line-clamp-2">
                {space.description}
              </Text>
            )}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {joinError && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, ease: MOTION.ease.premium }}
              className="overflow-hidden"
            >
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <Text size="sm" className="text-red-300 leading-snug">
                    {joinError}
                  </Text>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="flex items-center justify-between">
          <Text size="sm" tone="muted">
            Join to see the full conversation
          </Text>
          <Button
            variant="cta"
            size="default"
            onClick={handleJoin}
            disabled={isJoining}
            loading={isJoining}
          >
            {isJoining ? 'Joining...' : joinError ? 'Try Again' : 'Join Space'}
            {!isJoining && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

SpaceThreshold.displayName = 'SpaceThreshold';
