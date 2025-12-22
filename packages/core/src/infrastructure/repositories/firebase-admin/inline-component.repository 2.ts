/**
 * Firebase Admin Inline Component Repository
 * Server-side implementation for inline component state and participation
 *
 * Key Features:
 * - Atomic participation updates (write + aggregate in batch)
 * - Version increment for real-time sync notifications
 * - Per-user participation tracking with aggregation
 *
 * Firestore Structure:
 * /spaces/{spaceId}/inline_component_state/{componentId}
 *   - Component state document
 *   - /participants/{userId} - User participation records
 */

import { dbAdmin } from '../../../firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Result } from '../../../domain/shared/base/Result';
import {
  InlineComponent,
  InlineComponentType,
  ComponentConfig,
  SharedState,
  ParticipantRecord,
  AggregationDelta,
  ComponentDisplayState,
} from '../../../domain/spaces/entities/inline-component';

/**
 * Document structure in Firestore
 */
interface ComponentDocument {
  spaceId: string;
  boardId: string;
  messageId: string;
  componentType: InlineComponentType;
  elementType: string;
  toolId: string;
  config: Record<string, unknown>;
  sharedState: SharedState;
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  version: number;
}

interface ParticipantDocument {
  userId: string;
  selectedOptions?: string[];
  response?: 'yes' | 'no' | 'maybe';
  data?: Record<string, unknown>;
  participatedAt: Timestamp | Date;
}

/**
 * Convert Firestore timestamp to Date
 */
function toDate(value: Timestamp | Date | undefined | null): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  return new Date();
}

/**
 * Repository interface for dependency injection
 */
export interface IInlineComponentRepository {
  save(spaceId: string, component: InlineComponent): Promise<Result<void>>;
  findById(spaceId: string, componentId: string): Promise<Result<InlineComponent | null>>;
  findByMessageId(spaceId: string, boardId: string, messageId: string): Promise<Result<InlineComponent | null>>;
  getParticipation(spaceId: string, componentId: string, userId: string): Promise<Result<ParticipantRecord | null>>;
  submitParticipationAtomic(
    spaceId: string,
    componentId: string,
    participation: ParticipantRecord,
    delta: AggregationDelta
  ): Promise<Result<{ newVersion: number }>>;
  close(spaceId: string, componentId: string): Promise<Result<void>>;
}

/**
 * Firebase Admin Inline Component Repository
 */
export class FirebaseAdminInlineComponentRepository implements IInlineComponentRepository {
  private getComponentsRef(spaceId: string) {
    return dbAdmin.collection('spaces').doc(spaceId).collection('inline_component_state');
  }

  private getComponentRef(spaceId: string, componentId: string) {
    return this.getComponentsRef(spaceId).doc(componentId);
  }

  private getParticipantsRef(spaceId: string, componentId: string) {
    return this.getComponentRef(spaceId, componentId).collection('participants');
  }

