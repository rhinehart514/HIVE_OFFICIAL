'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';
import type {
  DataTransform,
  ConnectionDataType,
  ToolOutput,
  DATA_TRANSFORMS,
} from '@hive/core';
import type { CanvasElement } from './types';
import type { OtherToolData } from './other-tools-panel';

// ============================================================================
// TYPES
// ============================================================================

export interface ConnectionBuilderModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Close the modal */
  onClose: () => void;
  /** Create the connection */
  onCreate: (connection: ConnectionCreateData) => void;
  /** Available source tools (other tools in space) */
  sourceTools: OtherToolData[];
  /** Target elements (current tool's elements) */
  targetElements: CanvasElement[];
  /** Pre-selected source (from OtherToolsPanel click) */
  preSelectedSource?: {
    deploymentId: string;
    path: string;
    type: string;
  };
  /** Current tool's deployment ID */
  currentDeploymentId: string;
  /** Whether creation is in progress */
  creating?: boolean;
  /** Error message if creation failed */
  error?: string;
}

export interface ConnectionCreateData {
  source: {
    deploymentId: string;
    path: string;
  };
  target: {
    deploymentId: string;
    elementId: string;
    inputPath: string;
  };
  transform?: DataTransform;
  label?: string;
}

// ============================================================================
// STYLING
// ============================================================================

const COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #2a2a2a)',
  bgActive: 'var(--hivelab-surface, #333333)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #ffffff)',
  textSecondary: 'var(--hivelab-text-secondary, rgba(255,255,255,0.7))',
  textTertiary: 'var(--hivelab-text-tertiary, rgba(255,255,255,0.5))',
  accent: 'var(--life-gold, #D4AF37)',
  success: 'var(--hivelab-status-success)',
  error: 'var(--hivelab-status-error)',
  warning: 'var(--hivelab-status-warning)',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

// ============================================================================
// TYPE BADGE
// ============================================================================

