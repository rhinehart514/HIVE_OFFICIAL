'use client';

/**
 * MajorSpaceCard - Display card for major spaces
 *
 * Two states:
 * 1. Unlocked: Shows green checkmark, "Active", [Enter Space →] button
 * 2. Locked: Shows lock icon, "Coming Soon", explanation, [Join Waitlist] + [Invite Friends]
 *
 * CRITICAL: Never show member counts or unlock thresholds to users.
 * The unlock mechanic is server-side only.
 */

import { motion } from '@hive/ui/design-system/primitives';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MajorSpaceCardProps {
  spaceId: string;
  majorName: string;
  isUnlocked: boolean;
  isOnWaitlist?: boolean;
  onJoinWaitlist?: () => void;
  onInviteFriends?: () => void;
  className?: string;
}

export function MajorSpaceCard({
  spaceId,
  majorName,
  isUnlocked,
  isOnWaitlist = false,
  onJoinWaitlist,
  onInviteFriends,
  className,
}: MajorSpaceCardProps) {
  if (isUnlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl border border-white/10 bg-white/[0.02] p-5',
          'hover:border-white/20 hover:bg-white/[0.03] transition-all duration-200',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-white mb-1">
              {majorName}
            </h3>
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-green-400"
              >
                <path
                  d="M11.6667 3.5L5.25 9.91667L2.33333 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13px] text-green-400/90 font-medium">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link href={`/s/${spaceId}`}>
          <Button
            variant="secondary"
            size="sm"
            className="w-full group"
          >
            <span>Enter Space</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="ml-1 transition-transform group-hover:translate-x-1"
            >
              <path
                d="M2.33333 7H11.6667M11.6667 7L7 2.33333M11.6667 7L7 11.6667"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </Link>
      </motion.div>
    );
  }

  // Locked state
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-white/10 bg-white/[0.02] p-5',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-white/40"
          >
            <path
              d="M11.0833 6.41667H2.91667C2.32233 6.41667 1.83333 6.90567 1.83333 7.5V11.0833C1.83333 11.6777 2.32233 12.1667 2.91667 12.1667H11.0833C11.6777 12.1667 12.1667 11.6777 12.1667 11.0833V7.5C12.1667 6.90567 11.6777 6.41667 11.0833 6.41667Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 6.41667V4.33333C4 3.53841 4.31607 2.77589 4.87868 2.21328C5.44129 1.65067 6.20381 1.33333 7 1.33333C7.79619 1.33333 8.55871 1.65067 9.12132 2.21328C9.68393 2.77589 10 3.53841 10 4.33333V6.41667"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[13px] text-white/50 font-medium">
            Coming Soon
          </span>
        </div>

        <h3 className="text-[16px] font-semibold text-white mb-2">
          {majorName}
        </h3>
        <p className="text-[13px] text-white/50 leading-relaxed">
          Will unlock when more students join
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {!isOnWaitlist && onJoinWaitlist && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onJoinWaitlist}
            className="w-full"
          >
            Join Waitlist
          </Button>
        )}

        {isOnWaitlist && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-white/60"
            >
              <path
                d="M11.6667 3.5L5.25 9.91667L2.33333 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[12px] text-white/70">
              On Waitlist
            </span>
          </div>
        )}

        {onInviteFriends && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onInviteFriends}
            className="w-full"
          >
            Invite Friends
          </Button>
        )}
      </div>
    </motion.div>
  );
}
