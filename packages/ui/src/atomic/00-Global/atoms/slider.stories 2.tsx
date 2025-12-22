'use client';

import * as React from 'react';

import { Slider } from './slider';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '00-Global/Atoms/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile slider component with value tooltip, label support, and smooth Framer Motion animations. Built on Radix UI with custom enhancements for campus-specific use cases. Features include live value display, min/max labels, and custom formatting.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'subtle'],
      description: 'Visual variant of the slider',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size of the slider',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the slider is disabled',
    },
    label: {
      control: 'text',
      description: 'Label text displayed above the slider',
    },
    description: {
      control: 'text',
      description: 'Description text displayed below the slider',
    },
    error: {
      control: 'text',
      description: 'Error message displayed below the slider (overrides description)',
    },
    showValue: {
      control: 'boolean',
      description: 'Show current value next to label',
    },
    showMinMax: {
      control: 'boolean',
      description: 'Show min/max labels below slider',
    },
    showTooltip: {
      control: 'boolean',
      description: 'Show floating tooltip when dragging',
    },
    min: {
      control: 'number',
      description: 'Minimum value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    step: {
      control: 'number',
      description: 'Step increment',
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {
    label: 'Volume',
    value: [50],
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Notification volume',
    description: 'Adjust the volume for notification sounds',
    value: [75],
  },
};

export const WithError: Story = {
  args: {
    label: 'Upload size limit',
    error: 'Maximum allowed is 100 MB',
    value: [120],
    max: 200,
    formatValue: (v) => `${v} MB`,
  },
};

export const WithMinMax: Story = {
  args: {
    label: 'Price range',
    showMinMax: true,
    value: [2500],
    min: 0,
    max: 5000,
    step: 100,
    formatValue: (v) => `$${v}`,
  },
};

export const WithoutTooltip: Story = {
  args: {
    label: 'Volume (no tooltip)',
    showTooltip: false,
    value: [60],
  },
};

export const WithoutValue: Story = {
  args: {
    label: 'Brightness',
    showValue: false,
    value: [80],
  },
};

// ===== VISUAL VARIANTS =====

export const DefaultVariant: Story = {
  args: {
    variant: 'default',
    label: 'Default variant (gold)',
    value: [65],
  },
};

export const DestructiveVariant: Story = {
  args: {
    variant: 'destructive',
    label: 'Deletion delay',
    description: 'Items will be permanently deleted after this time',
    value: [30],
    max: 60,
    formatValue: (v) => `${v}s`,
  },
};

export const SuccessVariant: Story = {
  args: {
    variant: 'success',
    label: 'Storage usage',
    description: 'Your storage is in good health',
    value: [45],
    formatValue: (v) => `${v}%`,
  },
};

export const SubtleVariant: Story = {
  args: {
    variant: 'subtle',
    label: 'Subtle variant',
    value: [50],
  },
};

// ===== SIZES =====

export const SizeSmall: Story = {
  args: {
    size: 'sm',
    label: 'Small slider',
    value: [40],
  },
};

export const SizeDefault: Story = {
  args: {
    size: 'default',
    label: 'Default slider',
    value: [50],
  },
};

export const SizeLarge: Story = {
  args: {
    size: 'lg',
    label: 'Large slider',
    value: [60],
  },
};

// ===== STATES =====

