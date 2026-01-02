'use client';

import * as React from 'react';
import { useState } from 'react';

import { RitualBetaLottery } from './organisms/ritual-beta-lottery';
import { RitualCard } from './organisms/ritual-card';
import { RitualCompletionCelebration } from './organisms/ritual-completion-celebration';
import { RitualFeatureDrop } from './organisms/ritual-feature-drop';
import { RitualFoundingClass } from './organisms/ritual-founding-class';
import { RitualLaunchCountdown } from './organisms/ritual-launch-countdown';
import { RitualLeak } from './organisms/ritual-leak';
import { RitualRuleInversion } from './organisms/ritual-rule-inversion';
import { RitualStrip } from './organisms/ritual-strip';
import { RitualSurvival } from './organisms/ritual-survival';
import { RitualTournamentBracket } from './organisms/ritual-tournament-bracket';
import { RitualUnlockChallenge } from './organisms/ritual-unlock-challenge';
import { RitualEmptyState } from './molecules/ritual-empty-state';
import { RitualLoadingSkeleton } from './molecules/ritual-loading-skeleton';
import { RitualProgressBar } from './molecules/ritual-progress-bar';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '06-Rituals/Rituals System',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Campus-wide behavioral campaigns. This is the MOAT - creates campus-specific moments that Instagram/TikTok can\'t replicate. "UB only" experiences build community loyalty.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[200px] bg-[#0A0A0A] p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// MOCK DATA
// ============================================================================

const mockRituals = [
  {
    id: 'founding-100',
    name: 'Founding 100',
    description: 'Be one of the first 100 UB students to join HIVE and get an exclusive founder badge',
    icon: '🏆',
    progress: 67,
    participantCount: 67,
    timeRemaining: '3d 12h',
    duration: '7 days',
    startDate: 'Dec 1',
    endDate: 'Dec 7',
    frequency: 'One-time',
    isParticipating: true,
    isCompleted: false,
  },
  {
    id: 'campus-madness',
    name: 'Campus Madness',
    description: 'Vote on the best dining hall at UB. 16 matchups, single-elimination tournament',
    icon: '🏀',
    progress: 43,
    participantCount: 842,
    timeRemaining: '2d 5h',
    duration: '2 weeks',
    startDate: 'Dec 5',
    endDate: 'Dec 19',
    frequency: 'Weekly votes',
    isParticipating: false,
    isCompleted: false,
  },
  {
    id: 'beta-lottery',
    name: 'Beta Lottery',
    description: 'Enter for a chance to test new features before everyone else',
    icon: '🎰',
    progress: 25,
    participantCount: 234,
    timeRemaining: '1d 3h',
    duration: '3 days',
    startDate: 'Dec 10',
    endDate: 'Dec 13',
    frequency: 'One-time',
    isParticipating: false,
    isCompleted: false,
  },
  {
    id: 'unlock-challenge',
    name: 'Unlock Challenge: Anonymous Posting',
    description: 'Entire campus works together to reach 500 posts and unlock anonymous posting for 24h',
    icon: '🎭',
    progress: 78,
    participantCount: 1547,
    timeRemaining: 'Ongoing',
    duration: 'Ongoing',
    startDate: 'Dec 1',
    endDate: 'Until unlocked',
    frequency: 'Continuous',
    isParticipating: true,
    isCompleted: false,
  },
];

const mockMembers = Array.from({ length: 67 }, (_, i) => ({
  id: `member-${i}`,
  name: `Student ${i + 1}`,
  avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
}));

// ============================================================================
// MOLECULES: PROGRESS BAR
// ============================================================================

export const ProgressBar_Default: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualProgressBar progress={45} label="Campus Challenge" />
    </div>
  ),
};

export const ProgressBar_WithMilestones: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualProgressBar
        progress={62}
        label="Unlock Challenge"
        milestones={[
          { percentage: 25, label: 'Bronze', isCompleted: true },
          { percentage: 50, label: 'Silver', isCompleted: true },
          { percentage: 75, label: 'Gold', isCompleted: false },
          { percentage: 100, label: 'Platinum', isCompleted: false },
        ]}
      />
    </div>
  ),
};

