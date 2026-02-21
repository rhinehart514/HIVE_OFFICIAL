'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';
import { useCampusMode } from '@/hooks/use-campus-mode';
import { getNavItems, getMobileNavItems, isNavItemActive, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/queries/use-unread-count';

// ─────────────────────────────────────────────────────────────────────────────
// Left Sidebar — desktop only
// ─────────────────────────────────────────────────────────────────────────────

function SidebarNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
        isActive
          ? 'text-white'
          : 'text-white/40 hover:text-white/70'
      )}
    >
      {/* Gold left-border active indicator */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#FFD700]"
          aria-hidden
        />
      )}

      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'
        )}
        strokeWidth={1.5}
      />

      <span className="font-medium tracking-wide">{item.label}</span>
    </Link>
  );
}

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[220px] flex-col border-r border-white/[0.06] md:flex"
      style={{
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <Image
          src="/assets/hive-logo-gold.svg"
          alt="HIVE"
          width={22}
          height={22}
          priority
        />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
          HIVE
        </span>
      </div>

      {/* Nav items */}
      <nav className="mt-2 flex flex-col gap-0.5 px-1" aria-label="Main navigation">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={isNavItemActive(item, pathname)}
          />
        ))}
      </nav>

      {/* Push utilities to bottom */}
      <div className="flex-1" />

      {/* Bottom utilities */}
      <div className="flex flex-col gap-0.5 border-t border-white/[0.06] px-1 py-3">
        {/* Search */}
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          }}
          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-white/40 transition-colors hover:text-white/70"
          aria-label="Search (⌘K)"
        >
          <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-white/70" strokeWidth={1.5} />
          <span className="font-medium tracking-wide">Search</span>
          <kbd className="ml-auto font-mono text-[10px] tracking-[0.12em] text-white/20">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => router.push('/notifications')}
          className="group relative flex items-center gap-3 px-4 py-2.5 text-sm text-white/40 transition-colors hover:text-white/70"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <div className="relative">
            <Bell className="h-4 w-4 shrink-0 transition-colors group-hover:text-white/70" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#FFD700] px-0.5 text-[9px] font-bold text-black leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="font-medium tracking-wide">Notifications</span>
        </button>

        {/* Profile */}
        <button
          type="button"
          onClick={() => router.push('/me')}
          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-white/40 transition-colors hover:text-white/70"
          aria-label="Profile"
        >
          <User className="h-4 w-4 shrink-0 transition-colors group-hover:text-white/70" strokeWidth={1.5} />
          <span className="font-medium tracking-wide">Profile</span>
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile bottom bar — unchanged
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
