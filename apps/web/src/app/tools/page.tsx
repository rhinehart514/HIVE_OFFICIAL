'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@hive/auth-logic';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@hive/ui';
import { ToolDeployModal } from '@hive/ui';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useIsSpaceLeader } from '@/hooks/use-is-space-leader';
import { logger as _logger } from '@/lib/logger';
import {
  Plus,
  Play,
  Edit,
  BarChart3,
  Rocket,
  Users,
  Sparkles,
} from 'lucide-react';

/**
 * Tools Hub - Production Ready
 *
 * Shows:
 * - User's personal tools (from Firebase)
 * - Marketplace tools (from Firebase)
 * - "Create New Tool" button → /tools/create
 *
 * No mocks - all data from API.
 */

type Tool = {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerId: string;
};

type ToolDeploymentTarget = {
  id: string;
  name: string;
  type: 'profile' | 'space';
  description?: string;
};

type ToolDeploymentConfig = {
  targetType: 'profile' | 'space';
  targetId: string;
  surface?: string;
  permissions: {
    canInteract: boolean;
    canView: boolean;
    canEdit: boolean;
    allowedRoles?: string[];
  };
  settings: {
    showInDirectory: boolean;
    allowSharing: boolean;
    collectAnalytics: boolean;
    notifyOnInteraction: boolean;
  };
};

