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

// Composition validator service (re-export from application layer)
export {
  CompositionValidatorService,
  validateComposition,
  getCompositionValidator,
} from '../../../application/hivelab/validation/composition-validator.service';

// Quality gate service (re-export from application layer)
export {
  QualityGateService,
  gateComposition,
  getQualityGateService,
  DEFAULT_GATE_THRESHOLDS,
  type GateResult,
  type GateDecision,
  type GateThresholds,
  type AutoFix,
  type AutoFixType,
} from '../../../application/hivelab/validation/quality-gate.service';

// Generation tracker service (re-export from application layer)
export {
  GenerationTrackerService,
  getGenerationTrackerService,
  initializeGenerationTracker,
  type GenerationInput,
  type GenerationOutput,
  type GenerationTrackingData,
  type GenerationMetrics,
} from '../../../application/hivelab/validation/generation-tracker.service';

// Failure classifier service (re-export from application layer)
export {
  FailureClassifierService,
  getFailureClassifierService,
  initializeFailureClassifier,
  classifyFailureType,
  type FailureInput,
  type FailureStats,
} from '../../../application/hivelab/validation/failure-classifier.service';

// Edit tracker service (re-export from application layer)
export {
  EditTrackerService,
  getEditTrackerService,
  initializeEditTracker,
  type EditTrackingInput,
  type EditPatterns,
} from '../../../application/hivelab/validation/edit-tracker.service';

// AI Quality Pipeline (high-level facade)
export {
  AIQualityPipeline,
  getAIQualityPipeline,
  processComposition,
  validateOnly,
  initializeAIQualityPipeline,
  CURRENT_PROMPT_VERSION,
  type PipelineContext,
  type PipelineResult,
} from '../../../application/hivelab/validation/ai-quality-pipeline';
