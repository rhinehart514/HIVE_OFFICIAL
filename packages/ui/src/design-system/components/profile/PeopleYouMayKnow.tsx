'use client';

/**
 * PeopleYouMayKnow - User suggestion cards
 *
 * Displays a horizontal scrollable list of suggested users
 * with connect actions and contextual reasons.
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SuggestedUser {
  id: string;
  handle?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  major?: string;
}

export interface UserSuggestion {
  user: SuggestedUser;
  reason: string;
  context: {
    sharedSpaces: number;
    mutualConnections: number;
    sameMajor: boolean;
  };
}

export interface PeopleYouMayKnowProps {
  suggestions: UserSuggestion[];
  isLoading?: boolean;
  onConnect: (userId: string) => Promise<void>;
  onDismiss?: (userId: string) => void;
  onViewProfile: (userId: string, handle?: string) => void;
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  return first + last || '?';
}

// ============================================================================
// Sub-components
// ============================================================================

function SuggestionCard({
  suggestion,
  onConnect,
  onDismiss,
  onViewProfile,
}: {
  suggestion: UserSuggestion;
  onConnect: () => Promise<void>;
  onDismiss?: () => void;
  onViewProfile: () => void;
}) {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const { user, reason } = suggestion;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'HIVE User';
  const initials = getInitials(user.firstName, user.lastName);

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    try {
      await onConnect();
      setIsConnected(true);
    } catch {
      // Handle error silently or show toast
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (isDismissed) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.8 }}
        className="w-[180px] h-[200px]"
      />
    );
  }

  return (
    <motion.div
      className={cn(
        'relative w-[180px] flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer',
        'transition-all duration-200'
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
      onClick={onViewProfile}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className={cn(
            'absolute top-2 right-2 z-10 w-6 h-6 rounded-full',
            'flex items-center justify-center',
            'bg-black/40 hover:bg-black/60 transition-colors'
          )}
          aria-label="Dismiss suggestion"
        >
          <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="p-4 flex flex-col items-center text-center">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-xl overflow-hidden mb-3"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          {user.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span
                className="text-xl font-semibold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <h4
          className="text-sm font-medium truncate w-full"
          style={{ color: 'var(--text-primary)' }}
        >
          {fullName}
        </h4>

        {/* Handle */}
        {user.handle && (
          <p
            className="text-xs truncate w-full mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            @{user.handle}
          </p>
        )}

        {/* Reason */}
        <p
          className="text-xs mt-2 line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {reason}
        </p>

        {/* Connect Button */}
        <motion.button
          onClick={handleConnect}
          disabled={isConnecting || isConnected}
          className={cn(
            'mt-3 w-full py-2 rounded-lg text-xs font-medium',
            'transition-colors',
            isConnected
              ? 'bg-green-500/20 text-green-400 cursor-default'
              : 'bg-white/10 hover:bg-white/15 text-white'
          )}
          whileTap={!isConnected ? { scale: 0.98 } : undefined}
        >
          {isConnecting ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isConnected ? (
            'Request Sent'
          ) : (
            'Connect'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[180px] h-[200px] flex-shrink-0 rounded-2xl animate-pulse"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PeopleYouMayKnow({
  suggestions,
  isLoading = false,
  onConnect,
  onDismiss,
  onViewProfile,
  className,
}: PeopleYouMayKnowProps) {
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());

  const handleDismiss = React.useCallback((userId: string) => {
    setDismissedIds(prev => new Set([...prev, userId]));
    onDismiss?.(userId);
  }, [onDismiss]);

  const visibleSuggestions = suggestions.filter(s => !dismissedIds.has(s.user.id));

  if (isLoading) {
    return (
      <div className={cn('', className)}>
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: 'var(--text-tertiary)' }}
        >
          People you may know
        </h3>
        <LoadingSkeleton />
      </div>
    );
  }

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('', className)}>
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        People you may know
      </h3>

      <div className="relative">
        {/* Scroll container */}
        <div
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <AnimatePresence mode="popLayout">
            {visibleSuggestions.map((suggestion) => (
              <motion.div
                key={suggestion.user.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <SuggestionCard
                  suggestion={suggestion}
                  onConnect={() => onConnect(suggestion.user.id)}
                  onDismiss={onDismiss ? () => handleDismiss(suggestion.user.id) : undefined}
                  onViewProfile={() => onViewProfile(suggestion.user.id, suggestion.user.handle)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Fade edges */}
        <div
          className="absolute right-0 top-0 bottom-2 w-12 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, var(--bg-base), transparent)',
          }}
        />
      </div>
    </div>
  );
}

export default PeopleYouMayKnow;
