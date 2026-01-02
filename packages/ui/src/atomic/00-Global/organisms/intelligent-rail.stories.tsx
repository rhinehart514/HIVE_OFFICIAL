import type { Meta, StoryObj } from '@storybook/react';
import {
  RefinedRail,
  RefinedRailDemo,
  type NavSection,
  type NotificationItem,
} from './intelligent-rail';
import * as React from 'react';
import { motion } from 'framer-motion';

// Mock notifications data
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', text: 'New ritual starting in 10 minutes', time: '2m ago', unread: true },
  { id: '2', text: 'Alex commented on your post in CS Club', time: '1h ago', unread: true },
  { id: '3', text: 'Design Society posted a new event', time: '3h ago', unread: false },
  { id: '4', text: 'You were mentioned in Hackathon 2025', time: '5h ago', unread: false },
];

const meta: Meta<typeof RefinedRail> = {
  title: '00-Global/Intelligent Rail',
  component: RefinedRail,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0A0A0A' }],
    },
  },
  argTypes: {
    activeSection: {
      control: 'select',
      options: ['feed', 'spaces', 'hivelab'],
    },
    isExpanded: {
      control: 'boolean',
    },
    notificationCount: {
      control: { type: 'number', min: 0, max: 99 },
    },
    hoverExpand: {
      control: 'boolean',
    },
    isFirstVisit: {
      control: 'boolean',
      description: 'Triggers staggered reveal animation for first-time users',
    },
    lockedSections: {
      control: 'check',
      options: ['feed', 'spaces', 'hivelab'],
      description: 'Sections shown as "Coming Soon"',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RefinedRail>;

// ============================================
// REFINED RAIL — OpenAI/Apple Aesthetic
// ============================================

/**
 * Refined Rail — The OpenAI/Apple-inspired navigation
 *
 * This is the default navigation for HIVE. Ultra-minimal design with:
 * - Barely-there surfaces (rgba(255,255,255,0.02-0.04))
 * - Gold only in 2 places: active indicator dot + notification badge
 * - Slower, physics-driven spring animations
 * - Hover-to-expand behavior (300ms delay, like macOS dock)
 * - Simplified panels with generous whitespace
 */
export const Default: Story = {
  name: 'Refined Rail',
  render: () => <RefinedRailDemo />,
  parameters: {
    docs: {
      description: {
        story: `
**Refined Rail** — OpenAI/Apple-inspired navigation

## Design Philosophy

This navigation embodies the calm confidence of products like ChatGPT and macOS:

- **Ultra minimal** — Barely-there surfaces that don't compete with content
- **Monochrome base** — Gray-on-gray hierarchy; gold reserved for key moments only
- **No borders** — Uses spacing and subtle gradients instead of lines
- **Typography-led** — 13px body, 11px uppercase labels with 0.05em tracking
- **Generous whitespace** — 24px gaps between sections
- **Hover reveals** — Content appears on interaction, not by default

## Gold Usage (Strictly Limited)

Gold appears in exactly 2 places:
1. **Active indicator** — 2px × 16px vertical bar on left edge of active nav item
2. **Notification badge** — Small rounded badge for unread counts

That's it. No gold backgrounds, no gold icons, no gold text.

## Motion

- Slower springs: \`stiffness: 200, damping: 28\`
- Content staggers at 30ms per item with 8px Y translate
- Hover-to-expand with 300ms delay (like macOS dock hover)
- Frosted glass backdrop-blur when expanded

## Panels (Simplified)

- **Feed**: Just 4-5 recent items, no search (⌘K handles that)
- **Spaces**: Pinned (max 3) + Recent (max 5), tiny presence dots
- **Profile**: 2 stats inline + 3 quick actions

**Hover over the rail to expand. Click elsewhere to collapse.**
        `,
      },
    },
  },
};

// Manual expand control
export const ManualControl: Story = {
  name: 'Manual Expand Control',
  render: () => {
    const [activeSection, setActiveSection] = React.useState<NavSection>('spaces');
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <RefinedRail
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
          notificationCount={3}
          hoverExpand={false}
        />
        <motion.main
          initial={false}
          animate={{ marginLeft: isExpanded ? 300 : 72 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="min-h-screen p-12"
        >
          <div className="max-w-xl">
            <h1 className="text-[28px] font-medium text-white/90 mb-1 tracking-tight">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
            <p className="text-[14px] text-white/40 mb-6">
              Hover-to-expand disabled. Use the chevron button to toggle.
            </p>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 rounded-lg bg-white/[0.04] text-white/60 text-sm hover:bg-white/[0.08] transition-colors"
            >
              {isExpanded ? 'Collapse Rail' : 'Expand Rail'}
            </button>
          </div>
        </motion.main>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Rail with hover-to-expand disabled. Use the chevron button or click to toggle.',
      },
    },
  },
};

// Collapsed state
export const Collapsed: Story = {
  name: 'Collapsed State',
  render: () => {
    const [activeSection, setActiveSection] = React.useState<NavSection>('feed');
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <RefinedRail
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
          notificationCount={5}
          hoverExpand={true}
        />
        <motion.main
          initial={{ marginLeft: 72 }}
          animate={{ marginLeft: isExpanded ? 300 : 72 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="text-center max-w-md px-8">
            <h2 className="text-xl font-medium text-white/80 mb-4">Collapsed State</h2>
            <p className="text-white/40 text-sm mb-6">
              Hover over the rail or click the chevron to expand.
              Note the subtle gold dot badge on Spaces when collapsed.
            </p>
            <div className="text-[11px] text-white/30 uppercase tracking-[0.05em]">
              {isExpanded ? 'Expanded (300px)' : 'Collapsed (72px)'}
            </div>
          </div>
        </motion.main>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The rail in collapsed state (72px). Hover to expand or use the chevron button.',
      },
    },
  },
};

// Contextual panels showcase
export const ContextualPanels: Story = {
  name: 'Contextual Panels',
  render: () => {
    const [activeSection, setActiveSection] = React.useState<NavSection>('feed');

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <RefinedRail
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isExpanded={true}
          notificationCount={5}
          hoverExpand={false}
        />
        <motion.main
          initial={{ marginLeft: 300 }}
          className="min-h-screen p-8"
        >
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold text-white mb-2">Contextual Panels</h1>
            <p className="text-white/40 text-sm mb-8">
              Each section reveals relevant content when active. Click the nav items to switch.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setActiveSection('feed')}
                className={`p-3 rounded-xl text-left transition-all ${
                  activeSection === 'feed'
                    ? 'bg-[#FFD700]/10 border border-[#FFD700]/20'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${activeSection === 'feed' ? 'text-[#FFD700]' : 'text-white/80'}`}>
                  Feed
                </div>
                <div className="text-[10px] text-white/40">
                  Activity
                </div>
              </button>

              <button
                onClick={() => setActiveSection('spaces')}
                className={`p-3 rounded-xl text-left transition-all ${
                  activeSection === 'spaces'
                    ? 'bg-[#FFD700]/10 border border-[#FFD700]/20'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${activeSection === 'spaces' ? 'text-[#FFD700]' : 'text-white/80'}`}>
                  Spaces
                </div>
                <div className="text-[10px] text-white/40">
                  Communities
                </div>
              </button>

              <button
                onClick={() => setActiveSection('hivelab')}
                className={`p-3 rounded-xl text-left transition-all ${
                  activeSection === 'hivelab'
                    ? 'bg-[#FFD700]/10 border border-[#FFD700]/20'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${activeSection === 'hivelab' ? 'text-[#FFD700]' : 'text-white/80'}`}>
                  HiveLab
                </div>
                <div className="text-[10px] text-white/40">
                  Build Tools
                </div>
              </button>
            </div>
          </div>
        </motion.main>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Contextual Intelligence**

3-item navigation for soft launch:

- **Feed**: Recent activity (mentions, events, messages, reactions) — locked with pulsing gold "Soon" badge
- **Spaces**: Pinned spaces (max 3) + Recent spaces (max 5) with presence dots — your home base
- **HiveLab**: Your tools and quick create action — breathing gold glow (HIVE's differentiator)

**Profile access**: Via user card dropdown at bottom (removed from main nav for clarity)

**Motion Hierarchy:**
- HiveLab: Breathing glow animation (draws you in)
- Feed: Pulsing gold "Soon" badge (coming soon)
- Spaces: Standard premium motion (reliable home)
- First Visit: Staggered reveal animation

The panel content animates smoothly when switching sections.
        `,
      },
    },
  },
};

// With badges
export const WithBadges: Story = {
  name: 'With Badges',
  render: () => {
    const [activeSection, setActiveSection] = React.useState<NavSection>('feed');
    const [isExpanded, setIsExpanded] = React.useState(false);

    const mockSpaces = [
      { id: '1', name: 'CS Club', memberCount: 847, activeNow: 12, isPinned: true, unreadCount: 3 },
      { id: '2', name: 'Design Society', memberCount: 234, activeNow: 5, isPinned: true },
      { id: '3', name: 'Hackathon 2025', memberCount: 156, activeNow: 23, unreadCount: 7 },
    ];

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <RefinedRail
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
          notificationCount={12}
          spaces={mockSpaces}
          hoverExpand={true}
        />
        <motion.main
          initial={{ marginLeft: 72 }}
          animate={{ marginLeft: isExpanded ? 300 : 72 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="text-center max-w-md px-8">
            <h2 className="text-xl font-medium text-white/80 mb-4">Badge Behavior</h2>
            <p className="text-white/40 text-sm mb-4">
              When collapsed, badges appear as tiny gold dots.
              When expanded, they show the actual count.
            </p>
            <div className="text-[11px] text-white/30 mb-2">
              Spaces: 10 unread (3 + 7)
            </div>
            <div className="text-[11px] text-white/30">
              Notifications: 12
            </div>
          </div>
        </motion.main>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Badge Behavior**

Badges adapt to rail state:
- **Collapsed**: Small gold dot (w-2 h-2) — just indicates "something to see"
- **Expanded**: Full badge with count — shows actual number

This keeps the collapsed state minimal while still communicating urgency.
        `,
      },
    },
  },
};

