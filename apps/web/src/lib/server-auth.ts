// Re-export server auth utilities
import { getCurrentUser as importedGetCurrentUser } from './auth-server';

export {
  getCurrentUser,
  requireAuth,
  validateAuth,
  type AuthenticatedUser,
} from './auth-server';

// Alias for calendar route
export const _getCurrentUser = importedGetCurrentUser;
