'use client';

import { Crown, Users, Star, Clock, CheckCircle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { Badge } from '../../00-Global/atoms/badge';
import { Button } from '../../00-Global/atoms/button';
import { Card } from '../../00-Global/atoms/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';

export interface FoundingMember {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  joinedAt?: string;
  rank?: number;
}

export interface RitualFoundingClassProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The ritual data - when provided, extracts config automatically */
  ritual?: {
    id: string;
    title: string;
    subtitle?: string;
    startsAt: string;
    endsAt: string;
    phase: string;
    config?: {
      founderSlots?: number;
      earlyBirdBonus?: number;
    };
    metrics?: {
      participants?: number;
    };
  };
  /** Title override */
  title?: string;
  /** Founding members list */
  members?: FoundingMember[];
  /** Total slots available */
  totalSlots?: number;
  /** Whether current user is participating */
  isParticipating?: boolean;
  /** Whether current user is a founder */
  isFounder?: boolean;
  /** Join callback */
  onJoin?: () => void;
  /** Whether joining is in progress */
  isJoining?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

export const RitualFoundingClass: React.FC<RitualFoundingClassProps> = ({
  ritual,
  title,
  members = [],
  totalSlots,
  isParticipating = false,
  isFounder = false,
  onJoin,
  isJoining = false,
  className,
  ...props
}) => {
  // Extract from ritual if provided
  const displayTitle = title ?? ritual?.title ?? 'Founding Class';
  const slots = totalSlots ?? ritual?.config?.founderSlots ?? 100;
  const filledSlots = members.length;
  const remainingSlots = Math.max(0, slots - filledSlots);
  const percentFilled = Math.min(100, (filledSlots / slots) * 100);

  // Check ritual status
  const now = new Date();
  const startsAt = ritual?.startsAt ? new Date(ritual.startsAt) : null;
  const endsAt = ritual?.endsAt ? new Date(ritual.endsAt) : null;
  const isActive = ritual?.phase === 'active' || (startsAt && now >= startsAt && endsAt && now < endsAt);
  const hasEnded = ritual?.phase === 'ended' || (endsAt && now > endsAt);
  const isFull = remainingSlots === 0;

  // Generate empty slots for visualization
  const emptySlots = Math.min(remainingSlots, 12); // Show up to 12 empty slots

  return (
    <Card className={cn('border-white/10 bg-white/5 p-6', className)} {...props}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#FFD700]" />
            <h3 className="text-xl font-semibold text-white">{displayTitle}</h3>
          </div>
          {ritual?.subtitle && (
            <p className="mt-1 text-sm text-white/60">{ritual.subtitle}</p>
          )}
        </div>
        {isFounder && (
          <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30">
            <Star className="mr-1 h-3 w-3" />
            Founder
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-white/70">
            <Users className="mr-1 inline h-4 w-4" />
            {filledSlots} / {slots} founders
          </span>
          {remainingSlots > 0 ? (
            <span className="text-[#FFD700]">
              {remainingSlots} spots left
            </span>
          ) : (
            <span className="text-white/50">Full</span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]"
            initial={{ width: 0 }}
            animate={{ width: `${percentFilled}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
      </div>

      {/* Founding Members Grid */}
      {members.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-white/60 uppercase tracking-wide">
            Founding Members
          </h4>
          <motion.div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {members.slice(0, 12).map((member, index) => (
              <motion.div
                key={member.id}
                variants={itemVariants}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-2',
                  index < 3
                    ? 'border-[#FFD700]/30 bg-[#FFD700]/5'
                    : 'border-white/10 bg-black/30'
                )}
              >
                <Avatar className="h-8 w-8">
                  {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
                  <AvatarFallback className="bg-white/10 text-xs">
                    {(member.displayName || member.name || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">
                    {member.displayName || member.name}
                  </p>
                  {index < 3 && (
                    <p className="text-xs text-[#FFD700]/70">#{index + 1}</p>
                  )}
                </div>
                {index < 3 && (
                  <Crown className="h-3 w-3 shrink-0 text-[#FFD700]" />
                )}
              </motion.div>
            ))}

            {/* Empty slots */}
            {!isFull && emptySlots > 0 && Array.from({ length: Math.min(emptySlots, 4) }).map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                variants={itemVariants}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-2"
              >
                <div className="h-8 w-8 rounded-full border border-dashed border-white/20" />
                <span className="text-xs text-white/30">Open</span>
              </motion.div>
            ))}
          </motion.div>

          {members.length > 12 && (
            <p className="mt-2 text-center text-xs text-white/50">
              +{members.length - 12} more founders
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {members.length === 0 && !hasEnded && (
        <div className="mb-6 rounded-lg border border-dashed border-white/20 py-8 text-center">
          <Crown className="mx-auto mb-2 h-8 w-8 text-white/30" />
          <p className="text-sm text-white/50">Be the first to join!</p>
          <p className="text-xs text-white/30">
            {slots} founding spots available
          </p>
        </div>
      )}

      {/* Action Button */}
      {!hasEnded && (
        <div className="mt-4">
          {isParticipating ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 py-3 text-sm text-green-400">
              <CheckCircle className="h-4 w-4" />
              {isFounder ? "You're a Founding Member!" : "You've joined this ritual"}
            </div>
          ) : isFull ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-white/5 py-3 text-sm text-white/50">
              <Lock className="h-4 w-4" />
              All founder spots have been claimed
            </div>
          ) : isActive ? (
            <Button
              onClick={onJoin}
              disabled={isJoining}
              className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold"
            >
              {isJoining ? 'Joining...' : `Claim Founder Spot (${remainingSlots} left)`}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-white/5 py-3 text-sm text-white/50">
              <Clock className="h-4 w-4" />
              {startsAt && now < startsAt
                ? `Opens ${startsAt.toLocaleDateString()}`
                : 'Not yet active'}
            </div>
          )}
        </div>
      )}

      {/* Ended state */}
      {hasEnded && (
        <div className="mt-4 rounded-lg bg-white/5 py-3 text-center text-sm text-white/50">
          This founding class ritual has ended
        </div>
      )}
    </Card>
  );
};
