'use client';

/**
 * CardRefined - Apple Glass Variations
 *
 * DIRECTION: Apple Glass (gradient bg, strong inset, vibrant)
 * Now testing use-case-specific variations
 */

import type { Meta } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Experiments/Card Refined',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

// Base Apple Glass style - DARKER
const appleGlassBase = {
  background: 'linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(18,18,18,0.92) 100%)',
  boxShadow: `
    0 0 0 1px rgba(255,255,255,0.08),
    0 8px 32px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.1)
  `,
};

// ============================================
// USE CASE 1: Space Cards (Browse/Discovery)
// ============================================
export const SpaceCard_Variations = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Space Cards (Browse/Discovery)</h2>
    <p className="text-sm text-white/50">Cards in grid layouts, need to feel clickable</p>

    <div className="grid grid-cols-3 gap-6">
      {/* Default */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Default</div>
        <div
          className="rounded-2xl p-5 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:brightness-110"
          style={appleGlassBase}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500" />
            <div>
              <div className="text-sm font-medium text-white">Design Club</div>
              <div className="text-xs text-white/50">127 members</div>
            </div>
          </div>
          <div className="text-xs text-white/60 line-clamp-2">A community for designers exploring new ideas and sharing work.</div>
        </div>
      </div>

      {/* With Activity (Warm) */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Active (Warmth)</div>
        <div
          className="rounded-2xl p-5 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:brightness-110"
          style={{
            ...appleGlassBase,
            boxShadow: `
              0 0 0 1px rgba(255,215,0,0.2),
              0 8px 32px rgba(0,0,0,0.4),
              0 0 20px rgba(255,215,0,0.08),
              inset 0 1px 0 rgba(255,255,255,0.15)
            `,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500" />
            <div>
              <div className="text-sm font-medium text-white flex items-center gap-2">
                Startup Founders
                <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
              </div>
              <div className="text-xs text-white/50">89 members • 12 online</div>
            </div>
          </div>
          <div className="text-xs text-white/60 line-clamp-2">Building the next big thing together.</div>
        </div>
      </div>

      {/* Compact */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Compact (List)</div>
        <div
          className="rounded-xl p-4 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:brightness-110"
          style={{
            background: 'linear-gradient(135deg, rgba(24,24,24,0.95) 0%, rgba(16,16,16,0.92) 100%)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.06),
              0 4px 16px rgba(0,0,0,0.45),
              inset 0 1px 0 rgba(255,255,255,0.08)
            `,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">CS Study Group</div>
              <div className="text-xs text-white/50">42 members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
SpaceCard_Variations.storyName = '1. Space Cards';

// ============================================
// USE CASE 2: Content Cards (Feed/Posts)
// ============================================
export const ContentCard_Variations = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Content Cards (Feed/Posts)</h2>
    <p className="text-sm text-white/50">Content-focused, needs to breathe</p>

    <div className="grid grid-cols-2 gap-6 max-w-3xl">
      {/* Post Card */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Post Card</div>
        <div
          className="rounded-2xl p-5 backdrop-blur-xl"
          style={appleGlassBase}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/10" />
            <div>
              <div className="text-sm font-medium text-white">Alex Chen</div>
              <div className="text-xs text-white/40">2 hours ago</div>
            </div>
          </div>
          <div className="text-sm text-white/80 mb-4">Just shipped the new feature! Feeling great about this one. What do you all think?</div>
          <div className="flex gap-4 text-xs text-white/50">
            <span>24 likes</span>
            <span>8 comments</span>
          </div>
        </div>
      </div>

      {/* Event Card */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Event Card</div>
        <div
          className="rounded-2xl overflow-hidden backdrop-blur-xl"
          style={appleGlassBase}
        >
          <div className="h-24 bg-gradient-to-br from-indigo-600 to-purple-700" />
          <div className="p-5">
            <div className="text-xs text-[#FFD700] font-medium mb-1">TOMORROW</div>
            <div className="text-sm font-medium text-white mb-1">Design System Workshop</div>
            <div className="text-xs text-white/50">Student Union • 6:00 PM</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
ContentCard_Variations.storyName = '2. Content Cards';

// ============================================
// USE CASE 3: Modal/Dialog Cards
// ============================================
export const ModalCard_Variations = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Modal/Dialog Cards</h2>
    <p className="text-sm text-white/50">Elevated, focused attention</p>

    <div className="grid grid-cols-2 gap-8">
      {/* Standard Modal */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Standard Modal</div>
        <div
          className="rounded-3xl p-6 backdrop-blur-2xl max-w-sm"
          style={{
            background: 'linear-gradient(180deg, rgba(32,32,32,0.98) 0%, rgba(20,20,20,0.96) 100%)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.1),
              0 24px 80px rgba(0,0,0,0.7),
              inset 0 1px 0 rgba(255,255,255,0.12)
            `,
          }}
        >
          <div className="text-base font-semibold text-white mb-2">Create Space</div>
          <div className="text-sm text-white/60 mb-4">Give your community a home.</div>
          <div className="h-10 rounded-xl bg-white/5 border border-white/10 mb-4" />
          <div className="flex gap-3 justify-end">
            <button className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
            <button className="px-4 py-2 text-sm bg-[#FFD700] text-black rounded-full font-medium">Create</button>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Confirmation</div>
        <div
          className="rounded-2xl p-5 backdrop-blur-2xl max-w-xs text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(32,32,32,0.98) 0%, rgba(20,20,20,0.96) 100%)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.1),
              0 24px 80px rgba(0,0,0,0.7),
              inset 0 1px 0 rgba(255,255,255,0.12)
            `,
          }}
        >
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <div className="text-base font-semibold text-white mb-1">Leave Space?</div>
          <div className="text-sm text-white/60 mb-4">You'll lose access to all content.</div>
          <div className="flex gap-3 justify-center">
            <button className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
            <button className="px-4 py-2 text-sm bg-red-500 text-white rounded-full font-medium">Leave</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
ModalCard_Variations.storyName = '3. Modal Cards';

// ============================================
// USE CASE 4: Sidebar/Navigation Items
// ============================================
export const SidebarCard_Variations = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Sidebar/Navigation Items</h2>
    <p className="text-sm text-white/50">Subtle, doesn't compete with content</p>

    <div className="flex gap-8">
      {/* Sidebar Example */}
      <div className="w-64 space-y-1 p-3 rounded-2xl" style={{ background: 'rgba(20,20,20,0.5)' }}>
        {/* Active Item */}
        <div
          className="rounded-xl p-3 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(18,18,18,0.85) 100%)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.07),
              inset 0 1px 0 rgba(255,255,255,0.08)
            `,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
            <div className="text-sm font-medium text-white">Design Club</div>
          </div>
        </div>

        {/* Inactive Items */}
        {['Startup Founders', 'CS Study Group', 'Film Society'].map((name) => (
          <div
            key={name}
            className="rounded-xl p-3 cursor-pointer transition-all duration-200 hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10" />
              <div className="text-sm text-white/70">{name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Nav Item States */}
      <div className="space-y-4">
        <div className="text-xs text-white/50">States</div>
        <div className="space-y-2 w-56">
          <div className="text-xs text-white/40">Default</div>
          <div className="rounded-xl p-3 bg-transparent text-white/70 text-sm">Item</div>

          <div className="text-xs text-white/40">Hover</div>
          <div className="rounded-xl p-3 bg-white/5 text-white/80 text-sm">Item</div>

          <div className="text-xs text-white/40">Active</div>
          <div
            className="rounded-xl p-3 text-white text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(18,18,18,0.85) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            Item
          </div>
        </div>
      </div>
    </div>
  </div>
);
SidebarCard_Variations.storyName = '4. Sidebar Items';

// ============================================
// USE CASE 5: Input/Form Cards
// ============================================
export const InputCard_Variations = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Input/Form Cards</h2>
    <p className="text-sm text-white/50">Container for form sections</p>

    <div className="max-w-md">
      <div
        className="rounded-2xl p-6 backdrop-blur-xl space-y-4"
        style={appleGlassBase}
      >
        <div className="text-base font-semibold text-white">Profile Settings</div>

        <div className="space-y-2">
          <label className="text-xs text-white/50">Display Name</label>
          <div
            className="h-11 rounded-xl px-4 flex items-center text-sm text-white"
            style={{
              background: 'rgba(0,0,0,0.3)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            Alex Chen
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-white/50">Bio</label>
          <div
            className="h-24 rounded-xl px-4 py-3 text-sm text-white/60"
            style={{
              background: 'rgba(0,0,0,0.3)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            Write something about yourself...
          </div>
        </div>

        <button className="w-full h-11 bg-[#FFD700] text-black rounded-full font-medium text-sm">
          Save Changes
        </button>
      </div>
    </div>
  </div>
);
InputCard_Variations.storyName = '5. Form Cards';

// ============================================
// USE CASE 6: Tooltip/Popover
// ============================================
export const TooltipCard_Variations = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Tooltip/Popover</h2>
    <p className="text-sm text-white/50">Small, contextual overlays</p>

    <div className="flex gap-8">
      {/* Tooltip */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Tooltip</div>
        <div
          className="rounded-lg px-3 py-2 text-xs text-white backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.95) 100%)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.08),
              0 4px 12px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          Edit profile
        </div>
      </div>

      {/* Dropdown */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">Dropdown Menu</div>
        <div
          className="rounded-xl py-2 backdrop-blur-xl w-48"
          style={{
            background: 'linear-gradient(180deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.08),
              0 8px 24px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          <div className="px-3 py-2 text-sm text-white hover:bg-white/5 cursor-pointer">View Profile</div>
          <div className="px-3 py-2 text-sm text-white hover:bg-white/5 cursor-pointer">Settings</div>
          <div className="h-px bg-white/10 my-1" />
          <div className="px-3 py-2 text-sm text-red-400 hover:bg-white/5 cursor-pointer">Log Out</div>
        </div>
      </div>

      {/* User Card Popover */}
      <div className="space-y-2">
        <div className="text-xs text-white/50">User Popover</div>
        <div
          className="rounded-2xl p-4 backdrop-blur-xl w-64"
          style={{
            background: 'linear-gradient(180deg, rgba(55,55,55,0.95) 0%, rgba(40,40,40,0.92) 100%)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.12),
              0 12px 32px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.15)
            `,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500" />
            <div>
              <div className="text-sm font-medium text-white">Alex Chen</div>
              <div className="text-xs text-white/50">@alexchen</div>
            </div>
          </div>
          <div className="text-xs text-white/60 mb-3">Design lead at HIVE. Building the future.</div>
          <button className="w-full h-9 bg-white/10 text-white text-xs rounded-lg hover:bg-white/15 transition-colors">
            View Profile
          </button>
        </div>
      </div>
    </div>
  </div>
);
TooltipCard_Variations.storyName = '6. Tooltip/Popover';

// ============================================
// SUMMARY: All Use Cases
// ============================================
export const Summary = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-white">Apple Glass - Use Case Summary</h2>

    <div className="grid grid-cols-3 gap-4 text-xs">
      <div className="space-y-2">
        <div className="text-white/50">Space Cards</div>
        <div className="text-white/30">rounded-2xl, p-5, hover:brightness-110</div>
      </div>
      <div className="space-y-2">
        <div className="text-white/50">Content Cards</div>
        <div className="text-white/30">rounded-2xl, p-5, no hover effect</div>
      </div>
      <div className="space-y-2">
        <div className="text-white/50">Modal Cards</div>
        <div className="text-white/30">rounded-3xl, p-6, stronger shadow</div>
      </div>
      <div className="space-y-2">
        <div className="text-white/50">Sidebar Items</div>
        <div className="text-white/30">rounded-xl, p-3, lighter gradient</div>
      </div>
      <div className="space-y-2">
        <div className="text-white/50">Form Cards</div>
        <div className="text-white/30">rounded-2xl, p-6, inset inputs</div>
      </div>
      <div className="space-y-2">
        <div className="text-white/50">Tooltips</div>
        <div className="text-white/30">rounded-lg/xl, py-2, sharper shadow</div>
      </div>
    </div>

    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="text-sm font-medium text-white mb-2">Core Apple Glass Recipe (Dark)</div>
      <code className="text-xs text-white/60 block whitespace-pre">{`background: linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92))
boxShadow:
  0 0 0 1px rgba(255,255,255,0.08),
  0 8px 32px rgba(0,0,0,0.5),
  inset 0 1px 0 rgba(255,255,255,0.1)`}</code>
    </div>
  </div>
);
Summary.storyName = '7. Summary';
