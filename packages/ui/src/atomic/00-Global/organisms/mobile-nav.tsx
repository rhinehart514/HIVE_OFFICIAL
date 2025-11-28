'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  GridIcon,
  PlusCircleIcon,
  TrophyIcon,
  UserIcon,
  ChevronUp,
  Users,
} from 'lucide-react'
import { cn } from '../../../lib/utils'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  highlight?: boolean
  activeColor: string
}

/** Quick-access space for My Spaces drawer */
export interface MySpaceItem {
  id: string
  name: string
  iconUrl?: string
  slug?: string
  unreadCount?: number
}

/**
 * Navigation Items - Ultra-Minimal YC/SF Aesthetic
 * Gold (#FFD700) for active states only - 1% rule
 */
const defaultNavItems: NavItem[] = [
  {
    href: '/feed',
    icon: HomeIcon,
    label: 'Feed',
    activeColor: 'text-gold-500', // HIVE gold (canonical)
  },
  {
    href: '/spaces',
    icon: GridIcon,
    label: 'Spaces',
    activeColor: 'text-gold-500',
  },
  {
    href: '/create',
    icon: PlusCircleIcon,
    label: 'Create',
    highlight: true, // Always gold accent
    activeColor: 'text-gold-500', // Same gold for consistency
  },
  {
    href: '/rituals',
    icon: TrophyIcon,
    label: 'Rituals',
    activeColor: 'text-gold-500',
  },
  {
    href: '/profile',
    icon: UserIcon,
    label: 'You',
    activeColor: 'text-gold-500',
  },
]

export interface MobileNavProps {
  /**
   * Custom nav items (max 5 enforced by cognitive budget)
   */
  navItems?: NavItem[]
  /**
   * User's joined spaces for quick access (shown when on /spaces routes)
   */
  mySpaces?: MySpaceItem[]
  /**
   * Callback when a space is clicked
   */
  onSpaceClick?: (spaceId: string) => void
}

export function MobileNav({
  navItems = defaultNavItems,
  mySpaces = [],
  onSpaceClick,
}: MobileNavProps) {
  const pathname = usePathname()
  const [mySpacesOpen, setMySpacesOpen] = useState(false)

  // Show My Spaces drawer when on spaces route
  const isOnSpacesRoute = pathname.startsWith('/spaces')
  const hasMySpaces = mySpaces.length > 0

  // Enforce cognitive budget: max 5 items
  const limitedItems = navItems.slice(0, 5)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      aria-label="Main navigation"
    >
      {/* My Spaces Quick Access Drawer */}
      <AnimatePresence>
        {isOnSpacesRoute && hasMySpaces && mySpacesOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-neutral-900/98 backdrop-blur-xl border-t border-white/[0.08] rounded-t-2xl"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">My Spaces</h3>
                <button
                  onClick={() => setMySpacesOpen(false)}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Close My Spaces drawer"
                >
                  <ChevronUp className="w-5 h-5 rotate-180" aria-hidden="true" />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {mySpaces.slice(0, 8).map((space) => (
                  <button
                    key={space.id}
                    onClick={() => onSpaceClick?.(space.id)}
                    className="flex flex-col items-center gap-1.5 min-w-[60px] group"
                    aria-label={`Go to ${space.name}${space.unreadCount ? `, ${space.unreadCount} unread` : ''}`}
                  >
                    <div className="relative">
                      {space.iconUrl ? (
                        <img
                          src={space.iconUrl}
                          alt={space.name}
                          className="w-10 h-10 rounded-xl object-cover border border-white/[0.08] group-hover:border-gold-500/40 transition-colors"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-white/[0.08] flex items-center justify-center group-hover:border-gold-500/40 transition-colors">
                          <Users className="w-5 h-5 text-white/60" />
                        </div>
                      )}
                      {space.unreadCount && space.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center">
                          {space.unreadCount > 9 ? '9+' : space.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/70 truncate max-w-[60px] text-center">
                      {space.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Spaces Toggle Button (when on spaces route) */}
      {isOnSpacesRoute && hasMySpaces && !mySpacesOpen && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setMySpacesOpen(true)}
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-neutral-800/90 backdrop-blur-sm rounded-full border border-white/[0.08] flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          aria-label="Open My Spaces drawer"
          aria-expanded={mySpacesOpen}
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          My Spaces
          <ChevronUp className="w-3 h-3" aria-hidden="true" />
        </motion.button>
      )}

      {/* Main Navigation */}
      <div className="border-t border-white/[0.08] bg-black/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-16 px-2">
          {limitedItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 gap-1.5 min-w-0"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors',
                    isActive
                      ? item.activeColor
                      : item.highlight
                        ? 'text-gold-500/70' // Gold tint for highlight
                        : 'text-white/60'
                  )}
                />

                {/* Active indicator - brand gold dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeMobileNav"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-500"
                    transition={{
                      type: 'spring',
                      damping: 20,
                      stiffness: 100,
                    }}
                  />
                )}
              </motion.div>

              <span
                className={cn(
                  'text-xs font-medium tracking-wide',
                  isActive
                    ? 'text-white'
                    : 'text-white/60'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
          })}
        </div>
      </div>
    </nav>
  )
}

// Export nav items for customization
export { defaultNavItems }
export type { NavItem }
