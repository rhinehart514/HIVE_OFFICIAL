'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@hive/ui';
import { apiClient } from '@/lib/api-client';
import {
  Plus,
  Play,
  Edit,
  BarChart3,
  Rocket,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

/**
 * HiveLab Dashboard
 *
 * Shows user's tools with actions:
 * - Create new tool
 * - Edit existing tool
 * - Run/preview tool
 * - View analytics
 * - Deploy to space
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
  deploymentCount?: number;
  useCount?: number;
};

export default function HiveLabDashboard() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

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
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const myTools = tools || [];

  return (
    <div className="min-h-[calc(100vh-56px)] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--hive-text-primary)]">
              My Tools
            </h1>
            <p className="text-sm text-[var(--hive-text-secondary)] mt-1">
              {myTools.length} tool{myTools.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <Button
            onClick={() => router.push('/create')}
            className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Tool
          </Button>
        </div>

        {/* Tools Grid */}
        {myTools.length === 0 ? (
          <Card className="border-dashed border-2 border-[var(--hive-brand-primary)]/20 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--hive-brand-primary)]/20 to-transparent rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-[var(--hive-brand-primary)]" />
              </div>
              <div className="text-center space-y-3 max-w-md">
                <h2 className="text-xl font-semibold text-[var(--hive-text-primary)]">
                  Welcome to HiveLab
                </h2>
                <p className="text-[var(--hive-text-secondary)]">
                  Build interactive tools for your campus community.
                  Describe what you want to create and AI will build it for you.
                </p>
                <Button
                  onClick={() => router.push('/create')}
                  size="lg"
                  className="mt-6 bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Tool
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTools.map((tool) => {
              const statusConfig = {
                draft: { label: 'Draft', className: 'bg-neutral-700/50 text-neutral-300' },
                published: { label: 'Published', className: 'bg-blue-500/20 text-blue-400' },
                deployed: { label: 'Deployed', className: 'bg-emerald-500/20 text-emerald-400' },
              }[tool.status] || { label: tool.status, className: 'bg-neutral-700/50 text-neutral-300' };

              return (
                <Card
                  key={tool.id}
                  className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] hover:border-[var(--hive-brand-primary)]/50 transition-all group"
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
                        onClick={() => router.push(`/${tool.id}/preview`)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[var(--hive-border-default)]"
                        onClick={() => router.push(`/${tool.id}`)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[var(--hive-border-default)]"
                        onClick={() => router.push(`/${tool.id}/deploy`)}
                      >
                        <Rocket className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/${tool.id}/analytics`)}
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

        {/* Quick Links */}
        <div className="pt-8 border-t border-[var(--hive-border-default)]">
          <h3 className="text-sm font-medium text-[var(--hive-text-secondary)] mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/create"
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
        </div>
      </div>
    </div>
  );
}
