'use client';

/**
 * OrganizationsPanel — Compact table of clubs/orgs
 *
 * Columns: Avatar+Name | Online indicator | Unread badge
 * Max 8-10 visible, "X more" link to browse
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  motion,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import type { Space } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface OrganizationsPanelProps {
  spaces: Space[];
  maxVisible?: number;
}

// ============================================================
// Organization Row
// ============================================================

function OrganizationRow({
  space,
  index,
}: {
  space: Space;
  index: number;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  // Mock online count
  const onlineCount = Math.floor(Math.random() * 15) + 3;

  return (
    <motion.button
      onClick={() => router.push(`/s/${space.handle || space.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left',
        'transition-all duration-200',
        'hover:bg-white/[0.03]'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: 0.1 + index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Avatar */}
      <Avatar size="sm" className="ring-1 ring-white/[0.06] shrink-0">
        {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
        <AvatarFallback className="text-label-sm bg-white/[0.04]">
          {getInitials(space.name)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className="flex-1 text-body text-white/70 truncate">
        {space.name}
      </span>

      {/* Online indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
        <span className="text-label text-white/25 tabular-nums w-6 text-right">
          {onlineCount}
        </span>
      </div>

      {/* Unread badge */}
      {space.unreadCount && space.unreadCount > 0 ? (
        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-label-sm font-medium shrink-0">
          {space.unreadCount} new
        </span>
      ) : null}

      {/* Hover arrow */}
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: isHovered ? 0.5 : 0, x: isHovered ? 0 : -5 }}
        transition={{ duration: 0.15 }}
      >
        <ChevronRight size={14} className="text-white/30" />
      </motion.div>
    </motion.button>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyOrganizations() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <p className="text-body-sm text-white/30 text-center mb-4">
        No organizations yet
      </p>
      <button
        onClick={() => router.push('/spaces/browse')}
        className="text-label text-white/50 hover:text-white/70 transition-colors"
      >
        Browse spaces →
      </button>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function OrganizationsPanel({
  spaces,
  maxVisible = 8,
}: OrganizationsPanelProps) {
  const router = useRouter();
  const visibleSpaces = spaces.slice(0, maxVisible);
  const remainingCount = Math.max(0, spaces.length - maxVisible);

  return (
    <motion.div
      className="h-full rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        delay: 0.1,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
        <span className="text-body-sm font-medium text-white/40 uppercase tracking-wider">
          Organizations
        </span>
        {spaces.length > 0 && (
          <button
            onClick={() => router.push('/spaces/browse')}
            className="text-label-sm text-white/20 hover:text-white/40 transition-colors"
          >
            Browse all
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {visibleSpaces.length === 0 ? (
          <EmptyOrganizations />
        ) : (
          <div className="space-y-0.5">
            {visibleSpaces.map((space, i) => (
              <OrganizationRow key={space.id} space={space} index={i} />
            ))}

            {/* More link */}
            {remainingCount > 0 && (
              <motion.button
                onClick={() => router.push('/spaces/browse')}
                className="w-full px-4 py-3 text-body-sm text-white/30 hover:text-white/50 transition-colors text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                +{remainingCount} more
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
