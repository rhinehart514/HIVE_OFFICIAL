import { describe, it, expect } from 'vitest';
import { SpaceCategory, SpaceCategoryEnum } from '../../../../domain/spaces/value-objects/space-category.value';

describe('SpaceCategory Value Object', () => {
  describe('SpaceCategoryEnum', () => {
    it('should have exactly 4 canonical categories', () => {
      const categories = Object.values(SpaceCategoryEnum);
      expect(categories).toHaveLength(4);
      expect(categories).toContain('student_org');
      expect(categories).toContain('residential');
      expect(categories).toContain('university_org');
      expect(categories).toContain('greek_life');
    });
  });

  describe('create()', () => {
    it('should create valid SpaceCategory for student_org', () => {
      const result = SpaceCategory.create('student_org');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDENT_ORG);
    });

    it('should create valid SpaceCategory for residential', () => {
      const result = SpaceCategory.create('residential');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.RESIDENTIAL);
    });

    it('should create valid SpaceCategory for university_org', () => {
      const result = SpaceCategory.create('university_org');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.UNIVERSITY_ORG);
    });

    it('should create valid SpaceCategory for greek_life', () => {
      const result = SpaceCategory.create('greek_life');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.GREEK_LIFE);
    });

    it('should fail for invalid category', () => {
      const result = SpaceCategory.create('invalid_category');
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid space category');
    });

    it('should fail for old category values (general)', () => {
      const result = SpaceCategory.create('general');
      expect(result.isFailure).toBe(true);
    });

    it('should fail for old category values (study-group)', () => {
      const result = SpaceCategory.create('study-group');
      expect(result.isFailure).toBe(true);
    });

    it('should fail for old category values (social)', () => {
      const result = SpaceCategory.create('social');
      expect(result.isFailure).toBe(true);
    });

    it('should fail for old category values (academic)', () => {
      const result = SpaceCategory.create('academic');
      expect(result.isFailure).toBe(true);
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

  describe('category grouping methods', () => {
    it('should identify university-managed categories (university_org, residential)', () => {
      const universityOrg = SpaceCategory.create('university_org').getValue();
      const residential = SpaceCategory.create('residential').getValue();
      
      expect(universityOrg.isUniversityManaged()).toBe(true);
      expect(residential.isUniversityManaged()).toBe(true);
    });

    it('should identify student-managed categories (student_org, greek_life)', () => {
      const studentOrg = SpaceCategory.create('student_org').getValue();
      const greekLife = SpaceCategory.create('greek_life').getValue();
      
      expect(studentOrg.isStudentManaged()).toBe(true);
      expect(greekLife.isStudentManaged()).toBe(true);
    });

    it('student_org should NOT be university-managed', () => {
      const studentOrg = SpaceCategory.create('student_org').getValue();
      expect(studentOrg.isUniversityManaged()).toBe(false);
    });

    it('university_org should NOT be student-managed', () => {
      const universityOrg = SpaceCategory.create('university_org').getValue();
      expect(universityOrg.isStudentManaged()).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return the category value as string', () => {
      const category = SpaceCategory.create('student_org').getValue();
      expect(category.toString()).toBe('student_org');
    });
  });
});
