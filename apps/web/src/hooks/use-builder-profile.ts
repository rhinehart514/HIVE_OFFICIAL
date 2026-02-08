'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@hive/auth-logic';
import { apiClient } from '@/lib/api-client';

export interface BuilderProfile {
  level: string;
  levelLabel: string;
  xp: number;
  currentLevelMinXp: number;
  nextLevelXp: number | null;
  nextLevelName: string | null;
  xpToNextLevel: number;
  progressPercent: number;
  isMaxLevel: boolean;
  achievements: string[];
}

async function fetchBuilderProfile(): Promise<BuilderProfile> {
  const response = await apiClient.get('/api/tools/builder-profile');
  if (!response.ok) throw new Error('Failed to fetch builder profile');
  const json = await response.json();
  return json.data || json;
}

export function useBuilderProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['builder-profile', user?.uid],
    queryFn: fetchBuilderProfile,
    enabled: !!user,
    staleTime: 120_000,
  });
}
