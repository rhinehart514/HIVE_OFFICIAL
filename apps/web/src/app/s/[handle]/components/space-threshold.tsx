'use client';

/**
 * SpaceThreshold - Full-page join gate
 *
 * Centered card. Clean. Discover → Join in one tap.
 *
 * @version 3.0.0 - Full-page centered, HIVE design system (Feb 2026)
 */

import * as React from 'react';
import { Users, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';

interface SpaceThresholdProps {
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
    onlineCount: number;
    isClaimed?: boolean;
  };
  onJoin: () => void;
  onClaim?: () => void;
  isJoining?: boolean;
  isClaiming?: boolean;
  joinError?: string | null;
  onClearError?: () => void;
}

export function SpaceThreshold({
  space,
  onJoin,
  onClaim,
  isJoining = false,
  isClaiming = false,
  joinError = null,
  onClearError,
}: SpaceThresholdProps) {
  const handleJoin = () => {
    if (onClearError) onClearError();
    onJoin();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal top bar — back to discover */}
      <div className="h-14 flex items-center px-4 flex-shrink-0">
        <a
          href="/spaces"
          className="flex items-center gap-1 text-[13px] text-white/40 hover:text-white/60 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Spaces
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 -mt-14">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-6">
          {/* Avatar + Name */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar size="lg" className="mb-4">
              {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
              <AvatarFallback className="text-lg">{getInitials(space.name)}</AvatarFallback>
            </Avatar>

            <h2
              className="text-xl font-semibold text-white mb-1"
              style={{ fontFamily: "var(--font-clash, 'Clash Display', sans-serif)" }}
            >
              {space.name}
            </h2>

            <span className="text-[13px] font-sans text-white/40 mb-3">
              @{space.handle}
            </span>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-[13px] text-white/40">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}</span>
              </div>
              {space.onlineCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{space.onlineCount} online</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {space.description && (
            <p className="text-[14px] text-white/50 leading-relaxed text-center mb-6 line-clamp-3">
              {space.description}
            </p>
          )}

          {/* Error */}
          <AnimatePresence mode="wait">
            {joinError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden mb-4"
              >
                <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[13px] text-red-300 leading-snug">{joinError}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <div className="flex flex-col gap-2">
            <Button
              variant="cta"
              size="default"
              onClick={handleJoin}
              disabled={isJoining}
              loading={isJoining}
              className="w-full justify-center"
            >
              {isJoining ? 'Joining...' : joinError ? 'Try Again' : 'Join Space'}
              {!isJoining && <ArrowRight className="h-4 w-4 ml-1.5" />}
            </Button>
            {!space.isClaimed && onClaim && (
              <Button
                variant="ghost"
                size="default"
                onClick={onClaim}
                disabled={isClaiming}
                loading={isClaiming}
                className="w-full justify-center text-white/40"
              >
                {isClaiming ? 'Claiming...' : 'Claim This Space'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}

SpaceThreshold.displayName = 'SpaceThreshold';
