'use client';

/**
 * WidgetGallery - Tool picker for space sidebar
 *
 * A bottom sheet gallery that allows space leaders to browse and add
 * widgets to their sidebar. Includes system tools (About, Events, Members)
 * and custom HiveLab tools.
 *
 * ## Sections
 * - Recommended: Context-aware suggestions
 * - Engagement: Interactive tools (polls, countdown, RSVP)
 * - Your Tools: Custom HiveLab tools by the leader
 * - System: Built-in widgets (About, Events, Members)
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  Calendar,
  Users,
  Wrench,
  BarChart2,
  Timer,
  Link2,
  MessageSquare,
  Check,
  Plus,
  Wand2,
  ExternalLink,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../00-Global/atoms/sheet';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface WidgetTemplate {
  /** Unique template ID */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>;
  /** Category for grouping */
  category: 'system' | 'engagement' | 'custom' | 'recommended';
  /** HiveLab element type (for custom tools) */
  elementType?: string;
  /** Whether this is a system template */
  isSystem?: boolean;
}

export interface WidgetGalleryProps {
  /** Whether the gallery is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when a widget is selected */
  onSelectWidget: (template: WidgetTemplate) => void;
  /** Currently deployed widget IDs (to show checkmarks) */
  deployedWidgetIds?: string[];
  /** Custom tools created by the leader */
  customTools?: Array<{
    id: string;
    name: string;
    description?: string;
    elementType: string;
  }>;
  /** Callback to create a new tool in HiveLab */
  onCreateInHiveLab?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// System Widget Templates
// ============================================================

const SYSTEM_WIDGETS: WidgetTemplate[] = [
  {
    id: 'system:about',
    name: 'About',
    description: 'Space description, member count, online status',
    icon: Info,
    category: 'system',
    elementType: 'space-stats',
    isSystem: true,
  },
  {
    id: 'system:events',
    name: 'Upcoming Events',
    description: 'Next events with RSVP buttons',
    icon: Calendar,
    category: 'system',
    elementType: 'space-events',
    isSystem: true,
  },
  {
    id: 'system:members',
    name: 'Members',
    description: 'Member list with online status',
    icon: Users,
    category: 'system',
    elementType: 'member-list',
    isSystem: true,
  },
  {
    id: 'system:tools',
    name: 'Tools',
    description: 'Deployed HiveLab tools',
    icon: Wrench,
    category: 'system',
    elementType: 'tool-list',
    isSystem: true,
  },
];

const ENGAGEMENT_WIDGETS: WidgetTemplate[] = [
  {
    id: 'system:poll',
    name: 'Quick Poll',
    description: 'Interactive poll for member voting',
    icon: BarChart2,
    category: 'engagement',
    elementType: 'poll-element',
    isSystem: true,
  },
  {
    id: 'system:countdown',
    name: 'Countdown',
    description: 'Timer to upcoming event or deadline',
    icon: Timer,
    category: 'engagement',
    elementType: 'countdown-timer',
    isSystem: true,
  },
  {
    id: 'system:links',
    name: 'Quick Links',
    description: 'Important links and resources',
    icon: Link2,
    category: 'engagement',
    elementType: 'result-list',
    isSystem: true,
  },
  {
    id: 'system:announcements',
    name: 'Announcements',
    description: 'Pinned announcements feed',
    icon: MessageSquare,
    category: 'engagement',
    elementType: 'announcement',
    isSystem: true,
  },
];

// ============================================================
// Widget Card Component
// ============================================================

interface WidgetCardProps {
  template: WidgetTemplate;
  isDeployed?: boolean;
  onSelect: () => void;
}

function WidgetCard({ template, isDeployed, onSelect }: WidgetCardProps) {
  const Icon = template.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      disabled={isDeployed}
      className={cn(
        'relative flex flex-col items-start gap-2 p-4 rounded-xl text-left',
        'border transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        isDeployed
          ? 'bg-emerald-500/5 border-emerald-500/30 cursor-default'
          : 'bg-neutral-900/50 border-neutral-800/50 hover:border-white/20 hover:bg-neutral-900'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          isDeployed ? 'bg-emerald-500/10' : 'bg-neutral-800'
        )}
      >
        <Icon
          className={cn('w-5 h-5', isDeployed ? 'text-emerald-400' : 'text-neutral-400')}
        />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              isDeployed ? 'text-emerald-400' : 'text-white'
            )}
          >
            {template.name}
          </span>
          {isDeployed && <Check className="w-4 h-4 text-emerald-400" />}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
          {template.description}
        </p>
      </div>

      {/* Add indicator */}
      {!isDeployed && (
        <div
          className={cn(
            'absolute top-3 right-3 w-6 h-6 rounded-full',
            'flex items-center justify-center',
            'bg-neutral-800 text-neutral-500 group-hover:bg-white/10 group-hover:text-white',
            'transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
        </div>
      )}
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function WidgetGallery({
  open,
  onOpenChange,
  onSelectWidget,
  deployedWidgetIds = [],
  customTools = [],
  onCreateInHiveLab,
  className,
}: WidgetGalleryProps) {
  // Convert custom tools to templates
  const customTemplates: WidgetTemplate[] = customTools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description || 'Custom HiveLab tool',
    icon: Wrench,
    category: 'custom',
    elementType: tool.elementType,
    isSystem: false,
  }));

  // Check if a widget is already deployed
  const isDeployed = (id: string) => deployedWidgetIds.includes(id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn('h-[80vh] overflow-hidden flex flex-col', className)}
        showClose={false}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-2 pb-3">
          <div className="w-12 h-1.5 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <SheetHeader className="flex-shrink-0 px-1 pb-4">
          <SheetTitle className="text-lg">Add Widget</SheetTitle>
          <SheetDescription className="text-sm">
            Choose a widget to add to your sidebar
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-6 px-1 pb-4">
          {/* System Widgets */}
          <section>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Essential
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {SYSTEM_WIDGETS.map((template) => (
                <WidgetCard
                  key={template.id}
                  template={template}
                  isDeployed={isDeployed(template.id)}
                  onSelect={() => onSelectWidget(template)}
                />
              ))}
            </div>
          </section>

          {/* Engagement Widgets */}
          <section>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Engagement
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {ENGAGEMENT_WIDGETS.map((template) => (
                <WidgetCard
                  key={template.id}
                  template={template}
                  isDeployed={isDeployed(template.id)}
                  onSelect={() => onSelectWidget(template)}
                />
              ))}
            </div>
          </section>

          {/* Custom Tools */}
          {customTemplates.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Your Tools
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {customTemplates.map((template) => (
                  <WidgetCard
                    key={template.id}
                    template={template}
                    isDeployed={isDeployed(template.id)}
                    onSelect={() => onSelectWidget(template)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Create in HiveLab CTA */}
          {onCreateInHiveLab && (
            <section>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onCreateInHiveLab}
                className={cn(
                  'w-full flex items-center justify-between gap-3 p-4 rounded-xl',
                  'bg-gradient-to-r from-[#FFD700]/10 to-[#FFD700]/5',
                  'border border-[#FFD700]/20 hover:border-[#FFD700]/40',
                  'transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-[#FFD700]">
                      Create Custom in HiveLab
                    </div>
                    <div className="text-xs text-neutral-400">
                      Build anything with AI assistance
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-[#FFD700]/60" />
              </motion.button>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default WidgetGallery;
