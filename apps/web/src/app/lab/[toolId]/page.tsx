'use client';

import { use, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, Check, Send } from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { useQuery } from '@tanstack/react-query';
import { ToolCanvas, BrandSpinner } from '@hive/ui';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { fetchTool } from './lib';

interface Props {
  params: Promise<{ toolId: string }>;
}

export default function ToolPage({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [iterateInput, setIterateInput] = useState('');
  const [isIterating, setIsIterating] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    data: tool,
    isLoading: toolLoading,
    error: toolError,
    refetch,
  } = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => fetchTool(toolId),
    enabled: !!user && !!toolId,
    staleTime: 60000,
  });

  const runtime = useToolRuntime({
    toolId,
    enabled: !!tool,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: false,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/enter');
    }
  }, [authLoading, user, router]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/t/${toolId}`;

    // Publish if still draft
    if (tool?.status === 'draft') {
      try {
        await fetch(`/api/tools/${toolId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'published', visibility: 'public' }),
        });
      } catch {
        // Non-blocking — link still works
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.success(`Share: ${url}`);
    }
  }, [toolId, tool?.status]);

  const handleIterate = useCallback(async () => {
    const prompt = iterateInput.trim();
    if (!prompt || isIterating) return;

    setIsIterating(true);
    setIterateInput('');

    try {
      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          mode: 'code',
          existingCode: tool?.elements?.[0]?.config?.code || undefined,
          existingName: tool?.name,
          isIteration: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Generation failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const chunk = JSON.parse(trimmed);
            if (chunk.type === 'code' && chunk.data?.code) {
              // Save updated code
              await fetch(`/api/tools/${toolId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  name: chunk.data.name || tool?.name,
                  elements: [{
                    elementId: 'custom-block',
                    instanceId: 'code_app_1',
                    config: {
                      code: chunk.data.code,
                      metadata: {
                        name: chunk.data.name || tool?.name || '',
                        description: chunk.data.description || '',
                        createdBy: 'ai',
                      },
                    },
                  }],
                  type: 'code',
                }),
              });
            }
            if (chunk.type === 'error') {
              throw new Error(chunk.data?.error || 'Generation failed');
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      toast.success('Updated!');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to iterate');
    } finally {
      setIsIterating(false);
    }
  }, [iterateInput, isIterating, toolId, tool, refetch]);

  // Loading
  if (authLoading || toolLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BrandSpinner size="md" variant="gold" />
      </div>
    );
  }

  // Error
  if (toolError || !tool) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-white mb-2">Not found</h2>
          <p className="text-white/50 text-sm mb-6">
            This may have been deleted or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.push('/lab')}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Back to Lab
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === tool.ownerId;
  const hasElements = (tool.elements?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <button
          onClick={() => router.push('/lab')}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Lab
        </button>

        <h1 className="text-sm font-medium text-white truncate max-w-[200px]">
          {tool.name || 'Untitled'}
        </h1>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Share'}
        </button>
      </header>

      {/* Tool preview */}
      <main className="flex-1 flex flex-col items-center px-4 py-6 overflow-auto">
        <div className="w-full max-w-[520px]">
          {hasElements ? (
            <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-5 sm:p-6">
              <ToolCanvas
                elements={tool.elements!.map(el => ({
                  elementId: el.elementId,
                  instanceId: el.instanceId || `${el.elementId}_0`,
                  config: (el.config as Record<string, unknown>) || {},
                  position: el.position,
                  size: el.size,
                }))}
                state={runtime.state}
                sharedState={runtime.sharedState}
                userState={runtime.userState}
                connections={tool.connections || []}
                layout="stack"
                onElementChange={(instanceId, data) => {
                  runtime.updateState({ [instanceId]: data });
                }}
                onElementAction={(instanceId, action, payload) => {
                  runtime.executeAction(instanceId, action, payload as Record<string, unknown>);
                }}
                isLoading={runtime.isLoading || runtime.isExecuting}
                error={runtime.error?.message || null}
                context={{
                  userId: user?.uid,
                  userDisplayName: user?.displayName || user?.fullName || undefined,
                  userRole: 'member',
                  isSpaceLeader: false,
                }}
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-8 text-center">
              <p className="text-white/40 text-sm mb-4">This creation is empty</p>
              <p className="text-white/25 text-xs">Describe what you want below</p>
            </div>
          )}
        </div>
      </main>

      {/* Iterate input — owner only */}
      {isOwner && (
        <div className="border-t border-white/[0.06] bg-black/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-[520px] mx-auto">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={iterateInput}
                onChange={(e) => setIterateInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleIterate();
                  }
                }}
                placeholder={isIterating ? 'Updating...' : 'Change something...'}
                disabled={isIterating}
                rows={1}
                className="flex-1 resize-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5
                  text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/[0.15]
                  disabled:opacity-40 transition-colors"
              />
              <button
                onClick={handleIterate}
                disabled={!iterateInput.trim() || isIterating}
                className="p-2.5 rounded-xl bg-white text-black disabled:opacity-30 disabled:bg-white/50
                  hover:bg-white/90 transition-all shrink-0"
              >
                {isIterating ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Send className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
