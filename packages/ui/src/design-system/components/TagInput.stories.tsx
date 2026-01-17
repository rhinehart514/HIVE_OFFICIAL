'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TagInput, Tag } from './TagInput';

const meta: Meta<typeof TagInput> = {
  title: 'Design System/Components/TagInput',
  component: TagInput,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#0A0A0A] min-h-[400px]">
        <div className="max-w-md">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TagInput>;

/**
 * Interactive tag input
 */
export const Default: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>(['React', 'TypeScript']);

    return (
      <TagInput
        value={tags}
        onChange={setTags}
        placeholder="Add tags..."
      />
    );
  },
};

/**
 * With suggestions
 */
export const WithSuggestions: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>(['React']);
    const suggestions = [
      'TypeScript',
      'JavaScript',
      'Node.js',
      'Next.js',
      'Tailwind CSS',
      'GraphQL',
      'PostgreSQL',
      'MongoDB',
    ];

    return (
      <TagInput
        value={tags}
        onChange={setTags}
        suggestions={suggestions}
        placeholder="Type to search..."
      />
    );
  },
};

/**
 * With max limit
 */
export const WithMaxLimit: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>(['Tag 1', 'Tag 2', 'Tag 3']);

    return (
      <div className="space-y-4">
        <p className="text-sm text-[#818187]">Max 5 tags allowed</p>
        <TagInput
          value={tags}
          onChange={setTags}
          max={5}
          placeholder="Add up to 5 tags..."
        />
      </div>
    );
  },
};

/**
 * Suggestions only (no custom)
 */
export const SuggestionsOnly: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>([]);
    const suggestions = ['Frontend', 'Backend', 'Fullstack', 'DevOps', 'Mobile'];

    return (
      <div className="space-y-4">
        <p className="text-sm text-[#818187]">Only predefined tags allowed</p>
        <TagInput
          value={tags}
          onChange={setTags}
          suggestions={suggestions}
          allowCustom={false}
          placeholder="Select a category..."
        />
      </div>
    );
  },
};

/**
 * Tag variants
 */
export const TagVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-[#818187] mb-2">Default</p>
        <div className="flex flex-wrap gap-2">
          <Tag>React</Tag>
          <Tag onRemove={() => {}}>TypeScript</Tag>
          <Tag>Node.js</Tag>
        </div>
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Primary</p>
        <div className="flex flex-wrap gap-2">
          <Tag variant="primary">Frontend</Tag>
          <Tag variant="primary" onRemove={() => {}}>Backend</Tag>
        </div>
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Gold (special/featured)</p>
        <div className="flex flex-wrap gap-2">
          <Tag variant="gold">Featured</Tag>
          <Tag variant="gold" onRemove={() => {}}>Premium</Tag>
        </div>
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Muted</p>
        <div className="flex flex-wrap gap-2">
          <Tag variant="muted">Archived</Tag>
          <Tag variant="muted" onRemove={() => {}}>Draft</Tag>
        </div>
      </div>
    </div>
  ),
};

/**
 * Tag sizes
 */
export const TagSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-[#818187] mb-2">Small</p>
        <div className="flex flex-wrap gap-2">
          <Tag size="sm">Small Tag</Tag>
          <Tag size="sm" onRemove={() => {}}>Removable</Tag>
        </div>
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Default</p>
        <div className="flex flex-wrap gap-2">
          <Tag size="default">Default Tag</Tag>
          <Tag size="default" onRemove={() => {}}>Removable</Tag>
        </div>
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Large</p>
        <div className="flex flex-wrap gap-2">
          <Tag size="lg">Large Tag</Tag>
          <Tag size="lg" onRemove={() => {}}>Removable</Tag>
        </div>
      </div>
    </div>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => {
    const [tags] = useState<string[]>(['React', 'TypeScript', 'Node.js']);

    return (
      <TagInput
        value={tags}
        onChange={() => {}}
        disabled
        placeholder="Cannot edit..."
      />
    );
  },
};

/**
 * Error state
 */
export const Error: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>(['React']);

    return (
      <TagInput
        value={tags}
        onChange={setTags}
        error="At least 3 tags are required"
        placeholder="Add more tags..."
      />
    );
  },
};

/**
 * Interest selection use case
 */
export const InterestSelection: Story = {
  render: () => {
    const [interests, setInterests] = useState<string[]>([]);
    const suggestions = [
      'Photography',
      'Music',
      'Gaming',
      'Cooking',
      'Travel',
      'Fitness',
      'Reading',
      'Art',
      'Technology',
      'Sports',
    ];

    return (
      <div className="space-y-4">
        <p className="text-sm text-white">Select your interests</p>
        <TagInput
          value={interests}
          onChange={setInterests}
          suggestions={suggestions}
          max={5}
          showSuggestionsOnFocus
          placeholder="Start typing or click to see options..."
          variant="gold"
        />
        {interests.length > 0 && (
          <p className="text-xs text-[#818187]">
            {interests.length}/5 selected
          </p>
        )}
      </div>
    );
  },
};
