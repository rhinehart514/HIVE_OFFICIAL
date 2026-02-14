'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Slider, SliderWithLabels, RangeSlider, SliderWithMarks } from './Slider';
import * as React from 'react';

/**
 * Slider - LOCKED: January 2026
 *
 * LOCKED DECISIONS:
 * - Thumb hover: Opacity brighten (80% → 100%), NO SCALE
 * - Track fill: Gold for CTAs, White for neutral
 * - Dragging: White glow (matches HandleDot)
 * - Tooltip: Glass Dark (matches Tooltip primitive)
 *
 * Range input slider for numeric value selection.
 */
const meta: Meta<typeof Slider> = {
  title: 'Design System/Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 2026**

Slider provides range input controls for numeric value selection.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Thumb hover | Opacity brighten (80% → 100%) | Subtle feedback, NO SCALE |
| Track fill | Gold for CTAs | Consistent with CTA gold usage |
| Dragging state | White glow | Matches HandleDot pattern |
| Value tooltip | Glass Dark | Matches Tooltip primitive |
| Focus ring | WHITE (\`ring-white/50\`) | Consistent focus treatment |
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    color: {
      control: 'select',
      options: ['gold', 'primary', 'success', 'default'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

// =============================================================================
// LOCKED DESIGN SHOWCASE
// =============================================================================

/**
 * **LOCKED DESIGN** - The final approved visual treatment
 *
 * This showcases the canonical Slider patterns:
 * - Opacity brighten on hover (NO SCALE)
 * - Gold track for CTAs
 * - White glow on drag
 * - Glass Dark tooltip
 */
export const LockedDesignShowcase: StoryObj = {
  name: '⭐ Locked Design',
  render: function LockedDesignDemo() {
    const [value1, setValue1] = React.useState([50]);
    const [value2, setValue2] = React.useState([75]);

    return (
      <div className="space-y-8 w-[400px]">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">Slider - LOCKED</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            January 2026 • Opacity brighten (no scale), Gold track, White drag glow
          </p>
        </div>

        {/* Gold Track (CTA) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Gold Track (CTA)
            </span>
            <span className="text-label-xs text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
              For actions/CTAs
            </span>
          </div>
          <Slider value={value1} onChange={setValue1} max={100} color="gold" />
          <p className="text-xs text-white/40">
            Thumb: bg-white/80 → bg-white on hover • NO scale
          </p>
        </div>

        {/* With Value Tooltip */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              With Value Tooltip
            </span>
            <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
              Glass Dark tooltip
            </span>
          </div>
          <Slider value={value2} onChange={setValue2} max={100} showValue color="gold" />
          <p className="text-xs text-white/40">
            Drag to see tooltip • Glass Dark surface matching Tooltip primitive
          </p>
        </div>

        {/* Drag State */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Drag State
            </span>
          </div>
          <Slider defaultValue={[50]} max={100} color="gold" />
          <p className="text-xs text-white/40">
            Dragging: White glow (box-shadow: 0 0 12px rgba(255,255,255,0.6))
          </p>
        </div>

        {/* Track Colors */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Track Colors
          </span>
          <div className="space-y-4">
            <div>
              <p className="text-label-xs text-white/40 mb-2">Gold (CTA/actions)</p>
              <Slider defaultValue={[60]} max={100} color="gold" />
            </div>
            <div>
              <p className="text-label-xs text-white/40 mb-2">Primary (informational)</p>
              <Slider defaultValue={[60]} max={100} color="primary" />
            </div>
            <div>
              <p className="text-label-xs text-white/40 mb-2">White (neutral)</p>
              <Slider defaultValue={[60]} max={100} color="default" />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

/**
 * Default slider with gold track (CTA color).
 */
export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
  },
};

/**
 * Slider with primary (blue) color.
 */
export const Primary: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    color: 'primary',
  },
};

/**
 * Slider with success (green) color.
 */
export const Success: Story = {
  args: {
    defaultValue: [75],
    max: 100,
    color: 'success',
  },
};

/**
 * Small size slider.
 */
export const Small: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    size: 'sm',
  },
};

/**
 * Large size slider.
 */
export const Large: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    size: 'lg',
  },
};

/**
 * Disabled slider.
 */
export const Disabled: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    disabled: true,
  },
};

/**
 * Slider with value tooltip.
 */
export const WithValueTooltip: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    showValue: true,
  },
};

/**
 * All sizes comparison.
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Small</span>
        <Slider defaultValue={[50]} max={100} size="sm" />
      </div>
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Default</span>
        <Slider defaultValue={[50]} max={100} size="default" />
      </div>
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Large</span>
        <Slider defaultValue={[50]} max={100} size="lg" />
      </div>
    </div>
  ),
};

/**
 * All color variants.
 */
export const Colors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Gold (CTA)</span>
        <Slider defaultValue={[50]} max={100} color="gold" />
      </div>
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Primary</span>
        <Slider defaultValue={[50]} max={100} color="primary" />
      </div>
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Success</span>
        <Slider defaultValue={[50]} max={100} color="success" />
      </div>
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Default</span>
        <Slider defaultValue={[50]} max={100} color="default" />
      </div>
    </div>
  ),
};

/**
 * Slider with label and value display.
 */
export const WithLabels: StoryObj<typeof SliderWithLabels> = {
  render: () => (
    <SliderWithLabels
      label="Volume"
      defaultValue={[75]}
      max={100}
      unit="%"
    />
  ),
};

/**
 * Slider with custom formatting.
 */
export const CustomFormat: StoryObj<typeof SliderWithLabels> = {
  render: () => (
    <SliderWithLabels
      label="Price"
      defaultValue={[150]}
      max={500}
      min={0}
      step={10}
      unit=""
      formatValue={(v) => `$${v}`}
    />
  ),
};

/**
 * Range slider with two thumbs.
 */
export const RangeSliderDemo: StoryObj<typeof RangeSlider> = {
  render: () => (
    <RangeSlider
      label="Price Range"
      defaultValue={[20, 80]}
      min={0}
      max={100}
      unit="%"
    />
  ),
};

/**
 * Range slider for filtering.
 */
export const PriceFilter: StoryObj<typeof RangeSlider> = {
  render: () => (
    <RangeSlider
      label="Budget"
      defaultValue={[25, 150]}
      min={0}
      max={500}
      step={5}
      formatValue={(v) => `$${v}`}
    />
  ),
};

/**
 * Slider with tick marks.
 */
export const WithMarks: StoryObj<typeof SliderWithMarks> = {
  render: () => (
    <SliderWithMarks
      defaultValue={[50]}
      min={0}
      max={100}
      step={25}
      marks={[
        { value: 0, label: '0%' },
        { value: 25, label: '25%' },
        { value: 50, label: '50%' },
        { value: 75, label: '75%' },
        { value: 100, label: '100%' },
      ]}
    />
  ),
};

/**
 * Quality setting with marks.
 */
export const QualityMarks: StoryObj<typeof SliderWithMarks> = {
  render: () => (
    <SliderWithMarks
      defaultValue={[2]}
      min={0}
      max={3}
      step={1}
      marks={[
        { value: 0, label: 'Low' },
        { value: 1, label: 'Medium' },
        { value: 2, label: 'High' },
        { value: 3, label: 'Ultra' },
      ]}
    />
  ),
};

/**
 * Controlled slider.
 */
export const Controlled: Story = {
  render: function ControlledSlider() {
    const [value, setValue] = React.useState([50]);

    return (
      <div className="space-y-4">
        <Slider value={value} onChange={setValue} max={100} showValue />
        <div className="text-center text-sm text-white">
          Value: {value[0]}
        </div>
      </div>
    );
  },
};

/**
 * Audio mixer example.
 */
export const AudioMixer: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-96">
        <Story />
      </div>
    ),
  ],
  render: function AudioMixerDemo() {
    const [master, setMaster] = React.useState([80]);
    const [music, setMusic] = React.useState([60]);
    const [sfx, setSfx] = React.useState([70]);
    const [voice, setVoice] = React.useState([100]);

    return (
      <div className="space-y-4 p-4 rounded-xl border border-[var(--color-border)] bg-[#0D0D0D]">
        <h3 className="text-sm font-medium text-white mb-4">Audio Settings</h3>
        <SliderWithLabels
          label="Master Volume"
          value={master}
          onChange={setMaster}
          max={100}
          unit="%"
          color="gold"
        />
        <SliderWithLabels
          label="Music"
          value={music}
          onChange={setMusic}
          max={100}
          unit="%"
          color="primary"
        />
        <SliderWithLabels
          label="Sound Effects"
          value={sfx}
          onChange={setSfx}
          max={100}
          unit="%"
          color="primary"
        />
        <SliderWithLabels
          label="Voice"
          value={voice}
          onChange={setVoice}
          max={100}
          unit="%"
          color="primary"
        />
      </div>
    );
  },
};

/**
 * With step values.
 */
export const WithSteps: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 10,
  },
};
