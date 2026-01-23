'use client';

/**
 * /lab/templates — Tool Templates Gallery
 *
 * Per Builder Dashboard plan:
 * - WordReveal title + search fade-in (300ms delay)
 * - GoldBorderContainer on search focus
 * - Category switch: cards exit left, new cards enter right (200ms)
 * - Card hover: scale 1.02, gold border glow
 * - Card click: creates tool directly, redirects to IDE (no query param)
 * - Stagger entrance (80ms between cards)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  BarChart2,
  Timer,
  Link2,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Sparkles,
  ClipboardList,
  Target,
  TrendingUp,
  Wallet,
  Camera,
  Trophy,
  Inbox,
  Grid,
} from 'lucide-react';
import { BrandSpinner } from '@hive/ui';
import {
  getAvailableTemplates,
  getCategoriesWithCounts,
  type QuickTemplate,
  type TemplateCategory,
} from '@hive/ui';
import { MOTION } from '@hive/tokens';
import { createToolFromTemplateApi } from '@/lib/hivelab/create-tool';

// Premium easing
const EASE = MOTION.ease.premium;

// Colors
const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  bg: 'var(--bg-ground, #0A0A09)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
};

// Icon mapping from template icon names to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  'bar-chart-2': BarChart2,
  'timer': Timer,
  'link-2': Link2,
  'users': Users,
  'calendar': Calendar,
  'message-square': MessageSquare,
  'file-text': FileText,
  'sparkles': Sparkles,
  'clipboard-list': ClipboardList,
  'target': Target,
  'trending-up': TrendingUp,
  'wallet': Wallet,
  'camera': Camera,
  'trophy': Trophy,
  'inbox': Inbox,
  'grid': Grid,
};

// Category display configuration
const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; order: number }> = {
  apps: { label: 'Apps', order: 0 },
  events: { label: 'Events', order: 1 },
  engagement: { label: 'Engagement', order: 2 },
  resources: { label: 'Resources', order: 3 },
  feedback: { label: 'Feedback', order: 4 },
  teams: { label: 'Teams', order: 5 },
};

/**
 * WordReveal — Word-by-word text animation
 */
