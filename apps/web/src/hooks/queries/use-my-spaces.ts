import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { secureApiFetch } from '@/lib/secure-auth-utils';

export interface MySpace {
  id: string;
  name: string;
  type: string;
  handle: string;
  bannerUrl?: string;
  unreadCount: number;
  onlineCount: number;
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
  return spaces.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    type: (s.type as string) || 'general',
    handle: s.handle as string,
    bannerUrl: s.bannerUrl as string | undefined,
    unreadCount: (s.unreadCount as number) || 0,
    onlineCount: (s.onlineCount as number) || 0,
    membership: s.membership as MySpace['membership'],
  }));
}

export function useMySpaces() {
  return useQuery<MySpace[]>({
    queryKey: queryKeys.home.mySpaces(),
    queryFn: fetchMySpaces,
    staleTime: 1000 * 60 * 2,
  });
}
