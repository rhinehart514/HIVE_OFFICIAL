/**
 * Real-time Feed Listeners
 *
 * Provides no-op implementations for real-time feed functionality.
 * The feed currently operates in polling mode via the /api/feed endpoint.
 * Real-time Firebase listeners can be added here when needed for instant updates.
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
      // No-op: real-time listeners not yet implemented
    },
    cleanup: () => {},
  };
}

export function cleanupRealtimeFeedManager(_userId?: string) {
  // No-op: cleanup not needed until real-time listeners are implemented
}