export const ProgressBar_Compact: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualProgressBar progress={78} variant="compact" />
    </div>
  ),
};

export const ProgressBar_Complete: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualProgressBar progress={100} label="Challenge Complete!" />
    </div>
  ),
};

export const ProgressBar_JustStarted: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualProgressBar progress={5} label="Just getting started" />
    </div>
  ),
};

export const ProgressBar_Comparison: Story = {
  render: () => (
    <div className="max-w-md space-y-6">
      <div>
        <h4 className="text-sm text-white/60 mb-2">Default Variant</h4>
        <RitualProgressBar progress={50} label="Default" />
      </div>
      <div>
        <h4 className="text-sm text-white/60 mb-2">Compact Variant</h4>
        <RitualProgressBar progress={50} variant="compact" label="Compact" />
      </div>
    </div>
  ),
};

// ============================================================================
// MOLECULES: EMPTY & LOADING STATES
// ============================================================================

export const EmptyState_Default: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualEmptyState />
    </div>
  ),
};

export const EmptyState_WithAction: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualEmptyState
        icon="🔔"
        title="No Active Rituals"
        message="Be the first to know when new campus events launch!"
        actionLabel="Enable Notifications"
        onAction={() => console.log('Enable notifications')}
      />
    </div>
  ),
};

export const EmptyState_CustomIcon: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualEmptyState
        icon="🎉"
        title="All Caught Up!"
        message="You've participated in all available rituals. Check back soon!"
      />
    </div>
  ),
};

export const LoadingSkeleton_Card: Story = {
  render: () => (
    <div className="max-w-sm">
      <RitualLoadingSkeleton variant="card" />
    </div>
  ),
};

export const LoadingSkeleton_Banner: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RitualLoadingSkeleton variant="banner" />
    </div>
  ),
};

export const LoadingSkeleton_Detail: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RitualLoadingSkeleton variant="detail" />
    </div>
  ),
};

export const LoadingSkeleton_Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <RitualLoadingSkeleton variant="card" />
      <RitualLoadingSkeleton variant="card" />
      <RitualLoadingSkeleton variant="card" />
      <RitualLoadingSkeleton variant="card" />
    </div>
  ),
};

// ============================================================================
// ORGANISMS: RITUAL CARD
// ============================================================================

export const Card_Default: Story = {
  render: () => (
    <div className="max-w-[360px]">
      <RitualCard
        ritual={mockRituals[1]}
        onJoin={() => console.log('Join clicked')}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  ),
};

export const Card_Featured: Story = {
  render: () => (
    <div className="max-w-[360px]">
      <RitualCard
        ritual={mockRituals[0]}
        variant="featured"
        onJoin={() => console.log('Join clicked')}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  ),
};

export const Card_Participating: Story = {
  render: () => (
    <div className="max-w-[360px]">
      <RitualCard
        ritual={mockRituals[3]}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  ),
};

export const Card_Completed: Story = {
  render: () => (
    <div className="max-w-[360px]">
      <RitualCard
        ritual={{
          ...mockRituals[0],
          progress: 100,
          participantCount: 100,
          isCompleted: true,
        }}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  ),
};

export const Card_HighProgress: Story = {
  render: () => (
    <div className="max-w-[360px]">
      <RitualCard
        ritual={{
          ...mockRituals[1],
          progress: 95,
          participantCount: 1847,
        }}
        variant="featured"
        onJoin={() => console.log('Join clicked')}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  ),
};

export const Card_Grid: Story = {
  render: () => (
    <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
      {mockRituals.map((ritual, i) => (
        <RitualCard
          key={ritual.id}
          ritual={ritual}
          variant={i === 0 ? 'featured' : 'default'}
          onJoin={() => console.log('Join:', ritual.id)}
          onViewDetails={() => console.log('Details:', ritual.id)}
        />
      ))}
    </div>
  ),
};

export const Card_Interactive: Story = {
  render: () => {
    const [isParticipating, setIsParticipating] = useState(false);

    return (
      <div className="max-w-[360px]">
        <RitualCard
          ritual={{
            ...mockRituals[1],
            isParticipating,
          }}
          onJoin={() => setIsParticipating(true)}
          onViewDetails={() => console.log('View details')}
        />
        {isParticipating && (
          <p className="mt-4 text-sm text-[#FFD700]">You've joined the ritual!</p>
        )}
      </div>
    );
  },
};

