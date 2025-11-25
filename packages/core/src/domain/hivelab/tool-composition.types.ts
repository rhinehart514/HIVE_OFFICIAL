/**
 * HiveLab Tool Composition Types
 *
 * Core domain types for tool composition and element system.
 */

/**
 * Element instance on the canvas
 */
export interface CanvasElement {
  /** Element type ID (e.g., 'search-input', 'form-builder') */
  elementId: string;

  /** Unique instance ID on canvas (e.g., 'elem_001') */
  instanceId: string;

  /** Element-specific configuration */
  config: Record<string, any>;

  /** Position on canvas */
  position: { x: number; y: number };

  /** Size of element */
  size: { width: number; height: number };
}

/**
 * Connection between elements (data flow)
 */
export interface ElementConnection {
  /** Source element and output */
  from: { instanceId: string; output: string };

  /** Target element and input */
  to: { instanceId: string; input: string };
}

/**
 * Tool composition - complete definition of a canvas tool
 */
export interface ToolComposition {
  /** Unique tool ID */
  id: string;

  /** Tool name */
  name: string;

  /** Tool description */
  description: string;

  /** Elements placed on canvas */
  elements: CanvasElement[];

  /** Connections between elements */
  connections: ElementConnection[];

  /** Layout type */
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

/**
 * Element category types
 */
export type ElementCategory = 'input' | 'display' | 'filter' | 'action' | 'layout';

/**
 * Element definition (registry entry)
 */
export interface ElementDefinition {
  id: string;
  name: string;
  description: string;
  category: ElementCategory;
  icon: string;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
}
