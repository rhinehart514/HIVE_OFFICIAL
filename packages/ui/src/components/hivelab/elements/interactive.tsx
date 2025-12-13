'use client';

/**
 * Interactive HiveLab Elements - Engagement components
 *
 * Elements that drive user engagement: polls, timers, counters, leaderboards.
 * Split from element-renderers.tsx for better maintainability.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Timer,
  Vote,
  Trophy,
  Check,
  Crown,
  Medal,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets, easingArrays } from '@hive/tokens';

import {
  Button,
  Card,
  CardContent,
} from '../../../atomic';

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
              <Timer className={`h-5 w-5 transition-colors duration-300 ${iconColorClasses[urgencyLevel]}`} />
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

export function PollElement({ config, data, onChange, onAction }: ElementProps) {
  const rawOptions = config.options || ['Option A', 'Option B', 'Option C'];
  const options = normalizePollOptions(rawOptions);
  const prefersReducedMotion = useReducedMotion();

  // Hydrate from server state (data prop) or initialize empty
  const serverResponses = (data?.responses as Record<string, { choice: string }>) || {};
  const serverTotalVotes = (data?.totalVotes as number) || 0;
  const serverUserVote = (data?.userVote as string) || null;

  // Calculate vote counts from server responses
  const calculateVoteCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    options.forEach((opt) => { counts[opt.id] = 0; });
    Object.values(serverResponses).forEach((response) => {
      if (response?.choice && counts[response.choice] !== undefined) {
        counts[response.choice]++;
      }
    });
    return counts;
  };

  const [votes, setVotes] = useState<Record<string, number>>(calculateVoteCounts);
  const [userVote, setUserVote] = useState<string | null>(serverUserVote);
  const [hasVoted, setHasVoted] = useState(!!serverUserVote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVoted, setJustVoted] = useState<string | null>(null);

  // Sync with server state when data changes
  useEffect(() => {
    setVotes(calculateVoteCounts());
    if (serverUserVote) {
      setUserVote(serverUserVote);
      setHasVoted(true);
    }
  }, [data?.responses, data?.totalVotes, serverUserVote]);

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
    onAction?.('vote', { choice: optionId });

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
                          <Check className="h-4 w-4 text-primary" />
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
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-muted-foreground font-mono">{rank}</span>;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">{config.title || 'Leaderboard'}</span>
        </div>

        <div className="divide-y divide-border">
          {hasData ? (
            displayEntries.map((entry: any, index: number) => (
              <div
                key={entry.id || index}
                className={`px-6 py-3 flex items-center gap-4 ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{entry.name}</div>
                  {config.showSubtitle && entry.subtitle && (
                    <div className="text-xs text-muted-foreground">{entry.subtitle}</div>
                  )}
                </div>

                {config.showScore !== false && (
                  <div className="text-right">
                    <div className="font-semibold tabular-nums">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {config.scoreLabel || 'pts'}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No entries yet. Be the first to score!</p>
            </div>
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
// TIMER ELEMENT (Stopwatch)
// ============================================================================

export function TimerElement({ config, data, onAction }: ElementProps) {
  // Hydrate from server state
  const serverElapsed = (data?.elapsed as number) || 0;
  const serverIsRunning = (data?.isRunning as boolean) || false;
  const serverStartedAt = (data?.startedAt as string) || null;

  const [elapsed, setElapsed] = useState(serverElapsed);
  const [isRunning, setIsRunning] = useState(serverIsRunning);
  const [startTime, setStartTime] = useState<number | null>(
    serverStartedAt ? new Date(serverStartedAt).getTime() : null
  );

  // Sync with server state
  useEffect(() => {
    setElapsed(serverElapsed);
    setIsRunning(serverIsRunning);
    if (serverStartedAt) {
      setStartTime(new Date(serverStartedAt).getTime());
    }
  }, [serverElapsed, serverIsRunning, serverStartedAt]);

  // Timer tick
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
    onAction?.('reset', {});
  };

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`${isRunning ? 'border-green-500/50 bg-green-500/5' : ''}`}>
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Timer className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {config.label || 'Timer'}
          </span>
        </div>

        <div className="text-5xl font-bold tabular-nums mb-6">
          {formatElapsed(elapsed)}
        </div>

        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button onClick={handleStart} variant="default" size="sm">
              Start
            </Button>
          ) : (
            <Button onClick={handleStop} variant="outline" size="sm">
              Stop
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            disabled={elapsed === 0 && !isRunning}
          >
            Reset
          </Button>
        </div>

        {config.showLapTimes && (
          <div className="mt-4 text-xs text-muted-foreground">
            Lap times can be tracked here
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COUNTER ELEMENT (increment/decrement)
// ============================================================================

export function CounterElement({ config, data, onAction }: ElementProps) {
  const serverCount = (data?.count as number) || config.initialValue || 0;
  const [count, setCount] = useState(serverCount);
  const [isUpdating, setIsUpdating] = useState(false);

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

    setCount(newCount);
    onAction?.('increment', { count: newCount, step });
    setIsUpdating(false);
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

    setCount(newCount);
    onAction?.('decrement', { count: newCount, step });
    setIsUpdating(false);
  };

  const handleReset = async () => {
    const initialValue = config.initialValue || 0;
    setCount(initialValue);
    onAction?.('reset', { count: initialValue });
  };

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="text-sm font-medium text-muted-foreground mb-4">
          {config.label || 'Counter'}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleDecrement}
            variant="outline"
            size="sm"
            disabled={isUpdating || (config.min !== undefined && count <= config.min)}
          >
            −
          </Button>

          <div className="text-4xl font-bold tabular-nums min-w-[80px]">
            {count}
          </div>

          <Button
            onClick={handleIncrement}
            variant="outline"
            size="sm"
            disabled={isUpdating || (config.max !== undefined && count >= config.max)}
          >
            +
          </Button>
        </div>

        {config.showReset && (
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="mt-4"
            disabled={count === (config.initialValue || 0)}
          >
            Reset
          </Button>
        )}

        {(config.min !== undefined || config.max !== undefined) && (
          <div className="mt-3 text-xs text-muted-foreground">
            {config.min !== undefined && `Min: ${config.min}`}
            {config.min !== undefined && config.max !== undefined && ' • '}
            {config.max !== undefined && `Max: ${config.max}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
