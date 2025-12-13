'use client';

/**
 * AI Quality Dashboard
 *
 * Real-time monitoring of HiveLab AI generation quality.
 * Shows metrics, recent generations, failures, and user edit patterns.
 */

import { useState, useEffect } from 'react';

// Types for API responses
interface QualityMetrics {
  period: {
    start: string;
    end: string;
    granularity: string;
  };
  generation: {
    total: number;
    uniqueUsers: number;
    avgQualityScore: number;
    scoreDistribution: {
      excellent: number;
      good: number;
      acceptable: number;
      poor: number;
    };
    acceptanceRate: number;
    partialAcceptRate: number;
    rejectionRate: number;
    deploymentRate: number;
    editRate: number;
    abandonmentRate: number;
  };
  performance: {
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    fallbackRate: number;
  };
  failures: {
    total: number;
    byType: Record<string, number>;
    topErrors: Array<{ message: string; count: number }>;
    avgRetries: number;
    fallbackSuccessRate: number;
  };
  edits: {
    totalSessions: number;
    avgEditsPerSession: number;
    avgElementsAdded: number;
    avgElementsRemoved: number;
    mostRemovedElements: Array<{ elementType: string; count: number; rate: number }>;
    mostAddedElements: Array<{ elementType: string; count: number; rate: number }>;
    outcomeDistribution: {
      deployed: number;
      saved: number;
      discarded: number;
    };
  };
  elementUsage: Record<string, number>;
  topValidationErrors: Array<{ code: string; count: number }>;
}

// Simple stat card component
function StatCard({ label, value, subtext, color = 'blue' }: {
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtext && <div className="text-xs mt-1 opacity-60">{subtext}</div>}
    </div>
  );
}

// Score distribution bar
function ScoreBar({ distribution }: { distribution: { excellent: number; good: number; acceptable: number; poor: number } }) {
  const total = distribution.excellent + distribution.good + distribution.acceptable + distribution.poor;
  if (total === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex h-4 rounded-full overflow-hidden">
        <div className="bg-green-500" style={{ width: `${pct(distribution.excellent)}%` }} title={`Excellent: ${distribution.excellent}`} />
        <div className="bg-blue-500" style={{ width: `${pct(distribution.good)}%` }} title={`Good: ${distribution.good}`} />
        <div className="bg-yellow-500" style={{ width: `${pct(distribution.acceptable)}%` }} title={`Acceptable: ${distribution.acceptable}`} />
        <div className="bg-red-500" style={{ width: `${pct(distribution.poor)}%` }} title={`Poor: ${distribution.poor}`} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-green-600">Excellent ({distribution.excellent})</span>
        <span className="text-blue-600">Good ({distribution.good})</span>
        <span className="text-yellow-600">OK ({distribution.acceptable})</span>
        <span className="text-red-600">Poor ({distribution.poor})</span>
      </div>
    </div>
  );
}

