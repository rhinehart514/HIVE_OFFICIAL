"use client";

import { useCallback, useEffect, useState } from 'react';
import { secureApiFetch } from '@/lib/secure-auth-utils';

export interface Space {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
}

export function useSpace(spaceId?: string) {
  const [space, setSpace] = useState<Space | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}`);
      if (!res.ok) throw new Error(String(res.status));
      const response = await res.json();
      // Handle both wrapped { success, data: {...} } and direct response formats
      const data = response.data || response;
      setSpace({ id: data.id || spaceId, name: data.name, description: data.description, memberCount: data.memberCount });
      const role = data.membership?.role || data.membershipRole;
      const status = data.membership?.status || data.membershipStatus;
      setIsMember(Boolean(data.isMember || data.membership?.isActive || ['active', 'joined'].includes((status || '').toLowerCase())));
      setIsLeader(Boolean(['owner', 'leader', 'admin'].includes((role || '').toLowerCase()) || data.membership?.isLeader));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load space');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  const joinSpace = useCallback(async () => {
    if (!spaceId) return false;

    // Optimistic update - immediately show as member
    const previousMemberCount = space?.memberCount ?? 0;
    setIsMember(true);
    setSpace(prev => prev ? { ...prev, memberCount: previousMemberCount + 1 } : prev);

    try {
      const res = await secureApiFetch('/api/spaces/join', { method: 'POST', body: JSON.stringify({ spaceId }) });
      if (res.ok) {
        await load(); // Sync with server
        return true;
      }
      // Revert on failure
      setIsMember(false);
      setSpace(prev => prev ? { ...prev, memberCount: previousMemberCount } : prev);
      return false;
    } catch {
      // Revert on error
      setIsMember(false);
      setSpace(prev => prev ? { ...prev, memberCount: previousMemberCount } : prev);
      return false;
    }
  }, [spaceId, load, space?.memberCount]);

  const leaveSpace = useCallback(async () => {
    if (!spaceId) return false;

    // Optimistic update - immediately show as non-member
    const previousMemberCount = space?.memberCount ?? 0;
    setIsMember(false);
    setIsLeader(false);
    setSpace(prev => prev ? { ...prev, memberCount: Math.max(0, previousMemberCount - 1) } : prev);

    try {
      const res = await secureApiFetch('/api/spaces/leave', { method: 'POST', body: JSON.stringify({ spaceId }) });
      if (res.ok) {
        await load(); // Sync with server
        return true;
      }
      // Revert on failure
      setIsMember(true);
      setSpace(prev => prev ? { ...prev, memberCount: previousMemberCount } : prev);
      return false;
    } catch {
      // Revert on error
      setIsMember(true);
      setSpace(prev => prev ? { ...prev, memberCount: previousMemberCount } : prev);
      return false;
    }
  }, [spaceId, load, space?.memberCount]);

  useEffect(() => { void load(); }, [load]);

  return { space, isMember, isLeader, joinSpace, leaveSpace, isLoading, error };
}

