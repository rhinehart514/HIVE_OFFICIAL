'use client';

import * as React from 'react';
import { Wrench, Loader2, ExternalLink } from 'lucide-react';
import { Text, Button, toast } from '@hive/ui';
import type { SpaceTool } from './types';

interface SettingsToolsProps {
  spaceId: string;
  spaceName: string;
}

export function SettingsTools({ spaceId, spaceName }: SettingsToolsProps) {
  const [spaceTools, setSpaceTools] = React.useState<SpaceTool[]>([]);
  const [spaceToolsLoading, setSpaceToolsLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (loaded) return;
    setSpaceToolsLoading(true);
    fetch(`/api/spaces/${spaceId}/tools`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { tools: [] }))
      .then((data) => {
        const tools = data.data?.tools || data.tools || [];
        setSpaceTools(
          tools.map((t: { id: string; name: string; description?: string; emoji?: string }) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            icon: t.emoji,
          }))
        );
        setLoaded(true);
      })
      .catch(() => setSpaceTools([]))
      .finally(() => setSpaceToolsLoading(false));
  }, [spaceId, loaded]);

  const handleAddTool = () => {
    window.location.href = `/build/templates?spaceId=${spaceId}&spaceName=${encodeURIComponent(spaceName)}`;
  };

  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Apps
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Add apps to engage your members
      </Text>

      {spaceToolsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-white/50" />
        </div>
      ) : spaceTools.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-white/[0.06] border border-white/[0.06]">
          <Wrench className="w-10 h-10 mx-auto mb-4 text-white/50" />
          <Text weight="medium" className="text-white/50 mb-1">
            No apps deployed yet
          </Text>
          <Text size="sm" tone="muted" className="mb-6 max-w-sm mx-auto">
            Add polls, sign-ups, brackets, and more — give your members something to do.
          </Text>
          <div className="flex items-center justify-center gap-3">
            <Button variant="cta" size="default" onClick={handleAddTool}>
              <Wrench className="w-4 h-4 mr-2" />
              Add Creation
            </Button>
            <a
              href={`/lab?spaceId=${spaceId}&spaceName=${encodeURIComponent(spaceName)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Make something new
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Text size="sm" weight="medium" tone="muted">
              {spaceTools.length} {spaceTools.length === 1 ? 'creation' : 'creations'} deployed
            </Text>
            <Button variant="ghost" size="sm" onClick={handleAddTool}>
              <Wrench className="w-3 h-3 mr-1.5" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {spaceTools.map((tool) => (
              <div
                key={tool.id}
                className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center gap-3"
              >
                <span className="text-xl">{tool.icon || '🔧'}</span>
                <div className="flex-1 min-w-0">
                  <Text size="sm" weight="medium" className="truncate">
                    {tool.name}
                  </Text>
                  {tool.description && (
                    <Text size="xs" tone="muted" className="truncate">
                      {tool.description}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-white/[0.06]">
            <a
              href={`/lab?spaceId=${spaceId}&spaceName=${encodeURIComponent(spaceName)}`}
              className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/50 transition-colors"
            >
              Make custom apps in HiveLab
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
