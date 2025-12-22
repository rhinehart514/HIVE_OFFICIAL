/**
 * Firebase Admin Profile Repository
 * Server-side implementation using Firebase Admin SDK
 *
 * Use this in API routes (server-side) instead of the client-side repository.
 */

import { dbAdmin } from '../../../firebase-admin';
import { IProfileRepository } from '../interfaces';
import { Result } from '../../../domain/shared/base/Result';
import { EnhancedProfile, PersonalInfo, SocialInfo } from '../../../domain/profile/aggregates/enhanced-profile';
import { ProfileId } from '../../../domain/profile/value-objects/profile-id.value';
import { UBEmail } from '../../../domain/profile/value-objects';
import { ProfileHandle } from '../../../domain/profile/value-objects/profile-handle.value';
import { CampusId } from '../../../domain/profile/value-objects/campus-id.value';
import { UserType } from '../../../domain/profile/value-objects/user-type.value';
import { ProfilePrivacy, PrivacyLevel } from '../../../domain/profile/value-objects/profile-privacy.value';
// New value object imports for validation
import { GraduationYear } from '../../../domain/profile/value-objects/graduation-year.value';
import { Major } from '../../../domain/profile/value-objects/major.value';
import { Interest, InterestCollection } from '../../../domain/profile/value-objects/interest.value';

/**
 * Firestore document schema for profiles
 * Maps between flat Firestore structure and DDD nested structure
 */
export interface ProfileDocument {
  // Core identity
  email: string;
  handle: string;

  // Personal info (flat in Firestore)
  firstName: string;
  lastName: string;
  fullName?: string;
  bio?: string;
  major?: string;
  graduationYear?: number;
  dorm?: string;
  housing?: string;
  pronouns?: string;
  academicYear?: string;
  profileImageUrl?: string;
  coverPhoto?: string;
  photos?: string[];

  // Social info (flat in Firestore)
  interests?: string[];
  clubs?: string[];
  sports?: string[];
  greek?: string;
  instagram?: string;
  snapchat?: string;
  twitter?: string;
  linkedin?: string;

  // Status & availability
  statusMessage?: string;
  currentVibe?: string;
  availabilityStatus?: 'online' | 'studying' | 'busy' | 'away' | 'invisible';
  lookingFor?: string[];

  // Connections & spaces
  connections?: string[];
  spaceIds?: string[];

  // Privacy settings (flat in Firestore)
  privacySettings?: {
    isPublic?: boolean;
    showActivity?: boolean;
    showSpaces?: boolean;
    showConnections?: boolean;
    allowDirectMessages?: boolean;
    showOnlineStatus?: boolean;
    // New: DDD privacy level support
    level?: PrivacyLevel;
    showEmail?: boolean;
    showPhone?: boolean;
    showDorm?: boolean;
    showSchedule?: boolean;
  };

  // Bento grid configuration (NEW)
  bentoConfig?: {
    cards: BentoCardConfig[];
    layout?: 'default' | 'compact' | 'expanded';
  };

  // State
  userType?: string;
  campusId?: string;
  onboardingComplete?: boolean;
  onboardingStep?: number;
  isActive?: boolean;
  isVerified?: boolean;

  // Metrics
  activityScore?: number;
  followerCount?: number;
  followingCount?: number;
  connectionCount?: number;

  // Builder features
  builderOptIn?: boolean;
  builderAnalyticsEnabled?: boolean;

  // Timestamps
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  lastSeen?: FirebaseFirestore.Timestamp;
}

/**
 * Bento card configuration for profile customization
 */
export interface BentoCardConfig {
  id: string;
  type: BentoCardType;
  position: { row: number; col: number };
  size: { width: number; height: number };
  visible: boolean;
  privacyLevel?: PrivacyLevel;
}

export type BentoCardType =
  | 'identity'
  | 'spaces'
  | 'interests'
  | 'activity'
  | 'connections'
  | 'schedule'
  | 'photos'
  | 'music'
  | 'quotes'
  | 'achievements'
  | 'looking-for'
  | 'vibe'
  | 'major'
  | 'dorm'
  | 'greek'
  | 'sports'
  | 'socials'
  | 'availability'
  | 'classes'
  | 'projects';

/**
 * Firebase Admin Profile Repository Implementation
 */
export class FirebaseAdminProfileRepository implements IProfileRepository {
  private readonly collectionName = 'users';
  private readonly connectionsCollection = 'connections';

