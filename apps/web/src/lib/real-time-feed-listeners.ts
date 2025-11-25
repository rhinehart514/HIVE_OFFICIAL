/**
 * Temporary stub for real-time feed listeners.
 * The full implementation was removed during refactors but hooks still import it.
 * This keeps type-checking and runtime imports working until the feature is rebuilt.
 */

export type RealtimeFeedItem = Record<string, unknown>;

export function getRealtimeFeedManager(_userId?: string) {
  return {
    subscribe: () => () => {},
    loadInitialFeed: async () => [] as RealtimeFeedItem[],
    loadMore: async () => [] as RealtimeFeedItem[],
    startFeedListeners: async (
      _spaceIds: string[],
      _onUpdate: (items: RealtimeFeedItem[], updateType: 'added' | 'modified' | 'removed') => void
    ) => {
      // No-op in stub.
    },
    cleanup: () => {},
  };
}

export function cleanupRealtimeFeedManager(_userId?: string) {
  // No-op stub for now.
}

