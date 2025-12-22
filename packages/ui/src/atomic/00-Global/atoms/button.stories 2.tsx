'use client';

import {
  Plus,
  Send,
  Search,
  ArrowRight,
  ChevronDown,
  Save,
  Trash2,
  Settings,
  Check,
  X,
  Download,
  Upload,
  Edit,
  Share2,
  Heart,
  MessageSquare,
  Bookmark,
  Home,
  User,
  Bell,
  LogOut,
  ExternalLink
} from 'lucide-react';
import * as React from 'react';

import { Button } from './button';

import type { Meta, StoryObj } from '@storybook/react';


const meta = {
  title: '00-Global/Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, loading states, and icon support. Built with accessibility in mind using ARIA attributes and Radix UI Slot for composability.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'outline', 'ghost', 'destructive', 'link', 'brand', 'success', 'warning'],
      description: 'Visual variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'icon', 'default'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as a Radix Slot for composition',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {
    children: 'Default Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
    leadingIcon: <Trash2 />,
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

export const Brand: Story = {
  args: {
    variant: 'brand',
    children: 'Join HIVE',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
    leadingIcon: <Check />,
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

// ===== SIZES =====

export const SizeSmall: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const SizeMedium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

export const SizeLarge: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const SizeExtraLarge: Story = {
  args: {
    size: 'xl',
    children: 'Extra Large Button',
  },
};

// ===== WITH ICONS =====

export const WithLeadingIcon: Story = {
  args: {
    children: 'Create New',
    leadingIcon: <Plus />,
  },
};

export const WithTrailingIcon: Story = {
  args: {
    children: 'Continue',
    trailingIcon: <ArrowRight />,
  },
};

export const WithBothIcons: Story = {
  args: {
    children: 'Download File',
    leadingIcon: <Download />,
    trailingIcon: <ExternalLink />,
  },
};

export const IconOnly: Story = {
  args: {
    leadingIcon: <Settings />,
    'aria-label': 'Settings',
  },
};

export const IconOnlySmall: Story = {
  args: {
    size: 'sm',
    leadingIcon: <Heart />,
    'aria-label': 'Like',
  },
};

export const IconOnlyLarge: Story = {
  args: {
    size: 'lg',
    leadingIcon: <Search />,
    'aria-label': 'Search',
  },
};

// ===== LOADING STATES =====

export const LoadingDefault: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const LoadingPrimary: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Saving...',
  },
};

export const LoadingSecondary: Story = {
  args: {
    variant: 'secondary',
    loading: true,
    children: 'Processing...',
  },
};

export const LoadingBrand: Story = {
  args: {
    variant: 'brand',
    loading: true,
    children: 'Creating Space...',
  },
};

export const LoadingIconOnly: Story = {
  args: {
    loading: true,
    leadingIcon: <Send />,
    'aria-label': 'Sending',
  },
};

// ===== STATES =====

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const DisabledWithIcon: Story = {
  args: {
    disabled: true,
    children: 'Cannot Delete',
    leadingIcon: <Trash2 />,
    variant: 'destructive',
  },
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveLoading: Story = {
  render: () => {
    const [loading, setLoading] = React.useState(false);

    const handleClick = () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 2000);
    };

    return (
      <Button
        variant="primary"
        onClick={handleClick}
        loading={loading}
        leadingIcon={<Save />}
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    );
  },
};

export const InteractiveToggle: Story = {
  render: () => {
    const [liked, setLiked] = React.useState(false);

    return (
      <Button
        variant={liked ? 'brand' : 'outline'}
        onClick={() => setLiked(!liked)}
        leadingIcon={<Heart />}
      >
        {liked ? 'Liked' : 'Like'}
      </Button>
    );
  },
};

export const InteractiveCounter: Story = {
  render: () => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCount(count - 1)}
          disabled={count <= 0}
        >
          -
        </Button>
        <span className="text-[var(--hive-text-primary)] font-medium min-w-[3ch] text-center">
          {count}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCount(count + 1)}
        >
          +
        </Button>
      </div>
    );
  },
};

// ===== REAL-WORLD EXAMPLES =====

export const FormActions: Story = {
  render: () => {
    return (
      <div className="flex gap-3">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary" leadingIcon={<Save />}>
          Save Changes
        </Button>
      </div>
    );
  },
};

export const ModalActions: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-3 w-[400px]">
        <div className="p-6 rounded-lg bg-[var(--hive-background-secondary)]">
          <h3 className="text-[var(--hive-text-primary)] font-semibold mb-2">
            Delete this space?
          </h3>
          <p className="text-[var(--hive-text-secondary)] text-sm mb-6">
            This action cannot be undone. All posts, members, and data will be permanently deleted.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive" leadingIcon={<Trash2 />}>
              Delete Space
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

export const CallToAction: Story = {
  render: () => {
    return (
      <div className="flex flex-col items-center gap-6 p-8 rounded-lg bg-[var(--hive-background-secondary)] max-w-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--hive-text-primary)] mb-2">
            Join HIVE Today
          </h2>
          <p className="text-[var(--hive-text-secondary)]">
            Connect with your campus community and discover opportunities
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Button variant="brand" size="lg" trailingIcon={<ArrowRight />}>
            Get Started
          </Button>
          <Button variant="ghost" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    );
  },
};

