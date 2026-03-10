'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, ExternalLink, RotateCcw } from 'lucide-react';
import { SpacePlacementFlow } from './space-placement-flow';

/** Gold ring ping — plays once on mount, per rule 24 */
function CreationCelebration() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="w-12 h-12 rounded-full border-2 border-[#FFD700]"
      />
    </div>
  );
}

export function CompleteActions({
  toolId,
  toolName,
  hasUser,
  originSpaceId,
  onShare,
  onReset,
  onNavigate,
}: {
  toolId: string;
  toolName: string;
  hasUser: boolean;
  originSpaceId: string | null;
  onShare: () => void;
  onReset: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      <div className="relative">
        <CreationCelebration />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(255,215,0,0.05), transparent 70%)' }}
        />
        <div className="relative flex items-center gap-2 text-[#FFD700]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Check className="w-5 h-5" />
          </motion.div>
          <span className="font-display text-lg font-bold tracking-tight">
            {toolName || 'Your app'} is ready
          </span>
        </div>
        <p className="text-sm text-white/50 mt-1 ml-7">Get it to your people.</p>
      </div>

      {hasUser && (
        <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.03] p-4">
          <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#FFD700]" />
            Place in a space so people can find it
          </p>
          <SpacePlacementFlow
            toolId={toolId}
            toolName={toolName || 'Your app'}
            originSpaceId={originSpaceId}
            onSkip={() => onNavigate(`/t/${toolId}?just_created=true`)}
            onPlaced={(handle) => onNavigate(`/s/${handle}`)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors duration-100"
        >
          <ExternalLink className="w-3 h-3" />
          Send to your group
        </button>
        {!originSpaceId && hasUser && (
          <button
            onClick={() => onNavigate(`/t/${toolId}?just_created=true`)}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/[0.05] text-white text-xs hover:bg-white/[0.05] transition-colors duration-100"
          >
            <MapPin className="w-3 h-3" />
            Place in Space
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/[0.05] text-white text-xs hover:bg-white/[0.05] transition-colors duration-100"
        >
          <RotateCcw className="w-3 h-3" />
          Make another
        </button>
      </div>
    </motion.div>
  );
}
