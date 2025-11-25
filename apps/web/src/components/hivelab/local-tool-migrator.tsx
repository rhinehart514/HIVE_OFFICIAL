'use client';

/**
 * Local Tool Migrator
 *
 * Client component that listens for auth state changes and migrates
 * localStorage tools to Firestore when user signs up.
 *
 * This component renders nothing and only handles side effects.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@hive/auth-logic';
import { getLocalTools, clearLocalTools } from '@hive/ui';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { toast } from '@hive/ui';

export function LocalToolMigrator() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const hasMigratedRef = useRef(false);

  useEffect(() => {
    // Skip if already migrated or still loading
    if (hasMigratedRef.current || isLoading) {
      return;
    }

    // Only migrate when user becomes authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Check if there are local tools to migrate
    if (typeof window === 'undefined') {
      return;
    }

    const localTools = getLocalTools();

    if (localTools.length === 0) {
      return;
    }

    // Perform migration
    const migrateTools = async () => {
      try {
        logger.info('[LocalToolMigrator] Starting migration', {
          toolCount: localTools.length,
          userId: user.uid
        });

        // Convert LocalTool[] to the format expected by the API
        const tools = localTools.map(localTool => ({
          id: localTool.composition.id,
          name: localTool.composition.name || 'Untitled Tool',
          description: localTool.composition.description || '',
          elements: localTool.composition.elements || [],
          connections: localTool.composition.connections || [],
          layout: 'grid'
        }));

        const response = await apiClient.post('/api/tools/migrate', {
          tools
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Migration failed (${response.status})`);
        }

        const result = await response.json();

        logger.info('[LocalToolMigrator] Migration successful', {
          migratedCount: result.migratedCount
        });

        // Clear localStorage after successful migration
        clearLocalTools();

        // Mark as migrated to prevent re-running
        hasMigratedRef.current = true;

        // Show success message
        toast.success(
          result.message ||
          `${result.migratedCount} tool${result.migratedCount !== 1 ? 's' : ''} synced to your account!`
        );

      } catch (error) {
        logger.error('[LocalToolMigrator] Migration failed', error as Error, {
          userId: user.uid,
          toolCount: localTools.length
        });

        // Show error message but don't clear localStorage
        // User can try again later
        toast.error('Failed to sync your tools. They\'re still saved locally.');
      }
    };

    // Run migration
    migrateTools();

  }, [isAuthenticated, user, isLoading]);

  // This component renders nothing
  return null;
}
