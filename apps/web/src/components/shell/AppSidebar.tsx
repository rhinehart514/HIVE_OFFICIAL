'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Plus } from 'lucide-react';
import { getNavItems, getMobileNavItems, isNavItemActive, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { useAuth } from '@hive/auth-logic';

// ─────────────────────────────────────────────────────────────────────────────
// HIVE logo — uses asset file
// ─────────────────────────────────────────────────────────────────────────────

function HiveLogoGold({ size = 20 }: { size?: number }) {
  return (
    <img
      src="/assets/hive-logo-gold.svg"
      alt="HIVE"
      width={size}
      height={size}
      className="flex-shrink-0"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop Sidebar — Fixed 200px, bg-black, no expand/collapse
// ─────────────────────────────────────────────────────────────────────────────

function NavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 h-10 px-4 transition-colors duration-100',
        isActive ? 'text-white' : 'text-white/50 hover:text-white',
      )}
    >
      {/* Active indicator — 6px yellow dot */}
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-100',
          isActive ? 'bg-[#FFD700]' : 'bg-transparent',
        )}
      />
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
      <span className="text-[14px] font-medium">{item.label}</span>
    </Link>
  );
}

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = getNavItems();
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications({ userId: user?.uid });

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[200px] flex-col bg-black md:flex">
      {/* Logo */}
      <Link href="/discover" className="flex items-center gap-2.5 h-14 px-5" aria-label="Home">
        <HiveLogoGold size={20} />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          HIVE
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col mt-2" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={isNavItemActive(item, pathname)}
          />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-1 px-4 pb-4">
        {/* Search */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('hive:open-search'))}
          className="flex items-center gap-3 h-10 px-0 text-white/50 hover:text-white transition-colors duration-100"
          aria-label="Search (⌘K)"
        >
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] font-medium">Search</span>
          <kbd className="ml-auto font-mono text-[10px] text-white/30">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => router.push('/me/notifications')}
          className="flex items-center gap-3 h-10 px-0 text-white/50 hover:text-white transition-colors duration-100"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <div className="relative">
            <Bell className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-[7px] w-[7px] rounded-full bg-[#FFD700]" />
            )}
          </div>
          <span className="text-[14px] font-medium">Notifications</span>
        </button>

        {/* Create button — white pill (hidden on /build since it IS the creation surface) */}
        {!pathname.startsWith('/build') && (
          <Link
            href="/build"
            className="flex items-center justify-center gap-2 h-10 mt-2 rounded-full bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-colors duration-100"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Create
          </Link>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile bottom bar — 56px, 4 tabs
// ─────────────────────────────────────────────────────────────────────────────

function MobileNavItem({ item, isActive, badge }: { item: NavItem; isActive: boolean; badge?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-100',
        isActive ? 'text-white' : 'text-white/35',
      )}
    >
      <div className="relative">
        <Icon className="h-[22px] w-[22px]" />
        {isActive && (
          <span className="absolute -bottom-1.5 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[#FFD700]" aria-hidden />
        )}
        {!isActive && badge && badge > 0 ? (
          <span className="absolute -top-1 -right-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#FFD700] px-0.5 text-[9px] font-bold text-black leading-none">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
      <span className={cn('font-mono text-[10px] uppercase tracking-label', isActive && 'font-semibold')}>
        {item.label}
      </span>
    </Link>
  );
}

export function MobileBottomBar() {
  const pathname = usePathname();
  const navItems = getMobileNavItems();
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications({ userId: user?.uid });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-white/[0.05] bg-black md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => (
        <MobileNavItem
          key={item.id}
          item={item}
          isActive={isNavItemActive(item, pathname)}
          badge={item.id === 'you' ? unreadCount : undefined}
        />
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile header — logo + search + notifications
// ─────────────────────────────────────────────────────────────────────────────

export function MobileHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications({ userId: user?.uid });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 border-b border-white/[0.05] bg-black md:hidden">
      <Link href="/discover" className="flex items-center gap-2" aria-label="Home">
        <HiveLogoGold size={18} />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          HIVE
        </span>
      </Link>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('hive:open-search'))}
          className="flex items-center justify-center h-10 w-10 text-white/50 active:text-white transition-colors duration-100"
          aria-label="Search"
        >
          <Search className="h-[20px] w-[20px]" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => router.push('/me/notifications')}
          className="relative flex items-center justify-center h-10 w-10 text-white/50 active:text-white transition-colors duration-100"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-[20px] w-[20px]" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full bg-[#FFD700]" />
          )}
        </button>
      </div>
    </header>
  );
}

export default LeftSidebar;
