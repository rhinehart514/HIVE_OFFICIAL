'use client';

import { MessageSquare, FileText, AlertCircle, CheckCircle2, Lightbulb, Pen } from 'lucide-react';
import * as React from 'react';

import { Textarea } from './textarea';

import type { Meta, StoryObj } from '@storybook/react';


const meta = {
  title: '00-Global/Atoms/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile textarea component with multiple variants, sizes, auto-resize, character counting, and accessibility features. Built with CVA for variant management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'subtle', 'destructive', 'success', 'warning', 'ghost', 'outline'],
      description: 'Visual variant of the textarea',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Size of the textarea',
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
      description: 'Resize behavior',
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
      description: 'Border radius',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
    autoResize: {
      control: 'boolean',
      description: 'Automatically resize based on content',
    },
    showCount: {
      control: 'boolean',
      description: 'Show character count',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length',
    },
  },
} satisfies Meta<typeof Textarea>;

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
    label: 'Description',
    placeholder: 'Describe your project...',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself...',
    helperText: 'This will be displayed on your public profile.',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Event details',
    description: 'Provide a comprehensive description of your event including location, time, and what attendees should bring.',
    placeholder: 'Enter event details...',
  },
};

// ===== VARIANTS =====

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    label: 'Notes',
    placeholder: 'Add private notes...',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    label: 'Report reason',
    placeholder: 'Why are you reporting this?',
    error: 'Please provide a detailed reason for reporting.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    label: 'Application approved',
    defaultValue: 'Your application has been reviewed and approved. Welcome to HIVE!',
    helperText: 'Your submission was successful.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    label: 'Review changes',
    placeholder: 'This action requires review...',
    helperText: 'Changes will be pending until approved by a moderator.',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Type here... (ghost variant)',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Outlined textarea',
    placeholder: 'Enter text...',
  },
};

// ===== SIZES =====

export const SizeSmall: Story = {
  args: {
    size: 'sm',
    label: 'Quick note',
    placeholder: 'Small textarea...',
  },
};

export const SizeDefault: Story = {
  args: {
    size: 'default',
    label: 'Comment',
    placeholder: 'Default size textarea...',
  },
};

export const SizeLarge: Story = {
  args: {
    size: 'lg',
    label: 'Post content',
    placeholder: 'Large textarea...',
  },
};

export const SizeExtraLarge: Story = {
  args: {
    size: 'xl',
    label: 'Article',
    placeholder: 'Extra large textarea...',
  },
};

// ===== RESIZE OPTIONS =====

export const ResizeNone: Story = {
  args: {
    resize: 'none',
    label: 'Fixed size (resize: none)',
    placeholder: 'Cannot resize this textarea...',
    helperText: 'This textarea cannot be resized.',
  },
};

export const ResizeVertical: Story = {
  args: {
    resize: 'vertical',
    label: 'Vertical resize (default)',
    placeholder: 'Can resize vertically...',
    helperText: 'Drag the bottom edge to resize.',
  },
};

export const ResizeHorizontal: Story = {
  args: {
    resize: 'horizontal',
    label: 'Horizontal resize',
    placeholder: 'Can resize horizontally...',
    helperText: 'Drag the right edge to resize.',
  },
};

export const ResizeBoth: Story = {
  args: {
    resize: 'both',
    label: 'Both directions',
    placeholder: 'Can resize in any direction...',
    helperText: 'Drag any corner or edge to resize.',
  },
};

// ===== ROUNDED VARIANTS =====

export const RoundedNone: Story = {
  args: {
    rounded: 'none',
    placeholder: 'No border radius...',
  },
};

export const RoundedSmall: Story = {
  args: {
    rounded: 'sm',
    placeholder: 'Small border radius...',
  },
};

export const RoundedMedium: Story = {
  args: {
    rounded: 'md',
    placeholder: 'Medium border radius...',
  },
};

export const RoundedLarge: Story = {
  args: {
    rounded: 'lg',
    placeholder: 'Large border radius (default)...',
  },
};

export const RoundedExtraLarge: Story = {
  args: {
    rounded: 'xl',
    placeholder: 'Extra large border radius...',
  },
};

// ===== CHARACTER COUNT =====

export const WithCharacterCount: Story = {
  render: () => {
    const [value, setValue] = React.useState('');

    return (
      <div className="w-[500px]">
        <Textarea
          label="Post content"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={280}
          showCount
          placeholder="What's on your mind?"
          helperText="Share your thoughts with your campus community."
        />
      </div>
    );
  },
};

export const CharacterLimitExceeded: Story = {
  render: () => {
    const [value, setValue] = React.useState(
      'This is a very long text that exceeds the maximum character limit. It demonstrates how the component handles character count when the limit is exceeded. The count will turn red and the input will prevent further typing.'
    );

    return (
      <div className="w-[500px]">
        <Textarea
          label="Short description"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={100}
          showCount
          placeholder="Brief description..."
          error={value.length > 100 ? 'Description is too long. Please shorten it.' : undefined}
        />
      </div>
    );
  },
};

