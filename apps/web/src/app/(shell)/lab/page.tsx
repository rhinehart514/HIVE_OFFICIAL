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
  LayoutGrid,
  Users,
  CalendarDays,
  MessageSquare,
  Trophy,
  BarChart3,
  Check,
  Link2,
  Pencil,
  Rocket,
} from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';
import {
  BrandSpinner,
  ToolCanvas,
  getQuickTemplate,
  getAvailableTemplates,
  getTemplatesForInterests,
  type QuickTemplate,
  type ToolElement,
} from '@hive/ui';

import { ToolCard, NewToolCard } from '@/components/hivelab/dashboard/ToolCard';
import { StatsBar } from '@/components/hivelab/dashboard/StatsBar';
import { BuilderLevel } from '@/components/hivelab/dashboard/BuilderLevel';
import { QuickStartChips } from '@/components/hivelab/dashboard/QuickStartChips';
import { matchTemplate } from '@/components/hivelab/conversational/template-matcher';
import { useMyTools } from '@/hooks/use-my-tools';
import { useCurrentProfile } from '@/hooks/queries';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  createBlankTool,
  createToolFromTemplateApi,
  generateToolName,
} from '@/lib/hivelab/create-tool';
import { apiClient } from '@/lib/api-client';
import type { StreamingChunk } from '@/lib/ai-generator';

// Premium easing
const EASE = MOTION.ease.premium;

// Convenient aliases for duration
const DURATION = {
  fast: durationSeconds.quick,
  base: durationSeconds.standard,
  slow: durationSeconds.slow,
};

const fadeInUpVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

const _listVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 1, transition: { staggerChildren: 0.04 } },
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const staggerItemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
};

// Curated library sections — casual-first, org-leader last
const LIBRARY_SECTIONS = [
  {
    id: 'settle',
    title: 'Settle It',
    desc: 'Debates, rankings, "who\'s right" votes',
    Icon: Trophy,
    templateIds: ['quick-poll', 'anonymous-qa', 'feedback-form'],
  },
  {
    id: 'plan',
    title: 'Plan It',
    desc: 'Road trips, nights out, group decisions',
    Icon: CalendarDays,
    templateIds: ['event-rsvp', 'event-countdown', 'event-checkin'],
  },
  {
    id: 'fill',
    title: 'Fill It',
    desc: 'Cookout contributions, carpool slots, signups',
    Icon: Users,
    templateIds: ['study-group-signup', 'resource-signup', 'study-group-matcher'],
  },
  {
    id: 'engage',
    title: 'Game It',
    desc: 'Brackets, survivor votes, leaderboards',
    Icon: BarChart3,
    templateIds: ['member-leaderboard', 'member-spotlight', 'suggestion-box'],
  },
  {
    id: 'run',
    title: 'Run It',
    desc: 'Org meetings, elections, dues, events',
    Icon: MessageSquare,
    templateIds: ['meeting-agenda', 'meeting-notes', 'attendance-tracker'],
  },
];

// Submit loading state
type CeremonyPhase = 'idle' | 'creating';

// Inline generation phases
type InlineGenPhase = 'idle' | 'creating-tool' | 'streaming' | 'complete' | 'error';

/**
 * InlineGenerationPreview — Streams AI generation directly on the Lab page.
 * Shows live ToolCanvas preview as elements arrive, then share/edit CTAs.
 */
