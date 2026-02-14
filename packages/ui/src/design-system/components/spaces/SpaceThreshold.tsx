'use client';

/**
 * SpaceThreshold Component
 *
 * Entry gateway for non-members visiting a space.
 * Handles both public spaces (direct join) and private spaces (request to join).
 *
 * Features:
 * - Space preview (banner, icon, description)
 * - Public space: "Enter" button
 * - Private space: "Request to Join" button
 * - Pending request status display
 * - Rejected request display with cooldown
 *
 * @version 1.0.0 - Jan 2026
 */

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface SpaceThresholdProps {
  space: {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    bannerUrl?: string;
    category?: string;
    memberCount?: number;
    onlineCount?: number;
    isPrivate?: boolean;
  };
  /** Upcoming events preview */
  events?: Array<{
    id: string;
    title: string;
    date: string | Date;
  }>;
  /** Number of tools in the space */
  toolCount?: number;
  /** Join request state for private spaces */
  joinRequest?: {
    status: 'pending' | 'rejected' | null;
    createdAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    canRequestAgain?: boolean;
  };
  /** Loading state for join request check */
  isCheckingRequest?: boolean;
  /** Called when user wants to enter (public) or join (after approval) */
  onEnter: () => void;
  /** Called when user requests to join (private spaces) */
  onRequestJoin?: (message?: string) => Promise<void>;
  /** Called when user cancels pending request */
  onCancelRequest?: () => Promise<void>;
  /** Optional className */
  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function formatEventDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMemberCount(count?: number): string {
  if (!count) return '0 members';
  if (count === 1) return '1 member';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k members`;
  return `${count} members`;
}

// ============================================================
// Sub-components
// ============================================================

function SpaceIcon({ iconUrl, name }: { iconUrl?: string; name: string }) {
  const monogram = name?.charAt(0)?.toUpperCase() || 'S';

  return (
    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/[0.08] border border-white/[0.06] flex items-center justify-center">
      {iconUrl ? (
        <Image src={iconUrl} alt={name} width={80} height={80} className="object-cover" sizes="80px" />
      ) : (
        <span className="text-3xl font-bold text-white/60">{monogram}</span>
      )}
    </div>
  );
}

function EventsPreview({ events }: { events: SpaceThresholdProps['events'] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
        Upcoming Events
      </h4>
      <div className="space-y-1.5">
        {events.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]"
          >
            <div className="w-2 h-2 rounded-full bg-[var(--life-gold)]" />
            <span className="text-sm text-white/70 flex-1 truncate">{event.title}</span>
            <span className="text-xs text-white/40">{formatEventDate(event.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingRequestStatus({
  onCancel,
  isCancelling,
}: {
  onCancel: () => void;
  isCancelling: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[var(--life-gold)]/10 border border-[var(--life-gold)]/20">
        <motion.div
          className="w-3 h-3 rounded-full bg-[var(--life-gold)]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[var(--life-gold)] font-medium">Request Pending</span>
      </div>
      <p className="text-sm text-white/50 text-center">
        Your request to join has been sent. A space leader will review it soon.
      </p>
      <button
        onClick={onCancel}
        disabled={isCancelling}
        className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors disabled:opacity-50"
      >
        {isCancelling ? 'Cancelling...' : 'Cancel Request'}
      </button>
    </motion.div>
  );
}

function RejectedRequestStatus({
  reason,
  canRequestAgain,
  onRequestAgain,
}: {
  reason?: string;
  canRequestAgain?: boolean;
  onRequestAgain: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span className="text-red-400 font-medium">Request Declined</span>
      </div>
      {reason && (
        <p className="text-sm text-white/50 text-center px-4">
          &ldquo;{reason}&rdquo;
        </p>
      )}
      {canRequestAgain && (
        <button
          onClick={onRequestAgain}
          className="w-full py-3 rounded-xl bg-white/[0.06] text-white/70 hover:bg-white/[0.10] transition-colors"
        >
          Request Again
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceThreshold({
  space,
  events,
  toolCount,
  joinRequest,
  isCheckingRequest = false,
  onEnter,
  onRequestJoin,
  onCancelRequest,
  className,
}: SpaceThresholdProps) {
  const [isJoining, setIsJoining] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [showRequestForm, setShowRequestForm] = React.useState(false);
  const [requestMessage, setRequestMessage] = React.useState('');

  const isPrivate = space.isPrivate === true;
  const hasPendingRequest = joinRequest?.status === 'pending';
  const wasRejected = joinRequest?.status === 'rejected';

  // Handle enter (public) or join (private after approval)
  const handleEnter = async () => {
    setIsJoining(true);
    try {
      await onEnter();
    } finally {
      setIsJoining(false);
    }
  };

  // Handle request to join (private spaces)
  const handleRequestJoin = async () => {
    if (!onRequestJoin) return;

    setIsJoining(true);
    try {
      await onRequestJoin(requestMessage || undefined);
      setShowRequestForm(false);
      setRequestMessage('');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle cancel request
  const handleCancelRequest = async () => {
    if (!onCancelRequest) return;

    setIsCancelling(true);
    try {
      await onCancelRequest();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-[var(--bg-ground)] flex flex-col',
        className
      )}
    >
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden">
        {space.bannerUrl ? (
          <Image
            src={space.bannerUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-ground)] to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 -mt-12 max-w-lg mx-auto w-full">
        {/* Space Info */}
        <div className="flex flex-col items-center text-center space-y-4">
          <SpaceIcon iconUrl={space.iconUrl} name={space.name} />

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-white">{space.name}</h1>
              {isPrivate && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-xs text-white/50">
                  Private
                </span>
              )}
            </div>

            {space.description && (
              <p className="text-white/60 text-sm max-w-md">{space.description}</p>
            )}

            <div className="flex items-center justify-center gap-4 text-sm text-white/40">
              <span>{formatMemberCount(space.memberCount)}</span>
              {space.onlineCount && space.onlineCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {space.onlineCount} online
                </span>
              )}
              {toolCount && toolCount > 0 && (
                <span>{toolCount} tools</span>
              )}
            </div>
          </div>
        </div>

        {/* Events Preview */}
        {events && events.length > 0 && (
          <div className="mt-8">
            <EventsPreview events={events} />
          </div>
        )}

        {/* Action Area */}
        <div className="mt-8 mb-12">
          <AnimatePresence mode="wait">
            {/* Loading state */}
            {isCheckingRequest && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-4"
              >
                <motion.div
                  className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            )}

            {/* Pending request */}
            {!isCheckingRequest && hasPendingRequest && (
              <PendingRequestStatus
                key="pending"
                onCancel={handleCancelRequest}
                isCancelling={isCancelling}
              />
            )}

            {/* Rejected request */}
            {!isCheckingRequest && wasRejected && (
              <RejectedRequestStatus
                key="rejected"
                reason={joinRequest?.rejectionReason}
                canRequestAgain={joinRequest?.canRequestAgain}
                onRequestAgain={() => setShowRequestForm(true)}
              />
            )}

            {/* Request form (private space, no pending/rejected) */}
            {!isCheckingRequest && isPrivate && !hasPendingRequest && !wasRejected && showRequestForm && (
              <motion.div
                key="request-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell the leaders why you want to join (optional)"
                  maxLength={500}
                  rows={3}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-[var(--bg-elevated)] border border-white/[0.06]',
                    'text-white placeholder:text-white/40',
                    'focus:outline-none focus:ring-2 focus:ring-white/20',
                    'resize-none'
                  )}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.06] text-white/70 hover:bg-white/[0.10] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRequestJoin}
                    disabled={isJoining}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-medium transition-all',
                      'bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isJoining ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Default action buttons */}
            {!isCheckingRequest && !hasPendingRequest && !wasRejected && !showRequestForm && (
              <motion.div
                key="action"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {isPrivate ? (
                  <>
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className={cn(
                        'w-full py-4 rounded-xl font-semibold transition-all',
                        'bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90'
                      )}
                    >
                      Request to Join
                    </button>
                    <p className="text-xs text-white/40 text-center">
                      This space is private. A leader will review your request.
                    </p>
                  </>
                ) : (
                  <button
                    onClick={handleEnter}
                    disabled={isJoining}
                    className={cn(
                      'w-full py-4 rounded-xl font-semibold transition-all',
                      'bg-white text-black hover:bg-white/90',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isJoining ? 'Entering...' : 'Enter Space'}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default SpaceThreshold;
