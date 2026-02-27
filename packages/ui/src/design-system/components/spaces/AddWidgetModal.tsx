'use client';

/**
 * AddWidgetModal Component
 *
 * Modal for adding tools/widgets to a space.
 * Three tabs: Quick Deploy, Your Tools, Create New
 */

import * as React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '../../primitives/Modal';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

// Simplified template type for UI display (subset of full QuickTemplate)
export interface QuickTemplateUI {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
}

export interface AddWidgetInputUI {
  name: string;
  title?: string;
  type?: string;
  config?: Record<string, unknown>;
}

export interface ExistingTool {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface AddWidgetModalProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: AddWidgetInputUI) => void | Promise<void>;
  existingTools?: ExistingTool[];
  onOpenHiveLab?: () => void;
  onQuickDeploy?: (template: QuickTemplateUI) => void | Promise<void>;
  quickTemplates?: QuickTemplateUI[];
  userTools?: ExistingTool[];
  isLoadingTools?: boolean;
  onDeployExistingTool?: (toolId: string) => void | Promise<void>;
  showQuickDeploy?: boolean;
  showHiveLab?: boolean;
}

type TabId = 'quick' | 'tools' | 'create';

const DEFAULT_QUICK_TEMPLATES: QuickTemplateUI[] = [
  {
    id: 'poll',
    name: 'Quick Poll',
    description: 'Create a poll for quick group decisions',
    icon: '📊',
    category: 'engagement',
  },
  {
    id: 'countdown',
    name: 'Countdown',
    description: 'Timer for events, deadlines, exams',
    icon: '⏱️',
    category: 'utility',
  },
  {
    id: 'rsvp',
    name: 'RSVP',
    description: 'Collect RSVPs for an event',
    icon: '✋',
    category: 'engagement',
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Pin important announcements',
    icon: '📢',
    category: 'communication',
  },
  {
    id: 'links',
    name: 'Link Hub',
    description: 'Organize important links',
    icon: '🔗',
    category: 'resource',
  },
  {
    id: 'todo',
    name: 'Group Tasks',
    description: 'Track shared tasks and assignments',
    icon: '✅',
    category: 'productivity',
  },
];

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  open = false,
  onClose,
  onOpenChange,
  onOpenHiveLab,
  onQuickDeploy,
  quickTemplates = DEFAULT_QUICK_TEMPLATES,
  userTools = [],
  isLoadingTools = false,
  onDeployExistingTool,
  showQuickDeploy = true,
  showHiveLab = true,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabId>('quick');
  const [deployingId, setDeployingId] = React.useState<string | null>(null);

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose?.();
        setDeployingId(null);
      }
      onOpenChange?.(isOpen);
    },
    [onClose, onOpenChange]
  );

  const handleQuickDeploy = async (template: QuickTemplateUI) => {
    if (deployingId) return;
    setDeployingId(template.id);
    try {
      await onQuickDeploy?.(template);
      handleOpenChange(false);
    } finally {
      setDeployingId(null);
    }
  };

  const handleDeployTool = async (toolId: string) => {
    if (deployingId) return;
    setDeployingId(toolId);
    try {
      await onDeployExistingTool?.(toolId);
      handleOpenChange(false);
    } finally {
      setDeployingId(null);
    }
  };

  const handleOpenHiveLab = () => {
    onOpenHiveLab?.();
    handleOpenChange(false);
  };

  const tabs = ([
    { id: 'quick' as const, label: 'Quick Deploy', show: showQuickDeploy },
    { id: 'tools' as const, label: 'Your Tools', show: userTools.length > 0 || isLoadingTools },
    { id: 'create' as const, label: 'Create New', show: showHiveLab },
  ] as const).filter((tab) => tab.show);

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>Add App</ModalTitle>
          <ModalDescription>
            Deploy a tool to enhance your space
          </ModalDescription>
        </ModalHeader>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 p-1 bg-[var(--color-bg-elevated)] rounded-lg mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
                  activeTab === tab.id
                    ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <div className="py-2">
          {/* Quick Deploy Tab */}
          {activeTab === 'quick' && (
            <div className="grid grid-cols-2 gap-3">
              {quickTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleQuickDeploy(template)}
                  disabled={!!deployingId}
                  className={cn(
                    'p-4 rounded-xl border border-[var(--color-border)]',
                    'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]',
                    'text-left transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    deployingId === template.id && 'ring-2 ring-[var(--color-life-gold)]'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{template.icon || '🔧'}</span>
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">
                        {template.name}
                      </Text>
                      <Text size="xs" tone="muted" className="line-clamp-2 mt-0.5">
                        {template.description}
                      </Text>
                    </div>
                    {deployingId === template.id && (
                      <div className="w-4 h-4 border-2 border-[var(--color-life-gold)] border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Your Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-2">
              {isLoadingTools ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[var(--color-life-gold)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userTools.length === 0 ? (
                <div className="text-center py-8">
                  <Text size="sm" tone="muted">
                    You haven't created any tools yet
                  </Text>
                  <Button
                    variant="ghost"
                    onClick={handleOpenHiveLab}
                    className="mt-4"
                  >
                    Create Your First Tool
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleDeployTool(tool.id)}
                      disabled={!!deployingId}
                      className={cn(
                        'w-full p-3 rounded-lg border border-[var(--color-border)]',
                        'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]',
                        'flex items-center gap-3 text-left transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-white/50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <span className="text-xl">{tool.icon || '🔧'}</span>
                      <div className="flex-1 min-w-0">
                        <Text size="sm" weight="medium" className="truncate">
                          {tool.name}
                        </Text>
                        {tool.description && (
                          <Text size="xs" tone="muted" className="truncate">
                            {tool.description}
                          </Text>
                        )}
                      </div>
                      {deployingId === tool.id ? (
                        <div className="w-4 h-4 border-2 border-[var(--color-life-gold)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg
                          className="w-4 h-4 text-[var(--color-text-muted)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create New Tab */}
          {activeTab === 'create' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-life-gold)]/20 to-[var(--color-life-gold)]/5 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--color-life-gold)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <Text size="lg" weight="semibold" className="mb-2">
                HiveLab
              </Text>
              <Text size="sm" tone="muted" className="mb-6 max-w-xs mx-auto">
                Build custom tools with our visual editor. No coding required.
              </Text>
              <Button variant="cta" onClick={handleOpenHiveLab}>
                Open HiveLab
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
};

AddWidgetModal.displayName = 'AddWidgetModal';

export { AddWidgetModal };
