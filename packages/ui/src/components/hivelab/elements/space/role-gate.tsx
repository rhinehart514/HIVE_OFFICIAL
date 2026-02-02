'use client';

/**
 * RoleGate Element (Space Tier)
 *
 * Conditionally show/hide content based on member role.
 * Requires: spaceId context (leaders only).
 */

import * as React from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

export function RoleGateElement({ config, context, children }: ElementProps & { children?: React.ReactNode }) {
  const userRole = context?.isSpaceLeader ? 'leader' : 'member';
  const allowedRoles: string[] = config.allowedRoles || ['leader', 'admin', 'moderator'];
  const hasAccess = context?.isSpaceLeader
    ? allowedRoles.some(r => ['leader', 'admin', 'moderator'].includes(r))
    : allowedRoles.includes('member') || allowedRoles.includes('all');

  // Preview mode: show mock gated content in IDE
  const isPreviewMode = !context?.spaceId;
  if (isPreviewMode) {
    return (
      <div className="relative">
        <Badge variant="outline" className="absolute -top-2 -right-2 text-xs bg-background z-10">
          leader (preview)
        </Badge>
        {children || (
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrophyIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Gated Content</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This content is visible to: {allowedRoles.join(', ')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <TrophyIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>{config.fallbackMessage || 'This content is restricted.'}</p>
          <p className="text-xs mt-2">Required: {allowedRoles.join(' or ')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Badge variant="outline" className="absolute -top-2 -right-2 text-xs bg-background z-10">
        {userRole}
      </Badge>
      {children || (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Role-gated content goes here
          </CardContent>
        </Card>
      )}
    </div>
  );
}
