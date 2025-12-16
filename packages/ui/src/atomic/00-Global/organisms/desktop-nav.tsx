'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import { HiveLogo } from '../atoms/hive-logo'
import { cn } from '../../../lib/utils'

interface NavLinkProps {
  href: string
  active: boolean
  children: React.ReactNode
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'relative py-1 text-sm font-medium transition-colors',
        active
          ? 'text-white'
          : 'text-white/70 hover:text-white'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}

      {/* Active indicator - HIVE gold */}
      {active && (
        <motion.div
          layoutId="activeDesktopNav"
          className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[#FFD700]"
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 100,
          }}
        />
      )}
    </Link>
  )
}

export interface DesktopNavProps {
  /**
   * Custom notification dropdown component
   */
  notificationDropdown?: React.ReactNode
  /**
   * Custom profile dropdown component
   */
  profileDropdown?: React.ReactNode
  /**
   * Show campus indicator
   */
  showCampusIndicator?: boolean
  /**
   * Campus name to display
   */
  campusName?: string
}

export function DesktopNav({
  notificationDropdown,
  profileDropdown,
  showCampusIndicator = true,
  campusName = 'UB Buffalo',
}: DesktopNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className="hidden md:flex sticky top-0 z-50 border-b border-white/[0.08] bg-black/95 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 h-16">
        {/* Logo - Left */}
        <Link
          href="/feed"
          className="hover:opacity-80 transition-opacity"
          aria-label="HIVE - Go to feed"
        >
          <HiveLogo size="default" variant="default" />
        </Link>

        {/* Center - Primary Nav (3 items) */}
        <div className="flex items-center gap-8">
          <NavLink href="/feed" active={pathname === '/feed'}>
            Feed
          </NavLink>
          <NavLink href="/spaces" active={pathname.startsWith('/spaces')}>
            Spaces
          </NavLink>
          <NavLink href="/rituals" active={pathname.startsWith('/rituals')}>
            Rituals
          </NavLink>
        </div>

        {/* Right - Actions & Campus Context */}
        <div className="flex items-center gap-4">
          {/* Campus indicator - HIVE gold */}
          {showCampusIndicator && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20">
              <motion.div
                className="w-2 h-2 rounded-full bg-[#FFD700]"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span className="text-xs font-medium text-white/70">
                {campusName}
              </span>
            </div>
          )}

          {/* Command Palette Trigger */}
          <button
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true })
              )
            }
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/60 text-sm hover:border-white/[0.16] transition-colors"
            aria-label="Search (Command + K)"
            aria-keyshortcuts="Meta+K"
          >
            <SearchIcon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-xs bg-white/[0.06] rounded" aria-hidden="true">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          {notificationDropdown}

          {/* Profile */}
          {profileDropdown}
        </div>
      </div>
    </nav>
  )
}
