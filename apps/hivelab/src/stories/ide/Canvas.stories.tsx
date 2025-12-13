import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * # Canvas
 *
 * The central workspace where tools are built. Think technical drafting board
 * meets circuit board layout - precise, grid-aligned, purposeful.
 *
 * ## Visual Language
 * - Technical grid (visible enough to aid alignment, subtle enough not to distract)
 * - Element cards float on canvas with shadows
 * - Connection lines like PCB traces (curved, pulsing)
 * - Selection box with gold outline (activation signal)
 *
 * ## Grid Patterns
 * - **Lines**: Traditional drafting grid
 * - **Dots**: Minimal, modern feel
 * - **None**: Clean, distraction-free
 *
 * ## Interaction Model
 * - Click to select
 * - Drag to move
 * - Cmd+drag to multi-select
 * - Scroll to pan, pinch to zoom
 */
const meta: Meta = {
  title: 'HiveLab/IDE/Canvas',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'lab-canvas' },
    docs: {
      description: {
        component:
          'The visual canvas where elements are arranged. Technical grid, precise positioning, clear hierarchy.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Element card on canvas
function CanvasElement({
  id,
  name,
  x,
  y,
  width,
  height,
  selected = false,
  category = 'display',
}: {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selected?: boolean;
  category?: 'input' | 'display' | 'action';
}) {
  const categoryColors = {
    input: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    display: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    action: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  };

  const colors = categoryColors[category];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute"
      style={{ left: x, top: y, width, height }}
    >
      <div
        className={`h-full rounded-lg border ${
          selected
            ? 'border-[#FFD700] shadow-[0_0_0_2px_rgba(255,215,0,0.3)]'
            : 'border-[#333] hover:border-[#444]'
        } bg-[#1a1a1a] shadow-lg transition-all`}
        style={{ borderRadius: 'var(--lab-radius-md, 6px)' }}
      >
        {/* Header */}
        <div className={`px-3 py-2 border-b border-[#333] flex items-center gap-2 ${colors.bg}`}>
          <div className={`w-3 h-3 rounded-full ${colors.border} border-2`} />
          <span className="text-xs font-mono text-[#999]">{id}</span>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className={`text-sm font-medium ${colors.text}`}>{name}</p>
        </div>

        {/* Connection Ports */}
        {/* Input port (left) */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 rounded-full bg-[#252525] border-2 border-[#444] hover:border-blue-400 transition-colors" />
        </div>
        {/* Output port (right) */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 rounded-full bg-[#252525] border-2 border-[#444] hover:border-[#FFD700] transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

// Connection line between elements
function ConnectionLine({
  from,
  to,
  active = true,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active?: boolean;
}) {
  // Calculate control points for curved line
  const midX = (from.x + to.x) / 2;
  const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible">
      {/* Glow effect */}
      {active && (
        <path
          d={path}
          fill="none"
          stroke="rgba(255, 215, 0, 0.3)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={active ? '#FFD700' : '#444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={active ? 'none' : '4 4'}
      />
      {/* Animated pulse */}
      {active && (
        <motion.circle
          r="4"
          fill="#FFD700"
          animate={{
            offsetDistance: ['0%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ offsetPath: `path('${path}')` }}
        />
      )}
    </svg>
  );
}

/**
 * Grid patterns showcase
 */
export const GridPatterns: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 p-8 h-screen" style={{ background: '#0A0A12' }}>
      {/* Lines Grid */}
      <div className="relative rounded-lg border border-[#333] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute bottom-4 left-4 right-4 bg-[#0A0A12]/90 rounded px-3 py-2 border border-[#333]">
          <p className="text-xs font-medium text-white">Lines Grid</p>
          <p className="text-xs text-[#666]">Traditional drafting feel</p>
        </div>
      </div>

      {/* Dots Grid */}
      <div className="relative rounded-lg border border-[#333] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute bottom-4 left-4 right-4 bg-[#0A0A12]/90 rounded px-3 py-2 border border-[#333]">
          <p className="text-xs font-medium text-white">Dots Grid</p>
          <p className="text-xs text-[#666]">Minimal, modern</p>
        </div>
      </div>

      {/* No Grid */}
      <div className="relative rounded-lg border border-[#333] overflow-hidden bg-[#0A0A12]">
        <div className="absolute bottom-4 left-4 right-4 bg-[#0A0A12]/90 rounded px-3 py-2 border border-[#333]">
          <p className="text-xs font-medium text-white">No Grid</p>
          <p className="text-xs text-[#666]">Clean, distraction-free</p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Element card states
 */
export const ElementStates: Story = {
  render: () => (
    <div
      className="h-screen p-8 relative"
      style={{
        background: '#0A0A12',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Idle */}
      <CanvasElement
        id="el-001"
        name="Search Input"
        x={60}
        y={60}
        width={240}
        height={120}
        category="input"
      />

      {/* Selected */}
      <CanvasElement
        id="el-002"
        name="Result List"
        x={360}
        y={60}
        width={280}
        height={160}
        selected={true}
        category="display"
      />

      {/* Action */}
      <CanvasElement
        id="el-003"
        name="Submit Button"
        x={60}
        y={240}
        width={200}
        height={100}
        category="action"
      />
    </div>
  ),
};

/**
 * Connection lines
 */
export const Connections: Story = {
  render: () => (
    <div
      className="h-screen p-8 relative"
      style={{
        background: '#0A0A12',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Elements */}
      <CanvasElement
        id="search"
        name="Search Input"
        x={80}
        y={120}
        width={200}
        height={100}
        category="input"
      />
      <CanvasElement
        id="filter"
        name="Filter"
        x={80}
        y={280}
        width={200}
        height={100}
        category="input"
      />
      <CanvasElement
        id="results"
        name="Result List"
        x={420}
        y={180}
        width={240}
        height={140}
        category="display"
        selected={true}
      />

      {/* Active connection */}
      <ConnectionLine from={{ x: 280, y: 170 }} to={{ x: 420, y: 250 }} active={true} />

      {/* Inactive connection */}
      <ConnectionLine from={{ x: 280, y: 330 }} to={{ x: 420, y: 250 }} active={false} />

      {/* Connection legend */}
      <div className="absolute bottom-8 left-8 bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium text-[#888] uppercase tracking-wider">
          Connection States
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-0.5 bg-[#FFD700]" />
          <span className="text-xs text-white">Active (data flowing)</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-0.5 bg-[#444]"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #444 0 4px, transparent 4px 8px)' }}
          />
          <span className="text-xs text-[#666]">Inactive</span>
        </div>
      </div>
    </div>
  ),
};

/**
 * Empty canvas state
 */
export const EmptyCanvas: Story = {
  render: () => (
    <div
      className="h-screen relative flex items-center justify-center"
      style={{
        background: '#0A0A12',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Dashed drop zone */}
      <div className="w-[480px] h-[320px] border-2 border-dashed border-[#333] rounded-lg flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[#FFD700]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <p className="text-white font-medium mb-2">Start building</p>
        <p className="text-sm text-[#666] mb-4">Drag elements from the palette or use AI</p>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-[#252525] border border-[#333] rounded text-xs text-white">
            ⌘
          </kbd>
          <kbd className="px-2 py-1 bg-[#252525] border border-[#333] rounded text-xs text-white">
            K
          </kbd>
          <span className="text-xs text-[#666]">to generate with AI</span>
        </div>
      </div>
    </div>
  ),
};

/**
 * Multi-select state
 */
export const MultiSelect: Story = {
  render: () => (
    <div
      className="h-screen p-8 relative"
      style={{
        background: '#0A0A12',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Selection box */}
      <div
        className="absolute border-2 border-[#FFD700] bg-[#FFD700]/5 rounded"
        style={{ left: 50, top: 50, width: 320, height: 320 }}
      />

      {/* Selected elements */}
      <CanvasElement
        id="el-001"
        name="Search Input"
        x={80}
        y={80}
        width={200}
        height={100}
        selected={true}
        category="input"
      />
      <CanvasElement
        id="el-002"
        name="Filter"
        x={80}
        y={220}
        width={200}
        height={100}
        selected={true}
        category="input"
      />

      {/* Selection info */}
      <div className="absolute bottom-8 left-8 bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded bg-blue-500/20 border-2 border-[#1a1a1a] flex items-center justify-center">
              <span className="text-xs text-blue-400">E1</span>
            </div>
            <div className="w-8 h-8 rounded bg-blue-500/20 border-2 border-[#1a1a1a] flex items-center justify-center">
              <span className="text-xs text-blue-400">E2</span>
            </div>
          </div>
          <span className="text-sm text-white">2 elements selected</span>
        </div>
        <p className="text-xs text-[#666] mt-2">
          Press <kbd className="px-1 bg-[#333] rounded">⌘K</kbd> for batch actions
        </p>
      </div>
    </div>
  ),
};

/**
 * Zoom levels
 */
export const ZoomLevels: Story = {
  render: () => (
    <div className="h-screen flex" style={{ background: '#0A0A12' }}>
      {/* 50% zoom */}
      <div className="flex-1 relative border-r border-[#333] overflow-hidden">
        <div
          className="absolute inset-0 scale-50 origin-center"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <CanvasElement
            id="el-001"
            name="Search"
            x={200}
            y={200}
            width={240}
            height={120}
            category="input"
          />
        </div>
        <div className="absolute bottom-4 left-4 bg-[#252525] px-2 py-1 rounded text-xs text-[#999] font-mono">
          50%
        </div>
      </div>

      {/* 100% zoom */}
      <div className="flex-1 relative border-r border-[#333] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <CanvasElement
            id="el-001"
            name="Search"
            x={40}
            y={40}
            width={240}
            height={120}
            category="input"
          />
        </div>
        <div className="absolute bottom-4 left-4 bg-[#FFD700] px-2 py-1 rounded text-xs text-black font-mono">
          100%
        </div>
      </div>

      {/* 150% zoom */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 scale-150 origin-top-left"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <CanvasElement
            id="el-001"
            name="Search"
            x={20}
            y={20}
            width={240}
            height={120}
            category="input"
          />
        </div>
        <div className="absolute bottom-4 left-4 bg-[#252525] px-2 py-1 rounded text-xs text-[#999] font-mono">
          150%
        </div>
      </div>
    </div>
  ),
};
