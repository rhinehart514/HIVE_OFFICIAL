'use client';

/**
 * /tools/setups/[setupId]/edit — Edit Setup Orchestration
 *
 * Edit orchestration rules for community-created setups.
 * System templates cannot be edited.
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Zap,
  Timer,
  Settings,
  Play,
  ArrowRight,
  Eye,
  EyeOff,
  Bell,
  Layers,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { BrandSpinner, Button } from '@hive/ui';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  bg: 'var(--bg-ground, #0A0A09)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
};

// Trigger type options
const TRIGGER_TYPES = [
  { value: 'tool_event', label: 'Tool Event', icon: Zap },
  { value: 'time_relative', label: 'Time Offset', icon: Timer },
  { value: 'data_condition', label: 'Data Condition', icon: Settings },
  { value: 'manual', label: 'Manual Trigger', icon: Play },
];

// Action type options
const ACTION_TYPES = [
  { value: 'visibility', label: 'Show/Hide Tool', icon: Eye },
  { value: 'notification', label: 'Send Notification', icon: Bell },
  { value: 'data_flow', label: 'Flow Data', icon: ArrowRight },
  { value: 'state', label: 'Update State', icon: Layers },
  { value: 'config', label: 'Update Config', icon: Settings },
];

interface SetupToolSlot {
  slotId: string;
  name: string;
  placement: string;
}

interface OrchestrationRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    sourceSlotId?: string;
    eventType?: string;
    buttonLabel?: string;
    offsetMinutes?: number;
    referenceField?: string;
    dataPath?: string;
    operator?: string;
    value?: unknown;
  };
  actions: Array<{
    type: string;
    targetSlotId?: string;
    sourceSlotId?: string;
    sourceOutput?: string;
    targetInput?: string;
    visible?: boolean;
    title?: string;
    body?: string;
    recipients?: string;
    updates?: Record<string, unknown>;
    merge?: boolean;
  }>;
  enabled: boolean;
  runOnce?: boolean;
}

interface SetupTemplateDetail {
  id: string;
  name: string;
  description: string;
  tools: SetupToolSlot[];
  orchestration: OrchestrationRule[];
  isSystem: boolean;
  creatorId: string;
}

async function fetchSetupTemplate(id: string): Promise<SetupTemplateDetail> {
  const response = await fetch(`/api/setups/templates/${id}`);
  if (!response.ok) throw new Error('Failed to fetch setup template');
  const data = await response.json();
  return data.template;
}

/**
 * RuleEditor — Edit a single orchestration rule
 */
