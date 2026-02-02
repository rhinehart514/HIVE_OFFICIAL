"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  TrophyIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const ArrowLeft = ArrowLeftIcon;
const Users = UsersIcon;
const Calendar = CalendarIcon;
const Clock = ClockIcon;
const Trophy = TrophyIcon;
const Star = StarIcon;
import { RitualUnion } from "@hive/core";
import { Button, RitualFoundingClass, RitualSurvival, RitualTournamentBracket } from "@hive/ui";
import { logger } from "@/lib/logger";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  streakCount: number;
  isCurrentUser: boolean;
}

export default function RitualDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [ritual, setRitual] = useState<RitualUnion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Fetch ritual details
  useEffect(() => {
    async function fetchRitual() {
      try {
        setIsLoading(true);
        setError(null);

        // Try fetching by ID first, then by slug
        let response = await fetch(`/api/rituals/${slug}`);

        if (!response.ok && response.status === 404) {
          // Try by slug
          response = await fetch(`/api/rituals/slug/${slug}`);
        }

        if (!response.ok) {
          throw new Error("Ritual not found");
        }

        const data = await response.json();
        setRitual(data.ritual);

        // Fetch leaderboard
        const leaderboardRes = await fetch(`/api/rituals/${data.ritual.id}/leaderboard?limit=10`);
        if (leaderboardRes.ok) {
          const lbData = await leaderboardRes.json();
          setLeaderboard(lbData.leaderboard || []);
          // Check if user is participating (either in top leaderboard or has currentUserEntry)
          const isInLeaderboard = (lbData.leaderboard || []).some(
            (e: LeaderboardEntry) => e.isCurrentUser
          );
          if (lbData.currentUserEntry || isInLeaderboard) {
            setIsParticipating(true);
            // Get user's current stats from their entry
            const userEntry = lbData.currentUserEntry ||
              (lbData.leaderboard || []).find((e: LeaderboardEntry) => e.isCurrentUser);
            if (userEntry) {
              setUserStreak(userEntry.streakCount || 0);
              setUserPoints(userEntry.totalPoints || 0);
            }
          }
        }

        // Check if user already checked in today
        try {
          const participationsRes = await fetch("/api/rituals/my-participations");
          if (participationsRes.ok) {
            const pData = await participationsRes.json();
            const participation = (pData.participations || []).find(
              (p: { ritualId: string; lastParticipatedAt?: string }) => p.ritualId === data.ritual.id
            );
            if (participation?.lastParticipatedAt) {
              const lastCheckin = new Date(participation.lastParticipatedAt);
              const today = new Date();
              if (
                lastCheckin.getFullYear() === today.getFullYear() &&
                lastCheckin.getMonth() === today.getMonth() &&
                lastCheckin.getDate() === today.getDate()
              ) {
                setHasCheckedInToday(true);
              }
            }
          }
        } catch {
          // Silently fail - non-critical
        }
      } catch (err) {
        logger.error("Failed to load ritual", {
          slug,
          error: err instanceof Error ? err.message : String(err),
        });
        setError(err instanceof Error ? err : new Error("Failed to load ritual"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchRitual();
  }, [slug]);

  // Handle joining the ritual
  const handleJoin = useCallback(async () => {
    if (!ritual || isJoining) return;

    try {
      setIsJoining(true);
      const response = await fetch(`/api/rituals/${ritual.id}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join ritual");
      }

      setIsParticipating(true);
      logger.info("Joined ritual", { ritualId: ritual.id });
    } catch (err) {
      logger.error("Failed to join ritual", {
        ritualId: ritual?.id,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsJoining(false);
    }
  }, [ritual, isJoining]);

  // Handle daily check-in
  const handleCheckIn = useCallback(async () => {
    if (!ritual || isCheckingIn || hasCheckedInToday) return;

    try {
      setIsCheckingIn(true);
      const response = await fetch(`/api/rituals/${ritual.id}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "daily_checkin",
          points: 10,
          metadata: { timestamp: new Date().toISOString() },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to check in");
      }

      const result = await response.json();
      setHasCheckedInToday(true);
      setUserStreak(result.streak || userStreak + 1);
      setUserPoints(result.totalPoints || userPoints + 10);
      logger.info("Daily check-in completed", { ritualId: ritual.id, streak: result.streak });
    } catch (err) {
      logger.error("Failed to check in", {
        ritualId: ritual?.id,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsCheckingIn(false);
    }
  }, [ritual, isCheckingIn, hasCheckedInToday, userStreak, userPoints]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--hive-background-primary)] p-8">
        <div className="mx-auto max-w-4xl animate-pulse">
          <div className="mb-6 h-8 w-32 rounded bg-[var(--hive-background-secondary)]" />
          <div className="mb-4 h-12 w-2/3 rounded bg-[var(--hive-background-secondary)]" />
          <div className="h-64 rounded-2xl bg-[var(--hive-background-secondary)]" />
        </div>
      </div>
    );
  }

  if (error || !ritual) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hive-background-primary)]">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-[var(--hive-text-primary)]">
            Ritual not found
          </h2>
          <p className="mb-4 text-[var(--hive-text-secondary)]">
            {error?.message || "This ritual may have ended or been removed."}
          </p>
          <Button onClick={() => router.push("/rituals")}>
            View All Rituals
          </Button>
        </div>
      </div>
    );
  }

  const startsAt = new Date(ritual.startsAt);
  const endsAt = new Date(ritual.endsAt);
  const now = new Date();
  const isActive = ritual.phase === "active" || (ritual.phase === "announced" && now >= startsAt);
  const hasEnded = ritual.phase === "ended" || now > endsAt;

  // Extract metrics
  const metrics = ritual.metrics as {
    participants?: number;
    completionRate?: number;
  } | undefined;

  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/rituals")}
          className="mb-6 flex items-center gap-2 text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rituals
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isActive
                  ? "bg-green-500/20 text-green-400"
                  : hasEnded
                    ? "bg-[var(--hive-background-tertiary)] text-[var(--hive-text-tertiary)]"
                    : "bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)]"
              }`}
            >
              {isActive ? "Active" : hasEnded ? "Ended" : "Upcoming"}
            </span>
            <span className="text-sm text-[var(--hive-text-tertiary)] capitalize">
              {ritual.archetype.replace(/_/g, " ")}
            </span>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-[var(--hive-text-primary)]">
            {ritual.title}
          </h1>

          {ritual.subtitle && (
            <p className="text-lg text-[var(--hive-text-secondary)]">
              {ritual.subtitle}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-[var(--hive-background-secondary)] p-4">
            <Users className="mb-2 h-5 w-5 text-[var(--hive-text-tertiary)]" />
            <p className="text-2xl font-bold text-[var(--hive-text-primary)]">
              {metrics?.participants || 0}
            </p>
            <p className="text-sm text-[var(--hive-text-tertiary)]">Participants</p>
          </div>

          <div className="rounded-xl bg-[var(--hive-background-secondary)] p-4">
            <Calendar className="mb-2 h-5 w-5 text-[var(--hive-text-tertiary)]" />
            <p className="text-2xl font-bold text-[var(--hive-text-primary)]">
              {startsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <p className="text-sm text-[var(--hive-text-tertiary)]">Start Date</p>
          </div>

          <div className="rounded-xl bg-[var(--hive-background-secondary)] p-4">
            <Clock className="mb-2 h-5 w-5 text-[var(--hive-text-tertiary)]" />
            <p className="text-2xl font-bold text-[var(--hive-text-primary)]">
              {Math.ceil((endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-sm text-[var(--hive-text-tertiary)]">Days</p>
          </div>

          <div className="rounded-xl bg-[var(--hive-background-secondary)] p-4">
            <Trophy className="mb-2 h-5 w-5 text-[var(--hive-brand-primary)]" />
            <p className="text-2xl font-bold text-[var(--hive-text-primary)]">
              {metrics?.completionRate ? `${Math.round(metrics.completionRate)}%` : "--"}
            </p>
            <p className="text-sm text-[var(--hive-text-tertiary)]">Completion</p>
          </div>
        </div>

        {/* Description */}
        {ritual.description && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-[var(--hive-text-primary)]">
              About
            </h2>
            <p className="text-[var(--hive-text-secondary)] leading-relaxed">
              {ritual.description}
            </p>
          </div>
        )}

        {/* Archetype-specific component */}
        <div className="mb-8">
          {(String(ritual.archetype).toLowerCase() === "founding_class" ||
            ritual.archetype === "FOUNDING_CLASS") && (
            <RitualFoundingClass
              ritual={ritual as unknown as Parameters<typeof RitualFoundingClass>[0]["ritual"]}
              isParticipating={isParticipating}
              onJoin={handleJoin}
            />
          )}

          {(String(ritual.archetype).toLowerCase() === "survival" ||
            ritual.archetype === "SURVIVAL") && (
            <RitualSurvival
              ritual={ritual as unknown as Parameters<typeof RitualSurvival>[0]["ritual"]}
              isParticipating={isParticipating}
              onVote={(matchId: string, choice: string) => {
                logger.info("Vote cast", { ritualId: ritual.id, matchId, choice });
              }}
            />
          )}

          {(String(ritual.archetype).toLowerCase() === "tournament" ||
            ritual.archetype === "TOURNAMENT") && (
            <RitualTournamentBracket
              ritual={ritual as unknown as Parameters<typeof RitualTournamentBracket>[0]["ritual"]}
              isParticipating={isParticipating}
            />
          )}
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--hive-text-primary)]">
              <Star className="h-5 w-5 text-[var(--hive-brand-primary)]" />
              Top Participants
            </h2>

            <div className="rounded-xl bg-[var(--hive-background-secondary)] divide-y divide-[var(--hive-border)]">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 ${
                    entry.isCurrentUser ? "bg-[var(--hive-brand-primary)]/10" : ""
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      entry.rank === 1
                        ? "bg-[var(--hive-brand-primary)] text-black"
                        : entry.rank === 2
                          ? "bg-white/[0.30] text-white"
                          : entry.rank === 3
                            ? "bg-amber-600 text-white"
                            : "bg-[var(--hive-background-tertiary)] text-[var(--hive-text-primary)]"
                    }`}
                  >
                    {entry.rank}
                  </span>

                  <div className="flex-1">
                    <p className="font-medium text-[var(--hive-text-primary)]">
                      {entry.displayName || `User ${entry.userId.slice(0, 8)}`}
                      {entry.isCurrentUser && (
                        <span className="ml-2 text-xs text-[var(--hive-brand-primary)]">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--hive-text-tertiary)]">
                      {entry.streakCount} day streak
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-[var(--hive-text-primary)]">
                      {entry.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--hive-text-tertiary)]">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Check-in Section for Participants */}
        {isParticipating && isActive && (
          <div className="mb-8 rounded-2xl bg-[var(--hive-background-secondary)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-1">
                  Daily Check-in
                </h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[var(--hive-text-secondary)]">
                    🔥 {userStreak} day streak
                  </span>
                  <span className="text-[var(--hive-text-tertiary)]">
                    {userPoints.toLocaleString()} points
                  </span>
                </div>
              </div>

              {hasCheckedInToday ? (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/20 text-green-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">Done Today</span>
                </div>
              ) : (
                <Button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="bg-[var(--hive-brand-primary)] text-black font-semibold px-6"
                >
                  {isCheckingIn ? "Checking in..." : "Complete Today"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Join CTA */}
        {!hasEnded && !isParticipating && (
          <div className="sticky bottom-4 rounded-2xl bg-[var(--hive-background-secondary)] p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[var(--hive-text-primary)]">
                  Ready to join?
                </p>
                <p className="text-sm text-[var(--hive-text-tertiary)]">
                  {isActive ? "Jump in now!" : `Starts ${startsAt.toLocaleDateString()}`}
                </p>
              </div>
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="bg-[var(--hive-brand-primary)] text-black font-semibold px-6"
              >
                {isJoining ? "Joining..." : "Join Ritual"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
