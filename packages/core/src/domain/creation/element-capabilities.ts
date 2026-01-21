/**
 * Element Capability Mapping System
 *
 * Maps every HiveLab element to its required capabilities and space type compatibility.
 * This system enforces context gatekeeping by ensuring tools with certain elements
 * can only be deployed to compatible contexts.
 */

/**
 * Capability levels for element interactions
 */
export type ElementCapability =
  | 'public-read'        // Safe: Anyone can interact
  | 'user-write'         // Safe: User writes to their own data
  | 'space-read'         // Scoped: Read space data
  | 'space-write'        // Scoped: Write to space
  | 'member-list'        // Scoped: Access member list
  | 'external-api'       // Power: Call external APIs
  | 'webhook'            // Power: Receive webhooks
  | 'notification'       // Power: Send notifications
  | 'moderation';        // Power: Moderation actions

/**
 * Space type requirements for elements
 */
export type SpaceTypeRequirement =
  | 'none'               // Works in any space type
  | 'public'             // Only public spaces
  | 'private'            // Only private spaces
  | 'specific-types';    // Requires specific space types

/**
 * Element compatibility configuration
 */
export interface ElementCompatibility {
  elementType: string;
  capabilities: ElementCapability[];
  spaceTypeRequirement: SpaceTypeRequirement;
  spaceTypes?: string[];  // Required if spaceTypeRequirement is 'specific-types'
  description: string;
}

/**
 * Tool element interface (matches HiveLab structure)
 */
export interface ToolElement {
  elementId: string;
  instanceId: string;
  type?: string;  // Fallback if elementId is not set
  config?: Record<string, unknown>;
}

/**
 * Comprehensive element capability mapping
 */