// ===== AUTO-RESIZE =====

export const AutoResize: Story = {
  render: () => {
    const [value, setValue] = React.useState('This textarea will automatically grow as you type more content.');

    return (
      <div className="w-[500px]">
        <Textarea
          label="Auto-growing textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoResize
          placeholder="Start typing and watch it grow..."
          helperText="This textarea will expand automatically as you type."
        />
      </div>
    );
  },
};

export const AutoResizeWithCount: Story = {
  render: () => {
    const [value, setValue] = React.useState('');

    return (
      <div className="w-[500px]">
        <Textarea
          label="Comment"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoResize
          maxLength={500}
          showCount
          placeholder="Add your comment..."
          helperText="Your comment will be visible to all space members."
        />
      </div>
    );
  },
};

// ===== WITH ICONS =====

export const WithLeftIcon: Story = {
  args: {
    label: 'Message',
    leftIcon: <MessageSquare className="h-4 w-4" />,
    placeholder: 'Write your message...',
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Document',
    rightIcon: <FileText className="h-4 w-4" />,
    placeholder: 'Enter document content...',
  },
};

export const WithErrorIcon: Story = {
  args: {
    label: 'Required field',
    rightIcon: <AlertCircle className="h-4 w-4 text-[var(--hive-status-error)]" />,
    error: 'This field is required.',
    placeholder: 'Enter required information...',
  },
};

export const WithSuccessIcon: Story = {
  args: {
    variant: 'success',
    label: 'Verification note',
    defaultValue: 'Your identity has been successfully verified.',
    rightIcon: <CheckCircle2 className="h-4 w-4 text-[var(--hive-status-success)]" />,
    helperText: 'Verification complete.',
  },
};

// ===== CLEAR BUTTON =====

export const WithClearButton: Story = {
  render: () => {
    const [value, setValue] = React.useState('This text can be cleared with the button in the corner.');

    return (
      <div className="w-[500px]">
        <Textarea
          label="Notes"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue('')}
          showClearButton
          placeholder="Enter your notes..."
          helperText="Click the × button to clear all text."
        />
      </div>
    );
  },
};

// ===== REQUIRED & OPTIONAL =====

export const Required: Story = {
  args: {
    label: 'Project description',
    placeholder: 'Describe your project...',
    required: true,
    helperText: 'This field is required.',
  },
};

export const Optional: Story = {
  args: {
    label: 'Additional notes',
    placeholder: 'Any additional information...',
    optional: true,
    helperText: 'You can leave this blank if not applicable.',
  },
};

// ===== STATES =====

export const Disabled: Story = {
  args: {
    label: 'Disabled textarea',
    defaultValue: 'This content cannot be edited.',
    disabled: true,
    helperText: 'This field is disabled.',
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Read-only content',
    defaultValue: 'This is read-only content that cannot be modified.',
    readOnly: true,
    helperText: 'This content is read-only.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Report details',
    placeholder: 'Provide details...',
    error: 'Please provide at least 50 characters.',
    defaultValue: 'Too short',
  },
};

// ===== REAL-WORLD EXAMPLES =====

export const PostCreation: Story = {
  render: () => {
    const [content, setContent] = React.useState('');

    return (
      <div className="flex flex-col gap-4 w-[600px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-lg font-semibold text-[var(--hive-text-primary)]">
          Create a Post
        </h3>

        <Textarea
          label="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with your campus community..."
          maxLength={5000}
          showCount
          autoResize
          size="lg"
          leftIcon={<Pen className="h-4 w-4" />}
          helperText="Be respectful and follow community guidelines."
        />
      </div>
    );
  },
};

export const CommentSection: Story = {
  render: () => {
    const [comment, setComment] = React.useState('');

    return (
      <div className="w-[500px]">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          autoResize
          size="sm"
          variant="subtle"
          maxLength={500}
          showCount
          leftIcon={<MessageSquare className="h-4 w-4" />}
        />
      </div>
    );
  },
};

export const EventDescription: Story = {
  render: () => {
    const [description, setDescription] = React.useState('');

    return (
      <div className="w-[600px]">
        <Textarea
          label="Event description"
          description="Include details about what attendees can expect, any requirements, and how to prepare."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your event in detail..."
          maxLength={2000}
          showCount
          required
          size="lg"
          helperText="A detailed description helps attract the right attendees."
        />
      </div>
    );
  },
};

