/**
 * Space Page Modals Component
 *
 * All modal dialogs for the space detail page:
 * - Leader modals (add tab, add widget, invite, create event)
 * - Tool runtime modal
 * - Thread drawer
 * - Automation templates sheet
 * - Leader onboarding modal
 * - Member welcome modal
 * - Event details modal
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ThreadDrawer,
  EventDetailsModal,
  ToolRuntimeModal,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  AutomationTemplates,
  SpaceLeaderOnboardingModal,
  SpaceWelcomeModal,
  QuickCreateWizard,
  QUICK_TEMPLATES,
  getQuickTemplate,
  toast,
  type SpaceFeature,
  type QuickCreateResult,
} from '@hive/ui';
import { SpaceLeaderModals } from './space-leader-modals';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { buildToolRuntime } from '../utils/tool-runtime-builder';
import type { UseSpacePageStateReturn } from '../hooks';

interface SpacePageModalsProps {
  state: UseSpacePageStateReturn;
  router: ReturnType<typeof useRouter>;
  tabs: { name: string }[];
}

export function SpacePageModals({ state, router, tabs }: SpacePageModalsProps) {
  const {
    spaceId,
    space,
    isLeader,
    modals,
    setModal,
    selectedTool,
    toolRuntime,
    chat,
    leaders,
    events,
    tools,
    existingTools,
    isLoadingTools,
    selectedEventDetails,
    leaderOnboarding,
    handlers,
  } = state;

  if (!space) return null;

  return (
    <>
      {/* Leader Modals */}
      <SpaceLeaderModals
        tabs={tabs}
        boards={chat.boards}
        activeBoardId={chat.activeBoardId ?? undefined}
        addTabModalOpen={modals.addTab}
        setAddTabModalOpen={(open) => setModal('addTab', open)}
        addWidgetModalOpen={modals.addWidget}
        setAddWidgetModalOpen={(open) => setModal('addWidget', open)}
        inviteMemberModalOpen={modals.inviteMember}
        setInviteMemberModalOpen={(open) => setModal('inviteMember', open)}
        createEventModalOpen={modals.createEvent}
        setCreateEventModalOpen={(open) => setModal('createEvent', open)}
        onAddTab={handlers.handleAddTab}
        onAddWidget={handlers.handleAddWidget}
        onOpenHiveLab={handlers.handleOpenHiveLab}
        onQuickDeploy={async (templateUI) => {
          const fullTemplate = QUICK_TEMPLATES.find((t) => t.id === templateUI.id);
          if (fullTemplate) await handlers.handleQuickDeploy(fullTemplate);
        }}
        onInviteMember={handlers.handleInviteMember}
        onSearchUsers={handlers.handleSearchUsers}
        onCreateEvent={handlers.handleCreateEvent}
        existingMemberIds={leaders.map((l) => l.id)}
        existingTools={existingTools}
        isLoadingTools={isLoadingTools}
        onDeployExistingTool={handlers.handleDeployExistingTool}
      />

      {/* Tool Runtime Modal */}
      {selectedTool && (
        <ToolRuntimeModal
          open={modals.toolModal}
          onOpenChange={(open) => setModal('toolModal', open)}
          toolId={selectedTool.toolId}
          spaceId={spaceId ?? ''}
          placementId={selectedTool.placementId}
          toolName={selectedTool.name}
          onExpandToFullPage={() => {
            const deploymentId = `space:${spaceId}_${selectedTool.placementId}`;
            router.push(`/tools/${selectedTool.toolId}/run?spaceId=${spaceId}&deploymentId=${encodeURIComponent(deploymentId)}`);
            setModal('toolModal', false);
          }}
          runtime={toolRuntime.tool ? buildToolRuntime(toolRuntime) : undefined}
        />
      )}

      {/* Thread Drawer */}
      <ThreadDrawer
        open={chat.thread.isOpen}
        onOpenChange={(open) => !open && chat.closeThread()}
        parentMessage={chat.thread.parentMessage}
        replies={chat.thread.replies}
        isLoading={chat.thread.isLoading}
        isLoadingMore={chat.thread.isLoadingMore}
        hasMoreReplies={chat.thread.hasMore}
        currentUserId={state.currentUserId}
        onLoadMore={chat.loadMoreReplies}
        onSendReply={chat.sendThreadReply}
        onReact={chat.addReaction}
      />

      {/* Automation Templates Sheet */}
      <Sheet open={modals.templates} onOpenChange={(open) => setModal('templates', open)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-[var(--bg-ground)] border-l border-[var(--border)]">
          <SheetHeader className="border-b border-[var(--border)] pb-4">
            <SheetTitle className="text-[var(--text-primary)]">Automation Templates</SheetTitle>
          </SheetHeader>
          <div className="py-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <AutomationTemplates
              spaceId={spaceId ?? ''}
              fetchTemplates={async () => {
                const res = await secureApiFetch('/api/automations/templates');
                if (!res.ok) throw new Error('Failed to fetch templates');
                return res.json();
              }}
              onApplyTemplate={async (templateId, customValues, name) => {
                const res = await secureApiFetch(`/api/spaces/${spaceId}/automations/from-template`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ templateId, customValues, name }),
                });
                if (!res.ok) throw new Error('Failed to apply template');
                toast.success('Automation enabled', 'It will start working automatically.');
              }}
              onAutomationCreated={() => {}}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Leader Onboarding Modal */}
      <SpaceLeaderOnboardingModal
        open={leaderOnboarding.shouldShowOnboarding}
        onOpenChange={(open) => !open && leaderOnboarding.dismiss()}
        spaceName={space.name}
        templates={QUICK_TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, icon: t.icon }))}
        onDeployTemplate={async (templateId: string) => {
          const template = QUICK_TEMPLATES.find((t) => t.id === templateId);
          if (template) await handlers.handleQuickDeploy(template);
        }}
        onInviteClick={() => setModal('inviteMember', true)}
        onComplete={leaderOnboarding.markWelcomeSeen}
      />

      {/* Member Welcome Modal */}
      <SpaceWelcomeModal
        open={modals.welcome}
        onOpenChange={(open) => setModal('welcome', open)}
        spaceName={space.name}
        spaceDescription={space.description}
        category={space.category}
        spaceIconUrl={space.iconUrl}
        spaceBannerUrl={space.bannerUrl}
        leaders={leaders.map((l) => ({ id: l.id, name: l.name, avatarUrl: l.avatarUrl, role: l.role }))}
        memberCount={space.memberCount ?? 0}
        features={buildFeatures(events, tools)}
        onStartChatting={() => setModal('welcome', false)}
        onDismiss={() => setModal('welcome', false)}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEventDetails}
        open={modals.eventDetails}
        onOpenChange={(open) => setModal('eventDetails', open)}
        onRSVP={handlers.handleEventRSVP}
        onViewBoard={
          selectedEventDetails?.linkedBoardId
            ? (boardId) => {
                chat.changeBoard(boardId);
                setModal('eventDetails', false);
              }
            : undefined
        }
        currentUserId={state.currentUserId}
        spaceId={spaceId ?? ''}
      />

      {/* Quick Create Wizard - "Blind Build" experience */}
      <QuickCreateWizard
        open={modals.quickCreate}
        onOpenChange={(open) => setModal('quickCreate', open)}
        spaceContext={{
          spaceId: spaceId ?? undefined,
          spaceName: space.name,
          spaceType: space.category,
          memberCount: space.memberCount ?? 0,
        }}
        onComplete={async (result: QuickCreateResult) => {
          // Get the template for this intent
          const template = getQuickTemplate(result.templateId);
          if (!template) {
            toast.error('Template not found', 'Unable to create this tool.');
            return;
          }

          // Apply config values to the template
          const configuredTemplate = {
            ...template,
            name: result.config.name || template.name,
            composition: {
              ...template.composition,
              name: result.config.name || template.composition.name,
              elements: template.composition.elements.map((el, idx) => {
                if (idx === 0) {
                  // Apply config to the first element (primary element)
                  const updatedConfig = { ...el.config };
                  for (const [key, value] of Object.entries(result.config)) {
                    if (key !== 'name' && value) {
                      // Handle special cases like options (comma-separated)
                      if (key === 'options' && typeof value === 'string') {
                        updatedConfig[key] = value.split(',').map((s: string) => s.trim());
                      } else {
                        updatedConfig[key] = value;
                      }
                    }
                  }
                  return { ...el, config: updatedConfig };
                }
                return el;
              }),
            },
          };

          // Deploy using existing quick deploy handler
          await handlers.handleQuickDeploy(configuredTemplate);
          setModal('quickCreate', false);
        }}
      />
    </>
  );
}

// Helper function for building features list
function buildFeatures(events: unknown[], tools: unknown[]): SpaceFeature[] {
  const features: SpaceFeature[] = [];
  if (events.length > 0)
    features.push({ icon: '📅', title: 'Upcoming Events', description: 'Join meetups and activities' });
  if (tools.length > 0)
    features.push({ icon: '🛠️', title: 'Interactive Tools', description: 'Polls, signups, and more' });
  features.push({ icon: '💬', title: 'Live Discussions', description: 'Chat with the community in real-time' });
  return features;
}
