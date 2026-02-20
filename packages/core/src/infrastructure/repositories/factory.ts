/**
 * Repository Factory
 * Creates and manages repository instances with real Firebase implementations
 */

import {
  IProfileRepository,
  ISpaceRepository,
  IRitualRepository,
  IRitualConfigRepository,
  IConnectionRepository
} from './interfaces';

// Import real Firebase implementations
import { FirebaseProfileRepository } from './firebase/profile.repository';
import { FirebaseSpaceRepository } from './firebase/space.repository';
import { FirebaseRitualRepository } from './firebase/ritual.repository';
import { FirebaseRitualConfigRepository } from './firebase/ritual-config.repository';
import { FirebaseConnectionRepository } from './firebase/connection.repository';

// Singleton instances
let profileRepo: IProfileRepository | null = null;
let spaceRepo: ISpaceRepository | null = null;
let ritualRepo: IRitualRepository | null = null;
let ritualConfigRepo: IRitualConfigRepository | null = null;
let connectionRepo: IConnectionRepository | null = null;

/**
 * Get or create ProfileRepository instance
 */
export function getProfileRepository(): IProfileRepository {
  if (!profileRepo) {
    profileRepo = new FirebaseProfileRepository();
  }
  return profileRepo;
}

/**
 * Get or create SpaceRepository instance
 */
export function getSpaceRepository(): ISpaceRepository {
  if (!spaceRepo) {
    spaceRepo = new FirebaseSpaceRepository();
  }
  return spaceRepo;
}

/**
 * Get or create FeedRepository instance
 */

/**
 * Get or create RitualRepository instance
 */
export function getRitualRepository(): IRitualRepository {
  if (!ritualRepo) {
    ritualRepo = new FirebaseRitualRepository();
  }
  return ritualRepo;
}

export function getRitualConfigRepository(): IRitualConfigRepository {
  if (!ritualConfigRepo) {
    ritualConfigRepo = new FirebaseRitualConfigRepository();
  }
  return ritualConfigRepo;
}

/**
 * Get or create ConnectionRepository instance
 */
export function getConnectionRepository(): IConnectionRepository {
  if (!connectionRepo) {
    connectionRepo = new FirebaseConnectionRepository();
  }
  return connectionRepo;
}

/**
 * Initialize repositories with custom implementations (for testing)
 */
export function initializeRepositories(config: {
  profile?: IProfileRepository;
  space?: ISpaceRepository;
  ritual?: IRitualRepository;
  ritualConfig?: IRitualConfigRepository;
  connection?: IConnectionRepository;
}) {
  if (config.profile) profileRepo = config.profile;
  if (config.space) spaceRepo = config.space;
  if (config.ritual) ritualRepo = config.ritual;
  if (config.ritualConfig) ritualConfigRepo = config.ritualConfig;
  if (config.connection) connectionRepo = config.connection;
}

/**
 * Reset all repository instances (for testing)
 */
export function resetRepositories(): void {
  profileRepo = null;
  spaceRepo = null;
  ritualRepo = null;
  ritualConfigRepo = null;
  connectionRepo = null;
}

// Feed repository stub (deferred - was using DDD pattern, now using direct Firestore queries)
export function getFeedRepository(): any {
  return null;
}
