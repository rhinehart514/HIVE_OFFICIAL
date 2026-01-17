'use client';

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * BrowseShell Lab
 * STATUS: IN LAB — Awaiting selection
 *
 * Variables to test:
 * 1. Filter Bar Position — sticky / inline / sidebar
 * 2. Grid Columns — fixed 3 / fixed 4 / responsive 2-4
 * 3. Card Sizing — uniform / bento / masonry
 *
 * Context: Space discovery, tool gallery, search results
 * Feel: "Exploration. Everything is scannable."
 */

const meta: Meta = {
  title: 'Experiments/BrowseShell Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// MOCK CONTENT
// ============================================

function MockSpaceCard({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`
        rounded-xl bg-[#141312] border border-white/[0.06] overflow-hidden
        ${featured ? 'row-span-2' : ''}
      `}
    >
      {/* Header gradient */}
      <div className="h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/[0.06]" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded bg-white/[0.08]" />
            <div className="h-3 w-16 rounded bg-white/[0.04] mt-1" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-white/[0.04]" />
        <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
        {featured && (
          <>
            <div className="h-3 w-full rounded bg-white/[0.04]" />
            <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
          </>
        )}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex -space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-lg bg-white/[0.08] ring-2 ring-[#141312]"
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500">24 members</span>
        </div>
      </div>
    </div>
  );
}

function MockFilterBar() {
  return (
    <div className="flex items-center gap-3">
      <button className="px-3 py-1.5 rounded-full text-sm bg-white/[0.06] text-white">
        All
      </button>
      <button className="px-3 py-1.5 rounded-full text-sm text-neutral-400 hover:bg-white/[0.04]">
        Academic
      </button>
      <button className="px-3 py-1.5 rounded-full text-sm text-neutral-400 hover:bg-white/[0.04]">
        Social
      </button>
      <button className="px-3 py-1.5 rounded-full text-sm text-neutral-400 hover:bg-white/[0.04]">
        Professional
      </button>
      <div className="flex-1" />
      <button className="px-3 py-1.5 rounded text-sm text-neutral-400 hover:text-white">
        Popular
      </button>
    </div>
  );
}

function MockHeader() {
  return (
    <div className="flex items-center justify-between py-4">
      <h1 className="text-xl font-semibold text-white">Browse Spaces</h1>
      <div className="w-64 px-4 py-2 rounded-lg bg-white/[0.04] text-neutral-500 text-sm">
        Search spaces...
      </div>
    </div>
  );
}

// ============================================
// SHELL VARIANTS
// ============================================

interface BrowseShellVariantProps {
  children: React.ReactNode;
  filterPosition?: 'sticky' | 'inline' | 'sidebar';
  columns?: 3 | 4 | 'responsive';
  cardSizing?: 'uniform' | 'bento' | 'masonry';
}

function BrowseShellVariant({
  children,
  filterPosition = 'sticky',
  columns = 'responsive',
  cardSizing = 'uniform',
}: BrowseShellVariantProps) {
  const columnClasses = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    responsive: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gridClass =
    cardSizing === 'masonry'
      ? 'columns-3 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid'
      : `grid ${columnClasses[columns]} gap-4`;

  return (
    <div className="min-h-screen bg-[#0A0A09]">
      {/* Header - always present */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0A0A09]/90 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <MockHeader />
        </div>
      </header>

      {/* Layout based on filter position */}
      {filterPosition === 'sidebar' ? (
        <div className="flex max-w-7xl mx-auto">
          {/* Sidebar filters */}
          <aside className="w-56 flex-shrink-0 p-6 border-r border-white/[0.06]">
            <div className="space-y-2">
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
                Categories
              </div>
              <button className="block w-full px-3 py-2 rounded-lg text-sm text-left bg-white/[0.06] text-white">
                All Spaces
              </button>
              <button className="block w-full px-3 py-2 rounded-lg text-sm text-left text-neutral-400 hover:bg-white/[0.04]">
                Academic
              </button>
              <button className="block w-full px-3 py-2 rounded-lg text-sm text-left text-neutral-400 hover:bg-white/[0.04]">
                Social
              </button>
              <button className="block w-full px-3 py-2 rounded-lg text-sm text-left text-neutral-400 hover:bg-white/[0.04]">
                Professional
              </button>
              <button className="block w-full px-3 py-2 rounded-lg text-sm text-left text-neutral-400 hover:bg-white/[0.04]">
                Sports
              </button>
            </div>
          </aside>
          {/* Main grid */}
          <main className="flex-1 p-6">
            <div className={gridClass}>{children}</div>
          </main>
        </div>
      ) : (
        <>
          {/* Filter bar */}
          {filterPosition === 'sticky' ? (
            <div className="sticky top-[57px] z-30 backdrop-blur-xl bg-[#0A0A09]/80 border-b border-white/[0.04]">
              <div className="max-w-7xl mx-auto px-6 py-3">
                <MockFilterBar />
              </div>
            </div>
          ) : null}

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-6 py-6">
            {filterPosition === 'inline' && (
              <div className="mb-6">
                <MockFilterBar />
              </div>
            )}
            <div className={gridClass}>{children}</div>
          </main>
        </>
      )}
    </div>
  );
}

// ============================================
// VARIABLE 1: Filter Bar Position
// ============================================

/**
 * 3 options for filter bar placement.
 * How should users navigate categories?
 *
 * A: Sticky — Persistent below header, always visible
 * B: Inline — Part of content flow, scrolls away
 * C: Sidebar — Persistent vertical navigation
 */
export const Variable1_FilterBarPosition: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare filter positions. Which supports exploration best?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: Sticky (always visible)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="sticky" columns={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MockSpaceCard key={i} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: Inline (scrolls away)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="inline" columns={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MockSpaceCard key={i} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Sidebar (persistent)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="sidebar" columns={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MockSpaceCard key={i} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Grid Columns
// ============================================

/**
 * 3 options for grid column behavior.
 * Fixed or responsive?
 *
 * A: Fixed 3 columns — Consistent, predictable
 * B: Fixed 4 columns — Dense, more visible at once
 * C: Responsive — Adapts to viewport width
 */
export const Variable2_GridColumns: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare grid layouts. Fixed columns or responsive?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: Fixed 3 columns
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="sticky" columns={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MockSpaceCard key={i} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: Fixed 4 columns
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="sticky" columns={4}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <MockSpaceCard key={i} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Responsive (adapts)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="sticky" columns="responsive">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MockSpaceCard key={i} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Card Sizing
// ============================================

/**
 * 3 options for card sizing strategy.
 * Uniform or varied?
 *
 * A: Uniform — All cards same size, clean grid
 * B: Bento — Featured cards span multiple rows
 * C: Masonry — Variable height, Pinterest-style
 */
export const Variable3_CardSizing: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare card sizing. Uniform, hierarchical, or organic?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: Uniform (all same)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="sticky" columns={3} cardSizing="uniform">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MockSpaceCard key={i} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: Bento (featured larger)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="sticky" columns={3} cardSizing="bento">
              <MockSpaceCard featured />
              {[2, 3, 4, 5].map((i) => (
                <MockSpaceCard key={i} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Masonry (variable)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <BrowseShellVariant filterPosition="sticky" cardSizing="masonry">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MockSpaceCard key={i} featured={i % 3 === 0} />
              ))}
            </BrowseShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// FULL SCREEN PREVIEW
// ============================================

export const FullScreenPreview: Story = {
  render: () => (
    <BrowseShellVariant filterPosition="sticky" columns="responsive" cardSizing="uniform">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <MockSpaceCard key={i} />
      ))}
    </BrowseShellVariant>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
