import type { Meta, StoryObj } from '@storybook/react';
import { ToolCard } from './ToolCard';

const meta: Meta<typeof ToolCard> = {
  title: 'Design System/Components/Cards/ToolCard',
  component: ToolCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a HiveLab tool in galleries/discovery contexts. Uses LiveCounter for run stats (gold when > 0).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'large'],
    },
    featured: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ToolCard>;

const mockTool = {
  id: 'tool-1',
  name: 'Study Planner',
  description: 'AI-powered study schedule generator that optimizes your learning based on due dates and difficulty.',
  preview: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
  creator: {
    id: 'user-1',
    name: 'Sarah Chen',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
  },
  runCount: 847,
  category: 'Productivity',
  isDeployed: true,
};

export const Default: Story = {
  args: {
    tool: mockTool,
    onClick: () => console.log('Tool clicked'),
    onCreatorClick: () => console.log('Creator clicked'),
  },
};

export const Compact: Story = {
  args: {
    tool: mockTool,
    variant: 'compact',
  },
};

export const Large: Story = {
  args: {
    tool: mockTool,
    variant: 'large',
  },
};

export const Featured: Story = {
  args: {
    tool: mockTool,
    featured: true,
  },
};

export const NoPreview: Story = {
  args: {
    tool: {
      ...mockTool,
      preview: undefined,
    },
  },
};

export const NewTool: Story = {
  args: {
    tool: {
      ...mockTool,
      runCount: 0,
      isDeployed: false,
    },
  },
};

export const PopularTool: Story = {
  args: {
    tool: {
      ...mockTool,
      runCount: 12847,
      featured: true,
    },
    featured: true,
  },
};

export const ToolGallery: Story = {
  render: () => {
    const tools = [
      {
        id: '1',
        name: 'Study Planner',
        description: 'AI-powered study schedule generator',
        preview: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
        creator: { id: '1', name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=sarah' },
        runCount: 847,
        category: 'Productivity',
        isDeployed: true,
      },
      {
        id: '2',
        name: 'GPA Calculator',
        description: 'Quick grade point average calculator',
        preview: 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=400&q=80',
        creator: { id: '2', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?u=mike' },
        runCount: 2341,
        category: 'Academic',
        isDeployed: true,
      },
      {
        id: '3',
        name: 'Event RSVP',
        description: 'Track event attendance easily',
        creator: { id: '3', name: 'Alex Kim' },
        runCount: 156,
        category: 'Events',
        isDeployed: false,
      },
    ];

    return (
      <div className="grid grid-cols-3 gap-4 max-w-4xl">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    );
  },
};
