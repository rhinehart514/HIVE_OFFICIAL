'use client';

import { Zap, XCircle, CheckCircle, Flame, Clock, Trophy, Users, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { Badge } from '../../00-Global/atoms/badge';
import { Button } from '../../00-Global/atoms/button';
import { Card } from '../../00-Global/atoms/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';

export interface SurvivalCompetitor {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  votes: number;
  isEliminated?: boolean;
}

export interface SurvivalMatchup {
  id: string;
  competitor1: SurvivalCompetitor;
  competitor2: SurvivalCompetitor;
  status: 'upcoming' | 'active' | 'completed';
  eliminated?: string;
  roundNumber?: number;
  endsAt?: string;
}

export interface RitualSurvivalProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The ritual data - when provided, extracts config automatically */
  ritual?: {
    id: string;
    title: string;
    subtitle?: string;
    startsAt: string;
    endsAt: string;
    phase: string;
    config?: {
      eliminationRounds?: number;
      votingDuration?: number; // minutes
    };
    metrics?: {
      participants?: number;
      eliminatedCount?: number;
    };
  };
  /** Title override */
  title?: string;
  /** Current round name */
  roundName?: string;
  /** Time remaining in current voting period */
  timeRemaining?: string;
  /** Current matchups */
  currentMatchups?: SurvivalMatchup[];
  /** Number of eliminated participants */
  eliminatedCount?: number;
  /** Number of survivors */
  survivorsCount?: number;
  /** Vote callback */
  onVote?: (matchupId: string, competitorId: string) => void;
  /** Whether the ritual is live */
  isLive?: boolean;
  /** Whether user is participating */
  isParticipating?: boolean;
  /** User's current vote in matchup (matchupId -> competitorId) */
  userVotes?: Record<string, string>;
  /** Whether voting is in progress */
  isVoting?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const RitualSurvival: React.FC<RitualSurvivalProps> = ({
  ritual,
  title,
  roundName = 'Round 1',
  timeRemaining,
  currentMatchups = [],
  eliminatedCount = 0,
  survivorsCount = 0,
  onVote,
  isLive = false,
  isParticipating = false,
  userVotes = {},
  isVoting = false,
  className,
  ...props
}) => {
  const displayTitle = title ?? ritual?.title ?? 'Survival Mode';
  const eliminated = eliminatedCount || ritual?.metrics?.eliminatedCount || 0;
  const survivors = survivorsCount || (ritual?.metrics?.participants || 0) - eliminated;

  // Check ritual status
  const now = new Date();
  const startsAt = ritual?.startsAt ? new Date(ritual.startsAt) : null;
  const endsAt = ritual?.endsAt ? new Date(ritual.endsAt) : null;
  const isActive = ritual?.phase === 'active' || (isLive && startsAt && now >= startsAt);
  const hasEnded = ritual?.phase === 'ended' || (endsAt && now > endsAt);

  // Calculate time remaining for active matchups
  const getMatchupTimeRemaining = React.useCallback((matchup: SurvivalMatchup) => {
    if (matchup.endsAt) {
      const endsAt = new Date(matchup.endsAt);
      const diff = endsAt.getTime() - now.getTime();
      if (diff <= 0) return 'Ended';
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return timeRemaining;
  }, [timeRemaining, now]);

  return (
    <Card className={cn('border-white/10 bg-white/5 p-6', className)} {...props}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="text-xl font-semibold text-white">{displayTitle}</h3>
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Zap className="mr-1 h-3 w-3" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-white/60">{roundName}</p>
        </div>
        {timeRemaining && isActive && (
          <div className="text-right">
            <motion.div
              className="text-2xl font-bold text-orange-400"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {timeRemaining}
            </motion.div>
            <div className="text-xs text-white/50">remaining</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-400">
            <XCircle className="h-5 w-5" />
            {eliminated}
          </div>
          <div className="text-xs text-white/60">Eliminated</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-400">
            <Shield className="h-5 w-5" />
            {survivors}
          </div>
          <div className="text-xs text-white/60">Surviving</div>
        </motion.div>
      </div>

      {/* Participation status */}
      {isParticipating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400"
        >
          <CheckCircle className="h-4 w-4" />
          You're participating in this survival ritual
        </motion.div>
      )}

      {/* Live Matchups */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {currentMatchups.map((matchup, index) => {
            const userVote = userVotes[matchup.id];
            const totalVotes = matchup.competitor1.votes + matchup.competitor2.votes;
            const c1Percent = totalVotes > 0 ? (matchup.competitor1.votes / totalVotes) * 100 : 50;
            const c2Percent = totalVotes > 0 ? (matchup.competitor2.votes / totalVotes) * 100 : 50;

            return (
              <motion.div
                key={matchup.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'rounded-xl border p-4',
                  matchup.status === 'active'
                    ? 'border-orange-500/40 bg-orange-500/5'
                    : matchup.status === 'completed'
                      ? 'border-white/5 bg-white/[0.02]'
                      : 'border-white/10 bg-white/5'
                )}
              >
                {/* Matchup header */}
                <div className="mb-3 flex items-center justify-between">
                  <Badge
                    variant={matchup.status === 'active' ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      matchup.status === 'active' && 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    )}
                  >
                    {matchup.status === 'active' ? (
                      <>
                        <Flame className="mr-1 h-3 w-3" />
                        Voting Now
                      </>
                    ) : matchup.status === 'completed' ? (
                      'Completed'
                    ) : (
                      <>
                        <Clock className="mr-1 h-3 w-3" />
                        Upcoming
                      </>
                    )}
                  </Badge>
                  {matchup.status === 'active' && (
                    <span className="text-xs text-white/50">
                      {getMatchupTimeRemaining(matchup)}
                    </span>
                  )}
                </div>

                {/* Vote progress bar (only for active/completed) */}
                {(matchup.status === 'active' || matchup.status === 'completed') && totalVotes > 0 && (
                  <div className="mb-4 h-2 flex overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="bg-blue-500"
                      initial={{ width: '50%' }}
                      animate={{ width: `${c1Percent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.div
                      className="bg-purple-500"
                      initial={{ width: '50%' }}
                      animate={{ width: `${c2Percent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}

                {/* Competitors */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                  {/* Competitor 1 */}
                  <motion.div
                    whileHover={matchup.status === 'active' && !userVote ? { scale: 1.02 } : {}}
                    className={cn(
                      'rounded-lg border p-3 transition-all',
                      matchup.eliminated === matchup.competitor1.id
                        ? 'border-red-500/40 bg-red-500/10 opacity-50'
                        : userVote === matchup.competitor1.id
                          ? 'border-blue-500/40 bg-blue-500/10 ring-2 ring-blue-500/30'
                          : 'border-white/20 bg-black/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        {matchup.competitor1.avatarUrl && (
                          <AvatarImage src={matchup.competitor1.avatarUrl} />
                        )}
                        <AvatarFallback className="bg-blue-500/20 text-xs">
                          {(matchup.competitor1.displayName || matchup.competitor1.name).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium text-white">
                        {matchup.competitor1.displayName || matchup.competitor1.name}
                      </span>
                    </div>
                    <div className="mb-2 text-xl font-bold text-white/90">
                      {matchup.competitor1.votes} votes
                    </div>
                    {matchup.status === 'active' && onVote && !userVote && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => onVote(matchup.id, matchup.competitor1.id)}
                        disabled={isVoting}
                      >
                        Vote
                      </Button>
                    )}
                    {userVote === matchup.competitor1.id && (
                      <div className="flex items-center justify-center gap-1 text-xs text-blue-400">
                        <CheckCircle className="h-3 w-3" />
                        Your vote
                      </div>
                    )}
                  </motion.div>

                  {/* VS Divider */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-lg font-bold text-white/30">VS</div>
                  </div>

                  {/* Competitor 2 */}
                  <motion.div
                    whileHover={matchup.status === 'active' && !userVote ? { scale: 1.02 } : {}}
                    className={cn(
                      'rounded-lg border p-3 transition-all',
                      matchup.eliminated === matchup.competitor2.id
                        ? 'border-red-500/40 bg-red-500/10 opacity-50'
                        : userVote === matchup.competitor2.id
                          ? 'border-purple-500/40 bg-purple-500/10 ring-2 ring-purple-500/30'
                          : 'border-white/20 bg-black/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        {matchup.competitor2.avatarUrl && (
                          <AvatarImage src={matchup.competitor2.avatarUrl} />
                        )}
                        <AvatarFallback className="bg-purple-500/20 text-xs">
                          {(matchup.competitor2.displayName || matchup.competitor2.name).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium text-white">
                        {matchup.competitor2.displayName || matchup.competitor2.name}
                      </span>
                    </div>
                    <div className="mb-2 text-xl font-bold text-white/90">
                      {matchup.competitor2.votes} votes
                    </div>
                    {matchup.status === 'active' && onVote && !userVote && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        onClick={() => onVote(matchup.id, matchup.competitor2.id)}
                        disabled={isVoting}
                      >
                        Vote
                      </Button>
                    )}
                    {userVote === matchup.competitor2.id && (
                      <div className="flex items-center justify-center gap-1 text-xs text-purple-400">
                        <CheckCircle className="h-3 w-3" />
                        Your vote
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Elimination result */}
                {matchup.eliminated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2 text-sm text-red-400"
                  >
                    <XCircle className="h-4 w-4" />
                    {matchup.competitor1.id === matchup.eliminated
                      ? matchup.competitor1.displayName || matchup.competitor1.name
                      : matchup.competitor2.displayName || matchup.competitor2.name}{' '}
                    eliminated
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {currentMatchups.length === 0 && (
        <div className="py-12 text-center">
          {hasEnded ? (
            <>
              <Trophy className="mx-auto mb-3 h-12 w-12 text-[#FFD700]" />
              <p className="text-lg font-medium text-white">Survival Complete!</p>
              <p className="text-sm text-white/50">{survivors} survivors made it through</p>
            </>
          ) : isActive ? (
            <>
              <Clock className="mx-auto mb-3 h-12 w-12 text-white/30" />
              <p className="text-sm text-white/50">Next round starting soon...</p>
            </>
          ) : (
            <>
              <Flame className="mx-auto mb-3 h-12 w-12 text-white/30" />
              <p className="text-sm text-white/50">Matchups will appear when the ritual begins</p>
              {startsAt && now < startsAt && (
                <p className="mt-1 text-xs text-white/30">
                  Starts {startsAt.toLocaleDateString()}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};
