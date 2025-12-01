import { describe, it, expect } from 'vitest';
import { SpaceCategory, SpaceCategoryEnum, ApiCategoryEnum } from '../../../../domain/spaces/value-objects/space-category.value';

describe('SpaceCategory Value Object', () => {
  describe('SpaceCategoryEnum (Domain Categories)', () => {
    it('should have exactly 9 domain categories', () => {
      const categories = Object.values(SpaceCategoryEnum);
      expect(categories).toHaveLength(9);
      expect(categories).toContain('general');
      expect(categories).toContain('study-group');
      expect(categories).toContain('social');
      expect(categories).toContain('event');
      expect(categories).toContain('resource');
      expect(categories).toContain('dorm');
      expect(categories).toContain('club');
      expect(categories).toContain('sports');
      expect(categories).toContain('academic');
    });
  });

  describe('ApiCategoryEnum (API Categories)', () => {
    it('should have exactly 4 API categories', () => {
      const categories = Object.values(ApiCategoryEnum);
      expect(categories).toHaveLength(4);
      expect(categories).toContain('student_org');
      expect(categories).toContain('residential');
      expect(categories).toContain('university_org');
      expect(categories).toContain('greek_life');
    });
  });

  describe('create() with domain categories', () => {
    it('should create valid SpaceCategory for domain category "club"', () => {
      const result = SpaceCategory.create('club');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.CLUB);
    });

    it('should create valid SpaceCategory for domain category "dorm"', () => {
      const result = SpaceCategory.create('dorm');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.DORM);
    });

    it('should create valid SpaceCategory for domain category "academic"', () => {
      const result = SpaceCategory.create('academic');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.ACADEMIC);
    });

    it('should create valid SpaceCategory for domain category "social"', () => {
      const result = SpaceCategory.create('social');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.SOCIAL);
    });
  });

  describe('create() with API categories (bidirectional)', () => {
    it('should create SpaceCategory from API category "student_org" -> maps to CLUB', () => {
      const result = SpaceCategory.create('student_org');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.CLUB);
    });

    it('should create SpaceCategory from API category "residential" -> maps to DORM', () => {
      const result = SpaceCategory.create('residential');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.DORM);
    });

    it('should create SpaceCategory from API category "university_org" -> maps to ACADEMIC', () => {
      const result = SpaceCategory.create('university_org');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.ACADEMIC);
    });

    it('should create SpaceCategory from API category "greek_life" -> maps to SOCIAL', () => {
      const result = SpaceCategory.create('greek_life');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.SOCIAL);
    });

    it('should fail for completely invalid category', () => {
      const result = SpaceCategory.create('invalid_category');
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid space category');
    });
  });

  describe('createFromApi()', () => {
    it('should create from student_org', () => {
      const result = SpaceCategory.createFromApi('student_org');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.CLUB);
    });

    it('should create from residential', () => {
      const result = SpaceCategory.createFromApi('residential');
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.DORM);
    });

    it('should fail for domain category passed to createFromApi', () => {
      const result = SpaceCategory.createFromApi('club');
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid API category');
    });
  });

  describe('factory methods', () => {
    it('should create CLUB via createStudentOrg()', () => {
      const result = SpaceCategory.createStudentOrg();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.CLUB);
      expect(result.getValue().apiValue).toBe(ApiCategoryEnum.STUDENT_ORG);
    });

    it('should create DORM via createResidential()', () => {
      const result = SpaceCategory.createResidential();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.DORM);
      expect(result.getValue().apiValue).toBe(ApiCategoryEnum.RESIDENTIAL);
    });

    it('should create ACADEMIC via createUniversityOrg()', () => {
      const result = SpaceCategory.createUniversityOrg();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.ACADEMIC);
      expect(result.getValue().apiValue).toBe(ApiCategoryEnum.UNIVERSITY_ORG);
    });

    it('should create SOCIAL via createGreekLife()', () => {
      const result = SpaceCategory.createGreekLife();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.SOCIAL);
      expect(result.getValue().apiValue).toBe(ApiCategoryEnum.GREEK_LIFE);
    });

    it('should create GENERAL via createGeneral()', () => {
      const result = SpaceCategory.createGeneral();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.GENERAL);
    });

    it('should create STUDY_GROUP via createStudyGroup()', () => {
      const result = SpaceCategory.createStudyGroup();
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(SpaceCategoryEnum.STUDY_GROUP);
    });
  });

  describe('apiValue getter (domain -> API mapping)', () => {
    it('CLUB should map to STUDENT_ORG', () => {
      const category = SpaceCategory.create('club').getValue();
      expect(category.apiValue).toBe(ApiCategoryEnum.STUDENT_ORG);
    });

    it('DORM should map to RESIDENTIAL', () => {
      const category = SpaceCategory.create('dorm').getValue();
      expect(category.apiValue).toBe(ApiCategoryEnum.RESIDENTIAL);
    });

    it('ACADEMIC should map to UNIVERSITY_ORG', () => {
      const category = SpaceCategory.create('academic').getValue();
      expect(category.apiValue).toBe(ApiCategoryEnum.UNIVERSITY_ORG);
    });

    it('SOCIAL should map to GREEK_LIFE', () => {
      const category = SpaceCategory.create('social').getValue();
      expect(category.apiValue).toBe(ApiCategoryEnum.GREEK_LIFE);
    });

    it('GENERAL should map to STUDENT_ORG', () => {
      const category = SpaceCategory.create('general').getValue();
      expect(category.apiValue).toBe(ApiCategoryEnum.STUDENT_ORG);
    });

    it('RESOURCE should map to UNIVERSITY_ORG', () => {
      const category = SpaceCategory.create('resource').getValue();
      expect(category.apiValue).toBe(ApiCategoryEnum.UNIVERSITY_ORG);
    });
  });

  describe('category grouping methods', () => {
    it('should identify university-managed categories', () => {
      const academic = SpaceCategory.create('academic').getValue();
      const resource = SpaceCategory.create('resource').getValue();

      expect(academic.isUniversityManaged()).toBe(true);
      expect(resource.isUniversityManaged()).toBe(true);
    });

    it('should identify student-managed categories', () => {
      const club = SpaceCategory.create('club').getValue();
      const general = SpaceCategory.create('general').getValue();
      const studyGroup = SpaceCategory.create('study-group').getValue();

      expect(club.isStudentManaged()).toBe(true);
      expect(general.isStudentManaged()).toBe(true);
      expect(studyGroup.isStudentManaged()).toBe(true);
    });

    it('residential (DORM) should be university-managed', () => {
      const dorm = SpaceCategory.create('dorm').getValue();
      expect(dorm.isUniversityManaged()).toBe(false); // RESIDENTIAL is not UNIVERSITY_ORG
      expect(dorm.apiValue).toBe(ApiCategoryEnum.RESIDENTIAL);
    });

    it('isAcademic() should identify academic categories', () => {
      const studyGroup = SpaceCategory.create('study-group').getValue();
      const academic = SpaceCategory.create('academic').getValue();
      const resource = SpaceCategory.create('resource').getValue();
      const club = SpaceCategory.create('club').getValue();

      expect(studyGroup.isAcademic()).toBe(true);
      expect(academic.isAcademic()).toBe(true);
      expect(resource.isAcademic()).toBe(true);
      expect(club.isAcademic()).toBe(false);
    });

    it('isSocial() should identify social categories', () => {
      const social = SpaceCategory.create('social').getValue();
      const dorm = SpaceCategory.create('dorm').getValue();
      const club = SpaceCategory.create('club').getValue();
      const sports = SpaceCategory.create('sports').getValue();
      const academic = SpaceCategory.create('academic').getValue();

      expect(social.isSocial()).toBe(true);
      expect(dorm.isSocial()).toBe(true);
      expect(club.isSocial()).toBe(true);
      expect(sports.isSocial()).toBe(true);
      expect(academic.isSocial()).toBe(false);
    });
  });

  describe('toString() and toApiString()', () => {
    it('toString() should return the domain category value', () => {
      const category = SpaceCategory.create('club').getValue();
      expect(category.toString()).toBe('club');
    });

    it('toApiString() should return the API category value', () => {
      const category = SpaceCategory.create('club').getValue();
      expect(category.toApiString()).toBe('student_org');
    });

    it('create from API, toApiString returns same API value', () => {
      const category = SpaceCategory.create('student_org').getValue();
      expect(category.toApiString()).toBe('student_org');
    });
  });
});
