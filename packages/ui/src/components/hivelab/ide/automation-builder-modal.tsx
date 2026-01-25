'use client';

/**
 * AutomationBuilderModal - Modal for creating/editing automations
 *
 * Sprint 4: Automations
 *
 * Full modal UI for building automations with:
 * - Trigger selection (event, schedule, threshold)
 * - Condition builder (optional)
 * - Action configuration
 * - Limits configuration
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  BoltIcon,
  ClockIcon,
  ChartBarIcon,
  EnvelopeIcon,
  BellIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';

// HiveLab Dark Panel Colors
const PANEL_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #1A1A1A)',
  bgActive: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  accentLight: 'rgba(212, 175, 55, 0.1)',
  error: '#f44336',
  errorLight: 'rgba(244, 67, 54, 0.1)',
  success: '#22c55e',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

// ============================================================================
// Types
// ============================================================================

export interface AutomationTrigger {
  type: 'event' | 'schedule' | 'threshold';
  // Event trigger
  elementId?: string;
  event?: string;
  // Schedule trigger
  cron?: string;
  timezone?: string;
  // Threshold trigger
  path?: string;
  operator?: '>' | '<' | '==' | '>=' | '<=';
  value?: number;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value?: unknown;
}

export interface AutomationAction {
  type: 'notify' | 'mutate' | 'triggerTool';
  // Notify action
  channel?: 'email' | 'push';
  to?: string;
  templateId?: string;
  subject?: string;
  body?: string;
  title?: string;
  // Mutate action
  elementId?: string;
  mutation?: Record<string, unknown>;
  // Trigger tool action
  deploymentId?: string;
  event?: string;
  data?: Record<string, unknown>;
}

export interface AutomationData {
  id?: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  limits: {
    maxRunsPerDay: number;
    cooldownSeconds: number;
  };
}

interface AutomationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (automation: AutomationData) => Promise<void>;
  initialData?: Partial<AutomationData>;
  elements?: Array<{ id: string; elementId: string; name?: string }>;
  mode?: 'create' | 'edit';
}

// ============================================================================
// Common schedule presets
// ============================================================================

const SCHEDULE_PRESETS = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every day at 9 AM', cron: '0 9 * * *' },
  { label: 'Every Monday at 9 AM', cron: '0 9 * * 1' },
  { label: 'First of month', cron: '0 9 1 * *' },
];

const THRESHOLD_OPERATORS = [
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '==', label: 'equals' },
  { value: '>=', label: 'at least' },
  { value: '<=', label: 'at most' },
];

// ============================================================================
// Step Components
// ============================================================================

function TriggerSelector({
  trigger,
  onChange,
  elements,
}: {
  trigger: AutomationTrigger;
  onChange: (trigger: AutomationTrigger) => void;
  elements?: Array<{ id: string; elementId: string; name?: string }>;
}) {
  const [showCronHelp, setShowCronHelp] = useState(false);

  return (
    <div className="space-y-4">
      {/* Trigger Type Selection */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { type: 'event' as const, icon: BoltIcon, label: 'On Event', desc: 'When something happens' },
          { type: 'schedule' as const, icon: ClockIcon, label: 'On Schedule', desc: 'At specific times' },
          { type: 'threshold' as const, icon: ChartBarIcon, label: 'On Threshold', desc: 'When value crosses' },
        ].map(({ type, icon: Icon, label, desc }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ ...trigger, type })}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg transition-all duration-200',
              focusRing
            )}
            style={{
              backgroundColor: trigger.type === type ? PANEL_COLORS.accentLight : PANEL_COLORS.bgActive,
              border: `1px solid ${trigger.type === type ? PANEL_COLORS.accent : PANEL_COLORS.border}`,
            }}
          >
            <Icon
              className="h-5 w-5 mb-1.5"
              style={{ color: trigger.type === type ? PANEL_COLORS.accent : PANEL_COLORS.textSecondary }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: trigger.type === type ? PANEL_COLORS.textPrimary : PANEL_COLORS.textSecondary }}
            >
              {label}
            </span>
            <span className="text-label-xs" style={{ color: PANEL_COLORS.textTertiary }}>
              {desc}
            </span>
          </button>
        ))}
      </div>

      {/* Trigger Configuration */}
      <div className="space-y-3">
        {trigger.type === 'event' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                Element
              </label>
              <select
                value={trigger.elementId || ''}
                onChange={(e) => onChange({ ...trigger, elementId: e.target.value })}
                className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgActive,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              >
                <option value="">Select element...</option>
                {elements?.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.name || el.elementId}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                Event
              </label>
              <select
                value={trigger.event || ''}
                onChange={(e) => onChange({ ...trigger, event: e.target.value })}
                className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgActive,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              >
                <option value="">Select event...</option>
                <option value="click">Click</option>
                <option value="submit">Form Submit</option>
                <option value="change">Value Change</option>
                <option value="increment">Counter Increment</option>
                <option value="decrement">Counter Decrement</option>
              </select>
            </div>
          </>
        )}

        {trigger.type === 'schedule' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                Schedule Preset
              </label>
              <select
                value={trigger.cron || ''}
                onChange={(e) => onChange({ ...trigger, cron: e.target.value })}
                className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgActive,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              >
                <option value="">Select schedule...</option>
                {SCHEDULE_PRESETS.map((preset) => (
                  <option key={preset.cron} value={preset.cron}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Custom cron...</option>
              </select>
            </div>
            {trigger.cron === 'custom' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={trigger.cron === 'custom' ? '' : trigger.cron}
                  onChange={(e) => onChange({ ...trigger, cron: e.target.value })}
                  placeholder="* * * * *"
                  className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                  style={{
                    backgroundColor: PANEL_COLORS.bgActive,
                    border: `1px solid ${PANEL_COLORS.border}`,
                    color: PANEL_COLORS.textPrimary,
                  }}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                Timezone
              </label>
              <select
                value={trigger.timezone || 'America/New_York'}
                onChange={(e) => onChange({ ...trigger, timezone: e.target.value })}
                className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgActive,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </>
        )}

        {trigger.type === 'threshold' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                Value Path
              </label>
              <input
                type="text"
                value={trigger.path || ''}
                onChange={(e) => onChange({ ...trigger, path: e.target.value })}
                placeholder="counters.paid or collections.members"
                className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                style={{
                  backgroundColor: PANEL_COLORS.bgActive,
                  border: `1px solid ${PANEL_COLORS.border}`,
                  color: PANEL_COLORS.textPrimary,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  Operator
                </label>
                <select
                  value={trigger.operator || '>'}
                  onChange={(e) => onChange({ ...trigger, operator: e.target.value as '>' | '<' | '==' | '>=' | '<=' })}
                  className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                  style={{
                    backgroundColor: PANEL_COLORS.bgActive,
                    border: `1px solid ${PANEL_COLORS.border}`,
                    color: PANEL_COLORS.textPrimary,
                  }}
                >
                  {THRESHOLD_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  Threshold Value
                </label>
                <input
                  type="number"
                  value={trigger.value ?? ''}
                  onChange={(e) => onChange({ ...trigger, value: Number(e.target.value) })}
                  placeholder="100"
                  className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                  style={{
                    backgroundColor: PANEL_COLORS.bgActive,
                    border: `1px solid ${PANEL_COLORS.border}`,
                    color: PANEL_COLORS.textPrimary,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ActionsBuilder({
  actions,
  onChange,
  elements,
}: {
  actions: AutomationAction[];
  onChange: (actions: AutomationAction[]) => void;
  elements?: Array<{ id: string; elementId: string; name?: string }>;
}) {
  const addAction = (type: AutomationAction['type']) => {
    const newAction: AutomationAction = { type };
    if (type === 'notify') {
      newAction.channel = 'email';
    }
    onChange([...actions, newAction]);
  };

  const updateAction = (index: number, updates: Partial<AutomationAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Existing Actions */}
      {actions.map((action, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="p-3 rounded-lg space-y-3"
          style={{
            backgroundColor: PANEL_COLORS.bgActive,
            border: `1px solid ${PANEL_COLORS.border}`,
          }}
        >
          {/* Action Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {action.type === 'notify' && (
                <EnvelopeIcon className="h-4 w-4" style={{ color: PANEL_COLORS.accent }} />
              )}
              {action.type === 'mutate' && (
                <ArrowPathIcon className="h-4 w-4" style={{ color: PANEL_COLORS.accent }} />
              )}
              {action.type === 'triggerTool' && (
                <BoltIcon className="h-4 w-4" style={{ color: PANEL_COLORS.accent }} />
              )}
              <span className="text-xs font-medium" style={{ color: PANEL_COLORS.textPrimary }}>
                {action.type === 'notify' && 'Send Notification'}
                {action.type === 'mutate' && 'Update Element'}
                {action.type === 'triggerTool' && 'Trigger Tool'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeAction(index)}
              className={cn('p-1 rounded transition-colors', focusRing)}
              style={{ color: PANEL_COLORS.textTertiary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = PANEL_COLORS.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = PANEL_COLORS.textTertiary;
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Notify Action Config */}
          {action.type === 'notify' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  Channel
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateAction(index, { channel: 'email' })}
                    className={cn('flex-1 py-2 rounded-md text-xs font-medium transition-colors', focusRing)}
                    style={{
                      backgroundColor: action.channel === 'email' ? PANEL_COLORS.accentLight : PANEL_COLORS.bgHover,
                      color: action.channel === 'email' ? PANEL_COLORS.accent : PANEL_COLORS.textSecondary,
                      border: `1px solid ${action.channel === 'email' ? PANEL_COLORS.accent : PANEL_COLORS.border}`,
                    }}
                  >
                    <EnvelopeIcon className="h-4 w-4 mx-auto mb-1" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAction(index, { channel: 'push' })}
                    className={cn('flex-1 py-2 rounded-md text-xs font-medium transition-colors', focusRing)}
                    style={{
                      backgroundColor: action.channel === 'push' ? PANEL_COLORS.accentLight : PANEL_COLORS.bgHover,
                      color: action.channel === 'push' ? PANEL_COLORS.accent : PANEL_COLORS.textSecondary,
                      border: `1px solid ${action.channel === 'push' ? PANEL_COLORS.accent : PANEL_COLORS.border}`,
                    }}
                  >
                    <BellIcon className="h-4 w-4 mx-auto mb-1" />
                    Push
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  To
                </label>
                <input
                  type="text"
                  value={action.to || ''}
                  onChange={(e) => updateAction(index, { to: e.target.value })}
                  placeholder="user, role:officer, or email@example.com"
                  className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                  style={{
                    backgroundColor: PANEL_COLORS.bgHover,
                    border: `1px solid ${PANEL_COLORS.border}`,
                    color: PANEL_COLORS.textPrimary,
                  }}
                />
              </div>
              {action.channel === 'email' && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={action.subject || ''}
                      onChange={(e) => updateAction(index, { subject: e.target.value })}
                      placeholder="Email subject..."
                      className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                      style={{
                        backgroundColor: PANEL_COLORS.bgHover,
                        border: `1px solid ${PANEL_COLORS.border}`,
                        color: PANEL_COLORS.textPrimary,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                      Body
                    </label>
                    <textarea
                      value={action.body || ''}
                      onChange={(e) => updateAction(index, { body: e.target.value })}
                      placeholder="Email body... Use {{variable}} for dynamic content"
                      rows={3}
                      className={cn('w-full px-3 py-2 rounded-lg text-sm resize-none', focusRing)}
                      style={{
                        backgroundColor: PANEL_COLORS.bgHover,
                        border: `1px solid ${PANEL_COLORS.border}`,
                        color: PANEL_COLORS.textPrimary,
                      }}
                    />
                  </div>
                </>
              )}
              {action.channel === 'push' && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={action.title || ''}
                      onChange={(e) => updateAction(index, { title: e.target.value })}
                      placeholder="Notification title..."
                      className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                      style={{
                        backgroundColor: PANEL_COLORS.bgHover,
                        border: `1px solid ${PANEL_COLORS.border}`,
                        color: PANEL_COLORS.textPrimary,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                      Body
                    </label>
                    <input
                      type="text"
                      value={action.body || ''}
                      onChange={(e) => updateAction(index, { body: e.target.value })}
                      placeholder="Notification body..."
                      className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                      style={{
                        backgroundColor: PANEL_COLORS.bgHover,
                        border: `1px solid ${PANEL_COLORS.border}`,
                        color: PANEL_COLORS.textPrimary,
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mutate Action Config */}
          {action.type === 'mutate' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  Element
                </label>
                <select
                  value={action.elementId || ''}
                  onChange={(e) => updateAction(index, { elementId: e.target.value })}
                  className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                  style={{
                    backgroundColor: PANEL_COLORS.bgHover,
                    border: `1px solid ${PANEL_COLORS.border}`,
                    color: PANEL_COLORS.textPrimary,
                  }}
                >
                  <option value="">Select element...</option>
                  {elements?.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.name || el.elementId}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  Mutation (JSON)
                </label>
                <textarea
                  value={action.mutation ? JSON.stringify(action.mutation, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const mutation = JSON.parse(e.target.value);
                      updateAction(index, { mutation });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"config.value": 0}'
                  rows={3}
                  className={cn('w-full px-3 py-2 rounded-lg text-sm font-mono resize-none', focusRing)}
                  style={{
                    backgroundColor: PANEL_COLORS.bgHover,
                    border: `1px solid ${PANEL_COLORS.border}`,
                    color: PANEL_COLORS.textPrimary,
                  }}
                />
              </div>
            </div>
          )}

          {/* Trigger Tool Action Config */}
          {action.type === 'triggerTool' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  Tool Deployment ID
                </label>
                <input
                  type="text"
                  value={action.deploymentId || ''}
                  onChange={(e) => updateAction(index, { deploymentId: e.target.value })}
                  placeholder="deployment_xxxxx"
                  className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                  style={{
                    backgroundColor: PANEL_COLORS.bgHover,
                    border: `1px solid ${PANEL_COLORS.border}`,
                    color: PANEL_COLORS.textPrimary,
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                  Event Name
                </label>
                <input
                  type="text"
                  value={action.event || ''}
                  onChange={(e) => updateAction(index, { event: e.target.value })}
                  placeholder="trigger, update, etc."
                  className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                  style={{
                    backgroundColor: PANEL_COLORS.bgHover,
                    border: `1px solid ${PANEL_COLORS.border}`,
                    color: PANEL_COLORS.textPrimary,
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {/* Add Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => addAction('notify')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-colors',
            focusRing
          )}
          style={{
            backgroundColor: 'transparent',
            border: `1px dashed ${PANEL_COLORS.border}`,
            color: PANEL_COLORS.textSecondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = PANEL_COLORS.accent;
            e.currentTarget.style.color = PANEL_COLORS.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = PANEL_COLORS.border;
            e.currentTarget.style.color = PANEL_COLORS.textSecondary;
          }}
        >
          <EnvelopeIcon className="h-4 w-4" />
          Notification
        </button>
        <button
          type="button"
          onClick={() => addAction('mutate')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-colors',
            focusRing
          )}
          style={{
            backgroundColor: 'transparent',
            border: `1px dashed ${PANEL_COLORS.border}`,
            color: PANEL_COLORS.textSecondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = PANEL_COLORS.accent;
            e.currentTarget.style.color = PANEL_COLORS.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = PANEL_COLORS.border;
            e.currentTarget.style.color = PANEL_COLORS.textSecondary;
          }}
        >
          <ArrowPathIcon className="h-4 w-4" />
          Mutate
        </button>
        <button
          type="button"
          onClick={() => addAction('triggerTool')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-colors',
            focusRing
          )}
          style={{
            backgroundColor: 'transparent',
            border: `1px dashed ${PANEL_COLORS.border}`,
            color: PANEL_COLORS.textSecondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = PANEL_COLORS.accent;
            e.currentTarget.style.color = PANEL_COLORS.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = PANEL_COLORS.border;
            e.currentTarget.style.color = PANEL_COLORS.textSecondary;
          }}
        >
          <BoltIcon className="h-4 w-4" />
          Trigger Tool
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AutomationBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  elements,
  mode = 'create',
}: AutomationBuilderModalProps) {
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AutomationData>({
    name: '',
    enabled: true,
    trigger: { type: 'event' },
    conditions: [],
    actions: [],
    limits: { maxRunsPerDay: 100, cooldownSeconds: 60 },
    ...initialData,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setData({
        name: '',
        enabled: true,
        trigger: { type: 'event' },
        conditions: [],
        actions: [],
        limits: { maxRunsPerDay: 100, cooldownSeconds: 60 },
        ...initialData,
      });
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!data.name.trim()) return;
    if (data.actions.length === 0) return;

    setSaving(true);
    try {
      await onSave(data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isValid = data.name.trim() !== '' && data.actions.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              style={{
                backgroundColor: PANEL_COLORS.bg,
                border: `1px solid ${PANEL_COLORS.border}`,
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
              >
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: PANEL_COLORS.textPrimary }}>
                    {mode === 'create' ? 'New Automation' : 'Edit Automation'}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: PANEL_COLORS.textTertiary }}>
                    Automate actions based on triggers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn('p-2 rounded-lg transition-colors', focusRing)}
                  style={{ color: PANEL_COLORS.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    placeholder="Dues reminder, Welcome email..."
                    className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                    style={{
                      backgroundColor: PANEL_COLORS.bgActive,
                      border: `1px solid ${PANEL_COLORS.border}`,
                      color: PANEL_COLORS.textPrimary,
                    }}
                    autoFocus
                  />
                </div>

                {/* Trigger */}
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: PANEL_COLORS.textTertiary }}
                  >
                    When (Trigger)
                  </h3>
                  <TriggerSelector
                    trigger={data.trigger}
                    onChange={(trigger) => setData({ ...data, trigger })}
                    elements={elements}
                  />
                </div>

                {/* Actions */}
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: PANEL_COLORS.textTertiary }}
                  >
                    Then (Actions)
                  </h3>
                  <ActionsBuilder
                    actions={data.actions}
                    onChange={(actions) => setData({ ...data, actions })}
                    elements={elements}
                  />
                </div>

                {/* Limits */}
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: PANEL_COLORS.textTertiary }}
                  >
                    Limits
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                        Max runs/day
                      </label>
                      <input
                        type="number"
                        value={data.limits.maxRunsPerDay}
                        onChange={(e) =>
                          setData({
                            ...data,
                            limits: { ...data.limits, maxRunsPerDay: Number(e.target.value) },
                          })
                        }
                        className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                        style={{
                          backgroundColor: PANEL_COLORS.bgActive,
                          border: `1px solid ${PANEL_COLORS.border}`,
                          color: PANEL_COLORS.textPrimary,
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: PANEL_COLORS.textSecondary }}>
                        Cooldown (sec)
                      </label>
                      <input
                        type="number"
                        value={data.limits.cooldownSeconds}
                        onChange={(e) =>
                          setData({
                            ...data,
                            limits: { ...data.limits, cooldownSeconds: Number(e.target.value) },
                          })
                        }
                        className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                        style={{
                          backgroundColor: PANEL_COLORS.bgActive,
                          border: `1px solid ${PANEL_COLORS.border}`,
                          color: PANEL_COLORS.textPrimary,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-3 px-5 py-4"
                style={{ borderTop: `1px solid ${PANEL_COLORS.border}` }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', focusRing)}
                  style={{ color: PANEL_COLORS.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isValid || saving}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    (!isValid || saving) && 'opacity-50 cursor-not-allowed',
                    focusRing
                  )}
                  style={{
                    backgroundColor: PANEL_COLORS.accent,
                    color: 'black',
                  }}
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AutomationBuilderModal;
