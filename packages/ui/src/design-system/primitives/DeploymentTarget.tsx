'use client';

/**
 * DeploymentTarget Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Visual space selector for tool deployment.
 * Grid container that renders DeploymentTargetCards.
 *
 * Card + helpers live in ./DeploymentTargetCard.tsx
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import {
  DeploymentTargetCard,
  DeploymentSpaceAvatar,
  DeploymentSurfaceSelector,
  deploymentTargetCardVariants,
  deploymentSurfacePillVariants,
  type DeploymentSurface,
  type DeploymentSpaceTarget,
} from './DeploymentTargetCard';

// Container variants
const deploymentTargetContainerVariants = cva(
  'grid gap-3',
  {
    variants: {
      columns: {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
      },
    },
    defaultVariants: {
      columns: 2,
    },
  }
);

export interface DeploymentTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  targets: DeploymentSpaceTarget[];
  value?: string;
  onValueChange?: (spaceId: string) => void;
  surface?: DeploymentSurface;
  onSurfaceChange?: (surface: DeploymentSurface) => void;
  showSurfaceSelector?: boolean;
  columns?: 2 | 3 | 4;
  title?: string;
  emptyMessage?: string;
  isDeploying?: boolean;
  deployingSpaceId?: string;
}

const DeploymentTarget = React.forwardRef<HTMLDivElement, DeploymentTargetProps>(
  (
    {
      className,
      targets,
      value,
      onValueChange,
      surface = 'sidebar',
      onSurfaceChange,
      showSurfaceSelector = false,
      columns = 2,
      title,
      emptyMessage = 'No spaces available',
      isDeploying = false,
      deployingSpaceId,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {(title || showSurfaceSelector) && (
          <div className="flex items-center justify-between gap-4">
            {title && <h3 className="text-sm font-medium text-white/60">{title}</h3>}
            {showSurfaceSelector && onSurfaceChange && (
              <DeploymentSurfaceSelector
                value={surface}
                onChange={onSurfaceChange}
                availableSurfaces={['sidebar']}
              />
            )}
          </div>
        )}

        {targets.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/40">{emptyMessage}</p>
            <p className="text-xs text-white/20 mt-1">
              Join a space as a leader to deploy tools
            </p>
          </div>
        ) : (
          <div className={cn(deploymentTargetContainerVariants({ columns }))}>
            {targets.map((target) => (
              <DeploymentTargetCard
                key={target.id}
                target={target}
                isSelected={value === target.id}
                isDeploying={isDeploying && deployingSpaceId === target.id}
                onClick={() => onValueChange?.(target.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

DeploymentTarget.displayName = 'DeploymentTarget';

export {
  DeploymentTarget,
  DeploymentTargetCard,
  DeploymentSpaceAvatar,
  DeploymentSurfaceSelector,
  deploymentTargetContainerVariants,
  deploymentTargetCardVariants,
  deploymentSurfacePillVariants,
  type DeploymentSurface,
  type DeploymentSpaceTarget,
};
