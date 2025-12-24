/**
 * System Tool Registry
 *
 * Maps space types to default tools that should auto-deploy.
 * These tools make spaces useful from day one, before any leader claims them.
 */

import type { SpaceType } from './aggregates/enhanced-space';
import type { PlacementLocation } from './entities/placed-tool';

/**
 * System tool definition for auto-deployment
 */
export interface SystemToolDefinition {
  /** Tool ID (system tools use 'system:' prefix) */
  toolId: string;
  /** Where to place the tool */
  placement: PlacementLocation;
  /** Display order within placement */
  order: number;
  /** Default visibility */
  visibility: 'all' | 'members' | 'leaders';
  /** Whether leaders can remove/modify this placement */
  isEditable: boolean;
  /** Human-readable name for the tool */
  name: string;
  /** Brief description */
  description: string;
}

/**
 * Default tools by space type
 *
 * These are deployed automatically when a space is created.
 * Pre-seeded (ublinked) spaces get these immediately.
 * User-created spaces get them after going live.
 */
export const SYSTEM_TOOLS_BY_TYPE: Record<SpaceType, SystemToolDefinition[]> = {
  /**
   * UNI spaces: Official university entities
   * Focus: Announcements, events, professional appearance
   */
  uni: [
    {
      toolId: 'system:announcements',
      placement: 'sidebar',
      order: 0,
      visibility: 'all',
      isEditable: true,
      name: 'Announcements',
      description: 'Official announcements from space leaders'
    },
    {
      toolId: 'system:events',
      placement: 'sidebar',
      order: 1,
      visibility: 'all',
      isEditable: true,
      name: 'Events',
      description: 'Upcoming events and activities'
    },
    {
      toolId: 'system:links',
      placement: 'sidebar',
      order: 2,
      visibility: 'all',
      isEditable: true,
      name: 'Quick Links',
      description: 'Important links and resources'
    }
  ],

  /**
   * STUDENT spaces: Clubs, orgs, interest groups
   * Focus: Engagement, coordination, community
   */
  student: [
    {
      toolId: 'system:events',
      placement: 'sidebar',
      order: 0,
      visibility: 'all',
      isEditable: true,
      name: 'Events',
      description: 'Upcoming events and meetings'
    },
    {
      toolId: 'system:quick-poll',
      placement: 'sidebar',
      order: 1,
      visibility: 'all',
      isEditable: true,
      name: 'Quick Poll',
      description: 'Get quick feedback from members'
    },
    {
      toolId: 'system:links',
      placement: 'sidebar',
      order: 2,
      visibility: 'all',
      isEditable: true,
      name: 'Resources',
      description: 'Shared links and documents'
    }
  ],

  /**
   * GREEK spaces: Fraternities, sororities, councils
   * Focus: Rush, points tracking, philanthropy
   */
  greek: [
    {
      toolId: 'system:events',
      placement: 'sidebar',
      order: 0,
      visibility: 'all',
      isEditable: true,
      name: 'Events',
      description: 'Chapter events and rush dates'
    },
    {
      toolId: 'system:points-tracker',
      placement: 'sidebar',
      order: 1,
      visibility: 'members',
      isEditable: true,
      name: 'Points Tracker',
      description: 'Track participation and points'
    },
    {
      toolId: 'system:quick-poll',
      placement: 'sidebar',
      order: 2,
      visibility: 'all',
      isEditable: true,
      name: 'Quick Poll',
      description: 'Vote on chapter decisions'
    }
  ],

  /**
   * RESIDENTIAL spaces: Dorms, floors, housing
   * Focus: Community, introductions, local coordination
   */
  residential: [
    {
      toolId: 'system:floor-poll',
      placement: 'sidebar',
      order: 0,
      visibility: 'all',
      isEditable: true,
      name: 'Floor Poll',
      description: 'Vote on floor activities and decisions'
    },
    {
      toolId: 'system:events',
      placement: 'sidebar',
      order: 1,
      visibility: 'all',
      isEditable: true,
      name: 'Floor Events',
      description: 'RA events and floor activities'
    },
    {
      toolId: 'system:member-intro',
      placement: 'sidebar',
      order: 2,
      visibility: 'members',
      isEditable: true,
      name: 'Meet Your Neighbors',
      description: 'Introduce yourself to the floor'
    }
  ]
};

/**
 * Get system tools for a space type
 */
export function getSystemToolsForType(spaceType: SpaceType): SystemToolDefinition[] {
  return SYSTEM_TOOLS_BY_TYPE[spaceType] || SYSTEM_TOOLS_BY_TYPE.student;
}

/**
 * Check if a tool ID is a system tool
 */
export function isSystemTool(toolId: string): boolean {
  return toolId.startsWith('system:');
}

/**
 * Get all unique system tool IDs across all space types
 */
export function getAllSystemToolIds(): string[] {
  const toolIds = new Set<string>();
  for (const tools of Object.values(SYSTEM_TOOLS_BY_TYPE)) {
    for (const tool of tools) {
      toolIds.add(tool.toolId);
    }
  }
  return Array.from(toolIds);
}

/**
 * Inline tools available in chat composer
 * These can be inserted into messages via the "+" button
 */
export const INLINE_TOOLS: SystemToolDefinition[] = [
  {
    toolId: 'system:inline-poll',
    placement: 'inline',
    order: 0,
    visibility: 'all',
    isEditable: false,
    name: 'Poll',
    description: 'Create a quick poll in chat'
  },
  {
    toolId: 'system:inline-rsvp',
    placement: 'inline',
    order: 1,
    visibility: 'all',
    isEditable: false,
    name: 'RSVP',
    description: 'Collect RSVPs for an event'
  },
  {
    toolId: 'system:inline-question',
    placement: 'inline',
    order: 2,
    visibility: 'all',
    isEditable: false,
    name: 'Question',
    description: 'Ask a question with reactions'
  },
  {
    toolId: 'system:inline-countdown',
    placement: 'inline',
    order: 3,
    visibility: 'all',
    isEditable: false,
    name: 'Countdown',
    description: 'Add a countdown timer'
  }
];

/**
 * Get inline tools available for chat composer
 */
export function getInlineTools(): SystemToolDefinition[] {
  return INLINE_TOOLS;
}