export default function ToolsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isSpaceLeader, isLoading: leaderLoading } = useIsSpaceLeader();
  const { toast } = useToast();

  const [deployOpen, setDeployOpen] = useState(false);
  const [deployTool, setDeployTool] = useState<{ id: string; name: string } | null>(null);
  const [targets, setTargets] = useState<ToolDeploymentTarget[]>([]);

  // Only space leaders can access HiveLab/Tools
  const hasBuilderAccess = isSpaceLeader;

  // Fetch personal tools (user's own creations)
  const { data: personalTools, isLoading: personalLoading } = useQuery({
    queryKey: ['personal-tools', user?.uid],
    queryFn: async () => {
      const response = await apiClient.get('/api/tools');
      if (!response.ok) throw new Error('Failed to fetch personal tools');
      const data = await response.json();
      return (data.tools || []) as Tool[];
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute (refresh more frequently to see new saves)
  });

  // Fetch marketplace tools
  const { data: marketplaceTools, isLoading: marketplaceLoading } = useQuery({
    queryKey: ['marketplace-tools'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tools/browse');
      if (!response.ok) throw new Error('Failed to fetch marketplace tools');
      const data = await response.json();
      return (data.tools || []) as Tool[];
    },
    staleTime: 300000, // 5 minutes
  });

  // Load deployment targets
  useEffect(() => {
    if (!user) return;

    const loadTargets = async () => {
      const base: ToolDeploymentTarget[] = [
        {
          id: user.uid,
          name: 'My Profile',
          type: 'profile',
          description: 'Deploy to your personal profile',
        },
      ];

      try {
        const res = await apiClient.get('/api/spaces/mine?roles=builder,admin');
        if (res.ok) {
          const data = await res.json();
          const spaceTargets: ToolDeploymentTarget[] = (data.spaces || []).map(
            (s: { id: string; name: string }) => ({
              id: s.id,
              name: s.name,
              type: 'space' as const,
              description: `Deploy to ${s.name}`,
            })
          );
          setTargets([...base, ...spaceTargets]);
        } else {
          setTargets(base);
        }
      } catch {
        setTargets(base);
      }
    };

    loadTargets();
  }, [user]);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push('/auth/login?redirect=/tools');
    return null;
  }

  // Access gate: Only space leaders can access HiveLab
  if (!authLoading && !leaderLoading && !hasBuilderAccess) {
    return (
      <div className="min-h-screen bg-hive-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[var(--hive-brand-primary)]/20 to-transparent rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-[var(--hive-brand-primary)]" />
            </div>
            <CardTitle className="text-xl">HiveLab Access</CardTitle>
            <CardDescription className="mt-2">
              HiveLab is available to space leaders. Lead a space to unlock the ability to create and deploy custom tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-hive-text-secondary space-y-2">
              <p>As a space leader, you can:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Create custom tools with AI assistance</li>
                <li>Deploy tools to your space sidebar</li>
                <li>Add interactive polls, forms, and more</li>
                <li>Track engagement with analytics</li>
              </ul>
            </div>
            <Button
              onClick={() => router.push('/spaces/browse')}
              className="w-full bg-[var(--hive-brand-primary)] text-black hover:bg-yellow-400"
            >
              Browse Spaces
            </Button>
            <p className="text-xs text-center text-hive-text-tertiary">
              Find a space that needs a leader, or create your own
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateTool = () => {
    router.push('/tools/create');
  };

  const handleRunTool = (toolId: string) => {
    router.push(`/tools/${toolId}/run`);
  };

  const handleEditTool = (toolId: string) => {
    router.push(`/tools/${toolId}/edit`);
  };

  const handleViewAnalytics = (toolId: string) => {
    router.push(`/tools/${toolId}/analytics`);
  };

  const _handleToolSettings = (toolId: string) => {
    router.push(`/tools/${toolId}/settings`);
  };

  const handleDeployTool = (tool: Tool) => {
    setDeployTool({ id: tool.id, name: tool.name });
    setDeployOpen(true);
  };

  const handleDeploy = async (config: ToolDeploymentConfig) => {
    if (!deployTool) return;

    try {
      const res = await apiClient.post('/api/tools/deploy', {
        toolId: deployTool.id,
        deployTo: config.targetType,
        targetId: config.targetId,
        surface: config.surface,
        permissions: config.permissions,
        settings: config.settings,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Failed to deploy tool (${res.status})`);
      }

      setDeployOpen(false);
      toast({
        title: 'Tool deployed',
        description: `${deployTool.name} is now live`,
        type: 'success',
        duration: 3000,
      });

      // Redirect to analytics
      router.push(`/tools/${deployTool.id}/analytics`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Deployment failed';
      toast({
        title: 'Deployment failed',
        description: message,
        type: 'error',
        duration: 5000,
      });
    }
  };

  const isLoading = authLoading || leaderLoading || personalLoading || marketplaceLoading;

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-hive-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const myTools = personalTools || [];
  const marketplace = marketplaceTools || [];

  return (
    <>
      <div className="min-h-screen bg-hive-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-hive-background-overlay backdrop-blur border-b border-hive-border-default">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-hive-text-primary">
                  My Creations
                </h1>
                <p className="text-sm text-hive-text-secondary mt-1">
                  Build tools with AI, share them, use them anywhere
                </p>
              </div>
              <Button
                onClick={handleCreateTool}
                size="lg"
                className="bg-[var(--hive-brand-primary)] text-black hover:bg-yellow-400"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Tool
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
          {/* My Creations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-hive-text-primary">
                My Creations
              </h2>
              {myTools.length > 0 && (
                <span className="text-sm text-hive-text-tertiary">
                  {myTools.length} tool{myTools.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {myTools.length === 0 ? (
              <Card className="border-dashed border-2 border-[var(--hive-brand-primary)]/20">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--hive-brand-primary)]/20 to-transparent rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-[var(--hive-brand-primary)]" />
                  </div>
                  <div className="text-center space-y-3 max-w-sm">
                    <h3 className="text-lg font-medium text-hive-text-primary">
                      Create your first tool
                    </h3>
                    <p className="text-hive-text-secondary text-sm">
                      Describe what you want to build and AI will create it for you. No coding required.
                    </p>
                    <Button
                      onClick={handleCreateTool}
                      className="mt-4 bg-[var(--hive-brand-primary)] text-black hover:bg-yellow-400"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Start Creating
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTools.map((tool) => {
                  // Determine status badge
                  const statusConfig = {
                    draft: { label: 'Draft', className: 'bg-neutral-500/20 text-neutral-400' },
                    published: { label: 'Shared', className: 'bg-blue-500/20 text-blue-400' },
                    deployed: { label: 'Deployed', className: 'bg-emerald-500/20 text-emerald-400' },
                  }[tool.status] || { label: tool.status, className: 'bg-neutral-500/20 text-neutral-400' };

                  return (
                    <Card
                      key={tool.id}
                      className="hover:border-[var(--hive-brand-primary)]/50 transition-colors group"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {tool.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1 bg-[var(--hive-brand-primary)] text-black hover:bg-yellow-400"
                            onClick={() => handleRunTool(tool.id)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTool(tool.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          {isSpaceLeader && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeployTool(tool)}
                            >
                              <Rocket className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewAnalytics(tool.id)}
                          >
                            <BarChart3 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Marketplace */}
          <section>
            <h2 className="text-xl font-semibold text-hive-text-primary mb-4">
              Marketplace ({marketplace.length})
            </h2>

            {marketplace.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-hive-text-secondary">
                  No marketplace tools available yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplace.map((tool) => (
                  <Card
                    key={tool.id}
                    className="hover:border-hive-brand-primary transition-colors"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <CardDescription>
                        {tool.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-hive-text-tertiary">
                        <span className="px-2 py-1 bg-hive-background-secondary rounded">
                          {tool.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleRunTool(tool.id)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Use Tool
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Deploy Modal */}
      {deployTool && (
        <ToolDeployModal
          open={deployOpen}
          onOpenChange={setDeployOpen}
          toolName={deployTool.name}
          availableTargets={targets}
          onDeploy={handleDeploy}
        />
      )}
    </>
  );
}
