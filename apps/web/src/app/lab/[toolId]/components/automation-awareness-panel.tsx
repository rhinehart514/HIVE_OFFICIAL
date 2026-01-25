'use client';

/**
 * AutomationAwarenessPanel
 *
 * Shows automations that could trigger this tool's elements
 * when the tool is deployed to spaces.
 */

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Zap,
  Play,
  Clock,
  Activity,
  ChevronRight,
  Plus,
  Layers,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { BrandSpinner, Button } from '@hive/ui';

const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  bg: 'var(--hivelab-bg, #0A0A09)',
  panel: 'var(--hivelab-panel, #141414)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
};

// Trigger type icons
const TRIGGER_ICONS = {
  event: Zap,
  schedule: Clock,
  data_change: Activity,
  manual: Play,
  tool_event: Zap,
};

interface Automation {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  isActive: boolean;
  targetElementIds?: string[];
  spaceId: string;
  spaceName: string;
}

interface ToolDeployment {
  id: string;
  targetType: 'space' | 'profile';
  targetId: string;
  targetName: string;
  status: string;
  automations: Automation[];
}

interface Props {
  toolId: string;
  toolName: string;
  elementIds?: string[];
  onClose: () => void;
}

async function fetchToolAutomations(toolId: string): Promise<{
  deployments: ToolDeployment[];
  totalAutomations: number;
}> {
  // Fetch deployments for this tool
  const deploymentsRes = await fetch(`/api/tools/${toolId}/deployments`);

  if (!deploymentsRes.ok) {
    return { deployments: [], totalAutomations: 0 };
  }

  const deploymentsData = await deploymentsRes.json();
  const deployments: ToolDeployment[] = [];
  let totalAutomations = 0;

  // For each space deployment, fetch automations
  for (const deployment of deploymentsData.deployments || []) {
    if (deployment.targetType !== 'space') continue;

    try {
      const automationsRes = await fetch(
        `/api/spaces/${deployment.targetId}/automations?toolId=${toolId}&limit=10`
      );

      if (automationsRes.ok) {
        const automationsData = await automationsRes.json();
        const automations = (automationsData.automations || []).map(
          (a: Record<string, unknown>) => ({
            ...a,
            spaceId: deployment.targetId,
            spaceName: deployment.targetName || 'Space',
          })
        );

        totalAutomations += automations.length;

        deployments.push({
          id: deployment.id,
          targetType: deployment.targetType,
          targetId: deployment.targetId,
          targetName: deployment.targetName || 'Space',
          status: deployment.status,
          automations,
        });
      }
    } catch {
      // Continue with other deployments
    }
  }

  return { deployments, totalAutomations };
}

function AutomationCard({ automation }: { automation: Automation }) {
  const TriggerIcon = TRIGGER_ICONS[automation.triggerType as keyof typeof TRIGGER_ICONS] || Zap;

  return (
    <Link
      href={`/spaces/${automation.spaceId}/automations/${automation.id}`}
      className="block p-3 rounded-lg border transition-colors hover:border-white/15"
      style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <TriggerIcon className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate" style={{ color: COLORS.text }}>
              {automation.name}
            </span>
            {!automation.isActive && (
              <span
                className="text-label-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textTertiary }}
              >
                Paused
              </span>
            )}
          </div>
          {automation.description && (
            <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textTertiary }}>
              {automation.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-label-xs" style={{ color: COLORS.textTertiary }}>
            <span className="capitalize">{automation.triggerType.replace('_', ' ')}</span>
            <span>•</span>
            <span>{automation.spaceName}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: COLORS.textTertiary }} />
      </div>
    </Link>
  );
}

function DeploymentSection({ deployment }: { deployment: ToolDeployment }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
          <span className="text-sm font-medium" style={{ color: COLORS.text }}>
            {deployment.targetName}
          </span>
          <span
            className="text-label-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: deployment.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: deployment.status === 'active' ? '#10B981' : COLORS.textTertiary,
            }}
          >
            {deployment.status}
          </span>
        </div>
        <Link
          href={`/spaces/${deployment.targetId}/automations/new`}
          className="flex items-center gap-1 text-xs hover:text-white transition-colors"
          style={{ color: COLORS.gold }}
        >
          <Plus className="h-3 w-3" />
          Create
        </Link>
      </div>

      {deployment.automations.length === 0 ? (
        <div
          className="text-center py-6 rounded-lg border"
          style={{ borderColor: COLORS.border }}
        >
          <Zap className="h-6 w-6 mx-auto mb-2" style={{ color: COLORS.textTertiary }} />
          <p className="text-xs" style={{ color: COLORS.textTertiary }}>
            No automations using this tool
          </p>
          <Link
            href={`/spaces/${deployment.targetId}/automations/new`}
            className="text-xs mt-2 inline-block"
            style={{ color: COLORS.gold }}
          >
            Create one →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {deployment.automations.map((automation) => (
            <AutomationCard key={automation.id} automation={automation} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AutomationAwarenessPanel({ toolId, toolName, elementIds, onClose }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tool-automations', toolId],
    queryFn: () => fetchToolAutomations(toolId),
    staleTime: 60000,
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: COLORS.bg }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: COLORS.border }}
          >
            <div>
              <h2 className="text-lg font-medium" style={{ color: COLORS.text }}>
                Automations
              </h2>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>
                {toolName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <BrandSpinner size="md" variant="neutral" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: COLORS.textTertiary }} />
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  Failed to load automations
                </p>
              </div>
            ) : !data || data.deployments.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.textTertiary }} />
                <p className="text-lg mb-2" style={{ color: COLORS.text }}>
                  Not deployed yet
                </p>
                <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
                  Deploy this tool to a space to create automations that trigger its elements.
                </p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div
                  className="mb-6 p-4 rounded-lg"
                  style={{ backgroundColor: COLORS.panel }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-2xl font-semibold" style={{ color: COLORS.text }}>
                        {data.totalAutomations}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                        automation{data.totalAutomations !== 1 ? 's' : ''} using this tool
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-semibold" style={{ color: COLORS.text }}>
                        {data.deployments.length}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                        space deployment{data.deployments.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deployments with automations */}
                {data.deployments.map((deployment) => (
                  <DeploymentSection key={deployment.id} deployment={deployment} />
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t flex items-center justify-between"
            style={{ borderColor: COLORS.border }}
          >
            <Link
              href="/docs/automations"
              className="text-xs flex items-center gap-1 hover:text-white transition-colors"
              style={{ color: COLORS.textTertiary }}
            >
              <ExternalLink className="h-3 w-3" />
              Learn about automations
            </Link>
            <Button onClick={onClose}>Done</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
