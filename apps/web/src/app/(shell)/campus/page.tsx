'use client';

export const dynamic = 'force-dynamic';

/**
 * Campus Tools Directory
 *
 * Browse deployed campus tools — filterable by category with a Rising section
 * for trending tools. Cards click through to /campus/[slug].
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';
import { BrandSpinner } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';

const EASE = MOTION.ease.premium;

const CATEGORIES = [
  'All',
  'Exchange',
  'Social',
  'Academic',
  'Org Tools',
  'Campus Life',
  'Utility',
] as const;

type Category = (typeof CATEGORIES)[number];

interface CampusTool {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  badge: 'official' | 'community';
  weeklyUsers: number;
  creatorName?: string;
}

async function fetchCampusTools(): Promise<CampusTool[]> {
  const response = await fetch('/api/campus/tools', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to load campus tools');
  }
  const result = await response.json();
  return result.data || result.tools || [];
}

function CategoryPill({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150
        ${isActive
          ? 'bg-white text-black'
          : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.08] hover:text-white/60'
        }
      `}
    >
      {label}
    </button>
  );
}

function ToolCard({
  tool,
  onClick,
}: {
  tool: CampusTool;
  onClick: (slug: string) => void;
}) {
  return (
    <motion.button
      onClick={() => onClick(tool.slug)}
      className="group text-left w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]
        hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-150"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-[15px] font-medium text-white/80 group-hover:text-white transition-colors truncate pr-2">
          {tool.name}
        </h3>
        <span
          className={`
            shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
            ${tool.badge === 'official'
              ? 'bg-[#FFD700]/15 text-[#FFD700]'
              : 'bg-white/[0.06] text-white/35'
            }
          `}
        >
          {tool.badge === 'official' ? 'Official' : 'Community'}
        </span>
      </div>

      {tool.description && (
        <p className="text-sm text-white/35 line-clamp-2 mb-3 leading-relaxed">
          {tool.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FFD700]/[0.08] text-[#FFD700] text-[11px] font-medium">
          {tool.category}
        </span>
        <span className="text-[11px] text-white/25">
          {tool.weeklyUsers > 0 ? `${tool.weeklyUsers} this week` : 'New'}
        </span>
      </div>
    </motion.button>
  );
}

export default function CampusToolsDirectory() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const { data: tools = [], isLoading, error } = useQuery({
    queryKey: ['campus-tools'],
    queryFn: fetchCampusTools,
    staleTime: 30000,
    enabled: !authLoading,
  });

  const filteredTools = useMemo(() => {
    if (activeCategory === 'All') return tools;
    return tools.filter(
      (t) => t.category.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [tools, activeCategory]);

  const risingTools = useMemo(() => {
    return [...tools]
      .sort((a, b) => b.weeklyUsers - a.weeklyUsers)
      .slice(0, 3)
      .filter((t) => t.weeklyUsers > 0);
  }, [tools]);

  const handleToolClick = useCallback(
    (slug: string) => {
      router.push(`/campus/${slug}`);
    },
    [router]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BrandSpinner size="md" variant="gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center max-w-lg"
        >
          <h1 className="text-3xl font-semibold text-white mb-4">
            Campus Apps
          </h1>
          <p className="text-white/50 mb-8">
            Sign in to browse and use apps built for your campus.
          </p>
          <button
            onClick={() => router.push('/enter?redirect=/campus')}
            className="px-6 py-3 bg-white text-black rounded-2xl font-medium text-sm hover:bg-white/90 transition-colors"
          >
            Sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.standard, ease: EASE }}
        className="mb-6"
      >
        <h1 className="text-xl font-medium text-white/80">Campus Apps</h1>
        <p className="text-sm text-white/35 mt-1">
          Apps built and deployed for your campus
        </p>
      </motion.header>

      {/* Category filter pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.quick, delay: 0.05, ease: EASE }}
        className="flex flex-wrap gap-2 mb-8"
      >
        {CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            isActive={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[140px] rounded-2xl bg-white/[0.03] animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16">
          <p className="text-white/40 text-sm">
            Failed to load campus apps. Try refreshing.
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Rising section */}
          {risingTools.length > 0 && activeCategory === 'All' && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: durationSeconds.standard, delay: 0.1, ease: EASE }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#FFD700]/60" />
                <h2 className="text-sm font-medium text-white/50">Rising</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {risingTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={handleToolClick}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* All tools grid */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: durationSeconds.standard,
              delay: risingTools.length > 0 ? 0.15 : 0.1,
              ease: EASE,
            }}
          >
            {filteredTools.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-white/40 tracking-wide uppercase">
                  {activeCategory === 'All' ? 'All Apps' : activeCategory}
                </h2>
                <span className="text-xs text-white/25">{filteredTools.length}</span>
              </div>
            )}

            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredTools.map((tool) => (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ToolCard tool={tool} onClick={handleToolClick} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-white/40 text-sm mb-2">
                  {activeCategory === 'All'
                    ? 'No campus apps yet. Be the first to build something your campus needs.'
                    : `No ${activeCategory.toLowerCase()} apps yet.`}
                </p>
                <button
                  onClick={() => router.push('/lab')}
                  className="inline-flex items-center gap-1.5 text-[#FFD700]/70 hover:text-[#FFD700] text-sm font-medium transition-colors mt-2"
                >
                  Build one in Lab
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
}
