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
  '/me/connections': {
    owns: ['connectionsList'],
    neverContains: ['socialSignals', 'publicContent'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/me/calendar': {
    owns: ['timeCommitments', 'schedule'],
    neverContains: ['discovery', 'browsing'],
    allowedMutations: ['addEvent', 'removeEvent'],
    frictionWeight: 'medium',
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
  '/home': {
    owns: ['aggregation', 'flow', 'attentionRouting'],
    neverContains: ['storage', 'config', 'identity'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/explore': {
    owns: ['discoverySurfaces', 'search', 'browse'],
    neverContains: ['participation', 'commitment', 'creation'],
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
  // Additional routes from codebase
  '/schools': {
    owns: ['schoolsList', 'schoolSelection'],
    neverContains: ['settings', 'identity'],
    allowedMutations: [],
    frictionWeight: 'light',
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
  '/settings': {
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
  '/notifications': {
    owns: ['notificationList', 'notificationState'],
    neverContains: ['creation', 'identity'],
    allowedMutations: ['markRead', 'clearAll'],
    frictionWeight: 'light',
  },
  '/profile/[id]': {
    owns: ['identity', 'presence', 'publicTools', 'socialProof'],
    neverContains: ['settings', 'config', 'privateState'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/profile/edit': {
    owns: ['profileEditing'],
    neverContains: ['publicContent', 'discovery'],
    allowedMutations: ['updateProfile'],
    frictionWeight: 'medium',
  },
  '/profile/connections': {
    owns: ['connectionsList'],
    neverContains: ['settings', 'discovery'],
    allowedMutations: [],
    frictionWeight: 'light',
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
  '/calendar': {
    owns: ['timeCommitments', 'schedule'],
    neverContains: ['discovery', 'browsing'],
    allowedMutations: ['addEvent', 'removeEvent'],
    frictionWeight: 'medium',
  },
  '/resources': {
    owns: ['resourcesList', 'campusResources'],
    neverContains: ['settings', 'identity'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/feed': {
    owns: ['feedContent', 'socialContent'],
    neverContains: ['settings', 'identity'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/feed/settings': {
    owns: ['feedPreferences'],
    neverContains: ['publicContent', 'discovery'],
    allowedMutations: ['updateFeedSettings'],
    frictionWeight: 'medium',
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
  // Profile (legacy - redirects to /u/[handle])
  '/profile': {
    owns: ['profileRedirect'],
    neverContains: ['settings', 'privateState'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  // Notifications settings
  '/notifications/settings': {
    owns: ['notificationPreferences'],
    neverContains: ['publicContent', 'discovery'],
    allowedMutations: ['updateNotificationSettings'],
    frictionWeight: 'medium',
  },
  // Leaders (space leadership)
  '/leaders': {
    owns: ['leadershipDirectory'],
    neverContains: ['settings', 'privateState'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  // Rituals
  '/rituals': {
    owns: ['ritualsList', 'ritualDiscovery'],
    neverContains: ['settings', 'identity'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/rituals/[slug]': {
    owns: ['ritualDetail', 'ritualContent'],
    neverContains: ['settings', 'identity'],
    allowedMutations: ['participateInRitual'],
    frictionWeight: 'medium',
  },
  // Templates
  '/templates': {
    owns: ['templateLibrary', 'templateBrowsing'],
    neverContains: ['settings', 'identity'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  // HiveLab (internal tool development)
  '/hivelab': {
    owns: ['internalTools', 'labExperiments'],
    neverContains: ['publicContent', 'userIdentity'],
    allowedMutations: [],
    frictionWeight: 'medium',
  },
  '/hivelab/demo': {
    owns: ['demoExperience', 'labShowcase'],
    neverContains: ['publicContent', 'userIdentity'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  // Design system/elements (internal)
  '/design-system': {
    owns: ['componentLibrary', 'designTokens'],
    neverContains: ['userContent', 'privateState'],
    allowedMutations: [],
    frictionWeight: 'light',
  },
  '/elements': {
    owns: ['elementShowcase', 'componentReference'],
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
  // Settings section shortcuts
  '/settings/privacy': '/settings?section=privacy',
  '/settings/security': '/settings?section=account',
  '/settings/profile': '/settings?section=profile',
  '/settings/account': '/settings?section=account',
  '/settings/notifications': '/settings?section=notifications',
  // Legal routes
  '/privacy': '/legal/privacy',
  '/terms': '/legal/terms',
  // IA Consolidation: pages -> modals
  '/spaces/browse': '/explore?tab=spaces',
  '/spaces/claim': '/spaces?claim=true',
  '/spaces/new': '/spaces?create=true',
  '/spaces/create': '/spaces?create=true',
  '/people': '/explore?tab=people',
  '/events': '/explore?tab=events',
  '/leaders': '/spaces?claim=true',
};

/**
 * Critical paths that must be declared in manifest.
 * Any route starting with these prefixes must have a manifest entry.
 */
export const criticalPaths = ['/u', '/me', '/home', '/explore', '/s', '/lab'];

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
