'use client';

/**
 * Tool Deploy Page
 *
 * Full-screen deploy experience merged from HiveLab standalone app.
 * Implements DRAMA plan Phase 4.6:
 * - Phase 1: Zoom-out
 * - Phase 2: Target selection
 * - Phase 3: Flight animation
 * - Phase 4: Success recap
 */

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  DeployTakeover,
  Skeleton,
  Button,
  Card,
  CardContent,
} from '@hive/ui';
import { apiClient } from '@/lib/api-client';
import { ArrowLeftIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const ArrowLeft = ArrowLeftIcon;
const Rocket = RocketLaunchIcon;

interface Props {
  params: Promise<{ toolId: string }>;
}

type Tool = {
  id: string;
  name: string;
  description?: string;
  elements?: Array<{ id: string }>;
};

type Space = {
  id: string;
  name: string;
  handle: string;
  description?: string;
  role?: string;
  memberCount: number;
  avatarUrl?: string;
};

export default function ToolDeployPage({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Extract context from query params (carried over from creation)
  const contextType = searchParams.get('context'); // 'space' or 'profile'
  const contextSpaceId = searchParams.get('spaceId');

  const [isClient, setIsClient] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTakeoverOpen, setIsTakeoverOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch tool and deployment targets
  useEffect(() => {
    if (!isClient || !toolId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setSpacesLoading(true);

        // Fetch tool info
        const toolResponse = await apiClient.get(`/api/tools/${toolId}`);
        if (!toolResponse.ok) {
          throw new Error('Failed to fetch tool');
        }
        const toolData = await toolResponse.json();
        setTool(toolData.tool || toolData);

        // Fetch user's spaces where they can deploy
        try {
          const spacesResponse = await apiClient.get('/api/profile/my-spaces');
          if (spacesResponse.ok) {
            const spacesData = await spacesResponse.json();
            const allSpaces = (spacesData.spaces || spacesData || []) as Space[];

            // Filter to spaces where user is leader/admin
            const leadSpaces = allSpaces.filter(
              (s) => s.role === 'leader' || s.role === 'admin'
            );

            // Add handle if missing (use id as fallback)
            const spacesWithHandles = leadSpaces.map((s) => ({
              ...s,
              handle: s.handle || s.id,
              memberCount: s.memberCount || 0,
            }));

            setSpaces(spacesWithHandles);
          }
        } catch {
          // Continue with empty spaces if fetch fails
          setSpaces([]);
        }

        // Open the takeover immediately after data loads
        setIsTakeoverOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
        setSpacesLoading(false);
      }
    };

    fetchData();
  }, [isClient, toolId, contextType, contextSpaceId]);

  // Handle deployment
  const handleDeploy = useCallback(async (spaceId: string) => {
    const apiPayload = {
      spaceId,
      configuration: {},
      permissions: {},
    };

    const response = await apiClient.post(`/api/tools/${toolId}/deploy`, apiPayload);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to deploy tool');
    }

    return response.json();
  }, [toolId]);

  // Handle takeover close - navigate back
  const handleClose = useCallback(() => {
    setIsTakeoverOpen(false);
    router.push(`/tools/${toolId}`);
  }, [router, toolId]);

  // Handle view in space
  const handleViewInSpace = useCallback((spaceHandle: string) => {
    queryClient.invalidateQueries({ queryKey: ['space-tools'] });
    router.push(`/s/${spaceHandle}`);
  }, [router, queryClient]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push(`/tools/${toolId}`);
  }, [router, toolId]);

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
            onClick={() => router.push('/tools')}
            className="text-[var(--hive-brand-primary)] hover:underline"
          >
            Back to Tools
          </button>
        </div>
      </div>
    );
  }

  // If no targets available, show empty state
  if (spaces.length === 0 && !spacesLoading) {
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
              <p className="text-[var(--hive-text-secondary)] max-w-md mx-auto mb-6">
                You need to be a leader or admin of a space to deploy tools there.
                Join or create a space to unlock deployment.
              </p>
              <Button
                onClick={() => router.push('/spaces')}
                className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
              >
                Browse Spaces
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background placeholder while takeover is open */}
      <div className="min-h-screen bg-[var(--hive-background-primary)]" />

      {/* Deploy Takeover - Full screen experience */}
      <DeployTakeover
        isOpen={isTakeoverOpen}
        tool={{
          id: tool.id,
          name: tool.name,
          description: tool.description,
          elementCount: tool.elements?.length || 0,
        }}
        spaces={spaces}
        spacesLoading={spacesLoading}
        onDeploy={handleDeploy}
        onClose={handleClose}
        onViewInSpace={handleViewInSpace}
      />
    </>
  );
}
