'use client';

/**
 * TemplateSuggestion - Shown when user prompt matches a template.
 *
 * Offers quick-deploy of the template or building with AI instead.
 */

import { motion } from 'framer-motion';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';
import type { QuickTemplate } from '@hive/ui';

const EASE = MOTION.ease.premium;

interface TemplateSuggestionProps {
  template: QuickTemplate;
  prompt: string;
  onUseTemplate: (template: QuickTemplate) => void;
  onBuildWithAI: () => void;
  disabled?: boolean;
}

export function TemplateSuggestion({
  template,
  prompt,
  onUseTemplate,
  onBuildWithAI,
  disabled,
}: TemplateSuggestionProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      {/* User prompt echo */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.standard, ease: EASE }}
        className="mb-8 text-center"
      >
        <p className="text-white/50 text-sm mb-1">You asked for</p>
        <p className="text-white text-lg font-medium">
          &ldquo;{prompt}&rdquo;
        </p>
      </motion.div>

      {/* Template match card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: durationSeconds.smooth, delay: 0.15, ease: EASE }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/[0.06] bg-[#080808] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-white/40" />
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Template match
            </span>
          </div>

          <h3 className="text-white text-xl font-semibold mb-1">
            {template.name}
          </h3>
          <p className="text-white/50 text-sm mb-5">
            {template.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onUseTemplate(template)}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                rounded-2xl bg-white text-black font-medium text-sm
                hover:bg-white/90 transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              Use Template
            </button>
            <button
              onClick={onBuildWithAI}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                rounded-2xl bg-white/[0.06] text-white/50 text-sm border border-white/[0.06]
                hover:bg-white/[0.08] hover:text-white/70 transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Build with AI instead
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