export const Disabled: Story = {
  args: {
    label: 'Disabled slider',
    description: 'This setting cannot be changed',
    value: [50],
    disabled: true,
  },
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveVolume: Story = {
  render: () => {
    const [volume, setVolume] = React.useState([75]);

    return (
      <div className="w-[400px]">
        <Slider
          label="Volume"
          description="Drag to adjust volume level"
          value={volume}
          onValueChange={setVolume}
          formatValue={(v) => `${v}%`}
          showMinMax
        />
      </div>
    );
  },
};

export const InteractiveBrightness: Story = {
  render: () => {
    const [brightness, setBrightness] = React.useState([60]);

    const getBrightnessLabel = (value: number) => {
      if (value < 25) return 'Very dim';
      if (value < 50) return 'Dim';
      if (value < 75) return 'Bright';
      return 'Very bright';
    };

    return (
      <div className="w-[400px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <Slider
          label="Screen brightness"
          value={brightness}
          onValueChange={setBrightness}
          formatValue={(v) => `${v}% (${getBrightnessLabel(v)})`}
          showMinMax
        />
        <div
          className="mt-4 h-32 rounded-lg transition-opacity duration-300"
          style={{
            backgroundColor: 'var(--hive-background-tertiary)',
            opacity: brightness[0] / 100,
          }}
        >
          <div className="flex items-center justify-center h-full text-[var(--hive-text-primary)]">
            Preview
          </div>
        </div>
      </div>
    );
  },
};

export const InteractivePriceRange: Story = {
  render: () => {
    const [price, setPrice] = React.useState([2500]);

    const getAffordability = (p: number) => {
      if (p < 1000) return 'Very affordable';
      if (p < 2500) return 'Affordable';
      if (p < 4000) return 'Moderate';
      return 'Premium';
    };

    return (
      <div className="w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <Slider
          label="Maximum price"
          description={`Looking for ${getAffordability(price[0])} options`}
          value={price}
          onValueChange={setPrice}
          min={0}
          max={5000}
          step={100}
          formatValue={(v) => `$${v.toLocaleString()}`}
          showMinMax
        />
      </div>
    );
  },
};

export const InteractiveValidation: Story = {
  render: () => {
    const [value, setValue] = React.useState([120]);
    const [touched, setTouched] = React.useState(false);

    const maxAllowed = 100;
    const showError = touched && value[0] > maxAllowed;

    return (
      <div className="w-[400px]">
        <Slider
          label="Upload size"
          value={value}
          onValueChange={(v) => {
            setValue(v);
            setTouched(true);
          }}
          min={0}
          max={200}
          step={10}
          formatValue={(v) => `${v} MB`}
          error={showError ? `Maximum allowed is ${maxAllowed} MB` : undefined}
          description={!showError ? 'Set the maximum upload size for files' : undefined}
          variant={showError ? 'destructive' : 'default'}
          showMinMax
        />
      </div>
    );
  },
};

// ===== REAL-WORLD EXAMPLES =====

export const AudioSettings: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      master: [75],
      notifications: [60],
      music: [50],
      voice: [80],
    });

    return (
      <div className="flex flex-col gap-6 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold">Audio Settings</h3>

        <Slider
          label="Master volume"
          description="Controls all audio output"
          value={settings.master}
          onValueChange={(v) => setSettings({ ...settings, master: v })}
          formatValue={(v) => `${v}%`}
          showMinMax
        />

        <Slider
          label="Notifications"
          description="Volume for notification sounds"
          value={settings.notifications}
          onValueChange={(v) => setSettings({ ...settings, notifications: v })}
          formatValue={(v) => `${v}%`}
        />

        <Slider
          label="Music"
          description="Background music volume"
          value={settings.music}
          onValueChange={(v) => setSettings({ ...settings, music: v })}
          formatValue={(v) => `${v}%`}
        />

        <Slider
          label="Voice"
          description="Voice chat volume"
          value={settings.voice}
          onValueChange={(v) => setSettings({ ...settings, voice: v })}
          formatValue={(v) => `${v}%`}
          variant="success"
        />
      </div>
    );
  },
};

export const AccessibilitySettings: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      textSize: [14],
      contrast: [50],
      animationSpeed: [100],
    });

    return (
      <div className="flex flex-col gap-6 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <div className="mb-2">
          <h3 className="text-[var(--hive-text-primary)] font-semibold mb-1">
            Accessibility
          </h3>
          <p className="text-sm text-[var(--hive-text-secondary)]">
            Customize the interface for your needs
          </p>
        </div>

        <Slider
          label="Text size"
          description="Base font size for all text"
          value={settings.textSize}
          onValueChange={(v) => setSettings({ ...settings, textSize: v })}
          min={12}
          max={24}
          step={1}
          formatValue={(v) => `${v}px`}
          showMinMax
        />

        <Slider
          label="Contrast"
          description="Increase contrast for better readability"
          value={settings.contrast}
          onValueChange={(v) => setSettings({ ...settings, contrast: v })}
          formatValue={(v) => `${v}%`}
        />

        <Slider
          label="Animation speed"
          description="Slow down animations if needed"
          value={settings.animationSpeed}
          onValueChange={(v) => setSettings({ ...settings, animationSpeed: v })}
          min={0}
          max={200}
          step={25}
          formatValue={(v) => `${v}%`}
          showMinMax
        />
      </div>
    );
  },
};

export const PostingSettings: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      autoSaveInterval: [30],
      maxFileSize: [10],
      characterLimit: [500],
    });

    return (
      <div className="flex flex-col gap-6 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold">Posting Settings</h3>

        <Slider
          label="Auto-save interval"
          description="Automatically save drafts every N seconds"
          value={settings.autoSaveInterval}
          onValueChange={(v) => setSettings({ ...settings, autoSaveInterval: v })}
          min={10}
          max={120}
          step={10}
          formatValue={(v) => `${v}s`}
          variant="success"
          showMinMax
        />

        <Slider
          label="Max file size"
          description="Maximum file size for uploads"
          value={settings.maxFileSize}
          onValueChange={(v) => setSettings({ ...settings, maxFileSize: v })}
          min={1}
          max={50}
          step={1}
          formatValue={(v) => `${v} MB`}
        />

        <Slider
          label="Character limit"
          description="Maximum characters per post"
          value={settings.characterLimit}
          onValueChange={(v) => setSettings({ ...settings, characterLimit: v })}
          min={100}
          max={2000}
          step={100}
          formatValue={(v) => v.toLocaleString()}
          showMinMax
        />
      </div>
    );
  },
};

