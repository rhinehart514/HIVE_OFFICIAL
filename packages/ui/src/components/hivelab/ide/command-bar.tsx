'use client';

import { motion } from 'framer-motion';
import { SparklesIcon, RectangleStackIcon, RectangleGroupIcon, CursorArrowRaysIcon, HandRaisedIcon, ShareIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const LayoutTemplate = RectangleStackIcon;
const Shapes = RectangleGroupIcon;
const MousePointer2 = CursorArrowRaysIcon;
const Hand = HandRaisedIcon;
const GitBranch = ShareIcon;
const Undo2 = ArrowUturnLeftIcon;
const Redo2 = ArrowUturnRightIcon;
import { cn } from '../../../lib/utils';
import type { ToolMode } from './types';

// Workshop tokens
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]';
const workshopTransition = { duration: 0.15, ease: [0.22, 1, 0.36, 1] };

interface CommandBarProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onOpenAI: () => void;
  onOpenTemplates: () => void;
  onToggleElements: () => void;
  elementsOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isGenerating?: boolean;
}

interface WorkflowButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  onClick: () => void;
  active?: boolean;
  pulse?: boolean;
}

function WorkflowButton({ icon, label, shortcut, onClick, active, pulse }: WorkflowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
        'transition-all duration-[var(--workshop-duration)]',
        active
          ? 'bg-[var(--hivelab-surface-hover)] text-[var(--hivelab-text-primary)] border border-[var(--hivelab-border-emphasis)]'
          : 'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)] border border-transparent',
        focusRing
      )}
    >
      {pulse && !active && (
        <motion.span
          className="absolute inset-0 rounded-lg border-2 border-[var(--life-gold)]/30"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {icon}
      <span className="hidden md:block">{label}</span>
      <kbd className="hidden lg:block px-1.5 py-0.5 text-label-xs bg-[var(--hivelab-surface)] rounded text-[var(--hivelab-text-tertiary)]">
        {shortcut}
      </kbd>
    </button>
  );
}

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

function ModeButton({ active, onClick, icon, label, shortcut }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-[var(--workshop-duration)]',
        active
          ? 'text-[var(--hivelab-text-primary)]'
          : 'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-secondary)]',
        focusRing
      )}
      title={`${label} (${shortcut})`}
    >
      {icon}
      {active && (
        <motion.div
          layoutId="active-mode"
          className="absolute inset-0 bg-[var(--hivelab-surface-hover)] rounded-lg border border-[var(--hivelab-border-emphasis)]"
          transition={workshopTransition}
        />
      )}
    </button>
  );
}

export function CommandBar({
  mode,
  onModeChange,
  onOpenAI,
  onOpenTemplates,
  onToggleElements,
  elementsOpen,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isGenerating,
}: CommandBarProps) {
  return (
    <div className="h-14 bg-[var(--hivelab-surface)] border-b border-[var(--hivelab-border)] flex items-center justify-between px-4">
      {/* Left: Workflow Triggers */}
      <div className="flex items-center gap-1">
        <WorkflowButton
          icon={<SparklesIcon className="h-4 w-4" />}
          label="AI"
          shortcut="⌘K"
          onClick={onOpenAI}
          active={isGenerating}
          pulse={!isGenerating}
        />
        <WorkflowButton
          icon={<LayoutTemplate className="h-4 w-4" />}
          label="Templates"
          shortcut="⌘T"
          onClick={onOpenTemplates}
        />
        <WorkflowButton
          icon={<Shapes className="h-4 w-4" />}
          label="Elements"
          shortcut="⌘E"
          onClick={onToggleElements}
          active={elementsOpen}
        />
      </div>

      {/* Center: Mode Selector */}
      <div className="flex items-center gap-1 bg-[var(--hivelab-bg)] rounded-lg p-1 border border-[var(--hivelab-border)]">
        <ModeButton
          active={mode === 'select'}
          onClick={() => onModeChange('select')}
          icon={<MousePointer2 className="h-4 w-4 relative z-10" />}
          label="Select"
          shortcut="V"
        />
        <ModeButton
          active={mode === 'pan'}
          onClick={() => onModeChange('pan')}
          icon={<Hand className="h-4 w-4 relative z-10" />}
          label="Pan"
          shortcut="H"
        />
        <ModeButton
          active={mode === 'connect'}
          onClick={() => onModeChange('connect')}
          icon={<GitBranch className="h-4 w-4 relative z-10" />}
          label="Connect"
          shortcut="C"
        />
      </div>

      {/* Right: Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            'workshop-icon-btn',
            !canUndo && 'opacity-30 cursor-not-allowed',
            focusRing
          )}
          title="Undo (⌘Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={cn(
            'workshop-icon-btn',
            !canRedo && 'opacity-30 cursor-not-allowed',
            focusRing
          )}
          title="Redo (⌘⇧Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
