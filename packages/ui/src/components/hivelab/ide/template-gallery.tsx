'use client';

/**
 * TemplateGallery - Premium template browser for HiveLab
 *
 * Make.com / Figma inspired design with:
 * - Custom visual elements (not basic icons)
 * - Gradient accents and glow effects
 * - Immersive selection experience
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import {
  QUICK_TEMPLATES,
  type QuickTemplate,
  type TemplateCategory,
  createToolFromTemplate,
  getAppTemplates,
} from '../../../lib/hivelab/quick-templates';
import type { ToolComposition } from '../../../lib/hivelab/element-system';

// Premium motion tokens
const springSnappy = { type: 'spring' as const, stiffness: 500, damping: 30 };
const springSmooth = { type: 'spring' as const, stiffness: 300, damping: 25 };

// Category visual config - emoji + gradient pairs
const CATEGORY_CONFIG: Record<TemplateCategory, { emoji: string; gradient: string; glow: string }> = {
  apps: {
    emoji: '⚡',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    glow: 'group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]'
  },
  events: {
    emoji: '📅',
    gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
    glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]'
  },
  engagement: {
    emoji: '🎯',
    gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]'
  },
  resources: {
    emoji: '📚',
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]'
  },
  feedback: {
    emoji: '💬',
    gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
    glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]'
  },
  teams: {
    emoji: '👥',
    gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent',
    glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]'
  },
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  apps: 'Apps',
  events: 'Events',
  engagement: 'Engagement',
  resources: 'Resources',
  feedback: 'Feedback',
  teams: 'Teams',
};

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (composition: ToolComposition) => void;
}

// Premium template card with custom visuals
function TemplateCard({
  template,
  isSelected,
  onSelect,
  onUse,
  index,
}: {
  template: QuickTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
  index: number;
}) {
  const config = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.apps;
  const isApp = template.complexity === 'app';
  const isComingSoon = template.status === 'coming-soon';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSmooth, delay: index * 0.03 }}
      className="relative"
    >
      <motion.button
        type="button"
        onClick={isSelected ? onUse : onSelect}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springSnappy}
        className={cn(
          'group relative w-full text-left rounded-2xl overflow-hidden',
          'transition-all duration-300',
          config.glow,
          isSelected
            ? 'ring-2 ring-[var(--life-gold)] ring-offset-2 ring-offset-[var(--hivelab-bg)]'
            : ''
        )}
      >
        {/* Background with gradient */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          config.gradient
        )} />

        {/* Card content */}
        <div className={cn(
          'relative p-5 border rounded-2xl transition-all duration-300',
          'bg-[var(--hivelab-surface)]/80 backdrop-blur-sm',
          isSelected
            ? 'border-[var(--life-gold)]/50 bg-[var(--hivelab-surface)]'
            : 'border-[var(--hivelab-border)] group-hover:border-white/10 group-hover:bg-[var(--hivelab-surface)]'
        )}>
          {/* Top row: Emoji + badges */}
          <div className="flex items-start justify-between mb-3">
            {/* Emoji with glow */}
            <div className="relative">
              <span className="text-2xl select-none">{config.emoji}</span>
              {isApp && (
                <motion.div
                  className="absolute -inset-1 bg-[var(--life-gold)]/20 rounded-full blur-md"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5">
              {isApp && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-[var(--life-gold)] to-amber-500 text-black">
                  APP
                </span>
              )}
              {isComingSoon && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/10 text-white/60">
                  Soon
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h4 className={cn(
            'font-semibold text-[15px] mb-1 transition-colors',
            isSelected ? 'text-white' : 'text-[var(--hivelab-text-primary)] group-hover:text-white'
          )}>
            {template.name}
          </h4>

          {/* Description */}
          <p className="text-xs text-[var(--hivelab-text-tertiary)] line-clamp-2 leading-relaxed">
            {template.description}
          </p>

          {/* Selection indicator */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={springSnappy}
                className="mt-4 pt-3 border-t border-[var(--life-gold)]/20"
              >
                {isComingSoon ? (
                  <div className="text-center py-2 text-xs text-white/40">
                    Coming soon
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-1 text-sm font-medium text-[var(--life-gold)]">
                    <span>Click to use</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </motion.div>
  );
}

// Category pill with emoji
function CategoryPill({
  category,
  isActive,
  onClick,
}: {
  category: TemplateCategory | null;
  isActive: boolean;
  onClick: () => void;
}) {
  const config = category ? CATEGORY_CONFIG[category] : null;
  const label = category ? CATEGORY_LABELS[category] : 'All';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
        isActive
          ? 'bg-white/10 text-white border border-white/20'
          : 'bg-transparent text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
      )}
    >
      {config && <span className="text-sm">{config.emoji}</span>}
      {label}
    </motion.button>
  );
}

