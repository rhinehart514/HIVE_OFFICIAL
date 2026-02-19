'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
// SpaceMode was from ModeCard (removed Feb 2026)
type SpaceMode = 'hub' | 'chat' | 'events' | 'tools' | 'members';

interface ContextPillProps {
  currentMode: SpaceMode;
  onlineCount?: number;
  nextEventIn?: string;
  onNavigate: (mode: SpaceMode) => void;
  onClose?: () => void;
  className?: string;
}

export function ContextPill({
  currentMode,
  onlineCount = 0,
  nextEventIn,
  onNavigate,
  onClose,
  className,
}: ContextPillProps) {
  // Don't show on hub
  if (currentMode === 'hub') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-4 right-4 z-50',
        'flex items-center gap-2',
        className
      )}
    >
      {/* Context info pill */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-full',
          'bg-[#141312]/95 backdrop-blur-md',
          'border border-white/[0.06]',
          'shadow-lg shadow-black/20'
        )}
      >
        {/* Online count */}
        {onlineCount > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-[#A3A19E]">
            <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
            {onlineCount} online
          </span>
        )}

        {/* Separator */}
        {onlineCount > 0 && nextEventIn && (
          <span className="text-[#3D3D42]">·</span>
        )}

        {/* Next event */}
        {nextEventIn && (
          <span className="text-sm text-[#6B6B70]">
            Event in {nextEventIn}
          </span>
        )}

        {/* If no content, show mode indicator */}
        {!onlineCount && !nextEventIn && (
          <span className="text-sm text-[#6B6B70] capitalize">
            {currentMode}
          </span>
        )}
      </div>

      {/* Hub return button */}
      <motion.button
        onClick={() => onNavigate('hub')}
        className={cn(
          'p-2.5 rounded-full',
          'bg-[#141312]/95 backdrop-blur-md',
          'border border-white/[0.06]',
          'text-[#A3A19E] hover:text-white',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-white/50',
          'shadow-lg shadow-black/20'
        )}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ opacity: 0.8 }}
        title="Back to hub"
      >
        <Home className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

// Compact variant for mobile
export function ContextPillMobile({
  currentMode,
  onNavigate,
  className,
}: {
  currentMode: SpaceMode;
  onNavigate: (mode: SpaceMode) => void;
  className?: string;
}) {
  if (currentMode === 'hub') return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => onNavigate('hub')}
      className={cn(
        'fixed top-4 left-4 z-50',
        'p-2.5 rounded-full',
        'bg-[#141312]/95 backdrop-blur-md',
        'border border-white/[0.06]',
        'text-[#A3A19E]',
        'shadow-lg shadow-black/20',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        className
      )}
      whileTap={{ opacity: 0.8 }}
    >
      <Home className="w-5 h-5" />
    </motion.button>
  );
}
