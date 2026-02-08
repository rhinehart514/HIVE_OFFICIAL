'use client';

/**
 * FocusedToolEditor - Middle-ground editor for template-based tool creation
 *
 * Sits between instant create (AI does everything) and full editor (manual composition).
 * User picks a template, fills in specific fields, AI generates the rest.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOTION } from '@hive/ui/tokens/motion';
import { Button } from '@hive/ui/design-system/primitives';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'events' | 'polls' | 'signups' | 'tracking';
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'number';
    placeholder: string;
    required: boolean;
  }>;
}

const TEMPLATES: Template[] = [
  {
    id: 'event-rsvp',
    name: 'Event RSVP',
    description: 'Countdown + signup + attendee list',
    icon: '📅',
    category: 'events',
    fields: [
      { name: 'eventName', label: 'Event Name', type: 'text', placeholder: 'Spring Formal', required: true },
      { name: 'eventDate', label: 'Event Date', type: 'date', placeholder: '', required: true },
      { name: 'maxAttendees', label: 'Max Attendees', type: 'number', placeholder: '100', required: false },
    ],
  },
  {
    id: 'quick-poll',
    name: 'Quick Poll',
    description: 'Poll + results chart',
    icon: '📊',
    category: 'polls',
    fields: [
      { name: 'question', label: 'Question', type: 'text', placeholder: 'Best study spot on campus?', required: true },
      { name: 'options', label: 'Options (comma-separated)', type: 'textarea', placeholder: 'Library, Coffee shop, Dorm', required: true },
    ],
  },
  {
    id: 'signup-sheet',
    name: 'Signup Sheet',
    description: 'Time slots + capacity tracking',
    icon: '📝',
    category: 'signups',
    fields: [
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Office Hours', required: true },
      { name: 'slots', label: 'Time Slots (one per line)', type: 'textarea', placeholder: '2pm-3pm\n3pm-4pm\n4pm-5pm', required: true },
    ],
  },
  {
    id: 'task-tracker',
    name: 'Task Tracker',
    description: 'Checklist + deadline countdown',
    icon: '✅',
    category: 'tracking',
    fields: [
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Project Milestones', required: true },
      { name: 'deadline', label: 'Deadline', type: 'date', placeholder: '', required: false },
      { name: 'tasks', label: 'Tasks (one per line)', type: 'textarea', placeholder: 'Research\nDraft\nReview', required: true },
    ],
  },
];

interface FocusedToolEditorProps {
  spaceId?: string;
  onComplete: (tool: { name: string; description: string; elements: unknown[] }) => void;
  onCancel: () => void;
}

export function FocusedToolEditor({ spaceId, onComplete, onCancel }: FocusedToolEditorProps) {
  const [step, setStep] = useState<'template' | 'fields' | 'generating'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFieldValues({});
    setStep('fields');
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    setStep('generating');

    try {
      // Build prompt from template + field values
      const prompt = `Create a ${selectedTemplate.name.toLowerCase()} tool with: ${Object.entries(fieldValues)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')}`;

      const response = await fetch('/api/hivelab/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          spaceId,
          templateId: selectedTemplate.id,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const tool = await response.json();
      onComplete(tool);
    } catch (error) {
      console.error('Failed to generate tool:', error);
      setStep('fields');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = selectedTemplate?.fields.every((field) => {
    return !field.required || fieldValues[field.name];
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Template Selection */}
      {step === 'template' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.transitions.base}
        >
          <h2 className="text-2xl font-semibold text-white mb-2">Pick a Template</h2>
          <p className="text-white/60 mb-8">Start with a pre-built pattern, customize the details</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="p-6 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-left transition-colors"
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="text-lg font-medium text-white mb-1">{template.name}</h3>
                <p className="text-sm text-white/60">{template.description}</p>
              </button>
            ))}
          </div>

          <button
            onClick={onCancel}
            className="mt-8 text-white/60 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </motion.div>
      )}

      {/* Field Entry */}
      {step === 'fields' && selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.transitions.base}
        >
          <button
            onClick={() => setStep('template')}
            className="mb-6 text-white/60 hover:text-white transition-colors"
          >
            ← Change Template
          </button>

          <div className="mb-8">
            <div className="text-4xl mb-3">{selectedTemplate.icon}</div>
            <h2 className="text-2xl font-semibold text-white mb-2">{selectedTemplate.name}</h2>
            <p className="text-white/60">{selectedTemplate.description}</p>
          </div>

          <div className="space-y-6 mb-8">
            {selectedTemplate.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-white mb-2">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={fieldValues[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--life-gold)] transition-colors"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={fieldValues[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--life-gold)] transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex-1 bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90 disabled:opacity-50"
            >
              Generate Tool
            </Button>
            <Button onClick={onCancel} variant="secondary">
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Generating State */}
      {step === 'generating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--life-gold)]/10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--life-gold)] border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Generating your tool...</h3>
          <p className="text-white/60">This takes a few seconds</p>
        </motion.div>
      )}
    </div>
  );
}