export const Toolbar: Story = {
  render: () => {
    return (
      <div className="flex gap-2 p-3 rounded-lg bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)]">
        <Button variant="ghost" size="sm" leadingIcon={<Edit />} aria-label="Edit" />
        <Button variant="ghost" size="sm" leadingIcon={<Share2 />} aria-label="Share" />
        <Button variant="ghost" size="sm" leadingIcon={<Bookmark />} aria-label="Bookmark" />
        <div className="w-px bg-[var(--hive-border-default)]" />
        <Button variant="ghost" size="sm" leadingIcon={<Trash2 />} aria-label="Delete" />
      </div>
    );
  },
};

export const SocialActions: Story = {
  render: () => {
    const [liked, setLiked] = React.useState(false);
    const [bookmarked, setBookmarked] = React.useState(false);

    return (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLiked(!liked)}
          leadingIcon={<Heart className={liked ? 'fill-current text-red-500' : ''} />}
        >
          {liked ? '24' : '23'}
        </Button>
        <Button variant="ghost" size="sm" leadingIcon={<MessageSquare />}>
          12
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBookmarked(!bookmarked)}
          leadingIcon={<Bookmark className={bookmarked ? 'fill-current' : ''} />}
        />
      </div>
    );
  },
};

export const NavigationButtons: Story = {
  render: () => {
    const [active, setActive] = React.useState('home');

    return (
      <div className="flex flex-col gap-2 w-[240px] p-4 rounded-lg bg-[var(--hive-background-secondary)]">
        <Button
          variant={active === 'home' ? 'secondary' : 'ghost'}
          onClick={() => setActive('home')}
          leadingIcon={<Home />}
          className="justify-start"
        >
          Home
        </Button>
        <Button
          variant={active === 'profile' ? 'secondary' : 'ghost'}
          onClick={() => setActive('profile')}
          leadingIcon={<User />}
          className="justify-start"
        >
          Profile
        </Button>
        <Button
          variant={active === 'notifications' ? 'secondary' : 'ghost'}
          onClick={() => setActive('notifications')}
          leadingIcon={<Bell />}
          className="justify-start"
        >
          Notifications
        </Button>
        <Button
          variant={active === 'settings' ? 'secondary' : 'ghost'}
          onClick={() => setActive('settings')}
          leadingIcon={<Settings />}
          className="justify-start"
        >
          Settings
        </Button>
        <div className="border-t border-[var(--hive-border-default)] my-2" />
        <Button variant="ghost" leadingIcon={<LogOut />} className="justify-start">
          Sign Out
        </Button>
      </div>
    );
  },
};

export const FileUpload: Story = {
  render: () => {
    const [uploading, setUploading] = React.useState(false);
    const [uploaded, setUploaded] = React.useState(false);

    const handleUpload = () => {
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setUploaded(true);
        setTimeout(() => setUploaded(false), 2000);
      }, 2000);
    };

    return (
      <div className="flex flex-col gap-4 w-[300px]">
        <div className="p-6 rounded-lg border-2 border-dashed border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] text-center">
          <p className="text-[var(--hive-text-secondary)] text-sm mb-4">
            Select a file to upload
          </p>
          <Button
            variant={uploaded ? 'success' : 'secondary'}
            onClick={handleUpload}
            loading={uploading}
            leadingIcon={uploaded ? <Check /> : <Upload />}
          >
            {uploaded ? 'Uploaded!' : uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>
    );
  },
};

export const PaginationControls: Story = {
  render: () => {
    const [page, setPage] = React.useState(1);
    const totalPages = 5;

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-[var(--hive-text-secondary)] text-sm px-4">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    );
  },
};

export const DropdownTrigger: Story = {
  render: () => {
    return (
      <Button variant="secondary" trailingIcon={<ChevronDown />}>
        Select Option
      </Button>
    );
  },
};

// ===== SIZE COMPARISON =====

export const SizeComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 items-start">
        <Button size="sm" leadingIcon={<Plus />}>
          Small
        </Button>
        <Button size="md" leadingIcon={<Plus />}>
          Medium
        </Button>
        <Button size="lg" leadingIcon={<Plus />}>
          Large
        </Button>
        <Button size="xl" leadingIcon={<Plus />}>
          Extra Large
        </Button>
      </div>
    );
  },
};

export const VariantComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-wrap gap-3">
        <Button variant="default">Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button variant="brand">Brand</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
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
            <li>aria-label for icon-only buttons</li>
            <li>aria-busy for loading states</li>
            <li>disabled attribute for non-interactive states</li>
            <li>Focus-visible ring styles</li>
            <li>Keyboard navigable</li>
            <li>WCAG 2.1 AA compliant color contrast</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button leadingIcon={<Search />} aria-label="Search" />
          <Button loading aria-label="Loading">
            Processing...
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
    );
  },
};

// ===== AS-CHILD PATTERN =====

export const AsChildPattern: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--hive-text-secondary)]">
          The asChild prop allows the Button to merge its props with a child element (using Radix Slot).
          Useful for rendering buttons as links or other elements.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="brand">
            <a href="https://hive.buffalo.edu" target="_blank" rel="noopener noreferrer">
              Visit HIVE
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="#documentation">
              View Docs
            </a>
          </Button>
        </div>
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
      <div className="flex flex-col gap-4 p-6 rounded-lg bg-[var(--hive-background-primary)]">
        <Button variant="primary">Primary in Dark Mode</Button>
        <Button variant="secondary">Secondary in Dark Mode</Button>
        <Button variant="outline">Outline in Dark Mode</Button>
        <Button variant="brand">Brand in Dark Mode</Button>
        <Button variant="destructive" leadingIcon={<Trash2 />}>
          Delete
        </Button>
      </div>
    );
  },
};
