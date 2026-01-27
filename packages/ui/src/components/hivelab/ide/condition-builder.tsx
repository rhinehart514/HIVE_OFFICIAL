'use client';

/**
 * ConditionBuilder - Visual condition builder for element visibility
 *
 * Allows tool creators to define when an element should be visible:
 * - Single conditions (e.g., "role equals admin")
 * - Grouped conditions with AND/OR logic
 * - Preview of condition evaluation
 *
 * @version 1.0.0 - HiveLab Sprint 2 (Jan 2026)
 */

import { useState, useCallback } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  FolderIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion, Reorder } from 'framer-motion';
import { springPresets } from '@hive/tokens';
import { cn } from '../../../lib/utils';
import type {
  VisibilityCondition,
  ConditionGroup,
  ConditionOperator,
  ContextFieldPath,
} from '@hive/core';

// HiveLab Dark Panel Colors (consistent with properties-panel.tsx)
const PANEL_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #1A1A1A)',
  bgActive: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  borderEmphasis: 'var(--hivelab-border-emphasis, rgba(255, 255, 255, 0.12))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  accentLight: 'rgba(212, 175, 55, 0.1)',
  error: 'var(--hivelab-status-error)',
  errorLight: 'var(--hivelab-status-error-muted)',
  success: 'var(--hivelab-status-success)',
  successLight: 'var(--hivelab-status-success-muted)',
  warning: 'var(--hivelab-status-warning)',
  warningLight: 'var(--hivelab-status-warning-muted)',
  info: 'var(--hivelab-status-info)',
  infoLight: 'var(--hivelab-status-info-muted)',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

// ============================================================================
// Field & Operator Definitions
// ============================================================================

interface FieldOption {
  path: ContextFieldPath;
  label: string;
  type: 'string' | 'number' | 'boolean';
  category: string;
}

const FIELD_OPTIONS: FieldOption[] = [
  // Member fields
  { path: 'member.role', label: 'Member Role', type: 'string', category: 'Member' },
  { path: 'member.tenure.daysInSpace', label: 'Days in Space', type: 'number', category: 'Member' },
  { path: 'member.tenure.isNewMember', label: 'Is New Member', type: 'boolean', category: 'Member' },
  { path: 'member.permissions.canPost', label: 'Can Post', type: 'boolean', category: 'Member' },
  { path: 'member.permissions.canDeployTools', label: 'Can Deploy Tools', type: 'boolean', category: 'Member' },
  { path: 'member.permissions.canModerate', label: 'Can Moderate', type: 'boolean', category: 'Member' },
  { path: 'member.permissions.canAccessAdmin', label: 'Can Access Admin', type: 'boolean', category: 'Member' },

  // Space fields
  { path: 'space.category', label: 'Space Category', type: 'string', category: 'Space' },
  { path: 'space.memberCount', label: 'Member Count', type: 'number', category: 'Space' },
  { path: 'space.isVerified', label: 'Is Verified', type: 'boolean', category: 'Space' },

  // Temporal fields
  { path: 'temporal.dayOfWeek', label: 'Day of Week', type: 'number', category: 'Temporal' },
  { path: 'temporal.hourOfDay', label: 'Hour of Day', type: 'number', category: 'Temporal' },
  { path: 'temporal.isWeekend', label: 'Is Weekend', type: 'boolean', category: 'Temporal' },
  { path: 'temporal.isEvening', label: 'Is Evening', type: 'boolean', category: 'Temporal' },
  { path: 'temporal.isMorning', label: 'Is Morning', type: 'boolean', category: 'Temporal' },

  // Capability fields
  { path: 'capabilities.campusEvents', label: 'Has Campus Events', type: 'boolean', category: 'Capabilities' },
  { path: 'capabilities.spaceMembers', label: 'Has Space Members', type: 'boolean', category: 'Capabilities' },
  { path: 'capabilities.analytics', label: 'Has Analytics', type: 'boolean', category: 'Capabilities' },
];