// ============================================================================
// ORGANISMS: RITUAL STRIP
// ============================================================================

export const Strip_Default: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RitualStrip
        ritual={mockRituals[0]}
        onJoin={() => console.log('Join clicked')}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  ),
};

export const Strip_Compact: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RitualStrip
        ritual={mockRituals[1]}
        variant="compact"
        onJoin={() => console.log('Join clicked')}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  ),
};

export const Strip_NoProgress: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RitualStrip
        ritual={mockRituals[2]}
        showProgress={false}
        onJoin={() => console.log('Join clicked')}
      />
    </div>
  ),
};

export const Strip_Participating: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RitualStrip
        ritual={mockRituals[3]}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  ),
};

export const Strip_Stack: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      {mockRituals.slice(0, 3).map((ritual) => (
        <RitualStrip
          key={ritual.id}
          ritual={ritual}
          onJoin={() => console.log('Join:', ritual.id)}
          onViewDetails={() => console.log('Details:', ritual.id)}
        />
      ))}
    </div>
  ),
};

// ============================================================================
// ORGANISMS: TOURNAMENT BRACKET
// ============================================================================

export const Tournament_CampusMadness: Story = {
  render: () => (
    <RitualTournamentBracket
      title="Campus Madness: Best Dining Hall"
      matchups={[
        { id: 'match-1', round: 1, a: 'Pigeon Dining', b: 'Ellicott Dining', votesA: 234, votesB: 156 },
        { id: 'match-2', round: 1, a: 'Governors Dining', b: 'C3 Crossroads', votesA: 189, votesB: 278 },
        { id: 'match-3', round: 2, a: 'Pigeon Dining', b: 'C3 Crossroads', votesA: 0, votesB: 0 },
      ]}
      currentRound={2}
      onVote={(matchupId, choice) => console.log('Vote:', matchupId, choice)}
    />
  ),
};

export const Tournament_ManyMatchups: Story = {
  render: () => (
    <RitualTournamentBracket
      title="Best Study Spot Tournament"
      matchups={[
        { id: 'r1-1', round: 1, a: 'Lockwood Library', b: 'Capen Hall', votesA: 345, votesB: 287 },
        { id: 'r1-2', round: 1, a: 'Student Union', b: 'Silverman Library', votesA: 198, votesB: 412 },
        { id: 'r1-3', round: 1, a: 'One World Cafe', b: 'Davis Hall', votesA: 267, votesB: 234 },
        { id: 'r1-4', round: 1, a: 'Baldy Hall', b: 'NSC', votesA: 189, votesB: 301 },
        { id: 'r2-1', round: 2, a: 'Lockwood Library', b: 'Silverman Library', votesA: 0, votesB: 0 },
        { id: 'r2-2', round: 2, a: 'One World Cafe', b: 'NSC', votesA: 0, votesB: 0 },
      ]}
      currentRound={2}
      onVote={(matchupId, choice) => console.log('Vote:', matchupId, choice)}
    />
  ),
};

// ============================================================================
// ORGANISMS: BETA LOTTERY
// ============================================================================

export const BetaLottery_Entry: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualBetaLottery
        title="Beta Access Lottery"
        description="Enter for early access to new features"
        feature={{
          id: 'feature-1',
          name: 'Advanced Analytics Dashboard',
          description: 'Track your campus engagement with detailed metrics',
          teaser: {
            images: ['https://api.dicebear.com/7.x/shapes/svg?seed=analytics'],
          },
        }}
        slots={50}
        applicants={234}
        entryDeadline="Dec 13 at 6:00 PM"
        drawingDate="Dec 14 at 8:00 PM"
        hasEntered={false}
        onEnter={() => console.log('Enter lottery')}
      />
    </div>
  ),
};

