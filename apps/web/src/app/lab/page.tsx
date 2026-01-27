'use client';

export const dynamic = 'force-dynamic';

/**
 * Builder Dashboard — Your Lab
 *
 * State-based layout:
 * - New User (0 tools): Welcome + Quick Start templates + AI prompt
 * - Active Builder (1+ tools): Your Tools grid + Quick Start chips (compact)
 *
 * Key improvements over templates-first:
 * - Returning users see their work first
 * - Templates demoted to quick-start for active builders
 * - No more query param flow - direct creation from templates
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import { apiClient } from '@/lib/api-client';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Zap,
} from 'lucide-react';
import { MOTION, staggerPresets, durationSeconds } from '@hive/tokens';
import {
  BrandSpinner,
  getQuickTemplate,
  getAvailableTemplates,
  type QuickTemplate,
} from '@hive/ui';

import { ToolCard, NewToolCard, type ToolData } from '@/components/hivelab/dashboard/ToolCard';
import { QuickStartChips } from '@/components/hivelab/dashboard/QuickStartChips';
import {
  createBlankTool,
  createToolFromTemplateApi,
  generateToolName,
} from '@/lib/hivelab/create-tool';

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

// Fetch user's tools
async function fetchUserTools(): Promise<ToolData[]> {
  const response = await apiClient.get('/api/tools');
  if (!response.ok) throw new Error('Failed to fetch tools');
  const data = await response.json();
  return (data.tools || []) as ToolData[];
}

// Submit loading state (simplified - no ceremony)
type CeremonyPhase = 'idle' | 'creating';

/**
 * WordReveal — Word-by-word text animation
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
 * GoldBorderInput — Input with animated gold border on focus
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
          className="absolute top-0 left-0 right-0 h-px bg-[var(--life-gold)]/20"
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
          className="absolute bottom-0 left-0 right-0 h-px bg-[var(--life-gold)]/20"
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
          className="absolute top-0 bottom-0 left-0 w-px bg-[var(--life-gold)]/20"
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
          className="absolute top-0 bottom-0 right-0 w-px bg-[var(--life-gold)]/20"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isFocused ? 1 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : DURATION.base,
            delay: borderDelay + 0.3,
            ease: EASE,
          }}
          style={{ transformOrigin: 'bottom' }}
        />

        {/* Glow effect on focus */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: DURATION.fast }}
          style={{
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.1), inset 0 0 20px rgba(255, 215, 0, 0.02)',
          }}
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

      {/* Sparkle hint */}
      <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5
        bg-[var(--bg-ground,#0A0A09)] text-white/40 text-xs">
        <Sparkles className="w-3 h-3" />
        <span>AI-powered</span>
      </div>
    </div>
  );
}

export default function BuilderDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [ceremonyPhase, setCeremonyPhase] = useState<CeremonyPhase>('idle');
  const [statusText, setStatusText] = useState('');
  const [titleRevealed, setTitleRevealed] = useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Preserve space context when arriving from a space's "Build Tool" button
  const originSpaceId = searchParams.get('spaceId');
  const deploySurface = searchParams.get('deploy'); // 'sidebar' when from space

  // Get featured templates
  const featuredTemplates = FEATURED_TEMPLATE_IDS
    .map(id => getQuickTemplate(id))
    .filter((t): t is QuickTemplate => t !== undefined);

  // Get all available templates for quick-start chips
  const allTemplates = React.useMemo(() => getAvailableTemplates().slice(0, 8), []);

  // Fetch user's tools
  const { data: userTools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ['personal-tools', user?.uid],
    queryFn: fetchUserTools,
    enabled: !!user,
    staleTime: 60000,
  });

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

  // Handle submit - instant feedback, no ceremony
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || ceremonyPhase !== 'idle') return;

    const toolName = generateToolName(prompt);
    setCeremonyPhase('creating');
    setStatusText(`Creating ${toolName}...`);

    try {
      const toolId = await createBlankTool(toolName, prompt);
      const encodedPrompt = encodeURIComponent(prompt.trim());
      // Preserve space context for deploy pre-selection
      const spaceParam = originSpaceId ? `&spaceId=${originSpaceId}` : '';
      router.push(`/lab/${toolId}?new=true&prompt=${encodedPrompt}${spaceParam}`);
    } catch (error) {
      toast.error('Failed to create tool');
      setCeremonyPhase('idle');
      setStatusText('');
    }
  }, [prompt, ceremonyPhase, router, originSpaceId]);

  // Handle template click - create tool and redirect to IDE
  const handleTemplateClick = useCallback(async (template: QuickTemplate) => {
    if (ceremonyPhase !== 'idle' || creatingFromTemplate) return;

    setCreatingFromTemplate(true);
    setCeremonyPhase('creating');
    setStatusText(`Creating ${template.name}...`);

    try {
      const toolId = await createToolFromTemplateApi(template);
      // Preserve space context for deploy pre-selection
      const spaceParam = originSpaceId ? `?spaceId=${originSpaceId}` : '';
      router.push(`/lab/${toolId}${spaceParam}`);
    } catch (error) {
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

  // Handle new tool button
  const handleNewTool = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

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
            Sign in to create polls, RSVPs, countdowns, and more with AI.
          </p>
          <button
            onClick={() => router.push('/enter?redirect=/lab')}
            className="px-6 py-3 bg-white text-black rounded-full font-medium
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

  return (
    <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ============================================================ */}
        {/* ACTIVE BUILDER STATE (1+ tools) */}
        {/* ============================================================ */}
        {hasTools && (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex items-center justify-between mb-6"
            >
              <h1 className="text-xl font-medium text-white">Your Lab</h1>
              <button
                onClick={handleNewTool}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]
                  transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </motion.div>

            {/* Your Tools Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05, ease: EASE }}
              className="mb-8"
            >
              <div className="text-xs font-medium text-white/40 tracking-wide mb-3">
                Your Tools
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {userTools.slice(0, 7).map((tool, index) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={handleToolClick}
                    index={index}
                  />
                ))}
                <NewToolCard onClick={handleNewTool} index={userTools.length} />
              </div>

              {/* View all link if more than 7 tools */}
              {userTools.length > 7 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => router.push('/lab/library')}
                  className="mt-3 text-white/40 hover:text-white/60 text-xs transition-colors"
                >
                  View all {userTools.length} tools →
                </motion.button>
              )}
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mb-6" />

            {/* Quick Start Chips (compact for active builders) */}
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

            {/* AI Prompt (collapsed for active builders) */}
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
                  placeholder="Or describe what you need..."
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

              {/* Status text during ceremony */}
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
        {/* NEW USER STATE (0 tools) */}
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
                  'Welcome to your Lab'
                ) : (
                  <WordReveal
                    text="Welcome to your Lab"
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
                Build tools your space will actually use
              </motion.p>
            </motion.div>

            {/* Quick Start Templates Grid (primary for new users) */}
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
                or describe what you need
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </motion.div>

            {/* AI Prompt Section (secondary for new users) */}
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
                  placeholder="Describe the tool you need..."
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

              {/* Status text during ceremony */}
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
            <div className="text-xs font-medium text-white/40 tracking-wide mb-3">
              Your Tools
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-white/[0.03] animate-pulse"
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
