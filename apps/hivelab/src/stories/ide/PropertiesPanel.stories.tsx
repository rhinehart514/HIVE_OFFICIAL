import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { PropertiesPanel } from '@hive/ui/components/hivelab/ide/properties-panel';
import type { CanvasElement } from '@hive/ui/components/hivelab/ide/types';

/**
 * # Properties Panel
 *
 * The inspector panel that appears when an element is selected.
 * Technical, precise, immediate feedback - like a linter for visual elements.
 *
 * ## Visual Language
 * - Grouped sections with clear hierarchy
 * - Monospace for technical values (position, size)
 * - Instant validation feedback
 * - Gold focus states for active inputs
 *
 * ## Sections
 * - **Transform**: X, Y, Width, Height
 * - **Configuration**: Element-specific properties
 * - **Layout**: Z-index, grouping
 * - **Actions**: Duplicate, Delete
 *
 * ## Interaction Model
 * - Changes apply instantly (no "Apply" button)
 * - Tab navigates between fields
 * - Arrow keys nudge numeric values
 * - Toggle switches for booleans
 */
const meta: Meta<typeof PropertiesPanel> = {
  title: 'HiveLab/IDE/PropertiesPanel',
  component: PropertiesPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'lab-panel' },
    docs: {
      description: {
        component:
          'Element inspector panel with grouped properties. Precise, technical, immediate feedback.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        className="h-screen w-[300px]"
        style={{
          background: 'var(--lab-bg-panel, #15151F)',
          borderLeft: '1px solid var(--lab-border-default, #24242F)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PropertiesPanel>;

// Mock element for stories
const createMockElement = (overrides: Partial<CanvasElement> = {}): CanvasElement => ({
  id: 'el-001',
  elementId: 'poll-element',
  position: { x: 120, y: 80 },
  size: { width: 320, height: 240 },
  config: {
    question: "What's for lunch today?",
    allowMultiple: false,
    showResults: true,
  },
  visible: true,
  locked: false,
  zIndex: 1,
  ...overrides,
});

// Wrapper with state
function PropertiesPanelWithState({
  initialElement,
}: {
  initialElement: CanvasElement | null;
}) {
  const [element, setElement] = useState<CanvasElement | null>(initialElement);

  const handleUpdate = (id: string, updates: Partial<CanvasElement>) => {
    if (!element) return;
    setElement({ ...element, ...updates });
    console.warn('Update:', id, updates);
  };

  const handleDelete = (id: string) => {
    console.warn('Delete:', id);
    setElement(null);
  };

  const handleDuplicate = (id: string) => {
    console.warn('Duplicate:', id);
  };

  return (
    <PropertiesPanel
      selectedElement={element}
      onUpdateElement={handleUpdate}
      onDeleteElement={handleDelete}
      onDuplicateElement={handleDuplicate}
    />
  );
}

/**
 * Default - Poll element selected
 */
export const Default: Story = {
  render: () => <PropertiesPanelWithState initialElement={createMockElement()} />,
};

/**
 * No selection state
 */
export const NoSelection: Story = {
  render: () => <PropertiesPanelWithState initialElement={null} />,
};

/**
 * Search Input element
 */
export const SearchInput: Story = {
  render: () => (
    <PropertiesPanelWithState
      initialElement={createMockElement({
        id: 'el-002',
        elementId: 'search-input',
        position: { x: 40, y: 40 },
        size: { width: 280, height: 48 },
        config: {
          placeholder: 'Search events...',
          showIcon: true,
          autoFocus: false,
        },
      })}
    />
  ),
};

/**
 * Countdown Timer element
 */
export const CountdownTimer: Story = {
  render: () => (
    <PropertiesPanelWithState
      initialElement={createMockElement({
        id: 'el-003',
        elementId: 'countdown-timer',
        position: { x: 200, y: 120 },
        size: { width: 360, height: 180 },
        config: {
          targetDate: '2024-12-31T23:59:59',
          label: 'New Year Countdown',
          showDays: true,
        },
      })}
    />
  ),
};

/**
 * Locked element state
 */
export const LockedElement: Story = {
  render: () => (
    <PropertiesPanelWithState
      initialElement={createMockElement({
        locked: true,
      })}
    />
  ),
};

/**
 * Hidden element state
 */
export const HiddenElement: Story = {
  render: () => (
    <PropertiesPanelWithState
      initialElement={createMockElement({
        visible: false,
      })}
    />
  ),
};

/**
 * Property input states showcase
 */
export const InputStates: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 space-y-8" style={{ background: 'var(--lab-bg-canvas, #0A0A12)' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <h3 className="text-sm font-medium text-[#888] uppercase tracking-wider mb-6">
        Input Field States
      </h3>

      {/* Text Input */}
      <div className="space-y-3">
        <p className="text-xs text-[#666]">Text Input</p>
        <div className="space-y-2">
          <label className="text-xs text-[#666] block">Default</label>
          <input
            type="text"
            defaultValue="Search events..."
            className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none"
          />
          <label className="text-xs text-[#666] block">Focused</label>
          <input
            type="text"
            defaultValue="Search events..."
            className="w-full bg-[#252525] border border-[#FFD700] rounded-lg px-3 py-1.5 text-sm text-white outline-none ring-2 ring-[#FFD700]/20"
          />
          <label className="text-xs text-[#666] block">Invalid</label>
          <input
            type="text"
            defaultValue=""
            placeholder="Required field"
            className="w-full bg-[#252525] border border-red-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none ring-2 ring-red-500/20"
          />
        </div>
      </div>

      {/* Number Input */}
      <div className="space-y-3">
        <p className="text-xs text-[#666]">Number Input</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#666] mb-1 block">X</label>
            <input
              type="number"
              defaultValue="120"
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1 block">Y</label>
            <input
              type="number"
              defaultValue="80"
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Toggle Switch */}
      <div className="space-y-3">
        <p className="text-xs text-[#666]">Toggle Switch</p>
        <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-lg">
          <span className="text-sm text-white">Show Results</span>
          <div className="w-12 h-6 rounded-full bg-[#FFD700] relative cursor-pointer">
            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow" />
          </div>
        </div>
        <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-lg">
          <span className="text-sm text-white">Auto Focus</span>
          <div className="w-12 h-6 rounded-full bg-[#333] relative cursor-pointer">
            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow" />
          </div>
        </div>
      </div>

      {/* Select */}
      <div className="space-y-3">
        <p className="text-xs text-[#666]">Select Dropdown</p>
        <select className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none">
          <option>list</option>
          <option>grid</option>
          <option>cards</option>
        </select>
      </div>
    </>
  ),
};

/**
 * Section expand/collapse states
 */
export const SectionStates: Story = {
  decorators: [
    (Story) => (
      <div className="p-8" style={{ background: 'var(--lab-bg-canvas, #0A0A12)' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="w-[300px] bg-[#15151F] border border-[#333] rounded-lg overflow-hidden">
      {/* Expanded section */}
      <div className="border-b border-[#333]">
        <button className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-[#252525]">
          <span className="text-xs font-medium text-[#888] uppercase tracking-wider">
            Transform
          </span>
          <svg
            className="h-3.5 w-3.5 text-[#666]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#666] mb-1 block">X</label>
              <input
                type="number"
                defaultValue="120"
                className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-[#666] mb-1 block">Y</label>
              <input
                type="number"
                defaultValue="80"
                className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed section */}
      <div className="border-b border-[#333]">
        <button className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-[#252525]">
          <span className="text-xs font-medium text-[#888] uppercase tracking-wider">
            Configuration
          </span>
          <svg
            className="h-3.5 w-3.5 text-[#666]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Another collapsed section */}
      <div>
        <button className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-[#252525]">
          <span className="text-xs font-medium text-[#888] uppercase tracking-wider">Layout</span>
          <svg
            className="h-3.5 w-3.5 text-[#666]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  ),
};