interface OperatorOption {
  value: ConditionOperator;
  label: string;
  types: ('string' | 'number' | 'boolean')[];
}

const OPERATOR_OPTIONS: OperatorOption[] = [
  { value: 'equals', label: 'equals', types: ['string', 'number', 'boolean'] },
  { value: 'notEquals', label: 'does not equal', types: ['string', 'number', 'boolean'] },
  { value: 'greaterThan', label: 'is greater than', types: ['number'] },
  { value: 'lessThan', label: 'is less than', types: ['number'] },
  { value: 'greaterThanOrEquals', label: 'is at least', types: ['number'] },
  { value: 'lessThanOrEquals', label: 'is at most', types: ['number'] },
  { value: 'contains', label: 'contains', types: ['string'] },
  { value: 'notContains', label: 'does not contain', types: ['string'] },
  { value: 'in', label: 'is one of', types: ['string', 'number'] },
  { value: 'notIn', label: 'is not one of', types: ['string', 'number'] },
  { value: 'exists', label: 'exists', types: ['string', 'number', 'boolean'] },
  { value: 'notExists', label: 'does not exist', types: ['string', 'number', 'boolean'] },
];

// Preset values for role selection
const ROLE_VALUES = ['owner', 'admin', 'moderator', 'member', 'guest'];
const CATEGORY_VALUES = ['academic', 'social', 'professional', 'interest', 'housing', 'sports', 'arts', 'service'];

// ============================================================================
// Component Props
// ============================================================================

