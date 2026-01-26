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
export * from './header-bar';
export * from './template-gallery';
export * from './start-zone';
export * from './floating-action-bar';
export * from './command-bar';
export * from './ai-chat-pill';
export * from './template-overlay';
export * from './ghost-element';
export * from './generation-overlay';
export * from './context-rail';
export * from './element-rail';
export * from './port-picker';
export * from './connection-config';

// Sprint 2: Context & Visibility Components
export * from './context-picker';
export * from './condition-builder';

// Sprint 3: Tool-to-Tool Connection Components
export * from './other-tools-panel';
export * from './connections-panel';
export * from './connection-builder-modal';
export * from './tool-reference-picker';

// Sprint 4: Automation Components
export * from './automations-panel';
export * from './automation-builder-modal';
export * from './automation-logs-viewer';

// IDE component primitives
export * from './components';

// State Management Context (Phase 2)
export * from './context';

// Element Renderer for live element preview
export * from './element-renderer';
