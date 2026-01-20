'use client';

/**
 * QuickCreateWizard Component
 *
 * A conversational, "blind build" flow for creating HiveLab tools.
 * User picks what they want to do → fills 1-2 fields → tool deployed.
 *
 * No IDE knowledge required. No canvas. No element vocabulary.
 */

import * as React from 'react';
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

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface QuickCreateIntent {
  id: string;
  label: string;
  description: string;
  icon: string;
  templateId: string;
  fields: QuickCreateField[];
}

export interface QuickCreateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'options';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface QuickCreateResult {
  intentId: string;
  templateId: string;
  config: Record<string, string>;
}

export interface SpaceContext {
  spaceId?: string;
  spaceName?: string;
  spaceType?: string;
  memberCount?: number;
}

export interface QuickCreateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: QuickCreateResult) => Promise<void>;
  spaceContext?: SpaceContext;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT INTENTS
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_INTENTS: QuickCreateIntent[] = [
  {
    id: 'poll',
    label: 'Ask a question',
    description: 'Get opinions from your members',
    icon: 'bar-chart-2',
    templateId: 'quick-poll',
    fields: [
      {
        key: 'question',
        label: 'Your question',
        type: 'text',
        placeholder: 'What do you think about...?',
        required: true,
      },
      {
        key: 'options',
        label: 'Options (comma-separated)',
        type: 'text',
        placeholder: 'Option A, Option B, Option C',
        defaultValue: 'Yes, No, Maybe',
      },
    ],
  },
  {
    id: 'rsvp',
    label: 'Event signup',
    description: 'Let people RSVP to an event',
    icon: 'calendar',
    templateId: 'event-rsvp',
    fields: [
      {
        key: 'eventTitle',
        label: 'Event name',
        type: 'text',
        placeholder: 'Weekly Meeting',
        required: true,
      },
      {
        key: 'eventDate',
        label: 'When',
        type: 'date',
        required: true,
      },
    ],
  },
  {
    id: 'countdown',
    label: 'Countdown timer',
    description: 'Count down to something exciting',
    icon: 'timer',
    templateId: 'event-countdown',
    fields: [
      {
        key: 'title',
        label: 'What are you counting down to?',
        type: 'text',
        placeholder: 'Spring Social',
        required: true,
      },
      {
        key: 'targetDate',
        label: 'Target date',
        type: 'date',
        required: true,
      },
    ],
  },
  {
    id: 'decision',
    label: 'Make a decision',
    description: 'Quick yes/no vote for the group',
    icon: 'target',
    templateId: 'decision-maker',
    fields: [
      {
        key: 'question',
        label: 'What needs to be decided?',
        type: 'text',
        placeholder: 'Should we host a social event next week?',
        required: true,
      },
    ],
  },
  {
    id: 'announcement',
    label: 'Make an announcement',
    description: 'Share news with your space',
    icon: 'megaphone',
    templateId: 'announcements',
    fields: [
      {
        key: 'title',
        label: 'Announcement title',
        type: 'text',
        placeholder: 'Important Update',
        required: true,
      },
      {
        key: 'content',
        label: 'Message',
        type: 'textarea',
        placeholder: 'Write your announcement here...',
        required: true,
      },
    ],
  },
  {
    id: 'feedback',
    label: 'Collect feedback',
    description: 'Gather thoughts and suggestions',
    icon: 'message-square',
    templateId: 'feedback-form',
    fields: [
      {
        key: 'title',
        label: 'What are you collecting feedback on?',
        type: 'text',
        placeholder: 'Last week\'s event',
        defaultValue: 'Feedback',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════

const ICONS: Record<string, React.ReactNode> = {
  'bar-chart-2': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16v-4m4 4v-8m4 8v-6m4 6v-10" />
    </svg>
  ),
  'calendar': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'timer': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'target': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  'megaphone': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  'message-square': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

type Step = 'select' | 'configure' | 'deploying';

export function QuickCreateWizard({
  open,
  onOpenChange,
  onComplete,
  spaceContext,
  className,
}: QuickCreateWizardProps) {
  const [step, setStep] = React.useState<Step>('select');
  const [selectedIntent, setSelectedIntent] = React.useState<QuickCreateIntent | null>(null);
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setStep('select');
      setSelectedIntent(null);
      setFormData({});
      setError(null);
    }
  }, [open]);

  // Initialize form data with defaults when intent is selected
  React.useEffect(() => {
    if (selectedIntent) {
      const defaults: Record<string, string> = {};
      for (const field of selectedIntent.fields) {
        if (field.defaultValue) {
          defaults[field.key] = field.defaultValue;
        }
        // Apply smart defaults based on space context
        if (spaceContext?.spaceName) {
          if (field.key === 'question' && selectedIntent.id === 'poll') {
            defaults[field.key] = `What does ${spaceContext.spaceName} think?`;
          }
          if (field.key === 'eventTitle') {
            defaults[field.key] = `${spaceContext.spaceName} Event`;
          }
          if (field.key === 'title' && selectedIntent.id === 'countdown') {
            defaults[field.key] = `${spaceContext.spaceName} Event`;
          }
        }
      }
      setFormData(defaults);
    }
  }, [selectedIntent, spaceContext]);

  const handleSelectIntent = (intent: QuickCreateIntent) => {
    setSelectedIntent(intent);
    setStep('configure');
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedIntent) return;

    // Validate required fields
    for (const field of selectedIntent.fields) {
      if (field.required && !formData[field.key]?.trim()) {
        setError(`Please fill in: ${field.label}`);
        return;
      }
    }

    setStep('deploying');
    setError(null);

    try {
      await onComplete({
        intentId: selectedIntent.id,
        templateId: selectedIntent.templateId,
        config: formData,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tool');
      setStep('configure');
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedIntent(null);
    setFormData({});
    setError(null);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={cn('max-w-md', className)}>
        {/* Step 1: Select Intent */}
        {step === 'select' && (
          <>
            <ModalHeader>
              <ModalTitle>What do you want to create?</ModalTitle>
              <ModalDescription>
                Pick an option and we'll set it up for you
              </ModalDescription>
            </ModalHeader>

            <div className="grid gap-2 py-4">
              {DEFAULT_INTENTS.map((intent) => (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => handleSelectIntent(intent)}
                  className={cn(
                    'w-full p-4 rounded-xl border border-[var(--color-border)]',
                    'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]',
                    'flex items-center gap-4 text-left transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    'group'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]',
                    'group-hover:bg-[var(--color-life-gold)]/10 group-hover:text-[var(--color-life-gold)]',
                    'transition-colors'
                  )}>
                    {ICONS[intent.icon] || ICONS['target']}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text size="sm" weight="medium">
                      {intent.label}
                    </Text>
                    <Text size="xs" tone="muted">
                      {intent.description}
                    </Text>
                  </div>
                  <svg
                    className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && selectedIntent && (
          <>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 -ml-1 rounded hover:bg-[var(--color-bg-muted)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <ModalTitle>{selectedIntent.label}</ModalTitle>
                  <ModalDescription>
                    Fill in the details below
                  </ModalDescription>
                </div>
              </div>
            </ModalHeader>

            <div className="space-y-4 py-4">
              {selectedIntent.fields.map((field) => (
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

            <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button variant="cta" onClick={handleSubmit}>
                Create & Deploy
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Deploying */}
        {step === 'deploying' && (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--color-life-gold)] border-t-transparent rounded-full animate-spin" />
            <Text size="lg" weight="medium" className="mb-2">
              Creating your tool...
            </Text>
            <Text size="sm" tone="muted">
              This will only take a moment
            </Text>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

QuickCreateWizard.displayName = 'QuickCreateWizard';

export { DEFAULT_INTENTS as QUICK_CREATE_INTENTS };
