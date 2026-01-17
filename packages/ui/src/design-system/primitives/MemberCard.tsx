'use client';

/**
 * MemberCard Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Member identity display with role badges and presence
 * Rounded square avatar, glass surface, gold for leaders.
 *
 * Recipe:
 *   sizes: large (bento feature), medium (list), compact (grid)
 *   avatar: Rounded square (rounded-xl), never circle
 *   role: Badge with icon (Leader = gold, Member = glass)
 *   presence: Optional green dot in corner
 *   hover: brightness-110 (no scale)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass surface for card
const glassCardSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
};

// LOCKED: Role colors
const ROLE_COLORS = {
  leader: {
    bg: 'bg-[#D4AF37]/20',
    text: 'text-[#D4AF37]',
    border: 'border-[#D4AF37]/30',
  },
  admin: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  moderator: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  member: {
    bg: 'bg-white/[0.06]',
    text: 'text-white/60',
    border: 'border-white/10',
  },
};

// Card container variants
const memberCardContainerVariants = cva(
  [
    'rounded-xl',
    'border border-white/[0.06]',
    'transition-all duration-150',
    // Hover (brightness, not scale)
    'hover:brightness-110',
    // Focus (WHITE)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
  ].join(' '),
  {
    variants: {
      size: {
        large: 'p-5',
        medium: 'p-4',
        compact: 'p-3',
      },
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      size: 'medium',
      interactive: false,
    },
  }
);

// Avatar variants (rounded square)
const memberAvatarVariants = cva(
  [
    'rounded-xl', // LOCKED: Rounded square, never circle
    'overflow-hidden',
    'bg-white/10',
    'shrink-0',
  ].join(' '),
  {
    variants: {
      size: {
        large: 'w-20 h-20',
        medium: 'w-12 h-12',
        compact: 'w-10 h-10',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
);

// Role badge variants
const roleBadgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'rounded-full',
    'font-medium',
    'border',
  ].join(' '),
  {
    variants: {
      size: {
        large: 'px-2.5 py-1 text-xs',
        medium: 'px-2 py-0.5 text-[10px]',
        compact: 'px-1.5 py-0.5 text-[10px]',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
);

// Presence dot variants
const presenceDotVariants = cva(
  [
    'absolute',
    'rounded-full',
    'ring-2 ring-[#0A0A09]',
  ].join(' '),
  {
    variants: {
      size: {
        large: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
        medium: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
        compact: 'w-2 h-2 -bottom-0 -right-0',
      },
      status: {
        online: 'bg-green-500',
        away: 'bg-amber-500',
        offline: 'bg-white/30',
      },
    },
    defaultVariants: {
      size: 'medium',
      status: 'offline',
    },
  }
);

// Types
export type MemberRole = 'leader' | 'admin' | 'moderator' | 'member';
export type PresenceStatus = 'online' | 'away' | 'offline';

export interface MemberCardData {
  /** User ID */
  id: string;
  /** Display name */
  name: string;
  /** Handle (e.g., @john_doe) */
  handle: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Role in space */
  role: MemberRole;
  /** Optional role title (overrides default) */
  roleTitle?: string;
  /** Presence status */
  presence?: PresenceStatus;
  /** Bio or subtitle */
  bio?: string;
  /** Last seen (for offline status) */
  lastSeen?: string;
}

export interface MemberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Member data */
  member: MemberCardData;
  /** Size variant */
  size?: 'large' | 'medium' | 'compact';
  /** Show role badge */
  showRole?: boolean;
  /** Show presence indicator */
  showPresence?: boolean;
  /** Show bio/subtitle */
  showBio?: boolean;
  /** Click handler */
  onMemberClick?: (member: MemberCardData) => void;
  /** Custom role icon */
  renderRoleIcon?: (role: MemberRole) => React.ReactNode;
}

// Default role icons
const DefaultRoleIcon: React.FC<{ role: MemberRole; className?: string }> = ({
  role,
  className,
}) => {
  switch (role) {
    case 'leader':
      return (
        <svg
          className={cn('w-3 h-3', className)}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 1.5a1 1 0 0 1 .894.553l1.618 3.28 3.621.526a1 1 0 0 1 .554 1.706l-2.621 2.553.619 3.608a1 1 0 0 1-1.451 1.054L8 12.697l-3.234 1.7a1 1 0 0 1-1.45-1.054l.618-3.608-2.62-2.553a1 1 0 0 1 .553-1.706l3.622-.526 1.617-3.28A1 1 0 0 1 8 1.5z" />
        </svg>
      );
    case 'admin':
      return (
        <svg
          className={cn('w-3 h-3', className)}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M9.5 1.5a.5.5 0 0 1 .5.5v1h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2V2a.5.5 0 0 1 1 0v1h2V2a.5.5 0 0 1 .5-.5zM4 4a1 1 0 0 0-1 1v1h10V5a1 1 0 0 0-1-1H4zm9 4H3v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8z" />
        </svg>
      );
    case 'moderator':
      return (
        <svg
          className={cn('w-3 h-3', className)}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        </svg>
      );
    default:
      return null;
  }
};

// Avatar with fallback
const MemberAvatar: React.FC<{
  name: string;
  avatarUrl?: string;
  size: 'large' | 'medium' | 'compact';
}> = ({ name, avatarUrl, size }) => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const textSizes = {
    large: 'text-2xl',
    medium: 'text-sm',
    compact: 'text-xs',
  };

  if (avatarUrl) {
    return (
      <div className={cn(memberAvatarVariants({ size }))}>
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        memberAvatarVariants({ size }),
        'flex items-center justify-center'
      )}
    >
      <span className={cn('font-semibold text-white/60', textSizes[size])}>
        {initials}
      </span>
    </div>
  );
};

