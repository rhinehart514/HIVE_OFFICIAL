'use client';

/**
 * ProfileIdentityHero - Zone 1: The hero identity card
 *
 * - 80px avatar, rounded-lg (8px), NEVER circle
 * - Clash Display 32px for name
 * - No glass, no heavy shadows, no decorative animations
 *
 * @version 2.0.0 - Desktop rebuild, design rules compliant
 */

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Flag } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge, type BadgeVariant } from '../../primitives/Badge';
import { ConnectButton, type ConnectionState } from './ConnectButton';

export interface ProfileBadge {
  id: string;
  type: string;
  name: string;
  description: string;
  displayOrder?: number;
}

const BADGE_CONFIG: Record<string, { icon: string; variant: BadgeVariant }> = {
  builder: { icon: '\u{1F6E0}\u{FE0F}', variant: 'neutral' },
  student_leader: { icon: '\u{1F451}', variant: 'neutral' },
  contributor: { icon: '\u2B50', variant: 'neutral' },
  early_adopter: { icon: '\u{1F680}', variant: 'gold' },
  founding_leader: { icon: '\u{1F6E1}\u{FE0F}', variant: 'gold' },
  founding_member: { icon: '\u{1F48E}', variant: 'gold' },
  verified_leader: { icon: '\u2713', variant: 'neutral' },
};

const MAX_DISPLAYED_BADGES = 5;

export interface ProfileIdentityHeroUser {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  classYear?: string;
  major?: string;
  campusName?: string;
}

export interface ProfileIdentityHeroProps {
  user: ProfileIdentityHeroUser;
  isOwnProfile: boolean;
  isOnline?: boolean;
  profileIncomplete?: boolean;
  badges?: ProfileBadge[];
  connectionState?: ConnectionState;
  pendingRequestId?: string | null;
  isConnectionLoading?: boolean;
  showConnectButton?: boolean;
  showMessageButton?: boolean;
  onEdit?: () => void;
  onConnect?: () => Promise<void>;
  onAcceptRequest?: (requestId: string) => Promise<void>;
  onRejectRequest?: (requestId: string) => Promise<void>;
  onUnfriend?: () => Promise<void>;
  onMessage?: () => void;
  onReport?: () => void;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileIdentityHero({
  user,
  isOwnProfile,
  isOnline = false,
  profileIncomplete = false,
  badges,
  connectionState = 'none',
  pendingRequestId,
  isConnectionLoading = false,
  showConnectButton = true,
  showMessageButton = true,
  onEdit,
  onConnect,
  onAcceptRequest,
  onRejectRequest,
  onUnfriend,
  onMessage,
  onReport,
  className,
}: ProfileIdentityHeroProps) {
  const initials = getInitials(user.fullName);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  const credentials: string[] = [];
  if (user.major) credentials.push(user.major);
  if (user.classYear) credentials.push(`'${user.classYear.slice(-2)}`);
  if (user.campusName) credentials.push(user.campusName);
  const credentialsText = credentials.join(' · ');

  const displayBadges = React.useMemo(() => {
    if (!badges || badges.length === 0) return [];
    return [...badges]
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
      .slice(0, MAX_DISPLAYED_BADGES);
  }, [badges]);

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className="relative overflow-hidden p-6 rounded-3xl border border-[var(--border-default)]"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Avatar - 80px, rounded-lg (8px), NEVER circle */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 overflow-hidden flex items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-100',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <span
                  className="text-2xl font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {initials}
                </span>
              )}
            </div>

            {/* Online indicator — gold dot */}
            {isOnline && (
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full"
                style={{
                  backgroundColor: 'var(--life-gold)',
                  border: '2px solid var(--bg-surface)',
                }}
              />
            )}
          </div>

          {/* Identity Info */}
          <div className="flex-1 min-w-0">
            {/* Name — Clash Display 32px */}
            <h1
              className="text-[32px] font-semibold leading-tight font-[var(--font-clash)]"
              style={{ color: 'var(--text-primary)' }}
            >
              {user.fullName}
            </h1>

            <p
              className="text-base font-normal mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              @{user.handle}
            </p>

            {credentialsText && (
              <p
                className="text-sm font-normal mt-1"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {credentialsText}
              </p>
            )}

            {user.bio && (
              <p
                className="text-base font-normal mt-4 line-clamp-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user.bio}
              </p>
            )}

            {isOwnProfile && profileIncomplete && !user.bio && (
              <div
                className="mt-4 px-4 py-3 rounded-xl"
                style={{
                  border: '1px dashed var(--border-default)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Add a bio to help others know who you are →
                </p>
              </div>
            )}

            {displayBadges.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {displayBadges.map((badge) => {
                  const config = BADGE_CONFIG[badge.type];
                  return (
                    <Badge
                      key={badge.id}
                      variant={config?.variant ?? 'neutral'}
                      size="sm"
                      title={`${badge.name} — ${badge.description}`}
                    >
                      <span className="mr-0.5">{config?.icon ?? '\u2726'}</span>
                      {badge.name}
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              {isOwnProfile ? (
                <button
                  onClick={onEdit}
                  className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-100 border border-white/[0.12] hover:bg-white/[0.12]"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  {showConnectButton && (
                    <>
                      {!isConnectionLoading && onConnect && (
                        <ConnectButton
                          targetUserId={user.id}
                          connectionState={connectionState}
                          pendingRequestId={pendingRequestId ?? undefined}
                          onConnect={onConnect}
                          onAccept={onAcceptRequest}
                          onReject={onRejectRequest}
                          onUnfriend={onUnfriend}
                        />
                      )}
                      {isConnectionLoading && (
                        <div
                          className="px-5 py-2.5 rounded-full text-sm font-medium animate-pulse"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            width: 100,
                            height: 40,
                          }}
                        />
                      )}
                    </>
                  )}

                  {showMessageButton && (
                    <button
                      onClick={onMessage}
                      className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-100 border border-[var(--border-default)] hover:bg-white/[0.06]"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Message
                    </button>
                  )}

                  {onReport && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="p-2.5 rounded-full transition-colors duration-100 hover:bg-white/[0.06]"
                        style={{ color: 'var(--text-tertiary)' }}
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {showMoreMenu && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowMoreMenu(false)}
                            />
                            <div
                              className={cn(
                                'absolute right-0 top-full mt-2 z-20',
                                'bg-[#1a1a1b] border border-white/[0.06] rounded-xl shadow-lg',
                                'py-1 min-w-[140px]'
                              )}
                            >
                              <button
                                onClick={() => {
                                  onReport();
                                  setShowMoreMenu(false);
                                }}
                                className={cn(
                                  'w-full px-4 py-2 text-left text-sm',
                                  'text-white/50 hover:text-white hover:bg-white/[0.06]',
                                  'flex items-center gap-2'
                                )}
                                data-testid="report-profile-button"
                              >
                                <Flag className="w-4 h-4" />
                                Report Profile
                              </button>
                            </div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileIdentityHeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-full', className)}>
      <div
        className="relative overflow-hidden p-6 animate-pulse rounded-3xl border border-[var(--border-default)]"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8">
          <div className="flex-shrink-0">
            <div
              className="w-20 h-20 rounded-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="h-8 w-48 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div className="h-4 w-32 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-40 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <div className="space-y-2 mt-4">
              <div className="h-4 w-full rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div className="h-10 w-28 rounded-full mt-6" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileIdentityHero;
