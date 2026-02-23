'use client';

/**
 * ConversationalCreator - Main orchestrator for the conversational creation flow.
 *
 * States: prompt -> template-check -> generating -> ready -> refining
 *
 * This replaces the old /lab/new page that just created a blank tool
 * and redirected to the IDE. Now the creation experience lives here.
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Check, Link2, Pencil, Rocket } from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';
import { BrandSpinner, ToolCanvas, type ToolElement } from '@hive/ui';
import type { QuickTemplate } from '@hive/ui';

import { createBlankTool, createToolFromTemplateApi, generateToolName } from '@/lib/hivelab/create-tool';
import { useAnalytics } from '@/hooks/use-analytics';
import { PromptHero } from './PromptHero';
import { TemplateSuggestion } from './TemplateSuggestion';
import { StreamingPreview } from './StreamingPreview';
import { RefinementBar } from './RefinementBar';
import { matchTemplate } from './template-matcher';

const EASE = MOTION.ease.premium;

type CreationPhase =
  | 'prompt'
  | 'template-check'
  | 'creating-tool'
  | 'generating'
  | 'ready'
  | 'refining';

interface SpaceContext {
  spaceId: string;
  spaceName: string;
  spaceType?: string;
}

interface GenerationResult {
  name: string;
  description: string;
  elements: ToolElement[];
  isIteration?: boolean;
}

interface ConversationalCreatorProps {
  initialPrompt?: string;
  spaceContext?: SpaceContext;
}

export function ConversationalCreator({ initialPrompt, spaceContext }: ConversationalCreatorProps) {
  const router = useRouter();
  const { track, startTimer, elapsed } = useAnalytics();
  const [phase, setPhase] = useState<CreationPhase>(initialPrompt ? 'creating-tool' : 'prompt');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [toolId, setToolId] = useState<string | null>(null);
  const [toolName, setToolName] = useState('');
  const [elements, setElements] = useState<ToolElement[]>([]);
  const [matchedTemplate, setMatchedTemplate] = useState<QuickTemplate | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const hasCreatedInitial = useRef(false);

  // Create a tool document and start AI generation
  const startGeneration = useCallback(async (userPrompt: string) => {
    setPhase('creating-tool');
    const name = generateToolName(userPrompt);
    setToolName(name);

    try {
      const id = await createBlankTool(name, userPrompt);
      setToolId(id);
      setPhase('generating');
    } catch {
      toast.error('Failed to create tool. Please try again.');
      setPhase('prompt');
    }
  }, []);

  // Handle prompt submission from hero
  const handlePromptSubmit = useCallback(async (userPrompt: string) => {
    setPrompt(userPrompt);
    startTimer();
    track('creation_started', { source: 'ai' });

    // Check for template match first
    const match = matchTemplate(userPrompt);
    if (match) {
      setMatchedTemplate(match.template);
      setPhase('template-check');
      return;
    }

    // No template match - proceed to create tool + generate
    await startGeneration(userPrompt);
  }, [startGeneration]);

  // Handle template usage
  const handleUseTemplate = useCallback(async (template: QuickTemplate) => {
    setPhase('creating-tool');
    try {
      const id = await createToolFromTemplateApi(template);
      router.push(`/lab/${id}`);
    } catch {
      toast.error('Failed to create tool from template');
      setPhase('prompt');
    }
  }, [router]);

  // Handle "build with AI instead" from template suggestion
  const handleBuildWithAI = useCallback(async () => {
    setMatchedTemplate(null);
    await startGeneration(prompt);
  }, [prompt, startGeneration]);

  // Handle generation completion
  const handleGenerationComplete = useCallback((result: GenerationResult) => {
    setElements(result.elements);
    setToolName(result.name || toolName);
    setPhase('ready');
    track('creation_completed', { toolId, source: 'ai', durationMs: elapsed() });
  }, [toolName, toolId, track, elapsed]);

  // Handle generation error
  const handleGenerationError = useCallback((error: string) => {
    toast.error(error);
    // Stay on generating phase - StreamingPreview shows the error
  }, []);

  // Handle refinement
  const handleRefinement = useCallback(async (refinementPrompt: string) => {
    if (!toolId || isRefining) return;

    setPrompt(refinementPrompt);
    setIsRefining(true);
    setPhase('refining');
  }, [toolId, isRefining]);

  // Handle refinement completion
  const handleRefinementComplete = useCallback((result: GenerationResult) => {
    setElements(result.elements);
    setIsRefining(false);
    setPhase('ready');
  }, []);

  // Handle refinement error
  const handleRefinementError = useCallback((error: string) => {
    toast.error(error);
    setIsRefining(false);
    setPhase('ready');
  }, []);

  // Start over
  const handleStartOver = useCallback(() => {
    setPhase('prompt');
    setPrompt('');
    setToolId(null);
    setToolName('');
    setElements([]);
    setMatchedTemplate(null);
    setIsRefining(false);
    hasCreatedInitial.current = false;
  }, []);

  // Navigate to IDE
  const handleEditManually = useCallback(() => {
    if (toolId) {
      router.push(`/lab/${toolId}`);
    }
  }, [toolId, router]);

  // Copy shareable link — also publishes the tool so it's accessible
  const handleCopyLink = useCallback(async () => {
    if (!toolId) return;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/t/${toolId}`;

    // Auto-publish tool so the share link works for anyone
    try {
      await fetch('/api/tools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toolId, status: 'published' }),
      });
      track('creation_published', { toolId });
    } catch {
      // Non-critical — tool may already be published
    }

    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success('Link copied! Share it anywhere.');
      track('creation_shared', { toolId });
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      toast.success(`Share link: ${url}`);
    }
  }, [toolId, track]);

  // Navigate to deploy
  const handleDeploy = useCallback(() => {
    if (toolId) {
      track('creation_deployed', { toolId, spaceId: spaceContext?.spaceId });
      const spaceParam = spaceContext ? `?spaceId=${spaceContext.spaceId}` : '';
      router.push(`/lab/${toolId}/deploy${spaceParam}`);
    }
  }, [toolId, router, spaceContext, track]);

  // Handle initial prompt auto-submission
  const handleInitialPrompt = useCallback(async (userPrompt: string) => {
    if (hasCreatedInitial.current) return;
    hasCreatedInitial.current = true;
    await handlePromptSubmit(userPrompt);
  }, [handlePromptSubmit]);

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar - shown after prompt phase */}
      {phase !== 'prompt' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durationSeconds.quick, ease: EASE }}
          className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4
            bg-black/80 backdrop-blur-sm border-b border-white/[0.06]"
        >
          <button
            onClick={handleStartOver}
            className="flex items-center gap-1.5 text-white/50 hover:text-white/50
              transition-colors duration-150 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Start over</span>
          </button>
          <div className="flex-1" />
          {toolName && (
            <span className="text-white/50 text-xs truncate max-w-48">{toolName}</span>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* PROMPT PHASE */}
        {phase === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.quick }}
          >
            <PromptHero
              onSubmit={initialPrompt ? handleInitialPrompt : handlePromptSubmit}
              initialPrompt={initialPrompt}
              spaceName={spaceContext?.spaceName}
            />
          </motion.div>
        )}

        {/* TEMPLATE CHECK PHASE */}
        {phase === 'template-check' && matchedTemplate && (
          <motion.div
            key="template"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.quick }}
          >
            <TemplateSuggestion
              template={matchedTemplate}
              prompt={prompt}
              onUseTemplate={handleUseTemplate}
              onBuildWithAI={handleBuildWithAI}
            />
          </motion.div>
        )}

        {/* CREATING TOOL PHASE (brief loading) */}
        {phase === 'creating-tool' && (
          <motion.div
            key="creating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.quick }}
            className="min-h-[60vh] flex flex-col items-center justify-center"
          >
            <BrandSpinner size="md" variant="gold" />
            <p className="mt-4 text-white/50 text-sm">Setting up your workspace...</p>
          </motion.div>
        )}

        {/* GENERATING PHASE */}
        {phase === 'generating' && toolId && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.quick }}
          >
            <StreamingPreview
              prompt={prompt}
              toolId={toolId}
              spaceContext={spaceContext}
              onComplete={handleGenerationComplete}
              onError={handleGenerationError}
            />
          </motion.div>
        )}

        {/* REFINING PHASE */}
        {phase === 'refining' && toolId && (
          <motion.div
            key="refining"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.quick }}
          >
            <StreamingPreview
              prompt={prompt}
              toolId={toolId}
              spaceContext={spaceContext}
              existingComposition={{
                elements,
                name: toolName,
              }}
              isIteration
              onComplete={handleRefinementComplete}
              onError={handleRefinementError}
            />
          </motion.div>
        )}

        {/* READY PHASE */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.quick }}
            className="px-6 py-8 max-w-2xl mx-auto"
          >
            {/* Tool name and status */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: durationSeconds.standard, ease: EASE }}
              className="mb-6 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-white/[0.06] text-white/50 text-xs font-medium mb-3 border border-white/[0.06]">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                Ready
              </div>
              <h2 className="text-xl font-semibold text-white">{toolName || 'Your Tool'}</h2>
            </motion.div>

            {/* Preview */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: durationSeconds.smooth, delay: 0.1, ease: EASE }}
              className="rounded-2xl border border-white/[0.06] bg-[#080808] p-4 sm:p-6 mb-6"
            >
              {elements.length > 0 ? (
                <ToolCanvas
                  elements={elements}
                  state={{}}
                  layout="flow"
                />
              ) : (
                <div className="py-12 text-center text-white/50 text-sm">
                  No elements generated. Try a more specific prompt.
                </div>
              )}
            </motion.div>

            {/* Refinement input */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: durationSeconds.standard, delay: 0.2, ease: EASE }}
              className="mb-8"
            >
              <RefinementBar
                onSubmit={handleRefinement}
                isGenerating={isRefining}
              />
            </motion.div>

            {/* Action buttons */}
            {/* Share link display */}
            {toolId && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: durationSeconds.standard, delay: 0.25, ease: EASE }}
                className="mb-6 max-w-xl mx-auto"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#080808] px-3 py-2">
                  <Link2 className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <span className="text-xs text-white/40 truncate flex-1 font-sans">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/t/{toolId}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 px-3 py-1 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition-all"
                  >
                    {linkCopied ? <Check className="w-3.5 h-3.5" /> : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-white/30 mt-1.5 text-center">
                  Anyone with this link can use your tool — no account needed
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: durationSeconds.standard, delay: 0.3, ease: EASE }}
              className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
            >
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3
                  rounded-2xl bg-white text-black font-medium text-sm
                  hover:bg-white/90 transition-all duration-150"
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                {linkCopied ? 'Copied!' : 'Share Link'}
              </button>
              <button
                onClick={handleDeploy}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3
                  rounded-2xl bg-[#080808] text-white/50 text-sm border border-white/[0.06]
                  hover:bg-white/[0.06] hover:text-white/70 transition-all duration-150"
              >
                <Rocket className="w-4 h-4" />
                Deploy to Space
              </button>
              <button
                onClick={handleEditManually}
                className="flex items-center justify-center gap-2 px-5 py-3
                  rounded-2xl text-white/40 text-sm
                  hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
