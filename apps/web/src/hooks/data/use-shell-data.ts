'use client';

/**
 * Shell Data Hook — Data Fetching for Universal Shell
 *
 * Extracts all data fetching and categorization logic from UniversalShellProvider.
 * This hook handles:
 * - Fetching user's spaces
 * - Categorizing spaces into sections
 * - Determining space leadership status
 * - Notification handling
 *
 * @see /docs/VERTICAL_SLICE_SPACES.md for space categorization rules
 */

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { useRealtimeNotifications } from '../use-realtime-notifications';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

// Internal types for shell data (used only by this hook)
interface ShellSpaceLink {
  id: string;
  label: string;
  href: string;
  status?: 'new' | 'live' | 'quiet';
  meta?: string;
  onlineCount?: number;
}

interface ShellSpaceSection {
  id: string;
  label: string;
  description?: string;
  spaces: ShellSpaceLink[];
  actionLabel?: string;
  actionHref?: string;
  emptyCopy?: string;
}

// ============================================
// TYPES
// ============================================

export interface ShellNotification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

export interface ShellDataResult {
  // User data
  user: {
    avatarUrl?: string;
    name?: string;
    handle?: string;
    isBuilder: boolean;
  };

  // Spaces data
  mySpaces: ShellSpaceSection[];
  isSpaceLeader: boolean;

  // Notifications
  notifications: ShellNotification[];
  notificationCount: number;
  notificationsLoading: boolean;
  notificationsError: string | null;

  // Loading state
  isLoading: boolean;
}

// ============================================
// DEFAULT SECTIONS
// ============================================

const EMPTY_SECTIONS: ShellSpaceSection[] = [
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
];

// ============================================
// UTILITY FUNCTIONS (from @hive/core eventually)
// ============================================

/**
 * Resolves various timestamp formats to a Date object.
 */
function resolveJoinedAt(value: unknown): Date | undefined {
  if (!value) return undefined;

  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return new Date((value as { toMillis: () => number }).toMillis());
  }

  if (value instanceof Date) return value;

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  if (value && typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
    return new Date((value as { seconds: number }).seconds * 1000);
  }

  return undefined;
}

/**
 * Resolves various timestamp formats to a number (milliseconds).
 */
function resolveTimestamp(value: unknown): number {
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
}

/**
 * Normalizes values to lowercase tokens for keyword matching.
 */
function normalizeTokens(...values: Array<string | null | undefined | string[]>): string[] {
  return values
    .flatMap((value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value.flatMap((item) => String(item ?? '').toLowerCase());
      }
      return [String(value).toLowerCase()];
    })
    .filter(Boolean);
}

/**
 * Determines the status of a space based on membership and metrics.
 */
function determineStatus(space: Record<string, unknown>): ShellSpaceLink['status'] {
  const membership = space?.membership as Record<string, unknown> | undefined;
  const metrics = space?.metrics as Record<string, unknown> | undefined;
  const joinedAt = resolveJoinedAt(membership?.joinedAt);

  // New if joined within last 5 days (120 hours)
  if (joinedAt) {
    const hoursSinceJoin = (Date.now() - joinedAt.getTime()) / 36e5;
    if (hoursSinceJoin < 120) {
      return 'new';
    }
  }

  // Live if owner/admin or large space
  if (membership?.isOwner || membership?.isAdmin || ['owner', 'admin'].includes(membership?.role as string)) {
    return 'live';
  }

  const memberCount = typeof metrics?.memberCount === 'number' ? metrics.memberCount : 0;
  if (memberCount >= 40) {
    return 'live';
  }

  return 'quiet';
}

/**
 * Categorizes a space into one of the four section types.
 */
function categorizeSpace(space: Record<string, unknown>): 'residential' | 'greek' | 'student_org' | 'university_org' {
  const tokens = normalizeTokens(
    space?.category as string | undefined,
    space?.type as string | undefined,
    ...(Array.isArray(space?.tags) ? (space.tags as string[]) : []),
    space?.name as string | undefined,
    space?.description as string | undefined
  );

  const includesAny = (keywords: string[]) => keywords.some((keyword) => tokens.some((token) => token.includes(keyword)));

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
}

/**
 * Formats metadata for a space link.
 */
