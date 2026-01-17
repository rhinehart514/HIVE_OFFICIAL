'use client';

import { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, LockOpenIcon, TrashIcon, ClipboardDocumentIcon, Bars3Icon, MagnifyingGlassIcon, Squares2X2Icon, FunnelIcon, BoltIcon, ChartBarIcon, DocumentTextIcon, CubeIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const FormInput = DocumentTextIcon;
const Box = CubeIcon;
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from '../../../lib/utils';
import type { CanvasElement, Connection } from './types';

interface LayersPanelProps {
  elements: CanvasElement[];
  connections: Connection[];
  selectedIds: string[];
  onSelect: (ids: string[], append?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorder: (elements: CanvasElement[]) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  input: <FormInput className="h-3.5 w-3.5" />,
  display: <ChartBarIcon className="h-3.5 w-3.5" />,
  filter: <FunnelIcon className="h-3.5 w-3.5" />,
  action: <BoltIcon className="h-3.5 w-3.5" />,
  layout: <Squares2X2Icon className="h-3.5 w-3.5" />,
  default: <Box className="h-3.5 w-3.5" />,
};

function getElementIcon(elementId: string): React.ReactNode {
  // Map element types to categories
  const categoryMap: Record<string, string> = {
    'search-input': 'input',
    'form-builder': 'input',
    'date-picker': 'input',
    'user-selector': 'input',
    'result-list': 'display',
    'chart-display': 'display',
    'leaderboard': 'display',
    'countdown-timer': 'display',
    'tag-cloud': 'display',
    'filter-selector': 'filter',
    'poll-element': 'action',
    'rsvp-button': 'action',
  };

  const category = categoryMap[elementId] || 'default';
  return CATEGORY_ICONS[category];
}

interface LayerItemProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string, append?: boolean) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function LayerItem({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: LayerItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Reorder.Item
      value={element}
      id={element.id}
      className={cn(
        'group flex flex-col rounded-lg transition-colors duration-[var(--workshop-duration)] cursor-pointer',
        isSelected ? 'bg-[var(--hivelab-surface)]' : 'hover:bg-[var(--hivelab-surface)]/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex items-center gap-2 px-2 py-2"
        onClick={(e) => onSelect(element.id, e.shiftKey || e.metaKey)}
      >
        {/* Drag Handle */}
        <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
          <Bars3Icon className="h-3.5 w-3.5 text-[var(--hivelab-text-tertiary)]" />
        </div>

        {/* Expand Arrow */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-0.5 text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-secondary)]"
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : (
            <ChevronRightIcon className="h-3 w-3" />
          )}
        </button>

        {/* Icon */}
        <div
          className={cn(
            'w-6 h-6 rounded flex items-center justify-center',
            isSelected ? 'bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)]' : 'bg-[var(--hivelab-border)] text-[var(--hivelab-text-tertiary)]'
          )}
        >
          {getElementIcon(element.elementId)}
        </div>

        {/* Name */}
        <span
          className={cn(
            'flex-1 text-sm truncate',
            isSelected ? 'text-[var(--hivelab-text-primary)] font-medium' : 'text-[var(--hivelab-text-tertiary)]',
            !element.visible && 'opacity-50'
          )}
        >
          {element.elementId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>

        {/* Actions */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity duration-[var(--workshop-duration)]',
            isHovered || isSelected ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ visible: !element.visible });
            }}
            className="p-1 text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-secondary)]"
            title={element.visible ? 'Hide' : 'Show'}
          >
            {element.visible ? (
              <EyeIcon className="h-3.5 w-3.5" />
            ) : (
              <EyeSlashIcon className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ locked: !element.locked });
            }}
            className="p-1 text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-secondary)]"
            title={element.locked ? 'Unlock' : 'Lock'}
          >
            {element.locked ? (
              <LockClosedIcon className="h-3.5 w-3.5" />
            ) : (
              <LockOpenIcon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-10 pr-2 pb-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--hivelab-text-tertiary)]">Position</span>
                <span className="text-[var(--hivelab-text-secondary)]">
                  {Math.round(element.position.x)}, {Math.round(element.position.y)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--hivelab-text-tertiary)]">Size</span>
                <span className="text-[var(--hivelab-text-secondary)]">
                  {element.size.width} × {element.size.height}
                </span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] bg-[var(--hivelab-surface)] hover:bg-[var(--hivelab-surface-hover)] rounded transition-colors duration-[var(--workshop-duration)]"
                >
                  <ClipboardDocumentIcon className="h-3 w-3" />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-[var(--status-error)] hover:text-[var(--status-error)] bg-[var(--hivelab-surface)] hover:bg-[var(--status-error)]/10 rounded transition-colors duration-[var(--workshop-duration)]"
                >
                  <TrashIcon className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export function LayersPanel({
  elements,
  connections,
  selectedIds,
  onSelect,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorder,
}: LayersPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort elements by zIndex (highest first = top of list)
  const sortedElements = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  const filteredElements = searchQuery
    ? sortedElements.filter((el) =>
        el.elementId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedElements;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[var(--hivelab-border)]">
        <h3 className="text-sm font-medium text-[var(--hivelab-text-primary)] mb-2">Layers</h3>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--hivelab-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search layers..."
            className="w-full bg-[var(--hivelab-surface)] border border-[var(--hivelab-border)] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[var(--hivelab-text-primary)] placeholder:text-[var(--hivelab-text-tertiary)] outline-none focus:border-[var(--hivelab-border-emphasis)]"
          />
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredElements.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={filteredElements}
            onReorder={onReorder}
            className="space-y-1"
          >
            {filteredElements.map((element) => (
              <LayerItem
                key={element.id}
                element={element}
                isSelected={selectedIds.includes(element.id)}
                onSelect={(id, append) => onSelect([id], append)}
                onUpdate={(updates) => onUpdateElement(element.id, updates)}
                onDelete={() => onDeleteElement(element.id)}
                onDuplicate={() => onDuplicateElement(element.id)}
              />
            ))}
          </Reorder.Group>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Box className="h-8 w-8 text-[var(--hivelab-text-tertiary)]/30 mb-2" />
            <p className="text-sm text-[var(--hivelab-text-tertiary)]">
              {searchQuery ? 'No matching layers' : 'No layers yet'}
            </p>
            <p className="text-xs text-[var(--hivelab-text-tertiary)] mt-1">
              {searchQuery ? 'Try a different search' : 'Drag elements to the canvas'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-3 py-2 border-t border-[var(--hivelab-border)] flex items-center justify-between text-xs text-[var(--hivelab-text-tertiary)]">
        <span>{elements.length} layers</span>
        <span>{connections.length} connections</span>
      </div>
    </div>
  );
}
