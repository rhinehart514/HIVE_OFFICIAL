'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION } from '@hive/tokens';
import { ModerationPanel } from '../moderation-panel';
import { AnalyticsPanel } from '../analytics-panel';
import { SettingsNav } from './settings-nav';
import { SettingsGeneral } from './settings-general';
import { SettingsContact } from './settings-contact';
import { SettingsMembers } from './settings-members';
import { SettingsModeration } from './settings-moderation';
import { SettingsAnalytics } from './settings-analytics';
import { SettingsRequests } from './settings-requests';
import { SettingsBoards } from './settings-boards';
import { SettingsTools } from './settings-tools';
import { SettingsAutomations } from './settings-automations';
import { SettingsDanger } from './settings-danger';
import type { SpaceSettingsProps, SettingsSection } from './types';

export type { SpaceSettingsProps };
export type { Board, SpaceData } from './types';

export function SpaceSettings({
  space,
  boards = [],
  isLeader = false,
  currentUserId,
  currentUserRole = 'member',
  onUpdate,
  onDelete,
  onLeave,
  onBoardDelete,
  onBoardUpdate,
  onTransferOwnership,
  className,
}: SpaceSettingsProps) {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>('general');
  const [showModerationPanel, setShowModerationPanel] = React.useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = React.useState(false);

  const isAdminOrOwner = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isModeratorOrAbove = isAdminOrOwner || currentUserRole === 'moderator';
  const spaceIsPrivate = !(space.isPublic ?? true);

  const handleModerationNavClick = () => {
    setActiveSection('moderation');
    setShowModerationPanel(true);
  };

  const handleAnalyticsNavClick = () => {
    setActiveSection('analytics');
    setShowAnalyticsPanel(true);
  };

  return (
    <div className={cn('flex h-full', className)}>
      <SettingsNav
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isLeader={isLeader}
        isModeratorOrAbove={isModeratorOrAbove}
        isAdminOrOwner={isAdminOrOwner}
        isPublic={space.isPublic ?? true}
        onModerationClick={handleModerationNavClick}
        onAnalyticsClick={handleAnalyticsNavClick}
      />

      <div className="flex-1 overflow-y-auto">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: MOTION.ease.premium }}
          className="max-w-2xl p-6"
        >
          {activeSection === 'general' && (
            <SettingsGeneral space={space} onUpdate={onUpdate} />
          )}

          {activeSection === 'contact' && isLeader && (
            <SettingsContact space={space} onUpdate={onUpdate} />
          )}

          {activeSection === 'members' && (
            <SettingsMembers
              spaceId={space.id}
              spaceName={space.name}
              isLeader={isLeader}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          )}

          {activeSection === 'moderation' && isModeratorOrAbove && (
            <SettingsModeration onOpenPanel={() => setShowModerationPanel(true)} />
          )}

          {activeSection === 'requests' && isModeratorOrAbove && spaceIsPrivate && (
            <SettingsRequests spaceId={space.id} />
          )}

          {activeSection === 'analytics' && isAdminOrOwner && (
            <SettingsAnalytics onOpenPanel={() => setShowAnalyticsPanel(true)} />
          )}

          {activeSection === 'boards' && (
            <SettingsBoards
              boards={boards}
              isLeader={isLeader}
              onBoardDelete={onBoardDelete}
              onBoardUpdate={onBoardUpdate}
            />
          )}

          {activeSection === 'tools' && isLeader && (
            <SettingsTools spaceId={space.id} spaceName={space.name} />
          )}

          {activeSection === 'automations' && isLeader && (
            <SettingsAutomations spaceId={space.id} />
          )}

          {activeSection === 'danger' && (
            <SettingsDanger
              space={space}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isLeader={isLeader}
              onDelete={onDelete}
              onLeave={onLeave}
              onTransferOwnership={onTransferOwnership}
            />
          )}
        </motion.div>
      </div>

      {/* Moderation Panel Overlay */}
      <ModerationPanel
        isOpen={showModerationPanel}
        onClose={() => setShowModerationPanel(false)}
        spaceId={space.id}
        spaceName={space.name}
      />

      {/* Analytics Panel Overlay */}
      <AnalyticsPanel
        isOpen={showAnalyticsPanel}
        onClose={() => setShowAnalyticsPanel(false)}
        spaceId={space.id}
      />
    </div>
  );
}

SpaceSettings.displayName = 'SpaceSettings';
