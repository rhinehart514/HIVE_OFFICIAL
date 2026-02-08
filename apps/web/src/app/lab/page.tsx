'use client';

export const dynamic = 'force-dynamic';

/**
 * Creator Dashboard — Your Lab
 *
 * State-based layout:
 * - New User (0 tools): Inspiring hero + templates + AI prompt
 * - Active Builder (1+ tools): Stats bar + tool grid + quick actions
 *
 * Uses /api/tools/my-tools for aggregated stats per tool.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hive/auth-logic';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Zap,
  LayoutGrid,
} from 'lucide-react';
import { MOTION, staggerPresets, durationSeconds } from '@hive/tokens';
import { staggerContainerVariants, staggerItemVariants, fadeInUpVariants } from '@hive/ui/lib/motion-variants';
import {
  BrandSpinner,
  getQuickTemplate,
  getAvailableTemplates,
  type QuickTemplate,
} from '@hive/ui';

import { ToolCard, NewToolCard } from '@/components/hivelab/dashboard/ToolCard';
import { StatsBar } from '@/components/hivelab/dashboard/StatsBar';
import { BuilderLevel } from '@/components/hivelab/dashboard/BuilderLevel';
import { QuickStartChips } from '@/components/hivelab/dashboard/QuickStartChips';
import { useMyTools } from '@/hooks/use-my-tools';
import {
  createToolFromTemplateApi,
} from '@/lib/hivelab/create-tool';
import { apiClient } from '@/lib/api-client';

// Premium easing
const EASE = MOTION.ease.premium;

// Convenient aliases for duration
const DURATION = {
  fast: durationSeconds.quick,
  base: durationSeconds.standard,
  slow: durationSeconds.slow,
};

// Stagger for word reveals
const STAGGER = staggerPresets;

// Featured template IDs (shown for new users)
const FEATURED_TEMPLATE_IDS = [
  'quick-poll',
  'event-rsvp',
  'event-countdown',
  'member-leaderboard',
  'study-group-signup',
];

// Submit loading state
type CeremonyPhase = 'idle' | 'creating';

/**
 * WordReveal -- Word-by-word text animation
 */
