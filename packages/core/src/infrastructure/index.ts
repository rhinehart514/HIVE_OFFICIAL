/**
 * Infrastructure Layer
 * Repositories, mappers, realtime listeners, and external service adapters
 */

// Repository Interfaces (contracts for data access)
export * from './repositories/interfaces';

// Repository Factory (creates concrete implementations)
export * from './repositories/factory';

// Firebase Unit of Work (transaction management)
export { FirebaseUnitOfWork } from './repositories/firebase/unit-of-work';

// Mappers (domain <-> persistence transformations)
export * from '../application/identity/dtos/profile.dto';
export * from './mappers/profile.firebase-mapper';

// Realtime Listeners (live data subscriptions)
export { feedListener } from './realtime/feed-listener';
export type { FeedUpdate, FeedListenerOptions } from './realtime/feed-listener';

// Feature Flags (runtime configuration)
export * from './feature-flags';

// Event Dispatching (domain event infrastructure)
export * from './events';

// Firestore Collection Constants
export * from './firestore-collections';

// API Validation Context
export * from './api/validate-tool-context';
