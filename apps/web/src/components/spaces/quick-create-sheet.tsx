'use client';

/**
 * QuickCreateSheet — Bottom sheet for in-space template tool creation.
 *
 * Shows 8 core template tiles. Tap one → name it → creates tool + deploys
 * to the target space in one flow. No builder, no navigation away.
 *
 * Usage:
 *   <QuickCreateSheet
 *     open={showSheet}
 *     onOpenChange={setShowSheet}
 *     spaceId="abc123"
 *     spaceName="Design Club"
 *     onCreated={(toolId) => refetchTools()}
 *   />
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { MOTION } from '@hive/tokens';
import { Modal, ModalContent } from '@hive/ui';
import { getQuickTemplate } from '@hive/ui';
import { createToolFromTemplateApi } from '@/lib/hivelab/create-tool';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface CoreTemplate {
  id: string;
  emoji: string;
  name: string;
  description: string;
  templateId: string;
}

export interface QuickCreateSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Target space ID to deploy the tool to */
  spaceId: string;
  /** Target space display name */
  spaceName: string;
  /** Called after successful create + deploy with the new tool ID */
  onCreated: (toolId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const CORE_TEMPLATES: CoreTemplate[] = [
  {
    id: 'quick-poll',
    emoji: '📊',
    name: 'Quick Poll',
    description: 'Gather opinions in one tap',
    templateId: 'quick-poll',
  },
  {
    id: 'event-rsvp',
    emoji: '📅',
    name: 'Event RSVP',
    description: 'Let members RSVP instantly',
    templateId: 'event-rsvp',
  },
  {
    id: 'signup-sheet',
    emoji: '📋',
    name: 'Signup Sheet',
    description: 'Slot-based signups for anything',
    templateId: 'office-hours',
  },
  {
    id: 'feedback-form',
    emoji: '💬',
    name: 'Feedback Form',
    description: 'Collect structured feedback',
    templateId: 'feedback-form',
  },
  {
    id: 'leaderboard',
    emoji: '🏆',
    name: 'Leaderboard',
    description: 'Track points and rankings',
    templateId: 'member-leaderboard',
  },
  {
    id: 'announcement',
    emoji: '📢',
    name: 'Announcement',
    description: 'Pin important updates',
    templateId: 'announcements',
  },
  {
    id: 'checklist',
    emoji: '✅',
    name: 'Checklist',
    description: 'Shared progress tracking',
    templateId: 'meeting-notes',
  },
  {
    id: 'member-directory',
    emoji: '👥',
    name: 'Member Directory',
    description: 'Searchable contact list',
    templateId: 'study-group-signup',
  },
];

const EASE = MOTION.ease.premium;

const COLORS = {
  text: '#FAF9F7',
  textSecondary: '#8A8A8A',
  textTertiary: '#5A5A5A',
  surface: '#080808',
  border: 'rgba(255, 255, 255, 0.06)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
};

// ═══════════════════════════════════════════════════════════════════
// INTERNAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function SheetTile({
  template,
  index,
  onSelect,
  disabled,
}: {
  template: CoreTemplate;
  index: number;
  onSelect: (t: CoreTemplate) => void;
  disabled: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.2,
        delay: shouldReduceMotion ? 0 : index * 0.04,
        ease: EASE,
      }}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      onClick={() => !disabled && onSelect(template)}
      disabled={disabled}
      className="flex items-center gap-3 p-3 rounded-xl border transition-colors duration-150 text-left"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: COLORS.border,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = COLORS.borderHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
      }}
    >
      <div className="text-xl flex-shrink-0">{template.emoji}</div>
      <div className="min-w-0">
        <div className="font-medium text-[14px] truncate" style={{ color: COLORS.text }}>
          {template.name}
        </div>
        <div className="text-[12px] truncate" style={{ color: COLORS.textSecondary }}>
          {template.description}
        </div>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

type SheetStep = 'pick' | 'name' | 'creating' | 'success';

