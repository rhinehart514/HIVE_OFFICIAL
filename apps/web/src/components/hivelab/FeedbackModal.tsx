'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  MOTION,
  useToast,
} from '@hive/ui';
import { Star, AlertTriangle } from 'lucide-react';

type FeedbackVariant = 'review' | 'report';

interface FeedbackModalProps {
  toolId: string;
  toolName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: FeedbackVariant;
}

const ISSUE_TYPES = [
  { value: 'broken', label: 'Something is broken' },
  { value: 'confusing', label: 'Confusing or unclear' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
] as const;

type IssueType = (typeof ISSUE_TYPES)[number]['value'];

export function FeedbackModal({
  toolId,
  toolName,
  open,
  onOpenChange,
  variant = 'review',
}: FeedbackModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const isReport = variant === 'report';

  const resetForm = useCallback(() => {
    setRating(0);
    setHoveredStar(0);
    setComment('');
    setIssueType('');
  }, []);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetForm();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm],
  );

  const handleSubmit = useCallback(async () => {
    if (isReport && !issueType) return;
    if (!isReport && rating === 0) return;

    setSubmitting(true);

    const title = isReport
      ? `Issue Report: ${ISSUE_TYPES.find((t) => t.value === issueType)?.label || issueType}`
      : `${rating}-star review`;

    const content = isReport
      ? `[${issueType}] ${comment || 'No additional details provided.'}`
      : comment || 'No comment provided.';

    try {
      const response = await fetch(`/api/tools/${toolId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating: isReport ? 1 : rating,
          title: title.slice(0, 100),
          content: content.length < 10 ? content.padEnd(10, '.') : content.slice(0, 1000),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const message =
          err?.error?.message || err?.error || 'Failed to submit feedback';
        throw new Error(message);
      }

      toast.success(
        isReport ? 'Issue reported' : 'Feedback submitted',
        isReport
          ? 'The tool creator has been notified.'
          : 'Thanks for your feedback!',
      );

      handleClose(false);
    } catch (err) {
      toast.error(
        'Could not submit',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [toolId, rating, comment, issueType, isReport, toast, handleClose]);

  const canSubmit = isReport
    ? issueType !== '' && comment.length >= 5
    : rating > 0;

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>
            {isReport ? 'Report an Issue' : 'Leave Feedback'}
          </ModalTitle>
          <ModalDescription>
            {isReport
              ? `Report a problem with ${toolName}`
              : `How was your experience with ${toolName}?`}
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          {isReport ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">
                  Issue type
                </label>
                <Select
                  value={issueType}
                  onValueChange={(v) => setIssueType(v as IssueType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">
                  Describe the issue
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What happened? Be as specific as you can."
                  rows={4}
                  maxLength={1000}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= (hoveredStar || rating);
                    return (
                      <motion.button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        whileTap={{ scale: 0.85 }}
                        className="p-1 rounded-md transition-colors hover:bg-white/[0.06]"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            filled
                              ? 'text-[var(--life-gold)] fill-[var(--life-gold)]'
                              : 'text-white/20'
                          }`}
                        />
                      </motion.button>
                    );
                  })}
                  <AnimatePresence mode="wait">
                    {rating > 0 && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{
                          duration: MOTION.duration.fast,
                          ease: MOTION.ease.premium,
                        }}
                        className="ml-2 text-sm text-white/40"
                      >
                        {rating}/5
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">
                  Comment (optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this tool..."
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={
              isReport
                ? 'bg-red-500/80 hover:bg-red-500 text-white'
                : 'bg-[var(--life-gold)] hover:bg-[var(--life-gold)]/90 text-black'
            }
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : isReport ? (
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Report Issue
              </span>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
