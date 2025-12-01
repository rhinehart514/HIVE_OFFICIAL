/**
 * SpaceSlug Value Object
 * Represents a URL-safe identifier for a space
 *
 * Slugs are generated from space names and must be unique within a campus.
 * Format: lowercase letters, numbers, and hyphens only (e.g., "jazz-club", "cs-study-group")
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

interface SpaceSlugProps {
  value: string;
}

export class SpaceSlug extends ValueObject<SpaceSlugProps> {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 50;
  // Valid slug pattern: lowercase letters, numbers, hyphens (not at start/end)
  private static readonly SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: SpaceSlugProps) {
    super(props);
  }

  /**
   * Create a SpaceSlug from an existing slug string
   * Use for loading from persistence
   */
  public static create(slug: string): Result<SpaceSlug> {
    const normalized = slug.toLowerCase().trim();

    const validationResult = SpaceSlug.validate(normalized);
    if (validationResult.isFailure) {
      return Result.fail<SpaceSlug>(validationResult.error!);
    }

    return Result.ok<SpaceSlug>(new SpaceSlug({ value: normalized }));
  }

  /**
   * Generate a SpaceSlug from a space name
   * Use for creating new spaces
   *
   * Examples:
   * - "Jazz Club" → "jazz-club"
   * - "CS 101 Study Group" → "cs-101-study-group"
   * - "Women's Soccer" → "womens-soccer"
   * - "Phi Beta Kappa" → "phi-beta-kappa"
   */
  public static generateFromName(name: string): Result<SpaceSlug> {
    const slug = SpaceSlug.slugify(name);

    const validationResult = SpaceSlug.validate(slug);
    if (validationResult.isFailure) {
      return Result.fail<SpaceSlug>(validationResult.error!);
    }

    return Result.ok<SpaceSlug>(new SpaceSlug({ value: slug }));
  }

  /**
   * Generate a unique slug by appending a numeric suffix
   * Use when a slug collision is detected
   *
   * Examples:
   * - "jazz-club" + 1 → "jazz-club-1"
   * - "jazz-club" + 2 → "jazz-club-2"
   */
  public static withSuffix(baseSlug: SpaceSlug, suffix: number): Result<SpaceSlug> {
    const newSlug = `${baseSlug.value}-${suffix}`;

    if (newSlug.length > SpaceSlug.MAX_LENGTH) {
      return Result.fail<SpaceSlug>(
        `Slug with suffix exceeds maximum length of ${SpaceSlug.MAX_LENGTH} characters`
      );
    }

    return Result.ok<SpaceSlug>(new SpaceSlug({ value: newSlug }));
  }

  /**
   * Validate a slug string
   */
  private static validate(slug: string): Result<void> {
    if (slug.length < SpaceSlug.MIN_LENGTH) {
      return Result.fail<void>(
        `Space slug must be at least ${SpaceSlug.MIN_LENGTH} characters`
      );
    }

    if (slug.length > SpaceSlug.MAX_LENGTH) {
      return Result.fail<void>(
        `Space slug must be no more than ${SpaceSlug.MAX_LENGTH} characters`
      );
    }

    if (!SpaceSlug.SLUG_PATTERN.test(slug)) {
      return Result.fail<void>(
        'Space slug must contain only lowercase letters, numbers, and hyphens (not at start/end)'
      );
    }

    // Reserved slugs that might conflict with routes
    const reserved = ['new', 'create', 'edit', 'settings', 'admin', 'api', 'browse', 'search'];
    if (reserved.includes(slug)) {
      return Result.fail<void>(`"${slug}" is a reserved slug and cannot be used`);
    }

    return Result.ok<void>();
  }

  /**
   * Convert a name to a slug format
   */
  private static slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      // Replace apostrophes and special quotes with empty string
      .replace(/[''`]/g, '')
      // Replace & with 'and'
      .replace(/&/g, 'and')
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove any character that's not alphanumeric or hyphen
      .replace(/[^a-z0-9-]/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Check if this slug matches another slug
   */
  public equals(other: SpaceSlug): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