  /**
   * Save a new inline component
   */
  async save(spaceId: string, component: InlineComponent): Promise<Result<void>> {
    try {
      const dto = component.toDTO();
      const docRef = this.getComponentRef(spaceId, component.id);

      // Filter undefined values for Firestore
      const dataToSave: Record<string, unknown> = {
        spaceId: dto.spaceId,
        boardId: dto.boardId,
        messageId: dto.messageId,
        componentType: dto.componentType,
        elementType: dto.elementType,
        toolId: dto.toolId,
        config: dto.config,
        sharedState: dto.sharedState,
        isActive: dto.isActive,
        createdBy: dto.createdBy,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        version: dto.version,
      };

      await docRef.set(dataToSave);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save inline component: ${error}`);
    }
  }

  /**
   * Find component by ID
   */
  async findById(spaceId: string, componentId: string): Promise<Result<InlineComponent | null>> {
    try {
      const docRef = this.getComponentRef(spaceId, componentId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.ok<InlineComponent | null>(null);
      }

      const data = docSnap.data() as ComponentDocument;
      const componentResult = InlineComponent.fromDTO({
        id: docSnap.id,
        spaceId: data.spaceId,
        boardId: data.boardId,
        messageId: data.messageId,
        componentType: data.componentType,
        elementType: data.elementType,
        toolId: data.toolId,
        config: data.config,
        sharedState: data.sharedState,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: toDate(data.createdAt).toISOString(),
        updatedAt: toDate(data.updatedAt).toISOString(),
        version: data.version,
      });

      if (componentResult.isFailure) {
        return Result.fail<InlineComponent | null>(componentResult.error ?? 'Failed to parse component');
      }

      return Result.ok<InlineComponent | null>(componentResult.getValue());
    } catch (error) {
      return Result.fail<InlineComponent | null>(`Failed to find inline component: ${error}`);
    }
  }

  /**
   * Find component by message ID
   * (Components are stored with messageId, but might need lookup by it)
   */
  async findByMessageId(
    spaceId: string,
    boardId: string,
    messageId: string
  ): Promise<Result<InlineComponent | null>> {
    try {
      const snapshot = await this.getComponentsRef(spaceId)
        .where('messageId', '==', messageId)
        .where('boardId', '==', boardId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return Result.ok<InlineComponent | null>(null);
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as ComponentDocument;

      const componentResult = InlineComponent.fromDTO({
        id: doc.id,
        spaceId: data.spaceId,
        boardId: data.boardId,
        messageId: data.messageId,
        componentType: data.componentType,
        elementType: data.elementType,
        toolId: data.toolId,
        config: data.config,
        sharedState: data.sharedState,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: toDate(data.createdAt).toISOString(),
        updatedAt: toDate(data.updatedAt).toISOString(),
        version: data.version,
      });

      if (componentResult.isFailure) {
        return Result.fail<InlineComponent | null>(componentResult.error ?? 'Failed to parse component');
      }

      return Result.ok<InlineComponent | null>(componentResult.getValue());
    } catch (error) {
      return Result.fail<InlineComponent | null>(`Failed to find component by message: ${error}`);
    }
  }

  /**
   * Get user's participation record
   */
  async getParticipation(
    spaceId: string,
    componentId: string,
    userId: string
  ): Promise<Result<ParticipantRecord | null>> {
    try {
      const docRef = this.getParticipantsRef(spaceId, componentId).doc(userId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.ok<ParticipantRecord | null>(null);
      }

      const data = docSnap.data() as ParticipantDocument;

      const record: ParticipantRecord = {
        userId: data.userId,
        selectedOptions: data.selectedOptions,
        response: data.response,
        data: data.data,
        participatedAt: toDate(data.participatedAt),
      };

      return Result.ok<ParticipantRecord | null>(record);
    } catch (error) {
      return Result.fail<ParticipantRecord | null>(`Failed to get participation: ${error}`);
    }
  }

  /**
   * Submit participation with atomic aggregation update
   *
   * This performs a batch write that:
   * 1. Writes/updates the participant record
   * 2. Updates the aggregated counts
   * 3. Increments the version for real-time sync
   *
   * All operations succeed or fail together.
   */
  async submitParticipationAtomic(
    spaceId: string,
    componentId: string,
    participation: ParticipantRecord,
    delta: AggregationDelta
  ): Promise<Result<{ newVersion: number }>> {
    try {
      const componentRef = this.getComponentRef(spaceId, componentId);
      const participantRef = this.getParticipantsRef(spaceId, componentId).doc(participation.userId);

      // Run in transaction to ensure atomicity
      const newVersion = await dbAdmin.runTransaction(async (transaction) => {
        // Read current component state
        const componentDoc = await transaction.get(componentRef);

        if (!componentDoc.exists) {
          throw new Error('Component not found');
        }

        const componentData = componentDoc.data() as ComponentDocument;

        if (!componentData.isActive) {
          throw new Error('Component is no longer active');
        }

        // Calculate new version
        const currentVersion = componentData.version || 1;
        const nextVersion = currentVersion + 1;

        // Build update object for sharedState
        const sharedStateUpdates: Record<string, unknown> = {
          'updatedAt': FieldValue.serverTimestamp(),
          'version': nextVersion,
        };

        // Apply poll delta
        if (delta.incrementOption) {
          sharedStateUpdates[`sharedState.optionCounts.${delta.incrementOption}`] = FieldValue.increment(1);
        }

        if (delta.decrementOption) {
          sharedStateUpdates[`sharedState.optionCounts.${delta.decrementOption}`] = FieldValue.increment(-1);
        }

        // Apply RSVP delta
        if (delta.rsvpChange) {
          if (delta.rsvpChange.from) {
            sharedStateUpdates[`sharedState.rsvpCounts.${delta.rsvpChange.from}`] = FieldValue.increment(-1);
          }
          sharedStateUpdates[`sharedState.rsvpCounts.${delta.rsvpChange.to}`] = FieldValue.increment(1);
        }

        // Increment total responses for new participants
        if (delta.isNewParticipant) {
          sharedStateUpdates['sharedState.totalResponses'] = FieldValue.increment(1);
        }

        // Update component
        transaction.update(componentRef, sharedStateUpdates);

        // Write participant record
        const participantData: ParticipantDocument = {
          userId: participation.userId,
          participatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
        };

        if (participation.selectedOptions) {
          participantData.selectedOptions = participation.selectedOptions;
        }
        if (participation.response) {
          participantData.response = participation.response;
        }
        if (participation.data) {
          participantData.data = participation.data;
        }

        transaction.set(participantRef, participantData);

        return nextVersion;
      });

      return Result.ok({ newVersion });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return Result.fail<{ newVersion: number }>(`Failed to submit participation: ${errorMessage}`);
    }
  }

  /**
   * Close a component (stop accepting new participation)
   */
  async close(spaceId: string, componentId: string): Promise<Result<void>> {
    try {
      const componentRef = this.getComponentRef(spaceId, componentId);

      await componentRef.update({
        isActive: false,
        updatedAt: FieldValue.serverTimestamp(),
        version: FieldValue.increment(1),
      });

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to close component: ${error}`);
    }
  }

  /**
   * Get component display state with user's participation
   */
  async getDisplayState(
    spaceId: string,
    componentId: string,
    userId: string
  ): Promise<Result<ComponentDisplayState | null>> {
    try {
      // Fetch component and participation in parallel
      const [componentResult, participationResult] = await Promise.all([
        this.findById(spaceId, componentId),
        this.getParticipation(spaceId, componentId, userId),
      ]);

      if (componentResult.isFailure) {
        return Result.fail<ComponentDisplayState | null>(componentResult.error ?? 'Failed to fetch component');
      }

      const component = componentResult.getValue();
      if (!component) {
        return Result.ok<ComponentDisplayState | null>(null);
      }

      const participation = participationResult.isSuccess ? participationResult.getValue() : undefined;

      return Result.ok<ComponentDisplayState | null>(
        component.getDisplayState(participation ?? undefined)
      );
    } catch (error) {
      return Result.fail<ComponentDisplayState | null>(`Failed to get display state: ${error}`);
    }
  }

  /**
   * Get all participants for a component (for admin/analytics)
   */
  async getParticipants(
    spaceId: string,
    componentId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Result<{ participants: ParticipantRecord[]; total: number }>> {
    try {
      const participantsRef = this.getParticipantsRef(spaceId, componentId);

      // Get count first
      const countSnapshot = await participantsRef.count().get();
      const total = countSnapshot.data().count;

      // Build query with pagination
      let query = participantsRef.orderBy('participatedAt', 'desc');

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const snapshot = await query.get();

      const participants: ParticipantRecord[] = snapshot.docs.map((doc) => {
        const data = doc.data() as ParticipantDocument;
        return {
          userId: data.userId,
          selectedOptions: data.selectedOptions,
          response: data.response,
          data: data.data,
          participatedAt: toDate(data.participatedAt),
        };
      });

      return Result.ok({ participants, total });
    } catch (error) {
      return Result.fail<{ participants: ParticipantRecord[]; total: number }>(
        `Failed to get participants: ${error}`
      );
    }
  }
}

// Singleton instance
let repositoryInstance: FirebaseAdminInlineComponentRepository | null = null;

/**
 * Get the server-side Inline Component Repository instance (singleton)
 */
export function getServerInlineComponentRepository(): IInlineComponentRepository {
  if (!repositoryInstance) {
    repositoryInstance = new FirebaseAdminInlineComponentRepository();
  }
  return repositoryInstance;
}

/**
 * Create a new repository instance (for testing)
 */
export function createInlineComponentRepository(): FirebaseAdminInlineComponentRepository {
  return new FirebaseAdminInlineComponentRepository();
}
