/**
 * SpaceCategory Value Object
 * Represents the category/type of a space
 *
 * HIVE uses exactly 5 categories that map 1:1 with CampusLabs branches + HIVE-native:
 * - student_organizations (Branch 1419): Student clubs & organizations
 * - university_organizations (Branch 360210): University services & departments
 * - greek_life (Branch 360211): Fraternities & sororities
 * - campus_living (Branch 360212): Residence halls & quads
 * - hive_exclusive: User-created spaces native to HIVE
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

/**
 * The 5 official HIVE space categories
 * These map directly to CampusLabs branch IDs for imports
 */
export enum SpaceCategoryEnum {
  STUDENT_ORGANIZATIONS = 'student_organizations',
  UNIVERSITY_ORGANIZATIONS = 'university_organizations',
  GREEK_LIFE = 'greek_life',
  CAMPUS_LIVING = 'campus_living',
  HIVE_EXCLUSIVE = 'hive_exclusive',
}

/**
 * CampusLabs branch ID to HIVE category mapping
 */
export const CAMPUSLABS_BRANCH_MAP: Record<number, SpaceCategoryEnum> = {
  1419: SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
  360210: SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS,
  360211: SpaceCategoryEnum.GREEK_LIFE,
  360212: SpaceCategoryEnum.CAMPUS_LIVING,
};

/**
 * Human-readable labels for each category
 */
export const CATEGORY_LABELS: Record<SpaceCategoryEnum, string> = {
  [SpaceCategoryEnum.STUDENT_ORGANIZATIONS]: 'Student Organization',
  [SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS]: 'University Organization',
  [SpaceCategoryEnum.GREEK_LIFE]: 'Greek Life',
  [SpaceCategoryEnum.CAMPUS_LIVING]: 'Campus Living',
  [SpaceCategoryEnum.HIVE_EXCLUSIVE]: 'HIVE Exclusive',
};

/**
 * Icons for each category (emoji shorthand)
 */
export const CATEGORY_ICONS: Record<SpaceCategoryEnum, string> = {
  [SpaceCategoryEnum.STUDENT_ORGANIZATIONS]: '👥',
  [SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS]: '🎓',
  [SpaceCategoryEnum.GREEK_LIFE]: '🏛️',
  [SpaceCategoryEnum.CAMPUS_LIVING]: '🏠',
  [SpaceCategoryEnum.HIVE_EXCLUSIVE]: '🐝',
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
      // Old DDD value object names (short form)
      'student_org': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      'university_org': SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS,
      'residential': SpaceCategoryEnum.CAMPUS_LIVING,
      // Old admin component names
      'university_spaces': SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS,
      'residential_spaces': SpaceCategoryEnum.CAMPUS_LIVING,
      'greek_life_spaces': SpaceCategoryEnum.GREEK_LIFE,
      'student_spaces': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      // Old seed route names
      'fraternity_and_sorority': SpaceCategoryEnum.GREEK_LIFE,
      // Old domain categories
      'club': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      'dorm': SpaceCategoryEnum.CAMPUS_LIVING,
      'academic': SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS,
      'social': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      'general': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      'study-group': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      'event': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      'resource': SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS,
      'sports': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      // Short form aliases (validation schema)
      'uni': SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS,
      'student': SpaceCategoryEnum.STUDENT_ORGANIZATIONS,
      'greek': SpaceCategoryEnum.GREEK_LIFE,
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
      // Default to student_organizations for unknown branches
      return Result.ok<SpaceCategory>(
        new SpaceCategory({ value: SpaceCategoryEnum.STUDENT_ORGANIZATIONS })
      );
    }
    return Result.ok<SpaceCategory>(new SpaceCategory({ value: category }));
  }

  public static createStudentOrganizations(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.STUDENT_ORGANIZATIONS })
    );
  }

  public static createCampusLiving(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.CAMPUS_LIVING })
    );
  }

  public static createUniversityOrganizations(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS })
    );
  }

  public static createGreekLife(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.GREEK_LIFE })
    );
  }

  public static createHiveExclusive(): Result<SpaceCategory> {
    return Result.ok<SpaceCategory>(
      new SpaceCategory({ value: SpaceCategoryEnum.HIVE_EXCLUSIVE })
    );
  }

  // Legacy aliases for backwards compatibility
  public static createStudentOrg(): Result<SpaceCategory> {
    return SpaceCategory.createStudentOrganizations();
  }

  public static createResidential(): Result<SpaceCategory> {
    return SpaceCategory.createCampusLiving();
  }

  public static createUniversityOrg(): Result<SpaceCategory> {
    return SpaceCategory.createUniversityOrganizations();
  }

  /**
   * Check if this is a student-managed space
   */
  public isStudentManaged(): boolean {
    return this.props.value === SpaceCategoryEnum.STUDENT_ORGANIZATIONS ||
           this.props.value === SpaceCategoryEnum.GREEK_LIFE ||
           this.props.value === SpaceCategoryEnum.HIVE_EXCLUSIVE;
  }

  /**
   * Check if this is a university-managed space
   */
  public isUniversityManaged(): boolean {
    return this.props.value === SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS;
  }

  /**
   * Check if this is a residential space
   */
  public isResidential(): boolean {
    return this.props.value === SpaceCategoryEnum.CAMPUS_LIVING;
  }

  /**
   * Check if this is a Greek life space
   */
  public isGreekLife(): boolean {
    return this.props.value === SpaceCategoryEnum.GREEK_LIFE;
  }

  /**
   * Check if this is a HIVE exclusive space
   */
  public isHiveExclusive(): boolean {
    return this.props.value === SpaceCategoryEnum.HIVE_EXCLUSIVE;
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
