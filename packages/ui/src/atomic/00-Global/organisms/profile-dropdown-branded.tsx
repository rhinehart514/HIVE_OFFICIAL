'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react'

interface User {
  displayName: string
  email: string
  photoURL?: string
  major?: string
  gradYear?: string
  campus?: string
}

interface MenuItemProps {
  href?: string
  onClick?: () => void
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function MenuItem({ href, onClick, icon: Icon, children }: MenuItemProps) {
  const className =
    'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white hover:bg-white/[0.04] transition-colors'

  if (href) {
    return (
      <Link href={href} className={className} role="menuitem">
        <Icon className="w-4 h-4" aria-hidden="true" />
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={className} role="menuitem">
      <Icon className="w-4 h-4" aria-hidden="true" />
      {children}
    </button>
  )
}

export interface ProfileDropdownProps {
  /**
   * Current user data
   */
  user: User
  /**
   * Sign out callback
   */
  onSignOut?: () => void
}

export function ProfileDropdown({
  user,
  onSignOut,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Avatar trigger - Gold for brand */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-[#FFD700] overflow-hidden ring-2 ring-transparent hover:ring-[#FFD700]/20 transition-all"
        aria-label={`Profile menu for ${user.displayName}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black font-semibold text-sm">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/[0.08] bg-black shadow-lg z-50"
              role="menu"
              aria-label="Profile options"
            >
              {/* User info - Campus context */}
              <div className="p-4 border-b border-white/[0.06]">
                <p className="font-semibold text-white">
                  {user.displayName}
                </p>
                {user.major && user.gradYear && (
                  <p className="text-sm text-white/70 mt-0.5">
                    {user.major} &apos;{user.gradYear.slice(-2)}
                  </p>
                )}
                {user.campus && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
                    <span className="text-xs text-white/60">
                      {user.campus}
                    </span>
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div className="p-2">
                <MenuItem href="/profile" icon={UserIcon}>
                  Profile
                </MenuItem>
                <MenuItem href="/settings" icon={SettingsIcon}>
                  Settings
                </MenuItem>
                <MenuItem onClick={onSignOut} icon={LogOutIcon}>
                  Log out
                </MenuItem>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
