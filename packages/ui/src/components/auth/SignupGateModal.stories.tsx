import { useState } from 'react';

import { Button } from '../../design-system/primitives';

import { SignupGateModal } from './SignupGateModal';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SignupGateModal> = {
  title: 'HiveLab/AI/SignupGateModal',
  component: SignupGateModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Conversion-optimized signup modal shown when unauthenticated users try to deploy tools. Features @buffalo.edu validation and contextual messaging.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether modal is visible'
    },
    toolName: {
      control: 'text',
      description: 'Name of tool being deployed (contextual messaging)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof SignupGateModal>;

// Interactive wrapper
const InteractiveWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(args.isOpen ?? false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (email: string, password: string) => {
    console.log('Signup:', email, password);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Signup Gate
      </Button>
      <SignupGateModal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSignup={handleSignup}
      />
    </>
  );
};

// Default state
export const Default: Story = {
  args: {
    isOpen: true,
    toolName: 'Event RSVP Manager',
    heading: undefined,
    description: undefined
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// With custom tool name
export const CustomToolName: Story = {
  args: {
    isOpen: true,
    toolName: 'Anonymous Feedback Collector',
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// With custom messaging
export const CustomMessaging: Story = {
  args: {
    isOpen: true,
    toolName: 'Room Finder',
    heading: 'Join your campus to share this tool',
    description: 'Create a free account to deploy custom tools to your student organizations and campus communities.'
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// Redirect variant (no inline form)
export const RedirectMode: Story = {
  args: {
    isOpen: true,
    toolName: 'Poll Builder',
    redirectToSignup: () => {
      console.log('Redirecting to signup page...');
      alert('Would redirect to /auth/signup');
    }
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// No tool name (generic)
export const NoToolName: Story = {
  args: {
    isOpen: true,
    toolName: undefined
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// Form interactions showcase
export const FormInteractions: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [step, setStep] = useState<'empty' | 'typing' | 'error' | 'loading'>('empty');

    const handleSignup = async (email: string, password: string) => {
      setStep('loading');
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!email.endsWith('@buffalo.edu')) {
        setStep('error');
        throw new Error('Please use your @buffalo.edu email');
      }

      setIsOpen(false);
      setStep('empty');
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => { setIsOpen(true); setStep('empty'); }}>
            Empty State
          </Button>
          <Button onClick={() => { setIsOpen(true); setStep('typing'); }}>
            Typing State
          </Button>
          <Button onClick={() => { setIsOpen(true); setStep('error'); }}>
            Error State
          </Button>
          <Button onClick={() => { setIsOpen(true); setStep('loading'); }}>
            Loading State
          </Button>
        </div>

        <SignupGateModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSignup={handleSignup}
          toolName="Event RSVP Manager"
        />
      </div>
    );
  }
};

// Mobile viewport
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  args: {
    isOpen: true,
    toolName: 'Feedback Form'
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// All states showcase
export const AllStates: Story = {
  render: () => {
    const [state1, setState1] = useState(true);
    const [state2, setState2] = useState(true);
    const [state3, setState3] = useState(true);

    return (
      <div className="space-y-4 p-4">
        <h2 className="text-xl font-bold">Signup Gate Modal - All States</h2>

        <div className="space-y-2">
          <h3 className="font-semibold">1. With Tool Name + Inline Form</h3>
          <Button onClick={() => setState1(true)}>Open</Button>
          <SignupGateModal
            isOpen={state1}
            onClose={() => setState1(false)}
            onSignup={async (e, p) => {
              console.log('Signup:', e, p);
              await new Promise(r => setTimeout(r, 1000));
              setState1(false);
            }}
            toolName="Event RSVP Manager"
          />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">2. Redirect Mode</h3>
          <Button onClick={() => setState2(true)}>Open</Button>
          <SignupGateModal
            isOpen={state2}
            onClose={() => setState2(false)}
            redirectToSignup={() => {
              console.log('Redirect');
              setState2(false);
            }}
            toolName="Poll Builder"
          />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">3. Custom Messaging</h3>
          <Button onClick={() => setState3(true)}>Open</Button>
          <SignupGateModal
            isOpen={state3}
            onClose={() => setState3(false)}
            onSignup={async () => {
              await new Promise(r => setTimeout(r, 1000));
              setState3(false);
            }}
            toolName="Room Finder"
            heading="Join UB on HIVE"
            description="Connect with 10,000+ students and deploy your custom tools to campus organizations."
          />
        </div>
      </div>
    );
  }
};

// Validation showcase
export const ValidationStates: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [validationCase, setValidationCase] = useState<'invalid-email' | 'short-password' | 'valid'>('invalid-email');

    const handleSignup = async (email: string, password: string) => {
      if (validationCase === 'invalid-email') {
        throw new Error('Please use your @buffalo.edu email');
      }
      if (validationCase === 'short-password') {
        throw new Error('Password must be at least 8 characters');
      }
      setIsOpen(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => { setValidationCase('invalid-email'); setIsOpen(true); }}>
            Invalid Email
          </Button>
          <Button onClick={() => { setValidationCase('short-password'); setIsOpen(true); }}>
            Short Password
          </Button>
          <Button onClick={() => { setValidationCase('valid'); setIsOpen(true); }}>
            Valid Signup
          </Button>
        </div>

        <SignupGateModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSignup={handleSignup}
          toolName="Analytics Dashboard"
        />
      </div>
    );
  }
};

// Long tool name
export const LongToolName: Story = {
  args: {
    isOpen: true,
    toolName: 'Comprehensive Event Management System with RSVP Tracking, Meal Preferences, and Attendee Analytics'
  },
  render: (args) => <InteractiveWrapper {...args} />
};

// Benefits highlight
export const BenefitsHighlight: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows the 3-benefit conversion layout with contextual tool preview'
      }
    }
  },
  args: {
    isOpen: true,
    toolName: 'Event RSVP Manager'
  },
  render: (args) => <InteractiveWrapper {...args} />
};
