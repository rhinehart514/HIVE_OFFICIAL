'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  LayoutTemplate,
  Shapes,
  MousePointer2,
  Hand,
  GitBranch,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { focusClasses, premiumMotion } from '../../../lib/premium-design';
import type { ToolMode } from './types';

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
        'relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
        'text-sm font-medium',
        active
          ? 'bg-white/[0.12] text-white border border-white/[0.15]'
          : 'text-[#9A9A9F] hover:text-white hover:bg-white/[0.06] border border-transparent',
        focusClasses()
      )}
    >
      {pulse && !active && (
        <motion.span
          className="absolute inset-0 rounded-lg border-2 border-white/30"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {icon}
      <span className="hidden md:block">{label}</span>
      <kbd className="hidden lg:block px-1.5 py-0.5 text-[10px] bg-white/[0.08] rounded text-[#6B6B70]">
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
        'relative p-2 rounded-lg transition-all',
        active
          ? 'text-white'
          : 'text-[#6B6B70] hover:text-[#9A9A9F]',
        focusClasses()
      )}
      title={`${label} (${shortcut})`}
    >
      {icon}
      {active && (
        <motion.div
          layoutId="active-mode"
          className="absolute inset-0 bg-white/[0.12] rounded-lg border border-white/[0.15]"
          transition={premiumMotion.spring.snappy}
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
    <div className="h-14 bg-[#111111] border-b border-white/[0.06] flex items-center justify-between px-4">
      {/* Left: Workflow Triggers */}
      <div className="flex items-center gap-1">
        <WorkflowButton
          icon={<Sparkles className="h-4 w-4" />}
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
      <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
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
            'p-2 rounded-lg transition-colors',
            canUndo
              ? 'text-[#9A9A9F] hover:text-white hover:bg-white/[0.06]'
              : 'text-[#4A4A4F] cursor-not-allowed',
            focusClasses()
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
            'p-2 rounded-lg transition-colors',
            canRedo
              ? 'text-[#9A9A9F] hover:text-white hover:bg-white/[0.06]'
              : 'text-[#4A4A4F] cursor-not-allowed',
            focusClasses()
          )}
          title="Redo (⌘⇧Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
