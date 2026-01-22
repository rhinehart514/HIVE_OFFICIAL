'use client';

/**
 * TemplateOverlay — Empty State Template Suggestions
 *
 * Per DRAMA plan:
 * - 3-4 template cards (top picks)
 * - Click loads instantly into canvas
 * - "Start from scratch" option below
 * - "See all templates →" link
 */

import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon, DocumentDuplicateIcon, ArrowRightIcon, ClockIcon, ListBulletIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';
import { MOTION } from '../../../tokens/motion';
import type { ToolComposition } from '../../../lib/hivelab/element-system';

const EASE = MOTION.ease.premium;

// Colors matching HiveLab dark theme
const COLORS = {
  bg: 'var(--hivelab-bg, #0A0A0A)',
  panel: 'var(--hivelab-panel, #1A1A1A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  gold: 'var(--life-gold, #D4AF37)',
};

// Top 4 template picks
const TOP_TEMPLATES: TemplateCardData[] = [
  {
    id: 'quick-poll',
    name: 'Quick Poll',
    description: 'Gather votes and opinions',
    icon: <ListBulletIcon className="h-5 w-5" />,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    composition: {
      id: 'template-quick-poll',
      name: 'Quick Poll',
      description: 'Gather votes and opinions with a simple poll',
      layout: 'flow' as const,
      elements: [
        {
          elementId: 'poll-element',
          instanceId: 'poll_1',
          config: {
            question: 'What do you think?',
            options: ['Option A', 'Option B', 'Option C'],
          },
          position: { x: 100, y: 100 },
          size: { width: 320, height: 200 },
        },
        {
          elementId: 'chart-display',
          instanceId: 'chart_1',
          config: { chartType: 'bar' },
          position: { x: 100, y: 340 },
          size: { width: 320, height: 180 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'poll_1', output: 'votes' },
          to: { instanceId: 'chart_1', input: 'data' },
        },
      ],
    },
  },
  {
    id: 'event-countdown',
    name: 'Event Countdown',
    description: 'Build excitement for events',
    icon: <ClockIcon className="h-5 w-5" />,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
    composition: {
      id: 'template-event-countdown',
      name: 'Event Countdown',
      description: 'Build excitement for upcoming events',
      layout: 'flow' as const,
      elements: [
        {
          elementId: 'countdown-timer',
          instanceId: 'countdown_1',
          config: {
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            label: 'Event starts in',
          },
          position: { x: 100, y: 100 },
          size: { width: 360, height: 160 },
        },
        {
          elementId: 'rsvp-button',
          instanceId: 'rsvp_1',
          config: { label: 'RSVP Now' },
          position: { x: 100, y: 300 },
          size: { width: 200, height: 80 },
        },
        {
          elementId: 'counter',
          instanceId: 'counter_1',
          config: { label: 'Going' },
          position: { x: 340, y: 300 },
          size: { width: 120, height: 80 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'rsvp_1', output: 'count' },
          to: { instanceId: 'counter_1', input: 'value' },
        },
      ],
    },
  },
  {
    id: 'signup-form',
    name: 'Signup Form',
    description: 'Collect member info',
    icon: <UserGroupIcon className="h-5 w-5" />,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    composition: {
      id: 'template-signup-form',
      name: 'Signup Form',
      description: 'Collect member info with a customizable form',
      layout: 'flow' as const,
      elements: [
        {
          elementId: 'form-builder',
          instanceId: 'form_1',
          config: {
            fields: [
              { type: 'text', label: 'Name', required: true },
              { type: 'email', label: 'Email', required: true },
              { type: 'select', label: 'Role', options: ['Member', 'Leader', 'Guest'] },
            ],
          },
          position: { x: 100, y: 100 },
          size: { width: 320, height: 280 },
        },
        {
          elementId: 'result-list',
          instanceId: 'results_1',
          config: { title: 'Signups' },
          position: { x: 460, y: 100 },
          size: { width: 280, height: 280 },
        },
      ],
      connections: [
        {
          from: { instanceId: 'form_1', output: 'submission' },
          to: { instanceId: 'results_1', input: 'items' },
        },
      ],
    },
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Track scores and rankings',
    icon: <TrophyIcon className="h-5 w-5" />,
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-400',
    composition: {
      id: 'template-leaderboard',
      name: 'Leaderboard',
      description: 'Track scores and rankings for competitions',
      layout: 'flow' as const,
      elements: [
        {
          elementId: 'leaderboard',
          instanceId: 'leaderboard_1',
          config: {
            title: 'Top Performers',
            scoreLabel: 'Points',
          },
          position: { x: 100, y: 100 },
          size: { width: 360, height: 320 },
        },
        {
          elementId: 'counter',
          instanceId: 'counter_1',
          config: { label: 'Total Participants' },
          position: { x: 500, y: 100 },
          size: { width: 180, height: 100 },
        },
      ],
      connections: [],
    },
  },
];

interface TemplateCardData {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  composition: ToolComposition;
}

interface TemplateCardProps {
  template: TemplateCardData;
  onClick: () => void;
  index: number;
}

function TemplateCard({ template, onClick, index }: TemplateCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
        delay: shouldReduceMotion ? 0 : 0.1 + index * 0.08,
        ease: EASE,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex flex-col items-center text-center p-5 rounded-xl',
        'border transition-all duration-200 group',
        'bg-[var(--hivelab-surface)] border-[var(--hivelab-border)]',
        'hover:border-white/20 hover:bg-[var(--hivelab-surface-hover)]',
        'hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center mb-3',
          'transition-all duration-200',
          template.iconBg,
          template.iconColor
        )}
      >
        {template.icon}
      </div>

      {/* Name */}
      <h3
        className="font-medium text-sm mb-1 transition-colors group-hover:text-white"
        style={{ color: COLORS.textPrimary }}
      >
        {template.name}
      </h3>

      {/* Description */}
      <p
        className="text-xs transition-colors"
        style={{ color: COLORS.textSecondary }}
      >
        {template.description}
      </p>
    </motion.button>
  );
}

