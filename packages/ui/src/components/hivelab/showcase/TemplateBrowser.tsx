'use client';

/**
 * TemplateBrowser
 *
 * Displays available tool templates for quick start.
 * Allows users to browse and select pre-built tool compositions.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  BarChart3,
  Zap,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { TOOL_TEMPLATES, type ToolComposition } from '../../../lib/hivelab/element-system';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TemplateBrowserProps {
  /** Callback when a template is selected */
  onTemplateSelect?: (template: ToolComposition) => void;
  /** Show compact mode (less details) */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Template Icons Mapping
// ============================================================================

const TEMPLATE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'basic-search-tool': Search,
  'event-manager-tool': Calendar,
  'analytics-dashboard-tool': BarChart3,
};

const TEMPLATE_COLORS: Record<string, string> = {
  'basic-search-tool': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'event-manager-tool': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  'analytics-dashboard-tool': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
};

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
};

// ============================================================================
// TemplateBrowser Component
// ============================================================================

export function TemplateBrowser({
  onTemplateSelect,
  compact = false,
  className,
}: TemplateBrowserProps) {
  return (
    <div className={cn('template-browser', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-muted-foreground">
          Quick Start Templates
        </h3>
      </div>

      {/* Template Grid */}
      <motion.div
        className={cn(
          'grid gap-3',
          compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        )}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {TOOL_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={onTemplateSelect}
              compact={compact}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state if no templates */}
      {TOOL_TEMPLATES.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No templates available yet.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TemplateCard Component
// ============================================================================

interface TemplateCardProps {
  template: ToolComposition;
  onSelect?: (template: ToolComposition) => void;
  compact?: boolean;
}

function TemplateCard({ template, onSelect, compact }: TemplateCardProps) {
  const Icon = TEMPLATE_ICONS[template.id] || Zap;
  const colorClass = TEMPLATE_COLORS[template.id] || 'from-neutral-500/20 to-neutral-600/10 border-neutral-500/30';

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect?.(template)}
      className={cn(
        'group relative w-full text-left rounded-lg border',
        'bg-gradient-to-br transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30',
        colorClass,
        compact ? 'p-3' : 'p-4'
      )}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex items-center justify-center rounded-lg',
          'bg-neutral-900/50 text-neutral-300',
          compact ? 'h-8 w-8' : 'h-10 w-10'
        )}>
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              'font-medium text-foreground truncate',
              compact ? 'text-sm' : 'text-base'
            )}>
              {template.name}
            </h4>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Description */}
          {!compact && template.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>
          )}

          {/* Element count badge */}
          <div className={cn(
            'flex items-center gap-2',
            compact ? 'mt-1' : 'mt-2'
          )}>
            <span className="text-xs text-muted-foreground">
              {template.elements.length} element{template.elements.length !== 1 ? 's' : ''}
            </span>
            {template.connections.length > 0 && (
              <span className="text-xs text-muted-foreground">
                • {template.connections.length} connection{template.connections.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-lg bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

export default TemplateBrowser;