export default function AIQualityDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  // Fetch metrics
  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        // Note: In production, this would call the actual API
        // For now, show placeholder data since we don't have the backend connected
        const response = await fetch(`/api/admin/ai-quality/metrics?period=${period}`);
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set placeholder data for development
        setMetrics({
          period: { start: new Date(Date.now() - 86400000).toISOString(), end: new Date().toISOString(), granularity: period },
          generation: {
            total: 0,
            uniqueUsers: 0,
            avgQualityScore: 0,
            scoreDistribution: { excellent: 0, good: 0, acceptable: 0, poor: 0 },
            acceptanceRate: 0,
            partialAcceptRate: 0,
            rejectionRate: 0,
            deploymentRate: 0,
            editRate: 0,
            abandonmentRate: 0,
          },
          performance: { avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, fallbackRate: 0 },
          failures: { total: 0, byType: {}, topErrors: [], avgRetries: 0, fallbackSuccessRate: 0 },
          edits: {
            totalSessions: 0,
            avgEditsPerSession: 0,
            avgElementsAdded: 0,
            avgElementsRemoved: 0,
            mostRemovedElements: [],
            mostAddedElements: [],
            outcomeDistribution: { deployed: 0, saved: 0, discarded: 0 },
          },
          elementUsage: {},
          topValidationErrors: [],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [period]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Quality Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor HiveLab AI generation quality in real-time</p>
          </div>
          <div className="flex gap-2">
            {(['hour', 'day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            Note: {error}. Showing placeholder data.
          </div>
        )}

        {metrics && !loading && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Generations"
                value={metrics.generation.total}
                subtext={`${metrics.generation.uniqueUsers} unique users`}
                color="blue"
              />
              <StatCard
                label="Avg Quality Score"
                value={`${metrics.generation.avgQualityScore}/100`}
                subtext={metrics.generation.avgQualityScore >= 70 ? 'Good' : metrics.generation.avgQualityScore >= 50 ? 'Acceptable' : 'Needs improvement'}
                color={metrics.generation.avgQualityScore >= 70 ? 'green' : metrics.generation.avgQualityScore >= 50 ? 'yellow' : 'red'}
              />
              <StatCard
                label="Acceptance Rate"
                value={`${metrics.generation.acceptanceRate}%`}
                subtext={`${metrics.generation.partialAcceptRate}% partial`}
                color="green"
              />
              <StatCard
                label="Failures"
                value={metrics.failures.total}
                subtext={`${metrics.performance.fallbackRate}% fallback rate`}
                color={metrics.failures.total === 0 ? 'green' : 'red'}
              />
            </div>

            {/* Score Distribution */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Quality Score Distribution</h2>
              <ScoreBar distribution={metrics.generation.scoreDistribution} />
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Performance */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Performance</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Latency</span>
                    <span className="font-medium">{metrics.performance.avgLatencyMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P50 Latency</span>
                    <span className="font-medium">{metrics.performance.p50LatencyMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P95 Latency</span>
                    <span className="font-medium">{metrics.performance.p95LatencyMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P99 Latency</span>
                    <span className="font-medium">{metrics.performance.p99LatencyMs}ms</span>
                  </div>
                </div>
              </div>

              {/* User Corrections (Gold Signal) */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">User Corrections <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded ml-2">Gold Signal</span></h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Edit Sessions</span>
                    <span className="font-medium">{metrics.edits.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Edits/Session</span>
                    <span className="font-medium">{metrics.edits.avgEditsPerSession}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Elements Added</span>
                    <span className="font-medium text-green-600">+{metrics.edits.avgElementsAdded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Elements Removed</span>
                    <span className="font-medium text-red-600">-{metrics.edits.avgElementsRemoved}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Frequently Changed */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Most Removed */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4 text-red-600">Most Removed Elements</h2>
                {metrics.edits.mostRemovedElements.length === 0 ? (
                  <p className="text-gray-400 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {metrics.edits.mostRemovedElements.map((el, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="font-mono text-sm">{el.elementType}</span>
                        <span className="text-red-600 text-sm">{el.count} ({Math.round(el.rate * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Most Added */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4 text-green-600">Most Added Elements</h2>
                {metrics.edits.mostAddedElements.length === 0 ? (
                  <p className="text-gray-400 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {metrics.edits.mostAddedElements.map((el, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="font-mono text-sm">{el.elementType}</span>
                        <span className="text-green-600 text-sm">{el.count} ({Math.round(el.rate * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Validation Errors */}
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Top Validation Errors</h2>
              {metrics.topValidationErrors.length === 0 ? (
                <p className="text-gray-400 text-sm">No validation errors recorded</p>
              ) : (
                <div className="space-y-2">
                  {metrics.topValidationErrors.map((err, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-mono text-sm text-red-600">{err.code}</span>
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">{err.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Element Usage */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Element Usage</h2>
              {Object.keys(metrics.elementUsage).length === 0 ? (
                <p className="text-gray-400 text-sm">No element usage data yet</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(metrics.elementUsage)
                    .sort(([, a], [, b]) => b - a)
                    .map(([element, count]) => (
                      <div key={element} className="bg-gray-50 rounded px-3 py-2">
                        <div className="font-mono text-xs text-gray-600">{element}</div>
                        <div className="font-bold">{count}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
