'use client';

/**
 * Automations Panel
 *
 * Displays active automations for a space.
 * Part of HiveLab Phase 3 - gives leaders visibility into their automations.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Settings,
} from 'lucide-react';
import { Button } from '../../atomic/00-Global/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../atomic/00-Global/atoms/card';

export interface AutomationItem {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    type: string;
    config: Record<string, unknown>;
  };
  action: {
    type: string;
    config: Record<string, unknown>;
  };
  stats: {
    timesTriggered: number;
    lastTriggered?: string;
    successCount: number;
    failureCount: number;
  };
}

interface AutomationsPanelProps {
  automations: AutomationItem[];
  isLeader: boolean;
  isLoading?: boolean;
  onToggle?: (id: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onAdd?: () => void;
  onSettings?: () => void;
}

const TRIGGER_ICONS: Record<string, string> = {
  member_join: '👋',
  event_reminder: '⏰',
  schedule: '📅',
  keyword: '🔍',
  reaction_threshold: '⭐',
};

const TRIGGER_LABELS: Record<string, string> = {
  member_join: 'New members',
  event_reminder: 'Event reminders',
  schedule: 'Scheduled',
  keyword: 'Keywords',
  reaction_threshold: 'Reactions',
};

export function AutomationsPanel({
  automations,
  isLeader,
  isLoading,
  onToggle,
  onDelete,
  onAdd,
  onSettings,
}: AutomationsPanelProps) {
  const [expanded, setExpanded] = React.useState(true);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const handleToggle = async (id: string) => {
    if (!onToggle || togglingId) return;
    setTogglingId(id);
    await onToggle(id);
    setTogglingId(null);
  };

  const activeCount = automations.filter(a => a.enabled).length;

  if (!isLeader) {
    return null; // Only show to leaders
  }

  if (automations.length === 0 && !isLoading) {
    return (
      <Card className="border-dashed border-border/50 bg-background/50">
        <CardContent className="py-4">
          <div className="text-center space-y-2">
            <Zap className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No automations yet</p>
            <p className="text-xs text-muted-foreground/70">
              Type <code className="px-1 py-0.5 bg-muted rounded">/welcome</code> to set up a welcome message
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm font-medium">
              Automations
            </CardTitle>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-500 rounded-full">
                {activeCount} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onAdd && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="py-2 px-2 space-y-1">
              {automations.map((automation) => (
                <AutomationRow
                  key={automation.id}
                  automation={automation}
                  isToggling={togglingId === automation.id}
                  onToggle={() => handleToggle(automation.id)}
                  onDelete={onDelete ? () => onDelete(automation.id) : undefined}
                />
              ))}

              {onSettings && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={onSettings}
                >
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  Manage automations
                </Button>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface AutomationRowProps {
  automation: AutomationItem;
  isToggling: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

function AutomationRow({
  automation,
  isToggling,
  onToggle,
  onDelete,
}: AutomationRowProps) {
  const [showDelete, setShowDelete] = React.useState(false);

  const triggerIcon = TRIGGER_ICONS[automation.trigger.type] || '⚡';
  const triggerLabel = TRIGGER_LABELS[automation.trigger.type] || 'Custom';

  return (
    <motion.div
      className={`
        relative flex items-center gap-2 p-2 rounded-lg
        ${automation.enabled ? 'bg-muted/30' : 'bg-muted/10 opacity-60'}
        hover:bg-muted/50 transition-colors group
      `}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <span className="text-base flex-shrink-0">{triggerIcon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{automation.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {triggerLabel}
          {automation.stats.timesTriggered > 0 && (
            <span className="ml-1">
              · {automation.stats.timesTriggered} runs
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <AnimatePresence>
          {showDelete && onDelete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive/70 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          disabled={isToggling}
          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {automation.enabled ? (
            <ToggleRight className="h-5 w-5 text-amber-500" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Compact variant for sidebar
 */
export function AutomationsBadge({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-medium hover:bg-amber-500/30 transition-colors"
    >
      <Zap className="h-3 w-3" />
      {count} automation{count !== 1 ? 's' : ''}
    </button>
  );
}
