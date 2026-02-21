'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useCampusMode } from '@/hooks/use-campus-mode';
import { getNavItems, getMobileNavItems, isNavItemActive, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/queries/use-unread-count';

// ─────────────────────────────────────────────────────────────────────────────
// Gold HIVE logo — inlined SVG, no flash, no request
// ─────────────────────────────────────────────────────────────────────────────

const HIVE_PATH =
  'M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z';

function HiveLogoGold({ size = 22 }: { size?: number }) {
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
// Left Sidebar — desktop only
// Linear-inspired: hierarchy through opacity, Lab elevated with gold accent
// ─────────────────────────────────────────────────────────────────────────────

function StandardNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 px-4 py-2 text-[13px] transition-all duration-150 mx-1 rounded-lg',
        isActive
          ? 'text-white'
          : 'text-white/35 hover:text-white/60'
      )}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-all duration-150',
          isActive ? 'text-white' : 'text-white/35 group-hover:text-white/60'
        )}
        strokeWidth={1.5}
      />
      <span className="font-medium tracking-wide">{item.label}</span>
    </Link>
  );
}

function LabNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 px-4 py-2.5 text-[13px] transition-all duration-150 mx-1 rounded-lg',
        isActive
          ? 'text-[#FFD700]'
          : 'text-[#FFD700]/50 hover:text-[#FFD700]/80'
      )}
    >
      {/* Gold left accent — always visible, brighter when active */}
      <span
        className={cn(
          'absolute left-0 top-1/2 h-5 w-[1px] -translate-y-1/2 rounded-r-full transition-all duration-150',
          isActive ? 'bg-[#FFD700]' : 'bg-[#FFD700]/20 group-hover:bg-[#FFD700]/40'
        )}
        aria-hidden
      />

      <Icon
        className={cn(
          'h-[20px] w-[20px] shrink-0 transition-all duration-150',
          isActive ? 'text-[#FFD700]' : 'text-[#FFD700]/50 group-hover:text-[#FFD700]/80'
        )}
        strokeWidth={1.5}
      />
      <span className="font-medium tracking-wide">{item.label}</span>

      {/* Subtle gold glow when active */}
      {isActive && (
        <span
          className="absolute inset-0 rounded-lg bg-[#FFD700]/[0.04]"
          aria-hidden
        />
      )}
    </Link>
  );
}

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);
  const { data: unreadCount = 0 } = useUnreadCount();

  // Split items into zones: consume (feed, spaces) | create (lab) | personal (profile)
  const consumeItems = navItems.filter(i => i.id === 'feed' || i.id === 'spaces');
  const labItem = navItems.find(i => i.id === 'lab');
  const profileItem = navItems.find(i => i.id === 'profile');

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
      <Link
        href="/discover"
        className="flex items-center gap-2.5 px-4 py-5 transition-opacity hover:opacity-80"
        aria-label="HIVE home"
      >
        <HiveLogoGold size={22} />
        <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
          HIVE
        </span>
      </Link>

      {/* Zone 1: Consume — Feed, Spaces */}
      <nav className="mt-1 flex flex-col gap-0.5" aria-label="Main navigation">
        {consumeItems.map((item) => (
          <StandardNavItem
            key={item.id}
            item={item}
            isActive={isNavItemActive(item, pathname)}
          />
        ))}
      </nav>

      {/* Hairline */}
      <div className="mx-4 my-2 h-px bg-white/[0.06]" />

      {/* Zone 2: Create — Lab (elevated) */}
      {labItem && (
        <LabNavItem
          item={labItem}
          isActive={isNavItemActive(labItem, pathname)}
        />
      )}

      {/* Hairline */}
      <div className="mx-4 my-2 h-px bg-white/[0.06]" />

      {/* Zone 3: Personal — Profile */}
      {profileItem && (
        <StandardNavItem
          item={profileItem}
          isActive={isNavItemActive(profileItem, pathname)}
        />
      )}

      {/* Push utilities to bottom */}
      <div className="flex-1" />

      {/* Bottom utilities */}
      <div className="flex flex-col gap-0.5 border-t border-white/[0.06] py-3">
        {/* Search */}
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          }}
          className="group flex items-center gap-3 mx-1 px-4 py-2 text-[13px] text-white/35 rounded-lg transition-all duration-150 hover:text-white/60"
          aria-label="Search (⌘K)"
        >
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          <span className="font-medium tracking-wide">Search</span>
          <kbd className="ml-auto font-sans text-[10px] tracking-[0.12em] text-white/15">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => router.push('/notifications')}
          className="group relative flex items-center gap-3 mx-1 px-4 py-2 text-[13px] text-white/35 rounded-lg transition-all duration-150 hover:text-white/60"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <div className="relative">
            <Bell className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#FFD700] px-0.5 text-[9px] font-bold text-black leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="font-medium tracking-wide">Notifications</span>
        </button>

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