// With User Profile
export const WithUserProfile: Story = {
  name: 'With User Profile',
  render: () => {
    const [activeSection, setActiveSection] = React.useState<NavSection>('feed');
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <RefinedRail
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
          notificationCount={5}
          hoverExpand={true}
          user={{
            name: 'Sarah Chen',
            handle: 'sarahc',
            avatarUrl: undefined,
          }}
          onNotificationClick={() => console.log('Notifications clicked')}
          onProfileClick={() => console.log('Profile clicked')}
        />
        <motion.main
          initial={{ marginLeft: 300 }}
          animate={{ marginLeft: isExpanded ? 300 : 72 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="text-center max-w-md px-8">
            <h2 className="text-xl font-medium text-white/80 mb-4">User Profile Card</h2>
            <p className="text-white/40 text-sm mb-4">
              The user profile card appears at the bottom of the rail.
              Shows avatar with online indicator, name, and handle when expanded.
            </p>
            <div className="text-[11px] text-white/30">
              Click the profile card to trigger onProfileClick callback.
            </div>
          </div>
        </motion.main>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**User Profile Card**

The user profile card provides quick access to the user's profile:

- **Avatar**: Shows first initial or custom image
- **Online Indicator**: Green dot showing online status
- **Name + Handle**: Full name and @handle when expanded
- **Collapsed View**: Just the avatar when rail is collapsed

The card is clickable and triggers the \`onProfileClick\` callback.
        `,
      },
    },
  },
};

