/**
 * Specification Pattern
 * For building complex queries in a composable way
 */

export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

export abstract class CompositeSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private spec: Specification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

/**
 * Feed item shape for specification matching
 */
interface FeedItemCandidate {
  source?: { spaceId?: string };
  content?: { authorId?: { id?: string } };
  createdAt: Date;
  interactions?: Array<{ isEngagement(): boolean }>;
  isTrending?: boolean;
  tags?: string[];
}

/**
 * Feed Specifications
 */
export class FeedItemSpecifications {
  static fromSpace(spaceId: string): Specification<FeedItemCandidate> {
    return new FromSpaceSpecification(spaceId);
  }

  static byAuthor(authorId: string): Specification<FeedItemCandidate> {
    return new ByAuthorSpecification(authorId);
  }

  static isRecent(hoursAgo: number): Specification<FeedItemCandidate> {
    return new IsRecentSpecification(hoursAgo);
  }

  static hasMinimumEngagement(minEngagement: number): Specification<FeedItemCandidate> {
    return new HasMinimumEngagementSpecification(minEngagement);
  }

  static isTrending(): Specification<FeedItemCandidate> {
    return new IsTrendingSpecification();
  }

  static hasTag(tag: string): Specification<FeedItemCandidate> {
    return new HasTagSpecification(tag);
  }
}

class FromSpaceSpecification extends CompositeSpecification<FeedItemCandidate> {
  constructor(private spaceId: string) {
    super();
  }

  isSatisfiedBy(candidate: FeedItemCandidate): boolean {
    return candidate.source?.spaceId === this.spaceId;
  }
}

class ByAuthorSpecification extends CompositeSpecification<FeedItemCandidate> {
  constructor(private authorId: string) {
    super();
  }

  isSatisfiedBy(candidate: FeedItemCandidate): boolean {
    return candidate.content?.authorId?.id === this.authorId;
  }
}

class IsRecentSpecification extends CompositeSpecification<FeedItemCandidate> {
  private cutoffTime: Date;

  constructor(hoursAgo: number) {
    super();
    this.cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  }

  isSatisfiedBy(candidate: FeedItemCandidate): boolean {
    return candidate.createdAt > this.cutoffTime;
  }
}

class HasMinimumEngagementSpecification extends CompositeSpecification<FeedItemCandidate> {
  constructor(private minEngagement: number) {
    super();
  }

  isSatisfiedBy(candidate: FeedItemCandidate): boolean {
    const engagements = candidate.interactions?.filter((i) => i.isEngagement()) || [];
    return engagements.length >= this.minEngagement;
  }
}

class IsTrendingSpecification extends CompositeSpecification<FeedItemCandidate> {
  isSatisfiedBy(candidate: FeedItemCandidate): boolean {
    return candidate.isTrending === true;
  }
}

class HasTagSpecification extends CompositeSpecification<FeedItemCandidate> {
  constructor(private tag: string) {
    super();
  }

  isSatisfiedBy(candidate: FeedItemCandidate): boolean {
    return candidate.tags?.includes(this.tag) || false;
  }
}

/**
 * Ritual candidate shape for specification matching
 */
interface RitualParticipation {
  participantId?: { id?: string };
  isActive: boolean;
}

interface RitualCandidate {
  status?: { isActive(): boolean };
  type?: { type: string };
  startDate: Date;
  endDate: Date;
  participantCount?: number;
  participations?: RitualParticipation[];
  canJoin?: () => boolean;
}

/**
 * Ritual Specifications
 */
export class RitualSpecifications {
  static isActive(): Specification<RitualCandidate> {
    return new IsActiveRitualSpecification();
  }

  static hasType(type: string): Specification<RitualCandidate> {
    return new HasTypeSpecification(type);
  }

  static hasAvailableSlots(): Specification<RitualCandidate> {
    return new HasAvailableSlotsSpecification();
  }

  static isEndingSoon(daysRemaining: number): Specification<RitualCandidate> {
    return new IsEndingSoonSpecification(daysRemaining);
  }

  static hasMinimumParticipants(min: number): Specification<RitualCandidate> {
    return new HasMinimumParticipantsSpecification(min);
  }

  static isJoinableBy(userId: string): Specification<RitualCandidate> {
    return new IsJoinableBySpecification(userId);
  }
}

class IsActiveRitualSpecification extends CompositeSpecification<RitualCandidate> {
  isSatisfiedBy(candidate: RitualCandidate): boolean {
    const now = new Date();
    return candidate.status?.isActive() === true &&
           candidate.startDate <= now &&
           candidate.endDate >= now;
  }
}

class HasTypeSpecification extends CompositeSpecification<RitualCandidate> {
  constructor(private type: string) {
    super();
  }

  isSatisfiedBy(candidate: RitualCandidate): boolean {
    return candidate.type?.type === this.type;
  }
}

class HasAvailableSlotsSpecification extends CompositeSpecification<RitualCandidate> {
  isSatisfiedBy(candidate: RitualCandidate): boolean {
    // Assuming max 1000 participants per ritual
    const maxParticipants = 1000;
    return (candidate.participantCount || 0) < maxParticipants;
  }
}

class IsEndingSoonSpecification extends CompositeSpecification<RitualCandidate> {
  constructor(private daysRemaining: number) {
    super();
  }

  isSatisfiedBy(candidate: RitualCandidate): boolean {
    const now = new Date();
    const daysLeft = Math.ceil(
      (candidate.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= this.daysRemaining && daysLeft > 0;
  }
}

class HasMinimumParticipantsSpecification extends CompositeSpecification<RitualCandidate> {
  constructor(private min: number) {
    super();
  }

  isSatisfiedBy(candidate: RitualCandidate): boolean {
    return (candidate.participantCount || 0) >= this.min;
  }
}

class IsJoinableBySpecification extends CompositeSpecification<RitualCandidate> {
  constructor(private userId: string) {
    super();
  }

  isSatisfiedBy(candidate: RitualCandidate): boolean {
    // Check if user can join (not already participating)
    const isParticipating = candidate.participations?.some(
      (p: RitualParticipation) => p.participantId?.id === this.userId && p.isActive
    );
    return candidate.canJoin?.() === true && !isParticipating;
  }
}

/**
 * Usage Examples:
 *
 * // Find trending items from user's spaces in the last 24 hours
 * const spec = FeedItemSpecifications.isTrending()
 *   .and(FeedItemSpecifications.isRecent(24))
 *   .and(FeedItemSpecifications.fromSpace(userSpaceId));
 *
 * const filteredItems = feedItems.filter(item => spec.isSatisfiedBy(item));
 *
 * // Find active challenge rituals ending soon with good participation
 * const ritualSpec = RitualSpecifications.isActive()
 *   .and(RitualSpecifications.hasType('challenge'))
 *   .and(RitualSpecifications.isEndingSoon(7))
 *   .and(RitualSpecifications.hasMinimumParticipants(50));
 *
 * const urgentRituals = rituals.filter(r => ritualSpec.isSatisfiedBy(r));
 */