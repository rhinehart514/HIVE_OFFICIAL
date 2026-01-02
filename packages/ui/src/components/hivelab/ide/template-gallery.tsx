'use client';

/**
 * TemplateGallery - Modal for browsing and selecting HiveLab templates
 *
 * Shows all available templates organized by category with preview
 * and one-click selection.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  BarChart2,
  Timer,
  Link2,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Sparkles,
  Check,
  ArrowRight,
  Layers,
  ClipboardList,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { focusClasses, premiumMotion, premiumPresets } from '../../../lib/premium-design';
import {
  QUICK_TEMPLATES,
  type QuickTemplate,
  createToolFromTemplate,
} from '../../../lib/hivelab/quick-templates';
import type { ToolComposition } from '../../../lib/hivelab/element-system';

const ICON_MAP = {
  'bar-chart-2': BarChart2,
  timer: Timer,
  'link-2': Link2,
  users: Users,
  calendar: Calendar,
  'message-square': MessageSquare,
  'file-text': FileText,
  sparkles: Sparkles,
  'clipboard-list': ClipboardList,
  target: Target,
  'trending-up': TrendingUp,
  wallet: Wallet,
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  engagement: 'Engagement',
  organization: 'Organization',
  communication: 'Communication',
};

const CATEGORY_COLORS: Record<string, string> = {
  engagement: 'bg-amber-500/10 text-amber-400',
  organization: 'bg-blue-500/10 text-blue-400',
  communication: 'bg-emerald-500/10 text-emerald-400',
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
        'relative w-full p-4 rounded-xl text-left transition-all',
        'border',
        isSelected
          ? 'bg-white/[0.08] border-white/[0.20]'
          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.10]',
        focusClasses()
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          layoutId="template-selected"
          className="absolute inset-0 rounded-xl border-2 border-[#FFD700]/50 pointer-events-none"
          transition={premiumMotion.spring.snappy}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            CATEGORY_COLORS[template.category] || 'bg-white/[0.08] text-white/60'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm truncate">{template.name}</h4>
          <p className="text-xs text-[#6B6B70] mt-0.5 line-clamp-2">{template.description}</p>

          {/* Category badge */}
          <div className="mt-2">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium',
                CATEGORY_COLORS[template.category] || 'bg-white/[0.06] text-white/50'
              )}
            >
              {CATEGORY_LABELS[template.category] || template.category}
            </span>
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
            className="mt-3 pt-3 border-t border-white/[0.06]"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUse();
              }}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                'bg-[#FFD700] text-black font-medium text-sm',
                'hover:bg-[#FFD700]/90 transition-colors',
                focusClasses()
              )}
            >
              <Check className="h-4 w-4" />
              Use Template
            </button>
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
}: {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onCategoryChange(null)}
        className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          activeCategory === null
            ? 'bg-white/[0.15] text-white'
            : 'bg-white/[0.04] text-[#9A9A9F] hover:text-white hover:bg-white/[0.08]',
          focusClasses()
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            activeCategory === category
              ? 'bg-white/[0.15] text-white'
              : 'bg-white/[0.04] text-[#9A9A9F] hover:text-white hover:bg-white/[0.08]',
            focusClasses()
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(QUICK_TEMPLATES.map((t) => t.category));
    return Array.from(cats);
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return QUICK_TEMPLATES.filter((template) => {
      // Category filter
      if (activeCategory && template.category !== activeCategory) return false;

      // Search filter
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
            transition={premiumMotion.spring.default}
            onKeyDown={handleKeyDown}
            className={cn(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'w-full max-w-3xl max-h-[85vh]',
              premiumPresets.floatingComposer,
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-semibold text-white">Template Gallery</h2>
                <p className="text-sm text-[#6B6B70] mt-0.5">
                  {QUICK_TEMPLATES.length} ready-to-use templates
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'p-2 rounded-lg text-[#6B6B70] hover:text-white hover:bg-white/[0.08]',
                  'transition-colors',
                  focusClasses()
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="px-6 py-4 border-b border-white/[0.06] space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B70]" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-lg',
                    'bg-white/[0.04] border border-white/[0.06]',
                    'text-white placeholder:text-[#6B6B70]',
                    'focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.06]',
                    'transition-colors text-sm'
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
                  <Layers className="h-10 w-10 text-white/20 mb-3" />
                  <p className="text-white/60 text-sm">No templates found</p>
                  <p className="text-[#6B6B70] text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplateId === template.id}
                      onSelect={() => setSelectedTemplateId(template.id)}
                      onUse={() => handleUseTemplate(template)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 border-t border-white/[0.06] bg-white/[0.02]">
              <p className="text-xs text-[#6B6B70] text-center">
                Click a template to preview, then click{' '}
                <span className="text-[#FFD700]">Use Template</span> to start building
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
