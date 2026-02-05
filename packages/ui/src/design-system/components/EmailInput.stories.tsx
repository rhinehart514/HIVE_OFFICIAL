'use client';

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { EmailInput, getFullEmail, isValidEmailUsername } from './EmailInput';

/**
 * EmailInput — Campus email input with domain suffix
 *
 * The domain suffix is displayed inside the input, making it clear
 * this is a campus-specific authentication flow.
 *
 * Design philosophy:
 * - User only types username, domain always visible
 * - Prevents typos, reinforces campus-specific nature
 * - White pill button activates when input has value
 *
 * @see Onboarding & Auth Vertical Slice
 */
const meta: Meta<typeof EmailInput> = {
  title: 'Design System/Components/Auth/EmailInput',
  component: EmailInput,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Campus-specific email input with domain suffix displayed inside. User only types username.',
      },
    },
  },
  argTypes: {
    domainSuffix: {
      control: 'text',
      description: 'Email domain suffix',
    },
    placeholder: {
      control: 'text',
      description: 'Input placeholder',
    },
    submitText: {
      control: 'text',
      description: 'Submit button text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Auto-focus on mount',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmailInput>;

// Wrapper component for dark background
const DarkWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-screen flex items-center justify-center p-8"
    style={{ backgroundColor: 'var(--color-bg-page)' }}
  >
    <div className="w-full max-w-sm">{children}</div>
  </div>
);

/**
 * Default — Empty state
 */
export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = React.useState('');

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Welcome to HIVE</h1>
            <p className="text-body text-white/50">Enter your campus email</p>
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix="buffalo.edu"
            onSubmit={() => alert(`Email: ${getFullEmail(value, 'buffalo.edu')}`)}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * With Value — Button activated
 */
export const WithValue: Story = {
  render: function WithValueStory() {
    const [value, setValue] = React.useState('jsmith');

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Welcome to HIVE</h1>
            <p className="text-body text-white/50">Enter your campus email</p>
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix="buffalo.edu"
            onSubmit={() => alert(`Email: ${getFullEmail(value, 'buffalo.edu')}`)}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Error State
 */
export const ErrorState: Story = {
  render: function ErrorStory() {
    const [value, setValue] = React.useState('invalid user');

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Welcome to HIVE</h1>
            <p className="text-body text-white/50">Enter your campus email</p>
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix="buffalo.edu"
            error="Please enter a valid email username"
            onSubmit={() => {}}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Loading State
 */
export const LoadingState: Story = {
  render: function LoadingStory() {
    const [value, setValue] = React.useState('jsmith');

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Welcome to HIVE</h1>
            <p className="text-body text-white/50">Enter your campus email</p>
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix="buffalo.edu"
            isLoading={true}
            onSubmit={() => {}}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Disabled State
 */
export const DisabledState: Story = {
  render: function DisabledStory() {
    const [value, setValue] = React.useState('jsmith');

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Welcome to HIVE</h1>
            <p className="text-body text-white/50">Enter your campus email</p>
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix="buffalo.edu"
            disabled={true}
            onSubmit={() => {}}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Different Domains
 */
export const DifferentDomains: Story = {
  render: function DomainsStory() {
    const [value, setValue] = React.useState('');
    const [domain, setDomain] = React.useState('buffalo.edu');
    const domains = ['buffalo.edu', 'stanford.edu', 'mit.edu', 'harvard.edu'];

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Multi-campus</h1>
            <p className="text-body text-white/50">Select your university</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {domains.map((d) => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`px-3 py-1.5 rounded-lg text-body-sm transition-colors ${
                  domain === d
                    ? 'bg-[var(--color-gold)] text-black'
                    : 'bg-white/10 text-white'
                }`}
              >
                @{d}
              </button>
            ))}
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix={domain}
            onSubmit={() => alert(`Email: ${getFullEmail(value, domain)}`)}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Custom Submit Text
 */
export const CustomSubmitText: Story = {
  render: function CustomTextStory() {
    const [value, setValue] = React.useState('');

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Sign in</h1>
            <p className="text-body text-white/50">We'll send you a magic code</p>
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix="buffalo.edu"
            submitText="Send Magic Code"
            onSubmit={() => alert('Sending code...')}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Custom Placeholder
 */
export const CustomPlaceholder: Story = {
  render: function CustomPlaceholderStory() {
    const [value, setValue] = React.useState('');

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Join HIVE</h1>
            <p className="text-body text-white/50">Enter your student email</p>
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix="buffalo.edu"
            placeholder="jsmith2"
            onSubmit={() => alert('Joining...')}
          />
        </div>
      </DarkWrapper>
    );
  },
};


/**
 * Interactive Validation
 */
export const InteractiveValidation: Story = {
  render: function ValidationStory() {
    const [value, setValue] = React.useState('');
    const [touched, setTouched] = React.useState(false);

    const isValid = isValidEmailUsername(value);
    const error = touched && value && !isValid
      ? 'Username can only contain letters, numbers, dots, and dashes'
      : undefined;

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Live Validation</h1>
            <p className="text-body text-white/50">Try invalid characters</p>
          </div>
          <EmailInput
            value={value}
            onChange={(v) => {
              setValue(v);
              if (!touched) setTouched(true);
            }}
            domainSuffix="buffalo.edu"
            error={error}
            onSubmit={() => alert('Valid!')}
          />
          <div className="text-center text-body-sm text-white/40">
            <p>Valid: a-z, A-Z, 0-9, dots, underscores, hyphens</p>
            <p className="mt-1">
              Current: {value || '(empty)'} → {isValid ? '✓ Valid' : '✗ Invalid'}
            </p>
          </div>
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Helper Functions Demo
 */
export const HelperFunctionsDemo: Story = {
  render: function HelpersStory() {
    const [value, setValue] = React.useState('jsmith');
    const domain = 'buffalo.edu';

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Helper Functions</h1>
          </div>
          <EmailInput
            value={value}
            onChange={setValue}
            domainSuffix={domain}
            onSubmit={() => {}}
          />
          <div className="p-4 rounded-xl bg-white/5 text-body-sm font-mono space-y-2">
            <p className="text-white/60">
              <span className="text-white/40">getFullEmail({`'${value}', '${domain}'`})</span>
            </p>
            <p className="text-white">→ "{getFullEmail(value, domain)}"</p>
            <p className="text-white/60 mt-4">
              <span className="text-white/40">isValidEmailUsername({`'${value}'`})</span>
            </p>
            <p className="text-white">→ {isValidEmailUsername(value) ? 'true' : 'false'}</p>
          </div>
        </div>
      </DarkWrapper>
    );
  },
};
