/**
 * Firebase Admin Unit of Work Implementation
 * Server-side version using Firebase Admin SDK
 *
 * Use this in API routes instead of the client-side FirebaseUnitOfWork.
 */

import { IUnitOfWork, IProfileRepository, IConnectionRepository, ISpaceRepository, IFeedRepository, IRitualRepository } from '../interfaces';
import { FirebaseAdminProfileRepository, getServerProfileRepository } from './profile.repository';
import { FirebaseAdminSpaceRepository, getServerSpaceRepository } from './space.repository';

/**
 * Server-side Unit of Work using Firebase Admin SDK
 *
 * Currently supports:
 * - profiles (full implementation)
 * - spaces (full implementation)
 *
 * Other repositories throw "not implemented" - add admin versions as needed.
 */
export class FirebaseAdminUnitOfWork implements IUnitOfWork {
  private _profiles: IProfileRepository;
  private _spaces: ISpaceRepository;

  private transactionStarted: boolean = false;

  constructor() {
    // Use singleton getters for server-side repositories
    this._profiles = getServerProfileRepository();
    this._spaces = getServerSpaceRepository();
  }

  get profiles(): IProfileRepository {
    return this._profiles;
  }

  get spaces(): ISpaceRepository {
    return this._spaces;
  }

  get connections(): IConnectionRepository {
    throw new Error('FirebaseAdminConnectionRepository not implemented. Use FirebaseAdminUnitOfWork only for profiles and spaces.');
  }

  get feeds(): IFeedRepository {
    throw new Error('FirebaseAdminFeedRepository not implemented. Use FirebaseAdminUnitOfWork only for profiles and spaces.');
  }

  get rituals(): IRitualRepository {
    throw new Error('FirebaseAdminRitualRepository not implemented. Use FirebaseAdminUnitOfWork only for profiles and spaces.');
  }

  async begin(): Promise<void> {
    if (this.transactionStarted) {
      throw new Error('Transaction already started');
    }
    this.transactionStarted = true;
  }

  async commit(): Promise<void> {
    if (!this.transactionStarted) {
      throw new Error('No transaction to commit');
    }
    // Firebase Admin transactions would use runTransaction()
    // For now, operations are atomic at document level
    this.transactionStarted = false;
  }

  async rollback(): Promise<void> {
    this.transactionStarted = false;
  }
}

// Singleton instance
let adminUnitOfWorkInstance: FirebaseAdminUnitOfWork | null = null;

/**
 * Get the server-side Unit of Work instance
 */
export function getServerUnitOfWork(): IUnitOfWork {
  if (!adminUnitOfWorkInstance) {
    adminUnitOfWorkInstance = new FirebaseAdminUnitOfWork();
  }
  return adminUnitOfWorkInstance;
}

/**
 * Reset the unit of work instance (for testing)
 */
export function resetServerUnitOfWork(): void {
  adminUnitOfWorkInstance = null;
}
