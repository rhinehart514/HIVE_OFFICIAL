import { useState } from 'react';

import { AIPromptInput } from './AIPromptInput';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof AIPromptInput> = {
  title: 'HiveLab/AI/AIPromptInput',
  component: AIPromptInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'ChatGPT-style prompt input for AI tool generation. Supports hero (landing page) and inline (canvas header) variants.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['hero', 'inline'],
      description: 'Visual variant'
    },
    isGenerating: {
      control: 'boolean',
      description: 'Whether AI is currently generating'
    },
    showSuggestions: {
      control: 'boolean',
      description: 'Show demo prompt suggestions'
    },
    autoFocus: {
      control: 'boolean',
      description: 'Auto-focus input on mount'
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character limit'
    }
  }
};

export default meta;
type Story = StoryObj<typeof AIPromptInput>;

// Interactive wrapper for state management
const InteractiveWrapper = (args: any) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (prompt: string) => {
    console.log('Submitted prompt:', prompt);
    setIsGenerating(true);
    setStatus('Generating tool...');

    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    setStatus('Tool generated!');
    setTimeout(() => {
      setIsGenerating(false);
      setStatus('');
    }, 1000);
  };

  return (
    <div style={{ width: args.variant === 'hero' ? '1000px' : '600px' }}>
      <AIPromptInput
        {...args}
        isGenerating={isGenerating}
        status={status}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

// Hero variant stories
export const HeroDefault: Story = {
  args: {
    variant: 'hero',
    placeholder: 'Describe what you want to build for your campus org...',
    demoPrompts: [
      'Create an event RSVP form with meal preferences',
      'Build an anonymous feedback tool for club meetings',
      'Make a room finder for group study sessions',
      'Design a poll for voting on club logo designs'
    ],
    showSuggestions: true,
    autoFocus: false,
    maxLength: 1000
  },
  render: (args) => <InteractiveWrapper {...args} />
};

export const HeroGenerating: Story = {
  args: {
    ...HeroDefault.args,
    isGenerating: true,
    status: 'Adding search input...'
  }
};

export const HeroNoSuggestions: Story = {
  args: {
    ...HeroDefault.args,
    showSuggestions: false
  },
  render: (args) => <InteractiveWrapper {...args} />
};

export const HeroFocused: Story = {
  args: {
    ...HeroDefault.args,
    autoFocus: true
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// Inline variant stories
export const InlineDefault: Story = {
  args: {
    variant: 'inline',
    placeholder: 'Describe your tool...',
    demoPrompts: [
      'Event RSVP form',
      'Feedback tool',
      'Room finder'
    ],
    showSuggestions: true,
    maxLength: 500
  },
  render: (args) => <InteractiveWrapper {...args} />
};

export const InlineGenerating: Story = {
  args: {
    ...InlineDefault.args,
    isGenerating: true,
    status: 'Generating...'
  }
};

export const InlineNoSuggestions: Story = {
  args: {
    ...InlineDefault.args,
    showSuggestions: false
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// Edge cases
export const NearCharacterLimit: Story = {
  args: {
    variant: 'hero',
    placeholder: 'Describe what you want to build...',
    maxLength: 100,
    showSuggestions: false
  },
  render: (args) => <InteractiveWrapper {...args} />
};

export const WithLongSuggestions: Story = {
  args: {
    variant: 'hero',
    demoPrompts: [
      'Create a comprehensive event RSVP system with meal preferences, dietary restrictions, t-shirt sizes, and attendance confirmation',
      'Build an advanced anonymous feedback collection tool with rating scales, multiple choice questions, and open-ended responses',
      'Make an intelligent room finder for group study sessions with calendar integration, capacity filters, and amenity search'
    ],
    showSuggestions: true
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// States showcase
export const AllStates: Story = {
  render: () => (
    <div className="space-y-8 p-8 w-[1000px]">
      <div>
        <h3 className="text-lg font-semibold mb-4">Hero - Default</h3>
        <AIPromptInput
          variant="hero"
          onSubmit={(p) => console.log(p)}
          demoPrompts={['Event RSVP', 'Feedback form']}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Hero - Generating</h3>
        <AIPromptInput
          variant="hero"
          onSubmit={(p) => console.log(p)}
          isGenerating={true}
          status="Adding form elements..."
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Inline - Default</h3>
        <AIPromptInput
          variant="inline"
          onSubmit={(p) => console.log(p)}
          demoPrompts={['Poll', 'Survey', 'Quiz']}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Inline - Generating</h3>
        <AIPromptInput
          variant="inline"
          onSubmit={(p) => console.log(p)}
          isGenerating={true}
          status="Building tool..."
        />
      </div>
    </div>
  )
};
