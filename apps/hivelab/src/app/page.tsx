'use client';

/**
 * HiveLab Dashboard
 *
 * Per DRAMA plan Phase 4.1:
 * 1. First visit: "Welcome to your workshop" WordReveal + subtle particle background
 * 2. Tool cards entrance: Stagger from bottom (80ms between)
 * 3. Card hover: Lift + gold border glow + show quick actions
 * 4. Empty state: Animated illustration + "Create your first tool" CTA with pulse
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  WordReveal,
} from '@hive/ui';
import { MOTION } from '@hive/ui/tokens/motion';
import { apiClient } from '@/lib/api-client';
import {
  PlusIcon,
  PlayIcon,
  PencilIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Plus = PlusIcon;
const Play = PlayIcon;
const Edit = PencilIcon;
const BarChart3 = ChartBarIcon;
const Rocket = RocketLaunchIcon;
const Sparkles = SparklesIcon;
const ExternalLink = ArrowTopRightOnSquareIcon;

const EASE = MOTION.ease.premium;

// Colors matching HiveLab theme
const COLORS = {
  bg: 'var(--hive-background-primary, #0A0A0A)',
  bgSecondary: 'var(--hive-background-secondary, #141414)',
  border: 'var(--hive-border-default, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hive-text-primary, #FAF9F7)',
  textSecondary: 'var(--hive-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hive-text-tertiary, #5A5A5A)',
  gold: 'var(--hive-brand-primary, #D4AF37)',
  goldHover: 'var(--hive-brand-hover, #E5C04B)',
};

type Tool = {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerId: string;
  deploymentCount?: number;
  useCount?: number;
};

// Floating particles for empty state background
function FloatingParticles() {
  const shouldReduceMotion = useReducedMotion();

  const particles = useMemo(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 5,
    })),
    []
  );

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: COLORS.gold,
            opacity: 0.15,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Tool card with hover effects
interface ToolCardProps {
  tool: Tool;
  index: number;
  onRun: () => void;
  onEdit: () => void;
  onDeploy: () => void;
  onAnalytics: () => void;
}

function ToolCard({ tool, index, onRun, onEdit, onDeploy, onAnalytics }: ToolCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-neutral-700/50 text-neutral-300' },
    published: { label: 'Published', className: 'bg-blue-500/20 text-blue-400' },
    deployed: { label: 'Deployed', className: 'bg-emerald-500/20 text-emerald-400' },
  }[tool.status] || { label: tool.status, className: 'bg-neutral-700/50 text-neutral-300' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : index * 0.08, // 80ms stagger
        ease: EASE,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          y: isHovered ? -4 : 0,
          boxShadow: isHovered
            ? `0 8px 32px rgba(212, 175, 55, 0.15), 0 0 0 1px rgba(212, 175, 55, 0.3)`
            : '0 0 0 0 rgba(212, 175, 55, 0)',
        }}
        transition={{
          duration: MOTION.duration.fast,
          ease: EASE,
        }}
        className="rounded-xl"
      >
        <Card
          className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] transition-colors"
          style={{
            borderColor: isHovered ? `rgba(212, 175, 55, 0.4)` : undefined,
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg text-[var(--hive-text-primary)] truncate">
                {tool.name}
              </CardTitle>
              <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
            </div>
            <CardDescription className="text-[var(--hive-text-secondary)] line-clamp-2">
              {tool.description || 'No description'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-[var(--hive-text-tertiary)]">
              {tool.useCount !== undefined && (
                <span>{tool.useCount} uses</span>
              )}
              {tool.deploymentCount !== undefined && (
                <span>{tool.deploymentCount} deployments</span>
              )}
            </div>

            {/* Actions - show more options on hover */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1 bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
                onClick={onRun}
              >
                <Play className="w-3 h-3 mr-1" />
                Run
              </Button>

              <AnimatePresence>
                {isHovered ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: 'auto' }}
                      exit={{ opacity: 0, scale: 0.8, width: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[var(--hive-border-default)]"
                        onClick={onEdit}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: 'auto' }}
                      exit={{ opacity: 0, scale: 0.8, width: 0 }}
                      transition={{ duration: 0.15, delay: 0.03 }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[var(--hive-border-default)]"
                        onClick={onDeploy}
                      >
                        <Rocket className="w-3 h-3" />
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: 'auto' }}
                      exit={{ opacity: 0, scale: 0.8, width: 0 }}
                      transition={{ duration: 0.15, delay: 0.06 }}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onAnalytics}
                      >
                        <BarChart3 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[var(--hive-border-default)]"
                      onClick={onEdit}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Empty state with animated illustration
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  const [titleRevealed, setTitleRevealed] = useState(false);

  return (
    <div className="relative">
      <FloatingParticles />

      <Card className="relative border-dashed border-2 border-[var(--hive-brand-primary)]/20 bg-transparent overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-20">
          {/* Animated icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: shouldReduceMotion ? 0 : 0.2,
            }}
            className="w-20 h-20 bg-gradient-to-br from-[var(--hive-brand-primary)]/20 to-transparent rounded-2xl flex items-center justify-center mb-6"
          >
            <motion.div
              animate={shouldReduceMotion ? {} : {
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <Sparkles className="w-10 h-10 text-[var(--hive-brand-primary)]" />
            </motion.div>
          </motion.div>

          {/* WordReveal title */}
          <div className="text-center space-y-3 max-w-md">
            <div className="text-xl font-semibold text-[var(--hive-text-primary)]">
              <WordReveal
                text="Welcome to your workshop"
                stagger={0.06}
                onComplete={() => setTitleRevealed(true)}
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={titleRevealed ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: shouldReduceMotion ? 0 : MOTION.duration.base,
                ease: EASE,
              }}
              className="text-[var(--hive-text-secondary)]"
            >
              Build interactive tools for your campus community.
              Describe what you want to create and AI will build it for you.
            </motion.p>

            {/* Pulsing CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={titleRevealed ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: shouldReduceMotion ? 0 : MOTION.duration.base,
                delay: shouldReduceMotion ? 0 : 0.2,
                ease: EASE,
              }}
              className="pt-4"
            >
              <motion.div
                animate={shouldReduceMotion ? {} : {
                  boxShadow: [
                    '0 0 0 0 rgba(212, 175, 55, 0)',
                    '0 0 0 8px rgba(212, 175, 55, 0.2)',
                    '0 0 0 0 rgba(212, 175, 55, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="inline-block rounded-xl"
              >
                <Button
                  onClick={onCreateClick}
                  size="lg"
                  className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Tool
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HiveLabDashboard() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);
  const [headerRevealed, setHeaderRevealed] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch user's tools
  const { data: tools, isLoading } = useQuery({
    queryKey: ['my-tools'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tools');
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      return (data.tools || []) as Tool[];
    },
    enabled: isClient,
    staleTime: 30000,
  });

  // Loading skeleton with stagger
  if (!isClient || isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Skeleton className="h-48 w-full rounded-xl" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const myTools = tools || [];
  const isFirstVisit = myTools.length === 0;

  return (
    <div className="min-h-[calc(100vh-56px)] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.base,
            ease: EASE,
          }}
          className="flex items-center justify-between"
        >
          <div>
            {isFirstVisit ? (
              <div className="text-2xl font-bold text-[var(--hive-text-primary)]">
                <WordReveal
                  text="My Tools"
                  stagger={0.08}
                  onComplete={() => setHeaderRevealed(true)}
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-[var(--hive-text-primary)]">
                My Tools
              </h1>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.3,
                duration: MOTION.duration.fast,
              }}
              className="text-sm text-[var(--hive-text-secondary)] mt-1"
            >
              {myTools.length} tool{myTools.length !== 1 ? 's' : ''} created
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.2,
              duration: MOTION.duration.fast,
              ease: EASE,
            }}
          >
            <Button
              onClick={() => router.push('/select-context')}
              className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Tool
            </Button>
          </motion.div>
        </motion.div>

        {/* Tools Grid or Empty State */}
        {myTools.length === 0 ? (
          <EmptyState onCreateClick={() => router.push('/select-context')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTools.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                index={index}
                onRun={() => router.push(`/${tool.id}/preview`)}
                onEdit={() => router.push(`/${tool.id}`)}
                onDeploy={() => router.push(`/${tool.id}/deploy`)}
                onAnalytics={() => router.push(`/${tool.id}/analytics`)}
              />
            ))}
          </div>
        )}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.5,
            duration: MOTION.duration.base,
          }}
          className="pt-8 border-t border-[var(--hive-border-default)]"
        >
          <h3 className="text-sm font-medium text-[var(--hive-text-secondary)] mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/select-context"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] text-[var(--hive-text-primary)] hover:border-[var(--hive-brand-primary)]/50 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              New Tool
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Back to HIVE
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
