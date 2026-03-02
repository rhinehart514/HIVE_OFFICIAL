'use client';

export const dynamic = 'force-dynamic';

/**
 * /build — Creation Hub + Campus App Marketplace (Unified)
 *
 * Chat-first creation experience with inline campus app discovery:
 * - New User (0 apps): Full-screen creation prompt + "See what others built"
 * - Active Builder (1+ apps): Your apps grid + creation prompt + Campus Apps section
 *
 * The IDE at /build/[toolId] becomes the "Advanced Editor" escape hatch.
 * Full browse experience at /build/browse
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hive/auth-logic';
import {
  Sparkles,
  LayoutGrid,
  TrendingUp,
  ArrowRight,
  Users,
} from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';
import {
  BrandSpinner,
  getAvailableTemplates,
} from '@hive/ui';

import { ToolCard } from '@/components/hivelab/dashboard/ToolCard';
import { StatsBar } from '@/components/hivelab/dashboard/StatsBar';
import { LabChatView } from '@/components/hivelab/chat/LabChatView';
import { useMyTools } from '@/hooks/use-my-tools';
import { useCurrentProfile } from '@/hooks/queries';
import { useAnalytics } from '@/hooks/use-analytics';
import { apiClient } from '@/lib/api-client';

const EASE = MOTION.ease.premium;
const ALL_TEMPLATES = getAvailableTemplates().slice(0, 8);

const fadeInUpVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durationSeconds.quick, ease: EASE },
  },
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durationSeconds.quick, ease: EASE },
  },
};

/* ------------------------------------------------------------------ */
/*  Campus App Card — inline component for the preview grid           */
/* ------------------------------------------------------------------ */

interface CampusAppPreview {
  id: string;
  slug: string;
  name: string;
  description?: string;
  creatorName?: string;
  weeklyUsers: number;
  category?: string;
}

