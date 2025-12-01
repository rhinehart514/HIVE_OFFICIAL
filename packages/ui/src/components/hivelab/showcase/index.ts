/**
 * Element Showcase Components
 *
 * ChatGPT-style showcase for HiveLab's 14 element types.
 * Organized into 4 problem-first bundles to reduce overwhelm and spark inspiration.
 */

// Components
export { ElementShowcase } from './ElementShowcase';
export type { ElementShowcaseProps } from './ElementShowcase';

export { ElementBundleCard } from './ElementBundleCard';
export type { ElementBundleCardProps } from './ElementBundleCard';

export {
  ElementShowcaseGrid,
  ElementShowcaseSidebar,
} from './ElementShowcaseGrid';
export type {
  ElementShowcaseGridProps,
  ElementShowcaseSidebarProps,
} from './ElementShowcaseGrid';

// Hooks
export { useElementShowcase } from './hooks/useElementShowcase';
export type {
  ShowcaseState,
  UseElementShowcaseOptions,
  UseElementShowcaseReturn,
} from './hooks/useElementShowcase';

// Data & Types
export {
  ELEMENT_BUNDLES,
  ELEMENT_SHOWCASE_DATA,
  BUNDLE_ORDER,
  getBundleElements,
  getElementBundle,
  getAllShowcaseElements,
  getRandomPrompt,
} from './element-showcase-data';
export type {
  ElementBundleDefinition,
  ElementShowcaseMetadata,
} from './element-showcase-data';
