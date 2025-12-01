/**
 * Interest Value Object
 * Represents a single interest with normalization and categorization
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

/**
 * Interest categories for grouping and discovery
 */
export enum InterestCategory {
  ACADEMIC = 'academic',
  SPORTS = 'sports',
  ARTS = 'arts',
  MUSIC = 'music',
  GAMING = 'gaming',
  TECHNOLOGY = 'technology',
  SOCIAL = 'social',
  OUTDOOR = 'outdoor',
  WELLNESS = 'wellness',
  CAREER = 'career',
  FOOD = 'food',
  TRAVEL = 'travel',
  OTHER = 'other'
}

/**
 * Suggested interests with categories (for autocomplete/discovery)
 */
export const INTEREST_SUGGESTIONS: Record<string, InterestCategory> = {
  // Academic
  'Research': InterestCategory.ACADEMIC,
  'Study Groups': InterestCategory.ACADEMIC,
  'Tutoring': InterestCategory.ACADEMIC,
  'Debate': InterestCategory.ACADEMIC,
  'Writing': InterestCategory.ACADEMIC,
  'Reading': InterestCategory.ACADEMIC,

  // Sports
  'Basketball': InterestCategory.SPORTS,
  'Football': InterestCategory.SPORTS,
  'Soccer': InterestCategory.SPORTS,
  'Tennis': InterestCategory.SPORTS,
  'Swimming': InterestCategory.SPORTS,
  'Running': InterestCategory.SPORTS,
  'Gym': InterestCategory.SPORTS,
  'Volleyball': InterestCategory.SPORTS,
  'Baseball': InterestCategory.SPORTS,
  'Hockey': InterestCategory.SPORTS,
  'Lacrosse': InterestCategory.SPORTS,
  'Intramurals': InterestCategory.SPORTS,

  // Arts
  'Photography': InterestCategory.ARTS,
  'Painting': InterestCategory.ARTS,
  'Drawing': InterestCategory.ARTS,
  'Sculpture': InterestCategory.ARTS,
  'Film': InterestCategory.ARTS,
  'Theater': InterestCategory.ARTS,
  'Dance': InterestCategory.ARTS,
  'Creative Writing': InterestCategory.ARTS,

  // Music
  'Music': InterestCategory.MUSIC,
  'Guitar': InterestCategory.MUSIC,
  'Piano': InterestCategory.MUSIC,
  'Singing': InterestCategory.MUSIC,
  'DJing': InterestCategory.MUSIC,
  'Concerts': InterestCategory.MUSIC,
  'Band': InterestCategory.MUSIC,
  'Orchestra': InterestCategory.MUSIC,

  // Gaming
  'Video Games': InterestCategory.GAMING,
  'Board Games': InterestCategory.GAMING,
  'Card Games': InterestCategory.GAMING,
  'Esports': InterestCategory.GAMING,
  'D&D': InterestCategory.GAMING,
  'Chess': InterestCategory.GAMING,

  // Technology
  'Programming': InterestCategory.TECHNOLOGY,
  'Web Development': InterestCategory.TECHNOLOGY,
  'AI/ML': InterestCategory.TECHNOLOGY,
  'Cybersecurity': InterestCategory.TECHNOLOGY,
  'Robotics': InterestCategory.TECHNOLOGY,
  'Data Science': InterestCategory.TECHNOLOGY,
  'Startups': InterestCategory.TECHNOLOGY,
  'Hackathons': InterestCategory.TECHNOLOGY,

  // Social
  'Volunteering': InterestCategory.SOCIAL,
  'Community Service': InterestCategory.SOCIAL,
  'Networking': InterestCategory.SOCIAL,
  'Greek Life': InterestCategory.SOCIAL,
  'Clubs': InterestCategory.SOCIAL,
  'Events': InterestCategory.SOCIAL,
  'Parties': InterestCategory.SOCIAL,

  // Outdoor
  'Hiking': InterestCategory.OUTDOOR,
  'Camping': InterestCategory.OUTDOOR,
  'Fishing': InterestCategory.OUTDOOR,
  'Skiing': InterestCategory.OUTDOOR,
  'Snowboarding': InterestCategory.OUTDOOR,
  'Biking': InterestCategory.OUTDOOR,

  // Wellness
  'Yoga': InterestCategory.WELLNESS,
  'Meditation': InterestCategory.WELLNESS,
  'Mental Health': InterestCategory.WELLNESS,
  'Fitness': InterestCategory.WELLNESS,
  'Nutrition': InterestCategory.WELLNESS,

  // Career
  'Internships': InterestCategory.CAREER,
  'Career Development': InterestCategory.CAREER,
  'Entrepreneurship': InterestCategory.CAREER,
  'Leadership': InterestCategory.CAREER,
  'Public Speaking': InterestCategory.CAREER,

  // Food
  'Cooking': InterestCategory.FOOD,
  'Baking': InterestCategory.FOOD,
  'Coffee': InterestCategory.FOOD,
  'Food Photography': InterestCategory.FOOD,

  // Travel
  'Travel': InterestCategory.TRAVEL,
  'Study Abroad': InterestCategory.TRAVEL,
  'Languages': InterestCategory.TRAVEL,
  'Culture': InterestCategory.TRAVEL,
};

