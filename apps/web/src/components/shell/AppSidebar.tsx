'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useCampusMode } from '@/hooks/use-campus-mode';
import { getNavItems, getMobileNavItems, isNavItemActive, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/queries/use-unread-count';
import { SPRING_SNAP_NAV, MOTION, durationSeconds } from '@hive/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Gold HIVE logo — inlined SVG, no flash, no request
// ─────────────────────────────────────────────────────────────────────────────

const HIVE_PATH =
  'M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z';

function HiveLogoGold({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1500 1500"
      fill="#FFD700"
      aria-label="HIVE"
    >
      <path d={HIVE_PATH} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav item with micro-interactions: glow bloom, press compression, active indicator
// ─────────────────────────────────────────────────────────────────────────────

function NavRailItem({
  item,
  isActive,
  isLab,
}: {
  item: NavItem;
  isActive: boolean;
  isLab: boolean;
}) {
  const Icon = item.icon;
  const prefersReduced = useReducedMotion();

  const glowGradient = isLab
    ? 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)';

  // Resting / hover / active color classes
  const iconColor = isLab
    ? isActive ? 'text-[#FFD700]' : 'text-[#FFD700]/45 group-hover:text-[#FFD700]/75'
    : isActive ? 'text-white' : 'text-white/30 group-hover:text-white/55';

  const indicatorColor = isLab ? '#FFD700' : '#FFFFFF';

  return (
    <Link href={item.href} className="group relative w-full flex items-center justify-center h-10">
      {/* Active indicator — layoutId sliding border */}
      {isActive && (
        <motion.span
          layoutId="nav-active-indicator"
          className="absolute left-0 top-1/2 w-[2px] h-5 -translate-y-1/2 rounded-r-full"
          style={{ backgroundColor: indicatorColor }}
          transition={prefersReduced ? { duration: 0 } : SPRING_SNAP_NAV}
        />
      )}

      {/* Hover glow bloom */}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{ background: glowGradient }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: durationSeconds.quick, ease: MOTION.ease.premium }}
        aria-hidden
      />

      {/* Icon with press compression */}
      <motion.span
        className={cn('relative z-10 flex items-center justify-center', iconColor)}
        whileTap={prefersReduced ? undefined : { y: 1 }}
        transition={SPRING_SNAP_NAV}
      >
        <Icon
          className={cn(
            'shrink-0 transition-colors',
            isLab ? 'h-[20px] w-[20px]' : 'h-[18px] w-[18px]',
          )}
          strokeWidth={1.5}
          style={{ transitionDuration: `${MOTION.duration.quick}ms` }}
        />
      </motion.span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification bell with unread animation
// ─────────────────────────────────────────────────────────────────────────────

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const prevCountRef = useRef(unreadCount);
  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => {
    if (unreadCount > prevCountRef.current && unreadCount > 0) {
      setShouldShake(true);
      const t = setTimeout(() => setShouldShake(false), 600);
      return () => clearTimeout(t);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <button
      type="button"
      onClick={() => router.push('/notifications')}
      className="group relative w-full flex items-center justify-center h-10"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      {/* Hover glow */}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: durationSeconds.quick, ease: MOTION.ease.premium }}
        aria-hidden
      />

      <motion.span
        className="relative z-10 flex items-center justify-center text-white/30 group-hover:text-white/55 transition-colors"
        style={{ transitionDuration: `${MOTION.duration.quick}ms` }}
        whileTap={prefersReduced ? undefined : { y: 1 }}
        animate={
          shouldShake && !prefersReduced
            ? { rotate: [0, 12, -8, 0] }
            : { rotate: 0 }
        }
        transition={shouldShake ? { duration: 0.5, ease: MOTION.ease.premium } : SPRING_SNAP_NAV}
      >
        <div className="relative">
          <Bell className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />

          {/* Unread dot */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="unread-dot"
                className="absolute -top-0.5 -right-0.5 h-[7px] w-[7px] rounded-full bg-[#FFD700]"
                initial={prefersReduced ? { opacity: 1 } : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 12 }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Left Sidebar — 56px icon rail, desktop only
// ─────────────────────────────────────────────────────────────────────────────

export function LeftSidebar() {
  const pathname = usePathname();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[56px] flex-col border-r border-white/[0.06] md:flex"
      style={{
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* HIVE mark — perfectly still, centered */}
      <Link
        href="/discover"
        className="flex items-center justify-center h-12"
        aria-label="HIVE home"
      >
        <HiveLogoGold size={20} />
      </Link>

      {/* 8px gap then nav items */}
      <nav className="flex flex-col gap-0" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavRailItem
            key={item.id}
            item={item}
            isActive={isNavItemActive(item, pathname)}
            isLab={item.id === 'lab'}
          />
        ))}
      </nav>

      {/* Push utilities to bottom */}
      <div className="flex-1" />

      {/* Bottom utilities */}
      <div className="flex flex-col gap-0 pb-3">
        {/* Search */}
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          }}
          className="group relative w-full flex items-center justify-center h-10"
          aria-label="Search (⌘K)"
        >
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: durationSeconds.quick, ease: MOTION.ease.premium }}
            aria-hidden
          />
          <motion.span
            className="relative z-10 text-white/30 group-hover:text-white/55 transition-colors"
            style={{ transitionDuration: `${MOTION.duration.quick}ms` }}
            whileTap={{ y: 1 }}
            transition={SPRING_SNAP_NAV}
          >
            <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          </motion.span>
        </button>

        {/* Notifications */}
        <NotificationBell unreadCount={unreadCount} />
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile bottom bar — same hierarchy: Lab gets gold accent
// ─────────────────────────────────────────────────────────────────────────────

function MobileNavItem({
  item,
  isActive,
  badge,
}: {
  item: NavItem;
  isActive: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  const isLab = item.id === 'lab';

  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
        isLab
          ? isActive ? 'text-[#FFD700]' : 'text-[#FFD700]/40'
          : isActive ? 'text-white' : 'text-white/35'
      )}
    >
      <div className="relative">
        <Icon className={cn('h-[22px] w-[22px]', isLab && 'h-[24px] w-[24px]')} />

        {/* Active dot */}
        {isActive && (
          <span
            className={cn(
              'absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
              isLab ? 'bg-[#FFD700]' : 'bg-white'
            )}
            aria-hidden
          />
        )}

        {/* Unread badge */}
        {!isActive && badge && badge > 0 ? (
          <span className="absolute -top-1 -right-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#FFD700] px-0.5 text-[9px] font-bold text-black leading-none">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>

      <span
        className={cn(
          'font-sans text-[10px] uppercase tracking-[0.1em] transition-colors',
          isLab
            ? isActive ? 'text-[#FFD700]' : 'text-[#FFD700]/40'
            : isActive ? 'text-white' : 'text-white/35'
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function MobileBottomBar() {
  const pathname = usePathname();
  const { hasCampus } = useCampusMode();
  const navItems = getMobileNavItems(hasCampus);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-white/[0.06] md:hidden"
      style={{
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => (
        <MobileNavItem
          key={item.id}
          item={item}
          isActive={isNavItemActive(item, pathname)}
          badge={item.id === 'profile' ? unreadCount : undefined}
        />
      ))}
    </nav>
  );
}

export default LeftSidebar;
