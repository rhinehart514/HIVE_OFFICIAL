'use client';

import { motion } from 'framer-motion';
import { Loader2, Wand2, Check } from 'lucide-react';
import type { BuildPhase } from '@/hooks/use-build-machine';

const labels: Record<BuildPhase, string> = {
  idle: '',
  classifying: 'Figuring out the best format...',
  'shell-matched': 'Got it — here\'s what we made',
  generating: 'Building it now...',
  complete: 'Done — share it with your people',
  error: 'That didn\'t work',
};

export function PhaseIndicator({ phase }: { phase: BuildPhase }) {
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
