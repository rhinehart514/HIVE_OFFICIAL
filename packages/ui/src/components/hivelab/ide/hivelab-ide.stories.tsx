'use client';

import * as React from 'react';

import { HiveLabIDE, type HiveLabIDEProps, type HiveLabComposition } from './hivelab-ide';
import type { CanvasElement, Connection } from './types';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Mock Data
// ============================================================

const mockElements: CanvasElement[] = [
  {
    id: 'element_1',
    elementId: 'poll',
    instanceId: 'poll_1',
    position: { x: 100, y: 100 },
    size: { width: 260, height: 140 },
    config: {
      question: 'What day works best for our next meeting?',
      options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    zIndex: 1,
    locked: false,
    visible: true,
  },
  {
    id: 'element_2',
    elementId: 'timer',
    instanceId: 'timer_1',
    position: { x: 400, y: 100 },
    size: { width: 200, height: 120 },
    config: {
      duration: 3600,
      label: 'Voting ends in',
    },
    zIndex: 2,
    locked: false,
    visible: true,
  },
  {
    id: 'element_3',
    elementId: 'result-display',
    instanceId: 'result_1',
    position: { x: 250, y: 280 },
    size: { width: 280, height: 160 },
    config: {
      title: 'Poll Results',
      showChart: true,
    },
    zIndex: 3,
    locked: false,
    visible: true,
  },
];

const mockConnections: Connection[] = [
  {
    id: 'conn_1',
    from: { instanceId: 'poll_1', port: 'votes' },
    to: { instanceId: 'result_1', port: 'data' },
  },
  {
    id: 'conn_2',
    from: { instanceId: 'timer_1', port: 'expired' },
    to: { instanceId: 'poll_1', port: 'close' },
  },
];

const emptyComposition = {
  id: 'tool_new',
  name: '',
  description: '',
  elements: [],
  connections: [],
};

const simpleComposition = {
  id: 'tool_simple',
  name: 'Quick Poll',
  description: 'A simple voting poll',
  elements: [mockElements[0]],
  connections: [],
};

const complexComposition = {
  id: 'tool_complex',
  name: 'Meeting Scheduler',
  description: 'Schedule meetings with automatic reminders',
  elements: mockElements,
  connections: mockConnections,
};

const largeComposition = {
  id: 'tool_large',
  name: 'Event Planning Suite',
  description: 'Complete event management toolkit',
  elements: [
    ...mockElements,
    {
      id: 'element_4',
      elementId: 'form',
      instanceId: 'form_1',
      position: { x: 600, y: 100 },
      size: { width: 280, height: 200 },
      config: { fields: ['name', 'email', 'message'] },
      zIndex: 4,
      locked: false,
      visible: true,
    },
    {
      id: 'element_5',
      elementId: 'chart',
      instanceId: 'chart_1',
      position: { x: 600, y: 340 },
      size: { width: 280, height: 180 },
      config: { type: 'bar' },
      zIndex: 5,
      locked: false,
      visible: true,
    },
    {
      id: 'element_6',
      elementId: 'notification',
      instanceId: 'notif_1',
      position: { x: 100, y: 340 },
      size: { width: 220, height: 100 },
      config: { message: 'New response received!' },
      zIndex: 6,
      locked: false,
      visible: true,
    },
  ],
  connections: mockConnections,
};

// Default callbacks for all stories
const defaultCallbacks = {
  onSave: async (composition: HiveLabComposition) => {
    console.log('Save:', composition);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  },
  onPreview: (composition: HiveLabComposition) => {
    console.log('Preview:', composition);
  },
  onCancel: () => {
    console.log('Cancel');
  },
};

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '05-HiveLab/IDE/HiveLabIDE',
  component: HiveLabIDE,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Full-featured visual IDE for building HiveLab tools. Features drag-drop canvas, element palette, layers panel, properties inspector, AI-assisted generation, undo/redo, and deployment flow.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showOnboarding: {
      control: 'boolean',
      description: 'Show onboarding overlay for new users',
    },
  },
} satisfies Meta<typeof HiveLabIDE>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// BASIC STATES
// ============================================================

