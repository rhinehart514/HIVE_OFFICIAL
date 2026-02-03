'use client';

/**
 * /spaces/[spaceId]/tools — Space Tools Management
 *
 * List deployed tools with quick actions (pause, configure, remove).
 * Requires leader permissions to modify.
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Shield,
  Zap,
  ChevronRight,
  ExternalLink,
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
};

// Capability lane badges
const LANE_COLORS = {
  safe: '#10B981',
  scoped: '#F59E0B',
  power: '#EF4444',
};

interface SpaceTool {
  placementId: string;
  toolId: string;
  name: string;
  description: string;
  category: string;
  placement: string;
  order: number;
  isActive: boolean;
  visibility: string;
  titleOverride?: string;
  placedAt: string;
  placedBy: string;
  surfaceModes?: { widget: boolean; app: boolean };
  deploymentId?: string;
  capabilityLane?: 'safe' | 'scoped' | 'power';
}

interface SpaceInfo {
  id: string;
  name: string;
  canManageTools: boolean;
}

async function fetchSpaceTools(spaceId: string): Promise<{ tools: SpaceTool[]; space: SpaceInfo }> {
  const [toolsRes, spaceRes] = await Promise.all([
    fetch(`/api/spaces/${spaceId}/tools?limit=50`),
    fetch(`/api/spaces/${spaceId}`),
  ]);

  if (!toolsRes.ok) throw new Error('Failed to fetch tools');
  if (!spaceRes.ok) throw new Error('Failed to fetch space');

  const [toolsData, spaceData] = await Promise.all([toolsRes.json(), spaceRes.json()]);

  return {
    tools: toolsData.tools || [],
    space: {
      id: spaceData.space?.id || spaceId,
      name: spaceData.space?.name || 'Space',
      canManageTools: ['owner', 'admin', 'moderator'].includes(spaceData.membership?.role || ''),
    },
  };
}

async function updateToolStatus(
  spaceId: string,
  placementId: string,
  isActive: boolean
): Promise<void> {
  const res = await fetch(`/api/placements/${placementId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error('Failed to update tool');
}

async function removeTool(spaceId: string, placementId: string): Promise<void> {
  const res = await fetch(`/api/spaces/${spaceId}/tools`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placementId }),
  });
  if (!res.ok) throw new Error('Failed to remove tool');
}

/**
 * ToolCard — Tool item with actions
 */
