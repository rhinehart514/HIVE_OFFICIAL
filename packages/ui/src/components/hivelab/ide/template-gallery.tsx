'use client';

/**
 * TemplateGallery - Modal for browsing and selecting HiveLab templates
 *
 * Shows all available templates organized by category with preview
 * and one-click selection.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon, ChartBarIcon, ClockIcon, LinkIcon, UsersIcon, CalendarIcon, ChatBubbleLeftIcon, DocumentTextIcon, SparklesIcon, CheckIcon, ArrowRightIcon, ViewfinderCircleIcon, ArrowTrendingUpIcon, ClipboardDocumentListIcon, WalletIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const ClipboardList = ClipboardDocumentListIcon;
const Wallet = WalletIcon;
const Layers = Square3Stack3DIcon;
import { cn } from '../../../lib/utils';

// Workshop tokens
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]';
const workshopTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };
const workshopTransitionSnappy = { type: 'spring' as const, stiffness: 500, damping: 30 };
import {
  QUICK_TEMPLATES,
  type QuickTemplate,
  type TemplateCategory,
  createToolFromTemplate,
  getAppTemplates,
} from '../../../lib/hivelab/quick-templates';
import type { ToolComposition } from '../../../lib/hivelab/element-system';

const ICON_MAP = {
  'bar-chart-2': ChartBarIcon,
  timer: ClockIcon,
  'link-2': LinkIcon,
  users: UsersIcon,
  calendar: CalendarIcon,
  'message-square': ChatBubbleLeftIcon,
  'file-text': DocumentTextIcon,
  sparkles: SparklesIcon,
  'clipboard-list': ClipboardList,
  target: ViewfinderCircleIcon,
  'trending-up': ArrowTrendingUpIcon,
  wallet: Wallet,
  camera: SparklesIcon, // Photo challenge
  trophy: SparklesIcon, // Competition
  inbox: ChatBubbleLeftIcon, // Suggestion box
  grid: Layers, // Multi-poll
} as const;

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  apps: 'Apps',
  events: 'For Events',
  engagement: 'Engagement',
  resources: 'Resources',
  feedback: 'Feedback',
  teams: 'For Teams',
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  apps: 'bg-[var(--life-gold)]/10 text-[var(--life-gold)]',
  events: 'bg-purple-500/10 text-purple-400',
  engagement: 'bg-amber-500/10 text-amber-400',
  resources: 'bg-blue-500/10 text-blue-400',
  feedback: 'bg-emerald-500/10 text-emerald-400',
  teams: 'bg-cyan-500/10 text-cyan-400',
};

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (composition: ToolComposition) => void;
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
  onUse,
}: {
  template: QuickTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
}) {
  const Icon = ICON_MAP[template.icon as keyof typeof ICON_MAP] ?? Layers;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative w-full p-4 rounded-xl text-left',
        'border transition-all duration-[var(--workshop-duration)]',
        isSelected
          ? 'bg-[var(--hivelab-surface)] border-[var(--hivelab-border-emphasis)]'
          : 'bg-[var(--hivelab-surface)]/50 border-[var(--hivelab-border)] hover:bg-[var(--hivelab-surface)] hover:border-[var(--hivelab-border-emphasis)]',
        focusRing
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          layoutId="template-selected"
          className="absolute inset-0 rounded-xl border-2 border-[var(--life-gold)]/50 pointer-events-none"
          transition={workshopTransitionSnappy}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            CATEGORY_COLORS[template.category] || 'bg-[var(--hivelab-bg)] text-[var(--hivelab-text-tertiary)]'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[var(--hivelab-text-primary)] text-sm truncate">{template.name}</h4>
          <p className="text-xs text-[var(--hivelab-text-tertiary)] mt-0.5 line-clamp-2">{template.description}</p>

          {/* Category and complexity badges */}
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium',
                CATEGORY_COLORS[template.category] || 'bg-[var(--hivelab-bg)] text-[var(--hivelab-text-tertiary)]'
              )}
            >
              {CATEGORY_LABELS[template.category] || template.category}
            </span>
            {template.complexity === 'app' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gradient-to-r from-[var(--life-gold)]/20 to-amber-500/20 text-[var(--life-gold)]">
                App
              </span>
            )}
            {template.status === 'coming-soon' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-orange-500/20 text-orange-400">
                Soon
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Use button on hover/selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="mt-3 pt-3 border-t border-[var(--hivelab-border)]"
          >
            {template.status === 'coming-soon' ? (
              <div className="w-full flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <span className="text-orange-400 text-xs font-medium">Coming Soon</span>
                <span className="text-orange-400/60 text-[10px] text-center">
                  Some elements in this template are still being built
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUse();
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                  'bg-[var(--life-gold)] text-black font-medium text-sm',
                  'hover:bg-[var(--life-gold)]/90 transition-colors duration-[var(--workshop-duration)]',
                  focusRing
                )}
              >
                <CheckIcon className="h-4 w-4" />
                Use Template
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
  showAppsFirst = true,
}: {
  categories: TemplateCategory[];
  activeCategory: TemplateCategory | null;
  onCategoryChange: (category: TemplateCategory | null) => void;
  showAppsFirst?: boolean;
}) {
  // Sort categories: 'apps' first if showAppsFirst, then alphabetically
  const sortedCategories = [...categories].sort((a, b) => {
    if (showAppsFirst) {
      if (a === 'apps') return -1;
      if (b === 'apps') return 1;
    }
    return (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b);
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onCategoryChange(null)}
        className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-[var(--workshop-duration)]',
          activeCategory === null
            ? 'bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)]'
            : 'bg-[var(--hivelab-surface)]/50 text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
          focusRing
        )}
      >
        All
      </button>
      {sortedCategories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-[var(--workshop-duration)]',
            activeCategory === category
              ? 'bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)]'
              : 'bg-[var(--hivelab-surface)]/50 text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
            category === 'apps' && activeCategory !== category
              ? 'text-[var(--life-gold)]'
              : '',
            focusRing
          )}
        >
          {CATEGORY_LABELS[category] || category}
        </button>
      ))}
    </div>
  );
}