function WordReveal({
  text,
  className,
  delay = 0,
  stagger = STAGGER.word,
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
  const totalDuration = delay + (words.length * stagger) + DURATION.fast;

  useEffect(() => {
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
            duration: DURATION.fast,
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
 * GoldBorderInput -- Input with animated gold border on focus
 */
function GoldBorderInput({
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  disabled,
  isFocused,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled: boolean;
  isFocused: boolean;
  placeholder: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const shouldReduceMotion = useReducedMotion();
  const borderDelay = 0;

  return (
    <div className="relative">
      {/* Gold border container */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Top border */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-white/20"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : DURATION.base,
            delay: borderDelay,
            ease: EASE,
          }}
          style={{ transformOrigin: 'left' }}
        />
        {/* Bottom border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-white/20"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : DURATION.base,
            delay: borderDelay + 0.1,
            ease: EASE,
          }}
          style={{ transformOrigin: 'right' }}
        />
        {/* Left border */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 w-px bg-white/20"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isFocused ? 1 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : DURATION.base,
            delay: borderDelay + 0.2,
            ease: EASE,
          }}
          style={{ transformOrigin: 'top' }}
        />
        {/* Right border */}
        <motion.div
          className="absolute top-0 bottom-0 right-0 w-px bg-white/20"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isFocused ? 1 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : DURATION.base,
            delay: borderDelay + 0.3,
            ease: EASE,
          }}
          style={{ transformOrigin: 'bottom' }}
        />

        {/* Input container */}
        <div
          className={`
            relative rounded-2xl border transition-colors duration-200
            ${isFocused
              ? 'border-white/20 bg-white/[0.05]'
              : 'border-white/10 bg-white/[0.03]'
            }
          `}
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={2}
            disabled={disabled}
            className="w-full px-5 py-4 pr-14 bg-transparent text-white placeholder-white/30
              resize-none outline-none text-base leading-relaxed"
          />
        </div>
      </div>

      {/* Start hint */}
      <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5
        bg-[var(--bg-ground,#0A0A09)] text-white/40 text-xs">
        <Sparkles className="w-3 h-3" />
        <span>Quick start</span>
      </div>
    </div>
  );
}

export default function BuilderDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [ceremonyPhase, setCeremonyPhase] = useState<CeremonyPhase>('idle');
  const [statusText, setStatusText] = useState('');
  const [titleRevealed, setTitleRevealed] = useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Preserve space context when arriving from a space's "Build Tool" button
  const originSpaceId = searchParams.get('spaceId');

  // Get featured templates
  const featuredTemplates = FEATURED_TEMPLATE_IDS
    .map(id => getQuickTemplate(id))
    .filter((t): t is QuickTemplate => t !== undefined);

  // Get all available templates for quick-start chips
  const allTemplates = React.useMemo(() => getAvailableTemplates().slice(0, 8), []);

  // Fetch user's tools with aggregated stats
  const { data, isLoading: toolsLoading } = useMyTools();
  const userTools = data?.tools ?? [];
  const stats = data?.stats ?? { totalTools: 0, totalUsers: 0, weeklyInteractions: 0 };

  const hasTools = userTools.length > 0;
  const isNewUser = !toolsLoading && !hasTools;

  // Focus input after title reveals (only for new users)
  useEffect(() => {
    if (!authLoading && user && titleRevealed && inputRef.current && isNewUser) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, titleRevealed, isNewUser]);

  // Handle submit — route to conversational creation page
  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || ceremonyPhase !== 'idle') return;

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const spaceParam = originSpaceId ? `&spaceId=${originSpaceId}` : '';
    router.push(`/lab/new?prompt=${encodedPrompt}${spaceParam}`);
  }, [prompt, ceremonyPhase, router, originSpaceId]);

  // Handle template click
  const handleTemplateClick = useCallback(async (template: QuickTemplate) => {
    if (ceremonyPhase !== 'idle' || creatingFromTemplate) return;

    setCreatingFromTemplate(true);
    setCeremonyPhase('creating');
    setStatusText(`Creating ${template.name}...`);

    try {
      const toolId = await createToolFromTemplateApi(template);
      const spaceParam = originSpaceId ? `?spaceId=${originSpaceId}` : '';
      router.push(`/lab/${toolId}${spaceParam}`);
    } catch {
      toast.error('Failed to create tool from template');
      setCeremonyPhase('idle');
      setCreatingFromTemplate(false);
      setStatusText('');
    }
  }, [ceremonyPhase, creatingFromTemplate, router, originSpaceId]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Handle tool click
  const handleToolClick = useCallback((toolId: string) => {
    router.push(`/lab/${toolId}`);
  }, [router]);

  // Handle new tool button — go to conversational creation
  const handleNewTool = useCallback(() => {
    const spaceParam = originSpaceId ? `?spaceId=${originSpaceId}` : '';
    router.push(`/lab/new${spaceParam}`);
  }, [router, originSpaceId]);

  // Handle delete tool
  const handleDeleteTool = useCallback(async (toolId: string) => {
    try {
      const response = await apiClient.delete(`/api/tools/${toolId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete tool');
      }
      toast.success('Tool deleted');
      queryClient.invalidateQueries({ queryKey: ['my-tools'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tool');
    }
  }, [queryClient]);

  // Guest state
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg-ground,#0A0A09)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center max-w-lg"
        >
          <h1 className="text-3xl font-semibold text-white mb-4">
            Build tools for your campus
          </h1>
          <p className="text-white/50 mb-8">
            Sign in to create polls, RSVPs, countdowns, and more for your spaces.
          </p>
          <button
            onClick={() => router.push('/enter?redirect=/lab')}
            className="px-6 py-3 bg-white text-[var(--color-bg-void,#0A0A09)] rounded-xl font-medium
              hover:bg-white/90 transition-colors"
          >
            Sign in to start building
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (authLoading || creatingFromTemplate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-ground,#0A0A09)]">
        <BrandSpinner size="md" variant="gold" />
        {creatingFromTemplate && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-white/60 text-sm"
          >
            {statusText || 'Creating tool...'}
          </motion.p>
        )}
      </div>
    );
  }

  const isSubmitting = ceremonyPhase !== 'idle';
  const showStatus = ceremonyPhase === 'creating';
  const displayTools = showAllTools ? userTools : userTools.slice(0, 8);

  return (
    <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
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
                <LayoutGrid className="w-5 h-5 text-white/40" />
                <h1 className="text-xl font-medium text-white">Your Lab</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/lab/templates')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    text-white/50 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.06]
                    transition-colors text-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Templates
                </button>
                <button
                  onClick={handleNewTool}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.10]
                    transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Tool
                </button>
              </div>
            </motion.div>

            {/* Stats Bar + Builder Level */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mb-6 space-y-3"
            >
              <StatsBar
                totalTools={stats.totalTools}
                totalUsers={stats.totalUsers}
                weeklyInteractions={stats.weeklyInteractions}
              />
              <BuilderLevel />
            </motion.div>

            {/* Your Tools Grid */}
            <motion.div
              variants={fadeInUpVariants}
              initial="initial"
              animate="animate"
              className="mb-8"
            >
              <div className="text-xs font-medium text-white/40 tracking-wide mb-3">
                Your Tools
              </div>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                variants={staggerContainerVariants}
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
                <motion.div variants={staggerItemVariants}>
                  <NewToolCard onClick={handleNewTool} />
                </motion.div>
              </motion.div>

              {/* View all / collapse */}
              {userTools.length > 8 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setShowAllTools(!showAllTools)}
                  className="mt-3 text-white/40 hover:text-white/60 text-xs transition-colors"
                >
                  {showAllTools ? 'Show less' : `View all ${userTools.length} tools`}
                </motion.button>
              )}
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mb-6" />

            {/* Quick Start Chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: EASE }}
              className="mb-8"
            >
              <QuickStartChips
                templates={allTemplates}
                onTemplateClick={handleTemplateClick}
                onViewAll={() => router.push('/lab/templates')}
                disabled={isSubmitting}
                variant="secondary"
              />
            </motion.div>

            {/* AI Prompt */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="max-w-xl"
            >
              <div className="relative">
                <GoldBorderInput
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isSubmitting}
                  isFocused={isFocused}
                  placeholder="Or name a new tool..."
                  inputRef={inputRef}
                />

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isSubmitting}
                  className="absolute right-3 bottom-3 p-2.5 rounded-xl
                    disabled:cursor-not-allowed transition-all duration-200"
                  animate={{
                    backgroundColor: isSubmitting
                      ? 'rgba(255, 215, 0, 0.1)'
                      : prompt.trim()
                        ? 'rgba(255, 255, 255, 1)'
                        : 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="spinner"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.1 }}
                      >
                        <BrandSpinner size="sm" variant="gold" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="arrow"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.1 }}
                      >
                        <ArrowRight className={`w-5 h-5 ${prompt.trim() ? 'text-black' : 'text-white/40'}`} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Dimming overlay during ceremony */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none bg-[var(--bg-ground,#0A0A09)]"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: showStatus ? 0.4 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Status text */}
              <AnimatePresence>
                {showStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="flex justify-center mt-4"
                  >
                    <span className="text-[var(--life-gold)]/80 text-sm font-medium">
                      {statusText}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* ============================================================ */}
        {/* NEW USER STATE (0 tools)                                     */}
        {/* ============================================================ */}
        {isNewUser && (
          <>
            {/* Welcome Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-center mb-10 pt-8"
            >
              <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2">
                {shouldReduceMotion ? (
                  'Build something your campus will use'
                ) : (
                  <WordReveal
                    text="Build something your campus will use"
                    stagger={0.06}
                    onComplete={() => setTitleRevealed(true)}
                  />
                )}
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: titleRevealed || shouldReduceMotion ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-white/50 text-sm"
              >
                Polls, sign-ups, countdowns, leaderboards -- no coding required
              </motion.p>
            </motion.div>

            {/* Value prop */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.15, ease: EASE }}
              className="mb-10 max-w-2xl mx-auto"
            >
              <div
                className="rounded-2xl border p-6"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-sm font-medium mb-4"
                  style={{ color: 'var(--text-secondary, rgba(255,255,255,0.7))' }}
                >
                  Build interactive tools for your spaces -- polls, sign-ups, generators, and more.
                  No coding required.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Engage members', desc: 'Polls, quizzes, and reactions that drive participation' },
                    { label: 'Organize events', desc: 'RSVPs, countdowns, and sign-up sheets' },
                    { label: 'Track progress', desc: 'Leaderboards, task lists, and group trackers' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    >
                      <p
                        className="text-xs font-medium mb-1"
                        style={{ color: 'var(--text-primary, white)' }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--text-tertiary, rgba(255,255,255,0.4))' }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Quick Start Templates Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
              className="mb-10"
            >
              <QuickStartChips
                templates={featuredTemplates}
                onTemplateClick={handleTemplateClick}
                onViewAll={() => router.push('/lab/templates')}
                disabled={isSubmitting}
                variant="primary"
              />
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 0.4 }}
              className="flex items-center gap-4 mb-8 max-w-xl mx-auto"
            >
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-white/30 text-xs tracking-wide">
                or start from scratch
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </motion.div>

            {/* AI Prompt Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.5, ease: EASE }}
              className="max-w-xl mx-auto"
            >
              <div className="relative">
                <GoldBorderInput
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isSubmitting}
                  isFocused={isFocused}
                  placeholder="Name your tool to get started..."
                  inputRef={inputRef}
                />

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isSubmitting}
                  className="absolute right-3 bottom-3 p-2.5 rounded-xl
                    disabled:cursor-not-allowed transition-all duration-200"
                  animate={{
                    backgroundColor: isSubmitting
                      ? 'rgba(255, 215, 0, 0.1)'
                      : prompt.trim()
                        ? 'rgba(255, 255, 255, 1)'
                        : 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="spinner"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.1 }}
                      >
                        <BrandSpinner size="sm" variant="gold" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="arrow"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.1 }}
                      >
                        <ArrowRight className={`w-5 h-5 ${prompt.trim() ? 'text-black' : 'text-white/40'}`} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Dimming overlay */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none bg-[var(--bg-ground,#0A0A09)]"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: showStatus ? 0.4 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Status text */}
              <AnimatePresence>
                {showStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="flex justify-center mt-4"
                  >
                    <span className="text-[var(--life-gold)]/80 text-sm font-medium">
                      {statusText}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Empty state hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.7 }}
              className="text-center py-12 mt-8"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/[0.05]
                flex items-center justify-center">
                <Zap className="w-6 h-6 text-white/30" />
              </div>
              <p className="text-white/30 text-sm">
                Tools you create will appear here
              </p>
            </motion.div>
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
              <div className="h-6 w-24 rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="h-8 w-16 rounded-lg bg-white/[0.04] animate-pulse" />
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/[0.03] animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
            <div className="text-xs font-medium text-white/40 tracking-wide mb-3">
              Your Tools
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[140px] rounded-xl bg-white/[0.03] animate-pulse"
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
