import {
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CubeIcon,
  PauseIcon,
  PlayIcon,
  Cog6ToothIcon,
  SparklesIcon,
  UsersIcon,
  WrenchIcon,
  XCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import * as React from 'react';

// Aliases for lucide compatibility
const Activity = ChartBarIcon;
const Calendar = CalendarIcon;
const CheckCircle = CheckCircleIcon;
const ChevronDown = ChevronDownIcon;
const ChevronRight = ChevronRightIcon;
const Clock = ClockIcon;
const Eye = EyeIcon;
const EyeOff = EyeSlashIcon;
const Loader2 = ArrowPathIcon;
const Package = CubeIcon;
const Pause = PauseIcon;
const Play = PlayIcon;
const RefreshCw = ArrowPathIcon;
const Settings = Cog6ToothIcon;
const Sparkles = SparklesIcon;
const Users = UsersIcon;
const Wrench = WrenchIcon;
const XCircle = XCircleIcon;
const Zap = BoltIcon;

import { Button } from '../../design-system/primitives';
import { Card } from '../../design-system/primitives';

// ============================================================================
// Types
// ============================================================================

export interface SetupToolItem {
  slotId: string;
  name: string;
  description?: string;
  icon?: string;
  deploymentId: string;
  isVisible: boolean;
  config: Record<string, unknown>;
}

export interface OrchestrationLogItem {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;
  triggerType: 'tool_event' | 'time_relative' | 'data_condition' | 'manual';
  success: boolean;
  actionsExecuted: Array<{
    actionType: string;
    targetSlotId?: string;
    success: boolean;
    error?: string;
  }>;
  triggeredBy?: string;
}

export interface OrchestrationRuleItem {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: 'tool_event' | 'time_relative' | 'data_condition' | 'manual';
    description?: string;
  };
  enabled: boolean;
  runOnce: boolean;
  hasExecuted: boolean;
}

export interface SetupDeploymentItem {
  id: string;
  templateId: string;
  templateName: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  tools: SetupToolItem[];
  orchestrationRules: OrchestrationRuleItem[];
  orchestrationLog: OrchestrationLogItem[];
  sharedData: Record<string, unknown>;
  config: Record<string, unknown>;
  deployedBy: string;
  deployedAt: string;
  updatedAt: string;
}

