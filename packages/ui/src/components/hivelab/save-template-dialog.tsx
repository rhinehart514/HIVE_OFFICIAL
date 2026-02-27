'use client';

/**
 * SaveTemplateDialog - Save a tool as a community template
 *
 * Modal dialog for publishing a tool as a template that others can use.
 * Leaders can set visibility, category, and tags.
 */

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ShareIcon, GlobeAltIcon, BuildingOffice2Icon, LockClosedIcon, TagIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export type TemplateCategory =
  | 'engagement'
  | 'events'
  | 'organization'
  | 'analytics'
  | 'communication'
  | 'academic'
  | 'social'
  | 'productivity';

export type TemplateVisibility = 'private' | 'campus' | 'public';

export interface SaveTemplateDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Tool ID to publish as template */
  toolId: string;
  /** Pre-fill with tool name */
  toolName?: string;
  /** Pre-fill with tool description */
  toolDescription?: string;
  /** Callback on successful publish */
  onSuccess?: (templateId: string) => void;
}

// ============================================================================
// Category Options
// ============================================================================

const CATEGORIES: { value: TemplateCategory; label: string; description: string }[] = [
  { value: 'engagement', label: 'Engagement', description: 'Polls, quizzes, reactions' },
  { value: 'events', label: 'Events', description: 'RSVPs, countdowns, calendars' },
  { value: 'organization', label: 'Organization', description: 'Sign-ups, rosters, schedules' },
  { value: 'analytics', label: 'Analytics', description: 'Dashboards, leaderboards' },
  { value: 'communication', label: 'Communication', description: 'Announcements, notifications' },
  { value: 'academic', label: 'Academic', description: 'Study tools, courses' },
  { value: 'social', label: 'Social', description: 'Games, icebreakers' },
  { value: 'productivity', label: 'Productivity', description: 'Tasks, checklists' },
];

const VISIBILITY_OPTIONS: { value: TemplateVisibility; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'private', label: 'Private', description: 'Only you can see and use this template', icon: LockClosedIcon },
  { value: 'campus', label: 'Campus', description: 'Students at your campus can use this template', icon: BuildingOffice2Icon },
  { value: 'public', label: 'Public', description: 'Anyone on HIVE can use this template', icon: GlobeAltIcon },
];

// ============================================================================
// Component
// ============================================================================

export function SaveTemplateDialog({
  isOpen,
  onClose,
  toolId,
  toolName = '',
  toolDescription = '',
  onSuccess,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState(toolName ? `${toolName} Template` : '');
  const [description, setDescription] = useState(toolDescription);
  const [category, setCategory] = useState<TemplateCategory>('engagement');
  const [visibility, setVisibility] = useState<TemplateVisibility>('campus');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setName(toolName ? `${toolName} Template` : '');
      setDescription(toolDescription);
      setCategory('engagement');
      setVisibility('campus');
      setTags([]);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, toolName, toolDescription]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tools/${toolId}/publish-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          visibility,
          tags,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish template');
      }

      const data = await response.json();
      setSuccess(true);

      // Callback and close after brief success state
      setTimeout(() => {
        onSuccess?.(data.template.id);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
            'relative w-full max-w-lg mx-4',
            'bg-gray-900 rounded-2xl border border-white/[0.06]',
            'shadow-2xl shadow-black/40'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--hive-gold-cta)]/20 flex items-center justify-center">
                <ShareIcon className="w-5 h-5 text-[var(--hive-gold-cta)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Save as Template</h2>
                <p className="text-sm text-white/50">Share this app with the community</p>
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
              <h3 className="text-lg font-semibold text-white mb-2">Template Published!</h3>
              <p className="text-white/60">Your app is now available in the template gallery.</p>
            </div>
          ) : (
            <>
              {/* Form */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
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
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Quick Poll Template"
                    maxLength={100}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg',
                      'bg-white/[0.04] border border-white/[0.06]',
                      'text-white placeholder:text-white/30',
                      'focus:outline-none focus:border-white/20'
                    )}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What does this template help people do?"
                    rows={3}
                    maxLength={500}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg resize-none',
                      'bg-white/[0.04] border border-white/[0.06]',
                      'text-white placeholder:text-white/30',
                      'focus:outline-none focus:border-white/20'
                    )}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          'p-3 rounded-lg text-left transition-colors',
                          category === cat.value
                            ? 'bg-[var(--hive-gold-cta)]/20 border border-[var(--hive-gold-cta)]/40'
                            : 'bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.08]'
                        )}
                      >
                        <p className="text-sm font-medium text-white">{cat.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{cat.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Who can use this template?
                  </label>
                  <div className="space-y-2">
                    {VISIBILITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setVisibility(opt.value)}
                        className={cn(
                          'w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3',
                          visibility === opt.value
                            ? 'bg-[var(--hive-gold-cta)]/20 border border-[var(--hive-gold-cta)]/40'
                            : 'bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.08]'
                        )}
                      >
                        <opt.icon className={cn(
                          'w-5 h-5',
                          visibility === opt.value ? 'text-[var(--hive-gold-cta)]' : 'text-white/40'
                        )} />
                        <div>
                          <p className="text-sm font-medium text-white">{opt.label}</p>
                          <p className="text-xs text-white/40">{opt.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Tags (optional)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="Add a tag"
                        maxLength={20}
                        className={cn(
                          'w-full pl-10 pr-4 py-2 rounded-lg',
                          'bg-white/[0.04] border border-white/[0.06]',
                          'text-white placeholder:text-white/30',
                          'focus:outline-none focus:border-white/20'
                        )}
                      />
                    </div>
                    <button
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || tags.length >= 5}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-colors',
                        'bg-white/[0.06] text-white/60',
                        'hover:bg-white/[0.1] hover:text-white',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.08] text-sm text-white/70"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-white"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.06]">
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
                  disabled={loading || !name.trim() || !description.trim()}
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
                      Publishing...
                    </>
                  ) : (
                    <>
                      <ShareIcon className="w-4 h-4" />
                      Publish Template
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

export default SaveTemplateDialog;
