'use client';

/**
 * Form Builder Element - Refactored with Core Abstractions
 *
 * Premium form with:
 * - Field animations
 * - Progress indicator
 * - Validation with error shake
 * - Success celebration
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { DocumentTextIcon, CheckIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Input } from '../../../../design-system/primitives';
import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface FormField {
  name: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date';
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface FormBuilderConfig {
  title?: string;
  fields?: FormField[];
  submitLabel?: string;
  allowMultipleSubmissions?: boolean;
}

interface FormBuilderElementProps extends ElementProps {
  config: FormBuilderConfig;
  mode?: ElementMode;
}

// ============================================================
// Main Form Builder Element
// ============================================================

export function FormBuilderElement({
  id,
  config,
  data,
  onChange,
  onAction,
  sharedState,
  userState,
  mode = 'runtime',
}: FormBuilderElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'form';
  const fields = config.fields || [
    { name: 'Title', type: 'text', required: true },
    { name: 'Description', type: 'textarea', required: false },
    { name: 'Location', type: 'text', required: false },
    { name: 'Date', type: 'date', required: true },
  ];

  // Read submission count from shared state (server-side) or data (legacy)
  const sharedSubmissionCount = sharedState?.counters?.[`${instanceId}:submissionCount`] || 0;
  const legacySubmissions = (data?.submissions as Array<Record<string, unknown>>) || [];
  const legacySubmissionCount = (data?.submissionCount as number) || legacySubmissions.length;
  const serverSubmissionCount = sharedSubmissionCount || legacySubmissionCount;

  // Check if user has already submitted (from userState)
  const hasUserSubmitted = userState?.participation?.[`${instanceId}:hasSubmitted`] === true;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(hasUserSubmitted);
  const [submissionCount, setSubmissionCount] = useState(serverSubmissionCount);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Sync with server state
  useEffect(() => {
    setSubmissionCount(serverSubmissionCount);
  }, [serverSubmissionCount]);

  useEffect(() => {
    if (hasUserSubmitted && !config.allowMultipleSubmissions) {
      setSubmitted(true);
    }
  }, [hasUserSubmitted, config.allowMultipleSubmissions]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: false }));
    }
    onChange?.({ formData: { ...formData, [fieldName]: value } });
  };

  const handleSubmit = async () => {
    const typedFields = fields as FormField[];
    const missingRequired = typedFields
      .filter((f) => f.required && !formData[f.name])
      .map((f) => f.name);

    if (missingRequired.length > 0) {
      // Show errors for missing fields
      const newErrors: Record<string, boolean> = {};
      missingRequired.forEach(name => { newErrors[name] = true; });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // Simulate submission delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    setSubmitted(true);
    setJustSubmitted(true);
    setSubmissionCount(prev => prev + 1);
    onAction?.('submit', { formData, timestamp: new Date().toISOString(), elementId: instanceId });
    setIsSubmitting(false);

    setTimeout(() => setJustSubmitted(false), 1500);
  };

  const handleReset = () => {
    setFormData({});
    setSubmitted(false);
    setErrors({});
  };

  // Success state with celebration
  if (submitted && !config.allowMultipleSubmissions) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.bouncy}
      >
        <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5 shadow-lg shadow-green-500/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Celebration particles */}
            {justSubmitted && !prefersReducedMotion && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: 0,
                      scale: 1,
                      x: (Math.random() - 0.5) * 100,
                      y: (Math.random() - 0.5) * 80 - 20,
                    }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className="absolute text-lg"
                    style={{ left: '50%', top: '40%' }}
                  >
                    {['✨', '🎉', '✓', '⭐', '💫', '🎊', '✅', '🌟'][i]}
                  </motion.span>
                ))}
              </>
            )}

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springPresets.bouncy, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <CheckIcon className="h-8 w-8 text-green-500" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-semibold text-foreground"
            >
              Response submitted!
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mt-2"
            >
              {submissionCount} total submission{submissionCount !== 1 ? 's' : ''}
            </motion.p>

            {config.allowMultipleSubmissions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button variant="outline" size="sm" className="mt-4" onClick={handleReset}>
                  Submit another response
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const filledCount = Object.values(formData).filter(v => v && v.trim()).length;
  const totalFields = fields.length;
  const progress = (filledCount / totalFields) * 100;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Header with progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={focusedField && !prefersReducedMotion ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <DocumentTextIcon className={`h-4 w-4 transition-colors duration-200 ${
                focusedField ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </motion.div>
            <span className="text-sm font-medium">{config.title || 'Form'}</span>
          </div>

          {/* Progress indicator */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={springPresets.default}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {filledCount}/{totalFields}
            </span>
          </motion.div>
        </div>

        {/* Form fields with staggered animation */}
        <div className="space-y-4">
          {(fields as FormField[]).map((field, index: number) => {
            const hasError = errors[field.name];
            const isFocused = focusedField === field.name;
            const hasValue = formData[field.name] && formData[field.name].trim();

            return (
              <motion.div
                key={field.name}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-1.5"
              >
                <label className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  isFocused ? 'text-primary' : hasError ? 'text-red-500' : ''
                }`}>
                  {field.label || field.name}
                  {field.required && (
                    <span className={`text-xs ${hasError ? 'text-red-500' : 'text-muted-foreground'}`}>*</span>
                  )}
                  {hasValue && !hasError && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </label>

                <motion.div
                  animate={hasError && !prefersReducedMotion ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}...`}
                      className={`w-full h-24 p-3 text-sm bg-background border rounded-lg resize-none transition-all duration-200 focus:outline-none ${
                        hasError
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : isFocused
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-muted-foreground/50'
                      }`}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={formData[field.name] || ''}
                      onValueChange={(value) => handleFieldChange(field.name, value)}
                    >
                      <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                        <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((opt, optIndex) => (
                          <SelectItem key={optIndex} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(field.name, e.target.value)}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}...`}
                      className={`transition-all duration-200 ${
                        hasError
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : ''
                      }`}
                    />
                  )}
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                  {hasError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-500"
                    >
                      This field is required
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Submit button with loading state */}
        <motion.div
          whileHover={{ opacity: 0.9 }}
          whileTap={{ opacity: 0.8 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                  />
                  Submitting...
                </motion.span>
              ) : (
                <motion.span
                  key="submit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {config.submitLabel || 'Submit Response'}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Submission count */}
        {submissionCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground text-center"
          >
            {submissionCount} response{submissionCount !== 1 ? 's' : ''} collected
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}

export default FormBuilderElement;