export function TemplateGallery({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Get unique categories (apps first)
  const categories = useMemo(() => {
    const cats = new Set(QUICK_TEMPLATES.map((t) => t.category));
    return Array.from(cats) as TemplateCategory[];
  }, []);

  // Get app templates for featured section
  const appTemplates = useMemo(() => getAppTemplates(), []);

  // Filter templates - hide templates with 'hidden' status (missing APIs)
  const filteredTemplates = useMemo(() => {
    return QUICK_TEMPLATES.filter((template) => {
      // Hide templates marked as hidden (no backend APIs)
      if (template.status === 'hidden') return false;

      // Category filter
      if (activeCategory && template.category !== activeCategory) return false;

      // MagnifyingGlassIcon filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [activeCategory, searchQuery]);

  const handleUseTemplate = useCallback(
    (template: QuickTemplate) => {
      const composition = createToolFromTemplate(template);
      onSelectTemplate(composition);
      onClose();
    },
    [onSelectTemplate, onClose]
  );

  // Close on escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={workshopTransition}
            onKeyDown={handleKeyDown}
            className={cn(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'w-full max-w-3xl max-h-[85vh]',
              'bg-[var(--hivelab-panel)] border border-[var(--hivelab-border)] rounded-2xl shadow-2xl',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--hivelab-border)]">
              <div>
                <h2 className="text-lg font-semibold text-[var(--hivelab-text-primary)]">Template Gallery</h2>
                <p className="text-sm text-[var(--hivelab-text-tertiary)] mt-0.5">
                  {QUICK_TEMPLATES.length} ready-to-use templates
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'p-2 rounded-lg text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
                  'transition-colors duration-[var(--workshop-duration)]',
                  focusRing
                )}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="px-6 py-4 border-b border-[var(--hivelab-border)] space-y-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--hivelab-text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-lg',
                    'bg-[var(--hivelab-surface)]/50 border border-[var(--hivelab-border)]',
                    'text-[var(--hivelab-text-primary)] placeholder:text-[var(--hivelab-text-tertiary)]',
                    'focus:outline-none focus:border-[var(--hivelab-border-emphasis)] focus:bg-[var(--hivelab-surface)]',
                    'transition-colors duration-[var(--workshop-duration)] text-sm'
                  )}
                />
              </div>

              {/* Category filters */}
              <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-10 w-10 text-[var(--hivelab-text-tertiary)]/50 mb-3" />
                  <p className="text-[var(--hivelab-text-secondary)] text-sm">No templates found</p>
                  <p className="text-[var(--hivelab-text-tertiary)] text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Featured Apps Section (only shown when viewing All with no search) */}
                  {activeCategory === null && !searchQuery && appTemplates.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4 text-[var(--life-gold)]" />
                        <h3 className="text-sm font-semibold text-[var(--hivelab-text-primary)]">Featured Apps</h3>
                        <span className="text-xs text-[var(--hivelab-text-tertiary)]">Multi-element templates</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {appTemplates.slice(0, 4).map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplateId === template.id}
                            onSelect={() => setSelectedTemplateId(template.id)}
                            onUse={() => handleUseTemplate(template)}
                          />
                        ))}
                      </div>
                      {appTemplates.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setActiveCategory('apps')}
                          className={cn(
                            'w-full py-2 text-xs text-[var(--life-gold)] hover:text-[var(--life-gold)]/80',
                            'transition-colors duration-[var(--workshop-duration)]',
                            focusRing
                          )}
                        >
                          View all {appTemplates.length} apps
                        </button>
                      )}
                    </div>
                  )}

                  {/* All Templates Section */}
                  <div className="space-y-3">
                    {activeCategory === null && !searchQuery && appTemplates.length > 0 && (
                      <h3 className="text-sm font-semibold text-[var(--hivelab-text-primary)]">All Templates</h3>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {filteredTemplates
                        .filter(t => {
                          // If showing featured apps section, filter out app templates from main list
                          if (activeCategory === null && !searchQuery && appTemplates.length > 0) {
                            return t.complexity !== 'app';
                          }
                          return true;
                        })
                        .map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplateId === template.id}
                            onSelect={() => setSelectedTemplateId(template.id)}
                            onUse={() => handleUseTemplate(template)}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 border-t border-[var(--hivelab-border)] bg-[var(--hivelab-bg)]">
              <p className="text-xs text-[var(--hivelab-text-tertiary)] text-center">
                Click a template to preview, then click{' '}
                <span className="text-[var(--life-gold)]">Use Template</span> to start building
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
