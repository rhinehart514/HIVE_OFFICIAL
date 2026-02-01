'use client';

/**
 * BottomNav — Mobile Navigation Bar
 *
 * Fixed bottom navigation for mobile devices.
 * 4-pillar structure: Home | Explore | Lab | You
 *
 * Design:
 * - Fixed to bottom, above safe area
 * - Gold active indicator
 * - Haptic feedback on tap (when supported)
 * - Backdrop blur for layering
 *
 * @version 1.0.0 - IA Unification (Jan 2026)
 */

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { HomeIcon, BeakerIcon, UserIcon, EASE_PREMIUM } from '@hive/ui';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  matchPattern?: RegExp;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/home',
    icon: HomeIcon,
    matchPattern: /^\/home(\/|$)|^\/feed(\/|$)|^\/spaces(\/|$)/,
  },
  {
    id: 'explore',
    label: 'Explore',
    href: '/explore',
    icon: Compass,
    matchPattern: /^\/explore(\/|$)/,
  },
  {
    id: 'lab',
    label: 'Lab',
    href: '/lab',
    icon: BeakerIcon,
    matchPattern: /^\/lab(\/|$)/,
  },
  {
    id: 'you',
    label: 'You',
    href: '/me',
    icon: UserIcon,
    matchPattern: /^\/me(\/|$)|^\/profile(\/|$)|^\/u\//,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const handleNavClick = (href: string) => {
    // Trigger haptic feedback if available
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    router.push(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
        'bg-foundation-gray-1000/80 backdrop-blur-xl',
        'border-t border-white/[0.06]',
        'pb-safe' // iOS safe area
      )}
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                active ? 'text-white' : 'text-white/40'
              )}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gold-500"
                  layoutId="bottom-nav-indicator"
                  style={{
                    boxShadow: '0 0 8px 2px rgba(255,215,0,0.3)',
                  }}
                  transition={{ duration: 0.2, ease: EASE_PREMIUM }}
                />
              )}

              {/* Icon */}
              <motion.div
                animate={active ? { scale: 1 } : { scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  'text-label-sm mt-1 transition-colors',
                  active ? 'text-white' : 'text-white/40'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
