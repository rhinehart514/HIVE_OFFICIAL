import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  RectangleGroupIcon,
  BeakerIcon,
  UserCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

const meta: Meta = {
  title: 'Experiments/GlobalNav Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

/**
 * COMPONENT: GlobalNav
 * STATUS: IN LAB — Awaiting selection
 *
 * From PRODUCT_MAP.md:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [HIVE]  [Spaces]  [Lab]  [Profile]           [⌘K]  [●]     │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Variables to test:
 * 1. Height/Density — How tall?
 * 2. Logo Treatment — Icon, text, wordmark
 * 3. Nav Item Style — Pills, underline, text-only
 * 4. Background — Solid, glass, transparent
 */

// ============================================
// SHARED COMPONENTS
// ============================================

const Logo = ({ variant }: { variant: 'icon' | 'text' | 'wordmark' | 'icon-text' }) => {
  const iconOnly = (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center">
      <Squares2X2Icon className="w-5 h-5 text-black" />
    </div>
  );

  const textOnly = (
    <span className="text-xl font-bold tracking-tight text-white">HIVE</span>
  );

  const wordmark = (
    <span className="text-lg font-semibold tracking-widest text-white/90">H I V E</span>
  );

  const iconText = (
    <div className="flex items-center gap-2">
      {iconOnly}
      <span className="text-lg font-semibold text-white">HIVE</span>
    </div>
  );

  switch (variant) {
    case 'icon': return iconOnly;
    case 'text': return textOnly;
    case 'wordmark': return wordmark;
    case 'icon-text': return iconText;
  }
};

const NavItems = ({
  style,
  activeIndex = 1,
}: {
  style: 'pills' | 'underline' | 'text-only' | 'icon-first';
  activeIndex?: number;
}) => {
  const items = [
    { label: 'Spaces', icon: RectangleGroupIcon },
    { label: 'Lab', icon: BeakerIcon },
    { label: 'Profile', icon: UserCircleIcon },
  ];

  const baseClass = 'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-150';

  const getItemClass = (isActive: boolean) => {
    switch (style) {
      case 'pills':
        return isActive
          ? `${baseClass} rounded-full bg-white/10 text-white`
          : `${baseClass} rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]`;
      case 'underline':
        return isActive
          ? `${baseClass} text-white border-b-2 border-white`
          : `${baseClass} text-white/60 hover:text-white border-b-2 border-transparent`;
      case 'text-only':
        return isActive
          ? `${baseClass} text-white`
          : `${baseClass} text-white/50 hover:text-white/80`;
      case 'icon-first':
        return isActive
          ? `${baseClass} text-white`
          : `${baseClass} text-white/50 hover:text-white/80`;
    }
  };

  return (
    <nav className="flex items-center gap-1">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = i === activeIndex;
        return (
          <button key={item.label} className={getItemClass(isActive)}>
            {style === 'icon-first' && <Icon className="w-4 h-4" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const RightActions = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-2">
    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all">
      <MagnifyingGlassIcon className="w-4 h-4" />
      {!compact && <span className="hidden md:inline">Search</span>}
      <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-white/10 rounded">⌘K</kbd>
    </button>
    <button className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all">
      <BellIcon className="w-5 h-5" />
      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FFD700] rounded-full" />
    </button>
  </div>
);

// ============================================
// VARIABLE 1: Height/Density
// ============================================
/**
 * Testing nav bar height. HIVE should feel spacious but not wasteful.
 *
 * A: 48px — Compact (Discord-like)
 * B: 56px — Standard (Linear-like)
 * C: 64px — Comfortable (Notion-like)
 * D: 72px — Generous (Premium app feel)
 */
export const Variable1_Height: Story = {
  render: () => (
    <div className="flex flex-col bg-[#0a0a09] min-h-screen">
      <div className="text-sm text-white/40 px-4 py-2 border-b border-white/10">
        Which height feels right for HIVE's top nav?
      </div>

      {/* A: 48px */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">A: 48px (Compact)</span>
        <div className="h-12 px-4 flex items-center justify-between bg-[#0a0a09]">
          <Logo variant="icon" />
          <NavItems style="text-only" />
          <RightActions compact />
        </div>
      </div>

      {/* B: 56px */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">B: 56px (Standard)</span>
        <div className="h-14 px-4 flex items-center justify-between bg-[#0a0a09]">
          <Logo variant="icon" />
          <NavItems style="text-only" />
          <RightActions />
        </div>
      </div>

      {/* C: 64px */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">C: 64px (Comfortable)</span>
        <div className="h-16 px-6 flex items-center justify-between bg-[#0a0a09]">
          <Logo variant="icon-text" />
          <NavItems style="text-only" />
          <RightActions />
        </div>
      </div>

      {/* D: 72px */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">D: 72px (Generous)</span>
        <div className="h-[72px] px-6 flex items-center justify-between bg-[#0a0a09]">
          <Logo variant="icon-text" />
          <NavItems style="pills" />
          <RightActions />
        </div>
      </div>

      {/* Page content simulation */}
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-white/10 rounded mb-4" />
          <div className="h-4 w-full bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-5/6 bg-white/[0.06] rounded" />
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Logo Treatment
// ============================================
/**
 * How should HIVE identify itself in the nav?
 *
 * A: Icon only — Minimal, modern (Apple)
 * B: Text only — Clean, direct (Linear)
 * C: Wordmark — Spaced letters, premium (Fashion brands)
 * D: Icon + Text — Clear brand anchor (Most apps)
 */
export const Variable2_Logo: Story = {
  render: () => (
    <div className="flex flex-col bg-[#0a0a09] min-h-screen">
      <div className="text-sm text-white/40 px-4 py-2 border-b border-white/10">
        How should HIVE identify itself?
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-px bg-white/10">
        {/* A: Icon only */}
        <div className="bg-[#0a0a09]">
          <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">A: Icon Only</span>
          <div className="h-14 px-4 flex items-center justify-between">
            <Logo variant="icon" />
            <NavItems style="text-only" />
            <RightActions compact />
          </div>
        </div>

        {/* B: Text only */}
        <div className="bg-[#0a0a09]">
          <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">B: Text Only</span>
          <div className="h-14 px-4 flex items-center justify-between">
            <Logo variant="text" />
            <NavItems style="text-only" />
            <RightActions compact />
          </div>
        </div>

        {/* C: Wordmark */}
        <div className="bg-[#0a0a09]">
          <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">C: Wordmark (Spaced)</span>
          <div className="h-14 px-4 flex items-center justify-between">
            <Logo variant="wordmark" />
            <NavItems style="text-only" />
            <RightActions compact />
          </div>
        </div>

        {/* D: Icon + Text */}
        <div className="bg-[#0a0a09]">
          <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">D: Icon + Text</span>
          <div className="h-14 px-4 flex items-center justify-between">
            <Logo variant="icon-text" />
            <NavItems style="text-only" />
            <RightActions compact />
          </div>
        </div>
      </div>

      {/* Full width comparison */}
      <div className="mt-8 px-4">
        <div className="text-xs text-white/30 mb-4">Full width comparison:</div>
        <div className="space-y-4">
          {(['icon', 'text', 'wordmark', 'icon-text'] as const).map((variant) => (
            <div key={variant} className="h-14 px-4 flex items-center justify-between border border-white/10 rounded-xl">
              <Logo variant={variant} />
              <NavItems style="text-only" />
              <RightActions />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Nav Item Style
// ============================================
/**
 * How should active/hover states appear on nav items?
 *
 * A: Pills — Rounded background on active (GitHub)
 * B: Underline — Bottom border on active (Classic)
 * C: Text Only — Color change only (Minimal)
 * D: Icon First — Icon + label (Mobile-like)
 */
export const Variable3_ItemStyle: Story = {
  render: () => (
    <div className="flex flex-col bg-[#0a0a09] min-h-screen">
      <div className="text-sm text-white/40 px-4 py-2 border-b border-white/10">
        Hover each nav item. Which interaction feels right?
      </div>

      {/* A: Pills */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">A: Pills (Rounded bg)</span>
        <div className="h-14 px-4 flex items-center justify-between">
          <Logo variant="icon" />
          <NavItems style="pills" activeIndex={0} />
          <RightActions />
        </div>
      </div>

      {/* B: Underline */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">B: Underline (Bottom border)</span>
        <div className="h-14 px-4 flex items-center justify-between">
          <Logo variant="icon" />
          <NavItems style="underline" activeIndex={0} />
          <RightActions />
        </div>
      </div>

      {/* C: Text Only */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">C: Text Only (Color change)</span>
        <div className="h-14 px-4 flex items-center justify-between">
          <Logo variant="icon" />
          <NavItems style="text-only" activeIndex={0} />
          <RightActions />
        </div>
      </div>

      {/* D: Icon First */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">D: Icon + Label</span>
        <div className="h-14 px-4 flex items-center justify-between">
          <Logo variant="icon" />
          <NavItems style="icon-first" activeIndex={0} />
          <RightActions />
        </div>
      </div>

      {/* Interactive demo */}
      <div className="p-8">
        <div className="text-xs text-white/30 mb-4">Try hovering different items:</div>
        <div className="grid grid-cols-2 gap-4">
          {(['pills', 'underline', 'text-only', 'icon-first'] as const).map((style) => (
            <div key={style} className="p-4 border border-white/10 rounded-xl">
              <div className="text-xs text-white/40 mb-3 capitalize">{style.replace('-', ' ')}</div>
              <NavItems style={style} activeIndex={1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 4: Background Treatment
// ============================================
/**
 * How should the nav bar background behave?
 *
 * A: Solid — Opaque dark background
 * B: Glass — Blur with transparency
 * C: Transparent — Content shows through
 * D: Gradient — Subtle top-to-bottom fade
 */
export const Variable4_Background: Story = {
  render: () => (
    <div className="flex flex-col bg-[#0a0a09] min-h-screen">
      <div className="text-sm text-white/40 px-4 py-2 border-b border-white/10">
        Scroll to see how backgrounds behave with content behind.
      </div>

      {/* Stacked nav bars over content */}
      <div className="relative">
        {/* Background content simulation */}
        <div className="absolute inset-0 p-8 pt-[280px]">
          <div className="max-w-2xl mx-auto space-y-4">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-white/20 rounded mb-2" />
                  <div className="h-3 w-full bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* A: Solid */}
        <div className="sticky top-0 z-10">
          <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">A: Solid</span>
          <div className="h-14 px-4 flex items-center justify-between bg-[#0a0a09] border-b border-white/10">
            <Logo variant="icon" />
            <NavItems style="text-only" />
            <RightActions />
          </div>
        </div>

        {/* B: Glass */}
        <div className="sticky top-[57px] z-10">
          <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">B: Glass (Blur)</span>
          <div className="h-14 px-4 flex items-center justify-between bg-[#0a0a09]/80 backdrop-blur-xl border-b border-white/10">
            <Logo variant="icon" />
            <NavItems style="text-only" />
            <RightActions />
          </div>
        </div>

        {/* C: Transparent */}
        <div className="sticky top-[114px] z-10">
          <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">C: Transparent</span>
          <div className="h-14 px-4 flex items-center justify-between bg-transparent border-b border-white/10">
            <Logo variant="icon" />
            <NavItems style="text-only" />
            <RightActions />
          </div>
        </div>

        {/* D: Gradient */}
        <div className="sticky top-[171px] z-10">
          <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">D: Gradient Fade</span>
          <div className="h-14 px-4 flex items-center justify-between bg-gradient-to-b from-[#0a0a09] to-transparent border-b border-white/10">
            <Logo variant="icon" />
            <NavItems style="text-only" />
            <RightActions />
          </div>
        </div>

        {/* Spacer */}
        <div className="h-[600px]" />
      </div>
    </div>
  ),
};

// ============================================
// FULL COMPOSITION OPTIONS
// ============================================
/**
 * Recommended combinations based on HIVE's design language.
 * Review after individual variables are picked.
 */
export const FullCompositions: Story = {
  render: () => (
    <div className="flex flex-col bg-[#0a0a09] min-h-screen">
      <div className="text-sm text-white/40 px-4 py-2 border-b border-white/10">
        Full composition options. Pick after individual variables are locked.
      </div>

      {/* Option 1: Minimal (Linear-like) */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">
          Option 1: Minimal (56px, icon, text-only, solid)
        </span>
        <div className="h-14 px-4 flex items-center justify-between bg-[#0a0a09]">
          <Logo variant="icon" />
          <NavItems style="text-only" />
          <RightActions />
        </div>
      </div>

      {/* Option 2: Premium (Notion-like) */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">
          Option 2: Premium (64px, icon+text, pills, glass)
        </span>
        <div className="h-16 px-6 flex items-center justify-between bg-[#0a0a09]/80 backdrop-blur-xl">
          <Logo variant="icon-text" />
          <NavItems style="pills" />
          <RightActions />
        </div>
      </div>

      {/* Option 3: Bold (App-like) */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">
          Option 3: Bold (64px, text, underline, solid)
        </span>
        <div className="h-16 px-6 flex items-center justify-between bg-[#0a0a09]">
          <Logo variant="text" />
          <NavItems style="underline" />
          <RightActions />
        </div>
      </div>

      {/* Option 4: Modern (YC/Vercel-like) */}
      <div className="border-b border-white/10">
        <span className="text-xs text-white/30 px-4 py-1 block bg-white/[0.02]">
          Option 4: Modern (56px, icon, pills, glass)
        </span>
        <div className="h-14 px-4 flex items-center justify-between bg-[#0a0a09]/80 backdrop-blur-xl">
          <Logo variant="icon" />
          <NavItems style="pills" />
          <RightActions />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-lg text-white/80 mb-4">Page Content Area</div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                <div className="h-3 w-full bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};
