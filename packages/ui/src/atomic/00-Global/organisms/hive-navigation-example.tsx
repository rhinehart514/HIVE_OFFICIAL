'use client'

import { DesktopNav } from './desktop-nav'
import { MobileNav } from './mobile-nav'
import { NotificationDropdown } from './notification-dropdown-branded'
import { ProfileDropdown } from './profile-dropdown-branded'

/**
 * Complete HIVE navigation example showing how to use
 * desktop nav, mobile nav, notifications, and profile together
 */
export function HiveNavigationExample() {
  // Example user data
  const user = {
    displayName: 'Alex Chen',
    email: 'alexchen@buffalo.edu',
    photoURL: '/avatars/alex.jpg',
    major: 'Computer Science',
    gradYear: '2026',
    campus: 'University at Buffalo',
  }

  const handleSignOut = () => {
    // TODO: Implement sign out logic
  }

  return (
    <>
      {/* Desktop Navigation */}
      <DesktopNav
        notificationDropdown={<NotificationDropdown />}
        profileDropdown={
          <ProfileDropdown user={user} onSignOut={handleSignOut} />
        }
        showCampusIndicator
        campusName="UB Buffalo"
      />

      {/* Main content area */}
      <main className="min-h-screen pb-16 md:pb-0 md:pt-16">
        {/* Your page content goes here */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-[var(--hive-text-primary)]">
            Welcome to HIVE
          </h1>
          <p className="text-[var(--hive-text-secondary)] mt-2">
            Clean, focused navigation with campus branding
          </p>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </>
  )
}

/**
 * Layout wrapper for use in app/(main)/layout.tsx
 */
export function HiveNavigationLayout({
  children,
  user,
  onSignOut,
}: {
  children: React.ReactNode
  user: {
    displayName: string
    email: string
    photoURL?: string
    major?: string
    gradYear?: string
    campus?: string
  }
  onSignOut: () => void
}) {
  return (
    <>
      <DesktopNav
        notificationDropdown={<NotificationDropdown />}
        profileDropdown={<ProfileDropdown user={user} onSignOut={onSignOut} />}
      />

      <main className="min-h-screen pb-16 md:pb-0 md:pt-16">{children}</main>

      <MobileNav />
    </>
  )
}
