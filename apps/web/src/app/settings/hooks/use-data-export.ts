'use client';

import { useState } from 'react';
import { toast } from '@hive/ui';
import { logger } from '@/lib/structured-logger';
import type { ExportProgress } from '../types';

export function useDataExport(handle: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const handleDownloadData = async () => {
    setIsDownloading(true);
    setExportProgress({ current: 0, total: 6, currentItem: 'Starting...' });

    const exportData: Record<string, unknown> = {
      exportDate: new Date().toISOString(),
      exportVersion: '2.0',
      exportedBy: handle || 'user',
    };

    const errors: string[] = [];

    // Helper to fetch with error handling
    const safeFetch = async (
      url: string,
      key: string,
      progressLabel: string,
      progressIndex: number
    ): Promise<unknown> => {
      setExportProgress({ current: progressIndex, total: 6, currentItem: progressLabel });
      try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
          errors.push(`Failed to fetch ${key}`);
          return null;
        }
        const data = await response.json();
        return data.data || data;
      } catch (error) {
        errors.push(`Error fetching ${key}: ${error instanceof Error ? error.message : 'Unknown'}`);
        return null;
      }
    };

    try {
      // 1. Profile data
      const profileData = await safeFetch('/api/profile', 'profile', 'Profile', 1);
      if (profileData) {
        exportData.profile = profileData;
      }

      // 2. Spaces
      const spacesData = await safeFetch('/api/profile/my-spaces', 'spaces', 'Spaces', 2);
      if (spacesData) {
        const spaces = spacesData as { spaces?: unknown[]; categorized?: Record<string, unknown>; counts?: Record<string, number> };
        exportData.spaces = {
          list: spaces.spaces || [],
          categorized: spaces.categorized || {},
          counts: spaces.counts || {},
        };
      }

      // 3. Connections (removed — social features deprecated)
      setExportProgress({ current: 3, total: 6, currentItem: 'Connections (skipped)' });

      // 4. Tools
      const toolsData = await safeFetch('/api/tools?limit=100&creatorOnly=true', 'tools', 'Tools', 4);
      if (toolsData) {
        const tools = toolsData as { tools?: unknown[]; pagination?: { total?: number } };
        exportData.tools = {
          list: tools.tools || [],
          totalCount: tools.pagination?.total || 0,
        };
      }

      // 5. Calendar (skipped — endpoint removed)
      const calendarData = null;
      if (calendarData) {
        const calendar = calendarData as { events?: unknown[] };
        exportData.calendar = {
          events: calendar.events || [],
        };
      }

      // 6. Activity
      setExportProgress({ current: 6, total: 6, currentItem: 'Finalizing...' });
      const activityData = await safeFetch('/api/profile/activity', 'activity', 'Activity', 6);
      if (activityData) {
        exportData.activity = activityData;
      }

      if (errors.length > 0) {
        exportData._exportWarnings = errors;
      }

      // Download the file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hive-complete-export-${handle || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (errors.length > 0) {
        toast.success(`Data exported with ${errors.length} partial failures. Check the file for details.`);
      } else {
        toast.success('Your complete data has been downloaded');
      }
    } catch (error) {
      logger.error('Download data error', { component: 'SettingsPage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to download data');
    } finally {
      setIsDownloading(false);
      setExportProgress(null);
    }
  };

  return {
    isDownloading,
    exportProgress,
    handleDownloadData,
  };
}
