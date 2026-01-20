'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import type { SpaceMode } from './ModeCard';

interface ModeTransitionProps {
  mode: SpaceMode;
  children: React.ReactNode;
  className?: string;
}

const modeVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function ModeTransition({
  mode,
  children,
  className,
}: ModeTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        variants={modeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn('min-h-screen', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Shared header that persists across modes
interface ModeHeaderProps {
  spaceName: string;
  spaceIcon?: string;
  currentMode: SpaceMode;
  onModeChange: (mode: SpaceMode) => void;
  className?: string;
}

export function ModeHeader({
  spaceName,
  spaceIcon,
  currentMode,
  onModeChange,
  className,
}: ModeHeaderProps) {
  return (
    <motion.header
      layout
      className={cn(
        'sticky top-0 z-40',
        'flex items-center justify-between',
        'px-6 py-4',
        'bg-[var(--bg-ground,#0A0A09)]/95 backdrop-blur-md',
        'border-b border-white/[0.04]',
        className
      )}
    >
      {/* Space identity (always visible) */}
      <button
        onClick={() => onModeChange('hub')}
        className={cn(
          'flex items-center gap-3',
          'transition-opacity hover:opacity-80',
          'focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg'
        )}
      >
        {spaceIcon ? (
          <img
            src={spaceIcon}
            alt={spaceName}
            className="w-8 h-8 rounded-xl object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-[#141312] flex items-center justify-center text-sm">
            {spaceName.charAt(0)}
          </div>
        )}
        <span className="text-white font-medium">{spaceName}</span>
      </button>

      {/* Mode indicator */}
      {currentMode !== 'hub' && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-[#6B6B70] capitalize"
        >
          {currentMode}
        </motion.span>
      )}
    </motion.header>
  );
}

// Full-screen mode wrapper
interface FullScreenModeProps {
  children: React.ReactNode;
  className?: string;
}

export function FullScreenMode({ children, className }: FullScreenModeProps) {
  return (
    <div className={cn('flex-1 flex flex-col min-h-0', className)}>
      {children}
    </div>
  );
}
