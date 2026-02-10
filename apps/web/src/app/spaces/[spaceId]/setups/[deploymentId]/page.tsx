'use client';

/**
 * /spaces/[spaceId]/setups/[deploymentId] — Orchestration Monitor
 *
 * Monitor setup deployment status, view execution history,
 * and manually trigger rules.
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  ChevronRight,
  RefreshCw,
  Layers,
  Activity,
  Timer,
} from 'lucide-react';
import { BrandSpinner, Button } from '@hive/ui';
const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  bg: 'var(--bg-ground, #0A0A09)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
};

// Status colors
const STATUS_CONFIG = {
  active: { color: '#10B981', icon: CheckCircle, label: 'Active' },
  paused: { color: '#F59E0B', icon: Pause, label: 'Paused' },
  error: { color: '#EF4444', icon: XCircle, label: 'Error' },
  pending: { color: '#6366F1', icon: AlertCircle, label: 'Pending' },
};

// Trigger type icons
const TRIGGER_ICONS = {
  tool_event: Zap,
  time_relative: Timer,
  data_condition: Activity,
  manual: Play,
};

interface OrchestrationRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: 'tool_event' | 'time_relative' | 'data_condition' | 'manual';
    config: Record<string, unknown>;
  };
  actions: Array<{
    type: string;
    targetSlot: string;
    config: Record<string, unknown>;
  }>;
  isActive: boolean;
}

interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'failed';
  triggeredBy: 'system' | 'manual';
  error?: string;
}

interface SetupDeploymentDetail {
  id: string;
  templateId: string;
  templateName: string;
  templateIcon: string;
  category: string;
  status: string;
  toolCount: number;
  tools: Array<{
    slotId: string;
    toolId: string;
    toolName: string;
    isActive: boolean;
  }>;
  rules: OrchestrationRule[];
  deployedAt: string;
  deployedBy: string;
  lastExecutionAt?: string;
  executionCount: number;
  executionLog: ExecutionLog[];
  configValues: Record<string, unknown>;
}

interface SpaceInfo {
  id: string;
  name: string;
  canManage: boolean;
}

async function fetchDeploymentDetail(
  spaceId: string,
  deploymentId: string
): Promise<{ deployment: SetupDeploymentDetail; space: SpaceInfo }> {
  const [deploymentRes, spaceRes] = await Promise.all([
    fetch(`/api/setups/deployments/${deploymentId}`),
    fetch(`/api/spaces/${spaceId}`),
  ]);

  if (!deploymentRes.ok) throw new Error('Failed to fetch deployment');
  if (!spaceRes.ok) throw new Error('Failed to fetch space');

  const [deploymentData, spaceData] = await Promise.all([
    deploymentRes.json(),
    spaceRes.json(),
  ]);

  return {
    deployment: deploymentData.deployment,
    space: {
      id: spaceData.space?.id || spaceId,
      name: spaceData.space?.name || 'Space',
      canManage: ['owner', 'admin', 'moderator'].includes(spaceData.membership?.role || ''),
    },
  };
}

async function triggerRule(deploymentId: string, ruleId: string): Promise<void> {
  const res = await fetch('/api/setups/orchestration/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deploymentId,
      ruleId,
      manualTrigger: true,
    }),
  });
  if (!res.ok) throw new Error('Failed to trigger rule');
}

async function updateDeploymentStatus(
  deploymentId: string,
  status: 'active' | 'paused'
): Promise<void> {
  const res = await fetch(`/api/setups/deployments/${deploymentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update deployment');
}

/**
 * RuleCard — Orchestration rule with manual trigger
 */
