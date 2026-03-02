/**
 * HiveLab Validation Module
 *
 * Exports for AI quality measurement and validation.
 */

// Types
export * from './types';

// Element schemas
export {
  ELEMENT_CONFIG_SCHEMAS,
  getElementConfigSchema,
  validateElementConfig,
  getRequiredFields,
  isFieldRequired,
  ToolCompositionSchema,
  CanvasElementBaseSchema,
  ElementConnectionSchema,
  PositionSchema,
  SizeSchema,
} from './element-schemas';

// Tool composition validation (creation-time checks)
export {
  validateToolComposition,
  validateElement,
  validateConnection,
  type CanvasElementForValidation,
  type ConnectionForValidation,
  type CompositionValidationResult,
  type CompositionError,
  type CompositionWarning,
  type CompositionErrorCode,
  type CompositionWarningCode,
} from './validate-composition';

// Custom block code validation
export {
  validateCustomBlockCode,
} from './custom-block-validator';

// Application-layer validation services — REMOVED (deleted with application/hivelab/)
