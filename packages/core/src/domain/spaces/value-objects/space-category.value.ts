/**
 * SpaceCategory Value Object
 * Represents the category/type of a space
 *
 * Supports both domain categories (internal) and API categories (external).
 * The domain uses detailed categories while the API uses simplified categories.
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

/**
 * Domain-level categories (internal, detailed)
 */
export enum SpaceCategoryEnum {
  GENERAL = 'general',
  STUDY_GROUP = 'study-group',
  SOCIAL = 'social',
  EVENT = 'event',
  RESOURCE = 'resource',
  DORM = 'dorm',
  CLUB = 'club',
  SPORTS = 'sports',
  ACADEMIC = 'academic'
}

/**
 * API-level categories (external, simplified)
 * These match what the spaces API route expects
 */
export enum ApiCategoryEnum {
  STUDENT_ORG = 'student_org',
  RESIDENTIAL = 'residential',
  UNIVERSITY_ORG = 'university_org',
  GREEK_LIFE = 'greek_life'
}

/**
 * Mapping from API categories to domain categories
 */
const API_TO_DOMAIN_MAP: Record<ApiCategoryEnum, SpaceCategoryEnum> = {
  [ApiCategoryEnum.STUDENT_ORG]: SpaceCategoryEnum.CLUB,
  [ApiCategoryEnum.RESIDENTIAL]: SpaceCategoryEnum.DORM,
  [ApiCategoryEnum.UNIVERSITY_ORG]: SpaceCategoryEnum.ACADEMIC,
  [ApiCategoryEnum.GREEK_LIFE]: SpaceCategoryEnum.SOCIAL
};

/**
 * Mapping from domain categories to API categories
 */
const DOMAIN_TO_API_MAP: Record<SpaceCategoryEnum, ApiCategoryEnum> = {
  [SpaceCategoryEnum.GENERAL]: ApiCategoryEnum.STUDENT_ORG,
  [SpaceCategoryEnum.STUDY_GROUP]: ApiCategoryEnum.STUDENT_ORG,
  [SpaceCategoryEnum.SOCIAL]: ApiCategoryEnum.STUDENT_ORG,
  [SpaceCategoryEnum.EVENT]: ApiCategoryEnum.STUDENT_ORG,
  [SpaceCategoryEnum.RESOURCE]: ApiCategoryEnum.UNIVERSITY_ORG,
  [SpaceCategoryEnum.DORM]: ApiCategoryEnum.RESIDENTIAL,
  [SpaceCategoryEnum.CLUB]: ApiCategoryEnum.STUDENT_ORG,
  [SpaceCategoryEnum.SPORTS]: ApiCategoryEnum.STUDENT_ORG,
  [SpaceCategoryEnum.ACADEMIC]: ApiCategoryEnum.UNIVERSITY_ORG
};

interface SpaceCategoryProps {
  value: SpaceCategoryEnum;
}

export class SpaceCategory extends ValueObject<SpaceCategoryProps> {
  get value(): SpaceCategoryEnum {
    return this.props.value;
  }

  /**
   * Get the API-compatible category value
   */
  get apiValue(): ApiCategoryEnum {
    return DOMAIN_TO_API_MAP[this.props.value];
  }

  private constructor(props: SpaceCategoryProps) {
    super(props);
  }

  /**
   * Create from domain category string
   */
  public static create(category: string): Result<SpaceCategory> {
    // First try as domain category
    if (Object.values(SpaceCategoryEnum).includes(category as SpaceCategoryEnum)) {
      return Result.ok<SpaceCategory>(
        new SpaceCategory({ value: category as SpaceCategoryEnum })
      );
    }

    // Then try as API category
    if (Object.values(ApiCategoryEnum).includes(category as ApiCategoryEnum)) {
      const domainCategory = API_TO_DOMAIN_MAP[category as ApiCategoryEnum];
      return Result.ok<SpaceCategory>(
        new SpaceCategory({ value: domainCategory })
      );
    }

    return Result.fail<SpaceCategory>(`Invalid space category: ${category}`);
  }

  /**
   * Create from API category
   */
  public static createFromApi(apiCategory: string): Result<SpaceCategory> {
    if (!Object.values(ApiCategoryEnum).includes(apiCategory as ApiCategoryEnum)) {
      return Result.fail<SpaceCategory>(`Invalid API category: ${apiCategory}`);
    }

    const domainCategory = API_TO_DOMAIN_MAP[apiCategory as ApiCategoryEnum];
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: domainCategory })
    );
  }

  public static createGeneral(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.GENERAL })
    );
  }

  public static createStudyGroup(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.STUDY_GROUP })
    );
  }

  public static createStudentOrg(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.CLUB })
    );
  }

  public static createResidential(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.DORM })
    );
  }

  public static createUniversityOrg(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.ACADEMIC })
    );
  }

  public static createGreekLife(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.SOCIAL })
    );
  }

  public isAcademic(): boolean {
    return [
      SpaceCategoryEnum.STUDY_GROUP,
      SpaceCategoryEnum.ACADEMIC,
      SpaceCategoryEnum.RESOURCE
    ].includes(this.props.value);
  }

  public isSocial(): boolean {
    return [
      SpaceCategoryEnum.SOCIAL,
      SpaceCategoryEnum.DORM,
      SpaceCategoryEnum.CLUB,
      SpaceCategoryEnum.SPORTS
    ].includes(this.props.value);
  }

  public isUniversityManaged(): boolean {
    return this.apiValue === ApiCategoryEnum.UNIVERSITY_ORG;
  }

  public isStudentManaged(): boolean {
    return this.apiValue === ApiCategoryEnum.STUDENT_ORG;
  }

  public toString(): string {
    return this.props.value;
  }

  /**
   * Convert to API-compatible string for persistence
   */
  public toApiString(): string {
    return this.apiValue;
  }
}