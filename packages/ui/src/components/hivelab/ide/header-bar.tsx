'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  BookmarkIcon,
  RocketLaunchIcon,
  EllipsisHorizontalIcon,
  ArrowLeftIcon,
  CheckIcon,
  PencilSquareIcon,
  CursorArrowRaysIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';

// ============================================
// HiveLab Header - Uses CSS variables from globals.css
// ============================================

// Focus ring - white for dark theme
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

export type PageMode = 'edit' | 'use';

interface HeaderBarProps {
  toolName: string;
  onToolNameChange: (name: string) => void;
  onPreview: () => void;
  onSave: () => void;
  saving?: boolean;
  /** Indicates save just completed (triggers celebration animation) */
  justSaved?: boolean;
  originSpaceId?: string;
  onDeploy?: () => void;
  deploying?: boolean;
  onBack?: () => void;
  hasUnsavedChanges?: boolean;
  onAnalytics?: () => void;
  onSettings?: () => void;
  /** Current page mode - edit or use */
  mode?: PageMode;
  /** Callback when page mode changes */
  onModeChange?: (mode: PageMode) => void;
  /** Whether to show mode toggle (hide for viewers who can't edit) */
  canEdit?: boolean;
}

/**
 * HeaderBar — HiveLab IDE Header
 *
 * CTA Hierarchy (Jan 2026):
 * - Save: Utility action, always accessible, subtle styling
 * - Deploy: Primary goal, prominent gold button
 * - Edit/Use: Mode toggle for previewing work
 *
 * Layout: [Back | Logo | Mode Toggle] --- [Tool Name] --- [Save | Deploy | Menu]
 */
