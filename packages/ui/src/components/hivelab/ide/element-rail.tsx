'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AutomationsPanel, type AutomationSummary } from './automations-panel';
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, RectangleGroupIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Shapes = RectangleGroupIcon;
const Layers = Square3Stack3DIcon;
import { cn } from '../../../lib/utils';
import { HiveLogo } from '../../../shells/shell-icons';
import { ElementPalette } from './element-palette';
import { LayersPanel } from './layers-panel';
import { OtherToolsPanel, type OtherToolData } from './other-tools-panel';
import type { CanvasElement, Connection } from './types';

const AUTOMATIONS_ENABLED = true;
const CROSS_TOOL_CONNECTIONS_ENABLED = false; // Sprint 3: gate until runtime connections work

// ============================================
// HiveLab Element Rail - Uses CSS variables from globals.css
// ============================================

import { FOCUS_RING, WORKSHOP_TRANSITION } from '../tokens';

// Use shared tokens
const focusRing = FOCUS_RING;
const workshopTransition = WORKSHOP_TRANSITION;

export type RailState = 'expanded' | 'collapsed' | 'hidden';
export type RailTab = 'elements' | 'layers' | 'spaceTools' | 'automations';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

/** User tool item for the "Your Tools" drawer */
export interface UserToolItem {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'deployed';
  updatedAt: Date;
}

interface ElementRailProps {
  state: RailState;
  onStateChange: (state: RailState) => void;
  activeTab: RailTab;
  onTabChange: (tab: RailTab) => void;
  elements: CanvasElement[];
  connections: Connection[];
  selectedIds: string[];
  onDragStart: (elementId: string) => void;
  onDragEnd: () => void;
  onSelect: (ids: string[], append?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorder: (elements: CanvasElement[]) => void;
  onOpenAI: () => void;
  onOpenTemplates: () => void;
  userContext?: {
    userId?: string;
    campusId?: string;
    isSpaceLeader?: boolean;
    leadingSpaceIds?: string[];
  };
  /** User's saved tools for the "Your Tools" drawer */
  userTools?: UserToolItem[];
  /** Callback when user selects a tool from the drawer */
  onToolSelect?: (id: string) => void;
  /** Callback when user clicks "New Tool" */
  onNewTool?: () => void;
  /** Sprint 3: Other tools deployed to the same space */
  spaceTools?: OtherToolData[];
  /** Sprint 3: Loading state for space tools */
  spaceToolsLoading?: boolean;
  /** Sprint 3: Error state for space tools */
  spaceToolsError?: string;
  /** Sprint 3: Current deployment ID (to exclude from space tools list) */
  currentDeploymentId?: string;
  /** Sprint 3: Callback to create a connection from a space tool output */
  onCreateConnection?: (sourceDeploymentId: string, outputPath: string, outputType: string) => void;
  /** Sprint 3: Callback to refresh space tools list */
  onRefreshSpaceTools?: () => void;
  /** Sprint 4: Automations for the current tool */
  automations?: AutomationSummary[];
  /** Sprint 4: Loading state for automations */
  automationsLoading?: boolean;
  /** Sprint 4: Callback to create a new automation */
  onCreateAutomation?: () => void;
  /** Sprint 4: Callback to edit an automation */
  onEditAutomation?: (id: string) => void;
  /** Sprint 4: Callback to delete an automation */
  onDeleteAutomation?: (id: string) => void;
  /** Sprint 4: Callback to toggle automation enabled state */
  onToggleAutomation?: (id: string, enabled: boolean) => void;
  /** Sprint 4: Callback to view automation logs */
  onViewAutomationLogs?: (id: string) => void;
  /** Sprint 4: Callback to run an automation immediately */
  onRunAutomationNow?: (id: string) => void;
}

// Make.com style app icons for sidebar
function SlackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.448-1.632z"/>
    </svg>
  );
}

function GoogleDriveIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.71 3.5L1.15 15l3.43 5.95 6.56-11.38L7.71 3.5zm1.79 0l3.43 5.95h9.92l-3.43-5.95H9.5zm12.35 7.13H12.9l-6.56 11.38h8.95l6.56-11.38z"/>
    </svg>
  );
}

function WebhookIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="5" r="3"/>
      <circle cx="5" cy="19" r="3"/>
      <circle cx="19" cy="19" r="3"/>
      <path d="M12 8v4m0 0l-5.5 5m5.5-5l5.5 5"/>
    </svg>
  );
}

function ChatGPTIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  );
}

function CanvaIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"/>
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"/>
    </svg>
  );
}

function CollapsedRail({
  activeTab,
  onTabChange,
  onExpand,
  onOpenAI,
}: {
  activeTab: RailTab;
  onTabChange: (tab: RailTab) => void;
  onExpand: () => void;
  onOpenAI: () => void;
}) {
  return (
    <div
      className="w-16 h-full flex flex-col items-center py-3 gap-0.5"
      style={{
        backgroundColor: 'var(--hivelab-panel)',
        borderTopLeftRadius: '24px',
        borderBottomLeftRadius: '24px',
      }}
    >
      {/* HIVE Logo */}
      <div className="flex items-center gap-1 mb-2">
        <HiveLogo className="w-8 h-8 text-[var(--life-gold)]" />
      </div>

      {/* Plus Button - top right style */}
      <button
        type="button"
        onClick={() => {
          onTabChange('elements');
          onExpand();
        }}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'transition-colors duration-200 mb-2',
          focusRing
        )}
        style={{ color: 'var(--hivelab-text-tertiary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--hivelab-text-secondary)';
          e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--hivelab-text-tertiary)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Add module"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Home - active state with white circle */}
      <button
        type="button"
        onClick={onExpand}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          'transition-colors duration-200',
          focusRing
        )}
        style={{
          backgroundColor: 'white',
          color: 'var(--hivelab-panel)',
        }}
        title="Home"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </button>

      {/* Elements Tab */}
      <TabButton icon={<Shapes className="h-5 w-5" />} label="Elements" active={activeTab === 'elements'} onClick={() => { onTabChange('elements'); onExpand(); }} />
      <TabButton icon={<Layers className="h-5 w-5" />} label="Layers" active={activeTab === 'layers'} onClick={() => { onTabChange('layers'); onExpand(); }} />
      {/* Space Tools Tab - Sprint 3 (gated until runtime connections work) */}
      {CROSS_TOOL_CONNECTIONS_ENABLED && (
        <TabButton
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          }
          label="Space Apps"
          active={activeTab === 'spaceTools'}
          onClick={() => { onTabChange('spaceTools'); onExpand(); }}
        />
      )}
      {/* Automations Tab - Sprint 4 (hidden until backend ready) */}
      {AUTOMATIONS_ENABLED && (
        <TabButton
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
          label="Automations"
          active={activeTab === 'automations'}
          onClick={() => { onTabChange('automations'); onExpand(); }}
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help */}
      <button
        type="button"
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'transition-colors duration-200',
          focusRing
        )}
        style={{ color: 'var(--hivelab-text-tertiary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--hivelab-text-secondary)';
          e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--hivelab-text-tertiary)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Help"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
      </button>

    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-10 h-10 rounded-xl flex items-center justify-center',
        'transition-colors duration-200',
        focusRing
      )}
      style={{
        color: active ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-tertiary)',
        backgroundColor: active ? 'var(--hivelab-surface-active)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--hivelab-text-secondary)';
          e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--hivelab-text-tertiary)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      title={label}
    >
      {icon}
    </button>
  );
}

