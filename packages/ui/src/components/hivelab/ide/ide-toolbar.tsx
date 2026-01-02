'use client';

import { useState } from 'react';
import {
  MousePointer2,
  Hand,
  GitBranch,
  Grid3X3,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Play,
  Save,
  Sparkles,
  ChevronDown,
  Settings,
  Download,
  Share2,
  MoreHorizontal,
  Rocket,
} from 'lucide-react';
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
  /** Origin space ID - when set, shows "Save & Deploy" button */
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
        'relative p-2 rounded-lg transition-all group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]',
        active
          ? 'bg-white/15 text-white'
          : 'text-[#888] hover:text-white hover:bg-[#333]'
      )}
      aria-label={`${label}${shortcut ? `, keyboard shortcut ${shortcut}` : ''}`}
      aria-pressed={active}
    >
      {icon}
      {active && (
        <motion.div
          layoutId="active-tool"
          className="absolute inset-0 bg-white/10 rounded-lg border border-white/20"
          transition={{ duration: 0.15 }}
        />
      )}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-[#333]" />;
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
    <div className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-3 gap-3">
      {/* Left: Logo + Tool Modes */}
      <div className="flex items-center gap-3">
        {/* Logo/Home */}
        <div className="flex items-center gap-2 pr-3 border-r border-[#333]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
            <span className="text-black font-bold text-sm">H</span>
          </div>
          <span className="text-white font-semibold hidden sm:block">HiveLab</span>
        </div>

        {/* Tool Modes */}
        <div className="flex items-center gap-1 bg-[#252525] rounded-lg p-1">
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
              'p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]',
              canUndo
                ? 'text-[#888] hover:text-white hover:bg-[#333]'
                : 'text-[#444] cursor-not-allowed'
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
              'p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]',
              canRedo
                ? 'text-[#888] hover:text-white hover:bg-[#333]'
                : 'text-[#444] cursor-not-allowed'
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
            className="bg-[#252525] border border-[#444] rounded-lg px-3 py-1.5 text-white text-center text-sm w-64 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#252525] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <span className="text-white font-medium text-sm">
              {toolName || 'Untitled Tool'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#666] group-hover:text-[#888]" />
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
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#252525] hover:bg-[#333] text-white transition-colors border border-[#333] hover:border-[#444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
        >
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-sm hidden sm:block">AI</span>
          <kbd className="hidden sm:block px-1.5 py-0.5 text-[10px] bg-[#333] rounded text-[#666]">⌘K</kbd>
        </button>

        <Divider />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#252525] rounded-lg" role="group" aria-label="Zoom controls">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className="p-2 text-[#888] hover:text-white transition-colors rounded-l-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className="px-2 py-1 text-sm text-[#888] hover:text-white min-w-[50px] text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
            aria-label={`Current zoom ${Math.round(zoom * 100)}%, click to reset to 100%`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
            className="p-2 text-[#888] hover:text-white transition-colors rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onFitToScreen}
          className="p-2 text-[#888] hover:text-white hover:bg-[#333] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
          aria-label="Fit canvas to screen"
        >
          <Maximize className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleGrid}
          className={cn(
            'p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]',
            showGrid
              ? 'bg-[#333] text-white'
              : 'text-[#888] hover:text-white hover:bg-[#333]'
          )}
          aria-label={`${showGrid ? 'Hide' : 'Show'} grid, keyboard shortcut Command G`}
          aria-pressed={showGrid}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>

        <Divider />

        {/* Preview & Save */}
        <button
          type="button"
          onClick={onPreview}
          aria-label="Preview tool"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#252525] hover:bg-[#333] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm hidden sm:block">Preview</span>
        </button>

        {/* Save or Save & Deploy */}
        {showDeployButton ? (
          <button
            type="button"
            onClick={onDeploy}
            disabled={saving || deploying}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]',
              saving || deploying
                ? 'bg-[#333] text-[#666] cursor-not-allowed'
                : 'bg-[#FFD700] hover:bg-[#FFE033] text-black'
            )}
          >
            <Rocket className="h-4 w-4" />
            <span className="text-sm">
              {deploying ? 'Deploying...' : saving ? 'Saving...' : 'Save & Deploy'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]',
              saving
                ? 'bg-[#333] text-[#666] cursor-not-allowed'
                : 'bg-[#FFD700] hover:bg-[#FFE033] text-black'
            )}
          >
            <Save className="h-4 w-4" />
            <span className="text-sm">{saving ? 'Saving...' : 'Save'}</span>
          </button>
        )}

        {/* More */}
        <button
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          className="p-2 text-[#888] hover:text-white hover:bg-[#333] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
