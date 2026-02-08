'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Button,
  Card,
  CardContent,
  Skeleton,
  MOTION,
} from '@hive/ui';
import { apiClient } from '@/lib/api-client';
import {
  ArrowLeftIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

const EASE = MOTION.ease.premium;

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  author: string;
  userId: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

interface Props {
  params: Promise<{ toolId: string }>;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

function ReviewCard({
  review,
  index,
}: {
  review: Review;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : index * 0.06,
        ease: EASE,
      }}
      className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) =>
            i < review.rating ? (
              <StarSolid
                key={i}
                className="w-4 h-4 text-[var(--life-gold)]"
              />
            ) : (
              <StarIcon
                key={i}
                className="w-4 h-4 text-white/15"
              />
            ),
          )}
          {review.verified && (
            <span className="ml-1.5 flex items-center gap-0.5 text-[10px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              <CheckBadgeIcon className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
        <span className="text-xs text-white/30 shrink-0">
          {formatRelativeTime(review.createdAt)}
        </span>
      </div>

      {review.title && (
        <p className="mt-2 text-sm font-medium text-white/90">
          {review.title}
        </p>
      )}

      <p className="mt-1.5 text-sm text-white/60 leading-relaxed">
        {review.content}
      </p>

      <p className="mt-2 text-xs text-white/30">
        {review.author}
      </p>
    </motion.div>
  );
}

function EmptyFeedbackState({ onShare }: { onShare: () => void }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        ease: EASE,
      }}
      className="text-center py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
          delay: shouldReduceMotion ? 0 : 0.15,
        }}
        className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/[0.04] flex items-center justify-center"
      >
        <ChatBubbleLeftIcon className="w-7 h-7 text-white/30" />
      </motion.div>
      <h3 className="text-lg font-semibold text-white mb-1.5">
        No feedback yet
      </h3>
      <p className="text-sm text-white/40 max-w-sm mx-auto mb-6">
        Share your tool to start collecting feedback from your community.
      </p>
      <Button
        onClick={onShare}
        className="bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90"
      >
        <ShareIcon className="w-4 h-4 mr-2" />
        Share Tool
      </Button>
    </motion.div>
  );
}

export default function ToolFeedbackPage({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [toolName, setToolName] = useState('Tool');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!toolId) return;
    try {
      setIsLoading(true);

      const toolResponse = await apiClient.get(`/api/tools/${toolId}`);
      if (toolResponse.ok) {
        const toolData = await toolResponse.json();
        setToolName((toolData.tool || toolData).name || 'Tool');
      }

      const reviewsResponse = await apiClient.get(
        `/api/tools/${toolId}/reviews`,
      );

      if (!reviewsResponse.ok) {
        setReviews([]);
        return;
      }

      const data = await reviewsResponse.json();
      setReviews(data.reviews || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const handleShare = useCallback(() => {
    router.push(`/lab/${toolId}?deploy=true`);
  }, [router, toolId]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-red-400">{error}</p>
          <div className="flex items-center gap-4 justify-center">
            <Button variant="outline" onClick={() => fetchFeedback()}>
              Try Again
            </Button>
            <button
              onClick={() => router.push('/lab')}
              className="text-[var(--life-gold)] hover:underline text-sm"
            >
              Back to Tools
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.base,
            ease: EASE,
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/lab/${toolId}`)}
              className="text-white/50"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-white">
              {toolName} Feedback
            </h1>
          </div>
        </motion.div>

        {reviews.length === 0 ? (
          <EmptyFeedbackState onShare={handleShare} />
        ) : (
          <>
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : MOTION.duration.base,
                ease: EASE,
              }}
            >
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-3xl font-bold text-white">
                        {avgRating.toFixed(1)}
                      </span>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) =>
                          i < Math.round(avgRating) ? (
                            <StarSolid
                              key={i}
                              className="w-4 h-4 text-[var(--life-gold)]"
                            />
                          ) : (
                            <StarIcon
                              key={i}
                              className="w-4 h-4 text-white/15"
                            />
                          ),
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-white/40">
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.map((review, index) => (
                <ReviewCard key={review.id} review={review} index={index} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
