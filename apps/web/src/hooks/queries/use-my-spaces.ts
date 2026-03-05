import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { secureApiFetch } from '@/lib/secure-auth-utils';

export interface MySpace {
  id: string;
  name: string;
  type: string;
  handle: string;
  iconURL?: string;
  bannerUrl?: string;
  unreadCount: number;
  onlineCount: number;
  memberCount: number;
  updatedAt?: string;
  membership: {
    role: string;
    isOwner: boolean;
    isAdmin: boolean;
  };
}

async function fetchMySpaces(): Promise<MySpace[]> {
  const res = await secureApiFetch('/api/profile/my-spaces?limit=20');
  if (!res.ok) return [];
  const json = await res.json();
  const spaces = json.spaces || [];
  // Sort: unread first, then by updatedAt descending
  return spaces
    .map((s: Record<string, unknown>) => ({
      id: s.id as string,
      name: s.name as string,
      type: (s.type as string) || 'general',
      handle: s.handle as string,
      iconURL: s.iconURL as string | undefined,
      bannerUrl: s.bannerUrl as string | undefined,
      unreadCount: (s.unreadCount as number) || 0,
      onlineCount: (s.onlineCount as number) || 0,
      memberCount: ((s.metrics as Record<string, number> | undefined)?.memberCount as number) || 0,
      updatedAt: (s.updatedAt as string) || undefined,
      membership: s.membership as MySpace['membership'],
    }))
    .sort((a: MySpace, b: MySpace) => {
      // Unread spaces first
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      // Then by updatedAt descending
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
}

export function useMySpaces() {
  return useQuery<MySpace[]>({
    queryKey: queryKeys.home.mySpaces(),
    queryFn: fetchMySpaces,
    staleTime: 1000 * 60 * 2,
  });
}
