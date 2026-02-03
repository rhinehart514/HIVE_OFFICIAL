/**
 * Search API v2
 *
 * Enhanced search with relevance-based ranking:
 * - Text match quality (exact > prefix > word-boundary > contains)
 * - Recency boost with exponential decay (14-day half-life)
 * - Engagement/popularity signals (logarithmic scaling)
 * - Verified/active status boosts
 * - Entity-specific scoring (e.g., upcoming events ranked higher)
 *
 * Future improvements:
 * - Fuzzy matching for typo tolerance
 * - Semantic search with embeddings
 * - Personalized ranking based on user's spaces/interests
 *
 * Re-exports v1 implementation with the enhanced ranking system.
 */

export { GET } from '../route';
