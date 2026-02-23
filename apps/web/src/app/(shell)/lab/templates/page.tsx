'use client';

/**
 * /lab/templates — Template-First Creation Flow
 *
 * 8 core templates → tap → name → deployed. No builder, no prompt.
 * Fastest path from zero to live tool.
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  ArrowLeft, Loader2, BarChart3, CalendarDays, ClipboardList,
  MessageSquare, Trophy, Megaphone, CheckSquare, Users,
} from 'lucide-react';
import { MOTION } from '@hive/tokens';
import { createToolFromTemplateApi } from '@/lib/hivelab/create-tool';
import { useAnalytics } from '@/hooks/use-analytics';
import { getQuickTemplate } from '@hive/ui';

// ═══════════════════════════════════════════════════════════════════
// CORE 8 TEMPLATES
// ═══════════════════════════════════════════════════════════════════

interface CoreTemplate {
  id: string;
  emoji: string;
  name: string;
  description: string;
  /** The quick-template ID from the registry */
  templateId: string;
}

const CORE_TEMPLATES: CoreTemplate[] = [
  {
    id: 'quick-poll',
    emoji: '',
    name: 'Quick Poll',
    description: 'Gather opinions in one tap',
    templateId: 'quick-poll',
  },
  {
    id: 'event-rsvp',
    emoji: '',
    name: 'Event RSVP',
    description: 'Let members RSVP instantly',
    templateId: 'event-rsvp',
  },
  {
    id: 'signup-sheet',
    emoji: '',
    name: 'Signup Sheet',
    description: 'Slot-based signups for anything',
    templateId: 'resource-signup',
  },
  {
    id: 'feedback-form',
    emoji: '',
    name: 'Feedback Form',
    description: 'Collect structured feedback',
    templateId: 'feedback-form',
  },
  {
    id: 'leaderboard',
    emoji: '',
    name: 'Leaderboard',
    description: 'Track points and rankings',
    templateId: 'member-leaderboard',
  },
  {
    id: 'announcement',
    emoji: '',
    name: 'Announcement',
    description: 'Pin important updates',
    templateId: 'announcements',
  },
  {
    id: 'checklist',
    emoji: '',
    name: 'Meeting Notes',
    description: 'Collaborative notes with checklist',
    templateId: 'meeting-notes',
  },
  {
    id: 'member-directory',
    emoji: '',
    name: 'Group Signup',
    description: 'Collect signups for study groups',
    templateId: 'study-group-signup',
  },
];

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'quick-poll': BarChart3,
  'event-rsvp': CalendarDays,
  'signup-sheet': ClipboardList,
  'feedback-form': MessageSquare,
  'leaderboard': Trophy,
  'announcement': Megaphone,
  'checklist': CheckSquare,
  'member-directory': Users,
};

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════

const EASE = MOTION.ease.premium;

const COLORS = {
  bg: 'var(--hivelab-bg, #000000)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #0D0D14)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.06))',
  borderHover: 'rgba(255, 255, 255, 0.14)',
  accent: 'var(--life-gold, #FFD700)',
  shadowBase: '0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 8px rgba(0,0,0,0.4)',
  shadowHover: '0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 20px rgba(0,0,0,0.5), 0 0 24px rgba(255,215,0,0.06)',
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * TemplateTile — Single template card in the grid
 */
function TemplateTile({
  template,
  index,
  onSelect,
  disabled,
}: {
  template: CoreTemplate;
  index: number;
  onSelect: (template: CoreTemplate) => void;
  disabled: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.25,
        delay: shouldReduceMotion ? 0 : index * 0.05,
        ease: EASE,
      }}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={() => !disabled && onSelect(template)}
      disabled={disabled}
      className="text-left p-5 rounded-2xl border transition-all duration-150 group relative overflow-hidden"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
        boxShadow: COLORS.shadowBase,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = COLORS.borderHover;
          e.currentTarget.style.boxShadow = COLORS.shadowHover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.boxShadow = COLORS.shadowBase;
      }}
    >
      {(() => {
        const Icon = TEMPLATE_ICONS[template.id];
        return Icon ? (
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center mb-3">
            <Icon className="w-4 h-4 text-white/50" />
          </div>
        ) : null;
      })()}
      <div
        className="font-medium text-[15px] mb-1"
        style={{ color: COLORS.text }}
      >
        {template.name}
      </div>
      <div
        className="text-[13px] leading-snug"
        style={{ color: COLORS.textSecondary }}
      >
        {template.description}
      </div>
    </motion.button>
  );
}

/**
 * NameDialog — Inline naming step after selecting a template
 */
