'use client';

import { GraduationCap, Briefcase, Code, MapPin, Calendar } from 'lucide-react';
import * as React from 'react';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from './select';

import type { Meta, StoryObj } from '@storybook/react';


const meta = {
  title: '00-Global/Atoms/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A custom select component with composition pattern, animations, and accessibility. Built with Framer Motion for smooth transitions and Context API for state management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'subtle', 'destructive', 'success'],
      description: 'Visual variant of the select',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size of the select',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Subtle: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Select>
        <SelectTrigger variant="subtle">
          <SelectValue placeholder="Select a category..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="academic">Academic</SelectItem>
          <SelectItem value="social">Social</SelectItem>
          <SelectItem value="professional">Professional</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Destructive: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Select>
        <SelectTrigger variant="destructive">
          <SelectValue placeholder="Select deletion scope..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="soft">Soft delete (recoverable)</SelectItem>
          <SelectItem value="hard">Permanent delete</SelectItem>
          <SelectItem value="archive">Archive only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Success: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Select defaultValue="verified">
        <SelectTrigger variant="success">
          <SelectValue placeholder="Account status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

// ===== SIZES =====

export const SizeSmall: Story = {
  args: {},
  render: () => (
    <div className="w-[250px]">
      <Select>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Small select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="xs">Extra Small</SelectItem>
          <SelectItem value="s">Small</SelectItem>
          <SelectItem value="m">Medium</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const SizeDefault: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Select>
        <SelectTrigger size="default">
          <SelectValue placeholder="Default select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="xs">Extra Small</SelectItem>
          <SelectItem value="s">Small</SelectItem>
          <SelectItem value="m">Medium</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const SizeLarge: Story = {
  args: {},
  render: () => (
    <div className="w-[350px]">
      <Select>
        <SelectTrigger size="lg">
          <SelectValue placeholder="Large select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="xs">Extra Small</SelectItem>
          <SelectItem value="s">Small</SelectItem>
          <SelectItem value="m">Medium</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

// ===== WITH LABELS AND GROUPS =====

export const WithLabels: Story = {
  args: {},
  render: () => (
    <div className="w-[350px]">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a major..." />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel>Engineering</SelectLabel>
          <SelectItem value="cs">Computer Science</SelectItem>
          <SelectItem value="ee">Electrical Engineering</SelectItem>
          <SelectItem value="me">Mechanical Engineering</SelectItem>

          <SelectSeparator />

          <SelectLabel>Sciences</SelectLabel>
          <SelectItem value="bio">Biology</SelectItem>
          <SelectItem value="chem">Chemistry</SelectItem>
          <SelectItem value="physics">Physics</SelectItem>

          <SelectSeparator />

          <SelectLabel>Arts & Humanities</SelectLabel>
          <SelectItem value="art">Art</SelectItem>
          <SelectItem value="english">English</SelectItem>
          <SelectItem value="history">History</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const ComplexGrouping: Story = {
  args: {},
  render: () => (
    <div className="w-[400px]">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a campus organization..." />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel>🎓 Academic Organizations</SelectLabel>
          <SelectItem value="acm">Association for Computing Machinery</SelectItem>
          <SelectItem value="ieee">IEEE Student Branch</SelectItem>
          <SelectItem value="mathclub">Mathematics Club</SelectItem>

          <SelectSeparator />

          <SelectLabel>🏀 Sports & Recreation</SelectLabel>
          <SelectItem value="basketball">Basketball Club</SelectItem>
          <SelectItem value="soccer">Soccer Team</SelectItem>
          <SelectItem value="yoga">Yoga & Wellness</SelectItem>

          <SelectSeparator />

          <SelectLabel>🎨 Arts & Culture</SelectLabel>
          <SelectItem value="theater">Theater Society</SelectItem>
          <SelectItem value="music">Music Collective</SelectItem>
          <SelectItem value="photography">Photography Club</SelectItem>

          <SelectSeparator />

          <SelectLabel>🌍 Community Service</SelectLabel>
          <SelectItem value="habitat">Habitat for Humanity</SelectItem>
          <SelectItem value="foodbank">Campus Food Bank</SelectItem>
          <SelectItem value="tutoring">Peer Tutoring Network</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

// ===== DISABLED STATES =====

export const Disabled: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Select disabled>
        <SelectTrigger disabled>
          <SelectValue placeholder="This select is disabled..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const DisabledItems: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select your year..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="freshman">Freshman</SelectItem>
          <SelectItem value="sophomore">Sophomore</SelectItem>
          <SelectItem value="junior">Junior</SelectItem>
          <SelectItem value="senior">Senior</SelectItem>
          <SelectItem value="graduate" disabled>Graduate (Not available)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

// ===== CONTROLLED vs UNCONTROLLED =====

export const UncontrolledWithDefault: Story = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Select defaultValue="sophomore">
        <SelectTrigger>
          <SelectValue placeholder="Select your year..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="freshman">Freshman</SelectItem>
          <SelectItem value="sophomore">Sophomore</SelectItem>
          <SelectItem value="junior">Junior</SelectItem>
          <SelectItem value="senior">Senior</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const ControlledSelect: Story = {
  args: {},
  render: () => {
    const [value, setValue] = React.useState('junior');

    return (
      <div className="flex flex-col gap-4 w-[300px]">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select your year..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="freshman">Freshman</SelectItem>
            <SelectItem value="sophomore">Sophomore</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-[var(--hive-text-secondary)]">
          Selected: <span className="text-[var(--hive-brand-primary)] font-medium">{value}</span>
        </div>
      </div>
    );
  },
};

export const MultipleSelects: Story = {
  args: {},
  render: () => {
    const [major, setMajor] = React.useState('');
    const [year, setYear] = React.useState('');
    const [campus, setCampus] = React.useState('');

    return (
      <div className="flex flex-col gap-4 w-[350px]">
        <div>
          <label className="text-sm font-medium text-[var(--hive-text-primary)] mb-2 block">
            Campus
          </label>
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger>
              <SelectValue placeholder="Select campus..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">North Campus</SelectItem>
              <SelectItem value="south">South Campus</SelectItem>
              <SelectItem value="downtown">Downtown Campus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--hive-text-primary)] mb-2 block">
            Year
          </label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select year..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freshman">Freshman</SelectItem>
              <SelectItem value="sophomore">Sophomore</SelectItem>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--hive-text-primary)] mb-2 block">
            Major
          </label>
          <Select value={major} onValueChange={setMajor}>
            <SelectTrigger>
              <SelectValue placeholder="Select major..." />
            </SelectTrigger>
            <SelectContent>
              <SelectLabel>Engineering</SelectLabel>
              <SelectItem value="cs">Computer Science</SelectItem>
              <SelectItem value="ee">Electrical Engineering</SelectItem>
              <SelectSeparator />
              <SelectLabel>Sciences</SelectLabel>
              <SelectItem value="bio">Biology</SelectItem>
              <SelectItem value="chem">Chemistry</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(major || year || campus) && (
          <div className="p-4 rounded-lg bg-[var(--hive-background-tertiary)] text-sm">
            <p className="text-[var(--hive-text-secondary)] mb-1">Your selections:</p>
            {campus && <p className="text-[var(--hive-text-primary)]">Campus: {campus}</p>}
            {year && <p className="text-[var(--hive-text-primary)]">Year: {year}</p>}
            {major && <p className="text-[var(--hive-text-primary)]">Major: {major}</p>}
          </div>
        )}
      </div>
    );
  },
};

// ===== REAL-WORLD EXAMPLES =====

export const ProfileSettings: Story = {
  args: {},
  render: () => {
    const [visibility, setVisibility] = React.useState('public');
    const [notifications, setNotifications] = React.useState('all');

    return (
      <div className="flex flex-col gap-6 w-[400px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <div>
          <h3 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-4">
            Profile Settings
          </h3>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--hive-text-primary)] mb-2 block">
            Profile Visibility
          </label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">🌍 Public - Everyone can see</SelectItem>
              <SelectItem value="campus">🏫 Campus - Only your campus</SelectItem>
              <SelectItem value="connections">🤝 Connections - Only connections</SelectItem>
              <SelectItem value="private">🔒 Private - Only you</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-[var(--hive-text-tertiary)] mt-2">
            Control who can view your profile information
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--hive-text-primary)] mb-2 block">
            Email Notifications
          </label>
          <Select value={notifications} onValueChange={setNotifications}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All notifications</SelectItem>
              <SelectItem value="important">Important only</SelectItem>
              <SelectItem value="weekly">Weekly digest</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-[var(--hive-text-tertiary)] mt-2">
            Choose how often you want to receive emails
          </p>
        </div>
      </div>
    );
  },
};

