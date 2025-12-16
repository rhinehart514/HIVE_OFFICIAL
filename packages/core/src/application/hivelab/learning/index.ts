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

import type { Firestore } from 'firebase-admin/firestore';

// Internal imports for initializeLearningServices
import { initializePatternExtractor } from './pattern-extractor.service';
import { initializeConfigLearner } from './config-learner.service';
import { initializeContextRetriever } from './context-retriever.service';
import { initializePromptEnhancer } from './prompt-enhancer.service';

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
  db: Firestore,
  ai?: unknown
): void {
  initializePatternExtractor(db);
  initializeConfigLearner(db);
  initializeContextRetriever(db, ai);
  initializePromptEnhancer(db);
}
