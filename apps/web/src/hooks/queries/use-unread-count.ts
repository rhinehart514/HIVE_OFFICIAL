import { useQuery, useQueryClient } from '@tanstack/react-query';

const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;

/**
 * Polls the notifications endpoint for the current unread count.
 *
 * Uses /api/notifications?limit=1 to minimise payload — the response
 * always includes `unreadCount` regardless of the page size.
 */
export function useUnreadCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=1', { credentials: 'include' });
      if (!res.ok) return 0;
      const data = await res.json();
      return (data.unreadCount ?? 0) as number;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
    enabled: options?.enabled !== false,
  });
}

export function useInvalidateUnreadCount() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
}