interface TemplateOverlayProps {
  onSelectTemplate: (composition: ToolComposition) => void;
  onStartFromScratch: () => void;
  onOpenAI: () => void;
  onSeeAllTemplates: () => void;
}

export function TemplateOverlay({
  onSelectTemplate,
  onStartFromScratch,
  onOpenAI,
  onSeeAllTemplates,
}: TemplateOverlayProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
        ease: EASE,
      }}
      className="absolute inset-0 z-20 flex items-center justify-center p-8"
      style={{ backgroundColor: COLORS.bg }}
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
            delay: shouldReduceMotion ? 0 : 0.05,
            ease: EASE,
          }}
          className="text-center mb-8"
        >
          <h2
            className="text-2xl font-semibold tracking-tight mb-2"
            style={{ color: COLORS.textPrimary }}
          >
            Start with a template
          </h2>
          <p style={{ color: COLORS.textSecondary }}>
            Pick a template to customize, or start from scratch
          </p>
        </motion.div>

        {/* AI Option - Primary CTA */}
        <motion.button
          type="button"
          onClick={onOpenAI}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
            delay: shouldReduceMotion ? 0 : 0.08,
            ease: EASE,
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            'w-full flex items-center justify-center gap-3 px-5 py-4 mb-6',
            'rounded-xl border transition-all duration-200',
            'hover:shadow-[0_0_24px_rgba(212,175,55,0.15)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
          )}
          style={{
            backgroundColor: `${COLORS.gold}15`,
            borderColor: `${COLORS.gold}40`,
          }}
        >
          <SparklesIcon className="h-5 w-5" style={{ color: COLORS.gold }} />
          <span className="font-medium" style={{ color: COLORS.gold }}>
            Describe what you want to build
          </span>
          <kbd
            className="ml-2 px-2 py-0.5 text-xs rounded"
            style={{
              backgroundColor: `${COLORS.gold}20`,
              color: COLORS.gold,
            }}
          >
            ⌘K
          </kbd>
        </motion.button>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
            delay: shouldReduceMotion ? 0 : 0.1,
          }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="flex-1 h-px" style={{ backgroundColor: COLORS.border }} />
          <span className="text-xs" style={{ color: COLORS.textTertiary }}>
            or pick a template
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: COLORS.border }} />
        </motion.div>

        {/* Template Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {TOP_TEMPLATES.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={index}
              onClick={() => onSelectTemplate(template.composition)}
            />
          ))}
        </div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
            delay: shouldReduceMotion ? 0 : 0.4,
          }}
          className="flex items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={onStartFromScratch}
            className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:text-white"
            style={{ color: COLORS.textSecondary }}
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            Start from scratch
          </button>

          <span className="w-px h-4" style={{ backgroundColor: COLORS.border }} />

          <button
            type="button"
            onClick={onSeeAllTemplates}
            className="flex items-center gap-1.5 px-4 py-2 text-sm transition-colors hover:text-white group"
            style={{ color: COLORS.textSecondary }}
          >
            See all templates
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {/* Keyboard hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
            delay: shouldReduceMotion ? 0 : 0.5,
          }}
          className="text-center text-xs mt-8"
          style={{ color: COLORS.textTertiary }}
        >
          Press{' '}
          <kbd
            className="px-1.5 py-0.5 rounded"
            style={{ backgroundColor: COLORS.surface, color: COLORS.textTertiary }}
          >
            /
          </kbd>{' '}
          anywhere to quickly add elements
        </motion.p>
      </div>
    </motion.div>
  );
}
