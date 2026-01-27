/**
 * HiveLab Element-to-Capability Mapping
 *
 * Single source of truth for which capabilities each element requires.
 * Used for:
 * - Deploy-time validation (can this trust tier deploy this tool?)
 * - Execute-time enforcement (does this deployment have the required capability?)
 */

import type { ToolCapabilities } from './capabilities';

// =============================================================================
// Element Capability Requirements
// =============================================================================

/**
 * Maps element IDs to the capabilities they require to function.
 * Elements not listed here are considered "safe" (no special capabilities needed).
 */
export const ELEMENT_CAPABILITY_REQUIREMENTS: Record<string, (keyof ToolCapabilities)[]> = {
  // Space-scoped elements (need space context)
  'member-list': ['read_space_members'],
  'member-selector': ['read_space_members'],
  'user-selector': ['read_space_members'],
  'space-stats': ['read_space_context'],
  'space-feed': ['read_space_context', 'write_shared_state'],
  'space-events': ['read_space_context', 'write_shared_state'],
  'leaderboard': ['read_space_members', 'read_space_context'],
  'role-gate': ['read_space_members', 'read_space_context'],
  'announcement': ['read_space_context', 'write_shared_state'],

  // Interactive elements (need shared state)
  'poll-element': ['write_shared_state'],
  'rsvp-button': ['write_shared_state'],
  'counter': ['write_shared_state'],

  // Power elements (can trigger side effects)
  'notification-center': ['send_notifications'],
  'notification-sender': ['send_notifications'],

  // Safe elements (no capabilities needed) - explicitly listed for clarity
  'text-block': [],
  'button': [],
  'image': [],
  'divider': [],
  'spacer': [],
  'search-input': [],
  'date-picker': [],
  'form-builder': [],
  'filter-selector': [],
  'result-list': [],
  'tag-cloud': [],
  'chart-display': [],
  'map-view': [],
  'countdown-timer': [],
  'timer': [],
  'tabs-container': [],
  'card-container': [],
};

// =============================================================================
// Action-Level Capability Requirements
// =============================================================================

/**
 * Maps element ID + action to required capabilities.
 * This is more granular than element-level - some elements may have
 * actions that require additional capabilities beyond the base element.
 */
