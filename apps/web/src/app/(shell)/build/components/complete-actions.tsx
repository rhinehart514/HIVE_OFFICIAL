'use client';

import { motion } from 'framer-motion';
import { Check, MapPin, ExternalLink, RotateCcw } from 'lucide-react';
import { SpacePlacementFlow } from './space-placement-flow';

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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(255,215,0,0.05), transparent 70%)' }}
        />
        <div className="relative flex items-center gap-2 text-[#FFD700]">
          <Check className="w-5 h-5" />
          <span className="font-display text-lg font-bold tracking-tight">
            {toolName || 'Your app'} is ready
          </span>
        </div>
        <p className="text-sm text-white/50 mt-1 ml-7">Get it to your people.</p>
      </div>

      {hasUser && (
        <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.03] p-4">
          <p className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
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

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onNavigate(`/t/${toolId}?just_created=true`)}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View standalone
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Copy link
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/40 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Make another
        </button>
      </div>
    </motion.div>
  );
}
