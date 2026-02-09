'use client';

/**
 * /tools/setups — Setup Gallery
 *
 * Browse SetupTemplates (orchestrated tool bundles).
 * Each Setup contains multiple tools with orchestration rules for cross-tool automation.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  Layers,
  Calendar,
  Users,
  Vote,
  Trophy,
  Sparkles,
  Zap,
  GitBranch,
  Play,
} from 'lucide-react';
import { BrandSpinner } from '@hive/ui';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

// Category configuration
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  event: { label: 'Events', icon: Calendar, color: '#10B981' },
  campaign: { label: 'Campaigns', icon: Trophy, color: '#F59E0B' },
  workflow: { label: 'Workflows', icon: GitBranch, color: '#6366F1' },
  engagement: { label: 'Engagement', icon: Vote, color: '#EC4899' },
  governance: { label: 'Governance', icon: Users, color: '#8B5CF6' },
};

// Source badge configuration
const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  system: { label: 'HIVE', color: 'var(--life-gold)' },
  featured: { label: 'Featured', color: '#10B981' },
  community: { label: 'Community', color: '#6366F1' },
};

interface SetupTemplateListItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  source: string;
  toolCount: number;
  ruleCount: number;
  tags: string[];
  isFeatured: boolean;
  deploymentCount: number;
  creatorName?: string;
  thumbnailUrl?: string;
}

async function fetchSetupTemplates(category?: string): Promise<SetupTemplateListItem[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') {
    params.set('category', category);
  }
  params.set('limit', '50');

  const response = await fetch(`/api/setups/templates?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch setups');
  const data = await response.json();
  return data.templates || [];
}

/**
 * SetupCard — Card for a single setup template
 */
function SetupCard({
  setup,
  index,
  onClick,
}: {
  setup: SetupTemplateListItem;
  index: number;
  onClick: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const categoryConfig = CATEGORY_CONFIG[setup.category] || CATEGORY_CONFIG.event;
  const sourceConfig = SOURCE_CONFIG[setup.source] || SOURCE_CONFIG.community;
  const CategoryIcon = categoryConfig.icon;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : index * 0.06,
        ease: EASE,
      }}
      whileHover={{ opacity: 0.96 }}
      onClick={onClick}
      className={`
        text-left p-5 rounded-xl border transition-all duration-200 group
        bg-[var(--hivelab-surface)] hover:bg-[var(--hivelab-surface-hover)] hover:brightness-105
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-ground)]
        ${setup.isFeatured
          ? 'border-[var(--life-gold)]/20 hover:border-[var(--life-gold)]/40'
          : 'border-[var(--hivelab-border)] hover:border-white/15'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: `${categoryConfig.color}15` }}
        >
          <CategoryIcon className="h-5 w-5" style={{ color: categoryConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate text-[var(--hivelab-text-primary)]">
              {setup.name}
            </span>
            {setup.isFeatured && (
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-[var(--life-gold)]" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-label-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${sourceConfig.color}20`,
                color: sourceConfig.color,
              }}
            >
              {sourceConfig.label}
            </span>
            <span className="text-xs text-[var(--hivelab-text-tertiary)]">
              {categoryConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm line-clamp-2 mb-3 text-[var(--hivelab-text-secondary)]">
        {setup.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[var(--hivelab-text-tertiary)]">
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          {setup.toolCount} tools
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          {setup.ruleCount} rules
        </span>
        {setup.deploymentCount > 0 && (
          <span className="flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5" />
            {setup.deploymentCount} deployed
          </span>
        )}
      </div>
    </motion.button>
  );
}

