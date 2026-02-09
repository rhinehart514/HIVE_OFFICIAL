'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@hive/auth-logic';

type CampusSource = 'session' | 'detect' | 'none';

interface CampusDetectResponse {
  id?: string;
  campusId?: string;
}

export interface CampusMode {
  hasCampus: boolean;
  campusId: string | null;
  isLoading: boolean;
  source: CampusSource;
}

async function detectCampusId(): Promise<string | null> {
  const response = await fetch('/api/campus/detect', {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as CampusDetectResponse;
  const detected = payload.campusId || payload.id || null;

  if (!detected || detected === 'unknown') {
    return null;
  }

  return detected;
}

export function useCampusMode(): CampusMode {
  const { user, isLoading: authLoading } = useAuth();

  const sessionCampusId =
    typeof user?.campusId === 'string' && user.campusId.trim().length > 0
      ? user.campusId
      : null;

  const detectionQuery = useQuery({
    queryKey: ['campus-detect'],
    queryFn: detectCampusId,
    enabled: !authLoading && !sessionCampusId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const detectedCampusId = detectionQuery.data || null;
  const campusId = sessionCampusId || detectedCampusId;

  return {
    hasCampus: Boolean(campusId),
    campusId,
    isLoading: authLoading || (!sessionCampusId && detectionQuery.isLoading),
    source: sessionCampusId ? 'session' : detectedCampusId ? 'detect' : 'none',
  };
}
