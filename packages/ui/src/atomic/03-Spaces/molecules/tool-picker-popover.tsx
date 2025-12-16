'use client';

/**
 * ToolPickerPopover - Quick tool selector for chat input
 *
 * A popover that appears when clicking "More tools" in the chat toolbar.
 * Shows available system tools and deployed HiveLab tools for quick insertion.
 *
 * ## Differences from WidgetGallery
 * - WidgetGallery: Full-screen bottom sheet for sidebar configuration
 * - ToolPickerPopover: Quick popover for inline chat tool insertion
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  BarChart2,
  Timer,
  Calendar,
  Users,
  MessageSquare,
  Sparkles,
  Search,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../00-Global/atoms/popover';
import { cn } from '../../../lib/utils';
import type { ToolInsertData, ToolType } from '../../03-Chat/chat-toolbar';

// ============================================================
// Types
// ============================================================

export interface DeployedTool {
  /** Deployment/placement ID */
  deploymentId: string;
  /** Tool ID */
  toolId: string;
  /** Display name */
  name: string;
  /** Short description */
  description?: string;
  /** Element type for rendering */
  elementType: string;
  /** Tool category */
  category?: string;
  /** Whether active */
  isActive: boolean;
}

export interface ToolPickerPopoverProps {
  /** Popover open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Trigger element */
  children: React.ReactNode;
  /** Callback when a tool is selected */
  onSelectTool: (data: ToolInsertData) => void;
  /** Deployed tools in this space */
  deployedTools?: DeployedTool[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback to open HiveLab for creating new tool */
  onOpenHiveLab?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Quick Access Tools (System)
// ============================================================

interface QuickTool {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  elementType: string;
}

const QUICK_TOOLS: QuickTool[] = [
  {
    id: 'quick-poll',
    type: 'poll',
    name: 'Poll',
    description: 'Ask a question',
    icon: BarChart2,
    elementType: 'poll-element',
  },
  {
    id: 'quick-countdown',
    type: 'countdown',
    name: 'Countdown',
    description: 'Time to event',
    icon: Timer,
    elementType: 'countdown-timer',
  },
  {
    id: 'quick-event',
    type: 'event',
    name: 'Event',
    description: 'Link an event',
    icon: Calendar,
    elementType: 'event-picker',
  },
];

// ============================================================
// Tool Item Component
// ============================================================

interface ToolItemProps {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description?: string;
  onClick: () => void;
  reducedMotion?: boolean;
}

function ToolItem({ icon: Icon, name, description, onClick, reducedMotion }: ToolItemProps) {
  return (
    <motion.button
      whileHover={reducedMotion ? undefined : { x: 2 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      onClick={onClick}
      aria-label={`Insert ${name}${description ? `: ${description}` : ''}`}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px]',
        'text-left transition-colors',
        // White focus ring (not gold)
        'hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <Icon className="w-4 h-4 text-[#A1A1A6]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{name}</div>
        {description && (
          <div className="text-xs text-[#818187] truncate">{description}</div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-[#52525B] flex-shrink-0" aria-hidden="true" />
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ToolPickerPopover({
  open,
  onOpenChange,
  children,
  onSelectTool,
  deployedTools = [],
  isLoading = false,
  onOpenHiveLab,
  className,
}: ToolPickerPopoverProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const shouldReduceMotion = useReducedMotion();

  // Filter tools based on search
  const filteredDeployedTools = React.useMemo(() => {
    if (!searchQuery.trim()) return deployedTools.filter((t) => t.isActive);
    const query = searchQuery.toLowerCase();
    return deployedTools.filter(
      (tool) =>
        tool.isActive &&
        (tool.name.toLowerCase().includes(query) ||
          tool.description?.toLowerCase().includes(query) ||
          tool.elementType.toLowerCase().includes(query))
    );
  }, [deployedTools, searchQuery]);

  // Handle quick tool selection
  const handleQuickToolSelect = (tool: QuickTool) => {
    onSelectTool({
      type: tool.type,
      config: {
        elementType: tool.elementType,
      },
    });
    onOpenChange(false);
  };

  // Handle deployed tool selection
  const handleDeployedToolSelect = (tool: DeployedTool) => {
    onSelectTool({
      type: 'custom',
      config: {
        deploymentId: tool.deploymentId,
        toolId: tool.toolId,
        elementType: tool.elementType,
        name: tool.name,
      },
    });
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className={cn(
          'w-72 p-0 bg-[#141414] border-[#2A2A2A] shadow-xl',
          className
        )}
        aria-label="Tool picker"
      >
        <div className="max-h-[400px] overflow-hidden flex flex-col" role="dialog" aria-label="Select a tool to insert">
          {/* Header with search */}
          <div className="p-3 border-b border-[#2A2A2A]/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#818187]" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                aria-label="Search tools"
                className={cn(
                  'w-full pl-9 pr-3 py-2 rounded-lg text-sm',
                  'bg-[#1A1A1A]/50 border border-[#3A3A3A]/50',
                  'text-white placeholder:text-[#818187]',
                  // White focus ring (not gold)
                  'focus:outline-none focus:ring-2 focus:ring-white/20'
                )}
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
              </div>
            ) : (
              <>
                {/* Quick access section */}
                {!searchQuery && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 text-[10px] font-medium text-[#818187] uppercase tracking-wider">
                      Quick Access
                    </div>
                    {QUICK_TOOLS.map((tool) => (
                      <ToolItem
                        key={tool.id}
                        icon={tool.icon}
                        name={tool.name}
                        description={tool.description}
                        onClick={() => handleQuickToolSelect(tool)}
                        reducedMotion={!!shouldReduceMotion}
                      />
                    ))}
                  </div>
                )}

                {/* Deployed tools section */}
                {filteredDeployedTools.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 text-[10px] font-medium text-[#818187] uppercase tracking-wider">
                      {searchQuery ? 'Results' : 'Space Tools'}
                    </div>
                    {filteredDeployedTools.map((tool) => (
                      <ToolItem
                        key={tool.deploymentId}
                        icon={Sparkles}
                        name={tool.name}
                        description={tool.description}
                        onClick={() => handleDeployedToolSelect(tool)}
                        reducedMotion={!!shouldReduceMotion}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {searchQuery && filteredDeployedTools.length === 0 && (
                  <div className="py-8 text-center">
                    <Search className="w-8 h-8 text-[#52525B] mx-auto mb-2" />
                    <p className="text-sm text-[#818187]">No tools found</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer - Create in HiveLab */}
          {onOpenHiveLab && (
            <div className="p-2 border-t border-[#2A2A2A]/50">
              <motion.button
                whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                onClick={() => {
                  onOpenHiveLab();
                  onOpenChange(false);
                }}
                aria-label="Create custom tool in HiveLab"
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
                  'bg-[#FFD700]/10 text-[#FFD700] text-sm font-medium',
                  'hover:bg-[#FFD700]/20 transition-colors',
                  // White focus ring (not gold)
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
                )}
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Create in HiveLab</span>
              </motion.button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ToolPickerPopover;
