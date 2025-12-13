/**
 * Prompt Enhancer Service
 *
 * Layers all learned context into AI generation prompts:
 * 1. System prompt (static)
 * 2. Retrieved context (RAG)
 * 3. Learned patterns (affinities, missing elements)
 * 4. Config hints (drift corrections)
 * 5. Space context (from user)
 *
 * This is the final assembly point before sending to Gemini.
 */

import type {
  EnhancedPrompt,
  PromptEnhancementOptions,
  LearnedPatterns,
  RetrievedContext,
  ConfigDrift,
  ElementAffinity,
  MissingPattern,
} from './types';
import { getContextRetrieverService, ContextRetrieverService } from './context-retriever.service';

// ═══════════════════════════════════════════════════════════════════
// ENHANCEMENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  /** Whether to enable RAG by default */
  enableRAG: true,

  /** Whether to enable pattern hints by default */
  enablePatterns: true,

  /** Whether to enable config hints by default */
  enableConfigHints: true,

  /** Maximum tokens for RAG context */
  ragTokenBudget: 800,

  /** Maximum tokens for pattern hints */
  patternTokenBudget: 400,

  /** Maximum tokens for config hints */
  configTokenBudget: 300,

  /** Maximum total context tokens */
  maxTotalContextTokens: 2000,

  /** Cache TTL for patterns in ms */
  patternCacheTTLMs: 5 * 60 * 1000, // 5 minutes
};

export type PromptEnhancerConfig = typeof DEFAULT_CONFIG;

// ═══════════════════════════════════════════════════════════════════
// PROMPT ENHANCER SERVICE
// ═══════════════════════════════════════════════════════════════════

export class PromptEnhancerService {
  private db: FirebaseFirestore.Firestore | null = null;
  private config: PromptEnhancerConfig;
  private contextRetriever: ContextRetrieverService;
  private patternCache: { patterns: LearnedPatterns | null; timestamp: number } = {
    patterns: null,
    timestamp: 0,
  };

  constructor(
    options: {
      db?: FirebaseFirestore.Firestore;
      contextRetriever?: ContextRetrieverService;
      config?: Partial<PromptEnhancerConfig>;
    } = {}
  ) {
    this.db = options.db || null;
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.contextRetriever = options.contextRetriever || getContextRetrieverService();
  }

  /**
   * Set Firestore instance
   */
  setFirestore(db: FirebaseFirestore.Firestore): void {
    this.db = db;
  }

  // ═════════════════════════════════════════════════════════════════
  // MAIN ENHANCEMENT
  // ═════════════════════════════════════════════════════════════════

