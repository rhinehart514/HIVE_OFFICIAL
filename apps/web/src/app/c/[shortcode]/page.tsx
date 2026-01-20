'use client';

/**
 * Creation Share Link Page - /c/[shortcode]
 *
 * Public tool preview page for shareable creation links.
 * Pattern: Fetch tool by shortcode, show preview, interact, optional signup.
 *
 * GTM Loop: Tool discovery -> interact -> signup if not authenticated
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CubeIcon,
  ArrowRightIcon,
  UserIcon,
  SparklesIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { Button, toast } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';

interface ToolData {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  interactionCount: number;
  createdAt: string;
  previewImageUrl?: string;
  // For rendering the tool
  canvasData?: unknown;
}

export default function CreationSharePage() {
  const params = useParams<{ shortcode: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const shortcode = params?.shortcode;

  const [tool, setTool] = React.useState<ToolData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showInteraction, setShowInteraction] = React.useState(false);

  // Fetch tool by shortcode
  React.useEffect(() => {
    if (!shortcode) return;

    const fetchTool = async () => {
      try {
        const res = await fetch(`/api/tools/by-shortcode/${shortcode}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Tool not found');
          } else {
            setError('Failed to load tool');
          }
          return;
        }
        const data = await res.json();
        setTool(data.tool);
      } catch {
        setError('Failed to load tool');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTool();
  }, [shortcode]);

  // Handle try it
  const handleTryIt = () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = `/c/${shortcode}?try=1`;
      router.push(`/enter?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setShowInteraction(true);
  };

  // Handle open in HiveLab
  const handleOpenInHiveLab = () => {
    if (!tool) return;
    router.push(`/tools/${tool.id}`);
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tool) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <CubeIcon className="w-8 h-8 text-white/30" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">
            Tool not found
          </h1>
          <p className="text-white/50 mb-6">
            This tool may have been removed or the link is invalid.
          </p>
          <Button onClick={() => router.push('/tools')}>
            Browse Tools
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Creator badge */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">
              {tool.creatorAvatarUrl ? (
                <img
                  src={tool.creatorAvatarUrl}
                  alt={tool.creatorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-white/40" />
              )}
            </div>
            <div>
              <p className="text-white/70 text-sm">
                Created by <span className="text-white">{tool.creatorName}</span>
              </p>
            </div>
          </div>

          {/* Tool card */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            {/* Preview area */}
            <div className="aspect-video bg-[#0F0F0E] relative flex items-center justify-center">
              {tool.previewImageUrl ? (
                <img
                  src={tool.previewImageUrl}
                  alt={tool.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    {tool.emoji ? (
                      <span className="text-3xl">{tool.emoji}</span>
                    ) : (
                      <SparklesIcon className="w-8 h-8 text-[var(--life-gold)]" />
                    )}
                  </div>
                  <p className="text-white/30 text-sm">Interactive tool preview</p>
                </div>
              )}

              {/* Play overlay */}
              {!showInteraction && (
                <button
                  onClick={handleTryIt}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity group"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--life-gold)] flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <PlayIcon className="w-8 h-8 text-black ml-1" />
                  </div>
                </button>
              )}
            </div>

            {/* Tool info */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  {tool.emoji ? (
                    <span className="text-2xl">{tool.emoji}</span>
                  ) : (
                    <CubeIcon className="w-6 h-6 text-white/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-white mb-1">
                    {tool.name}
                  </h1>
                  {tool.description && (
                    <p className="text-white/50 text-sm">
                      {tool.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <SparklesIcon className="w-4 h-4" />
                  <span>{tool.interactionCount.toLocaleString()} interactions</span>
                </div>
                <span className="text-white/20">·</span>
                <span className="text-white/40 text-sm">
                  Built with HiveLab
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/[0.06] bg-white/[0.01]">
              <div className="flex gap-3">
                <Button
                  onClick={handleTryIt}
                  className="flex-1"
                  variant="cta"
                >
                  Try it
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
                {user && (
                  <Button
                    onClick={handleOpenInHiveLab}
                    variant="secondary"
                  >
                    Open in HiveLab
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Not logged in prompt */}
          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <p className="text-white/40 text-sm mb-3">
                Sign up with your .edu email to use this tool and create your own
              </p>
              <Button
                onClick={() => router.push('/enter')}
                variant="secondary"
                size="sm"
              >
                Get started free
              </Button>
            </motion.div>
          )}

          {/* HiveLab promo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--life-gold)]/10 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-5 h-5 text-[var(--life-gold)]" />
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-sm">
                <span className="text-white font-medium">Build your own tools</span> with HiveLab — no code required
              </p>
            </div>
            <Button
              onClick={() => router.push('/tools')}
              variant="ghost"
              size="sm"
            >
              Explore
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
