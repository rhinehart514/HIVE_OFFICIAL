'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, ArrowRightIcon, RectangleStackIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const LayoutTemplate = RectangleStackIcon;
const Shapes = RectangleGroupIcon;
import { cn } from '../../../lib/utils';

// Workshop tokens
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]';
const workshopTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };
const workshopTransitionSnappy = { type: 'spring' as const, stiffness: 500, damping: 30 };

interface StartZoneProps {
  onOpenAI: () => void;
  onOpenTemplates: () => void;
  onOpenElements: () => void;
  onQuickPrompt?: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  'Create a poll for voting on meeting times',
  'Build an event countdown with RSVP',
  'Make a study group signup form',
  'Create a leaderboard for club challenges',
];

interface WorkflowCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  shortcut: string;
  onClick: () => void;
  primary?: boolean;
  iconBg?: string;
}

function WorkflowCard({
  icon,
  title,
  subtitle,
  shortcut,
  onClick,
  primary,
  iconBg,
}: WorkflowCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ opacity: 0.9 }}
      whileTap={{ opacity: 0.8 }}
      transition={workshopTransitionSnappy}
      className={cn(
        'relative flex flex-col items-center text-center p-6 rounded-2xl',
        'border transition-all duration-200 group',
        primary
          ? 'bg-[var(--hivelab-surface)] border-[var(--hivelab-border-emphasis)] hover:border-[var(--life-gold)]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]'
          : 'bg-[var(--hivelab-surface)]/50 border-[var(--hivelab-border)] hover:border-[var(--hivelab-border-emphasis)] hover:bg-[var(--hivelab-surface)] hover:shadow-lg',
        focusRing
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
          'transition-all duration-200 group-hover:opacity-80',
          iconBg || 'bg-[var(--hivelab-bg)]'
        )}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-[var(--hivelab-text-primary)] font-semibold text-base mb-1 transition-colors group-hover:text-white">{title}</h3>

      {/* Subtitle */}
      <p className="text-[var(--hivelab-text-secondary)] text-sm mb-3 transition-colors group-hover:text-[var(--hivelab-text-primary)]">{subtitle}</p>

      {/* Shortcut */}
      <kbd className="px-2 py-1 text-xs bg-[var(--hivelab-bg)] rounded-md text-[var(--hivelab-text-tertiary)] font-mono transition-colors group-hover:text-[var(--hivelab-text-secondary)] group-hover:bg-[var(--hivelab-surface)]">
        {shortcut}
      </kbd>

      {/* Glow effect for primary */}
      {primary && (
        <div className="absolute inset-0 rounded-2xl bg-[var(--life-gold)]/5 pointer-events-none transition-opacity group-hover:bg-[var(--life-gold)]/10" />
      )}
    </motion.button>
  );
}

export function StartZone({
  onOpenAI,
  onOpenTemplates,
  onOpenElements,
  onQuickPrompt,
}: StartZoneProps) {
  const [randomPrompt] = useState(
    () => EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={workshopTransition}
      className="absolute inset-0 z-20 flex items-center justify-center p-8"
      style={{
        backgroundColor: 'var(--hivelab-bg, #0A0A0A)',
        isolation: 'isolate',
      }}
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h2 className="text-heading-sm font-semibold text-[var(--hivelab-text-primary)] tracking-[-0.02em] mb-2">
            What would you like to build?
          </h2>
          <p className="text-[var(--hivelab-text-secondary)] text-base">
            Create tools your community will love
          </p>
        </motion.div>

        {/* Workflow Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <WorkflowCard
            icon={<SparklesIcon className="h-6 w-6 text-[var(--life-gold)]" />}
            title="Describe it"
            subtitle="AI creates your tool"
            shortcut="⌘K"
            onClick={onOpenAI}
            primary
            iconBg="bg-[var(--life-gold)]/10"
          />
          <WorkflowCard
            icon={<LayoutTemplate className="h-6 w-6 text-[var(--hivelab-text-secondary)]" />}
            title="Use a template"
            subtitle="29 templates to start"
            shortcut="⌘T"
            onClick={onOpenTemplates}
          />
          <WorkflowCard
            icon={<Shapes className="h-6 w-6 text-[var(--hivelab-text-secondary)]" />}
            title="Build manually"
            subtitle="27 elements to combine"
            shortcut="⌘E"
            onClick={onOpenElements}
          />
        </motion.div>

        {/* Quick Prompt Suggestion */}
        {onQuickPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'p-4 rounded-xl',
              'bg-[var(--hivelab-surface)]/50 border border-[var(--hivelab-border)]'
            )}
          >
            <p className="text-sm text-[var(--hivelab-text-tertiary)] mb-2">Try this:</p>
            <button
              type="button"
              onClick={() => onQuickPrompt(randomPrompt)}
              className={cn(
                'group flex items-center gap-2 text-left',
                'text-[var(--hivelab-text-primary)] hover:text-[var(--life-gold)]',
                'transition-colors duration-[var(--workshop-duration)]',
                focusRing
              )}
            >
              <span className="text-base">"{randomPrompt}"</span>
              <ArrowRightIcon className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[var(--workshop-duration)]" />
            </button>
          </motion.div>
        )}

        {/* Keyboard hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[var(--hivelab-text-tertiary)] text-sm mt-8"
        >
          Press <kbd className="px-1.5 py-0.5 bg-[var(--hivelab-surface)] rounded text-[var(--hivelab-text-tertiary)]">/</kbd>{' '}
          anywhere to quickly add elements
        </motion.p>
      </div>
    </motion.div>
  );
}
