'use client';

/**
 * /spaces/[spaceId]/setups — Active Setup Deployments
 *
 * View orchestrated tool bundles deployed to this space.
 * Shows orchestration status, manual triggers, and execution history.
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Layers,
  Zap,
  Play,
  Pause,
  Calendar,
  GitBranch,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
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

// Status colors
const STATUS_CONFIG = {
  active: { color: '#10B981', icon: CheckCircle, label: 'Active' },
  paused: { color: '#F59E0B', icon: Pause, label: 'Paused' },
  error: { color: '#EF4444', icon: XCircle, label: 'Error' },
  pending: { color: '#6366F1', icon: AlertCircle, label: 'Pending' },
};

interface SetupDeployment {
  id: string;
  templateId: string;
  templateName: string;
  templateIcon: string;
  category: string;
  status: string;
  toolCount: number;
  activeRules: number;
  deployedAt: string;
  deployedBy: string;
  lastExecutionAt?: string;
  executionCount: number;
}

async function fetchSetupDeployments(spaceId: string): Promise<SetupDeployment[]> {
  const res = await fetch(`/api/setups/deployments?spaceId=${spaceId}`);
  if (!res.ok) throw new Error('Failed to fetch setup deployments');
  const data = await res.json();
  return data.deployments || [];
}

/**
 * SetupDeploymentCard — Card for a deployed setup
 */
function SetupDeploymentCard({
  deployment,
  spaceId,
  index,
}: {
  deployment: SetupDeployment;
  spaceId: string;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const statusConfig = STATUS_CONFIG[deployment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.2,
        delay: shouldReduceMotion ? 0 : index * 0.05,
      }}
    >
      <Link
        href={`/spaces/${spaceId}/setups/${deployment.id}`}
        className="block p-4 rounded-lg border transition-colors hover:border-white/15"
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <GitBranch className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm" style={{ color: COLORS.text }}>
                  {deployment.templateName}
                </span>
                <StatusIcon className="h-4 w-4" style={{ color: statusConfig.color }} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                  style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
                >
                  {statusConfig.label}
                </span>
                <span className="text-xs" style={{ color: COLORS.textTertiary }}>
                  {deployment.category}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5" style={{ color: COLORS.textTertiary }} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs" style={{ color: COLORS.textTertiary }}>
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            {deployment.toolCount} tools
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            {deployment.activeRules} rules
          </span>
          <span className="flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5" />
            {deployment.executionCount} runs
          </span>
        </div>

        {/* Last execution */}
        {deployment.lastExecutionAt && (
          <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: COLORS.textTertiary }}>
            <Clock className="h-3 w-3" />
            Last run: {new Date(deployment.lastExecutionAt).toLocaleString()}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

export default function SpaceSetupsPage() {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.spaceId as string;

  const { data: deployments = [], isLoading, error } = useQuery({
    queryKey: ['setup-deployments', spaceId],
    queryFn: () => fetchSetupDeployments(spaceId),
    enabled: !!spaceId,
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

  const activeDeployments = deployments.filter((d) => d.status === 'active');
  const pausedDeployments = deployments.filter((d) => d.status !== 'active');

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/spaces/${spaceId}/tools`}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
            </Link>
            <div>
              <h1 className="text-xl font-medium" style={{ color: COLORS.text }}>
                Setup Deployments
              </h1>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                Orchestrated tool bundles in this space
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/tools/setups')}
            className="flex items-center gap-2"
          >
            <Layers className="h-4 w-4" />
            Browse Setups
          </Button>
        </div>

        {/* Empty state */}
        {deployments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <GitBranch
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: COLORS.textTertiary }}
            />
            <p className="text-lg mb-2" style={{ color: COLORS.text }}>
              No setups deployed
            </p>
            <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
              Setups are bundles of tools with orchestration rules for events, campaigns, and workflows.
            </p>
            <Button onClick={() => router.push('/tools/setups')}>
              Browse Setups
            </Button>
          </motion.div>
        )}

        {/* Active deployments */}
        {activeDeployments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
              Active ({activeDeployments.length})
            </h2>
            <div className="space-y-3">
              {activeDeployments.map((deployment, index) => (
                <SetupDeploymentCard
                  key={deployment.id}
                  deployment={deployment}
                  spaceId={spaceId}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Paused/Other deployments */}
        {pausedDeployments.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textTertiary }}>
              Other ({pausedDeployments.length})
            </h2>
            <div className="space-y-3">
              {pausedDeployments.map((deployment, index) => (
                <SetupDeploymentCard
                  key={deployment.id}
                  deployment={deployment}
                  spaceId={spaceId}
                  index={index + activeDeployments.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