export const Default: Story = {
  args: {
    initialComposition: emptyComposition,
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty canvas ready for creating a new tool.',
      },
    },
  },
};

export const WithOnboarding: Story = {
  args: {
    initialComposition: emptyComposition,
    showOnboarding: true,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty canvas with onboarding overlay for new users.',
      },
    },
  },
};

export const WithExistingTool: Story = {
  args: {
    initialComposition: complexComposition,
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'IDE loaded with an existing tool composition.',
      },
    },
  },
};

export const SimplePolltool: Story = {
  args: {
    initialComposition: simpleComposition,
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Simple single-element poll tool.',
      },
    },
  },
};

export const ComplexTool: Story = {
  args: {
    initialComposition: largeComposition,
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex tool with many elements and connections.',
      },
    },
  },
};

// ============================================================
// USER CONTEXT VARIATIONS
// ============================================================

export const RegularUser: Story = {
  args: {
    initialComposition: emptyComposition,
    showOnboarding: false,
    userId: 'user-123',
    userContext: {
      userId: 'user-123',
      campusId: 'ub-buffalo',
      isSpaceLeader: false,
      leadingSpaceIds: [],
    },
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'IDE for regular user (no space-tier elements available).',
      },
    },
  },
};

export const SpaceLeader: Story = {
  args: {
    initialComposition: emptyComposition,
    showOnboarding: false,
    userId: 'user-123',
    userContext: {
      userId: 'user-123',
      campusId: 'ub-buffalo',
      isSpaceLeader: true,
      leadingSpaceIds: ['space-1', 'space-2'],
    },
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'IDE for space leader (all element tiers available).',
      },
    },
  },
};

// ============================================================
// DEPLOY FLOW
// ============================================================

export const WithDeployButton: Story = {
  args: {
    initialComposition: simpleComposition,
    showOnboarding: false,
    userId: 'user-123',
    originSpaceId: 'space-design-club',
    onDeploy: async (composition: HiveLabComposition) => {
      console.log('Deploy to space:', composition);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'IDE with "Save & Deploy" button (when launched from a Space).',
      },
    },
  },
};

export const DeployToMultipleSpaces: Story = {
  args: {
    initialComposition: complexComposition,
    showOnboarding: false,
    userId: 'user-123',
    userContext: {
      userId: 'user-123',
      campusId: 'ub-buffalo',
      isSpaceLeader: true,
      leadingSpaceIds: ['space-1', 'space-2', 'space-3'],
    },
    originSpaceId: 'space-1',
    onDeploy: async (composition: HiveLabComposition) => {
      console.log('Deploy:', composition);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Space leader with multiple spaces can deploy to their origin space.',
      },
    },
  },
};

// ============================================================
// TOOL NAME VARIATIONS
// ============================================================

export const UntitledTool: Story = {
  args: {
    initialComposition: {
      ...simpleComposition,
      name: '',
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tool with no name (will save as "Untitled Tool").',
      },
    },
  },
};

export const LongToolName: Story = {
  args: {
    initialComposition: {
      ...simpleComposition,
      name: 'Weekly Team Meeting Scheduler with Automatic Reminders and RSVP Tracking',
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tool with very long name (tests toolbar overflow).',
      },
    },
  },
};

// ============================================================
// INTERACTIVE EXAMPLES
// ============================================================

export const InteractiveIDE: Story = {
  render: () => {
    const [savedComposition, setSavedComposition] = React.useState<HiveLabComposition | null>(null);
    const [saveCount, setSaveCount] = React.useState(0);

    const handleSave = async (composition: HiveLabComposition) => {
      console.log('Saving...', composition);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSavedComposition(composition);
      setSaveCount((prev) => prev + 1);
      console.log('Saved!');
    };

    return (
      <div className="h-screen flex flex-col">
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 text-sm text-neutral-400">
          <span>Saves: {saveCount}</span>
          {savedComposition && (
            <span className="ml-4">
              Last saved: {savedComposition.name || 'Untitled'} ({savedComposition.elements.length} elements)
            </span>
          )}
        </div>
        <div className="flex-1">
          <HiveLabIDE
            initialComposition={emptyComposition}
            showOnboarding={false}
            userId="user-123"
            onSave={handleSave}
            onPreview={(c) => console.log('Preview:', c)}
            onCancel={() => console.log('Cancel')}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with save state tracking.',
      },
    },
  },
};

