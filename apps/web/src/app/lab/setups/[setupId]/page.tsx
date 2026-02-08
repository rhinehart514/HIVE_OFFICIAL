'use client';

/**
 * /lab/setups/[setupId] — Setup Detail Page
 *
 * Shows setup template details including:
 * - Tool slots visualization
 * - Orchestration rules flow
 * - Configuration fields preview
 * - Deploy action
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Layers,
  Calendar,
  Users,
  Vote,
  Trophy,
  Sparkles,
  Zap,
  GitBranch,
  Play,
  Settings,
  ArrowRight,
  Eye,
  EyeOff,
  Bell,
  MessageSquare,
  Timer,
  ChevronRight,
  Workflow,
  Edit,
} from 'lucide-react';
import { BrandSpinner, Button } from '@hive/ui';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

// Category configuration
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  event: { label: 'Events', icon: Calendar, color: '#10B981' },
  campaign: { label: 'Campaigns', icon: Trophy, color: '#F59E0B' },
  workflow: { label: 'Workflows', icon: GitBranch, color: '#6366F1' },
  engagement: { label: 'Engagement', icon: Vote, color: '#EC4899' },
  governance: { label: 'Governance', icon: Users, color: '#8B5CF6' },
};

// Placement icons
const PLACEMENT_ICONS: Record<string, React.ElementType> = {
  sidebar: Layers,
  inline: MessageSquare,
  modal: Eye,
  tab: Workflow,
};

// Trigger type icons
const TRIGGER_ICONS: Record<string, React.ElementType> = {
  tool_event: Zap,
  time_relative: Timer,
  data_condition: Settings,
  manual: Play,
};

// Action type icons
const ACTION_ICONS: Record<string, React.ElementType> = {
  data_flow: ArrowRight,
  visibility: Eye,
  config: Settings,
  notification: Bell,
  state: Layers,
};

interface SetupToolSlot {
  slotId: string;
  name: string;
  templateId?: string;
  placement: string;
  initiallyVisible: boolean;
  description?: string;
  icon?: string;
}

interface OrchestrationRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    sourceSlotId?: string;
    eventType?: string;
    buttonLabel?: string;
    offsetMinutes?: number;
  };
  actions: Array<{
    type: string;
    targetSlotId?: string;
    visible?: boolean;
    title?: string;
  }>;
  enabled: boolean;
}

interface SetupConfigField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  helpText?: string;
}

interface SetupTemplateDetail {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  source: string;
  tools: SetupToolSlot[];
  orchestration: OrchestrationRule[];
  configFields: SetupConfigField[];
  requiredCapabilities: Record<string, boolean | string[]>;
  tags: string[];
  isFeatured: boolean;
  isSystem: boolean;
  deploymentCount: number;
  creatorId: string;
  creatorName?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchSetupTemplate(id: string): Promise<SetupTemplateDetail> {
  const response = await fetch(`/api/setups/templates/${id}`);
  if (!response.ok) throw new Error('Failed to fetch setup template');
  const data = await response.json();
  return data.template;
}

/**
 * ToolSlotCard — Visualize a tool slot
 */