// ============================================
// DROPDOWN STORIES
// ============================================

// Notification Dropdown Demo
export const NotificationDropdown: Story = {
  name: 'Notification Dropdown',
  render: () => {
    const [activeSection, setActiveSection] = React.useState<NavSection>('feed');
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = React.useState(true);

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <RefinedRail
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
          notificationCount={2}
          hoverExpand={false}
          user={{
            name: 'Sarah Chen',
            handle: 'sarahc',
            avatarUrl: undefined,
          }}
          onNotificationClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
          onProfileClick={() => console.log('Profile clicked')}
          notificationDropdownOpen={notificationDropdownOpen}
          notifications={MOCK_NOTIFICATIONS}
          onMarkAllRead={() => console.log('Mark all read clicked')}
        />
        <motion.main
          initial={{ marginLeft: 300 }}
          animate={{ marginLeft: isExpanded ? 300 : 72 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="text-center max-w-md px-8">
            <h2 className="text-xl font-medium text-white/80 mb-4">Notification Dropdown</h2>
            <p className="text-white/40 text-sm mb-4">
              The notification dropdown appears to the right of the rail when clicked.
              Uses the same OpenAI/Apple aesthetic with frosted glass surfaces.
            </p>
            <div className="text-[11px] text-white/30">
              Click the bell icon to toggle the dropdown.
            </div>
          </div>
        </motion.main>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Notification Dropdown**

The notification dropdown panel uses the same refined aesthetic as the rail:

- **Surface**: Frosted glass with \`rgba(10,10,10,0.95)\` and \`backdrop-blur(16px)\`
- **Border**: Barely-there \`border-white/[0.04]\`
- **Typography**: Explicit px values (11px labels, 13px content, 11px timestamps)
- **Gold**: Used ONLY for unread indicator dots (1.5px)
- **Motion**: Spring physics \`{ stiffness: 200, damping: 28 }\`

The dropdown appears to the right of the rail (\`left-full\`) for natural reading flow.
        `,
      },
    },
  },
};