export const ELEMENT_CAPABILITIES: Record<string, ElementCompatibility> = {
  // ============================================================================
  // UNIVERSAL ELEMENTS (No backend required, work everywhere)
  // ============================================================================
  'text-block': {
    elementType: 'text-block',
    capabilities: [],
    spaceTypeRequirement: 'none',
    description: 'Static text display',
  },
  'button': {
    elementType: 'button',
    capabilities: ['public-read'],
    spaceTypeRequirement: 'none',
    description: 'Interactive button',
  },
  'image': {
    elementType: 'image',
    capabilities: [],
    spaceTypeRequirement: 'none',
    description: 'Static image display',
  },
  'divider': {
    elementType: 'divider',
    capabilities: [],
    spaceTypeRequirement: 'none',
    description: 'Visual separator',
  },
  'spacer': {
    elementType: 'spacer',
    capabilities: [],
    spaceTypeRequirement: 'none',
    description: 'Layout spacing',
  },

  // ============================================================================
  // INPUT ELEMENTS (User data collection)
  // ============================================================================
  'search-input': {
    elementType: 'search-input',
    capabilities: ['user-write'],
    spaceTypeRequirement: 'none',
    description: 'User search input capture',
  },
  'date-picker': {
    elementType: 'date-picker',
    capabilities: ['user-write'],
    spaceTypeRequirement: 'none',
    description: 'Date/time selection',
  },
  'user-selector': {
    elementType: 'user-selector',
    capabilities: ['user-write', 'member-list'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Campus user selection',
  },
  'form-builder': {
    elementType: 'form-builder',
    capabilities: ['user-write'],
    spaceTypeRequirement: 'none',
    description: 'Dynamic form builder',
  },

  // ============================================================================
  // FILTER ELEMENTS (Data filtering)
  // ============================================================================
  'filter-selector': {
    elementType: 'filter-selector',
    capabilities: ['public-read'],
    spaceTypeRequirement: 'none',
    description: 'Data filtering controls',
  },

  // ============================================================================
  // DISPLAY ELEMENTS (Data presentation)
  // ============================================================================
  'result-list': {
    elementType: 'result-list',
    capabilities: ['public-read'],
    spaceTypeRequirement: 'none',
    description: 'List display with pagination',
  },
  'tag-cloud': {
    elementType: 'tag-cloud',
    capabilities: ['public-read'],
    spaceTypeRequirement: 'none',
    description: 'Tag visualization',
  },
  'chart-display': {
    elementType: 'chart-display',
    capabilities: ['public-read'],
    spaceTypeRequirement: 'none',
    description: 'Data visualization charts',
  },
  'map-view': {
    elementType: 'map-view',
    capabilities: ['public-read'],
    spaceTypeRequirement: 'none',
    description: 'Geographic map display',
  },
  'notification-center': {
    elementType: 'notification-center',
    capabilities: ['user-write', 'notification'],
    spaceTypeRequirement: 'none',
    description: 'User notification display',
  },

  // ============================================================================
  // ACTION ELEMENTS (Interactive features)
  // ============================================================================
  'poll-element': {
    elementType: 'poll-element',
    capabilities: ['space-read', 'space-write'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Interactive polling',
  },
  'rsvp-button': {
    elementType: 'rsvp-button',
    capabilities: ['space-read', 'space-write'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class', 'event'],
    description: 'Event RSVP functionality',
  },
  'countdown-timer': {
    elementType: 'countdown-timer',
    capabilities: ['public-read'],
    spaceTypeRequirement: 'none',
    description: 'Countdown timer display',
  },
  'leaderboard': {
    elementType: 'leaderboard',
    capabilities: ['space-read', 'member-list'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Competitive leaderboard',
  },
  'counter': {
    elementType: 'counter',
    capabilities: ['user-write'],
    spaceTypeRequirement: 'none',
    description: 'Numeric counter',
  },
  'timer': {
    elementType: 'timer',
    capabilities: ['public-read'],
    spaceTypeRequirement: 'none',
    description: 'Timer functionality',
  },

  // ============================================================================
  // LAYOUT ELEMENTS (Structure)
  // ============================================================================
  'tabs-container': {
    elementType: 'tabs-container',
    capabilities: [],
    spaceTypeRequirement: 'none',
    description: 'Tab-based layout',
  },
  'card-container': {
    elementType: 'card-container',
    capabilities: [],
    spaceTypeRequirement: 'none',
    description: 'Card-based container',
  },

  // ============================================================================
  // SPACE-TIER ELEMENTS (Require space context)
  // ============================================================================
  'member-list': {
    elementType: 'member-list',
    capabilities: ['space-read', 'member-list'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Display space members',
  },
  'member-selector': {
    elementType: 'member-selector',
    capabilities: ['space-read', 'member-list'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Select space members',
  },
  'space-events': {
    elementType: 'space-events',
    capabilities: ['space-read', 'space-write'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Space event management',
  },
  'space-feed': {
    elementType: 'space-feed',
    capabilities: ['space-read', 'space-write'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Space activity feed',
  },
  'space-stats': {
    elementType: 'space-stats',
    capabilities: ['space-read'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Space statistics display',
  },
  'announcement': {
    elementType: 'announcement',
    capabilities: ['space-read', 'space-write', 'notification'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Space-wide announcements',
  },
  'role-gate': {
    elementType: 'role-gate',
    capabilities: ['space-read', 'member-list'],
    spaceTypeRequirement: 'specific-types',
    spaceTypes: ['community', 'project', 'study-group', 'club', 'class'],
    description: 'Role-based access control',
  },

  // ============================================================================
  // POWER ELEMENTS (Advanced capabilities)
  // ============================================================================
  'external-api-call': {
    elementType: 'external-api-call',
    capabilities: ['external-api'],
    spaceTypeRequirement: 'none',
    description: 'Call external APIs',
  },
  'webhook-receiver': {
    elementType: 'webhook-receiver',
    capabilities: ['webhook'],
    spaceTypeRequirement: 'none',
    description: 'Receive webhook events',
  },

  // ============================================================================
  // BLOCKED ELEMENTS (Missing backend APIs)
  // ============================================================================
  'study-spot-finder': {
    elementType: 'study-spot-finder',
    capabilities: ['external-api'],
    spaceTypeRequirement: 'none',
    description: 'BLOCKED: Find campus study spots (API not implemented)',
  },
  'dining-picker': {
    elementType: 'dining-picker',
    capabilities: ['external-api'],
    spaceTypeRequirement: 'none',
    description: 'BLOCKED: Campus dining picker (API not implemented)',
  },
};

/**
 * Get capabilities required by an element type
 */
export function getElementCapabilities(elementType: string): ElementCapability[] {
  const compat = ELEMENT_CAPABILITIES[elementType];
  return compat?.capabilities || [];
}

/**
 * Get all unique capabilities required by a set of elements
 */
export function getRequiredCapabilities(elements: ToolElement[]): ElementCapability[] {
  const capabilities = new Set<ElementCapability>();

  elements.forEach(el => {
    const elementType = el.elementId || el.type || '';
    getElementCapabilities(elementType).forEach(cap => capabilities.add(cap));
  });

  return Array.from(capabilities);
}

/**
 * Validate if an element type is compatible with a space type
 */
export function validateSpaceTypeCompatibility(
  elementType: string,
  spaceType: string
): boolean {
  const compat = ELEMENT_CAPABILITIES[elementType];

  if (!compat) {
    // Unknown elements are permissive by default
    return true;
  }

  if (compat.spaceTypeRequirement === 'none') {
    return true;
  }

  if (compat.spaceTypeRequirement === 'public') {
    return spaceType === 'public';
  }

  if (compat.spaceTypeRequirement === 'private') {
    return spaceType === 'private';
  }

  if (compat.spaceTypeRequirement === 'specific-types') {
    return compat.spaceTypes?.includes(spaceType) || false;
  }

  return false;
}

/**
 * Check if an element is blocked (missing backend API)
 */
export function isElementBlocked(elementType: string): boolean {
  const blockedElements = ['study-spot-finder', 'dining-picker'];
  return blockedElements.includes(elementType);
}

/**
 * Get list of blocked elements in a tool
 */
export function getBlockedElements(elements: ToolElement[]): string[] {
  const blocked: string[] = [];

  elements.forEach(el => {
    const elementType = el.elementId || el.type || '';
    if (isElementBlocked(elementType)) {
      blocked.push(elementType);
    }
  });

  return blocked;
}

/**
 * Get element compatibility info
 */
export function getElementCompatibility(elementType: string): ElementCompatibility | null {
  return ELEMENT_CAPABILITIES[elementType] || null;
}

/**
 * Check if element requires space context
 */
export function requiresSpaceContext(elementType: string): boolean {
  const compat = ELEMENT_CAPABILITIES[elementType];
  if (!compat) return false;

  const spaceCapabilities: ElementCapability[] = [
    'space-read',
    'space-write',
    'member-list',
  ];

  return compat.capabilities.some(cap => spaceCapabilities.includes(cap));
}

/**
 * Get all element types that require space context
 */
export function getSpaceRequiredElements(): string[] {
  return Object.keys(ELEMENT_CAPABILITIES).filter(requiresSpaceContext);
}
