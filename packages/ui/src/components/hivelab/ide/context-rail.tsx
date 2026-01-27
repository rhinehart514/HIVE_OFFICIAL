'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog6ToothIcon, TrashIcon, ClipboardDocumentIcon, Bars3BottomLeftIcon, Bars3Icon, Bars3BottomRightIcon, ArrowsUpDownIcon, BookmarkIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility - alignment icons
const AlignLeft = Bars3BottomLeftIcon;
const AlignCenter = Bars3Icon;
const AlignRight = Bars3BottomRightIcon;
const AlignStartVertical = ArrowsUpDownIcon;
const AlignCenterVertical = ArrowsUpDownIcon;
const AlignEndVertical = ArrowsUpDownIcon;
const Pin = BookmarkIcon;
const PinOff = BookmarkIcon;
import { cn } from '../../../lib/utils';
import type { CanvasElement, Connection } from './types';
import { PropertiesPanel } from './properties-panel';
import { ConnectionConfig } from './connection-config';

// HiveLab Dark Panel Colors
const PANEL_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #1A1A1A)',
  bgActive: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  borderLight: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  accentLight: 'rgba(212, 175, 55, 0.1)',
  error: 'var(--hivelab-status-error)',
  errorLight: 'var(--hivelab-status-error-muted)',
};

// Workshop tokens
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';
const workshopTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };

const RAIL_WIDTH = 300;

// Icon components for Make.com style (simple line icons)
function IconTrigger() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
    </svg>
  );
}

function IconVariable() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 12h8M12 8v8" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function IconIncrement() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 6v12m-6-6h12" />
    </svg>
  );
}

function IconSleep() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12h14m-7-7l7 7-7 7" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h18l-7 8v6l-4 2V12L3 4z" />
    </svg>
  );
}

function IconList() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 5-6" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconForm() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 7h10M7 12h10M7 17h6" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

// Icon map for items
const ITEM_ICONS: Record<string, () => React.ReactElement> = {
  // Flow Control
  'filter-selector': IconFilter,
  'counter': IconIncrement,
  'timer': IconSleep,
  'role-gate': IconVariable,
  // Tools - Triggers
  'basic-trigger': IconTrigger,
  // Tools - Actions
  'get-variable': IconArrow,
  'get-multiple-variables': IconArrow,
  'increment-function': IconIncrement,
  'set-multiple-variables': IconArrow,
  'sleep': IconSleep,
  // Inputs
  'search-input': IconFilter,
  'date-picker': IconCalendar,
  'user-selector': IconUser,
  'form-builder': IconForm,
  // Displays
  'result-list': IconList,
  'chart-display': IconChart,
  'map-view': IconGrid,
  'tag-cloud': IconGrid,
  // Actions
  'poll': IconChart,
  'rsvp-button': IconUser,
  'announcement': IconBell,
  // Space Connected
  'space-feed': IconList,
  'space-stats': IconChart,
  'member-selector': IconUser,
  'event-picker': IconCalendar,
};

