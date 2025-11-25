'use client';

import { Search, Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { Input } from './input';

import type { Meta, StoryObj } from '@storybook/react';


const meta = {
  title: '00-Global/Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile input component with multiple variants, sizes, and features. Supports labels, helper text, icons, and error states. Built with accessibility in mind using ARIA attributes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'subtle', 'destructive', 'error', 'success', 'brand', 'ghost', 'warning'],
      description: 'Visual variant of the input',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Size of the input',
    },
    width: {
      control: 'select',
      options: ['full', 'auto', 'fit'],
      description: 'Width behavior of the input',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
      description: 'HTML input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    label: {
      control: 'text',
      description: 'Label text displayed above the input',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below the input',
    },
    description: {
      control: 'text',
      description: 'Description text displayed below the label',
    },
    error: {
      control: 'text',
      description: 'Error message displayed below the input (overrides helperText)',
    },
    showClearButton: {
      control: 'boolean',
      description: 'Show clear button when input has value',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'jacob_smith',
    helperText: 'Choose a unique username that represents you.',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Campus email',
    description: 'Use your official university email address (@buffalo.edu)',
    placeholder: 'yourname@buffalo.edu',
    type: 'email',
  },
};

// ===== VARIANTS =====

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    label: 'Search',
    placeholder: 'Search spaces, tools, people...',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    label: 'Email verified',
    placeholder: 'jacob@buffalo.edu',
    helperText: 'Your email has been verified successfully.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    error: 'Password must be at least 8 characters long.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    label: 'Handle',
    placeholder: 'jacob_smith',
    helperText: 'This handle is already taken. Please choose another.',
  },
};

export const Brand: Story = {
  args: {
    variant: 'brand',
    label: 'Join code',
    placeholder: 'Enter your space join code',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Type to search...',
  },
};

// ===== SIZES =====

export const SizeSmall: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

export const SizeDefault: Story = {
  args: {
    size: 'default',
    placeholder: 'Default input',
  },
};

export const SizeLarge: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

export const SizeExtraLarge: Story = {
  args: {
    size: 'xl',
    placeholder: 'Extra large input',
  },
};

// ===== WITH ICONS =====

export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search HIVE...',
    leftIcon: <Search className="h-4 w-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'you@buffalo.edu',
    rightIcon: <Mail className="h-4 w-4" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    leftIcon: <Lock className="h-4 w-4" />,
    rightIcon: <Eye className="h-4 w-4" />,
  },
};

export const IconWithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'you@buffalo.edu',
    leftIcon: <Mail className="h-4 w-4" />,
    rightIcon: <AlertCircle className="h-4 w-4 text-[var(--hive-status-error)]" />,
    error: 'Please enter a valid email address.',
  },
};

export const IconWithSuccess: Story = {
  args: {
    variant: 'success',
    label: 'Email verified',
    type: 'email',
    placeholder: 'jacob@buffalo.edu',
    defaultValue: 'jacob@buffalo.edu',
    leftIcon: <Mail className="h-4 w-4" />,
    rightIcon: <CheckCircle2 className="h-4 w-4 text-[var(--hive-status-success)]" />,
    helperText: 'Your email has been verified.',
  },
};

// ===== CLEAR BUTTON =====

export const WithClearButton: Story = {
  render: () => {
    const [value, setValue] = React.useState('jacob@buffalo.edu');

    return (
      <Input
        label="Email"
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue('')}
        showClearButton
        placeholder="you@buffalo.edu"
      />
    );
  },
};

export const ClearButtonWithIcons: Story = {
  render: () => {
    const [value, setValue] = React.useState('Search results for "UB CS"');

    return (
      <Input
        label="Search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue('')}
        showClearButton
        leftIcon={<Search className="h-4 w-4" />}
        placeholder="Search HIVE..."
      />
    );
  },
};

// ===== STATES =====

export const Disabled: Story = {
  args: {
    label: 'Disabled input',
    placeholder: 'Cannot edit this field',
    disabled: true,
  },
};

export const DisabledWithValue: Story = {
  args: {
    label: 'Campus',
    defaultValue: 'University at Buffalo',
    disabled: true,
    helperText: 'Your campus cannot be changed.',
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Profile ID',
    defaultValue: 'usr_2abc4def5ghi',
    readOnly: true,
    helperText: 'This is your unique profile identifier.',
  },
};

// ===== INPUT TYPES =====

export const EmailType: Story = {
  args: {
    type: 'email',
    label: 'Email',
    placeholder: 'you@buffalo.edu',
    leftIcon: <Mail className="h-4 w-4" />,
  },
};

export const PasswordType: Story = {
  render: () => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <Input
        type={showPassword ? 'text' : 'password'}
        label="Password"
        placeholder="••••••••"
        leftIcon={<Lock className="h-4 w-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        helperText="Must be at least 8 characters long."
      />
    );
  },
};

export const SearchType: Story = {
  args: {
    type: 'search',
    placeholder: 'Search spaces, tools, people...',
    leftIcon: <Search className="h-4 w-4" />,
    variant: 'subtle',
  },
};