export const EditExistingTool: Story = {
  render: () => {
    const [composition, setComposition] = React.useState(complexComposition);

    const handleSave = async (newComposition: HiveLabComposition) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setComposition({
        ...newComposition,
        elements: newComposition.elements as CanvasElement[],
      });
      console.log('Updated composition:', newComposition);
    };

    return (
      <HiveLabIDE
        initialComposition={composition}
        showOnboarding={false}
        userId="user-123"
        onSave={handleSave}
        onPreview={(c) => console.log('Preview:', c)}
        onCancel={() => console.log('Cancel')}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Edit an existing tool composition.',
      },
    },
  },
};

// ============================================================
// ELEMENT VARIATIONS
// ============================================================

export const SingleElement: Story = {
  args: {
    initialComposition: {
      id: 'tool_single',
      name: 'Single Element',
      description: '',
      elements: [mockElements[0]],
      connections: [],
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tool with a single element (no connections).',
      },
    },
  },
};

export const ManyElements: Story = {
  args: {
    initialComposition: {
      id: 'tool_many',
      name: 'Many Elements',
      description: 'Stress test with many elements',
      elements: Array.from({ length: 12 }, (_, i) => ({
        id: `element_${i}`,
        elementId: ['poll', 'timer', 'form', 'chart', 'notification', 'result-display'][i % 6],
        instanceId: `instance_${i}`,
        position: { x: 100 + (i % 4) * 300, y: 100 + Math.floor(i / 4) * 200 },
        size: { width: 260, height: 140 },
        config: {},
        zIndex: i + 1,
        locked: false,
        visible: true,
      })),
      connections: [],
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tool with many elements (performance test).',
      },
    },
  },
};

export const WithLockedElements: Story = {
  args: {
    initialComposition: {
      id: 'tool_locked',
      name: 'Locked Elements',
      description: '',
      elements: [
        { ...mockElements[0], locked: true },
        mockElements[1],
        { ...mockElements[2], locked: true },
      ],
      connections: mockConnections,
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tool with some locked elements (cannot be moved).',
      },
    },
  },
};

export const WithHiddenElements: Story = {
  args: {
    initialComposition: {
      id: 'tool_hidden',
      name: 'Hidden Elements',
      description: '',
      elements: [
        mockElements[0],
        { ...mockElements[1], visible: false },
        mockElements[2],
      ],
      connections: mockConnections,
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tool with some hidden elements (visible in layers panel).',
      },
    },
  },
};

// ============================================================
// CONNECTION VARIATIONS
// ============================================================

export const NoConnections: Story = {
  args: {
    initialComposition: {
      id: 'tool_no_conn',
      name: 'Unconnected Elements',
      description: '',
      elements: mockElements,
      connections: [],
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple elements with no connections.',
      },
    },
  },
};

export const ManyConnections: Story = {
  args: {
    initialComposition: {
      id: 'tool_many_conn',
      name: 'Connected Workflow',
      description: '',
      elements: [
        ...mockElements,
        {
          id: 'element_4',
          elementId: 'notification',
          instanceId: 'notif_1',
          position: { x: 550, y: 280 },
          size: { width: 220, height: 100 },
          config: {},
          zIndex: 4,
          locked: false,
          visible: true,
        },
      ],
      connections: [
        ...mockConnections,
        { id: 'conn_3', from: { instanceId: 'poll_1', port: 'complete' }, to: { instanceId: 'notif_1', port: 'trigger' } },
        { id: 'conn_4', from: { instanceId: 'result_1', port: 'rendered' }, to: { instanceId: 'notif_1', port: 'message' } },
      ],
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex workflow with many element connections.',
      },
    },
  },
};

// ============================================================
// REAL-WORLD SCENARIOS
// ============================================================

