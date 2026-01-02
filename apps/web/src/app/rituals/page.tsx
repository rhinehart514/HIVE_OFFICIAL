"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RitualsPageLayout, type RitualData } from "@hive/ui";
import { RitualUnion, RitualPhase } from "@hive/core";
import { logger } from "@/lib/logger";

/**
 * Transform RitualUnion from API to RitualData for UI
 */
function transformRitual(ritual: RitualUnion, isParticipating: boolean = false): RitualData {
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

  // Calculate progress (mock for now - would come from participation data)
  const progress = ritual.phase === "ended" ? 100 : ritual.phase === "active" ? 50 : 0;

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

        // TODO: Fetch user's participation status
        // For now, we'll use an empty set
        const participating = new Set<string>();
        setParticipatingIds(participating);

        // Transform rituals
        const transformed = ritualList.map((r) =>
          transformRitual(r, participating.has(r.id))
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
      current.participantCount > best.participantCount ? current : best
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
            ? { ...r, isParticipating: true, participantCount: r.participantCount + 1 }
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
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.09 6.26L21 9.27l-5.18 5.03L17.18 21 12 17.27 6.82 21l1.36-6.7L3 9.27l6.91.01L12 3z" />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            Founding Leader Rituals
          </h2>
          <p className="mb-6 text-neutral-400 leading-relaxed">
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

  // Handle feature disabled
  if (error?.message === "FEATURE_DISABLED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-800">
            <svg className="h-8 w-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            Rituals Coming Soon
          </h2>
          <p className="mb-6 text-neutral-400 leading-relaxed">
            Campus-wide rituals and challenges are launching soon.
            Check back after our soft launch to participate!
          </p>
          <button
            onClick={() => router.push("/spaces")}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-6 py-3 text-white font-medium hover:bg-neutral-700 transition-colors"
          >
            Explore Spaces
          </button>
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

  return (
    <RitualsPageLayout
      rituals={rituals}
      featuredRitual={featuredRitual}
      onRitualJoin={handleJoin}
      onRitualView={handleView}
      isLoading={isLoading}
    />
  );
}
