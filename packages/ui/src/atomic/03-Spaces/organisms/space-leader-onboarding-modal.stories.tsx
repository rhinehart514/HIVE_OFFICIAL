'use client';

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { SpaceLeaderOnboardingModal } from './space-leader-onboarding-modal';
import type { QuickTemplate } from '../../../lib/hivelab/quick-templates';

/**
 * SpaceLeaderOnboardingModal - First-time leader setup wizard
 *
 * Shown to new leaders when they first access their space.
 * Guides them through welcome, template deployment, and invites.
 */
const meta = {
  title: '03-Spaces/Organisms/SpaceLeaderOnboardingModal',
  component: SpaceLeaderOnboardingModal,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#0A0A0A]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is visible',
    },
  },
} satisfies Meta<typeof SpaceLeaderOnboardingModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock templates for stories
const mockTemplates: QuickTemplate[] = [
  {
    id: 'quick-poll',
    name: 'Quick Poll',
    description: 'Get instant feedback from members',
    icon: 'bar-chart-2',
    category: 'engagement',
    defaultConfig: { placement: 'sidebar', collapsed: false },
    composition: {
      id: 'comp_1',
      name: 'Quick Poll',
      description: 'A simple poll',
      elements: [],
      connections: [],
      layout: 'flow',
    },
  },
  {
    id: 'office-hours',
    name: 'Office Hours',
    description: 'Schedule availability for 1:1s',
    icon: 'timer',
    category: 'organization',
    defaultConfig: { placement: 'sidebar', collapsed: false },
    composition: {
      id: 'comp_2',
      name: 'Office Hours',
      description: 'Book time slots',
      elements: [],
      connections: [],
      layout: 'flow',
    },
  },
  {
    id: 'quick-links',
    name: 'Resource Links',
    description: 'Share important links with members',
    icon: 'link-2',
    category: 'communication',
    defaultConfig: { placement: 'sidebar', collapsed: false },
    composition: {
      id: 'comp_3',
      name: 'Quick Links',
      description: 'Important links',
      elements: [],
      connections: [],
      layout: 'flow',
    },
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Post updates for your community',
    icon: 'message-square',
    category: 'communication',
    defaultConfig: { placement: 'sidebar', collapsed: false },
    composition: {
      id: 'comp_4',
      name: 'Announcements',
      description: 'Space announcements',
      elements: [],
      connections: [],
      layout: 'flow',
    },
  },
];

const mockData = {
  spaceName: 'Design Club',
  spaceId: 'design-club-123',
  memberCount: 24,
  templates: mockTemplates,
};

// Simulate async deploy action
const mockDeployTemplate = async (template: QuickTemplate) => {
  action('deploy-template')(template);
  await new Promise((resolve) => setTimeout(resolve, 1500));
};

/**
 * Default state - modal open showing welcome step
 */
export const Default: Story = {
  args: {
    open: true,
    data: mockData,
    onClose: action('close'),
    onComplete: action('complete'),
    onDeployTemplate: mockDeployTemplate,
    onOpenHiveLab: action('open-hivelab'),
    onOpenInvite: action('open-invite'),
    onSkip: action('skip'),
  },
};

/**
 * Welcome step (Step 1) - Congratulations message
 */
export const WelcomeStep: Story = {
  args: {
    ...Default.args,
    open: true,
  },
};

/**
 * Templates step (Step 2) - Deploy quick tools
 *
 * Use the controls to interact. Click "Let's get started" on
 * the Welcome step to navigate here.
 */
export const TemplatesStep: Story = {
  args: {
    ...Default.args,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step 2: Quick-deploy templates. Click templates to deploy them (simulated 1.5s delay).',
      },
    },
  },
};

/**
 * Invite step (Step 3) - Invite members CTA
 */
export const InviteStep: Story = {
  args: {
    ...Default.args,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step 3: Invite members and view setup checklist. Navigate through steps 1 and 2 to reach this.',
      },
    },
  },
};

/**
 * Interactive - Full flow demo
 *
 * Complete walkthrough of all 3 steps with working navigation
 */
export const Interactive: Story = {
  args: {
    ...Default.args,
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full interactive demo. Navigate through all steps and try deploying templates.',
      },
    },
  },
};

/**
 * With many members - shows member count context
 */
export const WithManyMembers: Story = {
  args: {
    ...Default.args,
    open: true,
    data: {
      ...mockData,
      memberCount: 156,
    },
  },
};

/**
 * New space - single member (the leader)
 */
export const NewSpace: Story = {
  args: {
    ...Default.args,
    open: true,
    data: {
      ...mockData,
      spaceName: 'New Photography Club',
      memberCount: 1,
    },
  },
};

/**
 * Long space name - tests text wrapping
 */
export const LongSpaceName: Story = {
  args: {
    ...Default.args,
    open: true,
    data: {
      ...mockData,
      spaceName: 'University at Buffalo Computer Science & Engineering Student Association',
    },
  },
};

/**
 * Closed modal - nothing visible
 */
export const Closed: Story = {
  args: {
    ...Default.args,
    open: false,
  },
};

/**
 * Controlled example - demonstrates state management
 */
function ControlledModalExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-white text-xl font-semibold">Controlled Modal Demo</h2>
      <p className="text-neutral-400 text-sm max-w-md text-center">
        Click the button to open the leader onboarding modal. This demonstrates
        the typical usage pattern in your app.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 bg-[#FFD700] text-black font-medium rounded-lg hover:bg-[#FFD700]/90 transition-colors"
      >
        Open Leader Onboarding
      </button>
      <SpaceLeaderOnboardingModal
        open={open}
        onClose={() => setOpen(false)}
        data={mockData}
        onComplete={() => {
          action('complete')();
          setOpen(false);
        }}
        onDeployTemplate={mockDeployTemplate}
        onOpenHiveLab={() => {
          action('open-hivelab')();
          setOpen(false);
        }}
        onOpenInvite={action('open-invite')}
        onSkip={() => {
          action('skip')();
          setOpen(false);
        }}
      />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledModalExample />,
};

/**
 * With fewer templates - shows 2 templates instead of 4
 */
export const FewerTemplates: Story = {
  args: {
    ...Default.args,
    open: true,
    data: {
      ...mockData,
      templates: mockTemplates.slice(0, 2),
    },
  },
};

/**
 * Without HiveLab callback - hides custom tool option
 */
export const WithoutHiveLab: Story = {
  args: {
    ...Default.args,
    open: true,
    onOpenHiveLab: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'When onOpenHiveLab is undefined, the "Create custom tool" option is still shown but leads nowhere.',
      },
    },
  },
};