export const FeedbackForm: Story = {
  render: () => {
    const [feedback, setFeedback] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    return (
      <div className="flex flex-col gap-4 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-lg font-semibold text-[var(--hive-text-primary)]">
          Share Your Feedback
        </h3>

        {!submitted ? (
          <>
            <Textarea
              label="What can we improve?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience and how we can make HIVE better..."
              maxLength={1000}
              showCount
              size="lg"
              required
              leftIcon={<Lightbulb className="h-4 w-4" />}
              helperText="Your feedback helps us build a better platform for everyone."
            />
            <button
              onClick={() => setSubmitted(true)}
              disabled={feedback.length < 10}
              className="px-4 py-2 bg-[var(--hive-brand-primary)] text-white rounded-lg disabled:opacity-50"
            >
              Submit Feedback
            </button>
          </>
        ) : (
          <div className="p-4 rounded-lg bg-[var(--hive-status-success)]/10 border border-[var(--hive-status-success)]">
            <p className="text-[var(--hive-status-success)] font-medium">
              Thank you for your feedback!
            </p>
          </div>
        )}
      </div>
    );
  },
};

export const ReportContent: Story = {
  render: () => {
    const [reason, setReason] = React.useState('');
    const isValid = reason.length >= 20;

    return (
      <div className="flex flex-col gap-4 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-lg font-semibold text-[var(--hive-text-primary)]">
          Report Content
        </h3>

        <Textarea
          label="Reason for reporting"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please provide a detailed explanation..."
          maxLength={500}
          showCount
          required
          size="lg"
          variant={reason.length > 0 && !isValid ? 'destructive' : 'default'}
          error={reason.length > 0 && !isValid ? 'Please provide at least 20 characters.' : undefined}
          helperText={isValid ? 'Thank you for providing details.' : 'Help us understand the issue.'}
        />

        <div className="flex gap-3 justify-end">
          <button className="px-4 py-2 text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] rounded-lg">
            Cancel
          </button>
          <button
            disabled={!isValid}
            className="px-4 py-2 bg-[var(--hive-status-error)] text-white rounded-lg disabled:opacity-50"
          >
            Submit Report
          </button>
        </div>
      </div>
    );
  },
};

export const BioEditor: Story = {
  render: () => {
    const [bio, setBio] = React.useState(
      "I'm a Computer Science student passionate about building tools that help students connect and collaborate."
    );

    return (
      <div className="w-[600px]">
        <Textarea
          label="Bio"
          description="Write a brief introduction about yourself that will be displayed on your profile."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onClear={() => setBio('')}
          showClearButton
          maxLength={300}
          showCount
          size="lg"
          optional
          helperText="Share your interests, major, and what you're looking for on HIVE."
        />
      </div>
    );
  },
};

// ===== ACCESSIBILITY =====

export const AccessibilityDemo: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[500px]">
        <div className="text-sm text-[var(--hive-text-secondary)] mb-2">
          <p className="font-medium text-[var(--hive-text-primary)] mb-1">Accessibility Features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Proper label associations with htmlFor</li>
            <li>aria-invalid on error states</li>
            <li>aria-describedby for helper text</li>
            <li>aria-live for character count</li>
            <li>Keyboard navigable clear button</li>
            <li>Focus-visible states</li>
          </ul>
        </div>

        <Textarea
          label="Accessible textarea"
          placeholder="Try tabbing and using keyboard..."
          helperText="This textarea follows WAI-ARIA guidelines."
        />

        <Textarea
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
      <div className="flex flex-col gap-4 w-[500px] p-6 rounded-lg bg-[var(--hive-background-primary)]">
        <Textarea
          label="Message"
          placeholder="Enter your message..."
          leftIcon={<MessageSquare className="h-4 w-4" />}
          helperText="This looks great in dark mode!"
        />

        <Textarea
          variant="success"
          label="Success state"
          defaultValue="This content has been saved successfully."
          rightIcon={<CheckCircle2 className="h-4 w-4 text-[var(--hive-status-success)]" />}
        />
      </div>
    );
  },
};

// ===== SIZE COMPARISON =====

export const SizeComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[600px]">
        <Textarea
          size="sm"
          label="Small"
          placeholder="Small textarea..."
        />
        <Textarea
          size="default"
          label="Default"
          placeholder="Default textarea..."
        />
        <Textarea
          size="lg"
          label="Large"
          placeholder="Large textarea..."
        />
        <Textarea
          size="xl"
          label="Extra Large"
          placeholder="Extra large textarea..."
        />
      </div>
    );
  },
};

export const VariantComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[600px]">
        <Textarea variant="default" placeholder="Default variant" />
        <Textarea variant="subtle" placeholder="Subtle variant" />
        <Textarea variant="outline" placeholder="Outline variant" />
        <Textarea variant="ghost" placeholder="Ghost variant" />
        <Textarea variant="success" placeholder="Success variant" />
        <Textarea variant="warning" placeholder="Warning variant" />
        <Textarea variant="destructive" placeholder="Destructive variant" />
      </div>
    );
  },
};
