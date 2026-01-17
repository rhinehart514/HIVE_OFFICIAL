'use client';

/**
 * SpacePicker Element (Connected Tier)
 *
 * Browse and select from campus spaces.
 * Requires: campusId context for space fetching.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface Space {
  id: string;
  name: string;
  memberCount?: number;
  category?: string;
}

export function SpacePickerElement({ config, data, onChange, context, onAction }: ElementProps) {
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (data?.spaces && Array.isArray(data.spaces)) {
      setSpaces(data.spaces);
      return;
    }

    const fetchSpaces = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (context?.campusId) {
          params.append('campusId', context.campusId);
        }
        if (config.category) {
          params.append('category', config.category);
        }

        const url = `/api/spaces/browse-v2${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          setSpaces(result.spaces || []);
        }
      } catch {
        setSpaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaces();
  }, [data?.spaces, context?.campusId, config.category]);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Select Space</span>
        </div>

        {isLoading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading spaces...</div>
        ) : spaces.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No spaces found</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {spaces.slice(0, 20).map((space) => (
              <button
                key={space.id}
                onClick={() => {
                  setSelectedSpace(space.id);
                  onChange?.({ selectedSpace: space, spaceId: space.id });
                  onAction?.('select', { selectedSpace: space, spaceId: space.id });
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSpace === space.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{space.name}</span>
                  {config.showMemberCount && space.memberCount && (
                    <Badge variant="outline" className="text-xs">
                      {space.memberCount} members
                    </Badge>
                  )}
                </div>
                {space.category && (
                  <div className="text-xs text-muted-foreground mt-1">{space.category}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
