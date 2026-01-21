'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { HiveLabIDE, Skeleton, type HiveLabComposition, type IDECanvasElement, type IDEConnection } from '@hive/ui';
import { apiClient } from '@/lib/api-client';

/**
 * HiveLab Tool Editor Page - Canvas-First IDE (Cursor-like)
 *
 * Full IDE experience with canvas, element palette, layers panel,
 * properties inspector, and AI command palette (Cmd+K).
 *
 * Supports ?new=true for blank canvas (new tool creation).
 */

interface Props {
  params: Promise<{ toolId: string }>;
}

export default function ToolEditorPage({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewTool = searchParams.get('new') === 'true';

  // Extract context from URL params
  const context = searchParams.get('context'); // 'space' or 'profile'
  const spaceId = searchParams.get('spaceId');
  const spaceName = searchParams.get('spaceName');

  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [composition, setComposition] = useState<{
    id?: string;
    name?: string;
    description?: string;
    elements?: IDECanvasElement[];
    connections?: IDEConnection[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Context validation - redirect if missing
  useEffect(() => {
    if (!isClient) return;

    // For new tools, enforce context requirement
    if (isNewTool && (!context || (context === 'space' && !spaceId))) {
      router.replace('/select-context');
    }
  }, [isClient, isNewTool, context, spaceId, router]);

  useEffect(() => {
    setIsClient(true);

    // Check auth state
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid);
    });

    return () => unsubscribe();
  }, []);

  // Handle new tool or fetch existing
  useEffect(() => {
    if (!isClient || !toolId) return;

    // If ?new=true, start with blank canvas
    if (isNewTool) {
      setComposition({
        id: toolId,
        name: '',
        description: '',
        elements: [],
        connections: [],
      });
      setIsLoading(false);

      // Show onboarding for new tools (unless user has dismissed it before)
      const hasSeenOnboarding = localStorage.getItem('hivelab_onboarding_dismissed');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }

      // Clean up URL (remove ?new=true) without full navigation
      window.history.replaceState({}, '', `/${toolId}`);
      return;
    }

    const fetchTool = async () => {
      try {
        setIsLoading(true);

        // First check localStorage for recently created tools
        const localData = localStorage.getItem(`hivelab_edit_composition_${toolId}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          // Transform to IDE format
          setComposition({
            id: parsed.id || toolId,
            name: parsed.name || 'Untitled Tool',
            description: parsed.description || '',
            elements: (parsed.elements || []).map((el: Record<string, unknown>, index: number) => ({
              id: (el.id as string) || `element_${index}`,
              elementId: el.elementId as string,
              instanceId: (el.instanceId as string) || `${el.elementId}_${index}`,
              position: (el.position as { x: number; y: number }) || { x: 50 + index * 30, y: 50 + index * 30 },
              size: (el.size as { width: number; height: number }) || { width: 240, height: 120 },
              config: (el.config as Record<string, unknown>) || {},
              zIndex: index + 1,
              locked: false,
              visible: true,
            })),
            connections: (parsed.connections || []).map((conn: Record<string, unknown>, index: number) => ({
              id: `conn_${index}`,
              from: conn.from as { instanceId: string; port: string },
              to: conn.to as { instanceId: string; port: string },
            })),
          });
          localStorage.removeItem(`hivelab_edit_composition_${toolId}`);
          setIsLoading(false);
          return;
        }

        // Fetch from API
        const response = await apiClient.get(`/api/tools/${toolId}`);
        if (!response.ok) {
          // If tool doesn't exist and we're loading a URL directly, show blank canvas
          if (response.status === 404) {
            setComposition({
              id: toolId,
              name: '',
              description: '',
              elements: [],
              connections: [],
            });
            setShowOnboarding(!localStorage.getItem('hivelab_onboarding_dismissed'));
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to fetch tool');
        }

        const data = await response.json();
        const tool = data.tool || data;

        // Transform API response to IDE format
        setComposition({
          id: tool.id,
          name: tool.name || 'Untitled Tool',
          description: tool.description || '',
          elements: (tool.elements || []).map((el: Record<string, unknown>, index: number) => ({
            id: (el.id as string) || `element_${index}`,
            elementId: el.elementId as string,
            instanceId: (el.instanceId as string) || `${el.elementId}_${index}`,
            position: (el.position as { x: number; y: number }) || { x: 50 + index * 30, y: 50 + index * 30 },
            size: (el.size as { width: number; height: number }) || { width: 240, height: 120 },
            config: (el.config as Record<string, unknown>) || {},
            zIndex: index + 1,
            locked: false,
            visible: true,
          })),
          connections: (tool.connections || []).map((conn: Record<string, unknown>, index: number) => ({
            id: `conn_${index}`,
            from: conn.from as { instanceId: string; port: string },
            to: conn.to as { instanceId: string; port: string },
          })),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tool');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTool();
  }, [isClient, toolId, isNewTool]);

  // Handle save
  const handleSave = async (updatedComposition: HiveLabComposition) => {
    const response = await apiClient.put(`/api/tools/${toolId}`, {
      name: updatedComposition.name,
      description: updatedComposition.description,
      elements: updatedComposition.elements.map((el) => ({
        elementId: el.elementId,
        instanceId: el.instanceId,
        config: el.config,
        position: el.position,
        size: el.size,
      })),
      connections: updatedComposition.connections.map((conn) => ({
        from: conn.from,
        to: conn.to,
      })),
      layout: updatedComposition.layout,
    });

    if (!response.ok) {
      throw new Error('Failed to save tool');
    }
  };

  // Handle preview
  const handlePreview = (comp: HiveLabComposition) => {
    // Store composition for preview page
    if (typeof window !== 'undefined') {
      localStorage.setItem(`hivelab_preview_${toolId}`, JSON.stringify(comp));
    }
    router.push(`/${toolId}/preview`);
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/');
  };

  if (!isClient || isLoading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex flex-col">
        {/* Toolbar skeleton */}
        <div className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 flex">
          {/* Left panel */}
          <div className="w-72 bg-[#0f0f0f] border-r border-[#333] p-4 space-y-4">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-[#0a0a0a]" />

          {/* Right panel */}
          <div className="w-72 bg-[#0f0f0f] border-l border-[#333] p-4 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-[#FFD700] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!composition) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#888]">Tool not found</p>
      </div>
    );
  }

  // Build context metadata to display in IDE
  const contextMeta = {
    type: context as 'space' | 'profile' | undefined,
    spaceId,
    spaceName: spaceName || (context === 'space' ? 'Unknown Space' : undefined),
    displayName: context === 'profile'
      ? 'My Profile'
      : spaceName || (context === 'space' ? 'Space' : undefined),
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Context indicator - subtle but present */}
      {contextMeta.displayName && (
        <div className="h-8 bg-[#0f0f0f] border-b border-[#333] flex items-center justify-center px-4">
          <p className="text-xs text-[#888]">
            Building for: <span className="text-[var(--hive-brand-primary)] font-medium">{contextMeta.displayName}</span>
          </p>
        </div>
      )}

      {/* IDE */}
      <div className="flex-1 overflow-hidden">
        <HiveLabIDE
          initialComposition={composition}
          showOnboarding={showOnboarding}
          onSave={handleSave}
          onPreview={handlePreview}
          onCancel={handleCancel}
          userId={userId || 'anonymous'}
        />
      </div>
    </div>
  );
}
