'use client';

/**
 * /tools/[toolId]/runs — Tool Run History
 *
 * Archetype: Discovery
 * Purpose: View history of tool executions
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - Browse past runs of a tool
 * - View run inputs, outputs, and status
 * - Filter by date, status, user
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Heading, Card, Button, Badge } from '@hive/ui/design-system/primitives';
import { DiscoveryLayout, DiscoveryList, DiscoveryEmpty } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';

interface ToolRun {
  id: string;
  status: 'success' | 'failed' | 'pending';
  startedAt: string;
  completedAt?: string;
  userId: string;
  userName: string;
  inputSummary: string;
  outputSummary?: string;
}

export default function ToolRunsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const toolId = params?.toolId as string;

  const [runs, setRuns] = React.useState<ToolRun[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'success' | 'failed'>('all');
  const [toolName, setToolName] = React.useState('');

  // Fetch tool info and runs
  React.useEffect(() => {
    async function fetchData() {
      if (!toolId) return;

      try {
        // Fetch tool info
        const toolRes = await fetch(`/api/tools/${toolId}`);
        if (toolRes.ok) {
          const toolData = await toolRes.json();
          setToolName(toolData.name || 'Tool');
        }

        // Fetch runs
        const runsRes = await fetch(`/api/tools/${toolId}/runs`, {
          credentials: 'include',
        });
        if (runsRes.ok) {
          const data = await runsRes.json();
          setRuns(data.runs || []);
        }
      } catch {
        // Failed to fetch runs
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [toolId]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push(`/enter?from=/tools/${toolId}/runs`);
    return null;
  }

  // Filter runs
  const filteredRuns = filter === 'all'
    ? runs
    : runs.filter(run => run.status === filter);

  // Status icon helper
  const StatusIcon = ({ status }: { status: ToolRun['status'] }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  // Header
  const header = (
    <div className="flex items-center gap-3">
      <Link
        href={`/tools/${toolId}`}
        className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <Heading level={1} className="text-xl">
          Run History
        </Heading>
        <Text size="sm" tone="muted">
          {toolName}
        </Text>
      </div>
    </div>
  );

  return (
    <DiscoveryLayout header={header}>
      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Filter tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/40" />
              {(['all', 'success', 'failed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm capitalize transition-colors',
                    filter === f
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/50 hover:text-white/80'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push(`/tools/${toolId}/run`)}
            >
              <Play className="h-4 w-4 mr-1" />
              Run Now
            </Button>
          </div>

          {/* Empty state */}
          {filteredRuns.length === 0 && (
            <DiscoveryEmpty
              message={filter === 'all' ? 'No runs yet' : `No ${filter} runs`}
              action={
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/tools/${toolId}/run`)}
                >
                  Run this tool
                </Button>
              }
            />
          )}

          {/* Runs list */}
          <DiscoveryList gap="sm">
            {filteredRuns.map((run) => (
              <Card key={run.id} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <StatusIcon status={run.status} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Text weight="medium" size="sm">
                          {run.inputSummary}
                        </Text>
                        <Badge
                          variant={run.status === 'success' ? 'neutral' : run.status === 'failed' ? 'neutral' : 'gold'}
                          size="sm"
                        >
                          {run.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Text size="xs" tone="muted">
                          by {run.userName}
                        </Text>
                        <Text size="xs" tone="muted" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(run.startedAt).toLocaleString()}
                        </Text>
                      </div>
                      {run.outputSummary && (
                        <Text size="sm" tone="muted" className="mt-2 line-clamp-1">
                          → {run.outputSummary}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </DiscoveryList>

          {/* Stats summary */}
          {runs.length > 0 && (
            <Card className="p-4 bg-white/[0.02]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Text size="lg" weight="medium">{runs.length}</Text>
                  <Text size="xs" tone="muted">Total Runs</Text>
                </div>
                <div>
                  <Text size="lg" weight="medium" className="text-green-500">
                    {runs.filter(r => r.status === 'success').length}
                  </Text>
                  <Text size="xs" tone="muted">Successful</Text>
                </div>
                <div>
                  <Text size="lg" weight="medium" className="text-red-400">
                    {runs.filter(r => r.status === 'failed').length}
                  </Text>
                  <Text size="xs" tone="muted">Failed</Text>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </DiscoveryLayout>
  );
}
