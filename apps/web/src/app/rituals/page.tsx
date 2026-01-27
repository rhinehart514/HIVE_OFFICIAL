"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type RitualData } from "@hive/ui";
import { RitualUnion } from "@hive/core";
import { Button, Card, Badge, toast } from "@hive/ui";
import {
  StarIcon,
  FireIcon,
  TrophyIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { logger } from "@/lib/logger";

interface ParticipationData {
  ritualId: string;
  completionCount: number;
  streakCount: number;
  totalPoints: number;
}

/**
 * Transform RitualUnion from API to RitualData for UI
 */
function transformRitual(
  ritual: RitualUnion,
  isParticipating: boolean = false,
  participation?: ParticipationData
): RitualData {
  const now = new Date();
  const startsAt = new Date(ritual.startsAt);
  const endsAt = new Date(ritual.endsAt);

  // Derive status from phase and dates
  let status: RitualData["status"];
  if (ritual.phase === "ended" || (ritual.phase === "cooldown" && now > endsAt)) {
    status = "completed";
  } else if (ritual.phase === "active" || (ritual.phase === "announced" && now >= startsAt)) {
    status = "active";
  } else {
    status = "upcoming";
  }

  // Calculate progress based on real participation data
  let progress = 0;
  if (ritual.phase === "ended") {
    progress = 100;
  } else if (isParticipating && participation) {
    // Calculate progress based on completion count and ritual duration
    // For daily rituals, progress = (completions / total days) * 100
    const durationMs = endsAt.getTime() - startsAt.getTime();
    const totalDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
    const elapsedMs = now.getTime() - startsAt.getTime();
    const elapsedDays = Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));

    // Progress = min(100, completions / elapsed days * 100) for participation rate
    // OR completions / total days * 100 for total progress
    const participationRate = Math.min(100, (participation.completionCount / elapsedDays) * 100);
    const totalProgress = Math.min(100, (participation.completionCount / totalDays) * 100);

    // Use a weighted average favoring participation rate for active rituals
    progress = ritual.phase === "active"
      ? Math.round((participationRate * 0.7 + totalProgress * 0.3))
      : Math.round(totalProgress);
  } else if (ritual.phase === "active" && !isParticipating) {
    // Not participating - show 0%
    progress = 0;
  }

  // Extract participant count from metrics if available
  const metrics = ritual.metrics as { participants?: number } | undefined;
  const participantCount = metrics?.participants || 0;

  // Format duration
  const durationMs = endsAt.getTime() - startsAt.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  const duration = durationDays === 1 ? "1 day" : `${durationDays} days`;

  // Get frequency from config if available
  const config = ritual.config as { frequency?: string } | undefined;
  const frequency = config?.frequency || "One-time";

  return {
    id: ritual.id,
    name: ritual.title,
    description: ritual.description || ritual.subtitle || "",
    icon: ritual.presentation?.icon as string | undefined,
    progress,
    participantCount,
    duration,
    startDate: ritual.startsAt,
    endDate: ritual.endsAt,
    frequency,
    isParticipating,
    isCompleted: status === "completed",
    status,
  };
}

