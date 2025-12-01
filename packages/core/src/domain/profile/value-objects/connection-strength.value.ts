/**
 * ConnectionStrength Value Object
 * Represents the strength of a connection between two profiles
 *
 * Strength is calculated based on:
 * - Interaction frequency
 * - Shared spaces
 * - Shared interests
 * - Message history
 * - Time since connection
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

/**
 * Connection strength tiers
 */
export enum ConnectionTier {
  ACQUAINTANCE = 'acquaintance',   // 0-25: Just connected
  FAMILIAR = 'familiar',           // 26-50: Some interaction
  FRIEND = 'friend',               // 51-75: Regular interaction
  CLOSE_FRIEND = 'close_friend',   // 76-90: High interaction
  BEST_FRIEND = 'best_friend'      // 91-100: Highest tier
}

/**
 * Factors that contribute to connection strength
 */
export interface ConnectionFactors {
  interactionCount: number;        // Total interactions
  sharedSpacesCount: number;       // Spaces both users are in
  sharedInterestsCount: number;    // Common interests
  messageCount: number;            // Direct messages exchanged
  daysSinceConnection: number;     // Age of connection
  recentInteractionDays: number;   // Days since last interaction
  mutualConnectionsCount: number;  // Friends in common
}

interface ConnectionStrengthProps {
  score: number;
  tier: ConnectionTier;
  factors: ConnectionFactors;
  lastCalculated: Date;
}

export class ConnectionStrength extends ValueObject<ConnectionStrengthProps> {
  public static readonly MIN_SCORE = 0;
  public static readonly MAX_SCORE = 100;

  // Weight factors for calculation
  private static readonly WEIGHTS = {
    interactions: 0.25,      // 25%
    sharedSpaces: 0.20,      // 20%
    sharedInterests: 0.15,   // 15%
    messages: 0.20,          // 20%
    connectionAge: 0.10,     // 10%
    recency: 0.05,           // 5%
    mutualConnections: 0.05  // 5%
  };

  get score(): number {
    return this.props.score;
  }

  get tier(): ConnectionTier {
    return this.props.tier;
  }

  get factors(): ConnectionFactors {
    return { ...this.props.factors };
  }

  get lastCalculated(): Date {
    return this.props.lastCalculated;
  }

  private constructor(props: ConnectionStrengthProps) {
    super(props);
  }

  /**
   * Create from a raw score (0-100)
   */
  public static create(score: number): Result<ConnectionStrength> {
    if (score < ConnectionStrength.MIN_SCORE || score > ConnectionStrength.MAX_SCORE) {
      return Result.fail<ConnectionStrength>(
        `Score must be between ${ConnectionStrength.MIN_SCORE} and ${ConnectionStrength.MAX_SCORE}`
      );
    }

    const roundedScore = Math.round(score);
    const tier = ConnectionStrength.calculateTier(roundedScore);

    return Result.ok<ConnectionStrength>(new ConnectionStrength({
      score: roundedScore,
      tier,
      factors: {
        interactionCount: 0,
        sharedSpacesCount: 0,
        sharedInterestsCount: 0,
        messageCount: 0,
        daysSinceConnection: 0,
        recentInteractionDays: 0,
        mutualConnectionsCount: 0
      },
      lastCalculated: new Date()
    }));
  }

  /**
   * Calculate strength from factors
   */
  public static calculateFromFactors(factors: ConnectionFactors): Result<ConnectionStrength> {
    const {
      interactionCount,
      sharedSpacesCount,
      sharedInterestsCount,
      messageCount,
      daysSinceConnection,
      recentInteractionDays,
      mutualConnectionsCount
    } = factors;

    // Normalize each factor to 0-100
    const interactionScore = Math.min(interactionCount / 50, 1) * 100;
    const spacesScore = Math.min(sharedSpacesCount / 5, 1) * 100;
    const interestsScore = Math.min(sharedInterestsCount / 5, 1) * 100;
    const messageScore = Math.min(messageCount / 100, 1) * 100;

    // Connection age: peaks at 180 days, then plateaus
    const ageScore = Math.min(daysSinceConnection / 180, 1) * 100;

    // Recency: higher if interacted recently (inverse decay)
    const recencyScore = recentInteractionDays <= 7
      ? 100
      : Math.max(0, 100 - (recentInteractionDays - 7) * 2);

    // Mutual connections
    const mutualScore = Math.min(mutualConnectionsCount / 10, 1) * 100;

    // Weighted sum
    const totalScore =
      interactionScore * ConnectionStrength.WEIGHTS.interactions +
      spacesScore * ConnectionStrength.WEIGHTS.sharedSpaces +
      interestsScore * ConnectionStrength.WEIGHTS.sharedInterests +
      messageScore * ConnectionStrength.WEIGHTS.messages +
      ageScore * ConnectionStrength.WEIGHTS.connectionAge +
      recencyScore * ConnectionStrength.WEIGHTS.recency +
      mutualScore * ConnectionStrength.WEIGHTS.mutualConnections;

    const roundedScore = Math.round(Math.min(Math.max(totalScore, 0), 100));
    const tier = ConnectionStrength.calculateTier(roundedScore);

    return Result.ok<ConnectionStrength>(new ConnectionStrength({
      score: roundedScore,
      tier,
      factors,
      lastCalculated: new Date()
    }));
  }

