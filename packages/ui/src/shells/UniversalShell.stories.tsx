import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

// Aliases for consistency
const SettingsIcon = Cog6ToothIcon
const LogOutIcon = ArrowRightOnRectangleIcon

const meta: Meta = {
  title: 'Shells/UniversalShell',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0A0A0A' }],
    },
  },
};

export default meta;
type Story = StoryObj;

// Mock data
const mockNotifications = [
  { id: '1', text: 'New ritual starting in 10 minutes', time: '2m ago', unread: true },
  { id: '2', text: 'Alex commented on your post', time: '1h ago', unread: true },
  { id: '3', text: 'CS Club posted a new event', time: '3h ago', unread: false },
  { id: '4', text: 'You were mentioned in Design Society', time: '5h ago', unread: false },
];

// Pure React NotificationDropdown (no Next.js deps)
function StoryNotificationDropdown({
  notifications = mockNotifications,
  unreadCount = 2,
}: {
  notifications?: Array<{ id: string; text: string; time: string; unread?: boolean }>;
  unreadCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <BellIcon className="w-5 h-5 text-white/70" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-life-gold text-black text-xs font-bold flex items-center justify-center"
          >
            {unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-white/[0.08] bg-black shadow-lg z-50"
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Notifications</h3>
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex gap-3 p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                      {n.unread && <div className="w-2 h-2 rounded-full bg-life-gold mt-1 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{n.text}</p>
                        <p className="text-xs text-white/60 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pure React ProfileDropdown (no Next.js deps)
function StoryProfileDropdown({
  user,
  onSignOut,
}: {
  user: { displayName: string; email: string; photoURL?: string; major?: string; gradYear?: string; campus?: string };
  onSignOut?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-life-gold overflow-hidden ring-2 ring-transparent hover:ring-life-gold/20 transition-all"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black font-semibold text-sm">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/[0.08] bg-black shadow-lg z-50"
            >
              <div className="p-4 border-b border-white/[0.06]">
                <p className="font-semibold text-white">{user.displayName}</p>
                {user.major && user.gradYear && (
                  <p className="text-sm text-white/70 mt-0.5">{user.major} '{user.gradYear.slice(-2)}</p>
                )}
                {user.campus && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-2 h-2 rounded-full bg-life-gold" />
                    <span className="text-xs text-white/60">{user.campus}</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white hover:bg-white/[0.04]">
                  <UserIcon className="w-4 h-4" /> Profile
                </button>
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white hover:bg-white/[0.04]">
                  <SettingsIcon className="w-4 h-4" /> Settings
                </button>
                <button onClick={onSignOut} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white hover:bg-white/[0.04]">
                  <LogOutIcon className="w-4 h-4" /> Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mock Shell Layout (without Next.js dependencies)
function MockShellLayout({
  children,
  userName,
  userEmail,
  userAvatarUrl,
  userMajor,
  userGradYear,
  userCampus,
  notifications,
  notificationCount,
  onSignOut,
}: {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  userMajor?: string;
  userGradYear?: string;
  userCampus?: string;
  notifications?: Array<{ id: string; text: string; time: string; unread?: boolean }>;
  notificationCount?: number;
  onSignOut?: () => void;
}) {
  return (
    <div className="min-h-screen bg-ground flex">
      {/* Mock Sidebar */}
      <aside className="w-[72px] bg-ground border-r border-white/[0.06] flex flex-col items-center py-4 gap-4">
        <div className="w-8 h-8 rounded bg-life-gold flex items-center justify-center text-black font-bold text-sm">H</div>
        <div className="flex-1" />
        <div className="w-8 h-8 rounded-full bg-white/10" />
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col">
        {/* Header with Dropdowns */}
        <header className="flex items-center justify-end gap-3 px-6 py-3 border-b border-white/[0.04]">
          <StoryNotificationDropdown
            notifications={notifications}
            unreadCount={notificationCount}
          />
          {userName && (
            <StoryProfileDropdown
              user={{
                displayName: userName,
                email: userEmail || '',
                photoURL: userAvatarUrl,
                major: userMajor,
                gradYear: userGradYear,
                campus: userCampus,
              }}
              onSignOut={onSignOut}
            />
          )}
        </header>

        {/* Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Header with dropdowns - Default state with notifications
 */
export const Default: Story = {
  name: 'Header Dropdowns - Default',
  render: () => (
    <MockShellLayout
      userName="Sarah Chen"
      userEmail="sarah.chen@buffalo.edu"
      userMajor="Computer Science"
      userGradYear="2026"
      userCampus="University at Buffalo"
      notificationCount={4}
      notifications={mockNotifications}
      onSignOut={() => console.log('Sign out clicked')}
    >
      <div>
        <h1 className="text-2xl font-semibold text-white mb-4">Header Dropdowns Demo</h1>
        <p className="text-white/60 mb-6">
          Click the bell icon or profile avatar in the top-right to see the dropdowns.
        </p>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <h2 className="text-sm font-medium text-white/80 mb-2">Features:</h2>
          <ul className="text-sm text-white/50 space-y-1">
            <li>• NotificationDropdown with gold badge (4 unread)</li>
            <li>• ProfileDropdown with user info and campus context</li>
            <li>• Both dropdowns manage their own open/close state</li>
          </ul>
        </div>
      </div>
    </MockShellLayout>
  ),
};

/**
 * Header with no notifications
 */
export const NoNotifications: Story = {
  name: 'Header Dropdowns - No Notifications',
  render: () => (
    <MockShellLayout
      userName="Alex Johnson"
      userEmail="alex.j@buffalo.edu"
      userMajor="Design"
      userGradYear="2025"
      userCampus="University at Buffalo"
      notificationCount={0}
      notifications={[]}
      onSignOut={() => console.log('Sign out clicked')}
    >
      <div>
        <h1 className="text-2xl font-semibold text-white mb-4">No Notifications</h1>
        <p className="text-white/60">
          The notification badge won't show when count is 0.
        </p>
      </div>
    </MockShellLayout>
  ),
};

/**
 * Header with many notifications
 */
export const ManyNotifications: Story = {
  name: 'Header Dropdowns - Many Notifications',
  render: () => (
    <MockShellLayout
      userName="Jordan Lee"
      userEmail="jordan.lee@buffalo.edu"
      userMajor="Business"
      userGradYear="2027"
      userCampus="University at Buffalo"
      notificationCount={12}
      notifications={[
        ...mockNotifications,
        { id: '5', text: 'Your tool "Event RSVP" got 10 new installs', time: '6h ago', unread: true },
        { id: '6', text: 'Weekly digest: 5 new posts in your spaces', time: '1d ago', unread: false },
      ]}
      onSignOut={() => console.log('Sign out clicked')}
    >
      <div>
        <h1 className="text-2xl font-semibold text-white mb-4">Many Notifications</h1>
        <p className="text-white/60">
          The badge shows the count (12 in this case).
        </p>
      </div>
    </MockShellLayout>
  ),
};

/**
 * Header without user (logged out state)
 */
export const LoggedOut: Story = {
  name: 'Header Dropdowns - Logged Out',
  render: () => (
    <MockShellLayout
      notificationCount={0}
      notifications={[]}
    >
      <div>
        <h1 className="text-2xl font-semibold text-white mb-4">Logged Out State</h1>
        <p className="text-white/60">
          Only the notification dropdown appears (no profile dropdown without user).
        </p>
      </div>
    </MockShellLayout>
  ),
};

// ============================================
// SHELL MODES — New Architecture
// ============================================

// Mock data for shell modes
const mockSpaces = [
  { id: 'cs-club', name: 'CS Club', avatarUrl: undefined, unreadCount: 3 },
  { id: 'design-society', name: 'Design Society', avatarUrl: undefined, unreadCount: 0 },
  { id: 'startup-hub', name: 'Startup Hub', avatarUrl: undefined, unreadCount: 12 },
  { id: 'gaming-guild', name: 'Gaming Guild', avatarUrl: undefined, unreadCount: 0 },
];

const mockOnlineMembers = [
  { id: '1', name: 'Sarah Chen', status: 'active' as const },
  { id: '2', name: 'Alex Johnson', status: 'active' as const },
  { id: '3', name: 'Jordan Lee', status: 'idle' as const },
  { id: '4', name: 'Morgan Kim', status: 'active' as const },
  { id: '5', name: 'Taylor Swift', status: 'dnd' as const },
];

const mockRecentMessages = [
  { id: '1', authorName: 'Sarah Chen', content: 'Just pushed the new feature!', timestamp: new Date() },
  { id: '2', authorName: 'Alex Johnson', content: 'Anyone up for a study session?', timestamp: new Date(Date.now() - 300000) },
];

const mockDeployedTools = [
  { id: '1', name: 'Event RSVP', icon: '📅', activeUsers: 5 },
  { id: '2', name: 'Quick Poll', icon: '📊', activeUsers: 2 },
  { id: '3', name: 'Study Timer', icon: '⏱️', activeUsers: 8 },
];

const mockUser = {
  name: 'Sarah Chen',
  handle: 'sarahchen',
  avatarUrl: undefined,
};

// Minimal Rail Sidebar (48px)
function MockRailSidebar({ activeSpaceId }: { activeSpaceId?: string }) {
  return (
    <aside className="w-12 bg-neutral-950 border-r border-neutral-800/50 flex flex-col items-center py-4 gap-3">
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-life-gold flex items-center justify-center text-black font-bold text-sm">
        ⬡
      </div>

      {/* Divider */}
      <div className="w-6 border-t border-neutral-800/50 my-1" />

      {/* Nav Icons */}
      <button className="w-8 h-8 rounded-lg hover:bg-neutral-800/50 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      </button>
      <button className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-white">
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </button>
      <button className="w-8 h-8 rounded-lg hover:bg-neutral-800/50 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
      </button>

      {/* Divider */}
      <div className="w-6 border-t border-neutral-800/50 my-1" />

      {/* Space Icons */}
      {mockSpaces.slice(0, 3).map((space) => (
        <button
          key={space.id}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-label-xs font-medium transition-colors ${
            space.id === activeSpaceId
              ? 'bg-neutral-700 text-white'
              : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          {space.name.charAt(0)}
          {space.unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-life-gold" />
          )}
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Profile */}
      <button className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-label-xs font-medium text-white">
        S
      </button>
    </aside>
  );
}

// Living Sidebar (240px)
function MockLivingSidebar({ activeSpace }: { activeSpace: typeof mockSpaces[0] }) {
  return (
    <aside className="w-60 bg-neutral-950 border-r border-neutral-800/50 flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-neutral-800/50">
        <div className="flex items-center gap-2">
          <span className="text-life-gold text-lg">⬡</span>
          <span className="font-semibold text-white text-sm tracking-wide">HIVE</span>
        </div>
        <button className="p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-2 py-3 space-y-0.5">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800/50 hover:text-white transition-colors">
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span>Feed</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white">
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>Spaces</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800/50 hover:text-white transition-colors">
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          <span>Build</span>
        </button>
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-neutral-800/50" />

      {/* Space Activity Section */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Active Space Header */}
        <div className="px-3 py-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">#</span>
            <span className="text-sm font-medium text-white truncate">{activeSpace.name}</span>
          </div>
        </div>

        {/* Online Members */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-label-sm font-medium text-neutral-400 uppercase tracking-wider">
              {mockOnlineMembers.length} Online
            </span>
          </div>
          <div className="flex -space-x-2">
            {mockOnlineMembers.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="w-7 h-7 rounded-full border-2 border-neutral-900 bg-neutral-800 text-label-xs font-medium text-neutral-300 flex items-center justify-center"
                title={member.name}
              >
                {member.name.charAt(0)}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Preview */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="text-label-sm font-medium text-neutral-400 uppercase tracking-wider">
              Recent Chat
            </span>
          </div>
          {/* Typing Indicator */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-life-gold animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span className="text-label-sm text-neutral-500 italic">Alex is typing...</span>
          </div>
          {/* Latest message */}
          <div className="bg-neutral-900/50 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-neutral-700 text-[8px] font-medium flex items-center justify-center">S</div>
              <span className="text-label-sm font-medium text-neutral-300">Sarah Chen</span>
            </div>
            <p className="text-label-sm text-neutral-500 line-clamp-2">Just pushed the new feature!</p>
          </div>
        </div>

        {/* Deployed Tools */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            <span className="text-label-sm font-medium text-neutral-400 uppercase tracking-wider">
              Space Tools
            </span>
          </div>
          <div className="space-y-1">
            {mockDeployedTools.map((tool) => (
              <button
                key={tool.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-label text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 transition-colors"
              >
                <span className="text-base">{tool.icon}</span>
                <span className="truncate flex-1">{tool.name}</span>
                {tool.activeUsers > 0 && (
                  <span className="text-label-xs text-life-gold">{tool.activeUsers}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="mt-auto border-t border-neutral-800/50 p-3">
        <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-800/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-label-xs font-medium text-white">S</div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-white truncate">Sarah Chen</p>
            <p className="text-label-sm text-neutral-500 truncate">@sarahchen</p>
          </div>
        </button>
      </div>
    </aside>
  );
}

// Mobile Bottom Nav
function MockMobileNav({ activePath }: { activePath: string }) {
  const items = [
    { id: 'spaces', label: 'Spaces', path: '/spaces', icon: '👥' },
    { id: 'lab', label: 'Lab', path: '/tools', icon: '🧪' },
    { id: 'profile', label: 'Profile', path: '/profile', icon: '👤' },
    { id: 'search', label: 'Search', path: '/search', icon: '🔍' },
  ];

  return (
    <nav className="bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/50 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex justify-around items-center h-14 px-2">
        {items.map((item) => (
          <button
            key={item.id}
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-2 min-w-0 transition-colors ${
              item.path === activePath ? 'text-white' : 'text-neutral-500'
            }`}
          >
            <div className="relative">
              <span className="text-title-sm">{item.icon}</span>
              {item.path === activePath && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-life-gold" />
              )}
            </div>
            <span className="text-label-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/**
 * Shell Mode A: Rail (48px) — Default desktop mode
 */
export const ModeRail: Story = {
  name: 'Mode A: Rail (48px)',
  render: () => (
    <div className="min-h-screen bg-black flex">
      <MockRailSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-white mb-4">Rail Mode (48px)</h1>
        <p className="text-white/60 mb-4">
          The default desktop mode with icons-only sidebar. Maximum content space.
        </p>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <h2 className="text-sm font-medium text-white/80 mb-2">Features:</h2>
          <ul className="text-sm text-white/50 space-y-1">
            <li>• 48px width, icons only</li>
            <li>• Space avatars with unread badges</li>
            <li>• Hover states for navigation</li>
            <li>• Profile button at bottom</li>
          </ul>
        </div>
      </main>
    </div>
  ),
};

/**
 * Shell Mode B: Living (240px) — Active space mode
 */
export const ModeLiving: Story = {
  name: 'Mode B: Living (240px)',
  render: () => (
    <div className="min-h-screen bg-black flex">
      <MockLivingSidebar activeSpace={mockSpaces[0]} />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-white mb-4">Living Mode (240px)</h1>
        <p className="text-white/60 mb-4">
          Expanded sidebar with space heartbeat. Shows activity when inside a space.
        </p>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <h2 className="text-sm font-medium text-white/80 mb-2">Space Heartbeat:</h2>
          <ul className="text-sm text-white/50 space-y-1">
            <li>• Online members ({mockOnlineMembers.length} online)</li>
            <li>• Recent chat preview with typing indicator</li>
            <li>• Deployed tools with active user counts</li>
            <li>• Collapse button to return to Rail mode</li>
          </ul>
        </div>
      </main>
    </div>
  ),
};

/**
 * Shell Mode C: Command (0px) — Power user mode
 */
export const ModeCommand: Story = {
  name: 'Mode C: Command (0px)',
  render: () => (
    <div className="min-h-screen bg-black flex flex-col">
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">Command Mode (0px)</h1>
          <p className="text-white/60 mb-6">
            Shell hidden, ⌘K summons everything. Power user mode.
          </p>
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-center gap-2 mb-4">
              <kbd className="px-2 py-1 rounded bg-white/10 text-white text-sm font-mono">⌘</kbd>
              <span className="text-white/50">+</span>
              <kbd className="px-2 py-1 rounded bg-white/10 text-white text-sm font-mono">K</kbd>
            </div>
            <p className="text-sm text-white/50">Press to open Command Palette</p>
          </div>
        </div>
      </main>
    </div>
  ),
};

/**
 * Shell Mode D: Hidden (0px) — Full workspace
 */
export const ModeHidden: Story = {
  name: 'Mode D: Hidden (0px)',
  render: () => (
    <div className="min-h-screen bg-black">
      <main className="p-8">
        <h1 className="text-2xl font-semibold text-white mb-4">Hidden Mode (0px)</h1>
        <p className="text-white/60 mb-4">
          Full workspace takeover. Used for HiveLab, Auth, and Onboarding flows.
        </p>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <h2 className="text-sm font-medium text-white/80 mb-2">Use Cases:</h2>
          <ul className="text-sm text-white/50 space-y-1">
            <li>• HiveLab (full canvas mode)</li>
            <li>• Authentication pages</li>
            <li>• Onboarding flow</li>
            <li>• Landing pages</li>
          </ul>
        </div>
      </main>
    </div>
  ),
};

/**
 * Mobile Navigation — Bottom nav for mobile devices
 */
export const MobileNavigation: Story = {
  name: 'Mobile Navigation',
  render: () => (
    <div className="min-h-screen bg-black flex flex-col">
      <main className="flex-1 p-8 pb-20">
        <h1 className="text-2xl font-semibold text-white mb-4">Mobile Navigation</h1>
        <p className="text-white/60 mb-4">
          Fixed bottom navigation for mobile devices (56px height).
        </p>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <h2 className="text-sm font-medium text-white/80 mb-2">Features:</h2>
          <ul className="text-sm text-white/50 space-y-1">
            <li>• 4 nav items with icons</li>
            <li>• Active state with gold indicator</li>
            <li>• Search button opens Command Palette</li>
            <li>• Safe area padding for notched devices</li>
          </ul>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0">
        <MockMobileNav activePath="/spaces" />
      </div>
    </div>
  ),
};

/**
 * Shell Transition — Sidebar expand animation
 */
export const SidebarTransition: Story = {
  name: 'Sidebar Transition',
  render: () => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
      <div className="min-h-screen bg-black flex">
        <motion.aside
          className="bg-neutral-950 border-r border-neutral-800/50 flex flex-col overflow-hidden"
          initial={false}
          animate={{ width: isExpanded ? 240 : 48 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center justify-center h-14 border-b border-neutral-800/50">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 rounded-lg bg-life-gold flex items-center justify-center text-black font-bold text-sm"
            >
              ⬡
            </button>
          </div>
          <div className="flex-1 p-2">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white bg-neutral-800">
                  <span>🏠</span>
                  <span>Feed</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50">
                  <span>👥</span>
                  <span>Spaces</span>
                </button>
              </motion.div>
            )}
          </div>
        </motion.aside>
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-semibold text-white mb-4">Sidebar Transition</h1>
          <p className="text-white/60 mb-6">
            Click the hexagon logo to toggle between Rail and Living modes.
          </p>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-sm text-white/50">
              Spring animation: stiffness 400, damping 30
            </p>
          </div>
        </main>
      </div>
    );
  },
};
