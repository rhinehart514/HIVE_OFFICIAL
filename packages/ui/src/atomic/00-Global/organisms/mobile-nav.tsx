'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  GridIcon,
  PlusCircleIcon,
  TrophyIcon,
  UserIcon,
} from 'lucide-react'
import { cn } from '../../../lib/utils'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  highlight?: boolean
  activeColor: string
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
    activeColor: 'text-[#FFD700]', // HIVE gold (canonical)
  },
  {
    href: '/spaces',
    icon: GridIcon,
    label: 'Spaces',
    activeColor: 'text-[#FFD700]',
  },
  {
    href: '/create',
    icon: PlusCircleIcon,
    label: 'Create',
    highlight: true, // Always gold accent
    activeColor: 'text-[#FFD700]', // Same gold for consistency
  },
  {
    href: '/rituals',
    icon: TrophyIcon,
    label: 'Rituals',
    activeColor: 'text-[#FFD700]',
  },
  {
    href: '/profile',
    icon: UserIcon,
    label: 'You',
    activeColor: 'text-[#FFD700]',
  },
]

export interface MobileNavProps {
  /**
   * Custom nav items (max 5 enforced by cognitive budget)
   */
  navItems?: NavItem[]
}

export function MobileNav({ navItems = defaultNavItems }: MobileNavProps) {
  const pathname = usePathname()

  // Enforce cognitive budget: max 5 items
  const limitedItems = navItems.slice(0, 5)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-black/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 px-2">
        {limitedItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 gap-1.5 min-w-0"
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
                        ? 'text-[#FFD700]/70' // Gold tint for highlight
                        : 'text-white/50'
                  )}
                />

                {/* Active indicator - brand gold dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeMobileNav"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FFD700]"
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
                    : 'text-white/50'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Export nav items for customization
export { defaultNavItems }
export type { NavItem }
