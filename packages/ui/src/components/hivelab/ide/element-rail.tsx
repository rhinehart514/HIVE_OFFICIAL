'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Shapes,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  Clock,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { focusClasses, premiumMotion } from '../../../lib/premium-design';
import { ElementPalette } from './element-palette';
import { LayersPanel } from './layers-panel';
import type { CanvasElement, Connection } from './types';

export type RailState = 'expanded' | 'collapsed' | 'hidden';
export type RailTab = 'start' | 'elements' | 'layers';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

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
    <div className="w-16 h-full flex flex-col items-center py-3 gap-1 bg-[#111111] border-r border-white/[0.06]">
      {/* AI Quick Access */}
      <button
        type="button"
        onClick={onOpenAI}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/20',
          'transition-colors mb-2',
          focusClasses()
        )}
        title="AI (⌘K)"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      <div className="w-8 h-px bg-white/[0.06] mb-2" />

      {/* Tab Buttons */}
      <TabButton
        icon={<Shapes className="h-5 w-5" />}
        label="Elements"
        active={activeTab === 'elements'}
        onClick={() => {
          onTabChange('elements');
          onExpand();
        }}
      />
      <TabButton
        icon={<Layers className="h-5 w-5" />}
        label="Layers"
        active={activeTab === 'layers'}
        onClick={() => {
          onTabChange('layers');
          onExpand();
        }}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Expand Button */}
      <button
        type="button"
        onClick={onExpand}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'text-[#6B6B70] hover:text-white hover:bg-white/[0.06]',
          'transition-colors',
          focusClasses()
        )}
        title="Expand panel"
      >
        <ChevronRight className="h-5 w-5" />
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
        'relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
        active
          ? 'text-white bg-white/[0.10]'
          : 'text-[#6B6B70] hover:text-white hover:bg-white/[0.06]',
        focusClasses()
      )}
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
}) {
  return (
    <div
      className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06]"
      style={{ width: EXPANDED_WIDTH }}
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange('elements')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activeTab === 'elements'
                ? 'bg-white/[0.10] text-white'
                : 'text-[#6B6B70] hover:text-white hover:bg-white/[0.06]',
              focusClasses()
            )}
          >
            Elements
          </button>
          <button
            type="button"
            onClick={() => onTabChange('layers')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activeTab === 'layers'
                ? 'bg-white/[0.10] text-white'
                : 'text-[#6B6B70] hover:text-white hover:bg-white/[0.06]',
              focusClasses()
            )}
          >
            Layers
          </button>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className={cn(
            'p-1.5 rounded-lg text-[#6B6B70] hover:text-white hover:bg-white/[0.06]',
            'transition-colors',
            focusClasses()
          )}
          title="Collapse panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Actions */}
      {activeTab === 'elements' && (
        <div className="px-3 py-3 border-b border-white/[0.06] space-y-2">
          <button
            type="button"
            onClick={onOpenAI}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/15',
              'border border-[#FFD700]/20 transition-colors text-sm font-medium',
              focusClasses()
            )}
          >
            <Sparkles className="h-4 w-4" />
            Describe with AI
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-[#FFD700]/10 rounded">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={onOpenTemplates}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-white/[0.04] text-[#9A9A9F] hover:text-white hover:bg-white/[0.08]',
              'border border-white/[0.06] transition-colors text-sm',
              focusClasses()
            )}
          >
            <Clock className="h-4 w-4" />
            Browse Templates
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-white/[0.06] rounded text-[#6B6B70]">
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
          ) : (
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
          )}
        </AnimatePresence>
      </div>
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
          transition={premiumMotion.spring.default}
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
          transition={premiumMotion.spring.default}
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
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
