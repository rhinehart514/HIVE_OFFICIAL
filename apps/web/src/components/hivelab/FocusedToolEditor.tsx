'use client';

/**
 * FocusedToolEditor - Middle-ground editor for template-based tool creation
 *
 * Sits between instant create (AI does everything) and full editor (manual composition).
 * User picks a template, fills in specific fields, AI generates the rest.
 *
 * Phase 1 additions:
 * - Lifecycle settings panel (activate/sunset/archive dates)
 * - Live activity tab (real-time timeline + counters)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOTION } from '@hive/ui/tokens/motion';
import { Button } from '@hive/ui/design-system/primitives';
import { LiveActivityPanel } from './LiveActivityPanel';
import type { ToolLifecycleStage } from '@hive/core';

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

const STAGE_COLORS: Record<ToolLifecycleStage, string> = {
  draft: 'bg-white/20',
  scheduled: 'bg-blue-400',
  active: 'bg-emerald-400',
  paused: 'bg-amber-400',
  sunset: 'bg-orange-400',
  archived: 'bg-white/10',
};

const STAGE_LABELS: Record<ToolLifecycleStage, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  paused: 'Paused',
  sunset: 'Sunset',
  archived: 'Archived',
};

interface LifecycleConfig {
  stage: ToolLifecycleStage;
  activateAt: string;
  sunsetAt: string;
  archiveAt: string;
  sunsetMessage: string;
}

interface FocusedToolEditorProps {
  spaceId?: string;
  deploymentId?: string;
  onComplete: (tool: { name: string; description: string; elements: unknown[] }) => void;
  onCancel: () => void;
  onLifecycleChange?: (lifecycle: LifecycleConfig) => void;
}

export function FocusedToolEditor({
  spaceId,
  deploymentId,
  onComplete,
  onCancel,
  onLifecycleChange,
}: FocusedToolEditorProps) {
  const [step, setStep] = useState<'template' | 'fields' | 'generating'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [, setIsGenerating] = useState(false);
  const [sidePanel, setSidePanel] = useState<'none' | 'lifecycle' | 'live'>('none');
  const [lifecycle, setLifecycle] = useState<LifecycleConfig>({
    stage: 'draft',
    activateAt: '',
    sunsetAt: '',
    archiveAt: '',
    sunsetMessage: '',
  });

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFieldValues({});
    setStep('fields');
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleLifecycleChange = (key: keyof LifecycleConfig, value: string) => {
    const updated = { ...lifecycle, [key]: value };
    setLifecycle(updated);
    onLifecycleChange?.(updated);
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

      const response = await fetch('/api/tools/generate', {
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
    <div className="flex gap-4 max-w-5xl mx-auto p-6">
      {/* Main Content */}
      <div className={`flex-1 transition-all ${sidePanel !== 'none' ? 'max-w-[60%]' : ''}`}>
        {/* Template Selection */}
        {step === 'template' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
          >
            <h2 className="text-2xl font-semibold text-white mb-2">Pick a Template</h2>
            <p className="text-white/50 mb-8">Start with a pre-built pattern, customize the details</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-6 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-left transition-colors"
                >
                  <div className="text-4xl mb-3">{template.icon}</div>
                  <h3 className="text-lg font-medium text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-white/50">{template.description}</p>
                </button>
              ))}
            </div>

            <button
              onClick={onCancel}
              className="mt-8 text-white/50 hover:text-white transition-colors"
            >
              Back
            </button>
          </motion.div>
        )}

        {/* Field Entry */}
        {step === 'fields' && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
          >
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStep('template')}
                className="text-white/50 hover:text-white transition-colors"
              >
                Change Template
              </button>

              {/* Side panel toggles */}
              <div className="flex gap-1">
                <button
                  onClick={() => setSidePanel(sidePanel === 'lifecycle' ? 'none' : 'lifecycle')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    sidePanel === 'lifecycle'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Lifecycle
                </button>
                {deploymentId && (
                  <button
                    onClick={() => setSidePanel(sidePanel === 'live' ? 'none' : 'live')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                      sidePanel === 'live'
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Live
                  </button>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="text-4xl mb-3">{selectedTemplate.icon}</div>
              <h2 className="text-2xl font-semibold text-white mb-2">{selectedTemplate.name}</h2>
              <p className="text-white/50">{selectedTemplate.description}</p>
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
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.06] rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[var(--life-gold)] transition-colors"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={fieldValues[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.06] rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[var(--life-gold)] transition-colors"
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
              <div className="w-8 h-8 border-2 border-[var(--life-gold)] border-t-transparent rounded-full " />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Generating your tool...</h3>
            <p className="text-white/50">This takes a few seconds</p>
          </motion.div>
        )}
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {sidePanel !== 'none' && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 320 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
            className="shrink-0 overflow-hidden"
          >
            {sidePanel === 'lifecycle' && (
              <div className="w-80 bg-white/[0.03] rounded-lg border border-white/[0.06] p-4">
                <h3 className="text-sm font-medium text-white mb-4">Lifecycle</h3>

                {/* Stage indicator */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`w-2 h-2 rounded-full ${STAGE_COLORS[lifecycle.stage]}`} />
                  <span className="text-sm text-white/70">{STAGE_LABELS[lifecycle.stage]}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Activate at</label>
                    <input
                      type="datetime-local"
                      value={lifecycle.activateAt}
                      onChange={(e) => handleLifecycleChange('activateAt', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white/[0.06] border border-white/[0.06] rounded-md text-white focus:outline-none focus:border-[var(--life-gold)] transition-colors"
                    />
                    <p className="text-[10px] text-white/30 mt-1">Tool becomes active at this time</p>
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Sunset at</label>
                    <input
                      type="datetime-local"
                      value={lifecycle.sunsetAt}
                      onChange={(e) => handleLifecycleChange('sunsetAt', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white/[0.06] border border-white/[0.06] rounded-md text-white focus:outline-none focus:border-[var(--life-gold)] transition-colors"
                    />
                    <p className="text-[10px] text-white/30 mt-1">Read-only mode starts here</p>
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Archive at</label>
                    <input
                      type="datetime-local"
                      value={lifecycle.archiveAt}
                      onChange={(e) => handleLifecycleChange('archiveAt', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white/[0.06] border border-white/[0.06] rounded-md text-white focus:outline-none focus:border-[var(--life-gold)] transition-colors"
                    />
                    <p className="text-[10px] text-white/30 mt-1">Tool is hidden after this</p>
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Sunset message</label>
                    <input
                      type="text"
                      value={lifecycle.sunsetMessage}
                      onChange={(e) => handleLifecycleChange('sunsetMessage', e.target.value)}
                      placeholder="This tool is winding down..."
                      className="w-full px-3 py-2 text-sm bg-white/[0.06] border border-white/[0.06] rounded-md text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--life-gold)] transition-colors"
                    />
                  </div>
                </div>

                {/* Stage flow visualization */}
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <p className="text-[10px] text-white/30 mb-2">Flow</p>
                  <div className="flex items-center gap-1 text-[10px]">
                    {(['scheduled', 'active', 'sunset', 'archived'] as const).map((stage, i) => (
                      <span key={stage} className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded ${
                          lifecycle.stage === stage ? 'bg-white/10 text-white' : 'text-white/30'
                        }`}>
                          {STAGE_LABELS[stage]}
                        </span>
                        {i < 3 && <span className="text-white/20">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sidePanel === 'live' && (
              <LiveActivityPanel
                deploymentId={deploymentId || null}
                className="w-80 h-[500px]"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
