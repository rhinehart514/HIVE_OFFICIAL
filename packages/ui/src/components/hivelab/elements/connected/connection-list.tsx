'use client';

/**
 * ConnectionList Element (Connected Tier)
 *
 * Display the current user's connections.
 * Requires: userId context for fetching connections.
 */

import * as React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface Connection {
  id: string;
  name: string;
  photoURL?: string;
  mutualConnections?: number;
}

export function ConnectionListElement({ config, data }: ElementProps) {
  const connections: Connection[] = data?.connections || [];
  const maxConnections = config.maxConnections || 10;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">My Connections</span>
          <Badge variant="outline" className="ml-auto text-xs">{connections.length}</Badge>
        </div>

        {connections.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No connections yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {connections.slice(0, maxConnections).map((conn, index) => (
              <div key={conn.id || index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                {conn.photoURL ? (
                  <img src={conn.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium">{conn.name?.[0] || '?'}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{conn.name || 'Unknown'}</div>
                  {config.showMutual && conn.mutualConnections && (
                    <div className="text-xs text-muted-foreground">
                      {conn.mutualConnections} mutual
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