// Tool categories for accordion (Make.com style - no emojis)
const TOOL_CATEGORIES = [
  {
    id: 'flow-control',
    name: 'Flow Control',
    items: [
      { id: 'filter-selector', name: 'Filter' },
      { id: 'counter', name: 'Counter' },
      { id: 'timer', name: 'Timer' },
      { id: 'role-gate', name: 'Role Gate' },
    ],
  },
  {
    id: 'tools',
    name: 'Tools',
    sections: [
      {
        name: 'TRIGGERS',
        items: [
          { id: 'basic-trigger', name: 'Basic trigger', description: 'Generates bundles with their own structure.' },
        ],
      },
      {
        name: 'ACTIONS',
        items: [
          { id: 'get-variable', name: 'Get variable', description: 'Get the value of a previously stored variable.' },
          { id: 'get-multiple-variables', name: 'Get multiple variables', description: 'Get values of previously stored variables.' },
          { id: 'increment-function', name: 'Increment function', description: 'Returns a value of 1 after first run.' },
          { id: 'set-multiple-variables', name: 'Set multiple variables', description: 'Sets the value of multiple variables.' },
          { id: 'sleep', name: 'Sleep', description: 'Delays execution for a specified period of time.' },
        ],
      },
    ],
  },
  {
    id: 'inputs',
    name: 'Inputs',
    items: [
      { id: 'search-input', name: 'Search' },
      { id: 'date-picker', name: 'Date Picker' },
      { id: 'user-selector', name: 'User Selector' },
      { id: 'form-builder', name: 'Form Builder' },
    ],
  },
  {
    id: 'displays',
    name: 'Displays',
    items: [
      { id: 'result-list', name: 'Result List' },
      { id: 'chart-display', name: 'Chart' },
      { id: 'map-view', name: 'Map View' },
      { id: 'tag-cloud', name: 'Tag Cloud' },
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    items: [
      { id: 'poll', name: 'Poll' },
      { id: 'rsvp-button', name: 'RSVP' },
      { id: 'announcement', name: 'Announcement' },
    ],
  },
  {
    id: 'space-connected',
    name: 'Space Connected',
    items: [
      { id: 'space-feed', name: 'Space Feed' },
      { id: 'space-stats', name: 'Space Stats' },
      { id: 'member-selector', name: 'Member Selector' },
      { id: 'event-picker', name: 'Event Picker' },
    ],
  },
];

interface ContextRailProps {
  selectedElements: CanvasElement[];
  allElements: CanvasElement[];
  connections?: Connection[];
  selectedConnectionId?: string | null;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onDuplicateElements: (ids: string[]) => void;
  onAlignElements?: (alignment: AlignmentType) => void;
  onDistributeElements?: (direction: 'horizontal' | 'vertical') => void;
  onUpdateConnection?: (id: string, updates: Partial<Connection>) => void;
  onDeleteConnection?: (id: string) => void;
}

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

function SearchableToolsPanel({ onDragStart }: { onDragStart?: (elementId: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['flow-control', 'inputs']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter categories based on search (handles both items and sections)
  const filteredCategories = TOOL_CATEGORIES.map((category) => {
    // Handle categories with sections (like Tools)
    if ('sections' in category && category.sections) {
      const filteredSections = category.sections.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      })).filter((section) => section.items.length > 0);

      return { ...category, sections: filteredSections };
    }

    // Handle regular categories with items
    return {
      ...category,
      items: category.items?.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [],
    };
  }).filter((category) => {
    if ('sections' in category && category.sections) {
      return category.sections.length > 0 || searchQuery === '';
    }
    return (category.items?.length || 0) > 0 || searchQuery === '';
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: PANEL_COLORS.textPrimary }}
        >
          Add Module
        </h3>

        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: PANEL_COLORS.textTertiary }}
          />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
              'transition-colors duration-200',
              focusRing
            )}
            style={{
              backgroundColor: PANEL_COLORS.bgHover,
              border: `1px solid ${PANEL_COLORS.border}`,
              color: PANEL_COLORS.textPrimary,
            }}
          />
        </div>
      </div>

      {/* Categories Accordion */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id) || searchQuery !== '';

          return (
            <div key={category.id}>
              {/* Category Header - Make.com style (no emoji) */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2.5',
                  'transition-colors duration-200',
                  focusRing
                )}
                style={{
                  borderBottom: `1px solid ${PANEL_COLORS.borderLight}`,
                  color: PANEL_COLORS.textPrimary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" style={{ color: PANEL_COLORS.textTertiary }} />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" style={{ color: PANEL_COLORS.textTertiary }} />
                )}
                <span className="text-sm font-medium flex-1 text-left">{category.name}</span>
              </button>

              {/* Category Items - Make.com style with sections support */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {/* Handle categories with sections (like Tools with TRIGGERS/ACTIONS) */}
                    {'sections' in category && category.sections ? (
                      category.sections.map((section: { name: string; items: Array<{ id: string; name: string; description?: string }> }) => (
                        <div key={section.name}>
                          {/* Section header */}
                          <div
                            className="px-6 py-1.5 text-label-xs uppercase tracking-wider font-medium"
                            style={{ color: PANEL_COLORS.textTertiary }}
                          >
                            {section.name}
                          </div>
                          {/* Section items */}
                          {section.items.map((item) => {
                            const IconComponent = ITEM_ICONS[item.id] || IconArrow;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                draggable
                                onDragStart={() => onDragStart?.(item.id)}
                                onClick={() => onDragStart?.(item.id)}
                                className={cn(
                                  'w-full flex items-start gap-3 px-6 py-2',
                                  'transition-colors duration-200 cursor-grab active:cursor-grabbing text-left',
                                  focusRing
                                )}
                                style={{ color: PANEL_COLORS.textPrimary }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <span className="mt-0.5" style={{ color: PANEL_COLORS.textSecondary }}>
                                  <IconComponent />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium">{item.name}</div>
                                  {item.description && (
                                    <div
                                      className="text-xs mt-0.5 leading-tight"
                                      style={{ color: PANEL_COLORS.textTertiary }}
                                    >
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      /* Regular items without sections */
                      category.items?.map((item: { id: string; name: string; description?: string }) => {
                        const IconComponent = ITEM_ICONS[item.id] || IconArrow;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            draggable
                            onDragStart={() => onDragStart?.(item.id)}
                            onClick={() => onDragStart?.(item.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-6 py-2',
                              'transition-colors duration-200 cursor-grab active:cursor-grabbing',
                              focusRing
                            )}
                            style={{ color: PANEL_COLORS.textPrimary }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={{ color: PANEL_COLORS.textSecondary }}>
                              <IconComponent />
                            </span>
                            <span className="text-sm">{item.name}</span>
                          </button>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* AI + Help Button - Make.com style */}
      <div
        className="px-4 py-3"
        style={{ borderTop: `1px solid ${PANEL_COLORS.border}` }}
      >
        <button
          type="button"
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 rounded-full',
            'transition-colors duration-200',
            focusRing
          )}
          style={{
            backgroundColor: PANEL_COLORS.bg,
            color: PANEL_COLORS.textPrimary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = PANEL_COLORS.bg;
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AI</span>
            <span className="text-purple-400">+</span>
            <span className="text-sm font-medium">Help</span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-label-xs font-medium"
            style={{
              backgroundColor: 'var(--hivelab-status-success)',
              color: 'white',
            }}
          >
            Beta
          </span>
        </button>
      </div>
    </motion.div>
  );
}

function ShortcutHint({ shortcut, label }: { shortcut: string; label: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: PANEL_COLORS.textTertiary }}>{label}</span>
      <kbd
        className="px-1.5 py-0.5 rounded font-mono text-label-xs"
        style={{
          backgroundColor: PANEL_COLORS.bgHover,
          color: PANEL_COLORS.textSecondary,
        }}
      >
        {shortcut}
      </kbd>
    </div>
  );
}

function MultiSelectPanel({
  count,
  onDelete,
  onDuplicate,
  onAlign,
  onDistribute,
}: {
  count: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onAlign?: (alignment: AlignmentType) => void;
  onDistribute?: (direction: 'horizontal' | 'vertical') => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={workshopTransition}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: PANEL_COLORS.textPrimary }}
        >
          {count} Elements Selected
        </h3>
        <p
          className="text-xs mt-1"
          style={{ color: PANEL_COLORS.textTertiary }}
        >
          Modify multiple elements at once
        </p>
      </div>

      {/* Alignment */}
      {onAlign && (
        <div
          className="px-4 py-4"
          style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
        >
          <p
            className="text-label-xs uppercase tracking-wider font-medium mb-3"
            style={{ color: PANEL_COLORS.textTertiary }}
          >
            Alignment
          </p>
          <div className="grid grid-cols-6 gap-1">
            <AlignButton
              icon={<AlignLeft className="h-4 w-4" />}
              label="Align Left"
              onClick={() => onAlign('left')}
            />
            <AlignButton
              icon={<AlignCenter className="h-4 w-4" />}
              label="Align Center H"
              onClick={() => onAlign('center')}
            />
            <AlignButton
              icon={<AlignRight className="h-4 w-4" />}
              label="Align Right"
              onClick={() => onAlign('right')}
            />
            <AlignButton
              icon={<AlignStartVertical className="h-4 w-4" />}
              label="Align Top"
              onClick={() => onAlign('top')}
            />
            <AlignButton
              icon={<AlignCenterVertical className="h-4 w-4" />}
              label="Align Center V"
              onClick={() => onAlign('middle')}
            />
            <AlignButton
              icon={<AlignEndVertical className="h-4 w-4" />}
              label="Align Bottom"
              onClick={() => onAlign('bottom')}
            />
          </div>

          {/* Distribution */}
          {onDistribute && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => onDistribute('horizontal')}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-lg',
                  'transition-colors duration-200',
                  focusRing
                )}
                style={{
                  backgroundColor: PANEL_COLORS.bgHover,
                  color: PANEL_COLORS.textSecondary,
                  border: `1px solid ${PANEL_COLORS.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = PANEL_COLORS.bgActive;
                  e.currentTarget.style.color = PANEL_COLORS.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                  e.currentTarget.style.color = PANEL_COLORS.textSecondary;
                }}
              >
                Distribute H
              </button>
              <button
                type="button"
                onClick={() => onDistribute('vertical')}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-lg',
                  'transition-colors duration-200',
                  focusRing
                )}
                style={{
                  backgroundColor: PANEL_COLORS.bgHover,
                  color: PANEL_COLORS.textSecondary,
                  border: `1px solid ${PANEL_COLORS.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = PANEL_COLORS.bgActive;
                  e.currentTarget.style.color = PANEL_COLORS.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                  e.currentTarget.style.color = PANEL_COLORS.textSecondary;
                }}
              >
                Distribute V
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      <div className="px-4 py-4 space-y-2">
        <p
          className="text-label-xs uppercase tracking-wider font-medium mb-3"
          style={{ color: PANEL_COLORS.textTertiary }}
        >
          Bulk Actions
        </p>

        <button
          type="button"
          onClick={onDuplicate}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm',
            'transition-colors duration-200',
            focusRing
          )}
          style={{
            backgroundColor: PANEL_COLORS.bgHover,
            color: PANEL_COLORS.textPrimary,
            border: `1px solid ${PANEL_COLORS.border}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = PANEL_COLORS.bgActive;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
          }}
        >
          <ClipboardDocumentIcon className="h-4 w-4" style={{ color: PANEL_COLORS.textSecondary }} />
          Duplicate All
        </button>

        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm',
            'transition-colors duration-200',
            focusRing
          )}
          style={{
            backgroundColor: PANEL_COLORS.errorLight,
            color: PANEL_COLORS.error,
            border: `1px solid rgba(244, 67, 54, 0.2)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = PANEL_COLORS.errorLight;
          }}
        >
          <TrashIcon className="h-4 w-4" />
          Delete All
        </button>
      </div>
    </motion.div>
  );
}

function AlignButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'p-2 rounded-lg transition-colors duration-200',
        focusRing
      )}
      style={{ color: PANEL_COLORS.textTertiary }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = PANEL_COLORS.textPrimary;
        e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = PANEL_COLORS.textTertiary;
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {icon}
    </button>
  );
}

export function ContextRail({
  selectedElements,
  allElements,
  connections = [],
  selectedConnectionId,
  onUpdateElement,
  onDeleteElements,
  onDuplicateElements,
  onAlignElements,
  onDistributeElements,
  onUpdateConnection,
  onDeleteConnection,
}: ContextRailProps) {
  const [isPinned, setIsPinned] = useState(false); // Show only when selecting
  const hasSelection = selectedElements.length > 0;
  const isMultiSelect = selectedElements.length > 1;
  const hasConnectionSelection = selectedConnectionId != null;

  // Find selected connection for config panel
  const selectedConnection = hasConnectionSelection
    ? connections.find(c => c.id === selectedConnectionId)
    : null;

  // Always visible for Make.com style (can be collapsed via pin button)
  const isVisible = isPinned || hasSelection || hasConnectionSelection;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: RAIL_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={workshopTransition}
          className="h-full overflow-hidden flex flex-col flex-shrink-0 relative"
          style={{
            backgroundColor: PANEL_COLORS.bg,
            borderLeft: `1px solid ${PANEL_COLORS.border}`,
            borderTopRightRadius: '24px',
            borderBottomRightRadius: '24px',
            minWidth: RAIL_WIDTH,
          }}
        >
          {/* Pin button - positioned in header area with high z-index */}
          <div className="absolute top-3 right-3 z-30">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                'p-1.5 rounded-lg transition-colors duration-200',
                focusRing
              )}
              style={{
                backgroundColor: isPinned ? PANEL_COLORS.bgActive : PANEL_COLORS.bgHover,
                color: isPinned ? PANEL_COLORS.textPrimary : PANEL_COLORS.textTertiary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = PANEL_COLORS.bgActive;
                e.currentTarget.style.color = PANEL_COLORS.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isPinned ? PANEL_COLORS.bgActive : PANEL_COLORS.bgHover;
                e.currentTarget.style.color = isPinned ? PANEL_COLORS.textPrimary : PANEL_COLORS.textTertiary;
              }}
              title={isPinned ? 'Unpin panel' : 'Pin panel'}
            >
              {isPinned ? (
                <Pin className="h-3.5 w-3.5" />
              ) : (
                <PinOff className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedConnection ? (
                <motion.div
                  key="connection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <ConnectionConfig
                    connection={selectedConnection}
                    elements={allElements}
                    onUpdate={(updates) => onUpdateConnection?.(selectedConnection.id, updates)}
                    onDelete={() => onDeleteConnection?.(selectedConnection.id)}
                  />
                </motion.div>
              ) : !hasSelection ? (
                <SearchableToolsPanel key="tools" />
              ) : isMultiSelect ? (
                <MultiSelectPanel
                  key="multi"
                  count={selectedElements.length}
                  onDelete={() => onDeleteElements(selectedElements.map((e) => e.id))}
                  onDuplicate={() => onDuplicateElements(selectedElements.map((e) => e.id))}
                  onAlign={onAlignElements}
                  onDistribute={onDistributeElements}
                />
              ) : (
                <motion.div
                  key="single"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <PropertiesPanel
                    selectedElement={selectedElements[0]}
                    onUpdateElement={onUpdateElement}
                    onDeleteElement={(id) => onDeleteElements([id])}
                    onDuplicateElement={(id) => onDuplicateElements([id])}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