export const BetaLottery_Entered: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualBetaLottery
        title="Beta Access Lottery"
        description="You're entered for early access!"
        feature={{
          id: 'feature-1',
          name: 'Advanced Analytics Dashboard',
          description: 'Track your campus engagement with detailed metrics',
          teaser: {
            images: ['https://api.dicebear.com/7.x/shapes/svg?seed=analytics'],
          },
        }}
        slots={50}
        applicants={235}
        entryDeadline="Dec 13 at 6:00 PM"
        drawingDate="Dec 14 at 8:00 PM"
        hasEntered={true}
        onEnter={() => console.log('Already entered')}
      />
    </div>
  ),
};

export const BetaLottery_HighDemand: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualBetaLottery
        title="Voice Messages Beta"
        description="Record and send voice messages in spaces"
        feature={{
          id: 'feature-2',
          name: 'Voice Messages',
          description: 'Send audio messages to your communities',
          teaser: {
            images: ['https://api.dicebear.com/7.x/shapes/svg?seed=voice'],
          },
        }}
        slots={25}
        applicants={1847}
        entryDeadline="Dec 15 at 12:00 PM"
        drawingDate="Dec 16 at 6:00 PM"
        hasEntered={false}
        onEnter={() => console.log('Enter lottery')}
      />
    </div>
  ),
};

// ============================================================================
// ORGANISMS: FOUNDING CLASS
// ============================================================================

export const FoundingClass_Members: Story = {
  render: () => (
    <div className="max-w-[800px] mx-auto">
      <RitualFoundingClass
        title="Founding 100 Members"
        members={mockMembers}
      />
    </div>
  ),
};

export const FoundingClass_Few: Story = {
  render: () => (
    <div className="max-w-[800px] mx-auto">
      <RitualFoundingClass
        title="Founding 10 - Early Adopters"
        members={mockMembers.slice(0, 10)}
      />
    </div>
  ),
};

export const FoundingClass_Full: Story = {
  render: () => (
    <div className="max-w-[800px] mx-auto">
      <RitualFoundingClass
        title="Founding 100 - Complete!"
        members={Array.from({ length: 100 }, (_, i) => ({
          id: `member-${i}`,
          name: `Student ${i + 1}`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        }))}
      />
    </div>
  ),
};

// ============================================================================
// ORGANISMS: UNLOCK CHALLENGE
// ============================================================================

export const UnlockChallenge_InProgress: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualUnlockChallenge
        title="Unlock Anonymous Posting"
        description="Entire campus works together to reach 500 posts"
        goalMetric="Posts"
        targetValue={500}
        currentValue={389}
        reward={{
          type: 'feature',
          name: 'Anonymous Posting',
          description: '24 hours of anonymous posting unlocked campus-wide',
          teaser: 'Post without your name showing - perfect for hot takes!',
        }}
        milestones={[
          { threshold: 100, unlock: 'Unlocked gold badges', message: 'First milestone reached!', completed: true },
          { threshold: 250, unlock: 'Unlocked custom themes', message: 'Halfway there!', completed: true },
          { threshold: 500, unlock: 'Anonymous posting', message: 'Final goal!', completed: false },
        ]}
        onContribute={() => console.log('Contribute to unlock')}
        encouragement="Keep posting! We're 78% of the way there"
      />
    </div>
  ),
};

export const UnlockChallenge_NearComplete: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualUnlockChallenge
        title="Unlock Anonymous Posting"
        description="Almost there! Just 10 more posts needed"
        goalMetric="Posts"
        targetValue={500}
        currentValue={490}
        reward={{
          type: 'feature',
          name: 'Anonymous Posting',
          description: '24 hours of anonymous posting unlocked campus-wide',
          teaser: 'Post without your name showing - perfect for hot takes!',
        }}
        milestones={[
          { threshold: 100, unlock: 'Unlocked gold badges', message: 'First milestone reached!', completed: true },
          { threshold: 250, unlock: 'Unlocked custom themes', message: 'Halfway there!', completed: true },
          { threshold: 500, unlock: 'Anonymous posting', message: 'Final goal!', completed: false },
        ]}
        onContribute={() => console.log('Contribute to unlock')}
        encouragement="SO CLOSE! Just 10 more posts!"
      />
    </div>
  ),
};