function CampusAppCard({
  app,
  onClick,
}: {
  app: CampusAppPreview;
  onClick: (slug: string) => void;
}) {
  return (
    <motion.button
      onClick={() => onClick(app.slug)}
      className="group text-left w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]
        hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-150"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <h3 className="text-[15px] font-medium text-white/80 group-hover:text-white transition-colors truncate mb-1">
        {app.name}
      </h3>

      {app.description && (
        <p className="text-[13px] text-white/35 line-clamp-2 mb-3 leading-relaxed">
          {app.description}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/30 truncate">
          {app.creatorName || 'Anonymous'}
        </span>
        <span className="flex items-center gap-1 text-white/25 shrink-0">
          <Users className="w-3 h-3" />
          {app.weeklyUsers > 0 ? `${app.weeklyUsers}/wk` : 'New'}
        </span>
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Campus Apps Section                                                */
/* ------------------------------------------------------------------ */

function CampusAppsSection({
  apps,
  isLoading,
  onAppClick,
  onSeeAll,
  heading,
}: {
  apps: CampusAppPreview[];
  isLoading: boolean;
  onAppClick: (slug: string) => void;
  onSeeAll: () => void;
  heading: string;
}) {
  if (isLoading) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#FFD700]/40" />
          <span className="text-xs font-medium text-white/40">{heading}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[110px] rounded-2xl bg-white/[0.03] animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!apps.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="mt-2"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#FFD700]/50" />
          <span className="text-xs font-medium text-white/50 tracking-wide">
            {heading}
          </span>
        </div>
        <button
          onClick={onSeeAll}
          className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/50 transition-colors"
        >
          See all
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {apps.map((app) => (
          <CampusAppCard key={app.id} app={app} onClick={onAppClick} />
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function BuilderDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { data: currentProfile } = useCurrentProfile({ enabled: !!user });
  const { track } = useAnalytics();
  const [showAllTools, setShowAllTools] = useState(false);

  const originSpaceId = searchParams.get('spaceId');
  const spaceNameParam = searchParams.get('spaceName');
  const autoPrompt = searchParams.get('prompt') || undefined;

  const spaceContext = originSpaceId
    ? { spaceId: originSpaceId, spaceName: spaceNameParam || 'Space' }
    : undefined;

  // Fetch user's tools with aggregated stats
  const { data, isLoading: toolsLoading } = useMyTools();
  const userTools = data?.tools ?? [];
  const stats = data?.stats ?? { totalTools: 0, totalUsers: 0, weeklyInteractions: 0 };

  const hasTools = userTools.length > 0;
  const isNewUser = !toolsLoading && !hasTools;

  // Fetch campus tools for inline preview
  const { data: campusTools = [], isLoading: campusToolsLoading } = useQuery({
    queryKey: ['campus-tools-preview'],
    queryFn: async () => {
      const res = await fetch('/api/campus/tools', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return ((data?.data?.tools || data?.tools || []) as CampusAppPreview[]).slice(0, 6);
    },
    staleTime: 5 * 60_000,
    enabled: !!user,
  });

  // Track lab_viewed
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (!toolsLoading && user && !hasTrackedView.current) {
      hasTrackedView.current = true;
      track('lab_viewed', { hasCreations: userTools.length > 0 });
    }
  }, [toolsLoading, user, userTools.length, track]);

  // Handle tool click — go to IDE (advanced editor)
  const handleToolClick = useCallback((toolId: string) => {
    router.push(`/build/${toolId}`);
  }, [router]);

  // Handle campus app click — go to browse detail
  const handleCampusAppClick = useCallback((slug: string) => {
    router.push(`/build/browse/${slug}`);
  }, [router]);

  // Handle delete tool
  const handleDeleteTool = useCallback(async (toolId: string) => {
    try {
      const response = await apiClient.delete(`/api/tools/${toolId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['my-tools'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  }, [queryClient]);

  // Invalidate tools list when a new tool is created via chat
  const handleToolCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-tools'] });
  }, [queryClient]);

  const handleViewAllTemplates = useCallback(() => {
    const spaceParam = originSpaceId ? `?spaceId=${originSpaceId}` : '';
    router.push(`/build/templates${spaceParam}`);
  }, [router, originSpaceId]);

  const handleSeeAllCampusApps = useCallback(() => {
    router.push('/build/browse');
  }, [router]);

  // Guest state
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center max-w-lg"
        >
          <h1 className="text-3xl font-semibold text-white mb-4">
            Build anything for your campus
          </h1>
          <p className="text-white/50 mb-8">
            Sign in to create polls, RSVPs, countdowns, and more for your spaces.
          </p>
          <button
            onClick={() => router.push('/enter?redirect=/build')}
            className="px-6 py-3 bg-white text-black rounded-2xl font-medium text-sm
              hover:bg-white/90 transition-colors"
          >
            Sign in to start building
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <BrandSpinner size="md" variant="gold" />
      </div>
    );
  }

  const displayTools = showAllTools ? userTools : userTools.slice(0, 8);

  return (
    <div className="min-h-screen bg-black">
      <div className="px-6 py-8">
        {/* ============================================================ */}
        {/* ACTIVE BUILDER STATE (1+ tools)                              */}
        {/* ============================================================ */}
        {hasTools && (
          <>
            {/* Header */}
            <motion.div
              variants={fadeInUpVariants}
              initial="initial"
              animate="animate"
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-[#10B981]/60" />
                <h1 className="text-xl font-medium text-white">Build</h1>
              </div>
              <button
                onClick={handleViewAllTemplates}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                  text-white/40 hover:text-white/60 bg-white/[0.04] hover:bg-white/[0.06]
                  transition-colors text-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Templates
              </button>
            </motion.div>

            {/* Chat — primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mb-8"
            >
              <LabChatView
                templates={ALL_TEMPLATES}
                originSpaceId={originSpaceId}
                spaceContext={spaceContext}
                autoPrompt={autoPrompt}
                onViewAllTemplates={handleViewAllTemplates}
                onToolCreated={handleToolCreated}
              />
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mb-6" />

            {/* Stats Bar */}
            {(stats.totalUsers > 0 || stats.weeklyInteractions > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mb-6"
              >
                <StatsBar
                  totalTools={stats.totalTools}
                  totalUsers={stats.totalUsers}
                  weeklyInteractions={stats.weeklyInteractions}
                />
              </motion.div>
            )}

            {/* Your Creations Grid */}
            <motion.div
              variants={fadeInUpVariants}
              initial="initial"
              animate="animate"
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-white/50 tracking-wide">
                  Your Creations
                </div>
                <span className="text-xs text-white/25">{stats.totalTools}</span>
              </div>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                initial="hidden"
                animate="visible"
              >
                {displayTools.map((tool) => (
                  <motion.div key={tool.id} variants={staggerItemVariants}>
                    <ToolCard
                      tool={tool}
                      onClick={handleToolClick}
                      onDelete={handleDeleteTool}
                      variant="full"
                    />
                  </motion.div>
                ))}
              </motion.div>

              {userTools.length > 8 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setShowAllTools(!showAllTools)}
                  className="mt-3 text-white/50 hover:text-white/50 text-xs transition-colors"
                >
                  {showAllTools ? 'Show less' : `View all ${userTools.length}`}
                </motion.button>
              )}
            </motion.div>

            {/* Divider before campus apps */}
            <div className="h-px bg-white/[0.06] mb-6" />

            {/* Campus Apps — inline marketplace preview */}
            <CampusAppsSection
              apps={campusTools}
              isLoading={campusToolsLoading}
              onAppClick={handleCampusAppClick}
              onSeeAll={handleSeeAllCampusApps}
              heading="Campus Apps"
            />
          </>
        )}

        {/* ============================================================ */}
        {/* NEW USER STATE (0 tools) — Full-screen chat                  */}
        {/* ============================================================ */}
        {isNewUser && (
          <>
            <LabChatView
              templates={ALL_TEMPLATES}
              originSpaceId={originSpaceId}
              spaceContext={spaceContext}
              autoPrompt={autoPrompt}
              onViewAllTemplates={handleViewAllTemplates}
              onToolCreated={handleToolCreated}
            />

            {/* Campus apps discovery for new users */}
            <div className="mt-10">
              <CampusAppsSection
                apps={campusTools}
                isLoading={campusToolsLoading}
                onAppClick={handleCampusAppClick}
                onSeeAll={handleSeeAllCampusApps}
                heading="See what others built"
              />
            </div>
          </>
        )}

        {/* Loading tools state - skeleton grid */}
        {toolsLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-24 rounded-lg bg-white/[0.06]" />
              <div className="h-8 w-16 rounded-lg bg-white/[0.06]" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
            <div className="text-xs font-medium text-white/50 tracking-wide mb-3">
              Your Creations
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[140px] rounded-lg bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
