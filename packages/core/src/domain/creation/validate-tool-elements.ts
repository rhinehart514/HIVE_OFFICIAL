/**
 * Tool Element Validation
 *
 * Validates that tool elements are compatible with deployment contexts,
 * checking capabilities, space types, and blocked elements.
 */

import type { Firestore } from 'firebase-admin/firestore';
import {
  type ToolElement,
  getRequiredCapabilities,
  getBlockedElements,
  requiresSpaceContext,
} from './element-capabilities';
import {
  type SpaceCapabilityConfig,
  canSpaceSupportElements,
  buildSpaceCapabilityConfig,
  getPowerCapabilities,
  getSuggestedFixes,
} from '../spaces/space-capabilities';

/**
 * Element validation result
 */
export interface ElementValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  blockedElements?: string[];
  missingCapabilities?: string[];
  incompatibleElements?: string[];
  suggestedFixes?: string[];
}

/**
 * Target context for deployment
 */
export interface TargetContext {
  type: 'space' | 'profile';
  id: string;
}

/**
 * Validate tool elements against deployment context
 *
 * @param elements - Array of tool elements to validate
 * @param targetContext - Target deployment context
 * @param db - Firestore instance
 * @returns Validation result with errors and warnings
 */
export async function validateToolElements(
  elements: ToolElement[],
  targetContext: TargetContext,
  db: Firestore
): Promise<ElementValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for blocked elements (missing backend APIs)
  const blockedElements = getBlockedElements(elements);
  if (blockedElements.length > 0) {
    errors.push(
      `Tool contains blocked elements that are not yet ready: ${blockedElements.join(', ')}`
    );
    return {
      valid: false,
      errors,
      warnings,
      blockedElements,
    };
  }

  // Profile context has no capability restrictions (for now)
  if (targetContext.type === 'profile') {
    // Check if any elements require space context
    const spaceRequiredElements = elements.filter(el =>
      requiresSpaceContext(el.elementId || el.type || '')
    );

    if (spaceRequiredElements.length > 0) {
      const elementTypes = spaceRequiredElements
        .map(el => el.elementId || el.type || 'unknown')
        .join(', ');

      errors.push(
        `These elements require a space context and cannot be deployed to profiles: ${elementTypes}`
      );

      return {
        valid: false,
        errors,
        warnings,
        incompatibleElements: spaceRequiredElements.map(el => el.elementId || el.type || 'unknown'),
      };
    }

    // Profile deployments are valid if no space-required elements
    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  // Space context - validate compatibility
  if (targetContext.type === 'space') {
    // Fetch space configuration
    const spaceDoc = await db.collection('spaces').doc(targetContext.id).get();

    if (!spaceDoc.exists) {
      return {
        valid: false,
        errors: ['Space not found'],
        warnings: [],
      };
    }

    const spaceData = spaceDoc.data();

    if (!spaceData) {
      return {
        valid: false,
        errors: ['Space data is missing'],
        warnings: [],
      };
    }

    // Build space capability config
    const spaceConfig: SpaceCapabilityConfig = buildSpaceCapabilityConfig({
      id: targetContext.id,
      ...spaceData,
    });

    // Check element compatibility
    const compatibility = canSpaceSupportElements(spaceConfig, elements);

    if (!compatibility.compatible) {
      if (compatibility.missingCapabilities.length > 0) {
        errors.push(
          `Space lacks required capabilities: ${compatibility.missingCapabilities.join(', ')}`
        );
      }

      if (compatibility.incompatibleElements.length > 0) {
        errors.push(
          `Elements not compatible with ${spaceConfig.spaceType} space: ${compatibility.incompatibleElements.join(', ')}`
        );
      }

      // Get suggested fixes
      const suggestedFixes = getSuggestedFixes(compatibility.missingCapabilities);

      return {
        valid: false,
        errors,
        warnings,
        missingCapabilities: compatibility.missingCapabilities,
        incompatibleElements: compatibility.incompatibleElements,
        suggestedFixes,
      };
    }

    // Check for power capabilities (warnings only)
    const requiredCapabilities = getRequiredCapabilities(elements);
    const powerCapabilities = getPowerCapabilities(elements);

    if (powerCapabilities.length > 0) {
      warnings.push(
        `Tool uses power capabilities: ${powerCapabilities.join(', ')}. Review security implications carefully.`
      );
    }

    // All checks passed
    return {
      valid: true,
      errors: [],
      warnings,
    };
  }

  // Should not reach here
  return {
    valid: false,
    errors: ['Invalid target context type'],
    warnings: [],
  };
}

/**
 * Quick validation: check if tool can be deployed to profile
 */
export function canDeployToProfile(elements: ToolElement[]): {
  valid: boolean;
  reason?: string;
} {
  const blockedElements = getBlockedElements(elements);
  if (blockedElements.length > 0) {
    return {
      valid: false,
      reason: `Tool contains blocked elements: ${blockedElements.join(', ')}`,
    };
  }

  const spaceRequiredElements = elements.filter(el =>
    requiresSpaceContext(el.elementId || el.type || '')
  );

  if (spaceRequiredElements.length > 0) {
    const elementTypes = spaceRequiredElements
      .map(el => el.elementId || el.type || 'unknown')
      .join(', ');

    return {
      valid: false,
      reason: `These elements require a space context: ${elementTypes}`,
    };
  }

  return { valid: true };
}

/**
 * Get deployment recommendations based on element requirements
 */
export function getDeploymentRecommendations(elements: ToolElement[]): {
  canDeployToProfile: boolean;
  canDeployToSpace: boolean;
  recommendedContext: 'profile' | 'space' | 'either';
  reasons: string[];
} {
  const blockedElements = getBlockedElements(elements);
  const spaceRequired = elements.some(el =>
    requiresSpaceContext(el.elementId || el.type || '')
  );
  const powerCapabilities = getPowerCapabilities(elements);

  const reasons: string[] = [];

  if (blockedElements.length > 0) {
    return {
      canDeployToProfile: false,
      canDeployToSpace: false,
      recommendedContext: 'either',
      reasons: [`Tool contains blocked elements: ${blockedElements.join(', ')}`],
    };
  }

  if (spaceRequired) {
    reasons.push('Tool requires space-specific features (member lists, space data, etc.)');
    return {
      canDeployToProfile: false,
      canDeployToSpace: true,
      recommendedContext: 'space',
      reasons,
    };
  }

  if (powerCapabilities.length > 0) {
    reasons.push('Tool uses power capabilities; consider space deployment for better governance');
    return {
      canDeployToProfile: true,
      canDeployToSpace: true,
      recommendedContext: 'space',
      reasons,
    };
  }

  reasons.push('Tool uses standard capabilities and can be deployed anywhere');
  return {
    canDeployToProfile: true,
    canDeployToSpace: true,
    recommendedContext: 'either',
    reasons,
  };
}
