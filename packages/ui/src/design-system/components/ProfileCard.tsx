'use client';

/**
 * ProfileCard Component — LOCKED 2026-01-11
 *
 * 5 CONTEXT-SPECIFIC VARIANTS:
 * 1. ProfileCardMemberRow — Member list rows (40px, presence, hover menu)
 * 2. ProfileCardHover — Hover card (280px horizontal, bio + mutuals, Message CTA)
 * 3. ProfileCardSearchRow — Search results (44px rows, no actions)
 * 4. ProfileCardMention — Inline @mention chip (blue pill)
 * 5. ProfileCardFull — Full profile page card (portrait avatar, glass buttons)
 */

import * as React from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';
import {
  Card,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Text,
  Badge,
  Button,
  PresenceDot,
  getInitials,
} from '../primitives';

// ============================================
// SHARED TYPES
// ============================================

export type UserStatus = 'online' | 'away' | 'offline' | 'dnd';

export interface ProfileUser {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  status?: UserStatus;
  bio?: string;
  major?: string;
  badges?: string[];
  mutualCount?: number;
  connectionCount?: number;
  spaceCount?: number;
}

// ============================================
// ICONS
// ============================================

const MoreHorizontalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const MessageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

// ============================================
// 1. MEMBER LIST CONTEXT (ProfileCardMemberRow)
// Discord-style member list with section grouping
// ============================================

export interface ProfileCardMemberRowProps {
  user: ProfileUser;
  /** Show hover menu on row hover */
  showMenu?: boolean;
  /** Menu items */
  menuItems?: Array<{ label: string; onClick: () => void }>;
  /** Click handler */
  onClick?: () => void;
  className?: string;
}

/**
 * LOCKED: Member List Context
 * - 40px row height, sm avatar, gap-3
 * - Name + @handle
 * - Presence dot bottom-right of avatar
 * - Three-dot hover menu (···) on row hover
 * - hover:bg-white/5 on rows
 */