// Main component
const MemberCard = React.forwardRef<HTMLDivElement, MemberCardProps>(
  (
    {
      className,
      member,
      size = 'medium',
      showRole = true,
      showPresence = true,
      showBio = true,
      onMemberClick,
      renderRoleIcon,
      style,
      ...props
    },
    ref
  ) => {
    const roleColors = ROLE_COLORS[member.role];
    const interactive = !!onMemberClick;

    const handleClick = () => {
      if (interactive) {
        onMemberClick?.(member);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (interactive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onMemberClick?.(member);
      }
    };

    // Layout based on size
    if (size === 'large') {
      return (
        <div
          ref={ref}
          className={cn(memberCardContainerVariants({ size, interactive }), className)}
          style={{ ...glassCardSurface, ...style }}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          {...props}
        >
          <div className="flex items-start gap-4">
            {/* Avatar with presence */}
            <div className="relative">
              <MemberAvatar
                name={member.name}
                avatarUrl={member.avatarUrl}
                size={size}
              />
              {showPresence && member.presence && (
                <span
                  className={cn(presenceDotVariants({ size, status: member.presence }))}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {member.name}
              </h3>
              <p className="text-sm text-white/50 truncate">{member.handle}</p>

              {/* Role badge */}
              {showRole && (
                <div className="mt-2">
                  <span
                    className={cn(
                      roleBadgeVariants({ size }),
                      roleColors.bg,
                      roleColors.text,
                      roleColors.border
                    )}
                  >
                    {renderRoleIcon ? (
                      renderRoleIcon(member.role)
                    ) : (
                      <DefaultRoleIcon role={member.role} />
                    )}
                    {member.roleTitle ||
                      member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </div>
              )}

              {/* Bio */}
              {showBio && member.bio && (
                <p className="mt-3 text-sm text-white/60 line-clamp-2">
                  {member.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (size === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(memberCardContainerVariants({ size, interactive }), className)}
          style={{ ...glassCardSurface, ...style }}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          {...props}
        >
          <div className="flex items-center gap-2.5">
            {/* Avatar with presence */}
            <div className="relative">
              <MemberAvatar
                name={member.name}
                avatarUrl={member.avatarUrl}
                size={size}
              />
              {showPresence && member.presence && (
                <span
                  className={cn(presenceDotVariants({ size, status: member.presence }))}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-white truncate">
                  {member.name}
                </p>
                {showRole && member.role === 'leader' && (
                  <DefaultRoleIcon
                    role="leader"
                    className={cn('w-3 h-3 shrink-0', ROLE_COLORS.leader.text)}
                  />
                )}
              </div>
              <p className="text-xs text-white/50 truncate">{member.handle}</p>
            </div>
          </div>
        </div>
      );
    }

    // Medium (default)
    return (
      <div
        ref={ref}
        className={cn(memberCardContainerVariants({ size, interactive }), className)}
        style={{ ...glassCardSurface, ...style }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        <div className="flex items-center gap-3">
          {/* Avatar with presence */}
          <div className="relative">
            <MemberAvatar
              name={member.name}
              avatarUrl={member.avatarUrl}
              size={size}
            />
            {showPresence && member.presence && (
              <span
                className={cn(presenceDotVariants({ size, status: member.presence }))}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">
                {member.name}
              </p>
              {showRole && (
                <span
                  className={cn(
                    roleBadgeVariants({ size }),
                    roleColors.bg,
                    roleColors.text,
                    roleColors.border
                  )}
                >
                  {renderRoleIcon ? (
                    renderRoleIcon(member.role)
                  ) : (
                    <DefaultRoleIcon role={member.role} />
                  )}
                  {member.roleTitle ||
                    member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 truncate">{member.handle}</p>
          </div>
        </div>
      </div>
    );
  }
);

MemberCard.displayName = 'MemberCard';

// Member list component for convenience
export interface MemberListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Members to display */
  members: MemberCardData[];
  /** Card size */
  size?: 'large' | 'medium' | 'compact';
  /** Number of columns (for grid layout) */
  columns?: 1 | 2 | 3 | 4;
  /** Show role badges */
  showRole?: boolean;
  /** Show presence */
  showPresence?: boolean;
  /** Click handler */
  onMemberClick?: (member: MemberCardData) => void;
}

const MemberList = React.forwardRef<HTMLDivElement, MemberListProps>(
  (
    {
      className,
      members,
      size = 'medium',
      columns = 1,
      showRole = true,
      showPresence = true,
      onMemberClick,
      ...props
    },
    ref
  ) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    };

    return (
      <div
        ref={ref}
        className={cn('grid gap-3', gridCols[columns], className)}
        {...props}
      >
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            size={size}
            showRole={showRole}
            showPresence={showPresence}
            onMemberClick={onMemberClick}
          />
        ))}
      </div>
    );
  }
);

MemberList.displayName = 'MemberList';

export {
  MemberCard,
  MemberList,
  // Export variants
  memberCardContainerVariants,
  memberAvatarVariants,
  roleBadgeVariants,
  presenceDotVariants,
  // Export components
  MemberAvatar,
  DefaultRoleIcon,
  // Export constants
  ROLE_COLORS,
};
