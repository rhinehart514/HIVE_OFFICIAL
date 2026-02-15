'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Sparkles, User } from 'lucide-react';
import { useCampusMode } from '@/hooks/use-campus-mode';
import { getNavItems, getMobileNavItems, isNavItemActive, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

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

function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);

  return (
    <header className="fixed inset-x-0 top-0 z-40 hidden h-14 border-b border-white/[0.06] bg-black md:flex">
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
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            <span className="hidden text-sm font-medium lg:inline">Search</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
              cmd+K
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/notifications')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => router.push('/me')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/60"
            aria-label="Account"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 py-2 transition-colors',
        isActive ? 'text-white' : 'text-white/50'
      )}
    >
      <div className="relative">
        <Icon className="h-5 w-5" />
        {isActive && (
          <span
            className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#FFD700]"
            aria-hidden
          />
        )}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
        {item.label}
      </span>
    </Link>
  );
}

function MobileCreateItem({ isActive }: { isActive: boolean }) {
  return (
    <Link
      href="/lab/new"
      className="flex flex-1 flex-col items-center gap-1 py-1.5 text-white"
      aria-label="Create"
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border bg-white/[0.04] transition-colors',
          isActive
            ? 'border-[#FFD700] ring-2 ring-[#FFD700]/35'
            : 'border-[#FFD700]/70 ring-1 ring-[#FFD700]/20'
        )}
      >
        <Sparkles className="h-5 w-5 text-[#FFD700]" />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/80">
        Create
      </span>
    </Link>
  );
}

function MobileBottomBar() {
  const pathname = usePathname();
  const { hasCampus } = useCampusMode();
  const navItems = getMobileNavItems(hasCampus);
  const leadingItems = navItems.slice(0, 2);
  const trailingItems = navItems.slice(2);
  const isCreateActive = /^\/lab(\/|$)/.test(pathname);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center border-t border-white/[0.06] md:hidden"
      style={{
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {leadingItems.map((item) => (
        <MobileNavItem
          key={item.id}
          item={item}
          isActive={isNavItemActive(item, pathname)}
        />
      ))}

      <MobileCreateItem isActive={isCreateActive} />

      {trailingItems.map((item) => (
        <MobileNavItem
          key={item.id}
          item={item}
          isActive={isNavItemActive(item, pathname)}
        />
      ))}
    </nav>
  );
}

export { TopBar, MobileBottomBar };
export default TopBar;