// Profile Dropdown Demo
export const ProfileDropdown: Story = {
  name: 'Profile Dropdown',
  render: () => {
    const [activeSection, setActiveSection] = React.useState<NavSection>('feed');
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(true);

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <RefinedRail
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
          notificationCount={3}
          hoverExpand={false}
          user={{
            name: 'Sarah Chen',
            handle: 'sarahc',
            avatarUrl: undefined,
          }}
          onNotificationClick={() => console.log('Notifications clicked')}
          onProfileClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          profileDropdownOpen={profileDropdownOpen}
          onSignOut={() => console.log('Sign out clicked')}
          onSettingsClick={() => console.log('Settings clicked')}
        />
        <motion.main
          initial={{ marginLeft: 300 }}
          animate={{ marginLeft: isExpanded ? 300 : 72 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="text-center max-w-md px-8">
            <h2 className="text-xl font-medium text-white/80 mb-4">Profile Dropdown</h2>
            <p className="text-white/40 text-sm mb-4">
              The profile dropdown appears to the right of the user card.
              Avatar uses subtle \`bg-white/[0.08]\` with gold ring on hover.
            </p>
            <div className="text-[11px] text-white/30">
              Click the profile card to toggle the dropdown.
            </div>
          </div>
        </motion.main>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Profile Dropdown**

The profile dropdown panel follows the same refined patterns:

- **Avatar**: Subtle \`bg-white/[0.08]\` with \`ring-[#FFD700]/30\` on hover
- **Menu Items**: 13px text with barely-there hover (\`hover:bg-white/[0.03]\`)
- **Sign Out**: Red-tinted destructive variant (\`text-red-400/80\`)
- **Positioning**: Anchored to \`bottom-0\` with \`left-full\`

The dropdown animates with the same spring physics as the rail.
        `,
      },
    },
  },
};

// Both Dropdowns Interactive Demo
export const DropdownsInteractive: Story = {
  name: 'Dropdowns Interactive',
  render: () => {
    const [activeSection, setActiveSection] = React.useState<NavSection>('feed');
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = React.useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

    const handleNotificationClick = () => {
      setNotificationDropdownOpen(!notificationDropdownOpen);
      setProfileDropdownOpen(false);
    };

    const handleProfileClick = () => {
      setProfileDropdownOpen(!profileDropdownOpen);
      setNotificationDropdownOpen(false);
    };

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <RefinedRail
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
          notificationCount={2}
          hoverExpand={false}
          user={{
            name: 'Sarah Chen',
            handle: 'sarahc',
            avatarUrl: undefined,
          }}
          onNotificationClick={handleNotificationClick}
          onProfileClick={handleProfileClick}
          notificationDropdownOpen={notificationDropdownOpen}
          profileDropdownOpen={profileDropdownOpen}
          notifications={MOCK_NOTIFICATIONS}
          onSignOut={() => console.log('Sign out clicked')}
          onMarkAllRead={() => console.log('Mark all read clicked')}
          onSettingsClick={() => console.log('Settings clicked')}
        />
        <motion.main
          initial={{ marginLeft: 300 }}
          animate={{ marginLeft: isExpanded ? 300 : 72 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="text-center max-w-md px-8">
            <h2 className="text-xl font-medium text-white/80 mb-4">Interactive Dropdowns</h2>
            <p className="text-white/40 text-sm mb-4">
              Click the bell icon or profile card to toggle their respective dropdowns.
              Only one dropdown can be open at a time.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <div className={`px-3 py-1.5 rounded-full text-[11px] ${notificationDropdownOpen ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-white/[0.04] text-white/40'}`}>
                Notifications: {notificationDropdownOpen ? 'Open' : 'Closed'}
              </div>
              <div className={`px-3 py-1.5 rounded-full text-[11px] ${profileDropdownOpen ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-white/[0.04] text-white/40'}`}>
                Profile: {profileDropdownOpen ? 'Open' : 'Closed'}
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Dropdowns Demo**

This demo shows both dropdowns working together:

- Clicking one dropdown closes the other (mutual exclusivity)
- Click outside any dropdown to close it
- Dropdowns use spring physics for smooth open/close animations
- Both follow the exact same visual language as the rail

**Key Design Patterns:**
- \`backdrop-blur(16px)\` for frosted glass effect
- \`border-white/[0.04]\` for barely-there borders
- Spring: \`{ stiffness: 200, damping: 28 }\`
- Gold restricted to notification dots only
        `,
      },
    },
  },
};