export const UnlockChallenge_EarlyStage: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualUnlockChallenge
        title="Unlock Dark Mode Campus-Wide"
        description="Work together to reach 1000 interactions"
        goalMetric="Interactions"
        targetValue={1000}
        currentValue={156}
        reward={{
          type: 'feature',
          name: 'Campus Dark Mode',
          description: 'Dark mode unlocked for all campus spaces',
          teaser: 'A sleek dark theme for late-night studying!',
        }}
        milestones={[
          { threshold: 250, unlock: 'Dim mode preview', message: 'Getting started!', completed: false },
          { threshold: 500, unlock: 'Partial dark mode', message: 'Halfway there!', completed: false },
          { threshold: 1000, unlock: 'Full dark mode', message: 'Final goal!', completed: false },
        ]}
        onContribute={() => console.log('Contribute')}
        encouragement="Every like, comment, and post counts!"
      />
    </div>
  ),
};

// ============================================================================
// ORGANISMS: SURVIVAL
// ============================================================================

export const Survival_Active: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualSurvival
        title="Dining Hall Survival"
        description="Vote out one dining hall each day until only one remains"
        contestants={[
          { id: '1', name: 'Pigeon Dining', eliminated: false, votes: 23 },
          { id: '2', name: 'Ellicott Dining', eliminated: false, votes: 45 },
          { id: '3', name: 'Governors Dining', eliminated: false, votes: 12 },
          { id: '4', name: 'C3 Crossroads', eliminated: false, votes: 67 },
          { id: '5', name: 'Hadley Dining', eliminated: true, votes: 89 },
        ]}
        round={2}
        totalRounds={4}
        deadline="Today at 11:59 PM"
        onVote={(contestantId) => console.log('Vote to eliminate:', contestantId)}
      />
    </div>
  ),
};

export const Survival_FinalRound: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualSurvival
        title="Best Coffee Spot - FINALS"
        description="The final two remain! Vote for the winner!"
        contestants={[
          { id: '1', name: 'Tim Hortons', eliminated: false, votes: 234 },
          { id: '2', name: 'Starbucks', eliminated: false, votes: 267 },
          { id: '3', name: 'Dunkin', eliminated: true, votes: 0 },
          { id: '4', name: 'Local Cafe', eliminated: true, votes: 0 },
        ]}
        round={3}
        totalRounds={3}
        deadline="Tomorrow at 6:00 PM"
        onVote={(contestantId) => console.log('Vote:', contestantId)}
      />
    </div>
  ),
};

// ============================================================================
// ORGANISMS: FEATURE DROP
// ============================================================================

export const FeatureDrop_Announcement: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualFeatureDrop
        title="New Feature Drop: Voice Messages"
        description="Record and send voice messages in any space"
        featureName="Voice Messages"
        icon="🎤"
        availableFor="24 hours"
        expiresAt="Tomorrow at 6:00 PM"
        onTryNow={() => console.log('Try voice messages')}
        onDismiss={() => console.log('Dismiss')}
      />
    </div>
  ),
};

export const FeatureDrop_LimitedTime: Story = {
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <RitualFeatureDrop
        title="Weekend Special: GIF Reactions"
        description="React to messages with animated GIFs"
        featureName="GIF Reactions"
        icon="🎬"
        availableFor="48 hours"
        expiresAt="Monday at 12:00 AM"
        onTryNow={() => console.log('Try GIF reactions')}
        onDismiss={() => console.log('Dismiss')}
      />
    </div>
  ),
};

// ============================================================================
// ORGANISMS: LAUNCH COUNTDOWN
// ============================================================================

export const LaunchCountdown_Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <RitualLaunchCountdown
        title="Beta Launch"
        targetTime={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}
      />
    </div>
  ),
};

export const LaunchCountdown_Soon: Story = {
  render: () => (
    <div className="max-w-sm">
      <RitualLaunchCountdown
        title="Feature Drops"
        targetTime={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()}
      />
    </div>
  ),
};

// ============================================================================
// ORGANISMS: RULE INVERSION
// ============================================================================

export const RuleInversion_AnonymousPosting: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualRuleInversion
        ruleDescription="Anonymous Posting is ENABLED"
        notes="For the next 24 hours, all posts in general spaces can be anonymous. Use responsibly!"
      />
    </div>
  ),
};

