/**
 * Reserved Routes - Phase 7: Route Simplification
 *
 * These slugs cannot be used as space slugs because they conflict
 * with system routes. Used for middleware validation.
 */

// Tier 1: Core app routes
export const CORE_ROUTES = [
  'feed',
  'spaces',
  'browse',
  'build',
  'me',
  'profile',
  'settings',
  'notifications',
  'calendar',
  'events',
  'tools',
  'hivelab',
];

// Tier 2: Auth and legal
export const AUTH_ROUTES = [
  'auth',
  'login',
  'logout',
  'signup',
  'register',
  'verify',
  'onboarding',
];

export const LEGAL_ROUTES = [
  'privacy',
  'terms',
  'legal',
  'about',
  'help',
  'support',
];

// Tier 3: System and admin
export const SYSTEM_ROUTES = [
  'api',
  'admin',
  '_next',
  'static',
  'assets',
  'public',
  'favicon.ico',
];

// Tier 4: User-facing aliases
export const ALIAS_ROUTES = [
  'user',      // /user/[handle] → profile by handle
  'schools',   // School selection
  'landing',   // Landing page variants
  'offline',   // Offline fallback
  'ux',        // UX prototypes
];

// Combined list of all reserved routes
export const RESERVED_ROUTES = [
  ...CORE_ROUTES,
  ...AUTH_ROUTES,
  ...LEGAL_ROUTES,
  ...SYSTEM_ROUTES,
  ...ALIAS_ROUTES,
];

/**
 * Check if a slug is reserved (cannot be used as a space slug)
 */
export function isReservedRoute(slug: string): boolean {
  const normalized = slug.toLowerCase().trim();
  return RESERVED_ROUTES.includes(normalized);
}

/**
 * Check if a path starts with a reserved route
 */
export function startsWithReservedRoute(path: string): boolean {
  const normalized = path.toLowerCase().replace(/^\//, '');
  const firstSegment = normalized.split('/')[0];
  return RESERVED_ROUTES.includes(firstSegment);
}