export default function RitualsPage() {
  const router = useRouter();
  const [rituals, setRituals] = useState<RitualData[]>([]);
  const [participatingIds, setParticipatingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch rituals and user's participation
  useEffect(() => {
    async function fetchRituals() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all rituals
        const response = await fetch("/api/rituals?limit=100");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle leaders-only mode
          if (errorData.code === "LEADER_REQUIRED") {
            throw new Error("LEADERS_ONLY");
          }

          // Handle feature disabled
          if (errorData.code === "FEATURE_DISABLED") {
            throw new Error("FEATURE_DISABLED");
          }

          throw new Error(errorData.message || "Failed to fetch rituals");
        }

        const data = await response.json();
        const ritualList: RitualUnion[] = data.rituals || [];

        // Fetch user's participation status with full data
        let participating = new Set<string>();
        let participationMap = new Map<string, ParticipationData>();
        try {
          const participationsRes = await fetch("/api/rituals/my-participations");
          if (participationsRes.ok) {
            const participationsData = await participationsRes.json();
            participating = new Set<string>(participationsData.participatingIds || []);
            // Build a map for quick lookup of participation details
            (participationsData.participations || []).forEach((p: ParticipationData) => {
              participationMap.set(p.ritualId, p);
            });
          }
        } catch (err) {
          // Silently fail - user might not be authenticated or feature disabled
          logger.warn("Could not fetch participation status", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
        setParticipatingIds(participating);

        // Transform rituals with participation data
        const transformed = ritualList.map((r) =>
          transformRitual(r, participating.has(r.id), participationMap.get(r.id))
        );

        setRituals(transformed);
      } catch (err) {
        logger.error("Failed to load rituals", {
          error: err instanceof Error ? err.message : String(err),
        });
        setError(err instanceof Error ? err : new Error("Failed to load rituals"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchRituals();
  }, []);

  // Find featured ritual (first active ritual with most participants)
  const featuredRitual = useMemo(() => {
    const activeRituals = rituals.filter((r) => r.status === "active");
    if (activeRituals.length === 0) return undefined;

    return activeRituals.reduce((best, current) =>
      (current.participantCount ?? 0) > (best.participantCount ?? 0) ? current : best
    );
  }, [rituals]);

  // Handle joining a ritual
  const handleJoin = useCallback(async (ritualId: string) => {
    try {
      const response = await fetch(`/api/rituals/${ritualId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join ritual");
      }

      // Update local state
      setParticipatingIds((prev) => new Set([...prev, ritualId]));
      setRituals((prev) =>
        prev.map((r) =>
          r.id === ritualId
            ? { ...r, isParticipating: true, participantCount: (r.participantCount ?? 0) + 1 }
            : r
        )
      );

      logger.info("Joined ritual", { ritualId });
    } catch (err) {
      logger.error("Failed to join ritual", {
        ritualId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  // Handle viewing ritual details
  const handleView = useCallback(
    (ritualId: string) => {
      const ritual = rituals.find((r) => r.id === ritualId);
      if (ritual) {
        // Navigate to ritual detail page using slug if available
        router.push(`/rituals/${ritualId}`);
      }
    },
    [router, rituals]
  );

  // Handle leaders-only mode
  if (error?.message === "LEADERS_ONLY") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.09 6.26L21 9.27l-5.18 5.03L17.18 21 12 17.27 6.82 21l1.36-6.7L3 9.27l6.91.01L12 3z" />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            Founding Leader Rituals
          </h2>
          <p className="mb-6 text-white/50 leading-relaxed">
            Rituals are currently exclusive to space leaders during our January launch.
            Claim a space to unlock special founding leader challenges and rewards.
          </p>
          <button
            onClick={() => router.push("/spaces/claim")}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-black font-semibold hover:bg-amber-400 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.09 6.26L21 9.27l-5.18 5.03L17.18 21 12 17.27 6.82 21l1.36-6.7L3 9.27l6.91.01L12 3z" />
            </svg>
            Become a Leader
          </button>
        </div>
      </div>
    );
  }

  // Handle feature disabled - Show teaser landing page
  if (error?.message === "FEATURE_DISABLED") {
    return (
      <div className="min-h-screen bg-ground">
        {/* Hero section */}
        <div className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
              <SparklesIcon className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Coming February 2026</span>
            </div>

            {/* Hero icon */}
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
              <FireIcon className="h-12 w-12 text-amber-400" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Campus Rituals
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Build powerful habits together. Rituals are campus-wide challenges that bring students together
              through shared goals, friendly competition, and collective achievement.
            </p>

            {/* Feature grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                  <CalendarIcon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Daily Challenges</h3>
                <p className="text-sm text-white/50">
                  Simple actions you can do every day to build momentum and earn streaks.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                  <UserGroupIcon className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Collective Goals</h3>
                <p className="text-sm text-white/50">
                  Unlock rewards when enough students complete the challenge together.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                  <TrophyIcon className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Achievements</h3>
                <p className="text-sm text-white/50">
                  Earn badges and climb leaderboards as you complete more rituals.
                </p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  toast.success("You're on the list!", "We'll notify you when Rituals launches.");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-black font-semibold hover:bg-amber-400 transition-colors"
              >
                <SparklesIcon className="h-5 w-5" />
                Get Notified at Launch
              </button>
              <button
                onClick={() => router.push("/spaces")}
                className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.08] px-6 py-3.5 text-white font-medium hover:bg-white/[0.08] transition-colors"
              >
                Explore Spaces
              </button>
            </div>
          </div>
        </div>

        {/* Example rituals preview */}
        <div className="max-w-4xl mx-auto px-6 pb-20">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Example Rituals</h2>
            <p className="text-sm text-white/50">Here's what you'll be able to participate in</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: "📚", name: "Study Streak", desc: "Log 2 hours of studying daily", participants: "1,247" },
              { icon: "🏃", name: "Move Daily", desc: "Exercise or walk 30+ minutes", participants: "892" },
              { icon: "🎯", name: "Goal Getter", desc: "Complete 3 tasks from your to-do list", participants: "2,103" },
              { icon: "💬", name: "Connect Week", desc: "Have a meaningful conversation each day", participants: "456" },
            ].map((ritual) => (
              <div
                key={ritual.name}
                className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl"
              >
                <span className="text-3xl">{ritual.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-white">{ritual.name}</h3>
                  <p className="text-sm text-white/50">{ritual.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white/40">{ritual.participants}</div>
                  <div className="text-xs text-white/30">would join</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hive-background-primary)]">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-[var(--hive-text-primary)]">
            Failed to load rituals
          </h2>
          <p className="mb-4 text-[var(--hive-text-secondary)]">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[var(--hive-brand-primary)] px-4 py-2 text-black font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Separate rituals by participation status
  const yourRituals = rituals.filter((r) => r.isParticipating);
  const availableRituals = rituals.filter((r) => !r.isParticipating && r.status !== "completed");
  const completedRituals = rituals.filter((r) => r.status === "completed");

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="mb-8">
            <div className="h-8 w-48 bg-white/[0.06] rounded animate-pulse mb-2" />
            <div className="h-4 w-72 bg-white/[0.06] rounded animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FireIcon className="h-7 w-7 text-life-gold" />
            <h1 className="text-2xl font-bold text-white">Campus Rituals</h1>
          </div>
          <p className="text-white/60">
            Join challenges, build habits, and earn rewards with your campus community
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Featured Ritual */}
        {featuredRitual && (
          <section>
            <button
              onClick={() => handleView(featuredRitual.id)}
              className="w-full text-left bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="h-5 w-5 text-life-gold" />
                    <span className="text-xs uppercase tracking-wider text-life-gold font-medium">
                      Featured Ritual
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-life-gold transition-colors">
                    {featuredRitual.name}
                  </h2>
                  <p className="text-white/60 mt-1 line-clamp-2">
                    {featuredRitual.description}
                  </p>
                </div>
                {featuredRitual.icon && (
                  <span className="text-4xl">{featuredRitual.icon}</span>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-white/50">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{featuredRitual.participantCount || 0} participants</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/50">
                  <ClockIcon className="h-4 w-4" />
                  <span>{featuredRitual.duration}</span>
                </div>
                {featuredRitual.isParticipating && (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                    Joined
                  </Badge>
                )}
              </div>
            </button>
          </section>
        )}

        {/* Your Rituals */}
        {yourRituals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrophyIcon className="h-5 w-5 text-life-gold" />
              <h2 className="text-lg font-semibold text-white">Your Rituals</h2>
              <Badge variant="secondary" className="ml-2">
                {yourRituals.length}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {yourRituals.map((ritual) => (
                <RitualCard
                  key={ritual.id}
                  ritual={ritual}
                  onJoin={handleJoin}
                  onView={handleView}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Rituals */}
        {availableRituals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <StarIcon className="h-5 w-5 text-white/60" />
              <h2 className="text-lg font-semibold text-white">Available Rituals</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableRituals.map((ritual) => (
                <RitualCard
                  key={ritual.id}
                  ritual={ritual}
                  onJoin={handleJoin}
                  onView={handleView}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Rituals */}
        {completedRituals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircleIcon className="h-5 w-5 text-white/40" />
              <h2 className="text-lg font-semibold text-white/60">Completed</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedRituals.map((ritual) => (
                <RitualCard
                  key={ritual.id}
                  ritual={ritual}
                  onJoin={handleJoin}
                  onView={handleView}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {rituals.length === 0 && (
          <div className="text-center py-16">
            <FireIcon className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No rituals available</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Campus rituals will appear here when they're announced. Check back soon!
            </p>
            <Button asChild variant="outline">
              <Link href="/spaces">Explore Spaces</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// Ritual Card Component
function RitualCard({
  ritual,
  onJoin,
  onView,
}: {
  ritual: RitualData;
  onJoin: (id: string) => void;
  onView: (id: string) => void;
}) {
  const isCompleted = ritual.status === "completed";
  const isUpcoming = ritual.status === "upcoming";

  return (
    <Card
      className={`p-5 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-colors cursor-pointer ${
        isCompleted ? "opacity-60" : ""
      }`}
      onClick={() => onView(ritual.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {ritual.icon && <span className="text-lg">{ritual.icon}</span>}
            <h3 className="font-semibold text-white truncate">{ritual.name}</h3>
          </div>
          <p className="text-sm text-white/50 line-clamp-2">{ritual.description}</p>
        </div>
        {ritual.isParticipating && !isCompleted && (
          <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0 ml-2" />
        )}
      </div>

      {/* Progress bar for participating rituals */}
      {ritual.isParticipating && !isCompleted && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-white/40 mb-1">
            <span>Progress</span>
            <span>{ritual.progress}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-life-gold rounded-full transition-all"
              style={{ width: `${ritual.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1">
          <UserGroupIcon className="h-3.5 w-3.5" />
          <span>{ritual.participantCount || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>{ritual.duration}</span>
        </div>
        {isUpcoming && (
          <Badge variant="secondary" className="text-xs">
            Upcoming
          </Badge>
        )}
        {isCompleted && (
          <Badge variant="secondary" className="text-xs bg-white/[0.04]">
            Ended
          </Badge>
        )}
      </div>

      {/* Join button for non-participating active rituals */}
      {!ritual.isParticipating && !isCompleted && !isUpcoming && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onJoin(ritual.id);
          }}
          size="sm"
          className="mt-4 w-full bg-life-gold text-ground hover:bg-life-gold/90"
        >
          Join Ritual
        </Button>
      )}
    </Card>
  );
}