function InlineGenerationPreview({
  prompt,
  toolId,
  onComplete,
  onError,
  onShareLink,
  onEditInStudio,
  onDeploy,
}: {
  prompt: string;
  toolId: string;
  onComplete: (elements: ToolElement[], name: string) => void;
  onError: (msg: string) => void;
  onShareLink: () => void;
  onEditInStudio: () => void;
  onDeploy: () => void;
}) {
  const [phase, setPhase] = useState<'streaming' | 'complete' | 'error'>('streaming');
  const [statusMessage, setStatusMessage] = useState('AI is thinking...');
  const [elements, setElements] = useState<ToolElement[]>([]);
  const [toolName, setToolName] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const response = await fetch('/api/tools/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || err.error || `Generation failed (${response.status})`);
        }
        if (!response.body) throw new Error('No response stream');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const collected: ToolElement[] = [];
        let completeName = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const chunk: StreamingChunk = JSON.parse(trimmed);

              switch (chunk.type) {
                case 'thinking':
                  setStatusMessage((chunk.data.message as string) || 'Thinking...');
                  break;

                case 'element': {
                  const elData = chunk.data;
                  if (elData.refinementAction) break;

                  const newEl: ToolElement = {
                    elementId: (elData.type as string) || (elData.elementId as string),
                    instanceId: (elData.id as string) || (elData.instanceId as string) || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    config: (elData.config as Record<string, unknown>) || {},
                    position: elData.position as { x: number; y: number } | undefined,
                    size: elData.size as { width: number; height: number } | undefined,
                  };
                  collected.push(newEl);
                  setElements([...collected]);

                  const displayName = (elData.name as string) || newEl.elementId;
                  setStatusMessage(`Adding ${displayName}...`);
                  break;
                }

                case 'connection':
                  setStatusMessage('Connecting elements...');
                  break;

                case 'complete':
                  completeName = (chunk.data.name as string) || '';
                  setToolName(completeName);
                  setPhase('complete');
                  setStatusMessage('Your creation is ready');
                  break;

                case 'error':
                  throw new Error((chunk.data.error as string) || 'Generation failed');
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }

        onComplete(collected, completeName);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Generation failed';
        setPhase('error');
        setStatusMessage(message);
        onError(message);
      }
    })();

    return () => { controller.abort(); };
  }, [prompt, onComplete, onError]);

  const handleCopyLink = useCallback(async () => {
    onShareLink();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }, [onShareLink]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl mx-auto"
    >
      {/* Status bar */}
      <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-2xl bg-[#080808] border border-white/[0.06]">
        {phase === 'complete' ? (
          <Check className="w-4 h-4 text-[#FFD700]" />
        ) : phase === 'error' ? (
          <div className="w-4 h-4 rounded-full bg-red-400/20 flex items-center justify-center">
            <span className="text-red-400 text-[10px]">!</span>
          </div>
        ) : (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
            <Sparkles className="w-4 h-4 text-white/40" />
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={statusMessage}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.12 }}
            className={`text-sm ${phase === 'complete' ? 'text-white/60' : phase === 'error' ? 'text-red-400/80' : 'text-white/40'}`}
          >
            {statusMessage}
          </motion.span>
        </AnimatePresence>
        {toolName && phase === 'complete' && (
          <span className="ml-auto text-xs text-white/40 truncate max-w-40">{toolName}</span>
        )}
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#080808] p-4 sm:p-6 mb-4 min-h-[200px]">
        {elements.length === 0 && phase !== 'error' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/30 text-sm"
            >
              Building...
            </motion.div>
          </div>
        )}
        {elements.length > 0 && (
          <ToolCanvas elements={elements} state={{}} layout="flow" />
        )}
        {phase === 'error' && elements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-400/60 text-sm">{statusMessage}</p>
          </div>
        )}
      </div>

      {/* CTAs — only when complete */}
      {phase === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          {/* Share link row */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#080808] px-3 py-2">
            <Link2 className="w-4 h-4 text-white/30 flex-shrink-0" />
            <span className="text-xs text-white/40 truncate flex-1 font-mono">
              {typeof window !== 'undefined' ? window.location.origin : ''}/t/{toolId}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex-shrink-0 px-3 py-1 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition-all"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5" /> : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-white/25 text-center">
            Anyone with this link can use your tool
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                rounded-xl bg-white text-black font-medium text-sm
                hover:bg-white/90 transition-all"
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {linkCopied ? 'Copied!' : 'Share link'}
            </button>
            <button
              onClick={onDeploy}
              className="flex items-center justify-center gap-2 px-4 py-2.5
                rounded-xl bg-[#080808] text-white/50 text-sm border border-white/[0.06]
                hover:bg-white/[0.06] hover:text-white/70 transition-all"
            >
              <Rocket className="w-4 h-4" />
              Deploy
            </button>
            <button
              onClick={onEditInStudio}
              className="flex items-center justify-center gap-2 px-4 py-2.5
                rounded-xl text-white/40 text-sm hover:text-white/60
                hover:bg-white/[0.04] transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* WordReveal removed — DESIGN-2026: no word-by-word reveals */

/**
 * QuickCreateForm — Inline form for customizing a template before creating
 */
function QuickCreateForm({
  template,
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  template: QuickTemplate;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const fields = template.quickDeployFields || template.setupFields || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.08] bg-[#080808] p-6 max-w-xl mx-auto overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-medium text-white">{template.name}</h3>
        <button
          onClick={onCancel}
          className="text-[12px] text-white/30 hover:text-white/50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[12px] text-white/40">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={values[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]
                  text-white text-[14px] placeholder-white/20 outline-none
                  focus:border-white/[0.12] transition-colors resize-none"
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={values[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]
                  text-white text-[14px] placeholder-white/20 outline-none
                  focus:border-white/[0.12] transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full mt-4 py-3 rounded-xl bg-[#FFD700] text-black text-[14px] font-semibold
          hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating...' : `Create ${template.name}`}
      </button>
    </motion.div>
  );
}

/**
 * PromptInput — Clean input with subtle focus state. No animated borders.
 */
function PromptInput({
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
  return (
    <div className="relative">
      <div
        className={`
          rounded-2xl border transition-all duration-200
          ${isFocused
            ? 'border-white/[0.12] bg-[#080808]'
            : 'border-white/[0.06] bg-[#080808]'
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
          className="w-full px-5 py-4 pr-14 bg-transparent text-white placeholder-white/20
            resize-none outline-none text-[15px] leading-relaxed"
        />
      </div>
    </div>
  );
}

export default function BuilderDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { data: currentProfile } = useCurrentProfile({ enabled: !!user });
  const { track, startTimer, elapsed } = useAnalytics();
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [ceremonyPhase, setCeremonyPhase] = useState<CeremonyPhase>('idle');
  const [statusText, setStatusText] = useState('');
  const [titleRevealed] = useState(true);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const [quickCreateTemplate, setQuickCreateTemplate] = useState<QuickTemplate | null>(null);
  const [quickCreateValues, setQuickCreateValues] = useState<Record<string, string>>({});
  // Inline generation state (C2)
  const [inlineGenPhase, setInlineGenPhase] = useState<InlineGenPhase>('idle');
  const [inlineToolId, setInlineToolId] = useState<string | null>(null);
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [inlineLinkCopied, setInlineLinkCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Preserve space context when arriving from a space's "Build Tool" button
  const originSpaceId = searchParams.get('spaceId');

  // Get all available templates for quick-start chips
  const allTemplates = React.useMemo(() => getAvailableTemplates().slice(0, 8), []);

  // Fetch user's tools with aggregated stats
  const { data, isLoading: toolsLoading } = useMyTools();
  const userTools = data?.tools ?? [];
  const stats = data?.stats ?? { totalTools: 0, totalUsers: 0, weeklyInteractions: 0 };

  const hasTools = userTools.length > 0;
  const isNewUser = !toolsLoading && !hasTools;
  const userInterestCategories = React.useMemo(() => {
    if (Array.isArray(currentProfile?.interests) && currentProfile.interests.length > 0) {
      return currentProfile.interests;
    }
    return Array.isArray((user as any)?.interests) ? (user as any).interests : [];
  }, [currentProfile?.interests, user]);
  const recommendedTemplates = React.useMemo(
    () => getTemplatesForInterests(userInterestCategories).slice(0, 6),
    [userInterestCategories]
  );
  const showRecommendedTemplates = userInterestCategories.length > 0 && recommendedTemplates.length > 0;

  // Track lab_viewed
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (!toolsLoading && user && !hasTrackedView.current) {
      hasTrackedView.current = true;
      track('lab_viewed', { hasCreations: userTools.length > 0 });
    }
  }, [toolsLoading, user, userTools.length, track]);

  // Focus input after title reveals (only for new users)
  useEffect(() => {
    if (!authLoading && user && titleRevealed && inputRef.current && isNewUser) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, titleRevealed, isNewUser]);

  // Handle submit — inline AI generation (C2)
  // If template match found, go to /lab/new for the template suggestion flow.
  // Otherwise, create blank tool and stream generation inline.
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || ceremonyPhase !== 'idle' || inlineGenPhase !== 'idle') return;

    const userPrompt = prompt.trim();

    startTimer();
    track('creation_started', { source: 'ai' });

    // Check for template match — route to conversational flow for template suggestions
    const match = matchTemplate(userPrompt);
    if (match) {
      const encodedPrompt = encodeURIComponent(userPrompt);
      const spaceParam = originSpaceId ? `&spaceId=${originSpaceId}` : '';
      router.push(`/lab/new?prompt=${encodedPrompt}${spaceParam}`);
      return;
    }

    // No template match — inline generation
    setInlinePrompt(userPrompt);
    setInlineGenPhase('creating-tool');

    try {
      const name = generateToolName(userPrompt);
      const id = await createBlankTool(name, userPrompt);
      setInlineToolId(id);
      setInlineGenPhase('streaming');
    } catch {
      toast.error('Failed to create. Please try again.');
      setInlineGenPhase('idle');
    }
  }, [prompt, ceremonyPhase, inlineGenPhase, router, originSpaceId]);

  // Handle template click — show inline form if template has quickDeployFields
  const handleTemplateClick = useCallback(async (template: QuickTemplate) => {
    if (ceremonyPhase !== 'idle' || creatingFromTemplate) return;
    startTimer();
    track('creation_started', { source: 'template' });

    const fields = template.quickDeployFields || template.setupFields;
    if (fields && fields.length > 0) {
      // Show inline form with pre-filled defaults
      const defaults: Record<string, string> = {};
      for (const field of fields) {
        defaults[field.key] = field.defaultValue?.toString() || '';
      }
      setQuickCreateValues(defaults);
      setQuickCreateTemplate(template);
      return;
    }

    // No fields — create immediately
    await createFromTemplate(template);
  }, [ceremonyPhase, creatingFromTemplate]);

  // Create tool from template (with optional config overrides)
  const createFromTemplate = useCallback(async (template: QuickTemplate, overrides?: Record<string, string>) => {
    if (creatingFromTemplate) return;

    setCreatingFromTemplate(true);
    setCeremonyPhase('creating');
    setStatusText(`Creating ${template.name}...`);
    setQuickCreateTemplate(null);

    try {
      const toolId = await createToolFromTemplateApi(template, overrides);
      // Skip IDE — go straight to the shareable standalone page
      const params = new URLSearchParams();
      if (originSpaceId) params.set('spaceId', originSpaceId);
      params.set('just_created', 'true');
      router.push(`/t/${toolId}?${params.toString()}`);
    } catch {
      toast.error('Failed to create from template');
      setCeremonyPhase('idle');
      setCreatingFromTemplate(false);
      setStatusText('');
    }
  }, [creatingFromTemplate, router, originSpaceId]);

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
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['my-tools'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  }, [queryClient]);

  // Inline generation callbacks
  const handleInlineComplete = useCallback((elements: ToolElement[], name: string) => {
    setInlineGenPhase('complete');
    queryClient.invalidateQueries({ queryKey: ['my-tools'] });
    track('creation_completed', { toolId: inlineToolId, source: 'ai', durationMs: elapsed() });
  }, [queryClient, inlineToolId, track, elapsed]);

  const handleInlineError = useCallback((msg: string) => {
    toast.error(msg);
    setInlineGenPhase('error');
  }, []);

  const handleInlineShareLink = useCallback(async () => {
    if (!inlineToolId) return;
    const url = `${window.location.origin}/t/${inlineToolId}`;

    // Auto-publish so share link works
    try {
      await fetch('/api/tools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toolId: inlineToolId, status: 'published' }),
      });
      track('creation_published', { toolId: inlineToolId });
    } catch { /* non-critical */ }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied! Share it anywhere.');
      track('creation_shared', { toolId: inlineToolId });
    } catch {
      toast.success(`Share link: ${url}`);
    }
  }, [inlineToolId, track]);

  const handleInlineEditInStudio = useCallback(() => {
    if (inlineToolId) router.push(`/lab/${inlineToolId}`);
  }, [inlineToolId, router]);

  const handleInlineDeploy = useCallback(() => {
    if (inlineToolId) {
      track('creation_deployed', { toolId: inlineToolId, spaceId: originSpaceId });
      const spaceParam = originSpaceId ? `?spaceId=${originSpaceId}` : '';
      router.push(`/lab/${inlineToolId}/deploy${spaceParam}`);
    }
  }, [inlineToolId, router, originSpaceId, track]);

  const handleInlineReset = useCallback(() => {
    setInlineGenPhase('idle');
    setInlineToolId(null);
    setInlinePrompt('');
    setPrompt('');
  }, []);

  const isInlineActive = inlineGenPhase !== 'idle';

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
            onClick={() => router.push('/enter?redirect=/lab')}
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
  if (authLoading || creatingFromTemplate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <BrandSpinner size="md" variant="gold" />
        {creatingFromTemplate && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-white/50 text-sm"
          >
            {statusText || 'Creating tool...'}
          </motion.p>
        )}
      </div>
    );
  }

  const isSubmitting = ceremonyPhase !== 'idle' || inlineGenPhase === 'creating-tool';
  const showStatus = ceremonyPhase === 'creating';
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
                <LayoutGrid className="w-5 h-5 text-white/50" />
                <h1 className="text-xl font-medium text-white">Your Lab</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const spaceParam = originSpaceId ? `?spaceId=${originSpaceId}` : '';
                    router.push(`/lab/templates${spaceParam}`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                    text-white/40 hover:text-white/60 bg-white/[0.04] hover:bg-white/[0.06]
                    transition-colors text-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Templates
                </button>
                <button
                  onClick={handleNewTool}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                    text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.08]
                    transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create
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
              <div className="text-xs font-medium text-white/50 tracking-wide mb-3">
                Your Creations
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
                  className="mt-3 text-white/50 hover:text-white/50 text-xs transition-colors"
                >
                  {showAllTools ? 'Show less' : `View all ${userTools.length} tools`}
                </motion.button>
              )}
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mb-6" />

            {/* Quick Start Chips */}
            {!quickCreateTemplate && (
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
            )}

            {/* Quick Create Inline Form */}
            <AnimatePresence>
              {quickCreateTemplate && (
                <div className="mb-8">
                  <QuickCreateForm
                    template={quickCreateTemplate}
                    values={quickCreateValues}
                    onChange={(key, value) => setQuickCreateValues(prev => ({ ...prev, [key]: value }))}
                    onSubmit={() => createFromTemplate(quickCreateTemplate, quickCreateValues)}
                    onCancel={() => { setQuickCreateTemplate(null); setQuickCreateValues({}); }}
                    isSubmitting={creatingFromTemplate}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* AI Prompt */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="max-w-xl"
            >
              <div className="relative">
                <PromptInput
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isSubmitting}
                  isFocused={isFocused}
                  placeholder="Or describe something new..."
                  inputRef={inputRef}
                />

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isSubmitting}
                  className="absolute right-3 bottom-3 p-2.5 rounded-lg
                    disabled:cursor-not-allowed transition-all duration-200"
                  animate={{
                    backgroundColor: isSubmitting
                      ? 'rgba(255, 255, 255, 0.06)'
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
                        <BrandSpinner size="md" variant="gold" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="arrow"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.1 }}
                      >
                        <ArrowRight className={`w-5 h-5 ${prompt.trim() ? 'text-black' : 'text-white/50'}`} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Dimming overlay during ceremony */}
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none bg-black"
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
                    <span className="text-white/40 text-sm font-medium">
                      {statusText}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Inline AI Generation Preview (C2) */}
            <AnimatePresence>
              {isInlineActive && inlineToolId && inlineGenPhase !== 'creating-tool' && (
                <motion.div
                  key="inline-gen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6"
                >
                  <InlineGenerationPreview
                    prompt={inlinePrompt}
                    toolId={inlineToolId}
                    onComplete={handleInlineComplete}
                    onError={handleInlineError}
                    onShareLink={handleInlineShareLink}
                    onEditInStudio={handleInlineEditInStudio}
                    onDeploy={handleInlineDeploy}
                  />
                  {inlineGenPhase === 'error' && (
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={handleInlineReset}
                        className="text-white/40 hover:text-white/60 text-xs transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ============================================================ */}
        {/* NEW USER STATE (0 tools)                                     */}
        {/* ============================================================ */}
        {isNewUser && (
          <>
            {/* Hero — "What do you want to make?" */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-center mb-6 pt-8"
            >
              <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2">
                What do you want to make?
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: titleRevealed || shouldReduceMotion ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-white/50 text-sm"
              >
                Polls, sign-ups, countdowns, leaderboards — 30 seconds, no code
              </motion.p>
            </motion.div>

            {/* Quick Chips — First Action (above prompt) */}
            {!quickCreateTemplate && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.1, ease: EASE }}
                className="max-w-xl mx-auto mb-6"
              >
                <QuickStartChips
                  templates={allTemplates}
                  onTemplateClick={handleTemplateClick}
                  onViewAll={() => router.push('/lab/templates')}
                  disabled={isSubmitting}
                  variant="primary"
                />
              </motion.div>
            )}

            {/* Quick Create Inline Form — shown when a template with fields is selected */}
            <AnimatePresence>
              {quickCreateTemplate && (
                <div className="mb-6">
                  <QuickCreateForm
                    template={quickCreateTemplate}
                    values={quickCreateValues}
                    onChange={(key, value) => setQuickCreateValues(prev => ({ ...prev, [key]: value }))}
                    onSubmit={() => createFromTemplate(quickCreateTemplate, quickCreateValues)}
                    onCancel={() => { setQuickCreateTemplate(null); setQuickCreateValues({}); }}
                    isSubmitting={creatingFromTemplate}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* AI Prompt — Custom Builds */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.15, ease: EASE }}
              className="max-w-xl mx-auto mb-10"
            >
              <div className="relative">
                <PromptInput
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isSubmitting}
                  isFocused={isFocused}
                  placeholder="Or describe something custom..."
                  inputRef={inputRef}
                />

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isSubmitting}
                  className="absolute right-3 bottom-3 p-2.5 rounded-lg
                    disabled:cursor-not-allowed transition-all duration-200"
                  animate={{
                    backgroundColor: isSubmitting
                      ? 'rgba(255, 255, 255, 0.06)'
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
                        <BrandSpinner size="md" variant="gold" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="arrow"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.1 }}
                      >
                        <ArrowRight className={`w-5 h-5 ${prompt.trim() ? 'text-black' : 'text-white/50'}`} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Dimming overlay */}
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none bg-black"
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
                    <span className="text-white/40 text-sm font-medium">
                      {statusText}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Inline AI Generation Preview (C2) — New User */}
            <AnimatePresence>
              {isInlineActive && inlineToolId && inlineGenPhase !== 'creating-tool' && (
                <motion.div
                  key="inline-gen-new"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-xl mx-auto mb-8"
                >
                  <InlineGenerationPreview
                    prompt={inlinePrompt}
                    toolId={inlineToolId}
                    onComplete={handleInlineComplete}
                    onError={handleInlineError}
                    onShareLink={handleInlineShareLink}
                    onEditInStudio={handleInlineEditInStudio}
                    onDeploy={handleInlineDeploy}
                  />
                  {inlineGenPhase === 'error' && (
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={handleInlineReset}
                        className="text-white/40 hover:text-white/60 text-xs transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider — hidden when inline gen is active */}
            {!isInlineActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 0.3 }}
              className="flex items-center gap-4 mb-8 max-w-2xl mx-auto"
            >
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-white/50 text-xs tracking-wide">
                browse by use case
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </motion.div>
            )}

            {/* Recommended Templates — hidden during inline gen */}
            {showRecommendedTemplates && !isInlineActive && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.32, ease: EASE }}
                className="max-w-3xl mx-auto mb-8"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Sparkles className="w-4 h-4 text-white/40" />
                  <h3 className="text-sm font-medium text-white">Recommended for you</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {recommendedTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateClick(template)}
                      disabled={isSubmitting}
                      className="group text-left p-3 rounded-2xl border border-white/[0.06] bg-[#080808]
                        hover:bg-white/[0.03] transition-all disabled:opacity-50"
                    >
                      <p className="text-sm font-medium text-white mb-0.5 truncate">{template.name}</p>
                      <p className="text-xs text-white/40 line-clamp-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Curated Library — hidden during inline gen */}
            {!isInlineActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.35, ease: EASE }}
              className="max-w-3xl mx-auto mb-10 space-y-6"
            >
              {LIBRARY_SECTIONS.map((section, sectionIndex) => {
                const sectionTemplates = section.templateIds
                  .map(id => getQuickTemplate(id))
                  .filter((t): t is QuickTemplate => t !== undefined);

                if (sectionTemplates.length === 0) return null;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: shouldReduceMotion ? 0 : 0.35 + (sectionIndex * 0.08),
                      ease: EASE,
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <section.Icon className="w-4 h-4 text-white/40" />
                      <h3 className="text-sm font-medium text-white">{section.title}</h3>
                      <span className="text-xs text-white/30">{section.desc}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {sectionTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateClick(template)}
                          disabled={isSubmitting}
                          className="group text-left p-3 rounded-2xl border border-white/[0.06] bg-[#080808]
                            hover:bg-white/[0.03] transition-all disabled:opacity-50"
                        >
                          <p className="text-sm font-medium text-white mb-0.5 truncate">{template.name}</p>
                          <p className="text-xs text-white/40 line-clamp-1">{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => {
                    const spaceParam = originSpaceId ? `?spaceId=${originSpaceId}` : '';
                    router.push(`/lab/templates${spaceParam}`);
                  }}
                  className="text-white/50 hover:text-white text-xs transition-colors flex items-center gap-1.5"
                >
                  View all templates
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
            )}

            {/* Build from scratch CTA — hidden during inline gen */}
            {!isInlineActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.7 }}
              className="max-w-3xl mx-auto"
            >
              <div
                className="p-4 rounded-2xl border border-dashed border-white/[0.06] bg-[#080808]
                  flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">Build from scratch</p>
                  <p className="text-xs text-white/40">
                    Describe what you need and AI builds it
                  </p>
                </div>
                <button
                  onClick={handleNewTool}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.04]
                    text-white/60 hover:text-white/80 hover:bg-white/[0.06] border border-white/[0.06]
                    transition-all"
                >
                  Blank Canvas
                </button>
              </div>
            </motion.div>
            )}
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
            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-white/[0.06]"
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
                  className="h-[140px] rounded-lg bg-white/[0.06]"
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
