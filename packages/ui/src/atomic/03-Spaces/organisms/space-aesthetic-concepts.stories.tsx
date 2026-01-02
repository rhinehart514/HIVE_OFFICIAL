import type { Meta, StoryObj } from '@storybook/react';
import {
  SpaceLayoutConcepts,
  LayoutChatCentric,
  LayoutEventFirst,
  LayoutDashboard,
  LayoutForum,
} from './space-aesthetic-concepts';

const meta: Meta<typeof SpaceLayoutConcepts> = {
  title: 'Spaces/Layout Concepts',
  component: SpaceLayoutConcepts,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof SpaceLayoutConcepts>;

// Interactive switcher to compare all layouts
export const AllLayouts: Story = {
  name: 'All Layouts (Interactive)',
};

// Individual layout stories
export const ChatCentric: Story = {
  name: 'A: Chat-Centric',
  render: () => <LayoutChatCentric />,
  parameters: {
    docs: {
      description: {
        story: 'Discord-style 60/40 split. Chat is primary, sidebar has tools/events. Default for most spaces.',
      },
    },
  },
};

export const EventFirst: Story = {
  name: 'B: Event-First',
  render: () => <LayoutEventFirst />,
  parameters: {
    docs: {
      description: {
        story: 'Hero banner dominates with countdown. Chat is secondary. For event-focused spaces (hackathons, workshops).',
      },
    },
  },
};

export const Dashboard: Story = {
  name: 'C: Dashboard',
  render: () => <LayoutDashboard />,
  parameters: {
    docs: {
      description: {
        story: 'Widget grid layout. Stats, polls, activity, compact chat. For org leadership and operational spaces.',
      },
    },
  },
};

export const Forum: Story = {
  name: 'D: Forum',
  render: () => <LayoutForum />,
  parameters: {
    docs: {
      description: {
        story: 'Thread-first layout. Posts > chat. For discussion-heavy academic or Q&A spaces.',
      },
    },
  },
};