  /**
   * Enhance a user prompt with all available context
   */
  async enhancePrompt(
    userPrompt: string,
    systemPrompt: string,
    options: PromptEnhancementOptions = {}
  ): Promise<EnhancedPrompt> {
    const startTime = Date.now();
    const layers: EnhancedPrompt['layers'] = ['system'];
    const tokenBudget: EnhancedPrompt['tokenBudget'] = {
      system: this.estimateTokens(systemPrompt),
      rag: 0,
      patterns: 0,
      config: 0,
      space: 0,
      user: this.estimateTokens(userPrompt),
      total: 0,
    };

    const parts: string[] = [systemPrompt];

    // ─────────────────────────────────────────────────────────────────
    // Layer 1: RAG - Retrieved Context
    // ─────────────────────────────────────────────────────────────────
    let retrievalTimeMs = 0;
    if (options.useRAG !== false && this.config.enableRAG) {
      try {
        const retrievedContext = await this.contextRetriever.retrieveContext(userPrompt, {
          category: options.spaceContext?.category,
        });
        retrievalTimeMs = retrievedContext.retrievalTime;

        const ragSection = this.contextRetriever.formatForPrompt(retrievedContext);
        const ragTokens = this.estimateTokens(ragSection);

        if (ragTokens > 0 && ragTokens <= this.config.ragTokenBudget) {
          parts.push(ragSection);
          layers.push('rag');
          tokenBudget.rag = ragTokens;
        }
      } catch (error) {
        console.error('[PromptEnhancer] RAG retrieval failed:', error);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Layer 2: Learned Patterns
    // ─────────────────────────────────────────────────────────────────
    let patternLoadTimeMs = 0;
    if (options.usePatterns !== false && this.config.enablePatterns) {
      try {
        const patternStart = Date.now();
        const patterns = await this.loadPatterns();
        patternLoadTimeMs = Date.now() - patternStart;

        if (patterns) {
          const patternSection = this.formatPatternHints(patterns, userPrompt);
          const patternTokens = this.estimateTokens(patternSection);

          if (patternTokens > 0 && patternTokens <= this.config.patternTokenBudget) {
            parts.push(patternSection);
            layers.push('patterns');
            tokenBudget.patterns = patternTokens;
          }
        }
      } catch (error) {
        console.error('[PromptEnhancer] Pattern loading failed:', error);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Layer 3: Config Hints
    // ─────────────────────────────────────────────────────────────────
    if (options.useConfigHints !== false && this.config.enableConfigHints) {
      try {
        const patterns = await this.loadPatterns();
        if (patterns?.configDrifts.length) {
          const configSection = this.formatConfigHints(patterns.configDrifts);
          const configTokens = this.estimateTokens(configSection);

          if (configTokens > 0 && configTokens <= this.config.configTokenBudget) {
            parts.push(configSection);
            layers.push('config');
            tokenBudget.config = configTokens;
          }
        }
      } catch (error) {
        console.error('[PromptEnhancer] Config hint loading failed:', error);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Layer 4: Space Context (from user)
    // ─────────────────────────────────────────────────────────────────
    if (options.spaceContext) {
      const spaceSection = this.formatSpaceContext(options.spaceContext);
      const spaceTokens = this.estimateTokens(spaceSection);
      parts.push(spaceSection);
      layers.push('space');
      tokenBudget.space = spaceTokens;
    }

    // ─────────────────────────────────────────────────────────────────
    // Final Assembly
    // ─────────────────────────────────────────────────────────────────
    parts.push(`## User Request\n${userPrompt}`);

    const fullPrompt = parts.join('\n\n');
    tokenBudget.total = this.estimateTokens(fullPrompt);

    return {
      prompt: fullPrompt,
      layers,
      tokenBudget,
      metadata: {
        retrievalTimeMs,
        patternLoadTimeMs,
        totalEnhancementTimeMs: Date.now() - startTime,
        patternsVersion: this.patternCache.patterns?.version,
      },
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // PATTERN LOADING
  // ═════════════════════════════════════════════════════════════════

  /**
   * Load learned patterns from Firestore
   */
  private async loadPatterns(): Promise<LearnedPatterns | null> {
    // Check cache
    if (
      this.patternCache.patterns &&
      Date.now() - this.patternCache.timestamp < this.config.patternCacheTTLMs
    ) {
      return this.patternCache.patterns;
    }

    if (!this.db) {
      return null;
    }

    try {
      const doc = await this.db.collection('ai_learned_patterns').doc('latest').get();

      if (!doc.exists) {
        return null;
      }

      const patterns = doc.data() as LearnedPatterns;

      // Update cache
      this.patternCache = {
        patterns,
        timestamp: Date.now(),
      };

      return patterns;
    } catch (error) {
      console.error('[PromptEnhancer] Error loading patterns:', error);
      return null;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // FORMATTING HELPERS
  // ═════════════════════════════════════════════════════════════════

  /**
   * Format pattern hints for prompt injection
   */
  private formatPatternHints(patterns: LearnedPatterns, userPrompt: string): string {
    const sections: string[] = [];

    // Find relevant affinities based on prompt
    const relevantAffinities = this.findRelevantAffinities(patterns.affinities, userPrompt);
    if (relevantAffinities.length > 0) {
      const affinityHints = relevantAffinities
        .slice(0, 3)
        .map(a => `- When using ${a.elementA}, consider also using ${a.elementB} (they work well together ${Math.round(a.conditionalProbability * 100)}% of the time)`);
      sections.push(`### Element Combinations That Work Well\n${affinityHints.join('\n')}`);
    }

    // Add missing pattern hints
    const relevantMissing = this.findRelevantMissingPatterns(patterns.missingPatterns, userPrompt);
    if (relevantMissing.length > 0) {
      const missingHints = relevantMissing
        .slice(0, 3)
        .map(m => `- When generating ${m.generatedElement}, users often add ${m.missingElement} (${Math.round(m.additionRate * 100)}% of the time) - consider including it`);
      sections.push(`### Commonly Needed Additions\n${missingHints.join('\n')}`);
    }

    // Add over-generation warnings
    if (patterns.overGenerationPatterns.length > 0) {
      const overGenHints = patterns.overGenerationPatterns
        .slice(0, 2)
        .map(o => `- Avoid ${o.removedElement} unless specifically requested (removed ${Math.round(o.removalRate * 100)}% of the time)`);
      sections.push(`### Elements to Use Sparingly\n${overGenHints.join('\n')}`);
    }

    if (sections.length === 0) {
      return '';
    }

    return `## Learned Patterns\n\n${sections.join('\n\n')}`;
  }

  /**
   * Find affinities relevant to the user prompt
   */
  private findRelevantAffinities(
    affinities: ElementAffinity[],
    prompt: string
  ): ElementAffinity[] {
    const promptLower = prompt.toLowerCase();

    // Keywords that might indicate element types
    const elementKeywords: Record<string, string[]> = {
      'poll': ['poll', 'vote', 'voting', 'survey'],
      'form': ['form', 'submit', 'input', 'register', 'signup'],
      'search': ['search', 'find', 'look up', 'lookup'],
      'countdown': ['countdown', 'timer', 'deadline', 'time left'],
      'leaderboard': ['leaderboard', 'ranking', 'standings', 'scores'],
      'chart': ['chart', 'graph', 'visualization', 'analytics'],
      'rsvp': ['rsvp', 'attendance', 'attend', 'signup', 'event'],
    };

    // Find which element types are relevant to the prompt
    const relevantTypes = new Set<string>();
    for (const [element, keywords] of Object.entries(elementKeywords)) {
      if (keywords.some(kw => promptLower.includes(kw))) {
        relevantTypes.add(element);
      }
    }

    if (relevantTypes.size === 0) {
      // Return top affinities by lift score
      return affinities.slice(0, 5);
    }

    // Filter affinities that involve relevant element types
    return affinities.filter(
      a => relevantTypes.has(a.elementA.split('-')[0]) ||
           relevantTypes.has(a.elementB.split('-')[0])
    );
  }

  /**
   * Find missing patterns relevant to the user prompt
   */
  private findRelevantMissingPatterns(
    patterns: MissingPattern[],
    prompt: string
  ): MissingPattern[] {
    // Similar logic to affinities
    const promptLower = prompt.toLowerCase();

    const elementKeywords: Record<string, string[]> = {
      'poll': ['poll', 'vote', 'voting'],
      'form': ['form', 'submit', 'input'],
      'countdown': ['countdown', 'timer', 'deadline'],
      'event': ['event', 'rsvp', 'attendance'],
    };

    const relevantTypes = new Set<string>();
    for (const [element, keywords] of Object.entries(elementKeywords)) {
      if (keywords.some(kw => promptLower.includes(kw))) {
        relevantTypes.add(element);
      }
    }

    if (relevantTypes.size === 0) {
      return patterns.slice(0, 3);
    }

    return patterns.filter(
      p => relevantTypes.has(p.generatedElement.split('-')[0])
    );
  }

  /**
   * Format config hints for prompt injection
   */
  private formatConfigHints(drifts: ConfigDrift[]): string {
    if (drifts.length === 0) {
      return '';
    }

    const hints = drifts
      .filter(d => d.confidence >= 0.7) // Only high confidence drifts
      .slice(0, 5)
      .map(d => {
        const oldStr = this.valueToDisplay(d.aiDefault);
        const newStr = this.valueToDisplay(d.userPreferred);
        return `- For ${d.elementType}.${d.field}: use ${newStr} instead of ${oldStr} (users change this ${Math.round(d.changeRate * 100)}% of the time)`;
      });

    if (hints.length === 0) {
      return '';
    }

    return `## Config Recommendations\n\n${hints.join('\n')}`;
  }

  /**
   * Format space context
   */
  private formatSpaceContext(context: PromptEnhancementOptions['spaceContext']): string {
    if (!context) return '';

    const lines: string[] = [
      `## Space Context`,
      ``,
      `Generating tool for: "${context.spaceName}"`,
    ];

    if (context.category) {
      lines.push(`Category: ${context.category}`);
    }

    lines.push(``, `Consider this context when generating elements.`);

    return lines.join('\n');
  }

  // ═════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═════════════════════════════════════════════════════════════════

  /**
   * Estimate token count (approximately 4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Convert a value to display string
   */
  private valueToDisplay(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value).slice(0, 50);
    }
    return String(value);
  }

  /**
   * Clear pattern cache
   */
  clearCache(): void {
    this.patternCache = { patterns: null, timestamp: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
let defaultPromptEnhancer: PromptEnhancerService | null = null;

/**
 * Get default prompt enhancer instance
 */
export function getPromptEnhancerService(): PromptEnhancerService {
  if (!defaultPromptEnhancer) {
    defaultPromptEnhancer = new PromptEnhancerService();
  }
  return defaultPromptEnhancer;
}

/**
 * Initialize prompt enhancer
 */
export function initializePromptEnhancer(db: FirebaseFirestore.Firestore): void {
  getPromptEnhancerService().setFirestore(db);
}
