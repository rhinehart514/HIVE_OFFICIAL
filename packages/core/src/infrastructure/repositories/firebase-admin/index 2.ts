/**
 * Firebase Admin (Server-Side) Repository Exports
 *
 * These repositories use Firebase Admin SDK and should only be imported
 * in server-side code (API routes, server components, etc.)
 *
 * Import from '@hive/core/server' in your API routes.
 */

export {
  FirebaseAdminProfileRepository,
  getServerProfileRepository,
  resetServerProfileRepository,
  type ProfileDocument,
  type BentoCardConfig,
  type BentoCardType
} from './profile.repository';

export {
  FirebaseAdminSpaceRepository,
  getServerSpaceRepository,
  resetServerSpaceRepository
} from './space.repository';

export {
  FirebaseAdminUnitOfWork,
  getServerUnitOfWork,
  resetServerUnitOfWork
} from './unit-of-work';

// Re-export shared types from mapper
export type {
  SpaceDocument,
  SpacePersistenceData
} from '../firebase/space.mapper';

// Chat repositories (boards + messages)
export {
  FirebaseAdminBoardRepository,
  FirebaseAdminMessageRepository,
  createChatRepositories,
  getServerBoardRepository,
  getServerMessageRepository
} from './chat.repository';

export type { IBoardRepository, IMessageRepository } from './chat.repository';
