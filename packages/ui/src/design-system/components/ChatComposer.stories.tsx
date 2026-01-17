'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChatComposer, ChatComposerMinimal, type ChatAttachment, type ChatReplyTo } from './ChatComposer';

const meta: Meta<typeof ChatComposer> = {
  title: 'Design System/Components/ChatComposer',
  component: ChatComposer,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#0A0A0A] min-h-[400px]">
        <div className="max-w-2xl mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatComposer>;

// Interactive wrapper
const ChatComposerDemo = () => {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const handleSubmit = (msg: { content: string }) => {
    console.log('Submitted:', msg);
    setValue('');
    setAttachments([]);
  };

  const handleAddAttachment = (files: File[]) => {
    const newAttachments: ChatAttachment[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      name: file.name,
      type: file.type,
      size: file.size,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <ChatComposer
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      attachments={attachments}
      onAddAttachment={handleAddAttachment}
      onRemoveAttachment={handleRemoveAttachment}
    />
  );
};

/**
 * Default chat composer with full functionality
 */
export const Default: Story = {
  render: () => <ChatComposerDemo />,
};

/**
 * With placeholder typing
 */
export const WithContent: Story = {
  args: {
    value: 'Hey everyone! I wanted to share some updates about the upcoming event...',
    placeholder: 'Type a message...',
  },
};

/**
 * Reply mode - replying to another message
 */
export const ReplyMode: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [replyTo, setReplyTo] = useState<ChatReplyTo | null>({
      id: '1',
      authorName: 'Jane Doe',
      content: 'Hey everyone, I wanted to share some updates about the project...',
    });

    return (
      <ChatComposer
        value={value}
        onChange={setValue}
        replyTo={replyTo || undefined}
        onCancelReply={() => setReplyTo(null)}
        placeholder="Type your reply..."
      />
    );
  },
};

/**
 * With file attachments
 */
export const WithAttachments: Story = {
  render: () => {
    const [value, setValue] = useState('Here are the files you requested');
    const [attachments, setAttachments] = useState<ChatAttachment[]>([
      { id: '1', name: 'project-proposal.pdf', type: 'application/pdf', size: 245000 },
      { id: '2', name: 'meeting-notes.docx', type: 'application/docx', size: 128000 },
      { id: '3', name: 'screenshot.png', type: 'image/png', size: 89000 },
    ]);

    return (
      <ChatComposer
        value={value}
        onChange={setValue}
        attachments={attachments}
        onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
      />
    );
  },
};

/**
 * Uploading state with progress
 */
export const Uploading: Story = {
  args: {
    value: 'Uploading files...',
    attachments: [
      { id: '1', name: 'large-video.mp4', type: 'video/mp4', size: 52428800, progress: 45 },
      { id: '2', name: 'image.png', type: 'image/png', size: 89000, progress: 100 },
    ],
  },
};

/**
 * Sending state with spinner
 */
export const Sending: Story = {
  args: {
    value: 'This message is being sent...',
    isSending: true,
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    value: 'This message failed to send',
    error: 'Failed to send message. Please try again.',
  },
};

/**
 * With character limit
 */
export const WithCharacterLimit: Story = {
  render: () => {
    const [value, setValue] = useState('This is a message with a character limit showing the count...');

    return (
      <ChatComposer
        value={value}
        onChange={setValue}
        maxLength={100}
        showCharCount
      />
    );
  },
};

/**
 * Over character limit
 */
export const OverLimit: Story = {
  args: {
    value: 'This is a very long message that exceeds the character limit and should show an error state with the character count in red to indicate that the user needs to shorten their message before sending.',
    maxLength: 100,
    showCharCount: true,
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    value: '',
    placeholder: 'Chat is disabled',
    disabled: true,
  },
};

/**
 * Minimal variant - compact single-line
 */
export const Minimal: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <ChatComposerMinimal
        value={value}
        onChange={setValue}
        onSubmit={(msg) => {
          console.log('Sent:', msg);
          setValue('');
        }}
        placeholder="Quick message..."
      />
    );
  },
};

/**
 * All states comparison
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#818187] mb-2">Empty</p>
        <ChatComposer placeholder="Type a message..." />
      </div>

      <div>
        <p className="text-xs text-[#818187] mb-2">With Content (Send enabled - gold)</p>
        <ChatComposer value="Hello, this is a message with content" />
      </div>

      <div>
        <p className="text-xs text-[#818187] mb-2">Reply Mode</p>
        <ChatComposer
          replyTo={{ id: '1', authorName: 'Jane', content: 'Original message...' }}
          onCancelReply={() => {}}
        />
      </div>

      <div>
        <p className="text-xs text-[#818187] mb-2">With Attachments</p>
        <ChatComposer
          attachments={[
            { id: '1', name: 'file.pdf', type: 'application/pdf', size: 1000 },
          ]}
        />
      </div>

      <div>
        <p className="text-xs text-[#818187] mb-2">Sending</p>
        <ChatComposer value="Sending..." isSending />
      </div>

      <div>
        <p className="text-xs text-[#818187] mb-2">Error</p>
        <ChatComposer value="Failed message" error="Network error" />
      </div>

      <div>
        <p className="text-xs text-[#818187] mb-2">Disabled</p>
        <ChatComposer disabled placeholder="Chat disabled" />
      </div>

      <div>
        <p className="text-xs text-[#818187] mb-2">Minimal Variant</p>
        <ChatComposerMinimal placeholder="Quick message..." />
      </div>
    </div>
  ),
};
