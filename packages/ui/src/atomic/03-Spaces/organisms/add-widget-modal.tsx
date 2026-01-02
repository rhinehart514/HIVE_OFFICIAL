'use client';

/**
 * Add Widget Modal
 * Modal for creating a new widget in a space
 *
 * Features:
 * - Quick Deploy: One-click template deployment
 * - Standard widgets: Calendar, Poll, Links, Files, RSS
 * - Custom: Opens HiveLab for AI-assisted tool creation
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springPresets } from '@hive/tokens';
import { X, Calendar, BarChart3, Link, FileText, Rss, Wand2, ExternalLink, Loader2, Check, Timer, Users, MessageSquare, Zap, ClipboardList, Target, TrendingUp, Wallet } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms/button';
import { Input } from '../../00-Global/atoms/input';
import { QUICK_TEMPLATES, type QuickTemplate } from '../../../lib/hivelab/quick-templates';

// ============================================================
// Types
// ============================================================

export type WidgetType = 'calendar' | 'poll' | 'links' | 'files' | 'rss' | 'custom';

export interface AddWidgetInput {
  type: WidgetType;
  title: string;
  config?: Record<string, unknown>;
}

/** Existing tool that can be deployed to a space */
export interface ExistingTool {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  updatedAt?: string;
  status: 'draft' | 'preview' | 'published';
}

export interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: AddWidgetInput) => Promise<void>;
  /** Callback to navigate to HiveLab with space context */
  onOpenHiveLab?: () => void;
  /** Callback to quick-deploy a template */
  onQuickDeploy?: (template: QuickTemplate) => Promise<void>;
  /** Whether quick deploy templates are available */
  showQuickDeploy?: boolean;
  /** Whether to show HiveLab access (leaders-only during January) */
  showHiveLab?: boolean;
  /** User's existing HiveLab tools */
  existingTools?: ExistingTool[];
  /** Loading state for existing tools */
  isLoadingTools?: boolean;
  /** Callback to deploy an existing tool */
  onDeployExistingTool?: (toolId: string) => Promise<void>;
  className?: string;
}

// ============================================================
// Widget Type Options
// ============================================================

const WIDGET_TYPES: Array<{
  type: WidgetType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultTitle: string;
}> = [
  {
    type: 'calendar',
    label: 'Calendar',
    description: 'Display upcoming events',
    icon: Calendar,
    defaultTitle: 'Events',
  },
  {
    type: 'poll',
    label: 'Poll',
    description: 'Create polls and surveys',
    icon: BarChart3,
    defaultTitle: 'Poll',
  },
  {
    type: 'links',
    label: 'Links',
    description: 'Curated link collection',
    icon: Link,
    defaultTitle: 'Quick Links',
  },
  {
    type: 'files',
    label: 'Files',
    description: 'Shared files and documents',
    icon: FileText,
    defaultTitle: 'Files',
  },
  {
    type: 'rss',
    label: 'RSS Feed',
    description: 'Import content from RSS',
    icon: Rss,
    defaultTitle: 'News Feed',
  },
  {
    type: 'custom',
    label: 'Create in HiveLab',
    description: 'Build a custom tool with AI',
    icon: Wand2,
    defaultTitle: 'Custom Tool',
  },
];

// ============================================================
// Main Component
// ============================================================

// Quick template icon mapper
function getQuickTemplateIcon(icon: QuickTemplate['icon']) {
  const iconMap: Record<QuickTemplate['icon'], React.ComponentType<{ className?: string }>> = {
    'bar-chart-2': BarChart3,
    timer: Timer,
    'link-2': Link,
    users: Users,
    calendar: Calendar,
    'message-square': MessageSquare,
    'file-text': FileText,
    sparkles: Wand2,
    'clipboard-list': ClipboardList,
    target: Target,
    'trending-up': TrendingUp,
    wallet: Wallet,
  };
  return iconMap[icon] || Wand2;
}

