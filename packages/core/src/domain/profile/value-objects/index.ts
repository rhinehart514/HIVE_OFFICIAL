/**
 * Profile Value Objects
 * Export all value objects for the Profile bounded context
 */

// Core identifiers
export { ProfileId } from './profile-id.value';
export { CampusId } from './campus-id.value';
export { ProfileHandle } from './profile-handle.value';
export { ConnectionId } from './connection-id.value';

// User classification
export { UserType, UserTypeEnum } from './user-type.value';

// Privacy
export { ProfilePrivacy, PrivacyLevel } from './profile-privacy.value';

// Academic
export { GraduationYear } from './graduation-year.value';
export { Major, AcademicSchool, MAJOR_CATALOG } from './major.value';

// Interests
export {
  Interest,
  InterestCollection,
  InterestCategory,
  INTEREST_SUGGESTIONS
} from './interest.value';

// Connections
export {
  ConnectionStrength,
  ConnectionTier,
  type ConnectionFactors
} from './connection-strength.value';

// Email (multi-campus)
export {
  CampusEmail,
  EmailType,
  CAMPUS_EMAIL_CONFIGS,
  type CampusEmailConfig
} from './campus-email.value';

// Re-export existing value objects from identity context
export { UBEmail } from '../../identity/value-objects/ub-email.value';
export { Handle } from '../../identity/value-objects/handle.value';
export { PersonalInfo } from '../../identity/value-objects/personal-info.value';