export function HeaderBar({
  toolName,
  onToolNameChange,
  onPreview,
  onSave,
  saving,
  justSaved,
  originSpaceId,
  onDeploy,
  deploying,
  onBack,
  hasUnsavedChanges,
  onAnalytics,
  onSettings,
  mode = 'edit',
  onModeChange,
  canEdit = true,
}: HeaderBarProps) {
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(toolName);
  const [showMenu, setShowMenu] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Show "Saved" indicator when justSaved becomes true, then fade after 2s
  useEffect(() => {
    if (justSaved) {
      setShowSavedIndicator(true);
      const timer = setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justSaved]);

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
        backgroundColor: 'var(--hivelab-panel)',
        borderBottom: `1px solid ${'var(--hivelab-border)'}`,
      }}
    >
      {/* Left: Back + Logo + Mode Toggle */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              'p-2 -ml-2 rounded-lg transition-colors duration-200',
              focusRing
            )}
            style={{ color: 'var(--hivelab-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--hivelab-text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--hivelab-text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Back to HiveLab"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        )}

        {/* HiveLab Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: 'var(--hivelab-connection)',
              boxShadow: `0 2px 8px ${'var(--hivelab-connection)'}40`,
            }}
          >
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span
            className="font-semibold text-sm hidden sm:block"
            style={{ color: 'var(--hivelab-text-primary)' }}
          >
            HiveLab
          </span>
        </div>

        {/* Mode Toggle - Edit/Use */}
        {showModeToggle && (
          <div className="hidden sm:flex items-center ml-4">
            <div
              className="flex items-center p-0.5 rounded-lg"
              style={{ backgroundColor: 'var(--hivelab-surface)' }}
            >
              <button
                type="button"
                onClick={() => onModeChange?.('edit')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
                  focusRing
                )}
                style={{
                  backgroundColor: mode === 'edit' ? 'var(--hivelab-surface-hover)' : 'transparent',
                  color: mode === 'edit' ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-secondary)',
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
                  backgroundColor: mode === 'use' ? 'var(--hivelab-surface-hover)' : 'transparent',
                  color: mode === 'use' ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-secondary)',
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
                  backgroundColor: 'var(--hivelab-surface)',
                  borderColor: 'var(--hivelab-border)',
                  color: 'var(--hivelab-text-primary)',
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
              style={{ color: 'var(--hivelab-text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
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
                  style={{ backgroundColor: 'var(--hivelab-connection)' }}
                  title="Unsaved changes"
                />
              )}
              <ChevronDownIcon
                className="h-3.5 w-3.5 transition-colors"
                style={{ color: 'var(--hivelab-text-tertiary)' }}
              />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Separate "Saved" status indicator - fades after 2s per DRAMA plan */}
        <AnimatePresence>
          {showSavedIndicator && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5 ml-3 text-xs font-medium"
              style={{ color: 'var(--hivelab-connection)' }}
            >
              <CheckIcon className="h-3 w-3" />
              <span>Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Auto-save Indicator + Deploy + Menu */}
      <div className="flex items-center gap-2">
        {/* Auto-save Status Indicator - non-interactive */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <AnimatePresence mode="wait">
            {saving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
                style={{ color: 'var(--hivelab-text-secondary)' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <BookmarkIcon className="h-3.5 w-3.5" />
                </motion.div>
                <span className="hidden sm:block">Saving...</span>
              </motion.div>
            ) : justSaved || showSavedIndicator ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
                style={{ color: 'var(--hivelab-connection)' }}
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Saved</span>
              </motion.div>
            ) : hasUnsavedChanges ? (
              <motion.div
                key="unsaved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
                style={{ color: 'var(--hivelab-text-tertiary)' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--hivelab-connection)' }}
                />
                <span className="hidden sm:block">Editing</span>
              </motion.div>
            ) : (
              <motion.div
                key="synced"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
                style={{ color: 'var(--hivelab-text-tertiary)' }}
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Deploy Button - primary CTA */}
        {onDeploy && (
          <button
            type="button"
            onClick={onDeploy}
            disabled={deploying}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-black transition-all duration-200',
              deploying && 'opacity-50 cursor-not-allowed',
              focusRing
            )}
            style={{
              backgroundColor: 'var(--hivelab-connection)',
              boxShadow: `0 2px 8px ${'var(--hivelab-connection)'}30`,
            }}
            onMouseEnter={(e) => {
              if (!deploying) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${'var(--hivelab-connection)'}40`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 2px 8px ${'var(--hivelab-connection)'}30`;
            }}
          >
            {deploying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RocketLaunchIcon className="h-4 w-4" />
                </motion.div>
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <RocketLaunchIcon className="h-4 w-4" />
                <span>Deploy</span>
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
            style={{ color: 'var(--hivelab-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--hivelab-text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--hivelab-text-secondary)';
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
                  className="absolute right-0 top-full mt-1 z-50 min-w-[180px] py-1 rounded-lg shadow-lg"
                  style={{
                    backgroundColor: 'var(--hivelab-panel)',
                    border: `1px solid ${'var(--hivelab-border)'}`,
                  }}
                >
                  {onAnalytics && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onAnalytics();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                      style={{ color: 'var(--hivelab-text-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                      View Analytics
                    </button>
                  )}

                  {onSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                      style={{ color: 'var(--hivelab-text-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hivelab-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Tool Settings
                    </button>
                  )}

                  {/* Divider if there are items above */}
                  {(onAnalytics || onSettings) && (
                    <div
                      className="my-1 h-px mx-2"
                      style={{ backgroundColor: 'var(--hivelab-border)' }}
                    />
                  )}

                  {/* Keyboard shortcuts help */}
                  <div className="px-3 py-2">
                    <div
                      className="text-xs font-medium mb-1.5"
                      style={{ color: 'var(--hivelab-text-tertiary)' }}
                    >
                      Shortcuts
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--hivelab-text-secondary)' }}>
                        <span>Save</span>
                        <kbd className="px-1.5 py-0.5 rounded text-label-xs" style={{ backgroundColor: 'var(--hivelab-surface)' }}>⌘S</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--hivelab-text-secondary)' }}>
                        <span>AI Prompt</span>
                        <kbd className="px-1.5 py-0.5 rounded text-label-xs" style={{ backgroundColor: 'var(--hivelab-surface)' }}>⌘K</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--hivelab-text-secondary)' }}>
                        <span>Undo</span>
                        <kbd className="px-1.5 py-0.5 rounded text-label-xs" style={{ backgroundColor: 'var(--hivelab-surface)' }}>⌘Z</kbd>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
