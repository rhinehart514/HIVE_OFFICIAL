'use client';

/**
 * MembersPreview - Online members preview in sidebar
 *
 * Shows:
 * - Online count with green indicator
 * - Avatar stack of online members
 * - Click to open full members list
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { SPACE_COLORS } from '@hive/tokens';

export interface OnlineMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface MembersPreviewProps {
  onlineCount: number;
  totalCount: number;
  onlineMembers?: OnlineMember[];
  maxAvatars?: number;
  onClick?: () => void;
}

export function MembersPreview({
  onlineCount,
  totalCount,
  onlineMembers = [],
  maxAvatars = 5,
  onClick,
}: MembersPreviewProps) {
  const displayedMembers = onlineMembers.slice(0, maxAvatars);
  const remainingCount = Math.max(0, onlineCount - maxAvatars);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-2 py-2 rounded-lg',
        'flex items-center gap-3',
        'hover:bg-white/[0.04]',
        'transition-colors duration-150',
        'text-left group'
      )}
    >
      {/* Avatar stack */}
      <div className="flex items-center -space-x-2">
        {displayedMembers.length > 0 ? (
          displayedMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <Avatar
                size="xs"
                className={cn(
                  'ring-2 ring-[#0A0A09]',
                  'relative'
                )}
              >
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
                <AvatarFallback className="text-[10px]">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--bg-ground)]"
                style={{ backgroundColor: SPACE_COLORS.onlineIndicator }}
              />
            </motion.div>
          ))
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center">
            <Users className="w-3 h-3 text-white/30" />
          </div>
        )}

        {/* Overflow count */}
        {remainingCount > 0 && (
          <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center ring-2 ring-[#0A0A09]">
            <span className="text-[10px] font-medium text-white/60">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {onlineCount > 0 && (
            <>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: SPACE_COLORS.onlineIndicator }}
              />
              <span className="text-xs font-medium text-white/60">
                {onlineCount} online
              </span>
            </>
          )}
          {onlineCount === 0 && (
            <span className="text-xs text-white/40">
              {totalCount} members
            </span>
          )}
        </div>
      </div>

      {/* Chevron on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <svg
          className="w-4 h-4 text-white/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

MembersPreview.displayName = 'MembersPreview';

export default MembersPreview;
