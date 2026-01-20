'use client';

/**
 * Template Gallery Page
 *
 * Browse and discover tool templates. UsersIcon can:
 * - Browse by category
 * - MagnifyingGlassIcon templates
 * - Preview template compositions
 * - Use templates to create new tools
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, SparklesIcon, ChevronRightIcon, ChartBarIcon, CalendarIcon, UsersIcon, AcademicCapIcon, StarIcon, ArrowTrendingUpIcon, TrophyIcon, WrenchIcon, PlusIcon, ArrowPathIcon, Squares2X2Icon, MegaphoneIcon, PuzzlePieceIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

// Aliases for lucide compatibility
const Grid3X3 = Squares2X2Icon;
const Megaphone = MegaphoneIcon;
const Gamepad2 = PuzzlePieceIcon;
const ListTodo = ListBulletIcon;
import { cn, Button, toast } from '@hive/ui';

// ============================================================================
// Types
// ============================================================================

interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  category: string;
  source: 'code' | 'community' | 'featured';
  elementCount: number;
  connectionCount: number;
  tags: string[];
  isFeatured: boolean;
  usageCount: number;
  creatorName?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

type TemplateCategory =
  | 'all'
  | 'engagement'
  | 'events'
  | 'organization'
  | 'analytics'
  | 'communication'
  | 'academic'
  | 'social'
  | 'productivity';

// ============================================================================
// Category Configuration
// ============================================================================

type LucideIconComponent = React.ComponentType<{ className?: string }>;

const CATEGORIES: {
  value: TemplateCategory;
  label: string;
  icon: LucideIconComponent;
  description: string;
}[] = [
  { value: 'all', label: 'All Templates', icon: Grid3X3, description: 'Browse all available templates' },
  { value: 'engagement', label: 'Engagement', icon: ChartBarIcon, description: 'Polls, quizzes, and reactions' },
  { value: 'events', label: 'Events', icon: CalendarIcon, description: 'RSVPs, countdowns, and calendars' },
  { value: 'organization', label: 'Organization', icon: UsersIcon, description: 'Sign-ups, rosters, and schedules' },
  { value: 'analytics', label: 'Analytics', icon: ArrowTrendingUpIcon, description: 'Dashboards and leaderboards' },
  { value: 'communication', label: 'Communication', icon: Megaphone, description: 'Announcements and notifications' },
  { value: 'academic', label: 'Academic', icon: AcademicCapIcon, description: 'Study tools and course materials' },
  { value: 'social', label: 'Social', icon: Gamepad2, description: 'Games and icebreakers' },
  { value: 'productivity', label: 'Productivity', icon: ListTodo, description: 'Tasks and checklists' },
];

const CATEGORY_COLORS: Record<string, string> = {
  engagement: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  events: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  organization: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  analytics: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  communication: 'from-red-500/20 to-red-500/5 border-red-500/30',
  academic: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30',
  social: 'from-pink-500/20 to-pink-500/5 border-pink-500/30',
  productivity: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
};

const CATEGORY_ICONS: Record<string, LucideIconComponent> = {
  engagement: ChartBarIcon,
  events: CalendarIcon,
  organization: UsersIcon,
  analytics: ArrowTrendingUpIcon,
  communication: Megaphone,
  academic: AcademicCapIcon,
  social: Gamepad2,
  productivity: ListTodo,
};

// ============================================================================
// Component
// ============================================================================

export default function TemplateGalleryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') {
          params.set('category', selectedCategory);
        }
        params.set('limit', '100');

        const response = await fetch(`/api/templates?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const data = await response.json();
        setTemplates(data.templates || []);
        setError(null);
      } catch (err) {
        setError('Failed to load templates. Please try again.');
        logger.error('Template fetch error', { component: 'TemplatesPage' }, err instanceof Error ? err : undefined);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [selectedCategory]);

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter(
      t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [templates, searchQuery]);

  // Group templates
  const featuredTemplates = useMemo(
    () => filteredTemplates.filter(t => t.isFeatured || t.source === 'code'),
    [filteredTemplates]
  );

  const communityTemplates = useMemo(
    () => filteredTemplates.filter(t => !t.isFeatured && t.source === 'community'),
    [filteredTemplates]
  );

  // Handle use template
  const handleUseTemplate = async (templateId: string) => {
    try {
      setUsingTemplate(templateId);

      const response = await fetch(`/api/templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to use template');
      }

      const data = await response.json();
      router.push(data.redirectUrl || `/tools/${data.tool.id}`);
    } catch (err) {
      logger.error('Use template error', { component: 'TemplatesPage' }, err instanceof Error ? err : undefined);
      toast.error(err instanceof Error ? err.message : 'Failed to use template');
    } finally {
      setUsingTemplate(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.08] sticky top-0 bg-black/90 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--hive-gold-cta)] flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold text-lg">HiveLab</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/elements">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Elements
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <WrenchIcon className="w-4 h-4 mr-2" />
                  My Tools
                </Button>
              </Link>
              <Link href="/tools/create">
                <Button size="sm" className="bg-[var(--hive-gold-cta)] text-black hover:brightness-110">
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Create Tool
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 sm:py-16 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Tool <span className="text-[var(--hive-gold-cta)]">Templates</span>
            </h1>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Start with a pre-built template and customize it for your space.
              One click to get started.
            </p>
          </motion.div>

          {/* MagnifyingGlassIcon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 max-w-md mx-auto"
          >
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="MagnifyingGlassIcon templates..."
                className={cn(
                  'w-full pl-12 pr-4 py-3 rounded-xl',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'text-white placeholder:text-white/40',
                  'focus:outline-none focus:border-white/20',
                  'transition-colors'
                )}
              />
            </div>
          </motion.div>

          {/* Category filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 flex items-center justify-center gap-2 flex-wrap"
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  selectedCategory === cat.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <ArrowPathIcon className="w-8 h-8 animate-spin text-white/40" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400">{error}</p>
              <Button
                variant="ghost"
                onClick={() => window.location.reload()}
                className="mt-4 text-white/60"
              >
                Try Again
              </Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <MagnifyingGlassIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "Try a different search term or browse by category"
                  : "Templates help you get started quickly. Can't find what you need? Build from scratch."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {searchQuery ? (
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    className="text-white/70 hover:text-white"
                  >
                    Clear search
                  </Button>
                ) : null}
                <Link href="/tools/create">
                  <Button className="bg-white/10 hover:bg-white/20 text-white">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Build from Scratch
                  </Button>
                </Link>
                <Link href="/elements">
                  <Button variant="ghost" className="text-white/60 hover:text-white">
                    Browse Elements
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Featured Templates */}
              {featuredTemplates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <StarIcon className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-semibold text-white">Featured Templates</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredTemplates.map((template, index) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        index={index}
                        onUse={handleUseTemplate}
                        isUsing={usingTemplate === template.id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Community Templates */}
              {communityTemplates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <TrophyIcon className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Community Templates</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {communityTemplates.map((template, index) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        index={index}
                        onUse={handleUseTemplate}
                        isUsing={usingTemplate === template.id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Can't find what you need?
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            Build your own tool from scratch using our visual builder and 27 building blocks.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/tools/create">
              <Button size="lg" className="bg-[var(--hive-gold-cta)] text-black hover:brightness-110">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Start Building
              </Button>
            </Link>
            <Link href="/elements">
              <Button size="lg" variant="ghost" className="text-white/60 hover:text-white">
                Browse Elements
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-white/40">
            Part of <Link href="/" className="text-white/60 hover:text-white">HIVE</Link> — The operating system for campus communities
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Template Card Component
// ============================================================================

interface TemplateCardProps {
  template: TemplateListItem;
  index: number;
  onUse: (id: string) => void;
  isUsing: boolean;
}

function TemplateCard({ template, index, onUse, isUsing }: TemplateCardProps) {
  const Icon = CATEGORY_ICONS[template.category] || Grid3X3;
  const colorClass = CATEGORY_COLORS[template.category] || 'from-neutral-500/20 to-neutral-600/10 border-neutral-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn(
        'group relative rounded-xl border transition-all duration-200',
        'bg-gradient-to-br',
        'hover:shadow-lg hover:opacity-90',
        colorClass
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white/70" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white truncate">{template.name}</h3>
              {template.isFeatured && (
                <StarIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" />
              )}
            </div>
            <p className="text-sm text-white/50 mt-1 line-clamp-2">
              {template.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-white/40">
          <span>
            {template.elementCount} element{template.elementCount !== 1 ? 's' : ''}
          </span>
          {template.connectionCount > 0 && (
            <span>
              {template.connectionCount} connection{template.connectionCount !== 1 ? 's' : ''}
            </span>
          )}
          {template.usageCount > 0 && (
            <span className="flex items-center gap-1">
              <ArrowTrendingUpIcon className="w-3 h-3" />
              {template.usageCount} uses
            </span>
          )}
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] rounded-full bg-white/[0.08] text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between">
          {template.creatorName && (
            <span className="text-xs text-white/40">by {template.creatorName}</span>
          )}
          <Button
            size="sm"
            onClick={() => onUse(template.id)}
            disabled={isUsing}
            className={cn(
              'ml-auto',
              'bg-white/10 hover:bg-white/20 text-white',
              'disabled:opacity-50'
            )}
          >
            {isUsing ? (
              <>
                <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Use Template
                <ChevronRightIcon className="w-3 h-3 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