export const RuleInversion_NoLimits: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualRuleInversion
        ruleDescription="Rate Limits Suspended"
        notes="Post, react, and comment as much as you want until midnight!"
      />
    </div>
  ),
};

// ============================================================================
// ORGANISMS: LEAK (MYSTERY REVEALS)
// ============================================================================

export const Leak_Default: Story = {
  render: () => (
    <div className="max-w-md">
      <RitualLeak
        title="Upcoming Feature Hints"
        clues={[
          { id: '1', hint: 'Something big is coming to profiles...', revealed: false },
          { id: '2', hint: 'Your voice will be heard soon', revealed: false },
          { id: '3', hint: 'Connect like never before', revealed: true },
        ]}
        onReveal={(id) => console.log('Reveal clue:', id)}
      />
    </div>
  ),
};

export const Leak_Interactive: Story = {
  render: () => {
    const [clues, setClues] = useState([
      { id: '1', hint: 'A new way to discover spaces...', revealed: false },
      { id: '2', hint: 'Your schedule, supercharged', revealed: false },
      { id: '3', hint: 'AI-powered assistance coming', revealed: false },
    ]);

    const handleReveal = (id: string) => {
      setClues(prev => prev.map(c => c.id === id ? { ...c, revealed: true } : c));
    };

    return (
      <div className="max-w-md">
        <RitualLeak
          title="What's Coming Next?"
          clues={clues}
          onReveal={handleReveal}
        />
      </div>
    );
  },
};

// ============================================================================
// ORGANISMS: COMPLETION CELEBRATION
// ============================================================================

export const CompletionCelebration_Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-[#FFD700]/20 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/30 transition-colors"
        >
          Show Celebration
        </button>
        <RitualCompletionCelebration
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onShare={() => console.log('Share')}
          ritual={{
            name: 'Founding 100',
            icon: '🏆',
            streak: 7,
            rank: 42,
            totalParticipants: 100,
          }}
        />
      </>
    );
  },
};

export const CompletionCelebration_HighRank: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-[#FFD700]/20 text-[#FFD700] rounded-lg"
        >
          Show Celebration
        </button>
        <RitualCompletionCelebration
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onShare={() => console.log('Share')}
          ritual={{
            name: 'Campus Madness Champion',
            icon: '🏀',
            rank: 1,
            totalParticipants: 842,
          }}
        />
      </>
    );
  },
};

export const CompletionCelebration_LongStreak: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-[#FFD700]/20 text-[#FFD700] rounded-lg"
        >
          Show Celebration
        </button>
        <RitualCompletionCelebration
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onShare={() => console.log('Share')}
          ritual={{
            name: 'Daily Check-in Champion',
            icon: '🔥',
            streak: 30,
          }}
        />
      </>
    );
  },
};

// ============================================================================
// COMPOSITION STORIES
// ============================================================================

export const RitualsPage_Layout: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Campus Rituals</h1>
        <p className="text-white/60">Campus-wide events and challenges</p>
      </div>

      {/* Featured */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Featured</h2>
        <RitualStrip
          ritual={mockRituals[0]}
          onJoin={() => console.log('Join')}
        />
      </section>

      {/* Active */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Active Rituals</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {mockRituals.slice(1).map((ritual) => (
            <RitualCard
              key={ritual.id}
              ritual={ritual}
              onJoin={() => console.log('Join:', ritual.id)}
              onViewDetails={() => console.log('Details:', ritual.id)}
            />
          ))}
        </div>
      </section>
    </div>
  ),
};

export const RitualsPage_Mobile: Story = {
  render: () => (
    <div className="max-w-[375px] mx-auto">
      <div className="p-4 space-y-4">
        <h2 className="text-2xl font-bold text-white">Active Rituals</h2>
        {mockRituals.slice(0, 3).map((ritual) => (
          <RitualCard
            key={ritual.id}
            ritual={ritual}
            onJoin={() => console.log('Join:', ritual.id)}
            onViewDetails={() => console.log('Details:', ritual.id)}
          />
        ))}
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const RitualsPage_Loading: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="h-8 w-48 bg-white/10 rounded mx-auto mb-2 animate-pulse" />
        <div className="h-4 w-64 bg-white/5 rounded mx-auto animate-pulse" />
      </div>

      <section>
        <div className="h-5 w-24 bg-white/10 rounded mb-4 animate-pulse" />
        <RitualLoadingSkeleton variant="banner" />
      </section>

      <section>
        <div className="h-5 w-32 bg-white/10 rounded mb-4 animate-pulse" />
        <div className="grid md:grid-cols-2 gap-4">
          <RitualLoadingSkeleton variant="card" />
          <RitualLoadingSkeleton variant="card" />
          <RitualLoadingSkeleton variant="card" />
          <RitualLoadingSkeleton variant="card" />
        </div>
      </section>
    </div>
  ),
};