interface ConditionBuilderProps {
  /** Current conditions (single array or group) */
  conditions: VisibilityCondition[] | ConditionGroup | undefined;
  /** Callback when conditions change */
  onChange: (conditions: VisibilityCondition[] | ConditionGroup | undefined) => void;
  /** Optional context values for preview */
  previewContext?: Record<string, unknown>;
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// Single Condition Row
// ============================================================================

function ConditionRow({
  condition,
  index,
  onUpdate,
  onDelete,
  previewResult,
}: {
  condition: VisibilityCondition;
  index: number;
  onUpdate: (updated: VisibilityCondition) => void;
  onDelete: () => void;
  previewResult?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  const selectedField = FIELD_OPTIONS.find((f) => f.path === condition.field);
  const fieldType = selectedField?.type || 'string';

  // Get operators valid for this field type
  const validOperators = OPERATOR_OPTIONS.filter((op) =>
    op.types.includes(fieldType)
  );

  // Determine if we need preset values
  const needsPresets = condition.field === 'member.role' || condition.field === 'space.category';
  const presetValues = condition.field === 'member.role' ? ROLE_VALUES :
                       condition.field === 'space.category' ? CATEGORY_VALUES : [];

  return (
    <Reorder.Item
      value={condition}
      id={`condition-${index}`}
      className="relative"
      dragListener={false}
    >
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
        transition={springPresets.snappy}
        className="flex items-center gap-2 p-3 rounded-lg"
        style={{
          backgroundColor: PANEL_COLORS.bgHover,
          border: `1px solid ${previewResult === false ? PANEL_COLORS.error : previewResult === true ? PANEL_COLORS.success : PANEL_COLORS.border}`,
        }}
      >
        {/* Field Selector */}
        <select
          value={condition.field}
          onChange={(e) => onUpdate({ ...condition, field: e.target.value })}
          className={cn(
            'flex-1 min-w-0 rounded px-2 py-1.5 text-xs outline-none transition-colors duration-150',
            focusRing
          )}
          style={{
            backgroundColor: PANEL_COLORS.bgActive,
            border: `1px solid ${PANEL_COLORS.border}`,
            color: PANEL_COLORS.textPrimary,
          }}
          aria-label="Select field"
        >
          <option value="">Select field...</option>
          {Object.entries(
            FIELD_OPTIONS.reduce((acc, field) => {
              if (!acc[field.category]) acc[field.category] = [];
              acc[field.category].push(field);
              return acc;
            }, {} as Record<string, FieldOption[]>)
          ).map(([category, fields]) => (
            <optgroup key={category} label={category}>
              {fields.map((field) => (
                <option key={field.path} value={field.path}>
                  {field.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Operator Selector */}
        <select
          value={condition.operator}
          onChange={(e) =>
            onUpdate({ ...condition, operator: e.target.value as ConditionOperator })
          }
          className={cn(
            'w-28 rounded px-2 py-1.5 text-xs outline-none transition-colors duration-150',
            focusRing
          )}
          style={{
            backgroundColor: PANEL_COLORS.bgActive,
            border: `1px solid ${PANEL_COLORS.border}`,
            color: PANEL_COLORS.textPrimary,
          }}
          aria-label="Select operator"
        >
          {validOperators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        {/* Value Input */}
        {!['exists', 'notExists'].includes(condition.operator) && (
          needsPresets ? (
            <select
              value={condition.value as string}
              onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
              className={cn(
                'w-24 rounded px-2 py-1.5 text-xs outline-none transition-colors duration-150',
                focusRing
              )}
              style={{
                backgroundColor: PANEL_COLORS.bgActive,
                border: `1px solid ${PANEL_COLORS.border}`,
                color: PANEL_COLORS.textPrimary,
              }}
              aria-label="Select value"
            >
              <option value="">Select...</option>
              {presetValues.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          ) : fieldType === 'boolean' ? (
            <select
              value={String(condition.value)}
              onChange={(e) => onUpdate({ ...condition, value: e.target.value === 'true' })}
              className={cn(
                'w-20 rounded px-2 py-1.5 text-xs outline-none transition-colors duration-150',
                focusRing
              )}
              style={{
                backgroundColor: PANEL_COLORS.bgActive,
                border: `1px solid ${PANEL_COLORS.border}`,
                color: PANEL_COLORS.textPrimary,
              }}
              aria-label="Select boolean value"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              type={fieldType === 'number' ? 'number' : 'text'}
              value={condition.value as string | number}
              onChange={(e) =>
                onUpdate({
                  ...condition,
                  value: fieldType === 'number' ? Number(e.target.value) : e.target.value,
                })
              }
              placeholder="Value..."
              className={cn(
                'w-24 rounded px-2 py-1.5 text-xs outline-none transition-colors duration-150',
                focusRing
              )}
              style={{
                backgroundColor: PANEL_COLORS.bgActive,
                border: `1px solid ${PANEL_COLORS.border}`,
                color: PANEL_COLORS.textPrimary,
              }}
              aria-label="Enter value"
            />
          )
        )}

        {/* Preview Indicator */}
        {previewResult !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0'
            )}
            style={{
              backgroundColor: previewResult
                ? PANEL_COLORS.successLight
                : PANEL_COLORS.errorLight,
            }}
          >
            {previewResult ? (
              <span style={{ color: PANEL_COLORS.success }}>✓</span>
            ) : (
              <span style={{ color: PANEL_COLORS.error }}>✕</span>
            )}
          </motion.div>
        )}

        {/* Delete Button */}
        <motion.button
          type="button"
          onClick={onDelete}
          whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
          className={cn(
            'p-1.5 rounded transition-colors duration-150 flex-shrink-0',
            focusRing
          )}
          style={{ color: PANEL_COLORS.textTertiary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = PANEL_COLORS.error;
            e.currentTarget.style.backgroundColor = PANEL_COLORS.errorLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = PANEL_COLORS.textTertiary;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Delete condition"
        >
          <TrashIcon className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </Reorder.Item>
  );
}

// ============================================================================
// Logic Toggle (AND/OR)
// ============================================================================

function LogicToggle({
  logic,
  onChange,
}: {
  logic: 'and' | 'or';
  onChange: (logic: 'and' | 'or') => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex items-center justify-center py-2">
      <div
        className="inline-flex rounded-lg p-0.5"
        style={{ backgroundColor: PANEL_COLORS.bgActive }}
      >
        <motion.button
          type="button"
          onClick={() => onChange('and')}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150',
            focusRing
          )}
          style={{
            backgroundColor: logic === 'and' ? PANEL_COLORS.accent : 'transparent',
            color: logic === 'and' ? 'black' : PANEL_COLORS.textSecondary,
          }}
          aria-pressed={logic === 'and'}
        >
          AND
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onChange('or')}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150',
            focusRing
          )}
          style={{
            backgroundColor: logic === 'or' ? PANEL_COLORS.accent : 'transparent',
            color: logic === 'or' ? 'black' : PANEL_COLORS.textSecondary,
          }}
          aria-pressed={logic === 'or'}
        >
          OR
        </motion.button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConditionBuilder({
  conditions,
  onChange,
  previewContext,
  compact = false,
}: ConditionBuilderProps) {
  const prefersReducedMotion = useReducedMotion();

  // Normalize conditions to array format for editing
  const [internalConditions, setInternalConditions] = useState<VisibilityCondition[]>(() => {
    if (!conditions) return [];
    if (Array.isArray(conditions)) return conditions;
    // Extract conditions from group, flattening nested groups
    return conditions.conditions.filter(
      (c): c is VisibilityCondition => !('logic' in c)
    );
  });

  const [logic, setLogic] = useState<'and' | 'or'>(() => {
    if (conditions && 'logic' in conditions) {
      return conditions.logic;
    }
    return 'and';
  });

  // Sync changes back to parent
  const handleChange = useCallback(
    (newConditions: VisibilityCondition[], newLogic: 'and' | 'or') => {
      setInternalConditions(newConditions);
      setLogic(newLogic);

      if (newConditions.length === 0) {
        onChange(undefined);
      } else if (newConditions.length === 1) {
        // Single condition, no need for group
        onChange(newConditions);
      } else {
        // Multiple conditions, wrap in group
        onChange({
          logic: newLogic,
          conditions: newConditions,
        });
      }
    },
    [onChange]
  );

  // Add new condition
  const handleAddCondition = useCallback(() => {
    const newCondition: VisibilityCondition = {
      field: 'member.role',
      operator: 'equals',
      value: 'member',
    };
    handleChange([...internalConditions, newCondition], logic);
  }, [internalConditions, logic, handleChange]);

  // Update a condition
  const handleUpdateCondition = useCallback(
    (index: number, updated: VisibilityCondition) => {
      const newConditions = [...internalConditions];
      newConditions[index] = updated;
      handleChange(newConditions, logic);
    },
    [internalConditions, logic, handleChange]
  );

  // Delete a condition
  const handleDeleteCondition = useCallback(
    (index: number) => {
      const newConditions = internalConditions.filter((_, i) => i !== index);
      handleChange(newConditions, logic);
    },
    [internalConditions, logic, handleChange]
  );

  // Update logic
  const handleLogicChange = useCallback(
    (newLogic: 'and' | 'or') => {
      handleChange(internalConditions, newLogic);
    },
    [internalConditions, handleChange]
  );

  // Calculate preview results
  const previewResults = previewContext
    ? internalConditions.map((condition) => {
        try {
          const value = getNestedValue(previewContext, condition.field);
          return evaluateCondition(condition, value);
        } catch {
          return undefined;
        }
      })
    : [];

  const overallResult =
    previewContext && internalConditions.length > 0
      ? logic === 'and'
        ? previewResults.every((r) => r === true)
        : previewResults.some((r) => r === true)
      : undefined;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPresets.gentle}
      className="flex flex-col"
    >
      {/* Header */}
      {!compact && (
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
        >
          <div className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon
              className="h-4 w-4"
              style={{ color: PANEL_COLORS.textSecondary }}
            />
            <div>
              <h4
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: PANEL_COLORS.textTertiary }}
              >
                Visibility Conditions
              </h4>
              <p
                className="text-label-xs mt-0.5"
                style={{ color: PANEL_COLORS.textTertiary }}
              >
                Define when this element should be visible
              </p>
            </div>
          </div>

          {/* Overall Preview Result */}
          {overallResult !== undefined && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium'
              )}
              style={{
                backgroundColor: overallResult
                  ? PANEL_COLORS.successLight
                  : PANEL_COLORS.errorLight,
                color: overallResult ? PANEL_COLORS.success : PANEL_COLORS.error,
              }}
            >
              {overallResult ? 'Visible' : 'Hidden'}
            </motion.div>
          )}
        </div>
      )}

