'use client';

/**
 * ToolPreviewCard — ToolCanvas in a card with Deploy / Edit / Share actions.
 *
 * Renders the live tool preview during and after generation.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Pencil, Rocket, Check } from 'lucide-react';
import { ToolCanvas, type ToolElement } from '@hive/ui';

interface ToolPreviewCardProps {
  toolId: string;
  toolName: string;
  elements: ToolElement[];
  phase: 'streaming' | 'complete' | 'error';
  onDeploy?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
}

export function ToolPreviewCard({
  toolId,
  toolName,
  elements,
  phase,
  onDeploy,
  onEdit,
  onShare,
}: ToolPreviewCardProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = useCallback(() => {
    onShare?.();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }, [onShare]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden">
      {/* Preview area */}
      <div className="p-4 sm:p-5 min-h-[180px]">
        {elements.length === 0 && phase !== 'error' ? (
          <div className="flex items-center justify-center py-12">
            <motion.span
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/25 text-sm"
            >
              Building...
            </motion.span>
          </div>
        ) : elements.length > 0 ? (
          <ToolCanvas elements={elements} state={{}} layout="flow" />
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-400/50 text-sm">Generation failed</p>
          </div>
        )}
      </div>

      {/* Actions — only when complete */}
      <AnimatePresence>
        {phase === 'complete' && elements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-white/[0.06] px-4 py-3"
          >
            {/* Share link row */}
            <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-xl bg-white/[0.03]">
              <Link2 className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
              <span className="text-[11px] text-white/35 truncate flex-1 font-mono">
                {typeof window !== 'undefined' ? window.location.origin : ''}/t/{toolId}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                  rounded-xl bg-white text-black font-medium text-sm
                  hover:bg-white/90 transition-all"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                {linkCopied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={onDeploy}
                className="flex items-center justify-center gap-1.5 px-3 py-2
                  rounded-xl bg-white/[0.06] text-white/60 text-sm border border-white/[0.06]
                  hover:bg-white/[0.08] hover:text-white/80 transition-all"
              >
                <Rocket className="w-3.5 h-3.5" />
                Deploy
              </button>
              <button
                onClick={onEdit}
                className="flex items-center justify-center gap-1.5 px-3 py-2
                  rounded-xl text-white/40 text-sm
                  hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
