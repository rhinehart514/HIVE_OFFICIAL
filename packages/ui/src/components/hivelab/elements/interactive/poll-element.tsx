'use client';

/**
 * Poll Element - Refactored with Core Abstractions
 *
 * This is the canonical implementation using:
 * - usePollState hook for state management
 * - StateContainer for loading/error/empty states
 * - ElementWrapper for edit/runtime mode separation
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import { CheckIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets, easingArrays } from '@hive/tokens';

import { Card, CardContent } from '../../../../design-system/primitives';
import { AnimatedNumber, numberSpringPresets } from '../../../motion-primitives/animated-number';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { usePollState, StateContainer, type ElementMode } from '../core';

// Alias for lucide compatibility
const Vote = HandThumbUpIcon;

// ============================================================
// Types
// ============================================================

interface PollOption {
  id: string;
  label: string;
  color?: string;
}

interface PollConfig {
  question?: string;
  options?: unknown[];
  showResultsBeforeVoting?: boolean;
  allowChangeVote?: boolean;
  deadline?: string;
  anonymousVoting?: boolean;
}

interface PollElementProps extends ElementProps {
  config: PollConfig;
  mode?: ElementMode;
}

// ============================================================
// Helpers
// ============================================================

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

// ============================================================
// Poll Option Button
// ============================================================

interface PollOptionButtonProps {
  option: PollOption;
  index: number;
  voteCount: number;
  totalVotes: number;
  isSelected: boolean;
  isWinning: boolean;
  showResults: boolean;
  wasJustVoted: boolean;
  disabled: boolean;
  onClick: () => void;
}

function PollOptionButton({
  option,
  index,
  voteCount,
  totalVotes,
  isSelected,
  isWinning,
  showResults,
  wasJustVoted,
  disabled,
  onClick,
}: PollOptionButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={false}
      animate={wasJustVoted ? { scale: [1, 0.98, 1.02, 1] } : { scale: 1 }}
      whileHover={!disabled ? { opacity: 0.9 } : {}}
      whileTap={!disabled ? { opacity: 0.8 } : {}}
      transition={springPresets.snappy}
      className={`w-full text-left p-3 rounded-lg border transition-colors relative overflow-hidden ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
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
                  delay: index * 0.05,
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
            className="text-sm font-sans text-muted-foreground tabular-nums"
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
}

// ============================================================
// Main Poll Element
// ============================================================

export function PollElement({
  id,
  config,
  data,
  onChange,
  onAction,
  sharedState,
  userState,
  mode = 'runtime',
}: PollElementProps) {
  const prefersReducedMotion = useReducedMotion();

  // Normalize options
  const rawOptions = config.options || ['Option A', 'Option B', 'Option C'];
  const options = normalizePollOptions(rawOptions);

  // Use the centralized poll state hook
  const pollState = usePollState(id, options, sharedState, userState);

  // Local UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVoted, setJustVoted] = useState<string | null>(null);

  // Derived state - prefer hook state, fall back to legacy data
  const voteCounts = pollState.value?.voteCounts ?? {};
  const userVote = pollState.value?.userVote ?? (data?.userVote as string | null);
  const totalVotes = pollState.value?.totalVotes ?? (data?.totalVotes as number | undefined) ?? 0;
  const hasVoted = !!userVote;

  const showResults = config.showResultsBeforeVoting || hasVoted;
  const maxVotes = Math.max(...Object.values(voteCounts), 0);

  const handleVote = useCallback(async (optionId: string) => {
    if ((hasVoted && !config.allowChangeVote) || isSubmitting) return;

    setIsSubmitting(true);
    setJustVoted(optionId);

    // Call action handlers
    onChange?.({ selectedOption: optionId });
    onAction?.('vote', { optionId });

    setIsSubmitting(false);
    setTimeout(() => setJustVoted(null), 600);
  }, [hasVoted, config.allowChangeVote, isSubmitting, onChange, onAction]);

  return (
    <StateContainer
      status={pollState.status}
      emptyMessage="No votes yet"
      emptyDescription="Be the first to vote!"
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
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

          {/* Options */}
          <div className="space-y-3">
            {options.map((option, index) => {
              const voteCount = voteCounts[option.id] || 0;
              const isSelected = userVote === option.id;
              const isWinning = showResults && voteCount === maxVotes && voteCount > 0;

              return (
                <PollOptionButton
                  key={option.id}
                  option={option}
                  index={index}
                  voteCount={voteCount}
                  totalVotes={totalVotes}
                  isSelected={isSelected}
                  isWinning={isWinning}
                  showResults={showResults}
                  wasJustVoted={justVoted === option.id}
                  disabled={(hasVoted && !config.allowChangeVote) || isSubmitting}
                  onClick={() => handleVote(option.id)}
                />
              );
            })}
          </div>

          {/* Footer */}
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
    </StateContainer>
  );
}

export default PollElement;
