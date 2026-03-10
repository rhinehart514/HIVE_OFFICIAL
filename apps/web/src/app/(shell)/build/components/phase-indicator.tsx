'use client';

import { useEffect, useRef } from 'react';
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

/**
 * Gold reveal keyframes — plays once when shell type is classified.
 * Scale 0.8 -> 1.0, gold ring fades in then out, 300ms total.
 */
const goldRevealStyle = `
@keyframes goldReveal {
  0% {
    transform: scale(0.8);
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.5);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.0);
    box-shadow: 0 0 0 8px rgba(255, 215, 0, 0.15);
    opacity: 1;
  }
  100% {
    transform: scale(1.0);
    box-shadow: 0 0 0 12px rgba(255, 215, 0, 0);
    opacity: 1;
  }
}
`;

export function PhaseIndicator({ phase }: { phase: BuildPhase }) {
  const prevPhaseRef = useRef<BuildPhase>(phase);
  const justMatched = phase === 'shell-matched' && prevPhaseRef.current === 'classifying';

  useEffect(() => {
    prevPhaseRef.current = phase;
  }, [phase]);

  if (phase === 'idle') return null;

  return (
    <>
      {justMatched && <style>{goldRevealStyle}</style>}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs text-white/40 mt-3"
      >
        {(phase === 'classifying' || phase === 'generating') && (
          <Loader2 className="w-3 h-3 animate-spin text-white/30" />
        )}
        {phase === 'shell-matched' && (
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full"
            style={justMatched ? {
              animation: 'goldReveal 300ms ease-out forwards',
            } : undefined}
          >
            <Wand2 className="w-3 h-3 text-[#FFD700]/60" />
          </span>
        )}
        {phase === 'complete' && <Check className="w-3 h-3 text-[#10B981]/60" />}
        <span>{labels[phase]}</span>
      </motion.div>
    </>
  );
}
