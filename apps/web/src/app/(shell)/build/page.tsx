'use client';

export const dynamic = 'force-dynamic';

/**
 * /build — Classification-First Build Entry
 *
 * 1. User types a prompt
 * 2. /api/tools/classify runs (~500ms)
 * 3. Native format (poll/bracket/rsvp) with confidence > 0.5 → shell preview
 * 4. Custom or low confidence → streaming code generation
 *
 * Split panel: prompt left, preview right (desktop). Stacked on mobile.
 * Non-authed users can create but hit a signup gate at deploy.
 */

import React, { useState, useCallback, useRef, useEffect, Suspense, lazy } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Loader2,
  Send,
  Wand2,
  Check,
  Zap,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { MOTION, durationSeconds, CARD } from '@hive/tokens';
import { BrandSpinner } from '@hive/ui';

import { useBuildMachine, type BuildPhase } from '@/hooks/use-build-machine';
import { isNativeFormat, SHELL_REGISTRY } from '@/lib/shells';
import type { ShellFormat, ShellConfig, PollConfig, BracketConfig, RSVPConfig } from '@/lib/shells/types';
import { useAnalytics } from '@/hooks/use-analytics';
import { emitValueMoment } from '@/lib/pwa-triggers';

const ShellRenderer = lazy(() => import('@/components/shells/ShellRenderer'));

/** Lightweight error boundary for shell preview — prevents creation state loss on render crash */
class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-48 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-white/40">Preview couldn't load</p>
            <button
              onClick={() => { this.setState({ hasError: false }); this.props.onReset?.(); }}
              className="text-xs text-white/25 hover:text-white/40 mt-2 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const EASE = MOTION.ease.premium;

const DEPLOY_STORAGE_KEY = 'hive_pending_deploy';

// ============================================================================
// PROMPT INPUT
// ============================================================================

