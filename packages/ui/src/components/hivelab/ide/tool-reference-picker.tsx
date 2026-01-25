'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  LinkIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';
import type { DataTransform, ToolOutput } from '@hive/core';
import { DATA_TRANSFORMS } from '@hive/core';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolOption {
  deploymentId: string;
  name: string;
  outputs: ToolOutput[];
}

export interface ToolReferenceValue {
  deploymentId: string;
  toolName: string;
  path: string;
  outputName: string;
  transform?: DataTransform;
}

export interface ToolReferencePickerProps {
  /** Current value */
  value?: ToolReferenceValue;
  /** Available tools to pick from */
  tools: ToolOption[];
  /** Callback when value changes */
  onChange: (value: ToolReferenceValue | undefined) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether data is loading */
  loading?: boolean;
  /** Callback to refresh tool list */
  onRefresh?: () => void;
  /** Label for the field */
  label?: string;
  /** Description for the field */
  description?: string;
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
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]';

// ============================================================================
// OUTPUT TYPE BADGE
// ============================================================================

function OutputTypeBadge({ type }: { type: string }) {
  const getTypeStyle = (t: string) => {
    switch (t) {
      case 'memberList':
        return { bg: '#22c55e20', color: '#22c55e', label: 'Members' };
      case 'counter':
        return { bg: '#3b82f620', color: '#3b82f6', label: 'Count' };
      case 'collection':
        return { bg: '#a855f720', color: '#a855f7', label: 'Collection' };
      case 'array':
        return { bg: '#f9731620', color: '#f97316', label: 'Array' };
      case 'number':
        return { bg: '#06b6d420', color: '#06b6d4', label: 'Number' };
      case 'boolean':
        return { bg: '#ec489920', color: '#ec4899', label: 'Boolean' };
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
// STEP INDICATORS
// ============================================================================

type Step = 'tool' | 'output' | 'transform';

function StepIndicator({
  current,
  steps,
}: {
  current: Step;
  steps: { key: Step; label: string }[];
}) {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-1 text-label-xs">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center gap-1">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded',
              idx <= currentIndex
                ? 'bg-[var(--life-gold)] text-black font-medium'
                : 'bg-white/10'
            )}
            style={{
              color: idx <= currentIndex ? '#000' : COLORS.textTertiary,
            }}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <ChevronRightIcon className="w-3 h-3" style={{ color: COLORS.textTertiary }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ToolReferencePicker({
  value,
  tools,
  onChange,
  disabled,
  placeholder = 'Select tool data...',
  loading,
  onRefresh,
  label,
  description,
}: ToolReferencePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('tool');
  const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null);
  const [selectedOutput, setSelectedOutput] = useState<ToolOutput | null>(null);

  // Available transforms for selected output
  const availableTransforms = useMemo(() => {
    if (!selectedOutput) return [];
    return Object.entries(DATA_TRANSFORMS).filter(([_, meta]) => {
      if (meta.inputType === 'any') return true;
      if (meta.inputType === 'array' && ['array', 'memberList', 'timeline'].includes(selectedOutput.type)) return true;
      if (meta.inputType === 'object' && ['object', 'collection'].includes(selectedOutput.type)) return true;
      if (meta.inputType === 'number' && ['number', 'counter'].includes(selectedOutput.type)) return true;
      return meta.inputType === selectedOutput.type;
    });
  }, [selectedOutput]);

  // Reset state when opening
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setStep('tool');
    setSelectedTool(null);
    setSelectedOutput(null);
  };

  // Handle tool selection
  const handleSelectTool = (tool: ToolOption) => {
    setSelectedTool(tool);
    setStep('output');
  };

  // Handle output selection
  const handleSelectOutput = (output: ToolOutput) => {
    setSelectedOutput(output);
    setStep('transform');
  };

  // Handle transform selection (or skip)
  const handleSelectTransform = (transform?: DataTransform) => {
    if (!selectedTool || !selectedOutput) return;

    onChange({
      deploymentId: selectedTool.deploymentId,
      toolName: selectedTool.name,
      path: selectedOutput.path,
      outputName: selectedOutput.name,
      transform,
    });

    setIsOpen(false);
  };

  // Clear value
  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <div className="space-y-1.5">
      {/* Label */}
      {label && (
        <label className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>
          {label}
        </label>
      )}

      {/* Main trigger button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
            'transition-colors duration-150',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            focusRing
          )}
          style={{
            backgroundColor: value ? COLORS.bgActive : COLORS.bgHover,
            border: `1px solid ${value ? COLORS.accent : COLORS.border}`,
            color: value ? COLORS.textPrimary : COLORS.textTertiary,
          }}
        >
          {/* Link icon */}
          <LinkIcon
            className="w-4 h-4 shrink-0"
            style={{ color: value ? COLORS.accent : COLORS.textTertiary }}
          />

          {/* Value display or placeholder */}
          <div className="flex-1 min-w-0">
            {value ? (
              <div className="flex items-center gap-2">
                <span className="text-sm truncate">
                  {value.toolName}
                  <span style={{ color: COLORS.textTertiary }}> · </span>
                  {value.outputName}
                </span>
                {value.transform && (
                  <span
                    className="text-label-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: `${COLORS.accent}20`,
                      color: COLORS.accent,
                    }}
                  >
                    {value.transform}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm">{placeholder}</span>
            )}
          </div>

          {/* Clear/dropdown indicator */}
          {value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className={cn('p-0.5 rounded hover:bg-white/10', focusRing)}
              style={{ color: COLORS.textTertiary }}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : (
            <ChevronDownIcon className="w-4 h-4 shrink-0" />
          )}
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown content */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 left-0 right-0 mt-1 rounded-lg shadow-xl overflow-hidden"
                style={{
                  backgroundColor: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  maxHeight: 300,
                }}
              >
                {/* Header with steps */}
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <StepIndicator
                    current={step}
                    steps={[
                      { key: 'tool', label: 'Tool' },
                      { key: 'output', label: 'Output' },
                      { key: 'transform', label: 'Transform' },
                    ]}
                  />
                  {onRefresh && step === 'tool' && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      className={cn('p-1 rounded', focusRing)}
                      style={{ color: COLORS.textTertiary }}
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[240px]">
                  {loading ? (
                    <div className="p-4 space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse h-10 rounded bg-white/10" />
                      ))}
                    </div>
                  ) : step === 'tool' ? (
                    // Step 1: Select tool
                    <div className="p-2 space-y-1">
                      {tools.length === 0 ? (
                        <div className="py-6 text-center text-xs" style={{ color: COLORS.textTertiary }}>
                          No tools available
                        </div>
                      ) : (
                        tools.map((tool) => (
                          <button
                            key={tool.deploymentId}
                            type="button"
                            onClick={() => handleSelectTool(tool)}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
                              'transition-colors duration-150 hover:bg-white/5',
                              focusRing
                            )}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${COLORS.accent}15`,
                                color: COLORS.accent,
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                                {tool.name}
                              </div>
                              <div className="text-label-xs" style={{ color: COLORS.textTertiary }}>
                                {tool.outputs.length} output{tool.outputs.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <ChevronRightIcon className="w-4 h-4" style={{ color: COLORS.textTertiary }} />
                          </button>
                        ))
                      )}
                    </div>
                  ) : step === 'output' && selectedTool ? (
                    // Step 2: Select output
                    <div className="p-2 space-y-1">
                      {/* Back button */}
                      <button
                        type="button"
                        onClick={() => setStep('tool')}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 rounded text-left text-xs',
                          'transition-colors duration-150 hover:bg-white/5',
                          focusRing
                        )}
                        style={{ color: COLORS.textTertiary }}
                      >
                        ← Back to tools
                      </button>

                      {/* Tool name header */}
                      <div className="px-3 py-1.5 text-xs font-medium" style={{ color: COLORS.textSecondary }}>
                        {selectedTool.name}
                      </div>

                      {/* Outputs list */}
                      {selectedTool.outputs.map((output) => (
                        <button
                          key={output.path}
                          type="button"
                          onClick={() => handleSelectOutput(output)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
                            'transition-colors duration-150 hover:bg-white/5',
                            focusRing
                          )}
                        >
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                            style={{ backgroundColor: COLORS.bgActive }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.accent }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                              {output.name}
                            </div>
                            {output.description && (
                              <div className="text-label-xs truncate" style={{ color: COLORS.textTertiary }}>
                                {output.description}
                              </div>
                            )}
                          </div>
                          <OutputTypeBadge type={output.type} />
                        </button>
                      ))}
                    </div>
                  ) : step === 'transform' && selectedOutput ? (
                    // Step 3: Select transform (optional)
                    <div className="p-2 space-y-1">
                      {/* Back button */}
                      <button
                        type="button"
                        onClick={() => setStep('output')}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 rounded text-left text-xs',
                          'transition-colors duration-150 hover:bg-white/5',
                          focusRing
                        )}
                        style={{ color: COLORS.textTertiary }}
                      >
                        ← Back to outputs
                      </button>

                      {/* Selected output header */}
                      <div className="px-3 py-1.5 text-xs font-medium flex items-center gap-2" style={{ color: COLORS.textSecondary }}>
                        {selectedOutput.name}
                        <OutputTypeBadge type={selectedOutput.type} />
                      </div>

                      {/* No transform option */}
                      <button
                        type="button"
                        onClick={() => handleSelectTransform(undefined)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
                          'transition-colors duration-150 hover:bg-white/5',
                          focusRing
                        )}
                      >
                        <CheckIcon className="w-4 h-4" style={{ color: COLORS.accent }} />
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                            No transform
                          </div>
                          <div className="text-label-xs" style={{ color: COLORS.textTertiary }}>
                            Use the data as-is
                          </div>
                        </div>
                      </button>

                      {/* Transform options */}
                      {availableTransforms.length > 0 && (
                        <>
                          <div className="px-3 py-1 text-label-xs uppercase tracking-wide" style={{ color: COLORS.textTertiary }}>
                            Transform
                          </div>
                          {availableTransforms.map(([key, meta]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleSelectTransform(key as DataTransform)}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left',
                                'transition-colors duration-150 hover:bg-white/5',
                                focusRing
                              )}
                            >
                              <div
                                className="w-4 h-4 rounded flex items-center justify-center text-label-xs font-bold"
                                style={{
                                  backgroundColor: `${COLORS.accent}20`,
                                  color: COLORS.accent,
                                }}
                              >
                                fn
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                                  {meta.label}
                                </div>
                                <div className="text-label-xs" style={{ color: COLORS.textTertiary }}>
                                  {meta.description}
                                </div>
                              </div>
                              <span
                                className="text-label-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: COLORS.bgActive, color: COLORS.textTertiary }}
                              >
                                → {meta.outputType}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Description */}
      {description && (
        <p className="text-label-xs" style={{ color: COLORS.textTertiary }}>
          {description}
        </p>
      )}
    </div>
  );
}

export default ToolReferencePicker;
