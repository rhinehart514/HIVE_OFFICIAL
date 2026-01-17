/**
 * ProfileActions - Action buttons for profile (Edit/Connect/Message)
 */

import { Button } from '@hive/ui';
import {
  PencilIcon,
  UserPlusIcon,
  ChatBubbleOvalLeftIcon,
} from '@heroicons/react/24/outline';

interface ProfileActionsProps {
  isOwnProfile: boolean;
  onEditProfile: () => void;
}

export function ProfileActions({ isOwnProfile, onEditProfile }: ProfileActionsProps) {
  if (isOwnProfile) {
    return (
      <Button
        onClick={onEditProfile}
        className="w-full sm:w-auto justify-center rounded-lg px-4 py-3 sm:py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
        }}
      >
        <PencilIcon className="w-4 h-4 mr-2" />
        Edit Profile
      </Button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <Button
        className="w-full sm:w-auto justify-center rounded-lg px-4 py-3 sm:py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: 'var(--life-gold)',
          color: 'var(--bg-ground)',
        }}
      >
        <UserPlusIcon className="w-4 h-4 mr-2" />
        Connect
      </Button>
      <Button
        variant="secondary"
        className="w-full sm:w-auto justify-center rounded-lg px-4 py-3 sm:py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
        }}
      >
        <ChatBubbleOvalLeftIcon className="w-4 h-4 mr-2" />
        Message
      </Button>
    </div>
  );
}
