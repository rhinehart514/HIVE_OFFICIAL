/**
 * Repository Interfaces
 * Abstracts data persistence from domain logic
 */

import { Result } from '../../domain/shared/base/Result';
import { DomainEvent } from '../../domain/shared/domain-event';
import { EnhancedProfile } from '../../domain/profile/aggregates/enhanced-profile';
import { ProfileId } from '../../domain/profile/value-objects/profile-id.value';
import { Connection } from '../../domain/profile/aggregates/connection';
import { EnhancedRitual } from '../../domain/rituals/aggregates/enhanced-ritual';
import { RitualId } from '../../domain/rituals/value-objects/ritual-id.value';
import { EnhancedSpace } from '../../domain/spaces/aggregates/enhanced-space';
import { SpaceId } from '../../domain/spaces/value-objects/space-id.value';
import { Participation } from '../../domain/rituals/entities/participation';
import { RitualPhase, RitualUnion, RitualArchetype } from '../../domain/rituals/archetypes';

// Base repository interface
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<Result<T>>;
  save(entity: T): Promise<Result<void>>;
  delete(id: ID): Promise<Result<void>>;
}

// Profile repository
export interface IProfileRepository extends IRepository<EnhancedProfile, ProfileId | string> {
  findByEmail(email: string): Promise<Result<EnhancedProfile>>;
  findByHandle(handle: string): Promise<Result<EnhancedProfile>>;
  findByCampus(campusId: string, limit?: number): Promise<Result<EnhancedProfile[]>>;
  findOnboardedProfiles(maxCount?: number): Promise<Result<EnhancedProfile[]>>;
  findByInterest(interest: string, limitCount?: number): Promise<Result<EnhancedProfile[]>>;
  findByMajor(major: string, limitCount?: number): Promise<Result<EnhancedProfile[]>>;
  findConnectionsOf(profileId: string): Promise<Result<EnhancedProfile[]>>;
  getTotalCampusUsers(campusId: string): Promise<Result<number>>;
  exists(handle: string): Promise<boolean>;
  searchByName(query: string, campusId: string): Promise<Result<EnhancedProfile[]>>;
}

// Connection repository
export interface IConnectionRepository extends IRepository<Connection, string> {
  findByProfiles(profileId1: string, profileId2: string): Promise<Result<Connection>>;
  findUserConnections(profileId: string, type?: string): Promise<Result<Connection[]>>;
  getConnectionCount(profileId: string, type: string): Promise<number>;
}

// Space repository
export interface ISpaceRepository extends IRepository<EnhancedSpace, SpaceId | string> {
  // Override to support options for eager loading PlacedTools
  findById(id: SpaceId | string, options?: { loadMembers?: boolean; loadPlacedTools?: boolean }): Promise<Result<EnhancedSpace>>;
  findByName(name: string, campusId: string): Promise<Result<EnhancedSpace>>;
  findBySlug(slug: string, campusId: string): Promise<Result<EnhancedSpace>>;
  findByCampus(campusId: string, limit?: number): Promise<Result<EnhancedSpace[]>>;
  findByCategory(category: string, campusId: string): Promise<Result<EnhancedSpace[]>>;
  findByType(type: string, campusId: string): Promise<Result<EnhancedSpace[]>>;
  findUserSpaces(userId: string): Promise<Result<EnhancedSpace[]>>;
  findByMember(userId: string): Promise<Result<EnhancedSpace[]>>;
  /**
   * Lightweight method to get user's space memberships without loading full spaces
   * Returns just spaceId and role - use this for browse/discovery endpoints
   */
  findUserMemberships(userId: string): Promise<Result<{ spaceId: string; role: string }[]>>;
  findPublicSpaces(campusId: string, limit?: number): Promise<Result<EnhancedSpace[]>>;
  findPublicEnhancedSpaces(campusId: string, limit?: number): Promise<Result<EnhancedSpace[]>>;
  findTrending(campusId: string, limit?: number): Promise<Result<EnhancedSpace[]>>;
  findRecommended(campusId: string, interests: string[], major?: string): Promise<Result<EnhancedSpace[]>>;
  searchSpaces(query: string, campusId: string): Promise<Result<EnhancedSpace[]>>;
  searchEnhancedSpaces(query: string, campusId: string): Promise<Result<EnhancedSpace[]>>;
  findWithPagination(options: {
    campusId: string;
    type?: string;
    searchTerm?: string;
    limit?: number;
    cursor?: string;
    orderBy?: 'createdAt' | 'name_lowercase' | 'memberCount' | 'trendingScore';
    orderDirection?: 'asc' | 'desc';
  }): Promise<Result<{ spaces: EnhancedSpace[]; hasMore: boolean; nextCursor?: string }>>;
}

// Ritual repository
export interface IRitualRepository extends IRepository<EnhancedRitual, RitualId | string> {
  findByCampus(campusId: string): Promise<Result<EnhancedRitual[]>>;
  findActive(campusId: string): Promise<Result<EnhancedRitual[]>>;
  findByType(type: string, campusId: string): Promise<Result<EnhancedRitual[]>>;
  findActiveByType(type: string, campusId: string): Promise<Result<EnhancedRitual>>;
  findUserRituals(userId: string): Promise<Result<EnhancedRitual[]>>;
  findParticipation(ritualId: RitualId | string, profileId: ProfileId | string): Promise<Result<Participation>>;
  saveParticipation(participation: Participation): Promise<Result<void>>;
  findLeaderboard(ritualId: RitualId | string, limit: number): Promise<Result<Participation[]>>;
  findByParticipant(profileId: ProfileId | string): Promise<Result<EnhancedRitual[]>>;
  subscribeToRitual(ritualId: RitualId | string, callback: (ritual: EnhancedRitual) => void): () => void;
  subscribeToActiveRituals(campusId: string, callback: (rituals: EnhancedRitual[]) => void): () => void;
}

export interface IRitualConfigRepository extends IRepository<RitualUnion, string> {
  findByCampus(campusId: string, options?: { phases?: RitualPhase[] }): Promise<Result<RitualUnion[]>>;
  findActive(campusId: string, referenceDate?: Date): Promise<Result<RitualUnion[]>>;
  findBySlug(slug: string, campusId: string): Promise<Result<RitualUnion>>;
  findByArchetype(archetype: RitualArchetype, campusId: string): Promise<Result<RitualUnion[]>>;
  findActiveByArchetype(archetype: RitualArchetype, campusId: string, referenceDate?: Date): Promise<Result<RitualUnion[]>>;
}

// Unit of Work for transaction management
export interface IUnitOfWork {
  profiles: IProfileRepository;
  connections: IConnectionRepository;
  spaces: ISpaceRepository;
  rituals: IRitualRepository;
  ritualConfigs?: IRitualConfigRepository;

  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// Event dispatcher
export interface IEventDispatcher {
  dispatch(events: DomainEvent[]): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
  unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}

// Feed repository interface (deferred — using direct Firestore queries)
export interface IFeedRepository {
  [key: string]: unknown;
}
