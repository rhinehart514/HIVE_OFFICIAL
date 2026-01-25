import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  RectangleGroupIcon,
  BeakerIcon,
  UserCircleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  RectangleGroupIcon as RectangleGroupIconSolid,
  BeakerIcon as BeakerIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';

const meta: Meta = {
  title: 'Experiments/MobileBottomNav Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'hive-dark' },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * COMPONENT: MobileBottomNav
 * STATUS: IN LAB — Awaiting selection
 *
 * From PRODUCT_MAP.md:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    [Content Area]                           │
 * ├─────────────────────────────────────────────────────────────┤
 * │  [🏠 Feed]  [📍 Spaces]  [🔧 Lab]  [👤 Profile]             │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Variables to test:
 * 1. Height — Bar height
 * 2. Item Style — Icon only, icon+label, active treatment
 * 3. Active Indicator — Dot, pill, fill, underline
 * 4. Safe Area — How to handle iPhone notch
 */

// ============================================
// SHARED TYPES & DATA
// ============================================

const NAV_ITEMS = [
  { label: 'Feed', icon: HomeIcon, iconSolid: HomeIconSolid },
  { label: 'Spaces', icon: RectangleGroupIcon, iconSolid: RectangleGroupIconSolid },
  { label: 'Lab', icon: BeakerIcon, iconSolid: BeakerIconSolid },
  { label: 'Profile', icon: UserCircleIcon, iconSolid: UserCircleIconSolid },
];

const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-[375px] h-[812px] bg-[#0a0a09] rounded-[40px] border-4 border-white/20 overflow-hidden mx-auto">
    {/* Notch */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-2xl z-50" />
    {/* Home indicator */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-50" />
    {children}
  </div>
);

const MockContent = () => (
  <div className="p-4 pt-12 space-y-4">
    <div className="h-6 w-32 bg-white/10 rounded" />
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-white/10 rounded mb-2" />
              <div className="h-2 w-full bg-white/[0.06] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// VARIABLE 1: Height
// ============================================
/**
 * Testing bottom nav height (excluding safe area).
 *
 * A: 56px — Compact (more content space)
 * B: 64px — Standard (iOS default)
 * C: 72px — Comfortable (easier tap targets)
 * D: 80px — Generous (very easy tapping)
 */
export const Variable1_Height: Story = {
  render: () => (
    <div className="flex gap-8 p-8 bg-[#0a0a09] min-h-screen justify-center flex-wrap">
      {/* A: 56px */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">A: 56px (Compact)</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-14 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" /> {/* Safe area */}
          </div>
        </PhoneFrame>
      </div>

      {/* B: 64px */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">B: 64px (Standard)</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* C: 72px */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">C: 72px (Comfortable)</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-[72px] px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1.5">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Item Style
// ============================================
/**
 * How should nav items be displayed?
 *
 * A: Icon Only — Minimal, more space
 * B: Icon + Label (Always) — Clear, standard
 * C: Icon + Label (Active Only) — Hybrid
 * D: Large Icons — Gesture-friendly
 */
export const Variable2_ItemStyle: Story = {
  render: () => (
    <div className="flex gap-8 p-8 bg-[#0a0a09] min-h-screen justify-center flex-wrap">
      {/* A: Icon Only */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">A: Icon Only</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-14 px-6 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="p-2">
                    <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-white/40'}`} />
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* B: Icon + Label Always */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">B: Icon + Label (Always)</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs font-medium ${isActive ? 'text-white' : 'text-white/40'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* C: Icon + Label Active Only */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">C: Label on Active Only</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    {isActive && (
                      <span className="text-label-xs font-medium text-white">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* D: Large Icons */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">D: Large Icons (28px)</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-6 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="p-2">
                    <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-white/40'}`} />
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Active Indicator
// ============================================
/**
 * How to show which tab is active?
 *
 * A: Dot — Small dot above icon
 * B: Pill — Rounded background
 * C: Fill + Gold — Solid icon, gold accent
 * D: Top Bar — Line at top of item
 * E: Glow — Subtle glow effect
 */
export const Variable3_ActiveIndicator: Story = {
  render: () => (
    <div className="flex gap-6 p-8 bg-[#0a0a09] min-h-screen justify-center flex-wrap">
      {/* A: Dot */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">A: Dot Above</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1 relative">
                    {isActive && (
                      <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                    )}
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* B: Pill */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">B: Pill Background</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-2 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const isActive = i === 1;
                return (
                  <button
                    key={item.label}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                      isActive ? 'bg-white/10' : ''
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* C: Fill + Gold */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">C: Solid Icon + Gold</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-[#FFD700]' : 'text-white/40'}`} />
                    <span className={`text-label-xs ${isActive ? 'text-[#FFD700]' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* D: Top Bar */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">D: Top Bar Line</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10 relative">
              {NAV_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1 relative">
                    {isActive && (
                      <div className="absolute -top-4 w-8 h-0.5 rounded-full bg-white" />
                    )}
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* E: Glow */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">E: Glow Effect</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1 relative">
                    {isActive && (
                      <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
                    )}
                    <Icon className={`w-6 h-6 relative ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs relative ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 4: Background Style
// ============================================
/**
 * How should the bottom nav background look?
 *
 * A: Solid — Opaque dark
 * B: Glass — Blur with transparency
 * C: Elevated — With shadow/border
 * D: Floating — Detached pill
 */
export const Variable4_Background: Story = {
  render: () => (
    <div className="flex gap-6 p-8 bg-[#0a0a09] min-h-screen justify-center flex-wrap">
      {/* A: Solid */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">A: Solid</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = i === 1 ? item.iconSolid : item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* B: Glass */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">B: Glass (Blur)</span>
        <PhoneFrame>
          <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-auto pb-24">
              <MockContent />
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09]/80 backdrop-blur-xl border-t border-white/10">
                {NAV_ITEMS.map((item, i) => {
                  const Icon = i === 1 ? item.iconSolid : item.icon;
                  const isActive = i === 1;
                  return (
                    <button key={item.label} className="flex flex-col items-center gap-1">
                      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                      <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="h-8 bg-[#0a0a09]/80 backdrop-blur-xl" />
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* C: Elevated */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">C: Elevated (Shadow)</span>
        <PhoneFrame>
          <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-auto pb-24">
              <MockContent />
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <div
                className="h-16 px-4 flex items-center justify-around bg-[#141312] border-t border-white/10"
                style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.5)' }}
              >
                {NAV_ITEMS.map((item, i) => {
                  const Icon = i === 1 ? item.iconSolid : item.icon;
                  const isActive = i === 1;
                  return (
                    <button key={item.label} className="flex flex-col items-center gap-1">
                      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                      <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="h-8 bg-[#141312]" />
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* D: Floating Pill */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">D: Floating Pill</span>
        <PhoneFrame>
          <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-auto pb-28">
              <MockContent />
            </div>
            <div className="absolute bottom-6 left-4 right-4">
              <div
                className="h-16 px-4 flex items-center justify-around bg-[#1c1c1c] rounded-2xl border border-white/10"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
              >
                {NAV_ITEMS.map((item, i) => {
                  const Icon = i === 1 ? item.iconSolid : item.icon;
                  const isActive = i === 1;
                  return (
                    <button key={item.label} className="flex flex-col items-center gap-1">
                      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                      <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  ),
};

// ============================================
// FULL COMPOSITIONS
// ============================================
export const FullCompositions: Story = {
  render: () => (
    <div className="flex gap-6 p-8 bg-[#0a0a09] min-h-screen justify-center flex-wrap">
      {/* Option 1: iOS-like */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">Option 1: iOS Standard</span>
        <span className="text-label-xs text-white/30 mb-2">64px, Icon+Label, Solid fill, Glass bg</span>
        <PhoneFrame>
          <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-auto pb-24">
              <MockContent />
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-16 px-4 flex items-center justify-around bg-[#0a0a09]/80 backdrop-blur-xl border-t border-white/10">
                {NAV_ITEMS.map((item, i) => {
                  const Icon = i === 1 ? item.iconSolid : item.icon;
                  const isActive = i === 1;
                  return (
                    <button key={item.label} className="flex flex-col items-center gap-1">
                      <Icon className={`w-6 h-6 ${isActive ? 'text-[#FFD700]' : 'text-white/40'}`} />
                      <span className={`text-label-xs ${isActive ? 'text-[#FFD700]' : 'text-white/40'}`}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="h-8 bg-[#0a0a09]/80 backdrop-blur-xl" />
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* Option 2: Minimal */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">Option 2: Minimal</span>
        <span className="text-label-xs text-white/30 mb-2">56px, Icon only, Dot indicator, Solid</span>
        <PhoneFrame>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <MockContent />
            </div>
            <div className="h-14 px-6 flex items-center justify-around bg-[#0a0a09] border-t border-white/10">
              {NAV_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const isActive = i === 1;
                return (
                  <button key={item.label} className="flex flex-col items-center gap-1 relative p-2">
                    {isActive && (
                      <div className="absolute -top-0.5 w-1 h-1 rounded-full bg-[#FFD700]" />
                    )}
                    <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-white/40'}`} />
                  </button>
                );
              })}
            </div>
            <div className="h-8 bg-[#0a0a09]" />
          </div>
        </PhoneFrame>
      </div>

      {/* Option 3: Premium */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-white/40 mb-2">Option 3: Premium Floating</span>
        <span className="text-label-xs text-white/30 mb-2">64px, Icon+Label, Pill bg, Floating</span>
        <PhoneFrame>
          <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-auto pb-28">
              <MockContent />
            </div>
            <div className="absolute bottom-6 left-4 right-4">
              <div
                className="h-16 px-2 flex items-center justify-around rounded-2xl border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92))',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {NAV_ITEMS.map((item, i) => {
                  const Icon = i === 1 ? item.iconSolid : item.icon;
                  const isActive = i === 1;
                  return (
                    <button
                      key={item.label}
                      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                        isActive ? 'bg-white/10' : ''
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                      <span className={`text-label-xs ${isActive ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  ),
};
