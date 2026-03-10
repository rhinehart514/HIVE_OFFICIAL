'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { Text, Button } from '@hive/ui';
import { MemberManagement } from '../member-management';
import { InviteLinkModal } from '@/components/spaces/invite-link-modal';
import { AnimatePresence } from 'framer-motion';

interface SettingsMembersProps {
  spaceId: string;
  spaceName: string;
  isLeader: boolean;
  currentUserId?: string;
  currentUserRole: 'owner' | 'admin' | 'moderator' | 'member';
}

export function SettingsMembers({
  spaceId,
  spaceName,
  isLeader,
  currentUserId,
  currentUserRole,
}: SettingsMembersProps) {
  const [showInviteModal, setShowInviteModal] = React.useState(false);

  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Member Management
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Manage roles, permissions, and member access
      </Text>

      {/* Invite Members Section */}
      {isLeader && (
        <div className="mb-8 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <Text weight="medium" className="mb-1">Invite Members</Text>
              <Text size="sm" tone="muted">
                Generate invite links to share with potential members
              </Text>
            </div>
            <Button
              variant="cta"
              size="sm"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Invite Link
            </Button>
          </div>
        </div>
      )}

      {/* Member Management */}
      {currentUserId && (
        <MemberManagement
          spaceId={spaceId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Invite Link Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteLinkModal
            spaceId={spaceId}
            spaceName={spaceName}
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