export const ACTION_CAPABILITY_REQUIREMENTS: Record<string, Record<string, (keyof ToolCapabilities)[]>> = {
  'member-list': {
    load: ['read_space_members'],
    filter: ['read_space_members'],
    select: ['read_space_members'],
  },
  'member-selector': {
    load: ['read_space_members'],
    select: ['read_space_members'],
    search: ['read_space_members'],
  },
  'user-selector': {
    load: ['read_space_members'],
    select: ['read_space_members'],
  },
  'leaderboard': {
    load: ['read_space_members', 'read_space_context'],
    refresh: ['read_space_members', 'read_space_context'],
  },
  'poll-element': {
    vote: ['write_shared_state'],
    load: [],
    close: ['write_shared_state'],
  },
  'rsvp-button': {
    rsvp: ['write_shared_state'],
    load: [],
    cancel: ['write_shared_state'],
  },
  'notification-sender': {
    send: ['send_notifications'],
  },
  'announcement': {
    post: ['write_shared_state'],
    notify: ['send_notifications'],
    load: ['read_space_context'],
  },
  'space-feed': {
    load: ['read_space_context'],
    post: ['write_shared_state'],
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get capabilities required by an element to be deployed.
 * Returns empty array for unknown elements (permissive by default).
 */
export function getElementRequiredCapabilities(elementId: string): (keyof ToolCapabilities)[] {
  return ELEMENT_CAPABILITY_REQUIREMENTS[elementId] || [];
}

/**
 * Get capabilities required for a specific action on an element.
 * Falls back to element-level requirements if no action-specific mapping exists.
 */
export function getActionRequiredCapabilities(
  elementId: string,
  action: string
): (keyof ToolCapabilities)[] {
  const actionCaps = ACTION_CAPABILITY_REQUIREMENTS[elementId]?.[action];
  if (actionCaps !== undefined) {
    return actionCaps;
  }
  // Fall back to element-level requirements
  return getElementRequiredCapabilities(elementId);
}

/**
 * Check if a deployment's capabilities satisfy an element's requirements.
 */
export function deploymentHasElementCapabilities(
  deploymentCapabilities: Partial<ToolCapabilities> | undefined,
  elementId: string
): { allowed: boolean; missing: (keyof ToolCapabilities)[] } {
  const required = getElementRequiredCapabilities(elementId);
  const missing: (keyof ToolCapabilities)[] = [];

  for (const cap of required) {
    const value = deploymentCapabilities?.[cap];
    // Handle boolean and array capabilities
    const hasIt = Array.isArray(value) ? value.length > 0 : Boolean(value);
    if (!hasIt) {
      missing.push(cap);
    }
  }

  return {
    allowed: missing.length === 0,
    missing,
  };
}

/**
 * Check if a deployment's capabilities satisfy an action's requirements.
 */
export function deploymentHasActionCapabilities(
  deploymentCapabilities: Partial<ToolCapabilities> | undefined,
  elementId: string,
  action: string
): { allowed: boolean; missing: (keyof ToolCapabilities)[] } {
  const required = getActionRequiredCapabilities(elementId, action);
  const missing: (keyof ToolCapabilities)[] = [];

  for (const cap of required) {
    const value = deploymentCapabilities?.[cap];
    const hasIt = Array.isArray(value) ? value.length > 0 : Boolean(value);
    if (!hasIt) {
      missing.push(cap);
    }
  }

  return {
    allowed: missing.length === 0,
    missing,
  };
}

/**
 * Get all unique capabilities required by a set of elements.
 */
export function getToolRequiredCapabilities(
  elementIds: string[]
): (keyof ToolCapabilities)[] {
  const caps = new Set<keyof ToolCapabilities>();

  for (const elementId of elementIds) {
    const required = getElementRequiredCapabilities(elementId);
    required.forEach(cap => caps.add(cap));
  }

  return Array.from(caps);
}

// =============================================================================
// Trust Tier Capability Limits
// =============================================================================

/**
 * Maximum capabilities allowed for each trust tier.
 * Unverified users can only use safe lane capabilities.
 */
export const TRUST_TIER_CAPABILITY_LIMITS: Record<string, (keyof ToolCapabilities)[]> = {
  unverified: ['read_own_state', 'write_own_state'],
  community: ['read_own_state', 'write_own_state', 'write_shared_state'],
  verified: [
    'read_own_state',
    'write_own_state',
    'write_shared_state',
    'read_space_context',
    'read_space_members',
    'create_posts',
    'send_notifications',
    'trigger_automations',
  ],
  system: [
    'read_own_state',
    'write_own_state',
    'write_shared_state',
    'read_space_context',
    'read_space_members',
    'create_posts',
    'send_notifications',
    'trigger_automations',
    'objects_read',
    'objects_write',
    'objects_delete',
  ],
};

/**
 * Check if a trust tier can use a capability.
 */
export function trustTierAllowsCapability(
  trustTier: string,
  capability: keyof ToolCapabilities
): boolean {
  const allowed = TRUST_TIER_CAPABILITY_LIMITS[trustTier] || TRUST_TIER_CAPABILITY_LIMITS.unverified;
  return allowed.includes(capability);
}

/**
 * Validate that all elements in a tool can be deployed at a given trust tier.
 */
export function validateToolTrustTier(
  elementIds: string[],
  trustTier: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allowedCaps = TRUST_TIER_CAPABILITY_LIMITS[trustTier] || TRUST_TIER_CAPABILITY_LIMITS.unverified;

  for (const elementId of elementIds) {
    const required = getElementRequiredCapabilities(elementId);
    for (const cap of required) {
      if (!allowedCaps.includes(cap)) {
        errors.push(`Element "${elementId}" requires "${cap}" not available at ${trustTier} trust tier`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
