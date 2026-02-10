'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useCampusMode } from '@/hooks/use-campus-mode';
import { getNavItems, isNavItemActive, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export type ShellActiveView = 'home' | 'space' | 'profile';

/* ── HIVE Mark ─────────────────────────────────────────── */

function HiveMark() {
  return (
    <Link
      href="/discover"
      className="flex items-center gap-2 px-5 py-5"
      aria-label="HIVE home"
    >
      <span className="h-5 w-5 rounded-full bg-[#FFD700]" aria-hidden />
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
        HIVE
      </span>
    </Link>
  );
}

/* ── Desktop Nav Item ──────────────────────────────────── */

function DesktopNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-2.5 px-5 py-2 text-[14px] font-medium transition-colors',
        isActive ? 'text-white' : 'text-white/50 hover:text-white'
      )}
    >
      {isActive && (
        <span
          className="absolute left-2 h-1.5 w-1.5 rounded-full bg-[#FFD700]"
          aria-hidden
        />
      )}
      <span>{item.label}</span>
    </Link>
  );
}

/* ── Desktop Sidebar ───────────────────────────────────── */

function DesktopSidebar() {
  const pathname = usePathname();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[200px] flex-col bg-black md:flex">
      <HiveMark />

      <nav className="flex flex-col gap-0.5 px-0 py-2">
        {navItems.map((item) => (
          <DesktopNavItem
            key={item.id}
            item={item}
            isActive={isNavItemActive(item, pathname)}
          />
        ))}
      </nav>

      <div className="flex-1" />

      <div className="px-4 pb-5">
        <Link
          href="/lab/new"
          className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#FFD700] px-4 text-[13px] font-medium text-black transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Create
        </Link>
      </div>
    </aside>
  );
}

/* ── Mobile Bottom Bar ─────────────────────────────────── */

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

function MobileBottomBar() {
  const pathname = usePathname();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center border-t border-white/[0.06] md:hidden"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {navItems.map((item) => (
        <MobileNavItem
          key={item.id}
          item={item}
          isActive={isNavItemActive(item, pathname)}
        />
      ))}
    </nav>
  );
}

/* ── Exports ───────────────────────────────────────────── */

export { DesktopSidebar, MobileBottomBar };
export default DesktopSidebar;