function formatMeta(space: Record<string, unknown>): string {
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
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for fetching all shell data.
 *
 * @param options Configuration options
 * @returns Shell data result with user, spaces, and notifications
 */
export function useShellData(options: { skipFetch?: boolean } = {}): ShellDataResult {
  const { skipFetch = false } = options;
  const pathname = usePathname();
  const auth = useAuth();

  // Notifications
  const {
    notifications: realtimeNotifications,
    unreadCount: realtimeUnreadCount,
    loading: notificationsLoading,
    error: notificationsError,
  } = useRealtimeNotifications();

  // State
  const [mySpaces, setMySpaces] = React.useState<ShellSpaceSection[]>(EMPTY_SECTIONS);
  const [isSpaceLeader, setIsSpaceLeader] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Transform notifications
  const notifications = React.useMemo<ShellNotification[]>(
    () =>
      (realtimeNotifications ?? []).map((notification) => ({
        id: notification.id || String(Date.now()),
        text: notification.title || notification.body || 'New notification',
        time: notification.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        unread: !notification.read,
      })),
    [realtimeNotifications]
  );

  // Fetch spaces
  React.useEffect(() => {
    if (skipFetch) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadMySpaces = async () => {
      try {
        const response = await apiClient.get('/api/profile/my-spaces?limit=12', { suppressToast: true });
        if (!response.ok) {
          logger.warn('shell: failed to fetch my-spaces', {
            status: response.status,
            statusText: response.statusText,
            component: 'useShellData',
          });
          setIsLoading(false);
          return;
        }

        const payload = await response.json();
        if (cancelled) return;

        // Collect all spaces from various lists
        const candidateLists = [
          payload?.spaces,
          payload?.categorized?.recent,
          payload?.categorized?.owned,
          payload?.categorized?.adminned,
          payload?.categorized?.favorited,
          payload?.categorized?.joined,
        ].filter((list: unknown): list is Record<string, unknown>[] => Array.isArray(list));

        // Deduplicate and merge membership data
        const spaceIndex = new Map<string, Record<string, unknown>>();
        candidateLists.forEach((list) => {
          list.forEach((item) => {
            const itemId = item?.id as string | undefined;
            if (!itemId) return;

            if (!spaceIndex.has(itemId)) {
              spaceIndex.set(itemId, item);
            } else {
              const existing = spaceIndex.get(itemId)!;
              const existingMembership = (existing.membership ?? {}) as Record<string, unknown>;
              const itemMembership = (item.membership ?? {}) as Record<string, unknown>;
              spaceIndex.set(itemId, {
                ...item,
                ...existing,
                membership: { ...existingMembership, ...itemMembership },
              });
            }
          });
        });

        // Categorize into sections
        const sections: ShellSpaceSection[] = EMPTY_SECTIONS.map((section) => ({
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

          // Priority: owner(0) > admin(1) > pinned(2) > favorite(3) > member(4)
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
          bucket.push({ link: makeLink(space), priority, lastActive });
        });

        // Sort and deduplicate within each section
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

        // Determine if user is a space leader
        const ownedCount = payload?.counts?.owned ?? payload?.categorized?.owned?.length ?? 0;
        const adminCount = payload?.counts?.adminned ?? payload?.categorized?.adminned?.length ?? 0;
        setIsSpaceLeader(ownedCount > 0 || adminCount > 0);
        setIsLoading(false);
      } catch (error) {
        logger.error('shell: error loading my-spaces', {
          error: error instanceof Error ? error.message : String(error),
          component: 'useShellData',
        });
        setIsLoading(false);
      }
    };

    loadMySpaces();

    return () => {
      cancelled = true;
    };
  }, [skipFetch]);

  // Compute builder access
  const isBuilder = isSpaceLeader || auth.user?.isBuilder || auth.user?.builderOptIn || false;

  return {
    user: {
      avatarUrl: auth.user?.avatarUrl ?? undefined,
      name: auth.user?.fullName || auth.user?.displayName || undefined,
      handle: auth.user?.handle ?? undefined,
      isBuilder,
    },
    mySpaces,
    isSpaceLeader,
    notifications,
    notificationCount: realtimeUnreadCount,
    notificationsLoading,
    notificationsError: notificationsError?.message ?? null,
    isLoading,
  };
}

export default useShellData;