function RuleCard({
  rule,
  canManage,
  onTrigger,
  isTriggering,
}: {
  rule: OrchestrationRule;
  canManage: boolean;
  onTrigger: () => void;
  isTriggering: boolean;
}) {
  const TriggerIcon = TRIGGER_ICONS[rule.trigger.type] || Zap;

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: rule.isActive ? COLORS.border : 'rgba(255, 255, 255, 0.04)',
        opacity: rule.isActive ? 1 : 0.6,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <TriggerIcon className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm" style={{ color: COLORS.text }}>
                {rule.name}
              </span>
              {!rule.isActive && (
                <span
                  className="text-label-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textTertiary }}
                >
                  Disabled
                </span>
              )}
            </div>
            {rule.description && (
              <p className="text-xs mt-1" style={{ color: COLORS.textTertiary }}>
                {rule.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-label-xs" style={{ color: COLORS.textTertiary }}>
              <span className="capitalize">{rule.trigger.type.replace('_', ' ')}</span>
              <span>{rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Manual trigger button */}
        {canManage && rule.trigger.type === 'manual' && rule.isActive && (
          <Button
            onClick={onTrigger}
            disabled={isTriggering}
            className="flex items-center gap-2"
            style={{ minWidth: 80 }}
          >
            {isTriggering ? (
              <RefreshCw className="h-3.5 w-3.5 " />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * ExecutionLogItem — Timeline item for execution history
 */
function ExecutionLogItem({ log }: { log: ExecutionLog }) {
  const statusConfig = {
    running: { color: '#6366F1', icon: RefreshCw, label: 'Running' },
    success: { color: '#10B981', icon: CheckCircle, label: 'Success' },
    failed: { color: '#EF4444', icon: XCircle, label: 'Failed' },
  };

  const config = statusConfig[log.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <div className="w-px flex-1 bg-white/[0.06] mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: COLORS.text }}>
              {log.ruleName}
            </span>
            <StatusIcon
              className={`h-3.5 w-3.5 ${log.status === 'running' ? '' : ''}`}
              style={{ color: config.color }}
            />
          </div>
          <span className="text-xs" style={{ color: COLORS.textTertiary }}>
            {new Date(log.triggeredAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: COLORS.textTertiary }}>
          <span className="capitalize">{log.triggeredBy}</span>
          {log.completedAt && (
            <span>
              Duration: {Math.round((new Date(log.completedAt).getTime() - new Date(log.triggeredAt).getTime()) / 1000)}s
            </span>
          )}
        </div>

        {log.error && (
          <p className="mt-2 text-xs px-2 py-1 rounded bg-red-500/10" style={{ color: '#EF4444' }}>
            {log.error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SetupDeploymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const spaceId = params.spaceId as string;
  const deploymentId = params.deploymentId as string;

  const [triggeringRuleId, setTriggeringRuleId] = React.useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['setup-deployment', deploymentId],
    queryFn: () => fetchDeploymentDetail(spaceId, deploymentId),
    enabled: !!spaceId && !!deploymentId,
    refetchInterval: 10000, // Poll for execution updates
  });

  const triggerMutation = useMutation({
    mutationFn: (ruleId: string) => triggerRule(deploymentId, ruleId),
    onMutate: (ruleId) => setTriggeringRuleId(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-deployment', deploymentId] });
      toast.success('Rule triggered');
    },
    onError: () => toast.error('Failed to trigger rule'),
    onSettled: () => setTriggeringRuleId(null),
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'active' | 'paused') => updateDeploymentStatus(deploymentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-deployment', deploymentId] });
      toast.success('Deployment updated');
    },
    onError: () => toast.error('Failed to update deployment'),
  });

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

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <p className="text-lg mb-4" style={{ color: COLORS.text }}>
          Unable to load deployment
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm"
          style={{ color: COLORS.gold }}
        >
          Go back
        </button>
      </div>
    );
  }

  const { deployment, space } = data;
  const statusConfig = STATUS_CONFIG[deployment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  const activeRules = deployment.rules?.filter((r) => r.isActive) || [];
  const manualRules = activeRules.filter((r) => r.trigger.type === 'manual');

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/spaces/${spaceId}/setups`}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-medium" style={{ color: COLORS.text }}>
                  {deployment.templateName}
                </h1>
                <StatusIcon className="h-5 w-5" style={{ color: statusConfig.color }} />
              </div>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                {space.name} • {deployment.category}
              </p>
            </div>
          </div>

          {space.canManage && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  statusMutation.mutate(deployment.status === 'active' ? 'paused' : 'active')
                }
                disabled={statusMutation.isPending}
                className="flex items-center gap-2"
              >
                {deployment.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          className="grid grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Tools', value: deployment.toolCount, icon: Layers },
            { label: 'Active Rules', value: activeRules.length, icon: Zap },
            { label: 'Total Runs', value: deployment.executionCount, icon: Activity },
            {
              label: 'Last Run',
              value: deployment.lastExecutionAt
                ? new Date(deployment.lastExecutionAt).toLocaleDateString()
                : 'Never',
              icon: Clock,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg border"
              style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
                <span className="text-xs" style={{ color: COLORS.textTertiary }}>
                  {stat.label}
                </span>
              </div>
              <p className="text-lg font-medium" style={{ color: COLORS.text }}>
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Rules */}
          <div>
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
              Orchestration Rules ({deployment.rules?.length || 0})
            </h2>

            {deployment.rules?.length === 0 ? (
              <div
                className="text-center py-8 rounded-lg border"
                style={{ borderColor: COLORS.border }}
              >
                <p className="text-sm" style={{ color: COLORS.textTertiary }}>
                  No orchestration rules configured
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deployment.rules?.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    canManage={space.canManage}
                    onTrigger={() => triggerMutation.mutate(rule.id)}
                    isTriggering={triggeringRuleId === rule.id}
                  />
                ))}
              </div>
            )}

            {/* Quick actions for manual rules */}
            {manualRules.length > 0 && space.canManage && (
              <div className="mt-6">
                <h3 className="text-xs font-medium mb-3" style={{ color: COLORS.textTertiary }}>
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {manualRules.map((rule) => (
                    <Button
                      key={rule.id}
                      onClick={() => triggerMutation.mutate(rule.id)}
                      disabled={triggeringRuleId === rule.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Play className="h-3 w-3" />
                      {rule.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Execution Log */}
          <div>
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
              Execution History
            </h2>

            {deployment.executionLog?.length === 0 ? (
              <div
                className="text-center py-8 rounded-lg border"
                style={{ borderColor: COLORS.border }}
              >
                <Activity className="h-8 w-8 mx-auto mb-2" style={{ color: COLORS.textTertiary }} />
                <p className="text-sm" style={{ color: COLORS.textTertiary }}>
                  No executions yet
                </p>
              </div>
            ) : (
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
              >
                {deployment.executionLog?.map((log) => (
                  <ExecutionLogItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deployed Tools */}
        <div className="mt-8">
          <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
            Deployed Tools ({deployment.tools?.length || 0})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deployment.tools?.map((tool) => (
              <Link
                key={tool.slotId}
                href={`/spaces/${spaceId}/tools/${tool.toolId}`}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:border-white/15"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  opacity: tool.isActive ? 1 : 0.6,
                }}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <Layers className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: COLORS.text }}>
                    {tool.toolName}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textTertiary }}>
                    {tool.isActive ? 'Active' : 'Paused'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Deployment info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 pt-6 border-t"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-6 text-xs" style={{ color: COLORS.textTertiary }}>
            <span>
              Deployed {new Date(deployment.deployedAt).toLocaleDateString()}
            </span>
            <span>by {deployment.deployedBy}</span>
            <Link
              href={`/lab/setups/${deployment.templateId}`}
              className="hover:text-white transition-colors"
            >
              View template →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