export const PostCreation: Story = {
  args: {},
  render: () => {
    const [category, setCategory] = React.useState('');
    const [visibility, setVisibility] = React.useState('public');
    const [space, setSpace] = React.useState('');

    return (
      <div className="flex flex-col gap-4 w-[450px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-2">
          Create a Post
        </h3>

        <div>
          <label className="text-sm font-medium text-[var(--hive-text-primary)] mb-2 block">
            Space
          </label>
          <Select value={space} onValueChange={setSpace}>
            <SelectTrigger>
              <SelectValue placeholder="Select a space..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">💬 General Discussion</SelectItem>
              <SelectItem value="academics">📚 Academics</SelectItem>
              <SelectItem value="events">🎉 Campus Events</SelectItem>
              <SelectItem value="career">💼 Career & Internships</SelectItem>
              <SelectItem value="housing">🏠 Housing & Roommates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--hive-text-primary)] mb-2 block">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectLabel>Post Type</SelectLabel>
              <SelectItem value="discussion">Discussion</SelectItem>
              <SelectItem value="question">Question</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>

              <SelectSeparator />

              <SelectLabel>Content Type</SelectLabel>
              <SelectItem value="text">Text only</SelectItem>
              <SelectItem value="media">Image/Video</SelectItem>
              <SelectItem value="poll">Poll</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--hive-text-primary)] mb-2 block">
            Visibility
          </label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="campus">Campus only</SelectItem>
              <SelectItem value="space">Space members only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  },
};

