import { describe, it, expect, beforeAll } from 'vitest';
import { ProfilePrivacy, PrivacyLevel } from '../../../../domain/profile/value-objects/profile-privacy.value';

describe('ProfilePrivacy Value Object', () => {
  describe('PrivacyLevel enum', () => {
    it('should have exactly 4 privacy levels', () => {
      const levels = Object.values(PrivacyLevel);
      expect(levels).toHaveLength(4);
      expect(levels).toContain('public');
      expect(levels).toContain('campus_only');
      expect(levels).toContain('connections_only');
      expect(levels).toContain('private');
    });

    it('should have correct enum values', () => {
      expect(PrivacyLevel.PUBLIC).toBe('public');
      expect(PrivacyLevel.CAMPUS_ONLY).toBe('campus_only');
      expect(PrivacyLevel.CONNECTIONS_ONLY).toBe('connections_only');
      expect(PrivacyLevel.PRIVATE).toBe('private');
    });
  });

  describe('create() factory method', () => {
    it('should create ProfilePrivacy with all props specified', () => {
      const result = ProfilePrivacy.create({
        level: PrivacyLevel.CAMPUS_ONLY,
        showEmail: true,
        showPhone: false,
        showDorm: true,
        showSchedule: false,
        showActivity: true,
      });

      expect(result.isSuccess).toBe(true);
      const privacy = result.getValue();
      expect(privacy.level).toBe(PrivacyLevel.CAMPUS_ONLY);
      expect(privacy.showEmail).toBe(true);
      expect(privacy.showPhone).toBe(false);
      expect(privacy.showDorm).toBe(true);
      expect(privacy.showSchedule).toBe(false);
      expect(privacy.showActivity).toBe(true);
    });

    it('should use default values for omitted props', () => {
      const result = ProfilePrivacy.create({});

      expect(result.isSuccess).toBe(true);
      const privacy = result.getValue();
      // Defaults: CAMPUS_ONLY level, email/phone/schedule hidden, dorm/activity shown
      expect(privacy.level).toBe(PrivacyLevel.CAMPUS_ONLY);
      expect(privacy.showEmail).toBe(false);
      expect(privacy.showPhone).toBe(false);
      expect(privacy.showDorm).toBe(true);
      expect(privacy.showSchedule).toBe(false);
      expect(privacy.showActivity).toBe(true);
    });

    it('should allow partial props with defaults for the rest', () => {
      const result = ProfilePrivacy.create({
        level: PrivacyLevel.PUBLIC,
        showEmail: true,
      });

      expect(result.isSuccess).toBe(true);
      const privacy = result.getValue();
      expect(privacy.level).toBe(PrivacyLevel.PUBLIC);
      expect(privacy.showEmail).toBe(true);
      // Rest should be defaults
      expect(privacy.showPhone).toBe(false);
      expect(privacy.showDorm).toBe(true);
      expect(privacy.showSchedule).toBe(false);
      expect(privacy.showActivity).toBe(true);
    });
  });

  describe('createDefault()', () => {
    it('should create privacy with campus-only defaults', () => {
      const result = ProfilePrivacy.createDefault();

      expect(result.isSuccess).toBe(true);
      const privacy = result.getValue();
      expect(privacy.level).toBe(PrivacyLevel.CAMPUS_ONLY);
      expect(privacy.showEmail).toBe(false);
      expect(privacy.showPhone).toBe(false);
      expect(privacy.showDorm).toBe(true);
      expect(privacy.showSchedule).toBe(false);
      expect(privacy.showActivity).toBe(true);
    });
  });

  describe('createPublic()', () => {
    it('should create public privacy with most fields visible', () => {
      const result = ProfilePrivacy.createPublic();

      expect(result.isSuccess).toBe(true);
      const privacy = result.getValue();
      expect(privacy.level).toBe(PrivacyLevel.PUBLIC);
      expect(privacy.showEmail).toBe(false);
      expect(privacy.showPhone).toBe(false);
      expect(privacy.showDorm).toBe(true);
      expect(privacy.showSchedule).toBe(true);
      expect(privacy.showActivity).toBe(true);
    });
  });

  describe('createPrivate()', () => {
    it('should create private privacy with all fields hidden', () => {
      const result = ProfilePrivacy.createPrivate();

      expect(result.isSuccess).toBe(true);
      const privacy = result.getValue();
      expect(privacy.level).toBe(PrivacyLevel.PRIVATE);
      expect(privacy.showEmail).toBe(false);
      expect(privacy.showPhone).toBe(false);
      expect(privacy.showDorm).toBe(false);
      expect(privacy.showSchedule).toBe(false);
      expect(privacy.showActivity).toBe(false);
    });
  });

  describe('canViewProfile() - 4-tier privacy enforcement', () => {
    describe('PUBLIC level', () => {
      let publicPrivacy: ProfilePrivacy;

      beforeAll(() => {
        publicPrivacy = ProfilePrivacy.createPublic().getValue();
      });

      it('should allow public viewers', () => {
        expect(publicPrivacy.canViewProfile('public')).toBe(true);
      });

      it('should allow campus viewers', () => {
        expect(publicPrivacy.canViewProfile('campus')).toBe(true);
      });

      it('should allow connection viewers', () => {
        expect(publicPrivacy.canViewProfile('connection')).toBe(true);
      });
    });

    describe('CAMPUS_ONLY level', () => {
      let campusPrivacy: ProfilePrivacy;

      beforeAll(() => {
        campusPrivacy = ProfilePrivacy.create({ level: PrivacyLevel.CAMPUS_ONLY }).getValue();
      });

      it('should deny public viewers', () => {
        expect(campusPrivacy.canViewProfile('public')).toBe(false);
      });

      it('should allow campus viewers', () => {
        expect(campusPrivacy.canViewProfile('campus')).toBe(true);
      });

      it('should allow connection viewers', () => {
        expect(campusPrivacy.canViewProfile('connection')).toBe(true);
      });
    });

    describe('CONNECTIONS_ONLY level', () => {
      let connectionsPrivacy: ProfilePrivacy;

      beforeAll(() => {
        connectionsPrivacy = ProfilePrivacy.create({ level: PrivacyLevel.CONNECTIONS_ONLY }).getValue();
      });

      it('should deny public viewers', () => {
        expect(connectionsPrivacy.canViewProfile('public')).toBe(false);
      });

      it('should deny campus viewers', () => {
        expect(connectionsPrivacy.canViewProfile('campus')).toBe(false);
      });

      it('should allow connection viewers', () => {
        expect(connectionsPrivacy.canViewProfile('connection')).toBe(true);
      });
    });

    describe('PRIVATE level', () => {
      let privatePrivacy: ProfilePrivacy;

      beforeAll(() => {
        privatePrivacy = ProfilePrivacy.createPrivate().getValue();
      });

      it('should deny public viewers', () => {
        expect(privatePrivacy.canViewProfile('public')).toBe(false);
      });

      it('should deny campus viewers', () => {
        expect(privatePrivacy.canViewProfile('campus')).toBe(false);
      });

      it('should deny connection viewers', () => {
        expect(privatePrivacy.canViewProfile('connection')).toBe(false);
      });
    });
  });

  describe('canViewProfile() - matrix test (4 levels x 3 viewer types)', () => {
    const testCases: Array<{
      level: PrivacyLevel;
      viewerType: 'public' | 'campus' | 'connection';
      expected: boolean;
    }> = [
      // PUBLIC level - everyone can view
      { level: PrivacyLevel.PUBLIC, viewerType: 'public', expected: true },
      { level: PrivacyLevel.PUBLIC, viewerType: 'campus', expected: true },
      { level: PrivacyLevel.PUBLIC, viewerType: 'connection', expected: true },

      // CAMPUS_ONLY - campus and connections can view, not public
      { level: PrivacyLevel.CAMPUS_ONLY, viewerType: 'public', expected: false },
      { level: PrivacyLevel.CAMPUS_ONLY, viewerType: 'campus', expected: true },
      { level: PrivacyLevel.CAMPUS_ONLY, viewerType: 'connection', expected: true },

      // CONNECTIONS_ONLY - only connections can view
      { level: PrivacyLevel.CONNECTIONS_ONLY, viewerType: 'public', expected: false },
      { level: PrivacyLevel.CONNECTIONS_ONLY, viewerType: 'campus', expected: false },
      { level: PrivacyLevel.CONNECTIONS_ONLY, viewerType: 'connection', expected: true },

      // PRIVATE - no one can view (owner check is separate)
      { level: PrivacyLevel.PRIVATE, viewerType: 'public', expected: false },
      { level: PrivacyLevel.PRIVATE, viewerType: 'campus', expected: false },
      { level: PrivacyLevel.PRIVATE, viewerType: 'connection', expected: false },
    ];

    testCases.forEach(({ level, viewerType, expected }) => {
      it(`${level} + ${viewerType} viewer => ${expected ? 'ALLOW' : 'DENY'}`, () => {
        const privacy = ProfilePrivacy.create({ level }).getValue();
        expect(privacy.canViewProfile(viewerType)).toBe(expected);
      });
    });
  });

  describe('getters for field-level visibility', () => {
    it('should return correct values from getters', () => {
      const result = ProfilePrivacy.create({
        level: PrivacyLevel.PUBLIC,
        showEmail: true,
        showPhone: true,
        showDorm: false,
        showSchedule: true,
        showActivity: false,
      });

      const privacy = result.getValue();
      expect(privacy.level).toBe(PrivacyLevel.PUBLIC);
      expect(privacy.showEmail).toBe(true);
      expect(privacy.showPhone).toBe(true);
      expect(privacy.showDorm).toBe(false);
      expect(privacy.showSchedule).toBe(true);
      expect(privacy.showActivity).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should use defaults when no level is specified (omitted property)', () => {
      const result = ProfilePrivacy.create({
        showEmail: true,
        // level is not specified, not even as undefined
      });

      expect(result.isSuccess).toBe(true);
      // Default level should be CAMPUS_ONLY when property is omitted
      expect(result.getValue().level).toBe(PrivacyLevel.CAMPUS_ONLY);
    });

    it('should create two equal privacy objects with same props', () => {
      const privacy1 = ProfilePrivacy.create({
        level: PrivacyLevel.CAMPUS_ONLY,
        showEmail: true,
        showPhone: false,
        showDorm: true,
        showSchedule: false,
        showActivity: true,
      }).getValue();

      const privacy2 = ProfilePrivacy.create({
        level: PrivacyLevel.CAMPUS_ONLY,
        showEmail: true,
        showPhone: false,
        showDorm: true,
        showSchedule: false,
        showActivity: true,
      }).getValue();

      // ValueObjects with same props should be equal
      expect(privacy1.equals(privacy2)).toBe(true);
    });

    it('should detect different privacy objects as not equal', () => {
      const privacy1 = ProfilePrivacy.create({
        level: PrivacyLevel.CAMPUS_ONLY,
      }).getValue();

      const privacy2 = ProfilePrivacy.create({
        level: PrivacyLevel.PRIVATE,
      }).getValue();

      expect(privacy1.equals(privacy2)).toBe(false);
    });
  });
});
