/**
 * Concurrent Users Stress Test
 *
 * Tests platform performance under concurrent user load.
 * Uses Playwright's parallel browser contexts to simulate real users.
 */

import { test, expect, chromium, Browser, BrowserContext } from '@playwright/test';
import {
  STRESS_CONFIG,
  calculateP95,
  calculateAverage,
  StressTestResult,
  MetricSnapshot,
} from '../config/stress-config';

// Increase timeout for stress tests
test.setTimeout(STRESS_CONFIG.timeouts.test);

test.describe('Concurrent User Stress Tests', () => {
  test.describe.configure({ mode: 'serial' });

  // Test with increasing user counts
  for (const userCount of [10, 50, 100]) {
    test(`should handle ${userCount} concurrent users on browse page`, async () => {
      const browser = await chromium.launch();
      const contexts: BrowserContext[] = [];
      const latencies: number[] = [];
      const errors: string[] = [];

      try {
        // Spawn browser contexts for each "user"
        for (let i = 0; i < userCount; i++) {
          const context = await browser.newContext();
          contexts.push(context);

          // Small delay between spawning to avoid thundering herd
          if (i % 10 === 9) {
            await new Promise(resolve => setTimeout(resolve, STRESS_CONFIG.delays.betweenUsers));
          }
        }

        // Execute concurrent page loads
        const actions = contexts.map(async (context, index) => {
          const page = await context.newPage();
          const startTime = Date.now();

          try {
            await page.goto('/spaces/browse', {
              timeout: STRESS_CONFIG.timeouts.operation,
              waitUntil: 'domcontentloaded',
            });

            const duration = Date.now() - startTime;
            latencies.push(duration);
          } catch (error) {
            errors.push(`User ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            await page.close();
          }
        });

        await Promise.all(actions);

        // Calculate metrics
        const p95 = calculateP95(latencies);
        const avgLatency = calculateAverage(latencies);
        const successRate = ((latencies.length / userCount) * 100);

        console.log(`\n📊 Results for ${userCount} concurrent users:`);
        console.log(`   Success rate: ${successRate.toFixed(1)}%`);
        console.log(`   Avg latency: ${avgLatency}ms`);
        console.log(`   P95 latency: ${p95}ms`);
        console.log(`   Errors: ${errors.length}`);

        // Assertions based on user tier
        const tier = userCount <= 50 ? 'light' : userCount <= 100 ? 'medium' : 'heavy';
        const targetSuccessRate = STRESS_CONFIG.targets.successRate[tier];
        const targetP95 = STRESS_CONFIG.targets.p95Latency.browse;

        expect(successRate).toBeGreaterThanOrEqual(targetSuccessRate - 10); // Allow some tolerance
        expect(p95).toBeLessThan(targetP95 * 1.5); // Allow 50% tolerance

      } finally {
        // Cleanup all contexts
        for (const context of contexts) {
          await context.close().catch(() => {});
        }
        await browser.close();
      }
    });
  }
});

test.describe('API Load Tests', () => {
  test('should handle 100 concurrent API requests to browse endpoint', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // First login
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /Test University/i }).click();
    await page.getByTestId('email-input').fill('jwrhineh@buffalo.edu');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();
    await page.waitForURL(/(profile|onboarding|start|feed|spaces)/);

    const requestCount = 100;
    const latencies: number[] = [];
    const errors: string[] = [];

    // Execute concurrent API requests
    const requests = Array(requestCount).fill(null).map(async (_, i) => {
      const result = await page.evaluate(async () => {
        const start = performance.now();
        try {
          const res = await fetch('/api/spaces/browse-v2?limit=10', {
            credentials: 'include',
          });
          return {
            ok: res.ok,
            status: res.status,
            latency: Math.round(performance.now() - start),
          };
        } catch (error) {
          return {
            ok: false,
            status: 0,
            latency: Math.round(performance.now() - start),
            error: error instanceof Error ? error.message : 'Unknown',
          };
        }
      });

      if (result.ok) {
        latencies.push(result.latency);
      } else {
        errors.push(`Request ${i}: Status ${result.status}`);
      }

      return result;
    });

    await Promise.all(requests);

    // Calculate metrics
    const p95 = calculateP95(latencies);
    const avgLatency = calculateAverage(latencies);
    const successRate = (latencies.length / requestCount) * 100;

    console.log(`\n📊 API Load Test Results (${requestCount} requests):`);
    console.log(`   Success rate: ${successRate.toFixed(1)}%`);
    console.log(`   Avg latency: ${avgLatency}ms`);
    console.log(`   P95 latency: ${p95}ms`);
    console.log(`   Errors: ${errors.length}`);

    // Assertions
    expect(successRate).toBeGreaterThanOrEqual(90);
    expect(p95).toBeLessThan(5000);

    await context.close();
  });
});

test.describe('Search Performance Under Load', () => {
  test('should handle concurrent search requests', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login first
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /Test University/i }).click();
    await page.getByTestId('email-input').fill('jwrhineh@buffalo.edu');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Use Dev Magic Link/i }).click();
    await page.waitForURL(/(profile|onboarding|start|feed|spaces)/);

    const searchQueries = ['club', 'engineering', 'music', 'sports', 'study'];
    const requestsPerQuery = 10;
    const allLatencies: number[] = [];
    const errors: string[] = [];

    // Execute concurrent searches
    for (const query of searchQueries) {
      const requests = Array(requestsPerQuery).fill(null).map(async () => {
        const result = await page.evaluate(async (q) => {
          const start = performance.now();
          try {
            const res = await fetch(`/api/spaces/search?q=${encodeURIComponent(q)}`, {
              credentials: 'include',
            });
            return {
              ok: res.ok,
              latency: Math.round(performance.now() - start),
            };
          } catch {
            return {
              ok: false,
              latency: Math.round(performance.now() - start),
            };
          }
        }, query);

        if (result.ok) {
          allLatencies.push(result.latency);
        } else {
          errors.push(`Search "${query}" failed`);
        }
      });

      await Promise.all(requests);
    }

    const p95 = calculateP95(allLatencies);
    const avgLatency = calculateAverage(allLatencies);
    const successRate = (allLatencies.length / (searchQueries.length * requestsPerQuery)) * 100;

    console.log(`\n📊 Search Load Test Results:`);
    console.log(`   Total queries: ${searchQueries.length * requestsPerQuery}`);
    console.log(`   Success rate: ${successRate.toFixed(1)}%`);
    console.log(`   Avg latency: ${avgLatency}ms`);
    console.log(`   P95 latency: ${p95}ms`);

    expect(successRate).toBeGreaterThanOrEqual(90);
    expect(p95).toBeLessThan(STRESS_CONFIG.targets.p95Latency.search);

    await context.close();
  });
});
