'use client';

/**
 * RemixDialog - Create a tool copy from a template
 *
 * Modal dialog for "remixing" a template - creating your own copy
 * that you can customize for your space.
 */

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClipboardDocumentIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon, SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  elementCount: number;
  connectionCount: number;
  creatorName?: string;
}

export interface RemixDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Template to remix */
  template: TemplateInfo | null;
  /** Callback on successful remix */
  onSuccess?: (toolId: string, redirectUrl: string) => void;
  /** Available spaces the user can associate the tool with */
  availableSpaces?: Array<{ id: string; name: string }>;
}

// ============================================================================
// Component
// ============================================================================

export function RemixDialog({
  isOpen,
  onClose,
  template,
  onSuccess,
  availableSpaces = [],
}: RemixDialogProps) {
  const [name, setName] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdToolId, setCreatedToolId] = useState<string | null>(null);

  // Reset form when dialog opens with new template
  React.useEffect(() => {
    if (isOpen && template) {
      setName(template.name);
      setSelectedSpaceId(null);
      setError(null);
      setSuccess(false);
      setCreatedToolId(null);
    }
  }, [isOpen, template]);

  const handleSubmit = async () => {
    if (!template) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || template.name,
          spaceId: selectedSpaceId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tool');
      }

      const data = await response.json();
      setSuccess(true);
      setCreatedToolId(data.tool.id);

      // Callback after brief success state
      setTimeout(() => {
        onSuccess?.(data.tool.id, data.redirectUrl);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tool');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !template) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            'relative w-full max-w-md mx-4',
            'bg-gray-900 rounded-2xl border border-white/[0.08]',
            'shadow-2xl shadow-black/40'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <ClipboardDocumentIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Use Template</h2>
                <p className="text-sm text-white/50">Create your own copy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Success State */}
          {success ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Tool Created!</h3>
              <p className="text-white/60 mb-4">Your tool is ready to customize.</p>
              <button
                onClick={() => {
                  if (createdToolId) {
                    onSuccess?.(createdToolId, `/tools/${createdToolId}`);
                  }
                  onClose();
                }}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-[var(--hive-gold-cta)] text-black font-medium',
                  'hover:brightness-110 transition-colors'
                )}
              >
                <SparklesIcon className="w-4 h-4" />
                Open in HiveLab
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Template Preview */}
              <div className="p-6 border-b border-white/[0.08]">
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <h3 className="font-medium text-white">{template.name}</h3>
                  <p className="text-sm text-white/50 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                    <span>
                      {template.elementCount} element{template.elementCount !== 1 ? 's' : ''}
                    </span>
                    {template.connectionCount > 0 && (
                      <span>
                        {template.connectionCount} connection{template.connectionCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {template.creatorName && (
                      <span>by {template.creatorName}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5">
                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <ExclamationCircleIcon className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Tool Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={template.name}
                    maxLength={100}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg',
                      'bg-white/[0.04] border border-white/[0.08]',
                      'text-white placeholder:text-white/30',
                      'focus:outline-none focus:border-white/20'
                    )}
                  />
                  <p className="text-xs text-white/40 mt-1.5">
                    You can rename this later
                  </p>
                </div>

                {/* Space Selection (optional) */}
                {availableSpaces.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Associate with Space (optional)
                    </label>
                    <select
                      value={selectedSpaceId || ''}
                      onChange={e => setSelectedSpaceId(e.target.value || null)}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-lg',
                        'bg-white/[0.04] border border-white/[0.08]',
                        'text-white',
                        'focus:outline-none focus:border-white/20'
                      )}
                    >
                      <option value="">No space (personal tool)</option>
                      {availableSpaces.map(space => (
                        <option key={space.id} value={space.id}>
                          {space.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.08]">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    'text-white/60 hover:text-white hover:bg-white/[0.06]'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={cn(
                    'px-5 py-2 rounded-lg font-medium transition-colors',
                    'bg-[var(--hive-gold-cta)] text-black',
                    'hover:brightness-110',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center gap-2'
                  )}
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      Create My ClipboardDocumentIcon
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default RemixDialog;
