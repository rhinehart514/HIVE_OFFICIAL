'use client';

/**
 * BottomNav — Mobile Navigation Bar
 *
 * Fixed bottom navigation for mobile devices.
 * Campus-aware structure:
 * - Campus: Discover | Spaces | You (+ floating Create FAB)
 * - Non-campus: Spaces | Create | You
 */

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { EASE_PREMIUM } from '@hive/ui';
import { cn } from '@/lib/utils';
import { getNavItems, isNavItemActive } from '@/lib/navigation';
import { useCampusMode } from '@/hooks/use-campus-mode';

interface BottomNavProps {
  onOpenCreate?: () => void;
}

export function BottomNav({ onOpenCreate }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);

  const handleNavClick = (href: string) => {
    // Trigger haptic feedback if available
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    router.push(href);
  };

  return (
    <>
      {hasCampus && onOpenCreate && (
        <button
          onClick={onOpenCreate}
          className={cn(
            'fixed bottom-20 right-4 z-[60] lg:hidden',
            'h-14 w-14 rounded-full',
            'bg-[var(--color-gold)] text-black shadow-lg shadow-black/30',
            'flex items-center justify-center'
          )}
          aria-label="Create"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
          'bg-black/80 backdrop-blur-xl',
          'border-t border-white/[0.06]',
          'pb-safe' // iOS safe area
        )}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item, pathname);

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
    </>
  );
}