export const NotificationTiming: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      quietHoursStart: [22],
      quietHoursEnd: [7],
      snooze: [30],
    });

    return (
      <div className="flex flex-col gap-6 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <h3 className="text-[var(--hive-text-primary)] font-semibold">
          Notification Timing
        </h3>

        <Slider
          label="Quiet hours start"
          description="No notifications after this time"
          value={settings.quietHoursStart}
          onValueChange={(v) => setSettings({ ...settings, quietHoursStart: v })}
          min={0}
          max={23}
          step={1}
          formatValue={(v) => {
            if (v === 0) return '12:00 AM';
            if (v === 12) return '12:00 PM';
            if (v < 12) return `${v}:00 AM`;
            return `${v - 12}:00 PM`;
          }}
          showMinMax
        />

        <Slider
          label="Quiet hours end"
          description="Resume notifications at this time"
          value={settings.quietHoursEnd}
          onValueChange={(v) => setSettings({ ...settings, quietHoursEnd: v })}
          min={0}
          max={23}
          step={1}
          formatValue={(v) => {
            if (v === 0) return '12:00 AM';
            if (v === 12) return '12:00 PM';
            if (v < 12) return `${v}:00 AM`;
            return `${v - 12}:00 PM`;
          }}
          showMinMax
        />

        <Slider
          label="Snooze duration"
          description="How long to snooze notifications"
          value={settings.snooze}
          onValueChange={(v) => setSettings({ ...settings, snooze: v })}
          min={5}
          max={120}
          step={5}
          formatValue={(v) => `${v} min`}
        />
      </div>
    );
  },
};

export const FeedAlgorithm: Story = {
  render: () => {
    const [weights, setWeights] = React.useState({
      recency: [70],
      engagement: [60],
      relevance: [80],
      diversity: [40],
    });

    return (
      <div className="flex flex-col gap-6 w-[500px] p-6 rounded-lg bg-[var(--hive-background-secondary)]">
        <div className="mb-2">
          <h3 className="text-[var(--hive-text-primary)] font-semibold mb-1">
            Feed Algorithm Weights
          </h3>
          <p className="text-sm text-[var(--hive-text-secondary)]">
            Customize how posts are ranked in your feed
          </p>
        </div>

        <Slider
          label="Recency"
          description="How much to prioritize recent posts"
          value={weights.recency}
          onValueChange={(v) => setWeights({ ...weights, recency: v })}
          formatValue={(v) => `${v}%`}
        />

        <Slider
          label="Engagement"
          description="How much to prioritize popular posts"
          value={weights.engagement}
          onValueChange={(v) => setWeights({ ...weights, engagement: v })}
          formatValue={(v) => `${v}%`}
        />

        <Slider
          label="Relevance"
          description="How much to prioritize posts from spaces you're in"
          value={weights.relevance}
          onValueChange={(v) => setWeights({ ...weights, relevance: v })}
          formatValue={(v) => `${v}%`}
          variant="success"
        />

        <Slider
          label="Diversity"
          description="How much to show content from different sources"
          value={weights.diversity}
          onValueChange={(v) => setWeights({ ...weights, diversity: v })}
          formatValue={(v) => `${v}%`}
        />
      </div>
    );
  },
};

// ===== SIZE COMPARISON =====

export const SizeComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-6 w-[400px]">
        <Slider size="sm" label="Small slider" value={[30]} />
        <Slider size="default" label="Default slider" value={[50]} />
        <Slider size="lg" label="Large slider" value={[70]} />
      </div>
    );
  },
};

export const VariantComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-6 w-[400px]">
        <Slider variant="default" label="Default (gold)" value={[50]} />
        <Slider variant="destructive" label="Destructive (red)" value={[50]} />
        <Slider variant="success" label="Success (green)" value={[50]} />
        <Slider variant="subtle" label="Subtle" value={[50]} />
      </div>
    );
  },
};

// ===== ACCESSIBILITY =====

export const AccessibilityDemo: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-6 w-[500px]">
        <div className="text-sm text-[var(--hive-text-secondary)] mb-2">
          <p className="font-medium text-[var(--hive-text-primary)] mb-1">
            Accessibility Features:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Keyboard navigable (Tab, Arrow keys)</li>
            <li>aria-describedby for descriptions</li>
            <li>Floating tooltip for current value</li>
            <li>Focus-visible ring styles</li>
            <li>Min/max labels for range clarity</li>
            <li>Custom value formatting</li>
            <li>Smooth spring animations</li>
          </ul>
        </div>

        <Slider
          label="Accessible slider"
          description="Try using Tab to focus and Arrow keys to adjust"
          value={[50]}
          showMinMax
        />

        <Slider
          label="Error example"
          error="This demonstrates role=alert for screen readers"
          value={[75]}
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
      <div className="flex flex-col gap-6 p-6 rounded-lg bg-[var(--hive-background-primary)] w-[500px]">
        <Slider label="Default variant" value={[60]} showMinMax />
        <Slider label="Success variant" variant="success" value={[70]} showMinMax />
        <Slider
          label="Destructive variant"
          variant="destructive"
          value={[40]}
          showMinMax
        />
        <Slider
          label="With tooltip"
          description="Hover to see the tooltip"
          value={[50]}
          showMinMax
        />
      </div>
    );
  },
};
