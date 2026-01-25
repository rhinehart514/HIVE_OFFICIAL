'use client';

import { useState } from 'react';
import { ArrowsPointingOutIcon, PlayIcon, BookmarkIcon, SparklesIcon, ChevronDownIcon, Cog6ToothIcon, ArrowDownTrayIcon, ShareIcon, EllipsisHorizontalIcon, RocketLaunchIcon, CursorArrowRaysIcon, HandRaisedIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, MinusIcon, PlusIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const MousePointer2 = CursorArrowRaysIcon;
const Hand = HandRaisedIcon;
const GitBranch = ShareIcon;
const Undo2 = ArrowUturnLeftIcon;
const Redo2 = ArrowUturnRightIcon;
const ZoomOut = MinusIcon;
const ZoomIn = PlusIcon;
const Grid3X3 = Squares2X2Icon;
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import type { ToolMode } from './types';
import { formatShortcut } from './use-ide-keyboard';

interface IDEToolbarProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onFitToScreen: () => void;
  onOpenAI: () => void;
  onPreview: () => void;
  onSave: () => void;
  saving?: boolean;
  toolName: string;
  onToolNameChange: (name: string) => void;
  /** Origin space ID - when set, shows "BookmarkIcon & Deploy" button */
  originSpaceId?: string;
  /** Callback for deploy action (only shown when originSpaceId is set) */
  onDeploy?: () => void;
  /** Whether deploy is in progress */
  deploying?: boolean;
}

interface ToolButtonProps {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

function ToolButton({ active, onClick, icon, label, shortcut }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-[var(--workshop-duration)] group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
        active
          ? 'bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)]'
          : 'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]'
      )}
      aria-label={`${label}${shortcut ? `, keyboard shortcut ${shortcut}` : ''}`}
      aria-pressed={active}
    >
      {icon}
      {active && (
        <motion.div
          layoutId="active-tool"
          className="absolute inset-0 bg-[var(--hivelab-surface)] rounded-lg border border-[var(--hivelab-border-emphasis)]"
          transition={{ duration: 0.15 }}
        />
      )}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-[var(--hivelab-border)]" />;
}

