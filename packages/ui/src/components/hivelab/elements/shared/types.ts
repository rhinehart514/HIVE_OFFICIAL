/**
 * Shared types for HiveLab elements
 */

import type { ElementProps } from '../../../../lib/hivelab/element-system';

export type { ElementProps };

export type ElementRenderer = (props: ElementProps) => React.JSX.Element;

export interface ElementRegistryEntry {
  component: ElementRenderer;
  category: 'universal' | 'connected' | 'space';
  displayName: string;
}
