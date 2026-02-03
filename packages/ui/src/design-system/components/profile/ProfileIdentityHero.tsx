'use client';

/**
 * ProfileIdentityHero - Zone 1: The hero identity card
 *
 * Design Philosophy:
 * - Identity as PRIMARY — who they are at a glance
 * - 80px avatar, rounded-lg (8px), NEVER circle
 * - Name, handle, credentials (major · year · school)
 * - Bio (2-3 lines max)
 * - Connect + Message buttons (or Edit Profile for own profile)
 *
 * @version 1.0.0 - 3-Zone Profile Layout
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Flag } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ConnectButton, type ConnectionState } from './ConnectButton';

// ============================================================================
// Types
// ============================================================================

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
  /** Connection state with this user (ignored for own profile) */
  connectionState?: ConnectionState;
  /** Request ID for pending friend requests */
  pendingRequestId?: string | null;
  /** Whether connection state is still loading */
  isConnectionLoading?: boolean;
  /** Whether to show the Connect button (feature flag controlled) */
  showConnectButton?: boolean;
  /** Whether to show the Message button (feature flag controlled) */
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

// ============================================================================
// Utilities
// ============================================================================

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================================================
// Component
// ============================================================================

export function ProfileIdentityHero({
  user,
  isOwnProfile,
  isOnline = false,
  profileIncomplete = false,
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

  // Build credentials string
  const credentials: string[] = [];
  if (user.major) credentials.push(user.major);
  if (user.classYear) credentials.push(`'${user.classYear.slice(-2)}`);
  if (user.campusName) credentials.push(user.campusName);
  const credentialsText = credentials.join(' · ');

  return (
    <motion.div
      className={cn('relative w-full', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Card Container */}
      <div
        className="relative overflow-hidden p-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* Subtle glass overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
            borderRadius: '24px',
          }}
        />

        <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Avatar - 80px, rounded-lg (8px), NEVER circle */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 overflow-hidden flex items-center justify-center"
              style={{
                borderRadius: '8px',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              {user.avatarUrl ? (
                <motion.img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0 }}
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

            {/* Online indicator */}
            {isOnline && (
              <motion.div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full"
                style={{
                  backgroundColor: 'var(--life-gold)',
                  border: '2px solid var(--bg-surface)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
              />
            )}
          </div>

          {/* Identity Info */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h1
              className="text-[28px] font-semibold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {user.fullName}
            </h1>

            {/* Handle */}
            <p
              className="text-base font-normal mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              @{user.handle}
            </p>

            {/* Credentials */}
            {credentialsText && (
              <p
                className="text-sm font-normal mt-1"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {credentialsText}
              </p>
            )}

            {/* Bio */}
            {user.bio && (
              <p
                className="text-base font-normal mt-4 line-clamp-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user.bio}
              </p>
            )}

            {/* Profile incomplete prompt (own profile only) */}
            {isOwnProfile && profileIncomplete && !user.bio && (
              <div
                className="mt-4 px-4 py-3"
                style={{
                  border: '1px dashed var(--border-default)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Add a bio to help others know who you are →
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              {isOwnProfile ? (
                <motion.button
                  onClick={onEdit}
                  className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                  }}
                  whileTap={{ opacity: 0.8 }}
                >
                  Edit Profile
                </motion.button>
              ) : (
                <>
                  {/* Connect Button - controlled by feature flag */}
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

                  {/* Message - Secondary action, controlled by feature flag */}
                  {showMessageButton && (
                    <motion.button
                      onClick={onMessage}
                      className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }}
                      whileHover={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                      }}
                      whileTap={{ opacity: 0.8 }}
                    >
                      Message
                    </motion.button>
                  )}

                  {/* More options (Report) */}
                  {onReport && (
                    <div className="relative">
                      <motion.button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="p-2.5 rounded-full transition-colors"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--text-tertiary)',
                        }}
                        whileHover={{
                          backgroundColor: 'rgba(255,255,255,0.06)',
                        }}
                        whileTap={{ opacity: 0.8 }}
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </motion.button>

                      <AnimatePresence>
                        {showMoreMenu && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowMoreMenu(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className={cn(
                                'absolute right-0 top-full mt-2 z-20',
                                'bg-[#1a1a1b] border border-white/[0.08] rounded-xl shadow-lg',
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
                                  'text-white/60 hover:text-white hover:bg-white/[0.06]',
                                  'flex items-center gap-2'
                                )}
                                data-testid="report-profile-button"
                              >
                                <Flag className="w-4 h-4" />
                                Report Profile
                              </button>
                            </motion.div>
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
    </motion.div>
  );
}

// ============================================================================
// Skeleton Component
// ============================================================================

export function ProfileIdentityHeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-full', className)}>
      <div
        className="relative overflow-hidden p-8 animate-pulse"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}
      >
        <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Avatar skeleton */}
          <div className="flex-shrink-0">
            <div
              className="w-20 h-20"
              style={{
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* Identity info skeleton */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name */}
            <div
              className="h-7 w-48 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            />
            {/* Handle */}
            <div
              className="h-4 w-32 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            />
            {/* Credentials */}
            <div
              className="h-3 w-40 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            />
            {/* Bio */}
            <div className="space-y-2 mt-4">
              <div
                className="h-4 w-full rounded"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
              <div
                className="h-4 w-3/4 rounded"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
            </div>
            {/* Button */}
            <div
              className="h-10 w-28 rounded-full mt-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileIdentityHero;