const ProfileCardMemberRow: React.FC<ProfileCardMemberRowProps> = ({
  user,
  showMenu = true,
  menuItems,
  onClick,
  className,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { name, handle, avatar, status = 'offline' } = user;
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        // LOCKED: 40px row height
        'flex items-center gap-3 px-2 h-10 rounded-lg',
        'transition-colors duration-150',
        // LOCKED: hover:bg-white/5
        'hover:bg-white/[0.05]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMenuOpen(false);
      }}
    >
      {/* LOCKED: Avatar with presence dot bottom-right */}
      <div className="relative flex-shrink-0">
        <Avatar size="sm">
          {avatar && <AvatarImage src={avatar} alt={name} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <PresenceDot
          status={status}
          size="sm"
          className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[var(--color-bg-surface)]"
        />
      </div>

      {/* LOCKED: Name + @handle */}
      <div className="flex-1 min-w-0">
        <Text weight="medium" className="truncate">
          {name}
        </Text>
        <Text size="xs" tone="muted" className="truncate">
          @{handle}
        </Text>
      </div>

      {/* LOCKED: Three-dot hover menu */}
      {showMenu && isHovered && (
        <button
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded',
            'text-white/50 hover:text-white hover:bg-white/[0.08]',
            'transition-colors duration-150'
          )}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <MoreHorizontalIcon className="w-4 h-4" />
        </button>
      )}

      {/* Dropdown menu */}
      {menuOpen && menuItems && menuItems.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-50">
          <Card elevation="floating" className="py-1 min-w-[120px]">
            {menuItems.map((item, i) => (
              <button
                key={i}
                className="w-full px-3 py-1.5 text-left text-sm text-white/80 hover:bg-white/[0.06]"
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  setMenuOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};

ProfileCardMemberRow.displayName = 'ProfileCardMemberRow';

// ============================================
// 2. HOVER CARD CONTEXT (ProfileCardHover)
// Horizontal 280px, bio + mutuals, Message CTA
// ============================================

export interface ProfileCardHoverProps {
  user: ProfileUser;
  /** Message callback */
  onMessage?: () => void;
  /** Click handler for entire card */
  onClick?: () => void;
  className?: string;
}

/**
 * LOCKED: Hover Card Context
 * - Horizontal layout (avatar left, content right)
 * - 280px width, p-4 padding
 * - md avatar with presence dot
 * - Name + @handle + bio (2-line clamp) + mutual connections count
 * - Single "Message" button (secondary variant)
 * - Apple Glass Dark surface
 */
const ProfileCardHover: React.FC<ProfileCardHoverProps> = ({
  user,
  onMessage,
  onClick,
  className,
}) => {
  const { name, handle, avatar, status = 'offline', bio, mutualCount = 0 } = user;
  const initials = getInitials(name);

  return (
    <Card
      elevation="floating"
      interactive={!!onClick}
      className={cn(
        // LOCKED: 280px width, p-4 padding
        'w-[280px] p-4',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* LOCKED: Horizontal layout */}
      <div className="flex gap-3">
        {/* LOCKED: md avatar with presence dot */}
        <div className="relative flex-shrink-0">
          <Avatar size="default">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <PresenceDot
            status={status}
            size="sm"
            className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[var(--color-bg-card)]"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* LOCKED: Name + @handle */}
          <Text weight="medium" className="truncate">
            {name}
          </Text>
          <Text size="xs" tone="muted" className="truncate">
            @{handle}
          </Text>

          {/* LOCKED: Bio (2-line clamp) */}
          {bio && (
            <Text size="sm" tone="secondary" className="mt-2 line-clamp-2">
              {bio}
            </Text>
          )}

          {/* LOCKED: Mutual connections count */}
          {mutualCount > 0 && (
            <Text size="xs" tone="muted" className="mt-2">
              {mutualCount} mutual connection{mutualCount !== 1 ? 's' : ''}
            </Text>
          )}
        </div>
      </div>

      {/* LOCKED: Single "Message" button (secondary variant) */}
      {onMessage && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-3"
          onClick={(e) => {
            e.stopPropagation();
            onMessage();
          }}
        >
          <MessageIcon className="w-4 h-4 mr-1.5" />
          Message
        </Button>
      )}
    </Card>
  );
};

ProfileCardHover.displayName = 'ProfileCardHover';

// ============================================
// 3. SEARCH RESULT CONTEXT (ProfileCardSearchRow)
// 44px rows, name + handle + major + mutuals, no actions
// ============================================

export interface ProfileCardSearchRowProps {
  user: ProfileUser;
  /** Click handler */
  onClick?: () => void;
  className?: string;
}

/**
 * LOCKED: Search Result Context
 * - 44px row height, gap-3, px-2
 * - sm avatar
 * - Name + @handle + major, mutual count on right (if > 0)
 * - No actions (click entire row to select)
 * - hover:bg-white/5, cursor-pointer
 */
const ProfileCardSearchRow: React.FC<ProfileCardSearchRowProps> = ({
  user,
  onClick,
  className,
}) => {
  const { name, handle, avatar, major, mutualCount = 0 } = user;
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        // LOCKED: 44px row height, gap-3, px-2
        'flex items-center gap-3 px-2 h-11 rounded-lg',
        'transition-colors duration-150',
        // LOCKED: hover:bg-white/5, cursor-pointer
        'hover:bg-white/[0.05] cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* LOCKED: sm avatar */}
      <Avatar size="sm" className="flex-shrink-0">
        {avatar && <AvatarImage src={avatar} alt={name} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {/* LOCKED: Name + @handle + major */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text weight="medium" className="truncate">
            {name}
          </Text>
          <Text size="xs" tone="muted" className="truncate">
            @{handle}
          </Text>
        </div>
        {major && (
          <Text size="xs" tone="muted" className="truncate">
            {major}
          </Text>
        )}
      </div>

      {/* LOCKED: Mutual count on right (if > 0) */}
      {mutualCount > 0 && (
        <Text size="xs" tone="muted" className="flex-shrink-0">
          {mutualCount} mutual{mutualCount !== 1 ? 's' : ''}
        </Text>
      )}
    </div>
  );
};

ProfileCardSearchRow.displayName = 'ProfileCardSearchRow';

// ============================================
// 4. INLINE CHIP CONTEXT (ProfileCardMention)
// Blue pill, no avatar, hover triggers hover card
// ============================================

export interface ProfileCardMentionProps {
  user: Pick<ProfileUser, 'id' | 'handle'>;
  /** Show hover card on hover */
  hoverCard?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  className?: string;
}

/**
 * LOCKED: Inline Chip Context (@mentions)
 * - bg-[var(--color-interactive-active)]/20 text-[var(--color-interactive-active)]
 * - px-1.5 py-0.5 rounded
 * - @handle text only, no avatar
 * - hover:bg-[var(--color-interactive-active)]/30, shows hover card
 */
const ProfileCardMention: React.FC<ProfileCardMentionProps> = ({
  user,
  hoverCard,
  onClick,
  className,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { handle } = user;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={cn(
          // LOCKED: Blue pill styling
          'px-1.5 py-0.5 rounded',
          'bg-[var(--color-interactive-active)]/20 text-[var(--color-interactive-active)]',
          'transition-colors duration-150',
          // LOCKED: hover:bg-[var(--color-interactive-active)]/30
          'hover:bg-[var(--color-interactive-active)]/30',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        @{handle}
      </span>

      {/* LOCKED: Shows hover card on hover */}
      {hoverCard && isHovered && (
        <div className="absolute left-0 top-full mt-2 z-50">
          {hoverCard}
        </div>
      )}
    </span>
  );
};

ProfileCardMention.displayName = 'ProfileCardMention';

// ============================================
// 5. FULL CARD CONTEXT (ProfileCardFull)
// Portrait avatar, glass buttons, gold Connect
// ============================================

export interface ProfileCardFullProps {
  user: ProfileUser;
  /** Connect callback */
  onConnect?: () => void;
  /** Message callback */
  onMessage?: () => void;
  /** Click handler */
  onClick?: () => void;
  className?: string;
}

/**
 * LOCKED: Full Card Context (Profile Page)
 * - Left-aligned layout (avatar left, content right), gap-6
 * - Portrait Card avatar (w-36 h-48, elevation="raised", initials)
 * - Presence: Subtle dot (w-3 h-3, 80% opacity green, inside portrait corner)
 * - Name + badge + @handle + major + bio + stats (connections/spaces)
 * - Card-as-button actions with elevation="raised", rounded-full, interactive
 * - Connect: Gold text (text-[var(--color-accent-gold)])
 * - Message: Default white text
 */
const ProfileCardFull: React.FC<ProfileCardFullProps> = ({
  user,
  onConnect,
  onMessage,
  onClick,
  className,
}) => {
  const {
    name,
    handle,
    avatar,
    status = 'offline',
    bio,
    major,
    badges = [],
    connectionCount = 0,
    spaceCount = 0,
  } = user;
  const initials = getInitials(name);

  const presenceColor = {
    online: 'bg-green-500',
    away: 'bg-amber-500',
    offline: 'bg-white/40',
    dnd: 'bg-red-500',
  }[status];

  return (
    <Card
      elevation="raised"
      interactive={!!onClick}
      className={cn(
        'p-6',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* LOCKED: Left-aligned layout, gap-6 */}
      <div className="flex gap-6">
        {/* LOCKED: Portrait Card avatar (w-36 h-48) */}
        <div className="relative flex-shrink-0">
          <Card
            elevation="raised"
            noPadding
            className="w-36 h-48 flex items-center justify-center overflow-hidden"
          >
            {avatar ? (
              <Image src={avatar} alt={name} width={144} height={192} className="object-cover" sizes="144px" />
            ) : (
              <Text size="lg" className="text-4xl text-white/40">
                {initials}
              </Text>
            )}
          </Card>
          {/* LOCKED: Subtle presence dot inside portrait corner */}
          <div
            className={cn(
              'absolute bottom-3 right-3 w-3 h-3 rounded-full',
              presenceColor,
              'opacity-80'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* LOCKED: Name + badge */}
          <div className="flex items-center gap-2 mb-1">
            <Text size="lg" weight="semibold" className="text-xl">
              {name}
            </Text>
            {badges.length > 0 && (
              <Badge
                variant={badges[0].toLowerCase().includes('founder') ? 'gold' : 'neutral'}
                size="sm"
              >
                {badges[0]}
              </Badge>
            )}
          </div>

          {/* LOCKED: @handle */}
          <Text size="sm" tone="muted" className="mb-2">
            @{handle}
          </Text>

          {/* LOCKED: Major */}
          {major && (
            <Text size="sm" tone="secondary" className="mb-3">
              {major}
            </Text>
          )}

          {/* LOCKED: Bio */}
          {bio && (
            <Text size="sm" tone="secondary" className="mb-4 line-clamp-3">
              {bio}
            </Text>
          )}

          {/* LOCKED: Stats (connections/spaces) */}
          <div className="flex items-center gap-4 mb-4">
            <div>
              <Text weight="medium">{connectionCount}</Text>
              <Text size="xs" tone="muted"> connections</Text>
            </div>
            <div>
              <Text weight="medium">{spaceCount}</Text>
              <Text size="xs" tone="muted"> spaces</Text>
            </div>
          </div>

          {/* LOCKED: Card-as-button actions */}
          {(onConnect || onMessage) && (
            <div className="flex gap-2">
              {onConnect && (
                <Card
                  elevation="raised"
                  interactive
                  className={cn(
                    'px-5 py-2.5 rounded-full cursor-pointer',
                    // LOCKED: Connect with gold text
                    'text-[var(--color-accent-gold)]'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnect();
                  }}
                >
                  <Text weight="medium" className="text-inherit">
                    Connect
                  </Text>
                </Card>
              )}
              {onMessage && (
                <Card
                  elevation="raised"
                  interactive
                  className="px-5 py-2.5 rounded-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage();
                  }}
                >
                  <Text weight="medium">Message</Text>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

ProfileCardFull.displayName = 'ProfileCardFull';

// ============================================
// SKELETONS
// ============================================

interface ProfileCardMemberRowSkeletonProps {
  className?: string;
}

const ProfileCardMemberRowSkeleton: React.FC<ProfileCardMemberRowSkeletonProps> = ({
  className,
}) => (
  <div className={cn('flex items-center gap-3 px-2 h-10', className)}>
    <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 w-24 rounded bg-white/[0.06] animate-pulse" />
      <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
    </div>
  </div>
);

ProfileCardMemberRowSkeleton.displayName = 'ProfileCardMemberRowSkeleton';

interface ProfileCardHoverSkeletonProps {
  className?: string;
}

const ProfileCardHoverSkeleton: React.FC<ProfileCardHoverSkeletonProps> = ({
  className,
}) => (
  <Card elevation="floating" className={cn('w-[280px] p-4', className)}>
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/[0.06] animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-14 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-full rounded bg-white/[0.06] animate-pulse mt-2" />
        <div className="h-3 w-3/4 rounded bg-white/[0.06] animate-pulse" />
      </div>
    </div>
    <div className="h-8 w-full rounded-lg bg-white/[0.06] animate-pulse mt-3" />
  </Card>
);

ProfileCardHoverSkeleton.displayName = 'ProfileCardHoverSkeleton';

interface ProfileCardSearchRowSkeletonProps {
  className?: string;
}

const ProfileCardSearchRowSkeleton: React.FC<ProfileCardSearchRowSkeletonProps> = ({
  className,
}) => (
  <div className={cn('flex items-center gap-3 px-2 h-11', className)}>
    <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse" />
    <div className="flex-1 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-20 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-14 rounded bg-white/[0.06] animate-pulse" />
      </div>
      <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
    </div>
    <div className="h-3 w-12 rounded bg-white/[0.06] animate-pulse" />
  </div>
);

ProfileCardSearchRowSkeleton.displayName = 'ProfileCardSearchRowSkeleton';

interface ProfileCardFullSkeletonProps {
  className?: string;
}

const ProfileCardFullSkeleton: React.FC<ProfileCardFullSkeletonProps> = ({
  className,
}) => (
  <Card elevation="raised" className={cn('p-6', className)}>
    <div className="flex gap-6">
      <div className="w-36 h-48 rounded-xl bg-white/[0.06] animate-pulse" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-white/[0.06] animate-pulse" />
        </div>
        <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
        <div className="space-y-2 mt-2">
          <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="flex gap-4 mt-2">
          <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-16 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="h-10 w-24 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="h-10 w-24 rounded-full bg-white/[0.06] animate-pulse" />
        </div>
      </div>
    </div>
  </Card>
);

ProfileCardFullSkeleton.displayName = 'ProfileCardFullSkeleton';

// ============================================
// LEGACY ALIASES (for backwards compatibility)
// ============================================

/**
 * @deprecated Use ProfileCardMemberRow instead
 */
export interface ProfileCardProps {
  user: ProfileUser;
  variant?: 'default' | 'compact' | 'expanded';
  showActions?: boolean;
  onConnect?: () => void;
  onMessage?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * @deprecated Use context-specific variants instead:
 * - ProfileCardMemberRow for member lists
 * - ProfileCardHover for hover cards
 * - ProfileCardSearchRow for search results
 * - ProfileCardMention for @mentions
 * - ProfileCardFull for profile pages
 */
const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  variant = 'default',
  showActions = true,
  onConnect,
  onMessage,
  onClick,
  className,
}) => {
  // Map legacy variants to new components
  if (variant === 'compact') {
    return (
      <ProfileCardMemberRow
        user={user}
        showMenu={false}
        onClick={onClick}
        className={className}
      />
    );
  }

  if (variant === 'expanded') {
    return (
      <ProfileCardFull
        user={user}
        onConnect={showActions ? onConnect : undefined}
        onMessage={showActions ? onMessage : undefined}
        onClick={onClick}
        className={className}
      />
    );
  }

  // Default: use ProfileCardHover style
  return (
    <ProfileCardHover
      user={user}
      onMessage={showActions ? onMessage : undefined}
      onClick={onClick}
      className={className}
    />
  );
};

ProfileCard.displayName = 'ProfileCard';

/**
 * @deprecated Use context-specific skeletons instead
 */
const ProfileCardSkeleton: React.FC<{ variant?: 'default' | 'compact' | 'expanded'; className?: string }> = ({
  variant = 'default',
  className,
}) => {
  if (variant === 'compact') {
    return <ProfileCardMemberRowSkeleton className={className} />;
  }
  if (variant === 'expanded') {
    return <ProfileCardFullSkeleton className={className} />;
  }
  return <ProfileCardHoverSkeleton className={className} />;
};

ProfileCardSkeleton.displayName = 'ProfileCardSkeleton';

/**
 * @deprecated Use ProfileCardMemberRow instead
 */
const ProfileCardMini = ProfileCardMemberRow;
ProfileCardMini.displayName = 'ProfileCardMini';

// ============================================
// EXPORTS
// ============================================

export {
  // New context-specific components
  ProfileCardMemberRow,
  ProfileCardHover,
  ProfileCardSearchRow,
  ProfileCardMention,
  ProfileCardFull,
  // Skeletons
  ProfileCardMemberRowSkeleton,
  ProfileCardHoverSkeleton,
  ProfileCardSearchRowSkeleton,
  ProfileCardFullSkeleton,
  // Legacy (deprecated)
  ProfileCard,
  ProfileCardSkeleton,
  ProfileCardMini,
};
