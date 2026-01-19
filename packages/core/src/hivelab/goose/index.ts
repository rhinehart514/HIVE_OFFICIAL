/**
 * Goose - Custom AI for HiveLab Tool Generation
 *
 * A specialized model training and inference system for generating
 * HiveLab tool compositions from natural language prompts.
 *
 * @module @hive/core/hivelab/goose
 */

// Export validator
export {
  validateToolComposition,
  validateElement,
  sanitizeComposition,
  parseModelOutput,
  isValidElementType,
  VALID_ELEMENT_TYPES,
  ELEMENT_PORTS,
  REQUIRED_CONFIG_FIELDS,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ToolComposition,
  type CanvasElement,
  type Connection,
  type ValidElementType,
} from './validator';

// Export system prompt builder
export {
  buildSystemPrompt,
  buildCompactSystemPrompt,
  buildUserPrompt,
  ELEMENT_CATALOG,
} from './system-prompt';

// Re-export training data generators (for CLI usage)
export type {
  TrainingExample,
} from './training/generate-dataset';
