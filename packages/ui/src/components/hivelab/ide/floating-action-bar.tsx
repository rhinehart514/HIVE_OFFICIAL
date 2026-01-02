'use client';

import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { focusClasses, premiumPresets } from '../../../lib/premium-design';

interface FloatingActionBarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onFitToScreen: () => void;
  onOpenAI: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
}

export function FloatingActionBar({
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  onFitToScreen,
  onOpenAI,
  snapToGrid,
  onToggleSnap,
}: FloatingActionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-1 px-2 py-1.5',
        premiumPresets.floatingComposer
      )}
    >
      {/* Zoom Controls */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
          className={cn(
            'p-2 text-[#9A9A9F] hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors',
            focusClasses()
          )}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(1)}
          className={cn(
            'px-2 py-1.5 min-w-[52px] text-center text-sm text-[#9A9A9F] hover:text-white',
            'hover:bg-white/[0.06] rounded-lg transition-colors',
            focusClasses()
          )}
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
          className={cn(
            'p-2 text-[#9A9A9F] hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors',
            focusClasses()
          )}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/[0.10] mx-1" />

      {/* Fit to Screen */}
      <button
        type="button"
        onClick={onFitToScreen}
        className={cn(
          'p-2 text-[#9A9A9F] hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors',
          focusClasses()
        )}
        title="Fit to Screen"
      >
        <Maximize className="h-4 w-4" />
      </button>

      {/* Grid Toggle */}
      <button
        type="button"
        onClick={onToggleGrid}
        className={cn(
          'p-2 rounded-lg transition-colors',
          showGrid
            ? 'text-white bg-white/[0.10]'
            : 'text-[#9A9A9F] hover:text-white hover:bg-white/[0.06]',
          focusClasses()
        )}
        title={`Grid: ${showGrid ? 'On' : 'Off'} (⌘G)`}
      >
        <Grid3X3 className="h-4 w-4" />
      </button>

      {/* Snap Toggle */}
      <button
        type="button"
        onClick={onToggleSnap}
        className={cn(
          'px-2 py-1.5 text-xs font-medium rounded-lg transition-colors',
          snapToGrid
            ? 'text-white bg-white/[0.10]'
            : 'text-[#6B6B70] hover:text-[#9A9A9F] hover:bg-white/[0.06]',
          focusClasses()
        )}
        title={`Snap to Grid: ${snapToGrid ? 'On' : 'Off'}`}
      >
        Snap
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-white/[0.10] mx-1" />

      {/* AI Quick Access */}
      <button
        type="button"
        onClick={onOpenAI}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'text-white bg-white/[0.08] hover:bg-white/[0.12]',
          'border border-white/[0.10] hover:border-white/[0.15]',
          'transition-all text-sm font-medium',
          focusClasses()
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:block">Ask AI</span>
        <kbd className="hidden md:block px-1.5 py-0.5 text-[10px] bg-white/[0.08] rounded text-[#6B6B70]">
          ⌘K
        </kbd>
      </button>
    </motion.div>
  );
}
