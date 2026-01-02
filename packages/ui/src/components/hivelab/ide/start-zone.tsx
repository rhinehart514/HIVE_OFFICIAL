'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, LayoutTemplate, Shapes, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { focusClasses, premiumMotion, premiumPresets } from '../../../lib/premium-design';

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
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={premiumMotion.spring.snappy}
      className={cn(
        'relative flex flex-col items-center text-center p-6 rounded-2xl',
        'border transition-colors group',
        primary
          ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.04] border-white/[0.15] hover:border-white/[0.25]'
          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.05]',
        focusClasses()
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
          'transition-transform group-hover:scale-110',
          iconBg || 'bg-white/[0.08]'
        )}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-base mb-1">{title}</h3>

      {/* Subtitle */}
      <p className="text-[#9A9A9F] text-sm mb-3">{subtitle}</p>

      {/* Shortcut */}
      <kbd className="px-2 py-1 text-xs bg-white/[0.06] rounded-md text-[#6B6B70] font-mono">
        {shortcut}
      </kbd>

      {/* Glow effect for primary */}
      {primary && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#FFD700]/5 to-transparent pointer-events-none" />
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
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="absolute inset-0 flex items-center justify-center p-8"
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h2 className="text-[28px] font-semibold text-white tracking-[-0.02em] mb-2">
            What would you like to build?
          </h2>
          <p className="text-[#9A9A9F] text-base">
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
            icon={<Sparkles className="h-6 w-6 text-[#FFD700]" />}
            title="Describe it"
            subtitle="AI creates your tool"
            shortcut="⌘K"
            onClick={onOpenAI}
            primary
            iconBg="bg-[#FFD700]/10"
          />
          <WorkflowCard
            icon={<LayoutTemplate className="h-6 w-6 text-white/80" />}
            title="Use a template"
            subtitle="10 ready-to-use tools"
            shortcut="⌘T"
            onClick={onOpenTemplates}
          />
          <WorkflowCard
            icon={<Shapes className="h-6 w-6 text-white/80" />}
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
              'bg-white/[0.03] border border-white/[0.06]'
            )}
          >
            <p className="text-sm text-[#6B6B70] mb-2">Try this:</p>
            <button
              type="button"
              onClick={() => onQuickPrompt(randomPrompt)}
              className={cn(
                'group flex items-center gap-2 text-left',
                'text-white/90 hover:text-[#FFD700] transition-colors',
                focusClasses()
              )}
            >
              <span className="text-base">"{randomPrompt}"</span>
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          </motion.div>
        )}

        {/* Keyboard hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[#4A4A4F] text-sm mt-8"
        >
          Press <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded text-[#6B6B70]">/</kbd>{' '}
          anywhere to quickly add elements
        </motion.p>
      </div>
    </motion.div>
  );
}