function WordReveal({
  text,
  className,
  delay = 0,
  stagger = 0.06,
  onComplete,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  onComplete?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');
  const totalDuration = delay + (words.length * stagger) + 0.2;

  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, totalDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [onComplete, totalDuration]);

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: delay + (i * stagger),
            ease: EASE,
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * GoldBorderInput — Search input with animated gold border on focus
 */
function GoldBorderInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isFocused, setIsFocused] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative">
      {/* Gold border container */}
      <div className="relative rounded-xl overflow-hidden">
        {/* Gold borders on focus */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          style={{
            border: `1px solid ${COLORS.gold}30`,
            boxShadow: `0 0 20px ${COLORS.gold}10`,
          }}
        />

        {/* Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-4 w-4" style={{ color: COLORS.textTertiary }} />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border transition-colors text-sm outline-none"
            style={{
              borderColor: isFocused ? `${COLORS.gold}30` : COLORS.border,
              color: COLORS.text,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * TemplateCard — Interactive card with hover effects
 */
function TemplateCard({
  template,
  index,
  onSelect,
  isSelected,
}: {
  template: QuickTemplate;
  index: number;
  onSelect: (template: QuickTemplate) => void;
  isSelected: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const IconComponent = ICON_MAP[template.icon] || Sparkles;
  const isApp = template.complexity === 'app';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isSelected ? 0.5 : 1,
        y: 0,
        scale: isSelected ? 1.05 : 1,
      }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : index * 0.08, // 80ms stagger
        ease: EASE,
      }}
      whileHover={!isSelected ? { scale: 1.02, y: -2 } : {}}
      onClick={() => onSelect(template)}
      className="text-left p-4 rounded-xl border transition-all duration-200 group"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: isApp ? `${COLORS.gold}20` : COLORS.border,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isApp ? `${COLORS.gold}40` : 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.boxShadow = isApp
          ? `0 4px 20px ${COLORS.gold}15`
          : '0 4px 20px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isApp ? `${COLORS.gold}20` : COLORS.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="p-2.5 rounded-lg transition-colors"
          style={{
            backgroundColor: isApp ? `${COLORS.gold}15` : 'rgba(255, 255, 255, 0.04)',
          }}
        >
          <IconComponent
            className="h-5 w-5"
            style={{ color: isApp ? COLORS.gold : COLORS.textSecondary }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-medium text-sm truncate"
            style={{ color: COLORS.text }}
          >
            {template.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isApp && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${COLORS.gold}20`,
                  color: COLORS.gold,
                }}
              >
                {template.composition.elements.length} elements
              </span>
            )}
            <span
              className="text-xs capitalize"
              style={{ color: COLORS.textTertiary }}
            >
              {CATEGORY_CONFIG[template.category]?.label || template.category}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        className="text-sm line-clamp-2"
        style={{ color: COLORS.textSecondary }}
      >
        {template.description}
      </p>
    </motion.button>
  );
}

export default function ToolTemplatesPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<TemplateCategory | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = React.useState<QuickTemplate | null>(null);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [titleRevealed, setTitleRevealed] = React.useState(false);

  // Get available templates (excludes hidden ones)
  const availableTemplates = React.useMemo(() => getAvailableTemplates(), []);

  // Get categories with counts for filter chips
  const categoriesWithCounts = React.useMemo(() => {
    const cats = getCategoriesWithCounts();
    return cats.sort((a, b) =>
      (CATEGORY_CONFIG[a.category]?.order ?? 99) - (CATEGORY_CONFIG[b.category]?.order ?? 99)
    );
  }, []);

  // Filter templates by search and category
  const filteredTemplates = React.useMemo(() => {
    return availableTemplates.filter(template => {
      const matchesSearch =
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || template.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [availableTemplates, search, category]);

  // Separate apps (featured) from simple templates
  const appTemplates = filteredTemplates.filter(t => t.complexity === 'app');
  const simpleTemplates = filteredTemplates.filter(t => t.complexity === 'simple');

  // Handle template selection: create tool directly, redirect to IDE
  const handleSelectTemplate = React.useCallback(async (template: QuickTemplate) => {
    if (isNavigating) return;

    setSelectedTemplate(template);
    setIsNavigating(true);

    try {
      // Create tool from template via API
      const toolId = await createToolFromTemplateApi(template);

      // Brief pause for visual feedback
      await new Promise((resolve) => setTimeout(resolve, shouldReduceMotion ? 100 : 200));

      // Navigate directly to IDE with the new tool
      router.push(`/lab/${toolId}`);
    } catch (error) {
      console.error('Failed to create tool from template:', error);
      toast.error('Failed to create tool from template');
      setIsNavigating(false);
      setSelectedTemplate(null);
    }
  }, [isNavigating, router, shouldReduceMotion]);

  // Popular templates to suggest when search is empty
  const popularTemplates = availableTemplates.slice(0, 6);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
            style={{ color: COLORS.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lab
          </Link>
        </motion.div>

        {/* Header with WordReveal */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl sm:text-3xl font-medium mb-3"
            style={{ color: COLORS.text }}
          >
            {shouldReduceMotion ? (
              'What kind of tool do you need?'
            ) : (
              <WordReveal
                text="What kind of tool do you need?"
                onComplete={() => setTitleRevealed(true)}
              />
            )}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: titleRevealed || shouldReduceMotion ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm"
            style={{ color: COLORS.textSecondary }}
          >
            {availableTemplates.length} templates to jumpstart your build
          </motion.p>
        </div>

        {/* Search with gold border on focus (fade in at 300ms) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.3,
            delay: shouldReduceMotion ? 0 : 0.3,
            ease: EASE,
          }}
          className="max-w-xl mx-auto mb-6"
        >
          <GoldBorderInput
            value={search}
            onChange={setSearch}
            placeholder="Search templates..."
          />
        </motion.div>

        {/* Category pill tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.3,
            delay: shouldReduceMotion ? 0 : 0.4,
            ease: EASE,
          }}
          className="flex justify-center gap-2 mb-8 flex-wrap"
        >
          <button
            onClick={() => setCategory('all')}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: category === 'all' ? `${COLORS.gold}20` : 'transparent',
              color: category === 'all' ? COLORS.gold : COLORS.textSecondary,
              border: `1px solid ${category === 'all' ? `${COLORS.gold}40` : COLORS.border}`,
            }}
          >
            All
          </button>
          {categoriesWithCounts.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setCategory(cat.category)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: category === cat.category ? `${COLORS.gold}20` : 'transparent',
                color: category === cat.category ? COLORS.gold : COLORS.textSecondary,
                border: `1px solid ${category === cat.category ? `${COLORS.gold}40` : COLORS.border}`,
              }}
            >
              {CATEGORY_CONFIG[cat.category]?.label || cat.category}
            </button>
          ))}
        </motion.div>

        {/* Loading template indicator */}
        <AnimatePresence>
          {isNavigating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            >
              <div className="flex flex-col items-center gap-4">
                <BrandSpinner size="lg" variant="gold" />
                <span className="text-sm font-medium" style={{ color: COLORS.gold }}>
                  Creating tool...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state for search */}
        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg mb-2" style={{ color: COLORS.text }}>
              No templates match "{search}"
            </p>
            <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
              Try these popular templates instead:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {popularTemplates.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  index={index}
                  onSelect={handleSelectTemplate}
                  isSelected={selectedTemplate?.id === template.id}
                />
              ))}
            </div>
            <button
              onClick={() => {
                setSearch('');
                setCategory('all');
              }}
              className="mt-6 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: COLORS.surface,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Templates Grid */}
        {filteredTemplates.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              {/* Featured Apps Section */}
              {appTemplates.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <h2
                      className="text-sm font-medium"
                      style={{ color: COLORS.textSecondary }}
                    >
                      Featured Apps
                    </h2>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${COLORS.gold}20`,
                        color: COLORS.gold,
                      }}
                    >
                      Multi-element
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appTemplates.map((template, index) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        index={index}
                        onSelect={handleSelectTemplate}
                        isSelected={selectedTemplate?.id === template.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Simple Templates Grid */}
              {simpleTemplates.length > 0 && (
                <div>
                  {appTemplates.length > 0 && (
                    <h2
                      className="text-sm font-medium mb-4"
                      style={{ color: COLORS.textSecondary }}
                    >
                      Quick Start Templates
                    </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {simpleTemplates.map((template, index) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        index={index + appTemplates.length}
                        onSelect={handleSelectTemplate}
                        isSelected={selectedTemplate?.id === template.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Create from scratch CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.8 }}
          className="mt-8 p-4 rounded-xl border-dashed"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: `1px dashed ${COLORS.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm" style={{ color: COLORS.text }}>
                Want to start from scratch?
              </p>
              <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                Build a completely custom tool with AI assistance
              </p>
            </div>
            <button
              onClick={() => router.push('/lab')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: COLORS.surface,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.gold;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            >
              Blank Canvas
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
