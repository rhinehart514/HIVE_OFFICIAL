'use client';

/**
 * Interactive HiveLab Elements - Engagement components
 *
 * Elements that drive user engagement: polls, timers, counters, leaderboards.
 * Split from element-renderers.tsx for better maintainability.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ClockIcon, TrophyIcon, CheckIcon, HandThumbUpIcon, UsersIcon, UserPlusIcon } from '@heroicons/react/24/outline';

// Alias for lucide compatibility
const Vote = HandThumbUpIcon;
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets, easingArrays } from '@hive/tokens';

import { Button } from '../../../design-system/primitives';
import { Card, CardContent } from '../../../design-system/primitives';
import { Progress } from '../../../design-system/primitives';

import { AnimatedNumber, numberSpringPresets } from '../../motion-primitives/animated-number';

import type { ElementProps } from '../../../lib/hivelab/element-system';

// ============================================================================
// FLIP DIGIT - Animated digit display for countdowns
// ============================================================================

function FlipDigit({ value, urgencyLevel }: { value: string; urgencyLevel: 'calm' | 'warning' | 'urgent' | 'critical' }) {
  const prefersReducedMotion = useReducedMotion();

  const colorClasses = {
    calm: 'text-foreground',
    warning: 'text-amber-500',
    urgent: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <div className="relative h-[56px] w-[40px] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={prefersReducedMotion ? false : { y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { y: 56, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={`absolute inset-0 flex items-center justify-center text-4xl font-bold tabular-nums ${colorClasses[urgencyLevel]}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// TIME UNIT - Display with flip animation
// ============================================================================

function TimeUnit({
  value,
  label,
  urgencyLevel,
  pulse = false,
}: {
  value: number;
  label: string;
  urgencyLevel: 'calm' | 'warning' | 'urgent' | 'critical';
  pulse?: boolean;
}) {
  const paddedValue = value.toString().padStart(2, '0');
  const digits = paddedValue.split('');

  return (
    <motion.div
      className="text-center"
      animate={pulse ? { scale: [1, 1.02, 1] } : {}}
      transition={pulse ? { duration: 1, repeat: Infinity, repeatType: 'loop' } : {}}
    >
      <div className="flex items-center justify-center">
        {digits.map((digit, i) => (
          <FlipDigit key={`${label}-${i}`} value={digit} urgencyLevel={urgencyLevel} />
        ))}
      </div>
      <div className="text-xs text-muted-foreground uppercase mt-1">{label}</div>
    </motion.div>
  );
}

// ============================================================================
// COUNTDOWN TIMER ELEMENT
// ============================================================================

export function CountdownTimerElement({ config, data, onChange, onAction }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();

  // Hydrate from server state
  const serverTimeLeft = (data?.timeLeft as number) || null;
  const serverFinished = (data?.finished as boolean) || false;

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (serverTimeLeft !== null) return serverTimeLeft;
    if (config.targetDate) {
      const target = new Date(config.targetDate).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((target - now) / 1000));
    }
    return config.seconds || 3600; // Default 1 hour
  });
  const [finished, setFinished] = useState(serverFinished);
  const [justFinished, setJustFinished] = useState(false);

  // Sync with server state
  useEffect(() => {
    if (serverTimeLeft !== null) setTimeLeft(serverTimeLeft);
    if (serverFinished) setFinished(true);
  }, [serverTimeLeft, serverFinished]);

  useEffect(() => {
    if (timeLeft <= 0 && !finished) {
      setFinished(true);
      setJustFinished(true);
      onChange?.({ finished: true, timeLeft: 0 });
      onAction?.('finished', { completedAt: new Date().toISOString() });

      // Clear celebration after 2 seconds
      setTimeout(() => setJustFinished(false), 2000);
      return;
    }

    if (finished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setFinished(true);
          setJustFinished(true);
          onChange?.({ finished: true, timeLeft: 0 });
          onAction?.('finished', { completedAt: new Date().toISOString() });
          setTimeout(() => setJustFinished(false), 2000);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, finished, onChange, onAction]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return { days, hours, mins, secs, format: 'days' as const };
    }
    return { days: 0, hours, mins, secs, format: 'hours' as const };
  };

  // Determine urgency level for color cascade
  const getUrgencyLevel = (seconds: number): 'calm' | 'warning' | 'urgent' | 'critical' => {
    if (seconds <= 60) return 'critical'; // Under 1 minute
    if (seconds <= 300) return 'urgent'; // Under 5 minutes
    if (seconds <= 3600) return 'warning'; // Under 1 hour
    return 'calm';
  };

  const time = formatTime(timeLeft);
  const urgencyLevel = getUrgencyLevel(timeLeft);
  const shouldPulse = timeLeft <= 60 && timeLeft > 0;

  // Background gradient based on urgency
  const gradientClasses = {
    calm: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
    warning: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    urgent: 'from-orange-500/15 to-red-500/10 border-orange-500/30',
    critical: 'from-red-500/20 to-rose-500/15 border-red-500/40',
  };

  const iconColorClasses = {
    calm: 'text-blue-500',
    warning: 'text-amber-500',
    urgent: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <motion.div
      initial={false}
      animate={justFinished ? { scale: [1, 1.05, 1] } : {}}
      transition={springPresets.bouncy}
    >
      <Card className={`bg-gradient-to-br transition-colors duration-500 ${gradientClasses[urgencyLevel]}`}>
        <CardContent className="p-6 text-center">
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            animate={shouldPulse && !prefersReducedMotion ? { opacity: [1, 0.7, 1] } : {}}
            transition={shouldPulse ? { duration: 1, repeat: Infinity } : {}}
          >
            <motion.div
              animate={shouldPulse && !prefersReducedMotion ? { rotate: [0, -10, 10, 0] } : {}}
              transition={shouldPulse ? { duration: 0.5, repeat: Infinity } : {}}
            >
              <ClockIcon className={`h-5 w-5 transition-colors duration-300 ${iconColorClasses[urgencyLevel]}`} />
            </motion.div>
            <span className="text-sm font-medium text-muted-foreground">
              {config.label || 'Time Remaining'}
            </span>
          </motion.div>

          <div className="flex items-center justify-center gap-2">
            {time.format === 'days' && (
              <>
                <TimeUnit value={time.days} label="Days" urgencyLevel={urgencyLevel} />
                <div className="text-2xl font-bold text-muted-foreground self-start mt-2">:</div>
              </>
            )}
            <TimeUnit value={time.hours} label="Hours" urgencyLevel={urgencyLevel} />
            <motion.div
              className="text-2xl font-bold text-muted-foreground self-start mt-2"
              animate={!finished ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.div>
            <TimeUnit value={time.mins} label="Mins" urgencyLevel={urgencyLevel} pulse={shouldPulse} />
            <motion.div
              className="text-2xl font-bold text-muted-foreground self-start mt-2"
              animate={!finished ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.div>
            <TimeUnit value={time.secs} label="Secs" urgencyLevel={urgencyLevel} pulse={shouldPulse} />
          </div>

          <AnimatePresence>
            {finished && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={springPresets.bouncy}
                className="mt-4"
              >
                <motion.div
                  className="text-lg font-medium"
                  animate={justFinished ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: justFinished ? 3 : 0 }}
                >
                  {justFinished ? '🎉' : ''} Time's up! {justFinished ? '🎉' : ''}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// POLL ELEMENT
// ============================================================================

// Helper to normalize poll options - handles both string and object formats
interface PollOption {
  id: string;
  label: string;
  color?: string;
}

function normalizePollOptions(options: unknown[]): PollOption[] {
  return options.map((opt, index) => {
    if (typeof opt === 'string') {
      return { id: opt, label: opt };
    }
    if (typeof opt === 'object' && opt !== null) {
      const o = opt as Record<string, unknown>;
      return {
        id: (o.id as string) || (o.value as string) || `option-${index}`,
        label: (o.label as string) || (o.name as string) || `Option ${index + 1}`,
        color: o.color as string | undefined,
      };
    }
    return { id: `option-${index}`, label: `Option ${index + 1}` };
  });
}

export function PollElement({ id, config, data, onChange, onAction, sharedState, userState }: ElementProps) {
  const rawOptions = config.options || ['Option A', 'Option B', 'Option C'];
  const options = normalizePollOptions(rawOptions);
  const prefersReducedMotion = useReducedMotion();

  // ==========================================================================
  // State Hydration - Support both new sharedState/userState AND legacy data prop
  // ==========================================================================

  // NEW: Read from sharedState (preferred source for deployed tools)
  // Counter keys: "{instanceId}:{optionId}" for per-option, "{instanceId}:total" for total
  const getVoteCountsFromSharedState = (): Record<string, number> => {
    if (!sharedState?.counters || !id) return {};
    const counts: Record<string, number> = {};
    options.forEach((opt) => {
      const counterKey = `${id}:${opt.id}`;
      counts[opt.id] = sharedState.counters[counterKey] || 0;
    });
    return counts;
  };

  // NEW: Read user's vote from userState
  const getUserVoteFromUserState = (): string | null => {
    if (!userState?.selections || !id) return null;
    return (userState.selections[`${id}:selectedOption`] as string) || null;
  };

  // LEGACY: Read from data prop (for backward compatibility / preview mode)
  const serverResponses = (data?.responses as Record<string, { choice: string }>) || {};
  const serverTotalVotes = (data?.totalVotes as number) || 0;
  const legacyUserVote = (data?.userVote as string) || null;

  // Calculate vote counts from legacy responses
  const calculateLegacyVoteCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    options.forEach((opt) => { counts[opt.id] = 0; });
    Object.values(serverResponses).forEach((response) => {
      if (response?.choice && counts[response.choice] !== undefined) {
        counts[response.choice]++;
      }
    });
    return counts;
  };

  // Determine which source to use (sharedState takes precedence)
  const hasSharedState = sharedState?.counters && id && Object.keys(sharedState.counters).some(k => k.startsWith(`${id}:`));
  const initialVotes = hasSharedState ? getVoteCountsFromSharedState() : calculateLegacyVoteCounts();
  const initialUserVote = getUserVoteFromUserState() || legacyUserVote;

  const [votes, setVotes] = useState<Record<string, number>>(initialVotes);
  const [userVote, setUserVote] = useState<string | null>(initialUserVote);
  const [hasVoted, setHasVoted] = useState(!!initialUserVote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVoted, setJustVoted] = useState<string | null>(null);

  // Sync with server state when sharedState or userState changes (real-time updates)
  useEffect(() => {
    if (hasSharedState) {
      setVotes(getVoteCountsFromSharedState());
    } else {
      setVotes(calculateLegacyVoteCounts());
    }
  }, [sharedState?.counters, data?.responses, id]);

  useEffect(() => {
    const newUserVote = getUserVoteFromUserState() || legacyUserVote;
    if (newUserVote) {
      setUserVote(newUserVote);
      setHasVoted(true);
    }
  }, [userState?.selections, legacyUserVote, id]);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || serverTotalVotes;
  const showResults = config.showResultsBeforeVoting || hasVoted;

  const handleVote = async (optionId: string) => {
    if ((hasVoted && !config.allowChangeVote) || isSubmitting) return;

    setIsSubmitting(true);
    setJustVoted(optionId);

    // Optimistic update
    setVotes((prev) => ({
      ...prev,
      [optionId]: (prev[optionId] || 0) + 1,
      ...(userVote ? { [userVote]: Math.max(0, (prev[userVote] || 0) - 1) } : {}),
    }));
    setUserVote(optionId);
    setHasVoted(true);

    // Call server action
    onChange?.({ selectedOption: optionId, votes });
    onAction?.('vote', { optionId }); // Must match execute API's expected field name

    setIsSubmitting(false);

    // Clear justVoted after animation
    setTimeout(() => setJustVoted(null), 600);
  };

  // Find winning option for visual emphasis
  const maxVotes = Math.max(...Object.values(votes), 0);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <motion.div
            initial={false}
            animate={hasVoted ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.4, ease: easingArrays.default }}
          >
            <Vote className="h-5 w-5 text-primary" />
          </motion.div>
          <span className="font-semibold">{config.question || 'Cast your vote'}</span>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => {
            const voteCount = votes[option.id] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isSelected = userVote === option.id;
            const isWinning = showResults && voteCount === maxVotes && voteCount > 0;
            const wasJustVoted = justVoted === option.id;

            return (
              <motion.button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={(hasVoted && !config.allowChangeVote) || isSubmitting}
                initial={false}
                animate={wasJustVoted ? { scale: [1, 0.98, 1.02, 1] } : { scale: 1 }}
                whileHover={!hasVoted || config.allowChangeVote ? { scale: 1.01 } : {}}
                whileTap={!hasVoted || config.allowChangeVote ? { scale: 0.99 } : {}}
                transition={springPresets.snappy}
                className={`w-full text-left p-3 rounded-lg border transition-colors relative overflow-hidden ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                } ${(hasVoted && !config.allowChangeVote) || isSubmitting ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {/* Animated result bar background */}
                {showResults && (
                  <motion.div
                    className={`absolute inset-y-0 left-0 ${
                      isSelected
                        ? 'bg-primary/20'
                        : isWinning
                          ? 'bg-amber-500/15'
                          : 'bg-muted/50'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 100,
                            damping: 20,
                            delay: index * 0.05, // Stagger effect
                          }
                    }
                    style={{ borderRadius: 'inherit' }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={springPresets.bouncy}
                        >
                          <CheckIcon className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className={`${isSelected ? 'font-medium' : ''} ${isWinning ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                      {option.label}
                    </span>
                    {isWinning && showResults && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ ...springPresets.bouncy, delay: 0.2 }}
                        className="text-amber-500"
                      >
                        👑
                      </motion.span>
                    )}
                  </div>
                  {showResults && (
                    <motion.span
                      className="text-sm font-mono text-muted-foreground tabular-nums"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <AnimatedNumber
                        value={percentage}
                        springOptions={numberSpringPresets.snappy}
                      />%
                    </motion.span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          className="flex items-center justify-between text-sm text-muted-foreground"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
        >
          <span>
            <AnimatedNumber
              value={totalVotes}
              springOptions={numberSpringPresets.quick}
            /> vote{totalVotes !== 1 ? 's' : ''}
          </span>
          {config.deadline && <span>Ends {config.deadline}</span>}
        </motion.div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LEADERBOARD ELEMENT
// ============================================================================

export function LeaderboardElement({ config, data, onAction }: ElementProps) {
  // Hydrate from server state - convert entries object to sorted array
  const serverEntries = data?.entries as Record<string, { score: number; name?: string; updatedAt?: string }> | undefined;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Allow manual refresh action (useful for connection cascade)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    onAction?.('refresh', {});
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const entries = useMemo(() => {
    if (serverEntries && Object.keys(serverEntries).length > 0) {
      // Convert server entries object to sorted array with ranks
      return Object.entries(serverEntries)
        .map(([id, entry]) => ({
          id,
          name: entry.name || `User ${id.slice(0, 6)}`,
          score: entry.score || 0,
          updatedAt: entry.updatedAt,
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          change: 'same' as const, // Could track previous rank for change indicator
        }));
    }
    // Fallback to empty state (no mock data in production)
    return [];
  }, [serverEntries]);

  const maxEntries = config.maxEntries || 10;
  const displayEntries = entries.slice(0, maxEntries);
  const hasData = displayEntries.length > 0;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <TrophyIcon className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <TrophyIcon className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-muted-foreground font-mono">{rank}</span>;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">{config.title || 'Leaderboard'}</span>
        </div>

        <div className="divide-y divide-border">
          {hasData ? (
            displayEntries.map((entry: any, index: number) => (
              <motion.div
                key={entry.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, ...springPresets.snappy }}
                className={`px-6 py-3 flex items-center gap-4 ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
                }`}
              >
                <motion.div
                  className="flex items-center justify-center w-8"
                  initial={entry.rank <= 3 ? { scale: 0, rotate: -180 } : {}}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.05 + 0.1, ...springPresets.bouncy }}
                >
                  {getRankIcon(entry.rank)}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{entry.name}</div>
                  {config.showSubtitle && entry.subtitle && (
                    <div className="text-xs text-muted-foreground">{entry.subtitle}</div>
                  )}
                </div>

                {config.showScore !== false && (
                  <motion.div
                    className="text-right"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.15 }}
                  >
                    <div className="font-semibold tabular-nums">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {config.scoreLabel || 'pts'}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springPresets.gentle}
              className="px-6 py-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/15 to-amber-500/10 flex items-center justify-center mx-auto mb-4"
              >
                <TrophyIcon className="h-8 w-8 text-yellow-500/60" />
              </motion.div>
              <p className="font-medium text-foreground mb-1">No entries yet</p>
              <p className="text-sm text-muted-foreground">Be the first to score!</p>
            </motion.div>
          )}
        </div>

        {hasData && entries.length > maxEntries && (
          <div className="px-6 py-3 border-t border-border text-center">
            <Button variant="ghost" size="sm">
              View all {entries.length} entries
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TIMER ELEMENT (Stopwatch) - Premium flip-digit display
// ============================================================================

function StopwatchTimeUnit({
  value,
  label,
  isRunning,
}: {
  value: number;
  label: string;
  isRunning: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const paddedValue = value.toString().padStart(2, '0');
  const digits = paddedValue.split('');

  return (
    <div className="text-center">
      <div className="flex items-center justify-center">
        {digits.map((digit, i) => (
          <div key={`${label}-${i}`} className="relative h-[48px] w-[32px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={digit}
                initial={prefersReducedMotion ? false : { y: -48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { y: 48, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className={`absolute inset-0 flex items-center justify-center text-3xl font-bold tabular-nums ${
                  isRunning ? 'text-green-500' : 'text-foreground'
                }`}
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground uppercase mt-1">{label}</div>
    </div>
  );
}

export function TimerElement({ config, data, onAction }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();

  // Hydrate from server state
  const serverElapsed = (data?.elapsed as number) || 0;
  const serverIsRunning = (data?.isRunning as boolean) || false;
  const serverStartedAt = (data?.startedAt as string) || null;

  const [elapsed, setElapsed] = useState(serverElapsed);
  const [isRunning, setIsRunning] = useState(serverIsRunning);
  const [startTime, setStartTime] = useState<number | null>(
    serverStartedAt ? new Date(serverStartedAt).getTime() : null
  );
  const [lapTimes, setLapTimes] = useState<number[]>([]);
  const [justStarted, setJustStarted] = useState(false);

  // Sync with server state
  useEffect(() => {
    setElapsed(serverElapsed);
    setIsRunning(serverIsRunning);
    if (serverStartedAt) {
      setStartTime(new Date(serverStartedAt).getTime());
    }
  }, [serverElapsed, serverIsRunning, serverStartedAt]);

  // Clock tick with smooth updates
  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      setElapsed(serverElapsed + Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, startTime, serverElapsed]);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
    setJustStarted(true);
    setTimeout(() => setJustStarted(false), 500);
    onAction?.('start', { startedAt: new Date().toISOString() });
  };

  const handleStop = () => {
    setIsRunning(false);
    setStartTime(null);
    onAction?.('stop', { elapsed, stoppedAt: new Date().toISOString() });
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
    setLapTimes([]);
    onAction?.('reset', {});
  };

  const handleLap = () => {
    if (isRunning && elapsed > 0) {
      setLapTimes(prev => [...prev, elapsed]);
      onAction?.('lap', { lapTime: elapsed, lapNumber: lapTimes.length + 1 });
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { hrs, mins, secs, showHours: hrs > 0 || config.showHours };
  };

  const time = formatTime(elapsed);

  // Dynamic card styling based on state
  const cardClasses = isRunning
    ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
    : 'bg-gradient-to-br from-muted/30 to-muted/10';

  return (
    <motion.div
      initial={false}
      animate={justStarted ? { scale: [1, 1.02, 1] } : {}}
      transition={springPresets.bouncy}
    >
      <Card className={`overflow-hidden transition-all duration-300 ${cardClasses}`}>
        <CardContent className="p-6 text-center">
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            animate={isRunning && !prefersReducedMotion ? { opacity: [1, 0.7, 1] } : {}}
            transition={isRunning ? { duration: 1.5, repeat: Infinity } : {}}
          >
            <motion.div
              animate={isRunning && !prefersReducedMotion ? { rotate: [0, 360] } : {}}
              transition={isRunning ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
            >
              <ClockIcon className={`h-5 w-5 transition-colors duration-300 ${isRunning ? 'text-green-500' : 'text-primary'}`} />
            </motion.div>
            <span className="text-sm font-medium text-muted-foreground">
              {config.label || 'Stopwatch'}
            </span>
          </motion.div>

          {/* Flip-digit display */}
          <div className="flex items-center justify-center gap-1 mb-6">
            {time.showHours && (
              <>
                <StopwatchTimeUnit value={time.hrs} label="Hours" isRunning={isRunning} />
                <motion.div
                  className="text-2xl font-bold text-muted-foreground self-start mt-1"
                  animate={isRunning ? { opacity: [1, 0.3, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  :
                </motion.div>
              </>
            )}
            <StopwatchTimeUnit value={time.mins} label="Mins" isRunning={isRunning} />
            <motion.div
              className="text-2xl font-bold text-muted-foreground self-start mt-1"
              animate={isRunning ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.div>
            <StopwatchTimeUnit value={time.secs} label="Secs" isRunning={isRunning} />
          </div>

          {/* Control buttons with animations */}
          <div className="flex items-center justify-center gap-3">
            <AnimatePresence mode="wait">
              {!isRunning ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={springPresets.snappy}
                >
                  <Button
                    onClick={handleStart}
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <motion.span
                      className="flex items-center gap-1.5"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      ▶ Start
                    </motion.span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="stop"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={springPresets.snappy}
                  className="flex gap-2"
                >
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    size="sm"
                    className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                  >
                    ⏸ Stop
                  </Button>
                  {config.showLapTimes && (
                    <Button
                      onClick={handleLap}
                      variant="outline"
                      size="sm"
                      className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                    >
                      🏁 Lap
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              disabled={elapsed === 0 && !isRunning}
              className="text-muted-foreground hover:text-foreground"
            >
              ↺ Reset
            </Button>
          </div>

          {/* Lap times list with animations */}
          {config.showLapTimes && lapTimes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-border"
            >
              <div className="text-xs text-muted-foreground mb-2">Lap Times</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {lapTimes.map((lapTime, index) => {
                  const formatted = formatTime(lapTime);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between text-sm bg-muted/30 rounded px-2 py-1"
                    >
                      <span className="text-muted-foreground">Lap {index + 1}</span>
                      <span className="font-mono tabular-nums">
                        {formatted.showHours && `${formatted.hrs}:`}
                        {formatted.mins.toString().padStart(2, '0')}:
                        {formatted.secs.toString().padStart(2, '0')}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// COUNTER ELEMENT (increment/decrement) - Premium animated display
// ============================================================================

export function CounterElement({ config, data, onAction }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const serverCount = (data?.count as number) || config.initialValue || 0;
  const [count, setCount] = useState(serverCount);
  const [isUpdating, setIsUpdating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  // Sync with server state
  useEffect(() => {
    setCount(serverCount);
  }, [serverCount]);

  const handleIncrement = async () => {
    setIsUpdating(true);
    const step = config.step || 1;
    const newCount = count + step;

    // Respect max if set
    if (config.max !== undefined && newCount > config.max) {
      setIsUpdating(false);
      return;
    }

    setDirection('up');
    setCount(newCount);
    onAction?.('increment', { count: newCount, step });
    setIsUpdating(false);
    setTimeout(() => setDirection(null), 300);
  };

  const handleDecrement = async () => {
    setIsUpdating(true);
    const step = config.step || 1;
    const newCount = count - step;

    // Respect min if set
    if (config.min !== undefined && newCount < config.min) {
      setIsUpdating(false);
      return;
    }

    setDirection('down');
    setCount(newCount);
    onAction?.('decrement', { count: newCount, step });
    setIsUpdating(false);
    setTimeout(() => setDirection(null), 300);
  };

  const handleReset = async () => {
    const initialValue = config.initialValue || 0;
    setCount(initialValue);
    setDirection(null);
    onAction?.('reset', { count: initialValue });
  };

  // Calculate progress percentage if min/max are set
  const hasRange = config.min !== undefined && config.max !== undefined;
  const progressPercent = hasRange
    ? ((count - config.min) / (config.max - config.min)) * 100
    : 0;

  // Color based on progress
  const getProgressColor = () => {
    if (!hasRange) return 'bg-primary';
    if (progressPercent >= 90) return 'bg-green-500';
    if (progressPercent >= 70) return 'bg-emerald-500';
    if (progressPercent >= 30) return 'bg-blue-500';
    return 'bg-primary';
  };

  const atMin = config.min !== undefined && count <= config.min;
  const atMax = config.max !== undefined && count >= config.max;

  return (
    <motion.div
      initial={false}
      animate={direction ? { scale: [1, 1.02, 1] } : {}}
      transition={springPresets.snappy}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="p-6 text-center">
          <div className="text-sm font-medium text-muted-foreground mb-4">
            {config.label || 'Counter'}
          </div>

          <div className="flex items-center justify-center gap-4">
            <motion.div
              whileHover={!atMin ? { scale: 1.1 } : {}}
              whileTap={!atMin ? { scale: 0.9 } : {}}
              transition={springPresets.snappy}
            >
              <Button
                onClick={handleDecrement}
                variant="outline"
                size="icon"
                disabled={isUpdating || atMin}
                className={`h-12 w-12 rounded-full text-xl font-bold transition-colors ${
                  atMin ? 'opacity-30' : 'hover:border-red-500/50 hover:text-red-500'
                }`}
              >
                −
              </Button>
            </motion.div>

            <div className="min-w-[100px] relative">
              <motion.div
                className="text-5xl font-bold tabular-nums"
                animate={
                  direction && !prefersReducedMotion
                    ? {
                        color: direction === 'up' ? ['inherit', '#22c55e', 'inherit'] : ['inherit', '#ef4444', 'inherit'],
                      }
                    : {}
                }
                transition={{ duration: 0.3 }}
              >
                <AnimatedNumber
                  value={count}
                  springOptions={numberSpringPresets.bouncy}
                />
              </motion.div>

              {/* Direction indicator */}
              <AnimatePresence>
                {direction && !prefersReducedMotion && (
                  <motion.div
                    initial={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: direction === 'up' ? -10 : 10 }}
                    className={`absolute -right-2 top-1/2 -translate-y-1/2 text-lg ${
                      direction === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {direction === 'up' ? '↑' : '↓'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              whileHover={!atMax ? { scale: 1.1 } : {}}
              whileTap={!atMax ? { scale: 0.9 } : {}}
              transition={springPresets.snappy}
            >
              <Button
                onClick={handleIncrement}
                variant="outline"
                size="icon"
                disabled={isUpdating || atMax}
                className={`h-12 w-12 rounded-full text-xl font-bold transition-colors ${
                  atMax ? 'opacity-30' : 'hover:border-green-500/50 hover:text-green-500'
                }`}
              >
                +
              </Button>
            </motion.div>
          </div>

          {/* Progress bar for range */}
          {hasRange && (
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${getProgressColor()}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{config.min}</span>
                <span>{config.max}</span>
              </div>
            </div>
          )}

          {config.showReset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: count !== (config.initialValue || 0) ? 1 : 0.3 }}
            >
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="mt-4"
                disabled={count === (config.initialValue || 0)}
              >
                ↺ Reset to {config.initialValue || 0}
              </Button>
            </motion.div>
          )}

          {(config.min !== undefined || config.max !== undefined) && !hasRange && (
            <div className="mt-3 text-xs text-muted-foreground">
              {config.min !== undefined && `Min: ${config.min}`}
              {config.min !== undefined && config.max !== undefined && ' • '}
              {config.max !== undefined && `Max: ${config.max}`}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// RSVP BUTTON ELEMENT
// ============================================================================

export function RsvpButtonElement({ id, config, data, sharedState, userState, onChange, onAction }: ElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'rsvp';

  const getRsvpCountFromSharedState = (): number => {
    const counterKey = `${instanceId}:total`;
    return sharedState?.counters?.[counterKey] || 0;
  };

  const getAttendeeCountFromSharedState = (): number => {
    const collectionKey = `${instanceId}:attendees`;
    const attendees = sharedState?.collections?.[collectionKey] || {};
    return Object.keys(attendees).length;
  };

  const getWaitlistCountFromSharedState = (): number => {
    const collectionKey = `${instanceId}:waitlist`;
    const waitlist = sharedState?.collections?.[collectionKey] || {};
    return Object.keys(waitlist).length;
  };

  const getUserRsvpFromUserState = (): boolean => {
    const participationKey = `${instanceId}:hasRsvped`;
    return userState?.participation?.[participationKey] || false;
  };

  const getUserWaitlistFromUserState = (): boolean => {
    const waitlistKey = `${instanceId}:onWaitlist`;
    return userState?.participation?.[waitlistKey] || false;
  };

  const getUserWaitlistPositionFromUserState = (): number | null => {
    const positionKey = `${instanceId}:waitlistPosition`;
    const position = userState?.selections?.[positionKey];
    return typeof position === 'number' ? position : null;
  };

  const hasSharedState = sharedState && (
    Object.keys(sharedState.counters || {}).length > 0 ||
    Object.keys(sharedState.collections || {}).length > 0
  );

  const serverAttendees = (data?.attendees as Record<string, unknown>) || {};
  const serverCount = (data?.count as number) || 0;
  const serverWaitlist = (data?.waitlist as string[]) || [];
  const serverUserRsvp = (data?.userRsvp as string) || null;
  const serverUserOnWaitlist = (data?.userOnWaitlist as boolean) || false;
  const serverUserWaitlistPosition = (data?.userWaitlistPosition as number) || null;

  const initialCount = hasSharedState
    ? (getRsvpCountFromSharedState() || getAttendeeCountFromSharedState())
    : (serverCount || Object.keys(serverAttendees).length);
  const initialIsRsvped = hasSharedState ? getUserRsvpFromUserState() : serverUserRsvp === 'yes';
  const initialIsOnWaitlist = hasSharedState ? getUserWaitlistFromUserState() : serverUserOnWaitlist;
  const initialWaitlistPosition = hasSharedState ? getUserWaitlistPositionFromUserState() : serverUserWaitlistPosition;
  const initialWaitlistCount = hasSharedState ? getWaitlistCountFromSharedState() : serverWaitlist.length;

  const [isRsvped, setIsRsvped] = useState(initialIsRsvped);
  const [rsvpCount, setRsvpCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [justRsvped, setJustRsvped] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(initialIsOnWaitlist);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(initialWaitlistPosition);
  const [waitlistCount, setWaitlistCount] = useState(initialWaitlistCount);
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);
  const [justJoinedWaitlist, setJustJoinedWaitlist] = useState(false);

  useEffect(() => {
    if (hasSharedState) {
      const count = getRsvpCountFromSharedState() || getAttendeeCountFromSharedState();
      setRsvpCount(count);
      setIsRsvped(getUserRsvpFromUserState());
      setIsOnWaitlist(getUserWaitlistFromUserState());
      setWaitlistPosition(getUserWaitlistPositionFromUserState());
      setWaitlistCount(getWaitlistCountFromSharedState());
    } else {
      const count = serverCount || Object.keys(serverAttendees).length;
      setRsvpCount(count);
      setIsRsvped(serverUserRsvp === 'yes');
      setIsOnWaitlist(serverUserOnWaitlist);
      setWaitlistPosition(serverUserWaitlistPosition);
      setWaitlistCount(serverWaitlist.length);
    }
  }, [sharedState?.counters, sharedState?.collections, sharedState?.version, userState?.participation, userState?.selections]);

  const maxAttendees = config.maxAttendees || null;
  const isFull = maxAttendees && rsvpCount >= maxAttendees;
  const capacityPercentage = maxAttendees ? Math.min(100, (rsvpCount / maxAttendees) * 100) : 0;
  const isNearlyFull = capacityPercentage >= 80;
  const spotsLeft = maxAttendees ? maxAttendees - rsvpCount : null;

  const handleRsvp = async () => {
    if ((isFull && !isRsvped) || isLoading) return;

    setIsLoading(true);
    const newState = !isRsvped;

    setIsRsvped(newState);
    setRsvpCount((prev: number) => (newState ? prev + 1 : Math.max(0, prev - 1)));

    if (newState) {
      setJustRsvped(true);
      setTimeout(() => setJustRsvped(false), 1500);
    }

    onChange?.({ isRsvped: newState, rsvpCount: rsvpCount + (newState ? 1 : -1) });
    onAction?.(newState ? 'rsvp' : 'cancel_rsvp', {
      response: newState ? 'yes' : 'no',
      eventName: config.eventName
    });

    setIsLoading(false);
  };

  const handleWaitlistToggle = async () => {
    if (isWaitlistLoading) return;

    setIsWaitlistLoading(true);
    const newState = !isOnWaitlist;

    setIsOnWaitlist(newState);
    if (newState) {
      const newPosition = waitlistCount + 1;
      setWaitlistPosition(newPosition);
      setWaitlistCount((prev: number) => prev + 1);
      setJustJoinedWaitlist(true);
      setTimeout(() => setJustJoinedWaitlist(false), 1500);
    } else {
      setWaitlistPosition(null);
      setWaitlistCount((prev: number) => Math.max(0, prev - 1));
    }

    onChange?.({
      isOnWaitlist: newState,
      waitlistPosition: newState ? (waitlistCount + 1) : null,
      waitlistCount: waitlistCount + (newState ? 1 : -1),
    });
    onAction?.(newState ? 'join_waitlist' : 'leave_waitlist', {
      eventName: config.eventName,
      position: newState ? (waitlistCount + 1) : null,
    });

    setIsWaitlistLoading(false);
  };

  const getCapacityColor = () => {
    if (isFull) return 'bg-red-500';
    if (capacityPercentage >= 90) return 'bg-orange-500';
    if (capacityPercentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <motion.div
      initial={false}
      animate={justRsvped ? { scale: [1, 1.02, 1] } : {}}
      transition={springPresets.bouncy}
    >
      <Card
        className={`overflow-hidden transition-all duration-300 ${
          isRsvped ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : ''
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{config.eventName || 'Event'}</div>
              {config.eventDate && (
                <div className="text-sm text-muted-foreground">{config.eventDate}</div>
              )}
            </div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={springPresets.snappy}
            >
              <Button
                onClick={handleRsvp}
                disabled={isLoading || (isFull && !isRsvped)}
                variant={isRsvped ? 'outline' : 'default'}
                className={`relative overflow-hidden ${
                  isRsvped ? 'border-green-500 text-green-600 hover:bg-green-500/10' : ''
                }`}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"
                      />
                      ...
                    </motion.span>
                  ) : isRsvped ? (
                    <motion.span
                      key="going"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={springPresets.bouncy}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                      </motion.div>
                      Going
                    </motion.span>
                  ) : (
                    <motion.span
                      key="rsvp"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center"
                    >
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      RSVP
                    </motion.span>
                  )}
                </AnimatePresence>

                {justRsvped && !prefersReducedMotion && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: 0,
                          scale: 1,
                          x: (Math.random() - 0.5) * 60,
                          y: (Math.random() - 0.5) * 40 - 20,
                        }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="absolute text-xs"
                        style={{ left: '50%', top: '50%' }}
                      >
                        {['✨', '🎉', '🎊', '⭐', '💫', '🌟'][i]}
                      </motion.span>
                    ))}
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {maxAttendees && config.showCount !== false && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Capacity</span>
                <motion.span
                  className={`font-medium ${isFull ? 'text-red-500' : isNearlyFull ? 'text-amber-500' : 'text-muted-foreground'}`}
                  animate={isNearlyFull && !prefersReducedMotion ? { opacity: [1, 0.7, 1] } : {}}
                  transition={isNearlyFull ? { duration: 1.5, repeat: Infinity } : {}}
                >
                  <AnimatedNumber value={rsvpCount} springOptions={numberSpringPresets.quick} />/{maxAttendees}
                </motion.span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full rounded-full ${getCapacityColor()} ${
                    isNearlyFull ? 'shadow-[0_0_8px_currentColor]' : ''
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${capacityPercentage}%` }}
                  transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
                />
              </div>
            </div>
          )}

          {config.showCount !== false && (
            <motion.div
              className="mt-3 flex items-center justify-between text-sm"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-muted-foreground flex items-center gap-1">
                <UsersIcon className="h-4 w-4" />
                <AnimatedNumber value={rsvpCount} springOptions={numberSpringPresets.quick} />
                {' '}{rsvpCount === 1 ? 'person' : 'people'} going
              </span>
              {maxAttendees && spotsLeft !== null && (
                <motion.span
                  className={`font-medium ${isFull ? 'text-red-500' : spotsLeft <= 3 ? 'text-amber-500' : 'text-muted-foreground'}`}
                  animate={spotsLeft <= 3 && spotsLeft > 0 && !prefersReducedMotion ? { scale: [1, 1.05, 1] } : {}}
                  transition={spotsLeft <= 3 ? { duration: 0.8, repeat: Infinity } : {}}
                >
                  {isFull ? '🔒 Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                </motion.span>
              )}
            </motion.div>
          )}

          <AnimatePresence>
            {isFull && !isRsvped && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={springPresets.gentle}
                className="overflow-hidden"
              >
                <motion.button
                  onClick={handleWaitlistToggle}
                  disabled={isWaitlistLoading}
                  className={`w-full p-3 text-sm rounded-lg text-center border transition-all duration-200 ${
                    isOnWaitlist
                      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15'
                  }`}
                  whileHover={!isWaitlistLoading ? { scale: 1.01 } : {}}
                  whileTap={!isWaitlistLoading ? { scale: 0.99 } : {}}
                  animate={justJoinedWaitlist && !prefersReducedMotion ? { scale: [1, 1.02, 1] } : {}}
                  aria-label={isOnWaitlist ? 'Leave waitlist' : 'Join waitlist'}
                >
                  <AnimatePresence mode="wait">
                    {isWaitlistLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                        />
                        <span>Processing...</span>
                      </motion.span>
                    ) : isOnWaitlist ? (
                      <motion.span
                        key="on-waitlist"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="flex items-center gap-2">
                          <CheckIcon className="h-4 w-4" />
                          <span className="font-medium">On Waitlist</span>
                        </span>
                        {waitlistPosition && (
                          <span className="text-xs opacity-80">
                            Position #{waitlistPosition} of {waitlistCount}
                          </span>
                        )}
                        <span className="text-xs opacity-60 mt-0.5">Click to leave waitlist</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="join"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>Join Waitlist</span>
                        </span>
                        {waitlistCount > 0 && (
                          <span className="text-xs opacity-70">
                            {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} waiting
                          </span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {justJoinedWaitlist && !prefersReducedMotion && (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                          animate={{
                            opacity: 0,
                            scale: 1,
                            x: (Math.random() - 0.5) * 40,
                            y: (Math.random() - 0.5) * 30 - 10,
                          }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className="absolute text-xs"
                          style={{ left: '50%', top: '50%' }}
                        >
                          {['📋', '✨', '🎯', '👍'][i]}
                        </motion.span>
                      ))}
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
