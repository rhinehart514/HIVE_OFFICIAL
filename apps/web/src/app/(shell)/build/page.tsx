'use client';

export const dynamic = 'force-dynamic';

/** /build — Classification-First Build Entry. Split panel: prompt left, preview right. */

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import { RotateCcw } from 'lucide-react';
import { BrandSpinner } from '@hive/ui';

import { useBuildMachine } from '@/hooks/use-build-machine';
import { isNativeFormat, SHELL_REGISTRY } from '@/lib/shells';
import type { ShellFormat } from '@/lib/shells/types';
import { useAnalytics } from '@/hooks/use-analytics';
import { emitValueMoment } from '@/lib/pwa-triggers';

import { PromptInput } from './components/prompt-input';
import { PhaseIndicator } from './components/phase-indicator';
import { IdleExamples } from './components/idle-examples';
import { ShellMatchedEditor } from './components/shell-matched-editor';
import { CompleteActions } from './components/complete-actions';
import { BuildPreviewPanel } from './components/build-preview-panel';
import { ImpactStrip } from './components/impact-strip';
import { savePendingDeploy, loadPendingDeploy } from './components/deploy-storage';

function getBuildGreeting(): { headline: string; subtext: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { headline: 'Morning build sesh', subtext: 'What does your org need today?' };
  if (hour >= 12 && hour < 17) return { headline: 'What do you need?', subtext: 'Poll, bracket, RSVP — say what and we handle the rest.' };
  if (hour >= 17 && hour < 21) return { headline: 'Evening build mode', subtext: 'Perfect time to set something up for tomorrow.' };
  return { headline: 'Late night builder', subtext: 'The best ideas happen after midnight.' };
}

function hintToPrompt(hint: string): string {
  const prompts: Record<string, string> = {
    poll: 'Create a poll for my group',
    bracket: 'Create a bracket tournament',
    rsvp: 'Create an RSVP for an event',
    signup: 'Create a signup sheet',
    countdown: 'Create a countdown timer',
  };
  return prompts[hint] || `Create a ${hint}`;
}

export default function BuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { track } = useAnalytics();

  const originSpaceId = searchParams.get('spaceId');
  const originSpaceName = searchParams.get('spaceName');
  const hint = searchParams.get('hint');
  const autoPrompt = searchParams.get('prompt') || (hint ? hintToPrompt(hint) : undefined);

  const {
    state,
    submitPrompt,
    updateShellConfig,
    acceptShell,
    escalateToCustom,
    reset,
    dispatch,
  } = useBuildMachine({
    spaceId: originSpaceId,
    spaceContext: originSpaceId && originSpaceName
      ? { spaceId: originSpaceId, spaceName: originSpaceName }
      : null,
    onToolCreated: (toolId) => {
      track('creation_completed', { toolId, source: 'build-page' });
      emitValueMoment({ type: 'first-creation' });
    },
  });

  // On mount: check for pending deploy from auth flow
  useEffect(() => {
    if (!authLoading && user) {
      const pending = loadPendingDeploy();
      if (pending?.prompt) {
        if (pending.format && pending.config && isNativeFormat(pending.format as ShellFormat)) {
          dispatch({ type: 'SUBMIT_PROMPT', prompt: pending.prompt });
          dispatch({
            type: 'CLASSIFICATION_SUCCESS',
            result: {
              format: pending.format as ShellFormat,
              confidence: 1.0,
              config: pending.config,
            },
          });
        } else {
          submitPrompt(pending.prompt);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleDeploy = useCallback(async () => {
    if (!user) {
      savePendingDeploy({
        prompt: state.prompt,
        format: state.classification?.format,
        config: state.shellConfig,
      });
      router.push('/enter?redirect=/build');
      return;
    }
    await acceptShell();
  }, [user, state.prompt, state.classification, state.shellConfig, acceptShell, router]);

  const handleShare = useCallback(() => {
    if (!state.toolId) return;
    const url = `${window.location.origin}/t/${state.toolId}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied!'),
      () => toast.success(`Share: ${url}`)
    );
  }, [state.toolId]);

  const isWorking = state.phase === 'classifying' || state.phase === 'generating';
  const showPreview = state.phase !== 'idle';
  const shellFormat = state.classification?.format;
  const isShellFormat = shellFormat && isNativeFormat(shellFormat);
  const isShellMatched = state.phase === 'shell-matched' && isShellFormat;
  const registryEntry = isShellMatched
    ? SHELL_REGISTRY[shellFormat as Exclude<ShellFormat, 'custom'>]
    : null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
        <BrandSpinner size="md" variant="gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-void)]">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* LEFT PANEL -- Prompt + controls */}
        <div className="relative w-full lg:w-[360px] lg:min-w-[320px] lg:border-r lg:border-white/[0.05] flex flex-col">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ background: 'radial-gradient(ellipse at 50% 30%, #FFD700, transparent 70%)' }}
          />
          <div className="relative px-5 py-6 flex flex-col overflow-y-auto">
            {user && state.phase === 'idle' && <ImpactStrip />}

            <div className="mb-4">
              {(() => {
                const greeting = getBuildGreeting();
                return (
                  <>
                    <h1 className="font-clash text-[32px] font-semibold tracking-[-0.03em] text-white mb-0.5">
                      {greeting.headline}
                    </h1>
                    {originSpaceName ? (
                      <p className="text-sm text-white/50">
                        Building for <span className="text-white/70 font-medium">{originSpaceName}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-white/30">
                        {greeting.subtext}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            <PromptInput onSubmit={submitPrompt} disabled={isWorking} autoPrompt={autoPrompt} />

            {state.phase === 'idle' && <IdleExamples onSubmit={submitPrompt} showMyApps={!!user} />}

            {state.phase !== 'shell-matched' && <PhaseIndicator phase={state.phase} />}

            <AnimatePresence mode="wait">
              {isShellMatched && state.shellConfig && shellFormat && (
                <ShellMatchedEditor
                  shellFormat={shellFormat}
                  shellConfig={state.shellConfig}
                  confidence={state.classification?.confidence ?? 0}
                  registryName={registryEntry?.displayName}
                  hasUser={!!user}
                  onUpdateConfig={updateShellConfig}
                  onDeploy={handleDeploy}
                  onEscalate={escalateToCustom}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {state.phase === 'complete' && state.toolId && (
                <CompleteActions
                  toolId={state.toolId}
                  toolName={state.toolName || 'Your app'}
                  hasUser={!!user}
                  originSpaceId={originSpaceId}
                  onShare={handleShare}
                  onReset={reset}
                  onNavigate={(path) => router.push(path)}
                />
              )}
            </AnimatePresence>

            {state.phase === 'error' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                <p className="text-sm text-red-400/80 mb-3">{state.error}</p>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Try again
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL -- Preview */}
        <BuildPreviewPanel state={state} showPreview={showPreview} onReset={reset} />
      </div>
    </div>
  );
}
