/**
 * HIVE Experience Shells - 4 Canonical Layouts
 *
 * Phase 2 (Dec 2025): Consolidated to 4 primary layouts
 *
 * CANONICAL LAYOUTS:
 * - FOCUS (VoidShell): Auth, onboarding, settings, single-task flows
 * - CONVERSATION (ConversationShell): Space chat, feed, notifications
 * - BROWSE (BrowseShell): Discovery, tool gallery, member lists
 * - CANVAS (CanvasShell): HiveLab IDE, admin dashboards
 *
 * SPECIALIZED (for specific contexts):
 * - StreamShell: Legacy feed layout (use ConversationShell for new)
 * - ProfileShell: Bento grid profile pages
 * - GridShell: Generic grid layout
 */

// Canonical Layouts (Phase 2)
export { VoidShell } from './VoidShell';
export { ConversationShell } from './ConversationShell';
export { BrowseShell, browseItemVariants } from './BrowseShell';
export { CanvasShell } from './CanvasShell';

// Specialized Layouts
export { StreamShell, streamItemVariants } from './StreamShell';
export { ProfileShell, profileCardVariants, statCounterVariants } from './ProfileShell';
export { GridShell, gridItemVariants, gridCardHoverEffect } from './GridShell';
