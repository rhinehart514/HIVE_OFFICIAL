'use client';

/**
 * ConnectButton - Friend request button with state machine
 *
 * States:
 * - none: "Connect" → sends friend request
 * - pending_outgoing: "Request Sent" → disabled
 * - pending_incoming: "Accept" / "Decline" → respond to request
 * - friends: "Friends" → shows friendship status
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, UserMinus, UserPlus, X, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export type ConnectionState = 'none' | 'pending_outgoing' | 'pending_incoming' | 'friends';

export interface ConnectButtonProps {
  targetUserId: string;
  connectionState: ConnectionState;
  pendingRequestId?: string;
  onConnect: () => Promise<void>;
  onAccept?: (requestId: string) => Promise<void>;
  onReject?: (requestId: string) => Promise<void>;
  onUnfriend?: () => Promise<void>;
  className?: string;
}

type LoadingAction = 'connect' | 'accept' | 'reject' | 'unfriend' | null;

// ============================================================================
// Component
// ============================================================================

export function ConnectButton({
  targetUserId,
  connectionState,
  pendingRequestId,
  onConnect,
  onAccept,
  onReject,
  onUnfriend,
  className,
}: ConnectButtonProps) {
  const [loading, setLoading] = React.useState<LoadingAction>(null);
  const [showUnfriend, setShowUnfriend] = React.useState(false);

  const handleAction = React.useCallback(
    async (action: LoadingAction, handler: () => Promise<void>) => {
      if (loading) return;
      setLoading(action);
      try {
        await handler();
      } finally {
        setLoading(null);
      }
    },
    [loading]
  );

  const handleConnect = () => handleAction('connect', onConnect);

  const handleAccept = () => {
    if (pendingRequestId && onAccept) {
      handleAction('accept', () => onAccept(pendingRequestId));
    }
  };

  const handleReject = () => {
    if (pendingRequestId && onReject) {
      handleAction('reject', () => onReject(pendingRequestId));
    }
  };

  const handleUnfriend = () => {
    if (onUnfriend) {
      handleAction('unfriend', onUnfriend);
      setShowUnfriend(false);
    }
  };

  // Render based on state
  switch (connectionState) {
    case 'none':
      return (
        <motion.button
          onClick={handleConnect}
          disabled={loading === 'connect'}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all',
            'disabled:opacity-70',
            className
          )}
          style={{
            backgroundColor: 'rgba(255,215,0,0.1)',
            color: 'var(--life-gold)',
            border: '1px solid rgba(255,215,0,0.4)',
            boxShadow: '0 0 20px rgba(255,215,0,0.15)',
          }}
          whileHover={
            loading
              ? undefined
              : {
                  backgroundColor: 'rgba(255,215,0,0.15)',
                  boxShadow: '0 0 30px rgba(255,215,0,0.25)',
                }
          }
          whileTap={loading ? undefined : { opacity: 0.8 }}
        >
          <AnimatePresence mode="wait">
            {loading === 'connect' ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </motion.span>
            ) : (
              <motion.span
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <UserPlus className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
          Connect
        </motion.button>
      );

    case 'pending_outgoing':
      return (
        <motion.button
          disabled
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium cursor-default',
            className
          )}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Clock className="w-4 h-4" />
          Request Sent
        </motion.button>
      );

    case 'pending_incoming':
      return (
        <div className={cn('inline-flex items-center gap-2', className)}>
          {/* Accept button */}
          <motion.button
            onClick={handleAccept}
            disabled={loading === 'accept' || loading === 'reject'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-70"
            style={{
              backgroundColor: 'rgba(255,215,0,0.1)',
              color: 'var(--life-gold)',
              border: '1px solid rgba(255,215,0,0.4)',
              boxShadow: '0 0 20px rgba(255,215,0,0.15)',
            }}
            whileHover={
              loading
                ? undefined
                : {
                    backgroundColor: 'rgba(255,215,0,0.15)',
                    boxShadow: '0 0 30px rgba(255,215,0,0.25)',
                  }
            }
            whileTap={loading ? undefined : { opacity: 0.8 }}
          >
            <AnimatePresence mode="wait">
              {loading === 'accept' ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </motion.span>
              ) : (
                <motion.span
                  key="icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Check className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
            Accept
          </motion.button>

          {/* Decline button */}
          <motion.button
            onClick={handleReject}
            disabled={loading === 'accept' || loading === 'reject'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-all disabled:opacity-70"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-default)',
            }}
            whileHover={
              loading
                ? undefined
                : {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-secondary)',
                  }
            }
            whileTap={loading ? undefined : { opacity: 0.8 }}
          >
            <AnimatePresence mode="wait">
              {loading === 'reject' ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </motion.span>
              ) : (
                <motion.span
                  key="icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <X className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
            <span className="sr-only">Decline</span>
          </motion.button>
        </div>
      );

    case 'friends':
      return (
        <div className="relative">
          <motion.button
            onClick={() => setShowUnfriend(!showUnfriend)}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all',
              className
            )}
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
            <Check className="w-4 h-4" style={{ color: 'var(--life-gold)' }} />
            Friends
          </motion.button>

          {/* Unfriend dropdown */}
          <AnimatePresence>
            {showUnfriend && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUnfriend(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 right-0 z-50 min-w-[140px]"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  <button
                    onClick={handleUnfriend}
                    disabled={loading === 'unfriend'}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.06] rounded-xl disabled:opacity-70"
                    style={{ color: '#ef4444' }}
                  >
                    {loading === 'unfriend' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserMinus className="w-4 h-4" />
                    )}
                    Unfriend
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      );

    default:
      return null;
  }
}

ConnectButton.displayName = 'ConnectButton';

export default ConnectButton;