function ToolSlotCard({ slot, index }: { slot: SetupToolSlot; index: number }) {
  const shouldReduceMotion = useReducedMotion();
  const PlacementIcon = PLACEMENT_ICONS[slot.placement] || Layers;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.2,
        delay: shouldReduceMotion ? 0 : index * 0.05,
      }}
      className="p-4 rounded-lg border bg-[var(--hivelab-surface)] border-[var(--hivelab-border)]"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-white/5">
            <PlacementIcon className="h-4 w-4 text-[var(--hivelab-text-secondary)]" />
          </div>
          <span className="font-medium text-sm text-[var(--hivelab-text-primary)]">
            {slot.name}
          </span>
        </div>
        {slot.initiallyVisible ? (
          <Eye className="h-4 w-4 text-[var(--hivelab-text-tertiary)]" />
        ) : (
          <EyeOff className="h-4 w-4 text-[var(--hivelab-text-tertiary)]" />
        )}
      </div>
      {slot.description && (
        <p className="text-xs mb-2 text-[var(--hivelab-text-tertiary)]">
          {slot.description}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-label-xs px-2 py-0.5 rounded-full capitalize bg-white/5 text-[var(--hivelab-text-secondary)]">
          {slot.placement}
        </span>
        <span className="text-label-xs text-[var(--hivelab-text-tertiary)]">
          {slot.slotId}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * OrchestrationRuleCard — Visualize an orchestration rule
 */
function OrchestrationRuleCard({ rule, index }: { rule: OrchestrationRule; index: number }) {
  const shouldReduceMotion = useReducedMotion();
  const TriggerIcon = TRIGGER_ICONS[rule.trigger.type] || Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.2,
        delay: shouldReduceMotion ? 0 : index * 0.05,
      }}
      className={`p-4 rounded-lg border bg-[var(--hivelab-surface)] ${rule.enabled ? 'border-[var(--hivelab-border)]' : 'border-white/[0.04] opacity-60'}`}
    >
      {/* Rule header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[var(--life-gold)]/15">
            <TriggerIcon className="h-4 w-4 text-[var(--life-gold)]" />
          </div>
          <div>
            <span className="font-medium text-sm text-[var(--hivelab-text-primary)]">
              {rule.name}
            </span>
            {!rule.enabled && (
              <span className="ml-2 text-label-xs px-1.5 py-0.5 rounded bg-white/5 text-[var(--hivelab-text-tertiary)]">
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>

      {rule.description && (
        <p className="text-xs mb-3 text-[var(--hivelab-text-tertiary)]">
          {rule.description}
        </p>
      )}

      {/* Trigger -> Actions flow */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Trigger */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-white/5 text-[var(--hivelab-text-secondary)]">
          <TriggerIcon className="h-3 w-3" />
          {rule.trigger.type === 'tool_event' && rule.trigger.sourceSlotId && (
            <span>
              {rule.trigger.sourceSlotId}.{rule.trigger.eventType}
            </span>
          )}
          {rule.trigger.type === 'manual' && <span>{rule.trigger.buttonLabel || 'Manual'}</span>}
          {rule.trigger.type === 'time_relative' && (
            <span>{rule.trigger.offsetMinutes}m offset</span>
          )}
          {rule.trigger.type === 'data_condition' && <span>Condition</span>}
        </div>

        <ChevronRight className="h-4 w-4 text-[var(--hivelab-text-tertiary)]" />

        {/* Actions */}
        {rule.actions.map((action, i) => {
          const ActionIcon = ACTION_ICONS[action.type] || Zap;
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-white/5 text-[var(--hivelab-text-secondary)]"
            >
              <ActionIcon className="h-3 w-3" />
              <span>
                {action.type === 'visibility' && action.targetSlotId && (
                  <>{action.visible ? 'Show' : 'Hide'} {action.targetSlotId}</>
                )}
                {action.type === 'notification' && 'Notify'}
                {action.type === 'data_flow' && 'Flow data'}
                {action.type === 'config' && 'Update config'}
                {action.type === 'state' && 'Update state'}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

interface Space {
  id: string;
  name: string;
  handle?: string;
  memberCount?: number;
}

async function fetchUserSpaces(): Promise<Space[]> {
  const response = await fetch('/api/profile/my-spaces?limit=50', {
    credentials: 'include',
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.spaces || [];
}

export default function SetupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shouldReduceMotion = useReducedMotion();
  const setupId = params.setupId as string;
  const [showDeployModal, setShowDeployModal] = React.useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = React.useState<string | null>(null);
  const [deploying, setDeploying] = React.useState(false);

  const { data: setup, isLoading, error } = useQuery({
    queryKey: ['setup-template', setupId],
    queryFn: () => fetchSetupTemplate(setupId),
    enabled: !!setupId,
  });

  const { data: userSpaces = [] } = useQuery({
    queryKey: ['user-spaces-for-deploy'],
    queryFn: fetchUserSpaces,
    enabled: showDeployModal,
  });

  const handleDeploy = async () => {
    if (!selectedSpaceId || !setup) return;
    setDeploying(true);
    try {
      const response = await fetch('/api/setups/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          templateId: setup.id,
          spaceId: selectedSpaceId,
          config: {},
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Deploy failed');
      }
      await response.json();
      setShowDeployModal(false);
      // Navigate to the space
      const space = userSpaces.find(s => s.id === selectedSpaceId);
      if (space?.handle) {
        router.push(`/s/${space.handle}`);
      } else {
        router.push('/spaces');
      }
    } catch (err) {
      console.error('Deploy error:', err);
      alert(err instanceof Error ? err.message : 'Failed to deploy setup');
    } finally {
      setDeploying(false);
    }
  };

  const categoryConfig = setup
    ? CATEGORY_CONFIG[setup.category] || CATEGORY_CONFIG.event
    : CATEGORY_CONFIG.event;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-ground)]">
        <BrandSpinner size="md" variant="neutral" />
      </div>
    );
  }

  if (error || !setup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-ground)]">
        <p className="text-lg mb-4 text-[var(--hivelab-text-primary)]">
          Setup not found
        </p>
        <Link
          href="/lab/setups"
          className="text-sm transition-colors text-[var(--life-gold)] hover:brightness-110"
        >
          Back to Setups
        </Link>
      </div>
    );
  }

  const CategoryIcon = categoryConfig.icon;

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Link
            href="/lab/setups"
            className="inline-flex items-center gap-2 text-sm transition-colors mb-8 text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Setups
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: `${categoryConfig.color}15` }}
            >
              <CategoryIcon className="h-8 w-8" style={{ color: categoryConfig.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-medium text-[var(--hivelab-text-primary)]">
                  {setup.name}
                </h1>
                {setup.isFeatured && (
                  <Sparkles className="h-5 w-5 text-[var(--life-gold)]" />
                )}
              </div>
              <p className="text-sm mb-3 text-[var(--hivelab-text-secondary)]">
                {setup.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-[var(--hivelab-text-tertiary)]">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  {setup.tools.length} tools
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  {setup.orchestration.length} rules
                </span>
                {setup.deploymentCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Play className="h-4 w-4" />
                    {setup.deploymentCount} deployed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowDeployModal(true)}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Deploy to Space
            </Button>
            {!setup.isSystem && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/lab/setups/${setupId}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </motion.div>

        {/* Tool Slots */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-sm font-medium mb-4 text-[var(--hivelab-text-secondary)]">
            Tool Slots
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {setup.tools.map((slot, index) => (
              <ToolSlotCard key={slot.slotId} slot={slot} index={index} />
            ))}
          </div>
        </motion.section>

        {/* Orchestration Rules */}
        {setup.orchestration.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-sm font-medium mb-4 text-[var(--hivelab-text-secondary)]">
              Orchestration Rules
            </h2>
            <div className="space-y-3">
              {setup.orchestration.map((rule, index) => (
                <OrchestrationRuleCard key={rule.id} rule={rule} index={index} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Configuration Fields Preview */}
        {setup.configFields.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-sm font-medium mb-4 text-[var(--hivelab-text-secondary)]">
              Configuration Fields
            </h2>
            <div className="p-4 rounded-lg border bg-[var(--hivelab-surface)] border-[var(--hivelab-border)]">
              <p className="text-xs mb-3 text-[var(--hivelab-text-tertiary)]">
                These fields will be configured when deploying:
              </p>
              <div className="space-y-2">
                {setup.configFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <span className="text-sm text-[var(--hivelab-text-primary)]">
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="text-label-xs text-red-400">Required</span>
                    )}
                    <span className="text-label-xs px-1.5 py-0.5 rounded bg-white/5 text-[var(--hivelab-text-tertiary)]">
                      {field.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Tags */}
        {setup.tags.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <h2 className="text-sm font-medium mb-4 text-[var(--hivelab-text-secondary)]">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {setup.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs bg-white/5 text-[var(--hivelab-text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Deploy Modal with Space Selector */}
        <AnimatePresence>
          {showDeployModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
              onClick={() => setShowDeployModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="w-full max-w-md p-6 rounded-xl bg-[var(--hivelab-surface)]"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-medium mb-2 text-[var(--hivelab-text-primary)]">
                  Deploy Setup
                </h3>
                <p className="text-sm mb-6 text-[var(--hivelab-text-secondary)]">
                  Select a space to deploy "{setup.name}" to. This will install all {setup.tools.length} tools
                  with orchestration rules.
                </p>

                {/* Space Selector */}
                <div className="mb-6 space-y-2">
                  <label className="text-xs font-medium text-[var(--hivelab-text-secondary)]">
                    Select Space
                  </label>
                  {userSpaces.length === 0 ? (
                    <div className="p-4 rounded-lg text-center text-sm bg-white/[0.03] text-[var(--hivelab-text-tertiary)]">
                      You need to lead a space to deploy setups
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userSpaces.map((space) => (
                        <button
                          key={space.id}
                          onClick={() => setSelectedSpaceId(space.id)}
                          className={`w-full p-3 rounded-lg text-left transition-all border ${
                            selectedSpaceId === space.id
                              ? 'bg-[var(--life-gold)]/15 border-[var(--life-gold)]'
                              : 'bg-white/[0.03] border-[var(--hivelab-border)]'
                          }`}
                        >
                          <div className="font-medium text-sm text-[var(--hivelab-text-primary)]">
                            {space.name}
                          </div>
                          {space.handle && (
                            <div className="text-xs text-[var(--hivelab-text-tertiary)]">
                              @{space.handle}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setShowDeployModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeploy}
                    disabled={!selectedSpaceId || deploying}
                  >
                    {deploying ? 'Deploying...' : 'Deploy'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