function ExpandedRail({
  activeTab,
  onTabChange,
  onCollapse,
  onOpenAI,
  onOpenTemplates,
  elements,
  connections,
  selectedIds,
  onDragStart,
  onDragEnd,
  onSelect,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorder,
  userContext,
  userTools,
  onToolSelect,
  onNewTool,
  spaceTools,
  spaceToolsLoading,
  spaceToolsError,
  currentDeploymentId,
  onCreateConnection,
  onRefreshSpaceTools,
  automations,
  automationsLoading,
  onCreateAutomation,
  onEditAutomation,
  onDeleteAutomation,
  onToggleAutomation,
  onViewAutomationLogs,
  onRunAutomationNow,
}: {
  activeTab: RailTab;
  onTabChange: (tab: RailTab) => void;
  onCollapse: () => void;
  onOpenAI: () => void;
  onOpenTemplates: () => void;
  elements: CanvasElement[];
  connections: Connection[];
  selectedIds: string[];
  onDragStart: (elementId: string) => void;
  onDragEnd: () => void;
  onSelect: (ids: string[], append?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorder: (elements: CanvasElement[]) => void;
  userContext?: {
    userId?: string;
    campusId?: string;
    isSpaceLeader?: boolean;
    leadingSpaceIds?: string[];
  };
  userTools?: UserToolItem[];
  onToolSelect?: (id: string) => void;
  automations?: AutomationSummary[];
  automationsLoading?: boolean;
  onCreateAutomation?: () => void;
  onEditAutomation?: (id: string) => void;
  onDeleteAutomation?: (id: string) => void;
  onToggleAutomation?: (id: string, enabled: boolean) => void;
  onViewAutomationLogs?: (id: string) => void;
  onRunAutomationNow?: (id: string) => void;
  onNewTool?: () => void;
  spaceTools?: OtherToolData[];
  spaceToolsLoading?: boolean;
  spaceToolsError?: string;
  currentDeploymentId?: string;
  onCreateConnection?: (sourceDeploymentId: string, outputPath: string, outputType: string) => void;
  onRefreshSpaceTools?: () => void;
}) {
  return (
    <div
      className="h-full flex flex-col"
      style={{
        width: EXPANDED_WIDTH,
        backgroundColor: 'var(--hivelab-panel)',
        borderRight: `1px solid ${'var(--hivelab-border)'}`,
      }}
    >
      {/* Header with collapse button - dark theme */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${'var(--hivelab-border)'}` }}
      >
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onTabChange('elements')}
            className={cn(
              'px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
              'transition-all duration-200',
              activeTab === 'elements'
                ? 'bg-[var(--hivelab-surface)] shadow-sm'
                : 'hover:bg-[var(--hivelab-surface-hover)]',
              focusRing
            )}
            style={{
              color: activeTab === 'elements' ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-tertiary)',
            }}
          >
            Elements
          </button>
          <button
            type="button"
            onClick={() => onTabChange('layers')}
            className={cn(
              'px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
              'transition-all duration-200',
              activeTab === 'layers'
                ? 'bg-[var(--hivelab-surface)] shadow-sm'
                : 'hover:bg-[var(--hivelab-surface-hover)]',
              focusRing
            )}
            style={{
              color: activeTab === 'layers' ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-tertiary)',
            }}
          >
            Layers
          </button>
          {CROSS_TOOL_CONNECTIONS_ENABLED && (
            <button
              type="button"
              onClick={() => onTabChange('spaceTools')}
              className={cn(
                'px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
                'transition-all duration-200',
                activeTab === 'spaceTools'
                  ? 'bg-[var(--hivelab-surface)] shadow-sm'
                  : 'hover:bg-[var(--hivelab-surface-hover)]',
                focusRing
              )}
              style={{
                color: activeTab === 'spaceTools' ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-tertiary)',
              }}
            >
              Space
            </button>
          )}
          {AUTOMATIONS_ENABLED && (
            <button
              type="button"
              onClick={() => onTabChange('automations')}
              className={cn(
                'px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
                'transition-all duration-200',
                activeTab === 'automations'
                  ? 'bg-[var(--hivelab-surface)] shadow-sm'
                  : 'hover:bg-[var(--hivelab-surface-hover)]',
                focusRing
              )}
              style={{
                color: activeTab === 'automations' ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-tertiary)',
              }}
            >
              Auto
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className={cn(
            'p-1.5 rounded-lg transition-colors duration-200',
            focusRing
          )}
          style={{ color: 'var(--hivelab-text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--hivelab-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--hivelab-text-tertiary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Collapse panel"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Actions - dark theme with green accent */}
      {activeTab === 'elements' && (
        <div
          className="px-3 py-3 space-y-2"
          style={{ borderBottom: `1px solid ${'var(--hivelab-border)'}` }}
        >
          <button
            type="button"
            onClick={onOpenAI}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
              'text-sm font-medium transition-colors duration-200',
              focusRing
            )}
            style={{
              backgroundColor: `${'var(--hivelab-connection)'}15`,
              color: 'var(--hivelab-connection)',
              border: `1px solid ${'var(--hivelab-connection)'}30`,
            }}
          >
            <SparklesIcon className="h-4 w-4" />
            Describe with AI
            <kbd
              className="ml-auto px-1.5 py-0.5 text-label-xs rounded"
              style={{ backgroundColor: `${'var(--hivelab-connection)'}20` }}
            >
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={onOpenTemplates}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
              'text-sm transition-colors duration-200',
              focusRing
            )}
            style={{
              backgroundColor: 'var(--hivelab-surface-hover)',
              color: 'var(--hivelab-text-secondary)',
              border: `1px solid ${'var(--hivelab-border)'}`,
            }}
          >
            <ClockIcon className="h-4 w-4" />
            Browse Templates
            <kbd
              className="ml-auto px-1.5 py-0.5 text-label-xs rounded"
              style={{
                backgroundColor: 'var(--hivelab-panel)',
                color: 'var(--hivelab-text-tertiary)',
              }}
            >
              ⌘T
            </kbd>
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'elements' ? (
            <motion.div
              key="elements"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <ElementPalette
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                userContext={userContext}
              />
            </motion.div>
          ) : activeTab === 'layers' ? (
            <motion.div
              key="layers"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <LayersPanel
                elements={elements}
                connections={connections}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                onDuplicateElement={onDuplicateElement}
                onReorder={onReorder}
              />
            </motion.div>
          ) : (CROSS_TOOL_CONNECTIONS_ENABLED && activeTab === 'spaceTools') ? (
            <motion.div
              key="spaceTools"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              <OtherToolsPanel
                tools={spaceTools || []}
                loading={spaceToolsLoading}
                error={spaceToolsError}
                currentDeploymentId={currentDeploymentId}
                onCreateConnection={onCreateConnection}
                onRefresh={onRefreshSpaceTools}
              />
            </motion.div>
          ) : (AUTOMATIONS_ENABLED && activeTab === 'automations') ? (
            <motion.div
              key="automations"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              <AutomationsPanel
                automations={automations || []}
                loading={automationsLoading}
                onCreateAutomation={onCreateAutomation || (() => {})}
                onEditAutomation={onEditAutomation || (() => {})}
                onDeleteAutomation={onDeleteAutomation || (() => {})}
                onToggleAutomation={onToggleAutomation || (() => {})}
                onViewLogs={onViewAutomationLogs || (() => {})}
                onRunNow={onRunAutomationNow}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tools"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              <ToolsPanel
                userTools={userTools}
                onToolSelect={onToolSelect}
                onNewTool={onNewTool}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Your Tools Panel - shows user's saved tools */
function ToolsPanel({
  userTools,
  onToolSelect,
  onNewTool,
}: {
  userTools?: UserToolItem[];
  onToolSelect?: (id: string) => void;
  onNewTool?: () => void;
}) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: 'draft' | 'published' | 'deployed') => {
    switch (status) {
      case 'deployed':
        return { label: 'Live', color: 'var(--hivelab-status-success)' };
      case 'published':
        return { label: 'Published', color: 'var(--hivelab-connection)' };
      default:
        return { label: 'Draft', color: 'var(--hivelab-text-tertiary)' };
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* New Tool Button - gold accent */}
      <button
        type="button"
        onClick={onNewTool}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
          'text-sm font-medium transition-all duration-200',
          'hover:shadow-md hover:opacity-90 active:opacity-80',
          focusRing
        )}
        style={{
          backgroundColor: `${'var(--hivelab-connection)'}15`,
          color: 'var(--hivelab-connection)',
          border: `1px solid ${'var(--hivelab-connection)'}30`,
        }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New App
      </button>

      {/* Tools List */}
      {(!userTools || userTools.length === 0) ? (
        <div className="text-center py-8 px-4">
          {/* Animated sparkle icon */}
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${'var(--hivelab-connection)'}10` }}
          >
            <SparklesIcon className="h-7 w-7" style={{ color: 'var(--hivelab-connection)' }} />
          </div>
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--hivelab-text-primary)' }}
          >
            Create your first app
          </p>
          <p
            className="text-xs leading-relaxed mb-4"
            style={{ color: 'var(--hivelab-text-tertiary)' }}
          >
            Build apps your community will love — polls, signups, countdowns, and more.
          </p>
          {/* CTA Button */}
          <button
            type="button"
            onClick={onNewTool}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
              'text-sm font-medium transition-all duration-200',
              'hover:shadow-md hover:opacity-90 active:opacity-80',
              focusRing
            )}
            style={{
              backgroundColor: 'var(--hivelab-connection)',
              color: '#000',
            }}
          >
            <SparklesIcon className="h-4 w-4" />
            Start Building
          </button>
          {/* Templates link */}
          <a
            href="/tools/templates"
            className="inline-block mt-3 text-xs transition-colors"
            style={{ color: 'var(--hivelab-text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--hivelab-connection)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--hivelab-text-tertiary)'; }}
          >
            or browse 25+ templates →
          </a>
        </div>
      ) : (
        <div className="space-y-1.5">
          {userTools.map((tool) => {
            const badge = getStatusBadge(tool.status);
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onToolSelect?.(tool.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg',
                  'transition-colors duration-200',
                  focusRing
                )}
                style={{ color: 'var(--hivelab-text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {tool.name || 'Untitled App'}
                  </span>
                  <span
                    className="text-label-xs px-1.5 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${badge.color}20`,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--hivelab-text-tertiary)' }}
                >
                  {formatDate(tool.updatedAt)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ElementRail({
  state,
  onStateChange,
  activeTab,
  onTabChange,
  elements,
  connections,
  selectedIds,
  onDragStart,
  onDragEnd,
  onSelect,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorder,
  onOpenAI,
  onOpenTemplates,
  userContext,
  userTools,
  onToolSelect,
  onNewTool,
  spaceTools,
  spaceToolsLoading,
  spaceToolsError,
  currentDeploymentId,
  onCreateConnection,
  onRefreshSpaceTools,
  automations,
  automationsLoading,
  onCreateAutomation,
  onEditAutomation,
  onDeleteAutomation,
  onToggleAutomation,
  onViewAutomationLogs,
  onRunAutomationNow,
}: ElementRailProps) {
  const handleExpand = useCallback(() => {
    onStateChange('expanded');
  }, [onStateChange]);

  const handleCollapse = useCallback(() => {
    onStateChange('collapsed');
  }, [onStateChange]);

  return (
    <AnimatePresence mode="wait">
      {state === 'hidden' ? null : state === 'collapsed' ? (
        <motion.div
          key="collapsed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: COLLAPSED_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={workshopTransition}
        >
          <CollapsedRail
            activeTab={activeTab}
            onTabChange={onTabChange}
            onExpand={handleExpand}
            onOpenAI={onOpenAI}
          />
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: EXPANDED_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={workshopTransition}
        >
          <ExpandedRail
            activeTab={activeTab}
            onTabChange={onTabChange}
            onCollapse={handleCollapse}
            onOpenAI={onOpenAI}
            onOpenTemplates={onOpenTemplates}
            elements={elements}
            connections={connections}
            selectedIds={selectedIds}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onSelect={onSelect}
            onUpdateElement={onUpdateElement}
            onDeleteElement={onDeleteElement}
            onDuplicateElement={onDuplicateElement}
            onReorder={onReorder}
            userContext={userContext}
            userTools={userTools}
            onToolSelect={onToolSelect}
            onNewTool={onNewTool}
            spaceTools={spaceTools}
            spaceToolsLoading={spaceToolsLoading}
            spaceToolsError={spaceToolsError}
            currentDeploymentId={currentDeploymentId}
            onCreateConnection={onCreateConnection}
            onRefreshSpaceTools={onRefreshSpaceTools}
            automations={automations}
            automationsLoading={automationsLoading}
            onCreateAutomation={onCreateAutomation}
            onEditAutomation={onEditAutomation}
            onDeleteAutomation={onDeleteAutomation}
            onToggleAutomation={onToggleAutomation}
            onViewAutomationLogs={onViewAutomationLogs}
            onRunAutomationNow={onRunAutomationNow}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
