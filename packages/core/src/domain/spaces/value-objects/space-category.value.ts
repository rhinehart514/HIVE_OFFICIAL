/**
 * SpaceCategory Value Object
 * Represents the category/type of a space
 *
 * HIVE uses exactly 4 categories that map 1:1 with CampusLabs branches:
 * - student_org (Branch 1419): Student clubs & organizations
 * - university_org (Branch 360210): University services & departments
 * - greek_life (Branch 360211): Fraternities & sororities
 * - residential (Branch 360212): Residence halls & quads
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

/**
 * The 4 official HIVE space categories
 * These map directly to CampusLabs branch IDs for imports
 */
export enum SpaceCategoryEnum {
  STUDENT_ORG = 'student_org',
  UNIVERSITY_ORG = 'university_org',
  GREEK_LIFE = 'greek_life',
  RESIDENTIAL = 'residential'
}

/**
 * CampusLabs branch ID to HIVE category mapping
 */
export const CAMPUSLABS_BRANCH_MAP: Record<number, SpaceCategoryEnum> = {
  1419: SpaceCategoryEnum.STUDENT_ORG,
  360210: SpaceCategoryEnum.UNIVERSITY_ORG,
  360211: SpaceCategoryEnum.GREEK_LIFE,
  360212: SpaceCategoryEnum.RESIDENTIAL,
};

/**
 * Human-readable labels for each category
 */
export const CATEGORY_LABELS: Record<SpaceCategoryEnum, string> = {
  [SpaceCategoryEnum.STUDENT_ORG]: 'Student Organization',
  [SpaceCategoryEnum.UNIVERSITY_ORG]: 'University Organization',
  [SpaceCategoryEnum.GREEK_LIFE]: 'Greek Life',
  [SpaceCategoryEnum.RESIDENTIAL]: 'Residential',
};

/**
 * Icons for each category (emoji shorthand)
 */
export const CATEGORY_ICONS: Record<SpaceCategoryEnum, string> = {
  [SpaceCategoryEnum.STUDENT_ORG]: '👥',
  [SpaceCategoryEnum.UNIVERSITY_ORG]: '🎓',
  [SpaceCategoryEnum.GREEK_LIFE]: '🏛️',
  [SpaceCategoryEnum.RESIDENTIAL]: '🏠',
};

interface SpaceCategoryProps {
  value: SpaceCategoryEnum;
}

export class SpaceCategory extends ValueObject<SpaceCategoryProps> {
  get value(): SpaceCategoryEnum {
    return this.props.value;
  }

  get label(): string {
    return CATEGORY_LABELS[this.props.value];
  }

  get icon(): string {
    return CATEGORY_ICONS[this.props.value];
  }

  private constructor(props: SpaceCategoryProps) {
    super(props);
  }

  /**
   * Create from category string
   */
  public static create(category: string): Result<SpaceCategory> {
    // Direct match
    if (Object.values(SpaceCategoryEnum).includes(category as SpaceCategoryEnum)) {
      return Result.ok<SpaceCategory>(
        new SpaceCategory({ value: category as SpaceCategoryEnum })
      );
    }

    // Legacy mapping for backwards compatibility
    const legacyMap: Record<string, SpaceCategoryEnum> = {
      // Old admin component names
      'university_spaces': SpaceCategoryEnum.UNIVERSITY_ORG,
      'residential_spaces': SpaceCategoryEnum.RESIDENTIAL,
      'greek_life_spaces': SpaceCategoryEnum.GREEK_LIFE,
      'student_spaces': SpaceCategoryEnum.STUDENT_ORG,
      // Old seed route names
      'student_organizations': SpaceCategoryEnum.STUDENT_ORG,
      'university_organizations': SpaceCategoryEnum.UNIVERSITY_ORG,
      'campus_living': SpaceCategoryEnum.RESIDENTIAL,
      'fraternity_and_sorority': SpaceCategoryEnum.GREEK_LIFE,
      // Old domain categories
      'club': SpaceCategoryEnum.STUDENT_ORG,
      'dorm': SpaceCategoryEnum.RESIDENTIAL,
      'academic': SpaceCategoryEnum.UNIVERSITY_ORG,
      'social': SpaceCategoryEnum.STUDENT_ORG,
      'general': SpaceCategoryEnum.STUDENT_ORG,
      'study-group': SpaceCategoryEnum.STUDENT_ORG,
      'event': SpaceCategoryEnum.STUDENT_ORG,
      'resource': SpaceCategoryEnum.UNIVERSITY_ORG,
      'sports': SpaceCategoryEnum.STUDENT_ORG,
    };

    if (category in legacyMap) {
      return Result.ok<SpaceCategory>(
        new SpaceCategory({ value: legacyMap[category]! })
      );
    }

    return Result.fail<SpaceCategory>(`Invalid space category: ${category}. Valid categories: ${Object.values(SpaceCategoryEnum).join(', ')}`);
  }

  /**
   * Create from CampusLabs branch ID
   */
  public static createFromBranchId(branchId: number): Result<SpaceCategory> {
    const category = CAMPUSLABS_BRANCH_MAP[branchId];
    if (!category) {
      // Default to student_org for unknown branches
      return Result.ok<SpaceCategory>(
        new SpaceCategory({ value: SpaceCategoryEnum.STUDENT_ORG })
      );
    }
    return Result.ok<SpaceCategory>(new SpaceCategory({ value: category }));
  }

  public static createStudentOrg(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.STUDENT_ORG })
    );
  }

  public static createResidential(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.RESIDENTIAL })
    );
  }

  public static createUniversityOrg(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.UNIVERSITY_ORG })
    );
  }

  public static createGreekLife(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.GREEK_LIFE })
    );
  }

  /**
   * Check if this is a student-managed space
   */
  public isStudentManaged(): boolean {
    return this.props.value === SpaceCategoryEnum.STUDENT_ORG ||
           this.props.value === SpaceCategoryEnum.GREEK_LIFE;
  }

  /**
   * Check if this is a university-managed space
   */
  public isUniversityManaged(): boolean {
    return this.props.value === SpaceCategoryEnum.UNIVERSITY_ORG;
  }

  /**
   * Check if this is a residential space
   */
  public isResidential(): boolean {
    return this.props.value === SpaceCategoryEnum.RESIDENTIAL;
  }

  /**
   * Check if this is a Greek life space
   */
  public isGreekLife(): boolean {
    return this.props.value === SpaceCategoryEnum.GREEK_LIFE;
  }

  public toString(): string {
    return this.props.value;
  }

  /**
   * Get all valid category values
   */
  public static getAllCategories(): SpaceCategoryEnum[] {
    return Object.values(SpaceCategoryEnum);
  }
}