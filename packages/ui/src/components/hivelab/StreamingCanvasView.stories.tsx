import { useState, useEffect } from 'react';

import { StreamingCanvasView } from './StreamingCanvasView';

import type { Meta, StoryObj } from '@storybook/react';

// Local type definitions for Storybook
interface CanvasElement {
  elementId: string;
  instanceId: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface ToolComposition {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];
  connections: Array<{
    from: { instanceId: string; output: string };
    to: { instanceId: string; input: string };
  }>;
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

const meta: Meta<typeof StreamingCanvasView> = {
  title: 'HiveLab/AI/StreamingCanvasView',
  component: StreamingCanvasView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Real-time canvas visualization for AI-generated tools. Shows elements appearing one-by-one with animations.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof StreamingCanvasView>;

// Mock data
const mockElements: CanvasElement[] = [
  {
    elementId: 'form-builder',
    instanceId: 'elem_001',
    config: {
      fields: [
        { name: 'name', type: 'text', label: 'Full Name', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
        { name: 'meal', type: 'select', label: 'Meal Preference', options: ['Vegan', 'Vegetarian', 'No Preference'] }
      ],
      submitButtonText: 'Submit RSVP'
    },
    position: { x: 0, y: 0 },
    size: { width: 280, height: 200 }
  },
  {
    elementId: 'date-picker',
    instanceId: 'elem_002',
    config: {
      mode: 'single',
      showTime: true
    },
    position: { x: 320, y: 0 },
    size: { width: 280, height: 140 }
  },
  {
    elementId: 'result-list',
    instanceId: 'elem_003',
    config: {
      itemsPerPage: 10
    },
    position: { x: 0, y: 240 },
    size: { width: 280, height: 300 }
  },
  {
    elementId: 'user-selector',
    instanceId: 'elem_004',
    config: {
      allowMultiple: true,
      placeholder: 'Select attendees...'
    },
    position: { x: 320, y: 180 },
    size: { width: 280, height: 120 }
  }
];

const mockComposition: ToolComposition = {
  id: 'tool_001',
  name: 'Event RSVP Manager',
  description: 'Collect event RSVPs with meal preferences and view attendee list',
  elements: mockElements,
  connections: [
    {
      from: { instanceId: 'elem_001', output: 'submittedData' },
      to: { instanceId: 'elem_003', input: 'items' }
    },
    {
      from: { instanceId: 'elem_002', output: 'selectedDate' },
      to: { instanceId: 'elem_003', input: 'items' }
    }
  ],
  layout: 'flow'
};

// States
export const Empty: Story = {
  args: {
    elements: [],
    status: '',
    isGenerating: false,
    composition: null,
    progress: 0
  }
};

export const GeneratingFirstElement: Story = {
  args: {
    elements: [mockElements[0]!],
    status: 'Adding RSVP form...',
    isGenerating: true,
    composition: null,
    progress: 25
  }
};

export const GeneratingMultipleElements: Story = {
  args: {
    elements: mockElements.slice(0, 2),
    status: 'Adding date picker...',
    isGenerating: true,
    composition: null,
    progress: 50
  }
};

export const GeneratingNearlyComplete: Story = {
  args: {
    elements: mockElements.slice(0, 3),
    status: 'Adding user selector...',
    isGenerating: true,
    composition: null,
    progress: 75
  }
};

export const Complete: Story = {
  args: {
    elements: mockElements,
    status: 'Generation complete!',
    isGenerating: false,
    composition: mockComposition,
    progress: 100
  }
};

// Animated progression
export const AnimatedProgression: Story = {
  render: () => {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [status, setStatus] = useState('Starting generation...');
    const [isGenerating, setIsGenerating] = useState(true);
    const [composition, setComposition] = useState<ToolComposition | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      // Simulate streaming generation
      const timeline = [
        { delay: 1000, elementIndex: 0, status: 'Adding RSVP form...', progress: 25 },
        { delay: 2500, elementIndex: 1, status: 'Adding date picker...', progress: 50 },
        { delay: 4000, elementIndex: 2, status: 'Adding attendee list...', progress: 75 },
        { delay: 5500, elementIndex: 3, status: 'Adding user selector...', progress: 90 },
        { delay: 7000, elementIndex: 4, status: 'Generation complete!', progress: 100, complete: true }
      ];

      const timeouts = timeline.map(({ delay, elementIndex, status: newStatus, progress: newProgress, complete }) =>
        setTimeout(() => {
          if (complete) {
            setComposition(mockComposition);
            setIsGenerating(false);
          } else {
            setElements(prev => [...prev, mockElements[elementIndex]!]);
          }
          setStatus(newStatus);
          setProgress(newProgress);
        }, delay)
      );

      return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
      <div style={{ height: '100vh' }}>
        <StreamingCanvasView
          elements={elements}
          status={status}
          isGenerating={isGenerating}
          composition={composition}
          progress={progress}
        />
      </div>
    );
  }
};

// Different layouts
export const GridLayout: Story = {
  args: {
    elements: [
      {
        elementId: 'chart-display',
        instanceId: 'elem_001',
        config: { chartType: 'bar', title: 'Event Stats' },
        position: { x: 0, y: 0 },
        size: { width: 280, height: 200 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'elem_002',
        config: { chartType: 'pie', title: 'Meal Preferences' },
        position: { x: 320, y: 0 },
        size: { width: 280, height: 200 }
      },
      {
        elementId: 'filter-selector',
        instanceId: 'elem_003',
        config: { options: ['All', 'Vegan', 'Vegetarian'] },
        position: { x: 0, y: 240 },
        size: { width: 280, height: 120 }
      },
      {
        elementId: 'result-list',
        instanceId: 'elem_004',
        config: { itemsPerPage: 5 },
        position: { x: 320, y: 240 },
        size: { width: 280, height: 200 }
      }
    ],
    status: '',
    isGenerating: false,
    composition: {
      id: 'tool_002',
      name: 'Analytics Dashboard',
      description: 'View event analytics and filter results',
      elements: [],
      connections: [],
      layout: 'grid'
    },
    progress: 100
  }
};

// Error state (simulated)
export const WithError: Story = {
  render: () => (
    <div style={{ height: '100vh' }}>
      <StreamingCanvasView
        elements={mockElements.slice(0, 2)}
        status="Generation failed - please try again"
        isGenerating={false}
        composition={null}
        progress={50}
      />
    </div>
  )
};

// Progress states showcase
export const ProgressStates: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4" style={{ height: '100vh' }}>
      <div className="border rounded">
        <div className="p-2 border-b bg-muted">
          <p className="text-sm font-medium">0% - Starting</p>
        </div>
        <StreamingCanvasView
          elements={[]}
          status="Initializing generation..."
          isGenerating={true}
          composition={null}
          progress={0}
        />
      </div>

      <div className="border rounded">
        <div className="p-2 border-b bg-muted">
          <p className="text-sm font-medium">25% - First Element</p>
        </div>
        <StreamingCanvasView
          elements={mockElements.slice(0, 1)}
          status="Adding form..."
          isGenerating={true}
          composition={null}
          progress={25}
        />
      </div>

      <div className="border rounded">
        <div className="p-2 border-b bg-muted">
          <p className="text-sm font-medium">75% - Nearly Done</p>
        </div>
        <StreamingCanvasView
          elements={mockElements.slice(0, 3)}
          status="Adding final elements..."
          isGenerating={true}
          composition={null}
          progress={75}
        />
      </div>

      <div className="border rounded">
        <div className="p-2 border-b bg-muted">
          <p className="text-sm font-medium">100% - Complete</p>
        </div>
        <StreamingCanvasView
          elements={mockElements}
          status="Generation complete!"
          isGenerating={false}
          composition={mockComposition}
          progress={100}
        />
      </div>
    </div>
  )
};

// Mobile viewport
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  args: {
    elements: mockElements.slice(0, 2),
    status: 'Adding elements...',
    isGenerating: true,
    composition: null,
    progress: 50
  }
};
