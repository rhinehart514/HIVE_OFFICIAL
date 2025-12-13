import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CountdownTimerElement } from '@hive/ui/components/hivelab/element-renderers';
import type { ElementProps } from '@hive/ui/lib/hivelab/element-system';

/**
 * # Countdown Element
 *
 * The Countdown element creates urgency and anticipation.
 * Should feel like Apple Watch timer - precise, satisfying, reliable.
 *
 * ## Target Experience: Apple precision
 * - Flip-clock or smooth number transitions
 * - Color shifts (calm → amber → urgent red)
 * - Subtle pulse when under 60 seconds
 * - Celebration when hits zero
 *
 * ## States
 * - **Far**: Days shown, calm colors
 * - **Near**: Hours/minutes, amber hints
 * - **Urgent**: Under 1 hour, red accents
 * - **Zero**: Celebration, "Time's up!"
 */
const meta: Meta<typeof CountdownTimerElement> = {
  title: 'HiveLab/Elements/Countdown',
  component: CountdownTimerElement,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Countdown timer for event deadlines and urgency. Should feel like Apple Watch precision.',
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
type Story = StoryObj<typeof CountdownTimerElement>;

// Wrapper to handle state
function CountdownWithState(props: ElementProps & { initialSeconds?: number }) {
  const [data, setData] = useState(props.data || {});

  const handleChange = (newData: unknown) => {
    setData((prev) => ({ ...prev, ...(newData as Record<string, unknown>) }));
    props.onChange?.(newData);
  };

  const handleAction = (action: string, payload: unknown) => {
    console.warn('Countdown action:', action, payload);
    props.onAction?.(action, payload);
  };

  return (
    <CountdownTimerElement
      {...props}
      data={data}
      onChange={handleChange}
      onAction={handleAction}
    />
  );
}

/**
 * Default countdown - hours away
 */
export const Default: Story = {
  render: () => (
    <CountdownWithState
      id="countdown-default"
      config={{
        label: 'Registration Closes',
        seconds: 3 * 60 * 60 + 42 * 60 + 15, // 3h 42m 15s
      }}
      data={{}}
    />
  ),
};

/**
 * Days away - calm, informative
 */
export const DaysAway: Story = {
  render: () => (
    <CountdownWithState
      id="countdown-days"
      config={{
        label: 'Hackathon Starts',
        seconds: 5 * 24 * 60 * 60 + 8 * 60 * 60, // 5 days 8 hours
        showDays: true,
      }}
      data={{}}
    />
  ),
};

/**
 * Under 1 hour - urgent
 */
export const Urgent: Story = {
  render: () => (
    <CountdownWithState
      id="countdown-urgent"
      config={{
        label: 'Last Chance to Vote!',
        seconds: 45 * 60 + 30, // 45m 30s
      }}
      data={{}}
    />
  ),
};

/**
 * Under 5 minutes - critical
 */
export const Critical: Story = {
  render: () => (
    <CountdownWithState
      id="countdown-critical"
      config={{
        label: 'Deadline',
        seconds: 4 * 60 + 23, // 4m 23s
      }}
      data={{}}
    />
  ),
};

/**
 * Just seconds left
 */
export const FinalSeconds: Story = {
  render: () => (
    <CountdownWithState
      id="countdown-seconds"
      config={{
        label: 'Starting in...',
        seconds: 45,
      }}
      data={{}}
    />
  ),
};

/**
 * Finished - zero state
 */
export const Finished: Story = {
  render: () => (
    <CountdownWithState
      id="countdown-finished"
      config={{
        label: 'Event Started',
        seconds: 0,
      }}
      data={{
        finished: true,
        timeLeft: 0,
      }}
    />
  ),
};

/**
 * With target date (real-time)
 */
export const WithTargetDate: Story = {
  render: () => {
    // Set target to 2 hours from now
    const targetDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

    return (
      <CountdownWithState
        id="countdown-target"
        config={{
          label: 'Event Begins',
          targetDate: targetDate.toISOString(),
        }}
        data={{}}
      />
    );
  },
};

/**
 * Compact for sidebar
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
    <CountdownWithState
      id="countdown-compact"
      config={{
        label: 'Ends in',
        seconds: 2 * 60 * 60 + 15 * 60, // 2h 15m
      }}
      data={{}}
    />
  ),
};

/**
 * Multiple countdowns (comparison)
 */
export const MultipleTimers: Story = {
  decorators: [
    (Story) => (
      <div className="space-y-4 w-[400px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <CountdownWithState
        id="countdown-1"
        config={{
          label: 'Early Bird Pricing',
          seconds: 12 * 60 * 60, // 12 hours
        }}
        data={{}}
      />
      <CountdownWithState
        id="countdown-2"
        config={{
          label: 'Registration Closes',
          seconds: 2 * 24 * 60 * 60, // 2 days
        }}
        data={{}}
      />
      <CountdownWithState
        id="countdown-3"
        config={{
          label: 'Event Starts',
          seconds: 5 * 24 * 60 * 60, // 5 days
        }}
        data={{}}
      />
    </>
  ),
};
