'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import {
  ToolDeployModal,
  Skeleton,
  Button,
  Card,
  CardContent,
  type ToolDeploymentTarget,
  type ToolDeploymentConfig,
} from '@hive/ui';
import { apiClient } from '@/lib/api-client';
import { ArrowLeftIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const ArrowLeft = ArrowLeftIcon;
const Rocket = RocketLaunchIcon;

/**
 * HiveLab Tool Deploy Page
 *
 * Full-page deployment workflow for tools.
 * Fetches available deployment targets and handles deployment.
 */

interface Props {
  params: Promise<{ toolId: string }>;
}

type Tool = {
  id: string;
  name: string;
  description?: string;
};

type Space = {
  id: string;
  name: string;
  description?: string;
  role?: string;
};

export default function ToolDeployPage({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract context from query params (carried over from creation)
  const contextType = searchParams.get('context'); // 'space' or 'profile'
  const contextSpaceId = searchParams.get('spaceId');

  const [isClient, setIsClient] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [targets, setTargets] = useState<ToolDeploymentTarget[]>([]);
  const [preselectedTargetId, setPreselectedTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch tool and deployment targets
  useEffect(() => {
    if (!isClient || !toolId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch tool info
        const toolResponse = await apiClient.get(`/api/tools/${toolId}`);
        if (!toolResponse.ok) {
          throw new Error('Failed to fetch tool');
        }
        const toolData = await toolResponse.json();
        setTool(toolData.tool || toolData);

        // Get current user
        const auth = getAuth();
        const user = auth.currentUser;

        // Build deployment targets
        const deploymentTargets: ToolDeploymentTarget[] = [];

        // Add profile as target
        if (user) {
          deploymentTargets.push({
            id: 'profile',
            name: 'My Profile',
            type: 'profile',
            description: 'Add this tool to your personal profile',
          });
        }

        // Fetch user's spaces where they can deploy
        try {
          const spacesResponse = await apiClient.get('/api/profile/my-spaces');
          if (spacesResponse.ok) {
            const spacesData = await spacesResponse.json();
            const spaces = (spacesData.spaces || spacesData || []) as Space[];

            // Filter to spaces where user is leader/admin
            const leadSpaces = spaces.filter(
              (s) => s.role === 'leader' || s.role === 'admin'
            );

            leadSpaces.forEach((space) => {
              deploymentTargets.push({
                id: space.id,
                name: space.name,
                type: 'space',
                description: space.description || 'Deploy to this space',
              });
            });
          }
        } catch {
          // Continue with just profile target if spaces fetch fails
        }

        setTargets(deploymentTargets);

        // Pre-select target based on context from creation
        if (contextType === 'profile') {
          setPreselectedTargetId('profile');
        } else if (contextType === 'space' && contextSpaceId) {
          setPreselectedTargetId(contextSpaceId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isClient, toolId, contextType, contextSpaceId]);

  // Handle deployment
  const handleDeploy = async (config: ToolDeploymentConfig) => {
    // Transform ToolDeploymentConfig to API expected format
    const apiPayload = {
      spaceId: config.targetId, // The API expects spaceId, not targetId
      configuration: config.settings || {},
      permissions: config.permissions || {},
    };

    const response = await apiClient.post(`/api/tools/${toolId}/deploy`, apiPayload);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to deploy tool');
    }

    return response.json();
  };

  // Handle modal close - navigate back
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      router.push(`/${toolId}`);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push(`/${toolId}`);
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--hive-status-error)]">{error || 'Tool not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-[var(--hive-brand-primary)] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If no targets available, show empty state
  if (targets.length === 0) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-[var(--hive-text-primary)]">
              Deploy {tool.name}
            </h1>
          </div>

          <Card className="border-[var(--hive-border-default)]">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-[var(--hive-background-secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-[var(--hive-text-secondary)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-2">
                No Deployment Targets
              </h2>
              <p className="text-[var(--hive-text-secondary)] max-w-md mx-auto">
                You need to be a leader of a space to deploy tools there.
                Sign in or become a space leader to unlock deployment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-[var(--hive-text-primary)]">
            Deploy {tool.name}
          </h1>
        </div>

        <ToolDeployModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          toolName={tool.name}
          availableTargets={targets}
          onDeploy={handleDeploy}
          initialConfig={
            preselectedTargetId
              ? {
                  targetId: preselectedTargetId,
                  targetType: contextType === 'profile' ? 'profile' : 'space',
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
