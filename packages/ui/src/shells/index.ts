/**
 * HIVE Experience Shells
 *
 * 5 distinct page layouts for different experiences:
 * - VoidShell: Auth, onboarding, verification
 * - StreamShell: Feed, lists, notifications
 * - CanvasShell: Tools, editors, HiveLab
 * - ProfileShell: Profile, space pages
 * - GridShell: Discovery, galleries
 */

export { VoidShell } from './VoidShell';
export { StreamShell, streamItemVariants } from './StreamShell';
export { CanvasShell } from './CanvasShell';
export { ProfileShell, profileCardVariants, statCounterVariants } from './ProfileShell';
export { GridShell, gridItemVariants, gridCardHoverEffect } from './GridShell';
