'use client';

/**
 * ReportContentModal - User content reporting interface
 *
 * Allows users to report inappropriate content (messages, profiles, posts, etc.)
 * Integrates with /api/content/reports endpoint.
 */

import * as React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
} from '../../primitives/Modal';
import { Button } from '../../primitives/Button';
import { Textarea } from '../../primitives/Textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../primitives/Select';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export type ReportContentType =
  | 'post'
  | 'comment'
  | 'message'
  | 'tool'
  | 'space'
  | 'profile'
  | 'event';

export type ReportCategory =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'misinformation'
  | 'copyright'
  | 'privacy_violation'
  | 'violence'
  | 'self_harm'
  | 'impersonation'
  | 'other';

export interface ReportContentInput {
  contentId: string;
  contentType: ReportContentType;
  category: ReportCategory;
  description: string;
  spaceId?: string;
}

export interface ReportContentModalProps {
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when modal open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Content being reported */
  contentId: string;
  /** Type of content */
  contentType: ReportContentType;
  /** Optional space context */
  spaceId?: string;
  /** Submit handler - returns promise for loading state */
  onSubmit?: (data: ReportContentInput) => Promise<void>;
  /** Display name of content author (optional, for context) */
  authorName?: string;
  /** Preview of content being reported (optional) */
  contentPreview?: string;
}

// ============================================================================
// Constants
// ============================================================================

const REPORT_CATEGORIES: { value: ReportCategory; label: string; description: string }[] = [
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or targeted attacks' },
  { value: 'spam', label: 'Spam', description: 'Unsolicited promotional content' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Attacks based on identity' },
  { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'NSFW or offensive material' },
  { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
  { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { value: 'privacy_violation', label: 'Privacy Violation', description: 'Sharing private information' },
  { value: 'violence', label: 'Violence', description: 'Threats or promotion of violence' },
  { value: 'self_harm', label: 'Self Harm', description: 'Content promoting self-harm' },
  { value: 'copyright', label: 'Copyright', description: 'Unauthorized use of copyrighted material' },
  { value: 'other', label: 'Other', description: 'Something else not listed above' },
];

const CONTENT_TYPE_LABELS: Record<ReportContentType, string> = {
  post: 'post',
  comment: 'comment',
  message: 'message',
  tool: 'tool',
  space: 'space',
  profile: 'profile',
  event: 'event',
};

// ============================================================================
// Component
// ============================================================================

export function ReportContentModal({
  open = false,
  onOpenChange,
  contentId,
  contentType,
  spaceId,
  onSubmit,
  authorName,
  contentPreview,
}: ReportContentModalProps) {
  const [category, setCategory] = React.useState<ReportCategory | ''>('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const isValid = category !== '' && description.length >= 10;

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        // Reset state on close
        setCategory('');
        setDescription('');
        setError(null);
        setSuccess(false);
      }
      onOpenChange?.(isOpen);
    },
    [onOpenChange]
  );

  const handleSubmit = async () => {
    if (!isValid || !category) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit?.({
        contentId,
        contentType,
        category,
        description,
        spaceId,
      });
      setSuccess(true);
      // Auto-close after success
      setTimeout(() => handleOpenChange(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Modal open={open} onOpenChange={handleOpenChange}>
        <ModalContent className="max-w-md" data-testid="report-modal">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth={2}
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <Text size="lg" weight="medium" className="mb-2">
              Report submitted
            </Text>
            <Text size="sm" tone="muted">
              Our moderation team will review it shortly.
            </Text>
          </div>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-md" data-testid="report-modal">
        <ModalHeader>
          <ModalTitle>Report {CONTENT_TYPE_LABELS[contentType]}</ModalTitle>
          <ModalDescription>
            Help us understand what&apos;s wrong with this content
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Content preview */}
          {(authorName || contentPreview) && (
            <div
              className={cn(
                'p-3 rounded-lg',
                'bg-white/[0.02] border border-white/[0.06]'
              )}
            >
              {authorName && (
                <Text size="xs" tone="muted" className="mb-1">
                  Content by {authorName}
                </Text>
              )}
              {contentPreview && (
                <Text size="sm" className="line-clamp-2">
                  {contentPreview}
                </Text>
              )}
            </div>
          )}

          {/* Category selection */}
          <div className="space-y-2">
            <Text size="sm" weight="medium">
              What&apos;s the issue?
            </Text>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as ReportCategory)}
            >
              <SelectTrigger data-testid="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category && (
              <Text size="xs" tone="muted">
                {REPORT_CATEGORIES.find((c) => c.value === category)?.description}
              </Text>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Text size="sm" weight="medium">
              Tell us more
            </Text>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about why you're reporting this content (minimum 10 characters)"
              rows={4}
              maxLength={1000}
              data-testid="report-description"
            />
            <Text size="xs" tone="muted" className="text-right">
              {description.length}/1000
            </Text>
          </div>

          {/* Error */}
          {error && (
            <div
              className={cn(
                'p-3 rounded-lg',
                'bg-red-500/10 border border-red-500/20'
              )}
            >
              <Text size="sm" className="text-red-400">
                {error}
              </Text>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            data-testid="submit-report"
          >
            Submit Report
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

ReportContentModal.displayName = 'ReportContentModal';

export default ReportContentModal;