export function QuickCreateSheet({
  open,
  onOpenChange,
  spaceId,
  spaceName,
  onCreated,
}: QuickCreateSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = React.useState<SheetStep>('pick');
  const [selected, setSelected] = React.useState<CoreTemplate | null>(null);
  const [toolName, setToolName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when sheet opens
  React.useEffect(() => {
    if (open) {
      setStep('pick');
      setSelected(null);
      setToolName('');
      setError(null);
    }
  }, [open]);

  // Auto-focus name input
  React.useEffect(() => {
    if (step === 'name') {
      const timer = setTimeout(() => inputRef.current?.focus(), shouldReduceMotion ? 0 : 150);
      return () => clearTimeout(timer);
    }
  }, [step, shouldReduceMotion]);

  const handleSelectTemplate = React.useCallback((template: CoreTemplate) => {
    setSelected(template);
    setStep('name');
    setError(null);
  }, []);

  const handleBack = React.useCallback(() => {
    setStep('pick');
    setSelected(null);
    setToolName('');
    setError(null);
  }, []);

  const handleCreate = React.useCallback(async () => {
    if (!selected || !toolName.trim()) return;
    setStep('creating');
    setError(null);

    try {
      // Resolve template from registry
      const quickTemplate = getQuickTemplate(selected.templateId);
      if (!quickTemplate) {
        throw new Error(`Template "${selected.templateId}" not found`);
      }

      // Create tool via API
      const toolId = await createToolFromTemplateApi(quickTemplate, { title: toolName.trim() });

      // Deploy to space
      const deployRes = await fetch(`/api/spaces/${spaceId}/tools/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toolId }),
      });

      if (!deployRes.ok) {
        const deployError = await deployRes.json().catch(() => ({}));
        // Tool was created but deploy failed — still treat as partial success
        logger.warn('Quick create: tool created but deploy failed', {
          component: 'QuickCreateSheet',
          spaceId,
          toolId,
          error: deployError,
        });
        toast.success(`${toolName.trim()} created but needs manual deploy`);
        onCreated(toolId);
        onOpenChange(false);
        return;
      }

      // Full success
      setStep('success');
      toast.success(`${toolName.trim()} deployed to ${spaceName}`);

      // Brief pause for success state, then close
      setTimeout(() => {
        onCreated(toolId);
        onOpenChange(false);
      }, shouldReduceMotion ? 200 : 800);
    } catch (err) {
      logger.error(
        'Quick create failed',
        { component: 'QuickCreateSheet', templateId: selected.templateId, spaceId },
        err instanceof Error ? err : undefined
      );
      setError(err instanceof Error ? err.message : 'Failed to create app');
      toast.error('Failed to create app');
      setStep('name');
    }
  }, [selected, toolName, spaceId, spaceName, onCreated, onOpenChange, shouldReduceMotion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        variant="sheet"
        showClose={step === 'pick'}
        className="max-h-[85vh] overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Pick Template ─── */}
          {step === 'pick' && (
            <motion.div
              key="pick"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            >
              <div className="mb-5">
                <h2 className="text-lg font-medium" style={{ color: COLORS.text }}>
                  Add an app to {spaceName}
                </h2>
                <p className="text-[13px] mt-1" style={{ color: COLORS.textSecondary }}>
                  Pick a template to get started
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CORE_TEMPLATES.map((template, index) => (
                  <SheetTile
                    key={template.id}
                    template={template}
                    index={index}
                    onSelect={handleSelectTemplate}
                    disabled={false}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Name Tool ─── */}
          {step === 'name' && selected && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="text-2xl">{selected.emoji}</div>
                <div>
                  <h2 className="text-lg font-medium" style={{ color: COLORS.text }}>
                    {selected.name}
                  </h2>
                  <p className="text-[13px]" style={{ color: COLORS.textSecondary }}>
                    {selected.description}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <label
                  className="block text-[13px] font-medium mb-2"
                  style={{ color: COLORS.textSecondary }}
                >
                  Name your app
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder={`e.g. "${selected.name} for ${spaceName}"`}
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-colors duration-150 border"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: COLORS.border,
                    color: COLORS.text,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderHover;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                  }}
                />

                {/* Error */}
                {error && (
                  <div
                    className="mt-3 p-3 rounded-lg text-[13px]"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-5">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-[13px] font-medium transition-colors duration-150"
                    style={{ color: COLORS.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.textSecondary;
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!toolName.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150"
                    style={{
                      backgroundColor: toolName.trim() ? COLORS.text : 'rgba(255, 255, 255, 0.06)',
                      color: toolName.trim() ? '#000' : COLORS.textTertiary,
                      cursor: toolName.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Create & Deploy
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ─── STEP 3: Creating ─── */}
          {step === 'creating' && selected && (
            <motion.div
              key="creating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center"
            >
              <Loader2
                className="h-8 w-8 mx-auto mb-4 animate-spin"
                style={{ color: COLORS.textSecondary }}
              />
              <p className="text-[15px] font-medium" style={{ color: COLORS.text }}>
                Creating {toolName.trim()}...
              </p>
              <p className="text-[13px] mt-1" style={{ color: COLORS.textSecondary }}>
                Deploying to {spaceName}
              </p>
            </motion.div>
          )}

          {/* ─── STEP 4: Success ─── */}
          {step === 'success' && selected && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="py-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className="text-4xl mb-4"
              >
                {selected.emoji}
              </motion.div>
              <p className="text-[15px] font-medium" style={{ color: COLORS.text }}>
                {toolName.trim()} is live!
              </p>
              <p className="text-[13px] mt-1" style={{ color: COLORS.textSecondary }}>
                Deployed to {spaceName}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
}

QuickCreateSheet.displayName = 'QuickCreateSheet';