export function IDEToolbar({
  mode,
  onModeChange,
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onFitToScreen,
  onOpenAI,
  onPreview,
  onSave,
  saving,
  toolName,
  onToolNameChange,
  originSpaceId,
  onDeploy,
  deploying,
}: IDEToolbarProps) {
  const [editingName, setEditingName] = useState(false);

  // Show deploy button when coming from a space
  const showDeployButton = !!originSpaceId && !!onDeploy;

  return (
    <div className="h-14 bg-[var(--hivelab-panel)] border-b border-[var(--hivelab-border)] flex items-center justify-between px-3 gap-3">
      {/* Left: Logo + Tool Modes */}
      <div className="flex items-center gap-3">
        {/* Logo/Home */}
        <div className="flex items-center gap-2 pr-3 border-r border-[var(--hivelab-border)]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-life-gold to-amber-500 flex items-center justify-center">
            <span className="text-black font-bold text-sm">H</span>
          </div>
          <span className="text-[var(--hivelab-text-primary)] font-semibold hidden sm:block">HiveLab</span>
        </div>

        {/* Tool Modes */}
        <div className="flex items-center gap-1 bg-[var(--hivelab-surface)] rounded-lg p-1">
          <ToolButton
            active={mode === 'select'}
            onClick={() => onModeChange('select')}
            icon={<MousePointer2 className="h-4 w-4" />}
            label="Select"
            shortcut="V"
          />
          <ToolButton
            active={mode === 'pan'}
            onClick={() => onModeChange('pan')}
            icon={<Hand className="h-4 w-4" />}
            label="Pan"
            shortcut="H"
          />
          <ToolButton
            active={mode === 'connect'}
            onClick={() => onModeChange('connect')}
            icon={<GitBranch className="h-4 w-4" />}
            label="Connect"
            shortcut="C"
          />
        </div>

        <Divider />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'p-2 rounded-lg transition-colors duration-[var(--workshop-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
              canUndo
                ? 'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]'
                : 'text-[var(--hivelab-text-tertiary)]/30 cursor-not-allowed'
            )}
            aria-label="Undo, keyboard shortcut Command Z"
            aria-disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              'p-2 rounded-lg transition-colors duration-[var(--workshop-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
              canRedo
                ? 'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]'
                : 'text-[var(--hivelab-text-tertiary)]/30 cursor-not-allowed'
            )}
            aria-label="Redo, keyboard shortcut Command Shift Z"
            aria-disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center: Tool Name */}
      <div className="flex-1 flex items-center justify-center">
        {editingName ? (
          <input
            type="text"
            value={toolName}
            onChange={(e) => onToolNameChange(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            className="bg-[var(--hivelab-surface)] border border-[var(--hivelab-border)] rounded-lg px-3 py-1.5 text-[var(--hivelab-text-primary)] text-center text-sm w-64 outline-none focus:border-[var(--hivelab-border-emphasis)] focus:ring-2 focus:ring-white/30"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--hivelab-surface)] transition-colors duration-[var(--workshop-duration)] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <span className="text-[var(--hivelab-text-primary)] font-medium text-sm">
              {toolName || 'Untitled Tool'}
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-[var(--hivelab-text-tertiary)] group-hover:text-[var(--hivelab-text-secondary)]" />
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* AI Button */}
        <button
          type="button"
          onClick={onOpenAI}
          aria-label="Open AI assistant, keyboard shortcut Command K"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--hivelab-surface)] hover:bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)] transition-colors duration-[var(--workshop-duration)] border border-[var(--hivelab-border)] hover:border-[var(--hivelab-border-emphasis)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]"
        >
          <SparklesIcon className="h-4 w-4 text-[var(--hivelab-text-primary)]" />
          <span className="text-sm hidden sm:block">AI</span>
          <kbd className="hidden sm:block px-1.5 py-0.5 text-label-xs bg-[var(--hivelab-bg)] rounded text-[var(--hivelab-text-tertiary)]">⌘K</kbd>
        </button>

        <Divider />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[var(--hivelab-surface)] rounded-lg" role="group" aria-label="Zoom controls">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className="p-2 text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] transition-colors duration-[var(--workshop-duration)] rounded-l-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className="px-2 py-1 text-sm text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] min-w-[50px] text-center transition-colors duration-[var(--workshop-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
            aria-label={`Current zoom ${Math.round(zoom * 100)}%, click to reset to 100%`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
            className="p-2 text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] transition-colors duration-[var(--workshop-duration)] rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onFitToScreen}
          className="p-2 text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)] rounded-lg transition-colors duration-[var(--workshop-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]"
          aria-label="Fit canvas to screen"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleGrid}
          className={cn(
            'p-2 rounded-lg transition-colors duration-[var(--workshop-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
            showGrid
              ? 'bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)]'
              : 'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]'
          )}
          aria-label={`${showGrid ? 'Hide' : 'Show'} grid, keyboard shortcut Command G`}
          aria-pressed={showGrid}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>

        <Divider />

        {/* Preview & BookmarkIcon */}
        <button
          type="button"
          onClick={onPreview}
          aria-label="Preview tool"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--hivelab-surface)] hover:bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)] transition-colors duration-[var(--workshop-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]"
        >
          <PlayIcon className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm hidden sm:block">Preview</span>
        </button>

        {/* BookmarkIcon or BookmarkIcon & Deploy */}
        {showDeployButton ? (
          <button
            type="button"
            onClick={onDeploy}
            disabled={saving || deploying}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-[var(--workshop-duration)] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
              saving || deploying
                ? 'bg-[var(--hivelab-surface)] text-[var(--hivelab-text-tertiary)] cursor-not-allowed'
                : 'bg-[var(--life-gold)] hover:bg-[var(--life-gold)]/90 text-black'
            )}
          >
            <RocketLaunchIcon className="h-4 w-4" />
            <span className="text-sm">
              {deploying ? 'Deploying...' : saving ? 'Saving...' : 'BookmarkIcon & Deploy'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-[var(--workshop-duration)] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]',
              saving
                ? 'bg-[var(--hivelab-surface)] text-[var(--hivelab-text-tertiary)] cursor-not-allowed'
                : 'bg-[var(--life-gold)] hover:bg-[var(--life-gold)]/90 text-black'
            )}
          >
            <BookmarkIcon className="h-4 w-4" />
            <span className="text-sm">{saving ? 'Saving...' : 'BookmarkIcon'}</span>
          </button>
        )}

        {/* More */}
        <button
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          className="p-2 text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)] rounded-lg transition-colors duration-[var(--workshop-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]"
        >
          <EllipsisHorizontalIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
