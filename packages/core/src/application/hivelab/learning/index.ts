// @ts-nocheck
// TODO: Fix initialize function exports
/**
 * HiveLab AI Learning System
 *
 * Exports for the self-learning AI system:
 * - Pattern extraction (element co-occurrence, missing patterns)
 * - Config learning (drift detection, optimal configs)
 * - Context retrieval (RAG)
 * - Prompt enhancement (combining all context)
 * - Graduation (patterns → templates → elements)
 */

// Types
export * from './types';

// Pattern Extraction
export {
  PatternExtractorService,
  getPatternExtractorService,
  initializePatternExtractor,
  type PatternExtractionConfig,
} from './pattern-extractor.service';

// Config Learning
export {
  ConfigLearnerService,
  getConfigLearnerService,
  initializeConfigLearner,
  type ConfigLearnerConfig,
} from './config-learner.service';

// Context Retrieval (RAG)
export {
  ContextRetrieverService,
  getContextRetrieverService,
  initializeContextRetriever,
  type ContextRetrieverConfig,
} from './context-retriever.service';

// Prompt Enhancement
export {
  PromptEnhancerService,
  getPromptEnhancerService,
  initializePromptEnhancer,
  type PromptEnhancerConfig,
} from './prompt-enhancer.service';

// Graduation Service (when implemented)
// export {
//   GraduationService,
//   getGraduationService,
//   initializeGraduation,
// } from './graduation.service';

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize all learning services with Firestore
 */
export function initializeLearningServices(
  db: FirebaseFirestore.Firestore,
  ai?: unknown
): void {
  initializePatternExtractor(db);
  initializeConfigLearner(db);
  initializeContextRetriever(db, ai);
  initializePromptEnhancer(db);
}
