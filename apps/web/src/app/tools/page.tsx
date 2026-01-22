'use client';

export const dynamic = 'force-dynamic';

/**
 * HiveLab Landing Page — Dramatic Arc
 *
 * "What do you want to build?" with ceremony.
 * WordReveal title, gold border on focus, staggered chips,
 * submit ceremony with status narration.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import { apiClient } from '@/lib/api-client';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  Vote,
  Users,
  FileText,
  BarChart3,
  Calendar,
  Zap,
} from 'lucide-react';
import { MOTION, staggerPresets, durationSeconds } from '@hive/tokens';
import { BrandSpinner } from '@hive/ui';

// Premium easing
const EASE = MOTION.ease.premium;

// Convenient aliases for duration
const DURATION = {
  fast: durationSeconds.quick, // 0.2s
  base: durationSeconds.standard, // 0.3s
  slow: durationSeconds.slow, // 0.8s
};

// Stagger for word reveals
const STAGGER = staggerPresets;

// Suggestion chips with icons
const SUGGESTIONS = [
  { label: 'Poll', icon: Vote, prompt: 'Create a poll to gather opinions' },
  { label: 'RSVP', icon: Users, prompt: 'Create an RSVP for an event' },
  { label: 'Countdown', icon: Clock, prompt: 'Create a countdown timer' },
  { label: 'Survey', icon: FileText, prompt: 'Create a feedback survey' },
  { label: 'Leaderboard', icon: BarChart3, prompt: 'Create a leaderboard' },
  { label: 'Signup', icon: Calendar, prompt: 'Create a signup form' },
];

interface UserTool {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'deployed';
  updatedAt: Date | string;
}

// Fetch user's tools
async function fetchUserTools(): Promise<UserTool[]> {
  const response = await apiClient.get('/api/tools');
  if (!response.ok) throw new Error('Failed to fetch tools');
  const data = await response.json();
  return (data.tools || []) as UserTool[];
}

// Submit ceremony phases
type CeremonyPhase = 'idle' | 'morphing' | 'dimming' | 'creating' | 'building' | 'redirecting';

// Generate a tool name from prompt (first 3-4 words)
function generateToolName(prompt: string): string {
  const words = prompt.trim().split(/\s+/).slice(0, 4);
  const title = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return title || 'New Tool';
}

// Create tool via API
async function createTool(name: string, description?: string): Promise<string> {
  const response = await fetch('/api/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: name || 'Untitled Tool',
      description: description || '',
      status: 'draft',
      type: 'visual',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create tool');
  }

  const data = await response.json();
  return data.tool.id;
}

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
          className="absolute top-0 left-0 right-0 h-px bg-[var(--color-gold,#FFD700)]/20"
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
          className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-gold,#FFD700)]/20"
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
          className="absolute top-0 bottom-0 left-0 w-px bg-[var(--color-gold,#FFD700)]/20"
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
          className="absolute top-0 bottom-0 right-0 w-px bg-[var(--color-gold,#FFD700)]/20"
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
            rows={3}
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

export default function HiveLabLanding() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [ceremonyPhase, setCeremonyPhase] = useState<CeremonyPhase>('idle');
  const [statusText, setStatusText] = useState('');
  const [titleRevealed, setTitleRevealed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Fetch user's tools
  const { data: userTools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ['personal-tools', user?.uid],
    queryFn: fetchUserTools,
    enabled: !!user,
    staleTime: 60000,
  });

  // Focus input after title reveals
  useEffect(() => {
    if (!authLoading && user && titleRevealed && inputRef.current) {
      // Small delay to let the user see the title
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, titleRevealed]);

  // Handle submit with ceremony
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || ceremonyPhase !== 'idle') return;

    const toolName = generateToolName(prompt);

    // Ceremony timeline
    // 0ms - Click detected
    setCeremonyPhase('morphing');

    // 200ms - Button morphs to gold spinner, dimming starts (per DRAMA plan)
    setTimeout(() => {
      setCeremonyPhase('dimming');
    }, 200);

    // 300ms - Input text dims (handled by CSS)
    // 400ms - Status appears
    setTimeout(() => {
      setCeremonyPhase('creating');
      setStatusText('Creating...');
    }, 400);

    // 600ms - Status changes
    setTimeout(() => {
      setCeremonyPhase('building');
      setStatusText(`Building ${toolName}...`);
    }, 600);

    // Actually create the tool
    try {
      const toolId = await createTool(toolName, prompt);

      // 800ms minimum hold before redirect
      setTimeout(() => {
        setCeremonyPhase('redirecting');
        const encodedPrompt = encodeURIComponent(prompt.trim());
        router.push(`/tools/${toolId}?new=true&prompt=${encodedPrompt}`);
      }, 800);
    } catch (error) {
      toast.error('Failed to create tool');
      setCeremonyPhase('idle');
      setStatusText('');
    }
  }, [prompt, ceremonyPhase, router]);

  // Handle suggestion click
  const handleSuggestion = useCallback((suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
    // Focus input and let user submit
    inputRef.current?.focus();
  }, []);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Handle tool click
  const handleToolClick = useCallback((toolId: string) => {
    router.push(`/tools/${toolId}`);
  }, [router]);

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
            onClick={() => router.push('/enter?redirect=/tools')}
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
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-ground,#0A0A09)]">
        <BrandSpinner size="md" variant="neutral" />
      </div>
    );
  }

  const isSubmitting = ceremonyPhase !== 'idle';
  const showStatus = ceremonyPhase === 'creating' || ceremonyPhase === 'building' || ceremonyPhase === 'redirecting';

  return (
    <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)]">
      {/* Hero Section - Centered Input */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="w-full max-w-2xl"
        >
          {/* Title with WordReveal */}
          <h1 className="text-center text-2xl sm:text-3xl font-medium text-white mb-8">
            {shouldReduceMotion ? (
              'What do you want to build?'
            ) : (
              <WordReveal
                text="What do you want to build?"
                stagger={0.06} // 60ms per word (DRAMA plan: 50-80ms)
                onComplete={() => setTitleRevealed(true)}
              />
            )}
          </h1>

          {/* Input Container with Gold Border */}
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

            {/* Input text dimming during ceremony */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none bg-[var(--bg-ground,#0A0A09)]"
              initial={{ opacity: 0 }}
              animate={{
                opacity: ceremonyPhase === 'dimming' || ceremonyPhase === 'creating' || ceremonyPhase === 'building' || ceremonyPhase === 'redirecting'
                  ? 0.4
                  : 0,
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
                <span className="text-[var(--color-gold,#FFD700)]/80 text-sm font-medium">
                  {statusText}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestion Chips - Staggered entrance */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {SUGGESTIONS.map((suggestion, index) => (
              <motion.button
                key={suggestion.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: DURATION.fast,
                  delay: shouldReduceMotion ? 0 : 0.6 + (index * 0.1), // First at 600ms, 100ms between
                  ease: EASE,
                }}
                onClick={() => handleSuggestion(suggestion.prompt)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-full
                  border border-white/10 bg-white/[0.02]
                  hover:border-white/20 hover:bg-white/[0.05]
                  text-white/60 hover:text-white/80
                  transition-all duration-200 text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <suggestion.icon className="w-4 h-4" />
                {suggestion.label}
              </motion.button>
            ))}
          </div>

          {/* Or start from template */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.fast, delay: shouldReduceMotion ? 0 : 1.2 }}
            className="flex justify-center mt-6"
          >
            <button
              onClick={() => router.push('/tools/templates')}
              disabled={isSubmitting}
              className="text-white/40 hover:text-white/60 text-sm transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Or browse templates →
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Your Tools Section */}
      <div className="px-6 pb-12 max-w-4xl mx-auto">
        <AnimatePresence>
          {userTools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">
                  Your Tools
                </h2>
                <button
                  onClick={() => router.push('/tools/new')}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white/60
                    text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {userTools.slice(0, 6).map((tool, index) => (
                  <motion.button
                    key={tool.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: shouldReduceMotion ? 0 : 0.1 + index * 0.05,
                      ease: EASE,
                    }}
                    onClick={() => handleToolClick(tool.id)}
                    className="flex flex-col items-start p-4 rounded-xl
                      border border-white/[0.06] bg-white/[0.02]
                      hover:border-white/10 hover:bg-white/[0.04]
                      transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-white font-medium truncate pr-2">
                        {tool.name || 'Untitled Tool'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide
                        ${tool.status === 'deployed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : tool.status === 'published'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-white/10 text-white/40'
                        }`}>
                        {tool.status}
                      </span>
                    </div>
                    {tool.description && (
                      <p className="text-white/40 text-sm line-clamp-2">
                        {tool.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-auto pt-3 text-white/30 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(tool.updatedAt)}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* View All */}
              {userTools.length > 6 && (
                <button
                  onClick={() => router.push('/tools/library')}
                  className="w-full mt-3 py-3 text-white/40 hover:text-white/60
                    text-sm transition-colors border border-white/[0.06] rounded-xl
                    hover:border-white/10"
                >
                  View all {userTools.length} tools →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state for new users */}
        {!toolsLoading && userTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.3 }}
            className="text-center py-12"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/[0.05]
              flex items-center justify-center">
              <Zap className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white/30 text-sm">
              Tools you create will appear here
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Helper function for relative time
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