function NameDialog({
  template,
  onConfirm,
  onBack,
  isCreating,
}: {
  template: CoreTemplate;
  onConfirm: (name: string) => void;
  onBack: () => void;
  isCreating: boolean;
}) {
  const [name, setName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), shouldReduceMotion ? 0 : 200);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
      className="w-full max-w-md mx-auto"
    >
      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
          boxShadow: COLORS.shadowBase,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          {(() => {
            const Icon = TEMPLATE_ICONS[template.id];
            return Icon ? (
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white/50" />
              </div>
            ) : null;
          })()}
          <div>
            <div className="font-medium text-[15px]" style={{ color: COLORS.text }}>
              {template.name}
            </div>
            <div className="text-[13px]" style={{ color: COLORS.textSecondary }}>
              {template.description}
            </div>
          </div>
        </div>

        {/* Name input */}
        <form onSubmit={handleSubmit}>
          <label
            className="block text-[13px] font-medium mb-2"
            style={{ color: COLORS.textSecondary }}
          >
            Name your creation
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. "${template.name} for Spring 2026"`}
            maxLength={80}
            disabled={isCreating}
            className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-colors duration-150 border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderColor: COLORS.border,
              color: COLORS.text,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderHover;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          />

          {/* Actions */}
          <div className="flex items-center justify-between mt-5">
            <button
              type="button"
              onClick={onBack}
              disabled={isCreating}
              className="text-[13px] font-medium transition-colors duration-150"
              style={{ color: COLORS.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textSecondary;
              }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150"
              style={{
                backgroundColor: name.trim() && !isCreating ? COLORS.text : 'rgba(255, 255, 255, 0.06)',
                color: name.trim() && !isCreating ? '#000' : COLORS.textTertiary,
                cursor: name.trim() && !isCreating ? 'pointer' : 'not-allowed',
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create & Deploy'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════

type PageState = 'grid' | 'naming' | 'creating';

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const { track, startTimer, elapsed } = useAnalytics();

  // Space context from query params (when launched from a space)
  const originSpaceId = searchParams.get('spaceId');
  const originSpaceName = searchParams.get('spaceName');
  const originSpaceHandle = searchParams.get('spaceHandle');

  const [state, setState] = React.useState<PageState>('grid');
  const [selected, setSelected] = React.useState<CoreTemplate | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSelectTemplate = React.useCallback((template: CoreTemplate) => {
    setSelected(template);
    setState('naming');
    setError(null);
    startTimer();
    track('creation_started', { source: 'template' });
  }, [startTimer, track]);

  const handleBack = React.useCallback(() => {
    setState('grid');
    setSelected(null);
    setError(null);
  }, []);

  const handleCreate = React.useCallback(
    async (toolName: string) => {
      if (!selected) return;
      setState('creating');
      setError(null);

      try {
        // Resolve the QuickTemplate from the registry
        const quickTemplate = getQuickTemplate(selected.templateId);
        if (!quickTemplate) {
          throw new Error(`Template "${selected.templateId}" not found in registry`);
        }

        // Create the tool via API
        const toolId = await createToolFromTemplateApi(quickTemplate, { title: toolName });

        // If launched from a space context, deploy to that space
        if (originSpaceId) {
          try {
            const deployRes = await fetch(`/api/spaces/${originSpaceId}/tools/feature`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ toolId }),
            });

            if (deployRes.ok) {
              track('creation_completed', { toolId, source: 'template', durationMs: elapsed() });
              track('creation_deployed', { toolId, spaceId: originSpaceId });
              toast.success(`${toolName} added to ${originSpaceName ? decodeURIComponent(originSpaceName) : 'your space'}`);
              // Return to the space — the tool is already deployed there
              if (originSpaceHandle) {
                router.push(`/s/${decodeURIComponent(originSpaceHandle)}`);
              } else {
                router.push(`/lab/${toolId}`);
              }
              return;
            }
            // Deploy failed — still redirect to tool, user can deploy manually
            logger.warn('Auto-deploy failed, tool created but not deployed', {
              component: 'TemplatesPage',
              spaceId: originSpaceId,
              toolId,
            });
          } catch (deployErr) {
            logger.warn('Auto-deploy threw, tool created but not deployed', {
              component: 'TemplatesPage',
              spaceId: originSpaceId,
              toolId,
            });
          }
        }

        track('creation_completed', { toolId, source: 'template', durationMs: elapsed() });
        toast.success(`${toolName} created`);
        // Navigate to the tool IDE (with deploy modal hint if from a space)
        const spaceParam = originSpaceId ? `?deploy=true&spaceId=${originSpaceId}` : '';
        router.push(`/lab/${toolId}${spaceParam}`);
      } catch (err) {
        logger.error(
          'Failed to create tool from template',
          { component: 'TemplatesPage', templateId: selected.templateId },
          err instanceof Error ? err : undefined
        );
        setError(err instanceof Error ? err.message : 'Failed to create tool');
        toast.error('Failed to create. Please try again.');
        setState('naming');
      }
    },
    [selected, originSpaceId, originSpaceName, router]
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
        >
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 text-[13px] transition-colors duration-150 mb-8"
            style={{ color: COLORS.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Lab
          </Link>
        </motion.div>

        {/* Space context banner */}
        {originSpaceName && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
            className="mb-6 p-3 rounded-xl text-center text-[13px]"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
            }}
          >
            Creating for{' '}
            <span className="font-medium" style={{ color: COLORS.text }}>
              {decodeURIComponent(originSpaceName)}
            </span>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: EASE }}
          className="text-center mb-8"
        >
          <h1
            className="text-2xl sm:text-3xl font-semibold mb-2"
            style={{ color: COLORS.text }}
          >
            {state === 'grid' ? 'Pick a template' : selected?.name}
          </h1>
          <p className="text-[14px]" style={{ color: COLORS.textSecondary }}>
            {state === 'grid'
              ? 'Tap to create. Live in seconds.'
              : 'Give it a name and deploy'}
          </p>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {state === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {CORE_TEMPLATES.map((template, index) => (
                <TemplateTile
                  key={template.id}
                  template={template}
                  index={index}
                  onSelect={handleSelectTemplate}
                  disabled={false}
                />
              ))}
            </motion.div>
          )}

          {(state === 'naming' || state === 'creating') && selected && (
            <NameDialog
              key="naming"
              template={selected}
              onConfirm={handleCreate}
              onBack={handleBack}
              isCreating={state === 'creating'}
            />
          )}
        </AnimatePresence>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl text-center text-[13px]"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Create from scratch CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.5, duration: shouldReduceMotion ? 0 : 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/lab/new"
            className="text-[13px] transition-colors duration-150"
            style={{ color: COLORS.textTertiary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.textTertiary;
            }}
          >
            or describe what you need →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