interface InterestProps {
  value: string;
  normalized: string;
  category: InterestCategory;
}

export class Interest extends ValueObject<InterestProps> {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 50;

  get value(): string {
    return this.props.value;
  }

  get normalized(): string {
    return this.props.normalized;
  }

  get category(): InterestCategory {
    return this.props.category;
  }

  private constructor(props: InterestProps) {
    super(props);
  }

  /**
   * Create an Interest from input string
   */
  public static create(input: string): Result<Interest> {
    if (!input || input.trim().length === 0) {
      return Result.fail<Interest>('Interest cannot be empty');
    }

    const trimmed = input.trim();

    if (trimmed.length < Interest.MIN_LENGTH) {
      return Result.fail<Interest>(`Interest must be at least ${Interest.MIN_LENGTH} characters`);
    }

    if (trimmed.length > Interest.MAX_LENGTH) {
      return Result.fail<Interest>(`Interest must be no more than ${Interest.MAX_LENGTH} characters`);
    }

    // Normalize: lowercase for comparison
    const normalized = trimmed.toLowerCase();

    // Try to match against suggestions for category
    const category = Interest.findCategory(trimmed);

    return Result.ok<Interest>(new Interest({
      value: Interest.toTitleCase(trimmed),
      normalized,
      category
    }));
  }

  /**
   * Find category for an interest
   */
  private static findCategory(input: string): InterestCategory {
    const normalized = input.toLowerCase();

    for (const [suggestion, category] of Object.entries(INTEREST_SUGGESTIONS)) {
      if (suggestion.toLowerCase() === normalized) {
        return category;
      }
    }

    return InterestCategory.OTHER;
  }

  /**
   * Convert to title case for display
   */
  private static toTitleCase(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Get all suggested interests
   */
  public static getSuggestions(): string[] {
    return Object.keys(INTEREST_SUGGESTIONS).sort();
  }

  /**
   * Get suggestions by category
   */
  public static getSuggestionsByCategory(category: InterestCategory): string[] {
    return Object.entries(INTEREST_SUGGESTIONS)
      .filter(([, cat]) => cat === category)
      .map(([name]) => name)
      .sort();
  }

  /**
   * Check if this matches another interest (normalized comparison)
   */
  public matches(other: Interest): boolean {
    return this.props.normalized === other.normalized;
  }

  public toString(): string {
    return this.props.value;
  }
}

/**
 * InterestCollection Value Object
 * Manages a set of interests with limits and deduplication
 */
interface InterestCollectionProps {
  interests: Interest[];
}

export class InterestCollection extends ValueObject<InterestCollectionProps> {
  public static readonly MIN_INTERESTS = 0;
  public static readonly MAX_INTERESTS = 10;
  public static readonly RECOMMENDED_MIN = 3;