  /**
   * Find profile by ID
   */
  async findById(id: ProfileId | string): Promise<Result<EnhancedProfile>> {
    try {
      const profileId = typeof id === 'string' ? id : id.value;
      const docRef = dbAdmin.collection(this.collectionName).doc(profileId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.fail<EnhancedProfile>('Profile not found');
      }

      const data = docSnap.data() as ProfileDocument;
      return this.toDomain(profileId, data);
    } catch (error) {
      return Result.fail<EnhancedProfile>(`Failed to find profile: ${error}`);
    }
  }

  /**
   * Find profile by email
   */
  async findByEmail(email: string): Promise<Result<EnhancedProfile>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return Result.fail<EnhancedProfile>('Profile not found');
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return Result.fail<EnhancedProfile>('Profile document not found');
      }

      return this.toDomain(doc.id, doc.data() as ProfileDocument);
    } catch (error) {
      return Result.fail<EnhancedProfile>(`Failed to find profile: ${error}`);
    }
  }

  /**
   * Find profile by handle
   */
  async findByHandle(handle: string): Promise<Result<EnhancedProfile>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('handle', '==', handle.toLowerCase())
        .limit(1)
        .get();

      if (snapshot.empty) {
        return Result.fail<EnhancedProfile>('Profile not found');
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return Result.fail<EnhancedProfile>('Profile document not found');
      }

      return this.toDomain(doc.id, doc.data() as ProfileDocument);
    } catch (error) {
      return Result.fail<EnhancedProfile>(`Failed to find profile: ${error}`);
    }
  }

  /**
   * Find profiles by campus
   */
  async findByCampus(campusId: string, limitCount: number = 50): Promise<Result<EnhancedProfile[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();

      const profiles: EnhancedProfile[] = [];
      for (const doc of snapshot.docs) {
        const result = await this.toDomain(doc.id, doc.data() as ProfileDocument);
        if (result.isSuccess) {
          profiles.push(result.getValue());
        }
      }

      return Result.ok<EnhancedProfile[]>(profiles);
    } catch (error) {
      return Result.fail<EnhancedProfile[]>(`Failed to find profiles: ${error}`);
    }
  }

  /**
   * Check if handle exists
   */
  async exists(handle: string): Promise<boolean> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('handle', '==', handle.toLowerCase())
        .limit(1)
        .get();
      return !snapshot.empty;
    } catch {
      return false;
    }
  }

  /**
   * Search profiles by name
   */
  async searchByName(searchQuery: string, campusId: string): Promise<Result<EnhancedProfile[]>> {
    try {
      // Firebase doesn't support full-text search natively
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .orderBy('firstName')
        .limit(50)
        .get();

      const profiles: EnhancedProfile[] = [];
      const searchLower = searchQuery.toLowerCase();

      for (const doc of snapshot.docs) {
        const data = doc.data() as ProfileDocument;
        const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
        const handle = data.handle?.toLowerCase() || '';

        if (fullName.includes(searchLower) || handle.includes(searchLower)) {
          const result = await this.toDomain(doc.id, data);
          if (result.isSuccess) {
            profiles.push(result.getValue());
          }
        }
      }

      return Result.ok<EnhancedProfile[]>(profiles);
    } catch (error) {
      return Result.fail<EnhancedProfile[]>(`Search failed: ${error}`);
    }
  }

  /**
   * Save profile to Firestore
   */
  async save(profile: EnhancedProfile): Promise<Result<void>> {
    try {
      const data = this.toPersistence(profile);
      const docRef = dbAdmin.collection(this.collectionName).doc(profile.profileId.value);

      await docRef.set(data, { merge: true });

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save profile: ${error}`);
    }
  }

  /**
   * Delete profile
   */
  async delete(id: ProfileId | string): Promise<Result<void>> {
    try {
      const profileId = typeof id === 'string' ? id : id.value;
      await dbAdmin.collection(this.collectionName).doc(profileId).delete();
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to delete profile: ${error}`);
    }
  }

  /**
   * Find onboarded profiles
   */
  async findOnboardedProfiles(maxCount: number = 100): Promise<Result<EnhancedProfile[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('onboardingComplete', '==', true)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(maxCount)
        .get();

      const profiles: EnhancedProfile[] = [];
      for (const doc of snapshot.docs) {
        const result = await this.toDomain(doc.id, doc.data() as ProfileDocument);
        if (result.isSuccess) {
          profiles.push(result.getValue());
        }
      }

      return Result.ok<EnhancedProfile[]>(profiles);
    } catch (error) {
      return Result.fail<EnhancedProfile[]>(`Failed to find onboarded profiles: ${error}`);
    }
  }

  /**
   * Find profiles by interest
   */
  async findByInterest(interest: string, limitCount: number = 50): Promise<Result<EnhancedProfile[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('interests', 'array-contains', interest)
        .where('isActive', '==', true)
        .orderBy('activityScore', 'desc')
        .limit(limitCount)
        .get();

      const profiles: EnhancedProfile[] = [];
      for (const doc of snapshot.docs) {
        const result = await this.toDomain(doc.id, doc.data() as ProfileDocument);
        if (result.isSuccess) {
          profiles.push(result.getValue());
        }
      }

      return Result.ok<EnhancedProfile[]>(profiles);
    } catch (error) {
      return Result.fail<EnhancedProfile[]>(`Failed to find profiles by interest: ${error}`);
    }
  }

  /**
   * Find profiles by major
   */
  async findByMajor(major: string, limitCount: number = 50): Promise<Result<EnhancedProfile[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('major', '==', major)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();

      const profiles: EnhancedProfile[] = [];
      for (const doc of snapshot.docs) {
        const result = await this.toDomain(doc.id, doc.data() as ProfileDocument);
        if (result.isSuccess) {
          profiles.push(result.getValue());
        }
      }

      return Result.ok<EnhancedProfile[]>(profiles);
    } catch (error) {
      return Result.fail<EnhancedProfile[]>(`Failed to find profiles by major: ${error}`);
    }
  }

  /**
   * Find connections of a profile
   */
  async findConnectionsOf(profileId: string): Promise<Result<EnhancedProfile[]>> {
    try {
      // Find all accepted connections
      const [outgoing, incoming] = await Promise.all([
        dbAdmin
          .collection(this.connectionsCollection)
          .where('fromProfileId', '==', profileId)
          .where('status', '==', 'accepted')
          .get(),
        dbAdmin
          .collection(this.connectionsCollection)
          .where('toProfileId', '==', profileId)
          .where('status', '==', 'accepted')
          .get()
      ]);

      // Collect connected profile IDs
      const connectedIds = new Set<string>();
      outgoing.docs.forEach(doc => {
        const data = doc.data();
        if (data.toProfileId) connectedIds.add(data.toProfileId);
      });
      incoming.docs.forEach(doc => {
        const data = doc.data();
        if (data.fromProfileId) connectedIds.add(data.fromProfileId);
      });

      // Fetch connected profiles
      const profiles: EnhancedProfile[] = [];
      for (const connectedId of connectedIds) {
        const result = await this.findById(connectedId);
        if (result.isSuccess) {
          profiles.push(result.getValue());
        }
      }

      return Result.ok<EnhancedProfile[]>(profiles);
    } catch (error) {
      return Result.fail<EnhancedProfile[]>(`Failed to find connections: ${error}`);
    }
  }

  /**
   * Get total campus users count
   */
  async getTotalCampusUsers(campusId: string): Promise<Result<number>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .count()
        .get();

      return Result.ok<number>(snapshot.data().count);
    } catch (error) {
      return Result.fail<number>(`Failed to count campus users: ${error}`);
    }
  }

  /**
   * Check if viewer can see profile based on privacy settings
   */
  async canViewProfile(
    targetProfileId: string,
    viewerId: string | null,
    viewerCampusId: string | null
  ): Promise<{ canView: boolean; viewerType: 'public' | 'campus' | 'connection' }> {
    // Determine viewer type
    let viewerType: 'public' | 'campus' | 'connection' = 'public';

    if (viewerId) {
      // Check if same campus
      const targetResult = await this.findById(targetProfileId);
      if (targetResult.isSuccess) {
        const targetProfile = targetResult.getValue();

        if (viewerCampusId && targetProfile.campusId.id === viewerCampusId) {
          viewerType = 'campus';
        }

        // Check if connected
        if (viewerType === 'campus') {
          const connectionsResult = await this.findConnectionsOf(targetProfileId);
          if (connectionsResult.isSuccess) {
            const connections = connectionsResult.getValue();
            if (connections.some(c => c.profileId.value === viewerId)) {
              viewerType = 'connection';
            }
          }
        }

        // Use privacy value object to check
        const canView = targetProfile.privacy.canViewProfile(viewerType);
        return { canView, viewerType };
      }
    }

    return { canView: false, viewerType };
  }

  /**
   * Map Firestore document to domain aggregate
   */
  private async toDomain(id: string, data: ProfileDocument): Promise<Result<EnhancedProfile>> {
    try {
      // Set defaults for missing data
      const campusId = data.campusId || 'ub-buffalo';

      // Create value objects
      const emailResult = UBEmail.create(data.email);
      if (emailResult.isFailure) {
        return Result.fail<EnhancedProfile>(emailResult.error!);
      }

      const handleResult = ProfileHandle.create(data.handle || id);
      if (handleResult.isFailure) {
        return Result.fail<EnhancedProfile>(handleResult.error!);
      }

      const campusIdResult = CampusId.create(campusId);
      if (campusIdResult.isFailure) {
        return Result.fail<EnhancedProfile>(campusIdResult.error!);
      }

      const userTypeResult = UserType.create(data.userType || 'student');
      if (userTypeResult.isFailure) {
        return Result.fail<EnhancedProfile>(userTypeResult.error!);
      }

      // Map privacy settings from Firestore flat structure to DDD value object
      const privacyProps = this.mapPrivacyFromFirestore(data.privacySettings);
      const privacyResult = ProfilePrivacy.create(privacyProps);

      // Validate and create value objects for academic fields
      // Uses graceful degradation: if validation fails, keeps original value
      let validatedMajor: string | undefined = data.major;
      if (data.major) {
        const majorResult = Major.create(data.major);
        if (majorResult.isSuccess) {
          validatedMajor = majorResult.getValue().value; // Use normalized value (e.g., "CS" → "Computer Science")
        }
      }

      let validatedGraduationYear: number | undefined = data.graduationYear;
      if (data.graduationYear) {
        const gradYearResult = GraduationYear.create(data.graduationYear);
        if (gradYearResult.isSuccess) {
          validatedGraduationYear = gradYearResult.getValue().value;
        }
      }

      // Validate and deduplicate interests through InterestCollection
      const interestsResult = InterestCollection.create(data.interests || []);
      const validatedInterests = interestsResult.isSuccess
        ? interestsResult.getValue().toStringArray() // Deduplicated and normalized
        : (data.interests || []); // Fallback to raw array

      // Create personal info with validated values
      const personalInfo: PersonalInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        bio: data.bio,
        major: validatedMajor,
        graduationYear: validatedGraduationYear,
        dorm: data.dorm || data.housing,
        profilePhoto: data.profileImageUrl || data.photos?.[0],
        coverPhoto: data.coverPhoto || data.photos?.[1]
      };

      // Create social info with validated interests
      const socialInfo: SocialInfo = {
        interests: validatedInterests,
        clubs: data.clubs || [],
        sports: data.sports || [],
        greek: data.greek,
        instagram: data.instagram,
        snapchat: data.snapchat,
        twitter: data.twitter,
        linkedin: data.linkedin
      };

      // Create profile aggregate
      const profileResult = EnhancedProfile.create({
        profileId: ProfileId.create(id).getValue(),
        email: emailResult.getValue(),
        handle: handleResult.getValue(),
        userType: userTypeResult.getValue(),
        campusId: campusIdResult.getValue(),
        personalInfo,
        socialInfo,
        privacy: privacyResult.isSuccess ? privacyResult.getValue() : undefined
      }, id);

      if (profileResult.isFailure) {
        return Result.fail<EnhancedProfile>(profileResult.error!);
      }

      const profile = profileResult.getValue();

      // Set additional properties
      if (data.isVerified !== undefined) {
        profile.setIsVerified(data.isVerified);
      }
      if (data.activityScore !== undefined) {
        profile.setActivityScore(data.activityScore);
      }
      if (privacyResult.isSuccess) {
        profile.setPrivacy(privacyResult.getValue());
      }

      return Result.ok<EnhancedProfile>(profile);
    } catch (error) {
      return Result.fail<EnhancedProfile>(`Failed to map to domain: ${error}`);
    }
  }

  /**
   * Map domain aggregate to Firestore document
   * Validates data through value objects before persistence
   */
  private toPersistence(profile: EnhancedProfile): Partial<ProfileDocument> {
    const now = new Date();

    // Validate and normalize major through value object
    let persistedMajor: string | undefined = profile.major;
    if (profile.major) {
      const majorResult = Major.create(profile.major);
      if (majorResult.isSuccess) {
        persistedMajor = majorResult.getValue().value; // Normalized (e.g., "CS" → "Computer Science")
      }
    }

    // Validate graduation year through value object
    let persistedGradYear: number | undefined = profile.graduationYear;
    if (profile.graduationYear) {
      const gradYearResult = GraduationYear.create(profile.graduationYear);
      if (gradYearResult.isSuccess) {
        persistedGradYear = gradYearResult.getValue().value;
      }
      // If invalid, we could choose to not persist or keep original
    }

    // Validate and deduplicate interests through InterestCollection
    const interestsResult = InterestCollection.create(profile.interests);
    const persistedInterests = interestsResult.isSuccess
      ? interestsResult.getValue().toStringArray() // Deduplicated, normalized
      : profile.interests; // Fallback

    return {
      email: profile.email.value,
      handle: profile.handle.value.toLowerCase(),
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.displayName,
      bio: profile.bio,
      major: persistedMajor,
      graduationYear: persistedGradYear,
      interests: persistedInterests,
      photos: profile.photos,
      profileImageUrl: profile.personalInfo.profilePhoto,
      coverPhoto: profile.personalInfo.coverPhoto,
      clubs: profile.socialInfo.clubs,
      sports: profile.socialInfo.sports,
      greek: profile.socialInfo.greek,
      instagram: profile.socialInfo.instagram,
      snapchat: profile.socialInfo.snapchat,
      twitter: profile.socialInfo.twitter,
      linkedin: profile.socialInfo.linkedin,
      isActive: profile.isActive,
      isVerified: profile.isVerified,
      userType: profile.userType.value,
      campusId: profile.campusId.id,
      onboardingComplete: profile.onboardingCompleted,
      activityScore: profile.activityScore,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount,
      connectionCount: profile.connectionCount,
      privacySettings: this.mapPrivacyToFirestore(profile.privacy),
      updatedAt: FirebaseFirestore.Timestamp.fromDate(now)
    };
  }

  /**
   * Map Firestore privacy settings to DDD value object props
   */
  private mapPrivacyFromFirestore(settings?: ProfileDocument['privacySettings']): Partial<{
    level: PrivacyLevel;
    showEmail: boolean;
    showPhone: boolean;
    showDorm: boolean;
    showSchedule: boolean;
    showActivity: boolean;
  }> {
    if (!settings) {
      return {}; // Use defaults
    }

    // Map legacy boolean isPublic to new PrivacyLevel
    let level: PrivacyLevel | undefined = settings.level;
    if (!level) {
      if (settings.isPublic === true) {
        level = PrivacyLevel.PUBLIC;
      } else if (settings.isPublic === false) {
        level = PrivacyLevel.CAMPUS_ONLY;
      }
    }

    return {
      level,
      showEmail: settings.showEmail ?? false,
      showPhone: settings.showPhone ?? false,
      showDorm: settings.showDorm ?? true,
      showSchedule: settings.showSchedule ?? false,
      showActivity: settings.showActivity ?? true
    };
  }

  /**
   * Map DDD privacy value object to Firestore format
   */
  private mapPrivacyToFirestore(privacy: ProfilePrivacy): ProfileDocument['privacySettings'] {
    return {
      // New DDD format
      level: privacy.level,
      showEmail: privacy.showEmail,
      showPhone: privacy.showPhone,
      showDorm: privacy.showDorm,
      showSchedule: privacy.showSchedule,
      showActivity: privacy.showActivity,
      // Legacy format for backward compatibility
      isPublic: privacy.level === PrivacyLevel.PUBLIC,
      showSpaces: true,
      showConnections: true,
      allowDirectMessages: true,
      showOnlineStatus: true
    };
  }
}

// Import FirebaseFirestore namespace for Timestamp
import * as FirebaseFirestore from 'firebase-admin/firestore';

// Singleton instance
let profileRepositoryInstance: FirebaseAdminProfileRepository | null = null;

/**
 * Get server-side profile repository instance
 */
export function getServerProfileRepository(): IProfileRepository {
  if (!profileRepositoryInstance) {
    profileRepositoryInstance = new FirebaseAdminProfileRepository();
  }
  return profileRepositoryInstance;
}

/**
 * Reset repository instance (for testing)
 */
export function resetServerProfileRepository(): void {
  profileRepositoryInstance = null;
}