export const EventFilter: Story = {
  args: {},
  render: () => {
    const [time, setTime] = React.useState('upcoming');
    const [category, setCategory] = React.useState('all');
    const [location, setLocation] = React.useState('all');

    return (
      <div className="flex flex-col gap-4 w-[500px]">
        <h3 className="text-lg font-semibold text-[var(--hive-text-primary)]">
          Filter Events
        </h3>

        <div className="flex gap-3">
          <div className="flex-1">
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="career">Career</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                <SelectItem value="north">North Campus</SelectItem>
                <SelectItem value="south">South Campus</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-[var(--hive-text-secondary)]">
          Showing {time === 'all' ? 'all' : time} events
          {category !== 'all' && ` in ${category}`}
          {location !== 'all' && ` at ${location}`}
        </div>
      </div>
    );
  },
};

// ===== ACCESSIBILITY =====

export const AccessibilityDemo: Story = {
  args: {},
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[400px]">
        <div className="text-sm text-[var(--hive-text-secondary)] mb-2">
          <p className="font-medium text-[var(--hive-text-primary)] mb-1">Accessibility Features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>role="combobox" on trigger</li>
            <li>role="listbox" on content</li>
            <li>role="option" on items</li>
            <li>aria-expanded state</li>
            <li>aria-selected for selected items</li>
            <li>Keyboard navigable</li>
            <li>Visual checkmark for selected option</li>
          </ul>
        </div>

        <Select defaultValue="option2">
          <SelectTrigger>
            <SelectValue placeholder="Try keyboard navigation..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2 (Selected)</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
            <SelectItem value="option4" disabled>Option 4 (Disabled)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  },
};

// ===== DARK MODE =====

export const DarkModeExample: Story = {
  args: {},
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => {
    return (
      <div className="flex flex-col gap-4 w-[350px] p-6 rounded-lg bg-[var(--hive-background-primary)]">
        <Select defaultValue="cs">
          <SelectTrigger>
            <SelectValue placeholder="Select your major..." />
          </SelectTrigger>
          <SelectContent>
            <SelectLabel>Engineering</SelectLabel>
            <SelectItem value="cs">Computer Science</SelectItem>
            <SelectItem value="ee">Electrical Engineering</SelectItem>

            <SelectSeparator />

            <SelectLabel>Sciences</SelectLabel>
            <SelectItem value="bio">Biology</SelectItem>
            <SelectItem value="chem">Chemistry</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="sophomore">
          <SelectTrigger variant="subtle">
            <SelectValue placeholder="Select your year..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="freshman">Freshman</SelectItem>
            <SelectItem value="sophomore">Sophomore</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  },
};
