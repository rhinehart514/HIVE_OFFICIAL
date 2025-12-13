import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PollElement } from '@hive/ui/components/hivelab/element-renderers';
import type { ElementProps } from '@hive/ui/lib/hivelab/element-system';

/**
 * # Poll Element
 *
 * The Poll element is the most viral component in HiveLab.
 * It should feel like Instagram Stories polls - instant, satisfying, shareable.
 *
 * ## States
 * - **Initial**: No votes yet, options visible
 * - **Voted**: User has voted, results shown
 * - **Results**: Vote complete, percentages animate
 * - **Closed**: Poll ended, final results
 *
 * ## Interaction Goals
 * - Vote should feel instant (optimistic UI)
 * - Results should animate with spring physics
 * - Social proof should be visible (avatars, counts)
 */
const meta: Meta<typeof PollElement> = {
  title: 'HiveLab/Elements/Poll',
  component: PollElement,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The Poll element enables quick voting with real-time results. Designed for virality - every vote should feel satisfying.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PollElement>;

// Wrapper to handle state
function PollWithState(props: ElementProps) {
  const [data, setData] = useState(props.data || {});

  const handleChange = (newData: unknown) => {
    setData((prev) => ({ ...prev, ...(newData as Record<string, unknown>) }));
    props.onChange?.(newData);
  };

  const handleAction = (action: string, payload: unknown) => {
    console.warn('Poll action:', action, payload);
    // Simulate vote recording
    if (action === 'vote') {
      const vote = payload as { choice: string };
      setData((prev) => ({
        ...prev,
        userVote: vote.choice,
        totalVotes: ((prev.totalVotes as number) || 0) + 1,
      }));
    }
    props.onAction?.(action, payload);
  };

  return (
    <PollElement
      {...props}
      data={data}
      onChange={handleChange}
      onAction={handleAction}
    />
  );
}

/**
 * Default poll with no votes yet
 */
export const Default: Story = {
  render: () => (
    <PollWithState
      id="poll-default"
      config={{
        question: "What's for lunch today?",
        options: ['Pizza', 'Sushi', 'Tacos', 'Salad'],
        showResults: false,
        allowChangeVote: true,
      }}
      data={{}}
    />
  ),
};

/**
 * Poll with existing votes showing results
 */
export const WithVotes: Story = {
  render: () => (
    <PollWithState
      id="poll-votes"
      config={{
        question: 'Best study spot on campus?',
        options: ['Library', 'Coffee Shop', 'Student Union', 'Dorm Lounge'],
        showResultsBeforeVoting: true,
        allowChangeVote: false,
      }}
      data={{
        responses: {
          user1: { choice: 'Library' },
          user2: { choice: 'Library' },
          user3: { choice: 'Coffee Shop' },
          user4: { choice: 'Student Union' },
          user5: { choice: 'Library' },
        },
        totalVotes: 5,
      }}
    />
  ),
};

/**
 * Poll where user has already voted
 */
export const AlreadyVoted: Story = {
  render: () => (
    <PollWithState
      id="poll-voted"
      config={{
        question: 'When should we hold the hackathon?',
        options: ['This Weekend', 'Next Weekend', 'In Two Weeks'],
        showResultsBeforeVoting: false,
        allowChangeVote: true,
      }}
      data={{
        responses: {
          currentUser: { choice: 'Next Weekend' },
          user2: { choice: 'This Weekend' },
          user3: { choice: 'Next Weekend' },
          user4: { choice: 'Next Weekend' },
        },
        totalVotes: 4,
        userVote: 'Next Weekend',
      }}
    />
  ),
};

/**
 * Poll with deadline showing urgency
 */
export const WithDeadline: Story = {
  render: () => (
    <PollWithState
      id="poll-deadline"
      config={{
        question: 'Vote for our new club logo!',
        options: [
          { id: 'logo-a', label: 'Modern Minimal' },
          { id: 'logo-b', label: 'Vintage Badge' },
          { id: 'logo-c', label: 'Abstract Mark' },
        ],
        deadline: 'Ends Friday at 5pm',
        showResultsBeforeVoting: false,
      }}
      data={{
        totalVotes: 23,
      }}
    />
  ),
};

/**
 * Anonymous poll (no avatars shown)
 */
export const Anonymous: Story = {
  render: () => (
    <PollWithState
      id="poll-anon"
      config={{
        question: 'Rate this week\'s meeting (anonymous)',
        options: ['Excellent', 'Good', 'Okay', 'Needs Improvement'],
        anonymousVoting: true,
        showResultsBeforeVoting: false,
      }}
      data={{}}
    />
  ),
};

/**
 * Compact poll for sidebar usage
 */
export const Compact: Story = {
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <PollWithState
      id="poll-compact"
      config={{
        question: 'Quick vote: Meeting time?',
        options: ['10am', '2pm', '4pm'],
      }}
      data={{}}
    />
  ),
};
