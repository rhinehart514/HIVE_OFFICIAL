'use client';

/**
 * /tools/setups/[setupId]/builder — Setup Builder
 *
 * Visual builder for configuring setup templates:
 * - Add/remove tool slots
 * - Configure tool placement and visibility
 * - Define orchestration rules (triggers → actions)
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Settings,
  Zap,
  Play,
  Eye,
  EyeOff,
  GripVertical,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
  Layers,
} from 'lucide-react';
import { BrandSpinner, Button } from '@hive/ui';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  bg: 'var(--bg-ground, #0A0A09)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  error: '#EF4444',
  success: '#10B981',
};

const PLACEMENT_OPTIONS = [
  { id: 'sidebar', label: 'Sidebar', description: 'Shows in the space sidebar' },
  { id: 'inline', label: 'Inline', description: 'Embeds in chat or feed' },
  { id: 'modal', label: 'Modal', description: 'Opens in a dialog' },
  { id: 'tab', label: 'Tab', description: 'Shows as a space tab' },
] as const;

interface SetupTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tools: ToolSlot[];
  orchestration: OrchestrationRule[];
  isSystem: boolean;
}

interface ToolSlot {
  slotId: string;
  name: string;
  description?: string;
  icon?: string;
  placement: 'sidebar' | 'inline' | 'modal' | 'tab';
  initiallyVisible: boolean;
  defaultConfig: Record<string, unknown>;
}

interface OrchestrationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  runOnce?: boolean;
  trigger: {
    type: 'tool_event' | 'time_relative' | 'data_condition' | 'manual';
    [key: string]: unknown;
  };
  actions: Array<{
    type: string;
    [key: string]: unknown;
  }>;
}

async function fetchSetupTemplate(id: string): Promise<SetupTemplate> {
  const response = await fetch(`/api/setups/templates/${id}`);
  if (!response.ok) throw new Error('Failed to fetch setup');
  const data = await response.json();
  return data.template;
}

async function updateSetupTemplate(id: string, updates: Partial<SetupTemplate>): Promise<SetupTemplate> {
  const response = await fetch(`/api/setups/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update setup');
  const data = await response.json();
  return data.template;
}

export default function SetupBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const setupId = params.setupId as string;

  const [activeTab, setActiveTab] = React.useState<'tools' | 'orchestration'>('tools');
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [selectedRule, setSelectedRule] = React.useState<string | null>(null);
  const [localTools, setLocalTools] = React.useState<ToolSlot[]>([]);
  const [localRules, setLocalRules] = React.useState<OrchestrationRule[]>([]);
  const [hasChanges, setHasChanges] = React.useState(false);

  const { data: setup, isLoading, error } = useQuery({
    queryKey: ['setup-template', setupId],
    queryFn: () => fetchSetupTemplate(setupId),
    enabled: !!setupId,
  });

  // Initialize local state from fetched data
  React.useEffect(() => {
    if (setup) {
      setLocalTools(setup.tools || []);
      setLocalRules(setup.orchestration || []);
    }
  }, [setup]);

  const saveMutation = useMutation({
    mutationFn: (updates: Partial<SetupTemplate>) => updateSetupTemplate(setupId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-template', setupId] });
      setHasChanges(false);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      tools: localTools,
      orchestration: localRules,
    });
  };

  const addToolSlot = () => {
    const newSlot: ToolSlot = {
      slotId: `slot_${Date.now()}`,
      name: `Tool ${localTools.length + 1}`,
      placement: 'sidebar',
      initiallyVisible: true,
      defaultConfig: {},
    };
    setLocalTools([...localTools, newSlot]);
    setSelectedSlot(newSlot.slotId);
    setHasChanges(true);
  };

  const updateToolSlot = (slotId: string, updates: Partial<ToolSlot>) => {
    setLocalTools(localTools.map(slot =>
      slot.slotId === slotId ? { ...slot, ...updates } : slot
    ));
    setHasChanges(true);
  };

  const removeToolSlot = (slotId: string) => {
    setLocalTools(localTools.filter(slot => slot.slotId !== slotId));
    if (selectedSlot === slotId) setSelectedSlot(null);
    setHasChanges(true);
  };

  const addRule = () => {
    const newRule: OrchestrationRule = {
      id: `rule_${Date.now()}`,
      name: `Rule ${localRules.length + 1}`,
      enabled: true,
      trigger: { type: 'manual', buttonLabel: 'Run' },
      actions: [],
    };
    setLocalRules([...localRules, newRule]);
    setSelectedRule(newRule.id);
    setHasChanges(true);
  };

  const updateRule = (ruleId: string, updates: Partial<OrchestrationRule>) => {
    setLocalRules(localRules.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
    setHasChanges(true);
  };

  const removeRule = (ruleId: string) => {
    setLocalRules(localRules.filter(rule => rule.id !== ruleId));
    if (selectedRule === ruleId) setSelectedRule(null);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <BrandSpinner size="lg" variant="gold" />
      </div>
    );
  }

  if (error || !setup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.error }} />
          <p className="text-lg mb-4" style={{ color: COLORS.text }}>Setup not found</p>
          <Link href="/tools/setups" className="text-sm" style={{ color: COLORS.gold }}>
            Back to Setups
          </Link>
        </div>
      </div>
    );
  }

  if (setup.isSystem) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <div className="text-center">
          <Layers className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.textTertiary }} />
          <p className="text-lg mb-2" style={{ color: COLORS.text }}>System templates cannot be edited</p>
          <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
            You can deploy this setup to a space or create your own custom setup.
          </p>
          <Link href={`/tools/setups/${setupId}`} className="text-sm" style={{ color: COLORS.gold }}>
            View Setup Details
          </Link>
        </div>
      </div>
    );
  }

  const selectedToolSlot = localTools.find(s => s.slotId === selectedSlot);
  const selectedOrcheRule = localRules.find(r => r.id === selectedRule);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{ backgroundColor: COLORS.bg, borderColor: COLORS.border }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href={`/tools/setups/${setupId}`}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${COLORS.gold}10`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ArrowLeft className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{setup.icon}</span>
                <h1 className="text-lg font-medium" style={{ color: COLORS.text }}>
                  {setup.name}
                </h1>
              </div>
              <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                Setup Builder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: `${COLORS.gold}20`, color: COLORS.gold }}
              >
                Unsaved changes
              </motion.span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: hasChanges ? `${COLORS.gold}20` : 'transparent',
                color: hasChanges ? COLORS.gold : COLORS.textTertiary,
                border: `1px solid ${hasChanges ? COLORS.gold : COLORS.border}`,
              }}
            >
              {saveMutation.isPending ? (
                <BrandSpinner size="sm" variant="gold" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-72 border-r min-h-[calc(100vh-73px)] p-4" style={{ borderColor: COLORS.border }}>
          {/* Tabs */}
          <div className="flex gap-2 mb-4 p-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <button
              onClick={() => setActiveTab('tools')}
              className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === 'tools' ? `${COLORS.gold}20` : 'transparent',
                color: activeTab === 'tools' ? COLORS.gold : COLORS.textSecondary,
              }}
            >
              <Layers className="h-4 w-4 inline mr-2" />
              Tools ({localTools.length})
            </button>
            <button
              onClick={() => setActiveTab('orchestration')}
              className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === 'orchestration' ? `${COLORS.gold}20` : 'transparent',
                color: activeTab === 'orchestration' ? COLORS.gold : COLORS.textSecondary,
              }}
            >
              <Zap className="h-4 w-4 inline mr-2" />
              Rules ({localRules.length})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'tools' ? (
              <motion.div
                key="tools"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {/* Add Tool Button */}
                <button
                  onClick={addToolSlot}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-dashed text-sm font-medium transition-all mb-4"
                  style={{
                    border: `1px dashed ${COLORS.border}`,
                    color: COLORS.textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.gold;
                    e.currentTarget.style.color = COLORS.gold;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.color = COLORS.textSecondary;
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Tool Slot
                </button>

                {/* Tool Slots List */}
                <div className="space-y-2">
                  {localTools.map((slot, index) => (
                    <motion.button
                      key={slot.slotId}
                      layout
                      onClick={() => setSelectedSlot(slot.slotId)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: selectedSlot === slot.slotId ? `${COLORS.gold}10` : 'transparent',
                        border: `1px solid ${selectedSlot === slot.slotId ? `${COLORS.gold}40` : COLORS.border}`,
                      }}
                    >
                      <GripVertical className="h-4 w-4 cursor-grab" style={{ color: COLORS.textTertiary }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: COLORS.text }}>
                          {slot.name}
                        </p>
                        <p className="text-xs" style={{ color: COLORS.textTertiary }}>
                          {slot.placement} • {slot.initiallyVisible ? 'Visible' : 'Hidden'}
                        </p>
                      </div>
                      {slot.initiallyVisible ? (
                        <Eye className="h-4 w-4" style={{ color: COLORS.success }} />
                      ) : (
                        <EyeOff className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
                      )}
                    </motion.button>
                  ))}
                </div>

                {localTools.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: COLORS.textTertiary }}>
                    No tool slots yet. Add your first tool.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="orchestration"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {/* Add Rule Button */}
                <button
                  onClick={addRule}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-dashed text-sm font-medium transition-all mb-4"
                  style={{
                    border: `1px dashed ${COLORS.border}`,
                    color: COLORS.textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.gold;
                    e.currentTarget.style.color = COLORS.gold;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.color = COLORS.textSecondary;
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </button>

                {/* Rules List */}
                <div className="space-y-2">
                  {localRules.map((rule) => (
                    <motion.button
                      key={rule.id}
                      layout
                      onClick={() => setSelectedRule(rule.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: selectedRule === rule.id ? `${COLORS.gold}10` : 'transparent',
                        border: `1px solid ${selectedRule === rule.id ? `${COLORS.gold}40` : COLORS.border}`,
                      }}
                    >
                      <Zap
                        className="h-4 w-4"
                        style={{ color: rule.enabled ? COLORS.gold : COLORS.textTertiary }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: COLORS.text }}>
                          {rule.name}
                        </p>
                        <p className="text-xs" style={{ color: COLORS.textTertiary }}>
                          {rule.trigger.type} → {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: rule.enabled ? COLORS.success : COLORS.textTertiary }}
                      />
                    </motion.button>
                  ))}
                </div>

                {localRules.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: COLORS.textTertiary }}>
                    No orchestration rules yet. Add rules to automate interactions between tools.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Main Content - Properties Panel */}
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'tools' && selectedToolSlot ? (
              <motion.div
                key={`tool-${selectedToolSlot.slotId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium" style={{ color: COLORS.text }}>
                    Tool Slot Settings
                  </h2>
                  <button
                    onClick={() => removeToolSlot(selectedToolSlot.slotId)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: COLORS.error }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${COLORS.error}15`)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Name */}
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={selectedToolSlot.name}
                    onChange={(e) => updateToolSlot(selectedToolSlot.slotId, { name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border text-sm outline-none"
                    style={{ borderColor: COLORS.border, color: COLORS.text }}
                  />
                </div>

                {/* Placement */}
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                    Placement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLACEMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => updateToolSlot(selectedToolSlot.slotId, { placement: opt.id })}
                        className="p-3 rounded-lg text-left transition-all"
                        style={{
                          backgroundColor: selectedToolSlot.placement === opt.id ? `${COLORS.gold}10` : 'transparent',
                          border: `1px solid ${selectedToolSlot.placement === opt.id ? COLORS.gold : COLORS.border}`,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: COLORS.text }}>{opt.label}</p>
                        <p className="text-xs" style={{ color: COLORS.textTertiary }}>{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Initial Visibility */}
                <div className="mb-5">
                  <label className="flex items-center justify-between p-4 rounded-lg border cursor-pointer" style={{ borderColor: COLORS.border }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: COLORS.text }}>Initially Visible</p>
                      <p className="text-xs" style={{ color: COLORS.textTertiary }}>
                        Show this tool when the setup is deployed
                      </p>
                    </div>
                    <button
                      onClick={() => updateToolSlot(selectedToolSlot.slotId, { initiallyVisible: !selectedToolSlot.initiallyVisible })}
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{ backgroundColor: selectedToolSlot.initiallyVisible ? COLORS.gold : COLORS.border }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                        style={{ left: selectedToolSlot.initiallyVisible ? 'calc(100% - 20px)' : '4px' }}
                      />
                    </button>
                  </label>
                </div>
              </motion.div>
            ) : activeTab === 'orchestration' && selectedOrcheRule ? (
              <motion.div
                key={`rule-${selectedOrcheRule.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium" style={{ color: COLORS.text }}>
                    Rule Settings
                  </h2>
                  <button
                    onClick={() => removeRule(selectedOrcheRule.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: COLORS.error }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${COLORS.error}15`)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Name */}
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={selectedOrcheRule.name}
                    onChange={(e) => updateRule(selectedOrcheRule.id, { name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border text-sm outline-none"
                    style={{ borderColor: COLORS.border, color: COLORS.text }}
                  />
                </div>

                {/* Enabled */}
                <div className="mb-5">
                  <label className="flex items-center justify-between p-4 rounded-lg border cursor-pointer" style={{ borderColor: COLORS.border }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: COLORS.text }}>Enabled</p>
                      <p className="text-xs" style={{ color: COLORS.textTertiary }}>
                        Rule will execute when conditions are met
                      </p>
                    </div>
                    <button
                      onClick={() => updateRule(selectedOrcheRule.id, { enabled: !selectedOrcheRule.enabled })}
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{ backgroundColor: selectedOrcheRule.enabled ? COLORS.success : COLORS.border }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                        style={{ left: selectedOrcheRule.enabled ? 'calc(100% - 20px)' : '4px' }}
                      />
                    </button>
                  </label>
                </div>

                {/* Trigger Configuration */}
                <div className="p-4 rounded-lg mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-xs font-medium mb-3" style={{ color: COLORS.textSecondary }}>TRIGGER</p>

                  {/* Trigger Type Selector */}
                  <div className="mb-3">
                    <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Type</label>
                    <select
                      value={selectedOrcheRule.trigger.type}
                      onChange={(e) => {
                        const newType = e.target.value as OrchestrationRule['trigger']['type'];
                        // Set default values based on type
                        const defaultTriggers: Record<string, OrchestrationRule['trigger']> = {
                          manual: { type: 'manual', buttonLabel: 'Run' },
                          tool_event: { type: 'tool_event', toolSlotId: '', event: 'submit' },
                          time_relative: { type: 'time_relative', delay: 60, unit: 'minutes', relativeTo: 'deployment' },
                          data_condition: { type: 'data_condition', field: '', operator: 'equals', value: '' },
                        };
                        updateRule(selectedOrcheRule.id, { trigger: defaultTriggers[newType] });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                      style={{ borderColor: COLORS.border, color: COLORS.text }}
                    >
                      <option value="manual">Manual (Button)</option>
                      <option value="tool_event">Tool Event</option>
                      <option value="time_relative">Time-Based</option>
                      <option value="data_condition">Data Condition</option>
                    </select>
                  </div>

                  {/* Type-specific fields */}
                  {selectedOrcheRule.trigger.type === 'manual' && (
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Button Label</label>
                      <input
                        type="text"
                        value={(selectedOrcheRule.trigger.buttonLabel as string) || 'Run'}
                        onChange={(e) => updateRule(selectedOrcheRule.id, {
                          trigger: { ...selectedOrcheRule.trigger, buttonLabel: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                        style={{ borderColor: COLORS.border, color: COLORS.text }}
                        placeholder="Run"
                      />
                    </div>
                  )}

                  {selectedOrcheRule.trigger.type === 'tool_event' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Tool Slot</label>
                        <select
                          value={(selectedOrcheRule.trigger.toolSlotId as string) || ''}
                          onChange={(e) => updateRule(selectedOrcheRule.id, {
                            trigger: { ...selectedOrcheRule.trigger, toolSlotId: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                          style={{ borderColor: COLORS.border, color: COLORS.text }}
                        >
                          <option value="">Select tool...</option>
                          {localTools.map(slot => (
                            <option key={slot.slotId} value={slot.slotId}>{slot.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Event</label>
                        <select
                          value={(selectedOrcheRule.trigger.event as string) || 'submit'}
                          onChange={(e) => updateRule(selectedOrcheRule.id, {
                            trigger: { ...selectedOrcheRule.trigger, event: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                          style={{ borderColor: COLORS.border, color: COLORS.text }}
                        >
                          <option value="submit">Submit</option>
                          <option value="vote">Vote</option>
                          <option value="rsvp">RSVP</option>
                          <option value="complete">Complete</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedOrcheRule.trigger.type === 'time_relative' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Delay</label>
                          <input
                            type="number"
                            value={(selectedOrcheRule.trigger.delay as number) || 60}
                            onChange={(e) => updateRule(selectedOrcheRule.id, {
                              trigger: { ...selectedOrcheRule.trigger, delay: parseInt(e.target.value) || 0 }
                            })}
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                            style={{ borderColor: COLORS.border, color: COLORS.text }}
                            min="1"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Unit</label>
                          <select
                            value={(selectedOrcheRule.trigger.unit as string) || 'minutes'}
                            onChange={(e) => updateRule(selectedOrcheRule.id, {
                              trigger: { ...selectedOrcheRule.trigger, unit: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                            style={{ borderColor: COLORS.border, color: COLORS.text }}
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Relative To</label>
                        <select
                          value={(selectedOrcheRule.trigger.relativeTo as string) || 'deployment'}
                          onChange={(e) => updateRule(selectedOrcheRule.id, {
                            trigger: { ...selectedOrcheRule.trigger, relativeTo: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                          style={{ borderColor: COLORS.border, color: COLORS.text }}
                        >
                          <option value="deployment">Setup Deployment</option>
                          <option value="event_start">Event Start</option>
                          <option value="event_end">Event End</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedOrcheRule.trigger.type === 'data_condition' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Field Path</label>
                        <input
                          type="text"
                          value={(selectedOrcheRule.trigger.field as string) || ''}
                          onChange={(e) => updateRule(selectedOrcheRule.id, {
                            trigger: { ...selectedOrcheRule.trigger, field: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                          style={{ borderColor: COLORS.border, color: COLORS.text }}
                          placeholder="e.g., responses.count"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Operator</label>
                          <select
                            value={(selectedOrcheRule.trigger.operator as string) || 'equals'}
                            onChange={(e) => updateRule(selectedOrcheRule.id, {
                              trigger: { ...selectedOrcheRule.trigger, operator: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                            style={{ borderColor: COLORS.border, color: COLORS.text }}
                          >
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not Equals</option>
                            <option value="greater_than">Greater Than</option>
                            <option value="less_than">Less Than</option>
                            <option value="contains">Contains</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs mb-1.5" style={{ color: COLORS.textTertiary }}>Value</label>
                          <input
                            type="text"
                            value={(selectedOrcheRule.trigger.value as string) || ''}
                            onChange={(e) => updateRule(selectedOrcheRule.id, {
                              trigger: { ...selectedOrcheRule.trigger, value: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
                            style={{ borderColor: COLORS.border, color: COLORS.text }}
                            placeholder="Value"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Builder */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>ACTIONS</p>
                    <button
                      onClick={() => {
                        const newAction = { type: 'notify', channel: 'push', title: '', body: '', to: 'all_members' };
                        updateRule(selectedOrcheRule.id, {
                          actions: [...selectedOrcheRule.actions, newAction]
                        });
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                      style={{ color: COLORS.gold }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${COLORS.gold}15`)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>

                  {selectedOrcheRule.actions.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrcheRule.actions.map((action, i) => (
                        <div key={i} className="p-3 rounded-lg border" style={{ borderColor: COLORS.border }}>
                          <div className="flex items-center justify-between mb-2">
                            <select
                              value={action.type}
                              onChange={(e) => {
                                const newActions = [...selectedOrcheRule.actions];
                                const newType = e.target.value;
                                // Set default values based on type
                                const defaults: Record<string, OrchestrationRule['actions'][number]> = {
                                  notify: { type: 'notify', channel: 'push', title: '', body: '', to: 'all_members' },
                                  mutate: { type: 'mutate', toolSlotId: '', mutation: {} },
                                  show_tool: { type: 'show_tool', toolSlotId: '' },
                                  hide_tool: { type: 'hide_tool', toolSlotId: '' },
                                };
                                newActions[i] = defaults[newType] ?? { type: newType };
                                updateRule(selectedOrcheRule.id, { actions: newActions });
                              }}
                              className="px-2 py-1 rounded bg-white/[0.03] border text-xs outline-none"
                              style={{ borderColor: COLORS.border, color: COLORS.text }}
                            >
                              <option value="notify">Send Notification</option>
                              <option value="show_tool">Show Tool</option>
                              <option value="hide_tool">Hide Tool</option>
                              <option value="mutate">Update Tool Data</option>
                            </select>
                            <button
                              onClick={() => {
                                const newActions = selectedOrcheRule.actions.filter((_, idx) => idx !== i);
                                updateRule(selectedOrcheRule.id, { actions: newActions });
                              }}
                              className="p-1 rounded transition-colors"
                              style={{ color: COLORS.error }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${COLORS.error}15`)}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Action-specific fields */}
                          {action.type === 'notify' && (
                            <div className="space-y-2 mt-2">
                              <input
                                type="text"
                                value={(action.title as string) || ''}
                                onChange={(e) => {
                                  const newActions = [...selectedOrcheRule.actions];
                                  newActions[i] = { ...action, title: e.target.value };
                                  updateRule(selectedOrcheRule.id, { actions: newActions });
                                }}
                                className="w-full px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                                style={{ borderColor: COLORS.border, color: COLORS.text }}
                                placeholder="Notification title"
                              />
                              <input
                                type="text"
                                value={(action.body as string) || ''}
                                onChange={(e) => {
                                  const newActions = [...selectedOrcheRule.actions];
                                  newActions[i] = { ...action, body: e.target.value };
                                  updateRule(selectedOrcheRule.id, { actions: newActions });
                                }}
                                className="w-full px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                                style={{ borderColor: COLORS.border, color: COLORS.text }}
                                placeholder="Notification body"
                              />
                              <select
                                value={(action.to as string) || 'all_members'}
                                onChange={(e) => {
                                  const newActions = [...selectedOrcheRule.actions];
                                  newActions[i] = { ...action, to: e.target.value };
                                  updateRule(selectedOrcheRule.id, { actions: newActions });
                                }}
                                className="w-full px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                                style={{ borderColor: COLORS.border, color: COLORS.text }}
                              >
                                <option value="all_members">All Members</option>
                                <option value="officers">Officers Only</option>
                                <option value="participants">Participants</option>
                              </select>
                            </div>
                          )}

                          {(action.type === 'show_tool' || action.type === 'hide_tool') && (
                            <div className="mt-2">
                              <select
                                value={(action.toolSlotId as string) || ''}
                                onChange={(e) => {
                                  const newActions = [...selectedOrcheRule.actions];
                                  newActions[i] = { ...action, toolSlotId: e.target.value };
                                  updateRule(selectedOrcheRule.id, { actions: newActions });
                                }}
                                className="w-full px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                                style={{ borderColor: COLORS.border, color: COLORS.text }}
                              >
                                <option value="">Select tool...</option>
                                {localTools.map(slot => (
                                  <option key={slot.slotId} value={slot.slotId}>{slot.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {action.type === 'mutate' && (
                            <div className="space-y-2 mt-2">
                              <select
                                value={(action.toolSlotId as string) || ''}
                                onChange={(e) => {
                                  const newActions = [...selectedOrcheRule.actions];
                                  newActions[i] = { ...action, toolSlotId: e.target.value };
                                  updateRule(selectedOrcheRule.id, { actions: newActions });
                                }}
                                className="w-full px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none"
                                style={{ borderColor: COLORS.border, color: COLORS.text }}
                              >
                                <option value="">Select tool...</option>
                                {localTools.map(slot => (
                                  <option key={slot.slotId} value={slot.slotId}>{slot.name}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={JSON.stringify((action.mutation as object) || {})}
                                onChange={(e) => {
                                  try {
                                    const mutation = JSON.parse(e.target.value);
                                    const newActions = [...selectedOrcheRule.actions];
                                    newActions[i] = { ...action, mutation };
                                    updateRule(selectedOrcheRule.id, { actions: newActions });
                                  } catch {
                                    // Invalid JSON, ignore
                                  }
                                }}
                                className="w-full px-2 py-1.5 rounded bg-white/[0.03] border text-xs outline-none font-mono"
                                style={{ borderColor: COLORS.border, color: COLORS.text }}
                                placeholder='{"key": "value"}'
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: COLORS.textTertiary }}>
                      No actions configured. Click &quot;Add&quot; to create one.
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[60vh] text-center"
              >
                <Settings className="h-12 w-12 mb-4" style={{ color: COLORS.textTertiary }} />
                <p className="text-lg mb-2" style={{ color: COLORS.text }}>
                  {activeTab === 'tools' ? 'Select a tool slot' : 'Select a rule'}
                </p>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {activeTab === 'tools'
                    ? 'Click on a tool slot to configure it, or add a new one.'
                    : 'Click on a rule to configure it, or add a new one.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