export function TemplateGallery({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(QUICK_TEMPLATES.map((t) => t.category));
    return Array.from(cats) as TemplateCategory[];
  }, []);

  const appTemplates = useMemo(() => getAppTemplates(), []);

  const filteredTemplates = useMemo(() => {
    return QUICK_TEMPLATES.filter((template) => {
      if (template.status === 'hidden') return false;
      if (activeCategory && template.category !== activeCategory) return false;
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
      if (template.status === 'coming-soon') return;
      const composition = createToolFromTemplate(template);
      onSelectTemplate(composition);
      onClose();
    },
    [onSelectTemplate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={onClose}
          onKeyDown={handleKeyDown}
        >
          {/* Premium backdrop with gradient */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--life-gold)]/5 via-transparent to-purple-500/5" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springSmooth}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[85vh] mx-4 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[var(--hivelab-bg)]/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Decorative glow */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--life-gold)]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative px-8 pt-8 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--life-gold)] to-amber-600 flex items-center justify-center">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Templates</h2>
                      <p className="text-sm text-white/40">{filteredTemplates.length} ready to use</p>
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Search */}
              <div className="relative mt-6">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--life-gold)]/50 focus:bg-white/[0.07] transition-all text-sm"
                />
              </div>

              {/* Category filters */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <CategoryPill
                  category={null}
                  isActive={activeCategory === null}
                  onClick={() => setActiveCategory(null)}
                />
                {categories.map((cat) => (
                  <CategoryPill
                    key={cat}
                    category={cat}
                    isActive={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                  />
                ))}
              </div>
            </div>

            {/* Template grid */}
            <div className="relative flex-1 overflow-y-auto px-8 pb-8">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-4">🔍</span>
                  <p className="text-white/60 text-sm">No templates found</p>
                  <p className="text-white/30 text-xs mt-1">Try a different search or category</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Featured Apps */}
                  {activeCategory === null && !searchQuery && appTemplates.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">⚡</span>
                        <h3 className="text-sm font-semibold text-white">Featured Apps</h3>
                        <span className="text-xs text-white/30">Multi-element power tools</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {appTemplates.slice(0, 6).map((template, i) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplateId === template.id}
                            onSelect={() => setSelectedTemplateId(template.id)}
                            onUse={() => handleUseTemplate(template)}
                            index={i}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Templates */}
                  <div>
                    {activeCategory === null && !searchQuery && appTemplates.length > 0 && (
                      <h3 className="text-sm font-semibold text-white mb-4">All Templates</h3>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredTemplates
                        .filter(t => {
                          if (activeCategory === null && !searchQuery && appTemplates.length > 0) {
                            return t.complexity !== 'app';
                          }
                          return true;
                        })
                        .map((template, i) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplateId === template.id}
                            onSelect={() => setSelectedTemplateId(template.id)}
                            onUse={() => handleUseTemplate(template)}
                            index={i}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="relative px-8 py-4 border-t border-white/5 bg-black/20">
              <p className="text-xs text-white/30 text-center">
                Click to select • Click again to use • <span className="text-white/50">ESC</span> to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