export const EventRSVPTool: Story = {
  args: {
    initialComposition: {
      id: 'tool_rsvp',
      name: 'Event RSVP',
      description: 'Collect RSVPs for club events',
      elements: [
        {
          id: 'e1',
          elementId: 'form',
          instanceId: 'rsvp_form',
          position: { x: 100, y: 100 },
          size: { width: 300, height: 200 },
          config: {
            title: 'RSVP for Design Workshop',
            fields: ['name', 'email', 'dietary'],
          },
          zIndex: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'e2',
          elementId: 'timer',
          instanceId: 'deadline_timer',
          position: { x: 450, y: 100 },
          size: { width: 200, height: 120 },
          config: {
            label: 'RSVP deadline',
            duration: 86400,
          },
          zIndex: 2,
          locked: false,
          visible: true,
        },
        {
          id: 'e3',
          elementId: 'result-display',
          instanceId: 'attendee_count',
          position: { x: 100, y: 340 },
          size: { width: 280, height: 140 },
          config: {
            title: 'Confirmed Attendees',
            showCount: true,
          },
          zIndex: 3,
          locked: false,
          visible: true,
        },
      ],
      connections: [
        { id: 'c1', from: { instanceId: 'rsvp_form', port: 'submission' }, to: { instanceId: 'attendee_count', port: 'data' } },
      ],
    },
    showOnboarding: false,
    userId: 'user-123',
    originSpaceId: 'space-design-club',
    onDeploy: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world event RSVP tool ready for deployment.',
      },
    },
  },
};

export const FeedbackCollector: Story = {
  args: {
    initialComposition: {
      id: 'tool_feedback',
      name: 'Feedback Collector',
      description: 'Gather and analyze member feedback',
      elements: [
        {
          id: 'e1',
          elementId: 'form',
          instanceId: 'feedback_form',
          position: { x: 100, y: 100 },
          size: { width: 320, height: 220 },
          config: {
            title: 'Share Your Feedback',
            fields: ['rating', 'comments', 'suggestions'],
          },
          zIndex: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'e2',
          elementId: 'chart',
          instanceId: 'rating_chart',
          position: { x: 480, y: 100 },
          size: { width: 300, height: 200 },
          config: {
            type: 'bar',
            title: 'Satisfaction Ratings',
          },
          zIndex: 2,
          locked: false,
          visible: true,
        },
        {
          id: 'e3',
          elementId: 'notification',
          instanceId: 'thank_you',
          position: { x: 100, y: 360 },
          size: { width: 260, height: 100 },
          config: {
            message: 'Thank you for your feedback!',
          },
          zIndex: 3,
          locked: false,
          visible: true,
        },
      ],
      connections: [
        { id: 'c1', from: { instanceId: 'feedback_form', port: 'rating' }, to: { instanceId: 'rating_chart', port: 'data' } },
        { id: 'c2', from: { instanceId: 'feedback_form', port: 'submitted' }, to: { instanceId: 'thank_you', port: 'trigger' } },
      ],
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Feedback collection tool with chart visualization.',
      },
    },
  },
};

export const StudyGroupScheduler: Story = {
  args: {
    initialComposition: {
      id: 'tool_study',
      name: 'Study Group Scheduler',
      description: 'Coordinate study sessions with availability voting',
      elements: [
        {
          id: 'e1',
          elementId: 'poll',
          instanceId: 'time_poll',
          position: { x: 100, y: 100 },
          size: { width: 280, height: 160 },
          config: {
            question: 'When can you meet?',
            options: ['Monday 3pm', 'Tuesday 5pm', 'Wednesday 4pm', 'Thursday 6pm'],
            allowMultiple: true,
          },
          zIndex: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'e2',
          elementId: 'poll',
          instanceId: 'topic_poll',
          position: { x: 420, y: 100 },
          size: { width: 280, height: 160 },
          config: {
            question: 'What topic should we cover?',
            options: ['Data Structures', 'Algorithms', 'System Design'],
          },
          zIndex: 2,
          locked: false,
          visible: true,
        },
        {
          id: 'e3',
          elementId: 'result-display',
          instanceId: 'schedule_result',
          position: { x: 260, y: 300 },
          size: { width: 300, height: 140 },
          config: {
            title: 'Scheduled Session',
            format: 'summary',
          },
          zIndex: 3,
          locked: false,
          visible: true,
        },
      ],
      connections: [
        { id: 'c1', from: { instanceId: 'time_poll', port: 'winner' }, to: { instanceId: 'schedule_result', port: 'time' } },
        { id: 'c2', from: { instanceId: 'topic_poll', port: 'winner' }, to: { instanceId: 'schedule_result', port: 'topic' } },
      ],
    },
    showOnboarding: false,
    userId: 'user-123',
    userContext: {
      userId: 'user-123',
      campusId: 'ub-buffalo',
      isSpaceLeader: true,
      leadingSpaceIds: ['cs-study-group'],
    },
    originSpaceId: 'cs-study-group',
    onDeploy: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Study group coordination tool with dual polls.',
      },
    },
  },
};

