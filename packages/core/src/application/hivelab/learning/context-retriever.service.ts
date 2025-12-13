/**
 * Context Retriever Service
 *
 * Implements RAG (Retrieval Augmented Generation) for HiveLab:
 * - Embeds user prompts using Gemini embeddings API
 * - Searches Firestore vector index for similar content
 * - Returns relevant context for prompt enhancement
 *
 * Uses:
 * - Gemini embedding-001 model (free tier: 1,500 requests/min)
 * - Firestore native vector search
 */

import type {
  EmbeddingDocument,
  RetrievedContext,
} from './types';

// ═══════════════════════════════════════════════════════════════════
// RETRIEVAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  /** Model for embeddings */
  embeddingModel: 'embedding-001',

  /** Dimension of embedding vectors (Gemini embedding-001 uses 768) */
  embeddingDimension: 768,

  /** Default number of results to retrieve */
  defaultLimit: 5,

  /** Maximum results to retrieve */
  maxLimit: 20,

  /** Minimum similarity score to include (0-1, higher = more similar) */
  minSimilarity: 0.7,

  /** Token budget for context injection */
  maxContextTokens: 2000,

  /** Cache TTL for embeddings in ms */
  embeddingCacheTTLMs: 5 * 60 * 1000, // 5 minutes
};

export type ContextRetrieverConfig = typeof DEFAULT_CONFIG;

// ═══════════════════════════════════════════════════════════════════
// CONTEXT RETRIEVER SERVICE
// ═══════════════════════════════════════════════════════════════════

export class ContextRetrieverService {
  private db: FirebaseFirestore.Firestore | null = null;
  private ai: unknown = null; // Firebase AI instance
  private config: ContextRetrieverConfig;
  private embeddingCache: Map<string, { embedding: number[]; timestamp: number }> = new Map();

  constructor(
    options: {
      db?: FirebaseFirestore.Firestore;
      ai?: unknown;
      config?: Partial<ContextRetrieverConfig>;
    } = {}
  ) {
    this.db = options.db || null;
    this.ai = options.ai || null;
    this.config = { ...DEFAULT_CONFIG, ...options.config };
  }

  /**
   * Set Firestore instance
   */
  setFirestore(db: FirebaseFirestore.Firestore): void {
    this.db = db;
  }

  /**
   * Set Firebase AI instance
   */
  setAI(ai: unknown): void {
    this.ai = ai;
  }

  // ═════════════════════════════════════════════════════════════════
  // MAIN RETRIEVAL
  // ═════════════════════════════════════════════════════════════════

  /**
   * Retrieve relevant context for a user prompt
   */
  async retrieveContext(
    prompt: string,
    options: {
      limit?: number;
      types?: EmbeddingDocument['type'][];
      category?: string;
    } = {}
  ): Promise<RetrievedContext> {
    const startTime = Date.now();

    // Get embedding for the prompt
    const embedStart = Date.now();
    const queryEmbedding = await this.getEmbedding(prompt);
    const queryEmbeddingTime = Date.now() - embedStart;

    if (!queryEmbedding) {
      return this.getEmptyContext(queryEmbeddingTime, Date.now() - startTime);
    }

    // Search for similar embeddings
    const limit = Math.min(options.limit || this.config.defaultLimit, this.config.maxLimit);
    const results = await this.vectorSearch(queryEmbedding, limit, options);

    // Process results into context
    const context = this.processResults(results);

    return {
      ...context,
      retrievalTime: Date.now() - startTime,
      queryEmbeddingTime,
    };
  }

  /**
   * Get embedding for text
   */
  async getEmbedding(text: string): Promise<number[] | null> {
    // Check cache first
    const cacheKey = this.hashText(text);
    const cached = this.embeddingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.embeddingCacheTTLMs) {
      return cached.embedding;
    }

    if (!this.ai) {
      console.warn('[ContextRetriever] AI not initialized, cannot generate embedding');
      return null;
    }

