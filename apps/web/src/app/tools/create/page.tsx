'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, RotateCcw, X, ArrowLeft } from 'lucide-react';
import { AILandingPageChat, Button, getWIPTool, clearWIPTool, saveWIPTool } from '@hive/ui';
import type { ToolComposition, WIPToolData } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { useIsSpaceLeader } from '@/hooks/use-is-space-leader';
import { apiClient } from '@/lib/api-client';

/**
 * AI Tool Builder - Universal Access
 *
 * Primary tool creation flow using AI generation.
 * Everyone can create - space leaders get extra deploy options.
 *
 * Key fixes implemented:
 * 1. Server ID tracking - POST once, PUT for updates
 * 2. Success state + redirect to /tools/[id]
 * 3. Share updates existing tool (doesn't create copy)
 * 4. WIP localStorage restore on return
 */
export default function CreateToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { isSpaceLeader } = useIsSpaceLeader();

  // Space context - when navigating from a space, we remember it for deployment
  const originSpaceId = searchParams.get('spaceId');

  // Server ID tracking - null until first save
  const [serverId, setServerId] = useState<string | null>(null);

  // Success state for redirect
  const [saveSuccess, setSaveSuccess] = useState<{
    toolId: string;
    name: string;
  } | null>(null);

  // WIP restore state
  const [wipData, setWipData] = useState<WIPToolData | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  // Initial composition (for WIP restore)
  const [initialComposition, setInitialComposition] = useState<ToolComposition | null>(null);

  // Check for WIP tool on mount
  useEffect(() => {
    const wip = getWIPTool();
    if (wip && Date.now() - wip.lastModified < 24 * 60 * 60 * 1000) {
      setWipData(wip);
      setShowRestorePrompt(true);
    }
  }, []);

  // Handle WIP restore
  const handleRestore = useCallback(() => {
    if (wipData) {
      setServerId(wipData.serverId);
      // Cast to ToolComposition since WIPToolData uses a compatible but minimal type
      setInitialComposition(wipData.composition as ToolComposition);
    }
    setShowRestorePrompt(false);
  }, [wipData]);

  // Handle WIP discard
  const handleDiscard = useCallback(() => {
    clearWIPTool();
    setWipData(null);
    setShowRestorePrompt(false);
  }, []);

  // Save tool to user's creations (POST for new, PUT for existing)
  const handleSave = useCallback(
    async (composition: ToolComposition): Promise<{ toolId: string }> => {
      if (serverId) {
        // UPDATE existing tool
        const response = await apiClient.put(`/api/tools/${serverId}`, {
          name: composition.name,
          description: composition.description,
          elements: composition.elements,
          config: { composition },
        });

        if (!response.ok) {
          throw new Error('Failed to update tool');
        }

        return { toolId: serverId };
      } else {
        // CREATE new tool
        const response = await apiClient.post('/api/tools', {
          name: composition.name,
          description: composition.description,
          type: 'ai-generated',
          status: 'draft',
          config: { composition },
          elements: composition.elements,
        });

        if (!response.ok) {
          throw new Error('Failed to save tool');
        }

        const data = await response.json();
        const newToolId = data.tool?.id || data.toolId;

        // CRITICAL: Track server ID for subsequent saves
        setServerId(newToolId);

        return { toolId: newToolId };
      }
    },
    [serverId]
  );

  // Create shareable link (update existing tool, don't create copy)
  const handleShare = useCallback(
    async (composition: ToolComposition): Promise<string> => {
      // Ensure saved first
      let toolId = serverId;
      if (!toolId) {
        const result = await handleSave(composition);
        toolId = result.toolId;
      }

      // Update visibility to link-shareable
      const response = await apiClient.put(`/api/tools/${toolId}`, {
        visibility: 'link',
        status: 'published',
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      return `${baseUrl}/tools/${toolId}/run`;
    },
    [serverId, handleSave]
  );

  // Handle successful save - show success state and redirect
  const handleSaveComplete = useCallback(
    (toolId: string, toolName: string) => {
      // Clear WIP since we saved successfully
      clearWIPTool();

      // Show success state
      setSaveSuccess({ toolId, name: toolName });

      // Redirect after 2 seconds
      setTimeout(() => {
        if (originSpaceId) {
          // If coming from a space, redirect to deploy page with space pre-selected
          router.push(`/tools/${toolId}/deploy?spaceId=${originSpaceId}`);
        } else {
          router.push(`/tools/${toolId}`);
        }
      }, 2000);
    },
    [router, originSpaceId]
  );

  // Auto-save WIP to localStorage (debounced, called by AILandingPageChat)
  const handleCompositionChange = useCallback(
    (composition: ToolComposition) => {
      if (user) {
        // For authenticated users, save WIP to localStorage
        saveWIPTool({
          clientId: composition.id,
          serverId,
          composition,
          lastModified: Date.now(),
        });
      }
    },
    [serverId, user]
  );

  // Loading state
  if (authLoading || isSpaceLeader === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    );
  }

  // HiveLab is leaders-only during January launch
  // TODO: Add HIVELAB_PUBLIC feature flag check via API when needed
  const hiveLabPublic = process.env.NEXT_PUBLIC_HIVELAB_PUBLIC === 'true';

  if (!hiveLabPublic && !isSpaceLeader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            Leader Access Required
          </h2>
          <p className="mb-6 text-neutral-400 leading-relaxed">
            HiveLab is currently exclusive to space leaders.
            Claim a space to unlock tool building and customization.
          </p>
          <button
            onClick={() => router.push('/spaces/claim')}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-black font-semibold hover:bg-amber-400 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.09 6.26L21 9.27l-5.18 5.03L17.18 21 12 17.27 6.82 21l1.36-6.7L3 9.27l6.91.01L12 3z" />
            </svg>
            Become a Leader
          </button>
        </div>
      </div>
    );
  }

  // Success state - show confirmation before redirect
  if (saveSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Saved!</h2>
            <p className="text-white/60">
              "{saveSuccess.name}" added to your creations
            </p>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{originSpaceId ? 'Taking you to deploy...' : 'Redirecting...'}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* WIP Restore Prompt */}
      <AnimatePresence>
        {showRestorePrompt && wipData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-4 flex items-center gap-4 max-w-md">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  Resume previous work?
                </p>
                <p className="text-xs text-white/60 truncate">
                  {wipData.composition.name || 'Untitled tool'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDiscard}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleRestore}
                  className="bg-amber-500 text-black hover:bg-amber-400"
                >
                  Restore
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Space Context Banner */}
      {originSpaceId && (
        <div className="fixed top-4 left-4 z-50">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push(`/spaces/${originSpaceId}`)}
            className="flex items-center gap-2 px-3 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg text-sm hover:bg-[#FFD700]/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FFD700]" />
            <span className="text-[#FFD700]/80">Back to space</span>
          </motion.button>
        </div>
      )}

      {/* Main Chat Interface */}
      <AILandingPageChat
        userId={user?.uid}
        isAuthenticated={!!user}
        isSpaceLeader={isSpaceLeader}
        onSave={user ? handleSave : undefined}
        onShare={user ? handleShare : undefined}
        onSaveComplete={handleSaveComplete}
        onCompositionChange={handleCompositionChange}
        initialComposition={initialComposition}
        serverId={serverId}
        redirectToSignup={() => {
          window.location.href = '/auth/login?redirect=/tools/create';
        }}
      />
    </>
  );
}
