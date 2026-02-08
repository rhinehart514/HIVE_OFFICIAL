'use client';

/**
 * QuickDeployModal — Lightweight modal for one-tap template deployment.
 *
 * For quickDeploy templates: user taps template, fills 2-3 fields, hits Deploy.
 * No canvas, no builder, no complexity. Skips straight from template to live tool.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { Text } from '../../primitives';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '../../primitives/Modal';
import type { QuickTemplate, TemplateConfigField } from '../../../lib/hivelab/quick-templates';

export interface QuickDeployResult {
  templateId: string;
  templateName: string;
  config: Record<string, string>;
}

export interface QuickDeployModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QuickTemplate | null;
  onDeploy: (result: QuickDeployResult) => Promise<void>;
  className?: string;
}

type DeployState = 'configure' | 'deploying' | 'success';

export function QuickDeployModal({
  open,
  onOpenChange,
  template,
  onDeploy,
  className,
}: QuickDeployModalProps) {
  const [state, setState] = React.useState<DeployState>('configure');
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  // Get the fields to show — prefer quickDeployFields, fall back to setupFields
  const fields: TemplateConfigField[] = React.useMemo(() => {
    if (!template) return [];
    return template.quickDeployFields || template.setupFields || [];
  }, [template]);

  // Reset state when modal opens/closes or template changes
  React.useEffect(() => {
    if (open && template) {
      setState('configure');
      setError(null);
      // Initialize with defaults
      const defaults: Record<string, string> = {};
      for (const field of fields) {
        if (field.defaultValue != null) {
          defaults[field.key] = String(field.defaultValue);
        }
      }
      setFormData(defaults);
    }
  }, [open, template, fields]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleDeploy = async () => {
    if (!template) return;

    // Validate required fields
    for (const field of fields) {
      if (field.required && !formData[field.key]?.trim()) {
        setError(`Please fill in: ${field.label}`);
        return;
      }
    }

    setState('deploying');
    setError(null);

    try {
      await onDeploy({
        templateId: template.id,
        templateName: template.name,
        config: formData,
      });
      setState('success');
      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy');
      setState('configure');
    }
  };

  if (!template) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={cn('max-w-md', className)}>
        <AnimatePresence mode="wait">
          {/* Configure Step */}
          {state === 'configure' && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--hivelab-connection, #D4AF37)',
                      color: '#000',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                  </div>
                  <div>
                    <ModalTitle>Deploy {template.name}</ModalTitle>
                    <ModalDescription>
                      {fields.length > 0
                        ? 'Customize and deploy in seconds'
                        : 'Ready to deploy — no setup needed'}
                    </ModalDescription>
                  </div>
                </div>
              </ModalHeader>

              {fields.length > 0 ? (
                <div className="space-y-4 py-4">
                  {fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg',
                            'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
                            'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                            'focus:outline-none focus:ring-2 focus:ring-white/50',
                            'resize-none'
                          )}
                        />
                      ) : field.type === 'date' ? (
                        <input
                          type="datetime-local"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg',
                            'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
                            'text-sm text-[var(--color-text-primary)]',
                            'focus:outline-none focus:ring-2 focus:ring-white/50',
                            '[color-scheme:dark]'
                          )}
                        />
                      ) : field.type === 'options' && field.options ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg',
                            'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
                            'text-sm text-[var(--color-text-primary)]',
                            'focus:outline-none focus:ring-2 focus:ring-white/50'
                          )}
                        >
                          <option value="">Select...</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg',
                            'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
                            'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                            'focus:outline-none focus:ring-2 focus:ring-white/50'
                          )}
                        />
                      ) : (
                        <Input
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Text size="sm" className="text-red-400">{error}</Text>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Text size="sm" tone="muted">
                    {template.description}
                  </Text>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="cta" onClick={handleDeploy}>
                  Deploy Now
                </Button>
              </div>
            </motion.div>
          )}

          {/* Deploying Step */}
          {state === 'deploying' && (
            <motion.div
              key="deploying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <div
                className="w-12 h-12 mx-auto mb-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--hivelab-connection, #D4AF37)', borderTopColor: 'transparent' }}
              />
              <Text size="lg" weight="medium" className="mb-2">
                Deploying {template.name}...
              </Text>
              <Text size="sm" tone="muted">
                Setting up your tool
              </Text>
            </motion.div>
          )}

          {/* Success Step */}
          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--hivelab-connection, #D4AF37)' }}
              >
                <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
              <Text size="lg" weight="medium" className="mb-2">
                {template.name} is live!
              </Text>
              <Text size="sm" tone="muted">
                Your tool has been deployed
              </Text>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
}

QuickDeployModal.displayName = 'QuickDeployModal';
