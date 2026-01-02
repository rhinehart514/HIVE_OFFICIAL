/**
 * k6 Load Testing Script for HIVE Platform
 *
 * Tests critical API endpoints under load to validate scaling readiness.
 *
 * Installation:
 *   brew install k6    # macOS
 *   choco install k6   # Windows
 *
 * Usage:
 *   k6 run scripts/load-test-k6.js                    # Default (100 VUs)
 *   k6 run --vus 1000 --duration 5m scripts/load-test-k6.js  # 1000 users for 5 min
 *   k6 run --env BASE_URL=https://staging.hive.app scripts/load-test-k6.js
 *
 * Environment variables:
 *   BASE_URL - Target URL (default: http://localhost:3000)
 *   TEST_TOKEN - Optional auth token for authenticated endpoints
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = __ENV.TEST_TOKEN || '';

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test - verify functionality
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      gracefulStop: '10s',
      tags: { scenario: 'smoke' },
      exec: 'smokeTest',
    },

    // Load test - normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },  // Ramp up to 100 users
        { duration: '3m', target: 100 },  // Stay at 100
        { duration: '1m', target: 200 },  // Ramp up to 200
        { duration: '3m', target: 200 },  // Stay at 200
        { duration: '1m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'load' },
      exec: 'loadTest',
      startTime: '40s', // Start after smoke test
    },

    // Stress test - find breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },   // Ramp up to 500
        { duration: '3m', target: 500 },   // Stay at 500
        { duration: '2m', target: 1000 },  // Ramp up to 1000
        { duration: '3m', target: 1000 },  // Stay at 1000
        { duration: '2m', target: 0 },     // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'stress' },
      exec: 'stressTest',
      startTime: '10m', // Start after load test
    },
  },

  thresholds: {
    // 95% of requests should complete within 500ms
    http_req_duration: ['p(95)<500', 'p(99)<1000'],

    // Error rate should be less than 1%
    errors: ['rate<0.01'],

    // API latency should be acceptable
    api_latency: ['p(95)<300'],

    // Success rate
    http_req_failed: ['rate<0.01'],
  },
};

// Request headers
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (TEST_TOKEN) {
    headers['Authorization'] = `Bearer ${TEST_TOKEN}`;
  }

  return headers;
}

// Check cache headers
function checkCacheHeaders(response) {
  const cacheControl = response.headers['Cache-Control'];
  if (cacheControl && cacheControl.includes('s-maxage')) {
    cacheHits.add(1);
    return true;
  }
  cacheMisses.add(1);
  return false;
}

// Smoke test - verify basic functionality
export function smokeTest() {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`, { headers: getHeaders() });
    check(res, {
      'health check returns 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(1);
}

// Load test - simulate normal traffic patterns
export function loadTest() {
  // Browse spaces - most common action
  group('Browse Spaces', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/spaces/browse-v2?limit=20`, {
      headers: getHeaders(),
    });

    apiLatency.add(Date.now() - start);
    checkCacheHeaders(res);

    check(res, {
      'browse returns 200': (r) => r.status === 200,
      'browse has spaces': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.spaces && body.spaces.length > 0;
        } catch {
          return false;
        }
      },
      'browse response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(0.5);

  // Search spaces - common action
  group('Search Spaces', () => {
    const queries = ['study', 'gaming', 'art', 'music', 'sports', 'club'];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/spaces/search`,
      JSON.stringify({ query, limit: 20 }),
      { headers: getHeaders() }
    );

    apiLatency.add(Date.now() - start);
    checkCacheHeaders(res);

    check(res, {
      'search returns 200': (r) => r.status === 200,
      'search response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(0.5);

  // Recommendations - personalized, less cacheable
  group('Recommendations', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/spaces/recommended?limit=10`, {
      headers: getHeaders(),
    });

    apiLatency.add(Date.now() - start);

    check(res, {
      'recommendations returns 200 or 401': (r) => r.status === 200 || r.status === 401,
      'recommendations response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    // Don't count 401 as error (expected when not authenticated)
    errorRate.add(res.status !== 200 && res.status !== 401);
  });

  sleep(1);
}

// Stress test - push the system to find limits
export function stressTest() {
  // High-frequency browse requests
  group('Stress Browse', () => {
    const res = http.get(`${BASE_URL}/api/spaces/browse-v2?limit=50`, {
      headers: getHeaders(),
    });

    check(res, {
      'stress browse returns 200': (r) => r.status === 200,
      'stress browse not rate limited': (r) => r.status !== 429,
    });
    errorRate.add(res.status !== 200);
  });

  // Rapid search queries
  group('Stress Search', () => {
    const res = http.post(
      `${BASE_URL}/api/spaces/search`,
      JSON.stringify({ query: 'test', limit: 50 }),
      { headers: getHeaders() }
    );

    check(res, {
      'stress search returns 200': (r) => r.status === 200,
      'stress search not rate limited': (r) => r.status !== 429,
    });
    errorRate.add(res.status !== 200);
  });

  // Minimal sleep to maximize load
  sleep(0.1);
}

// Summary handler
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    metrics: {
      requests: data.metrics.http_reqs.values.count,
      duration: data.metrics.iteration_duration?.values?.avg,
      errorRate: data.metrics.errors?.values?.rate || 0,
      p95Latency: data.metrics.http_req_duration?.values['p(95)'],
      p99Latency: data.metrics.http_req_duration?.values['p(99)'],
      cacheHitRate: data.metrics.cache_hits
        ? data.metrics.cache_hits.values.count /
          (data.metrics.cache_hits.values.count + data.metrics.cache_misses.values.count)
        : 0,
    },
    thresholds: data.thresholds,
  };

  // Console output
  console.log('\n========================================');
  console.log('HIVE Load Test Summary');
  console.log('========================================');
  console.log(`Total Requests: ${summary.metrics.requests}`);
  console.log(`Error Rate: ${(summary.metrics.errorRate * 100).toFixed(2)}%`);
  console.log(`P95 Latency: ${summary.metrics.p95Latency?.toFixed(2)}ms`);
  console.log(`P99 Latency: ${summary.metrics.p99Latency?.toFixed(2)}ms`);
  console.log(`Cache Hit Rate: ${(summary.metrics.cacheHitRate * 100).toFixed(2)}%`);
  console.log('========================================\n');

  // Return both console and JSON output
  return {
    stdout: JSON.stringify(summary, null, 2),
    'load-test-results.json': JSON.stringify(summary, null, 2),
  };
}
