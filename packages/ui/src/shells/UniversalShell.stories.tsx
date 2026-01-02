import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';

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
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FFD700] text-black text-xs font-bold flex items-center justify-center"
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
                      {n.unread && <div className="w-2 h-2 rounded-full bg-[#FFD700] mt-1 flex-shrink-0" />}
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
        className="w-8 h-8 rounded-full bg-[#FFD700] overflow-hidden ring-2 ring-transparent hover:ring-[#FFD700]/20 transition-all"
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
                    <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
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
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Mock Sidebar */}
      <aside className="w-[72px] bg-[#0A0A0A] border-r border-white/[0.06] flex flex-col items-center py-4 gap-4">
        <div className="w-8 h-8 rounded bg-[#FFD700] flex items-center justify-center text-black font-bold text-sm">H</div>
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
