'use client';

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * CanvasShell Lab
 * STATUS: IN LAB — Awaiting selection
 *
 * Variables to test:
 * 1. Panel Layout — 3-column / 2-column + drawer / full-canvas
 * 2. Toolbar Style — top bar / floating / minimal
 * 3. Sidebar Mode — full / collapsed / icon-only
 *
 * Context: HiveLab IDE, tool creation, space management
 * Feel: "Powerful but not overwhelming."
 */

const meta: Meta = {
  title: 'Experiments/CanvasShell Lab',
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

function MockSidebarFull() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/[0.06]">
        <div className="text-sm font-medium text-white">Elements</div>
      </div>
      <div className="flex-1 p-3 space-y-2">
        {['Text', 'Button', 'Input', 'Card', 'Image', 'Divider'].map((item) => (
          <button
            key={item}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-white text-left"
          >
            <div className="w-6 h-6 rounded bg-white/[0.06]" />
            <span>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MockSidebarIcons() {
  return (
    <div className="flex flex-col items-center py-4 gap-3">
      {['T', 'B', 'I', 'C', 'P', '—'].map((icon, i) => (
        <button
          key={i}
          className="w-10 h-10 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white text-sm font-medium"
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function MockInspector() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/[0.06]">
        <div className="text-sm font-medium text-white">Properties</div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Width</label>
          <input
            type="text"
            defaultValue="100%"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/[0.16]"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Height</label>
          <input
            type="text"
            defaultValue="auto"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/[0.16]"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Padding</label>
          <div className="grid grid-cols-4 gap-2">
            {['16', '16', '16', '16'].map((val, i) => (
              <input
                key={i}
                type="text"
                defaultValue={val}
                className="w-full px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-white text-xs text-center focus:outline-none focus:border-white/[0.16]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCanvas() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-2xl aspect-[4/3] rounded-xl bg-[#141312] border border-white/[0.08] border-dashed flex items-center justify-center">
        <div className="text-neutral-500 text-sm">Canvas Area</div>
      </div>
    </div>
  );
}

function MockToolbarTop() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-white/[0.04] text-neutral-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-semibold text-white">My Tool</h1>
          <span className="text-xs text-neutral-500">Draft</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-white/[0.04]">
          Preview
        </button>
        <button className="px-4 py-1.5 rounded-lg bg-white/[0.06] border border-[#FFD700]/30 text-[#FFD700] text-sm font-medium">
          Deploy
        </button>
      </div>
    </div>
  );
}

function MockToolbarFloating() {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#141312]/90 backdrop-blur-xl border border-white/[0.08] shadow-xl">
        <button className="p-2 rounded-lg hover:bg-white/[0.08] text-neutral-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="px-2 text-sm font-medium text-white">My Tool</div>
        <button className="p-2 rounded-lg hover:bg-white/[0.08] text-neutral-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <div className="w-px h-5 bg-white/[0.08]" />
        <button className="px-3 py-1 rounded-full bg-white/[0.06] border border-[#FFD700]/30 text-[#FFD700] text-xs font-medium">
          Deploy
        </button>
      </div>
    </div>
  );
}

function MockToolbarMinimal() {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
      <button className="p-2 rounded-lg bg-[#141312]/80 backdrop-blur hover:bg-[#141312] text-neutral-400 border border-white/[0.08]">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      <button className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-[#FFD700]/30 text-[#FFD700] text-xs font-medium backdrop-blur">
        Deploy
      </button>
    </div>
  );
}

// ============================================
// SHELL VARIANTS
// ============================================

interface CanvasShellVariantProps {
  children: React.ReactNode;
  layout?: '3-column' | '2-column-drawer' | 'full-canvas';
  toolbar?: 'top' | 'floating' | 'minimal';
  sidebarMode?: 'full' | 'collapsed' | 'icon-only';
}

function CanvasShellVariant({
  children,
  layout = '3-column',
  toolbar = 'top',
  sidebarMode = 'full',
}: CanvasShellVariantProps) {
  const [inspectorOpen, setInspectorOpen] = useState(true);

  return (
    <div className="min-h-full flex bg-[#0A0A09]">
      {/* Sidebar */}
      {layout !== 'full-canvas' && (
        <aside
          className={`
            flex-shrink-0 border-r border-white/[0.06] bg-[#0D0D0C]
            ${sidebarMode === 'full' ? 'w-56' : sidebarMode === 'collapsed' ? 'w-12' : 'w-14'}
          `}
        >
          {sidebarMode === 'full' ? (
            <MockSidebarFull />
          ) : (
            <MockSidebarIcons />
          )}
        </aside>
      )}

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Toolbar */}
        {toolbar === 'top' && (
          <header className="flex-shrink-0 backdrop-blur-xl bg-[#0A0A09]/80 border-b border-white/[0.06] px-4 py-3">
            <MockToolbarTop />
          </header>
        )}
        {toolbar === 'floating' && <MockToolbarFloating />}
        {toolbar === 'minimal' && <MockToolbarMinimal />}

        {/* Canvas */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Inspector */}
      {layout === '3-column' && (
        <aside className="w-72 flex-shrink-0 border-l border-white/[0.06] bg-[#0D0D0C]">
          <MockInspector />
        </aside>
      )}

      {/* Drawer (for 2-column layout) */}
      {layout === '2-column-drawer' && inspectorOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-[#0D0D0C] border-l border-white/[0.06] shadow-2xl z-50">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <span className="text-sm font-medium text-white">Properties</span>
            <button
              onClick={() => setInspectorOpen(false)}
              className="p-1 rounded hover:bg-white/[0.04] text-neutral-400"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <MockInspector />
        </div>
      )}
    </div>
  );
}

// ============================================
// VARIABLE 1: Panel Layout
// ============================================

/**
 * 3 options for panel arrangement.
 * How should the IDE be structured?
 *
 * A: 3-Column — Sidebar + Canvas + Inspector (always visible)
 * B: 2-Column + Drawer — Sidebar + Canvas, inspector slides in
 * C: Full Canvas — Maximum canvas space, minimal chrome
 */
export const Variable1_PanelLayout: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare panel layouts. Which supports building best?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: 3-Column (persistent)
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant layout="3-column">
              <MockCanvas />
            </CanvasShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: 2-Column + Drawer
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant layout="2-column-drawer">
              <MockCanvas />
            </CanvasShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Full Canvas
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant layout="full-canvas">
              <MockCanvas />
            </CanvasShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Toolbar Style
// ============================================

/**
 * 3 options for toolbar presentation.
 * How should controls be accessed?
 *
 * A: Top Bar — Full header with title, breadcrumb, actions
 * B: Floating — Pill-style bar floating over canvas
 * C: Minimal — Just essential buttons in corner
 */
export const Variable2_ToolbarStyle: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare toolbar styles. Which balances access and focus?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: Top Bar (full)
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant toolbar="top" layout="3-column">
              <MockCanvas />
            </CanvasShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: Floating (pill)
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant toolbar="floating" layout="3-column">
              <MockCanvas />
            </CanvasShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Minimal (corner)
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant toolbar="minimal" layout="3-column">
              <MockCanvas />
            </CanvasShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Sidebar Mode
// ============================================

/**
 * 3 options for sidebar behavior.
 * How should element access work?
 *
 * A: Full — Labels + icons, always expanded
 * B: Collapsed — Narrow but expandable on hover
 * C: Icon-only — Just icons, hover for labels
 */
export const Variable3_SidebarMode: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare sidebar modes. Full labels or compact icons?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: Full (labels)
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant sidebarMode="full" layout="3-column">
              <MockCanvas />
            </CanvasShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: Collapsed (narrow)
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant sidebarMode="collapsed" layout="3-column">
              <MockCanvas />
            </CanvasShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Icon-only
          </span>
          <div className="h-[450px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <CanvasShellVariant sidebarMode="icon-only" layout="3-column">
              <MockCanvas />
            </CanvasShellVariant>
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
    <CanvasShellVariant layout="3-column" toolbar="top" sidebarMode="full">
      <MockCanvas />
    </CanvasShellVariant>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
