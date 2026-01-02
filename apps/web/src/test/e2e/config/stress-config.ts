/**
 * Stress Test Configuration for HIVE Platform
 *
 * Defines parameters for load testing and stress testing scenarios.
 */

// ============================================================================
// STRESS TEST CONFIGURATION
// ============================================================================

export const STRESS_CONFIG = {
  // User count tiers for progressive load testing
  userTiers: [10, 50, 100] as const,

  // Timeouts for stress tests (longer than regular tests)
  timeouts: {
    test: 300000, // 5 minutes per test
    operation: 30000, // 30 seconds per operation
    soak: 900000, // 15 minutes for soak test
  },

  // Target performance metrics
  targets: {
    // Response time targets (milliseconds)
    p95Latency: {
      browse: 5000,
      search: 3000,
      chat: 500,
      api: 2000,
    },
    // Success rate targets (percentage)
    successRate: {
      light: 99, // 10-50 users
      medium: 95, // 50-100 users
      heavy: 90, // 100+ users
    },
    // SSE connection targets
    sseConnections: {
      concurrent: 100,
      ratePerMinute: 100,
    },
    // Message throughput
    messageRate: {
      perMinute: 100,
      maxLatency: 500,
    },
  },

  // Delays between operations (to simulate realistic behavior)
  delays: {
    betweenUsers: 100, // ms between spawning users
    betweenActions: 200, // ms between user actions
    soakInterval: 60000, // 1 minute between soak measurements
  },
} as const;

// ============================================================================
// PERFORMANCE METRIC TYPES
// ============================================================================

export interface MetricSnapshot {
  timestamp: number;
  p95: number;
  avgLatency: number;
  errorCount: number;
  successCount: number;
}

export interface StressTestResult {
  userCount: number;
  duration: number;
  metrics: MetricSnapshot[];
  summary: {
    totalRequests: number;
    successRate: number;
    avgLatency: number;
    p95Latency: number;
    maxLatency: number;
    errors: string[];
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate P95 from an array of latencies
 */
export function calculateP95(latencies: number[]): number {
  if (latencies.length === 0) return 0;

  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.95);
  return sorted[index] || sorted[sorted.length - 1];
}

/**
 * Calculate average from an array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Check if performance meets targets
 */
export function meetsTarget(
  result: StressTestResult,
  tier: 'light' | 'medium' | 'heavy',
  endpoint: keyof typeof STRESS_CONFIG.targets.p95Latency
): boolean {
  const p95Target = STRESS_CONFIG.targets.p95Latency[endpoint];
  const successTarget = STRESS_CONFIG.targets.successRate[tier];

  return (
    result.summary.p95Latency <= p95Target &&
    result.summary.successRate >= successTarget
  );
}

/**
 * Generate test report
 */
export function generateReport(results: StressTestResult[]): string {
  const lines: string[] = [
    '# HIVE Stress Test Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
  ];

  for (const result of results) {
    lines.push(`### ${result.userCount} Concurrent Users`);
    lines.push(`- Duration: ${Math.round(result.duration / 1000)}s`);
    lines.push(`- Total Requests: ${result.summary.totalRequests}`);
    lines.push(`- Success Rate: ${result.summary.successRate.toFixed(2)}%`);
    lines.push(`- Avg Latency: ${result.summary.avgLatency}ms`);
    lines.push(`- P95 Latency: ${result.summary.p95Latency}ms`);
    lines.push(`- Max Latency: ${result.summary.maxLatency}ms`);

    if (result.summary.errors.length > 0) {
      lines.push(`- Errors: ${result.summary.errors.slice(0, 5).join(', ')}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

export const STRESS_SCENARIOS = {
  /**
   * Browse page load test
   * Tests: Page load, API response, SSR performance
   */
  browse: {
    name: 'Browse Page Load',
    endpoint: '/spaces/browse',
    apiEndpoint: '/api/spaces/browse-v2',
    userCounts: [10, 50, 100],
    assertions: {
      p95: 5000,
      successRate: 95,
    },
  },

  /**
   * Search functionality test
   * Tests: Search API, relevance scoring, response time
   */
  search: {
    name: 'Search Performance',
    endpoint: '/api/spaces/search',
    queries: ['club', 'engineering', 'music', 'sports', 'study'],
    userCounts: [10, 50],
    assertions: {
      p95: 3000,
      successRate: 99,
    },
  },

  /**
   * Chat message throughput test
   * Tests: Message send/receive, SSE streaming, reaction speed
   */
  chat: {
    name: 'Chat Throughput',
    endpoint: '/api/spaces/{spaceId}/chat',
    messagesPerMinute: 100,
    userCounts: [10, 50],
    assertions: {
      p95: 500,
      successRate: 99,
    },
  },

  /**
   * SSE connection test
   * Tests: Connection establishment, heartbeat, concurrent connections
   */
  sse: {
    name: 'SSE Connections',
    endpoint: '/api/spaces/{spaceId}/chat/stream',
    maxConnections: 100,
    holdDurationSeconds: 30,
    assertions: {
      rateLimit: 0, // No rate limit errors
    },
  },

  /**
   * Soak test (sustained load)
   * Tests: Memory leaks, connection cleanup, degradation over time
   */
  soak: {
    name: 'Soak Test (15 min)',
    durationMinutes: 15,
    usersPerBatch: 10,
    interval: 60000, // 1 minute
    assertions: {
      degradationThreshold: 2, // Max 2x degradation
    },
  },
} as const;
