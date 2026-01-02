'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Play,
  Save,
  Rocket,
  MoreHorizontal,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { premiumMotion, premiumPresets, focusClasses } from '../../../lib/premium-design';

interface HeaderBarProps {
  toolName: string;
  onToolNameChange: (name: string) => void;
  onPreview: () => void;
  onSave: () => void;
  saving?: boolean;
  originSpaceId?: string;
  onDeploy?: () => void;
  deploying?: boolean;
  onBack?: () => void;
  hasUnsavedChanges?: boolean;
}

export function HeaderBar({
  toolName,
  onToolNameChange,
  onPreview,
  onSave,
  saving,
  originSpaceId,
  onDeploy,
  deploying,
  onBack,
  hasUnsavedChanges,
}: HeaderBarProps) {
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(toolName);

  const showDeployButton = !!originSpaceId && !!onDeploy;

  const handleNameSubmit = () => {
    setEditingName(false);
    if (localName.trim() !== toolName) {
      onToolNameChange(localName.trim() || 'Untitled Tool');
    }
  };

  return (
    <header
      className={cn(
        'h-12 flex items-center justify-between px-4',
        premiumPresets.glassHeader
      )}
    >
      {/* Left: Back + Logo */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              'p-2 -ml-2 rounded-lg text-[#9A9A9F] hover:text-white hover:bg-white/[0.06] transition-colors',
              focusClasses()
            )}
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* HiveLab Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center shadow-[0_2px_8px_rgba(255,215,0,0.25)]">
            <span className="text-black font-bold text-xs">H</span>
          </div>
          <span className="text-white/90 font-semibold text-sm hidden sm:block">
            HiveLab
          </span>
        </div>
      </div>

      {/* Center: Tool Name */}
      <div className="flex-1 flex items-center justify-center max-w-md mx-4">
        <AnimatePresence mode="wait">
          {editingName ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-[280px]"
            >
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') {
                    setLocalName(toolName);
                    setEditingName(false);
                  }
                }}
                className={cn(
                  'w-full bg-white/[0.06] border border-white/[0.15] rounded-lg px-3 py-1.5',
                  'text-white text-center text-sm font-medium',
                  'outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20',
                  'transition-all'
                )}
                autoFocus
                placeholder="Tool name..."
              />
            </motion.div>
          ) : (
            <motion.button
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={() => {
                setLocalName(toolName);
                setEditingName(true);
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'hover:bg-white/[0.06] transition-colors group',
                focusClasses()
              )}
            >
              <span className="text-white font-medium text-sm truncate max-w-[200px]">
                {toolName || 'Untitled Tool'}
              </span>
              {hasUnsavedChanges && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/50" title="Unsaved changes" />
              )}
              <ChevronDown className="h-3.5 w-3.5 text-[#6B6B70] group-hover:text-[#9A9A9F] transition-colors" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Preview */}
        <button
          type="button"
          onClick={onPreview}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'bg-white/[0.06] hover:bg-white/[0.10] text-white/90',
            'border border-white/[0.08] hover:border-white/[0.12]',
            'transition-all text-sm font-medium',
            focusClasses()
          )}
        >
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Preview</span>
        </button>

        {/* Save or Deploy */}
        {showDeployButton ? (
          <button
            type="button"
            onClick={onDeploy}
            disabled={saving || deploying}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all',
              saving || deploying
                ? 'bg-white/[0.10] text-white/50 cursor-not-allowed'
                : 'bg-[#FFD700] hover:bg-[#E6C200] text-black shadow-[0_2px_12px_rgba(255,215,0,0.25)]',
              focusClasses()
            )}
          >
            {deploying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Rocket className="h-3.5 w-3.5" />
                </motion.div>
                <span>Deploying...</span>
              </>
            ) : saving ? (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Rocket className="h-3.5 w-3.5" />
                <span>Deploy</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all',
              saving
                ? 'bg-white/[0.10] text-white/50 cursor-not-allowed'
                : 'bg-[#FFD700] hover:bg-[#E6C200] text-black shadow-[0_2px_12px_rgba(255,215,0,0.25)]',
              focusClasses()
            )}
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Save className="h-3.5 w-3.5" />
                </motion.div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        )}

        {/* More menu */}
        <button
          type="button"
          className={cn(
            'p-2 rounded-lg text-[#9A9A9F] hover:text-white hover:bg-white/[0.06] transition-colors',
            focusClasses()
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