export const RitualsPage_Empty: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Campus Rituals</h1>
        <p className="text-white/60">Campus-wide events and challenges</p>
      </div>

      <RitualEmptyState
        icon="🎭"
        title="No Active Rituals"
        message="Check back soon for exciting campus-wide events and challenges!"
        actionLabel="Get Notified"
        onAction={() => console.log('Enable notifications')}
      />
    </div>
  ),
};

// ============================================================================
// THE MOAT - STRATEGIC OVERVIEW
// ============================================================================

export const Rituals_TheMoat: Story = {
  render: () => (
    <div className="max-w-[900px] mx-auto">
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Rituals: The Campus Moat</h1>
          <p className="text-xl text-white/60">
            Campus-specific behavioral campaigns that Instagram/TikTok can't replicate
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <RitualCard
            ritual={mockRituals[0]}
            variant="featured"
            onJoin={() => console.log('Join')}
            onViewDetails={() => console.log('Details')}
          />
          <RitualCard
            ritual={mockRituals[1]}
            onJoin={() => console.log('Join')}
            onViewDetails={() => console.log('Details')}
          />
          <RitualCard
            ritual={mockRituals[2]}
            onJoin={() => console.log('Join')}
            onViewDetails={() => console.log('Details')}
          />
          <RitualCard
            ritual={mockRituals[3]}
            onJoin={() => console.log('Join')}
            onViewDetails={() => console.log('Details')}
          />
        </div>

        <div className="mt-12 p-8 bg-[#FFD700]/10 rounded-2xl border-2 border-[#FFD700]/20">
          <h3 className="text-2xl font-bold text-white mb-4">Why Instagram Can't Copy This</h3>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌍</span>
              <div>
                <strong className="text-white">Instagram is global</strong> (1 billion users) - They can't create "UB only" moments
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <strong className="text-white">HIVE is campus-specific</strong> (10,000 users at UB) - We create tight-knit community experiences
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <strong className="text-white">Campus-wide moments</strong> - "Founding 100" badge only 100 UB students will ever have
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <strong className="text-white">Community ownership</strong> - Students feel "This is OUR campus app" vs "Global app I use"
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💪</span>
              <div>
                <strong className="text-white">Network effects</strong> - More engaged 10K students {'>'} 1M disengaged users globally
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white/5 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-3">9 Ritual Archetypes</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-white/80">
            <div><strong className="text-[#FFD700]">🏀 Tournament:</strong> Campus Madness bracket</div>
            <div><strong className="text-[#FFD700]">🎁 Feature Drop:</strong> Limited-time unlock</div>
            <div><strong className="text-[#FFD700]">🔄 Rule Inversion:</strong> Temporary rule suspension</div>
            <div><strong className="text-[#FFD700]">🏆 Founding Class:</strong> First 100 users</div>
            <div><strong className="text-[#FFD700]">⏱️ Launch Countdown:</strong> Pre-launch hype</div>
            <div><strong className="text-[#FFD700]">🎰 Beta Lottery:</strong> Random early access</div>
            <div><strong className="text-[#FFD700]">🎭 Unlock Challenge:</strong> Group goals</div>
            <div><strong className="text-[#FFD700]">👑 Survival:</strong> Vote people out</div>
            <div><strong className="text-[#FFD700]">🔍 Leak:</strong> Mystery reveals</div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Rituals are HIVE\'s competitive moat. Campus-specific behavioral campaigns create "UB only" moments that build community loyalty. Instagram (global platform) can\'t replicate this campus-specific engagement.',
      },
    },
  },
};
