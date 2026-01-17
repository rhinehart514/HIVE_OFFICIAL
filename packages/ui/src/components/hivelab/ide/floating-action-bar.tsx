'use client';

import { motion } from 'framer-motion';
import { ArrowsPointingOutIcon, SparklesIcon, ChevronDownIcon, MinusIcon, PlusIcon, Squares2X2Icon, PlayIcon, DocumentDuplicateIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlayIconSolid } from '@heroicons/react/24/solid';

// Aliases for lucide compatibility
const ZoomOut = MinusIcon;
const ZoomIn = PlusIcon;
const Grid3X3 = Squares2X2Icon;
import { cn } from '../../../lib/utils';

// Make.com Toolbar Colors
const TOOLBAR_COLORS = {
  bg: '#ffffff',
  border: '#e0e0e0',
  textPrimary: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9E9E9E',
  runButton: '#4CAF50',
  runButtonHover: '#43A047',
  activeButton: '#f5f5f5',
};

// Workshop tokens
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4CAF50]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
const workshopTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };

interface FloatingActionBarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onFitToScreen: () => void;
  onOpenAI: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onRun?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onRun,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: FloatingActionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={workshopTransition}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg"
      style={{
        backgroundColor: TOOLBAR_COLORS.bg,
        border: `1px solid ${TOOLBAR_COLORS.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Run Once Button - Make.com style prominent green */}
      <button
        type="button"
        onClick={onRun}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          'text-white font-semibold text-sm',
          'transition-all duration-200',
          focusRing
        )}
        style={{
          backgroundColor: TOOLBAR_COLORS.runButton,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = TOOLBAR_COLORS.runButtonHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = TOOLBAR_COLORS.runButton;
        }}
        title="Run once"
      >
        <PlayIconSolid className="h-4 w-4" />
        <span>Run once</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 mx-2" style={{ backgroundColor: TOOLBAR_COLORS.border }} />

      {/* Undo/Redo */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={cn(
          'p-2 rounded-lg transition-colors duration-200',
          focusRing
        )}
        style={{
          color: canUndo ? TOOLBAR_COLORS.textSecondary : TOOLBAR_COLORS.textTertiary,
          opacity: canUndo ? 1 : 0.5,
        }}
        title="Undo (⌘Z)"
      >
        <ArrowUturnLeftIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={cn(
          'p-2 rounded-lg transition-colors duration-200',
          focusRing
        )}
        style={{
          color: canRedo ? TOOLBAR_COLORS.textSecondary : TOOLBAR_COLORS.textTertiary,
          opacity: canRedo ? 1 : 0.5,
        }}
        title="Redo (⌘⇧Z)"
      >
        <ArrowUturnRightIcon className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 mx-2" style={{ backgroundColor: TOOLBAR_COLORS.border }} />

      {/* Grid Toggle */}
      <button
        type="button"
        onClick={onToggleGrid}
        className={cn(
          'p-2 rounded-lg transition-colors duration-200',
          focusRing
        )}
        style={{
          color: showGrid ? TOOLBAR_COLORS.textPrimary : TOOLBAR_COLORS.textSecondary,
          backgroundColor: showGrid ? TOOLBAR_COLORS.activeButton : 'transparent',
        }}
        title={`Grid: ${showGrid ? 'On' : 'Off'} (⌘G)`}
      >
        <Grid3X3 className="h-4 w-4" />
      </button>

      {/* Snap Toggle */}
      <button
        type="button"
        onClick={onToggleSnap}
        className={cn(
          'px-2 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200',
          focusRing
        )}
        style={{
          color: snapToGrid ? TOOLBAR_COLORS.textPrimary : TOOLBAR_COLORS.textTertiary,
          backgroundColor: snapToGrid ? TOOLBAR_COLORS.activeButton : 'transparent',
        }}
        title={`Snap to Grid: ${snapToGrid ? 'On' : 'Off'}`}
      >
        Snap
      </button>

      {/* Fit to Screen */}
      <button
        type="button"
        onClick={onFitToScreen}
        className={cn(
          'p-2 rounded-lg transition-colors duration-200',
          focusRing
        )}
        style={{ color: TOOLBAR_COLORS.textSecondary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary;
          e.currentTarget.style.backgroundColor = TOOLBAR_COLORS.activeButton;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = TOOLBAR_COLORS.textSecondary;
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Fit to Screen"
      >
        <ArrowsPointingOutIcon className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 mx-2" style={{ backgroundColor: TOOLBAR_COLORS.border }} />

      {/* Zoom Controls */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            focusRing
          )}
          style={{ color: TOOLBAR_COLORS.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = TOOLBAR_COLORS.textSecondary;
          }}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(1)}
          className={cn(
            'px-2 py-1.5 min-w-[52px] text-center text-sm rounded-lg transition-colors duration-200',
            focusRing
          )}
          style={{ color: TOOLBAR_COLORS.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary;
            e.currentTarget.style.backgroundColor = TOOLBAR_COLORS.activeButton;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = TOOLBAR_COLORS.textSecondary;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            focusRing
          )}
          style={{ color: TOOLBAR_COLORS.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = TOOLBAR_COLORS.textSecondary;
          }}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 mx-2" style={{ backgroundColor: TOOLBAR_COLORS.border }} />

      {/* AI Quick Access - green accent */}
      <button
        type="button"
        onClick={onOpenAI}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'transition-all duration-200 text-sm font-medium',
          focusRing
        )}
        style={{
          color: TOOLBAR_COLORS.runButton,
          backgroundColor: `${TOOLBAR_COLORS.runButton}10`,
          border: `1px solid ${TOOLBAR_COLORS.runButton}30`,
        }}
      >
        <SparklesIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:block">Ask AI</span>
        <kbd
          className="hidden md:block px-1.5 py-0.5 text-[10px] rounded"
          style={{
            backgroundColor: `${TOOLBAR_COLORS.runButton}15`,
          }}
        >
          ⌘K
        </kbd>
      </button>
    </motion.div>
  );
}
