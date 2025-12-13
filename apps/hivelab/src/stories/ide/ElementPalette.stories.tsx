import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { ElementPalette } from '@hive/ui/components/hivelab/ide/element-palette';
import { motion } from 'framer-motion';

/**
 * # Element Palette
 *
 * The draggable element library that lives on the left side of the IDE.
 * Think Figma's component panel meets VS Code's file explorer.
 *
 * ## Visual Language
 * - Compact, technical cards
 * - Category-coded colors (input: blue, display: green, action: orange)
 * - Tier badges (Auth, Space) for connected elements
 * - Subtle preview on hover
 *
 * ## Interaction Model
 * - Search filters instantly
 * - Categories collapse/expand
 * - Drag ghost follows cursor precisely
 * - Drop zones highlight on canvas
 */
const meta: Meta<typeof ElementPalette> = {
  title: 'HiveLab/IDE/ElementPalette',
  component: ElementPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'lab-panel' },
    docs: {
      description: {
        component:
          'The element library panel. Draggable components organized by category with search and filtering.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        className="h-screen w-[280px]"
        style={{
          background: 'var(--lab-bg-panel, #15151F)',
          borderRight: '1px solid var(--lab-border-default, #24242F)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ElementPalette>;

// Wrapper to handle drag events
function PaletteWithState() {
  const [dragging, setDragging] = useState<string | null>(null);

  return (
    <div className="relative h-full">
      <ElementPalette
        onDragStart={(elementId) => setDragging(elementId)}
        onDragEnd={() => setDragging(null)}
      />
      {/* Drag indicator */}
      {dragging && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-3"
        >
          <p className="text-xs text-[#FFD700] font-mono">
            Dragging: {dragging}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Default palette with all elements
 */
export const Default: Story = {
  render: () => <PaletteWithState />,
};

/**
 * Palette in a narrow sidebar context
 */
export const NarrowSidebar: Story = {
  decorators: [
    (Story) => (
      <div
        className="h-screen w-[240px]"
        style={{
          background: 'var(--lab-bg-panel, #15151F)',
          borderRight: '1px solid var(--lab-border-default, #24242F)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => <PaletteWithState />,
};

/**
 * With canvas drop zone visualization
 */
export const WithDropZone: Story = {
  decorators: [
    (Story) => (
      <div className="h-screen flex">
        {/* Palette */}
        <div
          className="w-[280px] flex-shrink-0"
          style={{
            background: 'var(--lab-bg-panel, #15151F)',
            borderRight: '1px solid var(--lab-border-default, #24242F)',
          }}
        >
          <Story />
        </div>
        {/* Canvas Preview */}
        <div
          className="flex-1 relative"
          style={{
            background: 'var(--lab-bg-canvas, #0A0A12)',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Drop zone indicator */}
          <div className="absolute inset-8 border-2 border-dashed border-[#333] rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-[#666] text-sm">Drop elements here</p>
              <p className="text-[#444] text-xs mt-1">Drag from the palette on the left</p>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  render: () => <PaletteWithState />,
};

/**
 * Single element card - hover state showcase
 */
export const ElementCardStates: Story = {
  decorators: [
    (Story) => (
      <div className="p-8" style={{ background: 'var(--lab-bg-canvas, #0A0A12)' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-[#888] uppercase tracking-wider mb-4">
        Element Card States
      </h3>

      {/* Normal state */}
      <div>
        <p className="text-xs text-[#666] mb-2">Idle</p>
        <div
          className="p-3 bg-[#1a1a1a] border border-[#333] rounded-xl w-[240px]"
          style={{ borderRadius: 'var(--lab-radius-md, 6px)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Search Input</p>
              <p className="text-xs text-[#888]">Text search with suggestions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hover state */}
      <div>
        <p className="text-xs text-[#666] mb-2">Hover</p>
        <div
          className="p-3 bg-[#252525] border border-[#444] rounded-xl w-[240px] scale-[1.02] shadow-lg"
          style={{ borderRadius: 'var(--lab-radius-md, 6px)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Poll / Vote</p>
              <p className="text-xs text-[#888]">Collect votes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dragging state */}
      <div>
        <p className="text-xs text-[#666] mb-2">Dragging (ghost)</p>
        <div
          className="p-3 bg-[#1a1a1a]/80 border border-[#FFD700]/50 rounded-xl w-[240px] scale-[0.98] opacity-80 rotate-[2deg] shadow-2xl"
          style={{ borderRadius: 'var(--lab-radius-md, 6px)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10 text-green-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Result List</p>
              <p className="text-xs text-[#888]">Display filterable items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected tier badge */}
      <div>
        <p className="text-xs text-[#666] mb-2">With Tier Badge (Connected)</p>
        <div
          className="p-3 bg-[#1a1a1a] border border-[#333] rounded-xl w-[240px]"
          style={{ borderRadius: 'var(--lab-radius-md, 6px)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">Event Picker</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/20 text-blue-400">
                  Auth
                </span>
              </div>
              <p className="text-xs text-[#888]">Browse campus events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Space tier badge */}
      <div>
        <p className="text-xs text-[#666] mb-2">With Tier Badge (Space)</p>
        <div
          className="p-3 bg-[#1a1a1a] border border-[#333] rounded-xl w-[240px]"
          style={{ borderRadius: 'var(--lab-radius-md, 6px)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">Member List</p>
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/20 text-purple-400">
                  Space
                </span>
              </div>
              <p className="text-xs text-[#888]">Display space members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Category colors showcase
 */
export const CategoryColors: Story = {
  decorators: [
    (Story) => (
      <div className="p-8" style={{ background: 'var(--lab-bg-canvas, #0A0A12)' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-[#888] uppercase tracking-wider">
        Category Color System
      </h3>

      <div className="grid grid-cols-5 gap-4">
        {[
          { name: 'Input', color: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-400' },
          { name: 'Display', color: 'green', bg: 'bg-green-500/10', text: 'text-green-400' },
          { name: 'Filter', color: 'purple', bg: 'bg-purple-500/10', text: 'text-purple-400' },
          { name: 'Action', color: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-400' },
          { name: 'Layout', color: 'pink', bg: 'bg-pink-500/10', text: 'text-pink-400' },
        ].map((cat) => (
          <div key={cat.name} className="text-center">
            <div
              className={`w-12 h-12 rounded-lg ${cat.bg} ${cat.text} flex items-center justify-center mx-auto mb-2`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
            </div>
            <p className={`text-xs font-medium ${cat.text}`}>{cat.name}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};
