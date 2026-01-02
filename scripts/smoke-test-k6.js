/**
 * k6 Quick Smoke Test for HIVE Platform
 *
 * Fast verification that critical endpoints are working.
 * Run before deployments or after infrastructure changes.
 *
 * Usage:
 *   k6 run scripts/smoke-test-k6.js
 *   k6 run --env BASE_URL=https://staging.hive.app scripts/smoke-test-k6.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  let passed = 0;
  let failed = 0;

  group('Critical Endpoints', () => {
    // 1. Browse endpoint (most important)
    const browseRes = http.get(`${BASE_URL}/api/spaces/browse-v2?limit=5`);
    const browseOk = check(browseRes, {
      'Browse returns 200': (r) => r.status === 200,
      'Browse has cache headers': (r) => r.headers['Cache-Control']?.includes('s-maxage'),
    });
    browseOk ? passed++ : failed++;

    sleep(0.5);

    // 2. Search endpoint
    const searchRes = http.post(
      `${BASE_URL}/api/spaces/search`,
      JSON.stringify({ query: 'test', limit: 5 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    const searchOk = check(searchRes, {
      'Search returns 200': (r) => r.status === 200,
    });
    searchOk ? passed++ : failed++;

    sleep(0.5);

    // 3. Landing page
    const landingRes = http.get(`${BASE_URL}/`);
    const landingOk = check(landingRes, {
      'Landing returns 200': (r) => r.status === 200,
    });
    landingOk ? passed++ : failed++;
  });

  console.log(`\n===== Smoke Test Results =====`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Status: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`==============================\n`);
}