    try {
      // Use Gemini embeddings API
      // Note: This requires the @google/generative-ai package or Firebase AI
      const model = (this.ai as { getGenerativeModel?: (config: { model: string }) => unknown })
        .getGenerativeModel?.({ model: `models/${this.config.embeddingModel}` });

      if (!model) {
        console.warn('[ContextRetriever] Could not get embedding model');
        return null;
      }

      // Call embedContent
      const result = await (model as { embedContent?: (request: { content: { parts: { text: string }[] } }) => Promise<{ embedding: { values: number[] } }> })
        .embedContent?.({
          content: { parts: [{ text }] },
        });

      if (!result?.embedding?.values) {
        console.warn('[ContextRetriever] No embedding in result');
        return null;
      }

      const embedding = result.embedding.values;

      // Cache the result
      this.embeddingCache.set(cacheKey, {
        embedding,
        timestamp: Date.now(),
      });

      return embedding;
    } catch (error) {
      console.error('[ContextRetriever] Error generating embedding:', error);
      return null;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // VECTOR SEARCH
  // ═════════════════════════════════════════════════════════════════

  /**
   * Search for similar embeddings in Firestore
   */
  private async vectorSearch(
    queryEmbedding: number[],
    limit: number,
    options: { types?: EmbeddingDocument['type'][]; category?: string }
  ): Promise<EmbeddingDocument[]> {
    if (!this.db) {
      console.warn('[ContextRetriever] Firestore not initialized');
      return [];
    }

    try {
      // Build the query
      let query = this.db.collection('ai_embeddings');

      // Filter by types if specified
      if (options.types && options.types.length > 0) {
        query = query.where('type', 'in', options.types) as typeof query;
      }

      // Filter by category if specified
      if (options.category) {
        query = query.where('metadata.category', '==', options.category) as typeof query;
      }

      // Perform vector search
      // Note: Firestore vector search API
      const results = await (query as unknown as { findNearest: (config: {
        vectorField: string;
        queryVector: number[];
        limit: number;
        distanceMeasure: string;
      }) => { get: () => Promise<FirebaseFirestore.QuerySnapshot> } })
        .findNearest({
          vectorField: 'embedding',
          queryVector: queryEmbedding,
          limit,
          distanceMeasure: 'COSINE',
        })
        .get();

      return results.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EmbeddingDocument[];
    } catch (error) {
      console.error('[ContextRetriever] Vector search error:', error);
      return [];
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // RESULT PROCESSING
  // ═════════════════════════════════════════════════════════════════

  /**
   * Process search results into context
   */
  private processResults(results: EmbeddingDocument[]): Omit<RetrievedContext, 'retrievalTime' | 'queryEmbeddingTime'> {
    const relevantElements: RetrievedContext['relevantElements'] = [];
    const relevantTemplates: RetrievedContext['relevantTemplates'] = [];
    const similarGenerations: RetrievedContext['similarGenerations'] = [];

    for (const result of results) {
      // Calculate confidence (inverse of distance, normalized)
      // Note: actual confidence calculation would use the distance from vector search
      const confidence = 0.8; // Placeholder - would come from search results

      switch (result.type) {
        case 'element_usecase':
          relevantElements.push({
            id: result.sourceId,
            reason: result.text,
            confidence,
          });
          break;

        case 'template':
          relevantTemplates.push({
            id: result.sourceId,
            name: result.sourceId, // Would need to join with template data
            description: result.text,
            confidence,
          });
          break;

        case 'successful_generation':
          similarGenerations.push({
            id: result.sourceId,
            prompt: result.text,
            elements: result.metadata.elementTypes || [],
            score: result.metadata.score || 0,
            confidence,
          });
          break;
      }
    }

    return {
      relevantElements,
      relevantTemplates,
      similarGenerations,
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // CONTEXT FORMATTING
  // ═════════════════════════════════════════════════════════════════

  /**
   * Format retrieved context for prompt injection
   */
  formatForPrompt(context: RetrievedContext): string {
    const parts: string[] = [];
    let tokenCount = 0;
    const maxTokens = this.config.maxContextTokens;

    // Add relevant elements
    if (context.relevantElements.length > 0) {
      const elementSection = this.formatElementsSection(context.relevantElements);
      const elementTokens = this.estimateTokens(elementSection);

      if (tokenCount + elementTokens <= maxTokens) {
        parts.push(elementSection);
        tokenCount += elementTokens;
      }
    }

    // Add similar generations (most valuable for few-shot learning)
    if (context.similarGenerations.length > 0) {
      const genSection = this.formatGenerationsSection(context.similarGenerations);
      const genTokens = this.estimateTokens(genSection);

      if (tokenCount + genTokens <= maxTokens) {
        parts.push(genSection);
        tokenCount += genTokens;
      }
    }

    // Add templates if space allows
    if (context.relevantTemplates.length > 0) {
      const templateSection = this.formatTemplatesSection(context.relevantTemplates);
      const templateTokens = this.estimateTokens(templateSection);

      if (tokenCount + templateTokens <= maxTokens) {
        parts.push(templateSection);
      }
    }

    if (parts.length === 0) {
      return '';
    }

    return `## Retrieved Context\n\n${parts.join('\n\n')}`;
  }

  private formatElementsSection(
    elements: RetrievedContext['relevantElements']
  ): string {
    const lines = elements
      .slice(0, 5) // Limit to top 5
      .map(e => `- **${e.id}**: ${e.reason} (confidence: ${Math.round(e.confidence * 100)}%)`);

    return `### Suggested Elements\n${lines.join('\n')}`;
  }

  private formatGenerationsSection(
    generations: RetrievedContext['similarGenerations']
  ): string {
    const examples = generations
      .slice(0, 2) // Limit to top 2 for context budget
      .map(g => `**Prompt**: "${g.prompt.slice(0, 100)}${g.prompt.length > 100 ? '...' : ''}"
**Elements**: ${g.elements.join(', ')}
**Quality Score**: ${g.score}`);

    return `### Similar Successful Tools\n${examples.join('\n\n')}`;
  }

  private formatTemplatesSection(
    templates: RetrievedContext['relevantTemplates']
  ): string {
    const lines = templates
      .slice(0, 3)
      .map(t => `- **${t.name}**: ${t.description.slice(0, 100)}${t.description.length > 100 ? '...' : ''}`);

    return `### Related Templates\n${lines.join('\n')}`;
  }

  // ═════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═════════════════════════════════════════════════════════════════

  /**
   * Simple token estimation (approximately 4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Simple hash for cache key
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Get empty context result
   */
  private getEmptyContext(queryEmbeddingTime: number, retrievalTime: number): RetrievedContext {
    return {
      relevantElements: [],
      relevantTemplates: [],
      similarGenerations: [],
      retrievalTime,
      queryEmbeddingTime,
    };
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
let defaultContextRetriever: ContextRetrieverService | null = null;

/**
 * Get default context retriever instance
 */
export function getContextRetrieverService(): ContextRetrieverService {
  if (!defaultContextRetriever) {
    defaultContextRetriever = new ContextRetrieverService();
  }
  return defaultContextRetriever;
}

/**
 * Initialize context retriever
 */
export function initializeContextRetriever(
  db: FirebaseFirestore.Firestore,
  ai?: unknown
): void {
  const service = getContextRetrieverService();
  service.setFirestore(db);
  if (ai) {
    service.setAI(ai);
  }
}