function RuleEditor({
  rule,
  slots,
  onChange,
  onDelete,
}: {
  rule: OrchestrationRule;
  slots: SetupToolSlot[];
  onChange: (rule: OrchestrationRule) => void;
  onDelete: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const updateTrigger = (updates: Partial<typeof rule.trigger>) => {
    onChange({ ...rule, trigger: { ...rule.trigger, ...updates } });
  };

  const updateAction = (index: number, updates: Partial<(typeof rule.actions)[0]>) => {
    const newActions = [...rule.actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange({ ...rule, actions: newActions });
  };

  const addAction = () => {
    onChange({
      ...rule,
      actions: [...rule.actions, { type: 'visibility', targetSlotId: slots[0]?.slotId, visible: true }],
    });
  };

  const removeAction = (index: number) => {
    onChange({
      ...rule,
      actions: rule.actions.filter((_, i) => i !== index),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: rule.enabled ? COLORS.border : 'rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GripVertical className="h-4 w-4" style={{ color: COLORS.textTertiary }} />

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={rule.name}
            onChange={(e) => onChange({ ...rule, name: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent text-sm font-medium outline-none w-full"
            style={{ color: COLORS.text }}
            placeholder="Rule name"
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange({ ...rule, enabled: !rule.enabled });
          }}
          className="p-1"
        >
          {rule.enabled ? (
            <ToggleRight className="h-5 w-5" style={{ color: COLORS.gold }} />
          ) : (
            <ToggleLeft className="h-5 w-5" style={{ color: COLORS.textTertiary }} />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-white/5 rounded"
        >
          <Trash2 className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="border-t overflow-hidden"
            style={{ borderColor: COLORS.border }}
          >
            <div className="p-4 space-y-4">
              {/* Description */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textTertiary }}>
                  Description
                </label>
                <input
                  type="text"
                  value={rule.description || ''}
                  onChange={(e) => onChange({ ...rule, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                  style={{ borderColor: COLORS.border, color: COLORS.text }}
                  placeholder="Optional description"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="text-xs mb-2 block" style={{ color: COLORS.textTertiary }}>
                  Trigger
                </label>
                <div className="flex gap-2 mb-2">
                  {TRIGGER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateTrigger({ type: type.value })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                      style={{
                        backgroundColor:
                          rule.trigger.type === type.value
                            ? `${COLORS.gold}20`
                            : 'rgba(255, 255, 255, 0.03)',
                        color: rule.trigger.type === type.value ? COLORS.gold : COLORS.textSecondary,
                        border: `1px solid ${
                          rule.trigger.type === type.value ? `${COLORS.gold}40` : COLORS.border
                        }`,
                      }}
                    >
                      <type.icon className="h-3.5 w-3.5" />
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Trigger config based on type */}
                {rule.trigger.type === 'tool_event' && (
                  <div className="flex gap-2">
                    <select
                      value={rule.trigger.sourceSlotId || ''}
                      onChange={(e) => updateTrigger({ sourceSlotId: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                      style={{ borderColor: COLORS.border, color: COLORS.text }}
                    >
                      <option value="">Select tool</option>
                      {slots.map((slot) => (
                        <option key={slot.slotId} value={slot.slotId}>
                          {slot.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={rule.trigger.eventType || ''}
                      onChange={(e) => updateTrigger({ eventType: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                      style={{ borderColor: COLORS.border, color: COLORS.text }}
                      placeholder="Event type (e.g., complete)"
                    />
                  </div>
                )}

                {rule.trigger.type === 'manual' && (
                  <input
                    type="text"
                    value={rule.trigger.buttonLabel || ''}
                    onChange={(e) => updateTrigger({ buttonLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                    style={{ borderColor: COLORS.border, color: COLORS.text }}
                    placeholder="Button label"
                  />
                )}

                {rule.trigger.type === 'time_relative' && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={rule.trigger.offsetMinutes || 0}
                      onChange={(e) => updateTrigger({ offsetMinutes: parseInt(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                      style={{ borderColor: COLORS.border, color: COLORS.text }}
                    />
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                      minutes from
                    </span>
                    <input
                      type="text"
                      value={rule.trigger.referenceField || ''}
                      onChange={(e) => updateTrigger({ referenceField: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                      style={{ borderColor: COLORS.border, color: COLORS.text }}
                      placeholder="Reference field (e.g., eventDate)"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs" style={{ color: COLORS.textTertiary }}>
                    Actions
                  </label>
                  <button
                    onClick={addAction}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/5"
                    style={{ color: COLORS.gold }}
                  >
                    <Plus className="h-3 w-3" />
                    Add Action
                  </button>
                </div>

                <div className="space-y-2">
                  {rule.actions.map((action, actionIndex) => (
                    <div
                      key={actionIndex}
                      className="flex items-start gap-2 p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                    >
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(actionIndex, { type: e.target.value })}
                        className="px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                        style={{ borderColor: COLORS.border, color: COLORS.text }}
                      >
                        {ACTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>

                      {/* Action-specific fields */}
                      {action.type === 'visibility' && (
                        <>
                          <select
                            value={action.targetSlotId || ''}
                            onChange={(e) => updateAction(actionIndex, { targetSlotId: e.target.value })}
                            className="flex-1 px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                            style={{ borderColor: COLORS.border, color: COLORS.text }}
                          >
                            <option value="">Select tool</option>
                            {slots.map((slot) => (
                              <option key={slot.slotId} value={slot.slotId}>
                                {slot.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateAction(actionIndex, { visible: !action.visible })}
                            className="p-1.5 rounded"
                            style={{
                              backgroundColor: action.visible ? `${COLORS.gold}20` : 'rgba(255, 255, 255, 0.03)',
                            }}
                          >
                            {action.visible ? (
                              <Eye className="h-4 w-4" style={{ color: COLORS.gold }} />
                            ) : (
                              <EyeOff className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
                            )}
                          </button>
                        </>
                      )}

                      {action.type === 'notification' && (
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={action.title || ''}
                            onChange={(e) => updateAction(actionIndex, { title: e.target.value })}
                            className="w-full px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                            style={{ borderColor: COLORS.border, color: COLORS.text }}
                            placeholder="Notification title"
                          />
                          <input
                            type="text"
                            value={action.body || ''}
                            onChange={(e) => updateAction(actionIndex, { body: e.target.value })}
                            className="w-full px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                            style={{ borderColor: COLORS.border, color: COLORS.text }}
                            placeholder="Notification body"
                          />
                        </div>
                      )}

                      <button
                        onClick={() => removeAction(actionIndex)}
                        className="p-1 hover:bg-white/5 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" style={{ color: COLORS.textTertiary }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.runOnce || false}
                    onChange={(e) => onChange({ ...rule, runOnce: e.target.checked })}
                    className="rounded"
                  />
                  <span style={{ color: COLORS.textSecondary }}>Run once only</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function EditSetupPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const setupId = params.setupId as string;

  const [rules, setRules] = React.useState<OrchestrationRule[]>([]);
  const [hasChanges, setHasChanges] = React.useState(false);

  const { data: setup, isLoading, error } = useQuery({
    queryKey: ['setup-template', setupId],
    queryFn: () => fetchSetupTemplate(setupId),
    enabled: !!setupId,
  });

  // Initialize rules from setup
  React.useEffect(() => {
    if (setup) {
      setRules(setup.orchestration);
    }
  }, [setup]);

  // Save mutation (placeholder - would need actual API)
  const saveMutation = useMutation({
    mutationFn: async (orchestration: OrchestrationRule[]) => {
      // TODO: Implement actual save endpoint
      const response = await fetch(`/api/setups/templates/${setupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orchestration }),
      });
      if (!response.ok) throw new Error('Failed to save');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Orchestration rules saved');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['setup-template', setupId] });
    },
    onError: () => {
      toast.error('Failed to save changes');
    },
  });

  const updateRule = (index: number, rule: OrchestrationRule) => {
    const newRules = [...rules];
    newRules[index] = rule;
    setRules(newRules);
    setHasChanges(true);
  };

  const deleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const addRule = () => {
    const newRule: OrchestrationRule = {
      id: `rule_${Date.now()}`,
      name: 'New Rule',
      trigger: { type: 'manual', buttonLabel: 'Trigger' },
      actions: [],
      enabled: true,
    };
    setRules([...rules, newRule]);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(rules);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <BrandSpinner size="md" variant="neutral" />
      </div>
    );
  }

  if (error || !setup) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <p className="text-lg mb-4" style={{ color: COLORS.text }}>
          Setup not found
        </p>
        <Link href="/lab/setups" className="text-sm" style={{ color: COLORS.gold }}>
          Back to Setups
        </Link>
      </div>
    );
  }

  if (setup.isSystem) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <p className="text-lg mb-2" style={{ color: COLORS.text }}>
          System templates cannot be edited
        </p>
        <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
          Create a copy to customize orchestration rules
        </p>
        <Link
          href={`/lab/setups/${setupId}`}
          className="text-sm"
          style={{ color: COLORS.gold }}
        >
          Back to Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/lab/setups/${setupId}`}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
            </Link>
            <div>
              <h1 className="text-xl font-medium" style={{ color: COLORS.text }}>
                Edit Orchestration
              </h1>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                {setup.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs" style={{ color: COLORS.gold }}>
                Unsaved changes
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="flex items-center gap-2"
            >
              {saveMutation.isPending ? (
                <BrandSpinner size="sm" variant="neutral" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Tool slots reference */}
        <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: COLORS.border }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: COLORS.textTertiary }}>
            Available Tool Slots
          </h3>
          <div className="flex flex-wrap gap-2">
            {setup.tools.map((slot) => (
              <span
                key={slot.slotId}
                className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textSecondary }}
              >
                {slot.name} ({slot.slotId})
              </span>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="space-y-3">
          <AnimatePresence>
            {rules.map((rule, index) => (
              <RuleEditor
                key={rule.id}
                rule={rule}
                slots={setup.tools}
                onChange={(updated) => updateRule(index, updated)}
                onDelete={() => deleteRule(index)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Add rule */}
        <button
          onClick={addRule}
          className="w-full mt-4 p-4 rounded-lg border-dashed flex items-center justify-center gap-2 transition-colors"
          style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.gold;
            e.currentTarget.style.color = COLORS.gold;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.border;
            e.currentTarget.style.color = COLORS.textSecondary;
          }}
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>
    </div>
  );
}