function TypeBadge({ type }: { type: string }) {
  const getTypeStyle = (t: string) => {
    switch (t) {
      case 'memberList':
        return { bg: '#22c55e20', color: '#22c55e', label: 'Members' };
      case 'counter':
        return { bg: '#3b82f620', color: '#3b82f6', label: 'Counter' };
      case 'collection':
        return { bg: '#a855f720', color: '#a855f7', label: 'Collection' };
      case 'array':
        return { bg: '#f9731620', color: '#f97316', label: 'Array' };
      case 'number':
        return { bg: '#06b6d420', color: '#06b6d4', label: 'Number' };
      case 'boolean':
        return { bg: '#ec489920', color: '#ec4899', label: 'Boolean' };
      case 'string':
        return { bg: '#8b5cf620', color: '#8b5cf6', label: 'String' };
      case 'timeline':
        return { bg: '#14b8a620', color: '#14b8a6', label: 'Timeline' };
      case 'any':
        return { bg: COLORS.bgActive, color: COLORS.textSecondary, label: 'Any' };
      default:
        return { bg: COLORS.bgActive, color: COLORS.textTertiary, label: type };
    }
  };

  const style = getTypeStyle(type);

  return (
    <span
      className="text-label-xs px-1.5 py-0.5 rounded font-medium"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

// ============================================================================
// TRANSFORMS
// ============================================================================

const AVAILABLE_TRANSFORMS: { value: DataTransform; label: string; description: string }[] = [
  { value: 'toArray', label: 'To Array', description: 'Convert to array format' },
  { value: 'toCount', label: 'To Count', description: 'Get the count of items' },
  { value: 'toBoolean', label: 'To Boolean', description: 'Convert to true/false' },
  { value: 'toSorted', label: 'Sorted', description: 'Sort alphabetically' },
  { value: 'toTop5', label: 'Top 5', description: 'Take first 5 items' },
  { value: 'toKeys', label: 'Keys Only', description: 'Extract object keys' },
  { value: 'toValues', label: 'Values Only', description: 'Extract object values' },
  { value: 'flatten', label: 'Flatten', description: 'Flatten nested arrays' },
  { value: 'unique', label: 'Unique', description: 'Remove duplicates' },
];

// Get common element inputs based on element type
function getElementInputs(element: CanvasElement): { path: string; type: string; label: string }[] {
  const elementType = element.elementId.replace(/-\d+$/, '');

  // Common inputs by element type
  const inputsByType: Record<string, { path: string; type: string; label: string }[]> = {
    'result-list': [
      { path: 'items', type: 'array', label: 'Items' },
      { path: 'filter', type: 'string', label: 'Filter' },
    ],
    'poll': [
      { path: 'options', type: 'array', label: 'Options' },
      { path: 'eligibleMembers', type: 'memberList', label: 'Eligible Members' },
    ],
    'poll-element': [
      { path: 'options', type: 'array', label: 'Options' },
      { path: 'eligibleMembers', type: 'memberList', label: 'Eligible Members' },
    ],
    'counter': [
      { path: 'value', type: 'number', label: 'Value' },
      { path: 'threshold', type: 'number', label: 'Threshold' },
    ],
    'search-input': [
      { path: 'initialValue', type: 'string', label: 'Initial Value' },
    ],
    'form-builder': [
      { path: 'prefill', type: 'object', label: 'Prefill Data' },
    ],
    'leaderboard': [
      { path: 'entries', type: 'array', label: 'Entries' },
    ],
    'connection-list': [
      { path: 'items', type: 'array', label: 'Items' },
    ],
    'tag-cloud': [
      { path: 'tags', type: 'array', label: 'Tags' },
    ],
    'chart-display': [
      { path: 'data', type: 'array', label: 'Data' },
    ],
    'role-gate': [
      { path: 'members', type: 'memberList', label: 'Members' },
    ],
  };

  // Return type-specific inputs or generic fallback
  return inputsByType[elementType] || [
    { path: 'data', type: 'any', label: 'Data' },
    { path: 'input', type: 'any', label: 'Input' },
  ];
}

// ============================================================================
// TYPE COMPATIBILITY
// ============================================================================

function checkTypeCompatibility(sourceType: string, targetType: string): {
  compatible: boolean;
  needsTransform: boolean;
  suggestedTransform?: DataTransform;
  message?: string;
} {
  // Any type accepts anything
  if (targetType === 'any') {
    return { compatible: true, needsTransform: false };
  }

  // Exact match
  if (sourceType === targetType) {
    return { compatible: true, needsTransform: false };
  }

  // Type coercions
  const coercions: Record<string, { compatible: string[]; transform: DataTransform }[]> = {
    'collection': [
      { compatible: ['array'], transform: 'toArray' },
      { compatible: ['number'], transform: 'toCount' },
    ],
    'memberList': [
      { compatible: ['array'], transform: 'toArray' },
      { compatible: ['number'], transform: 'toCount' },
    ],
    'array': [
      { compatible: ['number'], transform: 'toCount' },
      { compatible: ['boolean'], transform: 'toBoolean' },
    ],
    'counter': [
      { compatible: ['number'], transform: undefined as unknown as DataTransform },
    ],
    'object': [
      { compatible: ['array'], transform: 'toValues' },
      { compatible: ['number'], transform: 'toCount' },
    ],
  };

  const sourceCoercions = coercions[sourceType];
  if (sourceCoercions) {
    for (const coercion of sourceCoercions) {
      if (coercion.compatible.includes(targetType)) {
        return {
          compatible: true,
          needsTransform: !!coercion.transform,
          suggestedTransform: coercion.transform,
          message: coercion.transform ? `Use "${coercion.transform}" transform` : undefined,
        };
      }
    }
  }

  return {
    compatible: false,
    needsTransform: true,
    message: `Type "${sourceType}" is not compatible with "${targetType}"`,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConnectionBuilderModal({
  isOpen,
  onClose,
  onCreate,
  sourceTools,
  targetElements,
  preSelectedSource,
  currentDeploymentId,
  creating,
  error,
}: ConnectionBuilderModalProps) {
  // Form state
  const [sourceToolId, setSourceToolId] = useState<string>('');
  const [sourcePath, setSourcePath] = useState<string>('');
  const [sourceType, setSourceType] = useState<string>('any');
  const [targetElementId, setTargetElementId] = useState<string>('');
  const [targetInputPath, setTargetInputPath] = useState<string>('');
  const [targetInputType, setTargetInputType] = useState<string>('any');
  const [transform, setTransform] = useState<DataTransform | undefined>();
  const [label, setLabel] = useState<string>('');

  // Apply pre-selected source
  useEffect(() => {
    if (preSelectedSource && isOpen) {
      setSourceToolId(preSelectedSource.deploymentId);
      setSourcePath(preSelectedSource.path);
      setSourceType(preSelectedSource.type);
    }
  }, [preSelectedSource, isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      // Don't reset immediately - wait for animation
      const timer = setTimeout(() => {
        setSourceToolId('');
        setSourcePath('');
        setSourceType('any');
        setTargetElementId('');
        setTargetInputPath('');
        setTargetInputType('any');
        setTransform(undefined);
        setLabel('');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Get selected source tool
  const selectedSourceTool = useMemo(
    () => sourceTools.find((t) => t.deploymentId === sourceToolId),
    [sourceTools, sourceToolId]
  );

  // Get selected target element
  const selectedTargetElement = useMemo(
    () => targetElements.find((e) => e.instanceId === targetElementId),
    [targetElements, targetElementId]
  );

  // Get available inputs for selected target element
  const targetInputs = useMemo(() => {
    if (!selectedTargetElement) return [];
    return getElementInputs(selectedTargetElement);
  }, [selectedTargetElement]);

  // Check type compatibility
  const compatibility = useMemo(() => {
    if (!sourceType || !targetInputType) return null;
    return checkTypeCompatibility(sourceType, targetInputType);
  }, [sourceType, targetInputType]);

  // Auto-suggest transform
  useEffect(() => {
    if (compatibility?.needsTransform && compatibility.suggestedTransform && !transform) {
      setTransform(compatibility.suggestedTransform);
    }
  }, [compatibility, transform]);

  // Validation
  const isValid = useMemo(() => {
    return (
      sourceToolId &&
      sourcePath &&
      targetElementId &&
      targetInputPath &&
      (compatibility?.compatible || transform)
    );
  }, [sourceToolId, sourcePath, targetElementId, targetInputPath, compatibility, transform]);

  // Handle create
  const handleCreate = useCallback(() => {
    if (!isValid) return;

    onCreate({
      source: {
        deploymentId: sourceToolId,
        path: sourcePath,
      },
      target: {
        deploymentId: currentDeploymentId,
        elementId: targetElementId,
        inputPath: targetInputPath,
      },
      transform,
      label: label || undefined,
    });
  }, [isValid, sourceToolId, sourcePath, currentDeploymentId, targetElementId, targetInputPath, transform, label, onCreate]);

  // Handle target element selection
  const handleTargetElementSelect = (instanceId: string) => {
    setTargetElementId(instanceId);
    setTargetInputPath('');
    setTargetInputType('any');
  };

  // Handle target input selection
  const handleTargetInputSelect = (input: { path: string; type: string }) => {
    setTargetInputPath(input.path);
    setTargetInputType(input.type);
  };

  // Handle source output selection
  const handleSourceOutputSelect = (output: ToolOutput) => {
    setSourcePath(output.path);
    setSourceType(output.type);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
              style={{
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: COLORS.border }}
              >
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
                    Create Connection
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: COLORS.textTertiary }}>
                    Connect data from another tool to an element
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn('p-2 rounded-lg transition-colors', focusRing)}
                  style={{ color: COLORS.textTertiary }}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Connection Flow Visualization */}
                <div className="flex items-center gap-4">
                  {/* Source */}
                  <div
                    className="flex-1 p-4 rounded-xl"
                    style={{ backgroundColor: COLORS.bgActive, border: `1px solid ${COLORS.border}` }}
                  >
                    <div className="text-label-xs uppercase tracking-wide mb-2" style={{ color: COLORS.textTertiary }}>
                      Source
                    </div>
                    {selectedSourceTool && sourcePath ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                          {selectedSourceTool.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs" style={{ color: COLORS.textSecondary }}>
                            {sourcePath.split('.').pop()}
                          </code>
                          <TypeBadge type={sourceType} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm" style={{ color: COLORS.textTertiary }}>
                        Select source...
                      </div>
                    )}
                  </div>

                  {/* Arrow with Transform */}
                  <div className="flex flex-col items-center gap-1">
                    {transform && (
                      <span
                        className="text-label-xs px-2 py-0.5 rounded font-medium"
                        style={{ backgroundColor: `${COLORS.accent}20`, color: COLORS.accent }}
                      >
                        {transform}
                      </span>
                    )}
                    <ArrowRightIcon className="w-6 h-6" style={{ color: COLORS.accent }} />
                  </div>

                  {/* Target */}
                  <div
                    className="flex-1 p-4 rounded-xl"
                    style={{ backgroundColor: COLORS.bgActive, border: `1px solid ${COLORS.border}` }}
                  >
                    <div className="text-label-xs uppercase tracking-wide mb-2" style={{ color: COLORS.textTertiary }}>
                      Target
                    </div>
                    {selectedTargetElement && targetInputPath ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                          {selectedTargetElement.elementId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs" style={{ color: COLORS.textSecondary }}>
                            {targetInputPath}
                          </code>
                          <TypeBadge type={targetInputType} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm" style={{ color: COLORS.textTertiary }}>
                        Select target...
                      </div>
                    )}
                  </div>
                </div>

                {/* Type Compatibility Feedback */}
                {compatibility && sourceType !== 'any' && targetInputType !== 'any' && (
                  <div
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{
                      backgroundColor: compatibility.compatible
                        ? `${COLORS.success}10`
                        : `${COLORS.warning}10`,
                    }}
                  >
                    {compatibility.compatible ? (
                      <CheckCircleIcon className="w-5 h-5 shrink-0" style={{ color: COLORS.success }} />
                    ) : (
                      <ExclamationTriangleIcon className="w-5 h-5 shrink-0" style={{ color: COLORS.warning }} />
                    )}
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: compatibility.compatible ? COLORS.success : COLORS.warning }}
                      >
                        {compatibility.compatible ? 'Types are compatible' : 'Type mismatch'}
                      </p>
                      {compatibility.message && (
                        <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>
                          {compatibility.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Source Selection (if not pre-selected) */}
                {!preSelectedSource && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                      Source Tool & Output
                    </label>
                    <select
                      value={sourceToolId}
                      onChange={(e) => {
                        setSourceToolId(e.target.value);
                        setSourcePath('');
                        setSourceType('any');
                      }}
                      className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                      style={{
                        backgroundColor: COLORS.bgActive,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.textPrimary,
                      }}
                    >
                      <option value="">Select a tool...</option>
                      {sourceTools.map((tool) => (
                        <option key={tool.deploymentId} value={tool.deploymentId}>
                          {tool.name}
                        </option>
                      ))}
                    </select>

                    {selectedSourceTool && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {selectedSourceTool.outputs.map((output) => (
                          <button
                            key={output.path}
                            type="button"
                            onClick={() => handleSourceOutputSelect(output)}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                              focusRing,
                              sourcePath === output.path && 'ring-2 ring-[var(--life-gold)]'
                            )}
                            style={{
                              backgroundColor: sourcePath === output.path ? `${COLORS.accent}15` : COLORS.bgHover,
                              border: `1px solid ${sourcePath === output.path ? COLORS.accent : COLORS.border}`,
                            }}
                          >
                            <span className="text-sm" style={{ color: COLORS.textPrimary }}>
                              {output.name}
                            </span>
                            <TypeBadge type={output.type} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Target Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                    Target Element
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {targetElements.map((element) => (
                      <button
                        key={element.instanceId}
                        type="button"
                        onClick={() => handleTargetElementSelect(element.instanceId)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-left transition-colors',
                          focusRing,
                          targetElementId === element.instanceId && 'ring-2 ring-[var(--life-gold)]'
                        )}
                        style={{
                          backgroundColor: targetElementId === element.instanceId ? `${COLORS.accent}15` : COLORS.bgHover,
                          border: `1px solid ${targetElementId === element.instanceId ? COLORS.accent : COLORS.border}`,
                        }}
                      >
                        <span className="text-sm truncate block" style={{ color: COLORS.textPrimary }}>
                          {element.elementId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Input Selection */}
                {selectedTargetElement && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                      Target Input
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {targetInputs.map((input) => (
                        <button
                          key={input.path}
                          type="button"
                          onClick={() => handleTargetInputSelect(input)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                            focusRing,
                            targetInputPath === input.path && 'ring-2 ring-[var(--life-gold)]'
                          )}
                          style={{
                            backgroundColor: targetInputPath === input.path ? `${COLORS.accent}15` : COLORS.bgHover,
                            border: `1px solid ${targetInputPath === input.path ? COLORS.accent : COLORS.border}`,
                          }}
                        >
                          <span className="text-sm" style={{ color: COLORS.textPrimary }}>
                            {input.label}
                          </span>
                          <TypeBadge type={input.type} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transform Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                    Transform (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTransform(undefined)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        focusRing,
                        !transform && 'ring-2 ring-[var(--life-gold)]'
                      )}
                      style={{
                        backgroundColor: !transform ? `${COLORS.accent}15` : COLORS.bgHover,
                        border: `1px solid ${!transform ? COLORS.accent : COLORS.border}`,
                        color: COLORS.textPrimary,
                      }}
                    >
                      None
                    </button>
                    {AVAILABLE_TRANSFORMS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTransform(t.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm transition-colors',
                          focusRing,
                          transform === t.value && 'ring-2 ring-[var(--life-gold)]'
                        )}
                        style={{
                          backgroundColor: transform === t.value ? `${COLORS.accent}15` : COLORS.bgHover,
                          border: `1px solid ${transform === t.value ? COLORS.accent : COLORS.border}`,
                          color: COLORS.textPrimary,
                        }}
                        title={t.description}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                    Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="E.g., 'Member eligibility sync'"
                    className={cn('w-full px-3 py-2 rounded-lg text-sm', focusRing)}
                    style={{
                      backgroundColor: COLORS.bgActive,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.textPrimary,
                    }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: `${COLORS.error}10` }}
                  >
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0" style={{ color: COLORS.error }} />
                    <p className="text-sm" style={{ color: COLORS.error }}>
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-3 px-6 py-4 border-t"
                style={{ borderColor: COLORS.border }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', focusRing)}
                  style={{ color: COLORS.textSecondary }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!isValid || creating}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    focusRing,
                    (!isValid || creating) && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{
                    backgroundColor: COLORS.accent,
                    color: '#000',
                  }}
                >
                  {creating ? 'Creating...' : 'Create Connection'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ConnectionBuilderModal;