// ============================================================
// EDGE CASES
// ============================================================

export const OffCanvasElements: Story = {
  args: {
    initialComposition: {
      id: 'tool_off',
      name: 'Off-Canvas',
      description: '',
      elements: [
        {
          id: 'e1',
          elementId: 'poll',
          instanceId: 'poll_off',
          position: { x: -200, y: 100 },
          size: { width: 260, height: 140 },
          config: {},
          zIndex: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'e2',
          elementId: 'timer',
          instanceId: 'timer_far',
          position: { x: 1500, y: 800 },
          size: { width: 200, height: 120 },
          config: {},
          zIndex: 2,
          locked: false,
          visible: true,
        },
      ],
      connections: [],
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Elements positioned off the visible canvas area.',
      },
    },
  },
};

export const OverlappingElements: Story = {
  args: {
    initialComposition: {
      id: 'tool_overlap',
      name: 'Overlapping',
      description: '',
      elements: [
        {
          id: 'e1',
          elementId: 'poll',
          instanceId: 'poll_1',
          position: { x: 200, y: 150 },
          size: { width: 260, height: 140 },
          config: {},
          zIndex: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'e2',
          elementId: 'timer',
          instanceId: 'timer_1',
          position: { x: 250, y: 180 },
          size: { width: 200, height: 120 },
          config: {},
          zIndex: 2,
          locked: false,
          visible: true,
        },
        {
          id: 'e3',
          elementId: 'form',
          instanceId: 'form_1',
          position: { x: 280, y: 200 },
          size: { width: 280, height: 180 },
          config: {},
          zIndex: 3,
          locked: false,
          visible: true,
        },
      ],
      connections: [],
    },
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple overlapping elements (tests z-index).',
      },
    },
  },
};

// ============================================================
// RESPONSIVE LAYOUT
// ============================================================

export const NarrowViewport: Story = {
  args: {
    initialComposition: simpleComposition,
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '800px', height: '600px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'IDE in narrow viewport (panels may need collapsing).',
      },
    },
  },
};

export const WideViewport: Story = {
  args: {
    initialComposition: complexComposition,
    showOnboarding: false,
    userId: 'user-123',
    ...defaultCallbacks,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '1600px', height: '900px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'IDE in wide viewport with ample canvas space.',
      },
    },
  },
};

// ============================================================
// SAVE/DEPLOY STATES
// ============================================================

export const SaveInProgress: Story = {
  render: () => {
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setSaving((prev) => !prev);
      }, 3000);
      return () => clearInterval(timer);
    }, []);

    return (
      <HiveLabIDE
        initialComposition={simpleComposition}
        showOnboarding={false}
        userId="user-123"
        onSave={async () => {
          setSaving(true);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setSaving(false);
        }}
        onPreview={() => {}}
        onCancel={() => {}}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the saving state indicator in toolbar.',
      },
    },
  },
};

export const DeployInProgress: Story = {
  render: () => (
    <HiveLabIDE
      initialComposition={simpleComposition}
      showOnboarding={false}
      userId="user-123"
      originSpaceId="space-123"
      onSave={async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }}
      onDeploy={async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }}
      onPreview={() => {}}
      onCancel={() => {}}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Click "Save & Deploy" to see the deploy progress state.',
      },
    },
  },
};
