import { describe, it, expect } from 'vitest';
import { SpaceCategory, SpaceCategoryEnum, CAMPUSLABS_BRANCH_MAP, CATEGORY_LABELS } from '../../../../domain/spaces/value-objects/space-category.value';

describe('SpaceCategory Value Object', () => {
  describe('SpaceCategoryEnum', () => {
    it('should have exactly 5 categories', () => {
      const categories = Object.values(SpaceCategoryEnum);
      expect(categories).toHaveLength(5);
      expect(categories).toContain('student_organizations');
      expect(categories).toContain('university_organizations');
      expect(categories).toContain('greek_life');
      expect(categories).toContain('campus_living');
      expect(categories).toContain('hive_exclusive');
    });
  });

  describe('CAMPUSLABS_BRANCH_MAP', () => {
    it('should map branch IDs to categories', () => {
      expect(CAMPUSLABS_BRANCH_MAP[1419]).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
      expect(CAMPUSLABS_BRANCH_MAP[360210]).toBe(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
      expect(CAMPUSLABS_BRANCH_MAP[360211]).toBe(SpaceCategoryEnum.GREEK_LIFE);
      expect(CAMPUSLABS_BRANCH_MAP[360212]).toBe(SpaceCategoryEnum.CAMPUS_LIVING);
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('should have labels for all categories', () => {
      expect(CATEGORY_LABELS[SpaceCategoryEnum.STUDENT_ORGANIZATIONS]).toBe('Student Organization');
      expect(CATEGORY_LABELS[SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS]).toBe('University Organization');
      expect(CATEGORY_LABELS[SpaceCategoryEnum.GREEK_LIFE]).toBe('Greek Life');
      expect(CATEGORY_LABELS[SpaceCategoryEnum.CAMPUS_LIVING]).toBe('Campus Living');
      expect(CATEGORY_LABELS[SpaceCategoryEnum.HIVE_EXCLUSIVE]).toBe('HIVE Exclusive');
    });
  });

  describe('create() with canonical categories', () => {
    it('should create valid SpaceCategory for "student_organizations"', () => {
      const result = SpaceCategory.create('student_organizations');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
    });

    it('should create valid SpaceCategory for "university_organizations"', () => {
      const result = SpaceCategory.create('university_organizations');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
    });

    it('should create valid SpaceCategory for "greek_life"', () => {
      const result = SpaceCategory.create('greek_life');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
    });

    it('should create valid SpaceCategory for "campus_living"', () => {
      const result = SpaceCategory.create('campus_living');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.CAMPUS_LIVING);
    });

    it('should create valid SpaceCategory for "hive_exclusive"', () => {
      const result = SpaceCategory.create('hive_exclusive');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.HIVE_EXCLUSIVE);
    });
  });

  describe('create() with legacy categories (backwards compatibility)', () => {
    it('should map legacy short form names', () => {
      expect(SpaceCategory.create('student_org').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
      expect(SpaceCategory.create('university_org').getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
      expect(SpaceCategory.create('residential').getValue().value).toBe(SpaceCategoryEnum.CAMPUS_LIVING);
    });

    it('should map legacy admin UI names', () => {
      expect(SpaceCategory.create('university_spaces').getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
      expect(SpaceCategory.create('residential_spaces').getValue().value).toBe(SpaceCategoryEnum.CAMPUS_LIVING);
      expect(SpaceCategory.create('greek_life_spaces').getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
      expect(SpaceCategory.create('student_spaces').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
    });

    it('should map old domain categories', () => {
      expect(SpaceCategory.create('club').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
      expect(SpaceCategory.create('dorm').getValue().value).toBe(SpaceCategoryEnum.CAMPUS_LIVING);
      expect(SpaceCategory.create('academic').getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
      expect(SpaceCategory.create('social').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
      expect(SpaceCategory.create('general').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
      expect(SpaceCategory.create('study-group').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
      expect(SpaceCategory.create('sports').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
    });

    it('should fail for completely invalid category', () => {
      const result = SpaceCategory.create('invalid_category');
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid space category');
    });
  });

  describe('createFromBranchId()', () => {
    it('should create from CampusLabs branch ID 1419 (student orgs)', () => {
      const result = SpaceCategory.createFromBranchId(1419);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
    });

    it('should create from CampusLabs branch ID 360210 (university services)', () => {
      const result = SpaceCategory.createFromBranchId(360210);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
    });

    it('should create from CampusLabs branch ID 360211 (greek life)', () => {
      const result = SpaceCategory.createFromBranchId(360211);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
    });

    it('should create from CampusLabs branch ID 360212 (campus living)', () => {
      const result = SpaceCategory.createFromBranchId(360212);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.CAMPUS_LIVING);
    });

    it('should default to student_organizations for unknown branch ID', () => {
      const result = SpaceCategory.createFromBranchId(999999);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
    });
  });

  describe('factory methods', () => {
    it('should create student_organizations via createStudentOrganizations()', () => {
      const result = SpaceCategory.createStudentOrganizations();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
    });

    it('should create campus_living via createCampusLiving()', () => {
      const result = SpaceCategory.createCampusLiving();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.CAMPUS_LIVING);
    });

    it('should create university_organizations via createUniversityOrganizations()', () => {
      const result = SpaceCategory.createUniversityOrganizations();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
    });

    it('should create greek_life via createGreekLife()', () => {
      const result = SpaceCategory.createGreekLife();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
    });

    it('should create hive_exclusive via createHiveExclusive()', () => {
      const result = SpaceCategory.createHiveExclusive();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.HIVE_EXCLUSIVE);
    });

    // Legacy factory method aliases
    it('should create student_organizations via legacy createStudentOrg()', () => {
      const result = SpaceCategory.createStudentOrg();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
    });

    it('should create campus_living via legacy createResidential()', () => {
      const result = SpaceCategory.createResidential();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.CAMPUS_LIVING);
    });

    it('should create university_organizations via legacy createUniversityOrg()', () => {
      const result = SpaceCategory.createUniversityOrg();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
    });
  });

  describe('helper methods', () => {
    it('isStudentManaged() should return true for student_organizations, greek_life, and hive_exclusive', () => {
      const studentOrg = SpaceCategory.create('student_organizations').getValue();
      const greekLife = SpaceCategory.create('greek_life').getValue();
      const hiveExclusive = SpaceCategory.create('hive_exclusive').getValue();
      const universityOrg = SpaceCategory.create('university_organizations').getValue();
      const campusLiving = SpaceCategory.create('campus_living').getValue();

      expect(studentOrg.isStudentManaged()).toBe(true);
      expect(greekLife.isStudentManaged()).toBe(true);
      expect(hiveExclusive.isStudentManaged()).toBe(true);
      expect(universityOrg.isStudentManaged()).toBe(false);
      expect(campusLiving.isStudentManaged()).toBe(false);
    });

    it('isUniversityManaged() should return true only for university_organizations', () => {
      const studentOrg = SpaceCategory.create('student_organizations').getValue();
      const universityOrg = SpaceCategory.create('university_organizations').getValue();

      expect(universityOrg.isUniversityManaged()).toBe(true);
      expect(studentOrg.isUniversityManaged()).toBe(false);
    });

    it('isResidential() should return true only for campus_living', () => {
      const campusLiving = SpaceCategory.create('campus_living').getValue();
      const studentOrg = SpaceCategory.create('student_organizations').getValue();

      expect(campusLiving.isResidential()).toBe(true);
      expect(studentOrg.isResidential()).toBe(false);
    });

    it('isGreekLife() should return true only for greek_life', () => {
      const greekLife = SpaceCategory.create('greek_life').getValue();
      const studentOrg = SpaceCategory.create('student_organizations').getValue();

      expect(greekLife.isGreekLife()).toBe(true);
      expect(studentOrg.isGreekLife()).toBe(false);
    });

    it('isHiveExclusive() should return true only for hive_exclusive', () => {
      const hiveExclusive = SpaceCategory.create('hive_exclusive').getValue();
      const studentOrg = SpaceCategory.create('student_organizations').getValue();

      expect(hiveExclusive.isHiveExclusive()).toBe(true);
      expect(studentOrg.isHiveExclusive()).toBe(false);
    });
  });

  describe('toString() and getters', () => {
    it('toString() should return the category value', () => {
      const category = SpaceCategory.create('student_organizations').getValue();
      expect(category.toString()).toBe('student_organizations');
    });

    it('label getter should return human-readable label', () => {
      const category = SpaceCategory.create('student_organizations').getValue();
      expect(category.label).toBe('Student Organization');
    });

    it('icon getter should return emoji icon', () => {
      const category = SpaceCategory.create('student_organizations').getValue();
      expect(category.icon).toBe('👥');
    });
  });

  describe('getAllCategories()', () => {
    it('should return all 5 categories', () => {
      const categories = SpaceCategory.getAllCategories();
      expect(categories).toHaveLength(5);
      expect(categories).toContain(SpaceCategoryEnum.STUDENT_ORGANIZATIONS);
      expect(categories).toContain(SpaceCategoryEnum.UNIVERSITY_ORGANIZATIONS);
      expect(categories).toContain(SpaceCategoryEnum.GREEK_LIFE);
      expect(categories).toContain(SpaceCategoryEnum.CAMPUS_LIVING);
      expect(categories).toContain(SpaceCategoryEnum.HIVE_EXCLUSIVE);
    });
  });
});
