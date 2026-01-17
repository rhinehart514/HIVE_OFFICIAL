'use client';

/**
 * Space Leader Modals
 *
 * Modal dialogs for leader actions: add tab, widget, invite member, create event.
 * Extracted from the main space page for better maintainability.
 */

import {
  AddTabModal,
  AddWidgetModal,
  MemberInviteModal,
  EventCreateModal,
  type AddTabInput,
  type AddWidgetInputUI,
  type MemberInviteInput,
  type EventCreateInput,
  type ExistingTool,
  type QuickTemplateUI,
  type InviteableUser,
} from '@hive/ui';

interface BoardInfo {
  id: string;
  name: string;
}

interface TabInfo {
  name: string;
}

export interface SpaceLeaderModalsProps {
  tabs: TabInfo[];
  boards: BoardInfo[];
  activeBoardId?: string;
  addTabModalOpen: boolean;
  setAddTabModalOpen: (open: boolean) => void;
  addWidgetModalOpen: boolean;
  setAddWidgetModalOpen: (open: boolean) => void;
  inviteMemberModalOpen: boolean;
  setInviteMemberModalOpen: (open: boolean) => void;
  createEventModalOpen: boolean;
  setCreateEventModalOpen: (open: boolean) => void;
  onAddTab: (input: AddTabInput) => Promise<void>;
  onAddWidget: (input: AddWidgetInputUI) => Promise<void>;
  onOpenHiveLab: () => void;
  onQuickDeploy?: (template: QuickTemplateUI) => Promise<void>;
  onInviteMember: (input: MemberInviteInput) => Promise<void>;
  onSearchUsers: (query: string) => Promise<InviteableUser[]>;
  onCreateEvent: (input: EventCreateInput) => Promise<void>;
  existingMemberIds: string[];
  existingTools?: ExistingTool[];
  isLoadingTools?: boolean;
  onDeployExistingTool?: (toolId: string) => Promise<void>;
}

export function SpaceLeaderModals({
  tabs,
  boards,
  activeBoardId,
  addTabModalOpen,
  setAddTabModalOpen,
  addWidgetModalOpen,
  setAddWidgetModalOpen,
  inviteMemberModalOpen,
  setInviteMemberModalOpen,
  createEventModalOpen,
  setCreateEventModalOpen,
  onAddTab,
  onAddWidget,
  onOpenHiveLab,
  onQuickDeploy,
  onInviteMember,
  onSearchUsers,
  onCreateEvent,
  existingMemberIds,
  existingTools,
  isLoadingTools,
  onDeployExistingTool,
}: SpaceLeaderModalsProps) {
  return (
    <>
      <AddTabModal
        open={addTabModalOpen}
        onOpenChange={setAddTabModalOpen}
        onSubmit={onAddTab}
        existingTabNames={tabs.map((t) => t.name)}
      />
      <AddWidgetModal
        open={addWidgetModalOpen}
        onOpenChange={setAddWidgetModalOpen}
        onSubmit={onAddWidget}
        onOpenHiveLab={onOpenHiveLab}
        onQuickDeploy={onQuickDeploy}
        showQuickDeploy={!!onQuickDeploy}
        showHiveLab={true}
        existingTools={existingTools}
        isLoadingTools={isLoadingTools}
        onDeployExistingTool={onDeployExistingTool}
      />
      <MemberInviteModal
        open={inviteMemberModalOpen}
        onOpenChange={setInviteMemberModalOpen}
        onSubmit={onInviteMember}
        onSearchUsers={onSearchUsers}
        existingMemberIds={existingMemberIds}
      />
      <EventCreateModal
        open={createEventModalOpen}
        onOpenChange={setCreateEventModalOpen}
        onSubmit={onCreateEvent}
        boards={boards.map((b) => ({
          id: b.id,
          name: b.name,
        }))}
        defaultBoardId={activeBoardId}
      />
    </>
  );
}
