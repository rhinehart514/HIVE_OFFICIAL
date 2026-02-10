/**
 * Route Manifest
 *
 * Single source of truth for IA ownership rules.
 * Each route declares what it owns, what it never contains,
 * allowed mutations, and friction weight.
 *
 * See docs/IA_INVARIANTS.md for the full specification.
 */

export type FrictionWeight = 'light' | 'medium' | 'heavy' | 'maximum';

export type RouteOwnership = {
  /** What this route owns (conceptual objects) */
  owns: string[];
  /** What must never appear on this route */
  neverContains: string[];
  /** Mutations allowed from this route */
  allowedMutations: string[];
  /** Friction weight for actions on this route */
  frictionWeight: FrictionWeight;
};

/**
 * Route manifest declaring ownership rules for each route.
 * Dynamic segments use [param] syntax.
 */
export const routeManifest: Record<string, RouteOwnership> = {
  '/u/[handle]': {
    owns: ['identity', 'presence', 'publicTools', 'socialProof'],
    neverContains: ['settings', 'config', 'privateState'],
    allowedMutations: [], // read-only public surface
    frictionWeight: 'light',
  },
  '/me': {
    owns: ['dashboard', 'quickActions'],
    neverContains: ['socialSignals', 'publicContent'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/me/edit': {
    owns: ['profileEditing'],
    neverContains: ['socialSignals', 'publicContent'],
    allowedMutations: ['updateProfile'],
    frictionWeight: 'medium',
  },
  '/me/notifications': {
    owns: ['notificationList', 'notificationState'],
    neverContains: ['socialSignals', 'publicContent'],
    allowedMutations: ['markRead', 'clearAll'],
    frictionWeight: 'light',
  },
  '/me/settings': {
    owns: ['preferences', 'auth', 'accountControl'],
    neverContains: ['publicActions', 'socialFeatures'],
    allowedMutations: [
      'updateProfile',
      'changePassword',
      'changeHandle',
      'deleteAccount',
    ],
    frictionWeight: 'heavy',
  },
  '/discover': {
    owns: ['aggregation', 'flow', 'attentionRouting'],
    neverContains: ['storage', 'config', 'identity'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/s/[handle]': {
    owns: ['membership', 'activity', 'chat', 'tools'],
    neverContains: ['identityConfig', 'accountSettings'],
    allowedMutations: ['join', 'leave', 'sendMessage', 'createTool'],
    frictionWeight: 'medium',
  },
  '/s/[handle]/tools/[toolId]': {
    owns: ['spaceTool', 'toolExecution'],
    neverContains: ['identityConfig', 'accountSettings'],
    allowedMutations: ['executeTool'],
    frictionWeight: 'medium',
  },
  '/s/[handle]/analytics': {
    owns: ['spaceAnalytics'],
    neverContains: ['identityConfig', 'accountSettings'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/lab/[toolId]': {
    owns: ['builderTools', 'toolEditing'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['saveTool', 'deployTool', 'deleteTool'],
    frictionWeight: 'heavy',
  },
  '/lab/new': {
    owns: ['toolCreation'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['createTool'],
    frictionWeight: 'heavy',
  },
  '/spaces': {
    owns: ['spacesList', 'spaceManagement'],
    neverContains: ['identityConfig', 'accountSettings'],
    allowedMutations: ['createSpace', 'joinSpace'],
    frictionWeight: 'medium',
  },
  '/spaces/[spaceId]/tools': {
    owns: ['spaceTools', 'deployedTools'],
    neverContains: ['identityConfig', 'accountSettings'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/spaces/[spaceId]/tools/[deploymentId]': {
    owns: ['toolExecution', 'deploymentView'],
    neverContains: ['identityConfig', 'accountSettings'],
    allowedMutations: ['executeTool'],
    frictionWeight: 'medium',
  },
  '/spaces/[spaceId]/setups': {
    owns: ['spaceSetups'],
    neverContains: ['identityConfig', 'accountSettings'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/spaces/[spaceId]/setups/[deploymentId]': {
    owns: ['setupExecution', 'setupView'],
    neverContains: ['identityConfig', 'accountSettings'],
    allowedMutations: ['executeSetup'],
    frictionWeight: 'medium',
  },
  '/lab': {
    owns: ['toolsList', 'builderDashboard'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: [],
    frictionWeight: 'medium',
  },
  '/lab/[toolId]/edit': {
    owns: ['toolEditing'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['saveTool'],
    frictionWeight: 'heavy',
  },
  '/lab/[toolId]/settings': {
    owns: ['toolConfiguration'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['updateSettings'],
    frictionWeight: 'heavy',
  },
  '/lab/[toolId]/preview': {
    owns: ['toolPreview'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/lab/[toolId]/deploy': {
    owns: ['toolDeployment'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['deployTool'],
    frictionWeight: 'heavy',
  },
  '/lab/[toolId]/run': {
    owns: ['toolExecution'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['executeTool'],
    frictionWeight: 'medium',
  },
  '/lab/[toolId]/runs': {
    owns: ['toolRunHistory'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/lab/[toolId]/analytics': {
    owns: ['toolAnalytics'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/lab/setups/new': {
    owns: ['setupCreation'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['createSetup'],
    frictionWeight: 'heavy',
  },
  '/lab/setups/[setupId]': {
    owns: ['setupView'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: [],
    frictionWeight: 'medium',
  },
  '/lab/setups/[setupId]/edit': {
    owns: ['setupEditing'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['saveSetup'],
    frictionWeight: 'heavy',
  },
  '/lab/setups/[setupId]/builder': {
    owns: ['setupBuilder'],
    neverContains: ['socialContent', 'discovery'],
    allowedMutations: ['saveSetup'],
    frictionWeight: 'heavy',
  },
  // Public/marketing pages
  '/about': {
    owns: ['marketingContent', 'brandInfo'],
    neverContains: ['userState', 'privateData'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/login': {
    owns: ['authEntry', 'sessionCreation'],
    neverContains: ['userContent', 'privateState'],
    allowedMutations: ['authenticate'],
    frictionWeight: 'medium',
  },
  '/enter': {
    owns: ['onboarding', 'verification'],
    neverContains: ['userContent', 'privateState'],
    allowedMutations: ['verifyEmail', 'completeOnboarding'],
    frictionWeight: 'medium',
  },
  '/offline': {
    owns: ['offlineState', 'connectionStatus'],
    neverContains: ['userContent', 'privateState'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  // Legal pages
  '/legal/privacy': {
    owns: ['legalContent', 'privacyPolicy'],
    neverContains: ['userState', 'privateData'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/legal/terms': {
    owns: ['legalContent', 'termsOfService'],
    neverContains: ['userState', 'privateData'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/legal/community-guidelines': {
    owns: ['legalContent', 'communityRules'],
    neverContains: ['userState', 'privateData'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  // Standalone tool pages (public, shareable)
  '/t/[toolId]': {
    owns: ['toolExecution', 'publicTool'],
    neverContains: ['settings', 'identity'],
    allowedMutations: ['executeTool'],
    frictionWeight: 'light',
  },
  // Verified leadership record (public)
  '/verify/[slug]': {
    owns: ['leadershipRecord', 'verifiedIdentity'],
    neverContains: ['settings', 'privateState'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  // Design system (admin-only)
  '/design-system': {
    owns: ['componentLibrary', 'designTokens'],
    neverContains: ['userContent', 'privateState'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
};

/**
 * Canonical redirects: old path -> new path
 * All should be 301 (permanent) per IA invariants.
 */
export const canonicalRedirects: Record<string, string> = {
  // Alias routes
  '/browse': '/spaces',
  '/build': '/lab/create',
  '/explore': '/discover',
  // Dead route consolidation
  '/home': '/discover',
  '/feed': '/discover',
  '/calendar': '/discover?tab=events',
  '/elements': '/lab',
  '/schools': '/enter',
  '/templates': '/lab',
  '/hivelab': '/lab',
  // Settings — canonical is /me/settings
  '/settings/privacy': '/me/settings?section=privacy',
  '/settings/security': '/me/settings?section=account',
  '/settings/profile': '/me/settings?section=profile',
  '/settings/account': '/me/settings?section=account',
  '/settings/notifications': '/me/settings?section=notifications',
  // Legal routes
  '/privacy': '/legal/privacy',
  '/terms': '/legal/terms',
  // IA Consolidation: pages -> modals
  '/spaces/browse': '/discover',
  '/spaces/claim': '/spaces?claim=true',
  '/spaces/new': '/spaces?create=true',
  '/spaces/create': '/spaces?create=true',
  '/people': '/discover?tab=people',
  '/events': '/discover?tab=events',
  '/leaders': '/spaces?claim=true',
  // Profile consolidation
  '/you': '/me',
  '/profile': '/me',
  '/profile/edit': '/me/edit',
  '/profile/settings': '/me/settings',
  '/profile/calendar': '/me',
  '/profile/connections': '/me',
  '/me/connections': '/me',
  '/me/calendar': '/me',
  '/me/reports': '/me/settings',
  '/notifications/settings': '/me/settings?section=notifications',
};

/**
 * Critical paths that must be declared in manifest.
 * Any route starting with these prefixes must have a manifest entry.
 */
export const criticalPaths = ['/u', '/me', '/discover', '/s', '/lab'];

/**
 * Helper: Convert route pattern to glob pattern
 * e.g., '/u/[handle]' -> '/u/*'
 */
export function routeToGlob(route: string): string {
  return route.replace(/\[.*?\]/g, '*');
}

/**
 * Helper: Check if a path matches a route pattern
 * e.g., '/u/johndoe' matches '/u/[handle]'
 */
export function matchRoutePattern(path: string, pattern: string): boolean {
  const regex = new RegExp(
    '^' + pattern.replace(/\[.*?\]/g, '[^/]+').replace(/\//g, '\\/') + '$'
  );
  return regex.test(path);
}
