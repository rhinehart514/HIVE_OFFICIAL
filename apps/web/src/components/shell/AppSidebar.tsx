'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, X } from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { cn } from '@/lib/utils';

export type ShellActiveView = 'home' | 'space' | 'profile';

interface AppSidebarProps {
  activeView: ShellActiveView;
  activeSpaceHandle: string | null;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface SidebarSpace {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  iconURL?: string | null;
  status?: string;
  unreadCount?: number;
  lastActivityAt?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
  membership?: {
    joinedAt?: unknown;
    lastVisited?: unknown;
  };
}

const HOME_ROUTE = '/discover';
const PROFILE_ROUTE = '/me';

function toTimestamp(input: unknown): number {
  if (!input) return 0;

  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : 0;
  }

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? 0 : input.getTime();
  }

  if (typeof input === 'string') {
    const parsed = Date.parse(input);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof input === 'object') {
    const value = input as Record<string, unknown>;

    if (typeof value.toMillis === 'function') {
      try {
        const millis = (value.toMillis as () => number)();
        return Number.isFinite(millis) ? millis : 0;
      } catch {
        return 0;
      }
    }

    if (typeof value.toDate === 'function') {
      try {
        const date = (value.toDate as () => Date)();
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      } catch {
        return 0;
      }
    }

    if (typeof value.seconds === 'number') {
      return value.seconds * 1000;
    }
  }

  return 0;
}

function getSpaceActivityTimestamp(space: SidebarSpace): number {
  return Math.max(
    toTimestamp(space.lastActivityAt),
    toTimestamp(space.membership?.lastVisited),
    toTimestamp(space.updatedAt),
    toTimestamp(space.createdAt),
    toTimestamp(space.membership?.joinedAt)
  );
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '??';
  const words = trimmed.split(/\s+/).slice(0, 2);
  return words.map((word) => word.charAt(0).toUpperCase()).join('');
}

function getSpaceAvatar(space: SidebarSpace): string | null {
  return space.avatarUrl || space.iconURL || null;
}

function normalizeSpace(raw: Record<string, unknown>): SidebarSpace | null {
  const id = String(raw.id ?? '').trim();
  const handle = String(raw.handle ?? raw.slug ?? id).trim();
  if (!id || !handle) return null;

  return {
    id,
    name: String(raw.name ?? 'Space').trim() || 'Space',
    handle,
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : null,
    iconURL: typeof raw.iconURL === 'string' ? raw.iconURL : null,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    unreadCount: typeof raw.unreadCount === 'number' ? raw.unreadCount : 0,
    lastActivityAt: raw.lastActivityAt,
    updatedAt: raw.updatedAt,
    createdAt: raw.createdAt,
    membership:
      raw.membership && typeof raw.membership === 'object'
        ? {
            joinedAt: (raw.membership as Record<string, unknown>).joinedAt,
            lastVisited: (raw.membership as Record<string, unknown>).lastVisited,
          }
        : undefined,
  };
}

function sortSpacesByActivity(spaces: SidebarSpace[]): SidebarSpace[] {
  return [...spaces].sort((a, b) => {
    const aTimestamp = getSpaceActivityTimestamp(a);
    const bTimestamp = getSpaceActivityTimestamp(b);

    if (aTimestamp !== bTimestamp) {
      return bTimestamp - aTimestamp;
    }

    return a.name.localeCompare(b.name);
  });
}

function SidebarDivider() {
  return <div className="my-3 h-px w-12 shrink-0 bg-white/[0.06]" />;
}

interface SpaceIconButtonProps {
  space: SidebarSpace;
  isActive: boolean;
  onClick: () => void;
}

function SpaceIconButton({ space, isActive, onClick }: SpaceIconButtonProps) {
  const avatar = getSpaceAvatar(space);
  const isUnclaimed = space.status === 'unclaimed';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-12 w-12 items-center justify-center rounded-lg border text-[11px] font-medium transition-colors',
        isUnclaimed ? 'border-white/[0.06] opacity-50' : 'border-white/[0.06]',
        isActive ? 'ring-2 ring-[#FFD700]' : 'hover:bg-white/[0.06]'
      )}
      title={space.name}
      aria-label={`Open ${space.name}`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={space.name}
          className="h-full w-full rounded-lg object-cover"
        />
      ) : (
        <span className="font-[family-name:'Clash_Display',var(--hive-font-display)] text-xs text-white">
          {getInitials(space.name)}
        </span>
      )}

      {(space.unreadCount ?? 0) > 0 && (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-[#FFD700]"
        />
      )}
    </button>
  );
}

