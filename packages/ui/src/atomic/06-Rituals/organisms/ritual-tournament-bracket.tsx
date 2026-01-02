'use client';

import { Trophy, Clock, CheckCircle, Crown, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { Badge } from '../../00-Global/atoms/badge';
import { Button } from '../../00-Global/atoms/button';
import { Card } from '../../00-Global/atoms/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';

export interface TournamentCompetitor {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  seed?: number;
}

export interface TournamentMatchup {
  id: string;
  round: number;
  position: number;
  competitorA?: TournamentCompetitor;
  competitorB?: TournamentCompetitor;
  votesA?: number;
  votesB?: number;
  winner?: string;
  status: 'upcoming' | 'active' | 'completed';
}

export interface RitualTournamentBracketProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The ritual data */
  ritual?: {
    id: string;
    title: string;
    subtitle?: string;
    startsAt: string;
    endsAt: string;
    phase: string;
    config?: {
      bracketSize?: number;
      votingDuration?: number;
    };
    metrics?: {
      participants?: number;
    };
  };
  /** Title override */
  title?: string;
  /** All matchups in the tournament */
  matchups?: TournamentMatchup[];
  /** Currently active round */
  currentRound?: number;
  /** Total number of rounds */
  totalRounds?: number;
  /** Vote callback */
  onVote?: (matchupId: string, competitorId: string) => void;
  /** Whether user is participating */
  isParticipating?: boolean;
  /** User's votes (matchupId -> competitorId) */
  userVotes?: Record<string, string>;
  /** Whether voting is in progress */
  isVoting?: boolean;
  /** The champion (if tournament ended) */
  champion?: TournamentCompetitor;
}

const matchupVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const RitualTournamentBracket: React.FC<RitualTournamentBracketProps> = ({
  ritual,
  title,
  matchups = [],
  currentRound,
  totalRounds,
  onVote,
  isParticipating = false,
  userVotes = {},
  isVoting = false,
  champion,
  className,
  ...props
}) => {
  const displayTitle = title ?? ritual?.title ?? 'Tournament Bracket';

  // Group matchups by round
  const rounds = React.useMemo(() => {
    const grouped: Record<number, TournamentMatchup[]> = {};
    matchups.forEach((m) => {
      if (!grouped[m.round]) {
        grouped[m.round] = [];
      }
      grouped[m.round].push(m);
    });

    return Object.entries(grouped)
      .map(([r, ms]) => ({
        round: Number(r),
        matchups: ms.sort((a, b) => a.position - b.position),
      }))
      .sort((a, b) => a.round - b.round);
  }, [matchups]);

  const numRounds = totalRounds || rounds.length || 1;
  const activeRound = currentRound || rounds.find(r => r.matchups.some(m => m.status === 'active'))?.round;

  // Check ritual status
  const now = new Date();
  const startsAt = ritual?.startsAt ? new Date(ritual.startsAt) : null;
  const endsAt = ritual?.endsAt ? new Date(ritual.endsAt) : null;
  const hasEnded = ritual?.phase === 'ended' || (endsAt && now > endsAt);
  const isActive = ritual?.phase === 'active' || (startsAt && now >= startsAt && !hasEnded);

  // Round names
  const getRoundName = (round: number, total: number) => {
    if (round === total) return 'Finals';
    if (round === total - 1) return 'Semi-Finals';
    if (round === total - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  };

  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#FFD700]" />
            <h3 className="text-xl font-semibold text-white">{displayTitle}</h3>
          </div>
          {ritual?.subtitle && (
            <p className="mt-1 text-sm text-white/60">{ritual.subtitle}</p>
          )}
        </div>
        {isActive && activeRound && (
          <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30">
            <Zap className="mr-1 h-3 w-3" />
            {getRoundName(activeRound, numRounds)} Active
          </Badge>
        )}
      </div>

      {/* Participation status */}
      {isParticipating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400"
        >
          <CheckCircle className="h-4 w-4" />
          You're participating in this tournament
        </motion.div>
      )}

      {/* Champion Display */}
      {champion && hasEnded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/10 to-transparent p-6 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.1)_0%,transparent_70%)]" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <Crown className="mx-auto mb-3 h-12 w-12 text-[#FFD700]" />
            <h4 className="mb-2 text-lg font-semibold text-[#FFD700]">Champion</h4>
            <div className="flex items-center justify-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-[#FFD700]/50">
                {champion.avatarUrl && <AvatarImage src={champion.avatarUrl} />}
                <AvatarFallback className="bg-[#FFD700]/20 text-lg">
                  {(champion.displayName || champion.name).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-bold text-white">
                {champion.displayName || champion.name}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bracket Visualization */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {rounds.map(({ round, matchups: roundMatchups }) => (
            <div
              key={round}
              className={cn(
                'flex-shrink-0 w-64',
                round === activeRound && 'relative'
              )}
            >
              {/* Round header */}
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-medium text-white/70">
                  {getRoundName(round, numRounds)}
                </h4>
                {round === activeRound && (
                  <Badge variant="outline" className="text-xs border-[#FFD700]/30 text-[#FFD700]">
                    Current
                  </Badge>
                )}
              </div>

              {/* Matchups */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {roundMatchups.map((matchup, index) => {
                    const userVote = userVotes[matchup.id];
                    const hasVoted = !!userVote;
                    const isMatchupActive = matchup.status === 'active';
                    const isCompleted = matchup.status === 'completed';

                    return (
                      <motion.div
                        key={matchup.id}
                        variants={matchupVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={cn(
                            'border p-3',
                            isMatchupActive
                              ? 'border-[#FFD700]/40 bg-[#FFD700]/5'
                              : isCompleted
                                ? 'border-white/5 bg-white/[0.02]'
                                : 'border-white/10 bg-white/5'
                          )}
                        >
                          {/* Matchup status */}
                          <div className="mb-2 flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                isMatchupActive && 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30'
                              )}
                            >
                              {isMatchupActive ? (
                                <>
                                  <Zap className="mr-1 h-3 w-3" />
                                  Voting
                                </>
                              ) : isCompleted ? (
                                'Complete'
                              ) : (
                                <>
                                  <Clock className="mr-1 h-3 w-3" />
                                  Upcoming
                                </>
                              )}
                            </Badge>
                            {matchup.votesA !== undefined && matchup.votesB !== undefined && (
                              <span className="text-xs text-white/40">
                                {(matchup.votesA || 0) + (matchup.votesB || 0)} votes
                              </span>
                            )}
                          </div>

                          {/* Competitor A */}
                          <div
                            className={cn(
                              'mb-2 flex items-center justify-between rounded-lg border p-2 transition-all',
                              matchup.winner === matchup.competitorA?.id
                                ? 'border-green-500/40 bg-green-500/10'
                                : matchup.winner && matchup.winner !== matchup.competitorA?.id
                                  ? 'border-white/5 bg-white/[0.02] opacity-50'
                                  : userVote === matchup.competitorA?.id
                                    ? 'border-[#FFD700]/40 bg-[#FFD700]/5 ring-1 ring-[#FFD700]/30'
                                    : 'border-white/10 bg-black/30'
                            )}
                          >
                            {matchup.competitorA ? (
                              <>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    {matchup.competitorA.avatarUrl && (
                                      <AvatarImage src={matchup.competitorA.avatarUrl} />
                                    )}
                                    <AvatarFallback className="bg-white/10 text-xs">
                                      {(matchup.competitorA.displayName || matchup.competitorA.name).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate text-sm text-white/90">
                                    {matchup.competitorA.displayName || matchup.competitorA.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {matchup.votesA !== undefined && (
                                    <span className="text-xs text-white/50">{matchup.votesA}</span>
                                  )}
                                  {isMatchupActive && onVote && !hasVoted && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => onVote(matchup.id, matchup.competitorA!.id)}
                                      disabled={isVoting}
                                    >
                                      Vote
                                    </Button>
                                  )}
                                  {userVote === matchup.competitorA.id && (
                                    <CheckCircle className="h-4 w-4 text-[#FFD700]" />
                                  )}
                                  {matchup.winner === matchup.competitorA.id && (
                                    <Trophy className="h-4 w-4 text-green-400" />
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-white/30 italic">TBD</span>
                            )}
                          </div>

                          {/* VS */}
                          <div className="flex items-center justify-center py-1">
                            <span className="text-xs text-white/30">vs</span>
                          </div>

                          {/* Competitor B */}
                          <div
                            className={cn(
                              'flex items-center justify-between rounded-lg border p-2 transition-all',
                              matchup.winner === matchup.competitorB?.id
                                ? 'border-green-500/40 bg-green-500/10'
                                : matchup.winner && matchup.winner !== matchup.competitorB?.id
                                  ? 'border-white/5 bg-white/[0.02] opacity-50'
                                  : userVote === matchup.competitorB?.id
                                    ? 'border-[#FFD700]/40 bg-[#FFD700]/5 ring-1 ring-[#FFD700]/30'
                                    : 'border-white/10 bg-black/30'
                            )}
                          >
                            {matchup.competitorB ? (
                              <>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    {matchup.competitorB.avatarUrl && (
                                      <AvatarImage src={matchup.competitorB.avatarUrl} />
                                    )}
                                    <AvatarFallback className="bg-white/10 text-xs">
                                      {(matchup.competitorB.displayName || matchup.competitorB.name).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate text-sm text-white/90">
                                    {matchup.competitorB.displayName || matchup.competitorB.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {matchup.votesB !== undefined && (
                                    <span className="text-xs text-white/50">{matchup.votesB}</span>
                                  )}
                                  {isMatchupActive && onVote && !hasVoted && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => onVote(matchup.id, matchup.competitorB!.id)}
                                      disabled={isVoting}
                                    >
                                      Vote
                                    </Button>
                                  )}
                                  {userVote === matchup.competitorB.id && (
                                    <CheckCircle className="h-4 w-4 text-[#FFD700]" />
                                  )}
                                  {matchup.winner === matchup.competitorB.id && (
                                    <Trophy className="h-4 w-4 text-green-400" />
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-white/30 italic">TBD</span>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Connector to next round */}
              {round < numRounds && (
                <div className="absolute right-0 top-1/2 translate-x-3 -translate-y-1/2">
                  <ArrowRight className="h-4 w-4 text-white/20" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {rounds.length === 0 && (
        <div className="py-12 text-center">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-white/30" />
          <p className="text-sm text-white/50">
            {hasEnded
              ? 'This tournament has ended'
              : isActive
                ? 'Bracket will be generated soon...'
                : 'Tournament bracket will appear when it begins'}
          </p>
          {startsAt && now < startsAt && (
            <p className="mt-1 text-xs text-white/30">
              Starts {startsAt.toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