      {/* Conditions List */}
      <div className="px-4 py-3">
        <AnimatePresence mode="popLayout">
          {internalConditions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <FolderIcon
                className="h-8 w-8 mx-auto mb-2"
                style={{ color: PANEL_COLORS.textTertiary }}
              />
              <p className="text-xs" style={{ color: PANEL_COLORS.textTertiary }}>
                No conditions defined.
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: PANEL_COLORS.textTertiary }}
              >
                Element is always visible.
              </p>
            </motion.div>
          ) : (
            <Reorder.Group
              axis="y"
              values={internalConditions}
              onReorder={(newOrder) => handleChange(newOrder, logic)}
              className="space-y-2"
            >
              {internalConditions.map((condition, index) => (
                <div key={`${condition.field}-${index}`}>
                  <ConditionRow
                    condition={condition}
                    index={index}
                    onUpdate={(updated) => handleUpdateCondition(index, updated)}
                    onDelete={() => handleDeleteCondition(index)}
                    previewResult={previewResults[index]}
                  />
                  {/* Logic toggle between conditions */}
                  {index < internalConditions.length - 1 && (
                    <LogicToggle logic={logic} onChange={handleLogicChange} />
                  )}
                </div>
              ))}
            </Reorder.Group>
          )}
        </AnimatePresence>

        {/* Add Condition Button */}
        <motion.button
          type="button"
          onClick={handleAddCondition}
          whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          className={cn(
            'w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150',
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
          <PlusIcon className="h-4 w-4" />
          Add Condition
        </motion.button>
      </div>

      {/* Warning for complex conditions */}
      {internalConditions.length > 3 && !compact && (
        <div
          className="px-4 py-3 flex items-start gap-2"
          style={{
            borderTop: `1px solid ${PANEL_COLORS.border}`,
            backgroundColor: PANEL_COLORS.warningLight,
          }}
        >
          <ExclamationTriangleIcon
            className="h-4 w-4 flex-shrink-0 mt-0.5"
            style={{ color: PANEL_COLORS.warning }}
          />
          <p className="text-xs" style={{ color: PANEL_COLORS.warning }}>
            Complex conditions can be hard to debug. Consider simplifying or using
            nested groups for clarity.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluateCondition(
  condition: VisibilityCondition,
  value: unknown
): boolean {
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'notEquals':
      return value !== condition.value;
    case 'greaterThan':
      return typeof value === 'number' && value > (condition.value as number);
    case 'lessThan':
      return typeof value === 'number' && value < (condition.value as number);
    case 'greaterThanOrEquals':
      return typeof value === 'number' && value >= (condition.value as number);
    case 'lessThanOrEquals':
      return typeof value === 'number' && value <= (condition.value as number);
    case 'contains':
      return (
        typeof value === 'string' && value.includes(condition.value as string)
      );
    case 'notContains':
      return (
        typeof value === 'string' && !value.includes(condition.value as string)
      );
    case 'in':
      return (
        Array.isArray(condition.value) && condition.value.includes(value)
      );
    case 'notIn':
      return (
        Array.isArray(condition.value) && !condition.value.includes(value)
      );
    case 'exists':
      return value !== undefined && value !== null;
    case 'notExists':
      return value === undefined || value === null;
    default:
      return false;
  }
}

export default ConditionBuilder;
