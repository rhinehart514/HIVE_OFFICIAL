/**
 * Repository Factory
 *
 * Provides singleton instances of Firebase repository implementations.
 * This enables DDD patterns by abstracting persistence from domain logic.
 */

// Repository interfaces
export type {
  IProfileRepository,
  ISpaceRepository,
  IRitualRepository,
  IFeedRepository
} from '../interfaces';

// Import actual repository implementations
import { FirebaseSpaceRepository } from './space.repository';
import { FirebaseProfileRepository } from './profile.repository';
import { FirebaseRitualRepository } from './ritual.repository';
import type {
  IProfileRepository,
  ISpaceRepository,
  IRitualRepository,
  IFeedRepository
} from '../interfaces';

// Singleton instances for repository reuse
let spaceRepositoryInstance: ISpaceRepository | null = null;
let profileRepositoryInstance: IProfileRepository | null = null;
let feedRepositoryInstance: IFeedRepository | null = null;
let ritualRepositoryInstance: IRitualRepository | null = null;

/**
 * Get the Space Repository instance
 * Returns singleton instance of FirebaseSpaceRepository
 */
export function getSpaceRepository(): ISpaceRepository {
  if (!spaceRepositoryInstance) {
    spaceRepositoryInstance = new FirebaseSpaceRepository();
  }
  return spaceRepositoryInstance;
}

/**
 * Get the Profile Repository instance
 * Returns singleton instance of FirebaseProfileRepository
 */
export function getProfileRepository(): IProfileRepository {
  if (!profileRepositoryInstance) {
    profileRepositoryInstance = new FirebaseProfileRepository();
  }
  return profileRepositoryInstance;
}

/**
 * Get the Feed Repository instance
 */
export function getFeedRepository(): IFeedRepository {
  // TODO: implement FirebaseFeedRepository
  return feedRepositoryInstance!;
}

/**
 * Get the Ritual Repository instance
 * Returns singleton instance of FirebaseRitualRepository
 */
export function getRitualRepository(): IRitualRepository {
  if (!ritualRepositoryInstance) {
    ritualRepositoryInstance = new FirebaseRitualRepository();
  }
  return ritualRepositoryInstance;
}

/**
 * Reset all repository instances
 * Useful for testing or when Firebase instance changes
 */
export function resetRepositories(): void {
  spaceRepositoryInstance = null;
  profileRepositoryInstance = null;
  feedRepositoryInstance = null;
  ritualRepositoryInstance = null;
}