function PromptInput({
  onSubmit,
  disabled,
  autoPrompt,
}: {
  onSubmit: (prompt: string) => void;
  disabled: boolean;
  autoPrompt?: string;
}) {
  const [value, setValue] = useState(autoPrompt ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoPrompt) {
      setValue(autoPrompt);
      // Auto-submit if we got a prompt from query params
      setTimeout(() => onSubmit(autoPrompt), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={`"Best pizza place near campus" or "Who's coming Friday"...`}
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 pr-12 rounded-2xl text-[15px] bg-white/[0.03] border border-white/[0.08]
            text-white placeholder:text-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-white/20
            disabled:opacity-50 transition-colors duration-100"
          style={{ minHeight: 48, maxHeight: 120 }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="absolute right-2 bottom-2 h-9 w-9 flex items-center justify-center
            rounded-full bg-white text-black disabled:opacity-30 disabled:bg-white/20
            hover:bg-white/90 transition-colors duration-100"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SHELL CONFIG EDITOR — inline editing for matched shells
// ============================================================================

function PollConfigEditor({
  config,
  onChange,
}: {
  config: PollConfig;
  onChange: (c: PollConfig) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Question</label>
        <input
          type="text"
          value={config.question}
          onChange={(e) => onChange({ ...config, question: e.target.value })}
          className="w-full px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
            text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Options</label>
        <div className="space-y-1.5">
          {config.options.map((opt, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...config.options];
                  newOptions[i] = e.target.value;
                  onChange({ ...config, options: newOptions });
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
                  text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              {config.options.length > 2 && (
                <button
                  onClick={() => {
                    const newOptions = config.options.filter((_, j) => j !== i);
                    onChange({ ...config, options: newOptions });
                  }}
                  className="text-white/20 hover:text-white/40 text-[11px] px-1.5"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {config.options.length < 6 && (
            <button
              onClick={() => onChange({ ...config, options: [...config.options, ''] })}
              className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
            >
              + Add option
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BracketConfigEditor({
  config,
  onChange,
}: {
  config: BracketConfig;
  onChange: (c: BracketConfig) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Topic</label>
        <input
          type="text"
          value={config.topic}
          onChange={(e) => onChange({ ...config, topic: e.target.value })}
          className="w-full px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
            text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Entries</label>
        <div className="space-y-1.5">
          {config.entries.map((entry, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                type="text"
                value={entry}
                onChange={(e) => {
                  const newEntries = [...config.entries];
                  newEntries[i] = e.target.value;
                  onChange({ ...config, entries: newEntries });
                }}
                placeholder={`Entry ${i + 1}`}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
                  text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              {config.entries.length > 4 && (
                <button
                  onClick={() => {
                    const newEntries = config.entries.filter((_, j) => j !== i);
                    onChange({ ...config, entries: newEntries });
                  }}
                  className="text-white/20 hover:text-white/40 text-[11px] px-1.5"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {config.entries.length < 16 && (
            <button
              onClick={() => onChange({ ...config, entries: [...config.entries, ''] })}
              className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
            >
              + Add entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RSVPConfigEditor({
  config,
  onChange,
}: {
  config: RSVPConfig;
  onChange: (c: RSVPConfig) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Title</label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
            text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div>
        <label className="text-[11px] text-white/30 mb-0.5 block">Location (optional)</label>
        <input
          type="text"
          value={config.location ?? ''}
          onChange={(e) => onChange({ ...config, location: e.target.value || undefined })}
          placeholder="e.g. Student Union Room 210"
          className="w-full px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
            text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-white/30 mb-0.5 block">Date & time</label>
          <input
            type="datetime-local"
            value={config.dateTime ?? ''}
            onChange={(e) => onChange({ ...config, dateTime: e.target.value || undefined })}
            className="w-full px-2 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
              text-white focus:outline-none focus:ring-1 focus:ring-white/20
              [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-[11px] text-white/30 mb-0.5 block">Capacity</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={config.capacity ?? ''}
            onChange={(e) =>
              onChange({ ...config, capacity: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="No limit"
            className="w-full px-2 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
              text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
      </div>
    </div>
  );
}

function ShellConfigEditor({
  format,
  config,
  onChange,
}: {
  format: ShellFormat;
  config: ShellConfig;
  onChange: (config: ShellConfig) => void;
}) {
  if (!config) return null;

  switch (format) {
    case 'poll':
      return <PollConfigEditor config={config as PollConfig} onChange={onChange} />;
    case 'bracket':
      return <BracketConfigEditor config={config as BracketConfig} onChange={onChange} />;
    case 'rsvp':
      return <RSVPConfigEditor config={config as RSVPConfig} onChange={onChange} />;
    default:
      return null;
  }
}

// ============================================================================
// PHASE INDICATORS
// ============================================================================

function PhaseIndicator({ phase }: { phase: BuildPhase }) {
  const labels: Record<BuildPhase, string> = {
    idle: '',
    classifying: 'Figuring out the best format...',
    'shell-matched': 'Got it — here\'s what we made',
    generating: 'Building it now...',
    complete: 'Done — share it with your people',
    error: 'That didn\'t work',
  };

  if (phase === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-xs text-white/40 mt-3"
    >
      {(phase === 'classifying' || phase === 'generating') && (
        <Loader2 className="w-3 h-3 animate-spin text-white/30" />
      )}
      {phase === 'shell-matched' && <Wand2 className="w-3 h-3 text-[#FFD700]/60" />}
      {phase === 'complete' && <Check className="w-3 h-3 text-[#10B981]/60" />}
      <span>{labels[phase]}</span>
    </motion.div>
  );
}

// ============================================================================
// CODE PREVIEW (streaming custom gen)
// ============================================================================

function CodePreview({
  status,
  codeOutput,
}: {
  status: string;
  codeOutput: { html: string; css: string; js: string } | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!codeOutput || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0a0a0a; color: #fff; font-family: system-ui, sans-serif; }
          ${codeOutput.css}
        </style>
      </head>
      <body>
        ${codeOutput.html}
        <script>${codeOutput.js}<\/script>
      </body>
      </html>
    `);
    doc.close();
  }, [codeOutput]);

  return (
    <div className="w-full h-full flex flex-col">
      {status && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-white/30 border-b border-white/[0.06]">
          <Loader2 className="w-3 h-3 animate-spin" />
          {status}
        </div>
      )}
      {codeOutput ? (
        <iframe
          ref={iframeRef}
          className="flex-1 w-full border-0 rounded-b-2xl bg-[#0a0a0a]"
          sandbox="allow-scripts"
          title="App preview"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <BrandSpinner size="md" variant="gold" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DEPLOY GATE
// ============================================================================

function savePendingDeploy(state: { prompt: string; format?: string; config?: ShellConfig }) {
  try {
    localStorage.setItem(DEPLOY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

function loadPendingDeploy(): { prompt: string; format?: string; config?: ShellConfig } | null {
  try {
    const raw = localStorage.getItem(DEPLOY_STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(DEPLOY_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ============================================================================
// MY APPS SECTION
// ============================================================================

interface MyTool {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  deployments: number;
  useCount: number;
}

function MyAppsSection() {
  const router = useRouter();
  const [tools, setTools] = useState<MyTool[]>([]);
  const [stats, setStats] = useState<{ totalTools: number; totalUsers: number; weeklyInteractions: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/tools/my-tools', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data?.data?.tools) {
          setTools(data.data.tools);
          setStats(data.data.stats);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  if (tools.length === 0) {
    return (
      <div className="mt-6">
        <span className="text-xs text-white/25 uppercase tracking-wider">Your Apps</span>
        <p className="text-sm text-white/20 mt-2">
          Apps you make show up here. Try typing what you need above.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/25 uppercase tracking-wider">Your Apps</span>
        {stats && stats.totalUsers > 0 && (
          <span className="text-[10px] text-white/20">
            {stats.totalUsers} user{stats.totalUsers !== 1 ? 's' : ''} reached
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {tools.slice(0, 5).map(tool => (
          <button
            key={tool.id}
            onClick={() => router.push(`/build/${tool.id}`)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
              bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60 group-hover:text-white/80 truncate transition-colors">
                {tool.name}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/20 flex-shrink-0">
              {tool.deployments > 0 && (
                <span>{tool.deployments} space{tool.deployments !== 1 ? 's' : ''}</span>
              )}
              {tool.useCount > 0 && (
                <span>{tool.useCount} use{tool.useCount !== 1 ? 's' : ''}</span>
              )}
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// SPACE PLACEMENT FLOW
// ============================================================================

interface UserSpace {
  id: string;
  name: string;
  handle: string;
  iconURL?: string | null;
  membership: { role: string };
}

function SpacePlacementFlow({
  toolId,
  toolName,
  originSpaceId,
  onSkip,
  onPlaced,
}: {
  toolId: string;
  toolName: string;
  originSpaceId: string | null;
  onSkip: () => void;
  onPlaced: (spaceHandle: string) => void;
}) {
  const [spaces, setSpaces] = useState<UserSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [deployed, setDeployed] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile/my-spaces', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const all: UserSpace[] = (data.spaces || []).map((s: UserSpace) => ({
          id: s.id,
          name: s.name,
          handle: s.handle,
          iconURL: s.iconURL,
          membership: s.membership,
        }));
        setSpaces(all);
        setLoading(false);

        // Auto-deploy if originSpaceId matches
        if (originSpaceId) {
          const match = all.find(s => s.id === originSpaceId);
          if (match) {
            handleDeploy(match);
          }
        }
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeploy = async (space: UserSpace) => {
    setDeploying(space.id);
    try {
      const res = await fetch(`/api/spaces/${space.id}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toolId }),
      });

      if (res.ok) {
        setDeployed(space.id);
        toast.success(`${toolName} placed in ${space.name}`);
        setTimeout(() => onPlaced(space.handle), 800);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || err?.message || 'Deploy failed';
        // Already deployed is fine — treat as success
        if (res.status === 409) {
          setDeployed(space.id);
          toast.success(`Already in ${space.name}`);
          setTimeout(() => onPlaced(space.handle), 800);
        } else {
          toast.error(msg);
          setDeploying(null);
        }
      }
    } catch {
      toast.error('Failed to place app');
      setDeploying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-white/40">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading your spaces...
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-white/40">
          Join or create a space to place your app where people can find it.
        </p>
        <button
          onClick={onSkip}
          className="text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Skip for now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {spaces.map(space => (
        <button
          key={space.id}
          onClick={() => handleDeploy(space)}
          disabled={!!deploying}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]
            disabled:opacity-50 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {space.iconURL ? (
              <img src={space.iconURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] text-white/40 font-medium">
                {space.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80 truncate">{space.name}</p>
            <p className="text-[11px] text-white/30">{space.membership.role}</p>
          </div>
          {deploying === space.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-white/40 flex-shrink-0" />
          ) : deployed === space.id ? (
            <Check className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function BuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { track } = useAnalytics();

  const originSpaceId = searchParams.get('spaceId');
  const originSpaceName = searchParams.get('spaceName');
  const autoPrompt = searchParams.get('prompt') || undefined;

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
    spaceContext: originSpaceId && originSpaceName ? {
      spaceId: originSpaceId,
      spaceName: originSpaceName,
    } : null,
    onToolCreated: (toolId) => {
      track('creation_completed', { toolId, source: 'build-page' });
      // Trigger push permission prompt after first creation — this is THE value moment
      emitValueMoment({ type: 'first-creation' });
    },
  });

  // On mount: check for pending deploy from auth flow
  useEffect(() => {
    if (!authLoading && user) {
      const pending = loadPendingDeploy();
      if (pending?.prompt) {
        if (pending.format && pending.config && isNativeFormat(pending.format as ShellFormat)) {
          // Restore directly to shell-matched — skip re-classification
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
      // Save creation state and redirect to auth
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
  const registryEntry = isShellMatched ? SHELL_REGISTRY[shellFormat as Exclude<ShellFormat, 'custom'>] : null;

  // Loading
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
        {/* ============================================ */}
        {/* LEFT PANEL — Prompt + controls               */}
        {/* ============================================ */}
        <div className="relative w-full lg:w-[360px] lg:min-w-[320px] lg:border-r lg:border-white/[0.06] flex flex-col">
          {/* Subtle gold glow behind creation surface (design rule §19) */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, #FFD700, transparent 70%)',
            }}
          />
          <div className="relative px-5 py-6 flex flex-col overflow-y-auto">
            {/* Header — minimal */}
            <div className="mb-4">
              <h1 className="text-base font-medium text-white mb-0.5">
                What do you need?
              </h1>
              {originSpaceName ? (
                <p className="text-sm text-white/50">
                  Building for <span className="text-white/70 font-medium">{originSpaceName}</span>
                </p>
              ) : (
                <p className="text-sm text-white/30">
                  Poll, bracket, RSVP — just say what and we handle the rest.
                </p>
              )}
            </div>

            {/* Prompt input */}
            <PromptInput
              onSubmit={submitPrompt}
              disabled={isWorking}
              autoPrompt={autoPrompt}
            />

            {/* Example prompts — idle only, right under the input */}
            {state.phase === 'idle' && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/20">People are making:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Best dining hall on campus?',
                    'Who\'s coming to the pregame tonight?',
                    'Rate the professors — tournament style',
                    'Sign up for the bake sale',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => submitPrompt(example)}
                      className="px-3 py-1.5 rounded-full text-xs text-white/30 bg-white/[0.03]
                        border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/50
                        transition-colors duration-100"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                {/* My Apps — show creator's existing tools in idle state */}
                {user && <MyAppsSection />}
              </div>
            )}

            {/* Phase indicator — hidden when shell editor is showing (it duplicates info) */}
            {state.phase !== 'shell-matched' && <PhaseIndicator phase={state.phase} />}

            {/* Shell config editor (only in shell-matched phase) */}
            <AnimatePresence mode="wait">
              {isShellMatched && state.shellConfig && (
                <motion.div
                  key="shell-editor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="mt-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5 text-[#FFD700]/50" />
                      <span className="text-xs font-medium text-white/50">
                        {registryEntry?.displayName} detected
                      </span>
                    </div>
                    <span className="text-[10px] text-white/20 px-2 py-0.5 rounded-full bg-white/[0.04]">
                      {Math.round((state.classification?.confidence ?? 0) * 100)}% match
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <ShellConfigEditor
                      format={shellFormat!}
                      config={state.shellConfig}
                      onChange={updateShellConfig}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleDeploy}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full
                        bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors duration-100"
                    >
                      <Zap className="w-4 h-4" />
                      {user ? 'Deploy' : 'Sign in to deploy'}
                    </button>
                    <button
                      onClick={escalateToCustom}
                      className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-full
                        text-sm text-white/50 bg-white/[0.04] hover:bg-white/[0.06] hover:text-white
                        transition-colors duration-100"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Make it custom
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Complete state actions */}
            <AnimatePresence>
              {state.phase === 'complete' && state.toolId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  <div className="flex items-center gap-2 text-sm text-[#FFD700]">
                    <Check className="w-4 h-4" />
                    <span>
                      {state.toolName || 'Your app'} is ready — get it to your people
                    </span>
                  </div>

                  {/* Place in a Space — primary post-creation action */}
                  {user && (
                    <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.03] p-4">
                      <p className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FFD700]" />
                        Place in a space so people can find it
                      </p>
                      <SpacePlacementFlow
                        toolId={state.toolId}
                        toolName={state.toolName || 'Your app'}
                        originSpaceId={originSpaceId}
                        onSkip={() => router.push(`/t/${state.toolId}?just_created=true`)}
                        onPlaced={(handle) => router.push(`/s/${handle}`)}
                      />
                    </div>
                  )}

                  {/* Secondary actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => router.push(`/t/${state.toolId}?just_created=true`)}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View standalone
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/40 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Make another
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error state */}
            {state.phase === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <p className="text-sm text-red-400/80 mb-3">{state.error}</p>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Try again
                </button>
              </motion.div>
            )}

          </div>
        </div>

        {/* ============================================ */}
        {/* RIGHT PANEL — Preview                        */}
        {/* ============================================ */}
        <div className="flex-1 flex flex-col min-h-[50vh] lg:min-h-0 bg-white/[0.015]">
          <AnimatePresence mode="wait">
            {!showPreview ? (
              /* Idle: show example shell cards as inspiration */
              <motion.div
                key="inspiration"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-start pt-12 lg:pt-16 px-8"
              >
                <p className="text-xs text-white/20 mb-6 font-mono uppercase tracking-wider">
                  What people are making
                </p>
                <div className="grid gap-3 w-full max-w-md">
                  {/* Mini poll preview */}
                  <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                        <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Poll</span>
                      </div>
                      <span className="text-[10px] text-white/20">247 votes</span>
                    </div>
                    <p className="text-sm text-white/60 mb-3">Best late-night food near campus?</p>
                    <div className="space-y-1.5">
                      <div className="h-7 rounded-lg bg-white/[0.06] relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-[42%] bg-white/[0.08] rounded-lg" />
                        <span className="relative z-10 flex items-center justify-between h-full px-2.5 text-[11px]">
                          <span className="text-white/50">Jim&apos;s Steakout</span>
                          <span className="text-white/30 font-mono">42%</span>
                        </span>
                      </div>
                      <div className="h-7 rounded-lg bg-white/[0.06] relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-[31%] bg-white/[0.05] rounded-lg" />
                        <span className="relative z-10 flex items-center justify-between h-full px-2.5 text-[11px]">
                          <span className="text-white/30">Danny&apos;s</span>
                          <span className="text-white/20 font-mono">31%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Mini RSVP + Bracket side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-4">
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">RSVP</span>
                      <p className="text-sm text-white/60 mt-1.5 mb-2">SGA Town Hall</p>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full w-[73%] bg-white/20 rounded-full" />
                      </div>
                      <p className="text-[10px] text-white/20 mt-1.5">147/200 going</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-4">
                      <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Bracket</span>
                      <p className="text-sm text-white/60 mt-1.5 mb-2">Best CSE prof</p>
                      <div className="flex rounded-lg overflow-hidden border border-white/[0.06]">
                        <div className="flex-1 py-1.5 text-center text-[10px] bg-white/[0.06] text-white/50">Hertz</div>
                        <div className="flex-1 py-1.5 text-center text-[10px] bg-white/[0.02] text-white/20">Alphonce</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : isShellMatched || (isShellFormat && state.phase === 'complete') ? (
              /* Shell preview — shown during editing AND after deploy */
              <motion.div
                key="shell-preview"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex-1 flex items-start justify-center px-6 pt-12 lg:pt-16"
              >
                <div className="w-full max-w-md">
                  <PreviewErrorBoundary>
                    <Suspense
                      fallback={
                        <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />
                      }
                    >
                      <ShellRenderer
                        format={shellFormat!}
                        shellId="preview"
                        config={state.shellConfig}
                        state={null}
                        currentUserId="preview-user"
                        creatorId="preview-user"
                        isCreator={true}
                        onAction={() => {}}
                        compact={false}
                      />
                    </Suspense>
                  </PreviewErrorBoundary>
                </div>
              </motion.div>
            ) : (state.phase === 'generating' || state.phase === 'complete') ? (
              /* Code gen preview */
              <motion.div
                key="code-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col rounded-2xl overflow-hidden m-3 lg:m-4
                  border border-white/[0.06] bg-[#0a0a0a]"
              >
                <CodePreview
                  status={state.phase === 'generating' ? state.streamingStatus : ''}
                  codeOutput={state.codeOutput}
                />
              </motion.div>
            ) : state.phase === 'classifying' ? (
              /* Classifying state */
              <motion.div
                key="classifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center">
                  <BrandSpinner size="md" variant="gold" />
                  <p className="text-xs text-white/25 mt-4">
                    Understanding your idea...
                  </p>
                </div>
              </motion.div>
            ) : state.phase === 'error' ? (
              /* Error state — right panel */
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center px-8"
              >
                <div className="text-center max-w-xs">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-400 text-lg">!</span>
                  </div>
                  <p className="text-sm text-white/50 mb-2">Something went wrong</p>
                  <p className="text-xs text-white/25">
                    Try a simpler prompt, or try again in a moment.
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