function ToolCard({
  tool,
  spaceId,
  canManage,
  onToggle,
  onRemove,
}: {
  tool: SpaceTool;
  spaceId: string;
  canManage: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const [showMenu, setShowMenu] = React.useState(false);
  const laneColor = LANE_COLORS[tool.capabilityLane || 'safe'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-lg border"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: tool.isActive ? COLORS.border : 'rgba(255, 255, 255, 0.04)',
        opacity: tool.isActive ? 1 : 0.7,
      }}
    >
      {/* Tool info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate" style={{ color: COLORS.text }}>
            {tool.titleOverride || tool.name}
          </span>
          {!tool.isActive && (
            <span
              className="text-label-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textTertiary }}
            >
              Paused
            </span>
          )}
          {tool.capabilityLane && (
            <span
              className="text-label-xs px-1.5 py-0.5 rounded capitalize"
              style={{ backgroundColor: `${laneColor}20`, color: laneColor }}
            >
              {tool.capabilityLane}
            </span>
          )}
        </div>
        <p className="text-xs truncate" style={{ color: COLORS.textTertiary }}>
          {tool.description}
        </p>
        <div className="flex items-center gap-3 mt-2 text-label-xs" style={{ color: COLORS.textTertiary }}>
          <span className="capitalize">{tool.placement}</span>
          <span>Order: {tool.order}</span>
          {tool.surfaceModes?.app && (
            <span className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              App mode
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex items-center gap-2 relative">
          {/* Quick toggle */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title={tool.isActive ? 'Pause tool' : 'Activate tool'}
          >
            {tool.isActive ? (
              <Pause className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
            ) : (
              <Play className="h-4 w-4" style={{ color: COLORS.gold }} />
            )}
          </button>

          {/* Configure link */}
          <Link
            href={`/spaces/${spaceId}/tools/${tool.placementId}`}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Configure"
          >
            <Settings className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
          </Link>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-lg border py-1 shadow-xl"
                    style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                  >
                    <Link
                      href={`/lab/${tool.toolId}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: COLORS.text }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View in HiveLab
                    </Link>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onRemove();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-red-500/10 transition-colors"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* View-only arrow */}
      {!canManage && (
        <Link
          href={`/spaces/${spaceId}/tools/${tool.placementId}`}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
        </Link>
      )}
    </motion.div>
  );
}

export default function SpaceToolsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const spaceId = params.spaceId as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['space-tools', spaceId],
    queryFn: () => fetchSpaceTools(spaceId),
    enabled: !!spaceId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      placementId,
      isActive,
    }: {
      placementId: string;
      isActive: boolean;
    }) => updateToolStatus(spaceId, placementId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-tools', spaceId] });
      toast.success('Tool updated');
    },
    onError: () => toast.error('Failed to update tool'),
  });

  const removeMutation = useMutation({
    mutationFn: (placementId: string) => removeTool(spaceId, placementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-tools', spaceId] });
      toast.success('Tool removed');
    },
    onError: () => toast.error('Failed to remove tool'),
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
          Unable to load space tools
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

  const { tools, space } = data;
  const activeTools = tools.filter((t) => t.isActive);
  const pausedTools = tools.filter((t) => !t.isActive);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
            </button>
            <div>
              <h1 className="text-xl font-medium" style={{ color: COLORS.text }}>
                Tools
              </h1>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                {space.name}
              </p>
            </div>
          </div>
          {space.canManageTools && (
            <Button
              onClick={() => router.push('/lab/templates')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Tool
            </Button>
          )}
        </div>

        {/* Empty state */}
        {tools.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Layers
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: COLORS.textTertiary }}
            />
            <p className="text-lg mb-2" style={{ color: COLORS.text }}>
              No tools deployed
            </p>
            <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
              Add tools to enhance your space with polls, RSVPs, countdowns, and more.
            </p>
            {space.canManageTools && (
              <Button onClick={() => router.push('/lab/templates')}>
                Browse Tools
              </Button>
            )}
          </motion.div>
        )}

        {/* Active Tools */}
        {activeTools.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
              Active Tools ({activeTools.length})
            </h2>
            <div className="space-y-3">
              {activeTools.map((tool) => (
                <ToolCard
                  key={tool.placementId}
                  tool={tool}
                  spaceId={spaceId}
                  canManage={space.canManageTools}
                  onToggle={() =>
                    toggleMutation.mutate({ placementId: tool.placementId, isActive: false })
                  }
                  onRemove={() => removeMutation.mutate(tool.placementId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Paused Tools */}
        {pausedTools.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textTertiary }}>
              Paused ({pausedTools.length})
            </h2>
            <div className="space-y-3">
              {pausedTools.map((tool) => (
                <ToolCard
                  key={tool.placementId}
                  tool={tool}
                  spaceId={spaceId}
                  canManage={space.canManageTools}
                  onToggle={() =>
                    toggleMutation.mutate({ placementId: tool.placementId, isActive: true })
                  }
                  onRemove={() => removeMutation.mutate(tool.placementId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Setup deployments link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-lg border"
          style={{ borderColor: COLORS.border }}
        >
          <Link
            href={`/spaces/${spaceId}/setups`}
            className="flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm" style={{ color: COLORS.text }}>
                Setup Deployments
              </p>
              <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                View orchestrated tool bundles in this space
              </p>
            </div>
            <ChevronRight className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
