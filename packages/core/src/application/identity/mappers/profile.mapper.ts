import { Mapper } from '../../shared/Mapper.base';
import { Profile } from '../../../domain/identity/aggregates/profile.aggregate';
import { ProfileDTO } from '../dtos/profile.dto';
import { UBEmail } from '../../../domain/identity/value-objects/ub-email.value';
import { Handle } from '../../../domain/identity/value-objects/handle.value';
import { PersonalInfo } from '../../../domain/identity/value-objects/personal-info.value';
import { Result } from '../../../domain/shared/base/Result';
import { ProfileId } from '../../shared/temporary-types';

export class ProfileMapper extends Mapper<Profile, ProfileDTO> {
  toDTO(profile: Profile): ProfileDTO {
    return {
      id: profile.id,
      email: profile.email.value,
      handle: profile.handle.value,
      personalInfo: {
        firstName: profile.personalInfo.firstName,
        lastName: profile.personalInfo.lastName,
        bio: profile.personalInfo.bio,
        major: profile.personalInfo.major,
        graduationYear: profile.personalInfo.graduationYear,
        dorm: profile.personalInfo.dorm
      },
      interests: profile.interests,
      connections: profile.connections,
      isOnboarded: profile.isOnboarded,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  /**
   * @deprecated Use toDomainSafe() for proper error handling
   */
  toDomain(dto: ProfileDTO): Profile {
    const result = this.toDomainSafe(dto);
    if (result.isFailure) {
      throw new Error(result.error ?? 'Unknown error converting DTO to domain');
    }
    return result.getValue();
  }

  /**
   * Safely converts DTO to domain Profile with Result-based error handling
   */
  override toDomainSafe(dto: ProfileDTO): Result<Profile> {
    // Create value objects
    const emailResult = UBEmail.create(dto.email);
    if (emailResult.isFailure) {
      return Result.fail(`Invalid email: ${emailResult.error}`);
    }

    const handleResult = Handle.create(dto.handle);
    if (handleResult.isFailure) {
      return Result.fail(`Invalid handle: ${handleResult.error}`);
    }

    const profileIdResult = ProfileId.create(dto.id);
    if (profileIdResult.isFailure) {
      return Result.fail(`Invalid profile ID: ${profileIdResult.error}`);
    }

    // Create profile with new signature
    const profileResult = Profile.create({
      id: profileIdResult.getValue(),
      email: emailResult.getValue(),
      handle: handleResult.getValue(),
      personalInfo: {
        firstName: dto.personalInfo.firstName,
        lastName: dto.personalInfo.lastName,
        bio: dto.personalInfo.bio,
        major: dto.personalInfo.major,
        graduationYear: dto.personalInfo.graduationYear || undefined,
        dorm: dto.personalInfo.dorm
      }
    });

    if (profileResult.isFailure) {
      return Result.fail(`Failed to create profile: ${profileResult.error}`);
    }

    const profile = profileResult.getValue();

    // Update profile with additional data
    if (dto.interests.length > 0) {
      profile.updateInterests(dto.interests);
    }

    dto.connections.forEach(connectionId => {
      profile.addConnection(connectionId);
    });

    if (dto.isOnboarded) {
      const personalInfoResult = PersonalInfo.create(dto.personalInfo);
      if (personalInfoResult.isSuccess) {
        profile.completeOnboarding(personalInfoResult.getValue(), dto.interests);
      }
    }

    return Result.ok(profile);
  }
}