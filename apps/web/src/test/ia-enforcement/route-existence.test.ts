/**
 * Route Existence Tests
 *
 * Verifies that the route manifest matches the filesystem.
 * - All manifest routes must exist as page.tsx files
 * - Critical paths must have manifest entries
 */

import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { globSync } from 'glob';
import {
  routeManifest,
  criticalPaths,
  routeToGlob,
  matchRoutePattern,
} from '@/lib/routes.manifest';

const webRoot = process.cwd();
const appRoot = join(webRoot, 'src', 'app');

/**
 * Convert filesystem path to route path
 * e.g., 'src/app/u/[handle]/page.tsx' -> '/u/[handle]'
 */
function pathToRoute(filePath: string): string {
  const relativePath = filePath
    .replace(appRoot, '')
    .replace('/page.tsx', '')
    .replace(/\/page\.tsx$/, '');

  // Handle root page
  if (relativePath === '' || relativePath === '/') {
    return '/';
  }

  return relativePath;
}

/**
 * Check if a route path matches a pattern with wildcards
 */
function matchPattern(routePath: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\*/g, '[^/]+')
    .replace(/\//g, '\\/');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(routePath);
}

describe('Route Manifest Integrity', () => {
  const appRoutes = globSync(join(appRoot, '**', 'page.tsx'));
  const routePaths = appRoutes.map(pathToRoute);

  it('all manifest routes exist in filesystem', () => {
    const missingRoutes: string[] = [];

    for (const manifestRoute of Object.keys(routeManifest)) {
      const pattern = routeToGlob(manifestRoute);
      const hasMatch = routePaths.some((p) => matchPattern(p, pattern));

      if (!hasMatch) {
        missingRoutes.push(manifestRoute);
      }
    }

    expect(
      missingRoutes,
      `Manifest routes with no matching page.tsx:\n${missingRoutes.join('\n')}`
    ).toEqual([]);
  });

  it('no undeclared routes in critical paths', () => {
    const undeclaredRoutes: string[] = [];

    for (const routePath of routePaths) {
      // Skip non-critical paths
      const isCritical = criticalPaths.some((cp) => routePath.startsWith(cp));
      if (!isCritical) continue;

      // Check if this route is declared in the manifest
      const isDeclared = Object.keys(routeManifest).some((manifestRoute) => {
        return matchRoutePattern(routePath, manifestRoute);
      });

      if (!isDeclared) {
        undeclaredRoutes.push(routePath);
      }
    }

    expect(
      undeclaredRoutes,
      `Critical routes without manifest entries:\n${undeclaredRoutes.join('\n')}\n\nAdd these routes to apps/web/src/lib/routes.manifest.ts`
    ).toEqual([]);
  });

  it('no orphan routes in filesystem (all pages must be in manifest)', () => {
    // This is the constitutional test: no route can exist without IA declaration
    // Excludes: api routes, internal routes, error pages, loading pages

    const excludedPatterns = [
      '/api', // API routes don't need manifest entries
      '/error', // Error boundary pages
      '/loading', // Loading states
      '/not-found', // 404 pages
      '/(', // Route groups (parentheses)
    ];

    const orphanRoutes: string[] = [];

    for (const routePath of routePaths) {
      // Skip excluded patterns
      const isExcluded = excludedPatterns.some(
        (pattern) =>
          routePath.includes(pattern) || routePath.startsWith(pattern)
      );
      if (isExcluded) continue;

      // Skip root route (landing page)
      if (routePath === '/') continue;

      // Check if this route is declared in the manifest
      const isDeclared = Object.keys(routeManifest).some((manifestRoute) => {
        return matchRoutePattern(routePath, manifestRoute);
      });

      if (!isDeclared) {
        orphanRoutes.push(routePath);
      }
    }

    expect(
      orphanRoutes,
      `Orphan routes without manifest entries (IA violation):\n${orphanRoutes.join('\n')}\n\n` +
        `Every routable page MUST be declared in apps/web/src/lib/routes.manifest.ts\n` +
        `This ensures IA ownership rules are explicitly defined for all routes.`
    ).toEqual([]);
  });

  it('manifest routes have required fields', () => {
    const invalidRoutes: string[] = [];

    for (const [route, ownership] of Object.entries(routeManifest)) {
      const missing: string[] = [];

      if (!Array.isArray(ownership.owns) || ownership.owns.length === 0) {
        missing.push('owns (must be non-empty array)');
      }
      if (!Array.isArray(ownership.neverContains)) {
        missing.push('neverContains (must be array)');
      }
      if (!Array.isArray(ownership.allowedMutations)) {
        missing.push('allowedMutations (must be array)');
      }
      if (
        !['light', 'medium', 'heavy', 'maximum'].includes(
          ownership.frictionWeight
        )
      ) {
        missing.push(
          'frictionWeight (must be light|medium|heavy|maximum)'
        );
      }

      if (missing.length > 0) {
        invalidRoutes.push(`${route}: missing ${missing.join(', ')}`);
      }
    }

    expect(
      invalidRoutes,
      `Routes with invalid manifest entries:\n${invalidRoutes.join('\n')}`
    ).toEqual([]);
  });
});