export const NumberType: Story = {
  args: {
    type: 'number',
    label: 'Graduation year',
    placeholder: '2025',
    min: 2020,
    max: 2030,
  },
};

// ===== REAL-WORLD EXAMPLES =====

export const LoginForm: Story = {
  render: () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    return (
      <div className="flex flex-col gap-4 w-[400px]">
        <Input
          type="email"
          label="University email"
          placeholder="you@buffalo.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          description="Use your @buffalo.edu email address"
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          helperText="Forgot password?"
        />
      </div>
    );
  },
};

export const OnboardingStep: Story = {
  render: () => {
    const [handle, setHandle] = React.useState('');
    const [isChecking, setIsChecking] = React.useState(false);
    const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);

    const checkAvailability = React.useCallback(async (value: string) => {
      if (value.length < 3) {
        setIsAvailable(null);
        return;
      }

      setIsChecking(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsChecking(false);
      setIsAvailable(value !== 'jacob_smith'); // Mock: jacob_smith is taken
    }, []);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        checkAvailability(handle);
      }, 500);
      return () => clearTimeout(timer);
    }, [handle, checkAvailability]);

    const getVariant = () => {
      if (isChecking) return 'default';
      if (isAvailable === true) return 'success';
      if (isAvailable === false) return 'error';
      return 'default';
    };

    const getHelperText = () => {
      if (isChecking) return 'Checking availability...';
      if (isAvailable === true) return '✓ This handle is available!';
      if (isAvailable === false) return 'This handle is already taken.';
      return 'Choose a unique handle for your profile.';
    };

    return (
      <div className="w-[400px]">
        <Input
          label="Choose your handle"
          placeholder="jacob_smith"
          value={handle}
          onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          onClear={() => setHandle('')}
          showClearButton
          variant={getVariant()}
          leftIcon={<User className="h-4 w-4" />}
          rightIcon={
            isChecking ? (
              <div className="animate-spin h-4 w-4 border-2 border-[var(--hive-brand-primary)] border-t-transparent rounded-full" />
            ) : isAvailable === true ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--hive-status-success)]" />
            ) : isAvailable === false ? (
              <AlertCircle className="h-4 w-4 text-[var(--hive-status-error)]" />
            ) : null
          }
          helperText={getHelperText()}
          description="Letters, numbers, and underscores only"
        />
      </div>
    );
  },
};

export const SearchBar: Story = {
  render: () => {
    const [query, setQuery] = React.useState('');

    return (
      <div className="w-[500px]">
        <Input
          type="search"
          placeholder="Search spaces, tools, people, and more..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          showClearButton
          leftIcon={<Search className="h-4 w-4" />}
          variant="subtle"
          size="lg"
        />
      </div>
    );
  },
};

// ===== VALIDATION EXAMPLES =====

export const FormValidation: Story = {
  render: () => {
    const [email, setEmail] = React.useState('');
    const [touched, setTouched] = React.useState(false);

    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const showError = touched && email.length > 0 && !isValid;
    const showSuccess = touched && isValid;

    return (
      <div className="w-[400px]">
        <Input
          type="email"
          label="Email validation example"
          placeholder="you@buffalo.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          variant={showError ? 'error' : showSuccess ? 'success' : 'default'}
          leftIcon={<Mail className="h-4 w-4" />}
          rightIcon={
            showSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--hive-status-success)]" />
            ) : showError ? (
              <AlertCircle className="h-4 w-4 text-[var(--hive-status-error)]" />
            ) : null
          }
          error={showError ? 'Please enter a valid email address.' : undefined}
          helperText={!showError && !showSuccess ? 'Enter your university email address.' : undefined}
        />
      </div>
    );
  },
};

// ===== ACCESSIBILITY =====

export const AccessibilityDemo: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[400px]">
        <div className="text-sm text-[var(--hive-text-secondary)] mb-2">
          <p className="font-medium text-[var(--hive-text-primary)] mb-1">Accessibility Features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Proper label associations with htmlFor</li>
            <li>aria-invalid on error states</li>
            <li>aria-describedby for helper text</li>
            <li>aria-disabled for disabled states</li>
            <li>Keyboard navigable clear button</li>
            <li>Focus-visible states</li>
          </ul>
        </div>

        <Input
          label="Accessible input"
          placeholder="Try tabbing and using keyboard"
          helperText="This input follows WAI-ARIA guidelines."
        />

        <Input
          label="Error example"
          error="This demonstrates aria-invalid and aria-describedby"
          placeholder="Has error state"
        />
      </div>
    );
  },
};

// ===== DARK MODE =====

export const DarkModeExample: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[400px] p-6 rounded-lg bg-[var(--hive-background-primary)]">
        <Input
          label="Email"
          type="email"
          placeholder="you@buffalo.edu"
          leftIcon={<Mail className="h-4 w-4" />}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
        />
        <Input
          variant="success"
          label="Verified"
          defaultValue="jacob@buffalo.edu"
          helperText="Your email has been verified."
        />
      </div>
    );
  },
};
