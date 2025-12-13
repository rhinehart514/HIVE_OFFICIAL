"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@hive/auth-logic';
import {
  DEFAULT_MOBILE_NAV_ITEMS,
  DEFAULT_SIDEBAR_NAV_ITEMS,
  type ShellMobileNavItem,
  type ShellNavItem,
  type ShellSpaceLink,
  type ShellSpaceSection,
} from '@hive/ui';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

// Import UniversalShell with SSR support for better performance
const UniversalShell = dynamic(
  () => import('@hive/ui').then(mod => mod.UniversalShell),
  {
    ssr: true,
    loading: () => <ShellLoader />
  }
);

// Routes that should NOT have the shell (auth pages, landing, etc.)
const NO_SHELL_ROUTES = [
  '/auth/login',
  '/auth/verify',
  '/auth/expired',
  '/signin',
  '/onboarding',
  '/landing',
  '/waitlist',
  '/schools',
  '/debug-auth',
];

// Routes that should have a minimal shell
// Note: Profile pages now use full shell with sidebar
const MINIMAL_SHELL_ROUTES: string[] = [];

export function UniversalShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth(); // Ensure auth is initialized even if user data isn't required yet
  const router = useRouter();
  const {
    notifications: realtimeNotifications,
    unreadCount: realtimeUnreadCount,
    loading: notificationsLoading,
    error: notificationsError,
  } = useRealtimeNotifications();

  const notificationsPayload = React.useMemo(
    () =>
      (realtimeNotifications ?? []).map(notification => ({
        ...notification,
        timestamp: {
          toDate: () => notification.timestamp.toDate(),
        },
      })) as Array<Record<string, unknown>>,
    [realtimeNotifications]
  );

  const notificationCount = realtimeUnreadCount;

  const emptySections = React.useMemo<ShellSpaceSection[]>(() => [
    {
      id: 'residential',
      label: 'Residential',
      description: 'Dorm & living communities',
      spaces: [],
      actionLabel: 'Update hall',
      actionHref: '/profile',
      emptyCopy: 'Add your hall so neighbors can find you.',
    },
    {
      id: 'greek',
      label: 'Greek Life',
      description: 'Chapters & councils',
      spaces: [],
      emptyCopy: 'Rush is paused. Check back before the spring window.',
    },
    {
      id: 'student_org',
      label: 'Student Org',
      description: 'Clubs & builders',
      spaces: [],
      actionLabel: 'Browse orgs',
      actionHref: '/spaces?tab=discover',
      emptyCopy: 'Join a squad or launch one from scratch.',
    },
    {
      id: 'university_org',
      label: 'University Org',
      description: 'Official campus teams',
      spaces: [],
      actionLabel: 'View directory',
      actionHref: '/spaces?tab=discover&filter=university',
      emptyCopy: 'Track the official campus teams you work with.',
    },
  ], []);

  const [mySpaces, setMySpaces] = React.useState<ShellSpaceSection[]>(emptySections);
  const [isSpaceLeader, setIsSpaceLeader] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const resolveJoinedAt = (value: unknown): Date | undefined => {
      if (!value) return undefined;
      if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') return (value as { toDate: () => Date }).toDate();
      if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') return new Date((value as { toMillis: () => number }).toMillis());
      if (value instanceof Date) return value;
      if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
      }
      if (value && typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
        return new Date((value as { seconds: number }).seconds * 1000);
      }
      return undefined;
    };

    const determineStatus = (space: Record<string, unknown>): ShellSpaceLink['status'] => {
      const membership = space?.membership as Record<string, unknown> | undefined;
      const metrics = space?.metrics as Record<string, unknown> | undefined;
      const joinedAt = resolveJoinedAt(membership?.joinedAt);
      if (joinedAt) {
        const hoursSinceJoin = (Date.now() - joinedAt.getTime()) / 36e5;
        if (hoursSinceJoin < 120) {
          return 'new';
        }
      }

      if (membership?.isOwner || membership?.isAdmin || ['owner', 'admin'].includes(membership?.role as string)) {
        return 'live';
      }

      const memberCount = typeof metrics?.memberCount === 'number' ? metrics.memberCount : 0;
      if (memberCount >= 40) {
        return 'live';
      }

      return 'quiet';
    };

    const resolveTimestamp = (value: unknown): number => {
      if (!value) return 0;
      if (value instanceof Date) return value.getTime();
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.toMillis === 'function') return (obj.toMillis as () => number)();
        if (typeof obj.toDate === 'function') return ((obj.toDate as () => Date)()).getTime();
        if (typeof obj.seconds === 'number') return obj.seconds * 1000;
      }
      return 0;
    };

    const normalizeTokens = (...values: Array<string | null | undefined | string[]>) => {
      return values
        .flatMap((value) => {
          if (!value) return [];
          if (Array.isArray(value)) {
            return value.flatMap((item) => String(item ?? '').toLowerCase());
          }
          return [String(value).toLowerCase()];
        })
        .filter(Boolean);
    };

    const categorizeSpace = (space: Record<string, unknown>): 'residential' | 'greek' | 'student_org' | 'university_org' => {
      const tokens = normalizeTokens(
        space?.category as string | undefined,
        space?.type as string | undefined,
        ...(Array.isArray(space?.tags) ? space.tags as string[] : []),
        space?.name as string | undefined,
        space?.description as string | undefined
      );

      const includesAny = (keywords: string[]) => keywords.some(keyword => tokens.some(token => token.includes(keyword)));

      if (includesAny(['residential', 'housing', 'residence', 'dorm', 'hall', 'living'])) {
        return 'residential';
      }

      if (includesAny(['greek', 'fraternity', 'sorority', 'chapter', 'panhellenic', 'ifc'])) {
        return 'greek';
      }

      if (includesAny(['university', 'campus', 'department', 'office', 'administration', 'services', 'admissions'])) {
        return 'university_org';
      }

      return 'student_org';
    };

    const formatMeta = (space: Record<string, unknown>) => {
      const membership = (space?.membership ?? {}) as Record<string, unknown>;
      const metrics = space?.metrics as Record<string, unknown> | undefined;
      const role = membership.role as string | undefined;
      const isPinned = membership.isPinned;
      const isFavorite = membership.isFavorite;
      const memberCount =
        typeof metrics?.memberCount === 'number'
          ? metrics.memberCount
          : typeof space?.memberCount === 'number'
            ? space.memberCount
            : undefined;

      const flags: string[] = [];

      if (role === 'owner') flags.push('You lead');
      else if (role === 'admin') flags.push('Admin');
      else if (role && role !== 'member') flags.push(role.charAt(0).toUpperCase() + role.slice(1));

      if (isPinned) flags.push('Pinned');
      if (isFavorite) flags.push('Favorite');

      if (typeof memberCount === 'number' && memberCount > 0) {
        flags.push(`${memberCount} members`);
      }

      return flags.join(' · ');
    };

    const loadMySpaces = async () => {
      try {
        const response = await apiClient.get('/api/profile/my-spaces?limit=12', { suppressToast: true });
        if (!response.ok) {
          logger.warn('shell: failed to fetch my-spaces', {
            status: response.status,
            statusText: response.statusText,
            component: 'UniversalShellProvider',
          });
          return;
        }

        const payload = await response.json();
        if (cancelled) return;

        const candidateLists = [
          payload?.spaces,
          payload?.categorized?.recent,
          payload?.categorized?.owned,
          payload?.categorized?.adminned,
          payload?.categorized?.favorited,
          payload?.categorized?.joined,
        ].filter((list: unknown): list is Record<string, unknown>[] => Array.isArray(list));

        const spaceIndex = new Map<string, Record<string, unknown>>();
        candidateLists.forEach((list) => {
          list.forEach((item) => {
            const itemId = item?.id as string | undefined;
            const existingMembership = (spaceIndex.get(itemId ?? '')?.membership ?? {}) as Record<string, unknown>;
            const itemMembership = (item.membership ?? {}) as Record<string, unknown>;
            if (itemId && !spaceIndex.has(itemId)) {
              spaceIndex.set(itemId, item);
            } else if (itemId) {
              // Merge membership data if missing on existing record
              const existing = spaceIndex.get(itemId);
              spaceIndex.set(itemId, {
                ...item,
                ...existing,
                membership: { ...existingMembership, ...itemMembership },
              });
            }
          });
        });

        const sections: ShellSpaceSection[] = emptySections.map((section) => ({
          ...section,
          spaces: [],
        }));

        const sectionEntries: Record<string, Array<{ link: ShellSpaceLink; priority: number; lastActive: number }>> = {
          residential: [],
          greek: [],
          student_org: [],
          university_org: [],
        };

        const makeLink = (space: Record<string, unknown>): ShellSpaceLink => ({
          id: space.id as string,
          label: (space.name as string) ?? 'Untitled Space',
          href: `/spaces/${space.id as string}`,
          status: determineStatus(space),
          meta: formatMeta(space),
        });

        spaceIndex.forEach((space) => {
          if (!space?.id) return;
          const sectionId = categorizeSpace(space);
          const membership = (space?.membership ?? {}) as Record<string, unknown>;
          const priority =
            membership.role === 'owner'
              ? 0
              : membership.role === 'admin'
                ? 1
                : membership.isPinned
                  ? 2
                  : membership.isFavorite
                    ? 3
                    : 4;
          const lastActive = resolveTimestamp(
            membership.lastVisited ?? membership.joinedAt ?? space.updatedAt ?? space.createdAt
          );

          const bucket = sectionEntries[sectionId] ?? sectionEntries.student_org;
          bucket.push({
            link: makeLink(space),
            priority,
            lastActive,
          });
        });

        // Ensure sections preserve order and trimmed duplicates
        sections.forEach((section) => {
          const seen = new Set<string>();
          const entries = sectionEntries[section.id] ?? [];
          section.spaces = entries
            .sort((a, b) => {
              if (a.priority !== b.priority) return a.priority - b.priority;
              return b.lastActive - a.lastActive;
            })
            .map((entry) => entry.link)
            .filter((space) => {
              if (seen.has(space.id)) return false;
              seen.add(space.id);
              return true;
            })
            .slice(0, 6);
        });

        if (cancelled) return;
        setMySpaces(sections);

        // Determine if user is a space leader (owner or admin of any space)
        const ownedCount = payload?.counts?.owned ?? payload?.categorized?.owned?.length ?? 0;
        const adminCount = payload?.counts?.adminned ?? payload?.categorized?.adminned?.length ?? 0;
        setIsSpaceLeader(ownedCount > 0 || adminCount > 0);
      } catch (error) {
        logger.error('shell: error loading my-spaces', {
          error: error instanceof Error ? error.message : String(error),
          component: 'UniversalShellProvider',
        });
      }
    };

    loadMySpaces();

    return () => {
      cancelled = true;
    };
  }, [emptySections]);

  // HiveLAB access is granted to space leaders (owners/admins of any space)
  const canAccessHiveLab = isSpaceLeader || auth.user?.isBuilder || auth.user?.builderOptIn;

  const desktopNavItems: ShellNavItem[] = React.useMemo(() => {
    const cloneItems = (items: ShellNavItem[]): ShellNavItem[] =>
      (items ?? []).map((item) => ({
        ...item,
        children: item.children ? cloneItems(item.children) : undefined,
      }));

    const items = cloneItems(DEFAULT_SIDEBAR_NAV_ITEMS ?? []);
    // Show HiveLab only for space leaders
    if (!canAccessHiveLab) {
      return items.filter((item) => item.id !== 'hivelab');
    }
    return items;
  }, [canAccessHiveLab]);

  const mobileNavItems: ShellMobileNavItem[] = React.useMemo(() => {
    const items = (DEFAULT_MOBILE_NAV_ITEMS ?? []).map((item) => ({ ...item }));
    // Show HiveLab only for space leaders
    if (!canAccessHiveLab) {
      return items.filter((item) => item.id !== 'hivelab');
    }
    return items;
  }, [canAccessHiveLab]);

  // Check if current route should have no shell
  const shouldHaveNoShell = NO_SHELL_ROUTES.some(route =>
    pathname?.startsWith(route) || pathname === '/'
  );

  // Check if current route should have minimal shell
  const shouldHaveMinimalShell = MINIMAL_SHELL_ROUTES.some(route =>
    pathname?.includes(route) && !pathname?.startsWith('/(dashboard)')
  );

  // Determine if we should hide the global context rail on deep Spaces views
  // NOTE: This must be called before any conditional returns to maintain hook order
  const _hideContextRail = React.useMemo(() => {
    if (!pathname) return false;
    if (!pathname.startsWith('/spaces/')) return false;
    // Keep rail on directory-style routes
    if (/^\/spaces\/(browse|search|create)(\/|$)/.test(pathname)) return false;
    // Hide for actual Space details (id or slug paths)
    return true;
  }, [pathname]);

  // For routes without shell, render children directly
  if (shouldHaveNoShell) {
    return <>{children}</>;
  }

  // For routes with minimal shell (public pages)
  if (shouldHaveMinimalShell) {
    return (
      <UniversalShell
        variant="minimal"
        navItems={desktopNavItems}
        mobileNavItems={mobileNavItems}
        notificationCount={notificationCount}
        messageCount={0}
        notifications={notificationsPayload}
        notificationsLoading={notificationsLoading}
        notificationsError={notificationsError?.message ?? null}
        mySpaces={mySpaces}
        onNotificationNavigate={(url: string) => router.push(url)}
        userAvatarUrl={auth.user?.avatarUrl ?? undefined}
        userName={auth.user?.fullName || auth.user?.displayName || undefined}
        userHandle={auth.user?.handle ?? undefined}
      >
        {children}
      </UniversalShell>
    );
  }

  // For dashboard routes, use full shell with navigation
  // TODO: Extend UniversalShell to accept navigation props or create NavigationProvider
  return (
    <UniversalShell
      variant="full"
      sidebarStyle="sleek"
      headerStyle="minimal"
      navItems={desktopNavItems}
      mobileNavItems={mobileNavItems}
      notificationCount={notificationCount}
      messageCount={0}
      notifications={notificationsPayload}
      notificationsLoading={notificationsLoading}
      notificationsError={notificationsError?.message ?? null}
      mySpaces={mySpaces}
      showContextRail={false}
      showBreadcrumbs={false}
      onNotificationNavigate={(url: string) => router.push(url)}
      userAvatarUrl={auth.user?.avatarUrl ?? undefined}
      userName={auth.user?.fullName || auth.user?.displayName || undefined}
      userHandle={auth.user?.handle ?? undefined}
    >
      {children}
    </UniversalShell>
  );
}

// Loading component while shell loads
function ShellLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[var(--hive-brand-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 animate-pulse">Loading HIVE...</p>
      </div>
    </div>
  );
}
