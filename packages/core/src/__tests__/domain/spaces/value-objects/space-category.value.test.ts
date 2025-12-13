import { describe, it, expect } from 'vitest';
import { SpaceCategory, SpaceCategoryEnum, CAMPUSLABS_BRANCH_MAP, CATEGORY_LABELS } from '../../../../domain/spaces/value-objects/space-category.value';

describe('SpaceCategory Value Object', () => {
  describe('SpaceCategoryEnum', () => {
    it('should have exactly 4 categories', () => {
      const categories = Object.values(SpaceCategoryEnum);
      expect(categories).toHaveLength(4);
      expect(categories).toContain('student_org');
      expect(categories).toContain('university_org');
      expect(categories).toContain('greek_life');
      expect(categories).toContain('residential');
    });
  });

  describe('CAMPUSLABS_BRANCH_MAP', () => {
    it('should map branch IDs to categories', () => {
      expect(CAMPUSLABS_BRANCH_MAP[1419]).toBe(SpaceCategoryEnum.STUDENT_ORG);
      expect(CAMPUSLABS_BRANCH_MAP[360210]).toBe(SpaceCategoryEnum.UNIVERSITY_ORG);
      expect(CAMPUSLABS_BRANCH_MAP[360211]).toBe(SpaceCategoryEnum.GREEK_LIFE);
      expect(CAMPUSLABS_BRANCH_MAP[360212]).toBe(SpaceCategoryEnum.RESIDENTIAL);
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('should have labels for all categories', () => {
      expect(CATEGORY_LABELS[SpaceCategoryEnum.STUDENT_ORG]).toBe('Student Organization');
      expect(CATEGORY_LABELS[SpaceCategoryEnum.UNIVERSITY_ORG]).toBe('University Organization');
      expect(CATEGORY_LABELS[SpaceCategoryEnum.GREEK_LIFE]).toBe('Greek Life');
      expect(CATEGORY_LABELS[SpaceCategoryEnum.RESIDENTIAL]).toBe('Residential');
    });
  });

  describe('create() with canonical categories', () => {
    it('should create valid SpaceCategory for "student_org"', () => {
      const result = SpaceCategory.create('student_org');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
    });

    it('should create valid SpaceCategory for "university_org"', () => {
      const result = SpaceCategory.create('university_org');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORG);
    });

    it('should create valid SpaceCategory for "greek_life"', () => {
      const result = SpaceCategory.create('greek_life');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
    });

    it('should create valid SpaceCategory for "residential"', () => {
      const result = SpaceCategory.create('residential');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.RESIDENTIAL);
    });
  });

  describe('create() with legacy categories (backwards compatibility)', () => {
    it('should map legacy admin UI names', () => {
      expect(SpaceCategory.create('university_spaces').getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORG);
      expect(SpaceCategory.create('residential_spaces').getValue().value).toBe(SpaceCategoryEnum.RESIDENTIAL);
      expect(SpaceCategory.create('greek_life_spaces').getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
      expect(SpaceCategory.create('student_spaces').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
    });

    it('should map legacy seed route names', () => {
      expect(SpaceCategory.create('student_organizations').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
      expect(SpaceCategory.create('university_organizations').getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORG);
      expect(SpaceCategory.create('campus_living').getValue().value).toBe(SpaceCategoryEnum.RESIDENTIAL);
      expect(SpaceCategory.create('fraternity_and_sorority').getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
    });

    it('should map old domain categories', () => {
      expect(SpaceCategory.create('club').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
      expect(SpaceCategory.create('dorm').getValue().value).toBe(SpaceCategoryEnum.RESIDENTIAL);
      expect(SpaceCategory.create('academic').getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORG);
      expect(SpaceCategory.create('social').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
      expect(SpaceCategory.create('general').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
      expect(SpaceCategory.create('study-group').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
      expect(SpaceCategory.create('sports').getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
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
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
    });

    it('should create from CampusLabs branch ID 360210 (university services)', () => {
      const result = SpaceCategory.createFromBranchId(360210);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORG);
    });

    it('should create from CampusLabs branch ID 360211 (greek life)', () => {
      const result = SpaceCategory.createFromBranchId(360211);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
    });

    it('should create from CampusLabs branch ID 360212 (residential)', () => {
      const result = SpaceCategory.createFromBranchId(360212);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.RESIDENTIAL);
    });

    it('should default to student_org for unknown branch ID', () => {
      const result = SpaceCategory.createFromBranchId(999999);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
    });
  });

  describe('factory methods', () => {
    it('should create student_org via createStudentOrg()', () => {
      const result = SpaceCategory.createStudentOrg();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
    });

    it('should create residential via createResidential()', () => {
      const result = SpaceCategory.createResidential();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.RESIDENTIAL);
    });

    it('should create university_org via createUniversityOrg()', () => {
      const result = SpaceCategory.createUniversityOrg();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORG);
    });

    it('should create greek_life via createGreekLife()', () => {
      const result = SpaceCategory.createGreekLife();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
    });
  });

  describe('helper methods', () => {
    it('isStudentManaged() should return true for student_org and greek_life', () => {
      const studentOrg = SpaceCategory.create('student_org').getValue();
      const greekLife = SpaceCategory.create('greek_life').getValue();
      const universityOrg = SpaceCategory.create('university_org').getValue();
      const residential = SpaceCategory.create('residential').getValue();

      expect(studentOrg.isStudentManaged()).toBe(true);
      expect(greekLife.isStudentManaged()).toBe(true);
      expect(universityOrg.isStudentManaged()).toBe(false);
      expect(residential.isStudentManaged()).toBe(false);
    });

    it('isUniversityManaged() should return true only for university_org', () => {
      const studentOrg = SpaceCategory.create('student_org').getValue();
      const universityOrg = SpaceCategory.create('university_org').getValue();

      expect(universityOrg.isUniversityManaged()).toBe(true);
      expect(studentOrg.isUniversityManaged()).toBe(false);
    });

    it('isResidential() should return true only for residential', () => {
      const residential = SpaceCategory.create('residential').getValue();
      const studentOrg = SpaceCategory.create('student_org').getValue();

      expect(residential.isResidential()).toBe(true);
      expect(studentOrg.isResidential()).toBe(false);
    });

    it('isGreekLife() should return true only for greek_life', () => {
      const greekLife = SpaceCategory.create('greek_life').getValue();
      const studentOrg = SpaceCategory.create('student_org').getValue();

      expect(greekLife.isGreekLife()).toBe(true);
      expect(studentOrg.isGreekLife()).toBe(false);
    });
  });

  describe('toString() and getters', () => {
    it('toString() should return the category value', () => {
      const category = SpaceCategory.create('student_org').getValue();
      expect(category.toString()).toBe('student_org');
    });

    it('label getter should return human-readable label', () => {
      const category = SpaceCategory.create('student_org').getValue();
      expect(category.label).toBe('Student Organization');
    });

    it('icon getter should return emoji icon', () => {
      const category = SpaceCategory.create('student_org').getValue();
      expect(category.icon).toBe('👥');
    });
  });

  describe('getAllCategories()', () => {
    it('should return all 4 categories', () => {
      const categories = SpaceCategory.getAllCategories();
      expect(categories).toHaveLength(4);
      expect(categories).toContain(SpaceCategoryEnum.STUDENT_ORG);
      expect(categories).toContain(SpaceCategoryEnum.UNIVERSITY_ORG);
      expect(categories).toContain(SpaceCategoryEnum.GREEK_LIFE);
      expect(categories).toContain(SpaceCategoryEnum.RESIDENTIAL);
    });
  });
});