export default function SetupsGalleryPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('all');

  const { data: setups = [], isLoading } = useQuery({
    queryKey: ['setup-templates', category],
    queryFn: () => fetchSetupTemplates(category === 'all' ? undefined : category),
    staleTime: 60000,
  });

  // Filter by search
  const filteredSetups = React.useMemo(() => {
    if (!search) return setups;
    const query = search.toLowerCase();
    return setups.filter(
      (setup) =>
        setup.name.toLowerCase().includes(query) ||
        setup.description.toLowerCase().includes(query) ||
        setup.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [setups, search]);

  // Separate featured from regular
  const featuredSetups = filteredSetups.filter((s) => s.isFeatured);
  const regularSetups = filteredSetups.filter((s) => !s.isFeatured);

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 text-sm transition-colors mb-8 text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lab
          </Link>
        </motion.div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl sm:text-3xl font-medium mb-3 text-[var(--hivelab-text-primary)]"
          >
            Setups
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm text-[var(--hivelab-text-secondary)]"
          >
            Orchestrated tool bundles with cross-tool automation
          </motion.p>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: 0.2 }}
          className="max-w-xl mx-auto mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--hivelab-text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search setups..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-[var(--hivelab-border)] text-[var(--hivelab-text-primary)] transition-colors text-sm outline-none focus:border-white/20"
            />
          </div>
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: 0.3 }}
          className="flex justify-center gap-2 mb-8 flex-wrap"
        >
          <button
            onClick={() => setCategory('all')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
              ${category === 'all'
                ? 'bg-[var(--life-gold)]/20 text-[var(--life-gold)] border-[var(--life-gold)]/40'
                : 'bg-transparent text-[var(--hivelab-text-secondary)] border-[var(--hivelab-border)] hover:border-white/15'
              }
            `}
          >
            All
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                ${category === key
                  ? 'border-opacity-40'
                  : 'bg-transparent text-[var(--hivelab-text-secondary)] border-[var(--hivelab-border)] hover:border-white/15'
                }
              `}
              style={category === key ? {
                backgroundColor: `${config.color}20`,
                color: config.color,
                borderColor: `${config.color}40`,
              } : undefined}
            >
              <config.icon className="h-3.5 w-3.5" />
              {config.label}
            </button>
          ))}
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <BrandSpinner size="md" variant="neutral" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredSetups.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Layers className="h-12 w-12 mx-auto mb-4 text-[var(--hivelab-text-tertiary)]" />
            <p className="text-lg mb-2 text-[var(--hivelab-text-primary)]">
              No setups found
            </p>
            <p className="text-sm text-[var(--hivelab-text-secondary)]">
              {search
                ? `No setups match "${search}"`
                : 'Setup templates will appear here when available'}
            </p>
          </motion.div>
        )}

        {/* Setups Grid */}
        {!isLoading && filteredSetups.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              {/* Featured Section */}
              {featuredSetups.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-sm font-medium text-[var(--hivelab-text-secondary)]">
                      Featured Setups
                    </h2>
                    <span className="text-label-xs px-2 py-0.5 rounded-full font-medium bg-[var(--life-gold)]/20 text-[var(--life-gold)]">
                      Recommended
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featuredSetups.map((setup, index) => (
                      <SetupCard
                        key={setup.id}
                        setup={setup}
                        index={index}
                        onClick={() => router.push(`/lab/setups/${setup.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Setups */}
              {regularSetups.length > 0 && (
                <div>
                  {featuredSetups.length > 0 && (
                    <h2 className="text-sm font-medium mb-4 text-[var(--hivelab-text-secondary)]">
                      All Setups
                    </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularSetups.map((setup, index) => (
                      <SetupCard
                        key={setup.id}
                        setup={setup}
                        index={index + featuredSetups.length}
                        onClick={() => router.push(`/lab/setups/${setup.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Create Setup CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.6 }}
          className="mt-8 p-4 rounded-xl border-dashed bg-white/[0.02] border border-dashed border-[var(--hivelab-border)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-[var(--hivelab-text-primary)]">
                Want to create a custom setup?
              </p>
              <p className="text-xs text-[var(--hivelab-text-secondary)]">
                Bundle multiple tools with orchestration rules
              </p>
            </div>
            <button
              onClick={() => router.push('/lab/setups/new')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)] border border-[var(--hivelab-border)] hover:border-[var(--life-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Create Setup
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
