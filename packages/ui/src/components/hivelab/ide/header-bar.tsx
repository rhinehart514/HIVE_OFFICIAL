'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, PlayIcon, BookmarkIcon, RocketLaunchIcon, EllipsisHorizontalIcon, ArrowLeftIcon, CheckIcon, PencilSquareIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';

// HiveLab Dark Header Theme
const HEADER_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  accentHover: 'var(--life-gold, #D4AF37)',
  inputBg: 'var(--hivelab-surface, #141414)',
  hoverBg: 'var(--hivelab-surface-hover, #1A1A1A)',
};

// Focus ring - white for dark theme
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

export type PageMode = 'edit' | 'use';

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
  onAnalytics?: () => void;
  /** Current page mode - edit or use */
  mode?: PageMode;
  /** Callback when page mode changes */
  onModeChange?: (mode: PageMode) => void;
  /** Whether to show mode toggle (hide for viewers who can't edit) */
  canEdit?: boolean;
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
  onAnalytics,
  mode = 'edit',
  onModeChange,
  canEdit = true,
}: HeaderBarProps) {
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(toolName);
  const [showMenu, setShowMenu] = useState(false);

  const showDeployButton = !!onDeploy;
  const showModeToggle = canEdit && onModeChange;

  const handleNameSubmit = () => {
    setEditingName(false);
    if (localName.trim() !== toolName) {
      onToolNameChange(localName.trim() || 'Untitled Tool');
    }
  };

  return (
    <header
      className="h-12 flex items-center justify-between px-4"
      style={{
        backgroundColor: HEADER_COLORS.bg,
        borderBottom: `1px solid ${HEADER_COLORS.border}`,
      }}
    >
      {/* Left: Back + Logo */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              'p-2 -ml-2 rounded-lg transition-colors duration-200',
              focusRing
            )}
            style={{ color: HEADER_COLORS.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = HEADER_COLORS.text;
              e.currentTarget.style.backgroundColor = HEADER_COLORS.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = HEADER_COLORS.textSecondary;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Back"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        )}

        {/* HiveLab Logo - Keep gold accent on light bg */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: HEADER_COLORS.accent,
              boxShadow: `0 2px 8px ${HEADER_COLORS.accent}40`,
            }}
          >
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span
            className="font-semibold text-sm hidden sm:block"
            style={{ color: HEADER_COLORS.text }}
          >
            HiveLab
          </span>
        </div>

        {/* Mode Toggle - Edit/Use */}
        {showModeToggle && (
          <div className="hidden sm:flex items-center ml-4">
            <div
              className="flex items-center p-0.5 rounded-lg"
              style={{ backgroundColor: HEADER_COLORS.inputBg }}
            >
              <button
                type="button"
                onClick={() => onModeChange?.('edit')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
                  focusRing
                )}
                style={{
                  backgroundColor: mode === 'edit' ? HEADER_COLORS.hoverBg : 'transparent',
                  color: mode === 'edit' ? HEADER_COLORS.text : HEADER_COLORS.textSecondary,
                  boxShadow: mode === 'edit' ? `0 1px 2px rgba(0,0,0,0.2)` : 'none',
                }}
              >
                <PencilSquareIcon className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onModeChange?.('use')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
                  focusRing
                )}
                style={{
                  backgroundColor: mode === 'use' ? HEADER_COLORS.hoverBg : 'transparent',
                  color: mode === 'use' ? HEADER_COLORS.text : HEADER_COLORS.textSecondary,
                  boxShadow: mode === 'use' ? `0 1px 2px rgba(0,0,0,0.2)` : 'none',
                }}
              >
                <CursorArrowRaysIcon className="h-3.5 w-3.5" />
                Use
              </button>
            </div>
          </div>
        )}
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
                  'w-full text-center font-medium px-3 py-1.5 rounded-lg border transition-colors',
                  focusRing
                )}
                style={{
                  backgroundColor: HEADER_COLORS.inputBg,
                  borderColor: HEADER_COLORS.border,
                  color: HEADER_COLORS.text,
                }}
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
                'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors group',
                focusRing
              )}
              style={{ color: HEADER_COLORS.text }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = HEADER_COLORS.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span className="font-medium text-sm truncate max-w-[200px]">
                {toolName || 'Untitled Tool'}
              </span>
              {hasUnsavedChanges && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: HEADER_COLORS.accent }}
                  title="Unsaved changes"
                />
              )}
              <ChevronDownIcon
                className="h-3.5 w-3.5 transition-colors"
                style={{ color: HEADER_COLORS.textTertiary }}
              />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Analytics - visible button for feedback loop */}
        {onAnalytics && (
          <button
            type="button"
            onClick={onAnalytics}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              focusRing
            )}
            style={{
              color: HEADER_COLORS.textSecondary,
              backgroundColor: 'transparent',
              border: `1px solid transparent`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = HEADER_COLORS.hoverBg;
              e.currentTarget.style.borderColor = HEADER_COLORS.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            title="View analytics"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <span className="hidden sm:block">Analytics</span>
          </button>
        )}

        {/* Preview - secondary button (hidden in use mode) */}
        {mode === 'edit' && (
          <button
            type="button"
            onClick={onPreview}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              focusRing
            )}
            style={{
              color: HEADER_COLORS.textSecondary,
              backgroundColor: HEADER_COLORS.hoverBg,
              border: `1px solid ${HEADER_COLORS.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = HEADER_COLORS.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = HEADER_COLORS.border;
            }}
          >
            <PlayIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Preview</span>
          </button>
        )}

        {/* Save or Deploy - primary green button */}
        {showDeployButton ? (
          <button
            type="button"
            onClick={onDeploy}
            disabled={saving || deploying}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors',
              (saving || deploying) && 'opacity-50 cursor-not-allowed',
              focusRing
            )}
            style={{ backgroundColor: HEADER_COLORS.accent }}
            onMouseEnter={(e) => {
              if (!saving && !deploying) {
                e.currentTarget.style.backgroundColor = HEADER_COLORS.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = HEADER_COLORS.accent;
            }}
          >
            {deploying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RocketLaunchIcon className="h-3.5 w-3.5" />
                </motion.div>
                <span>Deploying...</span>
              </>
            ) : saving ? (
              <>
                <BookmarkIcon className="h-3.5 w-3.5" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <RocketLaunchIcon className="h-3.5 w-3.5" />
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
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors',
              saving && 'opacity-50 cursor-not-allowed',
              focusRing
            )}
            style={{ backgroundColor: HEADER_COLORS.accent }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = HEADER_COLORS.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = HEADER_COLORS.accent;
            }}
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <BookmarkIcon className="h-3.5 w-3.5" />
                </motion.div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        )}

        {/* More menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              focusRing
            )}
            style={{ color: HEADER_COLORS.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = HEADER_COLORS.text;
              e.currentTarget.style.backgroundColor = HEADER_COLORS.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = HEADER_COLORS.textSecondary;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 min-w-[160px] py-1 rounded-lg shadow-lg"
                  style={{
                    backgroundColor: HEADER_COLORS.bg,
                    border: `1px solid ${HEADER_COLORS.border}`,
                  }}
                >
                  {onAnalytics && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onAnalytics();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                      style={{ color: HEADER_COLORS.text }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = HEADER_COLORS.hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                      Analytics
                    </button>
                  )}

                  {onDeploy && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDeploy();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                      style={{ color: HEADER_COLORS.text }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = HEADER_COLORS.hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <RocketLaunchIcon className="h-4 w-4" />
                      Deploy to Space
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onSave();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                    style={{ color: HEADER_COLORS.text }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = HEADER_COLORS.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <BookmarkIcon className="h-4 w-4" />
                    Save Tool
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
