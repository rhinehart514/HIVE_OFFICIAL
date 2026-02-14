'use client';

import * as React from 'react';

import { ElementPalette } from './element-palette';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '05-HiveLab/IDE/ElementPalette',
  component: ElementPalette,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Draggable element palette for HiveLab IDE. Features 20 elements across 3 tiers (Universal, Connected, Space) organized into 5 categories (Input, Display, Filter, Action, Layout). Includes search, collapsible categories, and premium visual effects.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ElementPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default callbacks for all stories
const defaultCallbacks = {
  onDragStart: (elementId: string) => console.log('Drag start:', elementId),
  onDragEnd: () => console.log('Drag end'),
};

// ============================================================
// BASIC STATES
// ============================================================

export const Default: Story = {
  args: {
    ...defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default element palette for regular users (Universal + Connected tiers).',
      },
    },
  },
};

export const AsRegularUser: Story = {
  args: {
    ...defaultCallbacks,
    userContext: {
      userId: 'user-123',
      campusId: 'ub-buffalo',
      isSpaceLeader: false,
      leadingSpaceIds: [],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Regular user view - no Space tier elements available.',
      },
    },
  },
};

export const AsSpaceLeader: Story = {
  args: {
    ...defaultCallbacks,
    userContext: {
      userId: 'user-123',
      campusId: 'ub-buffalo',
      isSpaceLeader: true,
      leadingSpaceIds: ['space-1', 'space-2'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Space leader view - all tiers including Space tier elements.',
      },
    },
  },
};

// ============================================================
// USER CONTEXT VARIATIONS
// ============================================================

export const NoUserContext: Story = {
  args: {
    ...defaultCallbacks,
    userContext: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'No user context provided - defaults to showing Universal + Connected tiers.',
      },
    },
  },
};

export const SingleSpaceLeader: Story = {
  args: {
    ...defaultCallbacks,
    userContext: {
      userId: 'user-123',
      campusId: 'ub-buffalo',
      isSpaceLeader: true,
      leadingSpaceIds: ['design-club'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Leader of a single space - full access to all elements.',
      },
    },
  },
};

export const MultiSpaceLeader: Story = {
  args: {
    ...defaultCallbacks,
    userContext: {
      userId: 'user-123',
      campusId: 'ub-buffalo',
      isSpaceLeader: true,
      leadingSpaceIds: ['space-1', 'space-2', 'space-3', 'space-4', 'space-5'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Leader of multiple spaces - full access to all elements.',
      },
    },
  },
};

// ============================================================
// INTERACTIVE EXAMPLES
// ============================================================