  get interests(): Interest[] {
    return [...this.props.interests];
  }

  get count(): number {
    return this.props.interests.length;
  }

  get values(): string[] {
    return this.props.interests.map(i => i.value);
  }

  private constructor(props: InterestCollectionProps) {
    super(props);
  }

  /**
   * Create an empty collection
   */
  public static createEmpty(): InterestCollection {
    return new InterestCollection({ interests: [] });
  }

  /**
   * Create from string array
   */
  public static create(inputs: string[]): Result<InterestCollection> {
    if (inputs.length > InterestCollection.MAX_INTERESTS) {
      return Result.fail<InterestCollection>(
        `Maximum of ${InterestCollection.MAX_INTERESTS} interests allowed`
      );
    }

    const interests: Interest[] = [];
    const seen = new Set<string>();

    for (const input of inputs) {
      const result = Interest.create(input);
      if (result.isFailure) {
        continue; // Skip invalid interests
      }

      const interest = result.getValue();

      // Deduplicate by normalized value
      if (!seen.has(interest.normalized)) {
        seen.add(interest.normalized);
        interests.push(interest);
      }
    }

    return Result.ok<InterestCollection>(new InterestCollection({ interests }));
  }

  /**
   * Add an interest to the collection
   */
  public add(input: string): Result<InterestCollection> {
    if (this.props.interests.length >= InterestCollection.MAX_INTERESTS) {
      return Result.fail<InterestCollection>(
        `Maximum of ${InterestCollection.MAX_INTERESTS} interests allowed`
      );
    }

    const result = Interest.create(input);
    if (result.isFailure) {
      return Result.fail<InterestCollection>(result.error!);
    }

    const newInterest = result.getValue();

    // Check for duplicates
    if (this.contains(newInterest)) {
      return Result.fail<InterestCollection>('Interest already exists');
    }

    return Result.ok<InterestCollection>(
      new InterestCollection({
        interests: [...this.props.interests, newInterest]
      })
    );
  }

  /**
   * Remove an interest from the collection
   */
  public remove(input: string): InterestCollection {
    const normalized = input.toLowerCase();
    return new InterestCollection({
      interests: this.props.interests.filter(i => i.normalized !== normalized)
    });
  }

  /**
   * Check if collection contains an interest
   */
  public contains(interest: Interest | string): boolean {
    const normalized = typeof interest === 'string'
      ? interest.toLowerCase()
      : interest.normalized;

    return this.props.interests.some(i => i.normalized === normalized);
  }

  /**
   * Check if collection meets minimum recommendation
   */
  public meetsRecommendedMin(): boolean {
    return this.props.interests.length >= InterestCollection.RECOMMENDED_MIN;
  }

  /**
   * Get interests by category
   */
  public getByCategory(category: InterestCategory): Interest[] {
    return this.props.interests.filter(i => i.category === category);
  }

  /**
   * Get category distribution
   */
  public getCategoryDistribution(): Map<InterestCategory, number> {
    const distribution = new Map<InterestCategory, number>();

    for (const interest of this.props.interests) {
      const count = distribution.get(interest.category) || 0;
      distribution.set(interest.category, count + 1);
    }

    return distribution;
  }

  /**
   * Calculate similarity with another collection (0-100)
   */
  public similarityWith(other: InterestCollection): number {
    if (this.count === 0 || other.count === 0) return 0;

    let matches = 0;
    for (const interest of this.props.interests) {
      if (other.contains(interest)) {
        matches++;
      }
    }

    // Jaccard similarity
    const union = new Set([
      ...this.props.interests.map(i => i.normalized),
      ...other.interests.map(i => i.normalized)
    ]).size;

    return Math.round((matches / union) * 100);
  }

  public toStringArray(): string[] {
    return this.props.interests.map(i => i.value);
  }
}
