'use client';

/**
 * /spaces/[spaceId]/tools/[deploymentId] — Placement Config
 *
 * Configure tool placement: visibility, permissions, config overrides.
 * Displays governance controls and capability/budget info.
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Users,
  Settings,
  ExternalLink,
  Clock,
  User,
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
const LANE_INFO = {
  safe: { color: '#10B981', label: 'Safe', description: 'UI only, no platform side effects' },
  scoped: { color: '#F59E0B', label: 'Scoped', description: 'Space-private reads allowed' },
  power: { color: '#EF4444', label: 'Power', description: 'Full platform side effects' },
};

// Visibility options
const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'Everyone', icon: Users, description: 'All space members' },
  { value: 'members', label: 'Members Only', icon: Users, description: 'Active members' },
  { value: 'leaders', label: 'Leaders Only', icon: Shield, description: 'Admins and moderators' },
];

// Placement options
const PLACEMENT_OPTIONS = [
  { value: 'sidebar', label: 'Sidebar', description: 'Persistent sidebar widget' },
  { value: 'inline', label: 'Inline', description: 'Embedded in chat/posts' },
  { value: 'modal', label: 'Modal', description: 'Opens in overlay' },
  { value: 'tab', label: 'Tab', description: 'Full-screen tab view' },
];

interface PlacementDetail {
  id: string;
  toolId: string;
  placement: string;
  order: number;
  isActive: boolean;
  visibility: string;
  titleOverride?: string;
  configOverrides: Record<string, unknown>;
  placedAt: string;
  placedBy: string;
  tool: {
    id: string;
    name: string;
    description: string;
    category: string;
    icon?: string;
  } | null;
  governance: {
    deploymentId: string;
    capabilityLane: string;
    capabilities: Record<string, boolean | string[]>;
    budgets: {
      notificationsPerDay: number;
      postsPerDay: number;
      automationsPerDay: number;
      executionsPerUserPerHour: number;
    };
    status: string;
    experimental: boolean;
    deployedAt: string;
    deployedBy: string;
  } | null;
  context: {
    type: string;
    id: string;
  };
  permissions: {
    canModify: boolean;
    canRemove: boolean;
  };
}

async function fetchPlacementDetail(placementId: string): Promise<PlacementDetail> {
  const res = await fetch(`/api/placements/${placementId}`);
  if (!res.ok) throw new Error('Failed to fetch placement');
  const data = await res.json();
  return data.placement;
}

async function updatePlacement(
  placementId: string,
  updates: Partial<{
    placement: string;
    visibility: string;
    titleOverride: string | null;
    isActive: boolean;
  }>
): Promise<void> {
  const res = await fetch(`/api/placements/${placementId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update placement');
}

export default function PlacementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const spaceId = params.spaceId as string;
  const deploymentId = params.deploymentId as string;

  // Local form state
  const [placement, setPlacement] = React.useState('');
  const [visibility, setVisibility] = React.useState('');
  const [titleOverride, setTitleOverride] = React.useState('');
  const [hasChanges, setHasChanges] = React.useState(false);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['placement-detail', deploymentId],
    queryFn: () => fetchPlacementDetail(deploymentId),
    enabled: !!deploymentId,
  });

  // Initialize form state from data
  React.useEffect(() => {
    if (detail) {
      setPlacement(detail.placement);
      setVisibility(detail.visibility);
      setTitleOverride(detail.titleOverride || '');
    }
  }, [detail]);

  // Track changes
  React.useEffect(() => {
    if (detail) {
      const changed =
        placement !== detail.placement ||
        visibility !== detail.visibility ||
        titleOverride !== (detail.titleOverride || '');
      setHasChanges(changed);
    }
  }, [placement, visibility, titleOverride, detail]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePlacement(deploymentId, {
        placement,
        visibility,
        titleOverride: titleOverride || null,
      }),
    onSuccess: () => {
      toast.success('Settings saved');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['placement-detail', deploymentId] });
      queryClient.invalidateQueries({ queryKey: ['space-tools', spaceId] });
    },
    onError: () => toast.error('Failed to save settings'),
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

  if (error || !detail) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <p className="text-lg mb-4" style={{ color: COLORS.text }}>
          Placement not found
        </p>
        <Link
          href={`/spaces/${spaceId}/tools`}
          className="text-sm"
          style={{ color: COLORS.gold }}
        >
          Back to Tools
        </Link>
      </div>
    );
  }

  const laneInfo = LANE_INFO[detail.governance?.capabilityLane as keyof typeof LANE_INFO] || LANE_INFO.safe;
  const canEdit = detail.permissions.canModify;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
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
                {detail.titleOverride || detail.tool?.name || 'Tool Settings'}
              </h1>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                {detail.tool?.description || 'Configure placement settings'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && canEdit && (
              <span className="text-xs" style={{ color: COLORS.gold }}>
                Unsaved changes
              </span>
            )}
            {canEdit && (
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!hasChanges || saveMutation.isPending}
                className="flex items-center gap-2"
              >
                {saveMutation.isPending ? (
                  <BrandSpinner size="sm" variant="neutral" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Governance Info */}
        {detail.governance && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-lg border"
            style={{ borderColor: COLORS.border }}
          >
            <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
              Governance
            </h2>

            {/* Lane Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: `${laneInfo.color}15` }}
              >
                <Shield className="h-4 w-4" style={{ color: laneInfo.color }} />
                <span className="text-sm font-medium" style={{ color: laneInfo.color }}>
                  {laneInfo.label} Lane
                </span>
              </div>
              <span className="text-xs" style={{ color: COLORS.textTertiary }}>
                {laneInfo.description}
              </span>
            </div>

            {/* Capabilities */}
            <div className="mb-4">
              <h3 className="text-xs font-medium mb-2" style={{ color: COLORS.textTertiary }}>
                Active Capabilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(detail.governance.capabilities)
                  .filter(([, value]) => value === true || (Array.isArray(value) && value.length > 0))
                  .map(([key]) => (
                    <span
                      key={key}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: COLORS.textSecondary }}
                    >
                      {key.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            </div>

            {/* Budgets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <div className="text-xs" style={{ color: COLORS.textTertiary }}>
                  Notifications/day
                </div>
                <div className="text-sm font-medium" style={{ color: COLORS.text }}>
                  {detail.governance.budgets.notificationsPerDay}
                </div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <div className="text-xs" style={{ color: COLORS.textTertiary }}>
                  Posts/day
                </div>
                <div className="text-sm font-medium" style={{ color: COLORS.text }}>
                  {detail.governance.budgets.postsPerDay}
                </div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <div className="text-xs" style={{ color: COLORS.textTertiary }}>
                  Automations/day
                </div>
                <div className="text-sm font-medium" style={{ color: COLORS.text }}>
                  {detail.governance.budgets.automationsPerDay}
                </div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <div className="text-xs" style={{ color: COLORS.textTertiary }}>
                  Executions/user/hr
                </div>
                <div className="text-sm font-medium" style={{ color: COLORS.text }}>
                  {detail.governance.budgets.executionsPerUserPerHour}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Placement Settings */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.textSecondary }}>
            Placement Settings
          </h2>

          {/* Title Override */}
          <div className="mb-4">
            <label className="text-xs mb-1 block" style={{ color: COLORS.textTertiary }}>
              Custom Title (optional)
            </label>
            <input
              type="text"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              disabled={!canEdit}
              placeholder={detail.tool?.name || 'Tool name'}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-sm outline-none"
              style={{
                borderColor: COLORS.border,
                color: COLORS.text,
                opacity: canEdit ? 1 : 0.6,
              }}
            />
          </div>

          {/* Placement Type */}
          <div className="mb-4">
            <label className="text-xs mb-2 block" style={{ color: COLORS.textTertiary }}>
              Placement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLACEMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => canEdit && setPlacement(option.value)}
                  disabled={!canEdit}
                  className="p-3 rounded-lg border text-left transition-colors"
                  style={{
                    backgroundColor:
                      placement === option.value
                        ? `${COLORS.gold}10`
                        : 'rgba(255, 255, 255, 0.02)',
                    borderColor:
                      placement === option.value ? `${COLORS.gold}40` : COLORS.border,
                    opacity: canEdit ? 1 : 0.6,
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: COLORS.text }}>
                    {option.label}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.textTertiary }}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: COLORS.textTertiary }}>
              Visibility
            </label>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => canEdit && setVisibility(option.value)}
                  disabled={!canEdit}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors"
                  style={{
                    backgroundColor:
                      visibility === option.value
                        ? `${COLORS.gold}10`
                        : 'rgba(255, 255, 255, 0.02)',
                    borderColor:
                      visibility === option.value ? `${COLORS.gold}40` : COLORS.border,
                    opacity: canEdit ? 1 : 0.6,
                  }}
                >
                  <option.icon className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: COLORS.text }}>
                      {option.label}
                    </div>
                    <div className="text-xs" style={{ color: COLORS.textTertiary }}>
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Metadata */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg border"
          style={{ borderColor: COLORS.border }}
        >
          <h2 className="text-xs font-medium mb-3" style={{ color: COLORS.textTertiary }}>
            Deployment Info
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
              <span style={{ color: COLORS.textSecondary }}>
                Placed {new Date(detail.placedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: COLORS.textTertiary }} />
              <span style={{ color: COLORS.textSecondary }}>
                By {detail.placedBy}
              </span>
            </div>
            {detail.tool && (
              <Link
                href={`/tools/${detail.tool.id}`}
                className="flex items-center gap-2 hover:underline"
                style={{ color: COLORS.gold }}
              >
                <ExternalLink className="h-4 w-4" />
                View in HiveLab
              </Link>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
