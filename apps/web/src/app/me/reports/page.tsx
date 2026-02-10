'use client';

/**
 * /me/reports — User's Submitted Reports
 *
 * Shows a list of content reports submitted by the user
 * with their current status and resolution.
 *
 * @version 1.0.0 - User-Facing Moderation (Feb 2026)
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, EmptyState } from '@hive/ui';
import { Text, Button } from '@hive/ui/design-system/primitives';
import { Flag, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

interface Report {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'message' | 'tool' | 'space' | 'profile' | 'event';
  category: string;
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  resolution?: 'content_removed' | 'user_warned' | 'user_banned' | 'no_violation' | 'false_positive';
  createdAt: string;
  resolvedAt?: string;
  moderatorNotes?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-500/10 text-green-400 border-green-500/20',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  dismissed: {
    label: 'Dismissed',
    color: 'bg-white/[0.06] text-white/50 border-white/[0.06]',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  inappropriate_content: 'Inappropriate Content',
  misinformation: 'Misinformation',
  copyright: 'Copyright',
  privacy_violation: 'Privacy Violation',
  violence: 'Violence',
  self_harm: 'Self Harm',
  impersonation: 'Impersonation',
  other: 'Other',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  comment: 'Comment',
  message: 'Message',
  tool: 'Tool',
  space: 'Space',
  profile: 'Profile',
  event: 'Event',
};

const RESOLUTION_LABELS: Record<string, string> = {
  content_removed: 'Content was removed',
  user_warned: 'User was warned',
  user_banned: 'User was banned',
  no_violation: 'No violation found',
  false_positive: 'Report was a false positive',
};

// ============================================================================
// Utilities
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================================================
// Components
// ============================================================================

function ReportCard({ report }: { report: Report }) {
  const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card elevation="resting" className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <Flag className="w-5 h-5 text-white/50" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <Text size="sm" weight="medium" className="text-white">
                  {CONTENT_TYPE_LABELS[report.contentType] || report.contentType} Report
                </Text>
                <Text size="xs" tone="muted" className="mt-0.5">
                  {CATEGORY_LABELS[report.category] || report.category}
                </Text>
              </div>

              {/* Status badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </div>
            </div>

            {/* Description */}
            <Text size="sm" tone="muted" className="line-clamp-2 mb-3">
              {report.description}
            </Text>

            {/* Resolution (if resolved) */}
            {report.status === 'resolved' && report.resolution && (
              <div
                className="px-3 py-2 rounded-lg mb-3"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)' }}
              >
                <Text size="xs" className="text-green-400">
                  {RESOLUTION_LABELS[report.resolution] || report.resolution}
                </Text>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span>Submitted {formatDate(report.createdAt)}</span>
              {report.resolvedAt && (
                <>
                  <span>·</span>
                  <span>Resolved {formatDate(report.resolvedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/content/reports?limit=50', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      logger.error('Failed to fetch reports', { component: 'ReportsPage' }, err instanceof Error ? err : undefined);
      setError('Couldn\'t load your reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white/50  mx-auto mb-4" />
          <Text size="sm" tone="muted">Loading your reports...</Text>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-6">
        <EmptyState
          title="Couldn't load reports"
          description={error}
          action={<Button onClick={fetchReports}>Try Again</Button>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 md:py-10">
        {/* Header */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            className="text-heading-sm md:text-heading font-semibold text-white mb-1"
            style={{ letterSpacing: '-0.02em' }}
          >
            Your Reports
          </h1>
          <p className="text-base text-white/50">
            Track the status of content you&apos;ve reported
          </p>
        </motion.section>

        {/* Reports list */}
        {reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <EmptyState
              title="No reports yet"
              description="When you report content that violates our guidelines, you'll see the status here"
            />
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.1 + index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <ReportCard report={report} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Info footer */}
        <motion.div
          className="mt-8 p-4 rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <Text size="xs" tone="muted">
            Reports are typically reviewed within 2-24 hours. For urgent safety concerns,
            contact your campus administrators directly.
          </Text>
        </motion.div>
      </div>
    </div>
  );
}
