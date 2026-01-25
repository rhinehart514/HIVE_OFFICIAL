'use client';

/**
 * /tools/setups/[setupId] — Setup Detail Page
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

const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  bg: 'var(--bg-ground, #0A0A09)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
};

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
      className="p-4 rounded-lg border"
      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <PlacementIcon className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
          </div>
          <span className="font-medium text-sm" style={{ color: COLORS.text }}>
            {slot.name}
          </span>
        </div>
        {slot.initiallyVisible ? (
          <Eye className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
        ) : (
          <EyeOff className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
        )}
      </div>
      {slot.description && (
        <p className="text-xs mb-2" style={{ color: COLORS.textTertiary }}>
          {slot.description}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span
          className="text-label-xs px-2 py-0.5 rounded-full capitalize"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textSecondary }}
        >
          {slot.placement}
        </span>
        <span className="text-label-xs" style={{ color: COLORS.textTertiary }}>
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
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: rule.enabled ? COLORS.border : 'rgba(255, 255, 255, 0.04)',
        opacity: rule.enabled ? 1 : 0.6,
      }}
    >
      {/* Rule header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded"
            style={{ backgroundColor: `${COLORS.gold}15` }}
          >
            <TriggerIcon className="h-4 w-4" style={{ color: COLORS.gold }} />
          </div>
          <div>
            <span className="font-medium text-sm" style={{ color: COLORS.text }}>
              {rule.name}
            </span>
            {!rule.enabled && (
              <span
                className="ml-2 text-label-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textTertiary }}
              >
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>

      {rule.description && (
        <p className="text-xs mb-3" style={{ color: COLORS.textTertiary }}>
          {rule.description}
        </p>
      )}

      {/* Trigger -> Actions flow */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Trigger */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textSecondary }}
        >
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

        <ChevronRight className="h-4 w-4" style={{ color: COLORS.textTertiary }} />

        {/* Actions */}
        {rule.actions.map((action, i) => {
          const ActionIcon = ACTION_ICONS[action.type] || Zap;
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textSecondary }}
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

export default function SetupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shouldReduceMotion = useReducedMotion();
  const setupId = params.setupId as string;
  const [showDeployModal, setShowDeployModal] = React.useState(false);

  const { data: setup, isLoading, error } = useQuery({
    queryKey: ['setup-template', setupId],
    queryFn: () => fetchSetupTemplate(setupId),
    enabled: !!setupId,
  });

  const categoryConfig = setup
    ? CATEGORY_CONFIG[setup.category] || CATEGORY_CONFIG.event
    : CATEGORY_CONFIG.event;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <BrandSpinner size="md" variant="neutral" />
      </div>
    );
  }

  if (error || !setup) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <p className="text-lg mb-4" style={{ color: COLORS.text }}>
          Setup not found
        </p>
        <Link
          href="/tools/setups"
          className="text-sm transition-colors"
          style={{ color: COLORS.gold }}
        >
          Back to Setups
        </Link>
      </div>
    );
  }

  const CategoryIcon = categoryConfig.icon;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Link
            href="/tools/setups"
            className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
            style={{ color: COLORS.textSecondary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textSecondary)}
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
                <h1 className="text-2xl font-medium" style={{ color: COLORS.text }}>
                  {setup.name}
                </h1>
                {setup.isFeatured && (
                  <Sparkles className="h-5 w-5" style={{ color: COLORS.gold }} />
                )}
              </div>
              <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>
                {setup.description}
              </p>
              <div className="flex items-center gap-4 text-sm" style={{ color: COLORS.textTertiary }}>
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
                onClick={() => router.push(`/tools/setups/${setupId}/edit`)}
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
          <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
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
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
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
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
              Configuration Fields
            </h2>
            <div
              className="p-4 rounded-lg border"
              style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            >
              <p className="text-xs mb-3" style={{ color: COLORS.textTertiary }}>
                These fields will be configured when deploying:
              </p>
              <div className="space-y-2">
                {setup.configFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: COLORS.text }}>
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="text-label-xs text-red-400">Required</span>
                    )}
                    <span
                      className="text-label-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textTertiary }}
                    >
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
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {setup.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textSecondary }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Deploy Modal Placeholder */}
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
                className="w-full max-w-md p-6 rounded-xl"
                style={{ backgroundColor: COLORS.surface }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-medium mb-4" style={{ color: COLORS.text }}>
                  Deploy Setup
                </h3>
                <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
                  Select a space to deploy "{setup.name}" to. This will install all {setup.tools.length} tools
                  with orchestration rules.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setShowDeployModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => router.push(`/api/setups/deploy?template=${setup.id}`)}>
                    Select Space
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
