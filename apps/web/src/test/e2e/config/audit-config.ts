/**
 * UX Audit Configuration
 *
 * Central configuration for comprehensive UX audit testing.
 * Documents known broken flows and expected behaviors.
 */

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  public: {
    landing: '/',
    about: '/about',
    enter: '/enter',
    authLogin: '/enter', // /auth/login redirects to /enter
  },
  protected: {
    home: '/home',
    explore: '/explore',
    exploreSpaces: '/explore?tab=spaces',
    explorePeople: '/explore?tab=people',
    exploreEvents: '/explore?tab=events',
    exploreTools: '/explore?tab=tools',
    lab: '/lab',
    me: '/me',
    you: '/you',
  },
  dynamic: {
    space: (handle: string) => `/s/${handle}`,
    user: (handle: string) => `/u/${handle}`,
  },
} as const;

// Test space from seed data
export const TEST_SPACE_HANDLE = 'entrepreneurship-club';

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  auth: {
    csrf: '/api/auth/csrf',
    logout: '/api/auth/logout',
  },
  profile: {
    get: '/api/profile',
    dashboard: '/api/profile/dashboard',
  },
  explore: {
    people: '/api/explore/people',
    events: '/api/explore/events',
    tools: '/api/explore/tools',
  },
  spaces: {
    browse: '/api/spaces/browse-v2',
    list: '/api/spaces',
  },
  admin: {
    moderationStats: '/api/admin/moderation/stats',
  },
} as const;

// ============================================================================
// KNOWN BROKEN FLOWS
// ============================================================================

/**
 * Documented broken flows from DESIGN_AUDIT.md
 * Tests will capture evidence but won't fail for these known issues
 */
export const KNOWN_BROKEN = {
  apis: [
    { endpoint: '/api/explore/people', expectedError: 401, description: 'People tab returns unauthorized' },
    { endpoint: '/api/explore/events', expectedError: 500, description: 'Events tab returns server error' },
    { endpoint: '/api/explore/tools', expectedError: 500, description: 'Tools tab returns server error' },
  ],
  routes: [
    { route: '/you', expectedStatus: 404, description: 'Profile route not implemented' },
    { route: '/spaces/*', expectedStatus: 404, description: 'Old URL pattern not redirecting' },
  ],
  components: [
    { name: 'space-detail-hooks', route: '/s/*', description: 'React hooks error on space pages' },
    { name: 'sidebar-navigation', description: 'Navigation buttons dont update URL' },
    { name: 'home-feed', route: '/home', description: 'Empty/skeleton state' },
  ],
} as const;

// ============================================================================
// TEST EXPECTATIONS
// ============================================================================

export const EXPECTATIONS = {
  api: {
    '/api/profile': { authenticated: 200, unauthenticated: 401 },
    '/api/profile/dashboard': { authenticated: 200, unauthenticated: 401 },
    '/api/spaces/browse-v2': { authenticated: 200, unauthenticated: 401 },
    '/api/explore/people': { authenticated: 401, unauthenticated: 401, knownBroken: true },
    '/api/explore/events': { authenticated: 500, unauthenticated: 401, knownBroken: true },
    '/api/explore/tools': { authenticated: 500, unauthenticated: 401, knownBroken: true },
  },
  routes: {
    '/': { authenticated: 200, unauthenticated: 200 },
    '/about': { authenticated: 200, unauthenticated: 200 },
    '/enter': { authenticated: 200, unauthenticated: 200 },
    '/home': { authenticated: 200, unauthenticated: 302 },
    '/explore': { authenticated: 200, unauthenticated: 302 },
    '/lab': { authenticated: 200, unauthenticated: 302 },
    '/you': { authenticated: 404, unauthenticated: 404, knownBroken: true },
    '/me': { authenticated: 200, unauthenticated: 302 },
  },
} as const;

// ============================================================================
// JOURNEY DEFINITIONS
// ============================================================================

export const JOURNEYS = {
  auth: {
    name: 'Authentication Flow',
    steps: ['visit-enter', 'select-university', 'enter-email', 'magic-link', 'redirect-complete'],
    expectedResult: 'pass',
  },
  discovery: {
    name: 'Discovery Flow',
    steps: ['visit-explore', 'spaces-tab', 'people-tab', 'events-tab', 'tools-tab', 'search'],
    expectedResult: 'partial', // 3 tabs broken
  },
  spaceJoin: {
    name: 'Space Join Flow',
    steps: ['visit-space', 'join-space', 'member-view'],
    expectedResult: 'blocked', // Hooks crash
  },
  spaceChat: {
    name: 'Space Chat Flow',
    steps: ['send-message', 'reactions', 'switch-board'],
    expectedResult: 'blocked', // Depends on space join
  },
  profile: {
    name: 'Profile Flow',
    steps: ['visit-me', 'visit-handle', 'edit-profile'],
    expectedResult: 'partial', // /you 404
  },
  lab: {
    name: 'Lab Flow',
    steps: ['visit-lab', 'create-tool', 'deploy'],
    expectedResult: 'pass',
  },
} as const;

// ============================================================================
// SCREENSHOT CONFIG
// ============================================================================

export const SCREENSHOT_CONFIG = {
  outputDir: './audit-results/screenshots',
  naming: {
    smoke: (index: number, name: string) => `smoke/${String(index).padStart(2, '0')}-${name}.png`,
    journey: (journey: string, index: number, step: string, error?: boolean) =>
      `journey-${journey}/${String(index).padStart(2, '0')}-${step}${error ? '-ERROR' : ''}.png`,
    visual: (category: string, name: string) => `visual/${category}-${name}.png`,
    broken: (name: string) => `broken-flows/${name}.png`,
  },
} as const;

// ============================================================================
// REPORT THRESHOLDS
// ============================================================================

export const THRESHOLDS = {
  // Minimum pass rate before alerting
  smokePassRate: 0.75,
  journeyPassRate: 0.5, // Many known broken
  apiPassRate: 0.6, // Many known broken

  // Performance thresholds
  pageLoadTimeout: 10000,
  apiTimeout: 5000,
} as const;

// ============================================================================
// TEST DATA
// ============================================================================

export const TEST_DATA = {
  users: {
    admin: {
      email: 'jwrhineh@buffalo.edu',
      name: 'Admin User',
    },
    student: {
      email: 'student@buffalo.edu',
      name: 'Test Student',
    },
  },
  spaces: {
    test: {
      handle: 'entrepreneurship-club',
      name: 'Entrepreneurship Club',
    },
  },
} as const;

// ============================================================================
// HELPERS
// ============================================================================

export function isKnownBrokenApi(endpoint: string): boolean {
  return KNOWN_BROKEN.apis.some((api) => api.endpoint === endpoint);
}

export function isKnownBrokenRoute(route: string): boolean {
  return KNOWN_BROKEN.routes.some(
    (r) => r.route === route || (r.route.includes('*') && route.startsWith(r.route.replace('*', '')))
  );
}

export function getApiExpectation(endpoint: string, authenticated: boolean) {
  const expectations = EXPECTATIONS.api[endpoint as keyof typeof EXPECTATIONS.api];
  if (!expectations) return { status: 200, knownBroken: false };

  return {
    status: authenticated ? expectations.authenticated : expectations.unauthenticated,
    knownBroken: 'knownBroken' in expectations && expectations.knownBroken,
  };
}