  /**
   * Create a new connection (starting strength)
   */
  public static createNew(): ConnectionStrength {
    return new ConnectionStrength({
      score: 10, // Starting score for new connections
      tier: ConnectionTier.ACQUAINTANCE,
      factors: {
        interactionCount: 0,
        sharedSpacesCount: 0,
        sharedInterestsCount: 0,
        messageCount: 0,
        daysSinceConnection: 0,
        recentInteractionDays: 0,
        mutualConnectionsCount: 0
      },
      lastCalculated: new Date()
    });
  }

  /**
   * Calculate tier from score
   */
  private static calculateTier(score: number): ConnectionTier {
    if (score >= 91) return ConnectionTier.BEST_FRIEND;
    if (score >= 76) return ConnectionTier.CLOSE_FRIEND;
    if (score >= 51) return ConnectionTier.FRIEND;
    if (score >= 26) return ConnectionTier.FAMILIAR;
    return ConnectionTier.ACQUAINTANCE;
  }

  /**
   * Get tier thresholds
   */
  public static getTierThresholds(): Record<ConnectionTier, { min: number; max: number }> {
    return {
      [ConnectionTier.ACQUAINTANCE]: { min: 0, max: 25 },
      [ConnectionTier.FAMILIAR]: { min: 26, max: 50 },
      [ConnectionTier.FRIEND]: { min: 51, max: 75 },
      [ConnectionTier.CLOSE_FRIEND]: { min: 76, max: 90 },
      [ConnectionTier.BEST_FRIEND]: { min: 91, max: 100 }
    };
  }

  /**
   * Check if this is a strong connection (friend or above)
   */
  public isStrong(): boolean {
    return this.props.score >= 51;
  }

  /**
   * Check if this connection is close (close_friend or above)
   */
  public isClose(): boolean {
    return this.props.score >= 76;
  }

  /**
   * Check if connection needs nurturing (low recent activity)
   */
  public needsNurturing(): boolean {
    return this.props.factors.recentInteractionDays > 14 && this.props.score >= 26;
  }

  /**
   * Get display label for tier
   */
  public getTierLabel(): string {
    switch (this.props.tier) {
      case ConnectionTier.BEST_FRIEND: return 'Best Friend';
      case ConnectionTier.CLOSE_FRIEND: return 'Close Friend';
      case ConnectionTier.FRIEND: return 'Friend';
      case ConnectionTier.FAMILIAR: return 'Familiar';
      case ConnectionTier.ACQUAINTANCE: return 'Acquaintance';
    }
  }

  /**
   * Get progress to next tier (0-100)
   */
  public getProgressToNextTier(): number {
    const thresholds = ConnectionStrength.getTierThresholds();
    const currentThreshold = thresholds[this.props.tier];

    if (this.props.tier === ConnectionTier.BEST_FRIEND) {
      return 100; // Already at max
    }

    const nextTierMin = currentThreshold.max + 1;
    const range = currentThreshold.max - currentThreshold.min + 1;
    const progress = this.props.score - currentThreshold.min;

    return Math.round((progress / range) * 100);
  }

  /**
   * Get emoji for tier
   */
  public getTierEmoji(): string {
    switch (this.props.tier) {
      case ConnectionTier.BEST_FRIEND: return '💜';
      case ConnectionTier.CLOSE_FRIEND: return '💙';
      case ConnectionTier.FRIEND: return '💚';
      case ConnectionTier.FAMILIAR: return '💛';
      case ConnectionTier.ACQUAINTANCE: return '🤍';
    }
  }

  /**
   * Compare with another connection strength
   */
  public isStrongerThan(other: ConnectionStrength): boolean {
    return this.props.score > other.score;
  }

  public toString(): string {
    return `${this.props.score} (${this.getTierLabel()})`;
  }

  public toDisplayString(): string {
    return `${this.getTierEmoji()} ${this.getTierLabel()}`;
  }
}
