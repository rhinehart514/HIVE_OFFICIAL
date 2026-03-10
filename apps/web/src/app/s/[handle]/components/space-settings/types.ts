/**
 * Shared types for SpaceSettings sub-components.
 */

export interface Board {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isLocked?: boolean;
  isVisible?: boolean;
}

export interface SpaceData {
  id: string;
  name: string;
  handle: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  category?: string;
  email?: string;
  contactName?: string;
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export interface SpaceSettingsProps {
  space: SpaceData;
  boards?: Board[];
  isLeader?: boolean;
  currentUserId?: string;
  currentUserRole?: 'owner' | 'admin' | 'moderator' | 'member';
  onUpdate?: (updates: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  onBoardDelete?: (boardId: string) => Promise<void>;
  onBoardUpdate?: (
    boardId: string,
    updates: { name?: string; description?: string; isVisible?: boolean }
  ) => Promise<void>;
  onTransferOwnership?: (newOwnerId: string) => Promise<void>;
  className?: string;
}

export type SettingsSection =
  | 'general'
  | 'contact'
  | 'members'
  | 'moderation'
  | 'requests'
  | 'boards'
  | 'tools'
  | 'automations'
  | 'analytics'
  | 'danger';

export interface TransferCandidate {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  status: string;
  message?: string;
  createdAt: string | null;
  user: {
    id: string;
    displayName: string;
    handle?: string;
    avatarUrl?: string;
  } | null;
}

export interface SpaceTool {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}