export function AppSidebar({
  activeView,
  activeSpaceHandle,
  isMobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [spaces, setSpaces] = React.useState<SidebarSpace[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = React.useState(false);
  const [isJoinCreateOpen, setIsJoinCreateOpen] = React.useState(false);
  const desktopJoinCreateRef = React.useRef<HTMLDivElement | null>(null);
  const mobileJoinCreateRef = React.useRef<HTMLDivElement | null>(null);

  const loadSpaces = React.useCallback(async () => {
    if (!user) {
      setSpaces([]);
      return;
    }

    setIsLoadingSpaces(true);
    try {
      const response = await fetch('/api/profile/my-spaces?limit=100', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        setSpaces([]);
        return;
      }

      const payload = await response.json();
      const source = Array.isArray(payload?.spaces)
        ? payload.spaces
        : Array.isArray(payload?.data?.spaces)
          ? payload.data.spaces
          : [];

      const index = new Map<string, SidebarSpace>();
      source.forEach((entry: unknown) => {
        if (!entry || typeof entry !== 'object') return;
        const normalized = normalizeSpace(entry as Record<string, unknown>);
        if (!normalized) return;
        if (!index.has(normalized.id)) {
          index.set(normalized.id, normalized);
        }
      });

      setSpaces(sortSpacesByActivity(Array.from(index.values())));
    } catch {
      setSpaces([]);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [user]);

  React.useEffect(() => {
    void loadSpaces();
  }, [loadSpaces]);

  React.useEffect(() => {
    setIsJoinCreateOpen(false);
  }, [pathname, isMobileOpen]);

  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (desktopJoinCreateRef.current?.contains(target)) return;
      if (mobileJoinCreateRef.current?.contains(target)) return;
      setIsJoinCreateOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const goTo = React.useCallback(
    (href: string) => {
      router.push(href);
      onMobileClose();
    },
    [onMobileClose, router]
  );

  const profileInitial = (
    user?.displayName?.trim()?.charAt(0) ||
    user?.fullName?.trim()?.charAt(0) ||
    user?.handle?.trim()?.charAt(0) ||
    'U'
  ).toUpperCase();

  const renderRail = React.useCallback((joinCreateRef: React.RefObject<HTMLDivElement | null>) => (
    <div className="flex h-full w-[72px] shrink-0 flex-col items-center px-3 py-4">
      <button
        type="button"
        onClick={() => goTo(HOME_ROUTE)}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border transition-colors',
          activeView === 'home'
            ? 'border-[#FFD700] bg-[#FFD700] text-black'
            : 'border-white/[0.06] text-white/50 hover:bg-white/[0.06]'
        )}
        aria-label="Home"
      >
        <Home className="h-5 w-5" />
      </button>

      <SidebarDivider />

      <div className="w-full flex-1 overflow-y-auto scrollbar-thin [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
        <div className="flex flex-col items-center gap-3 pb-2">
          {isLoadingSpaces && (
            <div className="h-2 w-2 rounded-full bg-white/[0.06]" aria-hidden />
          )}

          {!isLoadingSpaces && spaces.length === 0 && (
            <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/25">
              Empty
            </div>
          )}

          {spaces.map((space) => {
            const isActive =
              activeView === 'space' && activeSpaceHandle === space.handle;
            return (
              <SpaceIconButton
                key={space.id}
                space={space}
                isActive={isActive}
                onClick={() => goTo(`/s/${encodeURIComponent(space.handle)}`)}
              />
            );
          })}
        </div>
      </div>

      <SidebarDivider />

      <div ref={joinCreateRef} className="relative">
        <button
          type="button"
          onClick={() => setIsJoinCreateOpen((value) => !value)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/[0.06] text-white/50 transition-colors hover:bg-white/[0.06]"
          aria-label="Join or create a space"
          aria-expanded={isJoinCreateOpen}
        >
          <Plus className="h-5 w-5" />
        </button>

        {isJoinCreateOpen && (
          <div className="absolute left-[calc(100%+10px)] top-1/2 z-50 w-44 -translate-y-1/2 rounded-lg border border-white/[0.06] bg-black p-1.5">
            <button
              type="button"
              onClick={() => goTo('/spaces')}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/[0.06]"
            >
              Join a space
            </button>
            <button
              type="button"
              onClick={() => goTo('/spaces/new')}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/[0.06]"
            >
              Create a space
            </button>
          </div>
        )}
      </div>

      <SidebarDivider />

      <button
        type="button"
        onClick={() => goTo(PROFILE_ROUTE)}
        className={cn(
          'flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border transition-colors',
          activeView === 'profile'
            ? 'ring-2 ring-[#FFD700]'
            : 'border-white/[0.06] hover:bg-white/[0.06]'
        )}
        aria-label="Profile and settings"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Your avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-white">{profileInitial}</span>
        )}
      </button>
    </div>
  ), [activeSpaceHandle, activeView, goTo, isJoinCreateOpen, isLoadingSpaces, profileInitial, spaces, user?.avatarUrl]);

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[72px] border-r border-white/[0.06] bg-black md:block">
        {renderRail(desktopJoinCreateRef)}
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-50 transition-opacity md:hidden',
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/75"
          onClick={onMobileClose}
          aria-label="Close navigation"
        />

        <aside
          className={cn(
            'absolute left-0 top-0 h-full w-[280px] border-r border-white/[0.06] bg-black transition-transform duration-150',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
              Nav
            </span>
            <button
              type="button"
              onClick={onMobileClose}
              className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex h-[calc(100%-56px)] justify-center overflow-visible">
            {renderRail(mobileJoinCreateRef)}
          </div>
        </aside>
      </div>
    </>
  );
}

export default AppSidebar;
