'use client';

/**
 * QuickStartChips — Horizontal row of template quick-start buttons
 *
 * Direct creation flow: click → create tool → redirect to IDE
 * Shown as secondary option below user's tools (active builder state)
 * or as primary option (new user state).
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import {
  Vote,
  Users,
  Clock,
  FileText,
  Calendar,
  BarChart3,
  Timer,
  MessageSquare,
  Trophy,
  ClipboardList,
} from 'lucide-react';
import { type QuickTemplate } from '@hive/ui';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

// Icon mapping from template icon names to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  'bar-chart-2': BarChart3,
  'timer': Timer,
  'users': Users,
  'calendar': Calendar,
  'message-square': MessageSquare,
  'sparkles': Sparkles,
  'clipboard-list': ClipboardList,
  'trophy': Trophy,
  'file-text': FileText,
  'vote': Vote,
  'clock': Clock,
};

interface QuickStartChipsProps {
  templates: QuickTemplate[];
  onTemplateClick: (template: QuickTemplate) => void;
  onViewAll: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function QuickStartChips({
  templates,
  onTemplateClick,
  onViewAll,
  disabled = false,
  variant = 'secondary',
}: QuickStartChipsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleClick = async (template: QuickTemplate) => {
    if (disabled || loadingId) return;
    setLoadingId(template.id);
    try {
      await onTemplateClick(template);
    } finally {
      setLoadingId(null);
    }
  };

  // Take first 5 templates for chips + "All" button
  const displayTemplates = templates.slice(0, 5);

  if (variant === 'primary') {
    // Primary variant: larger cards in a grid (for new users)
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Start</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {displayTemplates.map((template, index) => {
            const IconComponent = ICON_MAP[template.icon] || Sparkles;
            const isLoading = loadingId === template.id;
            return (
              <motion.button
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05,
                  ease: EASE,
                }}
                onClick={() => handleClick(template)}
                disabled={disabled || !!loadingId}
                className="group relative p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]
                  hover:border-white/15 hover:bg-white/[0.04]
                  transition-all duration-200 text-center
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/[0.04] group-hover:bg-[var(--life-gold)]/10
                    transition-colors">
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <IconComponent className="w-5 h-5 text-[var(--life-gold)]" />
                      </motion.div>
                    ) : (
                      <IconComponent className="w-5 h-5 text-white/50 group-hover:text-[var(--life-gold)]
                        transition-colors" />
                    )}
                  </div>
                  <span className="text-white/80 text-xs font-medium truncate w-full">
                    {template.name.replace(' Tool', '').replace(' Generator', '')}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onViewAll}
          disabled={disabled}
          className="flex items-center gap-1 text-white/40 hover:text-white/60 text-xs
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
        >
          <span>See all templates</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    );
  }

  // Secondary variant: compact horizontal chips (for active builders)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-white/30 text-xs uppercase tracking-wider mr-1">
        Quick Start
      </span>
      {displayTemplates.map((template, index) => {
        const IconComponent = ICON_MAP[template.icon] || Sparkles;
        const isLoading = loadingId === template.id;
        return (
          <motion.button
            key={template.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.15,
              delay: index * 0.03,
              ease: EASE,
            }}
            onClick={() => handleClick(template)}
            disabled={disabled || !!loadingId}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
              border border-white/[0.06] bg-transparent
              hover:border-white/12 hover:bg-white/[0.03]
              text-white/50 hover:text-white/70
              transition-all duration-200 text-xs
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <IconComponent className="w-3 h-3 text-[var(--life-gold)]" />
              </motion.div>
            ) : (
              <IconComponent className="w-3 h-3" />
            )}
            <span>{template.name.replace(' Tool', '').split(' ')[0]}</span>
          </motion.button>
        );
      })}
      <button
        onClick={onViewAll}
        disabled={disabled}
        className="flex items-center gap-0.5 text-white/30 hover:text-white/50 text-xs
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>All</span>
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
