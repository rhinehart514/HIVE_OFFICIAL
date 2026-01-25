'use client';

/**
 * JoinRequestsPanel Component
 *
 * Panel for space leaders to manage join requests.
 * Shows pending requests with user info and approve/reject actions.
 *
 * @version 1.0.0 - Jan 2026
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface JoinRequestUser {
  id: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string;
}

export interface JoinRequestItem {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  user: JoinRequestUser | null;
}

export interface JoinRequestsPanelProps {
  requests: JoinRequestItem[];
  isLoading?: boolean;
  isActing?: boolean;
  error?: string | null;
  statusFilter: 'pending' | 'approved' | 'rejected' | 'all';
  onFilterChange: (status: 'pending' | 'approved' | 'rejected' | 'all') => void;
  onApprove: (requestId: string) => Promise<boolean>;
  onReject: (requestId: string, reason?: string) => Promise<boolean>;
  onRefresh?: () => void;
  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================
// Sub-components
// ============================================================

function UserAvatar({ user }: { user: JoinRequestUser | null }) {
  const monogram = user?.displayName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/[0.08] flex items-center justify-center flex-shrink-0">
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-medium text-white/60">{monogram}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const styles = {
    pending: 'bg-[var(--life-gold)]/10 text-[var(--life-gold)] border-[var(--life-gold)]/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', styles[status])}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RequestCard({
  request,
  isActing,
  onApprove,
  onReject,
}: {
  request: JoinRequestItem;
  isActing: boolean;
  onApprove: () => void;
  onReject: (reason?: string) => void;
}) {
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const isPending = request.status === 'pending';

  const handleReject = () => {
    onReject(rejectReason || undefined);
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-white/[0.06]"
    >
      <div className="flex items-start gap-3">
        <UserAvatar user={request.user} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-white truncate">
                {request.user?.displayName || 'Unknown User'}
              </span>
              {request.user?.handle && (
                <span className="text-white/40 text-sm truncate">@{request.user.handle}</span>
              )}
            </div>
            {!isPending && <StatusBadge status={request.status} />}
          </div>

          {request.message && (
            <p className="text-sm text-white/60 mt-1 line-clamp-2">{request.message}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-white/40">{formatRelativeTime(request.createdAt)}</span>
            {request.rejectionReason && (
              <span className="text-xs text-red-400/70 truncate">
                Reason: {request.rejectionReason}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions for pending requests */}
      {isPending && (
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={onApprove}
            disabled={isActing}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-green-500/10 text-green-400 border border-green-500/20',
              'hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isActing ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isActing}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-red-500/10 text-red-400 border border-red-500/20',
              'hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Reject
          </button>
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl bg-[var(--bg-elevated)] border border-white/[0.08]"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Reject Request</h3>
              <p className="text-sm text-white/60 mb-4">
                You can optionally provide a reason for rejecting this request. The user will see
                this reason.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Optional rejection reason..."
                maxLength={500}
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-xl mb-4',
                  'bg-[var(--bg-ground)] border border-white/[0.08]',
                  'text-white placeholder:text-white/40',
                  'focus:outline-none focus:ring-2 focus:ring-white/20',
                  'resize-none'
                )}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/70 hover:bg-white/[0.10] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isActing}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl font-medium transition-colors',
                    'bg-red-500 text-white hover:bg-red-600',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isActing ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Filter Tabs
// ============================================================

function FilterTabs({
  currentFilter,
  onChange,
  counts,
}: {
  currentFilter: 'pending' | 'approved' | 'rejected' | 'all';
  onChange: (status: 'pending' | 'approved' | 'rejected' | 'all') => void;
  counts?: { pending?: number };
}) {
  const filters: Array<{ value: 'pending' | 'approved' | 'rejected' | 'all'; label: string }> = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04]">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm transition-colors relative',
            currentFilter === filter.value
              ? 'bg-white/[0.10] text-white font-medium'
              : 'text-white/50 hover:text-white/70'
          )}
        >
          {filter.label}
          {filter.value === 'pending' && counts?.pending && counts.pending > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--life-gold)] text-black text-label-xs font-bold flex items-center justify-center">
              {counts.pending > 9 ? '9+' : counts.pending}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function JoinRequestsPanel({
  requests,
  isLoading = false,
  isActing = false,
  error,
  statusFilter,
  onFilterChange,
  onApprove,
  onReject,
  onRefresh,
  className,
}: JoinRequestsPanelProps) {
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Join Requests</h2>
          <p className="text-sm text-white/50">Manage who can join your space</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <FilterTabs
          currentFilter={statusFilter}
          onChange={onFilterChange}
          counts={{ pending: pendingCount }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 space-y-3">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-white/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/[0.06] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-white/50">
              {statusFilter === 'pending'
                ? 'No pending requests'
                : statusFilter === 'approved'
                ? 'No approved requests'
                : statusFilter === 'rejected'
                ? 'No rejected requests'
                : 'No join requests'}
            </p>
          </div>
        ) : (
          // Request list
          <AnimatePresence mode="popLayout">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isActing={isActing}
                onApprove={() => onApprove(request.id)}
                onReject={(reason) => onReject(request.id, reason)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default JoinRequestsPanel;
