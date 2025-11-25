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
import { ErrorBoundary } from '@/components/error-boundary';
import { _logger } from '@/lib/logger';
import {
  Plus,
  Play,
  Edit,
  BarChart3,
  Rocket,
  _Settings,
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
  const { toast } = useToast();

  const [deployOpen, setDeployOpen] = useState(false);
  const [deployTool, setDeployTool] = useState<{ id: string; name: string } | null>(null);
  const [targets, setTargets] = useState<ToolDeploymentTarget[]>([]);

  // Fetch personal tools
  const { data: personalTools, isLoading: personalLoading } = useQuery({
    queryKey: ['personal-tools'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tools/personal');
      if (!response.ok) throw new Error('Failed to fetch personal tools');
      const data = await response.json();
      return (data.tools || []) as Tool[];
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
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

  const isLoading = authLoading || personalLoading || marketplaceLoading;

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
    <ErrorBoundary>
      <div className="min-h-screen bg-hive-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-hive-background-overlay backdrop-blur border-b border-hive-border-default">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-hive-text-primary">
                  HiveLab Tools
                </h1>
                <p className="text-sm text-hive-text-secondary mt-1">
                  Build campus utilities, deploy to your profile or spaces
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
          {/* My Tools */}
          <section>
            <h2 className="text-xl font-semibold text-hive-text-primary mb-4">
              My Tools ({myTools.length})
            </h2>

            {myTools.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <p className="text-hive-text-secondary">
                      No tools yet. Create your first tool!
                    </p>
                    <Button onClick={handleCreateTool} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Tool
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTools.map((tool) => (
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
                        <span className="px-2 py-1 bg-hive-background-secondary rounded">
                          {tool.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunTool(tool.id)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTool(tool.id)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeployTool(tool)}
                        >
                          <Rocket className="w-3 h-3 mr-1" />
                          Deploy
                        </Button>
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
                ))}
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
    </ErrorBoundary>
  );
}
