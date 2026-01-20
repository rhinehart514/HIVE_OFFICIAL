'use client';

export const dynamic = 'force-dynamic';

/**
 * HiveLab Landing Page — ChatGPT-style
 *
 * Centered AI input as hero. Suggestion chips below.
 * Your tools in a subtle grid. Clean, minimal, AI-first.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import { apiClient } from '@/lib/api-client';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  BarChart3,
  Vote,
  Users,
  Calendar,
  FileText,
  Zap,
} from 'lucide-react';

// Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

// Suggestion chips
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

export default function HiveLabLanding() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user's tools
  const { data: userTools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ['personal-tools', user?.uid],
    queryFn: fetchUserTools,
    enabled: !!user,
    staleTime: 60000,
  });

  // Focus input on mount
  useEffect(() => {
    if (!authLoading && user && inputRef.current) {
      inputRef.current.focus();
    }
  }, [authLoading, user]);

  // Handle prompt submission
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      // Navigate to the IDE with prompt as URL param
      const encodedPrompt = encodeURIComponent(prompt.trim());
      router.push(`/tools/new?prompt=${encodedPrompt}`);
    } catch (error) {
      toast.error('Failed to start generation');
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, router]);

  // Handle suggestion click
  const handleSuggestion = useCallback((suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const encodedPrompt = encodeURIComponent(suggestionPrompt);
      router.push(`/tools/new?prompt=${encodedPrompt}`);
    }, 100);
  }, [router]);

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
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

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
          {/* Title */}
          <h1 className="text-center text-2xl sm:text-3xl font-medium text-white mb-8">
            What do you want to build?
          </h1>

          {/* Input Container */}
          <div className="relative">
            <div
              className="relative rounded-2xl border border-white/10 bg-white/[0.03]
                focus-within:border-white/20 focus-within:bg-white/[0.05]
                transition-all duration-200"
            >
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the tool you need..."
                rows={3}
                disabled={isGenerating}
                className="w-full px-5 py-4 pr-14 bg-transparent text-white placeholder-white/30
                  resize-none outline-none text-base leading-relaxed"
              />

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isGenerating}
                className="absolute right-3 bottom-3 p-2.5 rounded-xl
                  bg-white text-black disabled:bg-white/20 disabled:text-white/40
                  hover:bg-white/90 transition-all duration-200
                  disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Sparkle hint */}
            <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5
              bg-[var(--bg-ground,#0A0A09)] text-white/40 text-xs">
              <Sparkles className="w-3 h-3" />
              <span>AI-powered</span>
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.label}
                onClick={() => handleSuggestion(suggestion.prompt)}
                className="flex items-center gap-2 px-4 py-2 rounded-full
                  border border-white/10 bg-white/[0.02]
                  hover:border-white/20 hover:bg-white/[0.05]
                  text-white/60 hover:text-white/80
                  transition-all duration-200 text-sm"
              >
                <suggestion.icon className="w-4 h-4" />
                {suggestion.label}
              </button>
            ))}
          </div>

          {/* Or start from template */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => router.push('/tools/templates')}
              className="text-white/40 hover:text-white/60 text-sm transition-colors"
            >
              Or browse templates →
            </button>
          </div>
        </motion.div>
      </div>

      {/* Your Tools Section */}
      <div className="px-6 pb-12 max-w-4xl mx-auto">
        <AnimatePresence>
          {userTools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
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
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05, ease: EASE }}
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
            transition={{ duration: 0.5, delay: 0.3 }}
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
