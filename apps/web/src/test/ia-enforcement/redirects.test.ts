/**
 * Redirect Contract Tests
 *
 * Verifies canonical redirects follow IA invariants:
 * - Manifest redirects match middleware implementation
 * - Redirects use 301 (permanent) status - HARD REQUIREMENT
 * - /me/* routes never redirect to public surfaces
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { canonicalRedirects } from '@/lib/routes.manifest';
import { ROUTE_REDIRECTS } from '@/middleware';

const webRoot = process.cwd();
const middlewarePath = join(webRoot, 'src', 'middleware.ts');

describe('Canonical Redirects', () => {
  it('manifest redirects are implemented in middleware', () => {
    const missingInMiddleware: string[] = [];

    for (const [from, to] of Object.entries(canonicalRedirects)) {
      if (ROUTE_REDIRECTS[from] !== to) {
        missingInMiddleware.push(
          `${from} -> ${to} (middleware has: ${ROUTE_REDIRECTS[from] || 'not defined'})`
        );
      }
    }

    expect(
      missingInMiddleware,
      `Manifest redirects missing or mismatched in middleware:\n${missingInMiddleware.join('\n')}`
    ).toEqual([]);
  });

  it('middleware redirects are documented in manifest', () => {
    const undocumented: string[] = [];

    for (const [from, to] of Object.entries(ROUTE_REDIRECTS)) {
      if (!canonicalRedirects[from]) {
        undocumented.push(`${from} -> ${to}`);
      }
    }

    // All canonical redirects must be documented in the manifest
    // This prevents redirect drift
    expect(
      undocumented,
      `Middleware redirects not in manifest (add to routes.manifest.ts):\n${undocumented.join('\n')}`
    ).toEqual([]);
  });

  it('canonical redirects use 301 (permanent) status', () => {
    const middlewareSource = readFileSync(middlewarePath, 'utf-8');

    // Find all redirect calls that use ROUTE_REDIRECTS or are for canonical routes
    // Pattern: NextResponse.redirect(new URL(redirectTarget, ...
    const canonicalRedirectPattern =
      /NextResponse\.redirect\(new URL\(redirectTarget[^)]*\)(?:,\s*(\d+))?\)/;
    const match = middlewareSource.match(canonicalRedirectPattern);

    if (!match) {
      throw new Error('Could not find ROUTE_REDIRECTS redirect call in middleware');
    }

    const statusCode = match[1];
    expect(
      statusCode,
      `ROUTE_REDIRECTS must use 301 (permanent) redirects per IA_INVARIANTS.md.\n` +
        `Found: NextResponse.redirect(...${statusCode ? `, ${statusCode}` : ''}) - missing 301 status`
    ).toBe('301');
  });

  it('dynamic canonical redirects use 301 (permanent) status', () => {
    const middlewareSource = readFileSync(middlewarePath, 'utf-8');

    // Check /spaces/join/:code redirect
    const joinRedirectMatch = middlewareSource.match(
      /\/spaces\/join\/.*?NextResponse\.redirect\([^)]+\)(?:,\s*(\d+))?/s
    );

    // Check /spaces/new/* redirect
    const newSpaceRedirectMatch = middlewareSource.match(
      /\/spaces\/new\/.*?NextResponse\.redirect\([^)]+\)(?:,\s*(\d+))?/s
    );

    // Extract 301 status from these patterns
    const violations: string[] = [];

    // More precise check - look for the actual redirect lines
    const lines = middlewareSource.split('\n');
    let inJoinSection = false;
    let inNewSection = false;

    for (const line of lines) {
      if (line.includes('/spaces/join/')) inJoinSection = true;
      if (line.includes('/spaces/new/')) inNewSection = true;

      if (inJoinSection && line.includes('NextResponse.redirect')) {
        if (!line.includes('301')) {
          violations.push('/spaces/join/:code redirect missing 301 status');
        }
        inJoinSection = false;
      }

      if (inNewSection && line.includes('NextResponse.redirect')) {
        if (!line.includes('301')) {
          violations.push('/spaces/new/* redirect missing 301 status');
        }
        inNewSection = false;
      }
    }

    expect(
      violations,
      `Dynamic canonical redirects must use 301:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('/onboarding legacy redirect uses 301', () => {
    const middlewareSource = readFileSync(middlewarePath, 'utf-8');

    // Find the /onboarding redirect
    const onboardingSection = middlewareSource.match(
      /\/onboarding.*?NextResponse\.redirect\([^)]+(?:,\s*(\d+))?\)/s
    );

    if (!onboardingSection) {
      // No /onboarding redirect found - that's fine
      return;
    }

    expect(
      onboardingSection[0].includes('301'),
      `/onboarding redirect must use 301 (permanent) per IA_INVARIANTS.md`
    ).toBe(true);
  });

  it('/me/* redirects never target public surfaces', () => {
    const violations: string[] = [];
    const publicPrefixes = ['/u/', '/explore', '/home', '/feed'];

    for (const [from, to] of Object.entries(canonicalRedirects)) {
      if (!from.startsWith('/me')) continue;

      const targetsPublic = publicPrefixes.some((prefix) =>
        to.startsWith(prefix)
      );

      if (targetsPublic) {
        violations.push(`${from} -> ${to} (targets public surface)`);
      }
    }

    expect(
      violations,
      `/me/* routes redirecting to public surfaces violates IA invariants:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('/explore/* redirects never target mutation surfaces', () => {
    const violations: string[] = [];
    const mutationSurfaces = ['/settings', '/profile/edit', '/lab/new'];

    for (const [from, to] of Object.entries(canonicalRedirects)) {
      if (!from.startsWith('/explore')) continue;

      const targetsMutation = mutationSurfaces.some(
        (surface) => to.startsWith(surface) || to === surface
      );

      if (targetsMutation) {
        violations.push(`${from} -> ${to} (targets mutation surface)`);
      }
    }

    expect(
      violations,
      `/explore/* routes redirecting to mutation surfaces violates IA invariants:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
