'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';
import { useCampusMode } from '@/hooks/use-campus-mode';
import { getNavItems, getMobileNavItems, isNavItemActive, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/queries/use-unread-count';

// ─────────────────────────────────────────────────────────────────────────────
// HIVE wordmark
// ─────────────────────────────────────────────────────────────────────────────

function HiveMark() {
  return (
    <Link
      href="/discover"
      className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
      aria-label="HIVE home"
    >
      <span className="h-5 w-5 rounded-full bg-[#FFD700]" aria-hidden />
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
        HIVE
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop top bar
// ─────────────────────────────────────────────────────────────────────────────

function TopBarNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex h-14 items-center px-2 text-sm font-medium transition-colors',
        isActive ? 'text-white' : 'text-white/50 hover:text-white'
      )}
    >
      <span>{item.label}</span>
      {isActive && (
        <span
          className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#FFD700]"
          aria-hidden
        />
      )}
    </Link>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <header className="fixed inset-x-0 top-0 z-40 hidden h-14 border-b border-white/[0.06] md:flex" style={{ background: 'rgba(8,8,15,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center gap-8 px-6">
        <HiveMark />

        <nav className="flex h-full items-center gap-4">
          {navItems.map((item) => (
            <TopBarNavItem
              key={item.id}
              item={item}
              isActive={isNavItemActive(item, pathname)}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <button
            type="button"
            onClick={() => router.push('/search')}
            className="flex h-9 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            <span className="hidden text-sm font-medium lg:inline">Search</span>
            <kbd className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-60">⌘K</kbd>
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => router.push('/notifications')}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFD700] px-1 text-[10px] font-semibold text-black leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <button
            type="button"
            onClick={() => router.push('/me')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/60 transition-colors hover:bg-white/[0.12]"
            aria-label="Profile"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile bottom bar — 4 equal tabs
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

  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
        isActive ? 'text-white' : 'text-white/40'
      )}
    >
      <div className="relative">
        <Icon className="h-[22px] w-[22px]" />

        {/* Active dot */}
        {isActive && (
          <span
            className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#FFD700]"
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
          'font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
          isActive ? 'text-white' : 'text-white/40'
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
        background: 'rgba(8,8,15,0.92)',
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

export default TopBar;
