/**
 * Mock AI Generator - Backwards Compatibility Re-exports
 *
 * This file re-exports from the modular ai-generator/ directory.
 * All functionality has been split into focused modules:
 * - intent-detection.ts: Intent types and detection logic
 * - refinement.ts: Refinement/iteration detection
 * - element-composition.ts: Element specs and composition
 * - tool-naming.ts: Name generation from prompts
 * - index.ts: Main streaming generator
 */

// Re-export everything from the modular structure
export * from './ai-generator';

// Re-export main generator for default import compatibility
export { mockGenerateToolStreaming } from './ai-generator';
