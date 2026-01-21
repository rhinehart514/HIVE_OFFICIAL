/**
 * Space Capability Checker
 *
 * Determines what capabilities a space supports based on its configuration,
 * and validates if tools can be deployed to specific spaces.
 */

import {
  type ElementCapability,
  type ToolElement,
  getRequiredCapabilities,
  validateSpaceTypeCompatibility,
} from '../creation/element-capabilities';

/**
 * Space configuration for capability checking
 */
export interface SpaceCapabilityConfig {
  spaceId: string;
  spaceType: string;
  isPublic: boolean;
  features?: {
    chat?: boolean;
    events?: boolean;
    notifications?: boolean;
    webhooks?: boolean;
    externalApi?: boolean;
    moderation?: boolean;
  };
}

/**
 * Element validation result
 */
export interface ElementValidationResult {
  compatible: boolean;
  missingCapabilities: ElementCapability[];
  incompatibleElements: string[];
  details: string[];
}

/**
 * Get all capabilities a space supports based on its configuration
 */
export function getSpaceCapabilities(config: SpaceCapabilityConfig): ElementCapability[] {
  const capabilities: ElementCapability[] = [
    'public-read',      // All spaces support read
    'user-write',       // All spaces support user writes
    'space-read',       // All spaces support reading their own data
    'space-write',      // All spaces support writing their own data
    'member-list',      // All spaces support member lists
  ];

  // Add capabilities based on enabled features
  if (config.features?.notifications) {
    capabilities.push('notification');
  }

  if (config.features?.webhooks) {
    capabilities.push('webhook');
  }

  if (config.features?.externalApi) {
    capabilities.push('external-api');
  }

  if (config.features?.moderation) {
    capabilities.push('moderation');
  }

  return capabilities;
}

/**
 * Check if a space can support a set of elements
 */
export function canSpaceSupportElements(
  spaceConfig: SpaceCapabilityConfig,
  elements: ToolElement[]
): ElementValidationResult {
  const spaceCapabilities = getSpaceCapabilities(spaceConfig);
  const requiredCapabilities = getRequiredCapabilities(elements);
  const details: string[] = [];

  // Check for missing capabilities
  const missingCapabilities = requiredCapabilities.filter(
    cap => !spaceCapabilities.includes(cap)
  );

  if (missingCapabilities.length > 0) {
    details.push(`Space lacks capabilities: ${missingCapabilities.join(', ')}`);
  }

  // Check for space type incompatibilities
  const incompatibleElements = elements
    .filter(el => {
      const elementType = el.elementId || el.type || '';
      return !validateSpaceTypeCompatibility(elementType, spaceConfig.spaceType);
    })
    .map(el => el.elementId || el.type || 'unknown');

  if (incompatibleElements.length > 0) {
    details.push(
      `Elements incompatible with ${spaceConfig.spaceType} space: ${incompatibleElements.join(', ')}`
    );
  }

  return {
    compatible: missingCapabilities.length === 0 && incompatibleElements.length === 0,
    missingCapabilities,
    incompatibleElements,
    details,
  };
}

/**
 * Check if a space feature is enabled
 */
export function isFeatureEnabled(
  config: SpaceCapabilityConfig,
  feature: keyof NonNullable<SpaceCapabilityConfig['features']>
): boolean {
  return config.features?.[feature] || false;
}

/**
 * Get human-readable capability description
 */
export function getCapabilityDescription(capability: ElementCapability): string {
  const descriptions: Record<ElementCapability, string> = {
    'public-read': 'Anyone can view',
    'user-write': 'User can save their own data',
    'space-read': 'Can read space data',
    'space-write': 'Can write to space',
    'member-list': 'Can access member list',
    'external-api': 'Can call external APIs',
    'webhook': 'Can receive webhooks',
    'notification': 'Can send notifications',
    'moderation': 'Can perform moderation actions',
  };

  return descriptions[capability] || 'Unknown capability';
}

/**
 * Get suggested actions to fix capability mismatches
 */
export function getSuggestedFixes(
  missingCapabilities: ElementCapability[]
): string[] {
  const fixes: string[] = [];

  if (missingCapabilities.includes('notification')) {
    fixes.push('Enable notifications feature for this space');
  }

  if (missingCapabilities.includes('webhook')) {
    fixes.push('Enable webhooks feature for this space');
  }

  if (missingCapabilities.includes('external-api')) {
    fixes.push('Enable external API feature for this space');
  }

  if (missingCapabilities.includes('moderation')) {
    fixes.push('Enable moderation feature for this space');
  }

  return fixes;
}

/**
 * Determine if a capability is "power-tier" (requires elevated permissions)
 */
export function isPowerCapability(capability: ElementCapability): boolean {
  const powerCapabilities: ElementCapability[] = [
    'external-api',
    'webhook',
    'notification',
    'moderation',
  ];

  return powerCapabilities.includes(capability);
}

/**
 * Get all power capabilities required by elements
 */
export function getPowerCapabilities(elements: ToolElement[]): ElementCapability[] {
  const required = getRequiredCapabilities(elements);
  return required.filter(isPowerCapability);
}

/**
 * Build default space capability config from space data
 */
export function buildSpaceCapabilityConfig(
  spaceData: Record<string, unknown>
): SpaceCapabilityConfig {
  return {
    spaceId: String(spaceData.id || ''),
    spaceType: String(spaceData.spaceType || spaceData.type || 'general'),
    isPublic: spaceData.visibility === 'public',
    features: {
      chat: Boolean((spaceData.features as Record<string, unknown>)?.chat),
      events: Boolean((spaceData.features as Record<string, unknown>)?.events),
      notifications: Boolean((spaceData.features as Record<string, unknown>)?.notifications),
      webhooks: Boolean((spaceData.features as Record<string, unknown>)?.webhooks),
      externalApi: Boolean((spaceData.features as Record<string, unknown>)?.externalApi),
      moderation: Boolean((spaceData.features as Record<string, unknown>)?.moderation),
    },
  };
}