export function AddWidgetModal({
  open,
  onOpenChange,
  onSubmit,
  onOpenHiveLab,
  onQuickDeploy,
  showQuickDeploy = true,
  showHiveLab = true,
  existingTools = [],
  isLoadingTools = false,
  onDeployExistingTool,
  className,
}: AddWidgetModalProps) {
  const [selectedType, setSelectedType] = React.useState<WidgetType | null>(null);
  const [title, setTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<'select' | 'configure'>('select');

  // Quick deploy state
  const [deployingTemplateId, setDeployingTemplateId] = React.useState<string | null>(null);
  const [deployedTemplateIds, setDeployedTemplateIds] = React.useState<Set<string>>(new Set());

  // Existing tool deploy state
  const [deployingExistingToolId, setDeployingExistingToolId] = React.useState<string | null>(null);
  const [deployedExistingToolIds, setDeployedExistingToolIds] = React.useState<Set<string>>(new Set());

  // Filter widget types based on HiveLab visibility
  const visibleWidgetTypes = React.useMemo(() => {
    return showHiveLab ? WIDGET_TYPES : WIDGET_TYPES.filter(w => w.type !== 'custom');
  }, [showHiveLab]);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedType(null);
      setTitle('');
      setError(null);
      setStep('select');
      setDeployingTemplateId(null);
      // Don't reset deployedTemplateIds to show what was already deployed
    }
  }, [open]);

  // Handle quick deploy
  const handleQuickDeploy = async (template: QuickTemplate) => {
    if (!onQuickDeploy || deployingTemplateId) return;

    setDeployingTemplateId(template.id);
    try {
      await onQuickDeploy(template);
      setDeployedTemplateIds(prev => new Set([...prev, template.id]));
    } catch (err) {
      console.error('Quick deploy failed:', err);
    } finally {
      setDeployingTemplateId(null);
    }
  };

  // Handle deploying existing tool
  const handleDeployExistingTool = async (toolId: string) => {
    if (!onDeployExistingTool || deployingExistingToolId) return;

    setDeployingExistingToolId(toolId);
    try {
      await onDeployExistingTool(toolId);
      setDeployedExistingToolIds(prev => new Set([...prev, toolId]));
    } catch (err) {
      console.error('Deploy existing tool failed:', err);
    } finally {
      setDeployingExistingToolId(null);
    }
  };

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  // Handle type selection
  const handleSelectType = (type: WidgetType) => {
    // Custom type opens HiveLab for full tool creation
    if (type === 'custom' && onOpenHiveLab) {
      onOpenChange(false);
      onOpenHiveLab();
      return;
    }

    setSelectedType(type);
    const widgetOption = WIDGET_TYPES.find((w) => w.type === type);
    setTitle(widgetOption?.defaultTitle || '');
    setStep('configure');
  };

  // Validation
  const trimmedTitle = title.trim();
  const isValid = selectedType && trimmedTitle.length > 0 && trimmedTitle.length <= 50;

  const handleSubmit = async () => {
    if (!isValid || !selectedType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ type: selectedType, title: trimmedTitle });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create widget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedType(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springPresets.snappy}
            className={cn(
              'relative w-full max-w-md mx-4 bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] rounded-2xl shadow-2xl',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hive-border-default)]">
              <h2 className="text-base font-semibold text-[var(--hive-text-primary)]">
                {step === 'select' ? 'Add Widget' : 'Configure Widget'}
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                {step === 'select' ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4 max-h-[60vh] overflow-y-auto"
                  >
                    {/* Quick Deploy Section */}
                    {showQuickDeploy && onQuickDeploy && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-[var(--hive-brand-primary)]" />
                          <span className="text-xs font-medium text-[var(--hive-text-secondary)] uppercase tracking-wider">
                            Quick Deploy
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {QUICK_TEMPLATES.slice(0, 4).map((template) => {
                            const Icon = getQuickTemplateIcon(template.icon);
                            const isDeploying = deployingTemplateId === template.id;
                            const isDeployed = deployedTemplateIds.has(template.id);

                            return (
                              <button
                                key={template.id}
                                onClick={() => handleQuickDeploy(template)}
                                disabled={isDeploying || isDeployed}
                                className={cn(
                                  "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left",
                                  isDeployed
                                    ? "border-[var(--hive-brand-primary)]/30 bg-[var(--hive-brand-primary)]/10"
                                    : "border-[var(--hive-border-default)] bg-[var(--hive-background-tertiary)] hover:border-[var(--hive-brand-primary)] hover:bg-[var(--hive-brand-primary)]/5",
                                  isDeploying && "opacity-70 cursor-wait"
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                  isDeployed
                                    ? "bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)]"
                                    : "bg-[var(--hive-background-secondary)] text-[var(--hive-text-tertiary)]"
                                )}>
                                  {isDeploying ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : isDeployed ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Icon className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className={cn(
                                    "text-sm font-medium block truncate",
                                    isDeployed
                                      ? "text-[var(--hive-brand-primary)]"
                                      : "text-[var(--hive-text-primary)]"
                                  )}>
                                    {template.name}
                                  </span>
                                  <span className="text-[10px] text-[var(--hive-text-tertiary)] block truncate">
                                    {isDeployed ? 'Deployed!' : template.description}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* My Tools Section (only shown when HiveLab is visible) */}
                    {showHiveLab && (existingTools.length > 0 || isLoadingTools) && onDeployExistingTool && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-[var(--hive-text-secondary)]" />
                          <span className="text-xs font-medium text-[var(--hive-text-secondary)] uppercase tracking-wider">
                            My Tools
                          </span>
                        </div>
                        {isLoadingTools ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--hive-text-tertiary)]" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {existingTools.slice(0, 6).map((tool) => {
                              const isDeploying = deployingExistingToolId === tool.id;
                              const isDeployed = deployedExistingToolIds.has(tool.id);

                              return (
                                <button
                                  key={tool.id}
                                  onClick={() => handleDeployExistingTool(tool.id)}
                                  disabled={isDeploying || isDeployed}
                                  className={cn(
                                    "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left",
                                    isDeployed
                                      ? "border-[var(--hive-brand-primary)]/30 bg-[var(--hive-brand-primary)]/10"
                                      : "border-[var(--hive-border-default)] bg-[var(--hive-background-tertiary)] hover:border-[var(--hive-brand-primary)] hover:bg-[var(--hive-brand-primary)]/5",
                                    isDeploying && "opacity-70 cursor-wait"
                                  )}
                                >
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-lg",
                                    isDeployed
                                      ? "bg-[var(--hive-brand-primary)]/20"
                                      : "bg-[var(--hive-background-secondary)]"
                                  )}>
                                    {isDeploying ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-[var(--hive-text-tertiary)]" />
                                    ) : isDeployed ? (
                                      <Check className="h-4 w-4 text-[var(--hive-brand-primary)]" />
                                    ) : (
                                      <span>{tool.icon || '🛠️'}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className={cn(
                                      "text-sm font-medium block truncate",
                                      isDeployed
                                        ? "text-[var(--hive-brand-primary)]"
                                        : "text-[var(--hive-text-primary)]"
                                    )}>
                                      {tool.name}
                                    </span>
                                    <span className="text-[10px] text-[var(--hive-text-tertiary)] block truncate">
                                      {isDeployed ? 'Deployed!' : tool.description || 'HiveLab tool'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {existingTools.length > 6 && (
                          <p className="text-[10px] text-[var(--hive-text-tertiary)] text-center">
                            +{existingTools.length - 6} more tools available
                          </p>
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    {((showQuickDeploy && onQuickDeploy) || (showHiveLab && existingTools.length > 0 && onDeployExistingTool)) && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-[var(--hive-border-default)]" />
                        <span className="text-[10px] text-[var(--hive-text-tertiary)] uppercase tracking-wider">
                          or create
                        </span>
                        <div className="flex-1 h-px bg-[var(--hive-border-default)]" />
                      </div>
                    )}

                    {/* Standard Widget Types */}
                    <div className="grid grid-cols-2 gap-2">
                      {visibleWidgetTypes.map((widgetType) => {
                        const Icon = widgetType.icon;
                        const isHiveLab = widgetType.type === 'custom';
                        return (
                          <button
                            key={widgetType.type}
                            onClick={() => handleSelectType(widgetType.type)}
                            className={cn(
                              "relative flex flex-col items-start p-3 rounded-xl border transition-all text-left group",
                              isHiveLab
                                ? "border-[var(--hive-brand-primary)]/30 bg-[var(--hive-brand-primary)]/5 hover:bg-[var(--hive-brand-primary)]/10 hover:border-[var(--hive-brand-primary)]"
                                : "border-[var(--hive-border-default)] bg-[var(--hive-background-tertiary)] hover:border-[var(--hive-brand-primary)] hover:bg-[var(--hive-brand-primary)]/5"
                            )}
                          >
                            {isHiveLab && (
                              <ExternalLink className="absolute top-2 right-2 h-3 w-3 text-[var(--hive-brand-primary)]/60" />
                            )}
                            <Icon className={cn(
                              "h-5 w-5 mb-2 transition-colors",
                              isHiveLab
                                ? "text-[var(--hive-brand-primary)]"
                                : "text-[var(--hive-text-tertiary)] group-hover:text-[var(--hive-brand-primary)]"
                            )} />
                            <span className={cn(
                              "text-sm font-medium transition-colors",
                              isHiveLab
                                ? "text-[var(--hive-brand-primary)]"
                                : "text-[var(--hive-text-secondary)] group-hover:text-[var(--hive-text-primary)]"
                            )}>
                              {widgetType.label}
                            </span>
                            <span className="text-xs text-[var(--hive-text-tertiary)] line-clamp-2">
                              {widgetType.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="configure"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {/* Selected type indicator */}
                    {selectedType && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--hive-background-tertiary)]">
                        {(() => {
                          const widgetOption = WIDGET_TYPES.find((w) => w.type === selectedType);
                          if (!widgetOption) return null;
                          const Icon = widgetOption.icon;
                          return (
                            <>
                              <Icon className="h-4 w-4 text-[var(--hive-brand-primary)]" />
                              <span className="text-sm font-medium text-[var(--hive-text-primary)]">
                                {widgetOption.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Widget title */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                        Widget Title
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a title for this widget"
                        className="bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                        maxLength={50}
                        autoFocus
                      />
                      {trimmedTitle.length > 0 && (
                        <p className="mt-1 text-xs text-[var(--hive-text-tertiary)]">
                          {50 - trimmedTitle.length} characters remaining
                        </p>
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="text-sm text-[var(--hive-status-error)] bg-[var(--hive-status-error)]/10 rounded-lg p-2">
                        {error}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--hive-border-default)]">
              <div>
                {step === 'configure' && (
                  <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                {step === 'configure' && (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting}
                    className="bg-white text-black hover:bg-neutral-100"
                  >
                    {isSubmitting ? 'Creating...' : 'Add Widget'}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

AddWidgetModal.displayName = 'AddWidgetModal';
