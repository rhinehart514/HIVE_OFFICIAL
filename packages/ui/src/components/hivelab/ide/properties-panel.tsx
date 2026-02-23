'use client';

import { useState, useRef, useCallback } from 'react';
import { Cog6ToothIcon, HashtagIcon, ListBulletIcon, ArrowsPointingOutIcon, TrashIcon, ClipboardDocumentIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon, ChevronRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { springPresets, durationSeconds } from '@hive/tokens';
import { cn } from '../../../lib/utils';
import { ContextPicker } from './context-picker';
import { ConditionBuilder } from './condition-builder';
import { ELEMENT_SCHEMAS, PropertyField } from './config-fields';
import type { PropertySchema } from './config-fields';
type ConnectionWithMetadata = Record<string, unknown>;
import type { CanvasElement } from './types';
import type { ContextRequirements, VisibilityCondition, ConditionGroup, ToolConnection } from '@hive/core';

// ============================================
// HiveLab Properties Panel - Uses CSS variables from globals.css
// ============================================

import { FOCUS_RING } from '../tokens';

// Workshop tokens
const focusRing = FOCUS_RING;

// Validation shake animation
const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
  transition: { duration: 0.5 },
};

// Hook for arrow key nudge feedback
function useNudgeFeedback() {
  const [nudgeDirection, setNudgeDirection] = useState<'up' | 'down' | null>(null);

  const triggerNudge = useCallback((direction: 'up' | 'down') => {
    setNudgeDirection(direction);
    setTimeout(() => setNudgeDirection(null), 150);
  }, []);

  return { nudgeDirection, triggerNudge };
}

interface PageInfo {
  id: string;
  name: string;
}

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  /** Available pages for navigation configuration */
  pages?: PageInfo[];
  /** Sprint 3: Connections targeting this element */
  elementConnections?: ConnectionWithMetadata[];
  /** Sprint 3: Loading state for connections */
  connectionsLoading?: boolean;
  /** Sprint 3: Callback to edit a connection */
  onEditConnection?: (connection: ToolConnection) => void;
  /** Sprint 3: Callback to delete a connection */
  onDeleteConnection?: (connectionId: string) => void;
  /** Sprint 3: Callback to toggle connection enabled/disabled */
  onToggleConnection?: (connectionId: string, enabled: boolean) => void;
  /** Sprint 3: Callback to test a connection */
  onTestConnection?: (connectionId: string) => void;
  /** Sprint 3: Callback to add a new connection */
  onAddConnection?: () => void;
  /** Sprint 3: Callback to refresh connections */
  onRefreshConnections?: () => void;
}

// ELEMENT_SCHEMAS, PropertySchema, PropertyField imported from ./config-fields

/**
 * AdvancedSection — Collapsed by default, contains Context/Visibility/Connections
 * Only visible to users who explicitly want to configure advanced behavior
 */