export const InteractivePalette: Story = {
  render: () => {
    const [draggedElement, setDraggedElement] = React.useState<string | null>(null);
    const [dragHistory, setDragHistory] = React.useState<string[]>([]);

    const handleDragStart = (elementId: string) => {
      setDraggedElement(elementId);
    };

    const handleDragEnd = () => {
      if (draggedElement) {
        setDragHistory(prev => [...prev, draggedElement]);
      }
      setDraggedElement(null);
    };

    return (
      <div className="flex gap-4">
        <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
          <ElementPalette
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            userContext={{ userId: 'user-123', isSpaceLeader: true }}
          />
        </div>
        <div className="w-[200px] bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
          <h4 className="text-sm font-medium text-white mb-2">Drag Activity</h4>
          {draggedElement && (
            <div className="mb-3 p-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded text-sm text-[#FFD700]">
              Dragging: {draggedElement}
            </div>
          )}
          <div className="text-xs text-[#888]">
            <p className="mb-1">Drag history:</p>
            {dragHistory.length === 0 ? (
              <p className="text-[#555]">No elements dragged yet</p>
            ) : (
              <ul className="space-y-1">
                {dragHistory.slice(-5).map((el, i) => (
                  <li key={i} className="text-[#aaa]">{el}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-black min-h-[640px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing drag events and history.',
      },
    },
  },
};

export const SearchDemo: Story = {
  render: () => {
    const [searchLog, setSearchLog] = React.useState<string[]>([]);

    return (
      <div className="flex gap-4">
        <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
          <ElementPalette
            onDragStart={(id) => setSearchLog(prev => [...prev, `Drag: ${id}`])}
            onDragEnd={() => {}}
            userContext={{ userId: 'user-123', isSpaceLeader: true }}
          />
        </div>
        <div className="w-[200px] bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
          <h4 className="text-sm font-medium text-white mb-2">Search Tips</h4>
          <ul className="text-xs text-[#888] space-y-2">
            <li>• Try "poll" to find voting elements</li>
            <li>• Try "member" to find space elements</li>
            <li>• Try "timer" to find countdown elements</li>
            <li>• Try "chart" to find display elements</li>
          </ul>
        </div>
      </div>
    );
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-black min-h-[640px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demo highlighting search functionality.',
      },
    },
  },
};

// ============================================================
// CATEGORY STATES
// ============================================================

export const AllCategoriesExpanded: Story = {
  args: {
    ...defaultCallbacks,
    userContext: { userId: 'user-123', isSpaceLeader: true },
  },
  parameters: {
    docs: {
      description: {
        story: 'All categories expanded (default state).',
      },
    },
  },
};

export const InputCategory: Story = {
  render: () => (
    <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
      <div className="px-3 py-3 border-b border-[#333]">
        <h3 className="text-sm font-medium text-white mb-2">Input Elements</h3>
        <p className="text-xs text-[#888]">Elements for collecting user input</p>
      </div>
      <ElementPalette
        onDragStart={console.log}
        onDragEnd={() => {}}
        userContext={{ userId: 'user-123', isSpaceLeader: true }}
      />
    </div>
  ),
  decorators: [(Story) => <Story />],
  parameters: {
    docs: {
      description: {
        story: 'Focus on Input category elements (search, form, date picker).',
      },
    },
  },
};

export const DisplayCategory: Story = {
  render: () => (
    <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
      <div className="px-3 py-3 border-b border-[#333]">
        <h3 className="text-sm font-medium text-white mb-2">Display Elements</h3>
        <p className="text-xs text-[#888]">Elements for showing data and results</p>
      </div>
      <ElementPalette
        onDragStart={console.log}
        onDragEnd={() => {}}
        userContext={{ userId: 'user-123', isSpaceLeader: true }}
      />
    </div>
  ),
  decorators: [(Story) => <Story />],
  parameters: {
    docs: {
      description: {
        story: 'Focus on Display category elements (lists, charts, timers).',
      },
    },
  },
};

export const ActionCategory: Story = {
  render: () => (
    <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
      <div className="px-3 py-3 border-b border-[#333]">
        <h3 className="text-sm font-medium text-white mb-2">Action Elements</h3>
        <p className="text-xs text-[#888]">Elements for user interactions and voting</p>
      </div>
      <ElementPalette
        onDragStart={console.log}
        onDragEnd={() => {}}
        userContext={{ userId: 'user-123', isSpaceLeader: true }}
      />
    </div>
  ),
  decorators: [(Story) => <Story />],
  parameters: {
    docs: {
      description: {
        story: 'Focus on Action category elements (polls, RSVP, announcements).',
      },
    },
  },
};

// ============================================================
// TIER VARIATIONS
// ============================================================

export const UniversalTierOnly: Story = {
  args: {
    ...defaultCallbacks,
    userContext: {
      userId: 'guest',
      isSpaceLeader: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows only Universal tier elements (no Connected/Space badges).',
      },
    },
  },
};

export const ConnectedTierHighlight: Story = {
  render: () => (
    <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
      <div className="px-3 py-3 border-b border-[#333] bg-blue-500/5">
        <h3 className="text-sm font-medium text-white mb-1">Connected Elements</h3>
        <p className="text-xs text-blue-400">Elements that connect to campus data</p>
      </div>
      <ElementPalette
        onDragStart={console.log}
        onDragEnd={() => {}}
        userContext={{ userId: 'user-123', isSpaceLeader: false }}
      />
    </div>
  ),
  decorators: [(Story) => <Story />],
  parameters: {
    docs: {
      description: {
        story: 'Highlighting Connected tier elements with "Auth" badge.',
      },
    },
  },
};

export const SpaceTierHighlight: Story = {
  render: () => (
    <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
      <div className="px-3 py-3 border-b border-[#333] bg-purple-500/5">
        <h3 className="text-sm font-medium text-white mb-1">Space Elements</h3>
        <p className="text-xs text-purple-400">Leader-only elements for space management</p>
      </div>
      <ElementPalette
        onDragStart={console.log}
        onDragEnd={() => {}}
        userContext={{ userId: 'user-123', isSpaceLeader: true }}
      />
    </div>
  ),
  decorators: [(Story) => <Story />],
  parameters: {
    docs: {
      description: {
        story: 'Highlighting Space tier elements with "Space" badge and premium effects.',
      },
    },
  },
};

// ============================================================
// SEARCH STATES
// ============================================================

export const EmptySearch: Story = {
  render: () => {
    // This story demonstrates the empty search state
    // The actual search input is in the component
    return (
      <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
        <div className="px-3 py-3 border-b border-[#333]">
          <p className="text-xs text-[#888] mb-2">Try searching for "xyz" to see empty state</p>
        </div>
        <ElementPalette
          onDragStart={console.log}
          onDragEnd={() => {}}
          userContext={{ userId: 'user-123', isSpaceLeader: true }}
        />
      </div>
    );
  },
  decorators: [(Story) => <Story />],
  parameters: {
    docs: {
      description: {
        story: 'Search with no matching results shows empty state.',
      },
    },
  },
};

// ============================================================
// RESPONSIVE LAYOUT
// ============================================================

export const NarrowWidth: Story = {
  args: {
    ...defaultCallbacks,
    userContext: { userId: 'user-123', isSpaceLeader: true },
  },
  decorators: [
    (Story) => (
      <div className="w-[220px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Palette at minimum width (220px).',
      },
    },
  },
};

export const WideWidth: Story = {
  args: {
    ...defaultCallbacks,
    userContext: { userId: 'user-123', isSpaceLeader: true },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Palette at wider width (360px) - more room for descriptions.',
      },
    },
  },
};

