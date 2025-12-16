/**
 * HiveLab IDE Components
 *
 * A Figma/VS Code-inspired tool builder (Cursor-like):
 * - Canvas-first layout with pan/zoom
 * - Element palette with drag-drop
 * - Layers panel for visual hierarchy
 * - Properties inspector
 * - AI command palette (Cmd+K) with selection-aware commands
 * - Smart guides for alignment (Figma-like)
 * - Snap to elements and grid
 * - Resize handles
 * - Keyboard shortcuts
 * - Undo/redo history
 * - Onboarding overlay for new users
 */

export * from './types';
export * from './hivelab-ide';
export * from './ide-toolbar';
export * from './ide-canvas';
export * from './ai-command-palette';
export * from './element-palette';
export * from './element-belt';
export * from './layers-panel';
export * from './properties-panel';
export * from './contextual-inspector';
export * from './use-ide-keyboard';
export * from './onboarding-overlay';
export * from './smart-guides';

// IDE component primitives
export * from './components';