export interface SetupDashboardProps {
  deployment: SetupDeploymentItem;
  isLoading?: boolean;
  isSyncing?: boolean;
  onTriggerRule?: (ruleId: string) => Promise<void>;
  onUpdateStatus?: (status: 'active' | 'paused' | 'completed' | 'archived') => Promise<void>;
  onToggleToolVisibility?: (slotId: string, visible: boolean) => Promise<void>;
  onRefresh?: () => void;
  onOpenTool?: (deploymentId: string) => void;
}

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: SetupDeploymentItem['status'] }) {
  const styles = {
    active: 'bg-green-500/10 text-green-400 border-green-500/30',
    paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    archived: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
  };

  const labels = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    archived: 'Archived',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ============================================================================
// Trigger Type Icon
// ============================================================================

function TriggerTypeIcon({ type }: { type: OrchestrationRuleItem['trigger']['type'] }) {
  const icons = {
    tool_event: <Zap className="h-3.5 w-3.5" />,
    time_relative: <Clock className="h-3.5 w-3.5" />,
    data_condition: <Activity className="h-3.5 w-3.5" />,
    manual: <Play className="h-3.5 w-3.5" />,
  };

  return icons[type] || <Settings className="h-3.5 w-3.5" />;
}

// ============================================================================
// Component
// ============================================================================

export function SetupDashboard({
  deployment,
  isLoading = false,
  isSyncing = false,
  onTriggerRule,
  onUpdateStatus,
  onToggleToolVisibility,
  onRefresh,
  onOpenTool,
}: SetupDashboardProps) {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    tools: true,
    orchestration: false,
    log: false,
    data: false,
  });
  const [triggeringRule, setTriggeringRule] = React.useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTriggerRule = async (ruleId: string) => {
    if (!onTriggerRule) return;
    setTriggeringRule(ruleId);
    try {
      await onTriggerRule(ruleId);
    } finally {
      setTriggeringRule(null);
    }
  };

  const manualRules = deployment.orchestrationRules.filter(
    r => r.trigger.type === 'manual' && r.enabled && (!r.runOnce || !r.hasExecuted)
  );

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--hive-text-secondary)]" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--hive-background-secondary)] rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-[var(--hive-text-secondary)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-[var(--hive-text-primary)]">{deployment.templateName}</h2>
                <StatusBadge status={deployment.status} />
                {isSyncing && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--hive-text-secondary)]" />
                )}
              </div>
              <p className="text-sm text-[var(--hive-text-secondary)]">
                Deployed {new Date(deployment.deployedAt).toLocaleDateString()} · {deployment.tools.length} tools
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-[var(--hive-text-secondary)]"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onUpdateStatus && deployment.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus('paused')}
                className="border-[var(--hive-border-primary)]"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {onUpdateStatus && deployment.status === 'paused' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus('active')}
                className="border-[var(--hive-border-primary)]"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
          </div>
        </div>

        {/* Manual Triggers */}
        {manualRules.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--hive-border-primary)]">
            <p className="text-xs text-[var(--hive-text-secondary)] mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {manualRules.map((rule) => (
                <Button
                  key={rule.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTriggerRule(rule.id)}
                  disabled={triggeringRule === rule.id}
                  className="border-[var(--hive-border-primary)]"
                >
                  {triggeringRule === rule.id ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 mr-1.5 text-[var(--hive-accent-gold)]" />
                  )}
                  {rule.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Tools Section */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('tools')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--hive-background-secondary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[var(--hive-text-secondary)]" />
            <span className="font-medium text-[var(--hive-text-primary)]">Apps</span>
            <span className="text-xs text-[var(--hive-text-subtle)]">
              {deployment.tools.filter(t => t.isVisible).length}/{deployment.tools.length} visible
            </span>
          </div>
          {expandedSections.tools ? (
            <ChevronDown className="h-4 w-4 text-[var(--hive-text-secondary)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--hive-text-secondary)]" />
          )}
        </button>
        {expandedSections.tools && (
          <div className="px-4 pb-4 space-y-2">
            {deployment.tools.map((tool) => (
              <div
                key={tool.slotId}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--hive-background-secondary)]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    tool.isVisible ? 'bg-green-500/10 text-green-400' : 'bg-neutral-500/10 text-neutral-400'
                  }`}>
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--hive-text-primary)]">{tool.name}</span>
                      {tool.isVisible ? (
                        <Eye className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-neutral-400" />
                      )}
                    </div>
                    {tool.description && (
                      <p className="text-xs text-[var(--hive-text-secondary)]">{tool.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onToggleToolVisibility && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleToolVisibility(tool.slotId, !tool.isVisible)}
                      className="text-[var(--hive-text-secondary)]"
                    >
                      {tool.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                  {onOpenTool && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenTool(tool.deploymentId)}
                      className="border-[var(--hive-border-primary)]"
                    >
                      Open
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Orchestration Rules Section */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('orchestration')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--hive-background-secondary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[var(--hive-text-secondary)]" />
            <span className="font-medium text-[var(--hive-text-primary)]">Orchestration Rules</span>
            <span className="text-xs text-[var(--hive-text-subtle)]">
              {deployment.orchestrationRules.length} rules
            </span>
          </div>
          {expandedSections.orchestration ? (
            <ChevronDown className="h-4 w-4 text-[var(--hive-text-secondary)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--hive-text-secondary)]" />
          )}
        </button>
        {expandedSections.orchestration && (
          <div className="px-4 pb-4 space-y-2">
            {deployment.orchestrationRules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  rule.enabled ? 'bg-[var(--hive-background-secondary)]' : 'bg-[var(--hive-background-secondary)]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    rule.enabled ? 'bg-[var(--hive-accent-gold)]/10 text-[var(--hive-accent-gold)]' : 'bg-neutral-500/10 text-neutral-400'
                  }`}>
                    <TriggerTypeIcon type={rule.trigger.type} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${rule.enabled ? 'text-[var(--hive-text-primary)]' : 'text-[var(--hive-text-secondary)]'}`}>
                        {rule.name}
                      </span>
                      {rule.runOnce && rule.hasExecuted && (
                        <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                      )}
                      {!rule.enabled && (
                        <span className="text-xs text-neutral-400">Disabled</span>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-xs text-[var(--hive-text-secondary)]">{rule.description}</p>
                    )}
                    <p className="text-xs text-[var(--hive-text-subtle)] mt-0.5">
                      {rule.trigger.type === 'tool_event' && 'Triggered by tool event'}
                      {rule.trigger.type === 'time_relative' && 'Time-based trigger'}
                      {rule.trigger.type === 'data_condition' && 'Triggered by data condition'}
                      {rule.trigger.type === 'manual' && 'Manual trigger'}
                      {rule.runOnce && ' · Runs once'}
                    </p>
                  </div>
                </div>
                {rule.trigger.type === 'manual' && rule.enabled && (!rule.runOnce || !rule.hasExecuted) && onTriggerRule && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTriggerRule(rule.id)}
                    disabled={triggeringRule === rule.id}
                    className="border-[var(--hive-border-primary)]"
                  >
                    {triggeringRule === rule.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Trigger'
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activity Log Section */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('log')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--hive-background-secondary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--hive-text-secondary)]" />
            <span className="font-medium text-[var(--hive-text-primary)]">Activity Log</span>
            <span className="text-xs text-[var(--hive-text-subtle)]">
              {deployment.orchestrationLog.length} entries
            </span>
          </div>
          {expandedSections.log ? (
            <ChevronDown className="h-4 w-4 text-[var(--hive-text-secondary)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--hive-text-secondary)]" />
          )}
        </button>
        {expandedSections.log && (
          <div className="px-4 pb-4">
            {deployment.orchestrationLog.length === 0 ? (
              <p className="text-sm text-[var(--hive-text-secondary)] text-center py-4">
                No activity yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {deployment.orchestrationLog.slice().reverse().map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2 rounded bg-[var(--hive-background-secondary)]"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      log.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {log.success ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--hive-text-primary)]">
                          {log.ruleName}
                        </span>
                        <TriggerTypeIcon type={log.triggerType} />
                      </div>
                      <p className="text-xs text-[var(--hive-text-secondary)]">
                        {log.actionsExecuted.length} action{log.actionsExecuted.length !== 1 ? 's' : ''} executed
                      </p>
                      <p className="text-xs text-[var(--hive-text-subtle)]">
                        {new Date(log.triggeredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Shared Data Section */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('data')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--hive-background-secondary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--hive-text-secondary)]" />
            <span className="font-medium text-[var(--hive-text-primary)]">Shared Data</span>
            <span className="text-xs text-[var(--hive-text-subtle)]">
              {Object.keys(deployment.sharedData).length} keys
            </span>
          </div>
          {expandedSections.data ? (
            <ChevronDown className="h-4 w-4 text-[var(--hive-text-secondary)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--hive-text-secondary)]" />
          )}
        </button>
        {expandedSections.data && (
          <div className="px-4 pb-4">
            {Object.keys(deployment.sharedData).length === 0 ? (
              <p className="text-sm text-[var(--hive-text-secondary)] text-center py-4">
                No shared data yet
              </p>
            ) : (
              <div className="space-y-2 font-sans text-xs">
                {Object.entries(deployment.sharedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 rounded bg-[var(--hive-background-secondary)]">
                    <span className="text-[var(--hive-text-secondary)]">{key}</span>
                    <span className="text-[var(--hive-text-primary)]">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