export const ShortHeight: Story = {
  args: {
    ...defaultCallbacks,
    userContext: { userId: 'user-123', isSpaceLeader: true },
  },
  decorators: [
    (Story) => (
      <div className="w-[280px] h-[400px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Palette at shorter height - demonstrates scrolling.',
      },
    },
  },
};

export const TallHeight: Story = {
  args: {
    ...defaultCallbacks,
    userContext: { userId: 'user-123', isSpaceLeader: true },
  },
  decorators: [
    (Story) => (
      <div className="w-[280px] h-[800px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Palette at taller height - all elements visible.',
      },
    },
  },
};

// ============================================================
// VISUAL EFFECTS
// ============================================================

export const PremiumEffects: Story = {
  render: () => (
    <div className="flex gap-4 items-start">
      <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
        <div className="px-3 py-3 border-b border-[#333]">
          <p className="text-xs text-[#888]">Hover over elements to see effects</p>
        </div>
        <ElementPalette
          onDragStart={console.log}
          onDragEnd={() => {}}
          userContext={{ userId: 'user-123', isSpaceLeader: true }}
        />
      </div>
      <div className="w-[200px] p-3 bg-[#1a1a1a] border border-[#333] rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">Visual Effects</h4>
        <ul className="text-xs text-[#888] space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Connected: Blue shine border
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Space: Purple glow effect
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>
            Dragging: Gold border
          </li>
        </ul>
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 bg-black min-h-[640px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates premium visual effects for different element tiers.',
      },
    },
  },
};

// ============================================================
// COMPARISON STORIES
// ============================================================

export const RegularVsLeader: Story = {
  render: () => (
    <div className="flex gap-4">
      <div>
        <div className="text-xs text-[#888] mb-2 text-center">Regular User</div>
        <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
          <ElementPalette
            onDragStart={console.log}
            onDragEnd={() => {}}
            userContext={{ userId: 'user-123', isSpaceLeader: false }}
          />
        </div>
      </div>
      <div>
        <div className="text-xs text-[#888] mb-2 text-center">Space Leader</div>
        <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
          <ElementPalette
            onDragStart={console.log}
            onDragEnd={() => {}}
            userContext={{ userId: 'user-123', isSpaceLeader: true }}
          />
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 bg-black min-h-[680px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of regular user vs space leader access.',
      },
    },
  },
};

// ============================================================
// REAL-WORLD CONTEXT
// ============================================================

export const InIDEContext: Story = {
  render: () => (
    <div className="flex h-[600px] bg-[#0f0f0f]">
      {/* Simulated IDE Layout */}
      <div className="w-[280px] bg-[#0D0D0D] border-r border-[#333]">
        <ElementPalette
          onDragStart={console.log}
          onDragEnd={() => {}}
          userContext={{ userId: 'user-123', isSpaceLeader: true }}
        />
      </div>
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center text-[#555]">
          <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[#333] mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm">Drop elements here</p>
        </div>
      </div>
      <div className="w-[280px] bg-[#0D0D0D] border-l border-[#333] p-4">
        <h3 className="text-sm font-medium text-white mb-2">Properties</h3>
        <p className="text-xs text-[#555]">Select an element to edit properties</p>
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="border border-[#333] rounded-lg overflow-hidden">
        <div className="h-10 bg-[#1a1a1a] border-b border-[#333] flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-xs text-[#666] ml-4">HiveLab IDE - My Tool</span>
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Element palette shown in the context of the full IDE layout.',
      },
    },
  },
};

// ============================================================
// ACCESSIBILITY
// ============================================================

export const ReducedMotion: Story = {
  args: {
    ...defaultCallbacks,
    userContext: { userId: 'user-123', isSpaceLeader: true },
  },
  parameters: {
    docs: {
      description: {
        story: 'Enable prefers-reduced-motion in your browser/OS to see animations disabled.',
      },
    },
  },
};

export const KeyboardNavigation: Story = {
  render: () => (
    <div className="w-[280px] h-[600px] bg-[#0D0D0D] border border-[#333] rounded-lg overflow-hidden">
      <div className="px-3 py-3 border-b border-[#333] bg-blue-500/5">
        <p className="text-xs text-blue-400">Use Tab to navigate, Enter/Space to toggle categories</p>
      </div>
      <ElementPalette
        onDragStart={console.log}
        onDragEnd={() => {}}
        userContext={{ userId: 'user-123', isSpaceLeader: true }}
      />
    </div>
  ),
  decorators: [(Story) => <Story />],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard navigation support.',
      },
    },
  },
};
