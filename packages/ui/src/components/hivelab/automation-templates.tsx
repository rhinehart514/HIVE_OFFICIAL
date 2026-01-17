'use client';

/**
 * Automation Templates Browser
 *
 * Allows leaders to browse and apply pre-built automation templates.
 * Part of HiveLab Phase 3.5 enhancements.
 *
 * @author HIVE Platform Team
 * @version 1.0.0
 */

import * as React from 'react';
import { UserPlusIcon, BellIcon, ClockIcon, CalendarDaysIcon, ExclamationCircleIcon, StarIcon, FaceSmileIcon, BoltIcon, CheckIcon, XMarkIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { Button } from '../../design-system/primitives';
import type { AutomationTemplate } from '@hive/core';

// ============================================================================
// TYPES
// ============================================================================

interface AutomationTemplatesProps {
  /** Space ID to create automations in */
  spaceId: string;
  /** Function to fetch templates */
  fetchTemplates: () => Promise<{
    templates: AutomationTemplate[];
    categories: Array<{ category: string; count: number; label: string }>;
  }>;
  /** Function to apply a template */
  onApplyTemplate: (
    templateId: string,
    customValues?: Record<string, unknown>,
    name?: string
  ) => Promise<void>;
  /** Callback when an automation is created */
  onAutomationCreated?: () => void;
  /** CSS class */
  className?: string;
}

interface TemplateCardProps {
  template: AutomationTemplate;
  onApply: () => void;
  isApplying: boolean;
}

// ============================================================================
// ICON MAP
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlusIcon,
  BellIcon,
  ClockIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  StarIcon,
  FaceSmileIcon,
  BoltIcon,
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] || BoltIcon;
}

// ============================================================================
// CATEGORY STYLES
// ============================================================================

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  engagement: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
  },
  events: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  moderation: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  notifications: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
};

// ============================================================================
// TEMPLATE CARD
// ============================================================================

function TemplateCard({ template, onApply, isApplying }: TemplateCardProps) {
  const Icon = getIcon(template.icon);
  const styles = CATEGORY_STYLES[template.category] || CATEGORY_STYLES.engagement;

  return (
    <div
      className={cn(
        'group relative rounded-xl border p-4 transition-all duration-200',
        'bg-white/[0.02] hover:bg-white/[0.04]',
        'border-white/[0.08] hover:border-white/[0.15]'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            styles.bg,
            styles.border,
            'border'
          )}
        >
          <Icon className={cn('h-5 w-5', styles.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white text-sm truncate">
            {template.name}
          </h3>
          <p className="text-white/50 text-xs mt-0.5 line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>

      {/* Example */}
      <div className="mb-4 p-2 rounded-lg bg-black/20 border border-white/[0.05]">
        <p className="text-white/40 text-xs font-mono">
          {template.example}
        </p>
      </div>

      {/* Category Badge + Apply Button */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'px-2 py-0.5 rounded text-[10px] uppercase tracking-wider',
            styles.bg,
            styles.text
          )}
        >
          {template.category}
        </span>
        <Button
          size="sm"
          onClick={onApply}
          disabled={isApplying}
          className={cn(
            'h-7 px-3 text-xs',
            'bg-[var(--hive-gold-cta)] hover:brightness-110 text-black',
            'transition-all duration-200'
          )}
        >
          {isApplying ? (
            <>
              <ArrowPathIcon className="h-3 w-3 mr-1.5 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              Enable
              <ChevronRightIcon className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AutomationTemplates({
  spaceId,
  fetchTemplates,
  onApplyTemplate,
  onAutomationCreated,
  className,
}: AutomationTemplatesProps) {
  const [templates, setTemplates] = React.useState<AutomationTemplate[]>([]);
  const [categories, setCategories] = React.useState<
    Array<{ category: string; count: number; label: string }>
  >([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [applyingId, setApplyingId] = React.useState<string | null>(null);
  const [successId, setSuccessId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch templates on mount
  React.useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchTemplates();
        setTemplates(data.templates);
        setCategories(data.categories);
      } catch (err) {
        setError('Failed to load templates');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [fetchTemplates]);

  // Filter templates by category
  const filteredTemplates = React.useMemo(() => {
    if (!selectedCategory) return templates;
    return templates.filter(t => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Handle applying a template
  const handleApply = React.useCallback(
    async (templateId: string) => {
      try {
        setApplyingId(templateId);
        setError(null);
        await onApplyTemplate(templateId);
        setSuccessId(templateId);
        onAutomationCreated?.();

        // Clear success after a moment
        setTimeout(() => setSuccessId(null), 2000);
      } catch (err) {
        setError('Failed to enable automation');
        console.error(err);
      } finally {
        setApplyingId(null);
      }
    },
    [onApplyTemplate, onAutomationCreated]
  );

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <ArrowPathIcon className="h-6 w-6 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-[var(--hive-gold-cta)]" />
            Automation Templates
          </h2>
          <p className="text-white/50 text-sm mt-0.5">
            Quick-start automations for your space
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all',
            !selectedCategory
              ? 'bg-white/[0.12] text-white'
              : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
          )}
        >
          All ({templates.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all',
              selectedCategory === cat.category
                ? 'bg-white/[0.12] text-white'
                : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
            )}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XMarkIcon className="h-4 w-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successId && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckIcon className="h-4 w-4 text-green-400" />
          <span className="text-green-400 text-sm">
            Automation enabled! It will start working automatically.
          </span>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onApply={() => handleApply(template.id)}
            isApplying={applyingId === template.id}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/40">No templates in this category</p>
        </div>
      )}

      {/* Footer Help */}
      <div className="pt-4 border-t border-white/[0.08]">
        <p className="text-white/40 text-xs text-center">
          Want more control?{' '}
          <span className="text-[var(--hive-gold-cta)]">
            Type /automate in chat
          </span>{' '}
          to create custom automations.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VERSION (for sidebar)
// ============================================================================

interface AutomationTemplatesCompactProps {
  onOpenFull: () => void;
  templateCount?: number;
  className?: string;
}

export function AutomationTemplatesCompact({
  onOpenFull,
  templateCount = 6,
  className,
}: AutomationTemplatesCompactProps) {
  return (
    <button
      onClick={onOpenFull}
      className={cn(
        'w-full p-3 rounded-xl transition-all duration-200',
        'bg-gradient-to-r from-amber-500/10 to-orange-500/10',
        'border border-amber-500/20 hover:border-amber-500/30',
        'flex items-center gap-3 group',
        className
      )}
    >
      <div className="p-2 rounded-lg bg-amber-500/20">
        <BoltIcon className="h-4 w-4 text-amber-400" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-white text-sm font-medium">Quick Automations</p>
        <p className="text-white/50 text-xs">
          {templateCount} templates available
        </p>
      </div>
      <ChevronRightIcon className="h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
    </button>
  );
}
