'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  GripVertical,
  Box,
  Search,
  LayoutGrid,
  Filter,
  FormInput,
  Zap,
  BarChart3,
} from 'lucide-react';
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
  display: <BarChart3 className="h-3.5 w-3.5" />,
  filter: <Filter className="h-3.5 w-3.5" />,
  action: <Zap className="h-3.5 w-3.5" />,
  layout: <LayoutGrid className="h-3.5 w-3.5" />,
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
        'group flex flex-col rounded-lg transition-colors cursor-pointer',
        isSelected ? 'bg-[#FFD700]/10' : 'hover:bg-[#252525]'
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
          <GripVertical className="h-3.5 w-3.5 text-[#555]" />
        </div>

        {/* Expand Arrow */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-0.5 text-[#555] hover:text-[#888]"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {/* Icon */}
        <div
          className={cn(
            'w-6 h-6 rounded flex items-center justify-center',
            isSelected ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-[#333] text-[#888]'
          )}
        >
          {getElementIcon(element.elementId)}
        </div>

        {/* Name */}
        <span
          className={cn(
            'flex-1 text-sm truncate',
            isSelected ? 'text-white font-medium' : 'text-[#999]',
            !element.visible && 'opacity-50'
          )}
        >
          {element.elementId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>

        {/* Actions */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity',
            isHovered || isSelected ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ visible: !element.visible });
            }}
            className="p-1 text-[#555] hover:text-[#888]"
            title={element.visible ? 'Hide' : 'Show'}
          >
            {element.visible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ locked: !element.locked });
            }}
            className="p-1 text-[#555] hover:text-[#888]"
            title={element.locked ? 'Unlock' : 'Lock'}
          >
            {element.locked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
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
                <span className="text-[#666]">Position</span>
                <span className="text-[#999]">
                  {Math.round(element.position.x)}, {Math.round(element.position.y)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666]">Size</span>
                <span className="text-[#999]">
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
                  className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-[#888] hover:text-white bg-[#252525] hover:bg-[#333] rounded transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-red-400 hover:text-red-300 bg-[#252525] hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
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
      <div className="px-3 py-3 border-b border-[#333]">
        <h3 className="text-sm font-medium text-white mb-2">Layers</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search layers..."
            className="w-full bg-[#252525] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#444]"
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
            <Box className="h-8 w-8 text-[#444] mb-2" />
            <p className="text-sm text-[#666]">
              {searchQuery ? 'No matching layers' : 'No layers yet'}
            </p>
            <p className="text-xs text-[#555] mt-1">
              {searchQuery ? 'Try a different search' : 'Drag elements to the canvas'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-3 py-2 border-t border-[#333] flex items-center justify-between text-xs text-[#666]">
        <span>{elements.length} layers</span>
        <span>{connections.length} connections</span>
      </div>
    </div>
  );
}
