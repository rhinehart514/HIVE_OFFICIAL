'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button, toast } from '@hive/ui';

interface AutomationTemplate {
  name: string;
  description: string;
  trigger: { type: 'event' | 'schedule'; elementId?: string; event?: string; cron?: string; timezone?: string };
  actions: Array<{ type: 'notify'; channel: 'push' | 'email'; title: string; body: string }>;
}

const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    name: 'Welcome Message',
    description: 'Send a greeting when new members join',
    trigger: { type: 'event', elementId: '', event: 'member_join' },
    actions: [{ type: 'notify', channel: 'push', title: 'Welcome!', body: 'Welcome to the space!' }],
  },
  {
    name: 'Weekly Digest',
    description: 'Send a summary every Monday',
    trigger: { type: 'schedule', cron: '0 9 * * 1', timezone: 'America/New_York' },
    actions: [{ type: 'notify', channel: 'email', title: 'Weekly Update', body: 'Here is what happened this week...' }],
  },
  {
    name: 'Event Reminder',
    description: 'Notify members 30 minutes before events',
    trigger: { type: 'schedule', cron: '0 * * * *', timezone: 'America/New_York' },
    actions: [{ type: 'notify', channel: 'push', title: 'Event Starting Soon', body: 'Your event starts in 30 minutes!' }],
  },
];

interface AutomationData {
  id?: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: Record<string, unknown>;
  conditions: unknown[];
  actions: unknown[];
  limits: { maxRunsPerDay: number; cooldownSeconds: number };
  [key: string]: unknown;
}

interface SettingsAutomationsProps {
  spaceId: string;
}

export function SettingsAutomations({ spaceId }: SettingsAutomationsProps) {
  const [automations, setAutomations] = React.useState<AutomationData[]>([]);
  const [automationsLoading, setAutomationsLoading] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [showAutomationBuilder, setShowAutomationBuilder] = React.useState(false);
  const [editingAutomation, setEditingAutomation] = React.useState<AutomationData | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (loaded) return;
    setAutomationsLoading(true);
    fetch(`/api/spaces/${spaceId}/automations`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { automations: [] }))
      .then((data) => {
        setAutomations(data.automations || []);
        setLoaded(true);
      })
      .catch(() => setAutomations([]))
      .finally(() => setAutomationsLoading(false));
  }, [spaceId, loaded]);

  const handleAutomationSave = async (automation: AutomationData) => {
    try {
      const isEdit = !!automation.id;
      const response = await fetch(
        isEdit
          ? `/api/spaces/${spaceId}/automations/${automation.id}`
          : `/api/spaces/${spaceId}/automations`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(automation),
        }
      );
      if (!response.ok) throw new Error('Failed to save');
      const data = await response.json();
      if (isEdit) {
        setAutomations((prev) => prev.map((a) => (a.id === automation.id ? data.automation : a)));
      } else {
        setAutomations((prev) => [...prev, data.automation]);
      }
      setShowAutomationBuilder(false);
      setEditingAutomation(null);
      toast.success(isEdit ? 'Automation updated' : 'Automation created');
    } catch {
      toast.error('Failed to save automation');
      throw new Error('Failed to save automation');
    }
  };

  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Automations
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Set up automated workflows to engage members
      </Text>

      {/* Empty state with templates */}
      {automations.length === 0 && !automationsLoading && (
        <div className="text-center py-12 rounded-lg bg-white/[0.06] border border-white/[0.06]">
          <Zap className="w-12 h-12 mx-auto mb-4 text-amber-500/40" />
          <Text weight="medium" className="mb-2">No automations yet</Text>
          <Text size="sm" tone="muted" className="mb-6 max-w-sm mx-auto">
            Automations let you send welcome messages, schedule reminders, and more.
          </Text>
          <div className="flex items-center justify-center gap-3">
            <Button variant="cta" size="default" onClick={() => setShowTemplates(true)}>
              <Zap className="w-4 h-4 mr-2" />
              Use Template
            </Button>
            <Button variant="ghost" size="default" onClick={() => setShowAutomationBuilder(true)}>
              Create Custom
            </Button>
          </div>
        </div>
      )}

      {/* Automations list */}
      {automations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Text size="sm" weight="medium" tone="muted">
              {automations.filter((a) => a.enabled).length} active
            </Text>
            <Button variant="ghost" size="sm" onClick={() => setShowTemplates(true)}>
              <Zap className="w-3 h-3 mr-1.5" />
              Add
            </Button>
          </div>
          {/* Automations deferred */}
        </div>
      )}

      {/* Automation Templates Picker */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowTemplates(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-[var(--bg-surface-hover)] rounded-lg border border-white/[0.06] max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[var(--bg-surface-hover)] border-b border-white/[0.06] p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Automation Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {AUTOMATION_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => {
                    setShowTemplates(false);
                    setEditingAutomation({
                      name: template.name,
                      description: template.description,
                      enabled: true,
                      trigger: template.trigger as Record<string, unknown>,
                      conditions: [],
                      actions: template.actions,
                      limits: { maxRunsPerDay: 100, cooldownSeconds: 0 },
                    });
                    setShowAutomationBuilder(true);
                  }}
                  className="w-full p-4 rounded-lg bg-white/[0.06] border border-white/[0.06] hover:border-amber-500/30 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <Text weight="medium" className="mb-1">{template.name}</Text>
                      <Text size="sm" tone="muted">{template.description}</Text>
                    </div>
                  </div>
                </button>
              ))}
              <div className="pt-4 border-t border-white/[0.06] text-center">
                <button
                  onClick={() => {
                    setShowTemplates(false);
                    setShowAutomationBuilder(true);
                  }}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  Or create from scratch →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