function AdvancedSection({
  selectedElement,
  onUpdateElement,
  elementConnections,
  connectionsLoading,
  onEditConnection,
  onDeleteConnection,
  onToggleConnection,
  onTestConnection,
  onAddConnection,
  onRefreshConnections,
  pages,
}: {
  selectedElement: CanvasElement;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  elementConnections?: ConnectionWithMetadata[];
  connectionsLoading?: boolean;
  onEditConnection?: (connection: ToolConnection) => void;
  onDeleteConnection?: (connectionId: string) => void;
  onToggleConnection?: (connectionId: string, enabled: boolean) => void;
  onTestConnection?: (connectionId: string) => void;
  onAddConnection?: () => void;
  onRefreshConnections?: () => void;
  pages?: PageInfo[];
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasPages = pages && pages.length > 1;
  type AdvancedTab = 'context' | 'visibility' | 'connections' | 'navigation';
  const [activeTab, setActiveTab] = useState<AdvancedTab>('context');
  const prefersReducedMotion = useReducedMotion();

  // Count configured items for badge
  const contextCount = selectedElement.contextRequirements
    ? Object.values(selectedElement.contextRequirements).filter(Boolean).length
    : 0;
  const visibilityCount = Array.isArray(selectedElement.visibilityConditions)
    ? selectedElement.visibilityConditions.length
    : selectedElement.visibilityConditions ? 1 : 0;
  const connectionCount = elementConnections?.length || 0;
  const totalConfigured = contextCount + visibilityCount + connectionCount;

  if (!showAdvanced) {
    return (
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(true)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200',
            focusRing
          )}
          style={{
            backgroundColor: 'transparent',
            border: `1px dashed var(--hivelab-border)`,
            color: 'var(--hivelab-text-tertiary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderStyle = 'solid';
            e.currentTarget.style.borderColor = 'var(--hivelab-border-emphasis)';
            e.currentTarget.style.color = 'var(--hivelab-text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderStyle = 'dashed';
            e.currentTarget.style.borderColor = 'var(--hivelab-border)';
            e.currentTarget.style.color = 'var(--hivelab-text-tertiary)';
          }}
        >
          <Cog6ToothIcon className="w-3.5 h-3.5" />
          Advanced settings
          {totalConfigured > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: 'var(--life-gold)',
                color: '#000',
              }}
            >
              {totalConfigured}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden"
    >
      {/* Advanced header with close */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ borderBottom: `1px solid var(--hivelab-border)` }}
      >
        <span
          className="text-label-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--hivelab-text-tertiary)' }}
        >
          Advanced
        </span>
        <button
          type="button"
          onClick={() => setShowAdvanced(false)}
          className={cn('p-1 rounded transition-colors', focusRing)}
          style={{ color: 'var(--hivelab-text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ChevronDownIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex px-4 pt-2 gap-1">
        {([...(['context', 'visibility', 'connections'] as const), ...(hasPages ? ['navigation' as const] : [])] as AdvancedTab[]).map((tab) => {
          const count = tab === 'context' ? contextCount : tab === 'visibility' ? visibilityCount : tab === 'connections' ? connectionCount : (selectedElement.onAction ? 1 : 0);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn('flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all', focusRing)}
              style={{
                backgroundColor: activeTab === tab ? 'var(--hivelab-surface-hover)' : 'transparent',
                color: activeTab === tab ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-tertiary)',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {count > 0 && (
                <span className="ml-1 text-[10px]" style={{ color: 'var(--life-gold)' }}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="px-4 py-3">
        <AnimatePresence mode="wait">
          {activeTab === 'context' && (
            <motion.div
              key="context"
              initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <ContextPicker
                requirements={selectedElement.contextRequirements as ContextRequirements | undefined}
                onChange={(requirements) =>
                  onUpdateElement(selectedElement.id, {
                    contextRequirements: requirements,
                  })
                }
                compact
              />
            </motion.div>
          )}

          {activeTab === 'visibility' && (
            <motion.div
              key="visibility"
              initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <ConditionBuilder
                conditions={selectedElement.visibilityConditions as VisibilityCondition[] | ConditionGroup | undefined}
                onChange={(conditions) =>
                  onUpdateElement(selectedElement.id, {
                    visibilityConditions: conditions,
                  })
                }
                compact
              />
            </motion.div>
          )}

          {activeTab === 'connections' && (
            <motion.div
              key="connections"
              initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-4 text-sm opacity-50">Connections removed</div>
            </motion.div>
          )}

          {activeTab === 'navigation' && hasPages && (
            <motion.div
              key="navigation"
              initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-3">
                <p
                  className="text-xs"
                  style={{ color: 'var(--hivelab-text-tertiary)' }}
                >
                  Navigate to another page when the user interacts with this element.
                </p>
                <div>
                  <label
                    className="text-label-xs font-medium uppercase tracking-wider mb-1.5 block"
                    style={{ color: 'var(--hivelab-text-tertiary)' }}
                  >
                    On interaction, go to
                  </label>
                  <select
                    value={selectedElement.onAction?.targetPageId || ''}
                    onChange={(e) => {
                      const targetPageId = e.target.value;
                      onUpdateElement(selectedElement.id, {
                        onAction: targetPageId
                          ? { type: 'navigate', targetPageId }
                          : undefined,
                      });
                    }}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-sm cursor-pointer outline-none transition-all duration-200',
                      focusRing
                    )}
                    style={{
                      backgroundColor: 'var(--hivelab-surface-hover)',
                      border: '1px solid var(--hivelab-border)',
                      color: 'var(--hivelab-text-primary)',
                    }}
                  >
                    <option value="">No navigation</option>
                    {pages!.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Section({
  title,
  children,
  defaultExpanded = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const prefersReducedMotion = useReducedMotion();
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div style={{ borderBottom: `1px solid ${'var(--hivelab-border)'}` }}>
      <motion.button
        type="button"
        onClick={() => setExpanded(!expanded)}
        whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
        aria-expanded={expanded}
        aria-controls={sectionId}
        className={cn(
          'flex items-center justify-between w-full px-4 py-2.5 text-left transition-colors duration-200',
          focusRing
        )}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          className="text-label-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--hivelab-text-tertiary)' }}
        >
          {title}
        </span>
        {/* Spring-animated chevron rotation */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
        >
          <ChevronRightIcon className="h-3.5 w-3.5" style={{ color: 'var(--hivelab-text-tertiary)' }} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={sectionId}
            initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : springPresets.gentle}
            className="overflow-hidden"
          >
            <motion.div
              initial={prefersReducedMotion ? {} : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { delay: 0.05, ...springPresets.snappy }
              }
              className="px-4 pb-4 space-y-3"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  elementConnections,
  connectionsLoading,
  onEditConnection,
  onDeleteConnection,
  onToggleConnection,
  onTestConnection,
  onAddConnection,
  onRefreshConnections,
  pages,
}: PropertiesPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!selectedElement) {
    return (
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full text-center p-6"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.02, 1],
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Cog6ToothIcon className="h-12 w-12 mb-4" style={{ color: `${'var(--hivelab-text-tertiary)'}50` }} />
        </motion.div>
        <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--hivelab-text-primary)' }}>No Selection</h3>
        <p className="text-xs" style={{ color: 'var(--hivelab-text-tertiary)' }}>Select an element to view its properties</p>
      </motion.div>
    );
  }

  const displayName = selectedElement.elementId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const schema = ELEMENT_SCHEMAS[selectedElement.elementId] || [];

  const updateConfig = (key: string, value: unknown) => {
    onUpdateElement(selectedElement.id, {
      config: { ...selectedElement.config, [key]: value },
    });
  };

  return (
    <motion.div
      key={selectedElement.id}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springPresets.snappy}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: `1px solid ${'var(--hivelab-border)'}` }}>
        <div className="flex items-center justify-between">
          <motion.h3
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm font-semibold"
            style={{ color: 'var(--hivelab-text-primary)' }}
          >
            {displayName}
          </motion.h3>
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              onClick={() =>
                onUpdateElement(selectedElement.id, { visible: !selectedElement.visible })
              }
              whileHover={prefersReducedMotion ? {} : { opacity: 0.9 }}
              whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
              className={cn('p-1.5 rounded-lg transition-colors duration-200', focusRing)}
              style={{ color: 'var(--hivelab-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--hivelab-text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--hivelab-text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={selectedElement.visible ? 'Hide element' : 'Show element'}
              aria-pressed={selectedElement.visible}
            >
              <AnimatePresence mode="wait">
                {selectedElement.visible ? (
                  <motion.div
                    key="visible"
                    initial={prefersReducedMotion ? {} : { scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={springPresets.snappy}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden"
                    initial={prefersReducedMotion ? {} : { scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={springPresets.snappy}
                  >
                    <EyeSlashIcon className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              type="button"
              onClick={() =>
                onUpdateElement(selectedElement.id, { locked: !selectedElement.locked })
              }
              whileHover={prefersReducedMotion ? {} : { opacity: 0.9 }}
              whileTap={prefersReducedMotion ? {} : { opacity: 0.8 }}
              animate={
                selectedElement.locked && !prefersReducedMotion
                  ? { rotate: [0, -5, 5, 0] }
                  : {}
              }
              transition={{ duration: 0.3 }}
              className={cn('p-1.5 rounded-lg transition-colors duration-200', focusRing)}
              style={{
                color: selectedElement.locked ? 'var(--hivelab-status-warning)' : 'var(--hivelab-text-tertiary)',
                backgroundColor: selectedElement.locked ? 'var(--hive-status-warning-dim)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!selectedElement.locked) {
                  e.currentTarget.style.color = 'var(--hivelab-text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedElement.locked) {
                  e.currentTarget.style.color = 'var(--hivelab-text-tertiary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              aria-label={selectedElement.locked ? 'Unlock element' : 'Lock element'}
              aria-pressed={selectedElement.locked}
            >
              <LockClosedIcon className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
        <motion.p
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs mt-1 font-sans"
          style={{ color: 'var(--hivelab-text-tertiary)' }}
        >
          ID: {selectedElement.id.slice(0, 20)}...
        </motion.p>
      </div>

      {/* Quick Actions */}
      <div
        className="flex items-center gap-1.5 px-4 py-2"
        style={{ borderBottom: `1px solid ${'var(--hivelab-border)'}` }}
      >
        <button
          type="button"
          onClick={() => onDuplicateElement(selectedElement.id)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
            focusRing
          )}
          style={{
            backgroundColor: 'var(--hivelab-surface-hover)',
            color: 'var(--hivelab-text-secondary)',
            border: `1px solid ${'var(--hivelab-border)'}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-active)';
            e.currentTarget.style.color = 'var(--hivelab-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
            e.currentTarget.style.color = 'var(--hivelab-text-secondary)';
          }}
          aria-label={`Duplicate ${displayName}`}
        >
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDeleteElement(selectedElement.id)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
            focusRing
          )}
          style={{
            backgroundColor: 'var(--hive-status-error-dim)',
            color: 'var(--hivelab-status-error)',
            border: '1px solid rgba(244, 67, 54, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hive-status-error-dim)';
          }}
          aria-label={`Delete ${displayName}`}
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto">
        {/* Transform */}
        <Section title="Transform">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--hivelab-text-tertiary)' }}>X</label>
              <input
                type="number"
                value={Math.round(selectedElement.position.x)}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    position: { ...selectedElement.position, x: Number(e.target.value) },
                  })
                }
                className={cn('w-full rounded-lg px-3 py-2 text-sm font-sans outline-none transition-all duration-200', focusRing)}
                style={{
                  backgroundColor: 'var(--hivelab-surface-hover)',
                  border: `1px solid ${'var(--hivelab-border)'}`,
                  color: 'var(--hivelab-text-primary)',
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--hivelab-text-tertiary)' }}>Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.position.y)}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    position: { ...selectedElement.position, y: Number(e.target.value) },
                  })
                }
                className={cn('w-full rounded-lg px-3 py-2 text-sm font-sans outline-none transition-all duration-200', focusRing)}
                style={{
                  backgroundColor: 'var(--hivelab-surface-hover)',
                  border: `1px solid ${'var(--hivelab-border)'}`,
                  color: 'var(--hivelab-text-primary)',
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--hivelab-text-tertiary)' }}>Width</label>
              <input
                type="number"
                min={50}
                max={2000}
                value={selectedElement.size.width}
                onChange={(e) => {
                  const value = Math.max(50, Math.min(2000, Number(e.target.value) || 50));
                  onUpdateElement(selectedElement.id, {
                    size: { ...selectedElement.size, width: value },
                  });
                }}
                className={cn('w-full rounded-lg px-3 py-2 text-sm font-sans outline-none transition-all duration-200', focusRing)}
                style={{
                  backgroundColor: 'var(--hivelab-surface-hover)',
                  border: `1px solid ${'var(--hivelab-border)'}`,
                  color: 'var(--hivelab-text-primary)',
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--hivelab-text-tertiary)' }}>Height</label>
              <input
                type="number"
                min={30}
                max={2000}
                value={selectedElement.size.height}
                onChange={(e) => {
                  const value = Math.max(30, Math.min(2000, Number(e.target.value) || 30));
                  onUpdateElement(selectedElement.id, {
                    size: { ...selectedElement.size, height: value },
                  });
                }}
                className={cn('w-full rounded-lg px-3 py-2 text-sm font-sans outline-none transition-all duration-200', focusRing)}
                style={{
                  backgroundColor: 'var(--hivelab-surface-hover)',
                  border: `1px solid ${'var(--hivelab-border)'}`,
                  color: 'var(--hivelab-text-primary)',
                }}
              />
            </div>
          </div>
        </Section>

        {/* Element Config */}
        {schema.length > 0 && (
          <Section title="Configuration">
            {schema.map((prop) => (
              <div key={prop.key}>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--hivelab-text-tertiary)' }}>{prop.label}</label>
                <PropertyField
                  schema={prop}
                  value={selectedElement.config[prop.key]}
                  onChange={(value) => updateConfig(prop.key, value)}
                />
              </div>
            ))}
          </Section>
        )}

        {/* Layout - Z-Index inline, no section */}
        <div className="px-4 py-3" style={{ borderBottom: `1px solid var(--hivelab-border)` }}>
          <div className="flex items-center justify-between">
            <label className="text-xs" style={{ color: 'var(--hivelab-text-tertiary)' }}>Z-Index</label>
            <input
              type="number"
              min={1}
              max={999}
              value={selectedElement.zIndex || 1}
              onChange={(e) => {
                const value = Math.max(1, Math.min(999, Number(e.target.value) || 1));
                onUpdateElement(selectedElement.id, { zIndex: value });
              }}
              className={cn('w-16 rounded-md px-2 py-1 text-sm font-sans text-right outline-none transition-all duration-200', focusRing)}
              style={{
                backgroundColor: 'var(--hivelab-surface-hover)',
                border: `1px solid var(--hivelab-border)`,
                color: 'var(--hivelab-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Advanced Section - Hidden by default, contains Context/Visibility/Connections */}
        <AdvancedSection
          selectedElement={selectedElement}
          onUpdateElement={onUpdateElement}
          elementConnections={elementConnections}
          connectionsLoading={connectionsLoading}
          onEditConnection={onEditConnection}
          onDeleteConnection={onDeleteConnection}
          onToggleConnection={onToggleConnection}
          onTestConnection={onTestConnection}
          onAddConnection={onAddConnection}
          onRefreshConnections={onRefreshConnections}
          pages={pages}
        />
      </div>

    </motion.div>
  );
}
