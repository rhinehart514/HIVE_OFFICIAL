'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SimpleSelect,
} from './Select';
import * as React from 'react';

const meta: Meta = {
  title: 'Design System/Components/Select',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

/**
 * Default select dropdown.
 */
export const Default: StoryObj = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select an option..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option One</SelectItem>
        <SelectItem value="option2">Option Two</SelectItem>
        <SelectItem value="option3">Option Three</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/**
 * Select sizes.
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Small</p>
        <Select defaultValue="small">
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small Option</SelectItem>
            <SelectItem value="medium">Medium Option</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Medium (default)</p>
        <Select defaultValue="medium">
          <SelectTrigger size="md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small Option</SelectItem>
            <SelectItem value="medium">Medium Option</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Large</p>
        <Select defaultValue="large">
          <SelectTrigger size="lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small Option</SelectItem>
            <SelectItem value="large">Large Option</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

/**
 * Select with default value.
 */
export const WithDefaultValue: StoryObj = {
  render: () => (
    <Select defaultValue="option2">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option One</SelectItem>
        <SelectItem value="option2">Option Two</SelectItem>
        <SelectItem value="option3">Option Three</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/**
 * Select with groups.
 */
export const WithGroups: StoryObj = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit or vegetable..." />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="broccoli">Broccoli</SelectItem>
          <SelectItem value="spinach">Spinach</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

/**
 * Select with icons.
 */
export const WithIcons: StoryObj = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a destination..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="home" icon="🏠">Home</SelectItem>
        <SelectItem value="settings" icon="⚙️">Settings</SelectItem>
        <SelectItem value="profile" icon="👤">Profile</SelectItem>
        <SelectItem value="notifications" icon="🔔">Notifications</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/**
 * Select with descriptions.
 */
export const WithDescriptions: StoryObj = {
  render: () => (
    <Select>
      <SelectTrigger className="h-auto py-3">
        <SelectValue placeholder="Select a plan..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free" description="Limited features, always free">
          Free Plan
        </SelectItem>
        <SelectItem value="pro" description="All features, $9/month">
          Pro Plan
        </SelectItem>
        <SelectItem value="enterprise" description="Custom solutions for teams">
          Enterprise
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

/**
 * Disabled options.
 */
export const WithDisabledOptions: StoryObj = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select an option..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Available Option</SelectItem>
        <SelectItem value="option2" disabled>Disabled Option</SelectItem>
        <SelectItem value="option3">Another Available</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/**
 * Disabled select.
 */
export const Disabled: StoryObj = {
  render: () => (
    <Select disabled>
      <SelectTrigger>
        <SelectValue placeholder="Select is disabled..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option One</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/**
 * Error state.
 */
export const WithError: StoryObj = {
  render: () => (
    <div className="space-y-2">
      <Select>
        <SelectTrigger error>
          <SelectValue placeholder="Select required..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option One</SelectItem>
          <SelectItem value="option2">Option Two</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-[#FF6B6B]">Please select an option</p>
    </div>
  ),
};

/**
 * SimpleSelect with options prop.
 */
export const Simple: StoryObj = {
  render: () => (
    <SimpleSelect
      placeholder="Select a color..."
      options={[
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
        { value: 'blue', label: 'Blue' },
        { value: 'yellow', label: 'Yellow' },
      ]}
    />
  ),
};

/**
 * SimpleSelect with icons.
 */
export const SimpleWithIcons: StoryObj = {
  render: () => (
    <SimpleSelect
      placeholder="Select a space..."
      options={[
        { value: 'engineering', label: 'Engineering Club', icon: '⚙️' },
        { value: 'design', label: 'Design Society', icon: '🎨' },
        { value: 'music', label: 'Music Collective', icon: '🎵' },
        { value: 'sports', label: 'Sports League', icon: '⚽' },
      ]}
    />
  ),
};

/**
 * SimpleSelect with grouped options.
 */
export const SimpleGrouped: StoryObj = {
  render: () => (
    <SimpleSelect
      placeholder="Select a role..."
      options={[
        {
          label: 'Leadership',
          options: [
            { value: 'owner', label: 'Owner', description: 'Full control' },
            { value: 'admin', label: 'Admin', description: 'Manage members' },
          ],
        },
        {
          label: 'Members',
          options: [
            { value: 'moderator', label: 'Moderator', description: 'Manage content' },
            { value: 'member', label: 'Member', description: 'Basic access' },
          ],
        },
      ]}
    />
  ),
};

/**
 * Controlled select.
 */
export const Controlled: StoryObj = {
  render: function ControlledDemo() {
    const [value, setValue] = React.useState('option2');

    return (
      <div className="space-y-4">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option One</SelectItem>
            <SelectItem value="option2">Option Two</SelectItem>
            <SelectItem value="option3">Option Three</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-[var(--color-text-muted)]">
          Selected: <span className="text-white">{value}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setValue('option1')}
            className="px-2 py-1 rounded bg-white/10 text-xs text-white"
          >
            Set Option 1
          </button>
          <button
            onClick={() => setValue('option3')}
            className="px-2 py-1 rounded bg-white/10 text-xs text-white"
          >
            Set Option 3
          </button>
        </div>
      </div>
    );
  },
};

/**
 * Select in a form.
 */
export const InForm: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Category</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-[var(--color-text-muted)]">
          Choose a category for your space
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Privacy</label>
        <Select defaultValue="public">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public" icon="🌐" description="Anyone can find and join">
              Public
            </SelectItem>
            <SelectItem value="campus" icon="🎓" description="Only UB students">
              Campus Only
            </SelectItem>
            <SelectItem value="private" icon="🔒" description="Invite only">
              Private
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

/**
 * Many options with scrolling.
 */
export const ManyOptions: StoryObj = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a country..." />
      </SelectTrigger>
      <SelectContent>
        {[
          'United States', 'Canada', 'United Kingdom', 'Australia',
          'Germany', 'France', 'Japan', 'China', 'India', 'Brazil',
          'Mexico', 'Spain', 'Italy', 'Netherlands', 'Sweden',
          'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria',
        ].map((country) => (
          <SelectItem key={country} value={country.toLowerCase().replace(' ', '-')}>
            {country}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};
